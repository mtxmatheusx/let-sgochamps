// @ts-nocheck
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase: any = _sb;

export type GroupType = "club" | "challenge";
export type ScoringMode = "days_active" | "check_in_count" | "metrics_minutes";

export type Group = {
  id: string;
  slug: string;
  name: string;
  type: GroupType;
  description: string | null;
  cover_url: string | null;
  owner_id: string;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
  scoring_mode: ScoringMode;
  created_at: string;
};

export type MyGroup = {
  id: string;
  slug: string;
  name: string;
  type: GroupType;
  cover_url: string | null;
  start_date: string | null;
  end_date: string | null;
  role: "owner" | "admin" | "member";
  members: number;
};

export type GroupStats = {
  total_minutes: number;
  active_members: number;
  sessions_logged: number;
  total_members: number;
};

export type RollCallEntry = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  daily_pose: string | null;
  last_check_in: string | null;
  check_ins: number;
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `group-${Date.now().toString(36)}`;

/** Pull all groups the current user belongs to. */
export async function fetchMyGroups(): Promise<MyGroup[]> {
  const { data, error } = await supabase.rpc("get_my_groups");
  if (error) throw error;
  return (data ?? []) as MyGroup[];
}

/** Fetch a single group by slug. */
export async function fetchGroupBySlug(slug: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Group | null) ?? null;
}

/** Aggregated stats for a group's active window. */
export async function fetchGroupStats(groupId: string): Promise<GroupStats> {
  const { data, error } = await supabase.rpc("get_group_stats", { p_group_id: groupId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_minutes: row?.total_minutes ?? 0,
    active_members: row?.active_members ?? 0,
    sessions_logged: row?.sessions_logged ?? 0,
    total_members: row?.total_members ?? 0,
  };
}

/** Roll-call list (sorted by most recent check-in). No ranking. */
export async function fetchGroupRollCall(groupId: string): Promise<RollCallEntry[]> {
  const { data, error } = await supabase.rpc("get_group_roll_call", { p_group_id: groupId });
  if (error) throw error;
  return (data ?? []) as RollCallEntry[];
}

/** Create a club or challenge. The creator becomes owner + member. */
export async function createGroup(input: {
  name: string;
  type: GroupType;
  description?: string;
  is_public?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  scoring_mode?: ScoringMode;
}): Promise<{ id: string; slug: string }> {
  const { data, error } = await supabase.rpc("create_group", {
    p_name: input.name,
    p_type: input.type,
    p_description: input.description ?? null,
    p_is_public: input.is_public ?? false,
    p_start_date: input.type === "challenge" ? input.start_date ?? null : null,
    p_end_date: input.type === "challenge" ? input.end_date ?? null : null,
    p_scoring_mode: input.scoring_mode ?? "days_active",
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row.id, slug: row.slug };
}

/** Join a group via shareable invite code. */
export async function joinByCode(code: string): Promise<{ group_id: string; slug: string }> {
  const { data, error } = await supabase.rpc("join_group_by_code", { p_code: code.trim() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { group_id: row.group_id, slug: row.slug };
}

/** Generate a new invite code for the group (owners/admins only). */
export async function createInvite(groupId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("must be authenticated");
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const { error } = await supabase
    .from("group_invites")
    .insert({ group_id: groupId, code, created_by: user.id });
  if (error) throw error;
  return code;
}

export async function leaveGroup(groupId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("must be authenticated");
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);
  if (error) throw error;
}