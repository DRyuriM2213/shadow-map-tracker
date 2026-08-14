import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAP_IMAGES, type FloorId } from "@/data/map";
import type { MapRegion, MapReveal, SharedAsset } from "@/lib/playerCloudTypes";
import { regionLocationId, revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { Eye, Map as MapIcon } from "lucide-react";

export function FogMap({ playerId, regions, reveals, assets }: { playerId: string; regions: MapRegion[]; reveals: MapReveal[]; assets: SharedAsset[] }) {
  const [floor, setFloor] = useState<FloorId>("primeiro");
  const asset = (key: string) => assets.find(a => (a.assetKey ?? a.asset_key) === key)?.publicUrl ?? assets.find(a => (a.assetKey ?? a.asset_key) === key)?.public_url;
  const image = asset(`map:${floor}:limpo`) || MAP_IMAGES[floor].limpo;
  const floorRegions = regions.filter(r => r.floor === floor);

  const visible = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const r of reveals.filter(r => r.floor === floor && !revealTargetId(r))) map.set(revealLocationId(r), r.revealed);
    for (const r of reveals.filter(r => r.floor === floor && revealTargetId(r) === playerId)) map.set(revealLocationId(r), r.revealed);
    return map;
  }, [reveals, floor, playerId]);

  const openRegions = floorRegions.filter(r => visible.get(regionLocationId(r)) === true);

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Cartografia operacional</p><h2 className="font-display text-2xl">Mapa conhecido</h2><p className="text-xs text-muted-foreground">Áreas não visitadas permanecem ocultas. O mapa se atualiza quando o mestre libera uma sala.</p></div><div className="ml-auto flex gap-2"><Button size="sm" variant={floor==="primeiro"?"default":"outline"} onClick={()=>setFloor("primeiro")}>Primeiro andar</Button><Button size="sm" variant={floor==="superior"?"default":"outline"} onClick={()=>setFloor("superior")}>Andar superior</Button></div></div>
    <div className="relative overflow-hidden rounded-sm border border-border bg-black shadow-2xl">
      <img src={image} alt="Mapa oculto" className="block w-full select-none brightness-0" draggable={false} onError={(e)=>{e.currentTarget.style.minHeight="420px";}} />
      {openRegions.map(region => {
        const x=Number(region.x), y=Number(region.y), w=Number(region.width), h=Number(region.height);
        const id=regionLocationId(region);
        const clip=`polygon(${x}% ${y}%, ${x+w}% ${y}%, ${x+w}% ${y+h}%, ${x}% ${y+h}%)`;
        return <img key={`${floor}-${id}`} src={image} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full select-none" draggable={false} style={{clipPath:clip}} />;
      })}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,.18)_72%,rgba(0,0,0,.55)_100%)]" />
      {openRegions.length===0&&<div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-500"><MapIcon className="size-12"/><p className="mt-3 font-mono text-sm tracking-widest">SEM DADOS CARTOGRÁFICOS LIBERADOS</p><p className="mt-1 text-xs">Explore a universidade para revelar novas áreas.</p></div>}
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Eye className="size-3.5"/><span>{openRegions.length} região(ões) visível(is) neste piso.</span></div>
  </section>;
}
