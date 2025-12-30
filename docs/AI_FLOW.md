# AI Voice Assistant - Technical Flow

This document traces the complete code flow for AI voice commands, from user interaction to response.

---

## Architecture Overview

```
User Speech
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  VoiceFAB (src/lib/components/ai/VoiceFAB.svelte)               │
│  - Floating action button on all authenticated pages            │
│  - Click opens VoiceModal                                       │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  VoiceModal (src/lib/components/ai/VoiceModal.svelte)           │
│  - Web Speech API captures audio → transcript                   │
│  - Calls onCommand(transcript) from AppShell                    │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  AppShell.handleVoiceCommand (src/lib/components/AppShell.svelte)│
│  - Calls processGlobalCommand(transcript)                       │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  globalAssistant.processGlobalCommand                           │
│  (src/lib/ai/globalAssistant.ts)                                │
│  - Builds unified context                                       │
│  - POSTs to /api/ai/global                                      │
│  - Executes returned tool call                                  │
└─────────────────────────────────────────────────────────────────┘
    │
    ├──────────────────────────────────────┐
    ▼                                      ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│  Context Builder        │    │  /api/ai/global                 │
│  (src/lib/ai/context/)  │    │  (src/routes/api/ai/global/)    │
│  - Workout state        │    │  - Sends to OpenAI              │
│  - Training block       │    │  - Returns tool call            │
│  - User stats           │    └─────────────────────────────────┘
└─────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Tool Executors                                                 │
│  - queryExecutor.ts (read-only queries)                         │
│  - scheduleExecutor.ts (day swaps, skips)                       │
│  - blockExecutor.ts (modify exercises/sets)                     │
│  - executor.ts (in-workout: log sets, swap exercises)           │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Response → VoiceModal → User sees result                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/components/ai/VoiceFAB.svelte` | Floating mic button |
| `src/lib/components/ai/VoiceModal.svelte` | Speech capture & response UI |
| `src/lib/components/AppShell.svelte` | Global FAB placement, command handler |
| `src/lib/ai/globalAssistant.ts` | Main entry point, tool routing |
| `src/lib/ai/context/index.ts` | Build context for AI |
| `src/lib/ai/tools/definitions.ts` | Tool schemas, OpenAI function defs |
| `src/lib/ai/tools/executor.ts` | Workout tool execution |
| `src/lib/ai/tools/queryExecutor.ts` | Query tool execution |
| `src/lib/ai/tools/scheduleExecutor.ts` | Schedule tool execution |
| `src/lib/ai/tools/blockExecutor.ts` | Block modification execution |
| `src/lib/ai/speech/webSpeech.ts` | Browser Speech API wrapper |
| `src/routes/api/ai/global/+server.ts` | Server-side OpenAI endpoint |
| `src/lib/stores/trainingBlockStore.svelte.ts` | Training block data for context |

---

## Test Case 1: Query from Home Screen

**User says:** "How many chest exercises do I have this week?"

### Step 1: VoiceFAB Click
```
File: src/lib/components/AppShell.svelte:54
```
```svelte
{#if auth.isAuthenticated && aiAvailable}
  <VoiceFAB onclick={() => (showVoiceModal = true)} />
{/if}
```
- User clicks FAB → `showVoiceModal = true`

### Step 2: VoiceModal Opens, Speech Captured
```
File: src/lib/components/ai/VoiceModal.svelte:68-84
```
```typescript
async function startListening() {
  // Request microphone permission
  const hasPermission = await requestMicrophonePermission();
  if (recognition) {
    recognition.start();  // Starts Web Speech API
  }
}
```

### Step 3: Speech Result Received
```
File: src/lib/components/ai/VoiceModal.svelte:50-57
```
```typescript
function handleSpeechResult(result: SpeechResult) {
  if (result.isFinal) {
    transcript = result.transcript;  // "How many chest exercises do I have this week?"
    processTranscript(result.transcript);
  }
}
```

### Step 4: Process Transcript
```
File: src/lib/components/ai/VoiceModal.svelte:93-117
```
```typescript
async function processTranscript(text: string) {
  status = 'processing';
  const result = await onCommand(text);  // Calls AppShell.handleVoiceCommand
  if (result.success) {
    resultMessage = result.message;
    status = 'success';
  }
}
```

### Step 5: AppShell Handles Command
```
File: src/lib/components/AppShell.svelte:29-40
```
```typescript
async function handleVoiceCommand(transcript: string) {
  const result = await processGlobalCommand(transcript);
  return {
    success: result.success,
    toolCall: result.toolCall,
    message: result.message
  };
}
```

### Step 6: Global Assistant Processes Command
```
File: src/lib/ai/globalAssistant.ts:198-252
```
```typescript
export async function processGlobalCommand(transcript: string) {
  // 1. Build context
  const context = await buildUnifiedContext();

  // 2. Call AI provider
  const response = await fetch('/api/ai/global', {
    method: 'POST',
    body: JSON.stringify({ transcript, context })
  });

  const { toolCall } = await response.json();
  // toolCall = { tool: 'getWeeklyVolume', parameters: { muscleGroup: 'chest' } }

  // 3. Execute tool
  const result = await executeGlobalToolCall(toolCall, context);
  return result;
}
```

