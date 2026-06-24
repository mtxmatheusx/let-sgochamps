import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postComment, type FeedItem } from "@/lib/feed";

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };
const iosHoverSpring = { type: "spring" as const, stiffness: 300, damping: 22 };

const moodEmoji: Record<string, string> = {
  Energized: "⚡",
  Calm: "🌿",
  Motivated: "🔥",
  "Tired but proud": "💪",
};

function friendlyTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function FeedCard({ item }: { item: FeedItem }) {
  const [showComments, setShowComments] = useState(item.comments.length > 0);
  const [draft, setDraft] = useState("");
  const qc = useQueryClient();

  const commentMutation = useMutation({
    mutationFn: () => postComment(item.id, draft),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["group", "feed"] });
    },
    onError: () =>
      toast.error("Couldn't send your encouragement — try again in a moment."),
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={iosSpring}
      whileHover={{ y: -2, transition: iosHoverSpring }}
      className="glass overflow-hidden rounded-3xl"
    >
      {/* header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green/15 text-[13px] font-bold text-green">
          {item.author.avatar_url ? (
            <img
              src={item.author.avatar_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            initials(item.author.display_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-navy truncate">
            {item.author.display_name ?? "Anonymous champ"}
          </p>
          <p className="text-[11px] text-ink-muted">{friendlyTime(item.created_at)}</p>
        </div>
        <span className="pill pill-brand">{item.type}</span>
      </div>

      {/* photos */}
      {item.photos.length > 0 && (
        <div className="bg-black/[0.04]">
          {item.photos.length === 1 ? (
            <img
              src={item.photos[0].url}
              alt={item.photos[0].caption ?? ""}
              loading="lazy"
              decoding="async"
              className="w-full max-h-[460px] object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {item.photos.slice(0, 4).map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt={p.caption ?? ""}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* meta strip */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 text-[12.5px] text-ink-soft">
        <span className="nums font-bold text-navy">{item.duration} min</span>
        <span className="h-1 w-1 rounded-full bg-ink-muted/40" />
        <span>{item.intensity}</span>
        <span className="h-1 w-1 rounded-full bg-ink-muted/40" />
        <span>
          {moodEmoji[item.mood] ?? ""} {item.mood}
        </span>
      </div>

      {item.notes && (
        <p className="px-5 pb-3 text-[14px] leading-[1.5] text-navy">{item.notes}</p>
      )}

      {/* comments toggle */}
      <button
        type="button"
        onClick={() => setShowComments((v) => !v)}
        aria-expanded={showComments}
        className="w-full border-t border-black/[0.05] px-5 py-3 text-left text-[12px] font-semibold text-ink-soft transition-colors hover:bg-black/[0.02]"
      >
        {item.comments.length === 0
          ? "Be the first to encourage →"
          : `${item.comments.length} ${item.comments.length === 1 ? "comment" : "comments"} ${showComments ? "▴" : "▾"}`}
      </button>

      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-black/[0.02]"
          >
            <div className="space-y-2.5 px-5 py-4">
              {item.comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green/15 text-[10px] font-bold text-green">
                    {initials(c.author.display_name)}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl bg-white px-3.5 py-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-semibold text-navy truncate">
                        {c.author.display_name ?? "Champ"}
                      </span>
                      <span className="text-[10px] text-ink-muted">{friendlyTime(c.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-[1.45] text-navy">{c.body}</p>
                  </div>
                </div>
              ))}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) commentMutation.mutate();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Send some encouragement…"
                  maxLength={600}
                  className="focus-ios flex-1 rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[13px] text-navy placeholder:text-ink-muted"
                />
                <motion.button
                  type="submit"
                  disabled={!draft.trim() || commentMutation.isPending}
                  whileTap={{ scale: 0.94 }}
                  className="rounded-full bg-green px-4 py-2 text-[12px] font-bold text-white disabled:opacity-40"
                >
                  {commentMutation.isPending ? "…" : "Post"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
