import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
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
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Enviamos um e-mail de confirmação. Verifique sua caixa de entrada para ativar sua conta.");
        } else {
          navigate({ to: "/" });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md rounded-[20px] bg-card p-10 card-shadow">
        <div className="mb-8 flex items-baseline gap-2.5">
          <span className="font-display text-[28px] leading-none text-gold">LGC</span>
          <span className="text-sm font-semibold tracking-wide text-navy">Move Your Way</span>
        </div>
        <p className="eyebrow mb-3 text-green">
          {mode === "signin" ? "Welcome back" : "Join the movement"}
        </p>
        <h1 className="font-serif text-3xl font-bold text-navy">
          {mode === "signin" ? "Show up again." : "Start showing up."}
        </h1>
        <p className="mt-3 text-sm text-sage">
          {mode === "signin"
            ? "Sign in to log your next movement."
            : "Create your account and stack the days."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label
              className="mb-2 block text-[12px] font-bold uppercase text-navy"
              style={{ letterSpacing: "1px" }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border-[1.5px] border-mist bg-[var(--cream-deep)] px-4 text-[15px] outline-none transition-all duration-200 focus:border-gold focus:border-l-[3px] focus:bg-white"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-[12px] font-bold uppercase text-navy"
              style={{ letterSpacing: "1px" }}
            >
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border-[1.5px] border-mist bg-[var(--cream-deep)] px-4 text-[15px] outline-none transition-all duration-200 focus:border-gold focus:border-l-[3px] focus:bg-white"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && (
            <p className="rounded-lg bg-green/10 p-3 text-sm text-green">{info}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-gold text-[12px] font-extrabold uppercase text-navy transition-all duration-200 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60"
            style={{ letterSpacing: "1.5px" }}
          >
            {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-sm text-sage hover:text-navy"
        >
          {mode === "signin" ? "No account? Sign up" : "Already have one? Sign in"}
        </button>
      </div>
    </div>
  );
}
