# Development Log

Chronological notes on development progress, sessions, and learnings.

---

## 2025-12-28

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
