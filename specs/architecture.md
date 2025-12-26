# Technical Architecture Document

**Product Name:** MyLiftPal  
**Version:** 1.0  
**Author:** Engineering Team  
**Last Updated:** December 2024  

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [API Design](#4-api-design)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Offline Architecture](#6-offline-architecture)
7. [State Management](#7-state-management)
8. [Performance Considerations](#8-performance-considerations)
9. [Security](#9-security)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Development Guidelines](#12-development-guidelines)

---

## 1. Technology Stack

### 1.1 Stack Overview

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Frontend Framework** | SvelteKit | 2.x | Small bundle, fast iteration, excellent DX |
| **Language** | TypeScript | 5.x | Type safety, better tooling |
| **Styling** | Tailwind CSS | 3.x | Utility-first, rapid development |
| **Database** | Supabase (PostgreSQL) | Latest | Hosted Postgres, real-time, auth built-in |
| **Offline Storage** | Dexie.js (IndexedDB) | 4.x | Promise-based IndexedDB wrapper |
| **PWA** | @vite-pwa/sveltekit | Latest | Service worker, manifest generation |
| **Hosting** | Vercel | - | Excellent SvelteKit support, free tier |
| **Voice** | Web Speech API | Native | Browser-native, no dependencies |
| **OCR** | Tesseract.js | 5.x | Client-side OCR, no server costs |

### 1.2 Frontend Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "dexie": "^4.0.0",
    "lucide-svelte": "^0.300.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-vercel": "^4.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@vite-pwa/sveltekit": "^0.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "svelte": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 1.3 Stack Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  SvelteKit  │  │  Dexie.js   │  │  Service Worker (PWA)   │  │
│  │     App     │  │  IndexedDB  │  │  Cache + Offline        │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────────────┼─────────────────────┘                 │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼───────────────────────────────────────┐
│                     Supabase Cloud                               │
├──────────────────────────┼───────────────────────────────────────┤
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────────────────┐  │
│  │   Auth      │  │  PostgREST  │  │  Realtime (optional)    │  │
│  │  (GoTrue)   │  │     API     │  │  WebSocket              │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
│                          │                                       │
│                   ┌──────┴──────┐                                │
│                   │ PostgreSQL  │                                │
│                   │  Database   │                                │
│                   └─────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 Application Architecture

```
src/
├── lib/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base components (Button, Input, Card)
│   │   ├── workout/         # Workout-specific (ExerciseCard, SetRow)
│   │   ├── volume/          # Volume tracking (VolumeBar, VolumeIndicator)
│   │   └── layout/          # Layout components (Nav, Header)
│   │
│   ├── stores/              # Svelte stores for state management
│   │   ├── auth.ts          # Authentication state
│   │   ├── workout.ts       # Active workout state
│   │   ├── training-block.ts     # Training Block data
│   │   └── offline.ts       # Offline/sync state
│   │
│   ├── services/            # Business logic & API calls
│   │   ├── supabase.ts      # Supabase client
│   │   ├── exercises.ts     # Exercise CRUD
│   │   ├── training-blocks.ts    # Training Block CRUD
│   │   ├── workouts.ts      # Workout logging
│   │   ├── volume.ts        # Volume calculations
│   │   ├── progression.ts   # Progression algorithm
│   │   └── sync.ts          # Offline sync logic
│   │
│   ├── db/                  # Dexie.js offline database
│   │   ├── schema.ts        # IndexedDB schema
│   │   └── operations.ts    # Offline CRUD operations
│   │
│   ├── utils/               # Utility functions
│   │   ├── time.ts          # Time estimation
│   │   ├── format.ts        # Formatting helpers
│   │   └── validation.ts    # Input validation
│   │
│   └── types/               # TypeScript types
│       ├── database.ts      # Database types (generated)
│       ├── models.ts        # Application models
│       └── api.ts           # API request/response types
│
├── routes/
│   ├── +layout.svelte       # Root layout with nav
│   ├── +page.svelte         # Home / Dashboard
│   ├── auth/
│   │   ├── login/+page.svelte
│   │   ├── signup/+page.svelte
│   │   └── callback/+page.svelte
│   ├── blocks/
│   │   ├── +page.svelte     # List training blocks
│   │   ├── [id]/+page.svelte # Training Block detail
│   │   └── new/+page.svelte  # Create wizard
│   ├── exercises/
│   │   ├── +page.svelte     # Exercise library
│   │   └── [id]/+page.svelte # Exercise detail
│   ├── workout/
│   │   └── [sessionId]/+page.svelte  # Active workout
│   └── settings/
│       └── +page.svelte
│
└── app.html                 # HTML template
```

### 2.2 Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                          User Action                              │
│                    (e.g., log a set)                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Svelte Component                             │
│                   (SetRow.svelte)                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Svelte Store                                 │
│                   (workoutStore)                                 │
│              - Update local state immediately                     │
│              - Trigger side effects                              │
└───────────────────┬──────────────────────┬───────────────────────┘
                    │                      │
        ┌───────────▼──────────┐ ┌─────────▼─────────┐
        │   Online Path        │ │   Offline Path    │
        │                      │ │                   │
        │  ┌────────────────┐  │ │ ┌───────────────┐ │
        │  │ Supabase API   │  │ │ │  Dexie.js     │ │
        │  │ (immediate)    │  │ │ │  IndexedDB    │ │
        │  └────────────────┘  │ │ └───────────────┘ │
        │                      │ │         │        │
        │                      │ │         ▼        │
        │                      │ │ ┌───────────────┐ │
        │                      │ │ │  Sync Queue   │ │
        │                      │ │ │  (pending)    │ │
        │                      │ │ └───────────────┘ │
        └──────────────────────┘ └───────────────────┘
                    │                      │
                    │      On Reconnect    │
                    │◀─────────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │   PostgreSQL         │
        │   (source of truth)  │
        └──────────────────────┘
```

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     profiles    │       │  muscle_groups  │
├─────────────────┤       ├─────────────────┤
│ id (PK, FK auth)│       │ id (PK)         │
│ display_name    │       │ display_name    │
│ weight_unit     │       │ category        │
│ default_rest_sec│       │ color           │
│ created_at      │       │ mv, mev, mav,mrv│
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 1:N                     │ referenced by
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   training_blocks    │       │    exercises    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ name            │
│ name            │       │ aliases[]       │
│ total_weeks     │       │ equipment       │
│ current_week    │       │ primary_muscle  │
│ status          │       │ secondary_muscl │
│ started_at      │       │ is_core         │
└────────┬────────┘       │ created_by (FK) │
         │                └────────┬────────┘
         │ 1:N                     │
         ▼                         │
┌─────────────────┐                │
│  workout_days   │                │
├─────────────────┤                │
│ id (PK)         │                │
│ training_block_id(FK)│                │
│ day_number      │                │
│ name            │                │
│ target_muscles[]│                │
└────────┬────────┘                │
         │                         │
         │ 1:N                     │
         ▼                         │
┌─────────────────┐                │
│ exercise_slots  │◀───────────────┘
├─────────────────┤    references
│ id (PK)         │
│ workout_day_id  │
│ exercise_id (FK)│
│ slot_order      │
│ base_sets       │
│ set_progression │
│ rep_range_min   │
│ rep_range_max   │
│ superset_group  │
└────────┬────────┘
         │
         │ referenced by
         ▼
┌─────────────────┐       ┌─────────────────┐
│workout_sessions │       │   logged_sets   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──1:N──│ id (PK)         │
│ user_id (FK)    │       │ session_id (FK) │
│ training_block_id    │       │ exercise_slot_id│
│ workout_day_id  │       │ exercise_id     │
│ week_number     │       │ set_number      │
│ started_at      │       │ target_weight   │
│ completed_at    │       │ actual_weight   │
│ status          │       │ target_reps     │
│ feedback (jsonb)│       │ actual_reps     │
└─────────────────┘       │ rir             │
                          │ completed       │
                          └─────────────────┘
```

### 3.2 Complete Schema (SQL)

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  default_rest_seconds INTEGER DEFAULT 90,
  theme TEXT DEFAULT 'emerald',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- MUSCLE GROUPS (reference table)
-- ============================================
CREATE TABLE public.muscle_groups (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('upper', 'lower', 'core')),
  color TEXT NOT NULL,
  mv INTEGER NOT NULL DEFAULT 6,
  mev INTEGER NOT NULL DEFAULT 10,
  mav INTEGER NOT NULL DEFAULT 16,
  mrv INTEGER NOT NULL DEFAULT 22
);

-- ============================================
-- EXERCISES
-- ============================================
CREATE TABLE public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  equipment TEXT NOT NULL CHECK (equipment IN ('barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'other')),
  primary_muscle TEXT NOT NULL REFERENCES public.muscle_groups(id),
  secondary_muscles JSONB DEFAULT '[]',
  video_url TEXT,
  default_rep_min INTEGER DEFAULT 8,
  default_rep_max INTEGER DEFAULT 12,
  default_rest_seconds INTEGER DEFAULT 90,
  work_seconds INTEGER DEFAULT 45,
  is_core BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple indexes (removed full-text search index)
CREATE INDEX idx_exercises_equipment ON public.exercises(equipment);
CREATE INDEX idx_exercises_primary_muscle ON public.exercises(primary_muscle);
CREATE INDEX idx_exercises_name ON public.exercises(name);

-- ============================================
-- TRAINING BLOCKS
-- ============================================
CREATE TABLE public.training_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_weeks INTEGER NOT NULL CHECK (total_weeks BETWEEN 3 AND 8),
  current_week INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  time_budget_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_blocks_user ON public.training_blocks(user_id);
CREATE INDEX idx_training_blocks_status ON public.training_blocks(user_id, status);

-- ============================================
-- WORKOUT DAYS
-- ============================================
CREATE TABLE public.workout_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  training_block_id UUID NOT NULL REFERENCES public.training_blocks(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_muscles TEXT[] DEFAULT '{}',
  time_budget_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(training_block_id, day_number)
);

CREATE INDEX idx_workout_days_training_block ON public.workout_days(training_block_id);

-- ============================================
-- EXERCISE SLOTS
-- ============================================
CREATE TABLE public.exercise_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_day_id UUID NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  slot_order INTEGER NOT NULL,
  base_sets INTEGER NOT NULL DEFAULT 3,
  set_progression NUMERIC(3,1) DEFAULT 0.5,
  rep_range_min INTEGER NOT NULL DEFAULT 8,
  rep_range_max INTEGER NOT NULL DEFAULT 12,
  rest_seconds INTEGER,
  superset_group TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workout_day_id, slot_order)
);

CREATE INDEX idx_exercise_slots_day ON public.exercise_slots(workout_day_id);

-- ============================================
-- WORKOUT SESSIONS
-- ============================================
CREATE TABLE public.workout_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_block_id UUID NOT NULL REFERENCES public.training_blocks(id) ON DELETE CASCADE,
  workout_day_id UUID NOT NULL REFERENCES public.workout_days(id),
  week_number INTEGER NOT NULL,
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped')),
  duration_minutes INTEGER,
  overall_pump TEXT CHECK (overall_pump IN ('none', 'mild', 'moderate', 'great', 'excessive')),
  overall_soreness TEXT CHECK (overall_soreness IN ('none', 'mild', 'moderate', 'severe')),
  workload_rating TEXT CHECK (workload_rating IN ('too_easy', 'easy', 'just_right', 'hard', 'too_hard')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX idx_sessions_training_block ON public.workout_sessions(training_block_id);
CREATE INDEX idx_sessions_day ON public.workout_sessions(workout_day_id);
CREATE INDEX idx_sessions_date ON public.workout_sessions(user_id, scheduled_date);

-- ============================================
-- LOGGED SETS
-- ============================================
CREATE TABLE public.logged_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_slot_id UUID NOT NULL REFERENCES public.exercise_slots(id),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  set_number INTEGER NOT NULL,
  target_weight NUMERIC(6,2),
  actual_weight NUMERIC(6,2),
  target_reps INTEGER,
  actual_reps INTEGER,
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  rir INTEGER CHECK (rir BETWEEN 0 AND 5),
  completed BOOLEAN DEFAULT false,
  pump_rating TEXT CHECK (pump_rating IN ('none', 'mild', 'moderate', 'great', 'excessive')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, exercise_slot_id, set_number)
);

CREATE INDEX idx_logged_sets_session ON public.logged_sets(session_id);
CREATE INDEX idx_logged_sets_exercise ON public.logged_sets(exercise_id);

-- ============================================
-- USER VOLUME TARGETS
-- ============================================
CREATE TABLE public.user_volume_targets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_group_id TEXT NOT NULL REFERENCES public.muscle_groups(id),
  mev INTEGER,
  mav INTEGER,
  mrv INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, muscle_group_id)
);

-- ============================================
-- SYNC QUEUE
-- ============================================
CREATE TABLE public.sync_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX idx_sync_queue_user ON public.sync_queue(user_id, synced_at);
```

### 3.3 Seed Data

```sql
-- ============================================
-- SEED: MUSCLE GROUPS
-- ============================================
INSERT INTO public.muscle_groups (id, display_name, category, color, mv, mev, mav, mrv) VALUES
  -- Upper Body
  ('chest', 'Chest', 'upper', '#ef4444', 6, 10, 16, 22),
  ('back_lats', 'Back (Lats)', 'upper', '#3b82f6', 6, 10, 16, 22),
  ('back_upper', 'Back (Upper)', 'upper', '#60a5fa', 4, 8, 14, 20),
  ('front_delts', 'Front Delts', 'upper', '#f97316', 0, 0, 8, 12),
  ('side_delts', 'Side Delts', 'upper', '#fb923c', 8, 12, 20, 26),
  ('rear_delts', 'Rear Delts', 'upper', '#fdba74', 6, 8, 16, 22),
  ('biceps', 'Biceps', 'upper', '#22c55e', 4, 8, 14, 20),
  ('triceps', 'Triceps', 'upper', '#14b8a6', 4, 6, 12, 18),
  ('forearms', 'Forearms', 'upper', '#84cc16', 2, 4, 10, 16),
  ('traps', 'Traps', 'upper', '#6366f1', 0, 4, 12, 18),
  -- Lower Body
  ('quads', 'Quads', 'lower', '#8b5cf6', 6, 8, 14, 20),
  ('hamstrings', 'Hamstrings', 'lower', '#a855f7', 4, 6, 12, 18),
  ('glutes', 'Glutes', 'lower', '#ec4899', 0, 4, 12, 18),
  ('calves', 'Calves', 'lower', '#d946ef', 6, 8, 14, 20),
  -- Core
  ('abs', 'Abs', 'core', '#06b6d4', 0, 4, 12, 18),
  ('obliques', 'Obliques', 'core', '#0ea5e9', 0, 2, 8, 14);

-- ============================================
-- SEED: CORE EXERCISES
-- ============================================
INSERT INTO public.exercises (name, aliases, equipment, primary_muscle, secondary_muscles, video_url, default_rep_min, default_rep_max, default_rest_seconds, work_seconds, is_core) VALUES
  -- CHEST
  ('Barbell Bench Press', ARRAY['Bench Press', 'Flat Bench', 'BB Bench'], 'barbell', 'chest',
   '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]',
   'https://youtube.com/watch?v=example', 6, 10, 120, 45, true),
  
  ('Incline Dumbbell Press', ARRAY['Incline DB Press', 'Incline Press'], 'dumbbell', 'chest',
   '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.4}]',
   NULL, 8, 12, 90, 45, true),
  
  ('Cable Flye', ARRAY['Cable Fly', 'Cable Crossover', 'Pec Fly'], 'cable', 'chest',
   '[{"muscle": "front_delts", "weight": 0.2}]',
   NULL, 10, 15, 60, 40, true),
  
  ('Pec Deck', ARRAY['Pec Deck Fly', 'Machine Fly', 'Butterfly'], 'machine', 'chest',
   '[]', NULL, 10, 15, 60, 40, true),
  
  ('Dips', ARRAY['Chest Dips', 'Parallel Bar Dips'], 'bodyweight', 'chest',
   '[{"muscle": "triceps", "weight": 0.6}, {"muscle": "front_delts", "weight": 0.3}]',
   NULL, 8, 12, 90, 45, true),

  -- BACK
  ('Barbell Row', ARRAY['Bent Over Row', 'BB Row', 'Pendlay Row'], 'barbell', 'back_lats',
   '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "rear_delts", "weight": 0.3}, {"muscle": "back_upper", "weight": 0.5}]',
   NULL, 6, 10, 120, 45, true),
  
  ('Lat Pulldown', ARRAY['Pulldown', 'Cable Pulldown', 'Wide Grip Pulldown'], 'cable', 'back_lats',
   '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "rear_delts", "weight": 0.2}]',
   NULL, 8, 12, 90, 45, true),
  
  ('Seated Cable Row', ARRAY['Cable Row', 'Seated Row', 'Low Row'], 'cable', 'back_lats',
   '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "rear_delts", "weight": 0.3}, {"muscle": "back_upper", "weight": 0.4}]',
   NULL, 8, 12, 90, 45, true),
  
  ('Pull-Up', ARRAY['Pullup', 'Chin Up', 'Chinup'], 'bodyweight', 'back_lats',
   '[{"muscle": "biceps", "weight": 0.5}, {"muscle": "rear_delts", "weight": 0.2}]',
   NULL, 6, 12, 120, 45, true),
  
  ('Dumbbell Row', ARRAY['DB Row', 'One Arm Row', 'Single Arm Row'], 'dumbbell', 'back_lats',
   '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "rear_delts", "weight": 0.3}]',
   NULL, 8, 12, 60, 40, true),
  
  ('T-Bar Row', ARRAY['Landmine Row', 'T Bar'], 'barbell', 'back_lats',
   '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "rear_delts", "weight": 0.3}, {"muscle": "back_upper", "weight": 0.5}]',
   NULL, 8, 12, 90, 45, true),

  -- SHOULDERS
  ('Overhead Press', ARRAY['OHP', 'Shoulder Press', 'Military Press', 'Barbell Press'], 'barbell', 'front_delts',
   '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "side_delts", "weight": 0.3}]',
   NULL, 6, 10, 120, 45, true),
  
  ('Dumbbell Lateral Raise', ARRAY['Lateral Raise', 'Side Raise', 'DB Lateral Raise'], 'dumbbell', 'side_delts',
   '[]', NULL, 12, 20, 60, 35, true),
  
  ('Cable Lateral Raise', ARRAY['Cable Side Raise'], 'cable', 'side_delts',
   '[]', NULL, 12, 20, 60, 35, true),
  
  ('Face Pull', ARRAY['Facepull', 'Rope Face Pull'], 'cable', 'rear_delts',
   '[{"muscle": "back_upper", "weight": 0.3}, {"muscle": "side_delts", "weight": 0.2}]',
   NULL, 15, 20, 60, 35, true),
  
  ('Reverse Pec Deck', ARRAY['Rear Delt Fly', 'Reverse Fly Machine'], 'machine', 'rear_delts',
   '[]', NULL, 12, 20, 60, 35, true),

  -- BICEPS
  ('Barbell Curl', ARRAY['BB Curl', 'Standing Curl', 'Straight Bar Curl'], 'barbell', 'biceps',
   '[]', NULL, 8, 12, 60, 40, true),
  
  ('Dumbbell Curl', ARRAY['DB Curl', 'Bicep Curl'], 'dumbbell', 'biceps',
   '[]', NULL, 8, 12, 60, 40, true),
  
  ('Hammer Curl', ARRAY['DB Hammer Curl', 'Neutral Grip Curl'], 'dumbbell', 'biceps',
   '[{"muscle": "forearms", "weight": 0.4}]',
   NULL, 8, 12, 60, 40, true),
  
  ('Cable Curl', ARRAY['Cable Bicep Curl'], 'cable', 'biceps',
   '[]', NULL, 10, 15, 60, 35, true),
  
  ('Preacher Curl', ARRAY['EZ Bar Preacher Curl', 'Scott Curl'], 'barbell', 'biceps',
   '[]', NULL, 8, 12, 60, 40, true),

  -- TRICEPS
  ('Tricep Pushdown', ARRAY['Cable Pushdown', 'Rope Pushdown', 'Tricep Pressdown'], 'cable', 'triceps',
   '[]', NULL, 10, 15, 60, 35, true),
  
  ('Skull Crusher', ARRAY['Lying Tricep Extension', 'French Press', 'Nose Breaker'], 'barbell', 'triceps',
   '[]', NULL, 8, 12, 90, 40, true),
  
  ('Overhead Tricep Extension', ARRAY['Overhead Extension', 'French Press', 'Tricep Extension'], 'dumbbell', 'triceps',
   '[]', NULL, 10, 15, 60, 40, true),
  
  ('Close Grip Bench Press', ARRAY['CGBP', 'Close Grip Bench'], 'barbell', 'triceps',
   '[{"muscle": "chest", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]',
   NULL, 6, 10, 90, 45, true),

  -- QUADS
  ('Barbell Squat', ARRAY['Back Squat', 'Squat', 'BB Squat'], 'barbell', 'quads',
   '[{"muscle": "glutes", "weight": 0.6}, {"muscle": "hamstrings", "weight": 0.3}]',
   NULL, 6, 10, 180, 50, true),
  
  ('Leg Press', ARRAY['45 Degree Leg Press', 'Machine Leg Press'], 'machine', 'quads',
   '[{"muscle": "glutes", "weight": 0.4}]',
   NULL, 8, 12, 120, 45, true),
  
  ('Leg Extension', ARRAY['Quad Extension', 'Knee Extension'], 'machine', 'quads',
   '[]', NULL, 10, 15, 60, 40, true),
  
  ('Bulgarian Split Squat', ARRAY['BSS', 'Rear Foot Elevated Split Squat'], 'dumbbell', 'quads',
   '[{"muscle": "glutes", "weight": 0.5}]',
   NULL, 8, 12, 90, 45, true),

  -- HAMSTRINGS
  ('Romanian Deadlift', ARRAY['RDL', 'Stiff Leg Deadlift', 'SLDL'], 'barbell', 'hamstrings',
   '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "back_lats", "weight": 0.2}]',
   NULL, 8, 12, 120, 45, true),
  
  ('Lying Leg Curl', ARRAY['Leg Curl', 'Hamstring Curl', 'Prone Leg Curl'], 'machine', 'hamstrings',
   '[]', NULL, 10, 15, 60, 40, true),
  
  ('Seated Leg Curl', ARRAY['Seated Hamstring Curl'], 'machine', 'hamstrings',
   '[]', NULL, 10, 15, 60, 40, true),

  -- GLUTES
  ('Hip Thrust', ARRAY['Barbell Hip Thrust', 'Glute Bridge'], 'barbell', 'glutes',
   '[{"muscle": "hamstrings", "weight": 0.3}]',
   NULL, 8, 12, 90, 45, true),
  
  ('Cable Pull Through', ARRAY['Pull Through'], 'cable', 'glutes',
   '[{"muscle": "hamstrings", "weight": 0.4}]',
   NULL, 12, 15, 60, 40, true),

  -- CALVES
  ('Standing Calf Raise', ARRAY['Calf Raise', 'Machine Calf Raise'], 'machine', 'calves',
   '[]', NULL, 12, 20, 60, 35, true),
  
  ('Seated Calf Raise', ARRAY['Seated Calf'], 'machine', 'calves',
   '[]', NULL, 12, 20, 60, 35, true),

  -- ABS
  ('Cable Crunch', ARRAY['Rope Crunch', 'Kneeling Cable Crunch'], 'cable', 'abs',
   '[]', NULL, 12, 20, 60, 35, true),
  
  ('Hanging Leg Raise', ARRAY['Leg Raise', 'Hanging Knee Raise'], 'bodyweight', 'abs',
   '[]', NULL, 10, 15, 60, 40, true),
  
  ('Ab Wheel Rollout', ARRAY['Ab Wheel', 'Rollout'], 'other', 'abs',
   '[]', NULL, 8, 15, 60, 40, true);
```

### 3.4 Row Level Security (RLS) Policies

```sql
-- ============================================
-- RLS POLICIES
-- Run AFTER creating tables
-- ============================================

-- Enable RLS on all user-data tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_volume_targets ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Training blocks: users can only access their own blocks
CREATE POLICY "Users can view own training blocks" ON public.training_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training blocks" ON public.training_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training blocks" ON public.training_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training blocks" ON public.training_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Workout days: access through training block ownership
CREATE POLICY "Users can view workout days of own blocks" ON public.workout_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.training_blocks
      WHERE training_blocks.id = workout_days.training_block_id
      AND training_blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workout days in own blocks" ON public.workout_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_blocks
      WHERE training_blocks.id = training_block_id
      AND training_blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workout days in own blocks" ON public.workout_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.training_blocks
      WHERE training_blocks.id = workout_days.training_block_id
      AND training_blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workout days in own blocks" ON public.workout_days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.training_blocks
      WHERE training_blocks.id = workout_days.training_block_id
      AND training_blocks.user_id = auth.uid()
    )
  );

