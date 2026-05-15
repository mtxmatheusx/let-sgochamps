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

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw error;
}

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

  // current streak: consecutive days up to today (or yesterday)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  if (!days.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(toISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // best streak: longest consecutive run ever
  const sortedDays = Array.from(days).sort();
  let best = 0, run = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = new Date(sortedDays[i - 1] + "T00:00:00");
      const curr = new Date(sortedDays[i] + "T00:00:00");
      run = Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    }
    best = Math.max(best, run);
  }
  const bestStreak = Math.max(best, streak);

  return { totalMinutes, daysShowedUp, streak, bestStreak };
}

export function minutesByDay(activities: Activity[]): { day: string; minutes: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const day = i === 6 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
    const minutes = activities.filter((a) => a.date === iso).reduce((s, a) => s + a.duration, 0);
    return { day, minutes };
  });
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function minutesByType(activities: Activity[]) {
  const map = new Map<string, number>();
  for (const a of activities) map.set(a.type, (map.get(a.type) ?? 0) + a.duration);
  return Array.from(map.entries()).map(([type, minutes]) => ({ type, minutes }));
}
