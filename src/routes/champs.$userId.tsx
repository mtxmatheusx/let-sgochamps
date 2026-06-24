import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { fetchPublicProfile } from "@/lib/profiles";

export const Route = createFileRoute("/champs/$userId")({
  component: ChampProfile,
});

const iosSoftSpring = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };

function ChampProfile() {
  const { userId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["champ", userId],
    queryFn: () => fetchPublicProfile(userId),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="grid min-h-[40vh] place-items-center text-sage">Loading champ…</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="mx-auto max-w-md rounded-[24px] glass p-10 text-center">
          <div className="text-[40px]">👀</div>
          <h2 className="mt-3 text-[22px] font-semibold text-navy">Champ not found</h2>
          <p className="mt-2 text-[14px] text-sage">
            This profile is private or no longer exists.
          </p>
          <Link
            to="/champs"
            className="mt-5 inline-block rounded-full bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:brightness-110"
          >
            Back to champs
          </Link>
        </div>
      </Layout>
    );
  }

  const { profile, recent, groups, stats } = data;
  const ig = profile.instagram_handle?.replace(/^@/, "");

  return (
    <Layout>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={iosSoftSpring}
        className="relative overflow-hidden rounded-[28px] glass p-8 sm:p-10"
      >
        <div className="orb" style={{ width: 300, height: 300, top: -100, right: -80, background: "#22c55e", opacity: 0.18 }} />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-[0_12px_36px_-16px_rgba(0,0,0,0.35)]"
            />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-full bg-black/[0.06] text-[32px] font-semibold text-navy/40">
              {(profile.display_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="sf-display text-[36px] leading-[1.05] text-navy sm:text-[44px]">
              {profile.display_name ?? "Anonymous champ"}
            </h1>
            {profile.location && (
              <p className="mt-1 text-[14px] text-sage">{profile.location}</p>
            )}
            {profile.bio && (
              <p className="mt-4 max-w-[60ch] text-[15.5px] leading-[1.55] text-navy/80">
                {profile.bio}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {profile.favorite_movement && (
                <span className="rounded-full bg-green/15 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-green">
                  {profile.favorite_movement}
                </span>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-black/[0.05] px-3 py-1.5 text-[12px] font-semibold text-navy hover:bg-black/[0.08]"
                >
                  Website ↗
                </a>
              )}
              {ig && (
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-black/[0.05] px-3 py-1.5 text-[12px] font-semibold text-navy hover:bg-black/[0.08]"
                >
                  @{ig}
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total minutes" value={stats.total_minutes} />
        <Stat label="Sessions logged" value={stats.sessions_logged} />
        <Stat label="Days active" value={stats.days_active} />
      </div>

      {/* Groups */}
      {groups.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.14em] text-sage">
            Public groups
          </h2>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                to="/groups/$slug"
                params={{ slug: g.slug }}
                className="rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-semibold text-navy hover:bg-black/[0.08]"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section className="mt-10">
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.14em] text-sage">
          Recent movement
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl bg-black/[0.03] p-6 text-center text-[14px] text-sage">
            No check-ins yet.
          </div>
        ) : (
          <div className="grid gap-2">
            {recent.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-2xl bg-white/70 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold text-navy">{a.type}</div>
                  <div className="text-[12px] text-sage">{a.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-[14.5px] font-semibold text-navy">{a.duration} min</div>
                  {a.intensity && <div className="text-[12px] text-sage">{a.intensity}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] glass p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage">{label}</div>
      <div className="mt-2 sf-display text-[36px] text-navy">{value}</div>
    </div>
  );
}
