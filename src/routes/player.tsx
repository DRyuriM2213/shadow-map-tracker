import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CharacterSheetPanel } from "@/components/player/CharacterSheetPanel";
import { DicePanel, OrdemRollResult, type RollVisibility } from "@/components/player/DicePanel";
import { FogMap } from "@/components/player/FogMap";
import { PlayerIntro } from "@/components/player/PlayerIntro";
import { PlayerPreferencesDialog } from "@/components/player/PlayerPreferencesDialog";
import { TranscendenceOverlay } from "@/components/player/TranscendenceOverlay";
import { PlayerCombatMode } from "@/components/player/PlayerCombatMode";
import { InvestigationBoard } from "@/components/player/InvestigationBoard";
import { PlayerSpecialEventOverlay, type SpecialEventKind } from "@/components/player/PlayerSpecialEventOverlay";
import { ProgressionUnlockOverlay } from "@/components/player/ProgressionUnlockOverlay";
import { accentVariables, usePlayerAudio, usePlayerPreferences } from "@/hooks/usePlayerExperience";
import { SKILLS, TRAINING_BONUS, normalizeSheet, type CharacterSheetData, type OrdemAttribute } from "@/data/ordemRules";
import { combatAttackById } from "@/data/combatRules";
import { MILESTONES } from "@/data/ordemProgression";
import { isCritical, parseAndRollFormula, rollOrdemTest, uid } from "@/lib/dice";
import { cloudConfigured, getCloudSession, loginCloud, logoutCloud, requirePlayerSession, rpc } from "@/lib/cloud";
import type { CloudDocument, CloudNotification, CloudRoll, PlayerBootstrapData, PlayerNote, PlayerRoleType } from "@/lib/playerCloudTypes";
import { normalizePublicState } from "@/lib/playerCloudTypes";
import { Bell, BookOpen, ClipboardList, Cloud, Dice5, FileText, LogOut, Map, Network, NotebookPen, Search, Settings2, Shield, Swords, UserRound, X } from "lucide-react";

export const Route = createFileRoute("/player")({ component: PlayerPage });

