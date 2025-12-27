-- Update roadmap to reflect current priorities
-- Run this in Supabase SQL Editor
-- Only includes user-facing features

-- Clear existing roadmap items
DELETE FROM app_roadmap;

-- ============================================================================
-- PLANNED (Next up - in priority order)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'Swap Exercises',
  'Quickly swap an exercise during your workout when equipment is busy',
  'planned',
  1
),
(
  'Add Exercises Mid-Workout',
  'Throw in extra exercises during your workout',
  'planned',
  2
),
(
  'Home Page Refresh',
  'Dynamic greetings and improved workout summary',
  'planned',
  3
),
(
  'Fill to Optimal',
  'One-tap to add exercises until all muscles hit optimal volume',
  'planned',
  4
),
(
  'Additional Themes',
  'More color schemes to personalize your experience',
  'planned',
  5
);

-- ============================================================================
-- TRACKED (On the radar - lower priority)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'AI Voice Assistant',
  'Control your workout with voice commands - log sets, swap exercises, hands-free',
  'tracked',
  10
),
(
  'Photo Import',
  'Snap a photo of handwritten logs to digitize them',
  'tracked',
  11
),
(
  'Stats Dashboard',
  'View your progress with charts and personal records',
  'tracked',
  12
),
(
  'Duplicate Training Block',
  'Clone an existing block as a starting point',
  'tracked',
  13
),
(
  'Export Data',
  'Download your workout history as CSV or JSON',
  'tracked',
  14
),
(
  'Rest Timer',
  'Countdown timer between sets with notifications',
  'tracked',
  15
),
(
  'Workout Notes',
  'Add personal notes and journal entries to workouts',
  'tracked',
  16
),
(
  'Exercise Videos',
  'Quick links to exercise demonstration videos',
  'tracked',
  17
);

-- Verify the update
SELECT status, COUNT(*) as count FROM app_roadmap GROUP BY status ORDER BY status;
SELECT * FROM app_roadmap ORDER BY sort_order;
