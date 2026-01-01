-- COMPLETE SETUP SCRIPT
-- Run this in the Supabase SQL Editor to set up the entire database schema and seed data.
-- Combines migrations 001-006.

-- ============================================
-- 1. EXTENSIONS & CONFIG
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  default_rest_seconds INTEGER DEFAULT 90,
  -- Added in 005
  lifter_level TEXT CHECK (lifter_level IN ('beginner', 'intermediate', 'advanced')),
  -- Added in 003
  last_seen_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

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
-- 3. MUSCLE GROUPS
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
  sort_order INTEGER DEFAULT 0,
  -- Added in 006
  image_url_main TEXT,
  image_url_secondary TEXT,
  is_front BOOLEAN DEFAULT TRUE
);

ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view muscle groups" ON muscle_groups
  FOR SELECT USING (true);

-- ============================================
-- 4. EXERCISES
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Added in 006
  image_url TEXT
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
-- 5. TRAINING BLOCKS
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
  -- Added in 005
  goal TEXT DEFAULT 'hypertrophy' CHECK (goal IN ('maintenance', 'hypertrophy', 'strength', 'power', 'endurance')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training blocks" ON training_blocks
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX training_blocks_user_status_idx ON training_blocks(user_id, status);
CREATE INDEX idx_training_blocks_goal ON training_blocks(goal);

-- ============================================
-- 6. WORKOUT DAYS
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
-- 7. EXERCISE SLOTS
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
-- 8. WORKOUT SESSIONS
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
-- 9. LOGGED SETS
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
-- 10. USER VOLUME TARGETS
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
-- 11. APP RELEASES (Changelog)
-- ============================================
CREATE TABLE app_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  title TEXT,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  highlights TEXT[] DEFAULT '{}',
  changes TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published releases"
  ON app_releases FOR SELECT
  USING (is_published = true);

CREATE INDEX idx_app_releases_released_at ON app_releases(released_at DESC);

-- ============================================
-- 12. APP ROADMAP
-- ============================================
CREATE TABLE app_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'tracked' CHECK (status IN ('tracked', 'planned', 'in_progress')),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_roadmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible roadmap items"
  ON app_roadmap FOR SELECT
  USING (is_visible = true);

CREATE INDEX idx_app_roadmap_sort ON app_roadmap(sort_order ASC);

-- ============================================
-- 13. USER FEEDBACK
-- ============================================
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_urls TEXT[] DEFAULT '{}',
  app_version TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'wont_fix')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_feedback_status ON user_feedback(status);
CREATE INDEX idx_feedback_type ON user_feedback(type);
CREATE INDEX idx_feedback_created ON user_feedback(created_at DESC);

-- ============================================
-- 14. SEED DATA
-- ============================================

