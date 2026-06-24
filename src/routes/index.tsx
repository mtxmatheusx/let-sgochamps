import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
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
import { ActivityRing } from "@/components/ActivityRing";
import { computeStats, fetchActivities, minutesByType, minutesByDay } from "@/lib/activities";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    links: [{ rel: "preload", as: "image", href: "/hero.jpg", fetchpriority: "high" } as any],
  }),
});

const HERO_IMG = "/hero.jpg";
const ease = [0.22, 1, 0.36, 1] as const;

function friendlyDate(iso: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AIDAN_QUOTES = [
  "You don't need to be the fastest. You just need to show up. Every single day.",
  "The version of you that keeps going — that's the one people remember.",
  "Motivation gets you started. Showing up becomes who you are.",
  "One session doesn't change your body. A thousand sessions change your life.",
  "Don't wait to feel ready. Readiness is built by doing, not waiting.",
  "The days you don't feel like it are the days it counts the most.",
  "Progress isn't always visible. But it's always happening when you show up.",
  "You are not starting over. You are starting from everything you already learned.",
  "Consistency is boring to talk about and extraordinary to live.",
  "Your future self is watching. Make them proud today.",
  "Movement isn't punishment. It's a privilege. Use it.",
  "The hardest rep is always the first one. After that, you're already winning.",
  "Small wins stacked every day will beat one big effort every time.",
  "You don't have to crush it. You just have to do it.",
  "Champions aren't made on the days it's easy. They're made on the days like today.",
  "Stop comparing your chapter one to someone else's chapter ten.",
  "Every time you show up, you prove something to yourself. That proof adds up.",
  "The goal isn't perfection. The goal is to never stop moving.",
  "Rest when you need to. Quit never.",
  "You built this streak one decision at a time. Keep deciding.",
  "Discipline is just choosing what you want most over what you want now.",
  "There is no such thing as a wasted workout. Only missed ones.",
  "When it feels too hard, remember why you started. Then take the next step anyway.",
  "The body follows the mind. The mind follows the habit. Build the habit.",
  "You showed up yesterday. That matters. You're showing up today. That matters more.",
  "Movement heals. Consistency transforms. Showing up is the whole game.",
  "You are not behind. You are exactly where your next step matters.",
  "Be the person your community needs to see today.",
  "No one ever regretted a workout. Not once.",
  "This is your time. This is your streak. This is your story.",
  "Hard days build the foundation. Easy days show the progress. Both matter.",
  "The goal is not the finish line. The goal is the daily decision to run.",
  "Some days you sprint. Some days you walk. Both count. Keep moving.",
  "Your effort today is someone else's inspiration tomorrow.",
  "It's not about talent. It's about turning up. Let's go.",
  "The gap between who you are and who you want to be is closed one session at a time.",
  "Forget the scale. Focus on the habit. The rest follows.",
  "You are stronger than the excuse. Prove it.",
  "Movement is medicine. Consistency is the dose.",
  "Every champion was once a beginner who refused to quit.",
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return AIDAN_QUOTES[dayOfYear % AIDAN_QUOTES.length];
}

// iOS 26 spring physics — snappier, more natural
const iosSpring = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.9 };
const iosSoftSpring = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };
const iosTapSpring = { type: "spring" as const, stiffness: 500, damping: 30 };
const iosHoverSpring = { type: "spring" as const, stiffness: 360, damping: 26 };

const fadeUp = {
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: iosSoftSpring,
};

