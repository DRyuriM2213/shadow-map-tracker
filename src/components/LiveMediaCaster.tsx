import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cloudConfigured, requireMasterToken, rpc } from "@/lib/cloud";
import type { MasterDashboardData } from "@/lib/playerCloudTypes";
import { Image as ImageIcon, Radio, RefreshCw, Send, Square, Trash2, X } from "lucide-react";

type MediaHistoryItem = { id:string; targetPlayerId?:string|null; targetName?:string|null; characterName?:string|null; title:string; caption:string; active:boolean; createdAt:string };
type MediaListResponse = { ok:boolean; error?:string; media?:MediaHistoryItem[] };
type MediaActionResponse = { ok?:boolean; error?:string; count?:number };

async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image(); node.onload = () => resolve(node); node.onerror = () => reject(new Error("Não foi possível ler a imagem.")); node.src = url;
    });
    const maxW=1440,maxH=1080,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight);
    const canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext("2d"); if(!ctx)throw new Error("Não foi possível preparar a imagem."); ctx.drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [0.86,0.76,0.66,0.56]){const data=canvas.toDataURL("image/jpeg",quality);if(data.length<=2_000_000)return data;}
    throw new Error("Imagem grande demais mesmo após compressão. Tente uma imagem menor.");
  } finally { URL.revokeObjectURL(url); }
}

