# AI Voice Assistant - Architecture & Tool Definitions

## Overview

The AI Voice Assistant allows users to control their workout through natural voice or text commands. It uses a Tool Use / Function Calling architecture where user input is interpreted by an LLM and mapped to predefined actions.

**Status:** Phase 1 Complete (Core Voice Logging)

**Setup:** See `AI_SETUP.md` for configuration instructions.

---

## User Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        WORKOUT SCREEN                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Bench Press - Set 2 of 4                               │    │
│  │  Previous: 175 × 8 @ RIR 2                              │    │
│  │  Target: 180 × 8                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                              ┌───────┐           │
│                                              │  🎤   │  ← FAB    │
│                                              └───────┘           │
└──────────────────────────────────────────────────────────────────┘
                              │
                    User taps FAB
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     VOICE INPUT MODAL                            │
│                                                                  │
│         ┌─────────────────────────────────┐                     │
│         │  🔴 Listening...                │                     │
│         │                                 │                     │
│         │  "180 for 8, two in reserve"    │                     │
│         └─────────────────────────────────┘                     │
│                                                                  │
│         [Cancel]                    [⌨️ Type instead]           │
└──────────────────────────────────────────────────────────────────┘
                              │
                    Speech recognized
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     CONFIRMATION                                 │
│                                                                  │
│         ✓ Logged: 180 lbs × 8 reps @ RIR 2                      │
│                                                                  │
│         [Undo]                              [Done]               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Voice Recognition

### MVP: Browser Web Speech API

```typescript
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  processWithLLM(transcript);
};

recognition.start();
```

**Pros:** Free, no API costs, works offline in some browsers
**Cons:** Accuracy varies, may struggle with "RIR", exercise names

### Upgrade Path: Whisper API

```typescript
// Record audio blob, send to Whisper
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
  body: formData // Contains audio file
});
const { text } = await response.json();
processWithLLM(text);
```

**Cost:** ~$0.006/minute
**Pros:** Highly accurate, handles gym terminology well

---

## LLM Tool Definitions

### System Prompt

```
You are a workout logging assistant for MyLiftPal. The user is currently doing their workout and will give you voice commands to log sets, swap exercises, or control their session.

Current workout context will be provided with each request. Respond ONLY with a tool call - no conversational text.

If the user's intent is unclear, use the "clarify" tool to ask a brief question.
```

### Tool: logSet

Log a completed set for the current exercise.

```json
{
  "name": "logSet",
  "description": "Log a completed set with weight, reps, and optional RIR",
  "parameters": {
    "type": "object",
    "properties": {
      "weight": {
        "type": "number",
        "description": "Weight in pounds (convert from kg if mentioned)"
      },
      "reps": {
        "type": "integer",
        "description": "Number of reps completed"
      },
      "rir": {
        "type": "integer",
        "description": "Reps in Reserve (0-5). Infer from phrases like 'felt easy' (2-3), 'hard' (1), 'to failure' (0)",
        "minimum": 0,
        "maximum": 5
      }
    },
    "required": ["weight", "reps"]
  }
}
```

**Example inputs:**
- "185 for 8" → `{ weight: 185, reps: 8 }`
- "180 pounds, 8 reps, 2 in the tank" → `{ weight: 180, reps: 8, rir: 2 }`
- "Same weight, got 7 this time, pretty hard" → `{ weight: [from context], reps: 7, rir: 1 }`

---

### Tool: skipExercise

Skip the current exercise, optionally with a reason.

```json
{
  "name": "skipExercise",
  "description": "Skip the current exercise and move to the next one",
  "parameters": {
    "type": "object",
    "properties": {
      "reason": {
        "type": "string",
        "description": "Optional reason for skipping (injury, equipment unavailable, etc.)"
      }
    }
  }
}
```

**Example inputs:**
- "Skip this one" → `{ }`
- "Skip triceps, my elbow is bothering me" → `{ reason: "elbow discomfort" }`

---

### Tool: swapExercise

Replace the current exercise with a different one.

