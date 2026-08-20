import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getCloudSession, requirePlayerSession, rpc } from "@/lib/cloud";
import { Maximize2, Radio, X } from "lucide-react";

type BroadcastItem = { id:string; title:string; caption:string; imageData:string; createdAt:string };
type FeedResponse = { ok:boolean; error?:string; media?:BroadcastItem[]; activeIds?:string[] };

function loadDismissed(storageKey:string){
  if(typeof window==="undefined")return [] as string[];
  try{return JSON.parse(sessionStorage.getItem(storageKey)??"[]") as string[];}catch{return [] as string[];}
}

export function LiveMediaReceiver(){
  const pathname=useRouterState({select:s=>s.location.pathname});
  const cloud=getCloudSession();
  const isRealPlayer=pathname==="/player"&&cloud?.role==="PLAYER";
  const playerId=cloud?.player?.id??"player";
  const storageKey=`berco-media-dismissed:${playerId}`;
  const [items,setItems]=useState<BroadcastItem[]>([]);
  const [dismissed,setDismissed]=useState<string[]>(()=>loadDismissed(storageKey));
  const [zoomed,setZoomed]=useState(false);
  const itemsRef=useRef<BroadcastItem[]>(items);
  const dismissedRef=useRef<string[]>(dismissed);

  useEffect(()=>{itemsRef.current=items;},[items]);
  useEffect(()=>{dismissedRef.current=dismissed;},[dismissed]);
  useEffect(()=>{
    const next=loadDismissed(storageKey);
    setItems([]);
    setDismissed(next);
    setZoomed(false);
  },[storageKey]);

  const poll=useCallback(async()=>{
    const current=requirePlayerSession();
    if(!current)return;
    try{
      const known=[...new Set([...itemsRef.current.map(i=>i.id),...dismissedRef.current])];
      const result=await rpc<FeedResponse>("player_media_feed",{p_token:current.token,p_known_ids:known.length?known:null});
      if(!result.ok)return;
      const active=new Set(result.activeIds??[]);
      setItems(prev=>{
        const merged=[...(result.media??[]),...prev.filter(i=>active.has(i.id))];
        return Array.from(new Map(merged.filter(i=>active.has(i.id)).map(i=>[i.id,i])).values()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      });
    }catch{/* tenta novamente no próximo ciclo */}
  },[]);

  useEffect(()=>{
    if(!isRealPlayer)return;
    void poll();
    const timer=window.setInterval(()=>void poll(),1500);
    return()=>window.clearInterval(timer);
  },[isRealPlayer,poll]);

  useEffect(()=>{
    if(typeof window!=="undefined")sessionStorage.setItem(storageKey,JSON.stringify(dismissed.slice(-80)));
  },[dismissed,storageKey]);

  const current=useMemo(()=>items.find(i=>!dismissed.includes(i.id))??null,[items,dismissed]);
  if(!isRealPlayer||!current)return null;
  const close=()=>{setDismissed(old=>[...new Set([...old,current.id])]);setZoomed(false);};
  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3 backdrop-blur-lg sm:p-6"><div className={`relative flex h-full w-full flex-col overflow-hidden rounded-sm border border-white/15 bg-[#050505] shadow-[0_0_80px_rgba(0,0,0,.9)] ${zoomed?"max-w-none":"max-w-6xl"}`}><div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-black/80 px-3 py-3 text-zinc-100 sm:px-5"><div className="flex size-9 items-center justify-center rounded-full border border-red-600/50 bg-red-950/50"><Radio className="size-4 text-red-400"/></div><div className="min-w-0 flex-1"><p className="stamp text-red-400">Transmissão do mestre</p><h2 className="truncate text-lg font-semibold sm:text-xl">{current.title||"Imagem do mestre"}</h2></div><Button size="sm" variant="ghost" className="text-zinc-300" onClick={()=>setZoomed(v=>!v)} title="Alternar tamanho"><Maximize2 className="size-4"/></Button><Button size="sm" variant="ghost" className="text-zinc-300" onClick={close}><X className="mr-1 size-4"/>Fechar</Button></div><div className="min-h-0 flex-1 bg-black p-2 sm:p-4"><img src={current.imageData} alt={current.title||"Imagem enviada pelo mestre"} className="size-full select-none object-contain" draggable={false}/></div>{current.caption&&<div className="shrink-0 border-t border-white/10 bg-black/90 px-4 py-3 text-center text-sm leading-relaxed text-zinc-200 sm:text-base">{current.caption}</div>}</div></div>;
}
