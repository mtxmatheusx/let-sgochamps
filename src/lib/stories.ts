import { supabase } from "@/integrations/supabase/client";

export type Story = {
  id: string;
  name: string;
  city: string;
  story: string;
  photo_url: string | null;
  permission_to_share: boolean;
  status: "unread" | "featured" | "archived";
  is_pinned: boolean;
  reply: string | null;
  created_at: string;
  updated_at: string;
};

export type StoryInsert = {
  name: string;
  city: string;
  story: string;
  photo_url?: string | null;
  permission_to_share: boolean;
};

export async function fetchFeaturedStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "featured")
    .eq("permission_to_share", true)
    .eq("is_pinned", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Story[];
}

export async function fetchPinnedStory(): Promise<Story | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_pinned", true)
    .eq("status", "featured")
    .eq("permission_to_share", true)
    .maybeSingle();
  if (error) throw error;
  return data as Story | null;
}

export async function submitStory(
  payload: StoryInsert,
  photoFile?: File
): Promise<void> {
  let photo_url: string | null = null;

  if (photoFile) {
    const ext = photoFile.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("story-photos")
      .upload(path, photoFile, { cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage
      .from("story-photos")
      .getPublicUrl(path);
    photo_url = urlData.publicUrl;
  }

  const { error } = await supabase
    .from("stories")
    .insert({ ...payload, photo_url });
  if (error) throw error;
}

export async function adminFetchStories(
  filter: "all" | "unread" | "featured" | "archived" = "all"
): Promise<Story[]> {
  let query = supabase
    .from("stories")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("status", filter);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Story[];
}

export async function adminUpdateStory(
  id: string,
  patch: Partial<Pick<Story, "status" | "is_pinned" | "reply">>
): Promise<void> {
  const { error } = await supabase
    .from("stories")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return false;
  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  return !!data;
}