```json
{
  "name": "swapExercise",
  "description": "Swap the current exercise for a different one",
  "parameters": {
    "type": "object",
    "properties": {
      "newExercise": {
        "type": "string",
        "description": "Name of the replacement exercise (will be fuzzy matched against exercise library)"
      },
      "reason": {
        "type": "string",
        "description": "Optional reason for swapping"
      }
    },
    "required": ["newExercise"]
  }
}
```

**Example inputs:**
- "Swap this for dumbbell press" → `{ newExercise: "dumbbell press" }`
- "Do cable flyes instead, bench is taken" → `{ newExercise: "cable flyes", reason: "equipment unavailable" }`

---

### Tool: completeWorkout

Mark the workout as complete.

```json
{
  "name": "completeWorkout",
  "description": "Complete and save the current workout session",
  "parameters": {
    "type": "object",
    "properties": {
      "notes": {
        "type": "string",
        "description": "Optional notes about the workout"
      }
    }
  }
}
```

**Example inputs:**
- "I'm done" → `{ }`
- "Finish workout, felt great today" → `{ notes: "felt great today" }`

---

### Tool: addExercise

Add an exercise to today's workout.

```json
{
  "name": "addExercise",
  "description": "Add an additional exercise to today's workout",
  "parameters": {
    "type": "object",
    "properties": {
      "exercise": {
        "type": "string",
        "description": "Name of the exercise to add (will be fuzzy matched)"
      },
      "sets": {
        "type": "integer",
        "description": "Number of sets to add",
        "default": 3
      }
    },
    "required": ["exercise"]
  }
}
```

**Example inputs:**
- "Add some calf raises" → `{ exercise: "calf raises", sets: 3 }`
- "Throw in 4 sets of lateral raises" → `{ exercise: "lateral raises", sets: 4 }`

---

### Tool: undoLast

Undo the last action.

```json
{
  "name": "undoLast",
  "description": "Undo the most recent action (logged set, skip, swap)",
  "parameters": {
    "type": "object",
    "properties": {
      "correction": {
        "type": "string",
        "description": "If user is correcting, what the correct value should be"
      }
    }
  }
}
```

**Example inputs:**
- "Undo that" → `{ }`
- "Wait, that was 8 not 6" → `{ correction: "8 reps" }`

---

### Tool: clarify

Ask the user for clarification when intent is unclear.

```json
{
  "name": "clarify",
  "description": "Ask a clarifying question when the user's intent is unclear",
  "parameters": {
    "type": "object",
    "properties": {
      "question": {
        "type": "string",
        "description": "Brief clarifying question to ask"
      }
    },
    "required": ["question"]
  }
}
```

**Example:**
- User: "Do the other one" → `{ question: "Which exercise would you like to swap to?" }`

---

## Context Sent to LLM

Each request includes current workout state:

```json
{
  "currentExercise": {
    "name": "Bench Press",
    "setNumber": 2,
    "totalSets": 4,
    "targetWeight": 180,
    "targetReps": 8,
    "previousSession": {
      "weight": 175,
      "reps": 8,
      "rir": 2
    }
  },
  "completedToday": [
    { "exercise": "Bench Press", "set": 1, "weight": 180, "reps": 8, "rir": 2 }
  ],
  "remainingExercises": ["Incline DB Press", "Cable Flyes", "Tricep Pushdowns"],
  "lastAction": {
    "type": "logSet",
    "data": { "weight": 180, "reps": 8, "rir": 2 },
    "timestamp": "2025-12-27T10:30:00Z"
  }
}
```

---

## Response Templates

After executing a tool, speak/show confirmation:

| Tool | Response Template |
|------|-------------------|
| logSet | "Got it, {weight} for {reps}{rir ? ' at RIR ' + rir : ''}" |
| skipExercise | "Skipped {exercise}, moving to {next}" |
| swapExercise | "Swapped to {newExercise}" |
| completeWorkout | "Workout complete! Great session." |
| addExercise | "Added {sets} sets of {exercise}" |
| undoLast | "Undone. {description of what was reverted}" |
| clarify | "{question}" |

