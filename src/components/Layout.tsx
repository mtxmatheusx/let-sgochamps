import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/addactivity", label: "Add Activity" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
  { to: "/demo", label: "Demo" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/auth" });
  }, [ready, session, navigate]);

  if (!ready) return <div className="min-h-screen" />;
  if (!session) return null;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Move Your Way
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            {links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm transition-colors ${
                    active ? "text-gold font-semibold" : "text-cream/80 hover:text-gold"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              onClick={() => supabase.auth.signOut()}
              className="ml-2 text-xs text-cream/60 hover:text-gold"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-10">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-green">
          {eyebrow}
        </p>
      )}
      <h1 className="text-4xl font-bold text-navy sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-2xl text-base text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
