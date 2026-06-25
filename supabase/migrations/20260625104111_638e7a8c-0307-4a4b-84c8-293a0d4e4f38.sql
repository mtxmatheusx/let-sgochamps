
-- 1. Remove public-readable profiles policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2. Storage: replace public check-ins read with owner-only authenticated read
DROP POLICY IF EXISTS "Check-ins are viewable" ON storage.objects;
CREATE POLICY "Users read own check-in photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'check-ins'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 3. Guard get_group_roll_call with membership / public-group check
CREATE OR REPLACE FUNCTION public.get_group_roll_call(p_group_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, daily_pose text, last_check_in timestamp with time zone, check_ins bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups WHERE id = p_group_id AND is_public)
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    gm.user_id,
    p.display_name,
    p.avatar_url,
    CASE WHEN p.daily_pose_date = CURRENT_DATE THEN p.daily_pose ELSE NULL END,
    (SELECT MAX(a.created_at) FROM public.activities a
       JOIN public.activity_groups ag ON ag.activity_id = a.id
       WHERE ag.group_id = p_group_id AND a.user_id = gm.user_id),
    (SELECT COUNT(*) FROM public.activities a
       JOIN public.activity_groups ag ON ag.activity_id = a.id
       WHERE ag.group_id = p_group_id AND a.user_id = gm.user_id)::BIGINT
  FROM public.group_members gm
  LEFT JOIN public.profiles p ON p.id = gm.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY 5 DESC NULLS LAST;
END
$$;

-- 4. Guard get_group_stats with the same check
CREATE OR REPLACE FUNCTION public.get_group_stats(p_group_id uuid)
 RETURNS TABLE(total_minutes bigint, active_members bigint, sessions_logged bigint, total_members bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups WHERE id = p_group_id AND is_public)
  ) THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  RETURN QUERY
  WITH posts AS (
    SELECT a.* FROM public.activities a
    JOIN public.activity_groups ag ON ag.activity_id = a.id
    WHERE ag.group_id = p_group_id
  )
  SELECT
    COALESCE(SUM(duration), 0)::BIGINT,
    COUNT(DISTINCT user_id)::BIGINT,
    COUNT(*)::BIGINT,
    (SELECT COUNT(*) FROM public.group_members WHERE group_id = p_group_id)::BIGINT
  FROM posts;
END
$$;

-- 5. Lock down EXECUTE on SECURITY DEFINER functions
-- Internal helpers / triggers: revoke from public, anon, authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Client-facing RPCs: revoke anon, allow authenticated only
REVOKE EXECUTE ON FUNCTION public.create_group(text, text, text, boolean, date, date, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_community_weekly_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_group_roll_call(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_group_stats(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_groups() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_group_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_champs(text, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_group(text, text, text, boolean, date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_weekly_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_roll_call(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_groups() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_champs(text, integer) TO authenticated;