-- Exercise slots: access through workout day -> training block ownership
CREATE POLICY "Users can view exercise slots of own blocks" ON public.exercise_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_days
      JOIN public.training_blocks ON training_blocks.id = workout_days.training_block_id
      WHERE workout_days.id = exercise_slots.workout_day_id
      AND training_blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercise slots in own blocks" ON public.exercise_slots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_days
      JOIN public.training_blocks ON training_blocks.id = workout_days.training_block_id
      WHERE workout_days.id = workout_day_id
      AND training_blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercise slots in own blocks" ON public.exercise_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_days
      JOIN public.training_blocks ON training_blocks.id = workout_days.training_block_id
      WHERE workout_days.id = exercise_slots.workout_day_id
      AND training_blocks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercise slots in own blocks" ON public.exercise_slots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_days
      JOIN public.training_blocks ON training_blocks.id = workout_days.training_block_id
      WHERE workout_days.id = exercise_slots.workout_day_id
      AND training_blocks.user_id = auth.uid()
    )
  );

-- Workout sessions: users can only access their own sessions
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Logged sets: access through session ownership
CREATE POLICY "Users can view logged sets of own sessions" ON public.logged_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = logged_sets.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create logged sets in own sessions" ON public.logged_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update logged sets in own sessions" ON public.logged_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = logged_sets.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete logged sets in own sessions" ON public.logged_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = logged_sets.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- User volume targets: users can only access their own
CREATE POLICY "Users can view own volume targets" ON public.user_volume_targets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own volume targets" ON public.user_volume_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own volume targets" ON public.user_volume_targets
  FOR UPDATE USING (auth.uid() = user_id);

