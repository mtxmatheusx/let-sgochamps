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
  updated_at: string;
};

export type StoryInsert = {
  name: string;
  city: string;
  story: string;
  quote?: string | null;
  activity_type?: string | null;
  social_handle?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
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

async function uploadFile(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function submitStory(
  payload: StoryInsert,
  photoFile?: File,
  videoFile?: File
): Promise<void> {
  const [photo_url, video_url] = await Promise.all([
    photoFile ? uploadFile("story-photos", photoFile) : Promise.resolve(null),
    videoFile ? uploadFile("story-videos", videoFile) : Promise.resolve(null),
  ]);

  const { error } = await supabase
    .from("stories")
    .insert({ ...payload, photo_url, video_url });
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
