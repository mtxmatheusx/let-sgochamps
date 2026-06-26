import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import { fetchMyProfile, updateMyProfile, uploadAvatar, type MyProfile } from "@/lib/profiles";
import { geocodeMyLocation } from "@/lib/geocode.functions";


export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "My profile — LET'SGOCHAMPS" },
      { name: "description", content: "Edit your champ profile — photo, bio, and how the community finds you." },
    ],
  }),
});

const iosSoftSpring = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };

const inputCls =
  "focus-ios w-full h-[54px] rounded-2xl border border-transparent bg-black/[0.04] px-4 text-[15px] text-navy outline-none transition-all";

function ProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: fetchMyProfile,
  });

  const [form, setForm] = useState<MyProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && !form) setForm(profile);
  }, [profile, form]);

  // Auto-heal: if the champ has a city but no lat/lng, geocode silently so they
  // appear on the world map without needing to re-save their profile.
  useEffect(() => {
    if (!profile?.location || profile.location_lat != null) return;
    updateMyProfile({ location: profile.location }).catch(() => {});
  }, [profile?.id]);

  if (isLoading || !form) {
    return (
      <Layout>
        <div className="grid min-h-[40vh] place-items-center text-sage">Loading your profile…</div>
      </Layout>
    );
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await uploadAvatar(f);
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      await qc.invalidateQueries({ queryKey: ["champs"] });
      toast.success("Photo updated.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not upload photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await updateMyProfile({
        display_name: form.display_name?.trim() || null,
        bio: form.bio?.trim().slice(0, 300) || null,
        location: form.location?.trim() || null,
        website_url: form.website_url?.trim() || null,
        instagram_handle: form.instagram_handle?.trim().replace(/^@/, "") || null,
        favorite_movement: form.favorite_movement?.trim() || null,
        is_discoverable: form.is_discoverable,
      });
      // Geocode in the background so the champ shows up on the world map.
      const newLoc = form.location?.trim() || null;
      if (newLoc !== (profile?.location ?? null)) {
        geocodeMyLocation({ data: { location: newLoc } })
          .then(() => qc.invalidateQueries({ queryKey: ["champ-map"] }))
          .catch(() => {});
      }
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      await qc.invalidateQueries({ queryKey: ["champs"] });
      toast.success("Profile saved.");
      navigate({ to: "/champs/$userId", params: { userId: form.id } });

    } catch (err: any) {
      toast.error(err.message ?? "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Your champ identity"
        title="My profile"
        subtitle="A few details so other champs can find you and cheer you on."
      />

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={iosSoftSpring}
        onSubmit={save}
        className="relative grid max-w-[680px] gap-5 overflow-hidden rounded-[28px] glass p-8 sm:p-10"
      >
        <div className="orb" style={{ width: 300, height: 300, top: -100, right: -80, background: "#22c55e", opacity: 0.18 }} />

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt=""
                className="h-24 w-24 rounded-full object-cover ring-2 ring-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.3)]"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-black/[0.06] text-[28px] font-semibold text-navy/40">
                {(form.display_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-navy px-4 py-2 text-[12.5px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : form.avatar_url ? "Change photo" : "Upload photo"}
            </button>
            <p className="mt-2 text-[12px] text-sage">JPG or PNG, max 5 MB.</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </div>
        </div>

        <Field label="Display name">
          <input
            type="text"
            maxLength={60}
            value={form.display_name ?? ""}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="How champs see you"
            className={inputCls}
          />
        </Field>

        <Field label={`Bio (${(form.bio ?? "").length}/300)`}>
          <textarea
            rows={4}
            maxLength={300}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="One sentence about your movement, your why, or what you're working on."
            className={`${inputCls} h-auto py-3.5`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Location">
            <input
              type="text"
              maxLength={80}
              value={form.location ?? ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="City, Country"
              className={inputCls}
            />
          </Field>
          <Field label="Favorite movement">
            <input
              type="text"
              maxLength={60}
              value={form.favorite_movement ?? ""}
              onChange={(e) => setForm({ ...form, favorite_movement: e.target.value })}
              placeholder="Running, lifting, yoga…"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website">
            <input
              type="url"
              maxLength={200}
              value={form.website_url ?? ""}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://"
              className={inputCls}
            />
          </Field>
          <Field label="Instagram handle">
            <input
              type="text"
              maxLength={60}
              value={form.instagram_handle ?? ""}
              onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
              placeholder="@yourhandle"
              className={inputCls}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-black/[0.04] p-4">
          <div>
            <div className="text-[14px] font-semibold text-navy">Show me in the Champs directory</div>
            <div className="mt-0.5 text-[12.5px] text-sage">
              Other signed-in champs can find your profile and stats.
            </div>
          </div>
          <input
            type="checkbox"
            checked={form.is_discoverable}
            onChange={(e) => setForm({ ...form, is_discoverable: e.target.checked })}
            className="h-5 w-5 accent-green"
          />
        </label>

        <motion.button
          whileHover={{ scale: 1.015, y: -1 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={saving}
          className="relative mt-2 h-[54px] w-full rounded-2xl bg-blue text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,197,94,0.6)] hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </motion.button>
      </motion.form>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="relative block">
      <span className="mb-2 block text-[12px] font-semibold text-navy/80">{label}</span>
      {children}
    </label>
  );
}
