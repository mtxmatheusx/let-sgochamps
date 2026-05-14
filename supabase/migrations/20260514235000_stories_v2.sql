-- Stories v2: add quote, activity_type, social_handle, video_url columns
-- Run in Supabase SQL editor

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS quote           TEXT,
  ADD COLUMN IF NOT EXISTS activity_type   TEXT,
  ADD COLUMN IF NOT EXISTS social_handle   TEXT,
  ADD COLUMN IF NOT EXISTS video_url       TEXT;

-- Storage bucket for short videos (30s max, enforced client-side)
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-videos', 'story-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload videos (same pattern as story-photos)
CREATE POLICY IF NOT EXISTS "Anyone can upload story videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'story-videos');

CREATE POLICY IF NOT EXISTS "Story videos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story-videos');
