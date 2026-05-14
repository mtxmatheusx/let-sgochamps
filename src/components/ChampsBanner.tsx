import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCountUp } from "@/hooks/useCountUp";

type DayCount = { date: string; champs: number };

export function ChampsBanner() {
  const [todayCount, setTodayCount] = useState(0);
  const [week, setWeek] = useState<DayCount[]>([]);
  const fetchedRef = useRef(false);

  async function load() {
    const { data, error } = await supabase.rpc("get_community_stats");
    if (error || !data) return;
    const parsed = data as { today: number; last7days: DayCount[] };
    setTodayCount(parsed.today ?? 0);
    setWeek(parsed.last7days ?? []);
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    load();

    // Realtime: refresh banner whenever any activity is inserted
    const channel = supabase
      .channel("community-champs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => load(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const animated = useCountUp(todayCount);
  const maxChamps = Math.max(...week.map((d) => d.champs), 1);
  const today = new Date().toISOString().slice(0, 10);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section
      className="mt-10 flex flex-col gap-6 rounded-[20px] px-8 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-12"
      style={{ background: "var(--navy)" }}
    >
      {/* Left — today count */}
      <div className="min-w-0">
        <p className="eyebrow text-gold">Champs Active Today</p>
        <p
          className="mt-1 font-display leading-none text-white"
          style={{ fontSize: "clamp(48px, 8vw, 72px)" }}
        >
          {animated}
        </p>
        <p className="mt-2 text-[15px] leading-snug text-[#d4cfc7]">
          champions showed up today.{" "}
          <span className="font-semibold text-white">Are you one of them?</span>
        </p>
      </div>

      {/* Right — 7-day mini chart */}
      <div className="flex-shrink-0">
        <p
          className="mb-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Last 7 Days
        </p>
        <div className="flex items-end gap-2">
          {week.map((d) => {
            const isToday = d.date === today;
            const heightPct = (d.champs / maxChamps) * 100;
            const barH = Math.max(heightPct * 0.48, d.champs > 0 ? 6 : 3);
            const dayName = days[new Date(d.date + "T12:00:00").getDay()];
            return (
              <div key={d.date} className="flex flex-col items-center gap-1">
                {/* dot on top for today */}
                <div className="h-2 flex items-end justify-center">
                  {isToday && (
                    <span className="block h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                {/* bar */}
                <div
                  className="w-3 rounded-sm transition-all duration-500"
                  style={{
                    height: `${barH}px`,
                    background: isToday ? "#e8b84b" : "#b8962e",
                    opacity: d.champs === 0 ? 0.25 : 1,
                  }}
                />
                {/* day label */}
                <span
                  className="text-[9px] font-medium"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
