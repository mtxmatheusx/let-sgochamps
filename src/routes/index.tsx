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
import { ChampsBanner } from "@/components/ChampsBanner";
import { computeStats, fetchActivities, minutesByType } from "@/lib/activities";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/")({ component: Dashboard });

const HERO_IMG =
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80";

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
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-[24px] card-shadow"
        style={{ minHeight: 480 }}
      >
        <img
          src={HERO_IMG}
          alt="Athletes training together"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(7,27,47,0.88) 0%, rgba(45,90,27,0.80) 100%)",
          }}
        />
        <div className="relative flex min-h-[480px] flex-col justify-center px-8 py-16 sm:px-14 sm:py-20">
          <div className="max-w-[55%] min-w-[280px]">
            <p className="eyebrow mb-5 text-gold">Movement. Mindset. Consistency.</p>
            <h1
              className="font-display text-white"
              style={{ fontSize: "clamp(56px, 9vw, 88px)", lineHeight: 0.95, letterSpacing: "-0.01em" }}
            >
              LET'S GO CHAMPS.
            </h1>
            <div className="mt-6 space-y-4 text-[17px] leading-[1.75] text-[#d4cfc7] sm:text-[18px]">
              <p>
                This is not about doing the most. It is about showing up, building
                momentum and becoming the kind of person who keeps going.
              </p>
              <p>Log your movement. Stack the days. Move your way.</p>
            </div>
            <Link
              to="/log"
              className="mt-9 inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-[12px] font-extrabold uppercase tracking-[0.15em] text-navy transition-all duration-200 hover:scale-[1.03] hover:brightness-110"
              style={{ letterSpacing: "1.5px" }}
            >
              Log Today's Movement
            </Link>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <StatCard label="Minutes Moved" value={stats.totalMinutes} subtext="Every minute counts." />
        <StatCard
          label="Days You Showed Up"
          value={stats.daysShowedUp}
          subtext="Progress starts with action."
        />
        <StatCard
          label="Current Streak"
          value={stats.streak}
          subtext="Stack the days."
          gold
        />
      </section>

      {/* COMMUNITY CHAMPS */}
      <ChampsBanner />

      {/* IDENTITY BANNER */}
      <section
        className="mt-10 rounded-[20px] px-8 py-9 sm:px-12"
        style={{ background: "var(--navy-dark)" }}
      >
        <p className="eyebrow text-gold">
          You have shown up {stats.daysShowedUp} day{stats.daysShowedUp === 1 ? "" : "s"} —{" "}
          {stats.streak} in a row.
        </p>
        <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-white sm:text-[32px]">
          This is how consistency becomes identity.
        </h2>
      </section>

      {/* CONTENT GRID */}
      <section className="mt-10 grid gap-6 lg:grid-cols-5">
        <div className="rounded-[20px] bg-card p-8 card-shadow lift lg:col-span-3">
          <p className="eyebrow text-sage">Your movement breakdown</p>
          <h3 className="mt-2 font-serif text-[22px] font-bold text-navy">
            Where Your Energy Is Going
          </h3>
          <div className="mt-6 h-[320px]">
            {chartData.length === 0 ? (
              <Empty text="Log your first movement to see the breakdown." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" vertical={false} />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 12, fill: "#52624c", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#52624c" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(184,150,46,0.08)" }}
                    contentStyle={{
                      background: "#071b2f",
                      border: "none",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "#b8962e", fontWeight: 700 }}
                  />
                  <Bar dataKey="minutes" fill="#b8962e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-[20px] bg-card p-8 card-shadow lift lg:col-span-2">
          <p className="eyebrow text-sage">Recent wins</p>
          <h3 className="mt-2 font-serif text-[22px] font-bold text-navy">
            Proof You Showed Up
          </h3>
          {recent.length === 0 ? (
            <p className="mt-8 italic text-sage">
              You have not logged anything yet. Start today. Let's go.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-mist">
              {recent.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-4">
                  <div>
                    <p className="text-[15px] font-bold text-navy">{a.type}</p>
                    <p className="mt-0.5 text-[13px] text-sage">
                      {a.duration} min · {a.intensity} · {a.mood}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[12px] text-sage">{a.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  subtext,
  gold = false,
}: {
  label: string;
  value: number;
  subtext: string;
  gold?: boolean;
}) {
  const animated = useCountUp(value);
  return (
    <div
      className="rounded-[20px] bg-card p-8 card-shadow lift"
      style={{ borderTop: `6px solid ${gold ? "#b8962e" : "#2d5a1b"}` }}
    >
      <p className="eyebrow text-sage">{label}</p>
      <p
        className="mt-3 font-serif text-[3rem] font-bold leading-none"
        style={{ color: gold ? "#b8962e" : "#2d5a1b" }}
      >
        {animated}
      </p>
      <p className="mt-3 text-sm text-sage">{subtext}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="italic text-sage">{text}</p>
    </div>
  );
}
