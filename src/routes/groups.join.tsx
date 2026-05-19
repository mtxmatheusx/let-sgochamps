import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout, PageHeader } from "@/components/Layout";
import { joinByCode } from "@/lib/groups";
import { toast } from "sonner";

export const Route = createFileRoute("/groups/join")({
  component: JoinGroup,
  validateSearch: (s: Record<string, unknown>) => ({ code: typeof s.code === "string" ? s.code : undefined }),
});

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };

function JoinGroup() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/groups/join" });
  const [code, setCode] = useState((search as any).code ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!code.trim()) {
      toast.error("Paste the invite code first.");
      return;
    }
    setSubmitting(true);
    try {
      const { slug } = await joinByCode(code);
      toast.success("You're in.");
      navigate({ to: "/groups/$slug", params: { slug } });
    } catch (err: any) {
      const msg = err?.message ?? "Invalid invite code.";
      toast.error(msg.includes("expired") ? "This invite has expired." : msg.includes("used_up") ? "This invite has reached its limit." : msg.includes("not_found") ? "We couldn't find that invite." : msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-submit if a code arrived in the URL
  useEffect(() => {
    if ((search as any).code && !submitting) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <PageHeader
        eyebrow="Join a group"
        title="Got an invite code?"
        subtitle="Paste the code a friend or admin shared with you to join their Club or Challenge."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={iosSpring}
        className="glass max-w-xl rounded-3xl p-7 md:p-9"
      >
        <label className="eyebrow mb-2 block">Invite code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          maxLength={32}
          className="focus-ios w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3.5 text-center text-[20px] font-bold tracking-[0.15em] text-navy"
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <motion.button
            type="button"
            onClick={submit}
            disabled={submitting}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-full bg-green px-7 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_-8px_rgba(22,163,74,0.65)] disabled:opacity-50"
          >
            {submitting ? "Joining…" : "Join group ›"}
          </motion.button>
          <Link to="/groups" className="text-[13px] font-medium text-ink-soft hover:text-navy">
            Cancel
          </Link>
        </div>
      </motion.div>
    </Layout>
  );
}
