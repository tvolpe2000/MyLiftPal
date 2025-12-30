# AI Voice Assistant - Setup Guide

This guide covers setting up the AI voice logging feature for IronAthena.

## Quick Start

### 1. Get an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** in the sidebar
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)

### 2. Add to Environment

Add to your `.env` file:

```env
OPENAI_API_KEY=sk-your-key-here
```
curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY_HERE"
### 3. Restart Development Server

```bash
npm run dev
```

The microphone FAB will now appear on ALL authenticated pages.

---

## Usage

### Starting Voice Input

1. Navigate to any page (home, workouts, exercises, etc.)
2. Tap the **microphone button** (bottom right)
3. Grant microphone permission when prompted
4. Speak your command
5. Wait for confirmation

### Supported Commands

#### During Active Workout
| Command Type | Example Phrases |
|-------------|-----------------|
| **Log a set** | "185 for 8", "180 pounds, 8 reps, 2 in reserve" |
| **Same weight** | "Same weight, got 7" |
| **Skip exercise** | "Skip this one", "Skip, elbow hurts" |
| **Swap exercise** | "Do cable flyes instead", "Swap to dumbbell press" |
| **Add exercise** | "Add some curls", "Throw in 4 sets of lateral raises" |
| **Complete workout** | "I'm done", "Finish workout" |
| **Undo** | "Undo that", "Wait, that was 8 not 6" |

#### Anytime (Global Commands)
| Command Type | Example Phrases |
|-------------|-----------------|
| **Today's workout** | "What's my workout today?", "What am I doing today?" |
| **Weekly volume** | "What's my volume for chest?", "How much back volume?" |
| **Personal records** | "Show me my PRs", "How much did I bench?" |
| **Stats** | "Show me my stats", "How many workouts this week?" |
| **Block progress** | "How's my progress?", "Where am I in my block?" |
| **Swap days** | "Swap today with tomorrow", "Switch day 1 and day 3" |
| **Skip day** | "Skip today", "Skip leg day" |
| **Reschedule** | "Do leg day instead", "Switch to day 3" |
| **Add sets** | "Add a set to bench press", "More sets on squats" |
| **Remove sets** | "Remove a set from curls" |
| **Change reps** | "Change squats to 6-8 reps" |
| **Swap exercises** | "Replace bench with dumbbell press" |

### Text Input Fallback

If speech recognition isn't working:
1. Tap **"Type instead"** at the bottom of the modal
2. Type your command
3. Press **Submit**

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PUBLIC_AI_ENABLED` | No | Set to `false` to disable AI features |
| `PUBLIC_AI_PROVIDER` | No | Default: `openai` |

Example `.env`:
```env
# Supabase (required for app)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Voice Assistant
OPENAI_API_KEY=sk-your-key-here
```

---

## Cost Estimation

The AI uses **GPT-4o-mini**, OpenAI's most cost-effective model with function calling:

| Usage | Approximate Cost |
|-------|-----------------|
| 100 voice commands/month | ~$0.02 |
| 1,000 voice commands/month | ~$0.15 |
| 10,000 voice commands/month | ~$1.50 |

Typical workout: 15-20 sets = 15-20 potential voice commands = **~$0.003/workout**

---

## Troubleshooting

### "OpenAI API key not configured"

**Cause:** The `OPENAI_API_KEY` environment variable is missing or empty.

**Fix:**
1. Add `OPENAI_API_KEY=sk-...` to your `.env` file
2. Restart the development server (`npm run dev`)

### "Microphone permission denied"

**Cause:** Browser blocked microphone access.

**Fix:**
1. Click the lock/info icon in browser address bar
2. Find "Microphone" permission
3. Set to "Allow"
4. Refresh the page

### "No speech detected"

**Cause:** Microphone not picking up audio or silence detected.

**Fix:**
1. Check microphone is working (test in another app)
2. Speak clearly within 5 seconds of the modal opening
3. Try the "Type instead" fallback

### "Speech not supported"

**Cause:** Browser doesn't support Web Speech API.

**Fix:**
- Use Chrome, Edge, or Safari (Firefox has limited support)
- Use the "Type instead" text fallback

### Voice command not recognized correctly

**Cause:** AI misunderstood the command.

**Fix:**
1. Speak more clearly with pauses
2. Use explicit phrases: "185 pounds for 8 reps"
3. Include RIR explicitly: "2 in reserve" or "RIR 2"
4. Use text input for complex commands

---

## Browser Support

| Browser | Speech Recognition | Notes |
|---------|-------------------|-------|
| Chrome | ✅ Full | Best support |
| Edge | ✅ Full | Uses Chrome engine |
| Safari | ✅ Full | iOS and macOS |
| Firefox | ⚠️ Partial | May require flag |
| Opera | ✅ Full | Uses Chrome engine |

All browsers support the **text input fallback**.

---

## Security Notes

- API key is **server-side only** (never exposed to browser)
- Voice transcripts are sent to OpenAI for processing
- No audio is stored; only text transcripts are processed
- All AI-triggered mutations use existing auth checks

See `SECURITY.md` for full security considerations.

---

## Development

### Testing Without API Key

The app builds and runs without `OPENAI_API_KEY`. The voice FAB will appear but:
- Status endpoint returns `available: false`
- POST endpoint returns error when called
- Users can still use text input (will fail at API level)

### Adding Provider Selection UI

Future: Add provider dropdown to Settings page:

```svelte
<select bind:value={$settings.aiProvider}>
  <option value="openai">OpenAI (GPT-4o-mini)</option>
  <option value="claude">Claude (Haiku)</option>
  <option value="gemini">Gemini (Flash)</option>
</select>
```

### Logging for Fine-Tuning

The server logs all successful parses:
```json
{
  "timestamp": "2025-12-29T...",
  "transcript": "185 for 8, 2 in reserve",
  "toolCall": { "tool": "logSet", "parameters": { "weight": 185, "reps": 8, "rir": 2 } },
  "provider": "openai",
  "latencyMs": 450
}
```

Future: Store in database for fine-tuning dataset.

---

## Architecture Reference

See `AI_ASSISTANT.md` for:
- Full architecture diagrams
- Tool definitions
- Provider interface
- Implementation phases