type Tab = "inicio" | "ficha" | "investigacao" | "mapa";
type InvestigationView = "pistas" | "documentos" | "anotacoes" | "quadro";
const TABS: Array<{id:Tab;label:string;icon:typeof Shield}> = [
  {id:"inicio",label:"Início",icon:Shield},
  {id:"ficha",label:"Personagem",icon:UserRound},
  {id:"investigacao",label:"Investigação",icon:Search},
  {id:"mapa",label:"Mapa",icon:Map},
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
  const refreshInFlight = useRef(false);
  const refreshVersion = useRef(0);
  const [saveStatus, setSaveStatus] = useState("aguardando");
  const [tab, setTab] = useState<Tab>("inicio");
  const [showIntro, setShowIntro] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const [lastResult, setLastResult] = useState<null|{label:string;dice:number[];sides?:number[];formula?:string;chosenIndex:number;chosen:number;bonus:number;total:number;mode:string;note?:string}>(null);
  const [visibility, setVisibility] = useState<RollVisibility>("PUBLICA");
  const [pollError, setPollError] = useState("");
  const [investigationView, setInvestigationView] = useState<InvestigationView>("pistas");
  const [diceOpen, setDiceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transcendDismissed, setTranscendDismissed] = useState<string | null>(null);
  const [sheetFocus, setSheetFocus] = useState<"progression" | null>(null);
  const [combatOpen, setCombatOpen] = useState(false);
  const [specialDismissed, setSpecialDismissed] = useState<string | null>(null);
  const [nexUnlock, setNexUnlock] = useState<{nex:number;unlocks:string[]} | null>(null);
  const lastNexRef = useRef<number | null>(null);
  const [preferences, setPreferences] = usePlayerPreferences(data?.profile.id ?? "guest", preview);
  const { play: playSound } = usePlayerAudio(preferences);
  const previousUnread = useRef(0);

  useEffect(()=>{dirtyRef.current=dirty;},[dirty]);
  useEffect(()=>{
    const count=data?.notifications.filter(n=>!(n.isRead??n.is_read)).length??0;
    if(previousUnread.current>0&&count>previousUnread.current)playSound("notify");
    previousUnread.current=count;
  },[data?.notifications,playSound]);
  useEffect(()=>{
    if(!data)return;
    const current=sheet.concept.nex;
    if(lastNexRef.current===null){lastNexRef.current=current;return;}
    if(current>lastNexRef.current){
      const unlocks=MILESTONES.filter(m=>m.nex===current).map(m=>m.label);
      setNexUnlock({nex:current,unlocks});
      playSound("notify");
    }
    lastNexRef.current=current;
  },[data,sheet.concept.nex,playSound]);

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
    if(refreshInFlight.current)return;
    refreshInFlight.current=true;
    const version=++refreshVersion.current;
    try {
      if (await loadPreview()) return;
      const current=requirePlayerSession();
      if(!current){
        if(version===refreshVersion.current){setData(null);setCloudSessionState(null);}
        return;
      }
      const result=await rpc<PlayerBootstrapData>("player_bootstrap",{p_token:current.token});
      if(!result.ok){
        const message=result.error||"Sessão expirada. Entre novamente.";
        if(version===refreshVersion.current){
          await logoutCloud();
          setData(null);
          setCloudSessionState(null);
          setPollError(message);
        }
        return;
      }
      if(version!==refreshVersion.current)return;
      setData(result); setCloudSessionState(current); setPollError("");
      if(!quiet||!dirtyRef.current) setSheet(normalizeSheet(result.sheet));
    } catch(e){if(version===refreshVersion.current)setPollError(e instanceof Error?e.message:"Falha de sincronização");}
    finally{refreshInFlight.current=false;}
  },[loadPreview]);

  useEffect(()=>{if(cloudSession?.role==="PLAYER"||preview)void refresh();},[cloudSession?.role,preview,refresh]);
  useEffect(()=>{
    if(!(cloudSession?.role==="PLAYER")||preview)return;
    const tick=()=>{if(!document.hidden)void refresh(true);};
    const onVisibility=()=>{if(!document.hidden)void refresh(true);};
    const i=window.setInterval(tick,2500);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{window.clearInterval(i);document.removeEventListener("visibilitychange",onVisibility);};
  },[cloudSession?.role,preview,refresh]);

  useEffect(()=>{
    if(!dirty||preview||!data?.profile.canEditSheet)return;
    const current=requirePlayerSession(); if(!current)return;
    setSaveStatus("salvando…");
    const t=window.setTimeout(()=>{void rpc<{ok:boolean;error?:string}>("player_save_sheet",{p_token:current.token,p_data:sheet}).then(r=>{if(!r.ok)throw new Error(r.error||"Falha ao salvar");setDirty(false);setSaveStatus("salvo no Cloud");}).catch(e=>setSaveStatus(`erro: ${e instanceof Error?e.message:"falha"}`));},750);
    return()=>window.clearTimeout(t);
  },[dirty,sheet,preview,data?.profile.canEditSheet]);

  useEffect(()=>{if(!lastResult)return;const t=window.setTimeout(()=>setLastResult(null),6500);return()=>window.clearTimeout(t);},[lastResult]);

  const profileId=data?.profile.id;
  useEffect(()=>{
    if(!profileId||preview)return;
    const seenKey=`berco-intro-seen:${profileId}`;
    const skipKey=`berco-intro-skip:${profileId}`;
    const seen=localStorage.getItem(seenKey)==="1";
    const storedSkip=localStorage.getItem(skipKey);
    const shouldSkip=storedSkip===null&&seen?true:storedSkip==="1";
    if(storedSkip===null&&seen)localStorage.setItem(skipKey,"1");
    setSkipIntro(shouldSkip);
    setShowIntro(!seen||!shouldSkip);
  },[profileId,preview]);

  const updateIntroPreference=(value:boolean)=>{
    setSkipIntro(value);
    if(profileId)localStorage.setItem(`berco-intro-skip:${profileId}`,value?"1":"0");
  };
  const finishIntro=()=>{
    if(profileId)localStorage.setItem(`berco-intro-seen:${profileId}`,"1");
    setShowIntro(false);
  };

  const authenticate=async()=>{setAuthBusy(true);setAuthError("");setPollError("");try{const result=await loginCloud(pin.trim());if(!result||result.role!=="PLAYER")throw new Error("Este PIN não pertence a um player ativo.");setData(null);setCloudSessionState(result);setPin("");}catch(e){setAuthError(e instanceof Error?e.message:"PIN inválido");}finally{setAuthBusy(false);}};

  const updateSheet=(next:CharacterSheetData)=>{if(preview||!data?.profile.canEditSheet)return;setSheet(next);setDirty(true);setSaveStatus("alterações locais");};

  const logRoll=async(input:{label:string;formula:string;payload:Record<string,unknown>;total:number;visibility:RollVisibility})=>{
    if(preview)return;
    const current=requirePlayerSession();if(!current)return;
    await rpc("player_log_roll",{p_token:current.token,p_payload:input});
    await refresh(true);
  };
  const markNotification=async(id:string)=>{
    if(preview)return;
    const current=requirePlayerSession();if(!current)return;
    await rpc("player_mark_notification",{p_token:current.token,p_notification_id:id});
    await refresh(true);
  };
  const openTab=(next:Tab)=>{if(next!==tab)playSound("navigate");setTab(next);};
  const openInvestigationView=(next:InvestigationView)=>{if(next!==investigationView)playSound("navigate");setInvestigationView(next);};
  const openDice=()=>{playSound("open");setDiceOpen(true);};

  const rollAttribute=async(attr:OrdemAttribute)=>{playSound("dice");const r=rollOrdemTest(attr,sheet.attributes[attr],0,0);const formula=`${r.dice.length}d20 ${r.mode}`;setLastResult({label:`Teste de ${attr}`,dice:r.dice,sides:r.dice.map(()=>20),formula,chosenIndex:r.chosenIndex,chosen:r.chosen,bonus:0,total:r.total,mode:r.mode});await logRoll({label:`Atributo ${attr}`,formula,payload:{...r},total:r.total,visibility});};
  const rollSkill=async(skillId:string)=>{const def=SKILLS.find(s=>s.id===skillId);if(!def)return;playSound("dice");const skill=sheet.skills[skillId]??{training:"DESTREINADO" as const,otherBonus:0};const bonus=TRAINING_BONUS[skill.training]+Number(skill.otherBonus||0);const r=rollOrdemTest(def.attribute,sheet.attributes[def.attribute],TRAINING_BONUS[skill.training],Number(skill.otherBonus||0));const formula=`${r.dice.length}d20 ${r.mode} + ${bonus}`;setLastResult({label:skillId==="profissao"&&skill.customName?skill.customName:def.name,dice:r.dice,sides:r.dice.map(()=>20),formula,chosenIndex:r.chosenIndex,chosen:r.chosen,bonus,total:r.total,mode:r.mode});await logRoll({label:`Perícia ${def.name}`,formula,payload:{...r,skillId},total:r.total,visibility});};
  const rollAttack=async(attackId:string)=>{const atk=combatAttackById(sheet,attackId);if(!atk)return;playSound("dice");const skill=sheet.skills[atk.skillId]??{training:"DESTREINADO" as const,otherBonus:0};const base=TRAINING_BONUS[skill.training]+Number(skill.otherBonus||0)+Number(atk.bonus||0);const r=rollOrdemTest(atk.attribute,sheet.attributes[atk.attribute],TRAINING_BONUS[skill.training],Number(skill.otherBonus||0)+Number(atk.bonus||0));const crit=isCritical(r.chosen,atk.criticalMargin);const formula=`${r.dice.length}d20 ${r.mode} + ${base}`;setLastResult({label:`Ataque · ${atk.name}`,dice:r.dice,sides:r.dice.map(()=>20),formula,chosenIndex:r.chosenIndex,chosen:r.chosen,bonus:base,total:r.total,mode:r.mode,note:crit?`Crítico pela margem ${atk.criticalMargin}.`:undefined});sessionStorage.setItem("berco-last-critical-attack",crit?attackId:"");await logRoll({label:`Ataque ${atk.name}${crit?" · CRÍTICO":""}`,formula,payload:{...r,attackId,attackSource:atk.source,sourceItemId:atk.sourceItemId,critical:crit,criticalMargin:atk.criticalMargin},total:r.total,visibility});};
  const rollDamage=async(attackId:string)=>{const atk=combatAttackById(sheet,attackId);if(!atk)return;playSound("dice");let formula=atk.damage||"1d6";const critical=sessionStorage.getItem("berco-last-critical-attack")===attackId;if(critical&&atk.criticalMultiplier>1){formula=formula.replace(/^(\d*)d/i,(_,n)=>`${Math.max(1,Number(n||1))*atk.criticalMultiplier}d`);}try{const r=parseAndRollFormula(formula);setLastResult({label:`Dano · ${atk.name}`,dice:r.dice.map(d=>d.value),sides:r.dice.map(d=>d.sides),formula:r.formula,chosenIndex:-1,chosen:r.total,bonus:r.modifier,total:r.total,mode:"SOMA",note:critical?`Dados multiplicados por x${atk.criticalMultiplier} devido ao crítico anterior.`:undefined});await logRoll({label:`Dano ${atk.name}${critical?" · CRÍTICO":""}`,formula:r.formula,payload:{dice:r.dice,modifier:r.modifier,attackId,attackSource:atk.source,sourceItemId:atk.sourceItemId,critical},total:r.total,visibility});sessionStorage.removeItem("berco-last-critical-attack");}catch(e){setPollError(e instanceof Error?e.message:"Dano inválido");}};

  if(!cloudConfigured()&&!preview)return <StandaloneLogin warning="O build publicado ainda não recebeu as variáveis do Lovable Cloud." pin={pin} setPin={setPin} busy={authBusy} error={authError} onLogin={authenticate}/>;
  if(!data)return <StandaloneLogin warning={pollError} pin={pin} setPin={setPin} busy={authBusy} error={authError} onLogin={authenticate}/>;

  const state=normalizePublicState(data.publicState);
  const unread=data.notifications.filter(n=>!(n.isRead??n.is_read)).length;
  const symbolUrl=data.assets.find(a=>(a.assetKey??a.asset_key)==="ordem-symbol")?.publicUrl??data.assets.find(a=>(a.assetKey??a.asset_key)==="ordem-symbol")?.public_url;
  const transcendence=data.notifications.find(n=>n.kind==="TRANSCENDENCIA"&&!(n.isRead??n.is_read)&&n.id!==transcendDismissed)??null;
  const specialKinds = new Set<SpecialEventKind>(["EVENTO_VISAO","EVENTO_SEGREDO","EVENTO_OBJETIVO","EVENTO_INTERFERENCIA"]);
  const specialEvent=data.notifications.find(n=>specialKinds.has(n.kind as SpecialEventKind)&&!(n.isRead??n.is_read)&&n.id!==specialDismissed)??null;
  const rootStyle=accentVariables(preferences.accent) as CSSProperties;
  const answerTranscendence=async()=>{
    if(!transcendence)return;
    playSound("click");
    if(!preview)await markNotification(transcendence.id);
    setTranscendDismissed(transcendence.id);
    setSheetFocus("progression");
    setTab("ficha");
  };
  const acknowledgeSpecial=async()=>{
    if(!specialEvent)return;
    playSound("click");
    if(!preview)await markNotification(specialEvent.id);
    setSpecialDismissed(specialEvent.id);
  };
  const openCombat=()=>{playSound("combat");setCombatOpen(true);};

  return <div className={`player-v2-shell player-style-${preferences.visualStyle} min-h-screen ${preferences.intensity==="paranormal"?"player-v2-paranormal":"player-v2-sober"}`} style={rootStyle}>
    {showIntro&&<PlayerIntro name={data.profile.playerName} role={data.profile.roleType} symbolUrl={symbolUrl} skipFuture={skipIntro} onSkipFutureChange={updateIntroPreference} onDone={finishIntro}/>}
    {transcendence&&<TranscendenceOverlay title={transcendence.title} body={transcendence.body} onSound={()=>playSound("transcend")} onLater={()=>setTranscendDismissed(transcendence.id)} onAnswer={()=>void answerTranscendence()}/>}
    <header className="player-v2-header sticky top-0 z-40 border-b border-border/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-5">
        <div className="player-avatar-shell flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          {data.profile.avatarUrl?<img src={data.profile.avatarUrl} alt="" className="size-full object-cover"/>:<Shield className="size-5"/>}
        </div>
        <div className="min-w-0"><p className="truncate font-semibold">{data.profile.characterName||data.profile.playerName}</p><p className="stamp truncate text-[9px] text-muted-foreground">{data.profile.playerName} · {data.profile.roleType.replaceAll("_"," ")}</p></div>
        <div className="ml-auto hidden rounded-xl border border-border/70 bg-background/35 px-3 py-1.5 text-right sm:block"><p className="font-mono text-sm">DIA {state.day} · {state.time}</p>{state.shareLocation&&<p className="max-w-44 truncate text-[10px] text-muted-foreground">{state.currentLocationName||"local não informado"}</p>}</div>
        <Button size="icon" variant="ghost" aria-label="Modo combate" title="Modo combate" onClick={openCombat}><Swords className="size-4"/></Button><Button size="icon" variant="ghost" aria-label="Abrir dados" title="Dados" onClick={openDice}><Dice5 className="size-4"/></Button>
        <Button size="icon" variant="ghost" aria-label="Preferências" title="Preferências" onClick={()=>{playSound("open");setSettingsOpen(true);}}><Settings2 className="size-4"/></Button>
        <Button size="icon" variant="ghost" aria-label={preview?"Fechar prévia":"Sair do terminal"} title={preview?"Fechar prévia":"Sair"} onClick={()=>{if(preview)window.close();else void logoutCloud().then(()=>window.location.assign("/"));}}><LogOut className="size-4"/></Button>
      </div>
      <nav className="player-v2-desktop-nav mx-auto hidden max-w-7xl items-center gap-1 px-5 pb-3 md:flex">{TABS.map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>openTab(t.id)} data-active={tab===t.id} className="player-v2-nav-item"><Icon className="size-4"/><span>{t.label}</span>{t.id==="inicio"&&unread>0&&<span className="player-v2-unread">{unread}</span>}</button>})}</nav>
    </header>
    {preview&&<div className="sticky top-[68px] z-30 bg-route-amarelo/90 px-3 py-1 text-center text-xs font-semibold text-black">PRÉVIA DO MESTRE — somente leitura; notas privadas do player não são exibidas.</div>}
    {pollError&&<div className="mx-auto mt-3 max-w-7xl px-3"><p className="rounded-xl border border-route-amarelo/50 bg-route-amarelo/10 p-2.5 text-xs">Cloud temporariamente sem sincronizar: {pollError}</p></div>}
    <main className="mx-auto max-w-7xl px-3 py-4 pb-28 sm:px-5 sm:py-6 md:pb-8">
      <div key={tab} className="player-page-transition">
        {tab==="inicio"&&<Home data={data} state={state} onTab={openTab} onDice={openDice} onCombat={openCombat} onSettings={()=>setSettingsOpen(true)} onReplay={()=>setShowIntro(true)} skipIntro={skipIntro} onSkipIntroChange={updateIntroPreference} onRead={markNotification}/>}
        {tab==="ficha"&&<CharacterSheetPanel sheet={sheet} editable={!preview&&data.profile.canEditSheet} saveStatus={saveStatus} focusTarget={sheetFocus} onFocusConsumed={()=>setSheetFocus(null)} onChange={updateSheet} onRollAttribute={rollAttribute} onRollSkill={rollSkill} onRollAttack={rollAttack} onRollDamage={rollDamage}/>}
        {tab==="investigacao"&&<Investigation view={investigationView} onView={setInvestigationView} data={data} preview={preview} onRefresh={()=>refresh(true)}/>}
        {tab==="mapa"&&<FogMap playerId={data.profile.id} regions={data.mapRegions} reveals={data.mapReveals} assets={data.assets}/>}
      </div>
    </main>
    <nav className="player-v2-bottom-nav md:hidden">{TABS.map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>openTab(t.id)} data-active={tab===t.id}><span className="relative"><Icon className="size-5"/>{t.id==="inicio"&&unread>0&&<i className="player-v2-dot"/>}</span><span>{t.label}</span></button>})}</nav>
    <div className="player-mobile-actions md:hidden"><button type="button" className="player-combat-fab" aria-label="Abrir modo combate" onClick={openCombat}><Swords className="size-5"/></button><button type="button" className="player-dice-fab" aria-label="Abrir dados" onClick={openDice}><Dice5 className="size-5"/></button></div>
    {diceOpen&&<div className="player-dice-drawer" role="dialog" aria-modal="true" aria-label="Dados"><button className="player-dice-backdrop" aria-label="Fechar dados" onClick={()=>setDiceOpen(false)}/><section className="player-dice-sheet"><div className="flex items-center gap-3 border-b border-border/70 pb-3"><div><p className="stamp text-primary">Rolagens</p><h2 className="font-display text-2xl">Dados</h2></div><Button size="icon" variant="ghost" className="ml-auto" onClick={()=>setDiceOpen(false)}><X className="size-4"/></Button></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant={visibility==="PUBLICA"?"default":"outline"} onClick={()=>setVisibility("PUBLICA")}>Ficha: pública</Button><Button size="sm" variant={visibility==="PRIVADA"?"default":"outline"} onClick={()=>setVisibility("PRIVADA")}>Ficha: privada</Button></div><div className="mt-4 max-h-[72vh] overflow-y-auto pr-1"><DicePanel rolls={data.rolls} onLog={logRoll} soundEnabled={preferences.sound} soundVolume={preferences.volume*preferences.diceVolume} hideSoundToggle/></div></section></div>}
    <PlayerPreferencesDialog open={settingsOpen} onOpenChange={setSettingsOpen} preferences={preferences} onChange={setPreferences} readOnly={preview}/>
    <OrdemRollResult result={lastResult} soundEnabled={preferences.sound} soundVolume={preferences.volume*preferences.diceVolume}/>
  </div>;
}

