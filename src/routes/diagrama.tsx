import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Shell } from "@/components/Shell";
import { SCENES } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";
import { routeHex } from "@/lib/ui";

export const Route = createFileRoute("/diagrama")({
  head: () => ({
    meta: [
      { title: "Diagrama de Escolhas — Berço Vazio" },
      { name: "description", content: "Mapa visual completo das cenas, rotas coloridas e caminhos percorridos pelo grupo." },
      { property: "og:title", content: "Diagrama de Escolhas — Berço Vazio" },
      { property: "og:description", content: "Visualize todas as ramificações da investigação em um único mapa." },
    ],
  }),
  component: DiagramaPage,
});

function DiagramaPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();

  const { nodes, edges } = useMemo(() => {
    const byDay: Record<number, number> = { 1: 0, 2: 0 };
    const nodes: Node[] = SCENES.map((s) => {
      const i = byDay[s.day]++;
      const visited = session.visitedScenes.includes(s.id);
      const current = session.currentSceneId === s.id;
      return {
        id: s.id,
        position: { x: (s.day - 1) * 520 + (i % 2) * 240, y: i * 130 },
        data: { label: `${s.day === 1 ? "D1" : "D2"} ${s.time} — ${s.title}` },
        style: {
          width: 220,
          fontSize: 12,
          borderRadius: 2,
          padding: 8,
          background: current ? "#3b2a12" : visited ? "#241f1b" : "#1a1715",
          color: "#e8e2d8",
          border: `2px solid ${current ? "#e0a63c" : visited ? "#6b6157" : "#332e29"}`,
        },
      };
    });
    const edges: Edge[] = SCENES.flatMap((s) =>
      s.choices
        .filter((c) => c.nextSceneId)
        .map((c) => ({
          id: c.id,
          source: s.id,
          target: c.nextSceneId!,
          label: c.title,
          animated: session.chosenChoices.includes(c.id),
          style: {
            stroke: routeHex[c.route] ?? "#6b6157",
            strokeWidth: session.chosenChoices.includes(c.id) ? 3 : 1.5,
            opacity: session.routeStatus[c.id] === "ignorada" ? 0.3 : 1,
          },
          labelStyle: { fontSize: 10, fill: "#c9c1b5" },
        })),
    );
    return { nodes, edges };
  }, [session]);

  return (
    <Shell>
      <div className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-3xl font-semibold">Diagrama de Escolhas</h1>
            <p className="text-sm text-muted-foreground">
              Clique em uma cena para levar a sessão até ela. Linhas grossas são o caminho percorrido.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(routeHex).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: v }} /> {k}
              </span>
            ))}
          </div>
        </header>
        <div className="dossier h-[70vh] rounded-sm">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onNodeClick={(_, n) => store.goToScene(n.id, "Movido pelo diagrama")}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#3a3430" gap={24} />
            <MiniMap pannable zoomable maskColor="rgba(0,0,0,.6)" />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </Shell>
  );
}
