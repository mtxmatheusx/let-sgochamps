import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layout, PageHeader } from "@/components/Layout";

export const Route = createFileRoute("/about")({ component: About });

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };
const iosHoverSpring = { type: "spring" as const, stiffness: 300, damping: 22 };

/* ─── 3 pillars: how the app shows up for a champ (user-facing) ─── */
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
    accent: "Wellness",
  },
  {
    number: "02",
    title: "Share",
    tagline: "Stories cultivate the community.",
    body:
      "When you share your win — the morning walk, the first stretch in months, the run you almost skipped — it stops being just yours. It plants something. The wall of stories isn't a feed: it's the proof that champs are real, ordinary people, doing it.",
    accent: "Community",
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

/* ─── The full Brilliance Tree framework — what's behind the pillars ─── */
const branches: Array<{ label: string; description: string; highlight?: boolean }> = [
  {
    label: "Wellness",
    description:
      "Care for the body, mind, and spirit — daily and repeatable, not heroic.",
    highlight: true,
  },
  {
    label: "Community",
    description:
      "Belong to something that grows you. Loneliness is the sickness; community is the cure.",
  },
  {
    label: "Finance",
    description:
      "Order in the parts of life that quietly hold everything else up.",
  },
];

const wellnessAreas: Array<{ name: string; copy: string }> = [
  { name: "Physical", copy: "Move daily. Any duration counts. The body follows the habit." },
  { name: "Emotional", copy: "Belong. Be heard. Belonging is the medicine we forget to take." },
  { name: "Spiritual", copy: "See yourself as part of something bigger than your own week." },
  { name: "Intellectual", copy: "Stay curious. The day you stop learning is the day you start fading." },
  { name: "Environmental", copy: "Build a space — physical and digital — that helps you thrive." },
  { name: "Occupational", copy: "Grow into who you're becoming through the work you do." },
];

/* ─── Trunk attributes — the energy that fuels the branches ─── */
const trunk: Array<{ letter: string; word: string; line: string }> = [
  { letter: "G", word: "Grit", line: "Do what it takes, even when no one's watching." },
  { letter: "R", word: "Represent", line: "Stand for something. Belief attracts." },
  { letter: "O", word: "Organized", line: "Set goals. Hit them. Repeat." },
  { letter: "W", word: "Work hard", line: "There's no easier door." },
  { letter: "T", word: "Together", line: "Alone we fail. Together we win." },
  { letter: "H", word: "Happy", line: "If it doesn't make you happy, change it." },
  { letter: "E", word: "Execute", line: "Do what you said you'd do." },
];

const features: Array<{ icon: string; title: string; nav: string; description: string; tips: string[] }> = [
  {
    icon: "📊",
    title: "Dashboard",
    nav: "Home",
    description:
      "Your personal command center. See your current streak, total minutes, active days, and a 12-week activity chart — all updated the moment you log.",
    tips: [
      "The ring shows your streak progress toward your best.",
      "Recent wins at the bottom remind you of your last five moves.",
      "Tap the quote to copy it and share it.",
    ],
  },
  {
    icon: "📝",
    title: "Log",
    nav: "Log",
    description:
      "Record any movement in under 60 seconds. Pick an activity type, enter minutes, choose intensity and mood — then submit. Every log builds your streak and feeds your history.",
    tips: [
      "12 activity types: Walking, Running, Cycling, Yoga, Strength, Swimming, Pilates, HIIT, Rowing, Dance, Stretching, Other.",
      "Add a photo and a note to make it memorable.",
      "Cross-post to your Groups at the same time — one tap.",
    ],
  },
  {
    icon: "🧱",
    title: "The Wall",
    nav: "Wall",
    description:
      "The tribe's public square. Share a photo or a short note about your move and see every other champ doing the same — in real time, in one place.",
    tips: [
      "No likes, no rankings. Just the tribe showing up.",
      "Leave encouraging comments on other champs' posts.",
      "The tribe pulse at the top shows how many champs are active right now.",
    ],
  },
  {
    icon: "👥",
    title: "Groups",
    nav: "Groups",
    description:
      "Create or join Clubs (ongoing) and Challenges (time-boxed). Groups have their own feed, roll call, and shared activity history — all with no leaderboards.",
    tips: [
      "Clubs are permanent spaces — great for friend groups or training partners.",
      "Challenges have a start and end date — ideal for a 30-day push.",
      "Share your invite code so others can join in one tap.",
    ],
  },
  {
    icon: "📅",
    title: "History",
    nav: "History",
    description:
      "A full log of every movement you've ever recorded — sorted by date, with all metadata visible. Your proof that you've been showing up.",
    tips: [
      "Filter by activity type or date range.",
      "Each entry shows intensity, mood, duration, and any notes.",
    ],
  },
  {
    icon: "📖",
    title: "Stories",
    nav: "Stories",
    description:
      "Submit your story — a written account of your wellness journey, a comeback, a breakthrough. Featured stories inspire the whole tribe.",
    tips: [
      "Add a photo and your location to make it real.",
      "Stories can be featured by Aidan's team on LGC's channels.",
      "Your story could be the reason someone else starts.",
    ],
  },
  {
    icon: "🤝",
    title: "Community",
    nav: "Community",
    description:
      "Weekly movement stats for the entire tribe: total minutes moved, active champs, sessions logged. Plus Aidan's message of the week — a personal note from the founder.",
    tips: [
      "Stats reset every Monday — a fresh start every week.",
      "Aidan's message changes weekly — check back every Monday.",
    ],
  },
  {
    icon: "🌳",
    title: "Brilliance Coach",
    nav: "Floating button",
    description:
      "Your personal AI guide, available on every page. Tap the green tree button in the bottom-right corner to open a chat. Ask anything about the framework, the app, or your journey.",
    tips: [
      "Knows the full GROWTH^E framework and all 3 Brilliance Tree branches.",
      "Can walk you through any feature step by step.",
      "Great for understanding the \"why\" behind what you're doing.",
    ],
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
        subtitle="Let's Go Champs is more than a tracker. It lives inside a bigger framework Aidan calls the Brilliance Tree — a way of growing on purpose. This is how the app fits in."
      />

      {/* ── 3 pillars (user-facing intuition) ── */}
      <section className="relative">
        <div className="orb" style={{ width: 380, height: 380, top: -60, left: -100, background: "#22c55e", opacity: 0.08 }} />
        <div className="orb" style={{ width: 360, height: 360, bottom: -80, right: -80, background: "#22c55e", opacity: 0.06 }} />

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

      {/* ── Section transition — the full framework ── */}
      <motion.div
        {...fadeUp}
        className="mt-16 mb-8 mx-auto max-w-2xl text-center"
      >
        <p className="eyebrow text-green">The full framework</p>
        <h2 className="mt-3 sf-display text-navy" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
          The tree behind the three pillars.
        </h2>
        <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
          The pillars above are the everyday face of something bigger. Aidan O'Hare's Brilliance Tree is a simple model for how a life — or a company — grows on purpose.
        </p>
      </motion.div>

      {/* ── The Tree diagram (typography-led) ── */}
      <motion.section
        {...fadeUp}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(34,197,94,0.16), transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(22,163,74,0.12), transparent 55%), #0a0a0c",
        }}
      >
        <div className="px-6 py-12 sm:px-12 sm:py-16">
          {/* 3 branches */}
          <p className="eyebrow text-white/60 text-center">The three branches</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {branches.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ ...iosSpring, delay: i * 0.07 }}
                className={`relative rounded-2xl border p-6 ${
                  b.highlight
                    ? "border-green/40 bg-green/[0.08]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {b.highlight && (
                  <span className="absolute -top-3 left-6 pill bg-green text-white text-[10px] font-bold">
                    ← This app lives here
                  </span>
                )}
                <h4
                  className="sf-display text-white"
                  style={{ fontSize: "clamp(26px, 3vw, 34px)" }}
                >
                  {b.label}
                </h4>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-white/65">{b.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Connector line */}
          <div className="my-10 flex justify-center">
            <div className="h-12 w-px bg-gradient-to-b from-white/20 to-white/5" />
          </div>

          {/* Trunk: GROWTH^E */}
          <div className="text-center">
            <p className="eyebrow text-white/60">The trunk that fuels them</p>
            <h3 className="mt-3 sf-display text-white" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>
              GROWTH<span style={{ color: "#22c55e" }}>^E</span>
            </h3>
            <p className="mt-3 text-[14px] text-white/55">
              Seven attributes the people who actually do the work tend to share.
            </p>
          </div>

          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-7">
            {trunk.map((t, i) => (
              <motion.div
                key={t.letter}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...iosSpring, delay: i * 0.04 }}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center"
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span className="sf-display text-[32px] text-green leading-none">{t.letter}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/45">
                    {t.word}
                  </span>
                </div>
                <p className="mt-2 text-[11.5px] leading-[1.4] text-white/55">{t.line}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── The 6 sub-areas of Wellness ── */}
      <motion.section {...fadeUp} className="mt-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-green">Where this app lives</p>
          <h2 className="mt-3 sf-display text-navy" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
            Six ways to be well.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
            The Wellness branch isn't just gym sessions and step counts. It's six dimensions that quietly compound when you tend them daily.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {wellnessAreas.map((w, i) => (
            <motion.div
              key={w.name}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...iosSpring, delay: i * 0.05 }}
              whileHover={{ y: -3, transition: iosHoverSpring }}
              className="glass rounded-3xl p-6"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green" />
                <h4 className="text-[15px] font-bold text-navy">{w.name}</h4>
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-ink-soft">{w.copy}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

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

      {/* ── FEATURE GUIDE ── */}
      <motion.section {...fadeUp} className="mt-20">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="eyebrow text-green">Everything in the app</p>
          <h2 className="mt-3 sf-display text-navy" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
            How to explore every feature.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
            Eight tools, one purpose: make it easy to show up for yourself — and make it feel worth it when you do.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...iosSpring, delay: i * 0.05 }}
              className="glass rounded-3xl p-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-green/10 text-[22px]">
                  {f.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[16px] font-bold text-navy">{f.title}</h4>
                    <span className="pill bg-black/[0.04] text-ink-soft text-[10px]">{f.nav}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-soft">{f.description}</p>
                  {f.tips.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {f.tips.map((tip, ti) => (
                        <li key={ti} className="flex items-start gap-2 text-[12.5px] text-ink-soft">
                          <span className="mt-[3px] h-1 w-1 flex-shrink-0 rounded-full bg-green" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── GETTING STARTED ── */}
      <motion.section {...fadeUp} className="mt-12">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:gap-16 items-start">
            <div>
              <p className="eyebrow text-green">New here?</p>
              <h3 className="mt-2 sf-display text-[32px] text-navy">Start in 3 moves.</h3>
              <p className="mt-4 text-[14px] leading-[1.65] text-ink-soft">
                You don't need to learn everything. These three steps get you from zero to a real streak in under five minutes.
              </p>
            </div>
            <ol className="space-y-5">
              {[
                {
                  n: "01",
                  title: "Log your first movement",
                  body: "Tap Log in the nav. Pick any activity — even a 5-minute walk counts. Hit save. Your streak starts now.",
                  link: "/log",
                  cta: "Log movement →",
                },
                {
                  n: "02",
                  title: "Post it on The Wall",
                  body: "Share what you just did with the tribe. One sentence or a photo is enough. No likes, no ranking — just the tribe seeing you show up.",
                  link: "/wall",
                  cta: "Go to The Wall →",
                },
                {
                  n: "03",
                  title: "Join or create a Group",
                  body: "Find a Club or start a Challenge with people you know. Shared accountability is the cheat code.",
                  link: "/groups",
                  cta: "See Groups →",
                },
              ].map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...iosSpring, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <span className="nums text-[28px] font-bold text-green/40 leading-none tabular-nums flex-shrink-0 w-8">{s.n}</span>
                  <div>
                    <h4 className="text-[15px] font-bold text-navy">{s.title}</h4>
                    <p className="mt-1 text-[13px] leading-[1.55] text-ink-soft">{s.body}</p>
                    <Link to={s.link} className="mt-2 inline-block text-[12px] font-semibold text-green hover:underline">
                      {s.cta}
                    </Link>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </motion.section>

      {/* ── BRILLIANCE COACH CALLOUT ── */}
      <motion.section
        {...fadeUp}
        className="mt-6 relative overflow-hidden rounded-3xl px-7 py-10 sm:px-10"
        style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(34,197,94,0.18), transparent 60%), #0a0a0c" }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="text-[40px] leading-none flex-shrink-0">🌳</span>
            <div>
              <p className="eyebrow text-white/50">Built into the app</p>
              <h3 className="mt-1 sf-display text-white text-[24px]">Ask the Brilliance Coach.</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-white/60 max-w-md">
                The green tree button in the bottom-right corner of every page is your personal AI guide. It knows the Brilliance Tree framework, all seven GROWTH^E attributes, and every feature in this app. Ask it anything — anytime.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-[13px] font-semibold text-green/70 sm:text-right">
            Tap 🌳 to start →
          </div>
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
