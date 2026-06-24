// @ts-nocheck
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase: any = _sb;

export type FeedPhoto = { id: string; url: string; caption: string | null; position: number };
export type FeedAuthor = { id: string; display_name: string | null; avatar_url: string | null };
export type FeedComment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: FeedAuthor;
};

export type FeedItem = {
  id: string;            // activity id
  user_id: string;
  type: string;
  duration: number;
  intensity: string;
  mood: string;
  date: string;
  notes: string | null;
  created_at: string;
  author: FeedAuthor;
  photos: FeedPhoto[];
  comments: FeedComment[];
};

/** Pull the group's feed — newest check-ins first, with photos + comments + author.
 *  Backed by the get_group_feed RPC, which enforces membership and returns every
 *  member's check-ins server-side. The old path read `activities` directly, but
 *  that table's SELECT policy is owner-only — so it silently hid other members'
 *  posts (you only ever saw your own check-ins in a group). The RPC also collapses
 *  the previous 4–5 round-trips into one. */
export async function fetchGroupFeed(groupId: string, limit = 40): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc("get_group_feed", {
    p_group_id: groupId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as FeedItem[];
}

/** Post an encouragement comment on a check-in. */
export async function postComment(activityId: string, body: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("must be authenticated");
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await supabase
    .from("comments")
    .insert({ activity_id: activityId, user_id: user.id, body: trimmed });
  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

/** Upload an in-progress photo for a check-in and attach it. */
export async function uploadCheckInPhoto(
  activityId: string,
  file: File,
  position = 0,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("must be authenticated");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${activityId}/${position}-${Date.now().toString(36)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("check-ins")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from("check-ins").getPublicUrl(path);
  const url = urlData.publicUrl;

  const { error: insertErr } = await supabase
    .from("check_in_photos")
    .insert({ activity_id: activityId, url, position });
  if (insertErr) throw insertErr;

  return url;
}

/** Attach an activity to a list of groups (cross-posting). */
export async function postActivityToGroups(activityId: string, groupIds: string[]): Promise<void> {
  if (groupIds.length === 0) return;
  const rows = groupIds.map((gid) => ({ activity_id: activityId, group_id: gid }));
  const { error } = await supabase.from("activity_groups").insert(rows);
  if (error) throw error;
}

/** Set today's pose emoji on the current user's profile. */
export async function setDailyPose(emoji: string | null): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("must be authenticated");
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("profiles")
    .update({
      daily_pose: emoji,
      daily_pose_date: emoji ? today : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw error;
}

export async function fetchMyProfile(): Promise<{
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  daily_pose: string | null;
  daily_pose_date: string | null;
} | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, daily_pose, daily_pose_date")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}