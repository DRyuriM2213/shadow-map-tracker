import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAP_IMAGES, type FloorId } from "@/data/map";
import type { MapRegion, MapReveal, SharedAsset } from "@/lib/playerCloudTypes";
import { decodeManualRevealLocationId, regionLocationId, revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { Eye, Map as MapIcon } from "lucide-react";

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export function FogMap({ playerId, regions, reveals, assets }: { playerId: string; regions: MapRegion[]; reveals: MapReveal[]; assets: SharedAsset[] }) {
  const [floor, setFloor] = useState<FloorId>("primeiro");
  const rawMaskId = useId();
  const maskId = `fog-${rawMaskId.replace(/[^a-zA-Z0-9_-]/g, "")}-${floor}`;
  const asset = (key: string) => assets.find(a => (a.assetKey ?? a.asset_key) === key)?.publicUrl ?? assets.find(a => (a.assetKey ?? a.asset_key) === key)?.public_url;
  const image = asset(`map:${floor}:limpo`) || MAP_IMAGES[floor].limpo;

  const visible = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const reveal of reveals.filter(r => r.floor === floor && !revealTargetId(r))) {
      map.set(revealLocationId(reveal), reveal.revealed);
    }
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

  const safeRegions = useMemo(() => openRegions.flatMap(region => {
    const x = Number(region.x), y = Number(region.y), width = Number(region.width), height = Number(region.height);
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return [];
    const sx = clampPercent(x), sy = clampPercent(y);
    const sw = Math.max(0, Math.min(width, 100 - sx));
    const sh = Math.max(0, Math.min(height, 100 - sy));
    return sw > 0 && sh > 0 ? [{ id: regionLocationId(region) || region.id || `${sx}-${sy}`, x: sx, y: sy, width: sw, height: sh }] : [];
  }), [openRegions]);

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div>
        <p className="stamp text-primary">Cartografia operacional</p>
        <h2 className="font-display text-2xl">Mapa conhecido</h2>
        <p className="text-xs text-muted-foreground">Somente as áreas desenhadas e liberadas pelo mestre aparecem. Novas áreas chegam automaticamente.</p>
      </div>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant={floor === "primeiro" ? "default" : "outline"} onClick={() => setFloor("primeiro")}>Primeiro andar</Button>
        <Button size="sm" variant={floor === "superior" ? "default" : "outline"} onClick={() => setFloor("superior")}>Andar superior</Button>
      </div>
    </div>

    <div className="relative overflow-hidden rounded-sm border border-border bg-black shadow-2xl">
      {/* O mapa fica colorido por baixo. O SVG cobre tudo de preto e abre buracos nas regiões liberadas. */}
      <img
        src={image}
        alt={`Mapa conhecido — ${MAP_IMAGES[floor].label}`}
        className="block w-full select-none"
        draggable={false}
        onError={(e) => { e.currentTarget.style.minHeight = "420px"; }}
      />

      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {safeRegions.map(region => (
              <rect key={region.id} x={region.x} y={region.y} width={region.width} height={region.height} fill="black" />
            ))}
          </mask>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="#000" mask={`url(#${maskId})`} />
      </svg>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,.08)_76%,rgba(0,0,0,.30)_100%)]" />

      {safeRegions.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-8 text-center text-zinc-500">
          <MapIcon className="size-12" />
          <p className="mt-3 font-mono text-sm tracking-widest">SEM ÁREAS LIBERADAS</p>
          <p className="mt-1 text-xs">O mestre ainda não revelou nenhuma parte deste piso.</p>
        </div>
      )}
    </div>

    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Eye className="size-3.5" />
      <span>{safeRegions.length} área(s) visível(is) neste piso.</span>
    </div>
  </section>;
}
