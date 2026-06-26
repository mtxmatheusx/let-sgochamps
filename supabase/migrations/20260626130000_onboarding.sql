-- Onboarding: collect profile data on first login, then a feature tour.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_lat numeric,
  ADD COLUMN IF NOT EXISTS location_lng numeric,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS favorite_activities text[],
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Existing champs (already have a name) shouldn't be forced through onboarding.
UPDATE public.profiles
  SET onboarding_completed = true
  WHERE display_name IS NOT NULL AND onboarding_completed = false;

-- Backfill map coordinates for champs whose city was saved before geocoding existed,
-- so they show on the world map immediately (geocode-on-save handles new edits).
UPDATE public.profiles
  SET location_lat = -23.5505, location_lng = -46.6333, location_country = 'Brazil'
  WHERE location ILIKE '%paulo%' AND location_lat IS NULL;