-- Reference tables: everyone can read
-- Muscle groups (no RLS - public read)
-- Exercises: public read, user-created exercises restricted

CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);

CREATE POLICY "Users can create own exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update own exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own exercises" ON public.exercises
  FOR DELETE USING (auth.uid() = created_by);
```

### 3.5 TypeScript Types (Generated)

```typescript
// lib/types/database.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          weight_unit: 'lbs' | 'kg';
          default_rest_seconds: number;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      
      muscle_groups: {
        Row: {
          id: string;
          display_name: string;
          category: 'upper' | 'lower' | 'core';
          color: string;
          mv: number;
          mev: number;
          mav: number;
          mrv: number;
        };
        Insert: Database['public']['Tables']['muscle_groups']['Row'];
        Update: Partial<Database['public']['Tables']['muscle_groups']['Insert']>;
      };
      
      exercises: {
        Row: {
          id: string;
          name: string;
          aliases: string[];
          equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other';
          primary_muscle: string;
          secondary_muscles: { muscle: string; weight: number }[];
          video_url: string | null;
          default_rep_min: number;
          default_rep_max: number;
          default_rest_seconds: number;
          work_seconds: number;
          is_core: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      
      training blocks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          total_weeks: number;
          current_week: number;
          current_day: number;
          status: 'draft' | 'active' | 'paused' | 'completed';
          time_budget_minutes: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['training blocks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['training blocks']['Insert']>;
      };
      
      workout_days: {
        Row: {
          id: string;
          training_block_id: string;
          day_number: number;
          name: string;
          target_muscles: string[];
          time_budget_minutes: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_days']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workout_days']['Insert']>;
      };
      
      exercise_slots: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['exercise_slots']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['exercise_slots']['Insert']>;
      };
      
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          training_block_id: string;
          workout_day_id: string;
          week_number: number;
          scheduled_date: string | null;
          started_at: string | null;
          completed_at: string | null;
          status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
          duration_minutes: number | null;
          overall_pump: 'none' | 'mild' | 'moderate' | 'great' | 'excessive' | null;
          overall_soreness: 'none' | 'mild' | 'moderate' | 'severe' | null;
          workload_rating: 'too_easy' | 'easy' | 'just_right' | 'hard' | 'too_hard' | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };
      
      logged_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_slot_id: string;
          exercise_id: string;
          set_number: number;
          target_weight: number | null;
          actual_weight: number | null;
          target_reps: number | null;
          actual_reps: number | null;
          weight_unit: 'lbs' | 'kg';
          rir: number | null;
          completed: boolean;
          pump_rating: 'none' | 'mild' | 'moderate' | 'great' | 'excessive' | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: Omit<Database['public']['Tables']['logged_sets']['Row'], 'id' | 'logged_at'>;
        Update: Partial<Database['public']['Tables']['logged_sets']['Insert']>;
      };
    };
  };
}
```

---

## 4. API Design

### 4.1 Supabase Client Setup

```typescript
// lib/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### 4.2 Service Layer Pattern

