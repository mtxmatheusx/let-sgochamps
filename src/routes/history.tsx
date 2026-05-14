import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import { fetchActivities, deleteActivity } from "@/lib/activities";

export const Route = createFileRoute("/history")({ component: History });

const moodEmoji: Record<string, string> = {
  Energized: "⚡",
  Calm: "🌿",
  Motivated: "🔥",
  "Tired but proud": "💪",
};

function intensityClass(level: string) {
  if (level === "Low") return "bg-sage/15 text-sage";
  if (level === "High") return "bg-green/15 text-green";
  return "bg-navy/10 text-navy";
}

function History() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });

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
        title="Your Progress"
        subtitle="Every entry is proof that you showed up. Keep stacking the days."
      />

      <div className="overflow-hidden rounded-[20px] bg-card card-shadow">
        {activities.length === 0 ? (
          <p className="py-16 text-center italic text-sage">
            You have not logged anything yet. Start today.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-navy">
                  {["Date", "Movement", "Time", "Effort", "Feeling", "Champion Note", ""].map((h, idx) => (
                    <th
                      key={idx}
                      className="px-6 py-4 text-[11px] font-bold uppercase text-sage"
                      style={{ letterSpacing: "2px" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((a, i) => (
                  <tr
                    key={a.id}
                    className="group transition-colors hover:bg-cream"
                    style={{ background: i % 2 === 1 ? "var(--cream-deep)" : "#fff" }}
                  >
                    <td className="px-6 py-5 text-[15px] text-navy">{a.date}</td>
                    <td className="px-6 py-5 text-[15px] font-bold text-navy">{a.type}</td>
                    <td className="px-6 py-5 text-[15px] text-navy">{a.duration} min</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${intensityClass(a.intensity)}`}>
                        {a.intensity}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[15px] text-navy">
                      <span className="mr-1.5">{moodEmoji[a.mood] ?? ""}</span>
                      {a.mood}
                    </td>
                    <td className="max-w-[280px] px-6 py-5 text-[14px] text-sage">
                      {a.notes ?? "—"}
                    </td>
                    <td className="px-4 py-5">
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                        aria-label="Delete activity"
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-2 text-sage hover:text-red-500 hover:bg-red-50 disabled:opacity-40"
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
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
