
-- 1) Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS favorite_movement text,
  ADD COLUMN IF NOT EXISTS is_discoverable boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_len CHECK (bio IS NULL OR char_length(bio) <= 300);

-- Allow authenticated users to read discoverable profiles (and always their own).
DROP POLICY IF EXISTS "Profiles are viewable by self" ON public.profiles;
DROP POLICY IF EXISTS "Discoverable profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Discoverable profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_discoverable = true OR id = auth.uid());

-- 2) weekly_messages
CREATE TABLE IF NOT EXISTS public.weekly_messages (
  week_start date PRIMARY KEY,
  message text NOT NULL,
  author_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.weekly_messages TO anon, authenticated;
GRANT ALL ON public.weekly_messages TO service_role;

ALTER TABLE public.weekly_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly messages are public read"
  ON public.weekly_messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TRIGGER weekly_messages_set_updated_at
  BEFORE UPDATE ON public.weekly_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed current week message
INSERT INTO public.weekly_messages (week_start, message, author_note)
VALUES (
  date_trunc('week', CURRENT_DATE)::date,
  'This week, just show up. One session. One walk. One moment of movement. The streak doesn''t care about how hard — it cares that you came back.',
  'Aidan'
)
ON CONFLICT (week_start) DO NOTHING;

-- 3) Community weekly stats RPC
CREATE OR REPLACE FUNCTION public.get_community_weekly_stats()
RETURNS TABLE (total_minutes bigint, active_champs bigint, sessions_logged bigint, week_start date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH w AS (
    SELECT date_trunc('week', CURRENT_DATE)::date AS ws
  )
  SELECT
    COALESCE(SUM(a.duration), 0)::bigint,
    COUNT(DISTINCT a.user_id)::bigint,
    COUNT(*)::bigint,
    (SELECT ws FROM w)
  FROM public.activities a, w
  WHERE a.date >= w.ws AND a.date < w.ws + INTERVAL '7 days'
$$;

GRANT EXECUTE ON FUNCTION public.get_community_weekly_stats() TO anon, authenticated;

-- 4) search_champs RPC
CREATE OR REPLACE FUNCTION public.search_champs(q text DEFAULT '', limit_n int DEFAULT 60)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  favorite_movement text,
  total_minutes bigint,
  sessions_logged bigint,
  last_active timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.display_name, p.avatar_url, p.bio, p.location, p.favorite_movement,
    COALESCE((SELECT SUM(a.duration) FROM public.activities a WHERE a.user_id = p.id), 0)::bigint AS total_minutes,
    (SELECT COUNT(*) FROM public.activities a WHERE a.user_id = p.id)::bigint AS sessions_logged,
    (SELECT MAX(a.created_at) FROM public.activities a WHERE a.user_id = p.id) AS last_active
  FROM public.profiles p
  WHERE p.is_discoverable = true
    AND (
      COALESCE(NULLIF(trim(q), ''), '') = ''
      OR p.display_name ILIKE '%' || q || '%'
      OR p.location ILIKE '%' || q || '%'
      OR p.favorite_movement ILIKE '%' || q || '%'
    )
  ORDER BY last_active DESC NULLS LAST, p.display_name ASC
  LIMIT GREATEST(1, LEAST(limit_n, 200))
$$;

GRANT EXECUTE ON FUNCTION public.search_champs(text, int) TO authenticated;

-- 5) get_public_profile RPC
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile json;
  v_activities json;
  v_groups json;
  v_stats json;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'location', p.location,
    'website_url', p.website_url,
    'instagram_handle', p.instagram_handle,
    'favorite_movement', p.favorite_movement,
    'is_discoverable', p.is_discoverable,
    'created_at', p.created_at
  ) INTO v_profile
  FROM public.profiles p
  WHERE p.id = p_user_id
    AND (p.is_discoverable = true OR p.id = auth.uid());

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_activities
  FROM (
    SELECT a.id, a.type, a.duration, a.intensity, a.mood, a.date, a.notes, a.created_at
    FROM public.activities a
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_groups
  FROM (
    SELECT g.id, g.slug, g.name, g.type, g.cover_url
    FROM public.groups g
    JOIN public.group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = p_user_id AND g.is_public = true
    ORDER BY gm.joined_at DESC
    LIMIT 20
  ) t;

  SELECT json_build_object(
    'total_minutes', COALESCE(SUM(duration), 0),
    'sessions_logged', COUNT(*),
    'days_active', COUNT(DISTINCT date)
  ) INTO v_stats
  FROM public.activities WHERE user_id = p_user_id;

  RETURN json_build_object(
    'profile', v_profile,
    'recent', v_activities,
    'groups', v_groups,
    'stats', v_stats
  );
END
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- 6) Avatars bucket policies (bucket created via storage tool separately)
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars owner write" ON storage.objects;
DROP POLICY IF EXISTS "Avatars owner update" ON storage.objects;
DROP POLICY IF EXISTS "Avatars owner delete" ON storage.objects;

CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatars owner write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatars owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatars owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7) Backfill: ensure each group owner is also a member (fixes The Wall)
INSERT INTO public.group_members (group_id, user_id, role)
SELECT g.id, g.owner_id, 'owner'
FROM public.groups g
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = g.id AND gm.user_id = g.owner_id
)
ON CONFLICT DO NOTHING;
