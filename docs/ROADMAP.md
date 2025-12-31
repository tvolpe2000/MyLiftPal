# IronAthena Roadmap

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
- [x] Fix screen lock causing page reload (see Known Issues) ✅
- [x] Accessibility warnings (a11y) - see Known Issues ✅

### 4.2 UX Improvements
- [x] Swap exercises during workout (equipment busy, injury, preference) ✅
- [x] Add exercises during workout (throw in extra sets, forgotten exercises) ✅
- [x] "Fill to Optimal" button in wizard Step 3 (block-level analysis) ✅
- [x] Goal-based training (Hypertrophy, Strength, Maintenance, Power, Endurance) ✅
- [x] Lifter level profiles (Beginner, Intermediate, Advanced) with onboarding ✅
- [x] Home page redesign (Quick Stats, Weekly Volume, Personal Records) ✅
- [x] Additional themes (Amber, Violet, Zinc - 11 total) ✅
- [x] PWA installation prompt (custom "Install App" button) ✅

### 4.3 AI & Advanced Features
- [x] AI Voice Assistant Phase 1 - Core voice logging ✅
  - [x] Provider-agnostic architecture (supports OpenAI, Claude, Gemini, self-hosted)
  - [x] OpenAI GPT-4o-mini integration
  - [x] Browser Web Speech API for transcription
  - [x] All 7 workout tools: logSet, skipExercise, swapExercise, addExercise, completeWorkout, undoLast, clarify
  - [x] VoiceFAB and VoiceModal components
  - [x] Text input fallback
- [x] AI Voice Assistant Phase 1.5 - Global Assistant ✅
  - [x] FAB available on ALL pages (moved from workout-only to AppShell)
  - [x] Schedule tools: swapWorkoutDays, skipDay, rescheduleDay
  - [x] Block modification tools: addSetsToExercise, removeSetsFromExercise, changeRepRange, modifyBlockExercise
  - [x] Query tools: getTodaysWorkout, getWeeklyVolume, getPersonalRecords, getStats, getBlockProgress
  - [x] Unified context system (workout + global)
  - [x] Context-aware tool selection
- [x] AI Voice Assistant Phase 1.6 - UX Polish ✅
  - [x] Modal stays open after response (no auto-close)
  - [x] Follow-up questions with persistent mic button
  - [x] In-modal help guide with example commands
  - [x] Proper success/error state handling
  - [x] Swap specific exercises by name (targetExercise parameter)
  - [x] FAB positioning fix (above Complete Workout button)
- [x] AI Voice Assistant Phase 1.7 - Bug fixes & missing tools ✅
  - [x] Fixed training block context hydration bug (race condition)
  - [x] Added logMultipleSets tool for batch set logging
  - [x] Added global command API endpoint
  - [x] Implemented all block tool executors
  - [x] Implemented all schedule tool executors
  - [x] Implemented all query tool executors
  - [x] Improved system prompts with clearer examples
- [ ] AI Voice Assistant Phase 2 - Text-to-Speech responses (see details below)
- [ ] AI Voice Assistant Phase 3 - Additional providers (Claude, Gemini)
- [ ] AI Voice Assistant Phase 4 - Data collection for fine-tuning
- [ ] Photo import (OCR for handwritten logs)

### 4.4 Launch Prep (After features stable)
- [ ] Test data seeding (demo account with workout history)
- [ ] Beta testing with real users
- [ ] Bug fixes from beta feedback

### AI Voice Assistant Details ✅ IMPLEMENTED

**Entry Point:** Floating Action Button (FAB) on ALL authenticated pages
- Tap → Voice mode (uses Browser Speech API)
- "Type instead" button → Text input fallback
- Available globally, not just during workouts

**Architecture:** Provider-Agnostic Tool Use / Function Calling
```
User Speech → Web Speech API → Transcript
                    ↓
Transcript + Unified Context → AI Provider (OpenAI/Claude/Gemini/Local)
                    ↓
Tool Call → Category Executor → Store Actions
                    ↓
Feedback Message → User
```

