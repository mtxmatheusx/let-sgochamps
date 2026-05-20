import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout, PageHeader } from "@/components/Layout";
import { fetchMyGroups, type MyGroup } from "@/lib/groups";

export const Route = createFileRoute("/groups/")({ component: GroupsIndex });

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };
const iosHoverSpring = { type: "spring" as const, stiffness: 300, damping: 22 };

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Permanent · Club";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start && end) {
    return `${new Date(start + "T00:00:00").toLocaleDateString("en-US", opts)} → ${new Date(end + "T00:00:00").toLocaleDateString("en-US", opts)}`;
  }
  if (start) return `from ${new Date(start + "T00:00:00").toLocaleDateString("en-US", opts)}`;
  return `until ${new Date(end! + "T00:00:00").toLocaleDateString("en-US", opts)}`;
}

function GroupsIndex() {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["my-groups"],
    queryFn: fetchMyGroups,
    placeholderData: (previous) => previous ?? [],
  });

  const clubs = groups.filter((g) => g.type === "club");
  const challenges = groups.filter((g) => g.type === "challenge");

  return (
    <Layout>
      <PageHeader
        eyebrow="Your champs"
        title="Your clubs and challenges."
        subtitle="Clubs are permanent — your daily community. Challenges are time-bound seasons of focus. Both run in parallel, and both are how the Brilliance Tree grows together."
      />

      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          to="/groups/new"
          className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(22,163,74,0.65)] transition-all hover:brightness-110"
        >
          + Create a Club or Challenge
        </Link>
        <Link
          to="/groups/join"
          className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-5 py-2.5 text-[13px] font-semibold text-navy transition-all hover:bg-black/[0.08]"
        >
          Join with a code →
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {clubs.length > 0 && (
            <section className="mb-10">
              <p className="eyebrow mb-4">Clubs · permanent</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clubs.map((g) => (
                  <GroupCard key={g.id} g={g} />
                ))}
              </div>
            </section>
          )}

          {challenges.length > 0 && (
            <section>
              <p className="eyebrow mb-4">Challenges · seasonal</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {challenges.map((g) => (
                  <GroupCard key={g.id} g={g} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Layout>
  );
}

function GroupCard({ g }: { g: MyGroup }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.012, transition: iosHoverSpring }}
      whileTap={{ scale: 0.97 }}
      transition={iosSpring}
    >
      <Link
        to="/groups/$slug"
        params={{ slug: g.slug }}
        className="glass block rounded-3xl p-6 transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`pill ${g.type === "challenge" ? "pill-brand" : ""}`}>
            {g.type === "challenge" ? "Challenge" : "Club"}
          </span>
          {g.role !== "member" && (
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-green">
              {g.role}
            </span>
          )}
        </div>
        <h3 className="mt-4 sf-display text-[22px] text-navy leading-tight">{g.name}</h3>
        <p className="mt-2 text-[12px] text-ink-muted">{formatDateRange(g.start_date, g.end_date)}</p>
        <div className="mt-5 flex items-center justify-between border-t border-black/[0.05] pt-4">
          <span className="text-[12px] text-ink-soft">
            <span className="nums font-bold text-navy">{g.members}</span> {g.members === 1 ? "champ" : "champs"}
          </span>
          <span className="text-[12px] font-semibold text-green">Open →</span>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={iosSpring}
      className="glass rounded-3xl px-8 py-14 text-center"
    >
      <p className="text-[40px]">🌱</p>
      <p className="mt-4 sf-display text-[24px] text-navy">You're not in any groups yet.</p>
      <p className="mt-3 mx-auto max-w-md text-[14px] leading-[1.55] text-ink-soft">
        Start a Club with your family or team, kick off a Challenge for the month ahead, or join one with an invite code from a friend.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          to="/groups/new"
          className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(22,163,74,0.65)]"
        >
          Create one ›
        </Link>
        <Link
          to="/groups/join"
          className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-5 py-2.5 text-[13px] font-semibold text-navy"
        >
          Join with code ›
        </Link>
      </div>
    </motion.div>
  );
}
