-- ── Stories table ──────────────────────────────────────────────────────────
CREATE TABLE public.stories (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  city               TEXT        NOT NULL,
  story              TEXT        NOT NULL,
  photo_url          TEXT,
  permission_to_share BOOLEAN    NOT NULL DEFAULT false,
  status             TEXT        NOT NULL DEFAULT 'unread'
                                 CHECK (status IN ('unread', 'featured', 'archived')),
  is_pinned          BOOLEAN     NOT NULL DEFAULT false,
  reply              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- ── Admin emails table ──────────────────────────────────────────────────────
-- Add Aidan's team emails here via Supabase SQL editor:
--   INSERT INTO public.admins VALUES ('aidan@letsgochamps.com');
CREATE TABLE public.admins (
  email TEXT PRIMARY KEY
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can check admin list"
  ON public.admins FOR SELECT TO authenticated USING (true);

-- ── Stories RLS ─────────────────────────────────────────────────────────────
-- Anyone (anon) can submit a story
CREATE POLICY "Anyone can submit a story"
  ON public.stories FOR INSERT WITH CHECK (true);

-- Public can read featured + shared stories; admins can read all
CREATE POLICY "Public reads featured; admins read all"
  ON public.stories FOR SELECT
  USING (
    (status = 'featured' AND permission_to_share = true)
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Only admins can update stories (status, pin, reply)
CREATE POLICY "Admins can update stories"
  ON public.stories FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- ── Supabase Storage bucket for story photos ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('story-photos', 'story-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload a story photo"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'story-photos');

CREATE POLICY "Anyone can view story photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story-photos');

-- ── Index for admin inbox ───────────────────────────────────────────────────
CREATE INDEX stories_status_created_idx ON public.stories (status, created_at DESC);
CREATE INDEX stories_pinned_idx         ON public.stories (is_pinned DESC, created_at DESC);
