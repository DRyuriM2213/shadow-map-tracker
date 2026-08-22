import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { NPCS } from "@/data/npcs";
import { MAP_IMAGES, type FloorId } from "@/data/map";
import { cloudConfigured, requireMasterToken, rpc } from "@/lib/cloud";
import type { MasterDashboardData, MapRegion } from "@/lib/playerCloudTypes";
import { revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { makeMapTokenLocationId, parseMapTokenRegion, tokenRegionPayload, type MapTokenKind } from "@/lib/mapTokens";
import { Eye, EyeOff, Move, RefreshCw, Trash2, UserPlus, UsersRound, X } from "lucide-react";

const round2 = (value:number)=>Math.round(value*100)/100;
const clamp = (value:number)=>Math.max(0,Math.min(100,value));

type Selection={kind:MapTokenKind;subjectId:string;name:string;avatarUrl?:string|null};

export function MapTokenManager(){
  const pathname=useRouterState({select:s=>s.location.pathname});
  const [data,setData]=useState<MasterDashboardData|null>(null);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [open,setOpen]=useState(false);
  const [placement,setPlacement]=useState<Selection|null>(null);
  const [target,setTarget]=useState("group");
  const [mapHost,setMapHost]=useState<HTMLElement|null>(null);
  const [floor,setFloor]=useState<FloorId>("primeiro");
  const moving=useRef<{region:MapRegion;locationId:string}|null>(null);

  const refresh=useCallback(async()=>{
    const token=requireMasterToken(); if(!token||!cloudConfigured()){setData(null);return;}
    try{const result=await rpc<MasterDashboardData>("master_dashboard",{p_token:token}); if(!result.ok)throw new Error(result.error||"Falha ao atualizar tokens."); setData(result);setError("");}
    catch(e){setError(e instanceof Error?e.message:"Falha ao atualizar tokens.");}
  },[]);

  useEffect(()=>{if(pathname!=="/mapa")return;void refresh();const id=window.setInterval(()=>{if(!document.hidden)void refresh();},2500);return()=>window.clearInterval(id);},[pathname,refresh]);
  useEffect(()=>{if(pathname!=="/mapa"){setMapHost(null);return;}const find=()=>{const img=[...document.querySelectorAll<HTMLImageElement>('img[alt^="Planta —"]')].find(el=>el.offsetParent!==null);const host=img?.parentElement??null;setMapHost(host);if(img){const alt=img.alt;setFloor(alt.includes(MAP_IMAGES.superior.label)?"superior":"primeiro");}};find();const id=window.setInterval(find,500);return()=>window.clearInterval(id);},[pathname]);
  useEffect(()=>{if(target==="group"||!data)return;if(!data.players.some(p=>p.active&&p.id===target))setTarget("group");},[data,target]);

  const tokens=useMemo(()=> (data?.mapRegions??[]).map(region=>({region,token:parseMapTokenRegion(region)})).filter((item):item is {region:MapRegion;token:NonNullable<ReturnType<typeof parseMapTokenRegion>>}=>!!item.token&&!item.token.archived),[data?.mapRegions]);
  const floorTokens=tokens.filter(t=>t.token.floor===floor);
  const visibleMap=useMemo(()=>{const map=new Map<string,boolean>();for(const r of data?.mapReveals??[]){if(r.floor!==floor)continue;if(!revealTargetId(r))map.set(revealLocationId(r),r.revealed);}if(target!=="group")for(const r of data?.mapReveals??[]){if(r.floor===floor&&revealTargetId(r)===target)map.set(revealLocationId(r),r.revealed);}return map;},[data?.mapReveals,floor,target]);

  const point=(clientX:number,clientY:number)=>{if(!mapHost)return null;const rect=mapHost.getBoundingClientRect();if(!rect.width||!rect.height)return null;return{x:round2(clamp(((clientX-rect.left)/rect.width)*100)),y:round2(clamp(((clientY-rect.top)/rect.height)*100))};};
  const saveRegion=async(region:ReturnType<typeof tokenRegionPayload>)=>{const token=requireMasterToken();if(!token)throw new Error("Cloud do mestre não conectado.");const result=await rpc<{ok?:boolean;error?:string}>("master_set_map_region",{p_token:token,p_payload:region});if(result?.ok===false)throw new Error(result.error||"Falha ao salvar token.");};
  const setReveal=async(locationId:string,revealed:boolean,forTarget=target)=>{const token=requireMasterToken();if(!token)throw new Error("Cloud do mestre não conectado.");const result=await rpc<{ok?:boolean;error?:string}>("master_set_map_reveal",{p_token:token,p_floor:floor,p_location_id:locationId,p_revealed:revealed,p_targets:forTarget==="group"?null:[forTarget]});if(result?.ok===false)throw new Error(result.error||"Falha ao alterar visibilidade.");};

  const createAt=async(sel:Selection,x:number,y:number)=>{setBusy(true);setError("");try{const locationId=makeMapTokenLocationId(sel.kind,sel.subjectId);await saveRegion(tokenRegionPayload({locationId,floor,name:sel.name,x,y,size:4}));await setReveal(locationId,true);setPlacement(null);setNotice(`${sel.name} colocado em ${MAP_IMAGES[floor].label} e liberado para ${target==="group"?"o grupo":"o player selecionado"}.`);await refresh();}catch(e){setError(e instanceof Error?e.message:"Falha ao criar token.");}finally{setBusy(false);}};
  const handlePlacement=(e:ReactPointerEvent<HTMLDivElement>)=>{if(!placement)return;e.preventDefault();e.stopPropagation();const p=point(e.clientX,e.clientY);if(p)void createAt(placement,p.x,p.y);};
  const startMove=(e:ReactPointerEvent<HTMLButtonElement>,region:MapRegion,locationId:string)=>{e.preventDefault();e.stopPropagation();moving.current={region,locationId};e.currentTarget.setPointerCapture(e.pointerId);};
  const moveToken=(e:ReactPointerEvent<HTMLButtonElement>)=>{if(!moving.current)return;e.preventDefault();e.stopPropagation();const p=point(e.clientX,e.clientY);if(!p)return;const el=e.currentTarget;el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;};
  const endMove=async(e:ReactPointerEvent<HTMLButtonElement>)=>{const current=moving.current;if(!current)return;moving.current=null;const p=point(e.clientX,e.clientY);if(!p)return;const parsed=parseMapTokenRegion(current.region);if(!parsed)return;setBusy(true);try{await saveRegion(tokenRegionPayload({locationId:current.locationId,floor:parsed.floor,name:parsed.name,x:p.x,y:p.y,size:parsed.size}));setNotice(`${parsed.name} movido.`);await refresh();}catch(err){setError(err instanceof Error?err.message:"Falha ao mover token.");}finally{setBusy(false);}};
  const toggle=async(item:{region:MapRegion;token:NonNullable<ReturnType<typeof parseMapTokenRegion>>})=>{setBusy(true);try{const next=visibleMap.get(item.token.locationId)!==true;await setReveal(item.token.locationId,next);setNotice(`${item.token.name} ${next?"visível":"oculto"} para ${target==="group"?"o grupo":"o player selecionado"}.`);await refresh();}catch(e){setError(e instanceof Error?e.message:"Falha ao alterar token.");}finally{setBusy(false);}};
  const archive=async(item:{region:MapRegion;token:NonNullable<ReturnType<typeof parseMapTokenRegion>>})=>{if(!confirm(`Remover ${item.token.name} do mapa?`))return;setBusy(true);try{await saveRegion(tokenRegionPayload({...item.token,archived:true}));await setReveal(item.token.locationId,false,"group");for(const player of data?.players??[])if(player.active)await setReveal(item.token.locationId,false,player.id);setNotice(`${item.token.name} removido do mapa.`);await refresh();}catch(e){setError(e instanceof Error?e.message:"Falha ao remover token.");}finally{setBusy(false);}};

  if(pathname!=="/mapa"||!requireMasterToken()||!cloudConfigured())return null;
  const choices:Selection[]=[...(data?.players??[]).filter(p=>p.active).map(p=>({kind:"PLAYER" as const,subjectId:p.id,name:p.characterName||p.playerName,avatarUrl:p.avatarUrl})),...NPCS.filter(n=>n.status!=="morto").map(n=>({kind:"NPC" as const,subjectId:n.id,name:n.name}))];

  return <>
    {mapHost&&createPortal(<div className={`absolute inset-0 z-[35] ${placement?"pointer-events-auto cursor-crosshair":"pointer-events-none"}`} onPointerDown={handlePlacement}>
      {floorTokens.map(item=>{const p=item.token;const player=item.token.kind==="PLAYER"?data?.players.find(x=>x.id===p.subjectId):null;const initials=p.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();return <button key={p.locationId} type="button" title={`${p.name} · arraste para mover`} aria-label={`Token de ${p.name}`} onPointerDown={e=>startMove(e,item.region,p.locationId)} onPointerMove={moveToken} onPointerUp={endMove} onPointerCancel={()=>{moving.current=null;void refresh();}} className="pointer-events-auto absolute z-40 flex size-9 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-background text-[10px] font-black shadow-[0_0_0_2px_rgba(0,0,0,.65),0_4px_14px_rgba(0,0,0,.55)] transition-transform hover:scale-110" style={{left:`${p.x}%`,top:`${p.y}%`}}>{player?.avatarUrl?<img src={player.avatarUrl} alt="" className="size-full object-cover"/>:initials}</button>;})}
      {placement&&<div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg border border-primary/50 bg-background/95 px-3 py-2 text-xs shadow-xl">Clique no mapa para posicionar <b>{placement.name}</b></div>}
    </div>,mapHost)}

    <div className="fixed bottom-4 right-4 z-[90] w-[min(370px,calc(100vw-2rem))]">
      {open&&<div className="mb-2 max-h-[72vh] overflow-y-auto rounded-xl border border-primary/30 bg-background/98 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2"><UsersRound className="size-4 text-primary"/><div className="min-w-0 flex-1"><p className="stamp text-primary">Peões no mapa</p><p className="text-xs text-muted-foreground">{MAP_IMAGES[floor].label} · arraste os peões para mover</p></div><Button size="sm" variant="ghost" onClick={()=>setOpen(false)}><X className="size-4"/></Button></div>
        <label className="mt-3 block text-[11px] text-muted-foreground">Quem verá as alterações<select className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs" value={target} onChange={e=>setTarget(e.target.value)}><option value="group">Grupo inteiro</option>{(data?.players??[]).filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.playerName} · {p.characterName||"sem personagem"}</option>)}</select></label>
        <label className="mt-3 block text-[11px] text-muted-foreground">Adicionar personagem<select className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-xs" value="" onChange={e=>{const [kind,id]=e.target.value.split(":");const sel=choices.find(c=>c.kind===kind&&c.subjectId===id);if(sel){setPlacement(sel);setOpen(false);}e.target.value="";}}><option value="">Escolha player ou NPC…</option><optgroup label="Players">{choices.filter(c=>c.kind==="PLAYER").map(c=><option key={`${c.kind}-${c.subjectId}`} value={`${c.kind}:${c.subjectId}`}>{c.name}</option>)}</optgroup><optgroup label="NPCs">{choices.filter(c=>c.kind==="NPC").map(c=><option key={`${c.kind}-${c.subjectId}`} value={`${c.kind}:${c.subjectId}`}>{c.name}</option>)}</optgroup></select></label>
        {placement&&<Button className="mt-2 w-full" variant="secondary" onClick={()=>setPlacement(null)}>Cancelar posicionamento</Button>}
        <div className="mt-3 space-y-2">{floorTokens.map(item=>{const visible=visibleMap.get(item.token.locationId)===true;return <div key={item.token.locationId} className="flex items-center gap-2 rounded-lg border border-border bg-card/30 p-2"><div className="flex size-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[10px] font-bold">{item.token.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.token.name}</p><p className="text-[9px] text-muted-foreground">{item.token.kind} · x {item.token.x.toFixed(1)} · y {item.token.y.toFixed(1)}</p></div><Button size="sm" variant="ghost" disabled={busy} onClick={()=>void toggle(item)} title={visible?"Ocultar":"Mostrar"}>{visible?<EyeOff className="size-3.5"/>:<Eye className="size-3.5"/>}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={()=>void archive(item)} title="Remover"><Trash2 className="size-3.5"/></Button></div>;})}{!floorTokens.length&&<p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Nenhum peão neste piso.</p>}</div>
        {error&&<p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}{notice&&<p className="mt-3 text-xs text-route-verde-claro">{notice}</p>}
        <Button className="mt-3 w-full" size="sm" variant="ghost" onClick={()=>void refresh()}><RefreshCw className="mr-1 size-3.5"/>Atualizar</Button>
      </div>}
      <div className="flex justify-end gap-2">{placement&&<Button variant="destructive" onClick={()=>setPlacement(null)}><X className="mr-1 size-4"/>Cancelar</Button>}<Button onClick={()=>setOpen(v=>!v)}><UserPlus className="mr-1 size-4"/>{open?"Fechar peões":"Peões"}</Button></div>
    </div>
  </>;
}