### Step 7: Build Unified Context
```
File: src/lib/ai/context/index.ts:71-109
```
```typescript
export async function buildUnifiedContext(): Promise<UnifiedContext> {
  // Check if in workout
  const isInWorkout = typeof window !== 'undefined' &&
    window.location.pathname.match(/\/blocks\/[^/]+$/);

  return {
    type: isInWorkout ? 'workout' : 'global',
    activeWorkout: isInWorkout ? buildWorkoutContext() : null,
    trainingBlock: trainingBlockStore.block,  // From trainingBlockStore
    userStats: null
  };
}
```

### Step 8: Server-Side OpenAI Call
```
File: src/routes/api/ai/global/+server.ts:54-101
```
```typescript
export const POST: RequestHandler = async ({ request }) => {
  const openai = getOpenAIClient();
  const { transcript, context } = await request.json();

  // Get tools for this context (query tools always available)
  const availableTools = getToolsForContext(context);
  const systemPrompt = getSystemPromptForContext(context);

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildUserMessage(transcript, context) }
    ],
    tools: availableTools.map(tool => ({ type: 'function', function: tool })),
    tool_choice: 'required'
  });

  // Parse response
  const toolCall = parseOpenAIFunctionCall(response.choices[0].message.tool_calls[0]);
  return json({ success: true, toolCall });
};
```

### Step 9: OpenAI Returns Tool Call
OpenAI analyzes the transcript and context, returns:
```json
{
  "tool": "getWeeklyVolume",
  "parameters": {
    "muscleGroup": "chest"
  }
}
```

### Step 10: Execute Query Tool
```
File: src/lib/ai/globalAssistant.ts:120-138
```
```typescript
async function executeQueryTool(tool, params) {
  switch (tool) {
    case 'getWeeklyVolume':
      return executeGetWeeklyVolume(params);
    // ...
  }
}
```

### Step 11: Query Executor Fetches Data
```
File: src/lib/ai/tools/queryExecutor.ts:54-93
```
```typescript
export async function executeGetWeeklyVolume(params) {
  const { muscleGroup } = params;

  // Query Supabase for logged sets in past 7 days
  const { data } = await supabase
    .from('logged_sets')
    .select('exercise:exercises(primary_muscle)')
    .eq('completed', true)
    .gte('logged_at', sevenDaysAgo.toISOString());

  // Count sets per muscle
  const volumeByMuscle = new Map();
  data.forEach(set => {
    const muscle = set.exercise?.primary_muscle;
    if (muscle) {
      volumeByMuscle.set(muscle, (volumeByMuscle.get(muscle) || 0) + 1);
    }
  });

  // Filter for requested muscle if specified
  if (muscleGroup) {
    const sets = volumeByMuscle.get(muscleGroup) || 0;
    return {
      success: true,
      message: `You have ${sets} sets for ${muscleGroup} this week.`
    };
  }

  // Return all muscles
  return {
    success: true,
    message: formatVolumeResponse(volumeByMuscle)
  };
}
```

### Step 12: Response Returns to User
```
Result flows back:
queryExecutor → globalAssistant → AppShell → VoiceModal

VoiceModal displays:
"You have 12 sets for chest this week."

User can tap mic to ask follow-up or close modal.
```

---

## Test Case 2: Swap Exercise During Workout

**User says:** "Swap incline press with flat bench"

### Step 1-5: Same as Test Case 1
Speech captured, transcript processed, globalAssistant called.

### Step 6: Context Detection
```
File: src/lib/ai/context/index.ts:71-80
```
```typescript
// URL is /blocks/abc123 → in workout context
const isInWorkout = window.location.pathname.match(/\/blocks\/[^/]+$/);
// isInWorkout = true

return {
  type: 'workout',
  activeWorkout: buildWorkoutContext(),  // Current exercise, sets, etc.
  trainingBlock: trainingBlockStore.block
};
```

### Step 7: Workout Context Built
```
File: src/lib/ai/context/index.ts:24-52
```
```typescript
function buildWorkoutContext() {
  return {
    currentExercise: {
      name: workout.exercises[currentIndex].slot.exercise.name,
      setNumber: currentSetIndex + 1,
      totalSets: workout.exercises[currentIndex].sets.length
    },
    exercises: workout.exercises.map(ex => ({
      name: ex.slot.exercise.name,
      completedSets: ex.sets.filter(s => s.completed).length,
      totalSets: ex.sets.length
    })),
    // ...
  };
}
```

### Step 8: OpenAI Returns swapExercise Tool
```json
{
  "tool": "swapExercise",
  "parameters": {
    "targetExercise": "incline press",
    "newExercise": "flat bench"
  }
}
```

