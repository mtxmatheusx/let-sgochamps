import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import { FeedCard } from "@/components/FeedCard";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchGroupBySlug,
  fetchGroupStats,
} from "@/lib/groups";
import { fetchGroupFeed, uploadCheckInPhoto, postActivityToGroups } from "@/lib/feed";
import { useCountUp } from "@/hooks/useCountUp";

export const Route = createFileRoute("/wall")({ component: Wall });

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };
const iosHoverSpring = { type: "spring" as const, stiffness: 300, damping: 22 };

const WALL_SLUG = "the-wall";

function Wall() {
  const qc = useQueryClient();

  const { data: wall } = useQuery({
    queryKey: ["wall", "group"],
    queryFn: () => fetchGroupBySlug(WALL_SLUG),
  });

  const { data: stats } = useQuery({
    queryKey: ["wall", "stats"],
    queryFn: () => (wall ? fetchGroupStats(wall.id) : null),
    enabled: !!wall,
  });

  const { data: feed = [], isLoading: loadingFeed } = useQuery({
    queryKey: ["group", "feed", WALL_SLUG],
    queryFn: () => (wall ? fetchGroupFeed(wall.id, 60) : []),
    enabled: !!wall,
    placeholderData: (previous) => previous ?? [],
  });

  return (
    <Layout>
      <PageHeader
        eyebrow="The champs tribe is moving"
        title="The Wall"
        subtitle="The tribe's public square. Show up, share your move, see everyone else doing the same. No rankings. No likes. Just champs."
      />

      {/* live tribe pulse */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={iosSpring}
          className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-soft"
        >
          <PulseStat label="champs moving" value={stats.active_members} />
          <span className="hidden sm:inline text-ink-muted">·</span>
          <PulseStat label="minutes" value={stats.total_minutes} />
          <span className="hidden sm:inline text-ink-muted">·</span>
          <PulseStat label="check-ins" value={stats.sessions_logged} />
          <span className="hidden sm:inline text-ink-muted">·</span>
          <PulseStat label="champs total" value={stats.total_members} />
        </motion.div>
      )}

      {/* COMPOSER */}
      {wall && <WallComposer wallId={wall.id} onPosted={() => qc.invalidateQueries({ queryKey: ["group", "feed", WALL_SLUG] })} />}

      {/* FEED */}
      <section className="mt-8">
        {loadingFeed ? (
          <div className="min-h-32" />
        ) : feed.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-[36px]">🌱</p>
            <p className="mt-3 sf-display text-[22px] text-navy">The wall is waiting.</p>
            <p className="mt-2 text-[13px] text-ink-soft">Be the first to show up for the tribe.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

function PulseStat({ label, value }: { label: string; value: number }) {
  const n = useCountUp(value, 900);
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="nums text-[15px] font-bold text-navy">{n}</span>
      <span className="text-[12px] text-ink-muted">{label}</span>
    </span>
  );
}

/* ─────────────────────────── Composer ─────────────────────────── */

const ACTIVITY_TYPES = [
  "Walking", "Running", "Cycling", "Yoga", "Stretching",
  "Strength Training", "Swimming", "Pilates", "HIIT", "Rowing", "Dance", "Other",
];

const INTENSITIES = ["Low", "Moderate", "High"] as const;
const MOODS = ["Energized", "Calm", "Motivated", "Tired but proud"] as const;

function WallComposer({ wallId, onPosted }: { wallId: string; onPosted: () => void }) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState("Walking");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<typeof INTENSITIES[number]>("Moderate");
  const [mood, setMood] = useState<typeof MOODS[number]>("Energized");
  const fileRef = useRef<HTMLInputElement>(null);

  const canShare = text.trim().length > 0 || !!photo;

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Photo too large — keep it under 8 MB.");
      return;
    }
    setPhoto(f);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  function reset() {
    setText("");
    setPhoto(null);
    setPhotoPreview(null);
    setExpanded(false);
    setType("Walking");
    setDuration(30);
    setIntensity("Moderate");
    setMood("Energized");
    if (fileRef.current) fileRef.current.value = "";
  }

  const shareMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Sign in again, champ.");

      const today = new Date().toISOString().slice(0, 10);

      const { data: act, error } = await supabase
        .from("activities")
        .insert({
          user_id,
          type,
          duration,
          intensity,
          mood,
          date: today,
          notes: text.trim() || null,
        })
        .select("id")
        .single();
      if (error || !act) throw error ?? new Error("Could not save the check-in");

      // Cross-post to The Wall (and let it count for streak)
      await postActivityToGroups(act.id, [wallId]);

      // Upload photo if present
      if (photo) {
        await uploadCheckInPhoto(act.id, photo).catch((err) => {
          console.warn("photo upload failed", err);
          toast.error("Post went up, but the photo didn't. Try again on edit.");
        });
      }
    },
    onSuccess: () => {
      toast.success("Shared with the tribe.");
      reset();
      onPosted();
    },
    onError: (err: any) => toast.error(err?.message ?? "Couldn't share. Try again."),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={iosSpring}
      className="glass rounded-3xl p-5 md:p-6"
    >
      {/* photo preview */}
      {photoPreview && (
        <div className="relative mb-3 overflow-hidden rounded-2xl">
          <img src={photoPreview} alt="" className="max-h-72 w-full object-cover" />
          <button
            type="button"
            onClick={() => { setPhoto(null); setPhotoPreview(null); }}
            className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm"
          >
            Remove
          </button>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={600}
        placeholder="Share today's move with the tribe…"
        className="focus-ios w-full resize-none rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-[15px] text-navy placeholder:text-ink-muted"
      />

      {/* expand-details panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 pt-4 md:grid-cols-2">
              <FieldLabel label="Type">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-3 py-2.5 text-[14px] text-navy"
                >
                  {ACTIVITY_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </FieldLabel>
              <FieldLabel label="Minutes">
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-3 py-2.5 text-[14px] text-navy"
                />
              </FieldLabel>
              <FieldLabel label="Intensity">
                <div className="flex gap-1.5">
                  {INTENSITIES.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIntensity(i)}
                      className={`flex-1 rounded-xl py-2 text-[12px] font-semibold transition-all ${intensity === i ? "bg-green text-white" : "bg-black/[0.04] text-navy hover:bg-black/[0.08]"}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </FieldLabel>
              <FieldLabel label="Mood">
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value as any)}
                  className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-3 py-2.5 text-[14px] text-navy"
                >
                  {MOODS.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </FieldLabel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* action bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickPhoto}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-2 text-[12px] font-semibold text-navy hover:bg-black/[0.08]"
          >
            📸 {photo ? "Change photo" : "Add photo"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 py-2 text-[12px] font-semibold text-navy hover:bg-black/[0.08]"
          >
            ⚙ Details {expanded ? "▴" : "▾"}
          </button>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => shareMutation.mutate()}
          disabled={!canShare || shareMutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-green px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.55)] disabled:opacity-40 disabled:shadow-none"
        >
          {shareMutation.isPending ? "Sharing…" : "Share with the champs"}
        </motion.button>
      </div>

      {!expanded && (
        <p className="mt-3 text-[11px] text-ink-muted">
          Defaults to {type.toLowerCase()} · {duration} min · {intensity.toLowerCase()} · {mood.toLowerCase()}. Tap <em>Details</em> to customize.
        </p>
      )}
    </motion.div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