export function LiveMediaCaster(){
  const pathname=useRouterState({select:s=>s.location.pathname});
  const visibleRoute=pathname==="/sessao-v2"||pathname==="/players"||pathname==="/mapa";
  const [open,setOpen]=useState(false),[dashboard,setDashboard]=useState<MasterDashboardData|null>(null),[target,setTarget]=useState("group"),[title,setTitle]=useState("Imagem do mestre"),[caption,setCaption]=useState(""),[imageData,setImageData]=useState(""),[history,setHistory]=useState<MediaHistoryItem[]>([]),[busy,setBusy]=useState(false),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);
  const refreshInFlight=useRef(false);
  const token=requireMasterToken();

  const refresh=useCallback(async()=>{
    if(refreshInFlight.current)return;
    const current=requireMasterToken();
    if(!current||!cloudConfigured())return;
    refreshInFlight.current=true;
    setRefreshing(true);
    try{
      const[dash,media]=await Promise.all([
        rpc<MasterDashboardData>("master_dashboard",{p_token:current}),
        rpc<MediaListResponse>("master_list_media",{p_token:current}),
      ]);
      if(!dash.ok)throw new Error(dash.error||"Falha ao carregar players.");
      if(!media.ok)throw new Error(media.error||"Falha ao carregar transmissões.");
      setDashboard(dash);setHistory(media.media??[]);setError("");
    }catch(err){setError(err instanceof Error?err.message:"Falha ao sincronizar.");}
    finally{refreshInFlight.current=false;setRefreshing(false);}
  },[]);

  useEffect(()=>{if(visibleRoute&&token)void refresh();},[visibleRoute,token,refresh]);
  useEffect(()=>{
    if(target==="group"||!dashboard)return;
    const stillActive=dashboard.players.some(player=>player.active&&player.id===target);
    if(!stillActive){setTarget("group");setNotice("O player selecionado não está mais ativo. Destino alterado para grupo inteiro.");}
  },[dashboard,target]);

  if(!visibleRoute||!token)return null;

  const onFile=async(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];e.target.value="";if(!file)return;
    if(!file.type.startsWith("image/")){setError("Escolha um arquivo de imagem.");return;}
    try{setBusy(true);setError("");setNotice("");setImageData(await compressImage(file));if(title==="Imagem do mestre")setTitle(file.name.replace(/\.[^.]+$/,"")||"Imagem do mestre");}
    catch(err){setError(err instanceof Error?err.message:"Falha ao preparar a imagem.");}
    finally{setBusy(false);}
  };

  const send=async()=>{
    const current=requireMasterToken();if(!current||!imageData||busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      const r=await rpc<{ok:boolean;error?:string}>("master_send_media",{p_token:current,p_targets:target==="group"?null:[target],p_title:title.trim()||"Imagem do mestre",p_caption:caption.trim(),p_image_data:imageData});
      if(!r.ok)throw new Error(r.error||"Falha ao transmitir imagem.");
      const label=target==="group"?"todos os players":dashboard?.players.find(p=>p.id===target)?.playerName??"player selecionado";
      setNotice(`Imagem enviada para ${label}.`);setImageData("");setCaption("");setTitle("Imagem do mestre");await refresh();
    }catch(err){setError(err instanceof Error?err.message:"Falha ao transmitir imagem.");}
    finally{setBusy(false);}
  };

  const clearOne=async(id:string)=>{
    const current=requireMasterToken();if(!current||busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      const result=await rpc<MediaActionResponse>("master_clear_media",{p_token:current,p_media_id:id});
      if(result?.ok===false)throw new Error(result.error||"Falha ao encerrar a transmissão.");
      setNotice("Transmissão encerrada para o player.");
      await refresh();
    }catch(err){setError(err instanceof Error?err.message:"Falha ao encerrar a transmissão.");}
    finally{setBusy(false);}
  };

  const clearAll=async()=>{
    const current=requireMasterToken();if(!current||busy||!confirm("Encerrar todas as imagens atualmente exibidas aos players?"))return;
    setBusy(true);setError("");setNotice("");
    try{
      const result=await rpc<MediaActionResponse>("master_clear_all_media",{p_token:current});
      if(result?.ok===false)throw new Error(result.error||"Falha ao encerrar as transmissões.");
      const count=Number(result?.count??0);
      setNotice(count===0?"Não havia transmissões ativas para encerrar.":count===1?"1 transmissão ativa foi encerrada.":`${count} transmissões ativas foram encerradas.`);
      await refresh();
    }catch(err){setError(err instanceof Error?err.message:"Falha ao encerrar as transmissões.");}
    finally{setBusy(false);}
  };

  return <div className="fixed bottom-4 left-4 z-[90] w-[min(430px,calc(100vw-2rem))]">
    {open&&<div className="dossier mb-2 max-h-[75vh] overflow-y-auto p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10"><Radio className="size-4 text-primary"/></div><div className="min-w-0 flex-1"><p className="stamp text-primary">Broadcast visual</p><h3 className="font-semibold">Mostrar imagem na tela do player</h3><p className="mt-1 text-xs text-muted-foreground">Escolha foto e destino. O terminal recebe automaticamente.</p></div><Button size="sm" variant="ghost" disabled={busy} onClick={()=>setOpen(false)} aria-label="Fechar Broadcast Visual" title="Fechar"><X className="size-4"/></Button></div>
      <label className="mt-4 block text-xs text-muted-foreground">Destino<select className="mt-1 h-9 w-full border border-input bg-background px-2 text-sm" value={target} disabled={busy} onChange={e=>setTarget(e.target.value)}><option value="group">Grupo inteiro</option>{(dashboard?.players??[]).filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.playerName} · {p.characterName||"sem personagem"}</option>)}</select></label>
      <div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={title} disabled={busy} onChange={e=>setTitle(e.target.value)} placeholder="Título"/><Input value={caption} disabled={busy} onChange={e=>setCaption(e.target.value)} placeholder="Legenda opcional"/></div>
      <button type="button" disabled={busy} onClick={()=>inputRef.current?.click()} className="mt-3 flex min-h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-primary/45 bg-black/25 p-2 transition-colors hover:border-primary/70 hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-60">{imageData?<img src={imageData} alt="Prévia da imagem que será transmitida" className="max-h-64 max-w-full object-contain"/>:<span className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><ImageIcon className="size-8"/>Clique para escolher uma foto</span>}</button>
      <input ref={inputRef} hidden type="file" accept="image/*" onChange={onFile}/>
      <div className="mt-3 flex gap-2"><Button className="flex-1" disabled={!imageData||busy} onClick={()=>void send()}><Send className="mr-2 size-4"/>{busy?"Processando…":"EXIBIR AGORA"}</Button>{imageData&&<Button variant="outline" disabled={busy} onClick={()=>setImageData("")}>Limpar</Button>}</div>
      {error&&<p role="alert" className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">{error}</p>}{notice&&<p className="mt-2 rounded-lg border border-route-verde/40 bg-route-verde/10 p-2.5 text-xs text-route-verde-claro">{notice}</p>}
      <div className="mt-5 border-t border-border/70 pt-3"><div className="flex items-center gap-2"><p className="stamp text-muted-foreground">Transmissões recentes</p><Button size="sm" variant="ghost" className="ml-auto" disabled={busy||refreshing} onClick={()=>void refresh()} aria-label="Atualizar transmissões" title="Atualizar transmissões"><RefreshCw className={`size-3.5 ${refreshing?"animate-spin":""}`}/></Button><Button size="sm" variant="ghost" className="text-destructive" disabled={busy||refreshing||!history.some(item=>item.active)} onClick={()=>void clearAll()}><Trash2 className="mr-1 size-3.5"/>Encerrar todas</Button></div><div className="mt-2 space-y-1.5">{history.slice(0,8).map(item=><div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/75 bg-card/30 p-2.5 text-xs"><div className="min-w-0 flex-1"><b className="block truncate">{item.title}</b><span className="text-muted-foreground">{item.targetPlayerId?`${item.targetName??"Player"}${item.characterName?` · ${item.characterName}`:""}`:"Grupo inteiro"} · {item.active?"ATIVA":"encerrada"}</span></div>{item.active&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>void clearOne(item.id)}><Square className="mr-1 size-3"/>Encerrar</Button>}</div>)}{!history.length&&<p className="text-xs text-muted-foreground">Nenhuma imagem transmitida ainda.</p>}</div></div>
    </div>}
    <Button className="shadow-2xl shadow-black/40" variant={open?"secondary":"default"} disabled={busy&&!open} onClick={()=>setOpen(v=>!v)}><Radio className="mr-2 size-4"/>{open?"Fechar broadcast":"Transmitir imagem"}</Button>
  </div>;
}
