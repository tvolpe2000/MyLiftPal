-- User Feedback System
-- Allows users to submit bug reports, feature requests, and general feedback

-- Feedback table
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_urls TEXT[] DEFAULT '{}',
  app_version TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'wont_fix')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Users can insert their own feedback, read their own submissions
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for admin queries
CREATE INDEX idx_feedback_status ON user_feedback(status);
CREATE INDEX idx_feedback_type ON user_feedback(type);
CREATE INDEX idx_feedback_created ON user_feedback(created_at DESC);

-- ============================================================================
-- Storage bucket for screenshots
-- NOTE: Create bucket 'feedback-screenshots' manually in Supabase dashboard
-- Settings: Private, 5MB max file size, allowed types: image/png, image/jpeg, image/webp
-- ============================================================================

-- Storage RLS policies (run in Supabase SQL editor after creating bucket)
-- Users can upload to their own folder
-- CREATE POLICY "Users can upload screenshots"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'feedback-screenshots' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Users can read their own screenshots
-- CREATE POLICY "Users can view own screenshots"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'feedback-screenshots' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
