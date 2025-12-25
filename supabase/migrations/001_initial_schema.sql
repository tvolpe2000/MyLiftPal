-- MyLiftPal Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  default_rest_seconds INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- MUSCLE GROUPS
-- ============================================
CREATE TABLE muscle_groups (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('upper', 'lower', 'core')),
  color TEXT NOT NULL,
  default_mv INTEGER DEFAULT 6,
  default_mev INTEGER DEFAULT 10,
  default_mav INTEGER DEFAULT 16,
  default_mrv INTEGER DEFAULT 22,
  sort_order INTEGER DEFAULT 0
);

-- Muscle groups are read-only reference data
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view muscle groups" ON muscle_groups
  FOR SELECT USING (true);

-- ============================================
-- EXERCISES
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  equipment TEXT NOT NULL CHECK (equipment IN (
    'barbell', 'dumbbell', 'cable', 'machine',
    'bodyweight', 'smith_machine', 'kettlebell', 'bands'
  )),
  primary_muscle TEXT NOT NULL REFERENCES muscle_groups(id),
  secondary_muscles JSONB DEFAULT '[]',
  video_url TEXT,
  cues TEXT[] DEFAULT '{}',
  default_rep_min INTEGER DEFAULT 8,
  default_rep_max INTEGER DEFAULT 12,
  default_rest_seconds INTEGER DEFAULT 90,
  work_seconds INTEGER DEFAULT 45,
  is_core BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View core or own exercises" ON exercises
  FOR SELECT USING (is_core = TRUE OR created_by = auth.uid());

CREATE POLICY "Insert own exercises" ON exercises
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_core = FALSE);

CREATE POLICY "Update own exercises" ON exercises
  FOR UPDATE USING (created_by = auth.uid() AND is_core = FALSE);

CREATE POLICY "Delete own exercises" ON exercises
  FOR DELETE USING (created_by = auth.uid() AND is_core = FALSE);

CREATE INDEX exercises_primary_muscle_idx ON exercises(primary_muscle);
CREATE INDEX exercises_equipment_idx ON exercises(equipment);

-- ============================================
-- TRAINING BLOCKS
-- ============================================
CREATE TABLE training_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 5 CHECK (total_weeks BETWEEN 4 AND 8),
  current_week INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  time_budget_minutes INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training blocks" ON training_blocks
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX training_blocks_user_status_idx ON training_blocks(user_id, status);

-- ============================================
-- WORKOUT DAYS
-- ============================================
CREATE TABLE workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_block_id UUID NOT NULL REFERENCES training_blocks(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_muscles TEXT[] DEFAULT '{}',
  time_budget_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_block_id, day_number)
);

ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout days" ON workout_days
  FOR ALL USING (
    training_block_id IN (SELECT id FROM training_blocks WHERE user_id = auth.uid())
  );

-- ============================================
-- EXERCISE SLOTS
-- ============================================
CREATE TABLE exercise_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  slot_order INTEGER NOT NULL,
  base_sets INTEGER NOT NULL DEFAULT 3,
  set_progression DECIMAL DEFAULT 0.5,
  rep_range_min INTEGER NOT NULL DEFAULT 8,
  rep_range_max INTEGER NOT NULL DEFAULT 12,
  rest_seconds INTEGER,
  superset_group TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_day_id, slot_order)
);

ALTER TABLE exercise_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exercise slots" ON exercise_slots
  FOR ALL USING (
    workout_day_id IN (
      SELECT wd.id FROM workout_days wd
      JOIN training_blocks tb ON wd.training_block_id = tb.id
      WHERE tb.user_id = auth.uid()
    )
  );

-- ============================================
-- WORKOUT SESSIONS
-- ============================================
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_day_id UUID NOT NULL REFERENCES workout_days(id),
  training_block_id UUID NOT NULL REFERENCES training_blocks(id),
  week_number INTEGER NOT NULL,
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'skipped'
  )),
  duration_minutes INTEGER,
  notes TEXT,
  overall_pump TEXT CHECK (overall_pump IN ('none', 'mild', 'moderate', 'great', 'excessive')),
  overall_soreness TEXT CHECK (overall_soreness IN ('none', 'mild', 'moderate', 'severe')),
  workload_rating TEXT CHECK (workload_rating IN ('too_easy', 'easy', 'just_right', 'hard', 'too_hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON workout_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX workout_sessions_user_status_idx ON workout_sessions(user_id, status);
CREATE INDEX workout_sessions_date_idx ON workout_sessions(scheduled_date);

-- ============================================
-- LOGGED SETS
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
  rir INTEGER CHECK (rir BETWEEN 0 AND 5),
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

CREATE INDEX logged_sets_session_idx ON logged_sets(workout_session_id);
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