```typescript
// lib/services/exercises.ts
import { supabase } from './supabase';
import type { Database } from '$lib/types/database';

type Exercise = Database['public']['Tables']['exercises']['Row'];
type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];

export const exerciseService = {
  async getAll(filters?: { equipment?: string; muscle?: string }) {
    let query = supabase
      .from('exercises')
      .select('*, muscle_groups!primary_muscle(*)');
    
    if (filters?.equipment) {
      query = query.eq('equipment', filters.equipment);
    }
    if (filters?.muscle) {
      query = query.eq('primary_muscle', filters.muscle);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data;
  },
  
  async search(term: string) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`name.ilike.%${term}%,aliases.cs.{${term}}`);
    
    if (error) throw error;
    return data;
  },
  
  async create(exercise: ExerciseInsert) {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercise)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async update(id: string, updates: Partial<ExerciseInsert>) {
    const { data, error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(id: string) {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
```

### 4.3 API Patterns

| Operation | Supabase Method | Notes |
|-----------|-----------------|-------|
| List all | `.select()` | Supports filtering, ordering |
| Get one | `.select().eq('id', id).single()` | Returns single row |
| Create | `.insert(data).select().single()` | Returns created row |
| Update | `.update(data).eq('id', id).select().single()` | Returns updated row |
| Delete | `.delete().eq('id', id)` | Returns nothing |
| Search | `.or()` with `ilike` | Full-text alternative |

