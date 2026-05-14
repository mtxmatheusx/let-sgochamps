import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import { ACTIVITY_TYPES, INTENSITIES, MOODS } from "@/lib/activities";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/addactivity")({ component: AddActivity });

function AddActivity() {
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
    qc.invalidateQueries({ queryKey: ["activities"] });
    toast.success("Activity logged! Keep going.");
    navigate({ to: "/" });
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Today is another chance"
        title="Log Today's Movement"
        subtitle="No pressure. No perfection. Just show up and record the work."
      />
      <form
        onSubmit={submit}
        className="grid max-w-2xl gap-5 rounded-3xl bg-card p-8 shadow-sm"
      >
        <Field label="Activity type">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={inputCls}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Duration" hint="How many minutes did you move?">
          <input
            type="number"
            min={1}
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>

        <Field label="Intensity">
          <select
            value={form.intensity}
            onChange={(e) => setForm({ ...form, intensity: e.target.value })}
            className={inputCls}
          >
            {INTENSITIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mood">
          <select
            value={form.mood}
            onChange={(e) => setForm({ ...form, mood: e.target.value })}
            className={inputCls}
          >
            {MOODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field label="Champion note" hint="Optional">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Example: I did not feel like moving, but I showed up anyway."
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex justify-center rounded-full bg-gold px-7 py-3 font-semibold text-navy transition hover:brightness-95 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Keep the Streak Going"}
        </button>
      </form>
    </Layout>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-green";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-navy">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
