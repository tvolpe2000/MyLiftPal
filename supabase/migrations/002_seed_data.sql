-- MyLiftPal Seed Data
-- Run this after 001_initial_schema.sql

-- ============================================
-- MUSCLE GROUPS
-- ============================================
INSERT INTO muscle_groups (id, display_name, category, color, default_mv, default_mev, default_mav, default_mrv, sort_order) VALUES
  ('chest', 'Chest', 'upper', 'red', 6, 10, 16, 22, 1),
  ('back_lats', 'Lats', 'upper', 'blue', 6, 10, 16, 22, 2),
  ('back_upper', 'Upper Back', 'upper', 'blue', 6, 8, 14, 20, 3),
  ('front_delts', 'Front Delts', 'upper', 'orange', 0, 0, 8, 12, 4),
  ('side_delts', 'Side Delts', 'upper', 'orange', 8, 12, 20, 26, 5),
  ('rear_delts', 'Rear Delts', 'upper', 'orange', 6, 8, 16, 22, 6),
  ('biceps', 'Biceps', 'upper', 'green', 4, 8, 14, 20, 7),
  ('triceps', 'Triceps', 'upper', 'teal', 4, 6, 12, 18, 8),
  ('forearms', 'Forearms', 'upper', 'lime', 2, 4, 10, 16, 9),
  ('quads', 'Quads', 'lower', 'purple', 6, 8, 14, 20, 10),
  ('hamstrings', 'Hamstrings', 'lower', 'violet', 4, 6, 12, 16, 11),
  ('glutes', 'Glutes', 'lower', 'pink', 0, 4, 12, 16, 12),
  ('calves', 'Calves', 'lower', 'fuchsia', 6, 8, 14, 20, 13),
  ('abs', 'Abs', 'core', 'cyan', 0, 4, 12, 16, 14),
  ('obliques', 'Obliques', 'core', 'sky', 0, 2, 8, 12, 15),
  ('traps', 'Traps', 'upper', 'indigo', 0, 4, 12, 18, 16);

-- ============================================
-- CORE EXERCISES
-- ============================================

-- Chest
INSERT INTO exercises (name, aliases, equipment, primary_muscle, secondary_muscles, default_rep_min, default_rep_max, default_rest_seconds, work_seconds, is_core) VALUES
  ('Barbell Bench Press', ARRAY['Flat Bench', 'Bench Press', 'BB Bench'], 'barbell', 'chest', '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', 6, 10, 180, 50, TRUE),
  ('Incline Dumbbell Press', ARRAY['Incline DB Press', 'Incline Press'], 'dumbbell', 'chest', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.4}]', 8, 12, 120, 45, TRUE),
  ('Cable Flye', ARRAY['Cable Fly', 'Cable Crossover', 'Standing Flye'], 'cable', 'chest', '[]', 10, 15, 90, 40, TRUE),
  ('Pec Deck', ARRAY['Pec Deck Flye', 'Machine Flye', 'Butterfly'], 'machine', 'chest', '[]', 10, 15, 90, 40, TRUE),
  ('Dumbbell Flye', ARRAY['DB Flye', 'Flat Flye'], 'dumbbell', 'chest', '[]', 10, 15, 90, 40, TRUE),
  ('Incline Barbell Press', ARRAY['Incline Bench', 'Incline BB Press'], 'barbell', 'chest', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "front_delts", "weight": 0.4}]', 6, 10, 150, 50, TRUE),
  ('Dips (Chest)', ARRAY['Weighted Dips', 'Chest Dips'], 'bodyweight', 'chest', '[{"muscle": "triceps", "weight": 0.5}, {"muscle": "front_delts", "weight": 0.3}]', 8, 12, 120, 45, TRUE),

