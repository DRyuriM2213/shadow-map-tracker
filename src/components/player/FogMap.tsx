import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAP_IMAGES, type FloorId } from "@/data/map";
import type { MapRegion, MapReveal, SharedAsset } from "@/lib/playerCloudTypes";
import { decodeManualRevealLocationId, regionLocationId, revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { Eye, Map as MapIcon } from "lucide-react";

export function FogMap({ playerId, regions, reveals, assets }: { playerId: string; regions: MapRegion[]; reveals: MapReveal[]; assets: SharedAsset[] }) {
  const [floor, setFloor] = useState<FloorId>("primeiro");
  const asset = (key: string) => assets.find(a => (a.assetKey ?? a.asset_key) === key)?.publicUrl ?? assets.find(a => (a.assetKey ?? a.asset_key) === key)?.public_url;
  const image = asset(`map:${floor}:limpo`) || MAP_IMAGES[floor].limpo;

  const visible = useMemo(() => {
    const map = new Map<string, boolean>();
    // A liberação do grupo vale como base.
    for (const reveal of reveals.filter(r => r.floor === floor && !revealTargetId(r))) {
      map.set(revealLocationId(reveal), reveal.revealed);
    }
    // Uma liberação/ocultação específica do player sobrescreve a do grupo.
    for (const reveal of reveals.filter(r => r.floor === floor && revealTargetId(r) === playerId)) {
      map.set(revealLocationId(reveal), reveal.revealed);
    }
    return map;
  }, [reveals, floor, playerId]);

  const openRegions = useMemo(() => {
    const byId = new Map<string, MapRegion>();
    for (const region of regions.filter(r => r.floor === floor)) {
      const id = regionLocationId(region);
      if (id) byId.set(id, region);
    }

    const result: MapRegion[] = [];
    for (const [locationId, isVisible] of visible.entries()) {
      if (!isVisible || !locationId) continue;
      const stored = byId.get(locationId);
      if (stored) {
        result.push(stored);
        continue;
      }

      // Fallback V2: a geometria pode viajar dentro do próprio ID da revelação.
      // Assim o mapa continua funcionando mesmo quando um backend antigo não devolve map_regions.
      const decoded = decodeManualRevealLocationId(locationId);
      if (!decoded || decoded.floor !== floor) continue;
      result.push({
        id: locationId,
        floor: decoded.floor,
        locationId,
        label: "Área liberada pelo mestre",
        x: decoded.x,
        y: decoded.y,
        width: decoded.width,
        height: decoded.height,
      });
    }
    return result;
  }, [regions, floor, visible]);

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Cartografia operacional</p><h2 className="font-display text-2xl">Mapa conhecido</h2><p className="text-xs text-muted-foreground">Somente as áreas desenhadas e liberadas pelo mestre aparecem. Novas áreas chegam automaticamente.</p></div><div className="ml-auto flex gap-2"><Button size="sm" variant={floor==="primeiro"?"default":"outline"} onClick={()=>setFloor("primeiro")}>Primeiro andar</Button><Button size="sm" variant={floor==="superior"?"default":"outline"} onClick={()=>setFloor("superior")}>Andar superior</Button></div></div>
    <div className="relative overflow-hidden rounded-sm border border-border bg-black shadow-2xl">
      <img src={image} alt="Mapa oculto" className="block w-full select-none brightness-0" draggable={false} onError={(e)=>{e.currentTarget.style.minHeight="420px";}} />
      {openRegions.map(region => {
        const x=Number(region.x), y=Number(region.y), w=Number(region.width), h=Number(region.height);
        const id=regionLocationId(region);
        const clip=`polygon(${x}% ${y}%, ${x+w}% ${y}%, ${x+w}% ${y+h}%, ${x}% ${y+h}%)`;
        return <img key={`${floor}-${id}`} src={image} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full select-none" draggable={false} style={{clipPath:clip}} />;
      })}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,.13)_74%,rgba(0,0,0,.45)_100%)]" />
      {openRegions.length===0&&<div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-500"><MapIcon className="size-12"/><p className="mt-3 font-mono text-sm tracking-widest">SEM ÁREAS LIBERADAS</p><p className="mt-1 text-xs">O mestre ainda não revelou nenhuma parte deste piso.</p></div>}
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Eye className="size-3.5"/><span>{openRegions.length} área(s) visível(is) neste piso.</span></div>
  </section>;
}
