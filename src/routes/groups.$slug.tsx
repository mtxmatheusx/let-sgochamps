import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { FeedCard } from "@/components/FeedCard";
import {
  fetchGroupBySlug,
  fetchGroupStats,
  fetchGroupRollCall,
  createInvite,
  leaveGroup,
  type RollCallEntry,
} from "@/lib/groups";
import { fetchGroupFeed } from "@/lib/feed";
import { useCountUp } from "@/hooks/useCountUp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/groups/$slug")({ component: GroupDetail });

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };
const iosHoverSpring = { type: "spring" as const, stiffness: 300, damping: 22 };

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function daysSince(iso: string | null): string {
  if (!iso) return "not yet";
  const days = Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function GroupDetail() {
  const { slug } = useParams({ from: "/groups/$slug" });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ["group", slug],
    queryFn: () => fetchGroupBySlug(slug),
    placeholderData: (previous) => previous,
  });

  const { data: stats } = useQuery({
    queryKey: ["group", slug, "stats"],
    queryFn: () => (group ? fetchGroupStats(group.id) : null),
    enabled: !!group,
  });

  const { data: rollCall = [] } = useQuery({
    queryKey: ["group", slug, "roll-call"],
    queryFn: () => (group ? fetchGroupRollCall(group.id) : []),
    enabled: !!group,
  });

  const { data: feed = [], isLoading: loadingFeed } = useQuery({
    queryKey: ["group", "feed", slug],
    queryFn: () => (group ? fetchGroupFeed(group.id) : []),
    enabled: !!group,
    placeholderData: (previous) => previous ?? [],
  });

  const inviteMutation = useMutation({
    mutationFn: () => createInvite(group!.id),
    onSuccess: (code) => {
      navigator.clipboard.writeText(code).catch(() => {});
      toast.success(`Invite code ${code} copied`);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveGroup(group!.id),
    onSuccess: () => {
      toast.success("You left the group.");
      qc.invalidateQueries({ queryKey: ["my-groups"] });
      navigate({ to: "/groups" });
    },
  });

  const [meId, setMeId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  if (loadingGroup) {
    return (
      <Layout>
        <div className="min-h-[45vh]" />
      </Layout>
    );
  }
  if (!group) {
    return (
      <Layout>
        <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center">
          <p className="sf-display text-[28px] text-navy">Group not found</p>
          <p className="mt-3 text-[14px] text-ink-soft">It may have been deleted, or you don't have access yet.</p>
          <Link to="/groups" className="mt-6 inline-flex rounded-full bg-green px-5 py-2.5 text-[13px] font-semibold text-white">
            Back to your groups
          </Link>
        </div>
      </Layout>
    );
  }

  const isOwner = meId === group.owner_id;
  const isChallenge = group.type === "challenge";

  return (
    <Layout>
      {/* ── HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={iosSpring}
        className="mb-10"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`pill ${isChallenge ? "pill-brand" : ""}`}>
            {isChallenge ? "Challenge" : "Club"}
          </span>
          {group.is_public && <span className="pill">Public</span>}
        </div>
        <h1
          className="mt-4 sf-display text-navy"
          style={{ fontSize: "clamp(34px, 5vw, 56px)" }}
        >
          {group.name}
        </h1>
        {group.description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-ink-soft">{group.description}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {isOwner && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              {inviteMutation.isPending ? "Generating…" : "Generate invite code"}
            </motion.button>
          )}
          {!isOwner && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (confirm("Leave this group?")) leaveMutation.mutate();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-5 py-2.5 text-[13px] font-semibold text-navy"
            >
              Leave
            </motion.button>
          )}
          <Link
            to="/log"
            className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-5 py-2.5 text-[13px] font-semibold text-navy"
          >
            Log a check-in →
          </Link>
        </div>
      </motion.header>

      {/* ── STATS BAR ── */}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatPill label="Total minutes" value={stats?.total_minutes ?? 0} suffix="min" />
        <StatPill label="Active champs" value={stats?.active_members ?? 0} />
        <StatPill label="Sessions" value={stats?.sessions_logged ?? 0} />
        <StatPill label="Members" value={stats?.total_members ?? 0} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* ── FEED ── */}
        <section className="lg:col-span-2">
          <p className="eyebrow mb-3">Feed · newest first</p>
          {loadingFeed ? (
            <div className="min-h-28" />
          ) : feed.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <p className="text-[36px]">🌱</p>
              <p className="mt-3 sf-display text-[22px] text-navy">No check-ins yet.</p>
              <p className="mt-2 text-[13px] text-ink-soft">Be the first to show up for this group.</p>
              <Link
                to="/log"
                className="mt-5 inline-flex rounded-full bg-green px-5 py-2.5 text-[13px] font-semibold text-white"
              >
                Log a check-in ›
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* ── ROLL CALL ── */}
        <aside className="lg:col-span-1">
          <p className="eyebrow mb-3">Roll call · who showed up</p>
          <div className="glass rounded-3xl p-5">
            {rollCall.length === 0 ? (
              <p className="text-[13px] text-ink-soft">No members yet.</p>
            ) : (
              <ul className="divide-y divide-black/[0.05]">
                {rollCall.map((m) => (
                  <RollCallRow key={m.user_id} m={m} />
                ))}
              </ul>
            )}
            <p className="mt-4 border-t border-black/[0.05] pt-3 text-[11px] text-ink-muted">
              Sorted by last check-in — not by score. Champs show up for themselves and each other.
            </p>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

function StatPill({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const animated = useCountUp(value, 1000);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={iosSpring}
      whileHover={{ y: -2, transition: iosHoverSpring }}
      className="glass flex flex-col rounded-3xl p-5"
    >
      <p className="eyebrow">{label}</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="sf-display text-[36px] text-navy nums leading-none">{animated}</span>
        {suffix && <span className="text-[12px] font-medium text-ink-muted">{suffix}</span>}
      </div>
    </motion.div>
  );
}

function RollCallRow({ m }: { m: RollCallEntry }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green/15 text-[11px] font-bold text-green">
        {m.avatar_url ? (
          <img src={m.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          initials(m.display_name)
        )}
        {m.daily_pose && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[12px] shadow-sm">
            {m.daily_pose}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-navy truncate">{m.display_name ?? "Champ"}</p>
        <p className="text-[11px] text-ink-muted">
          {m.check_ins > 0
            ? `${m.check_ins} ${m.check_ins === 1 ? "check-in" : "check-ins"} · last ${daysSince(m.last_check_in)}`
            : "haven't checked in yet"}
        </p>
      </div>
    </li>
  );
}
