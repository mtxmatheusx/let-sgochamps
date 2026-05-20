import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/wall", label: "The Wall" },
  { to: "/log", label: "Log" },
  { to: "/groups", label: "Groups" },
  { to: "/history", label: "History" },
  { to: "/community", label: "Community" },
  { to: "/about", label: "About" },
] as const;

const storyLink = { to: "/stories/submit", label: "Share your story" } as const;

const ease = [0.22, 1, 0.36, 1] as const;

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-2">
      <span className="font-display text-[17px] font-semibold tracking-tight text-navy">
        Let's Go Champs
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-gold opacity-70 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function NavLinks({
  items,
  pathname,
}: {
  items: ReadonlyArray<{ to: string; label: string }>;
  pathname: string;
}) {
  return (
    <>
      {items.map((l) => {
        const active = pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            className="relative px-1 py-1 text-[13px] font-medium text-navy/75 transition-colors hover:text-navy"
          >
            {l.label}
            {active && (
              <motion.span
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full bg-navy"
                transition={{ duration: 0.4, ease }}
              />
            )}
          </Link>
        );
      })}
    </>
  );
}

function MobileSheet({
  open,
  items,
  onClose,
  trailing,
}: {
  open: boolean;
  items: ReadonlyArray<{ to: string; label: string }>;
  onClose: () => void;
  trailing: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease }}
          className="md:hidden glass-nav border-t border-black/5 px-6 pb-6 pt-4"
        >
          <div className="flex flex-col gap-1">
            {items.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={onClose}
                className="rounded-xl px-3 py-3 text-[15px] font-medium text-navy hover:bg-black/5"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-black/5 pt-3">{trailing}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
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

  useEffect(() => setOpen(false), [location.pathname]);

  if (!ready) return <div className="min-h-screen bg-cream" />;
  if (!session) return null;

  const signOutBtn = (
    <button
      onClick={() => supabase.auth.signOut()}
      className="rounded-full px-4 py-2 text-[13px] font-medium text-navy/70 transition-colors hover:bg-black/5 hover:text-navy"
    >
      Sign out
    </button>
  );

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">
      <nav className="sticky top-0 z-40 glass-nav">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center justify-between px-6 sm:px-8">
          <Brand />

          <div className="hidden items-center gap-8 md:flex">
            <NavLinks items={links} pathname={location.pathname} />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to={storyLink.to}
              className="rounded-full bg-green px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-all hover:brightness-110 hover:scale-[1.03]"
            >
              Share your story
            </Link>
            {signOutBtn}
          </div>

          <button
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl text-navy active:bg-black/5"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <><path d="M4 8h16" /><path d="M4 16h16" /></>}
            </svg>
          </button>
        </div>

        <MobileSheet open={open} items={[...links, storyLink]} onClose={() => setOpen(false)} trailing={signOutBtn} />
      </nav>

      <main className="mx-auto max-w-[1280px] px-6 py-12 sm:px-8 sm:py-16 fade-up">
        {children}
      </main>

      <footer className="mx-auto max-w-[1280px] px-6 py-10 text-center text-[12px] text-sage sm:px-8">
        © Let's Go Champs · Move Your Way
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
      {eyebrow && <p className="eyebrow mb-4 text-blue">{eyebrow}</p>}
      <h1 className="sf-display text-navy text-[44px] sm:text-[56px] md:text-[64px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-5 text-[17px] leading-[1.55] text-sage sm:text-[19px]">
          {subtitle}
        </p>
      )}
    </header>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  const items = [
    { to: "/community", label: "Community" },
    { to: "/about", label: "About" },
  ] as const;

  const trailing = (
    <Link
      to="/auth"
      className="rounded-full bg-blue px-4 py-2 text-[13px] font-semibold text-white hover:brightness-110"
    >
      Sign in
    </Link>
  );

  return (
    <div className="min-h-screen bg-cream">
      <nav className="sticky top-0 z-40 glass-nav">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center justify-between px-6 sm:px-8">
          <Brand />
          <div className="hidden items-center gap-8 md:flex">
            <NavLinks items={items} pathname={location.pathname} />
          </div>
          <div className="hidden md:block">{trailing}</div>
          <button className="md:hidden text-navy" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <><path d="M4 8h16" /><path d="M4 16h16" /></>}
            </svg>
          </button>
        </div>
        <MobileSheet open={open} items={items} onClose={() => setOpen(false)} trailing={trailing} />
      </nav>

      <main className="mx-auto max-w-[1280px] px-6 py-12 sm:px-8 sm:py-16 fade-up">
        {children}
      </main>

      <footer className="mx-auto max-w-[1280px] px-6 py-10 text-center text-[12px] text-sage sm:px-8">
        © Let's Go Champs · Move Your Way
      </footer>
    </div>
  );
}
