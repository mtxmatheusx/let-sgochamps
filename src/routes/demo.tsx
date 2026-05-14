import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/Layout";

export const Route = createFileRoute("/demo")({ component: Demo });

function Demo() {
  return (
    <Layout>
      <PageHeader
        eyebrow="Final Project Demo"
        title="See It In Action"
        subtitle="This walkthrough shows how Move Your Way works — from logging movement to building consistency over time."
      />
      <div className="overflow-hidden rounded-[20px] bg-card card-shadow">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src="https://www.youtube.com/embed/hdoF-8UXQfM"
            title="Move Your Way demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </Layout>
  );
}
