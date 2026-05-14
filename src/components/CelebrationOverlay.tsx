import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const QUOTES = [
  "Small steps, every day. That's the whole game.",
  "You didn't feel like it. You did it anyway. That's the difference.",
  "Showing up is the skill. You just practiced it.",
  "The streak isn't motivation — the streak is proof.",
  "One more day. One more win. Let's go.",
  "Champions aren't built in one workout. They're built in moments like this.",
];

function streakMessage(streak: number) {
  if (streak >= 30) return `🔥 ${streak} days. You are the standard.`;
  if (streak >= 7)  return `🔥 ${streak}-day streak. You're locked in.`;
  if (streak === 1) return "🔥 You started your streak. Keep going.";
  return `🔥 ${streak}-day streak. Stay locked in.`;
}

type Props = {
  streak: number;
  activity: { type: string; duration: number; intensity: string; mood: string; date: string };
  onDismiss: () => void;
};

export function CelebrationOverlay({ streak, activity, onDismiss }: Props) {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  // fire confetti once on mount
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.5 },
      colors: ["#b8962e", "#ffffff", "#2d5a1b", "#f5f0e8"],
      disableForReducedMotion: true,
    });
  }, []);

  // close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(13,17,23,0.96)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Celebration"
    >
      <div className="fade-up flex w-full max-w-[540px] flex-col items-center text-center">
        {/* Trophy */}
        <span style={{ fontSize: 72, lineHeight: 1 }}>🏆</span>

        {/* Headline */}
        <h1
          className="mt-5 font-display text-white"
          style={{ fontSize: "clamp(52px, 10vw, 80px)", lineHeight: 0.95 }}
        >
          YOU SHOWED UP.
        </h1>

        {/* Subheadline */}
        <p
          className="mt-3 font-serif text-[22px] italic"
          style={{ color: "#b8962e" }}
        >
          That&rsquo;s what Champs do.
        </p>

        {/* Streak badge */}
        {streak > 0 && (
          <span
            className="mt-5 inline-block rounded-full px-5 py-2 text-[14px] font-bold text-white"
            style={{ background: "#2d5a1b" }}
          >
            {streakMessage(streak)}
          </span>
        )}

        {/* Quote */}
        <p
          className="mt-6 max-w-[380px] text-[16px] italic leading-relaxed"
          style={{ color: "#8a9e82" }}
        >
          &ldquo;{quote}&rdquo;
        </p>

        {/* Activity summary */}
        <div
          className="mt-7 w-full rounded-[16px] px-7 py-5"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-[18px] font-bold text-white">{activity.type}</p>
          <p className="mt-1 text-[14px]" style={{ color: "#8a9e82" }}>
            {activity.duration} min &middot; {activity.intensity} &middot; {activity.mood}
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: "#8a9e82" }}>
            {activity.date}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="mt-8 w-full max-w-[320px] rounded-full py-4 text-[12px] font-extrabold uppercase text-navy transition-all duration-200 hover:brightness-110"
          style={{ background: "#b8962e", letterSpacing: "1.5px" }}
        >
          Back to Dashboard
        </button>

        {/* Skip */}
        <button
          onClick={onDismiss}
          className="mt-3 text-[13px] underline underline-offset-2 transition-opacity hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
