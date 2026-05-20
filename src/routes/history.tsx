import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import { fetchActivities, deleteActivity, type Activity } from "@/lib/activities";

export const Route = createFileRoute("/history")({ component: History });

const ease = [0.22, 1, 0.36, 1] as const;
const iosSpring = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.9 };
const iosSoftSpring = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };

const moodEmoji: Record<string, string> = {
  Energized: "⚡",
  Calm: "🌿",
  Motivated: "🔥",
  "Tired but proud": "💪",
};

function intensityTint(level: string) {
  if (level === "Low") return { bg: "rgba(48,164,108,0.12)", color: "#1f7a4d" };
  if (level === "High") return { bg: "rgba(34,197,94,0.12)", color: "#22c55e" };
  return { bg: "rgba(184,150,46,0.16)", color: "#86691f" };
}

function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function History() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      if (!map.has(a.date)) map.set(a.date, []);
      map.get(a.date)!.push(a);
    }
    return Array.from(map.entries());
  }, [activities]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteActivity(id);
      await qc.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activity removed.");
    } catch {
      toast.error("Could not delete. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Your receipts"
        title="Your progress"
        subtitle="Every entry is proof that you showed up. Keep stacking the days."
      />

      {activities.length === 0 ? (
        <div className="glass rounded-[28px] py-20 text-center">
          <p className="italic text-sage">You have not logged anything yet. Start today.</p>
        </div>
      ) : (
        <div className="relative space-y-8">
          <div className="orb" style={{ width: 400, height: 400, top: -60, right: -100, background: "#22c55e", opacity: 0.15 }} />

          {grouped.map(([date, items], gi) => (
            <motion.section
              key={date}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...iosSoftSpring, delay: gi * 0.05 }}
            >
              <div className="sticky top-[52px] z-10 -mx-2 mb-2 px-2 py-2 backdrop-blur-md">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[15px] font-semibold text-navy">{prettyDate(date)}</h2>
                  <span className="text-[12px] text-sage">
                    {items.length} {items.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
              </div>

              <ul className="glass overflow-hidden rounded-[24px]">
                {items.map((a, i) => {
                  const tint = intensityTint(a.intensity);
                  return (
                    <li
                      key={a.id}
                      className={`group flex items-center gap-4 px-5 py-4 ${
                        i > 0 ? "border-t border-black/5" : ""
                      }`}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[18px]"
                        style={{ background: tint.bg }}
                        aria-hidden
                      >
                        {moodEmoji[a.mood] ?? "•"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[15px] font-semibold text-navy">{a.type}</p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: tint.bg, color: tint.color }}
                          >
                            {a.intensity}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-sage">
                          {a.duration} min · {a.mood}
                          {a.notes ? ` · ${a.notes}` : ""}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                        aria-label="Delete activity"
                        className="rounded-full p-2 text-sage opacity-0 transition-opacity hover:bg-black/5 hover:text-destructive group-hover:opacity-100 disabled:opacity-40"
                      >
                        {deletingId === a.id ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          ))}
        </div>
      )}
    </Layout>
  );
}
