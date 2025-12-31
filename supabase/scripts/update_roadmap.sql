-- Update roadmap to reflect current priorities
-- Auto-runs on commit via pre-commit hook
-- Only includes user-facing features

-- Clear existing roadmap items
DELETE FROM app_roadmap;

-- ============================================================================
-- IN PROGRESS (Currently being built)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'Visual Muscle Diagrams',
  'See which muscles each exercise targets with highlighted body diagrams',
  'in_progress',
  5
);

-- ============================================================================
-- PLANNED (Next up - in priority order)
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'AI Voice Responses',
  'Hear spoken confirmations for hands-free workout logging',
  'planned',
  12
),
(
  'Written Exercise Instructions',
  'Step-by-step setup and execution tips for each exercise',
  'planned',
  13
),
(
  'Rest Timer',
  'Countdown timer between sets with notifications',
  'planned',
  14
),
(
  'Additional AI Providers',
  'Add Claude and Gemini as alternative AI providers alongside OpenAI',
  'planned',
  15
),
(
  'Photo Import',
  'Snap a photo of handwritten logs to digitize them',
  'planned',
  16
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
  'Workout Notes',
  'Add personal notes and journal entries to workouts',
  'tracked',
  25
),
(
  'More Exercise Videos',
  '40 exercises have videos - more coming from YouTube sources',
  'tracked',
  26
),
(
  'Dropsets & Supersets',
  'Mark sets as dropsets or pair exercises as supersets',
  'tracked',
  27
),
(
  'Progress Charts',
  'Visualize your strength gains over time per exercise',
  'tracked',
  28
),
(
  'Smart Program Recommendations',
  'Get template suggestions based on your goals and schedule',
  'tracked',
  29
),
(
  'In-App Help & FAQ',
  'Searchable help system with answers to common questions',
  'tracked',
  30
);

-- Verify the update
SELECT status, COUNT(*) as count FROM app_roadmap GROUP BY status ORDER BY status;
SELECT * FROM app_roadmap ORDER BY sort_order;
