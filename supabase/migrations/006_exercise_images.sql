-- ============================================
-- Add Image URLs for Exercises and Muscle Groups
-- ============================================
-- Source: Wger API (https://wger.de/api/v2/)
-- License: AGPL-3.0 (requires attribution)

-- Add image URL columns to muscle_groups
-- Note: The muscle SVGs are overlays meant to be composited on base body images:
--   Front: https://wger.de/static/images/muscles/muscular_system_front.svg
--   Back:  https://wger.de/static/images/muscles/muscular_system_back.svg
ALTER TABLE muscle_groups
ADD COLUMN IF NOT EXISTS image_url_main TEXT,
ADD COLUMN IF NOT EXISTS image_url_secondary TEXT,
ADD COLUMN IF NOT EXISTS is_front BOOLEAN DEFAULT TRUE;

-- Add image URL column to exercises
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================
-- Populate Muscle Group Images (Wger SVGs)
-- ============================================

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-1.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-1.svg'
WHERE id = 'biceps';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-5.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-5.svg'
WHERE id = 'triceps';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-4.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-4.svg'
WHERE id = 'chest';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-12.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-12.svg'
WHERE id = 'back_lats';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-9.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-9.svg'
WHERE id = 'traps';

-- Wger has "Shoulders" (id=2) which is Anterior deltoid - map to front_delts
UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-2.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-2.svg'
WHERE id = 'front_delts';

-- Side and rear delts can use same shoulder SVG
UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-2.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-2.svg'
WHERE id IN ('side_delts', 'rear_delts');

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-6.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-6.svg'
WHERE id = 'abs';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-14.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-14.svg'
WHERE id = 'obliques';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-10.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-10.svg'
WHERE id = 'quads';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-11.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-11.svg'
WHERE id = 'hamstrings';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-8.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-8.svg'
WHERE id = 'glutes';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-7.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-7.svg'
WHERE id = 'calves';

-- Lower back and forearms don't have direct Wger equivalents
-- Use closest match or leave null
UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-12.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-12.svg'
WHERE id = 'back_lower';

UPDATE muscle_groups SET
  image_url_main = 'https://wger.de/static/images/muscles/main/muscle-13.svg',
  image_url_secondary = 'https://wger.de/static/images/muscles/secondary/muscle-13.svg'
WHERE id = 'forearms';

-- ============================================
-- Note: Exercise images will be populated via script
-- Run: npx tsx scripts/import-exercise-images.ts
-- ============================================
