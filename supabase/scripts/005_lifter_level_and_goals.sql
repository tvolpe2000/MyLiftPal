-- Migration: Add lifter_level to profiles and goal to training_blocks
-- Run with: npm run db:run 005_lifter_level_and_goals

-- Add lifter_level to profiles (beginner, intermediate, advanced)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS lifter_level TEXT CHECK (lifter_level IN ('beginner', 'intermediate', 'advanced'));

-- Add goal to training_blocks with default hypertrophy
ALTER TABLE training_blocks
ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'hypertrophy'
CHECK (goal IN ('maintenance', 'hypertrophy', 'strength', 'power', 'endurance'));

-- Update existing blocks to have explicit goal (they already default to hypertrophy)
UPDATE training_blocks SET goal = 'hypertrophy' WHERE goal IS NULL;

-- Verify changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'lifter_level';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'training_blocks' AND column_name = 'goal';
