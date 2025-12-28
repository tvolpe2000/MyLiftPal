-- Update app releases
-- Auto-runs on commit via pre-commit hook
-- Add new releases here when deploying new versions

-- Note: This uses UPSERT to add/update releases without deleting history
-- To completely refresh, uncomment the DELETE line below:
-- DELETE FROM app_releases;

-- ============================================================================
-- RELEASES (Add new versions at the top)
-- ============================================================================

INSERT INTO app_releases (version, title, released_at, highlights, changes) VALUES
(
  '1.5.0',
  'Goal-Based Training',
  '2025-12-28T14:00:00Z',
  ARRAY['Training Goals', 'Lifter Levels', 'Fill to Optimal'],
  ARRAY[
    'Set your experience level (Beginner, Intermediate, Advanced) in Settings or on first login',
    'Choose training goals per block: Hypertrophy, Strength, Maintenance, Power, or Endurance',
    'New Fill to Optimal button analyzes entire block and suggests exercises to reach MEV',
    'Block-level analysis prevents over-volume with 2x/week splits like PPL',
    'Research-backed volume calculations from training science literature'
  ]
),
(
  '1.4.0',
  'User Feedback',
  '2025-12-28T12:00:00Z',
  ARRAY['Bug Reports', 'Feature Requests', 'Screenshot Support'],
  ARRAY[
    'New feedback form in Settings to report bugs or request features',
    'Attach up to 3 screenshots to help explain issues',
    'Choose feedback type: Bug Report, Feature Request, or General',
    'Your feedback helps us improve MyLiftPal!'
  ]
),
(
  '1.3.0',
  'Workout Flexibility',
  '2025-12-28T00:00:00Z',
  ARRAY['Swap Exercises', 'Add Exercises', 'Smart Defaults'],
  ARRAY[
    'Swap any exercise during workout when equipment is busy',
    'Add exercises mid-workout with + button',
    'Smart defaults: copies settings from same exercise elsewhere in block',
    'Choose scope: "Just This Session" or "All Future Workouts"',
    'Already-logged sets preserved with original exercise'
  ]
),
(
  '1.2.1',
  'Quality of Life',
  '2025-12-27T22:00:00Z',
  ARRAY['In-App Roadmap', 'Welcome Fix'],
  ARRAY[
    'Added in-app changelog and roadmap page',
    'Fixed welcome message spacing',
    'Reorganized roadmap priorities for launch'
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
)
ON CONFLICT (version) DO UPDATE SET
  title = EXCLUDED.title,
  released_at = EXCLUDED.released_at,
  highlights = EXCLUDED.highlights,
  changes = EXCLUDED.changes;

-- Verify
SELECT version, title, released_at::date as date, array_length(highlights, 1) as highlights
FROM app_releases
ORDER BY released_at DESC;
