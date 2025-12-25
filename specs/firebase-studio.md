# MyLiftPal - Firebase Studio App Description

## App Overview

Build a Progressive Web App called **MyLiftPal** for tracking hypertrophy (muscle-building) weight training workouts. The app helps users plan training cycles, log workouts, and track weekly muscle volume to optimize muscle growth.

This is a personal fitness app for myself and a few friends (non-commercial).

---

## Core Concept

The app follows a **training block** structure:
- A training block is a 4-6 week training block
- Each week has scheduled workout days (e.g., Push/Pull/Legs)
- Each workout day has assigned exercises
- Users log their sets, reps, and weight for each exercise
- The app tracks total weekly "volume" (sets) per muscle group

---

## User Flows

### Flow 1: Sign Up / Sign In
- Firebase Authentication with email/password
- After sign in, user sees their dashboard with active training block or option to create one

### Flow 2: Create a Training Block
1. User taps "New Training Block"
2. Enters name (e.g., "Summer Cut") and duration (4-6 weeks)
3. Sets how many days per week they'll train (3-6 days)
4. For each day, they:
   - Name it (e.g., "Push Day", "Legs")
   - Add exercises from the exercise library
   - Set starting sets per exercise (typically 3-4)
   - Set how many sets to add per week (0, 0.5, or 1)
5. As they add exercises, a **volume indicator** shows sets per muscle group with color coding:
   - 🟢 Green: Good volume (10-16 sets/week)
   - 🟡 Yellow: Low or approaching too high
   - 🔴 Red: Too low or too high
6. Shows estimated workout time for Week 1 and final week
7. Save and start the training block

### Flow 3: Log a Workout
1. User opens the app and sees today's workout
2. Top bar shows compact volume summary: "Chest 🟢 12/16 | Triceps 🟡 8/12"
3. Each exercise shows:
   - Exercise name with muscle tags
   - What they did last time: "Last: 80 lbs × 12, 12, 11, 10"
   - Recommended today: "85 lbs × 8-10 reps, 4 sets"
4. For each set, user enters:
   - Weight (number input, pre-filled with recommendation)
   - Reps (number input)
   - Taps checkmark to complete the set
5. After finishing an exercise, optional pump rating (none/mild/moderate/great)
6. After all exercises, user completes workout with overall feedback:
   - How was the pump? (rating)
   - Soreness from last session? (rating)
   - How hard did it feel? (too easy / just right / too hard)
7. This feedback adjusts future recommendations

### Flow 4: Browse Exercise Library
1. User can view all exercises
2. Search by name or filter by:
   - Equipment (barbell, dumbbell, cable, machine, bodyweight)
   - Muscle group (chest, back, shoulders, etc.)
3. Each exercise shows:
   - Name and equipment type
   - Primary muscle (e.g., Chest)
   - Secondary muscles with contribution (e.g., Triceps 50%, Front Delts 30%)
   - Suggested rep range (e.g., 8-12)
   - Link to YouTube video (optional)
4. Users can add custom exercises that only they can see

### Flow 5: Download for Offline Use
1. User taps "Download Today" button
2. App caches today's workout data locally
3. User can log workout without internet
4. When back online, data syncs automatically

---

## Data Structure

### Users Collection
```
users/{userId}
  - displayName: string
  - email: string
  - weightUnit: "lbs" | "kg"
  - defaultRestSeconds: number (default: 90)
  - createdAt: timestamp
```

### Muscle Groups Collection (shared/read-only)
```
muscleGroups/{muscleId}
  - id: string (e.g., "chest", "side_delts", "quads")
  - displayName: string (e.g., "Chest", "Side Delts", "Quads")
  - category: "upper" | "lower" | "core"
  - color: string (for UI badges)
  - mv: number (maintenance volume, ~6)
  - mev: number (minimum effective volume, ~10)
  - mav: number (maximum adaptive volume, ~16)
  - mrv: number (maximum recoverable volume, ~22)
```

Muscle groups to include:
- Upper: chest, back_lats, back_upper, front_delts, side_delts, rear_delts, biceps, triceps, forearms, traps
- Lower: quads, hamstrings, glutes, calves
- Core: abs, obliques

### Exercises Collection
```
exercises/{exerciseId}
  - name: string
  - aliases: string[] (alternative names for search)
  - equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight"
  - primaryMuscle: string (muscleGroup id)
  - secondaryMuscles: array of { muscle: string, weight: number (0-1) }
  - videoUrl: string (optional YouTube link)
  - defaultRepMin: number
  - defaultRepMax: number
  - defaultRestSeconds: number
  - workSeconds: number (time per set, for estimation)
  - isCore: boolean (true = shared, false = user-created)
  - createdBy: string (userId, null for core exercises)
```

Include these starter exercises:
- **Chest**: Barbell Bench Press, Incline Dumbbell Press, Cable Flye, Pec Deck, Dips
- **Back**: Barbell Row, Lat Pulldown, Seated Cable Row, Pull-Up, Dumbbell Row
- **Shoulders**: Overhead Press, Dumbbell Lateral Raise, Cable Lateral Raise, Face Pull, Reverse Pec Deck
- **Arms**: Barbell Curl, Dumbbell Curl, Hammer Curl, Tricep Pushdown, Skull Crusher
- **Legs**: Barbell Squat, Leg Press, Leg Extension, Romanian Deadlift, Leg Curl, Hip Thrust
- **Core**: Cable Crunch, Hanging Leg Raise

Each exercise should have appropriate primary and secondary muscles with weights. For example:
- Barbell Bench Press: primary = chest, secondary = [{muscle: "triceps", weight: 0.5}, {muscle: "front_delts", weight: 0.3}]