---

## 5. Authentication & Authorization

### 5.1 Auth Flow

```typescript
// lib/services/auth.ts
import { supabase } from './supabase';

export const authService = {
  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });
    if (error) throw error;
    return data;
  },
  
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
  
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
```

### 5.2 Auth Store (Svelte)

```typescript
// lib/stores/auth.ts
import { writable, derived } from 'svelte/store';
import { authService } from '$lib/services/auth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    session: null,
    loading: true
  });
  
  // Initialize
  authService.getSession().then(session => {
    set({
      user: session?.user ?? null,
      session,
      loading: false
    });
  });
  
  // Listen for changes
  authService.onAuthStateChange((event, session) => {
    set({
      user: session?.user ?? null,
      session,
      loading: false
    });
  });
  
  return {
    subscribe,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut
  };
}

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, $auth => !!$auth.user);
```

### 5.3 Route Protection

```typescript
// routes/+layout.ts
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/services/supabase';

export const load = async ({ url }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const protectedRoutes = ['/blocks', '/workout', '/exercises', '/settings'];
  const isProtected = protectedRoutes.some(route => url.pathname.startsWith(route));
  
  if (isProtected && !session) {
    throw redirect(303, `/auth/login?redirect=${url.pathname}`);
  }
  
  return { session };
};
```

