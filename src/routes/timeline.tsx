import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { SESSION_ONE_RECAP, V3_EVENTS } from "@/data/sessionV3";
import type { CampaignDay } from "@/lib/types";
import { toMinutes, useCampaign } from "@/store/campaign";
import { Check, Clock3, Filter } from "lucide-react";

export const Route = createFileRoute("/timeline")({ component: TimelinePage });

const LABELS: Record<CampaignDay,string> = {1:"Segunda · 17/08",2:"Terça · 18/08",3:"Quarta · 19/08",4:"Quinta · 20/08",5:"Sexta · 21/08"};
const KINDS = ["TODOS","CANON","POSSÍVEL","PRESSÃO","CONTINGÊNCIA","CLÍMAX"] as const;

function TimelinePage(){
  const session=useCampaign(s=>s.session); const store=useCampaign();
  const [filter,setFilter]=useState<(typeof KINDS)[number]>("TODOS");
  const events=useMemo(()=>filter==="TODOS"?V3_EVENTS:V3_EVENTS.filter(e=>e.kind===filter),[filter]);
  return <Shell><div className="mx-auto max-w-6xl space-y-6">
    <header className="dossier rounded-sm p-5"><p className="stamp text-primary">Linha do tempo flexível</p><h1 className="text-3xl font-semibold">Cinco dias de campanha</h1><p className="mt-1 text-sm text-muted-foreground">Depois da primeira sessão, eventos deixaram de ser trilhos obrigatórios. Eles são janelas de oportunidade, pressão e contingência. Só o cânone já ocorrido e o prazo final são fixos.</p><div className="mt-4 flex flex-wrap items-center gap-2"><span className="font-mono text-3xl">D{session.day} · {session.time}</span>{[1,2,3,4,5].map(d=><Button key={d} size="sm" variant={session.day===d?"default":"outline"} onClick={()=>store.setDay(d as CampaignDay)}>D{d}</Button>)}{[15,30,60].map(m=><Button key={m} size="sm" variant="outline" onClick={()=>store.advanceTime(m)}>+{m===60?"1h":m}</Button>)}</div><div className="mt-4 flex flex-wrap items-center gap-2"><Filter className="size-4 text-muted-foreground"/>{KINDS.map(k=><Button key={k} size="sm" variant={filter===k?"secondary":"ghost"} onClick={()=>setFilter(k)}>{k}</Button>)}</div></header>

    <section className="dossier rounded-sm p-4"><p className="stamp text-route-verde-claro">Cânone já ocorrido em mesa</p><div className="mt-3 grid gap-2 md:grid-cols-2">{SESSION_ONE_RECAP.map(f=><div key={f.id} className="rounded-sm border border-route-verde-claro/30 bg-route-verde-claro/5 p-3"><p className="font-mono text-xs text-muted-foreground">D{f.day} · {f.time}</p><b>{f.title}</b><p className="mt-1 text-xs text-muted-foreground">{f.detail}</p></div>)}</div></section>

    {[2,3,4,5].map(day=><section key={day}><h2 className="stamp text-primary">DIA {day} — {LABELS[day as CampaignDay]}</h2><ol className="mt-3 border-l border-border pl-5">{events.filter(e=>e.day===day).map(e=>{const active=session.activatedEvents.includes(e.id);const passed=day<session.day||(day===session.day&&toMinutes(e.time)<=toMinutes(session.time));return <li key={e.id} className="relative py-3"><span className={`absolute -left-[27px] top-5 size-3 rounded-full border-2 ${active?"border-route-verde-claro bg-route-verde-claro":passed?"border-primary bg-primary":"border-border bg-background"}`}/><div className="dossier rounded-sm p-3"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm"><Clock3 className="mr-1 inline size-3"/>{e.time}</span><b>{e.title}</b><span className="stamp rounded-sm border border-border px-1.5 text-muted-foreground">{e.kind}</span>{active&&<span className="stamp text-route-verde-claro"><Check className="mr-1 inline size-3"/>usado</span>}<Button size="sm" variant="ghost" className="ml-auto" disabled={active} onClick={()=>store.activateEvent(e.id,"ativar")}>{active?"Registrado":"Usar evento"}</Button></div><p className="mt-1 text-sm text-muted-foreground">{e.description}</p><div className="mt-2 grid gap-2 text-xs md:grid-cols-2"><p><b>Gatilho:</b> {e.trigger}</p>{e.gmNote&&<p><b>Para o mestre:</b> {e.gmNote}</p>}</div></div></li>})}</ol></section>)}
  </div></Shell>;
}
