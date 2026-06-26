// @ts-nocheck
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase: any = _sb;

const GMAPS_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

/** Turn a free-text city into coordinates so the champ shows up on the world map.
 *  Tries Google Geocoding (key provisioned by Lovable), falls back to free Nominatim.
 *  Returns null on any failure — the profile still saves, just without a map dot. */
export async function geocodeCity(
  city: string,
): Promise<{ lat: number; lng: number; country: string | null } | null> {
  const q = city.trim();
  if (!q) return null;

  // Primary: Nominatim (OpenStreetMap) — free, no key, CORS-enabled in browsers.
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`,
    );
    const arr = await r.json();
    const hit = Array.isArray(arr) ? arr[0] : null;
    if (hit) {
      return {
        lat: parseFloat(hit.lat),
        lng: parseFloat(hit.lon),
        country: hit.address?.country ?? null,
      };
    }
  } catch {
    /* fall through to Google */
  }

  // Fallback: Google Geocoding (only works if the key has the Geocoding API enabled).
  if (GMAPS_KEY) {
    try {
      const r = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GMAPS_KEY}`,
      );
      const j = await r.json();
      const hit = j?.results?.[0];
      if (hit?.geometry?.location) {
        const country =
          hit.address_components?.find((c: any) => c.types?.includes("country"))?.long_name ?? null;
        return { lat: hit.geometry.location.lat, lng: hit.geometry.location.lng, country };
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export type MyProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  favorite_movement: string | null;
  is_discoverable: boolean;
};

export type ChampCard = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  favorite_movement: string | null;
  total_minutes: number;
  sessions_logged: number;
  last_active: string | null;
};

export type PublicProfile = {
  profile: MyProfile & { created_at: string };
  recent: Array<{
    id: string;
    type: string;
    duration: number;
    intensity: string | null;
    mood: string | null;
    date: string;
    notes: string | null;
    created_at: string;
  }>;
  groups: Array<{ id: string; slug: string; name: string; type: string; cover_url: string | null }>;
  stats: { total_minutes: number; sessions_logged: number; days_active: number };
};

const SIGN_TTL = 60 * 60 * 24 * 365; // 1 year

/** Convert a stored avatar path/url into a viewable URL. Stored values
 *  may be a full URL (legacy seeded) or a storage path inside `avatars`. */
export async function resolveAvatarUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(value, SIGN_TTL);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Resolve many avatars in one batch (one network round-trip per item, but parallel). */
export async function resolveAvatarUrls<T extends { avatar_url: string | null }>(rows: T[]): Promise<T[]> {
  const out = await Promise.all(
    rows.map(async (r) => ({ ...r, avatar_url: await resolveAvatarUrl(r.avatar_url) })),
  );
  return out;
}

export async function fetchMyProfile(): Promise<MyProfile | null> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, location, website_url, instagram_handle, favorite_movement, is_discoverable")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const resolved = await resolveAvatarUrl(data.avatar_url);
  return { ...data, avatar_url: resolved };
}

export async function updateMyProfile(patch: Partial<MyProfile>): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Not signed in");

  // When the city changes, geocode it so the champ lands on the world map.
  const finalPatch: any = { ...patch };
  if (typeof patch.location === "string" && patch.location.trim()) {
    const geo = await geocodeCity(patch.location);
    if (geo) {
      finalPatch.location_lat = geo.lat;
      finalPatch.location_lng = geo.lng;
      finalPatch.location_country = geo.country;
    }
  }

  const { error } = await supabase.from("profiles").update(finalPatch).eq("id", uid);
  if (error) throw error;
}

// Cached so the Layout gate doesn't re-query on every navigation, and so completing
// onboarding (which sets it true) can't loop the champ back to /onboarding.
let _onboardingCache: boolean | null = null;
export function resetOnboardingCache() {
  _onboardingCache = null;
}

export async function fetchOnboardingStatus(): Promise<boolean | null> {
  if (_onboardingCache !== null) return _onboardingCache;
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", uid)
    .maybeSingle();
  if (error) return null;
  _onboardingCache = !!data?.onboarding_completed;
  return _onboardingCache;
}

export type OnboardingData = {
  display_name: string;
  location: string;
  goal: string | null;
  favorite_activities: string[];
  bio: string | null;
  instagram_handle: string | null;
};

/** Save everything the champ entered during onboarding, geocode their city for the
 *  world map, and flip onboarding_completed so the gate stops redirecting them. */
export async function completeOnboarding(data: OnboardingData): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Not signed in");

  const patch: any = {
    display_name: data.display_name.trim(),
    location: data.location.trim() || null,
    goal: data.goal,
    favorite_activities: data.favorite_activities.length ? data.favorite_activities : null,
    bio: data.bio?.trim() || null,
    instagram_handle: data.instagram_handle?.trim() || null,
    onboarding_completed: true,
  };

  if (data.location?.trim()) {
    const geo = await geocodeCity(data.location);
    if (geo) {
      patch.location_lat = geo.lat;
      patch.location_lng = geo.lng;
      patch.location_country = geo.country;
    }
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
  if (error) throw error;
  _onboardingCache = true;
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Not signed in");
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo too large — keep it under 5 MB.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${uid}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  await supabase.from("profiles").update({ avatar_url: path }).eq("id", uid);
  return path;
}

export async function searchChamps(query: string): Promise<ChampCard[]> {
  const { data, error } = await supabase.rpc("search_champs", { q: query, limit_n: 60 });
  if (error) {
    console.warn("search_champs failed:", error.message);
    return [];
  }
  return resolveAvatarUrls((data ?? []) as ChampCard[]);
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: userId });
  if (error) {
    console.warn("get_public_profile failed:", error.message);
    return null;
  }
  if (!data) return null;
  const p = data as PublicProfile;
  p.profile.avatar_url = await resolveAvatarUrl(p.profile.avatar_url);
  return p;
}

export type ChampMapPoint = {
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  count: number;
};

export type ChampMapData = {
  points: ChampMapPoint[];
  totals: { countries: number; cities: number; champs: number };
};

export async function fetchChampMapPoints(): Promise<ChampMapData> {
  const { data, error } = await supabase.rpc("get_champ_map_points");
  if (error) {
    console.warn("get_champ_map_points failed:", error.message);
    return { points: [], totals: { countries: 0, cities: 0, champs: 0 } };
  }
  return (data as ChampMapData) ?? { points: [], totals: { countries: 0, cities: 0, champs: 0 } };
}

