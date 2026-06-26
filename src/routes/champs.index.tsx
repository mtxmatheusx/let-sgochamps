import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layout, PageHeader } from "@/components/Layout";
import { searchChamps, fetchChampMapPoints, fetchMyProfile, updateMyProfile, type ChampCard } from "@/lib/profiles";

const ChampsWorldMap = lazy(() =>
  import("@/components/ChampsWorldMap").then((m) => ({ default: m.ChampsWorldMap })),
);


export const Route = createFileRoute("/champs/")({
  component: ChampsDirectory,
  head: () => ({
    meta: [
      { title: "Champs — LET'SGOCHAMPS" },
      { name: "description", content: "Find other champs in the community. Cheer them on. Build your circle." },
    ],
  }),
});

const iosSoftSpring = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };

// Debounce the search term so we hit Supabase once the user pauses, not on
// every keystroke (previously one round-trip per character).
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ChampsDirectory() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q, 300);
  const { data: champs = [], isLoading, isError } = useQuery({
    queryKey: ["champs", debouncedQ],
    queryFn: () => searchChamps(debouncedQ),
    placeholderData: (previous) => previous ?? [],
  });

  const { data: mapData } = useQuery({
    queryKey: ["champ-map"],
    queryFn: fetchChampMapPoints,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-heal: the first time this page loads, silently geocode the current
  // champ's city if they have location text but no coordinates yet, so their
  // dot appears on the map without them having to re-save their profile.
  useEffect(() => {
    fetchMyProfile().then((p) => {
      if (!p?.location || p.location_lat != null) return;
      updateMyProfile({ location: p.location })
        .then(() => qc.invalidateQueries({ queryKey: ["champ-map"] }))
        .catch(() => {});
    });
  }, [qc]);

  return (
    <Layout>
      <PageHeader
        eyebrow="The community"
        title="Champs"
        subtitle="The people showing up alongside you. Find your circle. Cheer them on."
      />

      {mapData && (
        <Suspense fallback={<div className="mb-10 h-[360px] rounded-[28px] glass" />}>
          <ChampsWorldMap data={mapData} />
        </Suspense>
      )}



      <div className="mb-8 max-w-[520px]">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, city, or movement…"
          aria-label="Search champs"
          className="focus-ios h-[54px] w-full rounded-2xl border border-transparent bg-black/[0.04] px-5 text-[15px] text-navy outline-none"
        />
      </div>

      {isError ? (
        <div className="mx-auto max-w-md rounded-[24px] glass p-10 text-center">
          <div className="text-[40px]">😕</div>
          <h3 className="mt-3 text-[20px] font-semibold text-navy">
            Couldn't load the directory.
          </h3>
          <p className="mt-2 text-[14px] text-sage">
            Something hiccuped on our end. Refresh the page to try again.
          </p>
        </div>
      ) : isLoading && champs.length === 0 ? (
        <div className="grid min-h-[30vh] place-items-center text-sage">Finding champs…</div>
      ) : champs.length === 0 ? (
        <EmptyState query={q} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {champs.map((c, i) => (
            <ChampCardView key={c.id} champ={c} index={i} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function ChampCardView({ champ, index }: { champ: ChampCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...iosSoftSpring, delay: Math.min(index * 0.02, 0.2) }}
    >
      <Link
        to="/champs/$userId"
        params={{ userId: champ.id }}
        className="group block rounded-[24px] glass p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-18px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start gap-4">
          {champ.avatar_url ? (
            <img
              src={champ.avatar_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-black/5"
            />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-black/[0.06] text-[18px] font-semibold text-navy/40">
              {(champ.display_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-navy">
              {champ.display_name ?? "Anonymous champ"}
            </div>
            {champ.location && (
              <div className="mt-0.5 truncate text-[12.5px] text-sage">{champ.location}</div>
            )}
          </div>
        </div>

        {champ.bio && (
          <p className="mt-3 line-clamp-3 text-[13.5px] leading-[1.5] text-navy/75">{champ.bio}</p>
        )}

        <div className="mt-4 flex items-center gap-4 border-t border-black/5 pt-3 text-[12px] text-sage">
          <span>
            <strong className="text-navy">{champ.sessions_logged}</strong> sessions
          </span>
          <span>
            <strong className="text-navy">{champ.total_minutes}</strong> min
          </span>
          {champ.favorite_movement && (
            <span className="ml-auto truncate rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-navy/70">
              {champ.favorite_movement}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="mx-auto max-w-md rounded-[24px] glass p-10 text-center">
      <div className="text-[40px]">🏃</div>
      <h3 className="mt-3 text-[20px] font-semibold text-navy">
        {query ? "No champs match that search." : "The directory is just getting started."}
      </h3>
      <p className="mt-2 text-[14px] text-sage">
        {query
          ? "Try a different city, movement, or name."
          : "Be one of the first — fill out your profile and others will find you."}
      </p>
      <Link
        to="/profile"
        className="mt-5 inline-block rounded-full bg-blue px-5 py-2.5 text-[13px] font-semibold text-white hover:brightness-110"
      >
        Edit my profile
      </Link>
    </div>
  );
}
