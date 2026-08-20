import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLUES, LOCATIONS } from "@/data/campaignFull";
import { DOCUMENT_TITLES } from "@/data/documentsCanonical";
import { HOTSPOTS } from "@/data/map";
import { cloudConfigured, loginCloud, logoutCloud, requireMasterToken, rpc } from "@/lib/cloud";
import type { MasterDashboardData, PlayerSummary } from "@/lib/playerCloudTypes";
import { normalizePublicState, revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { useCampaign } from "@/store/campaign";
import { Bell, Cloud, Copy, Eye, KeyRound, Map as MapIcon, RefreshCw, Send, Shield, Trash2, UserPlus, Users } from "lucide-react";

export const Route = createFileRoute("/players")({ component: PlayersPage });

type Role = "AGENTE_DA_ORDEM" | "VILAO" | "CIVIL";
type EditForm = { id?:string; playerName:string; characterName:string; pin:string; roleType:Role; active:boolean; avatarUrl:string; masterNote:string; canEditSheet:boolean };
const blank=():EditForm=>({playerName:"",characterName:"",pin:"",roleType:"CIVIL",active:true,avatarUrl:"",masterNote:"",canEditSheet:true});

function PlayersPage(){
  const session=useCampaign(s=>s.session);
  const [token,setToken]=useState(()=>requireMasterToken());
  const [connectPin,setConnectPin]=useState("");
  const [data,setData]=useState<MasterDashboardData|null>(null);
  const [busy,setBusy]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");
  const [editor,setEditor]=useState<EditForm|null>(null);
  const [lastPin,setLastPin]=useState<{name:string;pin:string}|null>(null);
  const [detail,setDetail]=useState<Record<string,unknown>|null>(null);
  const [detailPlayer,setDetailPlayer]=useState<PlayerSummary|null>(null);
  const [mode,setMode]=useState<"group"|"selected">("group");
  const [targets,setTargets]=useState<string[]>([]);
  const [clueId,setClueId]=useState("");
  const [docId,setDocId]=useState("");
  const [deliveryMessage,setDeliveryMessage]=useState("");
  const [msgTitle,setMsgTitle]=useState("");
  const [msgBody,setMsgBody]=useState("");
  const [objective,setObjective]=useState("");
  const refreshInFlight=useRef(false);
  const requestVersion=useRef(0);

  const refresh=useCallback(async(quiet=false)=>{
    if(refreshInFlight.current)return;
    const t=requireMasterToken();
    if(!t||!cloudConfigured())return;
    refreshInFlight.current=true;
    const version=++requestVersion.current;
    if(!quiet){setBusy(true);setRefreshing(true);}
    try{
      const r=await rpc<MasterDashboardData>("master_dashboard",{p_token:t});
      if(!r.ok){
        if(version===requestVersion.current){
          setData(null);
          setToken(null);
          setError(r.error||"Sessão Cloud expirada. Conecte o mestre novamente.");
          await logoutCloud();
        }
        return;
      }
      if(version!==requestVersion.current)return;
      setData(r);
      setToken(t);
      setError("");
      if(!quiet)setObjective(normalizePublicState(r.publicState).objective);
    }catch(e){
      if(version===requestVersion.current)setError(e instanceof Error?e.message:"Falha no Cloud");
    }finally{
      refreshInFlight.current=false;
      if(!quiet){setBusy(false);setRefreshing(false);}
    }
  },[]);

  useEffect(()=>{if(token)void refresh();},[token,refresh]);
  useEffect(()=>{
    if(!token)return;
    const tick=()=>{if(!document.hidden)void refresh(true);};
    const onVisibility=()=>{if(!document.hidden)void refresh(true);};
    const i=window.setInterval(tick,3000);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{window.clearInterval(i);document.removeEventListener("visibilitychange",onVisibility);};
  },[token,refresh]);
  useEffect(()=>{
    if(!data)return;
    const active=new Set(data.players.filter(p=>p.active).map(p=>p.id));
    setTargets(current=>{const next=current.filter(id=>active.has(id));return next.length===current.length?current:next;});
  },[data]);

  const connect=async()=>{setBusy(true);setError("");try{const s=await loginCloud(connectPin.trim());if(!s||s.role!=="MASTER")throw new Error("PIN não reconhecido como mestre");setToken(s.token);setConnectPin("");}catch(e){setError(e instanceof Error?e.message:"Falha ao conectar");}finally{setBusy(false);}};
  const savePlayer=async()=>{const t=requireMasterToken();if(!t||!editor)return;if(!editor.playerName.trim()){setError("Informe o nome do player");return;}setBusy(true);try{const r=await rpc<{ok:boolean;error?:string;pin?:string}>("master_upsert_player",{p_token:t,p_payload:{...editor,pin:editor.pin.trim()||undefined}});if(!r.ok)throw new Error(r.error||"Falha ao salvar");if(r.pin)setLastPin({name:editor.playerName,pin:r.pin});setEditor(null);await refresh(true);}catch(e){setError(e instanceof Error?e.message:"Falha ao salvar");}finally{setBusy(false);}};
  const deletePlayer=async(p:PlayerSummary)=>{const t=requireMasterToken();if(!t||!confirm(`Excluir definitivamente ${p.playerName}?`))return;const r=await rpc<{ok?:boolean;error?:string}>("master_delete_player",{p_token:t,p_player_id:p.id});if(r?.ok===false){setError(r.error||"Falha ao excluir player");return;}await refresh(true);};
  const newPin=async(p:PlayerSummary)=>{const t=requireMasterToken();if(!t)return;const pin=String(Math.floor(100000+Math.random()*900000));const r=await rpc<{ok:boolean;error?:string}>("master_upsert_player",{p_token:t,p_payload:{id:p.id,pin}});if(!r.ok){setError(r.error||"Falha ao trocar PIN");return;}setLastPin({name:p.playerName,pin});await refresh(true);};
  const openDetail=async(p:PlayerSummary)=>{const t=requireMasterToken();if(!t)return;setDetailPlayer(p);setDetail(null);try{setDetail(await rpc<Record<string,unknown>>("master_get_player_detail",{p_token:t,p_player_id:p.id}));}catch(e){setError(e instanceof Error?e.message:"Falha ao abrir dados do player");setDetailPlayer(null);}};
  const targetIds=mode==="group"?null:targets;
  const validateTargets=()=>mode==="group"||targets.length>0;
  const deliverClue=async()=>{const t=requireMasterToken(),c=CLUES.find(x=>x.id===clueId);if(!t||!c)return;if(!validateTargets()){setError("Selecione pelo menos um player");return;}try{const r=await rpc<{ok?:boolean;error?:string}>("master_deliver_clue",{p_token:t,p_targets:targetIds,p_payload:{clueId:c.id,title:c.name,description:c.playerDescription,documentTitle:c.sourceDocument||"",privateMessage:deliveryMessage}});if(r?.ok===false)throw new Error(r.error||"Falha ao entregar pista");setDeliveryMessage("");await refresh(true);}catch(e){setError(e instanceof Error?e.message:"Falha ao entregar pista");}};
  const deliverDoc=async()=>{const t=requireMasterToken();if(!t||!docId)return;if(!validateTargets()){setError("Selecione pelo menos um player");return;}try{const r=await rpc<{ok?:boolean;error?:string}>("master_deliver_document",{p_token:t,p_targets:targetIds,p_payload:{documentId:docId,title:DOCUMENT_TITLES[docId]??docId,description:"Documento disponibilizado pelo mestre para consulta.",privateMessage:deliveryMessage}});if(r?.ok===false)throw new Error(r.error||"Falha ao entregar documento");setDeliveryMessage("");await refresh(true);}catch(e){setError(e instanceof Error?e.message:"Falha ao entregar documento");}};
  const sendMessage=async()=>{const t=requireMasterToken();if(!t||!msgTitle.trim())return;if(!validateTargets()){setError("Selecione pelo menos um player");return;}try{const r=await rpc<{ok?:boolean;error?:string}>("master_send_notification",{p_token:t,p_targets:targetIds,p_kind:"MESTRE",p_title:msgTitle,p_body:msgBody});if(r?.ok===false)throw new Error(r.error||"Falha ao enviar notificação");setMsgTitle("");setMsgBody("");}catch(e){setError(e instanceof Error?e.message:"Falha ao enviar notificação");}};
  const publicState=normalizePublicState(data?.publicState);
  const syncState=async(share=publicState.shareLocation)=>{const t=requireMasterToken();if(!t)return;const loc=LOCATIONS.find(l=>l.id===session.currentLocationId);try{const r=await rpc<{ok?:boolean;error?:string}>("master_sync_public_state",{p_token:t,p_payload:{day:session.day,time:session.time,currentLocationId:session.currentLocationId??"",currentLocationName:loc?.name??"",shareLocation:share,objective}});if(r?.ok===false)throw new Error(r.error||"Falha ao sincronizar estado");await refresh(true);}catch(e){setError(e instanceof Error?e.message:"Falha ao sincronizar estado");}};
  const groupReveal=useMemo(()=>{const m=new globalThis.Map<string,boolean>();for(const r of data?.mapReveals??[])if(!revealTargetId(r))m.set(`${r.floor}:${revealLocationId(r)}`,r.revealed);return m;},[data?.mapReveals]);
  const setReveal=async(floor:string,locationId:string,revealed:boolean)=>{const t=requireMasterToken();if(!t)return;if(!validateTargets()){setError("Selecione um player antes de revelar de forma privada");return;}try{const r=await rpc<{ok?:boolean;error?:string}>("master_set_map_reveal",{p_token:t,p_floor:floor,p_location_id:locationId,p_revealed:revealed,p_targets:targetIds});if(r?.ok===false)throw new Error(r.error||"Falha ao alterar visibilidade");await refresh(true);}catch(e){setError(e instanceof Error?e.message:"Falha ao alterar visibilidade");}};

  if(!cloudConfigured()||!token)return <Shell><div className="mx-auto max-w-xl"><section className="dossier hero-panel p-6"><div className="flex items-center gap-3"><div className="master-brand-mark"><Cloud className="size-5"/></div><div><p className="stamp text-primary">Multiplayer</p><h1 className="text-3xl font-semibold">Conectar o escudo ao Cloud</h1></div></div><p className="mt-3 text-sm text-muted-foreground">Confirme o PIN do mestre neste navegador. Seu painel local continua funcionando mesmo se o Cloud ficar indisponível.</p><form className="mt-5 flex gap-2" onSubmit={e=>{e.preventDefault();void connect();}}><Input inputMode="numeric" autoComplete="off" value={connectPin} onChange={e=>setConnectPin(e.target.value)} placeholder="PIN do mestre"/><Button type="submit" disabled={busy||!cloudConfigured()||!connectPin.trim()}><Cloud className="mr-1 size-4"/>{busy?"Conectando…":"Conectar"}</Button></form>{error&&<p role="alert" className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">{error}</p>}</section></div></Shell>;

  return <Shell><div className="mx-auto max-w-7xl space-y-6">
    <header className="dossier hero-panel p-5 sm:p-6"><div className="flex flex-wrap items-center gap-4"><div className="flex items-center gap-3"><div className="master-brand-mark"><Users className="size-5"/></div><div><p className="stamp text-primary">Escudo do Mestre · multiplayer</p><h1 className="text-3xl font-semibold">Players</h1><p className="text-sm text-muted-foreground">Perfis, fichas, PINs, entregas, rolagens e fog of war.</p></div></div><div className="ml-auto flex gap-2"><Button variant="outline" disabled={refreshing} onClick={()=>void refresh()}><RefreshCw className={`mr-1 size-4 ${refreshing?"animate-spin":""}`}/>{refreshing?"Atualizando…":"Atualizar"}</Button><Button onClick={()=>setEditor(blank())}><UserPlus className="mr-1 size-4"/>Criar player</Button></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Cloud" value={error?"erro":"online"}/><Stat label="Ativos" value={String((data?.players??[]).filter(p=>p.active).length)}/><Stat label="Rolagens" value={String(data?.rolls?.length??0)}/><Stat label="Estado público" value={`D${publicState.day} · ${publicState.time}`}/></div>{error&&<p role="alert" className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-destructive">{error}</p>}{lastPin&&<div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-route-verde/50 bg-route-verde/10 p-3"><KeyRound className="size-4"/><b>PIN de {lastPin.name}:</b><code className="rounded-md bg-black/40 px-2 py-1 text-lg">{lastPin.pin}</code><Button size="sm" variant="outline" onClick={()=>void navigator.clipboard.writeText(lastPin.pin)}><Copy className="mr-1 size-3.5"/>Copiar</Button><span className="text-xs text-muted-foreground">Guarde agora; o banco salva apenas o hash.</span></div>}</header>

    <section className="dossier p-5"><div className="flex flex-wrap items-center gap-3"><div><p className="stamp text-primary">Estado compartilhado</p><h2 className="text-xl font-semibold">O que aparece para os players</h2></div><Button className="ml-auto" variant="secondary" onClick={()=>void syncState()}><Cloud className="mr-1 size-4"/>Sincronizar</Button></div><div className="mt-4 grid gap-3 md:grid-cols-[auto_auto_1fr]"><label className="flex items-center gap-2 rounded-lg border border-border/75 bg-card/25 p-3 text-sm"><input type="checkbox" checked={publicState.shareLocation} onChange={e=>void syncState(e.target.checked)}/>Compartilhar local atual</label><div className="stat-tile p-3 text-sm"><span className="stamp text-muted-foreground">Relógio</span><p>DIA {session.day} · {session.time}</p></div><div><Label>Objetivo público</Label><div className="mt-1 flex gap-2"><Input value={objective} onChange={e=>setObjective(e.target.value)} placeholder="Objetivo opcional"/><Button variant="outline" onClick={()=>void syncState()}>Salvar</Button></div></div></div></section>

    <section><div className="flex items-end justify-between gap-3"><div><p className="stamp text-primary">Perfis conectáveis</p><h2 className="text-2xl font-semibold">Players</h2></div><p className="text-xs text-muted-foreground">{(data?.players??[]).filter(p=>p.active).length} ativo(s) agora</p></div><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(data?.players??[]).map(p=><PlayerCard key={p.id} p={p} onEdit={()=>setEditor({id:p.id,playerName:p.playerName,characterName:p.characterName,pin:"",roleType:p.roleType,active:p.active,avatarUrl:p.avatarUrl??"",masterNote:p.masterNote,canEditSheet:p.canEditSheet})} onDetail={()=>void openDetail(p)} onPreview={()=>{sessionStorage.setItem("berco-vazio-preview-player",p.id);window.open("/player?preview=1","_blank","noopener,noreferrer");}} onPin={()=>void newPin(p)} onDelete={()=>void deletePlayer(p)}/>)}{!data?.players?.length&&<div className="dossier p-6 text-sm text-muted-foreground">Nenhum player criado ainda.</div>}</div></section>

    <section className="grid gap-4 xl:grid-cols-2"><div className="dossier p-5"><p className="stamp text-primary">Destino</p><h2 className="text-xl font-semibold">Grupo ou privado</h2><div className="mt-3 flex gap-2"><Button size="sm" variant={mode==="group"?"default":"outline"} onClick={()=>setMode("group")}><Users className="mr-1 size-3.5"/>Grupo inteiro</Button><Button size="sm" variant={mode==="selected"?"default":"outline"} onClick={()=>setMode("selected")}>Selecionar players</Button></div>{mode==="selected"&&<div className="mt-3 grid gap-2 sm:grid-cols-2">{(data?.players??[]).filter(p=>p.active).map(p=><label key={p.id} className="flex items-center gap-2 rounded-lg border border-border/75 bg-card/25 p-2.5 text-sm"><input type="checkbox" checked={targets.includes(p.id)} onChange={e=>setTargets(v=>e.target.checked?[...v,p.id]:v.filter(x=>x!==p.id))}/><span className="font-medium">{p.playerName}</span><span className="truncate text-muted-foreground">{p.characterName||"sem nome"}</span></label>)}</div>}</div><div className="dossier p-5"><p className="stamp text-primary">Mensagem direta</p><h2 className="text-xl font-semibold">Notificação</h2><Input className="mt-3" value={msgTitle} onChange={e=>setMsgTitle(e.target.value)} placeholder="Título"/><Textarea className="mt-2" value={msgBody} onChange={e=>setMsgBody(e.target.value)} placeholder="Mensagem"/><Button className="mt-2" disabled={!msgTitle.trim()} onClick={()=>void sendMessage()}><Bell className="mr-1 size-4"/>Enviar</Button></div></section>

    <section className="grid gap-4 xl:grid-cols-2"><div className="dossier p-5"><p className="stamp text-primary">Pistas</p><h2 className="text-xl font-semibold">Entregar pista segura</h2><p className="mt-1 text-xs text-muted-foreground">Somente o texto destinado ao jogador é enviado; segredo do mestre fica fora do payload.</p><select className="mt-3 w-full border border-input bg-background p-2 text-sm" value={clueId} onChange={e=>setClueId(e.target.value)}><option value="">Escolha uma pista…</option>{CLUES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><Textarea className="mt-2" value={deliveryMessage} onChange={e=>setDeliveryMessage(e.target.value)} placeholder="Mensagem privada opcional"/><Button className="mt-2" disabled={!clueId} onClick={()=>void deliverClue()}><Send className="mr-1 size-4"/>Entregar pista</Button></div><div className="dossier p-5"><p className="stamp text-primary">Documentos</p><h2 className="text-xl font-semibold">Liberar documento</h2><select className="mt-3 w-full border border-input bg-background p-2 text-sm" value={docId} onChange={e=>setDocId(e.target.value)}><option value="">Escolha um documento…</option>{Object.entries(DOCUMENT_TITLES).map(([id,title])=><option key={id} value={id}>{title}</option>)}</select><Textarea className="mt-2" value={deliveryMessage} onChange={e=>setDeliveryMessage(e.target.value)} placeholder="Mensagem opcional"/><Button className="mt-2" disabled={!docId} onClick={()=>void deliverDoc()}><Send className="mr-1 size-4"/>Entregar documento</Button></div></section>

    <section className="dossier p-5"><div className="flex items-center"><div><p className="stamp text-primary">Fog of War</p><h2 className="text-xl font-semibold">Liberar salas</h2><p className="text-xs text-muted-foreground">A sala só revela imagem se também possuir uma região visual cadastrada. Coordenadas nunca são inventadas.</p></div><MapIcon className="ml-auto size-7 text-primary"/></div><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{HOTSPOTS.map(h=>{if(!h.locationId)return null;const loc=LOCATIONS.find(l=>l.id===h.locationId);const revealed=groupReveal.get(`${h.floor}:${h.locationId}`)??false;const hasRegion=(data?.mapRegions??[]).some(r=>r.floor===h.floor&&(r.locationId??r.location_id)===h.locationId);return <div key={h.id} className="flex items-center gap-2 rounded-lg border border-border/75 p-3"><div className="min-w-0 flex-1"><b className="text-sm">{loc?.name??h.name}</b><p className="text-[11px] text-muted-foreground">{h.floor} · {hasRegion?"região pronta":"região não configurada"}</p></div><Button size="sm" variant={revealed?"default":"outline"} onClick={()=>void setReveal(h.floor,h.locationId!,!revealed)}>{revealed?"Ocultar":"Liberar"}</Button></div>})}</div></section>

    <section className="dossier p-5"><p className="stamp text-primary">Feed do escudo</p><h2 className="text-xl font-semibold">Rolagens recentes</h2><div className="mt-3 max-h-96 space-y-2 overflow-y-auto">{(data?.rolls??[]).slice(0,50).map(r=><div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/75 bg-card/25 p-2.5 text-sm"><b>{r.characterName||r.playerName}</b><span className="text-muted-foreground">{r.label}</span><code className="ml-auto">{r.formula}</code><b className="font-mono text-xl">{r.total??"—"}</b><span className="stamp text-[9px]">{r.visibility}</span></div>)}{!data?.rolls?.length&&<p className="text-sm text-muted-foreground">Nenhuma rolagem ainda.</p>}</div></section>
  </div>

  <Dialog open={!!editor} onOpenChange={o=>!o&&setEditor(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editor?.id?"Editar player":"Criar player"}</DialogTitle></DialogHeader>{editor&&<div className="space-y-3"><Field label="Nome do player"><Input value={editor.playerName} onChange={e=>setEditor({...editor,playerName:e.target.value})}/></Field><Field label="Nome do personagem"><Input value={editor.characterName} onChange={e=>setEditor({...editor,characterName:e.target.value})}/></Field><Field label={editor.id?"Novo PIN (vazio mantém atual)":"PIN (vazio gera automaticamente)"}><Input inputMode="numeric" value={editor.pin} onChange={e=>setEditor({...editor,pin:e.target.value})}/></Field><Field label="Identidade visual"><select className="w-full border border-input bg-background p-2" value={editor.roleType} onChange={e=>setEditor({...editor,roleType:e.target.value as Role})}><option value="AGENTE_DA_ORDEM">Agente da Ordem</option><option value="VILAO">Vilão</option><option value="CIVIL">Civil</option></select></Field><Field label="Avatar por URL (opcional)"><Input value={editor.avatarUrl} onChange={e=>setEditor({...editor,avatarUrl:e.target.value})}/></Field><Field label="Nota privada do mestre"><Textarea value={editor.masterNote} onChange={e=>setEditor({...editor,masterNote:e.target.value})}/></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.active} onChange={e=>setEditor({...editor,active:e.target.checked})}/>Perfil ativo</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.canEditSheet} onChange={e=>setEditor({...editor,canEditSheet:e.target.checked})}/>Pode editar a própria ficha</label><Button className="w-full" disabled={busy} onClick={()=>void savePlayer()}>Salvar</Button></div>}</DialogContent></Dialog>
  <Dialog open={!!detailPlayer} onOpenChange={o=>!o&&(setDetailPlayer(null),setDetail(null))}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{detailPlayer?.playerName} · {detailPlayer?.characterName||"sem personagem"}</DialogTitle></DialogHeader>{detail?<Detail data={detail}/>:<p>Carregando…</p>}</DialogContent></Dialog>
  </Shell>;
}

function PlayerCard({p,onEdit,onDetail,onPreview,onPin,onDelete}:{p:PlayerSummary;onEdit:()=>void;onDetail:()=>void;onPreview:()=>void;onPin:()=>void;onDelete:()=>void}){const online=p.lastSeen?Date.now()-new Date(p.lastSeen).getTime()<120000:false;return <article className="dossier p-4"><div className="flex gap-3"><div className={`flex size-11 items-center justify-center rounded-xl border ${p.roleType==="AGENTE_DA_ORDEM"?"border-cyan-500/60 bg-cyan-950/50":p.roleType==="VILAO"?"border-red-600/60 bg-red-950/50":"border-amber-500/60 bg-amber-950/30"}`}><Shield className="size-5"/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><b>{p.playerName}</b><span title={online?"online recentemente":"offline"} className={`size-2 rounded-full ${online?"bg-green-400":"bg-muted-foreground"}`}/></div><p className="text-sm text-muted-foreground">{p.characterName||"Ficha sem nome"}</p><p className="stamp mt-1 text-[9px]">{p.roleType.replaceAll("_"," ")} · {p.active?"ativo":"inativo"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><Button size="sm" variant="outline" onClick={onDetail}>Ficha / dados</Button><Button size="sm" variant="outline" onClick={onPreview}><Eye className="mr-1 size-3.5"/>Ver como player</Button><Button size="sm" variant="ghost" onClick={onEdit}>Editar</Button><Button size="sm" variant="ghost" onClick={onPin}><KeyRound className="mr-1 size-3.5"/>Novo PIN</Button></div><Button size="sm" variant="ghost" className="mt-2 w-full text-destructive" onClick={onDelete}><Trash2 className="mr-1 size-3.5"/>Excluir</Button></article>}
function Detail({data}:{data:Record<string,unknown>}){const sheet=(data["sheet"]??{}) as Record<string,unknown>,rolls=(data["rolls"]??[]) as Array<Record<string,unknown>>,notes=(data["sharedNotes"]??[]) as Array<Record<string,unknown>>;return <div className="space-y-4 text-sm"><div className="grid gap-3 md:grid-cols-3"><Stat label="Ficha" value={Object.keys(sheet).length?"criada":"vazia"}/><Stat label="Rolagens" value={String(rolls.length)}/><Stat label="Notas compartilhadas" value={String(notes.length)}/></div><div className="rounded-lg border border-border p-3"><p className="stamp text-muted-foreground">Ficha no banco</p><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(sheet,null,2)}</pre></div>{notes.map((n,i)=><div key={String(n["id"]??i)} className="rounded-lg border border-border p-2"><b>{String(n["title"]??"Nota")}</b><p>{String(n["body"]??"")}</p></div>)}</div>}
function Stat({label,value}:{label:string;value:string}){return <div className="stat-tile p-3"><p className="stamp text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>}
function Field({label,children}:{label:string;children:ReactNode}){return <div><Label>{label}</Label><div className="mt-1">{children}</div></div>}
