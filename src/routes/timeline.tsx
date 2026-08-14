import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { TIMELINE } from "@/data/campaignFull";
import { toMinutes, useCampaign } from "@/store/campaign";
import { AlertTriangle, Clock3 } from "lucide-react";

export const Route = createFileRoute("/timeline")({ component: TimelinePage });

function TimelinePage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const prontos=TIMELINE.filter((e)=>e.day===session.day&&toMinutes(e.time)<=toMinutes(session.time)&&!session.activatedEvents.includes(e.id));
  const activateSafely=(id:string)=>{const e=TIMELINE.find((x)=>x.id===id);if(!e)return;const future=e.day>session.day||(e.day===session.day&&toMinutes(e.time)>toMinutes(session.time));if(future&&!confirm(`Este evento é futuro (${e.time}). Ativá-lo pode ajustar o relógio. Continuar?`))return;store.activateEvent(id,"ativar");};

  return <Shell><div className="mx-auto max-w-5xl space-y-6">
    <header className="dossier rounded-sm p-4 sm:p-5"><p className="stamp text-primary">Eventos fixos dos Dias 1 e 2</p><h1 className="text-3xl font-semibold">Timeline Obrigatória</h1><p className="text-sm text-muted-foreground">Só existe uma ação persistente por evento: registrar/ativar. Assim nenhum botão de “adiar” ou “ignorar” fica reaparecendo por causa de estado incompleto.</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="font-mono text-4xl">{session.time}</span><span className="rounded-sm bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">DIA {session.day}</span><div className="flex flex-wrap gap-2">{[5,15,30,60].map((m)=><Button key={m} size="sm" variant="outline" onClick={()=>store.advanceTime(m)}>+{m===60?"1 hora":`${m} min`}</Button>)}<input type="time" value={session.time} onChange={(e)=>{if(confirm(`Ajustar o relógio para ${e.target.value}?`))store.setTime(e.target.value);}} className="rounded-sm border border-input bg-background px-2 py-1 text-sm"/><Button size="sm" variant="secondary" onClick={()=>{const target=session.day===1?2:1;if(confirm(`Trocar manualmente para o DIA ${target}?`))store.setDay(target);}}>Ir para DIA {session.day===1?2:1}</Button></div></div></header>

    {prontos.length>0&&<div className="rounded-sm border border-destructive bg-destructive/10 p-4"><p className="stamp flex items-center gap-2 text-destructive"><AlertTriangle className="size-4"/>Evento devido</p><ul className="mt-2 space-y-2 text-sm">{prontos.map((e)=><li key={e.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-destructive/20 p-2"><span className="font-mono">{e.time}</span><span className="font-semibold">{e.title}</span><span className="text-xs text-muted-foreground">{e.description}</span><Button size="sm" className="ml-auto" onClick={()=>activateSafely(e.id)}>Registrar evento</Button></li>)}</ul></div>}

    {[1,2].map((dia)=><section key={dia}><h2 className="stamp text-primary">DIA {dia} — {dia===1?"segunda, 17/08/2026":"terça, 18/08/2026"}</h2><ol className="mt-3 border-l border-border pl-5">{TIMELINE.filter((e)=>e.day===dia).map((e)=>{const ativado=session.activatedEvents.includes(e.id);const passado=dia<session.day||(dia===session.day&&toMinutes(e.time)<=toMinutes(session.time));return <li key={e.id} className="relative py-3"><span className={`absolute -left-[27px] top-5 size-3 rounded-full border-2 ${ativado?"border-route-verde-claro bg-route-verde-claro":passado?"border-primary bg-primary":"border-border bg-background"}`}/><div className={`dossier rounded-sm p-3 ${!passado?"opacity-75":""}`}><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm"><Clock3 className="mr-1 inline size-3"/>{e.time}</span><span className="font-semibold">{e.title}</span>{e.mandatory&&<span className="stamp rounded-sm border border-destructive px-1.5 text-destructive">obrigatório</span>}{ativado&&<span className="stamp text-route-verde-claro">registrado</span>}<Button size="sm" variant="ghost" className="ml-auto" disabled={ativado} onClick={()=>activateSafely(e.id)}>{ativado?"Registrado":"Registrar"}</Button></div><p className="mt-1 text-xs text-muted-foreground">{e.description}</p></div></li>;})}</ol></section>)}
  </div></Shell>;
}