### Training Blocks Collection
```
users/{userId}/trainingBlocks/{training blockId}
  - name: string
  - totalWeeks: number (4-6)
  - currentWeek: number
  - currentDay: number
  - status: "active" | "completed" | "paused"
  - timeBudgetMinutes: number (optional)
  - startedAt: timestamp
  - completedAt: timestamp (optional)
```

### Workout Days Collection
```
users/{userId}/trainingBlocks/{training blockId}/workoutDays/{dayId}
  - dayNumber: number (1, 2, 3...)
  - name: string (e.g., "Push Day")
  - targetMuscles: string[] (for quick reference)
  - timeBudgetMinutes: number (optional override)
```

### Exercise Slots Collection
```
users/{userId}/trainingBlocks/{training blockId}/workoutDays/{dayId}/exerciseSlots/{slotId}
  - exerciseId: string (reference to exercises collection)
  - slotOrder: number
  - baseSets: number (starting sets, week 1)
  - setProgression: number (sets to add per week, e.g., 0.5)
  - repRangeMin: number
  - repRangeMax: number
  - restSeconds: number (optional override)
  - supersetGroup: string (optional, for pairing exercises)
```

### Workout Sessions Collection
```
users/{userId}/workoutSessions/{sessionId}
  - training blockId: string
  - workoutDayId: string
  - weekNumber: number
  - scheduledDate: timestamp
  - startedAt: timestamp
  - completedAt: timestamp
  - status: "scheduled" | "in_progress" | "completed" | "skipped"
  - durationMinutes: number
  - overallPump: "none" | "mild" | "moderate" | "great" | "excessive"
  - overallSoreness: "none" | "mild" | "moderate" | "severe"
  - workloadRating: "too_easy" | "easy" | "just_right" | "hard" | "too_hard"
```

### Logged Sets Collection
```
users/{userId}/workoutSessions/{sessionId}/loggedSets/{setId}
  - exerciseSlotId: string
  - exerciseId: string
  - setNumber: number
  - targetWeight: number
  - actualWeight: number
  - targetReps: number
  - actualReps: number
  - weightUnit: "lbs" | "kg"
  - rir: number (reps in reserve, 0-5)
  - completed: boolean
  - loggedAt: timestamp
```

---

## Key Features to Implement

### 1. Volume Tracking (Most Important)
Calculate weekly sets per muscle group:
- Direct sets: Count sets where exercise's primaryMuscle matches
- Indirect sets: Count sets × secondaryMuscle weight (e.g., bench press gives triceps 0.5 sets)
- Total = direct + indirect
- Compare to muscle group's mev/mav/mrv for color coding

Display as compact bar on workout screen showing each muscle with emoji and count.

### 2. Time Estimation
Calculate workout duration:
- For each exercise: sets × (workSeconds + restSeconds)
- Account for set progression (Week 1 has fewer sets than Week 6)
- Show "Week 1: ~45 min → Week 6: ~75 min" during setup
- Warn if exceeds time budget

### 3. Progression Logic
When suggesting weight/reps for next session:
- If user hit top of rep range on most sets → increase weight by 5 lbs, reset to bottom of rep range
- If within rep range → try to add 1 rep
- If below rep range → keep weight same
- RIR (reps in reserve) decreases each week: Week 1 = 4 RIR, Week 4 = 1 RIR
- Deload week: reduce weight 15%, cut sets in half

### 4. Offline Support (PWA)
- Cache today's workout in IndexedDB
- Allow logging without internet
- Sync when back online
- Show offline indicator

### 5. Voice Logging (Optional/Future)
- Tap mic button to speak: "85 for 12"
- App parses and logs the set
- Can ask "what did I do last time?"

---

## UI Requirements

### Theme
Dark theme with Emerald Green accent:
- Background: `#0a120f` (very dark green-black)
- Cards/Panels: `#0f1a16` (dark green-gray)
- Inputs: `#162420` (slightly lighter)
- Accent/Primary: `#10b981` (emerald green)
- Accent Hover: `#34d399` (lighter emerald)
- Success/Completed: `#22c55e` (green)
- Warning: `#eab308` (yellow)
- Error: `#ef4444` (red)
- Text Primary: `#ffffff` (white)
- Text Secondary: `#a1a1aa` (gray)
- Text Muted: `#71717a` (darker gray)

### Future Feature: User Theme Customization
Later version will allow users to select their accent color in profile settings. Store `accentColor` in user profile. Options will include: emerald, blue, cyan, indigo, orange, slate.

### Layout
- Mobile-first design
- Bottom navigation: Home, Training Blocks, Exercises, Settings
- Workout logging should be thumb-friendly with large tap targets

### Components Needed
- ExerciseCard: Shows exercise with sets, expandable
- SetRow: Weight input, reps input, completion checkbox
- VolumeBar: Compact muscle volume indicators
- MuscleTag: Colored badge for muscle groups
- TimeEstimate: Shows duration projection

---

## Technical Notes

- Use Firebase Authentication for sign in
- Use Cloud Firestore for database
- Enable offline persistence in Firestore
- Deploy as PWA with manifest and service worker
- Use SvelteKit or Next.js as framework (or whatever Firebase Studio suggests)

---

## Summary Prompt for Firebase Studio

"Create a PWA called MyLiftPal for tracking hypertrophy weight training. Users create training blocks (4-6 week training blocks) with scheduled workout days. Each day has exercises from a library. When logging workouts, users enter weight and reps for each set. The app tracks weekly volume (sets) per muscle group with color-coded indicators showing if they're in the optimal range. Include progression logic that suggests weight increases when users hit their rep targets. Support offline mode for gym use. 

Use a dark theme with Emerald Green accent: background #0a120f, cards #0f1a16, accent color #10b981 (emerald green), success #22c55e, warning #eab308, error #ef4444, white text. Mobile-first design with bottom navigation."
