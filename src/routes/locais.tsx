import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LOCATIONS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";
import { locationStatusLabel, routeBorder } from "@/lib/ui";
import { RoomInspector, cluesForLocation } from "@/components/RoomInspector";
import { MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/locais")({ component: LocaisPage });

type Filter = "todos" | "atual" | "pendentes" | "restritos";

function LocaisPage() {
  const session = useCampaign((s) => s.session);
  const setLocation = useCampaign((s) => s.setLocation);
  const [aberto, setAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  const filtradas = useMemo(() => LOCATIONS.filter((l) => {
    const achados = cluesForLocation(l.id);
    const pending = achados.some((c) => !["encontrada", "interpretada", "contingencia"].includes(session.clueStatus[c.id] ?? ""));
    const q = busca.trim().toLowerCase();
    const haystack = `${l.name} ${l.sector} ${l.description} ${achados.map((c) => `${c.name} ${c.sourceDocument}`).join(" ")}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (filter === "atual" && l.id !== session.currentLocationId) return false;
    if (filter === "pendentes" && !pending) return false;
    if (filter === "restritos" && !/restrit/i.test(`${l.availability} ${l.prerequisites}`)) return false;
    return true;
  }), [busca, filter, session.clueStatus, session.currentLocationId]);

  const setores = [...new Set(filtradas.map((l) => l.sector))];
  const local = LOCATIONS.find((l) => l.id === aberto);

  return <Shell>
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="dossier rounded-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-4"><div><p className="stamp text-primary">Exploração livre</p><h1 className="text-3xl font-semibold">Locais e Salas</h1><p className="text-sm text-muted-foreground">Clique numa sala para abrir o inspector completo. Pistas futuras/secretas continuam visíveis ao mestre.</p></div><div className="relative ml-auto min-w-[240px] flex-1 sm:max-w-sm"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/><Input className="pl-8" placeholder="Buscar sala, setor, pista ou documento…" value={busca} onChange={(e)=>setBusca(e.target.value)}/></div></div>
        <div className="mt-4 flex flex-wrap gap-2">{(["todos","atual","pendentes","restritos"] as Filter[]).map((f)=><Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f==="todos"?"Todos":f==="atual"?"Local atual":f==="pendentes"?"Com pistas pendentes":"Restritos"}</Button>)}</div>
      </header>

      {setores.map((setor)=><section key={setor}><h2 className="stamp text-primary">{setor}</h2><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtradas.filter((l)=>l.sector===setor).map((l)=>{const st=session.locationStatus[l.id]??"nao-visitada";const achados=cluesForLocation(l.id);const pending=achados.filter((c)=>!["encontrada","interpretada","contingencia"].includes(session.clueStatus[c.id]??"")).length;const current=l.id===session.currentLocationId;return <button key={l.id} onClick={()=>setAberto(l.id)} className={`dossier rounded-sm border-l-4 p-4 text-left transition-colors hover:border-primary ${routeBorder[l.route]} ${current?"ring-1 ring-primary":""}`}><div className="flex items-start justify-between gap-2"><p className="text-lg font-semibold">{l.name}</p>{current&&<span className="stamp shrink-0 text-primary"><MapPin className="mr-1 inline size-3"/>grupo aqui</span>}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.description}</p><div className="mt-3 flex flex-wrap gap-1 text-[11px]"><span className="rounded-sm bg-secondary px-2 py-0.5">{locationStatusLabel[st]}</span><span className="rounded-sm bg-secondary px-2 py-0.5">Dia {l.dayAvailable.join(" e ")}</span><span className="rounded-sm bg-secondary px-2 py-0.5">{achados.length} achados</span>{pending>0&&<span className="rounded-sm border border-route-amarelo/50 px-2 py-0.5 text-route-amarelo">{pending} pendentes</span>}</div></button>;})}</div></section>)}
      {filtradas.length===0&&<div className="dossier rounded-sm p-8 text-center text-sm text-muted-foreground">Nenhum local corresponde aos filtros.</div>}
    </div>

    <Dialog open={!!aberto} onOpenChange={(o)=>!o&&setAberto(null)}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">{local&&<><DialogHeader><DialogTitle className="font-display text-3xl">{local.name}</DialogTitle></DialogHeader><div className="space-y-4 text-sm"><div className="grid gap-3 md:grid-cols-2"><Field label="Disponibilidade" value={local.availability}/><Field label="Dias de acesso" value={`Dia ${local.dayAvailable.join(" e ")}`}/><Field label="Horário recomendado" value={local.recommendedTime}/><Field label="Pré-requisitos" value={local.prerequisites}/></div>{local.connectedLocations.length>0&&<div><p className="stamp text-muted-foreground">Locais conectados</p><div className="mt-2 flex flex-wrap gap-2">{local.connectedLocations.map((id)=>{const linked=LOCATIONS.find((x)=>x.id===id);return <Button key={id} size="sm" variant="outline" onClick={()=>setAberto(id)}>{linked?.name??id}</Button>;})}</div></div>}<RoomInspector locationId={local.id}/><div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3"><Button size="sm" variant="outline" onClick={()=>setAberto(null)}>Fechar</Button><Button size="sm" onClick={()=>{if(local.id===session.currentLocationId||confirm(`Mover o grupo para “${local.name}”?`)){setLocation(local.id);setAberto(null);}}}>Levar o grupo para cá</Button></div></div></>}</DialogContent></Dialog>
  </Shell>;
}

function Field({label,value}:{label:string;value:string}){return <div><p className="stamp text-muted-foreground">{label}</p><p>{value||"—"}</p></div>;}