---

## 6. Offline Architecture

### 6.1 Dexie.js Schema

```typescript
// lib/db/schema.ts
import Dexie, { Table } from 'dexie';

interface CachedWorkout {
  id: string;
  sessionId: string;
  workoutDayId: string;
  weekNumber: number;
  exercises: CachedExercise[];
  cachedAt: Date;
}

interface CachedExercise {
  slotId: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: { muscle: string; weight: number }[];
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  previousSessions: PreviousSet[][];  // Last 4 sessions
}

interface PreviousSet {
  weight: number;
  reps: number;
  rir: number;
}

interface PendingSet {
  id: string;
  sessionId: string;
  exerciseSlotId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  completed: boolean;
  loggedAt: Date;
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: string;
  payload: any;
  createdAt: Date;
  retryCount: number;
}

class MyLiftPalDB extends Dexie {
  cachedWorkouts!: Table<CachedWorkout, string>;
  pendingSets!: Table<PendingSet, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  
  constructor() {
    super('MyLiftPalDB');
    
    this.version(1).stores({
      cachedWorkouts: 'id, sessionId, cachedAt',
      pendingSets: 'id, sessionId, synced',
      syncQueue: 'id, createdAt'
    });
  }
}

export const db = new MyLiftPalDB();
```

### 6.2 Offline Service

```typescript
// lib/services/offline.ts
import { db } from '$lib/db/schema';
import { supabase } from './supabase';

export const offlineService = {
  async downloadTodaysWorkout(sessionId: string) {
    // Fetch workout structure
    const { data: session } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_day:workout_days(
          *,
          exercise_slots(
            *,
            exercise:exercises(*)
          )
        )
      `)
      .eq('id', sessionId)
      .single();
    
    if (!session) throw new Error('Session not found');
    
    // Fetch previous sessions for each exercise
    const exerciseIds = session.workout_day.exercise_slots.map(
      (s: any) => s.exercise_id
    );
    
    const { data: previousSets } = await supabase
      .from('logged_sets')
      .select('*, workout_sessions!inner(week_number)')
      .in('exercise_id', exerciseIds)
      .eq('workout_sessions.training_block_id', session.training_block_id)
      .order('logged_at', { ascending: false })
      .limit(100);
    
    // Transform and cache
    const cachedWorkout = transformToCachedWorkout(session, previousSets);
    await db.cachedWorkouts.put(cachedWorkout);
    
    return cachedWorkout;
  },
  
  async logSetOffline(set: Omit<PendingSet, 'synced'>) {
    await db.pendingSets.add({
      ...set,
      synced: false
    });
    
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      operation: 'INSERT',
      table: 'logged_sets',
      recordId: set.id,
      payload: set,
      createdAt: new Date(),
      retryCount: 0
    });
  },
  
  async syncPendingChanges() {
    const pending = await db.syncQueue
      .where('retryCount')
      .below(5)
      .toArray();
    
    for (const item of pending) {
      try {
        if (item.operation === 'INSERT') {
          await supabase.from(item.table).insert(item.payload);
        } else if (item.operation === 'UPDATE') {
          await supabase
            .from(item.table)
            .update(item.payload)
            .eq('id', item.recordId);
        }
        
        await db.syncQueue.delete(item.id);
        
        if (item.table === 'logged_sets') {
          await db.pendingSets.update(item.recordId, { synced: true });
        }
      } catch (error) {
        await db.syncQueue.update(item.id, {
          retryCount: item.retryCount + 1
        });
      }
    }
  },
  
  async getCachedWorkout(sessionId: string) {
    return db.cachedWorkouts.get(sessionId);
  },
  
  async isWorkoutCached(sessionId: string) {
    const workout = await db.cachedWorkouts.get(sessionId);
    if (!workout) return false;
    
    // Check if cache is less than 24 hours old
    const ageMs = Date.now() - workout.cachedAt.getTime();
    return ageMs < 24 * 60 * 60 * 1000;
  }
};
```

### 6.3 Online/Offline Detection

```typescript
// lib/stores/offline.ts
import { writable, derived } from 'svelte/store';
import { offlineService } from '$lib/services/offline';

