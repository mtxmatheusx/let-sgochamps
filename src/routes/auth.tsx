import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const ease = [0.22, 1, 0.36, 1] as const;

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "update">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // Detect Supabase password-recovery hash (from reset email link)
    if (window.location.hash.includes("type=recovery")) {
      setMode("update");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("We sent you a confirmation email. Check your inbox to activate your account.");
        } else {
          navigate({ to: "/" });
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setInfo("Check your email — we sent a link to reset your password.");
      } else if (mode === "update") {
        if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setInfo("Password updated! Signing you in…");
        setTimeout(() => navigate({ to: "/" }), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream px-4 py-10">
      {/* Floating colored orbs behind the glass */}
      <div className="orb animate-float-orb" style={{ width: 520, height: 520, top: -120, left: -80, background: "#22c55e" }} />
      <div
        className="orb animate-float-orb"
        style={{ width: 460, height: 460, bottom: -160, right: -120, background: "#22c55e", animationDelay: "-8s" }}
      />
      <div
        className="orb animate-float-orb"
        style={{ width: 380, height: 380, top: "40%", left: "55%", background: "#22c55e", animationDelay: "-15s", opacity: 0.4 }}
      />

      {/* Top bar */}
      <div className="relative z-10 mx-auto flex max-w-[1100px] items-center justify-between px-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-[17px] font-semibold tracking-tight text-navy">
            Let's Go Champs
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </Link>
        <span className="text-[12px] text-sage">Move Your Way</span>
      </div>

      {/* Centered glass card */}
      <div className="relative z-10 mx-auto mt-10 flex max-w-md justify-center sm:mt-16">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease }}
          className="w-full glass-strong rounded-[28px] p-8 sm:p-10"
        >
          {/* Segmented control — hidden on forgot/update modes */}
          {(mode === "signin" || mode === "signup") && (
            <div className="relative mx-auto mb-8 flex w-full max-w-[280px] rounded-full bg-black/[0.06] p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setInfo(null);
                  }}
                  className={`relative z-10 flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors ${
                    mode === m ? "text-navy" : "text-sage hover:text-navy"
                  }`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                      transition={{ duration: 0.4, ease }}
                    />
                  )}
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          <motion.h1
            key={mode + "-title"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="sf-display text-[40px] text-navy"
          >
            {mode === "signin" && "Welcome back."}
            {mode === "signup" && "Start moving."}
            {mode === "forgot" && "Reset password."}
            {mode === "update" && "New password."}
          </motion.h1>
          <p className="mt-2 text-[15px] text-sage">
            {mode === "signin" && "Sign in to log your next movement."}
            {mode === "signup" && "Create your account and stack the days."}
            {mode === "forgot" && "Enter your email and we'll send a reset link."}
            {mode === "update" && "Choose a new password for your account."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            {/* Email — shown on signin, signup, forgot */}
            {mode !== "update" && (
              <FloatingInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
            )}

            {/* Password — shown on signin, signup */}
            {(mode === "signin" || mode === "signup") && (
              <FloatingInput
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                required
                minLength={6}
              />
            )}

            {/* New password — shown on update */}
            {mode === "update" && (
              <FloatingInput
                label="New password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                required
                minLength={6}
              />
            )}

            {/* Forgot password link — only on signin */}
            {mode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
                  className="text-[13px] text-sage underline underline-offset-2 hover:text-navy transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[13px] text-destructive"
                >
                  {error}
                </motion.p>
              )}
              {info && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl bg-green/10 p-3 text-[13px] text-green"
                >
                  {info}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="mt-2 h-[52px] w-full rounded-2xl bg-blue text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(34,197,94,0.55)] transition-all duration-200 hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}
            </motion.button>
          </form>

          {/* Back to sign in link — on forgot/update modes */}
          {(mode === "forgot" || mode === "update") && (
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
              className="mt-5 flex w-full items-center justify-center gap-1.5 text-[13px] text-sage hover:text-navy transition-colors"
            >
              <span>←</span> Back to sign in
            </button>
          )}

          {(mode === "signin" || mode === "signup") && (
            <p className="mt-6 text-center text-[12px] text-sage">
              By continuing you agree to keep showing up.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const float = focused || value.length > 0;
  return (
    <div className="relative">
      <label
        className={`pointer-events-none absolute left-4 transition-all duration-200 ${
          float
            ? "top-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue"
            : "top-1/2 -translate-y-1/2 text-[15px] text-sage"
        }`}
      >
        {label}
      </label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="focus-ios h-[58px] w-full rounded-2xl border border-transparent bg-black/[0.04] px-4 pb-1 pt-5 text-[15px] text-navy outline-none transition-all"
      />
    </div>
  );
}