**Tool Categories (20 Total Tools):**

| Category | Tools | Available When |
|----------|-------|----------------|
| Workout (8) | logSet, logMultipleSets, skipExercise, swapExercise, completeWorkout, addExercise, undoLast, clarify | In active workout |
| Schedule (3) | swapWorkoutDays, skipDay, rescheduleDay | Has training block |
| Block (4) | addSetsToExercise, removeSetsFromExercise, changeRepRange, modifyBlockExercise | Has training block |
| Query (5) | getTodaysWorkout, getWeeklyVolume, getPersonalRecords, getStats, getBlockProgress | Always |

**Example Commands:**
| Context | Example | Tool |
|---------|---------|------|
| Workout | "185 for 8, 2 in reserve" | logSet |
| Global | "What's my workout today?" | getTodaysWorkout |
| Global | "Swap today with tomorrow" | swapWorkoutDays |
| Global | "Add a set to bench press" | addSetsToExercise |
| Global | "Show me my PRs" | getPersonalRecords |

**Implementation:**
- `src/lib/ai/` - Core AI module with types, providers, tools
- `src/lib/ai/globalAssistant.ts` - Global entry point
- `src/lib/ai/context/` - Unified context builder
- `src/lib/ai/tools/` - Tool definitions and executors
- `src/lib/stores/trainingBlockStore.svelte.ts` - Global block data access
- `src/lib/components/AppShell.svelte` - Global FAB placement
- `src/routes/api/ai/global/` - Server-side global endpoint
- See `docs/AI_ASSISTANT.md` for full architecture
- See `docs/AI_SETUP.md` for configuration

**Current Provider:** OpenAI GPT-4o-mini (~$0.15/1K requests)

**Future Providers:** Claude Haiku, Gemini Flash, Self-hosted Llama/Mistral

### AI Voice Assistant Phase 1.7: Bug Fixes & Missing Tools

**Known Issues:**

1. **Training block context is null** - When user has a block, context shows `trainingBlock: null`
   - Root cause: `trainingBlockStore` not being populated on global requests
   - Fix: Ensure store is hydrated before building AI context

2. **Wrong tool selection** - AI picks query tools when modification tools are needed
   - Example: "Add a chest day" → AI picks `getBlockProgress` instead of (missing) `addWorkoutDay`
   - Fix: Better system prompt guidance + add missing tools

3. **Missing day-level tools** - Can't add/remove/duplicate workout days
   - Current tools only modify exercises within existing days

**Missing Tools to Add:**

| Tool | Description | Example Command |
|------|-------------|-----------------|
| `logMultipleSets` | Log multiple sets at once | "225 for 10 then 8 each after" |
| `addWorkoutDay` | Add a new day to training block | "Add another chest day" |
| `removeWorkoutDay` | Remove a day from block | "Remove leg day" |
| `duplicateWorkoutDay` | Copy an existing day | "Duplicate push day" |
| `renameWorkoutDay` | Rename a day | "Rename day 3 to Pull B" |
| `addExerciseToDay` | Add exercise to specific day (not workout) | "Add curls to arm day" |
| `removeExerciseFromDay` | Remove exercise from day | "Remove lunges from leg day" |

**`logMultipleSets` Tool Design:**
```typescript
// "225 for 10 then 8 each after that" (4 sets total, context says 4 sets)
{
  tool: "logMultipleSets",
  parameters: {
    sets: [
      { weight: 225, reps: 10 },
      { weight: 225, reps: 8 },
      { weight: 225, reps: 8 },
      { weight: 225, reps: 8 }
    ]
  }
}

// "135, 185, 225, 245 for 5 each"
{
  tool: "logMultipleSets",
  parameters: {
    sets: [
      { weight: 135, reps: 5 },
      { weight: 185, reps: 5 },
      { weight: 225, reps: 5 },
      { weight: 245, reps: 5 }
    ]
  }
}
```

