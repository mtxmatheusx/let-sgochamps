-- Community stats RPC — runs as function owner (SECURITY DEFINER)
-- bypasses RLS to return only aggregate counts, never individual user data.
CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'today', (
      SELECT COUNT(DISTINCT user_id)::int
      FROM public.activities
      WHERE date = CURRENT_DATE
    ),
    'last7days', (
      SELECT COALESCE(json_agg(
        json_build_object('date', d::text, 'champs', COALESCE(cnt, 0))
        ORDER BY d
      ), '[]'::json)
      FROM (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS d
      ) days
      LEFT JOIN (
        SELECT date, COUNT(DISTINCT user_id)::int AS cnt
        FROM public.activities
        WHERE date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY date
      ) counts ON counts.date = days.d
    )
  );
$$;
