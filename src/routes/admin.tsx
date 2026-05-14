import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layout, PageHeader } from "@/components/Layout";
import {
  adminFetchStories,
  adminUpdateStory,
  checkIsAdmin,
} from "@/lib/stories";
import type { Story } from "@/lib/stories";

export const Route = createFileRoute("/admin")({ component: AdminDashboard });

type Filter = "all" | "unread" | "featured" | "archived";

function AdminDashboard() {
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<Filter>("unread");
  const [selected, setSelected] = useState<Story | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["admin-stories", filter],
    queryFn: () => adminFetchStories(filter),
    enabled: isAdmin === true,
  });

  async function update(id: string, patch: Partial<Pick<Story, "status" | "is_pinned" | "reply">>) {
    setSaving(true);
    try {
      await adminUpdateStory(id, patch);
      await qc.invalidateQueries({ queryKey: ["admin-stories"] });
      if (selected?.id === id) setSelected(null);
      toast.success("Story updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function sendReply() {
    if (!selected || !replyDraft.trim()) return;
    await update(selected.id, { reply: replyDraft.trim() });
    setReplyDraft("");
  }

  function openStory(s: Story) {
    setSelected(s);
    setReplyDraft(s.reply ?? "");
  }

  function exportTxt() {
    const lines = stories.map(
      (s) =>
        `Name: ${s.name} | City: ${s.city} | Status: ${s.status} | ${s.created_at.slice(0, 10)}\n${s.story}\n${s.reply ? `[Reply]: ${s.reply}` : ""}\n---`
    );
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stories-${filter}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isAdmin === null) return <Layout><div className="min-h-[40vh]" /></Layout>;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="eyebrow mb-4 text-green">Access denied</p>
          <h2 className="font-serif text-3xl font-bold text-navy">
            You are not an admin.
          </h2>
          <p className="mt-3 text-sage">
            Contact Aidan's team to be added to the admin list.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Admin only"
          title="Stories Inbox"
          subtitle="Review, feature, reply to, or archive stories from your community."
        />
        <button
          onClick={exportTxt}
          className="mb-12 shrink-0 rounded-full border-[1.5px] border-mist px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.15em] text-sage transition-colors hover:border-gold hover:text-gold"
        >
          Export {filter !== "all" ? filter : "all"} (.txt)
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto">
        {(["unread", "featured", "archived", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-[0.12em] transition-all ${
              filter === f
                ? "bg-navy text-white"
                : "bg-card text-sage hover:text-navy"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Story list */}
        <div className="space-y-3 lg:col-span-2">
          {isLoading ? (
            <p className="text-sage">Loading...</p>
          ) : stories.length === 0 ? (
            <div className="rounded-[16px] bg-card p-8 text-center card-shadow">
              <p className="font-bold text-navy">No stories in "{filter}"</p>
            </div>
          ) : (
            stories.map((s) => (
              <button
                key={s.id}
                onClick={() => openStory(s)}
                className={`w-full rounded-[16px] p-5 text-left transition-all card-shadow hover:scale-[1.01] ${
                  selected?.id === s.id ? "border-2 border-gold bg-card" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy">{s.name}</p>
                    <p className="text-[13px] text-sage">{s.city} · {s.created_at.slice(0, 10)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={s.status} />
                    {s.is_pinned && (
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-gold">
                        Pinned
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] text-sage">{s.story}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-[20px] bg-card card-shadow">
              <p className="text-sage">Select a story to review</p>
            </div>
          ) : (
            <div className="rounded-[20px] bg-card p-8 card-shadow">
              {selected.photo_url && (
                <img
                  src={selected.photo_url}
                  alt={selected.name}
                  className="mb-6 h-48 w-full rounded-xl object-cover"
                />
              )}

              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">{selected.name}</p>
                  <p className="text-[13px] text-sage">
                    {selected.city} · {selected.created_at.slice(0, 10)}
                    {selected.permission_to_share && (
                      <span className="ml-2 text-green font-semibold">· Shared OK</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <p className="mt-4 text-[15px] leading-relaxed text-navy">{selected.story}</p>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap gap-2">
                {selected.status !== "featured" && (
                  <ActionBtn
                    label="Feature"
                    color="green"
                    disabled={saving}
                    onClick={() => update(selected.id, { status: "featured" })}
                  />
                )}
                {selected.status !== "archived" && (
                  <ActionBtn
                    label="Archive"
                    color="muted"
                    disabled={saving}
                    onClick={() => update(selected.id, { status: "archived" })}
                  />
                )}
                {selected.status !== "unread" && (
                  <ActionBtn
                    label="Mark Unread"
                    color="muted"
                    disabled={saving}
                    onClick={() => update(selected.id, { status: "unread" })}
                  />
                )}
                <ActionBtn
                  label={selected.is_pinned ? "Unpin" : "Pin as Story of Week"}
                  color="gold"
                  disabled={saving}
                  onClick={() => update(selected.id, { is_pinned: !selected.is_pinned })}
                />
              </div>

              {/* Reply */}
              <div className="mt-6">
                <p
                  className="mb-2 text-[12px] font-bold uppercase text-navy"
                  style={{ letterSpacing: "1px" }}
                >
                  Message from Aidan (shown publicly)
                </p>
                <textarea
                  rows={4}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Write a personal note to this champion..."
                  className="w-full rounded-xl border-[1.5px] border-mist bg-cream/60 px-4 py-3 text-[15px] text-navy outline-none transition-all focus:border-gold focus:border-l-[3px] focus:bg-white"
                />
                <button
                  onClick={sendReply}
                  disabled={saving || !replyDraft.trim()}
                  className="mt-3 rounded-full bg-navy px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.15em] text-white transition-all hover:bg-gold hover:text-navy disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Reply"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatusBadge({ status }: { status: Story["status"] }) {
  const map = {
    unread: { bg: "bg-blue-100", text: "text-blue-700" },
    featured: { bg: "bg-green/10", text: "text-green" },
    archived: { bg: "bg-mist/60", text: "text-sage" },
  };
  const s = map[status];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${s.bg} ${s.text}`}
    >
      {status}
    </span>
  );
}

function ActionBtn({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: "green" | "gold" | "muted";
  onClick: () => void;
  disabled: boolean;
}) {
  const cls = {
    green: "bg-green text-white hover:brightness-110",
    gold: "bg-gold text-navy hover:brightness-110",
    muted: "border border-mist text-sage hover:border-navy hover:text-navy",
  }[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all disabled:opacity-50 ${cls}`}
    >
      {label}
    </button>
  );
}
