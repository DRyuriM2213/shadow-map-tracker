import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CharacterSheetPanel } from "@/components/player/CharacterSheetPanel";
import { DicePanel, OrdemRollResult, type RollVisibility } from "@/components/player/DicePanel";
import { FogMap } from "@/components/player/FogMap";
import { PlayerIntro } from "@/components/player/PlayerIntro";
import { SKILLS, TRAINING_BONUS, normalizeSheet, type CharacterSheetData, type OrdemAttribute } from "@/data/ordemRules";
import { isCritical, parseAndRollFormula, rollOrdemTest, uid } from "@/lib/dice";
import { cloudConfigured, getCloudSession, loginCloud, logoutCloud, requirePlayerSession, rpc } from "@/lib/cloud";
import type { CloudDocument, CloudNotification, CloudRoll, PlayerBootstrapData, PlayerNote, PlayerRoleType } from "@/lib/playerCloudTypes";
import { normalizePublicState } from "@/lib/playerCloudTypes";
import { Bell, BookOpen, ClipboardList, Cloud, Dice5, FileText, LogOut, Map, NotebookPen, Shield, UserRound } from "lucide-react";

export const Route = createFileRoute("/player")({ component: PlayerPage });

type Tab = "inicio" | "ficha" | "rolagens" | "mapa" | "pistas" | "documentos" | "anotacoes";
const TABS: Array<{id:Tab;label:string;icon:typeof Shield}> = [
  {id:"inicio",label:"Início",icon:Shield},{id:"ficha",label:"Ficha",icon:UserRound},{id:"rolagens",label:"Rolagens",icon:Dice5},{id:"mapa",label:"Mapa",icon:Map},{id:"pistas",label:"Pistas",icon:ClipboardList},{id:"documentos",label:"Documentos",icon:FileText},{id:"anotacoes",label:"Anotações",icon:NotebookPen},
];

