import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/log", label: "Log Movement" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
] as const;

const publicLinks = [
  { to: "/about", label: "About" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/auth" });
  }, [ready, session, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  if (!ready) return <div className="min-h-screen bg-cream" />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-cream">
      <nav
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(7,27,47,0.85)" : "#071b2f",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6 sm:px-[6%]">
          <Link to="/" className="flex items-baseline gap-2.5">
            <span className="font-display text-[22px] leading-none tracking-wide text-gold">LGC</span>
            <span className="hidden text-sm font-semibold tracking-wide text-white sm:inline">
              Move Your Way
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="relative text-sm font-semibold text-white/90 transition-colors hover:text-gold"
                >
                  {l.label}
                  <span
                    className="absolute -bottom-2 left-0 h-[2px] bg-gold transition-all duration-300"
                    style={{ width: active ? "100%" : "0%" }}
                  />
                </Link>
              );
            })}
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60 hover:text-gold"
            >
              Sign out
            </button>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden bg-navy px-6 pb-6">
            <div className="flex flex-col gap-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-base font-semibold text-white hover:text-gold"
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-left text-sm font-semibold uppercase tracking-[0.15em] text-white/60 hover:text-gold"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-[1280px] px-6 py-12 sm:px-[6%] sm:py-20 fade-up">
        {children}
      </main>

      <footer className="mx-auto max-w-[1280px] px-6 py-10 text-center text-xs font-semibold uppercase tracking-[0.25em] text-sage sm:px-[6%]">
        Let's Go Champs · Move Your Way
      </footer>
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
    <header className="mb-12 max-w-3xl">
      {eyebrow && <p className="eyebrow mb-4 text-green">{eyebrow}</p>}
      <h1 className="font-serif text-4xl font-bold leading-[1.05] text-navy sm:text-5xl md:text-[56px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-5 text-base leading-relaxed text-sage sm:text-lg">{subtitle}</p>
      )}
    </header>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-cream">
      <nav
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(7,27,47,0.85)" : "#071b2f",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-6 sm:px-[6%]">
          <Link to="/" className="flex items-baseline gap-2.5">
            <span className="font-display text-[22px] leading-none tracking-wide text-gold">LGC</span>
            <span className="hidden text-sm font-semibold tracking-wide text-white sm:inline">
              Move Your Way
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {publicLinks.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="relative text-sm font-semibold text-white/90 transition-colors hover:text-gold"
                >
                  {l.label}
                  <span
                    className="absolute -bottom-2 left-0 h-[2px] bg-gold transition-all duration-300"
                    style={{ width: active ? "100%" : "0%" }}
                  />
                </Link>
              );
            })}
            <Link
              to="/auth"
              className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60 hover:text-gold"
            >
              Member Login
            </Link>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden bg-navy px-6 pb-6">
            <div className="flex flex-col gap-4">
              {publicLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-base font-semibold text-white hover:text-gold"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/auth"
                className="text-sm font-semibold uppercase tracking-[0.15em] text-white/60 hover:text-gold"
              >
                Member Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-[1280px] px-6 py-12 sm:px-[6%] sm:py-20 fade-up">
        {children}
      </main>

      <footer className="mx-auto max-w-[1280px] px-6 py-10 text-center text-xs font-semibold uppercase tracking-[0.25em] text-sage sm:px-[6%]">
        Let's Go Champs · Move Your Way
      </footer>
    </div>
  );
}
