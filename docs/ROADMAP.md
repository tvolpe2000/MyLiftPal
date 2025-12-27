# MyLiftPal Roadmap

Quick reference for what's done vs what's remaining.

---

## Phase 1: MVP ✅ COMPLETE

- [x] User authentication (login, signup, forgot password)
- [x] Training Block creation wizard
- [x] Exercise library (browse, search, filter)
- [x] Basic workout logging (weight, reps, RIR)
- [x] Program templates (PPL, Upper/Lower, Full Body, etc.)
- [x] Smart auto-fill exercises
- [x] Delete training blocks (with confirmation modal)

---

## Phase 2: Intelligence ✅ COMPLETE

- [x] Volume calculation engine
- [x] Volume indicators in wizard (Step 3)
- [x] Volume indicators on training blocks list
- [x] Volume display during workout
- [x] Previous session display (show what you did last time for each exercise)
- [x] Progression recommendations (auto-suggest weight/reps based on last session)

---

## Phase 2.5: Set Logging UX ✅ COMPLETE

- [x] Scroll wheel picker for weight (iOS-style with configurable increment)
- [x] Scroll wheel picker for reps (optional, toggle in settings)
- [x] Weight auto-carry (first set weight carries to subsequent sets)
- [x] "Repeat last set" quick button (one-tap to log same as previous)
- [x] Quick-log from previous session (tap to accept suggested values)
- [x] Global workout settings (weight style, rep style, increment)

---

## Phase 3: Time & Offline ✅ COMPLETE

- [x] Time estimation (show projected workout duration per week)
- [x] Time budget warnings (alert if final week exceeds budget)
- [x] "Download Today" offline mode
- [x] Sync queue for offline changes
- [x] PWA infrastructure (service worker, manifest, IndexedDB)

---

## Phase 4: Polish & Features

**Priority: Bugs → UX → Features → Launch Prep**

### 4.1 Bugs (Highest Priority)
- [ ] Fix screen lock causing page reload (see Known Issues)
- [ ] Accessibility warnings (a11y) - see Known Issues

### 4.2 UX Improvements
- [ ] Swap exercises during workout (equipment busy, injury, preference)
- [ ] Home page redesign (dynamic welcome message)
- [ ] "Fill to Optimal" button on wizard Step 4
- [ ] Additional themes
- [ ] PWA installation prompt (custom "Install App" button)

### 4.3 AI & Advanced Features
- [ ] AI Voice Assistant (FAB → voice/text chat to control workouts)
- [ ] Photo import (OCR for handwritten logs)

### 4.4 Launch Prep (After features stable)
- [ ] Test data seeding (demo account with workout history)
- [ ] Beta testing with real users
- [ ] Bug fixes from beta feedback

### AI Voice Assistant Details

**Entry Point:** Floating Action Button (FAB) during workout
- Tap → Voice mode (uses Browser Speech API, upgrade to Whisper if needed)
- Long press or secondary button → Text input mode

**Architecture:** Tool Use / Function Calling
- Send transcription + workout context to LLM (Claude/GPT)
- LLM returns structured tool call
- App executes action and speaks/shows confirmation

**Supported Actions:**
| Action | Example Input |
|--------|---------------|
| Log set | "185 for 8, felt easy, 2 in the tank" |
| Skip exercise | "Skip triceps, elbow is bothering me" |
| Swap exercise | "Swap this for dumbbell press" |
| Complete workout | "I'm done for today" |
| Add exercise | "Add some calf raises, 3 sets" |
| Undo last | "Undo that" / "Wait, that was 8 not 6" |

**Technical Approach:**
1. Browser Web Speech API for transcription (free, MVP)
2. Whisper API upgrade path if accuracy insufficient
3. Single LLM API call with tool definitions
4. No custom agents or MCP required

---

## Phase 5: LLM Security Hardening

LLM integrations that can modify user data require specific security measures.

### Static Analysis (Semgrep)
- [ ] Install Semgrep locally (`pip install semgrep` or `brew install semgrep`)
- [ ] Run baseline scan: `semgrep --config=p/default --config=p/security-audit .`
- [ ] Add pre-commit hook for automatic scans on staged changes
- [ ] Integrate into CI pipeline to block PRs with high-severity findings
- [ ] Add LLM-specific custom rules (raw user input in prompts, unvalidated outputs)
- [ ] Configure dependency vulnerability scanning (npm audit in CI)

### LLM Vulnerability Scanning (Garak)
- [ ] Install Garak: `pip install garak`
- [ ] Test for prompt injection attacks (direct and indirect)
- [ ] Test for jailbreak attempts and guardrail bypasses
- [ ] Add Garak to CI/CD pipeline for regression testing on LLM code changes
- [ ] Schedule weekly automated scans

### Input Validation Layer
- [ ] Create input sanitization middleware for all LLM-bound requests
- [ ] Implement prompt template system (user input never directly in prompts)
- [ ] Add content filtering for malicious patterns
- [ ] Validate input length and character restrictions

### Output Validation Layer
- [ ] Schema validation (Zod) for all LLM responses before data mutations
- [ ] Allowlist of permitted actions/operations
- [ ] Reject responses that don't match expected structure
- [ ] User confirmation step for destructive or sensitive data changes
- [ ] Log and alert on validation failures

