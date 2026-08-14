import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pistas")({
  beforeLoad: () => {
    throw redirect({ to: "/pistas-v2" });
  },
  component: () => null,
});
