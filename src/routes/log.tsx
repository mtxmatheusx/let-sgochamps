import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { ACTIVITY_TYPES, INTENSITIES, MOODS, computeStats, fetchActivities } from "@/lib/activities";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyGroups } from "@/lib/groups";
import { uploadCheckInPhoto, postActivityToGroups } from "@/lib/feed";

export const Route = createFileRoute("/log")({ component: LogMovement });

const ease = [0.22, 1, 0.36, 1] as const;
const iosSpring = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.9 };
const iosSoftSpring = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };
const iosPillSpring = { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.8 };

const fieldVariants = {
  hidden: { opacity: 1, y: 0 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...iosSoftSpring, delay: i * 0.015 },
  }),
};

type SavedActivity = {
  type: string;
  duration: number;
  intensity: string;
  mood: string;
  date: string;
};

function LogMovement() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    type: ACTIVITY_TYPES[0] as string,
    duration: 30,
    intensity: "Moderate",
    mood: "Energized",
    date: today,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [celebration, setCelebration] = useState<{ activity: SavedActivity; streak: number } | null>(null);

  const { data: myGroups = [] } = useQuery({
    queryKey: ["my-groups"],
    queryFn: fetchMyGroups,
    placeholderData: (previous) => previous ?? [],
  });

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) {
      toast.error("Please sign in again.");
      setLoading(false);
      return;
    }
    const { data: inserted, error } = await supabase
      .from("activities")
      .insert({
        user_id,
        type: form.type,
        duration: Number(form.duration),
        intensity: form.intensity,
        mood: form.mood,
        date: form.date,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setLoading(false);
      toast.error(error?.message ?? "Could not save the check-in.");
      return;
    }

    // Photo + group cross-posting run in parallel; failures don't block the streak
    const tasks: Promise<unknown>[] = [];
    if (photo) tasks.push(uploadCheckInPhoto(inserted.id, photo).catch((err) => toast.error("Photo failed to upload: " + err.message)));
    if (selectedGroupIds.length > 0)
      tasks.push(postActivityToGroups(inserted.id, selectedGroupIds).catch((err) => toast.error("Couldn't post to all groups: " + err.message)));
    await Promise.all(tasks);

    setLoading(false);

    await qc.invalidateQueries({ queryKey: ["activities"] });
    await qc.invalidateQueries({ queryKey: ["group", "feed"] });
    const allActivities = await fetchActivities();
    const { streak } = computeStats(allActivities);
    setCelebration({
      activity: {
        type: form.type,
        duration: Number(form.duration),
        intensity: form.intensity,
        mood: form.mood,
        date: form.date,
      },
      streak,
    });
  }

  function dismiss() {
    setCelebration(null);
    navigate({ to: "/" });
  }

  return (
    <>
      {celebration && (
        <CelebrationOverlay
          streak={celebration.streak}
          activity={celebration.activity}
          onDismiss={dismiss}
        />
      )}

      <Layout>
        <PageHeader
          eyebrow="Today is another chance"
          title="Log today's movement"
          subtitle="No pressure. No perfection. Just show up and record the work."
        />

        <motion.form
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...iosSoftSpring, duration: 0.18 }}
          onSubmit={submit}
          className="relative grid max-w-[680px] gap-5 overflow-hidden rounded-[28px] glass p-8 sm:p-10"
        >
          <div className="orb" style={{ width: 300, height: 300, top: -100, right: -80, background: "#22c55e", opacity: 0.18 }} />
          <div className="orb" style={{ width: 280, height: 280, bottom: -120, left: -60, background: "#22c55e", opacity: 0.15 }} />

          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
            <Field label="What did you do today?">
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                options={ACTIVITY_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </Field>
          </motion.div>

          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
            <Field label="How many minutes?">
              <input
                type="number"
                min={1}
                placeholder="e.g. 45"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
          </motion.div>

          <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
            <Field label="How hard did you go?">
              <Segmented
                value={form.intensity}
                onChange={(v) => setForm({ ...form, intensity: v })}
                options={INTENSITIES.map((i) => ({ value: i.value, label: i.value }))}
                groupId="intensity"
              />
            </Field>
          </motion.div>

          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
            <Field label="How do you feel now?">
              <Segmented
                value={form.mood}
                onChange={(v) => setForm({ ...form, mood: v })}
                options={MOODS.map((m) => ({ value: m, label: m }))}
                groupId="mood"
              />
            </Field>
          </motion.div>

          <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
            <Field label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputCls}
              />
            </Field>
          </motion.div>

          <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="show">
            <Field label="Champion note (optional)">
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="I didn't feel like moving, but I showed up anyway."
                className={`${inputCls} h-auto py-3.5`}
              />
            </Field>
          </motion.div>

          {/* Photo upload */}
          <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="show">
            <Field label="Photo (optional)">
              {photoPreview ? (
                <div className="relative overflow-hidden rounded-2xl">
                  <img src={photoPreview} alt="" className="max-h-72 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex h-[88px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-black/[0.10] bg-black/[0.02] text-center transition-colors hover:border-green/40 hover:bg-green/[0.04]">
                  <span className="text-[22px]">📸</span>
                  <span className="text-[12px] font-semibold text-ink-soft">Add a photo of today's win</span>
                  <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                </label>
              )}
            </Field>
          </motion.div>

          {/* Cross-post to groups */}
          {myGroups.length > 0 && (
            <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="show">
              <Field label="Share with your groups (optional)">
                <div className="flex flex-wrap gap-2">
                  {myGroups.map((g) => {
                    const on = selectedGroupIds.includes(g.id);
                    return (
                      <motion.button
                        key={g.id}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ y: -1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 26 }}
                        onClick={() => toggleGroup(g.id)}
                        className={`rounded-full px-4 py-2 text-[12.5px] font-semibold ${
                          on
                            ? "bg-green text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.55)]"
                            : "bg-black/[0.04] text-navy hover:bg-black/[0.08]"
                        }`}
                      >
                        {on ? "✓ " : ""}
                        {g.name}
                      </motion.button>
                    );
                  })}
                </div>
              </Field>
            </motion.div>
          )}

          <motion.button
            custom={8}
            variants={fieldVariants}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="relative mt-2 h-[54px] w-full rounded-2xl bg-blue text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,197,94,0.6)] hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Keep the streak going"}
          </motion.button>
        </motion.form>
      </Layout>
    </>
  );
}

const inputCls =
  "focus-ios w-full h-[54px] rounded-2xl border border-transparent bg-black/[0.04] px-4 text-[15px] text-navy outline-none transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="relative block">
      <span className="mb-2 block text-[12px] font-semibold text-navy/80">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-12`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sage"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
  groupId,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  groupId: string;
}) {
  return (
    <div className="relative flex w-full rounded-2xl bg-black/[0.05] p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative z-10 flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors ${
              active ? "text-navy" : "text-sage hover:text-navy"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${groupId}`}
                className="absolute inset-0 -z-10 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                transition={iosPillSpring}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
