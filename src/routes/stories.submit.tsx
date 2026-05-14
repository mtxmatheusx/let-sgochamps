import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/Layout";
import { submitStory } from "@/lib/stories";

export const Route = createFileRoute("/stories/submit")({ component: SubmitStory });

function SubmitStory() {
  const [form, setForm] = useState({
    name: "",
    city: "",
    story: "",
    permission_to_share: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.city.trim() || !form.story.trim()) {
      setError("Please fill in your name, city, and story.");
      return;
    }
    setLoading(true);
    try {
      await submitStory(form, photo ?? undefined);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <PublicLayout>
        <div className="mx-auto flex max-w-[600px] flex-col items-center py-24 text-center">
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: "var(--green-dark)" }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="eyebrow mb-4 text-green">Story received</p>
          <h2 className="font-serif text-3xl font-bold text-navy sm:text-4xl">
            Thank you, Champion.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-sage">
            Your story has been submitted to Aidan's team. If selected, it may
            be featured on this wall or spotlighted on Let's Go Champs content.
          </p>
          <p className="mt-2 text-sm text-sage">Keep moving. Keep showing up.</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Make your mark"
        title="Share Your Story"
        subtitle="Tell us how movement has changed your life. Aidan's team reads every submission."
      />

      <form
        onSubmit={submit}
        className="mx-auto grid max-w-[680px] gap-6 rounded-[20px] bg-card p-10 sm:p-12 card-shadow"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Your name">
            <input
              type="text"
              placeholder="First name is fine"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Your city">
            <input
              type="text"
              placeholder="Where are you from?"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
        </div>

        <Field label="Your story">
          <textarea
            rows={7}
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
            placeholder="How has movement changed things for you? What did you overcome? What do you want others to know?"
            className={`${inputCls} h-auto py-3`}
            required
          />
        </Field>

        <Field label="Photo (optional)">
          <label
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-mist bg-cream/60 px-4 py-8 transition-colors hover:border-gold"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="sr-only"
            />
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="max-h-40 rounded-lg object-cover" />
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b8962e" strokeWidth="1.5" className="mb-3">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p className="text-sm font-semibold text-sage">Click to upload a photo</p>
                <p className="mt-1 text-xs text-sage/70">JPG, PNG, WEBP · Max 10MB</p>
              </>
            )}
          </label>
        </Field>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.permission_to_share}
            onChange={(e) => setForm({ ...form, permission_to_share: e.target.checked })}
            className="mt-1 h-4 w-4 accent-gold"
          />
          <span className="text-sm leading-relaxed text-sage">
            I give Let's Go Champs permission to share my story publicly on their
            website and social media channels.
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-14 w-full rounded-full bg-gold text-[12px] font-extrabold uppercase text-navy transition-all duration-200 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60"
          style={{ letterSpacing: "1.5px" }}
        >
          {loading ? "Sending..." : "Send My Story to Aidan"}
        </button>
      </form>
    </PublicLayout>
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