-- Back
  ('Barbell Row', ARRAY['Bent Over Row', 'BB Row', 'Pendlay Row'], 'barbell', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_upper", "weight": 0.5}, {"muscle": "rear_delts", "weight": 0.3}]', 8, 12, 150, 45, TRUE),
  ('Lat Pulldown', ARRAY['Pulldown', 'Cable Pulldown', 'Wide Grip Pulldown'], 'cable', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}]', 10, 15, 90, 40, TRUE),
  ('Seated Cable Row', ARRAY['Cable Row', 'Seated Row', 'Low Row'], 'cable', 'back_upper', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.5}]', 10, 15, 90, 40, TRUE),
  ('Pull-Up', ARRAY['Pullup', 'Chin Up', 'Weighted Pull-Up'], 'bodyweight', 'back_lats', '[{"muscle": "biceps", "weight": 0.5}]', 5, 12, 150, 45, TRUE),
  ('Dumbbell Row', ARRAY['DB Row', 'One Arm Row', 'Single Arm Row'], 'dumbbell', 'back_lats', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_upper", "weight": 0.3}]', 8, 12, 90, 40, TRUE),
  ('T-Bar Row', ARRAY['Landmine Row', 'T Bar'], 'barbell', 'back_upper', '[{"muscle": "biceps", "weight": 0.4}, {"muscle": "back_lats", "weight": 0.5}]', 8, 12, 120, 45, TRUE),
  ('Machine Row', ARRAY['Hammer Row', 'Chest Supported Row', 'Iso Row'], 'machine', 'back_upper', '[{"muscle": "biceps", "weight": 0.3}, {"muscle": "back_lats", "weight": 0.5}]', 10, 15, 90, 40, TRUE),

-- Shoulders
  ('Overhead Press', ARRAY['OHP', 'Military Press', 'Barbell Shoulder Press'], 'barbell', 'front_delts', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "side_delts", "weight": 0.3}]', 6, 10, 150, 50, TRUE),
  ('Dumbbell Lateral Raise', ARRAY['Lateral Raise', 'Side Raise', 'DB Lateral'], 'dumbbell', 'side_delts', '[]', 12, 20, 60, 35, TRUE),
  ('Cable Lateral Raise', ARRAY['Cable Side Raise'], 'cable', 'side_delts', '[]', 12, 20, 60, 35, TRUE),
  ('Face Pull', ARRAY['Rope Face Pull', 'Cable Face Pull'], 'cable', 'rear_delts', '[{"muscle": "back_upper", "weight": 0.3}]', 15, 20, 60, 35, TRUE),
  ('Reverse Pec Deck', ARRAY['Rear Delt Fly', 'Machine Reverse Fly'], 'machine', 'rear_delts', '[]', 12, 20, 60, 35, TRUE),
  ('Dumbbell Shoulder Press', ARRAY['DB Shoulder Press', 'Seated DB Press'], 'dumbbell', 'front_delts', '[{"muscle": "triceps", "weight": 0.4}, {"muscle": "side_delts", "weight": 0.3}]', 8, 12, 120, 45, TRUE),

-- Arms
  ('Barbell Curl', ARRAY['BB Curl', 'Standing Curl'], 'barbell', 'biceps', '[]', 8, 12, 90, 40, TRUE),
  ('Dumbbell Curl', ARRAY['DB Curl', 'Bicep Curl'], 'dumbbell', 'biceps', '[]', 10, 15, 60, 35, TRUE),
  ('Hammer Curl', ARRAY['DB Hammer Curl', 'Neutral Grip Curl'], 'dumbbell', 'biceps', '[{"muscle": "forearms", "weight": 0.4}]', 10, 15, 60, 35, TRUE),
  ('Cable Curl', ARRAY['Rope Curl', 'EZ Bar Cable Curl'], 'cable', 'biceps', '[]', 12, 15, 60, 35, TRUE),
  ('Preacher Curl', ARRAY['EZ Bar Preacher', 'Machine Preacher'], 'machine', 'biceps', '[]', 10, 15, 90, 40, TRUE),
  ('Tricep Pushdown', ARRAY['Cable Pushdown', 'Rope Pushdown', 'Tricep Extension'], 'cable', 'triceps', '[]', 12, 15, 60, 35, TRUE),
  ('Skull Crusher', ARRAY['Lying Tricep Extension', 'EZ Bar Skull Crusher'], 'barbell', 'triceps', '[]', 10, 15, 90, 40, TRUE),
  ('Overhead Tricep Extension', ARRAY['Cable Overhead Extension', 'French Press'], 'cable', 'triceps', '[]', 12, 15, 60, 35, TRUE),
  ('Close Grip Bench', ARRAY['CGBP', 'Close Grip Bench Press'], 'barbell', 'triceps', '[{"muscle": "chest", "weight": 0.4}]', 8, 12, 120, 45, TRUE),

-- Legs
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

-- Core
  ('Cable Crunch', ARRAY['Rope Crunch', 'Kneeling Cable Crunch'], 'cable', 'abs', '[]', 15, 20, 60, 35, TRUE),
  ('Hanging Leg Raise', ARRAY['Leg Raise', 'Hanging Knee Raise'], 'bodyweight', 'abs', '[]', 10, 20, 60, 35, TRUE),
  ('Ab Wheel Rollout', ARRAY['Ab Roller', 'Rollout'], 'bodyweight', 'abs', '[]', 10, 15, 60, 40, TRUE);
