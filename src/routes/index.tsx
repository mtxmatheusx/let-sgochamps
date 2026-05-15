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
import { computeStats, fetchActivities, minutesByType } from "@/lib/activities";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/")({ component: Dashboard });

const HERO_IMG =
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&q=85";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease },
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
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <Layout>
      {/* HERO — full-bleed cinematic */}
      <section
        ref={heroRef}
        className="relative -mx-6 -mt-12 overflow-hidden sm:-mx-[6%] sm:-mt-20"
        style={{ height: "min(88vh, 820px)" }}
      >
        <motion.div
          style={{ y: heroY, scale: heroScale }}
          className="absolute inset-0"
        >
          <img
            src={HERO_IMG}
            alt="Athletes in motion"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(13,17,23,0.35) 0%, rgba(13,17,23,0.55) 60%, rgba(245,240,232,0.95) 100%)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-center px-6 sm:px-12"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="eyebrow text-gold"
          >
            Movement · Mindset · Consistency
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.2 }}
            className="font-display mt-6 text-white"
            style={{
              fontSize: "clamp(64px, 11vw, 156px)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
            }}
          >
            LET'S GO
            <br />
            <span className="text-gold">CHAMPS.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.5 }}
            className="mt-8 max-w-xl text-[17px] leading-[1.6] text-white/85 sm:text-[19px]"
          >
            Showing up. Stacking days. Becoming the kind of person who keeps going.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.7 }}
            className="mt-10"
          >
            <Link
              to="/log"
              className="group inline-flex items-center gap-3 rounded-full bg-gold px-9 py-4 text-[12px] font-extrabold uppercase tracking-[0.18em] text-navy transition-all duration-300 hover:scale-[1.04] hover:brightness-110 hover:shadow-[0_20px_60px_-15px_rgba(184,150,46,0.6)]"
            >
              Log Today's Movement
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* BENTO GRID — Apple-style mixed sizes */}
      <section className="mt-20 grid auto-rows-[180px] grid-cols-1 gap-5 md:grid-cols-4 md:auto-rows-[200px]">
        {/* Big stat — Streak */}
        <BentoCard
          className="md:col-span-2 md:row-span-2"
          tone="navy"
          delay={0}
        >
          <p className="eyebrow text-gold">Current streak</p>
          <CountDisplay value={stats.streak} suffix={stats.streak === 1 ? " day" : " days"} gold />
          <p className="mt-auto max-w-[220px] text-sm leading-relaxed text-white/65">
            Stack the days. Identity is built one rep at a time.
          </p>
        </BentoCard>

        {/* Minutes */}
        <BentoCard className="md:col-span-2" tone="cream" delay={0.05}>
          <p className="eyebrow text-sage">Total minutes moved</p>
          <CountDisplay value={stats.totalMinutes} className="text-green" />
        </BentoCard>

        {/* Days showed up */}
        <BentoCard className="md:col-span-1" tone="cream" delay={0.1}>
          <p className="eyebrow text-sage">Days you showed up</p>
          <CountDisplay value={stats.daysShowedUp} className="text-navy" small />
        </BentoCard>

        {/* CTA tile */}
        <BentoCard className="md:col-span-1" tone="gold" delay={0.15} as={Link} to="/log">
          <p className="eyebrow text-navy/70">Today</p>
          <p className="mt-auto font-serif text-[28px] font-bold leading-[1.05] text-navy">
            Log a<br />new move →
          </p>
        </BentoCard>
      </section>

      {/* CHART + RECENT — refined two-up */}
      <section className="mt-6 grid gap-5 lg:grid-cols-5">
        <motion.div
          {...fadeUp}
          className="rounded-[28px] bg-card p-8 lift card-shadow lg:col-span-3"
        >
          <p className="eyebrow text-sage">Energy breakdown</p>
          <h3 className="mt-2 font-serif text-[26px] font-bold text-navy">
            Where you spent your minutes
          </h3>
          <div className="mt-8 h-[300px]">
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
                  <YAxis tick={{ fontSize: 11, fill: "#52624c" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(184,150,46,0.08)" }}
                    contentStyle={{
                      background: "#0d1117",
                      border: "none",
                      borderRadius: 14,
                      color: "#fff",
                      fontSize: 13,
                      padding: "10px 14px",
                    }}
                    labelStyle={{ color: "#b8962e", fontWeight: 700 }}
                  />
                  <Bar dataKey="minutes" fill="#b8962e" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="rounded-[28px] bg-card p-8 lift card-shadow lg:col-span-2"
        >
          <p className="eyebrow text-sage">Recent wins</p>
          <h3 className="mt-2 font-serif text-[26px] font-bold text-navy">Proof you showed up</h3>
          {recent.length === 0 ? (
            <p className="mt-8 italic text-sage">Nothing yet. Start today. Let's go.</p>
          ) : (
            <ul className="mt-6 divide-y divide-mist">
              {recent.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease, delay: i * 0.06 }}
                  className="flex items-start justify-between gap-3 py-4"
                >
                  <div>
                    <p className="text-[15px] font-bold text-navy">{a.type}</p>
                    <p className="mt-0.5 text-[13px] text-sage">
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

      {/* IDENTITY band — closer to Apple section breaker */}
      <motion.section
        {...fadeUp}
        className="mt-6 overflow-hidden rounded-[28px] px-8 py-16 sm:px-16 sm:py-24"
        style={{ background: "var(--navy-dark)" }}
      >
        <p className="eyebrow text-gold">
          {stats.daysShowedUp} day{stats.daysShowedUp === 1 ? "" : "s"} showed up · {stats.streak}{" "}
          in a row
        </p>
        <h2
          className="mt-6 font-serif font-bold leading-[1.02] text-white"
          style={{ fontSize: "clamp(36px, 5.5vw, 64px)", letterSpacing: "-0.02em" }}
        >
          This is how consistency<br />becomes <span className="text-gold">identity.</span>
        </h2>
      </motion.section>
    </Layout>
  );
}

function BentoCard({
  children,
  className = "",
  tone = "cream",
  delay = 0,
  as,
  to,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "cream" | "navy" | "gold";
  delay?: number;
  as?: typeof Link;
  to?: string;
}) {
  const toneStyles =
    tone === "navy"
      ? { background: "var(--navy-dark)", color: "#fff" }
      : tone === "gold"
      ? { background: "var(--gold)", color: "var(--navy)" }
      : { background: "#fff", color: "var(--navy)" };

  const Inner = (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease, delay }}
      whileHover={{ y: -6, transition: { duration: 0.3, ease } }}
      style={toneStyles}
      className={`group flex h-full flex-col rounded-[28px] p-7 card-shadow ${className}`}
    >
      {children}
    </motion.div>
  );

  if (as && to) {
    return (
      <Link to={to} className={`block h-full ${className}`}>
        {Inner}
      </Link>
    );
  }
  return Inner;
}

function CountDisplay({
  value,
  suffix = "",
  gold = false,
  small = false,
  className = "",
}: {
  value: number;
  suffix?: string;
  gold?: boolean;
  small?: boolean;
  className?: string;
}) {
  const animated = useCountUp(value, 1200);
  return (
    <p
      className={`mt-4 font-display leading-none ${className}`}
      style={{
        fontSize: small ? "clamp(56px, 8vw, 88px)" : "clamp(72px, 11vw, 132px)",
        letterSpacing: "-0.02em",
        color: gold ? "var(--gold)" : undefined,
      }}
    >
      {animated}
      {suffix && <span className="ml-2 text-[0.35em] font-sans font-bold opacity-60">{suffix}</span>}
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
