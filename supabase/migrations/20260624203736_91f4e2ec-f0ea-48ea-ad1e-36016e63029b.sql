
-- =========================================================
-- updated_at trigger helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =========================================================
-- profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  daily_pose TEXT,
  daily_pose_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- groups
-- =========================================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('club','challenge')),
  description TEXT,
  cover_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  scoring_mode TEXT NOT NULL DEFAULT 'days_active' CHECK (scoring_mode IN ('days_active','check_in_count','metrics_minutes')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.groups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- group_members
-- =========================================================
CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(p_group UUID, p_user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_group AND user_id = p_user)
$$;
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group UUID, p_user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_group AND user_id = p_user AND role IN ('owner','admin'))
$$;

-- groups policies
CREATE POLICY "View public or member groups" ON public.groups FOR SELECT
  USING (is_public OR public.is_group_member(id, auth.uid()));
CREATE POLICY "Authenticated can create groups" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins update group" ON public.groups FOR UPDATE TO authenticated
  USING (public.is_group_admin(id, auth.uid())) WITH CHECK (public.is_group_admin(id, auth.uid()));
CREATE POLICY "Owner deletes group" ON public.groups FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- group_members policies
CREATE POLICY "Members view membership" ON public.group_members FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Insert self as member" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave or admin remove" ON public.group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Admin update roles" ON public.group_members FOR UPDATE TO authenticated
  USING (public.is_group_admin(group_id, auth.uid())) WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- =========================================================
-- group_invites
-- =========================================================
CREATE TABLE public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_invites TO authenticated;
GRANT ALL ON public.group_invites TO service_role;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invites" ON public.group_invites FOR ALL TO authenticated
  USING (public.is_group_admin(group_id, auth.uid())) WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- =========================================================
-- activity_groups (cross-post)
-- =========================================================
CREATE TABLE public.activity_groups (
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, group_id)
);
GRANT SELECT, INSERT, DELETE ON public.activity_groups TO authenticated;
GRANT ALL ON public.activity_groups TO service_role;
ALTER TABLE public.activity_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View posts in joined or public groups" ON public.activity_groups FOR SELECT TO authenticated
  USING (
    public.is_group_member(group_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.is_public)
  );
CREATE POLICY "Author posts own activity to group" ON public.activity_groups FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id AND a.user_id = auth.uid())
    AND public.is_group_member(group_id, auth.uid())
  );
CREATE POLICY "Author or admin removes post" ON public.activity_groups FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id AND a.user_id = auth.uid())
    OR public.is_group_admin(group_id, auth.uid())
  );

-- =========================================================
-- check_in_photos
-- =========================================================
CREATE TABLE public.check_in_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_in_photos TO authenticated;
GRANT ALL ON public.check_in_photos TO service_role;
ALTER TABLE public.check_in_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View photos in viewable activities" ON public.check_in_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          a.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.activity_groups ag
            WHERE ag.activity_id = a.id
              AND (public.is_group_member(ag.group_id, auth.uid())
                   OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = ag.group_id AND g.is_public))
          )
        )
    )
  );
CREATE POLICY "Author adds photo" ON public.check_in_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id AND a.user_id = auth.uid()));
CREATE POLICY "Author deletes photo" ON public.check_in_photos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id AND a.user_id = auth.uid()));

-- =========================================================
-- comments
-- =========================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View comments where activity is viewable" ON public.comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id
        AND (
          a.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.activity_groups ag
            WHERE ag.activity_id = a.id
              AND (public.is_group_member(ag.group_id, auth.uid())
                   OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = ag.group_id AND g.is_public))
          )
        )
    )
  );
CREATE POLICY "Post own comment" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own comment" ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_my_groups()
RETURNS TABLE (
  id UUID, slug TEXT, name TEXT, type TEXT, cover_url TEXT,
  start_date DATE, end_date DATE, role TEXT, members BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.slug, g.name, g.type, g.cover_url, g.start_date, g.end_date,
         gm.role,
         (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id) AS members
  FROM public.groups g
  JOIN public.group_members gm ON gm.group_id = g.id
  WHERE gm.user_id = auth.uid()
  ORDER BY g.created_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.get_my_groups() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_group_stats(p_group_id UUID)
RETURNS TABLE (
  total_minutes BIGINT, active_members BIGINT, sessions_logged BIGINT, total_members BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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
  FROM posts
$$;
GRANT EXECUTE ON FUNCTION public.get_group_stats(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_group_roll_call(p_group_id UUID)
RETURNS TABLE (
  user_id UUID, display_name TEXT, avatar_url TEXT,
  daily_pose TEXT, last_check_in TIMESTAMPTZ, check_ins BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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
  ORDER BY 5 DESC NULLS LAST
$$;
GRANT EXECUTE ON FUNCTION public.get_group_roll_call(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_group_by_code(p_code TEXT)
RETURNS TABLE (group_id UUID, slug TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_group_id UUID; v_slug TEXT; v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'must be authenticated'; END IF;
  SELECT gi.group_id, g.slug INTO v_group_id, v_slug
  FROM public.group_invites gi
  JOIN public.groups g ON g.id = gi.group_id
  WHERE gi.code = p_code
    AND (gi.expires_at IS NULL OR gi.expires_at > now())
  LIMIT 1;
  IF v_group_id IS NULL THEN RAISE EXCEPTION 'invalid or expired invite code'; END IF;
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_uid, 'member')
  ON CONFLICT DO NOTHING;
  RETURN QUERY SELECT v_group_id, v_slug;
END $$;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(TEXT) TO authenticated;

-- =========================================================
-- Seed "The Wall" — global public club
-- =========================================================
INSERT INTO public.groups (slug, name, type, description, owner_id, is_public, scoring_mode)
SELECT 'the-wall', 'The Wall', 'club',
       'The shared wall where every champ posts their daily showing-up.',
       (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
       true, 'days_active'
WHERE EXISTS (SELECT 1 FROM auth.users)
  AND NOT EXISTS (SELECT 1 FROM public.groups WHERE slug = 'the-wall');
