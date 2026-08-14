import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Shell } from "@/components/Shell";
import { SCENES } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";
import { routeHex } from "@/lib/ui";

export const Route = createFileRoute("/diagrama")({ component: DiagramaPage });

function DiagramaPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const { nodes, edges } = useMemo(() => {
    const byDay: Record<number, number> = { 1: 0, 2: 0 };
    const nodes: Node[] = SCENES.map((s) => {
      const i = byDay[s.day] ?? 0; byDay[s.day] = i + 1;
      const visited = session.log.some((l) => l.detail === s.id || l.description.includes(s.title));
      const current = session.currentSceneId === s.id;
      return { id: s.id, position: { x: (s.day - 1) * 520 + (i % 2) * 240, y: i * 130 }, data: { label: `${s.day === 1 ? "D1" : "D2"} ${s.time} — ${s.title}` }, style: { width: 220, fontSize: 12, borderRadius: 2, padding: 8, background: current ? "#3b2a12" : visited ? "#241f1b" : "#1a1715", color: "#e8e2d8", border: `2px solid ${current ? "#e0a63c" : visited ? "#6b6157" : "#332e29"}` } };
    });
    const edges: Edge[] = SCENES.flatMap((s) => s.choices.filter((c) => c.nextSceneId).map((c) => ({ id: c.id, source: s.id, target: c.nextSceneId!, label: c.title, animated: session.routeStatus[c.id] === "escolhida", style: { stroke: routeHex[c.routeColor] ?? "#6b6157", strokeWidth: session.routeStatus[c.id] === "escolhida" ? 3 : 1.5, opacity: session.routeStatus[c.id] === "ignorada" ? 0.3 : 1 }, labelStyle: { fontSize: 10, fill: "#c9c1b5" } })));
    return { nodes, edges };
  }, [session]);

  return <Shell><div className="space-y-3"><header className="dossier rounded-sm p-4"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="stamp text-primary">Somente cenas preparadas dos Dias 1 e 2</p><h1 className="text-3xl font-semibold">Diagrama de Escolhas</h1><p className="text-sm text-muted-foreground">Linhas destacadas mostram o caminho registrado. Clicar numa cena pede confirmação antes de mover a sessão.</p></div><div className="flex flex-wrap gap-3 text-xs">{Object.entries(routeHex).map(([k,v])=><span key={k} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{background:v}}/>{k}</span>)}</div></div></header><div className="dossier h-[68vh] min-h-[480px] rounded-sm"><ReactFlow nodes={nodes} edges={edges} fitView onNodeClick={(_,n)=>{const s=SCENES.find((x)=>x.id===n.id);if(!s)return;if(confirm(`Mover a sessão para “${s.title}” (D${s.day} ${s.time})?`))store.goToScene(n.id,"Movido pelo diagrama");}} proOptions={{hideAttribution:true}}><Background color="#3a3430" gap={24}/><MiniMap pannable zoomable maskColor="rgba(0,0,0,.6)"/><Controls/></ReactFlow></div></div></Shell>;
}