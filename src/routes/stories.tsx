import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route: renders children via <Outlet>.
// /stories      → stories.index.tsx (the wall)
// /stories/submit → stories.submit.tsx (the form)
export const Route = createFileRoute("/stories")({ component: () => <Outlet /> });
