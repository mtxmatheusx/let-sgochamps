-- Security hardening (applied live via MCP on 2026-06-24).
-- 1) admins: stop email-roster enumeration. checkIsAdmin() filters by the caller's
--    own email, so a self-only SELECT keeps admin detection working.
DROP POLICY IF EXISTS "Authenticated users can check admin list" ON public.admins;
CREATE POLICY "Users can check own admin status"
  ON public.admins FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- 2) stories: require login to submit (was public/anon with WITH CHECK true).
DROP POLICY IF EXISTS "Anyone can submit a story" ON public.stories;
CREATE POLICY "Authenticated users can submit a story"
  ON public.stories FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3) Pin search_path on every SECURITY DEFINER function (prevents search_path hijack).
ALTER FUNCTION public.get_community_stats() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_community_weekly_stats() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_group_roll_call(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_group_stats(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_my_groups() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.join_group_by_code(text) SET search_path = public, pg_temp;

-- 4) handle_new_user is a signup TRIGGER, not a public RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
