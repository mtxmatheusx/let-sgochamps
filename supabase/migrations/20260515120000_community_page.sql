-- ════════════════════════════════════════════════════════════════════
-- Community page: weekly aggregate stats + Aidan's message of the week
-- ════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. weekly_messages table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  date NOT NULL,        -- Monday of the week this message belongs to
  message     text NOT NULL,
  author_note text,                 -- optional context Aidan adds below the quote
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT weekly_messages_week_start_unique UNIQUE (week_start)
);

CREATE INDEX IF NOT EXISTS weekly_messages_week_start_idx
  ON public.weekly_messages (week_start DESC);

ALTER TABLE public.weekly_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages (public community page)
DROP POLICY IF EXISTS "weekly_messages: public read" ON public.weekly_messages;
CREATE POLICY "weekly_messages: public read"
  ON public.weekly_messages
  FOR SELECT
  USING (true);

-- Only admins (rows present in public.admins by email) can write
DROP POLICY IF EXISTS "weekly_messages: admin write" ON public.weekly_messages;
CREATE POLICY "weekly_messages: admin write"
  ON public.weekly_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins
      WHERE admins.email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admins
      WHERE admins.email = auth.jwt() ->> 'email'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 2. Weekly aggregate stats RPC
-- Returns the current ISO week's aggregate movement numbers.
-- Runs SECURITY DEFINER so it can scan public.activities across
-- all users — exposes only counts/sums, never individual rows.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_community_weekly_stats()
RETURNS TABLE (
  total_minutes    bigint,
  active_champs    bigint,
  sessions_logged  bigint,
  week_start       date
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH week_bounds AS (
    SELECT
      date_trunc('week', CURRENT_DATE)::date          AS week_start, -- Monday
      (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')::date AS week_end
  )
  SELECT
    COALESCE(SUM(a.duration), 0)::bigint           AS total_minutes,
    COUNT(DISTINCT a.user_id)::bigint              AS active_champs,
    COUNT(*)::bigint                               AS sessions_logged,
    (SELECT week_start FROM week_bounds)           AS week_start
  FROM public.activities a, week_bounds wb
  WHERE a.date >= wb.week_start
    AND a.date <  wb.week_end;
$$;

-- Grant execute to anon and authenticated roles so the public
-- community page can call it without a session.
GRANT EXECUTE ON FUNCTION public.get_community_weekly_stats() TO anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- 3. Seed: a first welcome message (only if table is empty)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.weekly_messages (week_start, message, author_note)
SELECT
  date_trunc('week', CURRENT_DATE)::date,
  'Every champ starts with one log. The week ahead is just a stack of small decisions — keep stacking them.',
  'Welcome to the Brilliance Tree. This is week one of many.'
WHERE NOT EXISTS (SELECT 1 FROM public.weekly_messages);
