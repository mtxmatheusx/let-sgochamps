## Goal

Add a global world map to `/champs` that visualizes where champs are from, reinforcing the "movement across 170+ countries" feeling.

## What the user will see

At the top of the Champs directory (above the search input), a new **"Champs around the world"** panel:

- A clean, minimal world map (light, iOS-style — no heavy borders, no political labels).
- Glowing dots on the map, one per champ location, scaled by how many champs are in that city/country.
- Hover/tap a dot → small glass tooltip: city name + number of champs.
- Three headline counters next to the map: **Countries**, **Cities**, **Champs on the map**.
- Empty/sparse state: if there are < 3 located champs, show a soft prompt "Add your city in your profile to put yourself on the map" with a link to `/profile`.

Below it, the existing search + grid of champ cards stays exactly as it is.

## Data approach

Champs already have a free-text `location` field on their profile ("City, Country"). To plot them we need lat/lng. Plan:

1. Add two columns to `profiles`: `location_lat numeric`, `location_lng numeric`, `location_country text` (ISO-2, e.g. `BR`).
2. When a user saves their profile with a non-empty `location`, geocode it once via the existing **Google Maps connector** (gateway `/maps/api/geocode/json`) inside a server function, and store lat/lng/country back on the profile. No client-side key, no per-render geocoding.
3. New RPC `get_champ_map_points()` (SECURITY DEFINER, authenticated only — matches the existing privacy rule that profiles are only visible to signed-in users):
   - Returns aggregated points: `{ lat, lng, city, country, count }` grouped by rounded coordinates so dense cities become one dot.
   - Only includes `is_discoverable = true` profiles with non-null coords.
4. Headline counts come from the same RPC (distinct countries, distinct cities, total located champs).

## Map rendering

Use **react-simple-maps** + a TopoJSON world atlas (lightweight, no API key, SSR-safe with `ssr:false` on the component, fits the minimalist Apple aesthetic). Dots are SVG circles with a soft glow, sized `4–14px` by `count`. Pan/zoom disabled on mobile, gentle zoom enabled on desktop. Map renders in cream/off-white with hairline country strokes to match the current design system.

## Files

- Migration: add columns + RPC + grants.
- `src/lib/geocode.functions.ts` — `createServerFn` that calls Google Maps gateway and updates the row. Called from `updateMyProfile` after save when `location` changed.
- `src/lib/profiles.ts` — add `fetchChampMapPoints()`.
- `src/components/ChampsWorldMap.tsx` — client-only map component (lazy-loaded).
- `src/routes/champs.index.tsx` — mount the map panel above the search.

## Out of scope (ask later)

- Clustering animations / fly-to a champ on click.
- Country leaderboards.
- Showing the current user's own dot highlighted.
- Backfilling lat/lng for existing profiles automatically (will geocode lazily next time each user saves their profile, or on first map load for a small batch — confirm preference).

## Question before building

The `location` field today is free text. Two options for the new lat/lng:

1. **Geocode on save** (recommended): user types "São Paulo, Brazil", we geocode once and store. Clean, no map jitter, costs ~1 Google call per profile save.
2. **Ask the user to pick from a Google Places autocomplete** when editing profile. More accurate, slightly heavier UI.

Default to option 1 unless you'd rather have the autocomplete picker.
