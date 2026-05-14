import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Activity = Tables<"activities">;

export const ACTIVITY_TYPES = [
  "Walking",
  "Running",
  "Yoga",
  "Stretching",
  "Cycling",
  "Strength Training",
] as const;

export const INTENSITIES = [
  { value: "Low", label: "Low — I moved with ease" },
  { value: "Moderate", label: "Moderate — I challenged myself" },
  { value: "High", label: "High — I pushed today" },
] as const;

export const MOODS = ["Energized", "Calm", "Motivated", "Tired but proud"] as const;

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function computeStats(activities: Activity[]) {
  const totalMinutes = activities.reduce((s, a) => s + a.duration, 0);
  const days = new Set(activities.map((a) => a.date));
  const daysShowedUp = days.size;

  // streak: consecutive days up to today (or yesterday)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  // allow streak to start from today or yesterday
  if (!days.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(toISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { totalMinutes, daysShowedUp, streak };
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function minutesByType(activities: Activity[]) {
  const map = new Map<string, number>();
  for (const a of activities) map.set(a.type, (map.get(a.type) ?? 0) + a.duration);
  return Array.from(map.entries()).map(([type, minutes]) => ({ type, minutes }));
}
