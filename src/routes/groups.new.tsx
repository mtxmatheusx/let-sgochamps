import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Layout, PageHeader } from "@/components/Layout";
import { createGroup, type GroupType, type ScoringMode } from "@/lib/groups";
import { toast } from "sonner";

export const Route = createFileRoute("/groups/new")({ component: NewGroup });

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };

function NewGroup() {
  const navigate = useNavigate();
  const [type, setType] = useState<GroupType>("club");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scoringMode, setScoringMode] = useState<ScoringMode>("days_active");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give it a name first.");
      return;
    }
    if (type === "challenge" && (!startDate || !endDate)) {
      toast.error("A challenge needs a start and end date.");
      return;
    }
    setSubmitting(true);
    try {
      const group = await createGroup({
        name,
        type,
        description,
        is_public: isPublic,
        start_date: type === "challenge" ? startDate : null,
        end_date: type === "challenge" ? endDate : null,
        scoring_mode: scoringMode,
      });
      toast.success("Group created.");
      navigate({ to: "/groups/$slug", params: { slug: group.slug } });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create the group.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="New group"
        title={type === "club" ? "Start a Club." : "Start a Challenge."}
        subtitle={
          type === "club"
            ? "A Club is your permanent community. Family, team, neighbourhood, project. It runs forever."
            : "A Challenge is a season with a beginning and an end. Pick a window, invite some champs, move together."
        }
      />

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={iosSpring}
        onSubmit={handleSubmit}
        className="glass max-w-2xl space-y-7 rounded-3xl p-7 md:p-9"
      >
        {/* Type toggle */}
        <div>
          <label className="eyebrow mb-3 block">Type</label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/[0.04] p-1">
            {(["club", "challenge"] as GroupType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.1em] transition-all ${
                  type === t ? "bg-white text-navy shadow-sm" : "text-ink-soft hover:text-navy"
                }`}
              >
                {t === "club" ? "Club" : "Challenge"}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="eyebrow mb-2 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={type === "club" ? "Morning Walkers" : "30-day Movement Reset"}
            className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-[15px] text-navy"
          />
        </div>

        {/* Description */}
        <div>
          <label className="eyebrow mb-2 block">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What is this group about?"
            className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-[14px] text-navy"
          />
        </div>

        {/* Date range (challenge only) */}
        {type === "challenge" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow mb-2 block">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-[14px] text-navy"
              />
            </div>
            <div>
              <label className="eyebrow mb-2 block">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-[14px] text-navy"
              />
            </div>
          </div>
        )}

        {/* Scoring mode */}
        <div>
          <label className="eyebrow mb-3 block">How we count showing up</label>
          <div className="space-y-2">
            {([
              ["days_active", "Days active", "One point per day with at least one check-in. (default — closest to the Brilliance Tree's emphasis on structure)"],
              ["check_in_count", "Check-in count", "One point per check-in logged."],
              ["metrics_minutes", "Minutes moved", "Sum of duration across all check-ins."],
            ] as Array<[ScoringMode, string, string]>).map(([val, label, hint]) => (
              <label
                key={val}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                  scoringMode === val
                    ? "border-green/40 bg-green/[0.04]"
                    : "border-black/[0.06] bg-white hover:border-black/[0.12]"
                }`}
              >
                <input
                  type="radio"
                  name="scoring"
                  value={val}
                  checked={scoringMode === val}
                  onChange={() => setScoringMode(val)}
                  className="mt-0.5 accent-green"
                />
                <div>
                  <p className="text-[14px] font-semibold text-navy">{label}</p>
                  <p className="mt-0.5 text-[12px] leading-[1.45] text-ink-soft">{hint}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Public toggle */}
        <label className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 accent-green"
          />
          <div>
            <p className="text-[14px] font-semibold text-navy">Public group</p>
            <p className="mt-0.5 text-[12px] leading-[1.45] text-ink-soft">
              Anyone with the link can find and join. Leave off for private (invite-only) groups.
            </p>
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-full bg-green px-7 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(22,163,74,0.65)] disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create group ›"}
          </motion.button>
          <Link to="/groups" className="text-[13px] font-medium text-ink-soft hover:text-navy">
            Cancel
          </Link>
        </div>
      </motion.form>
    </Layout>
  );
}
