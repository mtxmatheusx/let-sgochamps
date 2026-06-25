-- Group feed via a SECURITY DEFINER RPC (applied live via MCP on 2026-06-24).
-- The previous client read `activities` directly, but that table's SELECT policy is
-- (correctly) owner-only — so members never saw each other's check-ins. We must NOT
-- broaden that policy, because fetchActivities() (history/streak/stats) relies on it
-- to scope to the caller. This RPC enforces group membership itself and returns the
-- feed, leaving the owner-only policy intact.
CREATE OR REPLACE FUNCTION public.get_group_feed(p_group_id uuid, p_limit int DEFAULT 40)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_can_see boolean;
BEGIN
  SELECT
    EXISTS (SELECT 1 FROM group_members gm
            WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM groups g
               WHERE g.id = p_group_id AND g.is_public)
  INTO v_can_see;

  IF NOT v_can_see THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(item ORDER BY created_at DESC)
    FROM (
      SELECT
        a.created_at,
        jsonb_build_object(
          'id', a.id,
          'user_id', a.user_id,
          'type', a.type,
          'duration', a.duration,
          'intensity', a.intensity,
          'mood', a.mood,
          'date', a.date,
          'notes', a.notes,
          'created_at', a.created_at,
          'author', jsonb_build_object(
            'id', p.id, 'display_name', p.display_name, 'avatar_url', p.avatar_url
          ),
          'photos', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', ph.id, 'url', ph.url, 'caption', ph.caption, 'position', ph.position
            ) ORDER BY ph.position)
            FROM check_in_photos ph WHERE ph.activity_id = a.id
          ), '[]'::jsonb),
          'comments', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', c.id, 'body', c.body, 'created_at', c.created_at, 'user_id', c.user_id,
              'author', jsonb_build_object(
                'id', cp.id, 'display_name', cp.display_name, 'avatar_url', cp.avatar_url
              )
            ) ORDER BY c.created_at)
            FROM comments c
            LEFT JOIN profiles cp ON cp.id = c.user_id
            WHERE c.activity_id = a.id
          ), '[]'::jsonb)
        ) AS item
      FROM activity_groups ag
      JOIN activities a ON a.id = ag.activity_id
      LEFT JOIN profiles p ON p.id = a.user_id
      WHERE ag.group_id = p_group_id
      ORDER BY a.created_at DESC
      LIMIT LEAST(COALESCE(p_limit, 40), 200)
    ) sub
  ), '[]'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_group_feed(uuid, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_group_feed(uuid, int) TO authenticated;
