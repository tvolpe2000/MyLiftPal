# Development Log

Chronological notes on development progress, sessions, and learnings.

---

## 2025-12-25

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
