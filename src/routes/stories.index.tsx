import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PublicLayout, PageHeader } from "@/components/Layout";
import {
  fetchFeaturedStories,
  fetchPinnedStory,
  adminFetchStories,
  checkIsAdmin,
} from "@/lib/stories";
import type { Story } from "@/lib/stories";

export const Route = createFileRoute("/stories/")({ component: StoriesWall });

function StoriesWall() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);

  const { data: pinned, isLoading: loadingPin } = useQuery({
    queryKey: ["stories", "pinned"],
    queryFn: fetchPinnedStory,
    enabled: !isAdmin,
  });

  // Admins see ALL submissions; public sees only featured
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories", isAdmin ? "all" : "featured"],
    queryFn: () => (isAdmin ? adminFetchStories("all") : fetchFeaturedStories()),
  });

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Community champions"
        title="Their Stories"
        subtitle="Real people. Real movement. Real change. These are the champions in our community."
      />

      {/* Admin notice */}
      {isAdmin && (
        <div className="mb-8 flex items-center gap-3 rounded-[14px] border border-gold/40 bg-gold/8 px-5 py-3.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8962e" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-[13px] font-semibold text-navy">
            Admin view — showing all {stories.length} submitted {stories.length === 1 ? "story" : "stories"}.{" "}
            <Link to="/admin" className="text-gold underline underline-offset-2 hover:brightness-90">
              Manage in admin panel →
            </Link>
          </p>
        </div>
      )}

      {/* Pinned story (public only) */}
      {!isAdmin && !loadingPin && pinned && <PinnedStory story={pinned} />}

      {/* CTA */}
      <div className="mb-12 flex items-center gap-4">
        <Link
          to="/stories/submit"
          className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.15em] text-navy transition-all duration-200 hover:scale-[1.03] hover:brightness-110"
        >
          Share Your Story
        </Link>
        <p className="text-sm text-sage">Your story could inspire thousands.</p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-[20px] bg-mist/40" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-[20px] bg-card p-12 text-center card-shadow">
          <p className="text-lg font-bold text-navy">
            {isAdmin ? "No stories submitted yet." : "No stories yet."}
          </p>
          <p className="mt-2 text-sage">
            {isAdmin ? "Once someone shares their story, it will appear here." : "Be the first champion to share yours."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </PublicLayout>
  );
}

function PinnedStory({ story }: { story: Story }) {
  return (
    <section className="mb-12 overflow-hidden rounded-[24px] card-shadow" style={{ background: "var(--navy-dark)" }}>
      <div className="flex flex-col md:flex-row">
        {(story.video_url || story.photo_url) && (
          <div className="md:w-[360px] shrink-0">
            {story.video_url ? (
              <video src={story.video_url} className="h-60 w-full object-cover md:h-full" autoPlay muted loop playsInline />
            ) : (
              <img src={story.photo_url!} alt={story.name} className="h-60 w-full object-cover md:h-full" />
            )}
          </div>
        )}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-gold/20 px-4 py-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold">Story of the Week</span>
          </div>
          <blockquote className="text-[18px] leading-[1.7] text-white/90 sm:text-[20px]">
            "{story.quote ?? story.story}"
          </blockquote>
          <div className="mt-6">
            <p className="font-bold text-white">{story.name}</p>
            <p className="text-sm text-white/50">
              {story.city}
              {story.activity_type && <span className="ml-2 text-gold/60">· {story.activity_type}</span>}
              {story.social_handle && <span className="ml-2 text-gold">{story.social_handle}</span>}
            </p>
          </div>
          {story.reply && (
            <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-gold">Message from Aidan</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{story.reply}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  unread:   { bg: "bg-blue-100",   text: "text-blue-700", label: "Nova" },
  featured: { bg: "bg-green/10",   text: "text-green",    label: "Featured" },
  archived: { bg: "bg-mist/60",    text: "text-sage",     label: "Arquivada" },
};

function StoryCard({ story, isAdmin }: { story: Story; isAdmin: boolean }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[20px] bg-card card-shadow lift">
      {story.video_url ? (
        <video
          src={story.video_url}
          className="h-48 w-full object-cover"
          muted
          playsInline
          onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
          onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
        />
      ) : story.photo_url ? (
        <img src={story.photo_url} alt={story.name} className="h-48 w-full object-cover" />
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-2">
          {story.activity_type && (
            <span className="inline-flex rounded-full bg-navy/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-navy">
              {story.activity_type}
            </span>
          )}
          {isAdmin && (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${statusStyle[story.status].bg} ${statusStyle[story.status].text}`}>
              {statusStyle[story.status].label}
            </span>
          )}
          {isAdmin && story.is_pinned && (
            <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-gold">📌</span>
          )}
        </div>

        {story.quote ? (
          <p className="text-base font-semibold italic leading-snug text-navy line-clamp-3">"{story.quote}"</p>
        ) : (
          <p className="text-sm italic leading-relaxed text-sage line-clamp-5">"{story.story}"</p>
        )}

        <div className="mt-auto pt-5">
          <p className="font-bold text-navy">{story.name}</p>
          <p className="text-[13px] text-sage">
            {story.city}
            {story.social_handle && <span className="ml-2 text-gold">{story.social_handle}</span>}
          </p>
        </div>

        {story.reply && (
          <div className="mt-4 rounded-lg border-l-4 border-gold bg-cream/60 p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gold">Aidan replied</p>
            <p className="mt-1 text-[13px] leading-relaxed text-sage line-clamp-3">{story.reply}</p>
          </div>
        )}

        {/* Admin quick-link to manage */}
        {isAdmin && (
          <Link
            to="/admin"
            className="mt-4 block text-center rounded-full border border-mist py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-sage transition-colors hover:border-gold hover:text-gold"
          >
            Manage →
          </Link>
        )}
      </div>
    </article>
  );
}