function StandaloneLogin({warning,pin,setPin,busy,error,onLogin}:{warning?:string;pin:string;setPin:(v:string)=>void;busy:boolean;error:string;onLogin:()=>Promise<void>}){return <div className="flex min-h-screen items-center justify-center bg-[#05070a] p-4"><form className="player-terminal-card w-full max-w-sm border p-6 text-zinc-100" onSubmit={e=>{e.preventDefault();void onLogin();}}><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl border border-cyan-800/70 bg-cyan-950/30 text-cyan-300"><Shield className="size-5"/></div><div><p className="stamp text-cyan-400">Terminal de jogador</p><p className="text-xs text-zinc-500">Acesso individual</p></div></div><h1 className="mt-5 text-2xl font-semibold">Operação Berço Vazio</h1><p className="mt-1 text-sm text-zinc-500">Digite o PIN entregue pelo mestre.</p><div className="mt-6"><Label htmlFor="player-pin">PIN</Label><Input id="player-pin" className="mt-1 h-11 bg-black text-base tracking-[.25em]" inputMode="numeric" autoComplete="off" autoFocus value={pin} disabled={busy} onChange={e=>setPin(e.target.value)}/></div><Button type="submit" className="mt-3 h-11 w-full" disabled={busy||!pin.trim()}><Cloud className="mr-1 size-4"/>{busy?"Conectando…":"Entrar"}</Button>{error&&<p role="alert" className="mt-2 rounded-lg border border-red-900/60 bg-red-950/30 p-2 text-xs text-red-300">{error}</p>}{warning&&<p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-2 text-xs text-amber-300">{warning}</p>}</form></div>}

