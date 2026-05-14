import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/Layout";

export const Route = createFileRoute("/about")({ component: About });

const cards: Array<{ title: string; body?: string; list?: string[] }> = [
  {
    title: "The Idea",
    body: "This app is not built around perfection or extreme workouts. It is built around daily action. Users track simple movement habits and turn small wins into visible progress.",
  },
  {
    title: "User Flow",
    list: [
      "Open the dashboard.",
      "Review movement minutes, total activity and streak.",
      "Click Log Today's Movement.",
      "Submit the activity form.",
      "Return to an updated dashboard.",
      "Use history to review progress over time.",
    ],
  },
  {
    title: "Design Direction",
    body: "The visual style uses bold green, deep navy, cream and gold to connect wellness with champion energy. The design feels motivational without becoming overwhelming.",
  },
  {
    title: "Why It Works",
    body: "The app turns movement into a feedback loop. Each logged activity gives users proof that they are becoming more consistent.",
  },
];

function About() {
  return (
    <Layout>
      <PageHeader
        eyebrow="The movement behind the app"
        title="About Move Your Way"
        subtitle="Move Your Way is a data-driven wellness tracker inspired by the Let's Go Champs mindset: show up, stay consistent and build a lifestyle around movement."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <article key={c.title} className="rounded-[20px] bg-card p-8 card-shadow lift">
            <p className="eyebrow text-gold">Pillar</p>
            <h3 className="mt-2 font-serif text-2xl font-bold text-navy">{c.title}</h3>
            {c.body && (
              <p className="mt-4 text-[15px] leading-relaxed text-sage">{c.body}</p>
            )}
            {c.list && (
              <ol className="mt-4 space-y-3">
                {c.list.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-sage">
                    <span className="font-bold text-gold">{String(i + 1).padStart(2, "0")}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        ))}
      </div>
    </Layout>
  );
}
