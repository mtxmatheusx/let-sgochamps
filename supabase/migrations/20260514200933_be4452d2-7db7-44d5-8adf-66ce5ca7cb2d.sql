
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 1),
  intensity TEXT NOT NULL,
  mood TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activities" ON public.activities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own activities" ON public.activities
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own activities" ON public.activities
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX activities_user_date_idx ON public.activities (user_id, date DESC);