function Home({data,state,onTab,onDice,onCombat,onSettings,onReplay,skipIntro,onSkipIntroChange,onRead}:{data:PlayerBootstrapData;state:ReturnType<typeof normalizePublicState>;onTab:(t:Tab)=>void;onDice:()=>void;onCombat:()=>void;onSettings:()=>void;onReplay:()=>void;skipIntro:boolean;onSkipIntroChange:(v:boolean)=>void;onRead:(id:string)=>Promise<void>}){
  const sheet=normalizeSheet(data.sheet);
  const notifs=data.notifications.filter(n=>!["TRANSCENDENCIA","EVENTO_VISAO","EVENTO_SEGREDO","EVENTO_OBJETIVO","EVENTO_INTERFERENCIA"].includes(n.kind)).slice(0,6);
  const portrait=data.profile.avatarUrl||sheet.identity.avatarUrl;
  return <div className="space-y-5">
    <section className="player-home-hero">
      <div className="player-home-identity">
        <div className="player-home-portrait">{portrait?<img src={portrait} alt="" className="size-full object-cover"/>:<UserRound className="size-9"/>}</div>
        <div className="min-w-0 flex-1"><p className="stamp text-primary">Dossiê ativo</p><h1 className="mt-1 truncate font-display text-3xl font-semibold sm:text-4xl">{data.profile.characterName||sheet.identity.name||data.profile.playerName}</h1><p className="mt-1 text-sm text-muted-foreground">{sheet.concept.origin||"Origem não definida"} · {sheet.concept.className}{sheet.concept.trail?" · "+sheet.concept.trail:""}</p></div>
        <div className="player-nex-badge"><span>NEX</span><b>{sheet.concept.nex}%</b></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><Resource label="PV" current={sheet.resources.pv} max={sheet.resources.pvMax}/><Resource label="PE" current={sheet.resources.pe} max={sheet.resources.peMax}/><Resource label="SAN" current={sheet.resources.san} max={sheet.resources.sanMax}/></div>
    </section>

    <section className="player-session-card">
      <div className="flex flex-wrap items-start gap-4"><div><p className="stamp text-primary">Agora</p><h2 className="mt-1 font-display text-2xl">DIA {state.day} · {state.time}</h2>{state.shareLocation&&<p className="mt-1 text-sm text-muted-foreground">📍 {state.currentLocationName||"Local não informado"}</p>}</div>{state.objective&&<div className="min-w-[220px] flex-1 rounded-xl border border-primary/25 bg-primary/[.06] p-3"><p className="stamp text-[9px] text-primary">Objetivo compartilhado</p><p className="mt-1 text-sm">{state.objective}</p></div>}</div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"><Button variant="outline" onClick={()=>onTab("ficha")}><UserRound className="mr-1 size-4"/>Personagem</Button><Button className="combat-quick-action" onClick={onCombat}><Swords className="mr-1 size-4"/>Combate</Button><Button variant="outline" onClick={onDice}><Dice5 className="mr-1 size-4"/>Dados</Button><Button variant="outline" onClick={()=>onTab("investigacao")}><Search className="mr-1 size-4"/>Investigar</Button><Button variant="outline" onClick={()=>onTab("mapa")}><Map className="mr-1 size-4"/>Mapa</Button></div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <div className="player-terminal-card border p-4 sm:p-5"><div className="flex items-center"><div><p className="stamp text-primary">Sinais recebidos</p><h3 className="font-display text-xl">Notificações</h3></div><Bell className="ml-auto size-5 text-primary"/></div><div className="mt-3 space-y-2">{notifs.map(n=>{const read=n.isRead??n.is_read;return <button key={n.id} onClick={()=>void onRead(n.id)} className={"player-notification w-full rounded-xl border p-3 text-left "+(read?"border-border/70 opacity-55":"border-primary/35 bg-primary/[.055]")}><div className="flex items-center gap-2"><b className="text-sm">{n.title}</b>{!read&&<span className="ml-auto size-2 rounded-full bg-primary"/>}</div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p></button>})}{notifs.length===0&&<p className="py-4 text-sm text-muted-foreground">Nenhuma mensagem nova.</p>}</div></div>
      <div className="player-terminal-card border p-4 sm:p-5"><div className="flex items-center"><div><p className="stamp text-primary">Investigação</p><h3 className="font-display text-xl">Pistas recentes</h3></div><ClipboardList className="ml-auto size-5 text-primary"/></div><div className="mt-3 space-y-2">{data.clues.slice(0,4).map(c=><button key={c.id} className="player-clue-preview w-full rounded-xl border border-border/70 p-3 text-left" onClick={()=>onTab("investigacao")}><b className="text-sm">{c.title}</b><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p></button>)}{data.clues.length===0&&<p className="py-4 text-sm text-muted-foreground">Nenhuma pista recebida ainda.</p>}</div></div>
    </section>

    <section className="player-preference-strip"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[.06]"><Settings2 className="size-4 text-primary"/></div><div className="min-w-0"><p className="text-sm font-semibold">Seu terminal, do seu jeito</p><p className="text-xs text-muted-foreground">Cor, intensidade visual, som e volume ficam salvos neste aparelho.</p></div></div><Button size="sm" variant="outline" onClick={onSettings}>Personalizar</Button><Button size="sm" variant="ghost" onClick={onReplay}>Rever intro</Button><label className="flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={skipIntro} onChange={e=>onSkipIntroChange(e.target.checked)}/>Pular intro</label></section>
  </div>;
}

