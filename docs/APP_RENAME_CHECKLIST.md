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
- [ ] `src/lib/components/SideNav.svelte` - App name in navigation header
- [ ] `src/routes/auth/+layout.svelte` - App name/branding on auth pages
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

*Created: 2025-12-26*
