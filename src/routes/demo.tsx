import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/Layout";

export const Route = createFileRoute("/demo")({ component: Demo });

function Demo() {
  return (
    <Layout>
      <PageHeader eyebrow="Final Project Demo" title="See It In Action" />
      <div className="overflow-hidden rounded-3xl bg-card shadow-sm">
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            className="absolute inset-0 h-full w-full"
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