-- Muscle Groups (With Images)
INSERT INTO muscle_groups (id, display_name, category, color, default_mv, default_mev, default_mav, default_mrv, sort_order, image_url_main, image_url_secondary) VALUES
  ('chest', 'Chest', 'upper', 'red', 6, 10, 16, 22, 1, 'https://wger.de/static/images/muscles/main/muscle-4.svg', 'https://wger.de/static/images/muscles/secondary/muscle-4.svg'),
  ('back_lats', 'Lats', 'upper', 'blue', 6, 10, 16, 22, 2, 'https://wger.de/static/images/muscles/main/muscle-12.svg', 'https://wger.de/static/images/muscles/secondary/muscle-12.svg'),
  ('back_upper', 'Upper Back', 'upper', 'blue', 6, 8, 14, 20, 3, 'https://wger.de/static/images/muscles/main/muscle-9.svg', 'https://wger.de/static/images/muscles/secondary/muscle-9.svg'), -- Approx for upper back/traps
  ('front_delts', 'Front Delts', 'upper', 'orange', 0, 0, 8, 12, 4, 'https://wger.de/static/images/muscles/main/muscle-2.svg', 'https://wger.de/static/images/muscles/secondary/muscle-2.svg'),
  ('side_delts', 'Side Delts', 'upper', 'orange', 8, 12, 20, 26, 5, 'https://wger.de/static/images/muscles/main/muscle-2.svg', 'https://wger.de/static/images/muscles/secondary/muscle-2.svg'),
  ('rear_delts', 'Rear Delts', 'upper', 'orange', 6, 8, 16, 22, 6, 'https://wger.de/static/images/muscles/main/muscle-2.svg', 'https://wger.de/static/images/muscles/secondary/muscle-2.svg'),
  ('biceps', 'Biceps', 'upper', 'green', 4, 8, 14, 20, 7, 'https://wger.de/static/images/muscles/main/muscle-1.svg', 'https://wger.de/static/images/muscles/secondary/muscle-1.svg'),
  ('triceps', 'Triceps', 'upper', 'teal', 4, 6, 12, 18, 8, 'https://wger.de/static/images/muscles/main/muscle-5.svg', 'https://wger.de/static/images/muscles/secondary/muscle-5.svg'),
  ('forearms', 'Forearms', 'upper', 'lime', 2, 4, 10, 16, 9, 'https://wger.de/static/images/muscles/main/muscle-13.svg', 'https://wger.de/static/images/muscles/secondary/muscle-13.svg'),
  ('quads', 'Quads', 'lower', 'purple', 6, 8, 14, 20, 10, 'https://wger.de/static/images/muscles/main/muscle-10.svg', 'https://wger.de/static/images/muscles/secondary/muscle-10.svg'),
  ('hamstrings', 'Hamstrings', 'lower', 'violet', 4, 6, 12, 16, 11, 'https://wger.de/static/images/muscles/main/muscle-11.svg', 'https://wger.de/static/images/muscles/secondary/muscle-11.svg'),
  ('glutes', 'Glutes', 'lower', 'pink', 0, 4, 12, 16, 12, 'https://wger.de/static/images/muscles/main/muscle-8.svg', 'https://wger.de/static/images/muscles/secondary/muscle-8.svg'),
  ('calves', 'Calves', 'lower', 'fuchsia', 6, 8, 14, 20, 13, 'https://wger.de/static/images/muscles/main/muscle-7.svg', 'https://wger.de/static/images/muscles/secondary/muscle-7.svg'),
  ('abs', 'Abs', 'core', 'cyan', 0, 4, 12, 16, 14, 'https://wger.de/static/images/muscles/main/muscle-6.svg', 'https://wger.de/static/images/muscles/secondary/muscle-6.svg'),
  ('obliques', 'Obliques', 'core', 'sky', 0, 2, 8, 12, 15, 'https://wger.de/static/images/muscles/main/muscle-14.svg', 'https://wger.de/static/images/muscles/secondary/muscle-14.svg'),
  ('traps', 'Traps', 'upper', 'indigo', 0, 4, 12, 18, 16, 'https://wger.de/static/images/muscles/main/muscle-9.svg', 'https://wger.de/static/images/muscles/secondary/muscle-9.svg');

