import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/Layout";
import { fetchActivities } from "@/lib/activities";

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
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });

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
                  {["Date", "Movement", "Time", "Effort", "Feeling", "Champion Note"].map((h) => (
                    <th
                      key={h}
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
                    className="cursor-pointer transition-colors hover:bg-cream"
                    style={{ background: i % 2 === 1 ? "var(--cream-deep)" : "#fff" }}
                  >
                    <td className="px-6 py-5 text-[15px] text-navy">{a.date}</td>
                    <td className="px-6 py-5 text-[15px] font-bold text-navy">{a.type}</td>
                    <td className="px-6 py-5 text-[15px] text-navy">{a.duration} min</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${intensityClass(a.intensity)}`}
                      >
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
