// @ts-nocheck
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase: any = _sb;

export type WeeklyStats = {
  total_minutes: number;
  active_champs: number;
  sessions_logged: number;
  week_start: string; // ISO date of the Monday that starts the current week
};

export type WeeklyMessage = {
  id: string;
  week_start: string;
  message: string;
  author_note: string | null;
};

/**
 * Aggregated movement stats for the current ISO week (Mon → Sun).
 * Backed by Supabase RPC `get_community_weekly_stats()` which is
 * SECURITY DEFINER so it can read across all users without exposing
 * individual rows.
 *
 * Returns zeros if the RPC isn't deployed yet — the UI gracefully
 * shows "this week is just getting started".
 */
export async function fetchWeeklyStats(): Promise<WeeklyStats> {
  const { data, error } = await supabase.rpc("get_community_weekly_stats");
  if (error) {
    console.warn("get_community_weekly_stats RPC not available yet:", error.message);
    return {
      total_minutes: 0,
      active_champs: 0,
      sessions_logged: 0,
      week_start: currentMondayISO(),
    };
  }
  // RPC returns a single row
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_minutes: row?.total_minutes ?? 0,
    active_champs: row?.active_champs ?? 0,
    sessions_logged: row?.sessions_logged ?? 0,
    week_start: row?.week_start ?? currentMondayISO(),
  };
}

/**
 * Active weekly message from Aidan, written into the `weekly_messages`
 * table. Returns the most recent message whose week_start is on or
 * before today.
 */
export async function fetchWeeklyMessage(): Promise<WeeklyMessage | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("weekly_messages")
    .select("*")
    .lte("week_start", today)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("weekly_messages table not available yet:", error.message);
    return null;
  }
  return (data as WeeklyMessage | null) ?? null;
}

function currentMondayISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}