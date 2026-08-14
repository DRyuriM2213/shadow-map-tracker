import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CLUES, CONSEQUENCES, LOCATIONS } from "@/data/campaignFull";
import { NPCS } from "@/data/npcs";
import { GUIDE_BY_DAY, V3_EVENTS } from "@/data/sessionV3";
import type { CampaignDay } from "@/lib/types";
import { useCampaign } from "@/store/campaign";
import { paceLabel, paceTone, useSessionPace, useTimelineStatus } from "@/lib/clock";
import { ClockControls } from "@/components/ClockBar";
import { AlertTriangle, Save, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

const DATE: Record<CampaignDay,string> = {1:"17/08/2026",2:"18/08/2026",3:"19/08/2026",4:"20/08/2026",5:"21/08/2026"};
const SHORTCUTS = [
  { to: "/sessao-v2", label: "CONTINUAR SESSÃO", primary: true },
  { to: "/players", label: "Players / PINs", primary: true },
  { to: "/mapa", label: "Mapa", primary: false },
  { to: "/pistas-v2", label: "Pistas e documentos", primary: false },
  { to: "/npcs", label: "NPCs e falas", primary: false },
  { to: "/timeline", label: "Timeline 5 dias", primary: false },
  { to: "/locais", label: "Todos os locais", primary: false },
  { to: "/personagens", label: "Personagens", primary: false },
  { to: "/resumo", label: "Resumo / fatos", primary: false },
] as const;

function Dashboard(){
  const session=useCampaign(s=>s.session); const store=useCampaign();
  const local=LOCATIONS.find(l=>l.id===session.currentLocationId);
  const {proximo,countdown}=useTimelineStatus(); const {pace,narrativo,real}=useSessionPace();
  const found=CLUES.filter(c=>["encontrada","interpretada","encontrada-parcialmente","contingencia"].includes(session.clueStatus[c.id]??""));
  const mandatoryPending=CLUES.filter(c=>c.importance==="obrigatoria"&&!["encontrada","interpretada","contingencia"].includes(session.clueStatus[c.id]??""));
  const docs=CLUES.filter(c=>c.sourceDocument).length; const consequences=session.scheduled.filter(s=>s.status==="pendente");
  const guide=GUIDE_BY_DAY[session.day]; const dayEvents=V3_EVENTS.filter(e=>e.day===session.day&&!session.activatedEvents.includes(e.id));
  const last=session.log.at(-1);

  return <Shell><div className="mx-auto max-w-7xl space-y-5">
    <section className="dossier rounded-sm border-l-4 border-l-primary p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="stamp text-primary">Universidade Valença · controle do mestre</p><h1 className="mt-1 text-3xl font-semibold sm:text-4xl">OPERAÇÃO BERÇO VAZIO</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">O painel agora acompanha a mesa real: qualquer local, improviso livre, cinco dias, multiplayer e fog of war. A Sessão ao Vivo é o cockpit principal.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>store.createCheckpoint(`Snapshot D${session.day} ${session.time}`)}><Save className="mr-1 size-4"/>Snapshot</Button><Link to="/sessao-v2"><Button className="h-11 px-7 text-base">CONTINUAR SESSÃO</Button></Link></div></div>

      {!session.recapApplied ? <div className="mt-5 flex flex-wrap items-center gap-3 rounded-sm border border-route-amarelo/60 bg-route-amarelo/10 p-4"><AlertTriangle className="size-5 text-route-amarelo"/><div className="min-w-0 flex-1"><b>Seu navegador ainda está no estado anterior à primeira sessão.</b><p className="text-xs text-muted-foreground">Aplique o recap para ir ao ponto canônico: terça, 21h, início da invasão. Um checkpoint é criado antes.</p></div><Button onClick={()=>{store.createCheckpoint("Antes do recap da Sessão 1");store.applySessionOneRecap();}}>Aplicar recap real</Button></div> : <div className="mt-5 rounded-sm border border-route-verde-claro/40 bg-route-verde-claro/5 p-4"><p className="stamp text-route-verde-claro">PONTO ATUAL DA CAMPANHA</p><p className="mt-1 text-lg font-semibold">Invasão noturna — fim do Dia 2</p><p className="mt-1 text-sm text-muted-foreground">Sofia, Adolfo, Jade e Vitor Hugo entraram/iniciaram a invasão da universidade por volta das 21h. O próximo local é escolha deles.</p></div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Dia / data" value={`DIA ${session.day} · ${DATE[session.day]}`}/><Info label="Hora no RPG" value={session.time}/><Info label="Local atual" value={local?.name??"—"}/><Info label="Fatos de mesa" value={String(session.facts.length)}/><Info label="Pistas registradas" value={`${found.length} / ${CLUES.length}`}/><Info label="Documentos / props" value={String(docs)}/><Info label="NPCs oficiais" value={String(NPCS.length)}/><Info label="Última ação" value={last?.description??"—"}/></div>
    </section>

    <section className="grid gap-3 lg:grid-cols-3">
      <div className="dossier rounded-sm p-4"><p className="stamp text-primary">AGORA</p><p className="mt-1 font-mono text-3xl">D{session.day} · {session.time}</p><p className="text-sm font-semibold">{local?.name??"Escolha um local"}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{guide.now}</p><div className="mt-3"><ClockControls/></div></div>
      <div className="dossier rounded-sm p-4"><p className="stamp text-primary">PRESSÃO / PRÓXIMA POSSIBILIDADE</p>{proximo?<><p className="mt-1 font-mono text-3xl">{proximo.time}</p><p className="text-sm font-semibold">{proximo.title}</p><p className="text-xs text-muted-foreground">em {countdown} min de jogo · sugestão, não trilho</p><p className="mt-2 text-xs">{proximo.description}</p></>:<><p className="mt-2 text-sm text-muted-foreground">Nenhum alerta temporal próximo.</p>{dayEvents[0]&&<p className="mt-2 text-xs">Você ainda pode usar: <b>{dayEvents[0].title}</b>.</p>}</>}<p className={`stamp mt-3 ${paceTone[pace]}`}>Ritmo: {paceLabel[pace]} · narrativa {Math.round(narrativo*100)}% / sessão {Math.round(real*100)}%</p></div>
      <div className="dossier rounded-sm p-4"><p className="stamp text-primary">PISTAS IMPORTANTES AINDA ABERTAS</p><p className="mt-1 text-3xl font-semibold">{mandatoryPending.length}</p><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{mandatoryPending.slice(0,6).map(c=><li key={c.id}>• {c.name} <span className="text-foreground">· {LOCATIONS.find(l=>l.id===c.mainLocationId)?.name??"?"}</span></li>)}</ul><Link to="/pistas-v2"><Button size="sm" variant="outline" className="mt-3 w-full">Abrir pistas e documentos</Button></Link></div>
    </section>

    <section className="dossier rounded-sm p-4"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-5 text-primary"/><div><p className="stamp text-primary">REGRA NOVA DE MESTRAGEM</p><p className="mt-1 text-sm">Se os jogadores forem para um lugar que não estava previsto, não procure uma “cena certa”. Abra <b>Sessão ao Vivo → Ir para qualquer local</b>, escolha a sala e use o <b>Console de Improviso</b>. O site agora foi feito para seguir a mesa, não para obrigar a mesa a seguir o site.</p></div></div></section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{SHORTCUTS.map(item=><Link key={item.to} to={item.to} className={item.primary?"sm:col-span-2 lg:col-span-2":""}><Button variant={item.primary?"default":"secondary"} className="h-14 w-full uppercase">{item.label}</Button></Link>)}</section>

    <section className="dossier rounded-sm p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Medidores da campanha</h2><p className="text-xs text-muted-foreground">Edite somente quando o que aconteceu em mesa justificar.</p></div></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Meter label="Atenção da universidade" value={session.attentionLevel} max={5} onChange={v=>store.setMeter("attentionLevel",v)}/><Meter label="Evidências concretas" value={session.evidenceCount} max={20} onChange={v=>store.setMeter("evidenceCount",v)}/><Meter label="Exposição de Percy" value={session.percyExposure} max={5} onChange={v=>store.setMeter("percyExposure",v)}/><Meter label="Conhecimento sobre o Bloco C" value={session.blockCKnowledge} max={5} onChange={v=>store.setMeter("blockCKnowledge",v)}/></div></section>

    {consequences.length>0&&<section className="dossier rounded-sm p-5"><p className="stamp text-route-amarelo">Consequências pendentes</p><ul className="mt-2 space-y-2 text-sm">{consequences.map(p=>{const c=CONSEQUENCES.find(x=>x.id===p.consequenceId);return <li key={p.id} className="border-l-2 border-route-vermelho pl-3"><b>{c?.name??p.consequenceId}</b><span className="text-muted-foreground"> — {c?.triggerTime}</span></li>;})}</ul></section>}
  </div></Shell>;
}

function Info({label,value}:{label:string;value:string}){return <div className="rounded-sm border border-border bg-secondary/40 p-3"><p className="stamp text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;}
function Meter({label,value,max,onChange}:{label:string;value:number;max:number;onChange:(v:number)=>void}){return <div className="rounded-sm border border-border p-3"><div className="flex items-center justify-between"><p className="stamp">{label}</p><p className="font-mono text-lg">{value} / {max}</p></div><input aria-label={label} type="range" min={0} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} className="mt-2 w-full accent-[oklch(0.6_0.21_25)]"/></div>;}