function Dashboard() {
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
    placeholderData: (previous) => previous ?? [],
  });
  const stats = computeStats(activities);
  const recent = activities.slice(0, 10);
  const [chartView, setChartView] = useState<"weekly" | "byType">("weekly");
  const chartData = chartView === "weekly" ? minutesByDay(activities) : minutesByType(activities);

  const heroRef = useRef<HTMLElement>(null);
  // Use document scroll (hero is at top of page). Avoids the framer-motion
  // "Target ref is defined but not hydrated" crash that target-ref useScroll
  // can throw during SSR/hydration when the ref isn't attached yet.
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, 180]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.2]);
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 1.12]);

  return (
    <Layout>
      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative -mx-6 -mt-12 overflow-hidden sm:-mx-8 sm:-mt-16 lg:rounded-b-[32px]"
        style={{ height: "min(92vh, 860px)", minHeight: 440 }}
      >
        {/* Parallax image */}
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Aidan running with the community"
            className="h-full w-full object-cover"
            style={{ objectPosition: "55% center" }}
            fetchPriority="high"
            decoding="async"
          />
        </motion.div>

        {/* Mobile: bottom fade */}
        <div
          className="lg:hidden absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.5) 38%, rgba(10,10,10,0.08) 70%)" }}
        />
        <div
          className="lg:hidden absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,0.65) 0%, rgba(10,10,10,0.3) 40%, rgba(10,10,10,0) 65%)" }}
        />

        {/* Desktop: left-to-transparent */}
        <div
          className="hidden lg:block absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(10,10,10,1) 0%, rgba(10,10,10,1) 28%, rgba(10,10,10,0.92) 38%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.15) 62%, rgba(10,10,10,0) 72%)",
          }}
        />

        {/* Green glow */}
        <div
          className="absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ background: "#22c55e" }}
        />

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 h-full flex flex-col justify-end pb-10 px-6 sm:pb-16 sm:px-10 lg:justify-center lg:pb-0 lg:pl-20 lg:pr-4 lg:max-w-[52%]"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSpring, delay: 0.05 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
            <span className="eyebrow text-white/90" style={{ letterSpacing: "0.16em", fontSize: 10 }}>
              Movement · Mindset · Consistency
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSoftSpring, delay: 0.1 }}
            className="sf-display text-white"
            style={{ fontSize: "clamp(44px, 7vw, 110px)", lineHeight: 0.92 }}
          >
            Let's go,<br />
            <span style={{ color: "#22c55e" }}>champs.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSoftSpring, delay: 0.18 }}
            className="mt-4 max-w-[340px] text-[15px] leading-[1.5] text-white/70 sm:mt-6 sm:text-[18px]"
          >
            Show up. Stack the days.<br className="hidden sm:block" />
            Become the person who keeps going.
          </motion.p>

          {/* Desktop stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSoftSpring, delay: 0.24 }}
            className="hidden lg:flex mt-8 items-center gap-6"
          >
            <StatPill label="Current streak" value={stats.streak} suffix="days" />
            <div className="h-8 w-px bg-white/15" />
            <StatPill label="Total minutes" value={stats.totalMinutes} suffix="min" />
            <div className="h-8 w-px bg-white/15" />
            <StatPill label="Active days" value={stats.daysShowedUp} />
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...iosSpring, delay: 0.3 }}
            className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={iosHoverSpring}
            >
              <Link
                to="/log"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-green px-7 py-3 text-[15px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(22,163,74,0.65)] hover:brightness-110 sm:py-3.5"
              >
                Log today's movement
                <motion.span
                  initial={false}
                  whileHover={{ x: 4 }}
                  transition={iosHoverSpring}
                >›</motion.span>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={iosHoverSpring}
            >
              <Link
                to="/history"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-[15px] font-medium text-white backdrop-blur-sm hover:bg-white/20 sm:py-3.5"
              >
                See your history ›
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── BENTO GRID ── */}
      <section className="relative mt-10 overflow-hidden">
        <div className="orb" style={{ width: 420, height: 420, top: -80, left: -120, background: "#22c55e", opacity: 0.05 }} />
        <div className="orb" style={{ width: 360, height: 360, bottom: -40, right: -60, background: "#22c55e", opacity: 0.04 }} />

        {/* 2-col mobile, 4-col desktop */}
        <div className="relative grid grid-cols-2 gap-3 md:auto-rows-[230px] md:grid-cols-4 md:gap-5">

          {/* Streak — full width mobile, 2×2 desktop */}
          <BentoCard className="col-span-2 md:row-span-2 items-center justify-center text-center" delay={0}>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
              <p className="eyebrow text-green">Current streak</p>
            </div>

            {/* Mobile ring */}
            <div className="mt-4 md:hidden">
              <ActivityRing value={stats.streak} max={Math.max(7, stats.streak)} size={168} stroke={14}>
                <div>
                  <p className="sf-display text-navy leading-none nums" style={{ fontSize: 64 }}>
                    {stats.streak}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    {stats.streak === 1 ? "day" : "days"} in a row
                  </p>
                </div>
              </ActivityRing>
            </div>

            {/* Desktop ring — much larger to fill the 2×2 bento */}
            <div className="mt-6 hidden md:block">
              <ActivityRing value={stats.streak} max={Math.max(7, stats.streak)} size={260} stroke={20}>
                <div>
                  <p className="sf-display text-navy leading-none nums" style={{ fontSize: 112 }}>
                    {stats.streak}
                  </p>
                  <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {stats.streak === 1 ? "day" : "days"} in a row
                  </p>
                </div>
              </ActivityRing>
            </div>

            {stats.bestStreak > stats.streak && (
              <span className="pill mt-4 md:mt-5">
                Best · <span className="nums font-bold text-navy">{stats.bestStreak}</span>&nbsp;days
              </span>
            )}
            <p className="mt-3 md:mt-4 max-w-[260px] text-[13px] leading-[1.45] text-ink-soft">
              Identity is built one rep at a time.
            </p>
          </BentoCard>

          {/* Total minutes — full width mobile, right-top desktop */}
          <BentoCard className="col-span-2 md:col-span-2" delay={0.05}>
            <p className="eyebrow">Total minutes moved</p>
            <BigNumber value={stats.totalMinutes} suffix="min" />
            <p className="mt-1 text-[12px] text-ink-muted">
              {stats.daysShowedUp > 0 ? `~${Math.round(stats.totalMinutes / stats.daysShowedUp)} min per session` : "Start logging to track your average"}
            </p>
          </BentoCard>

          {/* Days — half-width mobile, 1-col desktop */}
          <BentoCard className="col-span-1 md:col-span-1" delay={0.1}>
            <p className="eyebrow">Active days</p>
            <BigNumber value={stats.daysShowedUp} small />
            <p className="mt-1 text-[11px] text-ink-muted">
              {stats.daysShowedUp === 1 ? "one day in" : `${stats.daysShowedUp} days in`}
            </p>
          </BentoCard>

          {/* Log CTA — half-width mobile, 1-col desktop */}
          <BentoCard className="col-span-1 md:col-span-1 cursor-pointer" delay={0.15} tone="blue" href="/log">
            <p className="eyebrow text-white/70">Today</p>
            <div className="mt-auto flex items-end justify-between gap-2">
              <p className="sf-display text-[22px] text-white md:text-[26px]">
                Log<br />today's win
              </p>
              <span className="text-white text-[22px] -mb-0.5">›</span>
            </div>
          </BentoCard>

        </div>
      </section>

      {/* ── DAILY QUOTE ── */}
      <DailyQuote />

      {/* ── CHART + RECENT WINS ── */}
      <section className="mt-4 grid gap-4 lg:grid-cols-5 lg:items-start overflow-hidden">
        {/* Chart */}
        <motion.div {...fadeUp} className="glass rounded-3xl p-6 md:p-8 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-sage">Energy breakdown</p>
              <h3 className="mt-1 sf-display text-[22px] text-navy md:text-[26px]">
                {chartView === "weekly" ? "Last 7 days" : "Where your minutes went"}
              </h3>
            </div>
            {/* iOS-style segmented control with sliding pill */}
            <div className="relative flex rounded-xl bg-black/[0.05] p-1 gap-1">
              {(["weekly", "byType"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`relative rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-200 ${
                    chartView === v ? "text-navy" : "text-sage hover:text-navy"
                  }`}
                >
                  {chartView === v && (
                    <motion.span
                      layoutId="seg-pill"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
                    />
                  )}
                  <span className="relative z-10">{v === "weekly" ? "Weekly" : "By type"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 h-[240px] md:h-[280px]">
            <motion.div
              key={chartView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
            {chartData.length === 0 || (chartView === "weekly" && chartData.every((d) => d.minutes === 0)) ? (
              <Empty text="Log your first movement to see the breakdown." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
                  maxBarSize={48}
                >
                  <defs>
                    <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis
                    dataKey={chartView === "weekly" ? "day" : "type"}
                    tick={{ fontSize: 11, fill: "#737373", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#737373" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(34,197,94,0.06)" }}
                    contentStyle={{
                      background: "rgba(28,28,30,0.9)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 12,
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                    formatter={(v: number) => [`${v} min`, "Minutes"]}
                  />
                  <Bar dataKey="minutes" radius={[8, 8, 3, 3]} fill="url(#bar-grad)" />
                </BarChart>
              </ResponsiveContainer>
            )}
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Wins */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="glass rounded-3xl p-6 md:p-8 lg:col-span-2"
        >
          <p className="eyebrow text-sage">Recent wins</p>
          <h3 className="mt-1 sf-display text-[22px] text-navy md:text-[26px]">Proof you showed up.</h3>

          {recent.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center py-10 text-center">
              <p className="text-[28px]">🏃</p>
              <p className="mt-3 text-[14px] font-semibold text-navy">Nothing yet.</p>
              <p className="mt-1 text-[12px] text-sage">Your first move starts the story.</p>
              <Link
                to="/log"
                className="mt-4 inline-flex rounded-full bg-green px-5 py-2 text-[13px] font-semibold text-white transition-all hover:brightness-110"
              >
                Log now ›
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile list */}
              <ul className="mt-4 divide-y divide-black/5 lg:hidden">
                {recent.slice(0, 5).map((a, i) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, ease, delay: i * 0.05 }}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-navy truncate">{a.type}</p>
                      <p className="mt-0.5 text-[11px] text-sage">
                        {a.duration} min · {a.intensity}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-sage">{friendlyDate(a.date)}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden lg:block mt-4">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-black/5 pb-2 mb-1">
                  {["Activity", "Min", "Level", "When"].map((h) => (
                    <span key={h} className="text-[10px] font-bold uppercase tracking-[0.12em] text-sage/60">{h}</span>
                  ))}
                </div>
                {recent.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, ease, delay: i * 0.04 }}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center border-b border-black/[0.04] py-2 last:border-0 hover:bg-black/[0.02] rounded-lg px-1 -mx-1 transition-colors"
                  >
                    <p className="text-[13px] font-semibold text-navy truncate">{a.type}</p>
                    <p className="text-[12px] tabular-nums text-navy">{a.duration}</p>
                    <p className="text-[11px] text-sage">{a.intensity}</p>
                    <p className="text-[11px] text-sage text-right">{friendlyDate(a.date)}</p>
                  </motion.div>
                ))}
              </div>

              {/* Footer link */}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/5 pt-4">
                <p className="text-[12px] text-sage">
                  {recent.length} {recent.length === 1 ? "session" : "sessions"} logged
                </p>
                <Link
                  to="/history"
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-1.5 text-[12px] font-semibold text-navy transition-all hover:bg-black/[0.08]"
                >
                  See all
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </section>

      {/* ── IDENTITY BAND ── */}
      <motion.section
        {...fadeUp}
        className="relative mt-4 -mx-6 overflow-hidden rounded-3xl px-7 py-14 sm:-mx-8 sm:px-14 sm:py-24"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(34,197,94,0.35), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(22,163,74,0.25), transparent 55%), #0a0a0c",
        }}
      >
        <div className="mx-auto max-w-[1200px] lg:flex lg:items-end lg:justify-between lg:gap-16">
          <div>
            <p className="eyebrow text-white/60">
              {stats.daysShowedUp} active day{stats.daysShowedUp === 1 ? "" : "s"} · {stats.streak} in a row
            </p>
            <h2
              className="sf-display mt-4 text-white"
              style={{ fontSize: "clamp(34px, 6vw, 80px)" }}
            >
              This is how consistency
              <br />
              becomes <span style={{ color: "#22c55e" }}>identity.</span>
            </h2>
          </div>
          <div className="mt-8 flex flex-col gap-3 lg:mt-0 lg:shrink-0">
            <Link
              to="/stories/submit"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-[14px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Share your story ›
            </Link>
            <Link
              to="/stories"
              className="text-center text-[13px] text-white/40 transition-colors hover:text-white/70"
            >
              Read community stories →
            </Link>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}

// ── Sub-components ──

function StatPill({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const animated = useCountUp(value, 1100);
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">{label}</p>
      <p className="mt-0.5 text-[18px] font-bold text-white nums">
        {animated}
        {suffix && <span className="ml-1 font-medium text-white/60">{suffix}</span>}
      </p>
    </div>
  );
}

function BentoCard({
  children,
  className = "",
  delay = 0,
  tone = "glass",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  tone?: "glass" | "blue";
  href?: string;
}) {
  const toneCls =
    tone === "blue"
      ? "bg-green text-white border-transparent"
      : "glass";

  const motionProps = {
    initial: { opacity: 1, y: 0 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { ...iosSoftSpring, delay: Math.min(delay, 0.06) },
    whileHover: { y: -3, transition: iosHoverSpring },
    whileTap: { scale: 0.985, transition: iosTapSpring },
  };

  if (href) {
    return (
      <Link to={href} className={`block ${className}`}>
        <motion.div
          {...motionProps}
          className={`group flex h-full flex-col rounded-3xl p-5 md:p-7 ${toneCls}`}
          style={tone === "blue" ? { boxShadow: "0 12px 40px -12px rgba(22,163,74,0.5)" } : undefined}
        >
          {children}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      {...motionProps}
      className={`group flex h-full flex-col rounded-3xl p-5 md:p-7 ${toneCls} ${className}`}
      style={tone === "blue" ? { boxShadow: "0 12px 40px -12px rgba(22,163,74,0.5)" } : undefined}
    >
      {children}
    </motion.div>
  );
}

function BigNumber({ value, suffix, small = false }: { value: number; suffix?: string; small?: boolean }) {
  const animated = useCountUp(value, 1100);
  return (
    <div
      className="sf-display mt-auto flex items-baseline text-navy"
      style={{
        fontSize: small ? "clamp(40px, 7vw, 64px)" : "clamp(52px, 9vw, 88px)",
        gap: "0.18em",
      }}
    >
      <span className="nums">{animated}</span>
      {suffix && (
        <span
          className="font-medium text-ink-muted"
          style={{ fontSize: "0.30em", letterSpacing: "0.01em" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="italic text-sage text-[13px] text-center">{text}</p>
    </div>
  );
}

function DailyQuote() {
  const quote = getDailyQuote();
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function share() {
    const text = `"${quote}" — Aidan O'Hare, Let's Go Champs`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  return (
    <motion.div
      {...fadeUp}
      className="mt-4 relative overflow-hidden rounded-3xl"
      style={{ background: "linear-gradient(135deg, #0a0a0c 0%, #0d1a0f 50%, #0a0a0c 100%)" }}
    >
      <div
        className="pointer-events-none absolute -left-12 -top-12 h-52 w-52 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 right-6 h-40 w-40 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)" }}
      />

      <div className="relative px-6 py-8 sm:px-12 sm:py-12">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
            <p className="eyebrow text-green/80" style={{ letterSpacing: "0.16em", fontSize: 10 }}>
              Aidan's message today
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <p className="hidden sm:block text-[12px] font-medium text-white/30">{dateLabel}</p>
            <button
              onClick={share}
              title="Share this quote"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/40 transition-all hover:border-green/50 hover:text-green"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>

        <blockquote
          className="sf-display mt-5 text-white"
          style={{ fontSize: "clamp(20px, 3.5vw, 38px)", lineHeight: 1.2, maxWidth: "720px" }}
        >
          "{quote}"
        </blockquote>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Aidan O'Hare
          </p>
        </div>
      </div>
    </motion.div>
  );
}
