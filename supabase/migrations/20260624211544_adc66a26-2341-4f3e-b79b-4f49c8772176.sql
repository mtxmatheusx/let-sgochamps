
CREATE OR REPLACE FUNCTION public.create_group(
  p_name text,
  p_type text,
  p_description text DEFAULT NULL,
  p_is_public boolean DEFAULT false,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_scoring_mode text DEFAULT 'days_active'
)
RETURNS TABLE(id uuid, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_base text;
  v_slug text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'must be authenticated'; END IF;
  IF p_type NOT IN ('club','challenge') THEN RAISE EXCEPTION 'invalid type'; END IF;

  v_base := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_base := regexp_replace(v_base, '(^-+|-+$)', '', 'g');
  IF v_base = '' OR v_base IS NULL THEN v_base := 'group'; END IF;
  v_slug := left(v_base, 60) || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);

  INSERT INTO public.groups (
    name, slug, type, description, owner_id, is_public,
    start_date, end_date, scoring_mode
  ) VALUES (
    trim(p_name), v_slug, p_type, NULLIF(trim(coalesce(p_description,'')),''),
    v_uid, coalesce(p_is_public, false),
    CASE WHEN p_type = 'challenge' THEN p_start_date ELSE NULL END,
    CASE WHEN p_type = 'challenge' THEN p_end_date ELSE NULL END,
    coalesce(p_scoring_mode, 'days_active')
  )
  RETURNING groups.id INTO v_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_id, v_uid, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT v_id, v_slug;
END
$$;

GRANT EXECUTE ON FUNCTION public.create_group(text,text,text,boolean,date,date,text) TO authenticated;

-- Self-healing get_my_groups: also include groups you own even if membership row is missing.
CREATE OR REPLACE FUNCTION public.get_my_groups()
RETURNS TABLE(id uuid, slug text, name text, type text, cover_url text, start_date date, end_date date, role text, members bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.slug, g.name, g.type, g.cover_url, g.start_date, g.end_date,
         COALESCE(gm.role, CASE WHEN g.owner_id = auth.uid() THEN 'owner' ELSE 'member' END) AS role,
         (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id) AS members
  FROM public.groups g
  LEFT JOIN public.group_members gm
    ON gm.group_id = g.id AND gm.user_id = auth.uid()
  WHERE gm.user_id = auth.uid() OR g.owner_id = auth.uid()
  ORDER BY g.created_at DESC
$$;
