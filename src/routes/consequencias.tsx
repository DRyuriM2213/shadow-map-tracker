import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CONSEQUENCES, CLUES, LOCATIONS, PLAYERS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";

export const Route = createFileRoute("/consequencias")({ component: ConsequenciasPage });

const TYPES = ["todas", "imediata", "atrasada", "condicional", "permanente", "reversivel", "institucional", "social", "investigativa"];

function ConsequenciasPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [filtro, setFiltro] = useState("todas");
  const lista = CONSEQUENCES.filter((c) => filtro === "todas" || c.type === filtro);
  const pendentes = session.scheduled.filter((s) => s.status === "pendente").length;

  return <Shell><div className="mx-auto max-w-6xl space-y-6">
    <header className="dossier rounded-sm p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="stamp text-primary">Reações da campanha</p><h1 className="text-3xl font-semibold">Consequências</h1><p className="text-sm text-muted-foreground">{CONSEQUENCES.length} consequências cadastradas · {pendentes} pendentes nesta sessão. Nada é aplicado automaticamente sem registro.</p></div><select value={filtro} onChange={(e)=>setFiltro(e.target.value)} className="rounded-sm border border-input bg-background px-2 py-1.5 text-sm">{TYPES.map((t)=><option key={t} value={t}>{t}</option>)}</select></div></header>

    <section className="dossier rounded-sm p-4"><h2 className="stamp text-primary">Agendadas nesta sessão</h2>{session.scheduled.length===0?<p className="mt-2 text-sm text-muted-foreground">Nenhuma consequência agendada ainda.</p>:<ul className="mt-3 space-y-2 text-sm">{session.scheduled.map((s)=>{const q=CONSEQUENCES.find((c)=>c.id===s.consequenceId);return <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-sm border-l-2 border-l-primary bg-secondary/20 p-2 pl-3"><span className="font-semibold">{q?.name??s.consequenceId}</span><span className="text-xs text-muted-foreground">DIA {s.day} · {s.time} · {s.status}</span>{s.status==="pendente"&&<span className="ml-auto flex flex-wrap gap-2"><Button size="sm" onClick={()=>store.resolveConsequence(s.id,"ativada")}>Ativar</Button><Button size="sm" variant="outline" onClick={()=>store.resolveConsequence(s.id,"adiada")}>Adiar</Button><Button size="sm" variant="ghost" onClick={()=>{if(confirm(`Cancelar “${q?.name??s.consequenceId}”?`))store.resolveConsequence(s.id,"cancelada");}}>Cancelar</Button></span>}</li>;})}</ul>}</section>

    <div className="grid gap-3 lg:grid-cols-2">{lista.map((c)=><article key={c.id} className="dossier rounded-sm p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-lg font-semibold">{c.name}</h3><span className="stamp rounded-sm bg-secondary px-2 py-0.5">{c.type}</span></div><dl className="mt-3 space-y-1.5 text-sm"><Item label="Causa" v={c.cause}/><Item label="Ativação" v={c.triggerTime}/><Item label="Condição" v={c.conditions}/><Item label="Efeito" v={c.effect}/><Item label="Duração" v={c.duration}/><Item label="Locais" v={c.affectedLocations.map((id)=>LOCATIONS.find((l)=>l.id===id)?.name??id).join(", ")||"—"}/><Item label="Pistas" v={c.affectedClues.map((id)=>CLUES.find((x)=>x.id===id)?.name??id).join(", ")||"—"}/><Item label="Personagens" v={c.affectedCharacters.map((id)=>PLAYERS.find((p)=>p.id===id)?.characterName??id).join(", ")||"—"}/></dl><Button size="sm" className="mt-3" onClick={()=>store.scheduleConsequence(c.id)}>Agendar consequência</Button></article>)}</div>
  </div></Shell>;
}

function Item({label,v}:{label:string;v:string}){return <div className="grid gap-1 sm:grid-cols-[130px_1fr]"><dt className="stamp text-muted-foreground">{label}</dt><dd>{v}</dd></div>;}
