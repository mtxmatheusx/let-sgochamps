import { supabase } from "@/integrations/supabase/client";

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

/** Pull the group's feed — newest check-ins first, with photos + comments + author. */
export async function fetchGroupFeed(groupId: string, limit = 40): Promise<FeedItem[]> {
  // 1. Pull the activity ids posted to this group
  const { data: links, error: linksErr } = await supabase
    .from("activity_groups")
    .select("activity_id")
    .eq("group_id", groupId);
  if (linksErr) throw linksErr;
  const activityIds = (links ?? []).map((l) => l.activity_id);
  if (activityIds.length === 0) return [];

  // 2. Pull activities
  const { data: activities, error: actErr } = await supabase
    .from("activities")
    .select("*")
    .in("id", activityIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (actErr) throw actErr;
  if (!activities || activities.length === 0) return [];

  const userIds = Array.from(new Set(activities.map((a) => a.user_id)));
  const ids = activities.map((a) => a.id);

  // 3. Pull authors, photos, comments in parallel
  const [profilesRes, photosRes, commentsRes] = await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url").in("id", userIds),
    supabase.from("check_in_photos").select("*").in("activity_id", ids).order("position"),
    supabase.from("comments").select("*").in("activity_id", ids).order("created_at"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (photosRes.error) throw photosRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const profilesById = new Map<string, FeedAuthor>(
    (profilesRes.data ?? []).map((p) => [p.id, p as FeedAuthor]),
  );

  // For comment authors that aren't in profilesById, pull those too
  const commentAuthorIds = Array.from(
    new Set((commentsRes.data ?? []).map((c) => c.user_id).filter((uid) => !profilesById.has(uid))),
  );
  if (commentAuthorIds.length) {
    const { data: extra } = await supabase
      .from("profiles")
      .select("id,display_name,avatar_url")
      .in("id", commentAuthorIds);
    (extra ?? []).forEach((p) => profilesById.set(p.id, p as FeedAuthor));
  }

  const photosByActivity = new Map<string, FeedPhoto[]>();
  for (const p of photosRes.data ?? []) {
    const arr = photosByActivity.get(p.activity_id) ?? [];
    arr.push(p as FeedPhoto);
    photosByActivity.set(p.activity_id, arr);
  }

  const commentsByActivity = new Map<string, FeedComment[]>();
  for (const c of commentsRes.data ?? []) {
    const arr = commentsByActivity.get(c.activity_id) ?? [];
    arr.push({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user_id: c.user_id,
      author: profilesById.get(c.user_id) ?? { id: c.user_id, display_name: null, avatar_url: null },
    });
    commentsByActivity.set(c.activity_id, arr);
  }

  return activities.map((a) => ({
    id: a.id,
    user_id: a.user_id,
    type: a.type,
    duration: a.duration,
    intensity: a.intensity,
    mood: a.mood,
    date: a.date,
    notes: a.notes,
    created_at: a.created_at,
    author: profilesById.get(a.user_id) ?? { id: a.user_id, display_name: null, avatar_url: null },
    photos: photosByActivity.get(a.id) ?? [],
    comments: commentsByActivity.get(a.id) ?? [],
  }));
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
