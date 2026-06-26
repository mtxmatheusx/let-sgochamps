import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, Flame, Globe2, Users, MapPin, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding, fetchOnboardingStatus, uploadAvatar } from "@/lib/profiles";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const ease = [0.22, 1, 0.36, 1] as const;

const ACTIVITIES = [
  "Walking", "Running", "Cycling", "Yoga", "Stretching", "Strength Training",
  "Swimming", "Pilates", "HIIT", "Rowing", "Dance", "Other",
];

const GOALS = [
  { value: "every_day", label: "Every day", hint: "The streak life" },
  { value: "most_days", label: "Most days", hint: "Consistent, not rigid" },
  { value: "few_week", label: "A few times a week", hint: "Steady and sustainable" },
];

const TOUR = [
  { Icon: Footprints, title: "Log the move", body: "Walked, ran, stretched, lifted — log it. Type, time, how it felt. Showing up is the whole game." },
  { Icon: Flame, title: "Your streak", body: "Consecutive days you showed up. Not to shame you — to make today's decision easy. Show up imperfectly." },
  { Icon: Globe2, title: "The Wall", body: "The tribe's square. Drop a photo or a note about today's move. No likes, no ranking — just champs cheering champs." },
  { Icon: Users, title: "Clubs & Challenges", body: "Move alongside people who notice when you go quiet. Gentle accountability, on purpose. Together we win." },
  { Icon: MapPin, title: "Champs around the world", body: "Every dot is a champ in motion. Your city just put you on it." },
  { Icon: Sprout, title: "Your Brilliance Coach", body: "Tap the tree anytime — stuck, low, or just curious. I built this from my own comeback. Ask me anything." },
];

const inputCls =
  "w-full rounded-2xl border border-[var(--line-strong)] bg-white/70 px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-muted outline-none transition focus-ios";

