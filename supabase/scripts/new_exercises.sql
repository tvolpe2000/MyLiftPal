-- New exercises to add
-- Run this in Supabase SQL Editor

-- These exercises are NOT in 002_seed_data.sql and are needed for the new templates

INSERT INTO exercises (name, aliases, equipment, primary_muscle, secondary_muscles, default_rep_min, default_rep_max, default_rest_seconds, work_seconds, is_core) VALUES
  -- Compound Movements
  ('Deadlift', ARRAY['Conventional Deadlift', 'Barbell Deadlift'], 'barbell', 'hamstrings', '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "back_lats", "weight": 0.4}, {"muscle": "quads", "weight": 0.3}, {"muscle": "traps", "weight": 0.3}]', 5, 8, 180, 60, TRUE),
  ('Sumo Deadlift', ARRAY['Wide Stance Deadlift'], 'barbell', 'glutes', '[{"muscle": "hamstrings", "weight": 0.5}, {"muscle": "quads", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.3}]', 5, 8, 180, 60, TRUE),
  ('Front Squat', ARRAY['Barbell Front Squat'], 'barbell', 'quads', '[{"muscle": "glutes", "weight": 0.4}, {"muscle": "abs", "weight": 0.3}]', 6, 10, 150, 55, TRUE),
  ('Hack Squat', ARRAY['Machine Hack Squat'], 'machine', 'quads', '[{"muscle": "glutes", "weight": 0.3}]', 8, 12, 120, 45, TRUE),
  ('Good Morning', ARRAY['Barbell Good Morning'], 'barbell', 'hamstrings', '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "back_lats", "weight": 0.3}]', 8, 12, 120, 45, TRUE),

  -- Chest
  ('Dumbbell Bench Press', ARRAY['DB Bench Press', 'Flat DB Press'], 'dumbbell', 'chest', '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', 8, 12, 120, 45, TRUE),

  -- Back
  ('Straight Arm Pulldown', ARRAY['Straight Arm Lat Pulldown', 'Stiff Arm Pulldown'], 'cable', 'back_lats', '[]', 12, 15, 60, 35, TRUE),
  ('Back Extension', ARRAY['Hyperextension', '45 Degree Back Extension'], 'bodyweight', 'hamstrings', '[{"muscle": "glutes", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.2}]', 10, 15, 60, 40, TRUE),

  -- Shoulders
  ('Arnold Press', ARRAY['Arnold Dumbbell Press'], 'dumbbell', 'front_delts', '[{"muscle": "side_delts", "weight": 0.5}, {"muscle": "triceps", "weight": 0.3}]', 8, 12, 120, 45, TRUE),
  ('Upright Row', ARRAY['Barbell Upright Row', 'Cable Upright Row'], 'barbell', 'side_delts', '[{"muscle": "traps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', 10, 15, 90, 40, TRUE),
  ('Barbell Shrug', ARRAY['BB Shrug', 'Shoulder Shrug'], 'barbell', 'traps', '[]', 10, 15, 90, 35, TRUE),

  -- Arms
  ('Incline Dumbbell Curl', ARRAY['Incline DB Curl', 'Incline Curl'], 'dumbbell', 'biceps', '[]', 10, 15, 60, 35, TRUE),
  ('Concentration Curl', ARRAY['Seated Concentration Curl'], 'dumbbell', 'biceps', '[]', 10, 15, 60, 35, TRUE),
  ('Spider Curl', ARRAY['Incline Spider Curl'], 'dumbbell', 'biceps', '[]', 10, 15, 60, 35, TRUE),
  ('Tricep Kickback', ARRAY['DB Kickback', 'Dumbbell Tricep Kickback'], 'dumbbell', 'triceps', '[]', 12, 15, 60, 35, TRUE),
  ('Close Grip Bench Press', ARRAY['Close Grip Barbell Bench'], 'barbell', 'triceps', '[{"muscle": "chest", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.2}]', 8, 12, 120, 45, TRUE),

  -- Glutes/Legs
  ('Cable Pull-through', ARRAY['Pull Through', 'Rope Pull Through'], 'cable', 'glutes', '[{"muscle": "hamstrings", "weight": 0.5}]', 12, 15, 60, 40, TRUE),
  ('Cable Kickback', ARRAY['Glute Kickback', 'Cable Glute Kickback'], 'cable', 'glutes', '[]', 12, 15, 60, 35, TRUE),
  ('Hip Abduction', ARRAY['Machine Hip Abduction', 'Seated Hip Abduction'], 'machine', 'glutes', '[]', 15, 20, 60, 35, TRUE),
  ('Frog Pump', ARRAY['Banded Frog Pump'], 'bodyweight', 'glutes', '[]', 20, 30, 60, 40, TRUE),
  ('Single Leg Hip Thrust', ARRAY['Single Leg Glute Bridge'], 'bodyweight', 'glutes', '[{"muscle": "hamstrings", "weight": 0.3}]', 10, 15, 60, 40, TRUE),
  ('Reverse Lunge', ARRAY['Backward Lunge', 'Step Back Lunge'], 'dumbbell', 'quads', '[{"muscle": "glutes", "weight": 0.5}, {"muscle": "hamstrings", "weight": 0.3}]', 10, 15, 90, 45, TRUE),
  ('Lying Leg Curl', ARRAY['Prone Leg Curl'], 'machine', 'hamstrings', '[]', 10, 15, 90, 40, TRUE),

  -- Bodyweight
  ('Diamond Push-up', ARRAY['Close Grip Push-up', 'Triangle Push-up'], 'bodyweight', 'triceps', '[{"muscle": "chest", "weight": 0.4}]', 10, 20, 60, 40, TRUE),
  ('Dip', ARRAY['Parallel Bar Dip', 'Tricep Dip'], 'bodyweight', 'triceps', '[{"muscle": "chest", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.3}]', 8, 15, 120, 45, TRUE),
  ('Chin-up', ARRAY['Chin Up', 'Supinated Pull-up'], 'bodyweight', 'back_lats', '[{"muscle": "biceps", "weight": 0.6}]', 6, 12, 120, 45, TRUE);

-- Note: The following exercises from templates already exist or have aliases:
-- "Weighted Pull-up" -> Use "Pull-Up" (has alias "Weighted Pull-Up")
-- "Rear Delt Flye" -> Use "Reverse Pec Deck" (has alias "Rear Delt Fly")
-- "Stiff Leg Deadlift" -> Use "Romanian Deadlift" (has alias)
-- "Seated Leg Curl" -> Use "Leg Curl" (has alias)
-- "Lying Leg Curl" -> Use "Leg Curl" (has alias) - Added above as separate for better tracking
-- "Close Grip Bench" -> Already exists as "Close Grip Bench"

-- BBB versions (Barbell Squat BBB, Bench Press BBB, etc.) should just use the regular exercise names
-- The 5/3/1 BBB template simply uses the same exercise twice with different rep schemes
