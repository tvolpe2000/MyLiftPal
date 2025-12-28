-- Lifter Level and Training Goals
-- Enables goal-based programming and Fill to Optimal feature

-- Add lifter_level to profiles for personalized volume recommendations
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS lifter_level TEXT CHECK (lifter_level IN ('beginner', 'intermediate', 'advanced'));

-- Add goal to training_blocks for goal-specific programming
ALTER TABLE training_blocks
ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'hypertrophy'
CHECK (goal IN ('maintenance', 'hypertrophy', 'strength', 'power', 'endurance'));

-- Update existing blocks to have the default goal
UPDATE training_blocks SET goal = 'hypertrophy' WHERE goal IS NULL;

-- Index for querying blocks by goal
CREATE INDEX IF NOT EXISTS idx_training_blocks_goal ON training_blocks(goal);