### Rate Limiting & Monitoring
- [ ] Rate limiting on LLM-powered endpoints (per-user, per-IP)
- [ ] Anomaly detection for unusual request patterns
- [ ] Cost monitoring and budget alerts for LLM API usage
- [ ] Audit logging for all LLM-triggered data mutations

---

## Backlog / Nice-to-Have

Lower priority items - implement after launch or as time permits:

- [ ] Rest timer with notifications (lowest priority per user feedback)
- [ ] Duplicate training block
- [ ] Export data (CSV/JSON)
- [ ] Exercise video links
- [ ] Superset time optimization
- [ ] Workout notes/journaling
- [ ] Stats/analytics dashboard
- [ ] Deload week auto-generation

## Completed

- [x] In-app changelog & roadmap ✅
- [x] Edit completed workouts (add missing sets, fix mistakes) ✅

---

## Feature Details

### Home Page Redesign

**Dynamic Welcome Message**:
- Vary the greeting based on time of day, workout status, or streak
- Keep tone motivating but not overly nice or cheery
- Examples: "Back at it", "Let's get to work", "Time to lift"
- Avoid excessive enthusiasm or generic positivity

### In-App Changelog & Roadmap (Completed)

**Goal**: Keep users informed about updates and upcoming features.

**Home page banner**:
- Shows when new version deployed (compare stored version vs current)
- Dismissible, remembers in localStorage
- "What's New" or "v1.2.0 released" style
- Tapping opens the changelog page

**Changelog page** (`/changelog`):
- Tab 1: **Recent Updates** - Version history with release notes
- Tab 2: **Coming Soon** - Future features with status badges

**Status badges for upcoming features**:
| Status | Color | Meaning |
|--------|-------|---------|
| Tracked | Gray | On the radar, not yet planned |
| Planned | Blue | Scheduled for upcoming release |
| In Progress | Yellow | Currently being built |

**Data source options**:
1. **Static JSON file** - Simple, updated at deploy time
2. **Markdown files** - `/static/changelog/*.md` parsed at build
3. **CMS/API** - Overkill for now, but future option

**Suggested structure** (`/static/changelog.json`):
```json
{
  "currentVersion": "1.2.0",
  "releases": [
    {
      "version": "1.2.0",
      "date": "2025-01-15",
      "highlights": ["Offline mode", "Scroll wheel picker"],
      "changes": ["Added PWA support", "Fixed RIR bug"]
    }
  ],
  "upcoming": [
    { "title": "Voice logging", "status": "planned" },
    { "title": "Rest timer", "status": "tracked" }
  ]
}
```

---

## Known Issues / Technical Debt

### Screen Lock Causes Page Reload

**Reported**: User locks phone during workout, page reloads and loses state when unlocked.

**Cause**: iOS Safari and Android Chrome discard background tabs to save memory. When the user returns, the page must reload from scratch.

**Solution approach**:
1. Use Page Visibility API (`visibilitychange` event) to detect when page is hidden
2. Save active workout state to IndexedDB before page is hidden
3. On page load, check for saved workout state and restore it
4. Consider Wake Lock API to prevent screen sleep during active workout (optional)

**Files to modify**:
- `src/lib/stores/workoutStore.svelte.ts` - Add state persistence methods
- `src/lib/db/indexedDB.ts` - Add workout state storage
- `src/routes/blocks/[id]/+page.svelte` - Add visibility change listener

---

### Accessibility Warnings (a11y)

Non-blocking warnings from `npm run check`. Fix when time permits:

| File | Line | Issue |
|------|------|-------|
| `ScrollWheelPicker.svelte` | 81 | Label not associated with control |
| `TemplatePicker.svelte` | 126 | Toggle button missing `aria-label` |
| `SetInputModal.svelte` | 223 | Label not associated with control (Weight) |
| `SetInputModal.svelte` | 293 | Label not associated with control (Reps) |
| `SetInputModal.svelte` | 344 | Label not associated with control (RIR) |

**Fix approach**:
- For labels: Add `id` to input and `for` attribute to label, or wrap input inside label
- For toggle button: Add `aria-label="Toggle include exercises"`

### Dependency Vulnerabilities

From `npm audit` (4 low severity):
- `cookie` package vulnerability (transitive dep of @sveltejs/kit)
- Cannot fix without breaking SvelteKit; waiting for upstream update

---

## Recently Completed

| Date | Feature |
|------|---------|
| 2025-12-27 | In-app changelog & roadmap page with "What's New" banner |
| 2025-12-27 | Delete training blocks (trash icon with confirmation modal) |
| 2025-12-27 | Edit completed workouts (view/edit past sessions from Recent Activity) |
| 2025-12-26 | Time estimation (wizard Step 3 + blocks list) |
| 2025-12-26 | ExerciseCard muscle display (primary/secondary muscles) |
| 2025-12-26 | Scroll wheel picker + global workout settings |
| 2025-12-26 | RIR bug fix in quick-log |
| 2025-12-25 | Phase 2.5: Set logging UX improvements |
| 2025-12-25 | Progression recommendations (auto-suggest weight/reps) |
| 2025-12-25 | Previous session display in workout tracking |
| 2025-12-25 | Wizard enhancements (volume, templates, auto-fill) |
| 2025-12-25 | Volume tracking feature |
| 2025-12-25 | Home page with Today's Workout |
| 2025-12-25 | Workout tracking & logging |
| 2025-12-25 | Training block wizard |
| 2025-12-25 | Auth, navigation, theming |

---

*Last updated: 2025-12-27 (prioritized for launch readiness)*
