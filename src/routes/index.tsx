import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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
import { computeStats, fetchActivities, minutesByType } from "@/lib/activities";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/")({ component: Dashboard });

const HERO_IMG = "/hero.png";

const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease },
};

function Dashboard() {
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });
  const stats = computeStats(activities);
  const chartData = minutesByType(activities);
  const recent = activities.slice(0, 5);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <Layout>
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative -mx-6 -mt-12 overflow-hidden sm:-mx-8 sm:-mt-16"
        style={{ height: "min(86vh, 780px)" }}
      >
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Aidan running with the community"
            className="h-full w-full object-cover"
            style={{ objectPosition: "62% center" }}
          />
          {/* Left-to-right gradient: text area is clean white, image bleeds to the right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.92) 30%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 75%)",
            }}
          />
          {/* Subtle bottom fade for continuity with page body */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(255,255,255,0.6) 0%, transparent 20%)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-center px-6 sm:px-8"
        >
          {/* Green pill eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-green/10 px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            <span className="eyebrow text-green" style={{ letterSpacing: "0.18em" }}>
              Movement · Mindset · Consistency
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.2 }}
            className="sf-display text-navy"
            style={{ fontSize: "clamp(56px, 9vw, 140px)", maxWidth: "580px" }}
          >
            Let's go,<br />
            <span className="text-green">champs.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.45 }}
            className="mt-5 max-w-[420px] text-[17px] leading-[1.55] text-navy/60 sm:text-[19px]"
          >
            Show up. Stack the days.<br />
            Become the person who keeps going.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.65 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/log"
              className="group inline-flex items-center gap-2 rounded-full bg-green px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,197,94,0.6)] transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
            >
              Log today's movement
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">›</span>
            </Link>
            <Link
              to="/history"
              className="rounded-full px-5 py-3.5 text-[15px] font-medium text-navy/60 transition-colors hover:text-navy"
            >
              See your history ›
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* BENTO GRID */}
      <section className="relative mt-10">
        <div className="orb" style={{ width: 480, height: 480, top: -80, left: -120, background: "#22c55e", opacity: 0.12 }} />
        <div className="orb" style={{ width: 420, height: 420, bottom: -60, right: -80, background: "#22c55e", opacity: 0.12 }} />

        <div className="relative grid auto-rows-[200px] grid-cols-1 gap-5 md:grid-cols-4">
          {/* Streak — Activity Ring */}
          <BentoCard className="md:col-span-2 md:row-span-2 items-center justify-center text-center" delay={0}>
            <p className="eyebrow text-green">Current streak</p>
            <div className="mt-4">
              <ActivityRing value={stats.streak} max={Math.max(7, stats.streak)} size={240} stroke={20}>
                <div>
                  <p className="sf-display text-[80px] text-navy">{stats.streak}</p>
                  <p className="-mt-1 text-[13px] font-medium text-sage">
                    {stats.streak === 1 ? "day" : "days"} in a row
                  </p>
                </div>
              </ActivityRing>
            </div>
            <p className="mt-3 max-w-[260px] text-[13px] text-sage">
              Identity is built one rep at a time.
            </p>
          </BentoCard>

          <BentoCard className="md:col-span-2" delay={0.05}>
            <p className="eyebrow text-sage">Total minutes moved</p>
            <BigNumber value={stats.totalMinutes} suffix="min" />
          </BentoCard>

          <BentoCard className="md:col-span-1" delay={0.1}>
            <p className="eyebrow text-sage">Days you showed up</p>
            <BigNumber value={stats.daysShowedUp} small />
          </BentoCard>

          <BentoCard
            className="md:col-span-1 cursor-pointer"
            delay={0.15}
            tone="blue"
            href="/log"
          >
            <p className="eyebrow text-white/70">Today</p>
            <p className="mt-auto sf-display text-[26px] text-white">
              Log a<br />new move ›
            </p>
          </BentoCard>
        </div>
      </section>

      {/* CHART + RECENT */}
      <section className="mt-5 grid gap-5 lg:grid-cols-5">
        <motion.div {...fadeUp} className="glass rounded-[28px] p-8 lg:col-span-3">
          <p className="eyebrow text-sage">Energy breakdown</p>
          <h3 className="mt-2 sf-display text-[28px] text-navy">Where your minutes went</h3>
          <div className="mt-6 h-[300px]">
            {chartData.length === 0 ? (
              <Empty text="Log your first movement to see the breakdown." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 12, fill: "#737373", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#737373" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(34,197,94,0.06)" }}
                    contentStyle={{
                      background: "rgba(28,28,30,0.85)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 14,
                      color: "#fff",
                      fontSize: 13,
                      padding: "10px 14px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                  />
                  <Bar dataKey="minutes" fill="url(#bar-grad)" radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="glass rounded-[28px] p-8 lg:col-span-2 min-h-[420px]"
        >
          <p className="eyebrow text-sage">Recent wins</p>
          <h3 className="mt-2 sf-display text-[28px] text-navy">Proof you showed up</h3>
          {recent.length === 0 ? (
            <p className="mt-8 italic text-sage">Nothing yet. Start today.</p>
          ) : (
            <ul className="mt-5 divide-y divide-black/5">
              {recent.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease, delay: i * 0.05 }}
                  className="flex items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-navy">{a.type}</p>
                    <p className="mt-0.5 text-[12px] text-sage">
                      {a.duration} min · {a.intensity} · {a.mood}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[12px] text-sage">{a.date}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </section>

      {/* IDENTITY band — full-bleed dark */}
      <motion.section
        {...fadeUp}
        className="relative mt-5 -mx-6 overflow-hidden rounded-[28px] px-8 py-20 sm:-mx-8 sm:px-16 sm:py-28"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(34,197,94,0.35), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(22,163,74,0.25), transparent 55%), #0a0a0c",
        }}
      >
        <div className="mx-auto max-w-[1200px]">
          <p className="eyebrow text-white/60">
            {stats.daysShowedUp} day{stats.daysShowedUp === 1 ? "" : "s"} · {stats.streak} in a row
          </p>
          <h2
            className="sf-display mt-5 text-white"
            style={{ fontSize: "clamp(40px, 6vw, 80px)" }}
          >
            This is how consistency
            <br />
            becomes <span style={{ color: "#22c55e" }}>identity.</span>
          </h2>
        </div>
      </motion.section>
    </Layout>
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

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease, delay }}
      whileHover={{ y: -4, transition: { duration: 0.25, ease } }}
      className={`group flex h-full flex-col rounded-[28px] p-7 ${toneCls} ${className}`}
      style={tone === "blue" ? { boxShadow: "0 12px 40px -12px rgba(34,197,94,0.5)" } : undefined}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <Link to={href} className={`block h-full ${className}`}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function BigNumber({
  value,
  suffix,
  small = false,
}: {
  value: number;
  suffix?: string;
  small?: boolean;
}) {
  const animated = useCountUp(value, 1200);
  return (
    <p
      className="sf-display mt-auto text-navy"
      style={{ fontSize: small ? "clamp(48px, 7vw, 72px)" : "clamp(64px, 9vw, 108px)" }}
    >
      {animated}
      {suffix && <span className="ml-2 text-[0.32em] font-medium text-sage">{suffix}</span>}
    </p>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="italic text-sage">{text}</p>
    </div>
  );
}
