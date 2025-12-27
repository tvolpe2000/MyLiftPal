-- Migration: Add changelog and roadmap tables
-- Purpose: Store app release history and upcoming features for in-app display

-- ============================================================================
-- APP RELEASES TABLE
-- Stores version history with release notes
-- ============================================================================

CREATE TABLE app_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  title TEXT,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  highlights TEXT[] DEFAULT '{}',
  changes TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Public read access for published releases
ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published releases"
  ON app_releases FOR SELECT
  USING (is_published = true);

-- Index for ordering by release date
CREATE INDEX idx_app_releases_released_at ON app_releases(released_at DESC);

-- ============================================================================
-- APP ROADMAP TABLE
-- Stores upcoming features with status tracking
-- ============================================================================

CREATE TABLE app_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'tracked' CHECK (status IN ('tracked', 'planned', 'in_progress')),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Public read access for visible roadmap items
ALTER TABLE app_roadmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible roadmap items"
  ON app_roadmap FOR SELECT
  USING (is_visible = true);

-- Index for ordering
CREATE INDEX idx_app_roadmap_sort ON app_roadmap(sort_order ASC);

-- ============================================================================
-- MODIFY PROFILES TABLE
-- Add last_seen_version for tracking notification dismissal
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_version TEXT;

-- ============================================================================
-- SEED DATA: RELEASES
-- ============================================================================

INSERT INTO app_releases (version, title, released_at, highlights, changes) VALUES
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
);

-- ============================================================================
-- SEED DATA: ROADMAP
-- ============================================================================

INSERT INTO app_roadmap (title, description, status, sort_order) VALUES
(
  'Voice Logging',
  'Log sets by speaking "85 for 12" - hands-free workout tracking',
  'planned',
  1
),
(
  'Rest Timer',
  'Countdown timer between sets with notification alerts',
  'tracked',
  2
),
(
  'Stats Dashboard',
  'View progress charts, PRs, and workout analytics over time',
  'tracked',
  3
),
(
  'Photo Import',
  'OCR to digitize handwritten workout logs from photos',
  'tracked',
  4
),
(
  'Deload Week Generator',
  'Automatically create recovery weeks based on your training',
  'tracked',
  5
);
