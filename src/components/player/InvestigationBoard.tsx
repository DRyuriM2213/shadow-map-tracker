import { useMemo, useState } from "react";
import type { CloudDocument, PlayerNote, PlayerBootstrapData } from "@/lib/playerCloudTypes";
import { FileText, Link2, NotebookPen, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type BoardNode = { id: string; title: string; type: "PISTA" | "DOCUMENTO" | "NOTA"; x: number; y: number };
type Edge = { a: string; b: string };

function edgeKey(a: string, b: string) { return [a,b].sort().join("::"); }
function storageKey(profileId: string) { return `berco-investigation-board:${profileId}`; }

export function InvestigationBoard({ profileId, clues, documents, notes, readOnly }: {
  profileId: string;
  clues: PlayerBootstrapData["clues"];
  documents: CloudDocument[];
  notes: PlayerNote[];
  readOnly: boolean;
}) {
  const nodes = useMemo<BoardNode[]>(() => {
    const source = [
      ...clues.map((c) => ({ id: "clue:"+c.id, title: c.title, type: "PISTA" as const })),
      ...documents.map((d) => ({ id: "doc:"+d.id, title: d.title, type: "DOCUMENTO" as const })),
      ...notes.map((n) => ({ id: "note:"+n.id, title: n.title || "Nota", type: "NOTA" as const })),
    ];
    return source.slice(0, 18).map((node, index) => {
      const col = index % 3, row = Math.floor(index / 3);
      return { ...node, x: 13 + col * 34 + (row % 2 ? 4 : 0), y: 12 + row * 23 };
    });
  }, [clues, documents, notes]);

  const [edges, setEdges] = useState<Edge[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(storageKey(profileId)) ?? "[]") as Edge[]; } catch { return []; }
  });
  const [selected, setSelected] = useState<string | null>(null);

  const persist = (next: Edge[]) => {
    setEdges(next);
    if (!readOnly && typeof window !== "undefined") localStorage.setItem(storageKey(profileId), JSON.stringify(next));
  };

  const clickNode = (id: string) => {
    if (readOnly) return;
    if (!selected) return setSelected(id);
    if (selected === id) return setSelected(null);
    const key = edgeKey(selected,id);
    const exists = edges.some((e) => edgeKey(e.a,e.b) === key);
    persist(exists ? edges.filter((e) => edgeKey(e.a,e.b) !== key) : [...edges, { a:selected, b:id }]);
    setSelected(null);
  };

  const nodeMap = new Map(nodes.map((node) => [node.id,node]));
  return <section className="investigation-board-shell">
    <div className="investigation-board-heading">
      <div><p className="stamp text-primary">Quadro de investigação</p><h2 className="font-display text-3xl">Conecte o que parece relacionado</h2><p>Selecione duas peças para criar ou remover uma ligação. As conexões ficam salvas só neste aparelho.</p></div>
      <div className="flex gap-2"><div className="board-legend"><span className="clue"/>Pista <span className="doc"/>Documento <span className="note"/>Nota</div>{!readOnly&&edges.length>0&&<Button size="sm" variant="ghost" onClick={()=>persist([])}><Trash2 className="mr-1 size-3.5"/>Limpar linhas</Button>}</div>
    </div>
    <div className="investigation-board">
      <div className="board-noise" aria-hidden="true"/>
      <svg className="board-lines" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
        {edges.map((edge,index)=>{
          const a=nodeMap.get(edge.a),b=nodeMap.get(edge.b); if(!a||!b)return null;
          return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} vectorEffect="non-scaling-stroke"/>;
        })}
      </svg>
      {nodes.map((node)=><button key={node.id} type="button" disabled={readOnly} data-type={node.type} data-selected={selected===node.id} className="board-node" style={{left:node.x+"%",top:node.y+"%"}} onClick={()=>clickNode(node.id)}>
        <span className="board-node-icon">{node.type==="PISTA"?<Pin className="size-3.5"/>:node.type==="DOCUMENTO"?<FileText className="size-3.5"/>:<NotebookPen className="size-3.5"/>}</span>
        <small>{node.type}</small><b>{node.title}</b>{selected===node.id&&<i><Link2 className="size-3"/> escolha outra peça</i>}
      </button>)}
      {nodes.length===0&&<div className="board-empty">Nenhuma peça de investigação disponível ainda.</div>}
    </div>
  </section>;
}
