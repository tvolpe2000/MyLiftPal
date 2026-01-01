# App Rename Checklist

**Current name:** MyLiftPal
**New name:** TBD (to be decided)
**Reason:** Too similar to "MyFitnessPal"

---

## Local Files

### Package & Config
- [ ] `package.json` - `name` field (currently "myliftpal")
- [ ] `package-lock.json` - regenerate after package.json change
- [ ] `static/manifest.webmanifest` - `name` and `short_name` fields

### Code References
- [ ] `src/lib/db/indexedDB.ts` - DB_NAME constant (`'myliftpal-offline'`)
- [ ] `src/lib/stores/workoutSettings.svelte.ts` - STORAGE_KEY (`'myliftpal-workout-settings'`)
- [ ] `src/lib/stores/theme.svelte.ts` - STORAGE_KEY (`'myliftpal-theme'`)
- [ ] `src/lib/stores/auth.svelte.ts` - PROFILE_CACHE_KEY (`'myliftpal_cached_profile'`) and console logs
- [ ] `src/hooks.client.ts` - Console error tags (`[MyLiftPal]`)
- [ ] `src/lib/components/SideNav.svelte` - App name in navigation header
- [ ] `src/lib/components/onboarding/LifterLevelModal.svelte` - Welcome text
- [ ] `src/lib/components/pwa/InstallPrompt.svelte` - Install text and `DISMISSED_KEY`
- [ ] `src/routes/auth/+layout.svelte` - App name/branding on auth pages
- [ ] `src/routes/feedback/+page.svelte` - "Help us improve..." text
- [ ] `docs/AI_ASSISTANT.md` - System prompt context ("You are a workout logging assistant for MyLiftPal")
- [ ] `scripts/seed-demo-data.ts` - Demo user emails (`@myliftpal.com`)
- [ ] `scripts/import-wger-exercises.ts` - Script comments
- [ ] `supabase/scripts/update_releases.sql` - Feedback placeholder text
- [ ] Search entire codebase for "myliftpal" (case-insensitive)
- [ ] Search entire codebase for "MyLiftPal"

### Documentation
- [ ] `CLAUDE.md` - Project description and references
- [ ] `README.md` - If exists
- [ ] `docs/devlog.md` - Historical references (optional, can leave as-is for history)
- [ ] `docs/ROADMAP.md` - Any references
- [ ] `specs/prd.md` - Product name references
- [ ] `specs/app-flow.md` - Any references
- [ ] `specs/architecture.md` - Any references
- [ ] `specs/design.md` - Any references
- [ ] `specs/technical-spec.md` - Any references
- [ ] `specs/firebase-studio.md` - Any references

### Assets
- [ ] `static/icon-192.svg` - Update if it contains text/branding
- [ ] `static/icon-512.svg` - Update if it contains text/branding
- [ ] Consider creating proper PNG icons with new branding

---

## External Services

### GitHub
- [ ] Rename repository: Settings > General > Repository name
- [ ] Update local git remote: `git remote set-url origin https://github.com/tvolpe2000/NEW_NAME.git`
- [ ] Update any GitHub Actions if they reference repo name

