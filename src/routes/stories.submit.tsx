import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/Layout";
import { submitStory } from "@/lib/stories";
import { ACTIVITY_TYPES } from "@/lib/activities";

export const Route = createFileRoute("/stories/submit")({ component: SubmitStory });

const MAX_VIDEO_MB = 50;
const MAX_VIDEO_SECONDS = 30;

function SubmitStory() {
  const [form, setForm] = useState({
    name: "",
    city: "",
    story: "",
    quote: "",
    activity_type: "",
    social_handle: "",
    permission_to_share: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError(null);
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setVideoError(`Video must be under ${MAX_VIDEO_MB}MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      if (vid.duration > MAX_VIDEO_SECONDS) {
        setVideoError(`Video must be ${MAX_VIDEO_SECONDS} seconds or less.`);
        URL.revokeObjectURL(url);
      } else {
        setVideo(file);
        setVideoName(file.name);
      }
    };
    vid.src = url;
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
      await submitStory(
        {
          name: form.name.trim(),
          city: form.city.trim(),
          story: form.story.trim(),
          quote: form.quote.trim() || null,
          activity_type: form.activity_type || null,
          social_handle: form.social_handle.trim() || null,
          permission_to_share: form.permission_to_share,
        },
        photo ?? undefined,
        video ?? undefined
      );
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
        {/* Name + City */}
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

        {/* Activity type */}
        <Field label="What kind of movement changed your life?">
          <select
            value={form.activity_type}
            onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">Choose an activity…</option>
            {[...ACTIVITY_TYPES, "Other"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        {/* Story */}
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

        {/* One-liner quote */}
        <Field label={`Your one-liner (optional) — ${form.quote.length}/120`}>
          <input
            type="text"
            maxLength={120}
            placeholder="In one sentence, what does movement mean to you?"
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            className={inputCls}
          />
          <p className="mt-1.5 text-xs text-sage/70">
            This could appear as a pull-quote on the site or social posts.
          </p>
        </Field>

        {/* Photo — UploadField avoids nested <label> inside Field's <label> */}
        <UploadField label="Photo (optional)">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-mist bg-cream/60 px-4 py-8 transition-colors hover:border-gold">
            <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
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
        </UploadField>

        {/* Short video */}
        <UploadField label="Short video — 30s max (optional)">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-mist bg-cream/60 px-4 py-8 transition-colors hover:border-gold">
            <input type="file" accept="video/*" onChange={handleVideo} className="sr-only" />
            {videoName ? (
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d5a1b" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p className="text-sm font-semibold text-navy">{videoName}</p>
              </div>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b8962e" strokeWidth="1.5" className="mb-3">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p className="text-sm font-semibold text-sage">Click to upload a video</p>
                <p className="mt-1 text-xs text-sage/70">MP4, MOV · Max 30 seconds · Max 50MB</p>
              </>
            )}
          </label>
          {videoError && (
            <p className="mt-2 text-sm text-red-500">{videoError}</p>
          )}
        </UploadField>

        {/* Social handle */}
        <Field label="Instagram or TikTok handle (optional)">
          <input
            type="text"
            placeholder="@yourhandle"
            value={form.social_handle}
            onChange={(e) => setForm({ ...form, social_handle: e.target.value })}
            className={inputCls}
          />
          <p className="mt-1.5 text-xs text-sage/70">
            So Aidan's team can tag you when sharing your story.
          </p>
        </Field>

        {/* Permission */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.permission_to_share}
            onChange={(e) => setForm({ ...form, permission_to_share: e.target.checked })}
            className="mt-1 h-4 w-4 accent-gold"
          />
          <span className="text-sm leading-relaxed text-sage">
            I give Let's Go Champs permission to share my story, photo, and video publicly on their
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

// Use instead of Field when children already contain a <label> (file uploads).
// A <label> cannot be nested inside another <label> — it breaks file input clicks.
function UploadField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span
        className="mb-2 block text-[13px] font-bold uppercase text-navy"
        style={{ letterSpacing: "1px" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
