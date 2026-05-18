import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PublicLayout, PageHeader } from "@/components/Layout";
import { fetchWeeklyStats, fetchWeeklyMessage } from "@/lib/community";
import { fetchFeaturedStories } from "@/lib/stories";
import type { Story } from "@/lib/stories";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/community")({ component: Community });

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };
const iosHoverSpring = { type: "spring" as const, stiffness: 300, damping: 22 };

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: iosSpring,
};

function Community() {
  const { data: stats } = useQuery({ queryKey: ["community", "stats"], queryFn: fetchWeeklyStats });
  const { data: message } = useQuery({ queryKey: ["community", "message"], queryFn: fetchWeeklyMessage });
  const { data: stories = [] } = useQuery({ queryKey: ["community", "featured-stories"], queryFn: fetchFeaturedStories });

  const totalMinutes = stats?.total_minutes ?? 0;
  const activeChamps = stats?.active_champs ?? 0;
  const sessions = stats?.sessions_logged ?? 0;

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Movement of the week"
        title="This is what champs look like."
        subtitle="Every week, ordinary people log a few minutes of movement and quietly become someone they're proud of. Here's what the Brilliance Tree grew this week."
      />

      {/* ── WEEKLY STATS BENTO ── */}
      <section className="relative">
        <div className="orb" style={{ width: 420, height: 420, top: -80, left: -120, background: "#22c55e", opacity: 0.06 }} />
        <div className="orb" style={{ width: 360, height: 360, bottom: -40, right: -60, background: "#22c55e", opacity: 0.05 }} />

        <div className="relative grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          <StatCard
            eyebrow="Total minutes moved"
            value={totalMinutes}
            suffix="min"
            caption={
              totalMinutes > 0
                ? `${Math.round(totalMinutes / 60)} hours of collective movement`
                : "Be the first to log this week"
            }
            delay={0}
            className="col-span-2 md:col-span-2"
          />
          <StatCard
            eyebrow="Active champs"
            value={activeChamps}
            small
            caption={activeChamps === 1 ? "showed up this week" : "showed up this week"}
            delay={0.05}
            className="col-span-1 md:col-span-1"
          />
          <StatCard
            eyebrow="Sessions logged"
            value={sessions}
            small
            caption={sessions === 1 ? "win on the wall" : "wins on the wall"}
            delay={0.1}
            className="col-span-1 md:col-span-1"
          />
          <CTACard delay={0.15} className="col-span-1 md:col-span-2" />
        </div>
      </section>

      {/* ── MESSAGE OF THE WEEK ── */}
      <motion.section
        {...fadeUp}
        className="mt-6 relative overflow-hidden rounded-3xl"
        style={{ background: "linear-gradient(135deg, #0a0a0c 0%, #0d1a0f 50%, #0a0a0c 100%)" }}
      >
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.28) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 right-8 h-52 w-52 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 70%)" }}
        />

        <div className="relative px-7 py-12 sm:px-14 sm:py-16">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-green animate-pulse" />
            <p className="eyebrow text-green/80" style={{ letterSpacing: "0.18em" }}>
              Aidan's message this week
            </p>
          </div>

          {message ? (
            <>
              <blockquote
                className="sf-display mt-6 text-white"
                style={{ fontSize: "clamp(24px, 3.4vw, 42px)", lineHeight: 1.2, maxWidth: "820px" }}
              >
                "{message.message}"
              </blockquote>
              {message.author_note && (
                <p className="mt-6 text-[14px] leading-[1.6] text-white/55 max-w-xl">{message.author_note}</p>
              )}
            </>
          ) : (
            <>
              <blockquote
                className="sf-display mt-6 text-white"
                style={{ fontSize: "clamp(24px, 3.4vw, 42px)", lineHeight: 1.2, maxWidth: "820px" }}
              >
                "Every champ starts with one log. The week ahead is just a stack of small decisions — keep stacking them."
              </blockquote>
              <p className="mt-6 text-[13px] text-white/40 max-w-xl">
                The weekly message will appear here once Aidan publishes one.
              </p>
            </>
          )}

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/40">Aidan O'Hare</p>
          </div>
        </div>
      </motion.section>

      {/* ── STORIES WALL ── */}
      <motion.section {...fadeUp} className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-green">Stories from the wall</p>
            <h3 className="mt-1 sf-display text-[26px] text-navy md:text-[32px]">Champs in their own words</h3>
          </div>
          <Link
            to="/stories"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-semibold text-navy transition-all hover:bg-black/[0.08]"
          >
            See all stories →
          </Link>
        </div>

        {stories.length === 0 ? (
          <div className="mt-6 glass rounded-3xl p-10 text-center">
            <p className="text-[32px]">🌱</p>
            <p className="mt-3 text-[16px] font-semibold text-navy">The wall is waiting for its first story.</p>
            <p className="mt-2 text-[14px] text-ink-soft">Yours could plant the first seed.</p>
            <Link
              to="/stories/submit"
              className="mt-6 inline-flex rounded-full bg-green px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110"
            >
              Share your story ›
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stories.slice(0, 6).map((s, i) => (
              <StoryTile key={s.id} story={s} delay={i * 0.05} />
            ))}
          </div>
        )}

        <div className="mt-6 flex sm:hidden justify-center">
          <Link
            to="/stories"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-semibold text-navy"
          >
            See all stories →
          </Link>
        </div>
      </motion.section>

      {/* ── BOTTOM CTA ── */}
      <motion.section
        {...fadeUp}
        className="mt-12 relative overflow-hidden rounded-3xl px-7 py-14 sm:px-14 sm:py-20 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(34,197,94,0.32), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(22,163,74,0.22), transparent 55%), #0a0a0c",
        }}
      >
        <p className="eyebrow text-white/60">Add your branch</p>
        <h2 className="sf-display mt-4 text-white" style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>
          One more champ on the <span style={{ color: "#22c55e" }}>Brilliance Tree.</span>
        </h2>
        <p className="mt-5 mx-auto max-w-xl text-[15px] leading-[1.55] text-white/60">
          The community grows one log, one story, one show-up at a time. Be the one this week.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/stories/submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-green px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(22,163,74,0.65)] hover:brightness-110"
          >
            Share your story ›
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-[15px] font-medium text-white backdrop-blur-sm hover:bg-white/20"
          >
            The Brilliance Tree ›
          </Link>
        </div>
      </motion.section>
    </PublicLayout>
  );
}

