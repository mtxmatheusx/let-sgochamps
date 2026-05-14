import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { ACTIVITY_TYPES, INTENSITIES, MOODS, computeStats, fetchActivities } from "@/lib/activities";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/log")({ component: LogMovement });

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
  const [celebration, setCelebration] = useState<{ activity: SavedActivity; streak: number } | null>(null);

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
    const { error } = await supabase.from("activities").insert({
      user_id,
      type: form.type,
      duration: Number(form.duration),
      intensity: form.intensity,
      mood: form.mood,
      date: form.date,
      notes: form.notes || null,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["activities"] });

    // Compute streak for celebration
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
          title="Log Today's Movement"
          subtitle="No pressure. No perfection. Just show up and record the work."
        />

        <form
          onSubmit={submit}
          className="mx-auto grid max-w-[680px] gap-6 rounded-[20px] bg-card p-10 sm:p-12 card-shadow"
        >
          <Field label="What did you do today?">
            <Select
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={ACTIVITY_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </Field>

          <Field label="How many minutes did you move?">
            <input
              type="number"
              min={1}
              placeholder="e.g. 45"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>

          <Field label="How hard did you go?">
            <Select
              value={form.intensity}
              onChange={(v) => setForm({ ...form, intensity: v })}
              options={INTENSITIES.map((i) => ({ value: i.value, label: i.label }))}
            />
          </Field>

          <Field label="How do you feel now?">
            <Select
              value={form.mood}
              onChange={(v) => setForm({ ...form, mood: v })}
              options={MOODS.map((m) => ({ value: m, label: m }))}
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Champion note (optional)">
            <textarea
              rows={5}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Example: I did not feel like moving, but I showed up anyway."
              className={`${inputCls} h-auto py-3`}
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-14 w-full rounded-full bg-gold text-[12px] font-extrabold uppercase text-navy transition-all duration-200 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60"
            style={{ letterSpacing: "1.5px" }}
          >
            {loading ? "Saving..." : "Keep the Streak Going"}
          </button>
        </form>
      </Layout>
    </>
  );
}

const inputCls =
  "w-full h-14 rounded-xl border-[1.5px] border-mist bg-[var(--cream-deep)] px-4 text-[16px] text-navy outline-none transition-all duration-200 focus:border-gold focus:border-l-[3px] focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-2 block text-[13px] font-bold uppercase text-navy"
        style={{ letterSpacing: "1px" }}
      >
        {label}
      </span>
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