export const isOnline = writable(navigator.onLine);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline.set(true);
    // Trigger sync when coming back online
    offlineService.syncPendingChanges();
  });
  
  window.addEventListener('offline', () => {
    isOnline.set(false);
  });
}

export const pendingSyncCount = writable(0);

// Update pending count periodically
async function updatePendingCount() {
  const count = await db.syncQueue.count();
  pendingSyncCount.set(count);
}
```

---

## 7. State Management

### 7.1 Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Global Stores                           │
├─────────────────────────────────────────────────────────────┤
│  auth        │ User session, profile                        │
│  isOnline    │ Network status                               │
│  syncStatus  │ Pending sync count, last sync time          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Feature Stores                            │
├─────────────────────────────────────────────────────────────┤
│  training block   │ Active training block, current week/day          │
│  workout     │ Active workout session, logged sets         │
│  exercises   │ Cached exercise list, search results        │
│  volume      │ Calculated volume per muscle group          │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Workout Store Example

```typescript
// lib/stores/workout.ts
import { writable, derived } from 'svelte/store';
import type { LoggedSet, WorkoutSession, ExerciseSlot } from '$lib/types';
import { workoutService } from '$lib/services/workouts';
import { offlineService } from '$lib/services/offline';
import { isOnline } from './offline';

interface WorkoutState {
  session: WorkoutSession | null;
  exercises: ExerciseSlot[];
  loggedSets: Map<string, LoggedSet[]>;  // slotId -> sets
  loading: boolean;
  error: string | null;
}

function createWorkoutStore() {
  const { subscribe, set, update } = writable<WorkoutState>({
    session: null,
    exercises: [],
    loggedSets: new Map(),
    loading: false,
    error: null
  });
  
  return {
    subscribe,
    
    async startWorkout(sessionId: string) {
      update(s => ({ ...s, loading: true }));
      
      try {
        let data;
        const online = get(isOnline);
        
        if (online) {
          data = await workoutService.getSession(sessionId);
        } else {
          data = await offlineService.getCachedWorkout(sessionId);
        }
        
        set({
          session: data.session,
          exercises: data.exercises,
          loggedSets: new Map(),
          loading: false,
          error: null
        });
      } catch (error) {
        update(s => ({
          ...s,
          loading: false,
          error: 'Failed to load workout'
        }));
      }
    },
    
    async logSet(slotId: string, setData: Partial<LoggedSet>) {
      const setId = crypto.randomUUID();
      const newSet: LoggedSet = {
        id: setId,
        session_id: get(this).session!.id,
        exercise_slot_id: slotId,
        set_number: (get(this).loggedSets.get(slotId)?.length ?? 0) + 1,
        ...setData,
        logged_at: new Date().toISOString()
      };
      
      // Optimistic update
      update(s => {
        const sets = s.loggedSets.get(slotId) ?? [];
        s.loggedSets.set(slotId, [...sets, newSet]);
        return { ...s };
      });
      
      // Persist
      const online = get(isOnline);
      if (online) {
        await workoutService.logSet(newSet);
      } else {
        await offlineService.logSetOffline(newSet);
      }
    },
    
    async completeWorkout(feedback: WorkoutFeedback) {
      const session = get(this).session;
      if (!session) return;
      
      const online = get(isOnline);
      if (online) {
        await workoutService.completeSession(session.id, feedback);
      } else {
        await offlineService.queueSessionComplete(session.id, feedback);
      }
      
      set({
        session: null,
        exercises: [],
        loggedSets: new Map(),
        loading: false,
        error: null
      });
    }
  };
}

export const workout = createWorkoutStore();

// Derived stores
export const currentExercise = derived(workout, $workout => {
  // Find first exercise with incomplete sets
  for (const exercise of $workout.exercises) {
    const sets = $workout.loggedSets.get(exercise.id) ?? [];
    if (sets.length < exercise.targetSets) {
      return exercise;
    }
  }
  return null;
});

export const workoutProgress = derived(workout, $workout => {
  const totalSets = $workout.exercises.reduce(
    (sum, ex) => sum + ex.targetSets, 0
  );
  const completedSets = Array.from($workout.loggedSets.values())
    .reduce((sum, sets) => sum + sets.filter(s => s.completed).length, 0);
  
  return {
    completed: completedSets,
    total: totalSets,
    percentage: totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  };
});
```

---

## 8. Performance Considerations

### 8.1 Bundle Optimization

```javascript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'supabase': ['@supabase/supabase-js'],
          'dexie': ['dexie'],
        }
      }
    }
  }
});
```

### 8.2 Data Fetching Strategy

| Data Type | Strategy | Cache Duration |
|-----------|----------|----------------|
| Muscle groups | Fetch once, cache in store | Session |
| Exercise library | Fetch on first view, cache | Session |
| User training blocks | Fetch on auth, refresh on mutation | Real-time |
| Workout session | Fetch on start, cache for offline | 24 hours |
| Previous sets | Prefetch with workout | Included in workout cache |

### 8.3 Lazy Loading

```typescript
// routes/exercises/+page.ts
export const load = async () => {
  // Dynamically import heavy dependencies
  const { exerciseService } = await import('$lib/services/exercises');
  const exercises = await exerciseService.getAll();
  return { exercises };
};
```

### 8.4 Image Optimization

- Use WebP format for exercise thumbnails
- Lazy load video thumbnails
- Cache images in service worker

---

## 9. Security

### 9.1 Security Checklist

| Area | Implementation |
|------|----------------|
| Authentication | Supabase Auth with JWT |
| Authorization | Row Level Security (RLS) on all tables |
| Data validation | Zod schemas on all inputs |
| XSS prevention | Svelte auto-escapes, CSP headers |
| HTTPS | Enforced by Vercel |
| Secrets | Environment variables, never client-exposed |

### 9.2 Input Validation

```typescript
// lib/utils/validation.ts
import { z } from 'zod';

