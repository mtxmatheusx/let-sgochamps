import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Layout } from "@/components/Layout";
import { computeStats, fetchActivities, minutesByType } from "@/lib/activities";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });
  const stats = computeStats(activities);
  const chartData = minutesByType(activities);
  const recent = activities.slice(0, 5);

  return (
    <Layout>
      {/* Hero */}
      <section
        className="overflow-hidden rounded-[30px] p-10 text-cream sm:p-14"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.215 0.045 250) 0%, oklch(0.32 0.08 160) 100%)",
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          Today's the day
        </p>
        <h1 className="max-w-2xl text-5xl font-bold leading-tight sm:text-6xl">
          Let's Go Champs.
        </h1>
        <p className="mt-4 max-w-xl text-cream/80">
          Consistency over intensity. Show up today, stack the days, and become the person who moves.
        </p>
        <Link
          to="/addactivity"
          className="mt-8 inline-flex rounded-full bg-gold px-7 py-3 font-semibold text-navy transition hover:brightness-95"
        >
          Log Today's Movement
        </Link>
      </section>

      {/* Stats grid */}
      <section className="mt-10 grid gap-5 sm:grid-cols-3">
        <StatCard label="Minutes Moved" value={stats.totalMinutes} accent="green" />
        <StatCard label="Days You Showed Up" value={stats.daysShowedUp} accent="green" />
        <StatCard label="Current Streak" value={`${stats.streak} 🔥`} accent="gold" />
      </section>

      {/* Identity box */}
      <section className="mt-10 rounded-3xl bg-navy p-10 text-cream">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          {stats.streak} day streak
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
          This is how consistency becomes identity.
        </h2>
      </section>

      {/* Content grid */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card title="Minutes by activity">
          {chartData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.015 95)" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid oklch(0.88 0.015 95)",
                    }}
                  />
                  <Bar dataKey="minutes" fill="oklch(0.74 0.105 85)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card title="Recent activity">
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Log your first one!
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-navy">{a.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.duration} min · {a.intensity} · {a.mood}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.date}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: "green" | "gold";
}) {
  return (
    <div
      className="rounded-3xl bg-card p-6 shadow-sm"
      style={{ borderTop: `4px solid var(--${accent})` }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold text-navy">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      No activities logged yet.
    </p>
  );
}
