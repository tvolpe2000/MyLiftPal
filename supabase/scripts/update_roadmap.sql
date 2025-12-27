-- Update roadmap to reflect current priorities
-- Run this in Supabase SQL Editor
-- Only includes user-facing features

-- Clear existing roadmap items
DELETE FROM app_roadmap;

-- ============================================================================
-- PHASE 4: Voice & Polish (Planned - Next up)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'AI Voice Assistant',
  'Control your workout with voice commands - log sets, swap exercises, hands-free',
  'planned',
  1
),
(
  'Swap Exercises',
  'Quickly swap an exercise during your workout when equipment is busy',
  'planned',
  2
),
(
  'Photo Import',
  'Snap a photo of handwritten logs to digitize them',
  'planned',
  3
),
(
  'Additional Themes',
  'More color schemes to personalize your experience',
  'planned',
  4
),
(
  'Fill to Optimal',
  'One-tap to add exercises until all muscles hit optimal volume',
  'planned',
  5
);

-- ============================================================================
-- BACKLOG (Tracked - On the radar)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'Rest Timer',
  'Countdown timer between sets with notifications',
  'tracked',
  10
),
(
  'Stats Dashboard',
  'View your progress with charts and personal records',
  'tracked',
  11
),
(
  'Duplicate Training Block',
  'Clone an existing block as a starting point',
  'tracked',
  12
),
(
  'Export Data',
  'Download your workout history as CSV or JSON',
  'tracked',
  13
),
(
  'Workout Notes',
  'Add personal notes and journal entries to workouts',
  'tracked',
  14
),
(
  'Exercise Videos',
  'Quick links to exercise demonstration videos',
  'tracked',
  15
),
(
  'Deload Week Generator',
  'Auto-create recovery weeks based on your training',
  'tracked',
  16
);

-- Verify the update
SELECT status, COUNT(*) as count FROM app_roadmap GROUP BY status ORDER BY status;
SELECT * FROM app_roadmap ORDER BY sort_order;