---

## Security Considerations

See `SECURITY.md` Phase 5 for LLM security hardening:
- Input validation before sending to LLM
- Output schema validation (Zod) before executing tools
- Rate limiting on voice assistant endpoint
- Audit logging for all AI-triggered mutations

---

## Implementation Phases

### Phase 1: Core Voice Logging ✅ COMPLETE
- [x] FAB on workout screen
- [x] Browser Speech API
- [x] All 7 tools implemented (logSet, skipExercise, swapExercise, addExercise, completeWorkout, undoLast, clarify)
- [x] Basic confirmation UI
- [x] Text input fallback
- [x] Provider-agnostic architecture
- [x] OpenAI GPT-4o-mini integration

### Phase 2: Additional Providers
- [ ] Add Claude adapter
- [ ] Add Gemini adapter
- [ ] Provider selection in Settings
- [ ] Fallback chain (try providers in order)

### Phase 3: Data Collection & Fine-Tuning
- [ ] Log successful parses to database
- [ ] Track user corrections
- [ ] Build export for fine-tuning dataset
- [ ] Fine-tune Llama/Mistral model

### Phase 4: Self-Hosted Deployment
- [ ] Add Ollama/vLLM adapter
- [ ] Deploy fine-tuned model
- [ ] Cost comparison dashboard

### Phase 5: Polish
- [ ] Whisper API upgrade option
- [ ] Voice response (Text-to-Speech)
- [ ] Improved undo functionality

---

## File Structure (Implemented)

```
src/
├── lib/
│   ├── ai/
│   │   ├── types.ts              # TypeScript interfaces (ToolCall, WorkoutContext, AIProvider)
│   │   ├── providerManager.ts    # Multi-provider registry and switching
│   │   ├── assistant.ts          # Main entry point (processVoiceCommand)
│   │   ├── context.ts            # Build workout context for LLM
│   │   ├── providers/
│   │   │   └── openai.ts         # OpenAI adapter (GPT-4o-mini)
│   │   ├── tools/
│   │   │   ├── definitions.ts    # Zod schemas, OpenAI tools, system prompt
│   │   │   └── executor.ts       # Execute tool calls against workout store
│   │   └── speech/
│   │       └── webSpeech.ts      # Browser Web Speech API wrapper
│   └── components/
│       └── ai/
│           ├── VoiceFAB.svelte   # Floating microphone button
│           └── VoiceModal.svelte # Voice input modal with states
├── routes/
│   └── api/
│       └── ai/
│           └── openai/
│               ├── +server.ts        # POST: Parse voice transcript
│               └── status/+server.ts # GET: Check API availability
```

---

## Provider Architecture

The system supports multiple AI providers through a common interface:

```typescript
interface AIProvider {
  name: ProviderId;
  parseWorkoutCommand(transcript: string, context: WorkoutContext): Promise<ToolCall>;
  isAvailable(): Promise<boolean>;
}
```

### Current Providers

| Provider | Model | Cost per 1K requests | Status |
|----------|-------|---------------------|--------|
| OpenAI | GPT-4o-mini | ~$0.15 | ✅ Implemented |
| Claude | Haiku | ~$0.25 | Planned |
| Gemini | Flash | ~$0.08 | Planned |
| Local | Llama/Mistral 7B | ~$0.01 | Future |

### Adding a New Provider

1. Create adapter in `src/lib/ai/providers/`:
```typescript
export class NewProvider implements AIProvider {
  name = 'new' as const;

  async parseWorkoutCommand(transcript: string, context: WorkoutContext): Promise<ToolCall> {
    // Call your API endpoint
  }

  async isAvailable(): Promise<boolean> {
    // Check if configured
  }
}
```

2. Register in `src/lib/ai/assistant.ts`:
```typescript
aiManager.register(new NewProvider());
```

3. Create server endpoint in `src/routes/api/ai/new/+server.ts`