export const setInputSchema = z.object({
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(1).max(100),
  rir: z.number().int().min(0).max(5).optional()
});

export const exerciseSchema = z.object({
  name: z.string().min(2).max(100),
  equipment: z.enum(['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'other']),
  primary_muscle: z.string(),
  secondary_muscles: z.array(z.object({
    muscle: z.string(),
    weight: z.number().min(0).max(1)
  })).optional()
});
```

### 9.3 Environment Variables

```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-only (if needed)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 10. Infrastructure & Deployment

### 10.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Edge      │  │  Serverless │  │  Static Assets      │  │
│  │  Functions  │  │  Functions  │  │  (CDN)              │  │
│  │  (routing)  │  │  (SSR)      │  │  (JS, CSS, images)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Cloud                          │
├─────────────────────────────────────────────────────────────┤
│  Region: us-east-1 (or closest to users)                    │
│  Plan: Free tier (sufficient for small user base)           │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Vercel Configuration

```json
// vercel.json
{
  "framework": "sveltekit",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 10.3 PWA Configuration

```typescript
// vite.config.ts
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MyLiftPal',
        short_name: 'MyLiftPal',
        description: 'Hypertrophy training tracker',
        theme_color: '#10b981',
        background_color: '#0a120f',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 10.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 11. Third-Party Integrations

### 11.1 Web Speech API (Voice Logging)

```typescript
// lib/services/voice.ts
export const voiceService = {
  isSupported: () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
  
  createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    return recognition;
  },
  
  parseSetCommand(transcript: string): { weight?: number; reps?: number } | null {
    // Pattern: "85 for 12" or "85 12" or "eighty-five for twelve"
    const patterns = [
      /(\d+)\s*(?:for|x|times|reps)?\s*(\d+)/i,
      /(\d+)\s+(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        return {
          weight: parseInt(match[1]),
          reps: parseInt(match[2])
        };
      }
    }
    
    // Handle "same weight X" pattern
    const samePattern = /same\s*(?:weight)?\s*(\d+)/i;
    const sameMatch = transcript.match(samePattern);
    if (sameMatch) {
      return { reps: parseInt(sameMatch[1]) };
    }
    
    return null;
  }
};
```

### 11.2 Tesseract.js (Photo OCR)

```typescript
// lib/services/ocr.ts
import { createWorker } from 'tesseract.js';

export const ocrService = {
  async extractWorkoutData(imageFile: File) {
    const worker = await createWorker('eng');
    
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();
    
    return this.parseWorkoutText(text);
  },
  
  parseWorkoutText(text: string) {
    // Parse common workout log formats
    const lines = text.split('\n').filter(l => l.trim());
    const sets: Array<{ exercise?: string; weight?: number; reps?: number }> = [];
    
    for (const line of lines) {
      // Pattern: "Bench Press 185x10, 185x8, 185x8"
      const exerciseMatch = line.match(/^([A-Za-z\s]+)\s+(.+)/);
      if (exerciseMatch) {
        const exercise = exerciseMatch[1].trim();
        const setsText = exerciseMatch[2];
        
        const setPattern = /(\d+)\s*[x×]\s*(\d+)/g;
        let match;
        while ((match = setPattern.exec(setsText)) !== null) {
          sets.push({
            exercise,
            weight: parseInt(match[1]),
            reps: parseInt(match[2])
          });
        }
      }
    }
    
    return sets;
  }
};
```

---

## 12. Development Guidelines

### 12.1 Code Style

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

### 12.2 Commit Convention

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance

Examples:
- feat(workout): add voice logging
- fix(offline): sync queue not processing
- docs(readme): update setup instructions
```

### 12.3 Branch Strategy

```
main           Production branch, auto-deploys
  └── develop  Integration branch
       ├── feat/voice-logging
       ├── fix/offline-sync
       └── chore/dependency-update
```

### 12.4 Testing Strategy

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit | Vitest | 80% for services |
| Component | Svelte Testing Library | Key components |
| E2E | Playwright | Critical paths |

```typescript
// Example unit test
// lib/services/volume.test.ts
import { describe, it, expect } from 'vitest';
import { calculateVolume } from './volume';

describe('calculateVolume', () => {
  it('calculates direct sets correctly', () => {
    const result = calculateVolume([
      { primaryMuscle: 'chest', sets: 4 }
    ]);
    
    expect(result.chest.directSets).toBe(4);
  });
  
  it('calculates indirect sets with weights', () => {
    const result = calculateVolume([
      {
        primaryMuscle: 'chest',
        secondaryMuscles: [{ muscle: 'triceps', weight: 0.5 }],
        sets: 4
      }
    ]);
    
    expect(result.triceps.indirectSets).toBe(2);
  });
});
```

---

## Appendix A: Quick Reference

### Environment Setup

```bash
# Clone and install
git clone https://github.com/your-username/myliftpal.git
cd myliftpal
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Type check |
| `npm run lint` | Lint code |
| `npm run test` | Run tests |
| `npm run db:types` | Generate DB types from Supabase |

### Useful Links

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Dexie.js](https://dexie.org/docs)

---

*End of Technical Architecture Document*
