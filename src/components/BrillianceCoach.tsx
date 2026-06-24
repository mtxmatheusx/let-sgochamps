import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

const iosSpring = { type: "spring" as const, stiffness: 220, damping: 26 };

const SUGGESTED = [
  "What is the Brilliance Tree?",
  "How does my streak work?",
  "What's The Wall?",
  "Tell me about GROWTH^E",
];

export function BrillianceCoach() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!session) return null; // only show to logged-in champs

  async function send(text?: string) {
    const body = (text ?? input).trim();
    if (!body || loading) return;

    const userMsg: Message = { role: "user", content: body };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      // invoke() targets the project's own function URL and automatically attaches
      // the signed-in user's bearer token. When the function is later switched to
      // verify_jwt=true, this keeps working and anonymous abuse is shut out.
      const { data, error } = await supabase.functions.invoke<{ reply?: string }>(
        "brilliance-coach",
        { body: { messages: next } },
      );
      if (error) {
        console.error("[BrillianceCoach] invoke error:", error.message);
        throw error;
      }
      if (!data?.reply) {
        console.error("[BrillianceCoach] unexpected response:", data);
        throw new Error("Empty reply from coach");
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      console.error("[BrillianceCoach] caught:", err?.message ?? err);
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "I'm having trouble right now — please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        initial={false}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green shadow-[0_8px_32px_-8px_rgba(22,163,74,0.6)] transition-all hover:brightness-110"
        aria-label="Open Brilliance Coach"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.2 }}
              className="text-white text-[22px] leading-none"
            >
              ✕
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
              className="text-[24px] leading-none"
            >
              🌳
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={iosSpring}
            role="dialog"
            aria-label="Brilliance Coach"
            className="fixed bottom-24 right-6 z-50 flex w-[min(380px,calc(100vw-24px))] flex-col rounded-[28px] bg-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.18)] border border-black/[0.06] overflow-hidden"
            style={{ height: "min(520px, calc(100dvh - 120px))" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-4">
              <span className="text-[26px] leading-none">🌳</span>
              <div>
                <p className="text-[14px] font-bold text-navy leading-tight">Brilliance Coach</p>
                <p className="text-[11px] text-ink-muted">Powered by the Brilliance Tree</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-[13px] text-ink-soft leading-relaxed">
                    Hey champ 👋 I know the Brilliance Tree framework inside out. Ask me anything about the app, the philosophy, or how to make the most of your journey.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    {SUGGESTED.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-2xl border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-left text-[12px] font-medium text-navy hover:bg-black/[0.05] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-[18px] px-4 py-3 text-[13px] leading-[1.55] ${
                      m.role === "user"
                        ? "bg-green text-white rounded-br-[6px]"
                        : "bg-black/[0.04] text-navy rounded-bl-[6px]"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-[18px] rounded-bl-[6px] bg-black/[0.04] px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-black/[0.06] px-4 py-3 flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask anything…"
                aria-label="Message the Brilliance Coach"
                className="flex-1 resize-none rounded-2xl border border-black/[0.08] bg-black/[0.03] px-3.5 py-2.5 text-[13px] text-navy placeholder:text-ink-muted outline-none focus:border-green/40 transition-colors"
                style={{ maxHeight: 100 }}
              />
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => send()}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green text-white disabled:opacity-30 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 19-7z" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-ink-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
