import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/Layout";

export const Route = createFileRoute("/about")({ component: About });

const cards = [
  {
    title: "The Idea",
    body: "It's not about perfection — it's about daily action. Move Your Way is built to make small, consistent movement feel like a win every single time.",
  },
  {
    title: "User Flow",
    list: [
      "Open the dashboard.",
      "Review your stats and streak.",
      "Click Log Today's Movement.",
      "Submit the quick form.",
      "Return to the updated dashboard.",
      "Use History to see your receipts.",
    ],
  },
  {
    title: "Design Direction",
    body: "Bold green, deep navy, cream and gold. Wellness meets champion energy — calm enough to live with, motivating enough to act on.",
  },
  {
    title: "Why It Works",
    body: "Movement becomes a feedback loop. Each logged activity is proof of consistency, and proof builds identity. You become the person who shows up.",
  },
];

function About() {
  return (
    <Layout>
      <PageHeader eyebrow="The movement behind the app" title="About Move Your Way" />
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-3xl bg-card p-8 shadow-sm">
            <h3 className="mb-3 text-xl font-bold text-navy">{c.title}</h3>
            {c.body && <p className="text-sm leading-relaxed text-muted-foreground">{c.body}</p>}
            {c.list && (
              <ol className="space-y-2 text-sm text-muted-foreground">
                {c.list.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-bold text-gold">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
