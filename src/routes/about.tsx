import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layout, PageHeader } from "@/components/Layout";

export const Route = createFileRoute("/about")({ component: About });

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };
const iosHoverSpring = { type: "spring" as const, stiffness: 300, damping: 22 };

// ── The Brilliance Tree — three branches that make a champ ──
const pillars: Array<{
  number: string;
  title: string;
  tagline: string;
  body: string;
  accent: string;
}> = [
  {
    number: "01",
    title: "Encourage",
    tagline: "We lift each other up.",
    body:
      "Wellness is hard to build alone. The Brilliance Tree starts with a simple act: showing up for someone else's day. A nod, a check-in, a shared rep. Every champ becomes a reason another champ keeps going.",
    accent: "Movement",
  },
  {
    number: "02",
    title: "Share",
    tagline: "Stories cultivate the community.",
    body:
      "When you share your win — the morning walk, the first stretch in months, the run you almost skipped — it stops being just yours. It plants something. The wall of stories isn't a feed: it's the proof that champs are real, ordinary people, doing it.",
    accent: "Mindset",
  },
  {
    number: "03",
    title: "Structure",
    tagline: "Rhythm becomes identity.",
    body:
      "We don't chase intensity — we build cadence. Logging daily, however small, turns movement from a goal into a structure. Structure is what makes wellness survive the bad days. It's the part nobody sees that produces everything everybody admires.",
    accent: "Consistency",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: iosSpring,
};

function About() {
  return (
    <Layout>
      <PageHeader
        eyebrow="The Brilliance Tree"
        title="Three branches. One champ."
        subtitle="Let's Go Champs is more than a tracker. It's a small ecosystem with three branches that grow together — and quietly turn anyone who tends them into someone they're proud of."
      />

      {/* ── 3 PILLARS ── */}
      <section className="relative">
        <div
          className="orb"
          style={{ width: 380, height: 380, top: -60, left: -100, background: "#22c55e", opacity: 0.08 }}
        />
        <div
          className="orb"
          style={{ width: 360, height: 360, bottom: -80, right: -80, background: "#22c55e", opacity: 0.06 }}
        />

        <div className="relative grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...iosSpring, delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.012, transition: iosHoverSpring }}
              className="glass relative flex flex-col rounded-3xl p-7 md:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="sf-display text-[44px] leading-none text-green/30 nums">{p.number}</span>
                <span className="pill pill-brand">{p.accent}</span>
              </div>
              <h3 className="mt-6 sf-display text-[28px] text-navy">{p.title}</h3>
              <p className="mt-2 text-[15px] font-medium text-green">{p.tagline}</p>
              <p className="mt-4 text-[14px] leading-[1.65] text-ink-soft">{p.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── HOW THE APP SUPPORTS IT ── */}
      <motion.section {...fadeUp} className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="glass rounded-3xl p-7 md:p-8">
          <p className="eyebrow text-green">How it works</p>
          <h3 className="mt-2 sf-display text-[26px] text-navy">The daily loop</h3>
          <ol className="mt-5 space-y-3">
            {[
              "Open the dashboard.",
              "Review minutes, days, and your streak.",
              "Tap Log today's movement.",
              "Submit the form — any duration, any intensity.",
              "Return to an updated dashboard.",
              "Share the win on the community wall when it feels right.",
            ].map((step, j) => (
              <li key={j} className="flex gap-3 text-[14px] leading-[1.55] text-ink-soft">
                <span className="nums font-bold text-green tabular-nums">{String(j + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="glass rounded-3xl p-7 md:p-8">
          <p className="eyebrow text-green">Why it works</p>
          <h3 className="mt-2 sf-display text-[26px] text-navy">Identity, one log at a time</h3>
          <p className="mt-5 text-[14px] leading-[1.65] text-ink-soft">
            Every logged movement is small evidence. Stacked together, that evidence becomes a story you can't argue with:{" "}
            <span className="font-semibold text-navy">you are someone who moves.</span>
          </p>
          <p className="mt-4 text-[14px] leading-[1.65] text-ink-soft">
            The streak isn't there to shame you when you miss a day — it's there to make today's decision visible. The wall isn't a leaderboard — it's a mirror that says <em>champs come in every shape, age, and pace.</em>
          </p>
        </div>
      </motion.section>

      {/* ── CTA ── */}
      <motion.section
        {...fadeUp}
        className="mt-12 relative overflow-hidden rounded-3xl px-7 py-14 sm:px-14 sm:py-20 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(34,197,94,0.32), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(22,163,74,0.22), transparent 55%), #0a0a0c",
        }}
      >
        <p className="eyebrow text-white/60">Join the Brilliance Tree</p>
        <h2 className="sf-display mt-4 text-white" style={{ fontSize: "clamp(34px, 5vw, 56px)" }}>
          Every champ starts with <span style={{ color: "#22c55e" }}>one log.</span>
        </h2>
        <p className="mt-5 mx-auto max-w-xl text-[15px] leading-[1.55] text-white/60">
          You don't need to be the fastest, the fittest, or the most disciplined. You only need to show up once today.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/log"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-green px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(22,163,74,0.65)] hover:brightness-110"
          >
            Log today ›
          </Link>
          <Link
            to="/community"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-[15px] font-medium text-white backdrop-blur-sm hover:bg-white/20"
          >
            See the community ›
          </Link>
        </div>
      </motion.section>
    </Layout>
  );
}