/* ─────────────────────────── sub-components ─────────────────────────── */

function StatCard({
  eyebrow,
  value,
  suffix,
  caption,
  delay,
  className = "",
  small = false,
}: {
  eyebrow: string;
  value: number;
  suffix?: string;
  caption: string;
  delay: number;
  className?: string;
  small?: boolean;
}) {
  const animated = useCountUp(value, 1200);
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...iosSpring, delay }}
      whileHover={{ y: -4, scale: 1.012, transition: iosHoverSpring }}
      className={`glass flex h-full flex-col rounded-3xl p-5 md:p-7 ${className}`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <div
        className="sf-display mt-auto flex items-baseline text-navy"
        style={{
          fontSize: small ? "clamp(40px, 7vw, 64px)" : "clamp(52px, 9vw, 88px)",
          gap: "0.18em",
        }}
      >
        <span className="nums">{animated}</span>
        {suffix && (
          <span className="font-medium text-ink-muted" style={{ fontSize: "0.30em", letterSpacing: "0.01em" }}>
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] text-ink-muted">{caption}</p>
    </motion.div>
  );
}

function CTACard({ delay, className = "" }: { delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...iosSpring, delay }}
      whileHover={{ y: -4, scale: 1.012, transition: iosHoverSpring }}
      whileTap={{ scale: 0.97 }}
      className={`bg-green text-white flex h-full flex-col rounded-3xl p-5 md:p-7 ${className}`}
      style={{ boxShadow: "0 12px 40px -12px rgba(22,163,74,0.5)" }}
    >
      <p className="eyebrow text-white/70">Your turn</p>
      <div className="mt-auto flex items-end justify-between gap-2">
        <p className="sf-display text-[22px] md:text-[26px]">
          Log a<br />new move
        </p>
        <Link to="/log" className="text-white text-[22px] -mb-0.5" aria-label="Go to log">
          ›
        </Link>
      </div>
    </motion.div>
  );
}

function StoryTile({ story, delay }: { story: Story; delay: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...iosSpring, delay }}
      whileHover={{ y: -4, scale: 1.012, transition: iosHoverSpring }}
      className="glass flex flex-col rounded-3xl p-6 md:p-7"
    >
      {story.photo_url && (
        <div className="-mx-6 -mt-6 mb-5 overflow-hidden rounded-t-3xl md:-mx-7 md:-mt-7">
          <img src={story.photo_url} alt={`${story.name} from ${story.city}`} className="h-44 w-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="pill pill-brand">{story.activity_type ?? "Movement"}</span>
        <span className="text-[11px] text-ink-muted">{story.city}</span>
      </div>
      {story.quote ? (
        <blockquote className="mt-4 sf-display text-[18px] leading-[1.3] text-navy">"{story.quote}"</blockquote>
      ) : (
        <p className="mt-4 text-[14px] leading-[1.55] text-ink-soft line-clamp-5">{story.story}</p>
      )}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-navy">{story.name}</p>
        {story.is_pinned && <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-green">Pinned</span>}
      </div>
    </motion.article>
  );
}