function Onboarding() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"data" | "tour">("data");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    location: "",
    goal: "",
    favorite_activities: [] as string[],
    bio: "",
    instagram_handle: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (!data.session) return navigate({ to: "/auth" });
      const done = await fetchOnboardingStatus();
      if (!alive) return;
      if (done) return navigate({ to: "/" });
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (!ready) return <div className="min-h-screen" />;

  const DATA_STEPS = 5;
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setErr(null);
    try {
      await uploadAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't upload that photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  function toggleActivity(a: string) {
    set({
      favorite_activities: form.favorite_activities.includes(a)
        ? form.favorite_activities.filter((x) => x !== a)
        : [...form.favorite_activities, a],
    });
  }

  // Save data + mark onboarded at the end of Phase 1, so the tour is optional and
  // closing mid-tour doesn't make the champ redo everything.
  async function saveAndStartTour() {
    if (!form.display_name.trim() || !form.location.trim()) {
      setErr("Your name and city — those two we need.");
      setStep(1);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await completeOnboarding({
        display_name: form.display_name,
        location: form.location,
        goal: form.goal || null,
        favorite_activities: form.favorite_activities,
        bio: form.bio || null,
        instagram_handle: form.instagram_handle || null,
      });
      setPhase("tour");
      setStep(0);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  function nextData() {
    setErr(null);
    if (step === 1 && (!form.display_name.trim() || !form.location.trim())) {
      setErr("Your name and city — those two we need.");
      return;
    }
    if (step < DATA_STEPS - 1) setStep((s) => s + 1);
    else saveAndStartTour();
  }

  function renderData() {
    switch (step) {
      case 0:
        return (
          <Block
            eyebrow="Welcome, champ"
            title="You showed up. That's the hardest part."
            sub="Let's Go Champs isn't about being the fittest — it's about being the one who keeps going. Couple minutes to find your place in the tribe, then we move."
          />
        );
      case 1:
        return (
          <Block title="Let's get you on the map." sub="Your name and your city. The city drops a dot on the world map — proof you're out there moving with the tribe.">
            <div className="mt-6 space-y-3">
              <input className={inputCls} placeholder="What does the tribe call you?" value={form.display_name} onChange={(e) => set({ display_name: e.target.value })} />
              <input className={inputCls} placeholder="Where do you move? (City, country)" value={form.location} onChange={(e) => set({ location: e.target.value })} />
            </div>
          </Block>
        );
      case 2:
        return (
          <Block title="Put a face to it." sub="A photo makes you real to the people cheering you on. Not ready? Skip it — add it whenever.">
            <div className="mt-6 flex flex-col items-center gap-4">
              <label className="grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-full border border-[var(--line-strong)] bg-white/60 text-ink-muted transition hover:bg-white/80">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[13px] font-semibold">{avatarBusy ? "Uploading…" : "+ Photo"}</span>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} />
              </label>
            </div>
          </Block>
        );
      case 3:
        return (
          <Block title="How do you want to show up?" sub="Consistency over intensity — a ten-minute walk every day beats a two-hour grind once a month. Pick your rhythm.">
            <div className="mt-5 grid gap-2">
              {GOALS.map((g) => (
                <button key={g.value} type="button" onClick={() => set({ goal: g.value })}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${form.goal === g.value ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--line-strong)] bg-white/60 hover:bg-white/80"}`}>
                  <span className="text-[15px] font-semibold text-ink">{g.label}</span>
                  <span className="text-[12px] text-ink-muted">{g.hint}</span>
                </button>
              ))}
            </div>
            <p className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-soft">What moves you?</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <button key={a} type="button" onClick={() => toggleActivity(a)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${form.favorite_activities.includes(a) ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--line-strong)] bg-white/60 text-ink hover:bg-white/80"}`}>
                  {a}
                </button>
              ))}
            </div>
          </Block>
        );
      case 4:
        return (
          <Block title="Say hi to the tribe." sub="One line about you, and where to find you. Optional — but it's how champs become friends.">
            <div className="mt-6 space-y-3">
              <textarea className={inputCls} rows={3} maxLength={300} placeholder="Walking my way back, one day at a time." value={form.bio} onChange={(e) => set({ bio: e.target.value })} />
              <input className={inputCls} placeholder="Instagram or TikTok (@yourhandle)" value={form.instagram_handle} onChange={(e) => set({ instagram_handle: e.target.value })} />
            </div>
          </Block>
        );
    }
  }

  function renderTour() {
    const t = TOUR[step];
    const { Icon } = t;
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
          <Icon size={30} strokeWidth={1.8} />
        </div>
        <p className="eyebrow mb-3 text-[var(--brand)]">You're in, champ — here's how we move together</p>
        <h1 className="sf-display text-[34px] sm:text-[40px]">{t.title}</h1>
        <p className="mx-auto mt-4 max-w-[420px] text-[16px] leading-[1.55] text-ink-soft">{t.body}</p>
      </div>
    );
  }

  function renderNav() {
    if (phase === "data") {
      const isFirst = step === 0;
      const isLast = step === DATA_STEPS - 1;
      const optional = step === 2 || step === 4; // avatar, bio
      return (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" onClick={() => !isFirst && setStep((s) => s - 1)}
            className={`btn btn-ghost ${isFirst ? "invisible" : ""}`}>Back</button>
          <div className="flex items-center gap-3">
            {optional && <button type="button" onClick={nextData} className="text-[14px] font-semibold text-ink-muted">Skip</button>}
            <button type="button" onClick={nextData} disabled={saving} className="btn btn-primary px-7">
              {saving ? "Saving…" : isFirst ? "I'm in" : isLast ? "Finish setup" : "Next"}
            </button>
          </div>
        </div>
      );
    }
    const isLast = step === TOUR.length - 1;
    return (
      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => navigate({ to: "/" })} className="text-[14px] font-semibold text-ink-muted">Skip tour</button>
        <button type="button" onClick={() => (isLast ? navigate({ to: "/" }) : setStep((s) => s + 1))} className="btn btn-primary px-7">
          {isLast ? "Start moving" : "Next"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="orb animate-float-orb" style={{ width: 460, height: 460, top: -130, left: -110, background: "#86efac" }} />
      <div className="orb animate-float-orb" style={{ width: 380, height: 380, bottom: -120, right: -80, background: "#5eead4", animationDelay: "-8s" }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[560px] flex-col px-5 py-8 sm:py-12">
        {phase === "data" && (
          <div className="mb-10 flex gap-1.5">
            {Array.from({ length: DATA_STEPS }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                style={{ background: i <= step ? "var(--brand)" : "var(--line-strong)" }} />
            ))}
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={phase + step}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease }}>
              {phase === "data" ? renderData() : renderTour()}
            </motion.div>
          </AnimatePresence>
          {err && <p className="mt-4 text-center text-[13px] text-red-500">{err}</p>}
        </div>

        {renderNav()}
      </div>
    </div>
  );
}

function Block({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div>
      {eyebrow && <p className="eyebrow mb-3 text-[var(--brand)]">{eyebrow}</p>}
      <h1 className="sf-display text-[34px] sm:text-[40px]">{title}</h1>
      {sub && <p className="mt-4 text-[16px] leading-[1.55] text-ink-soft">{sub}</p>}
      {children}
    </div>
  );
}
