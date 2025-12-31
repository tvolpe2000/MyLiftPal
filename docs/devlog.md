# Development Log

Chronological notes on development progress, sessions, and learnings.

---

## 2025-12-31

### Session: Exercise Database Expansion, Images, and AI Voice Phase 1.7

**Major updates deployed:**

1. **Exercise Database (5.1.4) - DEPLOYED**
   - Imported 583 exercises from Wger API (https://wger.de/api/v2/)
   - Total exercises: 81 → 664 (after deduplication)
   - Created muscle mapping (Wger 15 → MyLiftPal 16 muscle groups)
   - Created equipment mapping (Wger 11 → MyLiftPal 8 equipment types)
   - Scripts: `scripts/import-wger-exercises.ts`

2. **Exercise & Muscle Images (5.1.1) - DEPLOYED**
   - 194 exercise photos imported from Wger
   - 16 muscle group SVG diagrams (overlays for body visualization)
   - Added `is_front` flag to muscle_groups for front/back body positioning
   - Base body SVG constants in `$lib/constants/images.ts`
   - Migration: `supabase/migrations/006_exercise_images.sql`
   - 40 video URLs also imported

3. **AI Voice Phase 1.7 (4.3.1) - Ready for Deploy**
   - Fixed training block context hydration bug (race condition)
   - Added `logMultipleSets` tool for batch logging ("3 sets of 10 at 185")
   - Implemented all tool executors:
     - Block tools: addSetsToExercise, removeSetsFromExercise, changeRepRange, modifyBlockExercise
     - Schedule tools: swapWorkoutDays, skipDay, rescheduleDay
     - Query tools: getTodaysWorkout, getWeeklyVolume, getPersonalRecords, getStats, getBlockProgress
   - New global command API endpoint: `/api/ai/openai/global`

4. **Bug Fixes - Ready for Deploy**
   - 4.1.1: Screen lock page reload fix (Page Visibility API + IndexedDB)
   - 4.1.2: Accessibility fixes for ARIA attributes

**Documentation updates:**
- Added `docs/prioritization.csv` with task tracking and deployment states
- Updated CLAUDE.md with deployment state definitions
- State workflow: Open → In Progress → Code Complete → In Testing → Ready for Deploy → Deployed/Done

**Scripts created:**
- `scripts/import-wger-exercises.ts` - Import exercises from Wger
- `scripts/import-exercise-images.ts` - Import exercise images
- `scripts/run-migration-006.ts` - Populate muscle SVG URLs
- `scripts/find-duplicates.ts` - Find/remove duplicate exercises

---

## 2025-12-30

### Session: PWA Offline Reliability Improvements (RP Hypertrophy-level persistence)

**Problem:**
App wouldn't load at the gym with spotty internet, even though user had previously visited the app. The loading screen would hang indefinitely waiting for network. Comparison to RP Hypertrophy app showed they have much better offline persistence.

**Root cause:**
1. Auth initialization called `supabase.auth.getSession()` without any timeout - would hang forever
2. Layout blocked rendering until auth was initialized
3. Service worker used `NetworkFirst` for navigation - waits for network before cache
4. No prompt to install PWA (installed PWAs have better persistence)

**Fixes implemented (true offline-first architecture):**

1. **StaleWhileRevalidate for navigation** (`vite.config.ts`):
   - Changed from `NetworkFirst` to `StaleWhileRevalidate`
   - Page ALWAYS loads from cache first, network updates in background
   - This is the key to "never shows loading" behavior like RP Hypertrophy
   - Enabled `skipWaiting: true` and `clientsClaim: true` for immediate control
   - Added `navigationPreload: true` for faster network fetches

2. **Non-blocking layout** (`src/routes/+layout.svelte`):
   - Layout now renders immediately if user has cached session
   - Only shows "Loading..." for first-time visitors with no cache
   - Uses new `auth.hasCachedSession` flag to detect cached state

3. **Synchronous cache check** (`src/lib/stores/auth.svelte.ts`):
   - Profile loaded from localStorage at store creation (synchronous)
   - `hasCachedSession` flag set immediately based on localStorage state
   - `isAuthenticated` now returns true if we have cached profile (for offline)
   - Auth initialization timeout (5s) prevents hanging

4. **PWA install prompt** (`src/lib/components/pwa/InstallPrompt.svelte`):
   - Prompts users to "Add to Home Screen" for better persistence
   - Installed PWAs get dedicated cache, more persistent service worker
   - Shows after first visit, respects 7-day dismiss duration
   - Detects if already installed (standalone mode)

**Why "Add to Home Screen" matters:**
- Standalone mode runs like native app, not in browser tab
- Dedicated cache not shared with browser (won't be evicted)
- More persistent service worker
- All assets precached at install time

**Files modified:**
- `vite.config.ts` - True offline-first caching strategy
- `src/lib/stores/auth.svelte.ts` - Sync cache loading, hasCachedSession flag
- `src/routes/+layout.svelte` - Non-blocking render with InstallPrompt

**Files created:**
- `src/lib/components/pwa/InstallPrompt.svelte` - PWA install banner

---

## 2025-12-29

### Session: AI Voice Assistant Implementation (Phase 1)

**What was done:**
- Implemented provider-agnostic AI voice logging architecture:
  - `AIProvider` interface that works with Claude, OpenAI, Gemini, or self-hosted models
  - Provider manager for registering and switching between providers
  - First provider: OpenAI (GPT-4o-mini for cost efficiency)
- Created AI types and tool definitions:
  - TypeScript interfaces for WorkoutContext, ToolCall, AI providers
  - Zod schemas for parameter validation (logSet, skipExercise, swapExercise, etc.)
  - OpenAI function calling tool definitions
  - System prompt optimized for workout command parsing
- Built speech recognition layer:
  - Web Speech API wrapper for free browser-native recognition
  - Handles microphone permissions, interim results, errors
- Created voice UI components:
  - `VoiceFAB.svelte` - Floating action button on workout screen
  - `VoiceModal.svelte` - Full voice input modal with listening/processing states
  - Text input fallback for browsers without speech support
- Implemented tool executor:
  - Executes parsed tool calls against workout store
  - Handles logSet, skipExercise, swapExercise, addExercise, completeWorkout
  - Response templates for user feedback
- Wired up to workout screen:
  - Voice FAB appears on `/blocks/[id]` workout tracking page
  - Hidden in edit mode (past sessions)
  - Full flow: tap FAB → speak → AI parses → tool executes → feedback

**Technical decisions:**
- OpenAI GPT-4o-mini chosen for best cost/performance ratio ($0.15/1K requests)
- Dynamic env imports (`$env/dynamic/private`) to allow builds without API key
- Tool executor uses existing workout store methods (quickLogSet, swapExercise, etc.)
- Web Speech API first (free), with Whisper API as future upgrade path
- Lazy OpenAI client initialization to handle missing API keys gracefully

**Architecture (future-proofed):**
```
User Speech → Web Speech API → Transcript
    ↓
Transcript + Context → AI Provider (OpenAI/Claude/Gemini/Local)
    ↓
Tool Call → Executor → Workout Store Actions
    ↓
Feedback Message → User
```

**Files created:**
- `src/lib/ai/types.ts` - AI type definitions
- `src/lib/ai/providerManager.ts` - Provider registry and switching
- `src/lib/ai/context.ts` - Workout context builder
- `src/lib/ai/assistant.ts` - Main voice assistant entry point
- `src/lib/ai/providers/openai.ts` - OpenAI adapter
- `src/lib/ai/tools/definitions.ts` - Tool schemas and system prompt
- `src/lib/ai/tools/executor.ts` - Tool execution logic
- `src/lib/ai/speech/webSpeech.ts` - Browser speech recognition wrapper
- `src/lib/components/ai/VoiceFAB.svelte` - Voice input FAB
- `src/lib/components/ai/VoiceModal.svelte` - Voice input modal
- `src/routes/api/ai/openai/+server.ts` - OpenAI API endpoint
- `src/routes/api/ai/openai/status/+server.ts` - API status check

**Files modified:**
- `src/routes/blocks/[id]/+page.svelte` - Integrated voice components
- `package.json` - Added openai and zod dependencies

**Environment setup required:**
```env
OPENAI_API_KEY=sk-... # Add to .env for voice features
```

**Next steps (Phase 2):**
- Add Claude and Gemini adapters
- Implement undo functionality
- Add data logging for future fine-tuning
- Provider selection in Settings

---

## 2025-12-28

### Session: Theme Expansion & Contrast Fix

**What was done:**
- Fixed volume pill text contrast issue on all themes:
  - Root cause: Components used `getVolumeBarColor()` (background only) instead of `getVolumeColorClass()` (background + text)
  - `--color-text-muted` (gray) had poor contrast against tinted backgrounds like `bg-red-500/20`
  - Updated WorkoutHeader.svelte and blocks/+page.svelte to use `getVolumeColorClass()`
- Added 3 new themes (8 → 11 total):
  - **Amber**: Gold accent (#f59e0b) for achievement/motivation vibes
  - **Violet**: Purple accent (#8b5cf6) fills gap between Indigo and Pink
  - **Zinc**: True neutral gray (#a1a1aa) without blue tint (unlike Slate)

**Color spectrum now covered:**
- Cool: Emerald, Blue, Cyan, Indigo, Violet
- Warm-Cool: Pink
- Warm: Red, Orange, Amber
- Neutral: Slate (blue-tinted), Zinc (true gray)

**Files modified:**
- `src/lib/stores/theme.svelte.ts` - Added amber, violet, zinc themes
- `src/lib/components/workout/WorkoutHeader.svelte` - Fixed contrast
- `src/routes/blocks/+page.svelte` - Fixed contrast

---

### Session: Fill to Optimal Algorithm Improvements

**What was done:**
- Fixed Fill to Optimal requiring multiple clicks to reach MEV for all muscles
- Algorithm now prioritizes increasing sets on existing exercises first:
  - Finds exercises that target the under-volume muscle
  - Increases sets up to +2 per exercise (max 5 total sets)
  - Only adds new exercises when existing ones can't cover the gap
- Modal now adds second exercise when a muscle needs more than 4 sets
- UI shows both set increases (green TrendingUp icon) and new exercises (accent Plus icon)
- Summary section shows counts of set increases vs new exercises

**Root cause of original issue:**
- Modal only added ONE exercise capped at 4 sets
- If muscle needed 6 sets, only 4 were added, leaving 2 sets short
- Required second Fill to Optimal click to close the gap

**Technical changes:**
- Added `SetIncrease` interface to track set increases on existing exercises
- Updated `FillSuggestion` to include `setIncreases` array and `newExerciseSets` count
- Algorithm two-step approach: 1) increase existing, 2) add new if needed
- `handleFillConfirm` now uses `wizard.updateExerciseSlot()` to modify existing slots
- Modal adds second exercise when `newExerciseSets > 4`

**Files modified:**
- `src/lib/utils/fillToOptimal.ts` - Algorithm refactor with set increases priority
- `src/lib/components/wizard/FillToOptimalModal.svelte` - UI and logic for set increases + second exercise
- `src/lib/components/wizard/StepAddExercises.svelte` - Updated callback to apply set increases

---

### Session: Home Page Redesign

**What was done:**
- Removed redundant Quick Actions grid (View Block, Exercises cards already in bottom nav)
- Added target muscle chips to Today's Workout card (shows muscles for current day)
- Added Quick Stats Strip with 4 metrics:
  - This Week: Workouts completed in past 7 days
  - This Month: Workouts completed this calendar month
  - Lbs Moved: Total weight × reps for all sets this week
  - Total: All-time workout count
- Added This Week's Volume section showing top 6 muscles trained with set counts
- Added Personal Records section with top 3 heaviest lifts (gold/silver/bronze badges)
- Added "What you'll track" preview for new users without active block
- Replaced Day Streak (discouraging when broken) with This Month (positive growth metric)
- Replaced Block % (confusing at week 1) with Total workouts (always growing)

**Technical decisions:**
- Weight formatting: Uses `k` suffix for 1000+ (e.g., "24.5k lbs")
- Volume query joins logged_sets with exercises to get primary_muscle
- PRs query groups by exercise name and keeps max weight per exercise
- Stats queries run in parallel with Promise.all for performance

**Files modified:**
- `src/routes/+page.svelte` - Complete home page redesign

---

### Session: Application Stability & Bug Fixes

**What was done:**
- Fixed blank page issue caused by Supabase token refresh:
  - Auth store now handles `TOKEN_REFRESHED` event separately
  - Updates session/user without triggering profile refetch
  - Prevents unnecessary database calls that could cause errors
- Fixed Fill to Optimal not making all muscles green:
  - Root cause: Different formulas for secondary muscle volume calculation
  - `fillToOptimal.ts` used extra `0.5` multiplier that `volume.ts` didn't use
  - Unified formula: `indirect_sets = sets × secondary.weight` (no extra multiplier)
- Added application stability infrastructure:
  - Created `src/hooks.client.ts` for global error handling
  - Catches unhandled promise rejections and global errors
  - Monitors visibility changes and navigation events
  - Created `src/routes/+error.svelte` error boundary page
  - Changed PWA from `autoUpdate` to `prompt` mode to prevent mid-session reloads

**Bug fixes summary:**
| Issue | Cause | Fix |
|-------|-------|-----|
| Blank pages on token refresh | Auth handler refetched profile on every event | Handle `TOKEN_REFRESHED` separately |
| Fill to Optimal muscles still red | Extra `0.5` multiplier in fillToOptimal.ts | Remove multiplier to match volume.ts |
| PWA causing page reloads | `autoUpdate` mode | Switch to `prompt` mode |

**Files created:**
- `src/hooks.client.ts` - Global error and navigation monitoring
- `src/routes/+error.svelte` - User-friendly error page

**Files modified:**
- `src/lib/stores/auth.svelte.ts` - Token refresh handling
- `src/lib/utils/fillToOptimal.ts` - Removed SECONDARY_MUSCLE_WEIGHT constant
- `vite.config.ts` - PWA configuration changes

**Technical notes:**
- Volume calculation formula must be identical in both `volume.ts` and `fillToOptimal.ts`
- The `secondary.weight` value (0.3-0.5) already accounts for reduced contribution
- Token refresh happens automatically every hour; must not cause UI disruption

---

### Session: Goal-Based Training & Fill to Optimal

**What was done:**
- Implemented lifter level system:
  - Added `lifter_level` column to profiles (beginner, intermediate, advanced)
  - Created onboarding modal for new/existing users without a level
  - Added level selector to Settings page
- Implemented training goals:
  - Added `goal` column to training_blocks (hypertrophy, strength, maintenance, power, endurance)
  - Goal selector in wizard Step 1 with emoji icons
  - Beginner + Power auto-switches to Strength programming
- Created volume programs data (`src/lib/data/volumePrograms.ts`):
  - Research-backed volume calculations from training science literature
  - MEV/MAV/MRV values by goal and level
  - Helper functions for volume calculations
- Implemented Fill to Optimal feature:
  - Initially per-day, then refactored to **block-level** analysis
  - Analyzes weekly volume across ALL days to prevent over-volume with splits like PPL x2
  - Button in Weekly Volume section header (only shows when muscles below MEV)
  - Modal shows which day each exercise will be added to
  - Uses database MEV values to match volume bar thresholds

**Bug fixes:**
- Fixed onboarding modal not closing (migration hadn't been run)
- Fixed Fill to Optimal using different MEV values than volume bars
  - Was using hardcoded values from volumePrograms.ts
  - Now uses database MEV values from muscle_groups table

**Technical decisions:**
- Block-level Fill to Optimal prevents over-volume with 2x/week splits
- Database MEV values used (not hardcoded) for consistency with volume bars
- Onboarding modal auto-shows for users without lifter_level
- Level stored on profile, goal stored on training_block

**Files created:**
- `src/lib/data/volumePrograms.ts` - Volume program data and helpers
- `src/lib/components/onboarding/LifterLevelModal.svelte` - Onboarding modal
- `src/lib/components/wizard/FillToOptimalModal.svelte` - Fill suggestions modal
- `src/lib/utils/fillToOptimal.ts` - Fill algorithm
- `supabase/migrations/005_lifter_level_and_goals.sql` - Database migration
- `supabase/scripts/005_lifter_level_and_goals.sql` - Migration script

**Files modified:**
- `src/lib/types/database.ts` - Added lifter_level and goal types
- `src/lib/types/wizard.ts` - Added goal to WizardState
- `src/lib/stores/wizardStore.svelte.ts` - Added goal state and setter
- `src/lib/components/wizard/StepBasicInfo.svelte` - Goal selector
- `src/lib/components/wizard/StepAddExercises.svelte` - Fill to Optimal button
- `src/lib/components/wizard/StepReview.svelte` - Goal display
- `src/routes/+page.svelte` - Onboarding modal integration
- `src/routes/settings/+page.svelte` - Lifter level selector

---

### Session: User Feedback System

**What was done:**
- Created feedback page (`/feedback`) with form for bug reports and feature requests
- Support for attaching up to 3 screenshots
- Feedback types: Bug Report, Feature Request, General
- Stores feedback in `user_feedback` table with Supabase Storage for images

**Files created:**
- `src/routes/feedback/+page.svelte` - Feedback form page
- `supabase/migrations/004_feedback.sql` - Feedback table and storage

---

## 2025-12-27

### Session: In-App Changelog & Roadmap

**What was done:**
- Created database tables for changelog system:
  - `app_releases` - Version history with highlights and changes
  - `app_roadmap` - Upcoming features with status badges
  - Added `last_seen_version` to profiles for notification tracking
- Built changelog store (`changelogStore.svelte.ts`):
  - Fetches releases and roadmap from Supabase
  - Compares versions to determine if banner should show
  - Auto-marks version as seen when visiting changelog page
- Created UpdateBanner component:
  - "What's New" notification with sparkle icon
  - Links to /changelog page
  - Auto-dismisses on page visit (not manual close)
- Built /changelog page with tabbed interface:
  - Tab 1: Recent Updates - Version cards with highlights
  - Tab 2: Coming Soon - Roadmap items with status badges
  - Status colors: tracked (gray), planned (blue), in_progress (yellow)
- Added SQL script for updating roadmap items

**Technical decisions:**
- Database tables over static JSON for easier updates without deploys
- Type assertions used for new Supabase tables (not in generated types yet)
- Auto-dismiss on page visit instead of explicit "mark as read" button
- Only user-facing features in roadmap (no security patches, tech debt)

**Files created:**
- `supabase/migrations/003_changelog.sql` - Tables and seed data
- `src/lib/types/changelog.ts` - TypeScript types
- `src/lib/stores/changelogStore.svelte.ts` - State management
- `src/lib/components/ui/UpdateBanner.svelte` - Notification banner
- `src/routes/changelog/+page.svelte` - Changelog page
- `supabase/scripts/update_roadmap.sql` - Roadmap update script

**Files modified:**
- `src/routes/+page.svelte` - Added UpdateBanner to home page
- `src/lib/types/index.ts` - Re-export changelog types

---

### Session: Delete Training Blocks Fix

**What was done:**
- Fixed delete training blocks feature based on user feedback:
  - Replaced browser `confirm()` with proper ConfirmModal component
  - Moved trash icon from middle-right to top-right of card
  - Removed redundant ChevronRight icon (card click navigates)
  - Card click area excludes delete button (no accidental deletes)
- Created reusable ConfirmModal component:
  - Supports danger/warning/default variants
  - Loading state for async operations
  - Accessible with proper focus management

**Technical decisions:**
- ConfirmModal is generic and reusable for future delete operations
- Absolute positioning for trash icon with z-index for click priority
- Card uses `pr-14` padding-right to prevent text overlap with button

**Files created:**
- `src/lib/components/ui/ConfirmModal.svelte` - Reusable confirmation modal

**Files modified:**
- `src/routes/blocks/+page.svelte` - Delete button positioning, modal integration

---

### Session: AI Voice Assistant Design

**What was done:**
- Designed comprehensive AI voice assistant architecture
- Documented tool definitions for LLM function calling:
  - `logSet` - Log weight, reps, RIR with voice
  - `swapExercise` - Switch to different exercise
  - `skipExercise` - Skip current exercise
  - `completeWorkout` - Finish session
  - `addExercise` - Add exercise to workout
  - `undoLast` - Undo previous action
  - `clarify` - Ask clarifying questions
- Defined voice recognition approach:
  - MVP: Browser Web Speech API (free)
  - Upgrade: Whisper API for better accuracy
- Designed user flow with FAB entry point
- Created context schema for LLM requests

**Technical decisions:**
- Tool Use / Function Calling architecture (not custom agents or MCP)
- Full capability parity with manual actions
- Real-time logging (no batch confirmation)
- Zod validation for LLM responses before mutations

**Files created:**
- `docs/AI_ASSISTANT.md` - Full architecture and tool definitions

**Files modified:**
- `docs/ROADMAP.md` - Added AI assistant details, updated Phase 4

---

### Session: Documentation Updates

**What was done:**
- Updated CLAUDE.md with:
  - New components (ConfirmModal, UpdateBanner, ScrollWheelPicker)
  - New stores (changelogStore, offlineStore, workoutSettings)
  - New routes (/changelog)
  - New migrations (003_changelog.sql)
  - Documentation references (AI_ASSISTANT.md, SECURITY.md)
  - Changelog system description
- Rewrote README.md with proper project description
- Updated devlog with today's sessions

**Files modified:**
- `CLAUDE.md` - Project structure, architecture notes, documentation workflow
- `README.md` - Complete rewrite from SvelteKit default
- `docs/devlog.md` - Today's sessions

---

## 2025-12-26

### Session: PWA Offline Mode (Phase 3)

**What was done:**
- Implemented full PWA infrastructure for offline support:
  - Service worker with Workbox caching strategies
  - Web app manifest with icons
  - IndexedDB for offline data storage
- Created offline store (`src/lib/stores/offlineStore.svelte.ts`):
  - Track online/offline status
  - Manage downloaded workout days
  - Queue pending sets for sync
  - Auto-sync when coming back online
- Created IndexedDB wrapper (`src/lib/db/indexedDB.ts`):
  - Store workout days with exercises and previous sets
  - Store pending sets queue
  - Store offline sessions
- Created UI components:
  - `DownloadButton.svelte` - Download workout for offline use
  - `SyncStatus.svelte` - Show pending sets and sync status
  - `OfflineIndicator.svelte` - Global offline banner
- Modified workoutStore to queue sets when offline
- Added DownloadButton to home page "Today's Workout" card
- Added SyncStatus to workout tracking page
- Added OfflineIndicator to AppShell

**Technical decisions:**
- Used `@vite-pwa/sveltekit` for PWA integration
- Used `idb` library for IndexedDB wrapper
- NetworkFirst strategy for Supabase API calls
- CacheFirst for static assets
- Optimistic UI updates when offline (sets logged locally, synced later)
- Auto-sync triggered on 'online' event

**Files created:**
- `src/lib/db/indexedDB.ts` - IndexedDB wrapper
- `src/lib/stores/offlineStore.svelte.ts` - Offline state management
- `static/manifest.webmanifest` - PWA manifest
- `static/icon-192.svg`, `static/icon-512.svg` - Placeholder icons
- `src/lib/components/offline/DownloadButton.svelte`
- `src/lib/components/offline/SyncStatus.svelte`
- `src/lib/components/offline/OfflineIndicator.svelte`

**Files modified:**
- `vite.config.ts` - Added SvelteKitPWA plugin
- `src/app.html` - Added PWA meta tags
- `src/lib/stores/workoutStore.svelte.ts` - Offline set queueing
- `src/routes/+page.svelte` - DownloadButton on home page
- `src/routes/blocks/[id]/+page.svelte` - SyncStatus
- `src/lib/components/AppShell.svelte` - OfflineIndicator
- `src/routes/+layout.svelte` - Offline store init + event listeners

**Not implemented (moved to Phase 4):**
- PWA installation prompt - Users can install via browser menu (Chrome "Install", Safari "Add to Home Screen"), but there's no custom in-app "Install App" button. To implement:
  - Listen for `beforeinstallprompt` event on window
  - Store the event and show custom install button when available
  - Call `event.prompt()` when user clicks install button
  - Hide button after installation or if not supported
  - Consider adding to Settings page or as a banner

**Notes:**
- SVG icons are placeholders - replace with proper 192x192 and 512x512 PNG icons for production

---

### Session: Time Estimation Feature (Phase 3)

**What was done:**
- Created time estimation utility (`src/lib/utils/time.ts`):
  - Types: `TimeStatus`, `ExerciseSlotForTime`, `DayTimeEstimate`
  - Functions: `calculateDayTime()`, `getTimeStatus()`, `getTimeColorClass()`, `getTimeBarColor()`, `formatDuration()`, `getTimeRange()`
  - Uses exercise `work_seconds` and `default_rest_seconds` for accurate estimates
  - Accounts for set progression across weeks (week 1 vs final week)
- Added time estimation to wizard Step 3 (StepAddExercises.svelte):
  - Time badge on each day header showing estimated duration
  - Collapsible "Estimated Time" summary section
  - Per-day progress bars with status colors (under/on target/over budget)
  - Shows week 1 to final week time range
- Added time estimation to training blocks list:
  - Clock icon with estimated total minutes per week
  - Calculates based on current week's set count

**Technical decisions:**
- Time calculation: `(sets * work_seconds) + ((sets-1) * rest_seconds) + (exercise_count * 30s transition)`
- Status thresholds: Under (<-10%), On Target (±10%), Over (+10-25%), Way Over (>+25%)
- Colors: Blue (under), Green (on target), Yellow (over), Red (way over)

**Files created:**
- `src/lib/utils/time.ts` - Time calculation utility

**Files modified:**
- `src/lib/components/wizard/StepAddExercises.svelte` - Time summary section
- `src/routes/blocks/+page.svelte` - Time display on block cards

---

### Session: ExerciseCard Muscle Display

**What was done:**
- Changed ExerciseCard to show primary/secondary muscles instead of equipment type
- Primary muscle: accent color, bold styling for emphasis
- Secondary muscles: muted color, up to 3 displayed
- Shows "+N" indicator when more than 3 secondary muscles
- Added `formatMuscle()` helper to format database names (e.g., "front_delts" → "Front Delts")

**Files modified:**
- `src/lib/components/workout/ExerciseCard.svelte` - Muscle tags instead of equipment

---

### Session: Scroll Wheel Picker & Workout Settings

**What was done:**
- Fixed RIR bug in quick-log (was hardcoded to null)
- Created iOS-style scroll wheel picker:
  - CSS scroll-snap for native momentum scrolling
  - Configurable increment for weight (2.5, 5, 10 lbs)
  - Fade overlays and selection indicator
  - Works for both weight and reps
- Added global workout settings:
  - Weight input style (scroll wheel vs buttons)
  - Rep input style (quick-select vs scroll wheel)
  - Default weight increment
  - Settings persisted to localStorage
- Integrated scroll wheel into SetInputModal for weight and reps

**Technical decisions:**
- Settings in localStorage (not DB) for speed and simplicity
- ScrollWheelPicker uses scroll-snap-type: y mandatory
- Increment toggle in-modal for quick switching during workout
- Both scroll and button modes support configurable increment
- Reps scroll wheel uses step=1, range 1-30

**Files created:**
- `src/lib/components/ui/ScrollWheelPicker.svelte` - Reusable scroll wheel input
- `src/lib/stores/workoutSettings.svelte.ts` - Workout preferences state

**Files modified:**
- `src/lib/components/workout/SetRow.svelte` - Fixed RIR bug in quickLogData
- `src/lib/components/workout/SetInputModal.svelte` - Scroll wheel for weight & reps
- `src/routes/settings/+page.svelte` - Workout Input settings section
- `src/routes/+layout.svelte` - Initialize workout settings

---

## 2025-12-25

### Session: Phase 2 & 2.5 Completion - Intelligence & UX

**What was done:**
- Implemented progression recommendations system:
  - Calculates suggested weight/reps based on previous session performance
  - RIR-based logic: RIR 3+ at top of rep range → increase weight
  - Shows suggestion banner in SetInputModal with "Apply" button
  - Auto-fills inputs with recommended values
- Improved set logging UX (Phase 2.5):
  - Weight auto-carries from first set to subsequent sets in same session
  - "Repeat Last Set" button to apply same weight/reps/RIR as previous set
  - Quick-log button directly on SetRow (Zap icon) for one-tap logging
  - Reduced taps needed to log a set

**Technical decisions:**
- Progression logic in `src/lib/utils/progression.ts`
- Quick-log uses new `quickLogSet()` method in workoutStore
- Previous set in session tracked separately from previous session data
- SetRow changed from `<button>` to `<div>` to allow nested quick-log button

**Files created:**
- `src/lib/utils/progression.ts` - Progression calculation logic

**Files modified:**
- `src/lib/components/workout/SetInputModal.svelte` - Suggestion banner, repeat button, auto-carry
- `src/lib/components/workout/SetRow.svelte` - Quick-log button, restructured as div
- `src/lib/components/workout/ExerciseCard.svelte` - Pass rep range min/max
- `src/lib/stores/workoutStore.svelte.ts` - Added quickLogSet() method
- `docs/ROADMAP.md` - Added Phase 2.5, marked phases complete

---

### Session: Previous Session Display

**What was done:**
- Added previous session data display in workout tracking
- Each set row now shows what you did last time (weight × reps @RIR)
- Uses History icon with "Last: 135 × 10 @2" format
- Only shows for sets that have previous data

**Technical decisions:**
- Added `PreviousSetData` interface to workout types
- Extended `SetState` to include `previous` field
- Store fetches full previous set data (weight, reps, RIR) not just weight
- Previous data keyed by `exercise_slot_id-set_number`

**Files modified:**
- `src/lib/types/workout.ts` - Added PreviousSetData interface
- `src/lib/stores/workoutStore.svelte.ts` - Fetch full previous set data
- `src/lib/components/workout/SetRow.svelte` - Display previous session

**Notes:**
- Testing limited due to lack of historical workout data
- Added "Pre-Launch Requirements" section to roadmap including test data seeding
- Need demo account with workout history for proper feature testing

---

### Session: Wizard Enhancements - Volume, Templates & Auto-Fill

**What was done:**
- Added real-time volume display to wizard Step 3 (Add Exercises):
  - Collapsible weekly volume summary showing sets per muscle group
  - Color-coded status (Low/Good/High) with progress bars
  - Summary badges showing counts of good/low/high volume muscles
  - Updates dynamically as exercises are added/removed
- Implemented program templates system:
  - 6 pre-built templates: PPL (3-day), PPL x2 (6-day), Upper/Lower, Full Body, Bro Split, Hybrid
  - Templates include days, target muscles, and optional exercises
  - "Use a Template" button in Step 1 with modal picker
  - Toggle to include/exclude pre-filled exercises
- Added smart auto-fill feature:
  - Wand icon per day showing AI-style suggestions
  - Suggestions based on target muscles and volume gaps
  - Prioritizes undertrained muscles and compound exercises
  - "Add All" button to quick-fill with 5 exercises
  - Click individual suggestions to add one at a time

**Technical decisions:**
- Templates stored in-memory (`src/lib/data/templates.ts`) - no database changes needed
- Template exercises matched by name to database entries
- Smart suggestions use equipment priority (barbell > dumbbell > cable > machine)
- Volume calculations reuse existing `calculateWeeklyVolume()` utility

**Files created:**
- `src/lib/data/templates.ts` - 6 pre-built workout templates
- `src/lib/components/wizard/TemplatePicker.svelte` - Template selection modal

**Files modified:**
- `src/lib/components/wizard/StepAddExercises.svelte` - Volume display + auto-fill
- `src/lib/components/wizard/StepBasicInfo.svelte` - Template picker integration
- `src/lib/stores/wizardStore.svelte.ts` - Added applyTemplate() method

**Bug fix:**
- Template selection now auto-fills block name with template name
- Added green success message when template is applied
- Clear UX showing user needs to continue through wizard steps

---

### Session: Volume Tracking Feature

**What was done:**
- Implemented volume tracking to show weekly sets per muscle group:
  - Color-coded status (Red=Low, Green=Good, Yellow=High) for intuitive understanding
  - Shows set counts per muscle group
  - Uses research-based volume landmarks (MV, MEV, MAV, MRV) from database
  - Calculates direct sets (primary muscle) + indirect sets (secondary × weight)
- Added volume display to training blocks list:
  - Shows top 5 muscles with set counts as colored pills
  - Summary badges showing count of "good" and "low" volume muscles
  - Fetches exercise slots with nested exercise data for calculation
- Added volume display to workout tracking header:
  - Collapsible "Today's Volume" section
  - Compact pills when collapsed, full grid when expanded
  - Color legend (Low/Good/High) for quick reference

**Technical decisions:**
- Volume calculation utility in `src/lib/utils/volume.ts`
- VolumeBar and VolumeSummary components for reusable display
- Volume calculated based on current week's set count (accounts for progression)
- Designed for all fitness levels - uses simple "Low/Good/High" labels instead of jargon

**Files created:**
- `src/lib/utils/volume.ts` - Volume calculation and status utilities
- `src/lib/components/volume/VolumeBar.svelte` - Individual muscle volume bar
- `src/lib/components/volume/VolumeSummary.svelte` - Grid of volume bars

**Files modified:**
- `src/lib/components/workout/WorkoutHeader.svelte` - Added collapsible volume summary
- `src/routes/blocks/+page.svelte` - Added volume display per training block

---

### Session: Home Page & Auth Redirect Fix

**What was done:**
- Implemented full home page with dynamic content:
  - Today's Workout card showing current day from active training block
  - "Start Workout" button linking to workout tracking
  - Week/day progress indicators
  - Quick Actions grid (View Block, Exercises)
  - Recent Activity section showing last 5 completed workouts
  - No Active Block state with create button
  - Loading skeleton state
- Fixed email verification redirect issue:
  - Added `emailRedirectTo` option in signUp function
  - Uses `window.location.origin` for environment-aware redirects
  - Configured Supabase dashboard with production + localhost URLs

**Technical decisions:**
- Home page fetches active block with `status: 'active'` filter
- Recent sessions query uses Supabase relation syntax for workout_day and training_block names
- Relative date formatting (Today, Yesterday, X days ago)

**Files modified:**
- `src/routes/+page.svelte` - Full home page implementation
- `src/lib/stores/auth.svelte.ts` - Added emailRedirectTo for signUp

---

### Session: Workout Tracking Implementation

**What was done:**
- Implemented workout tracking when user clicks a training block:
  - Loads current workout day with exercises
  - Creates or resumes workout session
  - Displays exercises with expandable set rows
  - Set input modal for logging weight/reps/RIR
  - Saves sets to database in real-time
  - Complete workout button advances day/week
- Fixed database column name mismatch (`session_id` not `workout_session_id`)

**Technical decisions:**
- Workout state managed in `workoutStore.svelte.ts`
- Sets calculated per week using `calculateSetsForWeek()` from wizard types
- Previous session weights used as targets for current session
- Session auto-creates on page load if not exists

**Files created:**
- `src/routes/blocks/[id]/+page.svelte` - Workout tracking page
- `src/lib/stores/workoutStore.svelte.ts` - Workout session state
- `src/lib/types/workout.ts` - Workout-specific types
- `src/lib/components/workout/WorkoutHeader.svelte`
- `src/lib/components/workout/ExerciseCard.svelte`
- `src/lib/components/workout/SetRow.svelte`
- `src/lib/components/workout/SetInputModal.svelte`

**Issues encountered:**
- Supabase schema had `session_id` not `workout_session_id` - updated types and store

---

### Session: Training Block Wizard & Bug Fixes

**What was done:**
- Implemented 4-step training block creation wizard (`/blocks/new`):
  - Step 1: Basic info (name, weeks, days per week, time budget)
  - Step 2: Configure workout days with names and target muscles
  - Step 3: Add exercises with full-screen picker modal
  - Step 4: Review summary with time estimates, save to database
- Created wizard store (`wizardStore.svelte.ts`) for state management
- Built exercise picker with search, muscle filter, and equipment filter
- Pre-filters exercises by day's target muscles for better UX
- Implemented blocks list page that fetches and displays training blocks
- Fixed GitHub Issues #1, #2, #3:
  - #1: Exercise picker modal overlay blocking content - fixed with z-index 9999 and full-screen modal
  - #2: Muscle groups not passed from Step 2 to Step 3 - added pre-selection logic
  - #3: Database column name mismatch - fixed `block_id` → `training_block_id`

**Technical decisions:**
- Wizard uses single-page architecture with client-side step navigation
- Exercise picker is full-screen on mobile for better touch UX
- Modal prevents body scroll when open using `:has()` CSS selector
- Blocks page fetches with Supabase relation query for workout_days count

**Files created:**
- `src/lib/stores/wizardStore.svelte.ts`
- `src/lib/types/wizard.ts`
- `src/lib/components/wizard/*.svelte` (6 components)
- `src/routes/blocks/new/+page.svelte`

**Issues encountered:**
- Modal z-index stacking context required very high z-index (9999)
- Supabase insert required exact column names matching database schema

---

### Session: Auth, Navigation, and Theming

**What was done:**
- Implemented Supabase authentication (login, signup, forgot password)
- Created auth store with Svelte 5 runes pattern
- Built responsive navigation:
  - BottomNav for mobile
  - SideNav for desktop
  - AppShell wrapper component
- Implemented dynamic theming system:
  - 8 color schemes (Emerald, Blue, Cyan, Indigo, Orange, Slate, Red, Pink)
  - CSS custom properties for instant theme switching
  - localStorage persistence
  - ThemeSelector component in Settings
- Created main app pages: Home, Blocks, Exercises, Settings
- Set up database types and Supabase client

**Technical decisions:**
- Using CSS variables (`var(--color-*)`) for theming instead of Tailwind classes for instant switching
- Auth store uses getter pattern to expose reactive state from Svelte 5 runes
- Route protection via `$effect()` redirects

**Notes:**
- Supabase migrations run directly in dashboard (not via CLI)
- Theme persists across sessions via localStorage

---

## 2024-12-25

### Session: Project Setup & Documentation Structure

**What was done:**
- Created CLAUDE.md for Claude Code guidance
- Set up documentation structure:
  - `docs/` - troubleshooting, decisions, devlog
  - `specs/` - moved PRD, app flow, and design docs
- Initial SvelteKit + Tailwind + Supabase setup was already complete

**Notes:**
- Project uses Svelte 5 runes syntax (`$props()`, `$state()`, etc.)
- Tailwind v4 uses simplified import: `@import 'tailwindcss'`
- Supabase client installed but not yet configured in app code

**Next steps:**
- Set up Supabase client configuration
- Implement authentication flow
- Build out initial route structure

---

<!-- Add new entries above this line, newest first -->
