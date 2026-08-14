import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLUES, LOCATIONS } from "@/data/campaignFull";
import { DOCUMENT_TITLES } from "@/data/documentsCanonical";
import { HOTSPOTS } from "@/data/map";
import { cloudConfigured, loginCloud, requireMasterToken, rpc } from "@/lib/cloud";
import type { MasterDashboardData, PlayerSummary } from "@/lib/playerCloudTypes";
import { normalizePublicState, revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { useCampaign } from "@/store/campaign";
import { Bell, Cloud, Copy, Eye, KeyRound, Map, RefreshCw, Send, Shield, Trash2, UserPlus, Users } from "lucide-react";

export const Route = createFileRoute("/players")({ component: PlayersPage });

type EditForm = {
  id?: string;
  playerName: string;
  characterName: string;
  pin: string;
  roleType: "AGENTE_DA_ORDEM" | "VILAO" | "CIVIL";
  active: boolean;
  avatarUrl: string;
  masterNote: string;
  canEditSheet: boolean;
};

const blankForm = (): EditForm => ({ playerName: "", characterName: "", pin: "", roleType: "CIVIL", active: true, avatarUrl: "", masterNote: "", canEditSheet: true });

function PlayersPage() {
  const session = useCampaign((s) => s.session);
  const [token, setToken] = useState(() => requireMasterToken());
  const [connectPin, setConnectPin] = useState("");
  const [data, setData] = useState<MasterDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<EditForm | null>(null);
  const [lastPin, setLastPin] = useState<{ name: string; pin: string } | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailPlayer, setDetailPlayer] = useState<PlayerSummary | null>(null);
  const [deliveryTargets, setDeliveryTargets] = useState<string[]>([]);
  const [targetMode, setTargetMode] = useState<"group" | "selected">("group");
  const [clueId, setClueId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [privateMessage, setPrivateMessage] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [objective, setObjective] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    const current = requireMasterToken();
    if (!current || !cloudConfigured()) return;
    if (!quiet) setLoading(true);
    try {
      const result = await rpc<MasterDashboardData>("master_dashboard", { p_token: current });
      if (!result.ok) throw new Error(result.error || "Sessão Cloud expirada.");
      setData(result);
      setError("");
      setToken(current);
      const publicState = normalizePublicState(result.publicState);
      setObjective(publicState.objective);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no Cloud");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) void refresh(); }, [token, refresh]);
  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => void refresh(true), 3000);
    return () => window.clearInterval(id);
  }, [token, refresh]);

  const connect = async () => {
    setLoading(true); setError("");
    try {
      const result = await loginCloud(connectPin);
      if (!result || result.role !== "MASTER") throw new Error("Esse PIN não é do mestre.");
      setToken(result.token); setConnectPin("");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível conectar."); }
    finally { setLoading(false); }
  };

  const savePlayer = async () => {
    const current = requireMasterToken(); if (!current || !editor) return;
    if (!editor.playerName.trim()) { setError("Informe o nome do player."); return; }
    setLoading(true);
    try {
      const result = await rpc<{ ok: boolean; error?: string; id?: string; pin?: string }>("master_upsert_player", {
        p_token: current,
        p_payload: { ...editor, pin: editor.pin.trim() || undefined },
      });
      if (!result.ok) throw new Error(result.error || "Falha ao salvar player.");
      if (result.pin) setLastPin({ name: editor.playerName, pin: result.pin });
      setEditor(null); await refresh(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao salvar."); }
    finally { setLoading(false); }
  };

  const deletePlayer = async (player: PlayerSummary) => {
    const current = requireMasterToken(); if (!current) return;
    if (!confirm(`Excluir definitivamente o perfil de ${player.playerName}? Ficha, notas e rolagens desse perfil serão removidas.`)) return;
    await rpc("master_delete_player", { p_token: current, p_player_id: player.id });
    await refresh(true);
  };

  const regeneratePin = async (player: PlayerSummary) => {
    const current = requireMasterToken(); if (!current) return;
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const result = await rpc<{ ok: boolean; error?: string }>("master_upsert_player", { p_token: current, p_payload: { id: player.id, pin } });
    if (!result.ok) { setError(result.error || "Falha ao trocar PIN"); return; }
    setLastPin({ name: player.playerName, pin });
    await refresh(true);
  };

  const openDetail = async (player: PlayerSummary) => {
    const current = requireMasterToken(); if (!current) return;
    setDetailPlayer(player); setDetail(null);
    const result = await rpc<Record<string, unknown>>("master_get_player_detail", { p_token: current, p_player_id: player.id });
    setDetail(result);
  };

  const targets = targetMode === "group" ? null : deliveryTargets;

  const deliverClue = async () => {
    const current = requireMasterToken(); const clue = CLUES.find((c) => c.id === clueId);
    if (!current || !clue) return;
    if (targetMode === "selected" && deliveryTargets.length === 0) { setError("Selecione pelo menos um player."); return; }
    await rpc("master_deliver_clue", { p_token: current, p_targets: targets, p_payload: { clueId: clue.id, title: clue.name, description: clue.playerDescription, documentTitle: clue.sourceDocument || "", privateMessage } });
    setPrivateMessage(""); await refresh(true);
  };

  const deliverDocument = async () => {
    const current = requireMasterToken(); if (!current || !documentId) return;
    if (targetMode === "selected" && deliveryTargets.length === 0) { setError("Selecione pelo menos um player."); return; }
    await rpc("master_deliver_document", { p_token: current, p_targets: targets, p_payload: { documentId, title: DOCUMENT_TITLES[documentId] ?? documentId, description: "Documento disponibilizado pelo mestre para consulta.", privateMessage } });
    setPrivateMessage(""); await refresh(true);
  };

  const sendMessage = async () => {
    const current = requireMasterToken(); if (!current || !messageTitle.trim()) return;
    if (targetMode === "selected" && deliveryTargets.length === 0) { setError("Selecione pelo menos um player."); return; }
    await rpc("master_send_notification", { p_token: current, p_targets: targets, p_kind: "MESTRE", p_title: messageTitle, p_body: messageBody });
    setMessageTitle(""); setMessageBody("");
  };

  const publicState = normalizePublicState(data?.publicState);
  const syncState = async (shareLocation = publicState.shareLocation) => {
    const current = requireMasterToken(); if (!current) return;
    const loc = LOCATIONS.find((l) => l.id === session.currentLocationId);
    await rpc("master_sync_public_state", { p_token: current, p_payload: { day: session.day, time: session.time, currentLocationId: session.currentLocationId ?? "", currentLocationName: loc?.name ?? "", shareLocation, objective } });
    await refresh(true);
  };

  const groupReveal = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const r of data?.mapReveals ?? []) if (!revealTargetId(r)) map.set(`${r.floor}:${revealLocationId(r)}`, r.revealed);
    return map;
  }, [data?.mapReveals]);

  const setReveal = async (floor: string, locationId: string, revealed: boolean) => {
    const current = requireMasterToken(); if (!current) return;
    await rpc("master_set_map_reveal", { p_token: current, p_floor: floor, p_location_id: locationId, p_revealed: revealed, p_targets: targetMode === "group" ? null : deliveryTargets });
    await refresh(true);
  };

  if (!cloudConfigured() || !token) {
    return <Shell><div className="mx-auto max-w-xl"><section className="dossier rounded-sm p-6"><p className="stamp text-primary">Multiplayer</p><h1 className="text-3xl font-semibold">Conectar painel ao Cloud</h1><p className="mt-2 text-sm text-muted-foreground">O banco do RPG já existe. Para abrir o escudo de players neste navegador, confirme o PIN do mestre uma vez.</p>{!cloudConfigured() && <p className="mt-3 rounded-sm border border-route-amarelo/50 bg-route-amarelo/10 p-3 text-sm">Este build ainda não recebeu as variáveis do Lovable Cloud. O painel principal continua funcionando; publique/sincronize a versão Cloud para ativar multiplayer.</p>}<div className="mt-5 flex gap-2"><Input inputMode="numeric" value={connectPin} onChange={(e) => setConnectPin(e.target.value)} placeholder="PIN do mestre" /><Button disabled={loading || !cloudConfigured()} onClick={() => void connect()}><Cloud className="mr-2 size-4" />Conectar</Button></div>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}</section></div></Shell>;
  }

  return <Shell><div className="mx-auto max-w-7xl space-y-6">
    <header className="dossier rounded-sm p-5">
      <div className="flex flex-wrap items-center gap-3"><div><p className="stamp text-primary">Escudo do Mestre · multiplayer</p><h1 className="text-3xl font-semibold">Players</h1><p className="text-sm text-muted-foreground">Perfis, fichas, entregas, rolagens e mapa compartilhado.</p></div><div className="ml-auto flex gap-2"><Button variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className="mr-1 size-4" />Atualizar</Button><Button onClick={() => setEditor(blankForm())}><UserPlus className="mr-1 size-4" />Criar player</Button></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Cloud" value={error ? "erro" : "online"} /><Stat label="Players ativos" value={String((data?.players ?? []).filter((p) => p.active).length)} /><Stat label="Rolagens no feed" value={String(data?.rolls?.length ?? 0)} /><Stat label="Estado público" value={`D${publicState.day} · ${publicState.time}`} /></div>
      {error && <p className="mt-3 rounded-sm border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      {lastPin && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-sm border border-route-verde/50 bg-route-verde/10 p-3"><KeyRound className="size-4" /><b>PIN de {lastPin.name}:</b><code className="rounded bg-black/40 px-2 py-1 text-lg">{lastPin.pin}</code><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(lastPin.pin)}><Copy className="mr-1 size-3.5" />Copiar</Button><span className="text-xs text-muted-foreground">Guarde agora: por segurança o PIN não fica recuperável depois.</span></div>}
    </header>

    <section className="dossier rounded-sm p-5"><div className="flex flex-wrap items-center gap-3"><div><p className="stamp text-primary">Estado que os players enxergam</p><h2 className="text-xl font-semibold">Sincronização pública</h2></div><Button className="ml-auto" variant="secondary" onClick={() => void syncState()}><Cloud className="mr-1 size-4" />Sincronizar agora</Button></div><div className="mt-4 grid gap-3 md:grid-cols-[auto_auto_1fr]"><label className="flex items-center gap-2 rounded-sm border border-border p-3 text-sm"><input type="checkbox" checked={publicState.shareLocation} onChange={(e) => void syncState(e.target.checked)} />Compartilhar local atual</label><div className="rounded-sm border border-border p-3 text-sm"><span className="stamp text-muted-foreground">Relógio</span><p>DIA {session.day} · {session.time}</p></div><div><Label>Objetivo público opcional</Label><div className="mt-1 flex gap-2"><Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ex.: Descobrir o que aconteceu no auditório" /><Button variant="outline" onClick={() => void syncState()}>Salvar</Button></div></div></div></section>

    <section><div className="mb-3 flex items-end justify-between"><div><p className="stamp text-primary">Perfis</p><h2 className="text-2xl font-semibold">Agentes / personagens conectáveis</h2></div></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(data?.players ?? []).map((p) => <PlayerCard key={p.id} player={p} onEdit={() => setEditor({ id:p.id, playerName:p.playerName, characterName:p.characterName, pin:"", roleType:p.roleType, active:p.active, avatarUrl:p.avatarUrl ?? "", masterNote:p.masterNote, canEditSheet:p.canEditSheet })} onDetail={() => void openDetail(p)} onPreview={() => { sessionStorage.setItem("berco-vazio-preview-player", p.id); window.open("/player?preview=1", "_blank"); }} onPin={() => void regeneratePin(p)} onDelete={() => void deletePlayer(p)} />)}{(data?.players ?? []).length===0&&<div className="dossier rounded-sm p-6 text-sm text-muted-foreground">Nenhum player criado. Crie o primeiro perfil e entregue o PIN ao jogador.</div>}</div></section>

    <section className="grid gap-4 xl:grid-cols-2">
      <div className="dossier rounded-sm p-5"><p className="stamp text-primary">Destino das próximas ações</p><h2 className="text-xl font-semibold">Grupo ou privado</h2><div className="mt-3 flex gap-2"><Button size="sm" variant={targetMode==="group"?"default":"outline"} onClick={()=>setTargetMode("group")}><Users className="mr-1 size-3.5"/>Grupo inteiro</Button><Button size="sm" variant={targetMode==="selected"?"default":"outline"} onClick={()=>setTargetMode("selected")}>Selecionar</Button></div>{targetMode==="selected"&&<div className="mt-3 grid gap-2 sm:grid-cols-2">{(data?.players??[]).filter(p=>p.active).map(p=><label key={p.id} className="flex items-center gap-2 rounded-sm border border-border p-2 text-sm"><input type="checkbox" checked={deliveryTargets.includes(p.id)} onChange={(e)=>setDeliveryTargets(v=>e.target.checked?[...v,p.id]:v.filter(id=>id!==p.id))}/>{p.playerName} <span className="text-muted-foreground">{p.characterName||"sem ficha"}</span></label>)}</div>}</div>
      <div className="dossier rounded-sm p-5"><p className="stamp text-primary">Mensagem do mestre</p><h2 className="text-xl font-semibold">Notificação instantânea</h2><div className="mt-3 space-y-2"><Input value={messageTitle} onChange={(e)=>setMessageTitle(e.target.value)} placeholder="Título"/><Textarea value={messageBody} onChange={(e)=>setMessageBody(e.target.value)} placeholder="Mensagem curta"/><Button onClick={()=>void sendMessage()} disabled={!messageTitle.trim()}><Bell className="mr-1 size-4"/>Enviar</Button></div></div>
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <div className="dossier rounded-sm p-5"><p className="stamp text-primary">Pistas</p><h2 className="text-xl font-semibold">Entregar sem vazar segredo</h2><p className="mt-1 text-xs text-muted-foreground">O backend recebe apenas nome e descrição para jogador. Significado do mestre, contingência privada e metadados secretos não são enviados.</p><select className="mt-3 w-full rounded-sm border border-input bg-background p-2 text-sm" value={clueId} onChange={(e)=>setClueId(e.target.value)}><option value="">Escolha uma pista…</option>{CLUES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><Textarea className="mt-2" value={privateMessage} onChange={(e)=>setPrivateMessage(e.target.value)} placeholder="Mensagem privada opcional junto da entrega"/><Button className="mt-2" disabled={!clueId} onClick={()=>void deliverClue()}><Send className="mr-1 size-4"/>Entregar pista</Button></div>
      <div className="dossier rounded-sm p-5"><p className="stamp text-primary">Documentos</p><h2 className="text-xl font-semibold">Liberar documento físico</h2><select className="mt-3 w-full rounded-sm border border-input bg-background p-2 text-sm" value={documentId} onChange={(e)=>setDocumentId(e.target.value)}><option value="">Escolha um documento…</option>{Object.entries(DOCUMENT_TITLES).map(([id,title])=><option key={id} value={id}>{title}</option>)}</select><Textarea className="mt-2" value={privateMessage} onChange={(e)=>setPrivateMessage(e.target.value)} placeholder="Mensagem opcional"/><Button className="mt-2" disabled={!documentId} onClick={()=>void deliverDocument()}><Send className="mr-1 size-4"/>Entregar documento</Button></div>
    </section>

    <section className="dossier rounded-sm p-5"><div className="flex flex-wrap items-center gap-3"><div><p className="stamp text-primary">Fog of War</p><h2 className="text-xl font-semibold">Revelação por sala</h2><p className="text-xs text-muted-foreground">A região visual precisa ser configurada no mapa antes de aparecer. Nenhuma coordenada é inventada.</p></div><Map className="ml-auto size-7 text-primary"/></div><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{HOTSPOTS.map(h=>{const id=h.locationId; if(!id)return null; const loc=LOCATIONS.find(l=>l.id===id); const revealed=groupReveal.get(`${h.floor}:${id}`)??false; const hasRegion=(data?.mapRegions??[]).some(r=>r.floor===h.floor&&(r.locationId??r.location_id)===id); return <div key={h.id} className="flex items-center gap-2 rounded-sm border border-border p-3"><div className="min-w-0 flex-1"><b className="text-sm">{loc?.name??h.name}</b><p className="text-[11px] text-muted-foreground">{h.floor} · {hasRegion?"região configurada":"sem região visual"}</p></div><Button size="sm" variant={revealed?"default":"outline"} disabled={targetMode==="selected"&&deliveryTargets.length===0} onClick={()=>void setReveal(h.floor,id,!revealed)}>{revealed?"Ocultar":"Liberar"}</Button></div>})}</div></section>

    <section className="dossier rounded-sm p-5"><p className="stamp text-primary">Rolagens recentes</p><h2 className="text-xl font-semibold">Feed do escudo</h2><div className="mt-3 max-h-96 space-y-2 overflow-y-auto">{(data?.rolls??[]).slice(0,50).map(r=><div key={r.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-border p-2 text-sm"><span className="font-semibold">{r.characterName||r.playerName}</span><span className="text-muted-foreground">{r.label}</span><code className="ml-auto">{r.formula}</code><b className="text-lg">{r.total??"—"}</b><span className="stamp text-[10px]">{r.visibility}</span></div>)}{!data?.rolls?.length&&<p className="text-sm text-muted-foreground">Nenhuma rolagem registrada ainda.</p>}</div></section>
  </div>

  <Dialog open={!!editor} onOpenChange={(o)=>!o&&setEditor(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editor?.id?"Editar player":"Criar player"}</DialogTitle></DialogHeader>{editor&&<div className="space-y-3"><Field label="Nome do player"><Input value={editor.playerName} onChange={e=>setEditor({...editor,playerName:e.target.value})}/></Field><Field label="Nome do personagem (pode ficar vazio)"><Input value={editor.characterName} onChange={e=>setEditor({...editor,characterName:e.target.value})}/></Field><Field label={editor.id?"Novo PIN (deixe vazio para manter)":"PIN (vazio = gerar automaticamente)"}><Input inputMode="numeric" value={editor.pin} onChange={e=>setEditor({...editor,pin:e.target.value})}/></Field><Field label="Identidade visual"><select className="w-full rounded-sm border border-input bg-background p-2" value={editor.roleType} onChange={e=>setEditor({...editor,roleType:e.target.value as EditForm["roleType"]})}><option value="AGENTE_DA_ORDEM">Agente da Ordem</option><option value="VILAO">Vilão</option><option value="CIVIL">Civil / pessoa normal</option></select></Field><Field label="Avatar por URL (opcional)"><Input value={editor.avatarUrl} onChange={e=>setEditor({...editor,avatarUrl:e.target.value})}/></Field><Field label="Nota privada do mestre"><Textarea value={editor.masterNote} onChange={e=>setEditor({...editor,masterNote:e.target.value})}/></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.active} onChange={e=>setEditor({...editor,active:e.target.checked})}/>Perfil ativo</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.canEditSheet} onChange={e=>setEditor({...editor,canEditSheet:e.target.checked})}/>Player pode editar a própria ficha</label><Button className="w-full" onClick={()=>void savePlayer()} disabled={loading}>Salvar perfil</Button></div>}</DialogContent></Dialog>

  <Dialog open={!!detailPlayer} onOpenChange={(o)=>!o&&(setDetailPlayer(null),setDetail(null))}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{detailPlayer?.playerName} · {detailPlayer?.characterName||"sem personagem"}</DialogTitle></DialogHeader>{detail?<PlayerDetail data={detail}/>:<p>Carregando…</p>}</DialogContent></Dialog>
  </Shell>;
}

function PlayerCard({player,onEdit,onDetail,onPreview,onPin,onDelete}:{player:PlayerSummary;onEdit:()=>void;onDetail:()=>void;onPreview:()=>void;onPin:()=>void;onDelete:()=>void}) {
  const online = player.lastSeen ? Date.now()-new Date(player.lastSeen).getTime()<120000 : false;
  return <article className="dossier rounded-sm p-4"><div className="flex items-start gap-3"><div className={`flex size-11 items-center justify-center rounded-full border ${player.roleType==="AGENTE_DA_ORDEM"?"border-cyan-500/60 bg-cyan-950/50":player.roleType==="VILAO"?"border-red-600/60 bg-red-950/50":"border-amber-500/60 bg-amber-950/30"}`}><Shield className="size-5"/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold">{player.playerName}</h3><span className={`size-2 rounded-full ${online?"bg-green-400":"bg-muted-foreground"}`}/></div><p className="text-sm text-muted-foreground">{player.characterName||"Ficha ainda sem nome"}</p><p className="stamp mt-1 text-[10px]">{player.roleType.replaceAll("_"," ")} · {player.active?"ativo":"inativo"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><Button size="sm" variant="outline" onClick={onDetail}>Ficha / dados</Button><Button size="sm" variant="outline" onClick={onPreview}><Eye className="mr-1 size-3.5"/>Ver como player</Button><Button size="sm" variant="ghost" onClick={onEdit}>Editar perfil</Button><Button size="sm" variant="ghost" onClick={onPin}><KeyRound className="mr-1 size-3.5"/>Novo PIN</Button></div><Button size="sm" variant="ghost" className="mt-2 w-full text-destructive" onClick={onDelete}><Trash2 className="mr-1 size-3.5"/>Excluir</Button></article>;
}

function PlayerDetail({data}:{data:Record<string,unknown>}) {
  const sheet=(data.sheet??{}) as Record<string,unknown>; const rolls=(data.rolls??[]) as Array<Record<string,unknown>>; const notes=(data.sharedNotes??[]) as Array<Record<string,unknown>>;
  return <div className="space-y-4 text-sm"><div className="grid gap-3 md:grid-cols-3"><Stat label="Ficha" value={Object.keys(sheet).length?"criada":"vazia"}/><Stat label="Rolagens" value={String(rolls.length)}/><Stat label="Notas compartilhadas" value={String(notes.length)}/></div><div className="rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">Prévia da ficha no banco</p><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(sheet,null,2)}</pre></div>{notes.length>0&&<div><p className="stamp text-muted-foreground">Notas que o player compartilhou com o mestre</p>{notes.map((n,i)=><div key={String(n.id??i)} className="mt-2 rounded-sm border border-border p-2"><b>{String(n.title??"Nota")}</b><p>{String(n.body??"")}</p></div>)}</div>}</div>;
}

function Stat({label,value}:{label:string;value:string}) { return <div className="rounded-sm border border-border bg-card/40 p-3"><p className="stamp text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <div><Label>{label}</Label><div className="mt-1">{children}</div></div>; }