-- Core Exercises
INSERT INTO exercises (name, aliases, equipment, primary_muscle, secondary_muscles, default_rep_min, default_rep_max, default_rest_seconds, work_seconds, is_core) VALUES
  ('Barbell Bench Press', ARRAY['Flat Bench', 'Bench Press', 'BB Bench'], 'barbell', 'chest', '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', 6, 10, 180, 50, TRUE),
  ('Incline Dumbbell Press', ARRAY['Incline DB Press', 'Incline Press'], 'dumbbell', 'chest', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.4}]', 8, 12, 120, 45, TRUE),
  ('Cable Flye', ARRAY['Cable Fly', 'Cable Crossover', 'Standing Flye'], 'cable', 'chest', '[]', 10, 15, 90, 40, TRUE),
  ('Pec Deck', ARRAY['Pec Deck Flye', 'Machine Flye', 'Butterfly'], 'machine', 'chest', '[]', 10, 15, 90, 40, TRUE),
  ('Dumbbell Flye', ARRAY['DB Flye', 'Flat Flye'], 'dumbbell', 'chest', '[]', 10, 15, 90, 40, TRUE),
  ('Incline Barbell Press', ARRAY['Incline Bench', 'Incline BB Press'], 'barbell', 'chest', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.4}]', 6, 10, 150, 50, TRUE),
  ('Dips (Chest)', ARRAY['Weighted Dips', 'Chest Dips'], 'bodyweight', 'chest', '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', 8, 12, 120, 45, TRUE),
  ('Barbell Row', ARRAY['Bent Over Row', 'BB Row', 'Pendlay Row'], 'barbell', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_upper", "weight": 0.5}, {"muscle": "rear_delts", "weight": 0.3}]', 8, 12, 150, 45, TRUE),
  ('Lat Pulldown', ARRAY['Pulldown', 'Cable Pulldown', 'Wide Grip Pulldown'], 'cable', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}]', 10, 15, 90, 40, TRUE),
  ('Seated Cable Row', ARRAY['Cable Row', 'Seated Row', 'Low Row'], 'cable', 'back_upper', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.5}]', 10, 15, 90, 40, TRUE),
  ('Pull-Up', ARRAY['Pullup', 'Chin Up', 'Weighted Pull-Up'], 'bodyweight', 'back_lats', '[{"muscle": "biceps", "weight": 0.5}]', 5, 12, 150, 45, TRUE),
  ('Dumbbell Row', ARRAY['DB Row', 'One Arm Row', 'Single Arm Row'], 'dumbbell', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_upper", "weight": 0.3}]', 8, 12, 90, 40, TRUE),
  ('T-Bar Row', ARRAY['Landmine Row', 'T Bar'], 'barbell', 'back_upper', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.5}]', 8, 12, 120, 45, TRUE),
  ('Machine Row', ARRAY['Hammer Row', 'Chest Supported Row', 'Iso Row'], 'machine', 'back_upper', '[{"muscle": "biceps", "weight": 0.3}, {"muscle": "back_lats", "weight": 0.5}]', 10, 15, 90, 40, TRUE),
  ('Overhead Press', ARRAY['OHP', 'Military Press', 'Barbell Shoulder Press'], 'barbell', 'front_delts', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "side_delts", "weight": 0.3}]', 6, 10, 150, 50, TRUE),
  ('Dumbbell Lateral Raise', ARRAY['Lateral Raise', 'Side Raise', 'DB Lateral'], 'dumbbell', 'side_delts', '[]', 12, 20, 60, 35, TRUE),
  ('Cable Lateral Raise', ARRAY['Cable Side Raise'], 'cable', 'side_delts', '[]', 12, 20, 60, 35, TRUE),
  ('Face Pull', ARRAY['Rope Face Pull', 'Cable Face Pull'], 'cable', 'rear_delts', '[{"muscle": "back_upper", "weight": 0.3}]', 15, 20, 60, 35, TRUE),
  ('Reverse Pec Deck', ARRAY['Rear Delt Fly', 'Machine Reverse Fly'], 'machine', 'rear_delts', '[]', 12, 20, 60, 35, TRUE),
  ('Dumbbell Shoulder Press', ARRAY['DB Shoulder Press', 'Seated DB Press'], 'dumbbell', 'front_delts', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "side_delts", "weight": 0.3}]', 8, 12, 120, 45, TRUE),
  ('Barbell Curl', ARRAY['BB Curl', 'Standing Curl'], 'barbell', 'biceps', '[]', 8, 12, 90, 40, TRUE),
  ('Dumbbell Curl', ARRAY['DB Curl', 'Bicep Curl'], 'dumbbell', 'biceps', '[]', 10, 15, 60, 35, TRUE),
  ('Hammer Curl', ARRAY['DB Hammer Curl', 'Neutral Grip Curl'], 'dumbbell', 'biceps', '[{"muscle": "forearms", "weight": 0.4}]', 10, 15, 60, 35, TRUE),
  ('Cable Curl', ARRAY['Rope Curl', 'EZ Bar Cable Curl'], 'cable', 'biceps', '[]', 12, 15, 60, 35, TRUE),
  ('Preacher Curl', ARRAY['EZ Bar Preacher', 'Machine Preacher'], 'machine', 'biceps', '[]', 10, 15, 90, 40, TRUE),
  ('Tricep Pushdown', ARRAY['Cable Pushdown', 'Rope Pushdown', 'Tricep Extension'], 'cable', 'triceps', '[]', 12, 15, 60, 35, TRUE),
  ('Skull Crusher', ARRAY['Lying Tricep Extension', 'EZ Bar Skull Crusher'], 'barbell', 'triceps', '[]', 10, 15, 90, 40, TRUE),
  ('Overhead Tricep Extension', ARRAY['Cable Overhead Extension', 'French Press'], 'cable', 'triceps', '[]', 12, 15, 60, 35, TRUE),
  ('Close Grip Bench', ARRAY['CGBP', 'Close Grip Bench Press'], 'barbell', 'triceps', '[{"muscle": "chest", "weight": 0.4}]', 8, 12, 120, 45, TRUE),
  ('Barbell Squat', ARRAY['Back Squat', 'BB Squat', 'Squat'], 'barbell', 'quads', '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "hamstrings", "weight": 0.3}]', 6, 10, 180, 55, TRUE),
  ('Leg Press', ARRAY['Machine Leg Press', '45 Degree Leg Press'], 'machine', 'quads', '[{"muscle": "glutes", "weight": 0.4}]', 10, 15, 150, 50, TRUE),
  ('Leg Extension', ARRAY['Quad Extension', 'Machine Leg Extension'], 'machine', 'quads', '[]', 12, 20, 60, 35, TRUE),
  ('Romanian Deadlift', ARRAY['RDL', 'Stiff Leg Deadlift', 'SLDL'], 'barbell', 'hamstrings', '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "back_lats", "weight": 0.2}]', 8, 12, 150, 50, TRUE),
  ('Leg Curl', ARRAY['Lying Leg Curl', 'Seated Leg Curl', 'Hamstring Curl'], 'machine', 'hamstrings', '[]', 10, 15, 90, 40, TRUE),
  ('Hip Thrust', ARRAY['Barbell Hip Thrust', 'Glute Bridge'], 'barbell', 'glutes', '[{"muscle": "hamstrings", "weight": 0.3}]', 10, 15, 120, 45, TRUE),
  ('Bulgarian Split Squat', ARRAY['BSS', 'Rear Foot Elevated Split Squat'], 'dumbbell', 'quads', '[{"muscle": "glutes", "weight": 0.4}]', 8, 12, 90, 45, TRUE),
  ('Walking Lunge', ARRAY['Dumbbell Lunge', 'DB Walking Lunge'], 'dumbbell', 'quads', '[{"muscle": "glutes", "weight": 0.4}]', 10, 15, 90, 45, TRUE),
  ('Standing Calf Raise', ARRAY['Calf Raise', 'Machine Calf Raise'], 'machine', 'calves', '[]', 12, 20, 60, 35, TRUE),
  ('Seated Calf Raise', ARRAY['Seated Calf'], 'machine', 'calves', '[]', 12, 20, 60, 35, TRUE),
  ('Cable Crunch', ARRAY['Rope Crunch', 'Kneeling Cable Crunch'], 'cable', 'abs', '[]', 15, 20, 60, 35, TRUE),
  ('Hanging Leg Raise', ARRAY['Leg Raise', 'Hanging Knee Raise'], 'bodyweight', 'abs', '[]', 10, 20, 60, 35, TRUE),
  ('Ab Wheel Rollout', ARRAY['Ab Roller', 'Rollout'], 'bodyweight', 'abs', '[]', 10, 15, 60, 40, TRUE);

