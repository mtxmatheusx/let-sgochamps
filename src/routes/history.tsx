import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/Layout";
import { fetchActivities } from "@/lib/activities";

export const Route = createFileRoute("/history")({ component: History });

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
      <div className="overflow-hidden rounded-3xl bg-card shadow-sm">
        {activities.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No activities logged yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["Date", "Movement", "Time", "Effort", "Feeling", "Champion Note"].map(
                    (h) => (
                      <th key={h} className="px-5 py-3 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/50">
                    <td className="px-5 py-4">{a.date}</td>
                    <td className="px-5 py-4 font-semibold text-navy">{a.type}</td>
                    <td className="px-5 py-4">{a.duration} min</td>
                    <td className="px-5 py-4">{a.intensity}</td>
                    <td className="px-5 py-4">{a.mood}</td>
                    <td className="px-5 py-4 text-muted-foreground">{a.notes ?? "—"}</td>
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
