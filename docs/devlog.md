# Development Log

Chronological notes on development progress, sessions, and learnings.

---

## 2025-12-25

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