**Current Tools (19):**
- Workout (7): logSet, skipExercise, swapExercise, completeWorkout, addExercise, undoLast, clarify
- Schedule (3): swapWorkoutDays, skipDay, rescheduleDay
- Block (4): addSetsToExercise, removeSetsFromExercise, changeRepRange, modifyBlockExercise
- Query (5): getTodaysWorkout, getWeeklyVolume, getPersonalRecords, getStats, getBlockProgress

**After Phase 1.7 (27 tools):**
- Workout (8): existing 7 + logMultipleSets
- Schedule (3): unchanged
- Block (10): existing 4 + addWorkoutDay, removeWorkoutDay, duplicateWorkoutDay, renameWorkoutDay, addExerciseToDay, removeExerciseFromDay
- Query (5): unchanged

**Implementation Tasks (Phase 1.7):**
- [x] Fix training block context hydration bug ✅
- [x] Add `logMultipleSets` tool + executor (batch set logging) ✅
- [x] Implement block tool executors (addSets, removeSets, changeRepRange, modifyExercise) ✅
- [x] Implement schedule tool executors (swapDays, skipDay, rescheduleDay) ✅
- [x] Implement query tool executors (5 tools) ✅
- [x] Create global command API endpoint (`/api/ai/openai/global`) ✅
- [x] Improve system prompt to distinguish query vs modification intents ✅
- [x] Add more example commands to tool descriptions ✅
- [ ] Test with common user commands

**Future Tools (deferred to later phase):**
- [ ] Add `addWorkoutDay` tool + executor
- [ ] Add `removeWorkoutDay` tool + executor
- [ ] Add `duplicateWorkoutDay` tool + executor
- [ ] Add `renameWorkoutDay` tool + executor
- [ ] Add `addExerciseToDay` tool + executor
- [ ] Add `removeExerciseFromDay` tool + executor

---

### AI Voice Assistant Phase 2: Text-to-Speech (TTS) Responses

**Goal**: AI speaks responses aloud for true hands-free operation during workouts.

**User Flow**:
1. User speaks: "185 for 8, 2 in reserve"
2. AI processes and logs the set
3. AI speaks back: "Got it. Set 2 logged: 185 pounds, 8 reps, 2 RIR."

#### TTS Technology Options

| Provider | Cost | Quality | Latency | Notes |
|----------|------|---------|---------|-------|
| **Browser SpeechSynthesis** | FREE | Basic/Robotic | Instant | Built-in, no API needed, works offline |
| **OpenAI TTS** | $15/1M chars | High | ~0.5s | We already use OpenAI, 6 voices |
| **OpenAI TTS HD** | $30/1M chars | Very High | ~1s | Best OpenAI quality |
| **Google Cloud TTS** | $4-16/1M chars | High | ~0.3s | WaveNet voices, generous free tier |
| **ElevenLabs** | ~$180/1M chars | Premium | ~0.5s | Best quality, overkill for this use case |

#### Recommended Approach

