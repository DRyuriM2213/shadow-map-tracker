import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CLUES, CONSEQUENCES, LOCATIONS, SCENES } from "@/data/campaignFull";
import { NPCS } from "@/data/npcs";
import { useCampaign } from "@/store/campaign";
import { routeText } from "@/lib/ui";
import { paceLabel, paceTone, useSessionPace, useTimelineStatus } from "@/lib/clock";
import { ClockControls } from "@/components/ClockBar";
import { Save } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

const SHORTCUTS = [
  { to: "/sessao-v2", label: "Continuar sessão", primary: true },
  { to: "/mapa", label: "Mapa", primary: false },
  { to: "/pistas-v2", label: "Pistas e documentos", primary: false },
  { to: "/npcs", label: "NPCs e falas", primary: false },
  { to: "/timeline", label: "Timeline", primary: false },
  { to: "/locais", label: "Locais e salas", primary: false },
  { to: "/assets", label: "Imagens / backup", primary: false },
  { to: "/diagrama", label: "Diagrama", primary: false },
  { to: "/personagens", label: "Personagens", primary: false },
  { to: "/consequencias", label: "Consequências", primary: false },
  { to: "/resumo", label: "Resumo", primary: false },
] as const;

function Dashboard() {
  const session = useCampaign((s) => s.session);
  const newSession = useCampaign((s) => s.newSession);
  const setMeter = useCampaign((s) => s.setMeter);
  const createCheckpoint = useCampaign((s) => s.createCheckpoint);
  const scene = SCENES.find((s) => s.id === session.currentSceneId);
  const local = LOCATIONS.find((l) => l.id === session.currentLocationId);
  const { proximo, countdown } = useTimelineStatus();
  const { pace, narrativo, real } = useSessionPace();
  const found = CLUES.filter((c) => ["encontrada", "interpretada", "encontrada-parcialmente", "contingencia"].includes(session.clueStatus[c.id] ?? ""));
  const mandatoryPending = CLUES.filter((c) => c.importance === "obrigatoria" && !["encontrada", "interpretada", "contingencia"].includes(session.clueStatus[c.id] ?? ""));
  const docs = CLUES.filter((c) => c.sourceDocument).length;
  const consequences = session.scheduled.filter((s) => s.status === "pendente");
  const last = session.log.at(-1);

  return <Shell><div className="mx-auto max-w-7xl space-y-5">
    <section className="dossier rounded-sm p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="stamp text-primary">Universidade Valença — controle do mestre</p><h1 className="mt-1 text-3xl font-semibold sm:text-4xl">OPERAÇÃO BERÇO VAZIO</h1><p className="mt-1 text-sm text-muted-foreground">A Sessão ao Vivo é a tela principal. Faça um snapshot antes de começar e carregue os mapas/modelos em Imagens / Backup.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>createCheckpoint(`Pré-sessão D${session.day} ${session.time}`)}><Save className="mr-1 size-4"/>Snapshot agora</Button><Link to="/sessao-v2"><Button className="h-11 px-7 text-base">CONTINUAR SESSÃO</Button></Link></div></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Dia / data" value={`DIA ${session.day} · ${session.day===1?"17/08/2026":"18/08/2026"}`}/><Info label="Hora no RPG" value={session.time}/><Info label="Local atual" value={local?.name??"—"}/><Info label="Cena atual" value={scene?.title??"—"} tone={scene?routeText[scene.route]:undefined}/><Info label="Pistas encontradas" value={`${found.length} / ${CLUES.length}`}/><Info label="Documentos / props" value={String(docs)}/><Info label="NPCs oficiais" value={String(NPCS.length)}/><Info label="Última ação" value={last?.description??"—"}/></div>
    </section>

    <section className="grid gap-3 lg:grid-cols-3"><div className="dossier rounded-sm p-4"><p className="stamp text-primary">Agora</p><p className="mt-1 font-mono text-3xl">{session.time}</p><p className="text-sm">{local?.name??"Local não definido"}</p><p className="text-xs text-muted-foreground">{scene?.title??"Sem cena ativa"}</p><div className="mt-3"><ClockControls/></div></div>
      <div className="dossier rounded-sm p-4"><p className="stamp text-primary">Próximo evento</p>{proximo?<><p className="mt-1 font-mono text-3xl">{proximo.time}</p><p className="text-sm font-semibold">{proximo.title}</p><p className="text-xs text-muted-foreground">em {countdown} min de jogo · {proximo.mandatory?"obrigatório":"opcional"}</p><p className="mt-2 text-xs">{proximo.description}</p></>:<p className="mt-2 text-sm text-muted-foreground">Nenhum evento pendente para hoje.</p>}<p className={`stamp mt-3 ${paceTone[pace]}`}>Ritmo: {paceLabel[pace]} · narrativa {Math.round(narrativo*100)}% / sessão {Math.round(real*100)}%</p></div>
      <div className="dossier rounded-sm p-4"><p className="stamp text-primary">Obrigatórias pendentes</p><p className="mt-1 text-3xl font-semibold">{mandatoryPending.length}</p><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{mandatoryPending.slice(0,6).map((c)=><li key={c.id}>• {c.name} <span className="text-foreground">DT {session.dcOverrides[c.id]??c.dc}</span></li>)}</ul><Link to="/pistas-v2"><Button size="sm" variant="outline" className="mt-3 w-full">Abrir pistas e documentos</Button></Link></div></section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{SHORTCUTS.map((item)=><Link key={item.to} to={item.to} className={item.primary?"sm:col-span-2 lg:col-span-2":""}><Button variant={item.primary?"default":"secondary"} className="h-14 w-full uppercase">{item.label}</Button></Link>)}</section>

    <section className="dossier rounded-sm p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Medidores da campanha</h2><p className="text-xs text-muted-foreground">Editáveis manualmente durante a mesa.</p></div><Button variant="outline" size="sm" onClick={()=>{if(confirm("Iniciar nova sessão? Exporte um backup antes; o estado atual será substituído."))newSession();}}>Nova sessão</Button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Meter label="Atenção da universidade" value={session.attentionLevel} max={5} onChange={(v)=>setMeter("attentionLevel",v as never)}/><Meter label="Evidências concretas" value={session.evidenceCount} max={10} onChange={(v)=>setMeter("evidenceCount",v as never)}/><Meter label="Exposição de Percy" value={session.percyExposure} max={5} onChange={(v)=>setMeter("percyExposure",v as never)}/><Meter label="Conhecimento sobre o Bloco C" value={session.blockCKnowledge} max={5} onChange={(v)=>setMeter("blockCKnowledge",v as never)}/></div></section>

    {consequences.length>0&&<section className="dossier rounded-sm p-5"><p className="stamp text-route-amarelo">Consequências pendentes</p><ul className="mt-2 space-y-2 text-sm">{consequences.map((p)=>{const c=CONSEQUENCES.find((x)=>x.id===p.consequenceId);return <li key={p.id} className="border-l-2 border-route-vermelho pl-3"><b>{c?.name??p.consequenceId}</b><span className="text-muted-foreground"> — {c?.triggerTime}</span></li>;})}</ul></section>}
  </div></Shell>;
}

function Info({label,value,tone}:{label:string;value:string;tone?:string}){return <div className="rounded-sm border border-border bg-secondary/40 p-3"><p className="stamp text-muted-foreground">{label}</p><p className={`mt-1 text-sm font-medium ${tone??""}`}>{value}</p></div>;}
function Meter({label,value,max,onChange}:{label:string;value:number;max:number;onChange:(v:number)=>void}){return <div className="rounded-sm border border-border p-3"><div className="flex items-center justify-between"><p className="stamp">{label}</p><p className="font-mono text-lg">{value} / {max}</p></div><input aria-label={label} type="range" min={0} max={max} value={value} onChange={(e)=>onChange(Number(e.target.value))} className="mt-2 w-full accent-[oklch(0.6_0.21_25)]"/></div>;}
