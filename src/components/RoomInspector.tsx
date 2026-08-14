import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUES, LOCATIONS, TESTS } from "@/data/campaignFull";
import { DOCUMENT_META } from "@/data/documentMeta";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, importanceLabel, locationStatusLabel, routeDot } from "@/lib/ui";
import { DC_PRESETS } from "@/lib/clock";
import type { Clue, ClueStatus, LocationStatus } from "@/lib/types";
import { TestDialog } from "@/components/TestDialog";
import { AlertTriangle, Lock } from "lucide-react";

const STATUSES: ClueStatus[] = ["escondida","disponivel","encontrada","encontrada-parcialmente","interpretada","nao-interpretada","perdida","destruida","removida","contingencia"];
const LOC_STATUSES: LocationStatus[] = ["nao-visitada","disponivel","investigando","investigada-parcial","investigada-completa","bloqueada","isolada","inacessivel","revisitavel"];

export function cluesForLocation(locationId: string): Clue[] {
  const loc = LOCATIONS.find((l) => l.id === locationId);
  const ids = new Set<string>(loc?.clueIds ?? []);
  CLUES.forEach((c) => { if (c.mainLocationId === locationId || c.alternativeLocationIds.includes(locationId)) ids.add(c.id); });
  return [...ids].map((id) => CLUES.find((c) => c.id === id)).filter((c): c is Clue => !!c);
}

export function RoomInspector({ locationId, compact = false }: { locationId: string; compact?: boolean }) {
  const session = useCampaign((s) => s.session);
  const setLocationStatus = useCampaign((s) => s.setLocationStatus);
  const setClockRunning = useCampaign((s) => s.setClockRunning);
  const [testId, setTestId] = useState<string | null>(null);
  const local = LOCATIONS.find((l) => l.id === locationId);
  if (!local) return null;
  const achados = cluesForLocation(locationId);
  const pendentes = achados.filter((c) => !["encontrada","interpretada","contingencia"].includes(session.clueStatus[c.id] ?? "")).length;
  const openTest = (id: string) => { if (session.autoPauseOnTest) setClockRunning(false); setTestId(id); };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3"><div><p className="stamp text-primary">Inspector de sala</p><h2 className="font-display text-2xl">{local.name}</h2><p className="text-xs text-muted-foreground">{local.sector} · {achados.length} achados possíveis · {pendentes} pendentes</p></div><div className="ml-auto"><select className="rounded-sm border border-input bg-background px-2 py-1 text-xs" value={session.locationStatus[local.id] ?? "nao-visitada"} onChange={(e)=>setLocationStatus(local.id,e.target.value as LocationStatus)}>{LOC_STATUSES.map((s)=><option key={s} value={s}>{locationStatusLabel[s]}</option>)}</select></div></div>
    {!compact&&<p className="text-sm text-muted-foreground">{local.description}</p>}

    <div className="rounded-sm border border-primary/50 p-3"><p className="stamp text-primary">Nesta sala eles podem encontrar</p><div className="mt-3 space-y-3">{achados.map((c)=><FindingCard key={c.id} clue={c} onTest={openTest}/>)}{achados.length===0&&<p className="text-sm text-muted-foreground">Nenhuma pista cadastrada aqui. O mestre ainda pode entregar uma pista manualmente pelo catálogo global.</p>}</div></div>

    {!compact&&<div className="grid gap-3 md:grid-cols-2"><Bloco titulo="Ações possíveis" itens={local.actions}/><Bloco titulo="Perigos" itens={local.risks}/><Bloco titulo="Pessoas / presenças possíveis" itens={local.people}/><Bloco titulo="Consequências" itens={local.consequences}/></div>}
    {local.testIds.length>0&&<div><p className="stamp text-muted-foreground">Testes desta sala</p><div className="mt-1 flex flex-wrap gap-2">{local.testIds.map((t)=><Button key={t} size="sm" variant="outline" onClick={()=>openTest(t)}>{TESTS.find((x)=>x.id===t)?.name??t}</Button>)}</div></div>}
    <TestDialog testId={testId} onClose={()=>setTestId(null)}/>
  </div>;
}

