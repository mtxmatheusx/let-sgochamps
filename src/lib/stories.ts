// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type Story = {
  id: string;
  name: string;
  city: string;
  story: string;
  quote: string | null;
  activity_type: string | null;
  social_handle: string | null;
  photo_url: string | null;
  video_url: string | null;
  permission_to_share: boolean;
  status: "unread" | "featured" | "archived";
  is_pinned: boolean;
  reply: string | null;
  created_at: string;
};

export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  return !!data;
}

export async function fetchFeaturedStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "featured")
    .eq("permission_to_share", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Story[];
}

export async function fetchPinnedStory(): Promise<Story | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_pinned", true)
    .eq("permission_to_share", true)
    .maybeSingle();
  if (error) throw error;
  return data as Story | null;
}

export async function adminFetchStories(filter: "all" | "unread" | "featured" | "archived"): Promise<Story[]> {
  let query = supabase.from("stories").select("*").order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("status", filter);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Story[];
}

export async function submitStory(
  fields: {
    name: string;
    city: string;
    story: string;
    quote: string | null;
    activity_type: string | null;
    social_handle: string | null;
    permission_to_share: boolean;
  },
  photo?: File,
  video?: File
): Promise<void> {
  const { data: row, error: insertError } = await supabase
    .from("stories")
    .insert({ ...fields })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const id = row.id as string;
  const updates: { photo_url?: string; video_url?: string } = {};

  if (photo) {
    const ext = photo.name.split(".").pop();
    const path = `${id}/photo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("story-photos")
      .upload(path, photo, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("story-photos").getPublicUrl(path);
    updates.photo_url = urlData.publicUrl;
  }

  if (video) {
    const ext = video.name.split(".").pop();
    const path = `${id}/video.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("story-videos")
      .upload(path, video, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("story-videos").getPublicUrl(path);
    updates.video_url = urlData.publicUrl;
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase.from("stories").update(updates).eq("id", id);
    if (updateError) throw updateError;
  }
}

export async function adminUpdateStory(
  id: string,
  patch: Partial<Pick<Story, "status" | "is_pinned" | "reply">>
): Promise<void> {
  const { error } = await supabase.from("stories").update(patch).eq("id", id);
  if (error) throw error;
}