### Step 9: Tool Category Detection
```
File: src/lib/ai/globalAssistant.ts:58-86
```
```typescript
async function executeGlobalToolCall(toolCall, context) {
  const category = getToolCategory(toolCall.tool);
  // category = 'workout'

  switch (category) {
    case 'workout':
      if (!context.activeWorkout) {
        return { success: false, message: "You're not in an active workout." };
      }
      return executeWorkoutTool(toolCall);
  }
}
```

### Step 10: Workout Executor Handles Swap
```
File: src/lib/ai/tools/executor.ts:130-193
```
```typescript
async function executeSwapExercise(params) {
  // Find target exercise by name
  if (params.targetExercise) {
    const foundIndex = workout.exercises.findIndex(
      ex => ex.slot.exercise?.name.toLowerCase().includes(params.targetExercise.toLowerCase())
    );

    if (foundIndex === -1) {
      return { success: false, message: `Couldn't find "${params.targetExercise}" in today's workout.` };
    }
    exerciseIndex = foundIndex;
  }

  // Fuzzy match new exercise
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', `%${params.newExercise}%`)
    .limit(1);

  // Call workout store to swap
  const success = await workout.swapExercise(exerciseIndex, exercises[0], false);

  return {
    success,
    message: success ? `Swapped Incline Press to Flat Bench Press` : 'Failed to swap exercise'
  };
}
```

### Step 11: Workout Store Updates UI
```
File: src/lib/stores/workoutStore.svelte.ts (swapExercise method)
```
- Updates exercise in state
- Persists to database if permanent
- UI reactively updates via Svelte 5 runes

### Step 12: User Sees Confirmation
```
VoiceModal displays:
"Swapped Incline Press to Flat Bench Press"

Workout page shows updated exercise card.
```

---

## Test Case 3: Error Case - Workout Command from Home

**User says:** "185 for 8" (from home screen, not in workout)

### Steps 1-6: Same flow
Context is built with `type: 'global'` (not in workout).

### Step 7: OpenAI Returns logSet Tool
```json
{
  "tool": "logSet",
  "parameters": { "weight": 185, "reps": 8 }
}
```

### Step 8: Tool Execution Blocked
```
File: src/lib/ai/globalAssistant.ts:77-86
```
```typescript
switch (category) {
  case 'workout':
    if (!context.activeWorkout) {
      return {
        success: false,
        message: "You're not in an active workout. Start a workout first."
      };
    }
}
```

### Step 9: Error Shown to User
```
VoiceModal shows error state:
"You're not in an active workout. Start a workout first."

User can try again or close modal.
```

---

## Tool Categories Reference

| Category | Tools | When Available |
|----------|-------|----------------|
| **Workout** | logSet, skipExercise, swapExercise, completeWorkout, addExercise, undoLast | In active workout |
| **Schedule** | swapWorkoutDays, skipDay, rescheduleDay | Has training block |
| **Block** | addSetsToExercise, removeSetsFromExercise, changeRepRange, modifyBlockExercise | Has training block |
| **Query** | getTodaysWorkout, getWeeklyVolume, getPersonalRecords, getStats, getBlockProgress | Always |

---

## Context-Aware Tool Selection

```
File: src/lib/ai/tools/definitions.ts:361-379
```
```typescript
export function getToolsForContext(context: UnifiedContext): OpenAIFunctionDef[] {
  const tools: OpenAIFunctionDef[] = [];

  // Query tools always available
  tools.push(...queryOpenAITools);

  // Schedule + block tools if has training block
  if (context.trainingBlock) {
    tools.push(...scheduleOpenAITools);
    tools.push(...blockOpenAITools);
  }

  // Workout tools only in active workout
  if (context.type === 'workout' && context.activeWorkout) {
    tools.push(...openAITools);
  }

  return tools;
}
```

---

## Error Handling

| Location | Error Type | Handling |
|----------|------------|----------|
| `VoiceModal` | Speech not supported | Show text input fallback |
| `VoiceModal` | Mic permission denied | Show error, offer retry |
| `globalAssistant` | API call fails | Return error message |
| `/api/ai/global` | OpenAI 429 rate limit | Return user-friendly message |
| `/api/ai/global` | OpenAI 401 invalid key | Return config error message |
| Tool executors | Exercise not found | Return specific error |
| Tool executors | No active workout | Block workout tools |

---

## Adding New Tools

1. **Define schema** in `src/lib/ai/tools/[category]Tools.ts`:
   ```typescript
   export const myToolSchema = z.object({
     param1: z.string().describe('Description for AI')
   });
   ```

2. **Add OpenAI function def** in same file:
   ```typescript
   export const [category]OpenAITools = [{
     name: 'myTool',
     description: 'What this tool does',
     parameters: { type: 'object', properties: {...}, required: [...] }
   }];
   ```

3. **Add to type union** in `src/lib/ai/types.ts`:
   ```typescript
   export type ToolName = ... | 'myTool';
   ```

4. **Implement executor** in `src/lib/ai/tools/[category]Executor.ts`

5. **Add to router** in `src/lib/ai/globalAssistant.ts`

6. **Update system prompt** in `definitions.ts` with example pattern

---

*Last updated: 2025-12-30*