function FindingCard({ clue, onTest }: { clue: Clue; onTest: (id: string) => void }) {
  const session = useCampaign((s) => s.session);
  const setClue = useCampaign((s) => s.setClue);
  const setDc = useCampaign((s) => s.setDc);
  const setClockRunning = useCampaign((s) => s.setClockRunning);
  const [editDc,setEditDc]=useState(false);
  const [aberto,setAberto]=useState(false);
  const st=session.clueStatus[clue.id]??"escondida";
  const dc=session.dcOverrides[clue.id]??clue.dc;
  const meta=DOCUMENT_META[clue.sourceDocument];
  const pause=()=>{if(session.autoPauseOnTest)setClockRunning(false);};

  return <div className="rounded-sm border border-border bg-card/40 p-3">
    <button className="flex w-full items-start gap-2 text-left" onClick={()=>{pause();setAberto((v)=>!v);}}><span className={`mt-1.5 size-2 shrink-0 rounded-full ${routeDot[clue.route]}`}/><div className="min-w-0 flex-1"><p className="font-semibold">{clue.name}{clue.isSecret&&<span className="stamp ml-2 text-route-roxo">secreta</span>}{clue.isFuture&&<span className="stamp ml-2 text-route-azul">futura</span>}{meta?.continuityWarning&&<span className="stamp ml-2 text-route-amarelo">conflito</span>}</p><p className="text-xs text-muted-foreground">{clue.microLocation||clue.exactLocation||"Local exato não definido"}</p>{clue.sourceDocument&&<p className="mt-0.5 truncate font-mono text-[10px] text-primary">{clue.sourceDocument}{meta?.code?` · ${meta.code}`:""}</p>}</div><span className="shrink-0 rounded-sm bg-primary px-2 py-0.5 font-mono text-sm font-bold text-primary-foreground">DT {dc}</span><span className="hidden shrink-0 rounded-sm bg-secondary px-2 py-0.5 text-[11px] sm:inline">{clueStatusLabel[st]}</span></button>
    {aberto&&<div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
      {meta?.continuityWarning&&<div className="rounded-sm border border-route-amarelo/60 bg-route-amarelo/10 p-2"><p className="stamp text-route-amarelo"><AlertTriangle className="mr-1 inline size-3.5"/>Aviso privado de continuidade</p><p className="mt-1 text-xs">{meta.continuityWarning}</p></div>}
      <p className="paper-sheet rounded-sm p-3">{clue.playerDescription}</p>
      <div className="grid gap-2 md:grid-cols-2"><L k="Local exato" v={clue.exactLocation||clue.microLocation||"—"}/><L k="Ação que dispara a busca" v={clue.discoveryTrigger||clue.actionRequired}/><L k="Perícia sugerida" v={clue.suggestedSkill}/><L k="Importância" v={importanceLabel[clue.importance]??clue.importance}/><L k="Documento associado" v={clue.sourceDocument||"—"}/><L k="Código" v={meta?.code||"—"}/><L k="Dia recomendado" v={clue.recommendedDay?`Dia ${clue.recommendedDay} (recomendação apenas)`:"Livre / sem dia recomendado"}/><L k="Estado" v={clueStatusLabel[st]}/></div>
      <L k="Sucesso" v={clue.successResult} tone="text-route-verde-claro"/><L k="Sucesso parcial" v={clue.partialSuccess} tone="text-route-amarelo"/><L k="Falha" v={clue.failureResult} tone="text-route-vermelho"/><L k="Falha crítica" v={clue.criticalFailure} tone="text-destructive"/><L k="Consequência / desbloqueio" v={clue.unlocks||"—"}/>
      <p className="rounded-sm border border-route-preto bg-black/40 p-2"><span className="stamp text-route-cinza"><Lock className="mr-1 inline size-3.5"/>Segredo do mestre: </span>{clue.masterMeaning||"—"}</p>
      {clue.fallbackOptions.length>0&&<L k="Contingência" v={clue.fallbackOptions.join(" • ")}/>} 
      <div className="flex flex-wrap items-center gap-2 pt-1">{clue.testId&&<Button size="sm" onClick={()=>onTest(clue.testId!)}>ABRIR TESTE</Button>}<Button size="sm" variant="secondary" onClick={()=>{pause();setClue(clue.id,"encontrada",`Entregue manualmente pelo mestre — ${clue.name}`);}}>ENTREGAR PISTA</Button><select className="rounded-sm border border-input bg-background px-2 py-1 text-xs" value={st} onChange={(e)=>setClue(clue.id,e.target.value as ClueStatus,clue.name)}>{STATUSES.map((s)=><option key={s} value={s}>{clueStatusLabel[s]}</option>)}</select><Button size="sm" variant="ghost" onClick={()=>setEditDc((v)=>!v)}>editar DT</Button></div>
      {editDc&&<div className="flex flex-wrap items-center gap-2 rounded-sm border border-border p-2">{DC_PRESETS.map((p)=><Button key={p.value} size="sm" variant="outline" onClick={()=>setDc(clue.id,p.value)}>{p.label} ({p.value})</Button>)}<Input type="number" className="h-8 w-24" defaultValue={dc} onBlur={(e)=>setDc(clue.id,Number(e.target.value)||dc)}/></div>}
    </div>}
  </div>;
}

function L({k,v,tone}:{k:string;v:string;tone?:string}){return <p className="text-sm"><span className={`stamp ${tone??"text-muted-foreground"}`}>{k}: </span>{v}</p>;}
function Bloco({titulo,itens}:{titulo:string;itens:string[]}){if(!itens.length)return null;return <div className="rounded-sm border border-border/70 p-3"><p className="stamp text-muted-foreground">{titulo}</p><ul className="mt-1 space-y-1 text-sm">{itens.map((i)=><li key={i}>• {i}</li>)}</ul></div>;}