-- Releases
INSERT INTO app_releases (version, title, released_at, highlights, changes) VALUES
(
  '1.0.0',
  'Initial Release',
  '2025-12-25T00:00:00Z',
  ARRAY['Training Blocks', 'Exercise Library', 'Workout Logging'],
  ARRAY[
    'User authentication (login, signup, forgot password)',
    'Training block creation wizard with templates',
    'Exercise library with search and muscle filtering',
    'Basic workout logging (weight, reps, RIR)'
  ]
),
(
  '1.1.0',
  'Intelligence Update',
  '2025-12-26T00:00:00Z',
  ARRAY['Volume Tracking', 'Smart Suggestions', 'Time Estimates'],
  ARRAY[
    'Volume calculation engine with muscle group tracking',
    'Auto-suggest weight and reps based on previous sessions',
    'Workout time estimation per week',
    'Scroll wheel picker for easier input',
    'Previous session display during workouts'
  ]
),
(
  '1.2.0',
  'Polish & Management',
  '2025-12-27T00:00:00Z',
  ARRAY['Edit Past Workouts', 'Delete Blocks', 'Offline Mode'],
  ARRAY[
    'Edit completed workout sessions from Recent Activity',
    'Delete training blocks with confirmation modal',
    'PWA offline support with sync queue',
    'Download workouts for offline use'
  ]
);

-- Roadmap
INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'Voice Logging',
  'Log sets by speaking "85 for 12" - hands-free workout tracking',
  'planned',
  1
),
(
  'Rest Timer',
  'Countdown timer between sets with notification alerts',
  'tracked',
  2
),
(
  'Stats Dashboard',
  'View progress charts, PRs, and workout analytics over time',
  'tracked',
  3
),
(
  'Photo Import',
  'OCR to digitize handwritten workout logs from photos',
  'tracked',
  4
),
(
  'Deload Week Generator',
  'Automatically create recovery weeks based on your training',
  'tracked',
  5
);