### Supabase
- [ ] Project Settings > General > Project name (display only, doesn't affect functionality)
- [ ] Note: Project URL/ID cannot be changed without creating new project
- [ ] If URL contains "myliftpal", may need to create new project and migrate

### Netlify
- [ ] Site Settings > Site details > Site name
- [ ] Update custom domain if applicable
- [ ] Update any environment variables that reference old name

---

## Post-Rename Steps

1. [ ] Clear browser localStorage (old keys will be orphaned)
2. [ ] Clear IndexedDB (old database will be orphaned)
3. [ ] Test PWA installation with new name
4. [ ] Verify manifest loads correctly
5. [ ] Test offline functionality
6. [ ] Update any bookmarks/shortcuts

---

## Migration Notes

**localStorage keys to migrate (or just clear):**
- `myliftpal-workout-settings`
- `myliftpal-theme` (if exists)

**IndexedDB databases:**
- `myliftpal-offline` - Will need fresh download after rename

**Breaking changes for existing users:**
- Users will lose any downloaded offline workouts (need to re-download)
- Users will lose workout settings (weight increment, input style preferences)
- Theme preference may reset

---

## Search Commands

Run these to find all references:
```bash
# Case-insensitive search for "myliftpal"
grep -ri "myliftpal" --include="*.ts" --include="*.svelte" --include="*.json" --include="*.md"

# Search for "MyLiftPal" specifically
grep -r "MyLiftPal" --include="*.ts" --include="*.svelte" --include="*.json" --include="*.md"
```

---

---

## New Supabase Project Setup

When creating a fresh Supabase project (recommended for production):

### 1. Create Project
- [ ] Create new project at supabase.com with new app name
- [ ] Note the project URL and anon key
- [ ] Wait for project to fully provision (~2 minutes)

### 2. Run Database Migrations
Run the complete setup script via Supabase SQL Editor:

1. [ ] Open `supabase/scripts/setup_complete.sql`
2. [ ] Copy the entire content
3. [ ] Paste into Supabase SQL Editor and run

This single script handles:
- Creating all tables and types
- Setting up Row Level Security (RLS) policies
- Creating performance indexes
- Seeding initial data (muscle groups, core exercises, changelog)

### 3. Populate Expanded Exercise Library
Since the 600+ exercises were imported via API, you need to run the import scripts for the new project:

1. [ ] **Import Exercises:** `npx tsx scripts/import-wger-exercises.ts`
2. [ ] **Import Images:** `npx tsx scripts/import-exercise-images.ts`
3. [ ] **Seed Demo Data:** `npx tsx scripts/seed-demo-data.ts` (Optional, for testing)

### 4. Configure Authentication
- [ ] Enable Email auth provider
- [ ] Configure email templates (confirmation, password reset)
- [ ] Set Site URL and Redirect URLs
- [ ] Configure rate limiting if needed

### 4. Update Local Environment
- [ ] Update `.env.local` with new VITE_SUPABASE_URL
- [ ] Update `.env.local` with new VITE_SUPABASE_ANON_KEY
- [ ] Test locally with `npm run dev`

### 5. Update Production (Netlify)
- [ ] Update environment variables in Netlify dashboard
- [ ] Trigger redeploy
- [ ] Test production site

### 6. Data Migration (if needed)
If migrating existing users/data:
- [ ] Export data from old project (Dashboard > Database > Backups)
- [ ] Import into new project
- [ ] Verify data integrity

---

## Recommended Database Indexes

Add these indexes for better query performance at scale:

```sql
-- Training blocks: user queries their own blocks frequently
CREATE INDEX idx_training_blocks_user_id ON training_blocks(user_id);
CREATE INDEX idx_training_blocks_user_status ON training_blocks(user_id, status);

-- Workout sessions: queried by user, block, and day
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_block_day ON workout_sessions(training_block_id, workout_day_id);
CREATE INDEX idx_workout_sessions_day_status ON workout_sessions(workout_day_id, status);

-- Logged sets: queried by session frequently
CREATE INDEX idx_logged_sets_session_id ON logged_sets(session_id);
CREATE INDEX idx_logged_sets_exercise_slot ON logged_sets(exercise_slot_id);

-- Exercise slots: queried by workout day
CREATE INDEX idx_exercise_slots_workout_day ON exercise_slots(workout_day_id);
CREATE INDEX idx_exercise_slots_day_order ON exercise_slots(workout_day_id, slot_order);

-- Workout days: queried by training block
CREATE INDEX idx_workout_days_block_id ON workout_days(training_block_id);

-- Exercises: searched by muscle frequently
CREATE INDEX idx_exercises_primary_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_equipment ON exercises(equipment);
```

---

*Created: 2025-12-26*
