import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layout, PageHeader } from "@/components/Layout";

export const Route = createFileRoute("/about")({ component: About });

const ease = [0.22, 1, 0.36, 1] as const;

const cards: Array<{ title: string; body?: string; list?: string[] }> = [
  {
    title: "The idea",
    body: "This app is not built around perfection or extreme workouts. It's built around daily action. Track simple movement habits and turn small wins into visible progress.",
  },
  {
    title: "The flow",
    list: [
      "Open the dashboard.",
      "Review minutes, days, and your streak.",
      "Tap Log today's movement.",
      "Submit the form.",
      "Return to an updated dashboard.",
      "Use history to review your progress.",
    ],
  },
  {
    title: "The design",
    body: "A calm Apple-light surface with a single blue accent and a touch of brand gold. Movement should feel modern, not loud.",
  },
  {
    title: "Why it works",
    body: "Each logged activity is proof. The feedback loop turns showing up into identity.",
  },
];

function About() {
  return (
    <Layout>
      <PageHeader
        eyebrow="The movement behind the app"
        title="About Move Your Way"
        subtitle="A data-driven wellness tracker inspired by the Let's Go Champs mindset: show up, stay consistent, build a lifestyle around movement."
      />
      <div className="relative grid gap-4 md:grid-cols-2">
        <div className="orb" style={{ width: 380, height: 380, top: -60, left: -100, background: "#22c55e", opacity: 0.18 }} />
        <div className="orb" style={{ width: 360, height: 360, bottom: -80, right: -80, background: "#22c55e", opacity: 0.15 }} />

        {cards.map((c, i) => (
          <motion.article
            key={c.title}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease, delay: i * 0.07 }}
            whileHover={{ y: -4 }}
            className="glass relative rounded-[24px] p-8"
          >
            <p className="eyebrow text-blue">Pillar</p>
            <h3 className="mt-2 sf-display text-[26px] text-navy">{c.title}</h3>
            {c.body && <p className="mt-4 text-[15px] leading-[1.55] text-sage">{c.body}</p>}
            {c.list && (
              <ol className="mt-4 space-y-2.5">
                {c.list.map((step, j) => (
                  <li key={j} className="flex gap-3 text-[14px] text-sage">
                    <span className="font-semibold text-blue">{String(j + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </motion.article>
        ))}
      </div>
    </Layout>
  );
}
