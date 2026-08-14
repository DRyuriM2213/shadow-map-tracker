import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sessao")({
  beforeLoad: () => {
    throw redirect({ to: "/sessao-v2" });
  },
  component: () => null,
});
