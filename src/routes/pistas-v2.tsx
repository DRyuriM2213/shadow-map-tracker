import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUES, LOCATIONS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, importanceLabel, routeBorder } from "@/lib/ui";

export const Route = createFileRoute("/pistas-v2")({ component: PistasV2 });

type F = "todas" | "local" | "pendentes" | "encontradas" | "obrigatorias" | "documental" | "fisica" | "digital" | "social" | "ambiental";
const FILTERS: [F, string][] = [["todas","Todas"],["local","No local atual"],["pendentes","Não encontradas"],["encontradas","Encontradas"],["obrigatorias","Obrigatórias"],["documental","Documental"],["fisica","Física"],["digital","Digital"],["social","Social"],["ambiental","Ambiental"]];
const found = ["encontrada", "interpretada", "contingencia"];

function PistasV2() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<F>("todas");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => CLUES.filter((c) => {
    const status = session.clueStatus[c.id] ?? "escondida";
    const q = query.trim().toLowerCase();
    if (q && !`${c.name} ${c.sourceDocument} ${c.playerDescription} ${c.microLocation}`.toLowerCase().includes(q)) return false;
    if (filter === "local" && c.mainLocationId !== session.currentLocationId && !c.alternativeLocationIds.includes(session.currentLocationId ?? "")) return false;
    if (filter === "pendentes" && found.includes(status)) return false;
    if (filter === "encontradas" && !found.includes(status)) return false;
    if (filter === "obrigatorias" && c.importance !== "obrigatoria") return false;
    if (["documental","fisica","digital","social","ambiental"].includes(filter) && c.medium !== filter) return false;
    return true;
  }), [query, filter, session.clueStatus, session.currentLocationId]);
  const clue = CLUES.find((c) => c.id === open);
  const docs = CLUES.filter((c) => c.sourceDocument).length;

  return <Shell>
    <div className="mx-auto max-w-7xl space-y-4">
      <header className="flex flex-wrap items-end gap-3"><div><p className="stamp text-primary">Catálogo global</p><h1 className="text-3xl font-semibold">Pistas e documentos</h1><p className="text-sm text-muted-foreground">{CLUES.length} pistas · {docs} documentos/props. Pistas futuras nunca ficam escondidas do mestre.</p></div><Input className="ml-auto max-w-sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pista, documento, arquivo…" /></header>
      <div className="dossier rounded-sm p-3"><div className="flex flex-wrap gap-2">{FILTERS.map(([id,label]) => <Button key={id} size="sm" variant={filter===id?"default":"outline"} onClick={() => setFilter(id)}>{label}</Button>)}</div></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((c) => { const status=session.clueStatus[c.id]??"escondida"; return <button key={c.id} onClick={() => setOpen(c.id)} className={`dossier rounded-sm border-l-4 p-4 text-left hover:border-primary ${routeBorder[c.route]}`}><div className="flex justify-between gap-2"><b>{c.name}</b><span className="font-mono text-xs">DT {session.dcOverrides[c.id]??c.dc}</span></div>{c.sourceDocument&&<p className="mt-1 font-mono text-[10px] text-primary">{c.sourceDocument}</p>}<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.playerDescription}</p><div className="mt-3 flex flex-wrap gap-1 text-[10px]"><span className="rounded-sm bg-secondary px-2 py-1">{clueStatusLabel[status]}</span><span className="rounded-sm bg-secondary px-2 py-1">{importanceLabel[c.importance]}</span><span className="rounded-sm bg-secondary px-2 py-1">{c.medium}</span><span className="rounded-sm bg-secondary px-2 py-1">{LOCATIONS.find((l)=>l.id===c.mainLocationId)?.name??c.mainLocationId}</span></div></button>; })}</div>
    </div>
    {clue && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(null)}><div className="dossier max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-sm p-5" onClick={(e)=>e.stopPropagation()}><p className="stamp text-primary">Pista / documento</p><h2 className="font-display text-2xl">{clue.name}</h2>{clue.sourceDocument&&<p className="font-mono text-xs text-primary">PROP: {clue.sourceDocument}</p>}<div className="paper-sheet mt-4 rounded-sm p-3">{clue.playerDescription}</div><div className="mt-4 space-y-2 text-sm"><p><b>Local:</b> {LOCATIONS.find((l)=>l.id===clue.mainLocationId)?.name??clue.mainLocationId}</p><p><b>Micro-local:</b> {clue.microLocation||clue.exactLocation||"—"}</p><p><b>Teste:</b> {clue.suggestedSkill} • DT {session.dcOverrides[clue.id]??clue.dc}</p><p><b>Para o mestre:</b> {clue.masterMeaning||"—"}</p><p><b>Sucesso:</b> {clue.successResult}</p><p><b>Falha:</b> {clue.failureResult}</p></div><div className="mt-4 flex gap-2"><Button size="sm" onClick={()=>{store.setClue(clue.id,"encontrada",clue.name);setOpen(null);}}>Entregar pista</Button><Button size="sm" variant="outline" onClick={()=>setOpen(null)}>Fechar</Button></div></div></div>}
  </Shell>;
}