**Phase 2a: Browser SpeechSynthesis (Free, Immediate)**
- Use browser's built-in `window.speechSynthesis` API
- No additional cost or API calls
- Quality is "good enough" for short confirmations
- Works offline
- Cross-browser library: [EasySpeech](https://github.com/leaonline/easy-speech)

```typescript
// Simple implementation
const utterance = new SpeechSynthesisUtterance("Set logged: 185 for 8");
utterance.rate = 1.1; // Slightly faster
utterance.pitch = 1.0;
speechSynthesis.speak(utterance);
```

**Phase 2b: Self-Hosted TTS (Recommended for Own Server)**

If running your own AI server, self-hosted TTS can match or **beat** commercial options:

| Model | Size | Hardware | Speed | Quality | License |
|-------|------|----------|-------|---------|---------|
| **Kokoro-82M** | 82M params | CPU or GPU | <0.3s | High | Apache 2.0 ✅ |
| **Chatterbox** | 500M params | GPU 8GB+ | <0.2s | **Beats ElevenLabs** | MIT ✅ |
| **Chatterbox-Turbo** | 350M params | GPU 6GB+ | Faster | High | MIT ✅ |
| **Piper** | Varies | CPU/RPi | Very fast | Good | MIT ✅ |
| **XTTS-v2** | 467M params | GPU 8GB+ | ~1s | High + Cloning | Non-commercial ⚠️ |
| **Tortoise** | Large | GPU 12GB+ | Minutes | Best | Apache 2.0 ✅ |

**Top Recommendations:**

1. **Kokoro-82M** - Best for CPU-only servers
   - 82M parameters = runs on anything
   - <0.3s inference even on CPU
   - Apache 2.0 = commercial OK
   - [Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) - Docker + OpenAI-compatible endpoint
   - Market rate: <$1/1M characters (essentially free self-hosted)

2. **Chatterbox** - Best quality (if you have GPU)
   - Beat ElevenLabs in 63.8% of blind tests
   - 23 languages, emotion control, voice cloning
   - Needs ~8GB VRAM (RTX 3060 Ti or better)
   - [Chatterbox-TTS-Server](https://github.com/devnen/Chatterbox-TTS-Server) - Self-host with OpenAI-compatible API
   - Sub-200ms latency on GPU

3. **Piper** - Best for edge/embedded
   - Optimized for Raspberry Pi 4
   - ONNX models, very fast
   - Great for offline/privacy-first

**Self-Hosted Architecture:**
```
Your Server (with GPU)
├── LLM (Llama/Mistral) → Process voice command
├── TTS (Chatterbox/Kokoro) → Generate speech response
└── Single API endpoint for MyLiftPal

MyLiftPal App
├── Send transcript → Server
├── Receive: { action: "logSet", speech_url: "/audio/response.mp3" }
└── Play audio
```

**Phase 2c: OpenAI TTS (Cloud Fallback)**
- For users without self-hosted server
- Setting toggle: "Use premium voice" (off by default)
- Estimated cost: ~$0.001 per response (avg 50 chars)
- Cost: $1.50/month per active user (at $15/1M chars)

#### Implementation Files

```
src/lib/ai/speech/
├── webSpeech.ts          # Existing - speech recognition
├── synthesis.ts          # NEW - browser TTS wrapper
└── openaiTTS.ts          # NEW - OpenAI TTS client (optional)

src/routes/api/ai/
└── tts/+server.ts        # NEW - OpenAI TTS endpoint (optional)
```

#### Settings to Add

- [ ] Enable voice responses (on/off toggle)
- [ ] Voice selection (browser voices dropdown)
- [ ] Speech rate (0.5x - 2x slider)
- [ ] Premium voice toggle (uses OpenAI TTS, shows cost warning)

#### Sources
- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechSynthesis - MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [OpenAI TTS Pricing](https://platform.openai.com/docs/pricing)
- [EasySpeech Library](https://github.com/leaonline/easy-speech)
- [Google Cloud TTS Pricing](https://cloud.google.com/text-to-speech/pricing)

**Self-Hosted TTS:**
- [Chatterbox TTS](https://github.com/resemble-ai/chatterbox) - State-of-the-art open-source TTS
- [Chatterbox-TTS-Server](https://github.com/devnen/Chatterbox-TTS-Server) - Self-hosted with OpenAI-compatible API
- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) - Tiny model, runs on CPU
- [Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) - Docker wrapper with OpenAI endpoint
- [Piper TTS](https://github.com/rhasspy/piper) - Fast local TTS for Raspberry Pi
- [Coqui TTS](https://github.com/coqui-ai/TTS) - Deep learning TTS toolkit
- [Best Open-Source TTS Models Compared](https://www.inferless.com/learn/comparing-different-text-to-speech---tts--models-part-2)

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

## Phase 5: Competitor Parity & Enhanced Features

Based on competitor analysis (Alpha Progress app), prioritized by impact.

### 5.1 Exercise Content ✅ MAJOR PROGRESS

**Problem**: Our exercise library lacked visual content. Competitor has 795+ exercises with photos and videos.

- [x] **Expanded exercise database** - Imported 583 exercises from Wger API (81 → 664 total) ✅
- [x] **Exercise thumbnails/photos** - 194 exercise images from Wger ✅
- [x] **Muscle group SVG diagrams** - 16 muscle overlays with front/back body positioning ✅
- [x] **Video URLs** - 40 exercise videos imported from Wger ✅
- [ ] Exercise instruction videos - Could source more from YouTube
- [ ] Written exercise instructions - AI can generate these (medium effort)

**Data Source Used:**
- Wger API (https://wger.de/api/v2/) - Open source, AGPL-3.0 license (requires attribution)
- Scripts in `scripts/import-wger-exercises.ts` and `scripts/import-exercise-images.ts`
- Migration: `supabase/migrations/006_exercise_images.sql`

**Stats (Dec 31, 2025):**
- Total exercises: 664 (was 81)
- With images: 194 (~30%)
- With videos: 40 (~6%)
- Muscle SVGs: 16 (100% coverage)

### 5.2 Workout Logging UX Improvements

- [ ] **Hybrid scroll wheel + numpad input** (see competitor reference)
  - Combines scroll wheel (for browsing) with numpad (for direct entry) in ONE view
  - User can scroll to approximate weight, then tap numbers to adjust
  - Eliminates need for separate "Numpad" vs "Scroll wheel" setting
  - Reference: Alpha Progress weight picker (IMG_5633)

- [ ] **Rest timer** with countdown, alarm/vibrate, +/- adjustment
  - Auto-start after completing a set
  - Configurable default rest time per exercise type
  - Continue to next exercise option
  - Note: Lower priority for hypertrophy (user preference), higher for strength

- [ ] **Dropsets support**
  - Mark sets as dropsets (+2 indicator style)
  - Time-saver for high-volume training
  - Track weight drop percentage

- [ ] **Supersets support**
  - Pair exercises together
  - Significant time-saver
  - Single rest period after superset completion

### 5.3 Smart Program Generation (Wizard Enhancement)

**Concept**: Streamlined wizard that auto-selects templates based on user criteria.

**User Flow:**
1. "How long do you want to run this block?" → 4-12 weeks slider
2. "Focus any muscle groups?" → Optional muscle selector (Chest, Back, etc.)
3. "How many days per week?" → 3-6 days (suggest minimum 3)
4. System finds templates matching criteria by percentage fit
5. Present top 3 matches with explanation of why they fit

**Implementation:**
- [ ] Add `focusMuscles` metadata to template data (e.g., PPL = balanced, Arnold Split = chest/arms bias)
- [ ] Template matching algorithm (days match, goal match, focus muscle overlap)
- [ ] "Smart Recommendations" step in wizard before template picker
- [ ] Show match percentage and reasoning ("This template hits chest 2x/week")

### 5.4 Progress Dashboards & Charts

**Problem**: No visual progress tracking. Competitor has charts per exercise.

- [ ] Exercise history chart (weight over time)
- [ ] Volume per muscle chart (weekly/monthly trends)
- [ ] 1RM/10RM estimated max calculation and tracking
- [ ] Personal records page with historical progression
- [ ] Stats dashboard: total volume lifted, workout streak, consistency %

### 5.5 Equipment & Gym Configuration

**Concept**: Configure available equipment to filter exercises appropriately.

- [ ] Equipment profile setup (what's available at your gym)
- [ ] Weight increment configuration per equipment type
  - Barbell: 45 lb bar, 2.5 lb increments
  - Dumbbells: 5 lb increments
  - Cable: 5 lb or 10 lb increments
  - Machine: varies by machine
- [ ] Filter exercises by available equipment
- [ ] (Future) Multiple gym profiles if user trains at different locations

### 5.6 Template Muscle Focus Filtering

**Concept**: Filter templates by muscle group emphasis.

- [ ] Add `muscleBias` field to templates:
  ```typescript
  {
    name: "Push Pull Legs",
    muscleBias: { chest: "balanced", back: "balanced", legs: "high" },
    // or simpler: focusMuscles: ["legs"]
  }
  ```
- [ ] Template picker filter: "Focus: Chest" shows chest-biased templates
- [ ] Visual indicator showing template's muscle emphasis

---

## Backlog / Nice-to-Have

Lower priority items - implement after launch or as time permits:

- [ ] Duplicate training block
- [ ] Export data (CSV/JSON)

### Social & Sharing Features (Future Phase)

**Core Concept**: Enable friends to train together and share progress.

**Share Content:**
- [ ] Share workout summary (post-workout card with exercises, volume, PRs hit)
- [ ] Share personal records ("Just hit 225 on bench!")
- [ ] Share weekly/monthly stats

**Template Sharing (Key Feature):**
- [ ] Publish your training block as a shareable template
  - "Hey Todd, let's run this training block together"
  - Generate shareable link or code
  - Friend can import and start the same program
- [ ] Save someone else's shared template to your library
- [ ] Template visibility: Private (default) / Friends / Public
- [ ] User-created template gallery (browse community templates)

**Use Case**: Your son builds a program and shares it with his buddies so they can all run the same block together.

**Community (Lower Priority):**
- [ ] Facebook group integration
- [ ] Reddit community link

---

### Other Backlog Items

- [ ] Workout notes/journaling per exercise
- [ ] Deload week auto-generation
- [ ] Warm-up set suggestions (lower priority for hypertrophy focus)
  - Auto-calculate warm-up weights based on working weight
  - Adjustable based on experience level
- [ ] Body weight tracking (for bodyweight exercise calculations)
- [ ] Gender selection (may affect volume recommendations)
- [ ] Calendar view on home page (week view showing planned workouts)
- [ ] Apple Health / Health Connect integration
- [ ] Achievements/Trophies/Streaks (gamification)
- [ ] Searchable in-app FAQ/Help system

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

### Screen Lock Causes Page Reload ✅ FIXED

**Reported**: User locks phone during workout, page reloads and loses state when unlocked.

**Cause**: iOS Safari and Android Chrome discard background tabs to save memory. When the user returns, the page must reload from scratch.

**Solution implemented** (2025-12-31):
1. Added `visibilitychange` event listener to detect when page is hidden
2. Workout state is saved to IndexedDB (workoutSnapshots store) when page becomes hidden
3. On page load, checks for saved snapshot and restores if valid (within 4 hours, session still in progress)
4. Snapshots are cleared when workout is completed

**Files modified**:
- `src/lib/stores/workoutStore.svelte.ts` - Added `saveStateSnapshot()`, `restoreFromSnapshot()`, `clearStateSnapshot()`
- `src/lib/db/indexedDB.ts` - Added `workoutSnapshots` store (DB version 2)
- `src/routes/blocks/[id]/+page.svelte` - Added visibility change and beforeunload listeners

---

### Accessibility Warnings (a11y) ✅ FIXED

**Fixed** (2025-12-31):

| File | Fix Applied |
|------|-------------|
| `ScrollWheelPicker.svelte` | Added `role="listbox"`, `aria-labelledby`, `role="option"`, `aria-selected` |
| `TemplatePicker.svelte` | Added `aria-label` and `aria-pressed` to toggle button |
| `SetInputModal.svelte` | Added `role="group"` with `aria-labelledby`, `aria-label` on buttons |

All custom controls now have proper ARIA attributes for screen reader support.

### Dependency Vulnerabilities

From `npm audit` (4 low severity):
- `cookie` package vulnerability (transitive dep of @sveltejs/kit)
- Cannot fix without breaking SvelteKit; waiting for upstream update

---

## Recently Completed

| Date | Feature |
|------|---------|
| 2025-12-31 | AI Voice Phase 1.7 - Fixed context hydration bug, added logMultipleSets tool, implemented all tool executors |
| 2025-12-31 | Accessibility fixes - ARIA attributes for ScrollWheelPicker, TemplatePicker, SetInputModal |
| 2025-12-31 | Screen lock fix - Page Visibility API saves/restores workout state to IndexedDB |
| 2025-12-30 | AI Voice Phase 1.7 planning - documented bugs, missing tools (6 new day-level tools) |
| 2025-12-30 | AI Voice Phase 2 TTS research - documented self-hosted options (Chatterbox, Kokoro) |
| 2025-12-30 | Competitor analysis (Alpha Progress) - documented feature gaps in Phase 5 |
| 2025-12-30 | AI Voice Assistant Phase 1.6 - UX polish (persistent modal, help guide, follow-ups) |
| 2025-12-30 | Stale-while-revalidate pattern - Fix skeleton flash on tab switch |
| 2025-12-30 | AI technical documentation (AI_FLOW.md) |
| 2025-12-29 | AI Voice Assistant Phase 1.5 - Global assistant on all pages with 19 tools |
| 2025-12-29 | AI Voice Assistant Phase 1 - Provider-agnostic voice logging with OpenAI |
| 2025-12-28 | Theme expansion - Added Amber, Violet, Zinc themes (8 → 11 total) |
| 2025-12-28 | Home page redesign - Quick Stats, Weekly Volume, Personal Records, target muscle chips |
| 2025-12-28 | Application stability fixes - auth token refresh, error boundaries, PWA updates |
| 2025-12-28 | Fill to Optimal volume calculation fix - unified formulas with volume bars |
| 2025-12-28 | Fill to Optimal - block-level volume analysis with exercise suggestions |
| 2025-12-28 | Goal-based training blocks (Hypertrophy, Strength, Maintenance, Power, Endurance) |
| 2025-12-28 | Lifter level profiles with onboarding modal (Beginner, Intermediate, Advanced) |
| 2025-12-28 | User feedback system with screenshot support |
| 2025-12-27 | Swap exercises mid-workout (session-only or permanent) |
| 2025-12-27 | Add exercises mid-workout with smart defaults |
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

## Competitor Analysis Reference

**App Analyzed**: Alpha Progress (iOS App Store)
**Screenshots Location**: `Screenshots of Alpha Progress/` (53 images across 4 folders)
**Analysis Date**: 2025-12-30

### Key Competitor Features Noted:

| Feature | Their Implementation | Our Approach |
|---------|---------------------|--------------|
| Weight input | Scroll wheel + numpad combined | Currently separate modes - should unify |
| Experience levels | 5 tiers (Beginner → Elite) | 3 tiers: Beginner (0-2 yrs), Intermediate (2-5 yrs), Advanced (5+ yrs) |
| Training duration | Short/Medium/Long presets | Minutes input (more precise, keep ours) |
| Split selection | Manual or "Automatic" | Templates (better - more control) |
| Exercise library | 795+ with photos/videos | ~100 text-only (critical gap) |
| Muscle focus | Focus/Neglect per muscle | Tie to templates (smart filtering) |
| Dropsets | +N indicator on sets | Not implemented (needed) |
| Supersets | Pair exercises | Not implemented (time-saver) |
| Rest timer | Countdown with +/- adjust | Not implemented |
| Warm-ups | Auto-generate based on working weight | Not priority for hypertrophy |
| Charts | Per-exercise history graphs | Not implemented (high demand) |
| FAQ | Extensive searchable help | Not implemented |

### Our Unique Advantages:
- AI Voice Assistant (19 tools, hands-free logging)
- Transparent volume tracking (MV/MEV/MAV/MRV landmarks)
- Fill to Optimal algorithm
- Free tier (they paywall key features at $80/year)

---

*Last updated: 2025-12-31 (AI Voice Phase 1.7 complete - all tool executors implemented)*