function Investigation({view,onView,data,preview,onRefresh,onSound}:{view:InvestigationView;onView:(view:InvestigationView)=>void;data:PlayerBootstrapData;preview:boolean;onRefresh:()=>Promise<void>;onSound:(kind:"click"|"open"|"paper"|"navigate")=>void}){
  const items:Array<{id:InvestigationView;label:string;icon:typeof ClipboardList;count:number}>=[
    {id:"pistas",label:"Pistas",icon:ClipboardList,count:data.clues.length},
    {id:"documentos",label:"Documentos",icon:BookOpen,count:data.documents.length},
    {id:"anotacoes",label:"Anotações",icon:NotebookPen,count:data.notes.length},
    {id:"quadro",label:"Quadro",icon:Network,count:data.clues.length+data.documents.length+data.notes.length},
  ];
  return <div className="space-y-4"><header className="player-investigation-header"><div><p className="stamp text-primary">Central de investigação</p><h1 className="font-display text-3xl">O que você descobriu</h1><p className="mt-1 text-sm text-muted-foreground">Pistas, arquivos, hipóteses e conexões em um único lugar.</p></div></header><nav className="player-investigation-tabs">{items.map(item=>{const Icon=item.icon;return <button key={item.id} data-active={view===item.id} onClick={()=>onView(item.id)}><Icon className="size-4"/><span>{item.label}</span><i>{item.count}</i></button>})}</nav><div key={view} className="player-page-transition">{view==="pistas"?<Clues clues={data.clues}/>:view==="documentos"?<Documents documents={data.documents} onSound={onSound}/>:view==="anotacoes"?<Notes notes={data.notes} preview={preview} onRefresh={onRefresh} onSound={onSound}/>:<InvestigationBoard profileId={data.profile.id} clues={data.clues} documents={data.documents} notes={data.notes} readOnly={preview}/>}</div></div>;
}

