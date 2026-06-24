// @ts-nocheck
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase: any = _sb;

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
  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
  if (error) throw error;
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