function PlayerPage() {
  const preview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";
  const [cloudSession, setCloudSessionState] = useState(() => getCloudSession());
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [data, setData] = useState<PlayerBootstrapData | null>(null);
  const [sheet, setSheet] = useState<CharacterSheetData>(()=>normalizeSheet({}));
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState("aguardando");
  const [tab, setTab] = useState<Tab>("inicio");
  const [showIntro, setShowIntro] = useState(false);
  const [lastResult, setLastResult] = useState<null|{label:string;dice:number[];chosenIndex:number;chosen:number;bonus:number;total:number;mode:string;note?:string}>(null);
  const [visibility, setVisibility] = useState<RollVisibility>("PUBLICA");
  const [pollError, setPollError] = useState("");

  useEffect(()=>{dirtyRef.current=dirty;},[dirty]);

  const loadPreview = useCallback(async () => {
    const master = getCloudSession(); const id = sessionStorage.getItem("berco-vazio-preview-player");
    if (!preview || master?.role!=="MASTER" || !id) return false;
    const [detail,dashboard] = await Promise.all([
      rpc<Record<string,unknown>>("master_get_player_detail",{p_token:master.token,p_player_id:id}),
      rpc<Record<string,unknown>>("master_dashboard",{p_token:master.token}),
    ]);
    const profile=(detail.profile??{}) as PlayerBootstrapData["profile"];
    const rawReveals=(dashboard.mapReveals??[]) as PlayerBootstrapData["mapReveals"];
    const rawRegions=(dashboard.mapRegions??[]) as PlayerBootstrapData["mapRegions"];
    const previewData:PlayerBootstrapData={ok:true,profile,publicState:(dashboard.publicState??{}) as Record<string,unknown>,sheet:(detail.sheet??{}) as Partial<CharacterSheetData>,notes:[],rolls:((detail.rolls??[]) as CloudRoll[]),notifications:((detail.notifications??[]) as PlayerBootstrapData["notifications"]),clues:((detail.clues??[]) as PlayerBootstrapData["clues"]).filter(c=>(c as unknown as {active?:boolean}).active!==false),documents:((detail.documents??[]) as PlayerBootstrapData["documents"]).filter(d=>(d as unknown as {active?:boolean}).active!==false),mapRegions:rawRegions,mapReveals:rawReveals,assets:[],serverTime:""};
    setData(previewData); setSheet(normalizeSheet(previewData.sheet)); setSaveStatus("prévia somente leitura"); return true;
  },[preview]);

  const refresh = useCallback(async (quiet=false) => {
    try {
      if (await loadPreview()) return;
      const current=requirePlayerSession(); if(!current) return;
      const result=await rpc<PlayerBootstrapData>("player_bootstrap",{p_token:current.token});
      if(!result.ok) throw new Error(result.error||"Sessão expirada");
      setData(result); setCloudSessionState(current); setPollError("");
      if(!quiet||!dirtyRef.current) setSheet(normalizeSheet(result.sheet));
    } catch(e){setPollError(e instanceof Error?e.message:"Falha de sincronização");}
  },[loadPreview]);

  useEffect(()=>{if(cloudSession?.role==="PLAYER"||preview)void refresh();},[cloudSession?.role,preview,refresh]);
  useEffect(()=>{if(!(cloudSession?.role==="PLAYER")||preview)return;const i=window.setInterval(()=>void refresh(true),2500);return()=>window.clearInterval(i);},[cloudSession?.role,preview,refresh]);

  useEffect(()=>{
    if(!dirty||preview||!data?.profile.canEditSheet)return;
    const current=requirePlayerSession(); if(!current)return;
    setSaveStatus("salvando…");
    const t=window.setTimeout(()=>{void rpc<{ok:boolean;error?:string}>("player_save_sheet",{p_token:current.token,p_data:sheet}).then(r=>{if(!r.ok)throw new Error(r.error||"Falha ao salvar");setDirty(false);setSaveStatus("salvo no Cloud");}).catch(e=>setSaveStatus(`erro: ${e instanceof Error?e.message:"falha"}`));},750);
    return()=>window.clearTimeout(t);
  },[dirty,sheet,preview,data?.profile.canEditSheet]);

  useEffect(()=>{if(!lastResult)return;const t=window.setTimeout(()=>setLastResult(null),6500);return()=>window.clearTimeout(t);},[lastResult]);

  useEffect(()=>{
    if(!data||preview)return;
    const seen=localStorage.getItem(`berco-intro-seen:${data.profile.id}`);
    if(!seen)setShowIntro(true);
  },[data,preview]);

  const authenticate=async()=>{setAuthBusy(true);setAuthError("");try{const result=await loginCloud(pin.trim());if(!result||result.role!=="PLAYER")throw new Error("Este PIN não pertence a um player ativo.");setCloudSessionState(result);setPin("");}catch(e){setAuthError(e instanceof Error?e.message:"PIN inválido");}finally{setAuthBusy(false);}};

  const updateSheet=(next:CharacterSheetData)=>{if(preview||!data?.profile.canEditSheet)return;setSheet(next);setDirty(true);setSaveStatus("alterações locais");};

  const logRoll=async(input:{label:string;formula:string;payload:Record<string,unknown>;total:number;visibility:RollVisibility})=>{
    if(preview)return;
    const current=requirePlayerSession();if(!current)return;
    await rpc("player_log_roll",{p_token:current.token,p_payload:input});
    await refresh(true);
  };

  const rollAttribute=async(attr:OrdemAttribute)=>{const r=rollOrdemTest(attr,sheet.attributes[attr],0,0);setLastResult({label:`Teste de ${attr}`,dice:r.dice,chosenIndex:r.chosenIndex,chosen:r.chosen,bonus:0,total:r.total,mode:r.mode});await logRoll({label:`Atributo ${attr}`,formula:`${r.dice.length}d20 ${r.mode}`,payload:{...r},total:r.total,visibility});};
  const rollSkill=async(skillId:string)=>{const def=SKILLS.find(s=>s.id===skillId);if(!def)return;const skill=sheet.skills[skillId]??{training:"DESTREINADO" as const,otherBonus:0};const bonus=TRAINING_BONUS[skill.training]+Number(skill.otherBonus||0);const r=rollOrdemTest(def.attribute,sheet.attributes[def.attribute],TRAINING_BONUS[skill.training],Number(skill.otherBonus||0));setLastResult({label:skillId==="profissao"&&skill.customName?skill.customName:def.name,dice:r.dice,chosenIndex:r.chosenIndex,chosen:r.chosen,bonus,total:r.total,mode:r.mode});await logRoll({label:`Perícia ${def.name}`,formula:`${r.dice.length}d20 ${r.mode} + ${bonus}`,payload:{...r,skillId},total:r.total,visibility});};
  const rollAttack=async(attackId:string)=>{const atk=sheet.attacks.find(a=>a.id===attackId);if(!atk)return;const skill=sheet.skills[atk.skillId]??{training:"DESTREINADO" as const,otherBonus:0};const base=TRAINING_BONUS[skill.training]+Number(skill.otherBonus||0)+Number(atk.bonus||0);const r=rollOrdemTest(atk.attribute,sheet.attributes[atk.attribute],TRAINING_BONUS[skill.training],Number(skill.otherBonus||0)+Number(atk.bonus||0));const crit=isCritical(r.chosen,atk.criticalMargin);setLastResult({label:`Ataque · ${atk.name}`,dice:r.dice,chosenIndex:r.chosenIndex,chosen:r.chosen,bonus:base,total:r.total,mode:r.mode,note:crit?`Crítico pela margem ${atk.criticalMargin}.`:undefined});sessionStorage.setItem("berco-last-critical-attack",crit?attackId:"");await logRoll({label:`Ataque ${atk.name}${crit?" · CRÍTICO":""}`,formula:`${r.dice.length}d20 ${r.mode} + ${base}`,payload:{...r,attackId,critical:crit,criticalMargin:atk.criticalMargin},total:r.total,visibility});};
  const rollDamage=async(attackId:string)=>{const atk=sheet.attacks.find(a=>a.id===attackId);if(!atk)return;let formula=atk.damage||"1d6";const critical=sessionStorage.getItem("berco-last-critical-attack")===attackId;if(critical&&atk.criticalMultiplier>1){formula=formula.replace(/^(\d*)d/i,(_,n)=>`${Math.max(1,Number(n||1))*atk.criticalMultiplier}d`);}try{const r=parseAndRollFormula(formula);setLastResult({label:`Dano · ${atk.name}`,dice:r.dice.map(d=>d.value),chosenIndex:-1,chosen:r.total,bonus:r.modifier,total:r.total,mode:"SOMA",note:critical?`Dados multiplicados por x${atk.criticalMultiplier} devido ao crítico anterior.`:undefined});await logRoll({label:`Dano ${atk.name}${critical?" · CRÍTICO":""}`,formula:r.formula,payload:{dice:r.dice,modifier:r.modifier,critical},total:r.total,visibility});sessionStorage.removeItem("berco-last-critical-attack");}catch(e){setPollError(e instanceof Error?e.message:"Dano inválido");}};

  if(!cloudConfigured()&&!preview)return <StandaloneLogin warning="O build publicado ainda não recebeu as variáveis do Lovable Cloud." pin={pin} setPin={setPin} busy={authBusy} error={authError} onLogin={authenticate}/>;
  if(!data)return <StandaloneLogin warning={pollError} pin={pin} setPin={setPin} busy={authBusy} error={authError} onLogin={authenticate}/>;

  const state=normalizePublicState(data.publicState);
  const unread=data.notifications.filter(n=>!(n.isRead??n.is_read)).length;
  const theme=themeFor(data.profile.roleType);
  const symbolUrl=data.assets.find(a=>(a.assetKey??a.asset_key)==="ordem-symbol")?.publicUrl??data.assets.find(a=>(a.assetKey??a.asset_key)==="ordem-symbol")?.public_url;

  return <div className={`min-h-screen ${theme.page}`}>
    {showIntro&&<PlayerIntro name={data.profile.playerName} role={data.profile.roleType} symbolUrl={symbolUrl} onDone={()=>{localStorage.setItem(`berco-intro-seen:${data.profile.id}`,"1");setShowIntro(false);}}/>}
    <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${theme.header}`}><div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-5"><div className={`flex size-10 items-center justify-center rounded-full border ${theme.badge}`}><Shield className="size-5"/></div><div className="min-w-0"><p className="truncate font-semibold">{data.profile.characterName||data.profile.playerName}</p><p className="stamp truncate text-[9px] opacity-60">{data.profile.playerName} · {data.profile.roleType.replaceAll("_"," ")}</p></div><div className="ml-auto text-right"><p className="font-mono text-sm">DIA {state.day} · {state.time}</p>{state.shareLocation&&<p className="max-w-36 truncate text-[10px] opacity-60">{state.currentLocationName||"local não informado"}</p>}</div><Button size="sm" variant="ghost" onClick={()=>{if(preview)window.close();else void logoutCloud().then(()=>window.location.assign("/"));}}><LogOut className="size-4"/></Button></div><nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2 sm:px-5">{TABS.map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>setTab(t.id)} className={`relative flex shrink-0 items-center gap-1 rounded-sm px-3 py-2 text-xs ${tab===t.id?theme.active:"opacity-60 hover:opacity-100"}`}><Icon className="size-3.5"/>{t.label}{t.id==="inicio"&&unread>0&&<span className="ml-1 rounded-full bg-red-600 px-1.5 text-[9px] text-white">{unread}</span>}</button>})}</nav></header>
    {preview&&<div className="sticky top-[105px] z-30 bg-route-amarelo/90 px-3 py-1 text-center text-xs font-semibold text-black">PRÉVIA DO MESTRE — somente leitura; notas privadas do player não são exibidas.</div>}
    {pollError&&<div className="mx-auto mt-3 max-w-7xl px-3"><p className="rounded-sm border border-route-amarelo/50 bg-route-amarelo/10 p-2 text-xs">Cloud temporariamente sem sincronizar: {pollError}</p></div>}
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6">
      {tab==="inicio"&&<Home data={data} state={state} onTab={setTab} onReplay={()=>setShowIntro(true)} onRead={async id=>{if(preview)return;const current=requirePlayerSession();if(!current)return;await rpc("player_mark_notification",{p_token:current.token,p_notification_id:id});await refresh(true);}}/>}
      {tab==="ficha"&&<CharacterSheetPanel sheet={sheet} editable={!preview&&data.profile.canEditSheet} saveStatus={saveStatus} onChange={updateSheet} onRollAttribute={rollAttribute} onRollSkill={rollSkill} onRollAttack={rollAttack} onRollDamage={rollDamage}/>} 
      {tab==="rolagens"&&<div className="space-y-3"><div className="flex justify-end gap-2"><Button size="sm" variant={visibility==="PUBLICA"?"default":"outline"} onClick={()=>setVisibility("PUBLICA")}>Próximas: públicas</Button><Button size="sm" variant={visibility==="PRIVADA"?"default":"outline"} onClick={()=>setVisibility("PRIVADA")}>Próximas: privadas</Button></div><DicePanel rolls={data.rolls} onLog={logRoll}/></div>}
      {tab==="mapa"&&<FogMap playerId={data.profile.id} regions={data.mapRegions} reveals={data.mapReveals} assets={data.assets}/>} 
      {tab==="pistas"&&<Clues clues={data.clues}/>} 
      {tab==="documentos"&&<Documents documents={data.documents}/>} 
      {tab==="anotacoes"&&<Notes notes={data.notes} preview={preview} onRefresh={()=>refresh(true)}/>} 
    </main>
    <OrdemRollResult result={lastResult}/>
  </div>;
}

function StandaloneLogin({warning,pin,setPin,busy,error,onLogin}:{warning?:string;pin:string;setPin:(v:string)=>void;busy:boolean;error:string;onLogin:()=>Promise<void>}){return <div className="flex min-h-screen items-center justify-center bg-[#05070a] p-4"><div className="w-full max-w-sm rounded-sm border border-cyan-900/60 bg-black/60 p-6 text-zinc-100"><p className="stamp text-cyan-400">Terminal de jogador</p><h1 className="mt-2 text-2xl font-semibold">Operação Berço Vazio</h1><p className="mt-1 text-sm text-zinc-500">Digite o PIN entregue pelo mestre.</p><div className="mt-6"><Label>PIN</Label><Input className="mt-1 bg-black" inputMode="numeric" autoFocus value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void onLogin();}}/></div><Button className="mt-3 w-full" disabled={busy} onClick={()=>void onLogin()}><Cloud className="mr-1 size-4"/>{busy?"Conectando…":"Entrar"}</Button>{error&&<p className="mt-2 text-xs text-red-400">{error}</p>}{warning&&<p className="mt-3 text-xs text-amber-400">{warning}</p>}</div></div>}

function Home({data,state,onTab,onReplay,onRead}:{data:PlayerBootstrapData;state:ReturnType<typeof normalizePublicState>;onTab:(t:Tab)=>void;onReplay:()=>void;onRead:(id:string)=>Promise<void>}){const sheet=normalizeSheet(data.sheet);const notifs=data.notifications.slice(0,8);return <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-3"><Resource label="PV" current={sheet.resources.pv} max={sheet.resources.pvMax}/><Resource label="PE" current={sheet.resources.pe} max={sheet.resources.peMax}/><Resource label="SAN" current={sheet.resources.san} max={sheet.resources.sanMax}/></section><section className="rounded-sm border border-border bg-card/35 p-5"><p className="stamp text-primary">Situação atual</p><h2 className="font-display text-2xl">DIA {state.day} · {state.time}</h2>{state.shareLocation&&<p className="mt-1 text-sm">📍 {state.currentLocationName||"Local não informado"}</p>}{state.objective&&<div className="mt-3 rounded-sm border border-primary/30 bg-primary/10 p-3"><p className="stamp text-primary">Objetivo compartilhado</p><p>{state.objective}</p></div>}<div className="mt-4 grid grid-cols-3 gap-2"><Button variant="outline" onClick={()=>onTab("mapa")}><Map className="mr-1 size-4"/>Mapa</Button><Button variant="outline" onClick={()=>onTab("pistas")}><ClipboardList className="mr-1 size-4"/>Pistas</Button><Button variant="outline" onClick={()=>onTab("rolagens")}><Dice5 className="mr-1 size-4"/>Dados</Button></div></section><section className="grid gap-4 lg:grid-cols-2"><div className="rounded-sm border border-border bg-card/35 p-4"><div className="flex items-center"><div><p className="stamp text-primary">Notificações</p><h3 className="font-semibold">Terminal</h3></div><Button size="sm" variant="ghost" className="ml-auto" onClick={onReplay}>Rever intro</Button></div><div className="mt-3 space-y-2">{notifs.map(n=>{const read=n.isRead??n.is_read;return <button key={n.id} onClick={()=>void onRead(n.id)} className={`w-full rounded-sm border p-3 text-left ${read?"border-border opacity-60":"border-primary/50 bg-primary/5"}`}><div className="flex items-center"><Bell className="mr-2 size-3.5"/><b className="text-sm">{n.title}</b>{!read&&<span className="ml-auto size-2 rounded-full bg-primary"/>}</div><p className="mt-1 text-xs text-muted-foreground">{n.body}</p></button>})}{notifs.length===0&&<p className="text-sm text-muted-foreground">Nenhuma notificação.</p>}</div></div><div className="rounded-sm border border-border bg-card/35 p-4"><p className="stamp text-primary">Últimas pistas</p><div className="mt-3 space-y-2">{data.clues.slice(0,5).map(c=><button key={c.id} className="w-full rounded-sm border border-border p-3 text-left" onClick={()=>onTab("pistas")}><b className="text-sm">{c.title}</b><p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p></button>)}{data.clues.length===0&&<p className="text-sm text-muted-foreground">Nenhuma pista recebida ainda.</p>}</div></div></section></div>}

function Clues({clues}:{clues:PlayerBootstrapData["clues"]}){return <section><p className="stamp text-primary">Dossiê pessoal</p><h2 className="font-display text-3xl">Pistas recebidas</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{clues.map(c=><article key={c.id} className="rounded-sm border border-border bg-card/35 p-4"><p className="font-semibold">{c.title}</p><p className="mt-2 text-sm leading-relaxed">{c.description}</p>{(c.documentTitle??c.document_title)&&<p className="mt-3 font-mono text-xs text-primary">DOCUMENTO: {c.documentTitle??c.document_title}</p>}{(c.privateMessage??c.private_message)&&<div className="mt-3 rounded-sm border border-primary/40 bg-primary/10 p-2 text-xs"><b>Mensagem do mestre:</b> {c.privateMessage??c.private_message}</div>}</article>)}{clues.length===0&&<Empty text="Nenhuma pista foi liberada para você ainda."/>}</div></section>}
function Documents({documents}:{documents:CloudDocument[]}){return <section><p className="stamp text-primary">Arquivo liberado</p><h2 className="font-display text-3xl">Documentos</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{documents.map(d=><article key={d.id} className="rounded-sm border border-border bg-card/35 p-4"><BookOpen className="mb-3 size-5 text-primary"/><p className="font-semibold">{d.title}</p><p className="mt-2 text-sm text-muted-foreground">{d.description}</p>{(d.privateMessage??d.private_message)&&<p className="mt-3 rounded-sm border border-primary/40 bg-primary/10 p-2 text-xs">{d.privateMessage??d.private_message}</p>}</article>)}{documents.length===0&&<Empty text="Nenhum documento foi liberado para você ainda."/>}</div></section>}

function Notes({notes,preview,onRefresh}:{notes:PlayerNote[];preview:boolean;onRefresh:()=>Promise<void>}){const [title,setTitle]=useState("");const [body,setBody]=useState("");const [share,setShare]=useState(false);const save=async()=>{if(preview||!body.trim())return;const current=requirePlayerSession();if(!current)return;await rpc("player_save_note",{p_token:current.token,p_payload:{title,body,tags:[],shareWithMaster:share}});setTitle("");setBody("");setShare(false);await onRefresh();};const remove=async(id:string)=>{if(preview)return;const current=requirePlayerSession();if(!current)return;if(!confirm("Excluir esta anotação?"))return;await rpc("player_delete_note",{p_token:current.token,p_note_id:id});await onRefresh();};return <section><p className="stamp text-primary">Caderno individual</p><h2 className="font-display text-3xl">Anotações</h2>{!preview&&<div className="mt-4 rounded-sm border border-border bg-card/35 p-4"><Input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)}/><Textarea className="mt-2" placeholder="Sua anotação…" value={body} onChange={e=>setBody(e.target.value)}/><label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)}/>Compartilhar esta nota com o mestre</label><Button className="mt-3" disabled={!body.trim()} onClick={()=>void save()}>Salvar nota</Button></div>}<div className="mt-4 grid gap-3 md:grid-cols-2">{notes.map(n=><article key={n.id} className="rounded-sm border border-border bg-card/35 p-4"><div className="flex items-center"><b>{n.title||"Nota"}</b><span className="ml-auto stamp text-[9px] text-muted-foreground">{(n.shareWithMaster??n.share_with_master)?"mestre pode ver":"privada"}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{n.body}</p>{!preview&&<Button size="sm" variant="ghost" className="mt-2 text-destructive" onClick={()=>void remove(n.id)}>Excluir</Button>}</article>)}{notes.length===0&&<Empty text="Nenhuma anotação criada."/>}</div></section>}

function Resource({label,current,max}:{label:string;current:number;max:number}){const pct=max>0?Math.max(0,Math.min(100,current/max*100)):0;return <div className="rounded-sm border border-border bg-card/35 p-3"><div className="flex items-end"><span className="stamp text-muted-foreground">{label}</span><b className="ml-auto font-mono text-xl">{current}/{max}</b></div><div className="mt-2 h-1.5 overflow-hidden rounded bg-secondary"><div className="h-full bg-primary" style={{width:`${pct}%`}}/></div></div>}
function Empty({text}:{text:string}){return <div className="rounded-sm border border-dashed border-border p-6 text-sm text-muted-foreground">{text}</div>}
function themeFor(role:PlayerRoleType){if(role==="AGENTE_DA_ORDEM")return{page:"bg-[#03080f] text-cyan-50",header:"border-cyan-900/50 bg-[#03080f]/90",badge:"border-cyan-500/60 bg-cyan-950/50 text-cyan-300",active:"bg-cyan-900/70 text-cyan-100"};if(role==="VILAO")return{page:"bg-[#0b0202] text-red-50",header:"border-red-950 bg-[#0b0202]/92",badge:"border-red-600/60 bg-red-950/50 text-red-400",active:"bg-red-950 text-red-100"};return{page:"bg-[#0c0a06] text-amber-50",header:"border-amber-950/70 bg-[#0c0a06]/92",badge:"border-amber-500/50 bg-amber-950/30 text-amber-300",active:"bg-amber-950/80 text-amber-100"};}
