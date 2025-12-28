-- Update roadmap to reflect current priorities
-- Auto-runs on commit via pre-commit hook
-- Only includes user-facing features

-- Clear existing roadmap items
DELETE FROM app_roadmap;

-- ============================================================================
-- IN PROGRESS (Currently being built)
-- ============================================================================

-- (None currently - all items shipped or planned)

-- ============================================================================
-- PLANNED (Next up - in priority order)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'AI Voice Assistant',
  'Control your workout with voice commands - log sets, swap exercises, hands-free',
  'planned',
  10
),
(
  'Photo Import',
  'Snap a photo of handwritten logs to digitize them',
  'planned',
  11
);

-- ============================================================================
-- TRACKED (On the radar - lower priority)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'Stats Dashboard',
  'View your progress with charts and personal records',
  'tracked',
  20
),
(
  'Duplicate Training Block',
  'Clone an existing block as a starting point',
  'tracked',
  21
),
(
  'Social Features',
  'Share workouts and compare progress with friends',
  'tracked',
  22
),
(
  'Export Data',
  'Download your workout history as CSV or JSON',
  'tracked',
  23
),
(
  'Rest Timer',
  'Countdown timer between sets with notifications',
  'tracked',
  24
),
(
  'Workout Notes',
  'Add personal notes and journal entries to workouts',
  'tracked',
  25
),
(
  'Exercise Videos',
  'Quick links to exercise demonstration videos',
  'tracked',
  26
);

-- Verify the update
SELECT status, COUNT(*) as count FROM app_roadmap GROUP BY status ORDER BY status;
SELECT * FROM app_roadmap ORDER BY sort_order;
