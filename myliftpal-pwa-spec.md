# MyLiftPal: Progressive Hypertrophy Training PWA

## Technical Specification Document

**Version:** 1.0  
**Last Updated:** December 2024  
**Purpose:** Vibe coding reference for Claude Code / Gemini CLI

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [Data Models (TypeScript)](#4-data-models-typescript)
5. [Feature Specifications](#5-feature-specifications)
6. [UI/UX Guidelines](#6-uiux-guidelines)
7. [Progression Algorithm](#7-progression-algorithm)
8. [Development Phases](#8-development-phases)
9. [Vibe Coding Prompts](#9-vibe-coding-prompts)

---

## 1. Project Overview

### 1.1 Problem Statement

The RP Hypertrophy App lacks:
- Visibility into weekly volume per muscle group (you can hit "legs" daily but undertrain quads)
- Time estimation that accounts for set increases across a training block
- Offline capability for gym use
- Transparent progression reasoning
- Flexible exercise library that matches real gym equipment names

### 1.2 Solution

A PWA that tracks hypertrophy training with:
- Real-time volume indicators per muscle group (color-coded MEV/MAV/MRV)
- Time projections showing Week 1 → Week 6 estimates
- "Download Today" offline mode
- Voice logging for hands-free set entry
- User-extensible exercise library with aliases

### 1.3 Target Users

- Personal use + small friend group (non-commercial)
- Intermediate to advanced lifters familiar with periodization concepts
- Mobile-first usage during workouts, desktop for training block planning

### 1.4 Feature Priority

| Priority | Feature | Description |
|----------|---------|-------------|
| 1 | Volume Tracking | Color-coded weekly sets per muscle group |
| 2 | Offline Support | "Download Today" caching pattern |
| 3 | Voice Logging | Hands-free set entry with conversational Q&A |
| 4 | Photo Import | OCR for handwritten workout logs |
| 5 | Progression Display | Explain "why" behind recommendations |

---

## 2. Tech Stack

### 2.1 Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | SvelteKit 2.x | Fast, minimal boilerplate, great PWA support |
| Styling | Tailwind CSS 3.x | Rapid UI development |
| Database | Supabase (PostgreSQL) | Auth, RLS, real-time subscriptions |
| Offline Storage | Dexie.js (IndexedDB) | Local caching for "Download Today" |
| Hosting | Vercel | SvelteKit-optimized, free tier |
| PWA | @vite-pwa/sveltekit | Service worker, manifest generation |
| Voice | Web Speech API | Browser-native speech recognition |
| Photo OCR | Tesseract.js | Client-side text extraction |

### 2.2 Project Structure

```
myliftpal/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable Svelte components
│   │   ├── stores/            # Svelte stores for state
│   │   ├── db/
│   │   │   ├── supabase.ts    # Supabase client
│   │   │   └── offline.ts     # Dexie.js IndexedDB
│   │   ├── utils/
│   │   │   ├── progression.ts # RP-style progression logic
│   │   │   ├── volume.ts      # Volume calculations
│   │   │   └── time.ts        # Workout time estimation
│   │   └── types/
│   │       └── index.ts       # TypeScript interfaces
│   ├── routes/
│   │   ├── +layout.svelte     # Root layout with nav
│   │   ├── +page.svelte       # Home / current workout
│   │   ├── training blocks/
│   │   │   ├── +page.svelte   # List training blocks
│   │   │   ├── new/+page.svelte
│   │   │   └── [id]/+page.svelte
│   │   ├── workout/
│   │   │   └── [dayId]/+page.svelte
│   │   ├── exercises/
│   │   │   └── +page.svelte   # Exercise library
│   │   └── settings/
│   │       └── +page.svelte
│   ├── app.html
│   └── service-worker.ts
├── static/
│   └── icons/                 # PWA icons
├── supabase/
│   └── migrations/            # SQL migrations
├── .env
├── svelte.config.js
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

### 2.3 Environment Variables

```env
# .env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 3. Database Schema

### 3.1 Supabase Tables

```sql
-- ============================================
-- USERS (handled by Supabase Auth)
-- ============================================
-- auth.users is managed by Supabase
-- We extend with a profiles table

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  default_rest_seconds INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MUSCLE GROUPS
-- ============================================
CREATE TABLE muscle_groups (
  id TEXT PRIMARY KEY,  -- e.g., 'chest', 'side_delts'
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('upper', 'lower', 'core')),
  color TEXT NOT NULL,  -- Tailwind color class
  default_mv INTEGER DEFAULT 6,   -- Maintenance Volume
  default_mev INTEGER DEFAULT 10, -- Minimum Effective Volume
  default_mav INTEGER DEFAULT 16, -- Maximum Adaptive Volume
  default_mrv INTEGER DEFAULT 22, -- Maximum Recoverable Volume
  sort_order INTEGER DEFAULT 0
);

-- Seed muscle groups
INSERT INTO muscle_groups (id, display_name, category, color, default_mv, default_mev, default_mav, default_mrv, sort_order) VALUES
  ('chest', 'Chest', 'upper', 'red', 6, 10, 16, 22, 1),
  ('back_lats', 'Lats', 'upper', 'blue', 6, 10, 16, 22, 2),
  ('back_upper', 'Upper Back', 'upper', 'blue', 6, 8, 14, 20, 3),
  ('front_delts', 'Front Delts', 'upper', 'orange', 0, 0, 8, 12, 4),
  ('side_delts', 'Side Delts', 'upper', 'orange', 8, 12, 20, 26, 5),
  ('rear_delts', 'Rear Delts', 'upper', 'orange', 6, 8, 16, 22, 6),
  ('biceps', 'Biceps', 'upper', 'green', 4, 8, 14, 20, 7),
  ('triceps', 'Triceps', 'upper', 'green', 4, 6, 12, 18, 8),
  ('forearms', 'Forearms', 'upper', 'green', 2, 4, 10, 16, 9),
  ('quads', 'Quads', 'lower', 'purple', 6, 8, 14, 20, 10),
  ('hamstrings', 'Hamstrings', 'lower', 'purple', 4, 6, 12, 16, 11),
  ('glutes', 'Glutes', 'lower', 'purple', 0, 4, 12, 16, 12),
  ('calves', 'Calves', 'lower', 'purple', 6, 8, 14, 20, 13),
  ('abs', 'Abs', 'core', 'pink', 0, 4, 12, 16, 14),
  ('obliques', 'Obliques', 'core', 'pink', 0, 2, 8, 12, 15),
  ('traps', 'Traps', 'upper', 'blue', 0, 4, 12, 18, 16);

-- ============================================
-- EXERCISES
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',  -- Alternative names for search
  equipment TEXT NOT NULL CHECK (equipment IN (
    'barbell', 'dumbbell', 'cable', 'machine', 
    'bodyweight', 'smith_machine', 'kettlebell', 'bands'
  )),
  primary_muscle TEXT NOT NULL REFERENCES muscle_groups(id),
  secondary_muscles JSONB DEFAULT '[]',  -- [{muscle: "triceps", weight: 0.5}]
  video_url TEXT,
  cues TEXT[] DEFAULT '{}',
  default_rep_min INTEGER DEFAULT 8,
  default_rep_max INTEGER DEFAULT 12,
  default_rest_seconds INTEGER DEFAULT 90,
  work_seconds INTEGER DEFAULT 45,  -- Time per set for estimation
  is_core BOOLEAN DEFAULT FALSE,    -- Core library vs user-added
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users see core exercises + their own
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View core or own exercises" ON exercises
  FOR SELECT USING (is_core = TRUE OR created_by = auth.uid());

CREATE POLICY "Insert own exercises" ON exercises
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_core = FALSE);

CREATE POLICY "Update own exercises" ON exercises
  FOR UPDATE USING (created_by = auth.uid() AND is_core = FALSE);

CREATE POLICY "Delete own exercises" ON exercises
  FOR DELETE USING (created_by = auth.uid() AND is_core = FALSE);

-- Index for search
CREATE INDEX exercises_search_idx ON exercises 
  USING GIN (to_tsvector('english', name || ' ' || array_to_string(aliases, ' ')));

-- ============================================
-- MESOCYCLES
-- ============================================
CREATE TABLE training blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 5 CHECK (total_weeks BETWEEN 4 AND 8),
  current_week INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  time_budget_minutes INTEGER,  -- Optional daily time budget
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training blocks" ON training blocks
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- WORKOUT DAYS (templates within a training block)
-- ============================================
CREATE TABLE workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training block_id UUID NOT NULL REFERENCES training blocks(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,  -- 1, 2, 3... within the week
  name TEXT NOT NULL,           -- "Push A", "Legs", etc.
  target_muscles TEXT[] DEFAULT '{}',  -- For quick reference
  time_budget_minutes INTEGER,  -- Override training block default
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training block_id, day_number)
);

ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout days" ON workout_days
  FOR ALL USING (
    training block_id IN (SELECT id FROM training blocks WHERE user_id = auth.uid())
  );

-- ============================================
-- EXERCISE SLOTS (exercises assigned to a day)
-- ============================================
CREATE TABLE exercise_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  slot_order INTEGER NOT NULL,
  base_sets INTEGER NOT NULL DEFAULT 3,      -- Starting sets (Week 1)
  set_progression DECIMAL DEFAULT 0.5,       -- Sets to add per week
  rep_range_min INTEGER NOT NULL DEFAULT 8,
  rep_range_max INTEGER NOT NULL DEFAULT 12,
  rest_seconds INTEGER,                      -- Override exercise default
  superset_group TEXT,                       -- Group ID for supersets
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_day_id, slot_order)
);

ALTER TABLE exercise_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exercise slots" ON exercise_slots
  FOR ALL USING (
    workout_day_id IN (
      SELECT wd.id FROM workout_days wd
      JOIN training blocks m ON wd.training block_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

-- ============================================
-- WORKOUT SESSIONS (actual logged workouts)
-- ============================================
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_day_id UUID NOT NULL REFERENCES workout_days(id),
  training block_id UUID NOT NULL REFERENCES training blocks(id),
  week_number INTEGER NOT NULL,
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'skipped'
  )),
  duration_minutes INTEGER,
  notes TEXT,
  -- Feedback for next session
  overall_pump TEXT CHECK (overall_pump IN ('none', 'mild', 'moderate', 'great', 'excessive')),
  overall_soreness TEXT CHECK (overall_soreness IN ('none', 'mild', 'moderate', 'severe')),
  workload_rating TEXT CHECK (workload_rating IN ('too_easy', 'easy', 'just_right', 'hard', 'too_hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON workout_sessions
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- LOGGED SETS (individual set data)
-- ============================================
CREATE TABLE logged_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_slot_id UUID NOT NULL REFERENCES exercise_slots(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  target_reps INTEGER,
  actual_reps INTEGER,
  target_weight DECIMAL,
  actual_weight DECIMAL,
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  rir INTEGER CHECK (rir BETWEEN 0 AND 5),  -- Reps in Reserve
  completed BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE logged_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own logged sets" ON logged_sets
  FOR ALL USING (
    workout_session_id IN (
      SELECT id FROM workout_sessions WHERE user_id = auth.uid()
    )
  );

-- Index for history queries
CREATE INDEX logged_sets_exercise_idx ON logged_sets(exercise_id, logged_at DESC);

-- ============================================
-- USER VOLUME TARGETS (personal overrides)
-- ============================================
CREATE TABLE user_volume_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_group_id TEXT NOT NULL REFERENCES muscle_groups(id),
  mv INTEGER,
  mev INTEGER,
  mav INTEGER,
  mrv INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muscle_group_id)
);

ALTER TABLE user_volume_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own volume targets" ON user_volume_targets
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- OFFLINE SYNC QUEUE
-- ============================================
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,  -- 'logged_set', 'workout_session', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  payload JSONB NOT NULL,
  synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sync queue" ON sync_queue
  FOR ALL USING (user_id = auth.uid());
```

### 3.2 Core Exercise Library Seed

```sql
-- Chest exercises
INSERT INTO exercises (name, aliases, equipment, primary_muscle, secondary_muscles, video_url, default_rep_min, default_rep_max, default_rest_seconds, work_seconds, is_core) VALUES
  ('Barbell Bench Press', ARRAY['Flat Bench', 'Bench Press', 'BB Bench'], 'barbell', 'chest', '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', 'https://youtube.com/watch?v=rT7DgCr-3pg', 6, 10, 180, 50, TRUE),
  ('Incline Dumbbell Press', ARRAY['Incline DB Press', 'Incline Press'], 'dumbbell', 'chest', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.4}]', 'https://youtube.com/watch?v=8iPEnn-ltC8', 8, 12, 120, 45, TRUE),
  ('Cable Flye', ARRAY['Cable Fly', 'Cable Crossover', 'Standing Flye'], 'cable', 'chest', '[]', 'https://youtube.com/watch?v=Iwe6AmxVf7o', 10, 15, 90, 40, TRUE),
  ('Pec Deck', ARRAY['Pec Deck Flye', 'Machine Flye', 'Butterfly'], 'machine', 'chest', '[]', NULL, 10, 15, 90, 40, TRUE),
  ('Dumbbell Flye', ARRAY['DB Flye', 'Flat Flye'], 'dumbbell', 'chest', '[]', NULL, 10, 15, 90, 40, TRUE),
  ('Incline Barbell Press', ARRAY['Incline Bench', 'Incline BB Press'], 'barbell', 'chest', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.4}]', NULL, 6, 10, 150, 50, TRUE),
  ('Dips (Chest)', ARRAY['Weighted Dips', 'Chest Dips'], 'bodyweight', 'chest', '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', NULL, 8, 12, 120, 45, TRUE),

-- Back exercises
  ('Barbell Row', ARRAY['Bent Over Row', 'BB Row', 'Pendlay Row'], 'barbell', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_upper", "weight": 0.5}, {"muscle": "rear_delts", "weight": 0.3}]', 'https://youtube.com/watch?v=FWJR5Ve8bnQ', 8, 12, 150, 45, TRUE),
  ('Lat Pulldown', ARRAY['Pulldown', 'Cable Pulldown', 'Wide Grip Pulldown'], 'cable', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}]', 'https://youtube.com/watch?v=CAwf7n6Luuc', 10, 15, 90, 40, TRUE),
  ('Seated Cable Row', ARRAY['Cable Row', 'Seated Row', 'Low Row'], 'cable', 'back_upper', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.5}]', NULL, 10, 15, 90, 40, TRUE),
  ('Pull-Up', ARRAY['Pullup', 'Chin Up', 'Weighted Pull-Up'], 'bodyweight', 'back_lats', '[{"muscle": "biceps", "weight": 0.5}]', NULL, 5, 12, 150, 45, TRUE),
  ('Dumbbell Row', ARRAY['DB Row', 'One Arm Row', 'Single Arm Row'], 'dumbbell', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_upper", "weight": 0.3}]', NULL, 8, 12, 90, 40, TRUE),
  ('T-Bar Row', ARRAY['Landmine Row', 'T Bar'], 'barbell', 'back_upper', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.5}]', NULL, 8, 12, 120, 45, TRUE),
  ('Machine Row', ARRAY['Hammer Row', 'Chest Supported Row', 'Iso Row'], 'machine', 'back_upper', '[{"muscle": "biceps", "weight": 0.3}, {"muscle": "back_lats", "weight": 0.5}]', NULL, 10, 15, 90, 40, TRUE),

-- Shoulders
  ('Overhead Press', ARRAY['OHP', 'Military Press', 'Barbell Shoulder Press'], 'barbell', 'front_delts', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "side_delts", "weight": 0.3}]', NULL, 6, 10, 150, 50, TRUE),
  ('Dumbbell Lateral Raise', ARRAY['Lateral Raise', 'Side Raise', 'DB Lateral'], 'dumbbell', 'side_delts', '[]', NULL, 12, 20, 60, 35, TRUE),
  ('Cable Lateral Raise', ARRAY['Cable Side Raise'], 'cable', 'side_delts', '[]', NULL, 12, 20, 60, 35, TRUE),
  ('Face Pull', ARRAY['Rope Face Pull', 'Cable Face Pull'], 'cable', 'rear_delts', '[{"muscle": "back_upper", "weight": 0.3}]', NULL, 15, 20, 60, 35, TRUE),
  ('Reverse Pec Deck', ARRAY['Rear Delt Fly', 'Machine Reverse Fly'], 'machine', 'rear_delts', '[]', NULL, 12, 20, 60, 35, TRUE),
  ('Dumbbell Shoulder Press', ARRAY['DB Shoulder Press', 'Seated DB Press'], 'dumbbell', 'front_delts', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "side_delts", "weight": 0.3}]', NULL, 8, 12, 120, 45, TRUE),

-- Arms
  ('Barbell Curl', ARRAY['BB Curl', 'Standing Curl'], 'barbell', 'biceps', '[]', NULL, 8, 12, 90, 40, TRUE),
  ('Dumbbell Curl', ARRAY['DB Curl', 'Bicep Curl'], 'dumbbell', 'biceps', '[]', NULL, 10, 15, 60, 35, TRUE),
  ('Hammer Curl', ARRAY['DB Hammer Curl', 'Neutral Grip Curl'], 'dumbbell', 'biceps', '[{"muscle": "forearms", "weight": 0.4}]', NULL, 10, 15, 60, 35, TRUE),
  ('Cable Curl', ARRAY['Rope Curl', 'EZ Bar Cable Curl'], 'cable', 'biceps', '[]', NULL, 12, 15, 60, 35, TRUE),
  ('Preacher Curl', ARRAY['EZ Bar Preacher', 'Machine Preacher'], 'machine', 'biceps', '[]', NULL, 10, 15, 90, 40, TRUE),
  ('Tricep Pushdown', ARRAY['Cable Pushdown', 'Rope Pushdown', 'Tricep Extension'], 'cable', 'triceps', '[]', NULL, 12, 15, 60, 35, TRUE),
  ('Skull Crusher', ARRAY['Lying Tricep Extension', 'EZ Bar Skull Crusher'], 'barbell', 'triceps', '[]', NULL, 10, 15, 90, 40, TRUE),
  ('Overhead Tricep Extension', ARRAY['Cable Overhead Extension', 'French Press'], 'cable', 'triceps', '[]', NULL, 12, 15, 60, 35, TRUE),
  ('Close Grip Bench', ARRAY['CGBP', 'Close Grip Bench Press'], 'barbell', 'triceps', '[{"muscle": "chest", "weight": 0.4}]', NULL, 8, 12, 120, 45, TRUE),

-- Legs
  ('Barbell Squat', ARRAY['Back Squat', 'BB Squat', 'Squat'], 'barbell', 'quads', '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "hamstrings", "weight": 0.3}]', NULL, 6, 10, 180, 55, TRUE),
  ('Leg Press', ARRAY['Machine Leg Press', '45 Degree Leg Press'], 'machine', 'quads', '[{"muscle": "glutes", "weight": 0.4}]', NULL, 10, 15, 150, 50, TRUE),
  ('Leg Extension', ARRAY['Quad Extension', 'Machine Leg Extension'], 'machine', 'quads', '[]', NULL, 12, 20, 60, 35, TRUE),
  ('Romanian Deadlift', ARRAY['RDL', 'Stiff Leg Deadlift', 'SLDL'], 'barbell', 'hamstrings', '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "back_lats", "weight": 0.2}]', NULL, 8, 12, 150, 50, TRUE),
  ('Leg Curl', ARRAY['Lying Leg Curl', 'Seated Leg Curl', 'Hamstring Curl'], 'machine', 'hamstrings', '[]', NULL, 10, 15, 90, 40, TRUE),
  ('Hip Thrust', ARRAY['Barbell Hip Thrust', 'Glute Bridge'], 'barbell', 'glutes', '[{"muscle": "hamstrings", "weight": 0.3}]', NULL, 10, 15, 120, 45, TRUE),
  ('Bulgarian Split Squat', ARRAY['BSS', 'Rear Foot Elevated Split Squat'], 'dumbbell', 'quads', '[{"muscle": "glutes", "weight": 0.4}]', NULL, 8, 12, 90, 45, TRUE),
  ('Walking Lunge', ARRAY['Dumbbell Lunge', 'DB Walking Lunge'], 'dumbbell', 'quads', '[{"muscle": "glutes", "weight": 0.4}]', NULL, 10, 15, 90, 45, TRUE),
  ('Standing Calf Raise', ARRAY['Calf Raise', 'Machine Calf Raise'], 'machine', 'calves', '[]', NULL, 12, 20, 60, 35, TRUE),
  ('Seated Calf Raise', ARRAY['Seated Calf'], 'machine', 'calves', '[]', NULL, 12, 20, 60, 35, TRUE),

-- Core
  ('Cable Crunch', ARRAY['Rope Crunch', 'Kneeling Cable Crunch'], 'cable', 'abs', '[]', NULL, 15, 20, 60, 35, TRUE),
  ('Hanging Leg Raise', ARRAY['Leg Raise', 'Hanging Knee Raise'], 'bodyweight', 'abs', '[]', NULL, 10, 20, 60, 35, TRUE),
  ('Ab Wheel Rollout', ARRAY['Ab Roller', 'Rollout'], 'bodyweight', 'abs', '[]', NULL, 10, 15, 60, 40, TRUE);
```

---

## 4. Data Models (TypeScript)

```typescript
// src/lib/types/index.ts

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type WeightUnit = 'lbs' | 'kg';
export type EquipmentType = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'smith_machine' | 'kettlebell' | 'bands';
export type Training BlockStatus = 'active' | 'completed' | 'paused';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped';
export type PumpRating = 'none' | 'mild' | 'moderate' | 'great' | 'excessive';
export type SorenessRating = 'none' | 'mild' | 'moderate' | 'severe';
export type WorkloadRating = 'too_easy' | 'easy' | 'just_right' | 'hard' | 'too_hard';
export type VolumeStatus = 'below_mv' | 'at_mev' | 'in_mav' | 'approaching_mrv' | 'exceeds_mrv';

// ============================================
// DATABASE ENTITIES
// ============================================

export interface Profile {
  id: string;
  display_name: string | null;
  weight_unit: WeightUnit;
  default_rest_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface MuscleGroup {
  id: string;
  display_name: string;
  category: 'upper' | 'lower' | 'core';
  color: string;
  default_mv: number;
  default_mev: number;
  default_mav: number;
  default_mrv: number;
  sort_order: number;
}

export interface SecondaryMuscle {
  muscle: string;
  weight: number; // 0.0 - 1.0
}

export interface Exercise {
  id: string;
  name: string;
  aliases: string[];
  equipment: EquipmentType;
  primary_muscle: string;
  secondary_muscles: SecondaryMuscle[];
  video_url: string | null;
  cues: string[];
  default_rep_min: number;
  default_rep_max: number;
  default_rest_seconds: number;
  work_seconds: number;
  is_core: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Training Block {
  id: string;
  user_id: string;
  name: string;
  total_weeks: number;
  current_week: number;
  current_day: number;
  status: Training BlockStatus;
  time_budget_minutes: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface WorkoutDay {
  id: string;
  training block_id: string;
  day_number: number;
  name: string;
  target_muscles: string[];
  time_budget_minutes: number | null;
  created_at: string;
}

export interface ExerciseSlot {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  slot_order: number;
  base_sets: number;
  set_progression: number;
  rep_range_min: number;
  rep_range_max: number;
  rest_seconds: number | null;
  superset_group: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_day_id: string;
  training block_id: string;
  week_number: number;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: SessionStatus;
  duration_minutes: number | null;
  notes: string | null;
  overall_pump: PumpRating | null;
  overall_soreness: SorenessRating | null;
  workload_rating: WorkloadRating | null;
  created_at: string;
  // Joined data
  workout_day?: WorkoutDay;
  logged_sets?: LoggedSet[];
}

export interface LoggedSet {
  id: string;
  workout_session_id: string;
  exercise_slot_id: string;
  exercise_id: string;
  set_number: number;
  target_reps: number | null;
  actual_reps: number | null;
  target_weight: number | null;
  actual_weight: number | null;
  weight_unit: WeightUnit;
  rir: number | null;
  completed: boolean;
  logged_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface UserVolumeTarget {
  id: string;
  user_id: string;
  muscle_group_id: string;
  mv: number | null;
  mev: number | null;
  mav: number | null;
  mrv: number | null;
  created_at: string;
}

// ============================================
// COMPUTED / UI TYPES
// ============================================

export interface VolumeTarget {
  mv: number;
  mev: number;
  mav: number;
  mrv: number;
}

export interface MuscleVolumeData {
  muscle_id: string;
  display_name: string;
  color: string;
  direct_sets: number;
  indirect_sets: number;
  total_effective_sets: number;
  target: VolumeTarget;
  status: VolumeStatus;
}

export interface WeeklyVolumeReport {
  week_number: number;
  muscle_volumes: Record<string, MuscleVolumeData>;
  total_sets: number;
  warnings: VolumeWarning[];
}

export interface VolumeWarning {
  muscle_id: string;
  type: 'below_mv' | 'below_mev' | 'approaching_mrv' | 'exceeds_mrv';
  message: string;
}

export interface TimeEstimate {
  week_number: number;
  total_sets: number;
  work_time_minutes: number;
  rest_time_minutes: number;
  total_minutes: number;
}

export interface WorkoutTimeProjection {
  day_name: string;
  day_id: string;
  estimates: TimeEstimate[];
  exceeds_budget: boolean;
  budget_minutes: number | null;
}

export interface ProgressionRecommendation {
  exercise_id: string;
  previous_weight: number;
  previous_reps: number[];
  recommended_weight: number;
  recommended_reps: number;
  recommended_sets: number;
  reasoning: string;
  target_rir: number;
}

// ============================================
// OFFLINE STORAGE
// ============================================

export interface OfflineWorkoutCache {
  workout_session_id: string;
  workout_day: WorkoutDay;
  exercise_slots: ExerciseSlot[];
  exercises: Exercise[];
  previous_sessions: WorkoutSession[];
  cached_at: string;
}

export interface SyncQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  created_at: string;
}
```

---

## 5. Feature Specifications

### 5.1 Volume Tracking (Priority 1)

#### Requirements

1. **During Training Block Setup (Desktop)**
   - Display weekly volume per muscle group as user adds exercises
   - Update in real-time as exercises are added/removed
   - Show color-coded status: 🟢 Green (MEV-MAV), 🟡 Yellow (below MEV or near MRV), 🔴 Red (below MV or exceeds MRV)
   - Account for secondary muscle contributions with weighting

2. **During Workout Logging (Mobile)**
   - Compact volume bar at top of screen
   - Shows running weekly totals for muscles being trained that day
   - Tapping expands to full breakdown
   - Non-intrusive, glanceable

#### Volume Calculation Logic

```typescript
// src/lib/utils/volume.ts

import type { ExerciseSlot, Exercise, MuscleGroup, VolumeTarget, MuscleVolumeData, VolumeStatus } from '$lib/types';

export function calculateWeeklyVolume(
  slots: ExerciseSlot[],
  exercises: Map<string, Exercise>,
  muscleGroups: Map<string, MuscleGroup>,
  userTargets: Map<string, VolumeTarget>,
  weekNumber: number
): Map<string, MuscleVolumeData> {
  const volumeMap = new Map<string, { direct: number; indirect: number }>();

  // Initialize all muscle groups
  for (const [id] of muscleGroups) {
    volumeMap.set(id, { direct: 0, indirect: 0 });
  }

  // Calculate sets for this week
  for (const slot of slots) {
    const exercise = exercises.get(slot.exercise_id);
    if (!exercise) continue;

    // Sets increase each week based on progression
    const setsThisWeek = Math.ceil(slot.base_sets + (slot.set_progression * (weekNumber - 1)));

    // Primary muscle gets full credit
    const primary = volumeMap.get(exercise.primary_muscle);
    if (primary) {
      primary.direct += setsThisWeek;
    }

    // Secondary muscles get weighted credit
    for (const secondary of exercise.secondary_muscles) {
      const muscle = volumeMap.get(secondary.muscle);
      if (muscle) {
        muscle.indirect += setsThisWeek * secondary.weight;
      }
    }
  }

  // Convert to MuscleVolumeData with status
  const result = new Map<string, MuscleVolumeData>();

  for (const [muscleId, counts] of volumeMap) {
    const muscleGroup = muscleGroups.get(muscleId);
    if (!muscleGroup) continue;

    const target = userTargets.get(muscleId) ?? {
      mv: muscleGroup.default_mv,
      mev: muscleGroup.default_mev,
      mav: muscleGroup.default_mav,
      mrv: muscleGroup.default_mrv,
    };

    const effectiveSets = counts.direct + counts.indirect;
    const status = getVolumeStatus(effectiveSets, target);

    result.set(muscleId, {
      muscle_id: muscleId,
      display_name: muscleGroup.display_name,
      color: muscleGroup.color,
      direct_sets: counts.direct,
      indirect_sets: Math.round(counts.indirect * 10) / 10,
      total_effective_sets: Math.round(effectiveSets * 10) / 10,
      target,
      status,
    });
  }

  return result;
}

export function getVolumeStatus(sets: number, target: VolumeTarget): VolumeStatus {
  if (sets < target.mv) return 'below_mv';
  if (sets < target.mev) return 'at_mev';
  if (sets <= target.mav) return 'in_mav';
  if (sets <= target.mrv) return 'approaching_mrv';
  return 'exceeds_mrv';
}

export function getStatusColor(status: VolumeStatus): string {
  switch (status) {
    case 'below_mv': return 'text-red-500';
    case 'at_mev': return 'text-yellow-500';
    case 'in_mav': return 'text-green-500';
    case 'approaching_mrv': return 'text-yellow-500';
    case 'exceeds_mrv': return 'text-red-500';
  }
}

export function getStatusEmoji(status: VolumeStatus): string {
  switch (status) {
    case 'below_mv': return '🔴';
    case 'at_mev': return '🟡';
    case 'in_mav': return '🟢';
    case 'approaching_mrv': return '🟡';
    case 'exceeds_mrv': return '🔴';
  }
}
```

#### UI Components

**VolumeBar.svelte** (Mobile, compact)
```svelte
<script lang="ts">
  import type { MuscleVolumeData } from '$lib/types';
  import { getStatusEmoji } from '$lib/utils/volume';

  export let volumes: MuscleVolumeData[];
  export let expanded = false;

  // Show only muscles with sets > 0, sorted by status priority
  $: activeVolumes = volumes
    .filter(v => v.total_effective_sets > 0)
    .sort((a, b) => statusPriority(a.status) - statusPriority(b.status));

  function statusPriority(status: string): number {
    const order = ['exceeds_mrv', 'below_mv', 'approaching_mrv', 'at_mev', 'in_mav'];
    return order.indexOf(status);
  }
</script>

<button
  class="w-full bg-gray-800 px-4 py-2 rounded-lg"
  on:click={() => expanded = !expanded}
>
  <div class="flex flex-wrap gap-2 text-sm">
    {#each activeVolumes.slice(0, expanded ? undefined : 4) as vol}
      <span class="flex items-center gap-1">
        {getStatusEmoji(vol.status)}
        <span class="text-gray-300">{vol.display_name}</span>
        <span class="text-white font-medium">
          {vol.total_effective_sets}/{vol.target.mav}
        </span>
      </span>
    {/each}
    {#if !expanded && activeVolumes.length > 4}
      <span class="text-gray-500">+{activeVolumes.length - 4} more</span>
    {/if}
  </div>
</button>
```

### 5.2 Offline Support (Priority 2)

#### "Download Today" Pattern

1. User taps "Download Today" button on home screen
2. App fetches and caches:
   - Today's workout session
   - Exercise slots with full exercise data
   - Last 4 sessions for each exercise (for progression)
   - User profile and volume targets
3. Data stored in IndexedDB via Dexie.js
4. During workout, all logging happens locally
5. On next online connection, sync queue processes

#### Dexie Schema

```typescript
// src/lib/db/offline.ts

import Dexie, { type Table } from 'dexie';
import type { OfflineWorkoutCache, SyncQueueItem, LoggedSet } from '$lib/types';

export class MyLiftPalDB extends Dexie {
  workoutCache!: Table<OfflineWorkoutCache>;
  pendingSets!: Table<LoggedSet>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('myliftpal');
    this.version(1).stores({
      workoutCache: 'workout_session_id, cached_at',
      pendingSets: 'id, workout_session_id, exercise_slot_id',
      syncQueue: 'id, entity_type, created_at',
    });
  }
}

export const db = new MyLiftPalDB();

export async function cacheWorkoutForOffline(
  sessionId: string,
  workoutDay: WorkoutDay,
  slots: ExerciseSlot[],
  exercises: Exercise[],
  previousSessions: WorkoutSession[]
): Promise<void> {
  await db.workoutCache.put({
    workout_session_id: sessionId,
    workout_day: workoutDay,
    exercise_slots: slots,
    exercises,
    previous_sessions: previousSessions,
    cached_at: new Date().toISOString(),
  });
}

export async function getOfflineWorkout(sessionId: string): Promise<OfflineWorkoutCache | undefined> {
  return db.workoutCache.get(sessionId);
}

export async function queueSetForSync(set: LoggedSet): Promise<void> {
  await db.pendingSets.put(set);
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entity_type: 'logged_set',
    entity_id: set.id,
    action: set.completed ? 'update' : 'create',
    payload: set,
    created_at: new Date().toISOString(),
  });
}

export async function processSyncQueue(supabase: SupabaseClient): Promise<void> {
  const items = await db.syncQueue.toArray();
  
  for (const item of items) {
    try {
      if (item.entity_type === 'logged_set') {
        if (item.action === 'create' || item.action === 'update') {
          await supabase.from('logged_sets').upsert(item.payload);
        } else if (item.action === 'delete') {
          await supabase.from('logged_sets').delete().eq('id', item.entity_id);
        }
      }
      // Remove from queue after successful sync
      await db.syncQueue.delete(item.id);
    } catch (error) {
      console.error('Sync failed for item:', item.id, error);
    }
  }

  // Clear pending sets that were synced
  await db.pendingSets.clear();
}
```

### 5.3 Time Estimation

#### Requirements

1. **At Training Block Creation**: Show Week 1 AND final week time estimates
2. **Warn if final week exceeds time budget**
3. **Account for supersets** (shared rest time)
4. **Configurable rest time default** (user setting, default 90s)

#### Calculation Logic

```typescript
// src/lib/utils/time.ts

import type { ExerciseSlot, Exercise, TimeEstimate, WorkoutTimeProjection } from '$lib/types';

const WARMUP_BUFFER_MINUTES = 5;

export function calculateTimeEstimate(
  slots: ExerciseSlot[],
  exercises: Map<string, Exercise>,
  weekNumber: number,
  defaultRestSeconds: number
): TimeEstimate {
  let totalWorkSeconds = 0;
  let totalRestSeconds = 0;
  let totalSets = 0;

  // Group by superset
  const supersetGroups = new Map<string | null, ExerciseSlot[]>();
  for (const slot of slots) {
    const group = slot.superset_group ?? slot.id;
    if (!supersetGroups.has(group)) {
      supersetGroups.set(group, []);
    }
    supersetGroups.get(group)!.push(slot);
  }

  for (const [groupId, groupSlots] of supersetGroups) {
    const isSuperset = groupSlots.length > 1;

    for (const slot of groupSlots) {
      const exercise = exercises.get(slot.exercise_id);
      if (!exercise) continue;

      const setsThisWeek = Math.ceil(slot.base_sets + (slot.set_progression * (weekNumber - 1)));
      const restPerSet = slot.rest_seconds ?? exercise.default_rest_seconds ?? defaultRestSeconds;
      const workPerSet = exercise.work_seconds ?? 45;

      totalSets += setsThisWeek;
      totalWorkSeconds += setsThisWeek * workPerSet;

      // Supersets share rest time (only count once per round)
      if (!isSuperset) {
        totalRestSeconds += setsThisWeek * restPerSet;
      }
    }

    // For supersets, add rest once per round (not per exercise)
    if (isSuperset) {
      const maxSets = Math.max(...groupSlots.map(s => {
        return Math.ceil(s.base_sets + (s.set_progression * (weekNumber - 1)));
      }));
      const avgRest = groupSlots.reduce((sum, s) => {
        const ex = exercises.get(s.exercise_id);
        return sum + (s.rest_seconds ?? ex?.default_rest_seconds ?? defaultRestSeconds);
      }, 0) / groupSlots.length;
      
      totalRestSeconds += maxSets * avgRest;
    }
  }

  const workMinutes = Math.ceil(totalWorkSeconds / 60);
  const restMinutes = Math.ceil(totalRestSeconds / 60);

  return {
    week_number: weekNumber,
    total_sets: totalSets,
    work_time_minutes: workMinutes,
    rest_time_minutes: restMinutes,
    total_minutes: workMinutes + restMinutes + WARMUP_BUFFER_MINUTES,
  };
}

export function projectWorkoutTimes(
  workoutDay: WorkoutDay,
  slots: ExerciseSlot[],
  exercises: Map<string, Exercise>,
  totalWeeks: number,
  defaultRestSeconds: number
): WorkoutTimeProjection {
  const estimates: TimeEstimate[] = [];

  for (let week = 1; week <= totalWeeks; week++) {
    estimates.push(calculateTimeEstimate(slots, exercises, week, defaultRestSeconds));
  }

  const budget = workoutDay.time_budget_minutes;
  const finalWeekEstimate = estimates[estimates.length - 1];

  return {
    day_name: workoutDay.name,
    day_id: workoutDay.id,
    estimates,
    exceeds_budget: budget !== null && finalWeekEstimate.total_minutes > budget,
    budget_minutes: budget,
  };
}
```

### 5.4 Voice Logging (Priority 3)

#### Basic Implementation

```typescript
// src/lib/utils/voice.ts

export interface VoiceCommand {
  type: 'log_set' | 'complete' | 'skip' | 'query' | 'note' | 'unknown';
  data: Record<string, unknown>;
  confidence: number;
  transcript: string;
}

export function parseVoiceInput(transcript: string): VoiceCommand {
  const normalized = transcript.toLowerCase().trim();

  // Pattern: "85 for 12" or "85 pounds 12 reps" or "85 12"
  const setPattern = /(\d+)\s*(?:pounds?|lbs?|kilos?|kg)?\s*(?:for|x|times|at)?\s*(\d+)\s*(?:reps?)?/;
  const setMatch = normalized.match(setPattern);
  if (setMatch) {
    return {
      type: 'log_set',
      data: { weight: parseInt(setMatch[1]), reps: parseInt(setMatch[2]) },
      confidence: 0.9,
      transcript,
    };
  }

  // Pattern: "same weight 10" or "same 10"
  const sameWeightPattern = /same\s*(?:weight)?\s*(\d+)\s*(?:reps?)?/;
  const sameMatch = normalized.match(sameWeightPattern);
  if (sameMatch) {
    return {
      type: 'log_set',
      data: { weight: 'same', reps: parseInt(sameMatch[1]) },
      confidence: 0.85,
      transcript,
    };
  }

  // Pattern: "done" / "complete" / "finished" / "next"
  if (/\b(done|complete|finished|next exercise)\b/.test(normalized)) {
    return {
      type: 'complete',
      data: {},
      confidence: 0.95,
      transcript,
    };
  }

  // Pattern: "skip"
  if (/\b(skip|pass)\b/.test(normalized)) {
    return {
      type: 'skip',
      data: {},
      confidence: 0.95,
      transcript,
    };
  }

  // Pattern: "what did I do last time" / "last session" / "previous"
  if (/\b(what|last time|previous|last session|history)\b/.test(normalized)) {
    return {
      type: 'query',
      data: { query: normalized },
      confidence: 0.8,
      transcript,
    };
  }

  // Default: treat as note
  return {
    type: 'note',
    data: { text: transcript },
    confidence: 0.5,
    transcript,
  };
}

export class VoiceLogger {
  private recognition: SpeechRecognition | null = null;
  private synthesis = window.speechSynthesis;
  private isListening = false;

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  get isSupported(): boolean {
    return this.recognition !== null;
  }

  async listen(): Promise<VoiceCommand> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      this.recognition!.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const command = parseVoiceInput(transcript);
        resolve(command);
      };

      this.recognition!.onerror = (event) => {
        reject(new Error(event.error));
      };

      this.recognition!.start();
      this.isListening = true;
    });
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(message: string): void {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    this.synthesis.speak(utterance);
  }
}
```

### 5.5 Photo Import (Priority 4)

```typescript
// src/lib/utils/ocr.ts

import Tesseract from 'tesseract.js';

export interface ParsedExerciseData {
  exercise_name: string;
  sets: Array<{ weight: number; reps: number }>;
  confidence: number;
}

export interface ParsedWorkoutData {
  exercises: ParsedExerciseData[];
  raw_text: string;
  needs_review: boolean;
}

export async function parseWorkoutPhoto(imageFile: File): Promise<ParsedWorkoutData> {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => console.log(m),
  });

  const exercises: ParsedExerciseData[] = [];
  const lines = text.split('\n').filter((line) => line.trim());

  // Common patterns:
  // "Bench Press: 135x10, 145x8, 145x8"
  // "Bench 135 10 | 145 8 | 145 8"
  // "BP 135/10 145/8"

  const exerciseLinePattern = /^([A-Za-z\s]+)[:\-]?\s*([\d\s×x\/,|]+)$/;
  const setPattern = /(\d+)\s*[×x\/]\s*(\d+)/g;

  for (const line of lines) {
    const exerciseMatch = line.match(exerciseLinePattern);
    if (exerciseMatch) {
      const exerciseName = exerciseMatch[1].trim();
      const setsText = exerciseMatch[2];
      const sets: Array<{ weight: number; reps: number }> = [];

      let setMatch;
      while ((setMatch = setPattern.exec(setsText)) !== null) {
        sets.push({
          weight: parseInt(setMatch[1]),
          reps: parseInt(setMatch[2]),
        });
      }

      if (sets.length > 0) {
        exercises.push({
          exercise_name: exerciseName,
          sets,
          confidence: 0.7,
        });
      }
    }
  }

  return {
    exercises,
    raw_text: text,
    needs_review: exercises.length === 0 || exercises.some((e) => e.confidence < 0.8),
  };
}
```

---

## 6. UI/UX Guidelines

### 6.1 Color Palette (Dark Theme - Emerald Green)

```css
/* tailwind.config.js - extend theme.colors */
{
  'bg-primary': '#0a120f',      /* Main background */
  'bg-secondary': '#0f1a16',    /* Cards, panels */
  'bg-tertiary': '#162420',     /* Inputs, elevated elements */
  'accent': '#10b981',          /* Primary actions (emerald) */
  'accent-hover': '#34d399',    /* Hover state */
  'success': '#22c55e',         /* Green - completed */
  'warning': '#eab308',         /* Yellow - approaching limits */
  'error': '#ef4444',           /* Red - outside limits */
  'text-primary': '#ffffff',
  'text-secondary': '#a1a1aa',
  'text-muted': '#71717a',
}

/* Future: User theme customization - store accentColor in profile */
/* Options: emerald, blue, cyan, indigo, orange, slate */
```

### 6.2 Mobile-First Layout

```
┌─────────────────────────────────┐
│ ← Week 3 Day 2      ⚙️  📥      │  Header
├─────────────────────────────────┤
│ Push Day                        │  Day Name
│ 🟢Chest 12/16 🟡Delts 8/14 ...  │  Volume Bar (compact)
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Incline DB Press      ▶️ ℹ️ │ │  Exercise Card
│ │ Chest • Shoulders • Triceps │ │
│ │                             │ │
│ │ Set 1: 80 lbs × 12    ☑️   │ │
│ │ Set 2: 80 lbs × [  ]  ☐   │ │
│ │ Set 3: 80 lbs × [  ]  ☐   │ │
│ │ + Add Set                   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Cable Flye            ▶️ ℹ️ │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🏠    📋    📊    ⚙️           │  Bottom Nav
└─────────────────────────────────┘
```

### 6.3 Component Library

Key components to build:
- `ExerciseCard` - Collapsible exercise with sets
- `SetRow` - Weight/reps input with completion toggle
- `VolumeBar` - Compact weekly volume indicator
- `TimeEstimate` - Shows workout duration projection
- `VoiceButton` - Mic button with listening state
- `ProgressionBadge` - Shows recommended vs actual
- `MuscleTag` - Colored badge for muscle groups

---

## 7. Progression Algorithm

### 7.1 RP-Style Progression Logic

```typescript
// src/lib/utils/progression.ts

import type { LoggedSet, ExerciseSlot, Exercise, ProgressionRecommendation, WorkloadRating } from '$lib/types';

interface ProgressionInput {
  slot: ExerciseSlot;
  exercise: Exercise;
  previousSets: LoggedSet[];
  weekNumber: number;
  totalWeeks: number;
  lastWorkloadRating?: WorkloadRating;
}

const WEIGHT_INCREMENT = {
  barbell: 5,
  dumbbell: 5,
  cable: 5,
  machine: 10,
  smith_machine: 10,
  bodyweight: 0,
  kettlebell: 5,
  bands: 0,
};

export function calculateProgression(input: ProgressionInput): ProgressionRecommendation {
  const { slot, exercise, previousSets, weekNumber, totalWeeks, lastWorkloadRating } = input;

  // Calculate target RIR based on week in training block
  // Week 1: 4 RIR, progressing to 1 RIR in final accumulation week
  const accumulationWeeks = totalWeeks - 1; // Last week is deload
  const rirStart = 4;
  const rirEnd = 1;
  const targetRir = weekNumber >= totalWeeks
    ? 4 // Deload week: back to 4 RIR
    : Math.max(rirEnd, rirStart - Math.floor((weekNumber - 1) * (rirStart - rirEnd) / (accumulationWeeks - 1)));

  // If no previous data, use defaults
  if (previousSets.length === 0) {
    return {
      exercise_id: exercise.id,
      previous_weight: 0,
      previous_reps: [],
      recommended_weight: 0, // User enters starting weight
      recommended_reps: slot.rep_range_max, // Start at top of range
      recommended_sets: calculateSetsForWeek(slot, weekNumber, lastWorkloadRating),
      reasoning: 'First session - enter your starting weight targeting the top of your rep range.',
      target_rir: targetRir,
    };
  }

  // Analyze previous performance
  const prevWeight = previousSets[0].actual_weight ?? 0;
  const prevReps = previousSets.map(s => s.actual_reps ?? 0).filter(r => r > 0);
  const avgReps = prevReps.reduce((a, b) => a + b, 0) / prevReps.length;
  const minReps = Math.min(...prevReps);
  const maxReps = Math.max(...prevReps);

  // Deload week: reduce weight by 10-15%, keep reps same
  if (weekNumber >= totalWeeks) {
    return {
      exercise_id: exercise.id,
      previous_weight: prevWeight,
      previous_reps: prevReps,
      recommended_weight: Math.round(prevWeight * 0.85),
      recommended_reps: slot.rep_range_max,
      recommended_sets: Math.max(2, Math.ceil(slot.base_sets * 0.5)),
      reasoning: 'Deload week: Reduced weight by 15%, volume cut in half to allow recovery.',
      target_rir: 4,
    };
  }

  const increment = WEIGHT_INCREMENT[exercise.equipment] ?? 5;
  let recommendedWeight = prevWeight;
  let recommendedReps = Math.ceil(avgReps);
  let reasoning = '';

  // Rule 1: If hitting top of rep range on most sets, increase weight
  const setsAtCeiling = prevReps.filter(r => r >= slot.rep_range_max).length;
  if (setsAtCeiling >= prevReps.length * 0.6) {
    recommendedWeight = prevWeight + increment;
    recommendedReps = slot.rep_range_min; // Reset to bottom of range
    reasoning = `Hit ${slot.rep_range_max}+ reps on ${setsAtCeiling}/${prevReps.length} sets. Increasing weight by ${increment} lbs, targeting ${slot.rep_range_min} reps.`;
  }
  // Rule 2: If increment would be too big (e.g., 10lb → 15lb DBs), add a rep instead
  else if (avgReps >= slot.rep_range_max - 1) {
    recommendedReps = slot.rep_range_max;
    reasoning = `Close to rep ceiling (${avgReps.toFixed(1)} avg). Adding reps before weight increase.`;
  }
  // Rule 3: Within rep range, try to add 1 rep
  else if (avgReps >= slot.rep_range_min && avgReps < slot.rep_range_max) {
    recommendedReps = Math.min(Math.ceil(avgReps) + 1, slot.rep_range_max);
    reasoning = `Progressing within rep range: ${Math.ceil(avgReps)} → ${recommendedReps} reps at ${prevWeight} lbs.`;
  }
  // Rule 4: Below rep range, keep weight same
  else if (avgReps < slot.rep_range_min) {
    recommendedReps = slot.rep_range_min;
    reasoning = `Below target range (${avgReps.toFixed(1)} avg). Maintaining ${prevWeight} lbs, targeting ${slot.rep_range_min} reps.`;
  }
  // Default: maintain
  else {
    reasoning = `Maintaining ${prevWeight} lbs for ${recommendedReps} reps.`;
  }

  // Calculate sets for this week
  const recommendedSets = calculateSetsForWeek(slot, weekNumber, lastWorkloadRating);

  return {
    exercise_id: exercise.id,
    previous_weight: prevWeight,
    previous_reps: prevReps,
    recommended_weight: recommendedWeight,
    recommended_reps: recommendedReps,
    recommended_sets: recommendedSets,
    reasoning,
    target_rir: targetRir,
  };
}

function calculateSetsForWeek(
  slot: ExerciseSlot,
  weekNumber: number,
  workloadRating?: WorkloadRating
): number {
  let sets = Math.ceil(slot.base_sets + (slot.set_progression * (weekNumber - 1)));

  // Adjust based on feedback
  if (workloadRating === 'too_easy') {
    sets += 1;
  } else if (workloadRating === 'too_hard') {
    sets = Math.max(slot.base_sets, sets - 1);
  }

  return sets;
}

export function shouldSuggestDeload(
  recentSessions: { week: number; avgReps: number; weight: number }[]
): boolean {
  if (recentSessions.length < 3) return false;

  // Check for regression: 2+ weeks of declining performance
  const sorted = [...recentSessions].sort((a, b) => b.week - a.week);
  let declineCount = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const previous = sorted[i + 1];

    // Regression = same or higher weight but fewer reps
    if (current.weight >= previous.weight && current.avgReps < previous.avgReps - 0.5) {
      declineCount++;
    }
  }

  return declineCount >= 2;
}
```

---

## 8. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] SvelteKit project setup with Tailwind
- [ ] Supabase project and auth integration
- [ ] Database migrations and seed data
- [ ] Basic routing structure
- [ ] Profile and settings pages

### Phase 2: Core Workout Flow (Week 3-4)
- [ ] Training Block creation wizard
- [ ] Exercise library with search
- [ ] Workout day setup
- [ ] Exercise slot management
- [ ] Basic workout logging (no progression)

### Phase 3: Volume Intelligence (Week 5)
- [ ] Volume calculation engine
- [ ] VolumeBar component (mobile)
- [ ] Volume sidebar (desktop)
- [ ] MEV/MAV/MRV color coding
- [ ] User volume target overrides

### Phase 4: Progression & Time (Week 6)
- [ ] RP-style progression algorithm
- [ ] Previous session data display
- [ ] Time estimation calculations
- [ ] Time projection UI (Week 1 → Week N)
- [ ] Superset grouping

### Phase 5: Offline Mode (Week 7)
- [ ] PWA configuration (@vite-pwa/sveltekit)
- [ ] Dexie.js IndexedDB setup
- [ ] "Download Today" feature
- [ ] Sync queue implementation
- [ ] Offline indicator UI

### Phase 6: Voice & Polish (Week 8+)
- [ ] Voice logging integration
- [ ] Conversational Q&A basics
- [ ] Photo OCR import
- [ ] Deload suggestions
- [ ] Progression reasoning display
- [ ] Performance optimization

---

## 9. Vibe Coding Prompts

### Prompt 1: Project Setup

```
Create a new SvelteKit project called "myliftpal" with the following:

1. SvelteKit 2.x with TypeScript
2. Tailwind CSS 3.x with dark theme configured
3. Supabase client setup (use environment variables)
4. Basic routing: /, /training blocks, /exercises, /settings
5. Bottom navigation component for mobile
6. PWA configuration using @vite-pwa/sveltekit

Use the color palette:
- bg-primary: #0a120f
- bg-secondary: #0f1a16
- accent: #10b981 (emerald green)
- success: #22c55e (green)
- warning: #eab308 (yellow)

Create a root layout with:
- Dark background
- Bottom nav on mobile (hidden on desktop)
- Side nav on desktop
- Auth check that redirects to /login if not authenticated
```

### Prompt 2: Database Setup

```
Create Supabase migrations for a hypertrophy training app. Include:

1. profiles table extending auth.users with weight_unit and default_rest_seconds
2. muscle_groups table with id, display_name, category, color, and volume landmarks (mv, mev, mav, mrv)
3. exercises table with name, aliases[], equipment, primary_muscle, secondary_muscles (JSONB with muscle and weight), video_url, rep range, rest time, work_seconds, is_core boolean, created_by
4. training blocks table with user_id, name, total_weeks, current_week, status, time_budget_minutes
5. workout_days table linked to training block with day_number and name
6. exercise_slots table with slot_order, base_sets, set_progression, rep range, superset_group
7. workout_sessions table tracking actual workouts with feedback (pump, soreness, workload)
8. logged_sets table with target/actual weight/reps, rir, completed flag

Add RLS policies so users can only see:
- All core exercises (is_core = true)
- Their own custom exercises (created_by = auth.uid())
- Their own training blocks, workouts, and logged data

Seed the muscle_groups table with: chest, back_lats, back_upper, front_delts, side_delts, rear_delts, biceps, triceps, forearms, quads, hamstrings, glutes, calves, abs, obliques, traps

Include volume landmarks for each muscle group based on RP guidelines.
```

### Prompt 3: Exercise Library

```
Build an exercise library page for a SvelteKit hypertrophy app:

1. Search input that filters by name OR aliases (case insensitive)
2. Filter chips for equipment type (barbell, dumbbell, cable, machine, bodyweight)
3. Filter chips for muscle group (from muscle_groups table)
4. Exercise cards showing:
   - Name
   - Equipment badge
   - Primary muscle (colored badge)
   - Secondary muscles (smaller, with weight shown like "Triceps 0.5")
   - Video link icon (if video_url exists)
   - Rep range
5. "Add Exercise" button that opens a form modal for custom exercises
6. Custom exercises should show a "Custom" badge and allow editing/deletion
7. Core exercises are read-only

Use Supabase for data fetching. Exercise type includes secondary_muscles as JSONB array with {muscle, weight}.
```

### Prompt 4: Volume Tracking

```
Implement volume tracking for a hypertrophy training app in SvelteKit:

1. Create a volume calculation utility that:
   - Takes exercise slots and their exercises
   - Calculates direct sets (from primary muscle)
   - Calculates indirect sets (from secondary muscles × weight)
   - Returns effective sets per muscle group

2. Create a VolumeBar component (mobile-first) that:
   - Shows compact view with emoji indicators (🟢🟡🔴)
   - Displays muscle name and sets/target (e.g., "Chest 12/16")
   - Expands on tap to show full breakdown
   - Sorts by status priority (problems first)

3. Status logic:
   - below_mv (< MV): 🔴 Red
   - at_mev (MV to MEV): 🟡 Yellow  
   - in_mav (MEV to MAV): 🟢 Green
   - approaching_mrv (MAV to MRV): 🟡 Yellow
   - exceeds_mrv (> MRV): 🔴 Red

4. During training block setup, show a sidebar/panel with live volume updates as exercises are added

Volume targets come from muscle_groups table defaults OR user_volume_targets overrides.
```

### Prompt 5: Workout Logging

```
Build the workout logging page for a SvelteKit hypertrophy app:

1. Header showing Week X, Day Y, and workout name
2. VolumeBar component at top (from previous prompt)
3. List of exercise cards, each with:
   - Exercise name with video icon (links to video_url)
   - Muscle tags (primary + secondaries)
   - Previous session summary: "Last: 80 lbs × 12, 12, 11, 10"
   - Recommended: "Today: 85 lbs × 8-10 reps, 4 sets, RIR 3"
   - Set rows with:
     - Set number
     - Weight input (pre-filled with recommendation)
     - Reps input
     - Completion checkbox (green when checked)
   - Add Set button
4. Exercise feedback after completing all sets:
   - Pump rating (none/mild/moderate/great/excessive)
   - Optional notes
5. Complete Workout button that:
   - Prompts for overall feedback (pump, soreness, workload)
   - Saves workout_session with completed_at
   - Navigates to summary

Use optimistic updates - save logged_sets immediately on completion toggle.
Pre-populate weight/reps from progression algorithm.
```

### Prompt 6: Time Estimation

```
Add time estimation to the training block setup in a SvelteKit hypertrophy app:

1. Create a calculateTimeEstimate function that:
   - Takes exercise slots, exercises map, week number, default rest seconds
   - Calculates total work time (sets × work_seconds per exercise)
   - Calculates rest time (sets × rest_seconds)
   - Handles supersets (exercises with same superset_group share rest time)
   - Adds 5 minute warmup buffer
   - Returns { week_number, total_sets, work_time_minutes, rest_time_minutes, total_minutes }

2. Create a projectWorkoutTimes function that:
   - Calculates estimates for Week 1 through final week
   - Accounts for set_progression increasing sets each week
   - Returns array of estimates plus whether final week exceeds budget

3. In the workout day setup UI, show:
   - "Week 1: ~48 min → Week 6: ~82 min"
   - Warning badge if final week exceeds time_budget_minutes
   - Option to set time budget per day

4. Superset handling:
   - Exercises with same superset_group only count rest once per round
   - Show superset badge on exercise cards
   - Allow drag-and-drop to create superset groups
```

### Prompt 7: Offline Mode

```
Implement "Download Today" offline mode for a SvelteKit hypertrophy PWA:

1. Set up Dexie.js with tables:
   - workoutCache: { workout_session_id, workout_day, exercise_slots, exercises, previous_sessions, cached_at }
   - pendingSets: logged sets waiting to sync
   - syncQueue: { entity_type, entity_id, action, payload, created_at }

2. Create a "Download Today" button that:
   - Fetches today's workout session (or next scheduled)
   - Fetches associated workout_day, exercise_slots, full exercise data
   - Fetches last 4 sessions for each exercise (for progression display)
   - Stores everything in IndexedDB
   - Shows success toast with "Ready for offline use"

3. Modify workout logging page to:
   - Check for cached data if offline
   - Use cached data seamlessly
   - Queue logged_sets to syncQueue when offline
   - Show offline indicator in header

4. Create sync service that:
   - Listens for online event
   - Processes syncQueue items
   - Upserts to Supabase
   - Clears synced items
   - Shows sync status/progress

5. Service worker should cache static assets and API responses for exercise library.
```

---

## Appendix: Quick Reference

### Muscle Group IDs
```
chest, back_lats, back_upper, front_delts, side_delts, rear_delts,
biceps, triceps, forearms, quads, hamstrings, glutes, calves,
abs, obliques, traps
```

### Equipment Types
```
barbell, dumbbell, cable, machine, bodyweight, smith_machine, kettlebell, bands
```

### Volume Landmarks (Defaults)
| Muscle | MV | MEV | MAV | MRV |
|--------|----|----|-----|-----|
| Chest | 6 | 10 | 16 | 22 |
| Side Delts | 8 | 12 | 20 | 26 |
| Biceps | 4 | 8 | 14 | 20 |
| Quads | 6 | 8 | 14 | 20 |

### RIR Progression (5-week meso)
| Week | Target RIR |
|------|------------|
| 1 | 4 |
| 2 | 3 |
| 3 | 2 |
| 4 | 1 |
| 5 (Deload) | 4 |

### Weight Increments
| Equipment | Increment |
|-----------|-----------|
| Barbell | 5 lbs |
| Dumbbell | 5 lbs |
| Cable | 5 lbs |
| Machine | 10 lbs |

---

*End of Specification Document*