function Clues({clues}:{clues:PlayerBootstrapData["clues"]}){return <section className="investigation-section"><div className="investigation-section-title"><div><p className="stamp text-primary">Dossiê pessoal</p><h2 className="font-display text-3xl">Pistas recebidas</h2><p>Fragmentos liberados pelo mestre. Nem toda pista significa que você já entendeu o que ela prova.</p></div><ClipboardList className="size-6 text-primary"/></div><div className="evidence-grid mt-4">{clues.map((c,index)=><article key={c.id} className="evidence-card"><div className="evidence-card-top"><span>EVIDÊNCIA {String(index+1).padStart(2,"0")}</span><i/></div><div className="evidence-pin" aria-hidden="true"/><h3>{c.title}</h3><p className="evidence-body">{c.description}</p>{(c.documentTitle??c.document_title)&&<div className="evidence-source"><FileText className="size-3.5"/><span>{c.documentTitle??c.document_title}</span></div>}{(c.privateMessage??c.private_message)&&<div className="master-whisper"><b>Nota do mestre</b><p>{c.privateMessage??c.private_message}</p></div>}</article>)}{clues.length===0&&<Empty text="Nenhuma pista foi liberada para você ainda."/>}</div></section>}

function Documents({documents,onSound}:{documents:CloudDocument[];onSound:(kind:"click"|"open"|"paper"|"navigate")=>void}){const [open,setOpen]=useState<CloudDocument|null>(null);useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(null);};window.addEventListener("keydown",onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey);};},[open]);const openDocument=(doc:CloudDocument)=>{onSound("paper");setOpen(doc);};return <section className="investigation-section"><div className="investigation-section-title"><div><p className="stamp text-primary">Arquivo liberado</p><h2 className="font-display text-3xl">Documentos</h2><p>Relatórios, registros e arquivos que chegaram ao seu dossiê. Clique para abrir em tela cheia.</p></div><BookOpen className="size-6 text-primary"/></div><div className="document-grid mt-4">{documents.map((d,index)=><button type="button" key={d.id} className="case-document text-left" onClick={()=>openDocument(d)}><div className="document-fold" aria-hidden="true"/><div className="flex items-center gap-2"><span className="document-index">{String(index+1).padStart(2,"0")}</span><FileText className="size-4 text-primary"/><span className="stamp text-[9px] text-muted-foreground">arquivo autorizado</span></div><h3>{d.title}</h3><p>{d.description}</p>{(d.privateMessage??d.private_message)&&<div className="document-note">{d.privateMessage??d.private_message}</div>}<span className="document-open-hint">Abrir documento</span></button>)}{documents.length===0&&<Empty text="Nenhum documento foi liberado para você ainda."/>}</div>{open&&<div className="document-reader" role="dialog" aria-modal="true" aria-label={open.title}><button className="document-reader-backdrop" aria-label="Fechar documento" onClick={()=>setOpen(null)}/><article className="document-reader-paper"><Button size="icon" variant="ghost" className="document-reader-close" onClick={()=>setOpen(null)}><X className="size-4"/></Button><div className="document-reader-stamp">ORDEM · ARQUIVO LIBERADO</div><p className="stamp text-muted-foreground">DOCUMENTO // {open.id.slice(0,8).toUpperCase()}</p><h2>{open.title}</h2><div className="document-reader-rule"/><p className="document-reader-body">{open.description}</p>{(open.privateMessage??open.private_message)&&<aside><b>Anotação anexada pelo mestre</b><p>{open.privateMessage??open.private_message}</p></aside>}<footer>Operação Berço Vazio · acesso individual</footer></article></div>}</section>}
function Notes({notes,preview,onRefresh,onSound}:{notes:PlayerNote[];preview:boolean;onRefresh:()=>Promise<void>;onSound:(kind:"click"|"open"|"paper"|"navigate")=>void}){const [title,setTitle]=useState("");const [body,setBody]=useState("");const [share,setShare]=useState(false);const save=async()=>{if(preview||!body.trim())return;onSound("click");const current=requirePlayerSession();if(!current)return;await rpc("player_save_note",{p_token:current.token,p_payload:{title,body,tags:[],shareWithMaster:share}});setTitle("");setBody("");setShare(false);await onRefresh();};const remove=async(id:string)=>{if(preview)return;onSound("click");const current=requirePlayerSession();if(!current)return;if(!confirm("Excluir esta anotação?"))return;await rpc("player_delete_note",{p_token:current.token,p_note_id:id});await onRefresh();};return <section className="investigation-section"><div className="investigation-section-title"><div><p className="stamp text-primary">Caderno individual</p><h2 className="font-display text-3xl">Anotações</h2><p>Seu espaço para hipóteses, nomes suspeitos e conexões que ainda não viraram pista oficial.</p></div><NotebookPen className="size-6 text-primary"/></div>{!preview&&<div className="note-composer mt-4"><div className="note-composer-line"/><Input placeholder="Título da anotação" value={title} onChange={e=>setTitle(e.target.value)}/><Textarea className="mt-2 min-h-28" placeholder="Escreva sua teoria, lembrete ou suspeita…" value={body} onChange={e=>setBody(e.target.value)}/><div className="mt-3 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)}/>Compartilhar esta nota com o mestre</label><Button className="ml-auto" disabled={!body.trim()} onClick={()=>void save()}>Salvar no caderno</Button></div></div>}<div className="notes-grid mt-4">{notes.map((n,index)=><article key={n.id} className="notebook-card"><div className="notebook-number">{String(index+1).padStart(2,"0")}</div><div className="flex items-center gap-2"><b>{n.title||"Nota"}</b><span className="ml-auto stamp text-[9px] text-muted-foreground">{(n.shareWithMaster??n.share_with_master)?"compartilhada":"privada"}</span></div><p>{n.body}</p>{!preview&&<Button size="sm" variant="ghost" className="mt-2 text-destructive" onClick={()=>void remove(n.id)}>Excluir</Button>}</article>)}{notes.length===0&&<Empty text="Nenhuma anotação criada."/>}</div></section>}


function Resource({label,current,max}:{label:string;current:number;max:number}){const pct=max>0?Math.max(0,Math.min(100,current/max*100)):0;return <div className="player-resource"><div className="flex items-end"><span className="stamp text-muted-foreground">{label}</span><b className="ml-auto font-mono text-xl">{current}<span className="text-xs font-normal text-muted-foreground">/{max}</span></b></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary/80"><div className="player-resource-fill h-full rounded-full bg-primary" style={{width:pct+"%"}}/></div></div>}
function Empty({text}:{text:string}){return <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{text}</div>}
