
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_lat numeric,
  ADD COLUMN IF NOT EXISTS location_lng numeric,
  ADD COLUMN IF NOT EXISTS location_country text;

CREATE OR REPLACE FUNCTION public.get_champ_map_points()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points json;
  v_totals json;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('points', '[]'::json, 'totals', json_build_object('countries',0,'cities',0,'champs',0));
  END IF;

  WITH base AS (
    SELECT
      round(p.location_lat::numeric, 1) AS lat_b,
      round(p.location_lng::numeric, 1) AS lng_b,
      p.location,
      p.location_country
    FROM public.profiles p
    WHERE p.is_discoverable = true
      AND p.location_lat IS NOT NULL
      AND p.location_lng IS NOT NULL
  ),
  agg AS (
    SELECT
      lat_b, lng_b,
      (array_agg(location ORDER BY location))[1] AS city,
      (array_agg(location_country ORDER BY location_country))[1] AS country,
      count(*)::int AS n
    FROM base
    GROUP BY lat_b, lng_b
  )
  SELECT COALESCE(json_agg(json_build_object(
    'lat', lat_b, 'lng', lng_b, 'city', city, 'country', country, 'count', n
  )), '[]'::json) INTO v_points FROM agg;

  SELECT json_build_object(
    'countries', (SELECT count(DISTINCT location_country) FROM base WHERE location_country IS NOT NULL),
    'cities', (SELECT count(*) FROM (SELECT 1 FROM base GROUP BY lat_b, lng_b) z),
    'champs', (SELECT count(*) FROM base)
  ) INTO v_totals;

  RETURN json_build_object('points', v_points, 'totals', v_totals);
END $$;

REVOKE EXECUTE ON FUNCTION public.get_champ_map_points() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_champ_map_points() TO authenticated;
