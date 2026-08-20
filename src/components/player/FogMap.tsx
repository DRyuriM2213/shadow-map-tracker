import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAP_IMAGES, type FloorId } from "@/data/map";
import { useAsset } from "@/lib/useAsset";
import type { MapRegion, MapReveal, SharedAsset } from "@/lib/playerCloudTypes";
import { decodeManualRevealLocationId, regionLocationId, revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { AlertTriangle, Eye, Map as MapIcon } from "lucide-react";

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export function FogMap({ playerId, regions, reveals, assets }: { playerId: string; regions: MapRegion[]; reveals: MapReveal[]; assets: SharedAsset[] }) {
  const [floor, setFloor] = useState<FloorId>("primeiro");
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [sharedAssetFailed, setSharedAssetFailed] = useState(false);
  const localImage = useAsset(`map:${floor}:limpo`);

  const asset = (key: string) => assets.find(a => (a.assetKey ?? a.asset_key) === key)?.publicUrl ?? assets.find(a => (a.assetKey ?? a.asset_key) === key)?.public_url;
  const sharedImage = asset(`map:${floor}:limpo`) ?? "";
  const usingSharedImage = !!sharedImage && !sharedAssetFailed;
  const usingLocalImage = !usingSharedImage && !!localImage;
  const image = usingSharedImage ? sharedImage : localImage ?? MAP_IMAGES[floor].limpo;

  useEffect(() => {
    setSharedAssetFailed(false);
  }, [floor, sharedImage]);

  useEffect(() => {
    setImageReady(false);
    setImageFailed(false);
  }, [image, floor]);

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

  const handleImageError = () => {
    setImageReady(false);
    if (usingSharedImage) {
      setSharedAssetFailed(true);
      return;
    }
    setImageFailed(true);
  };

  const sourceLabel = usingSharedImage ? "asset compartilhado" : usingLocalImage ? "asset restaurado neste navegador" : "fallback estático";

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div>
        <p className="stamp text-primary">Cartografia operacional</p>
        <h2 className="font-display text-2xl">Mapa conhecido</h2>
        <p className="text-xs text-muted-foreground">Somente as áreas desenhadas e liberadas pelo mestre aparecem. Novas áreas chegam automaticamente.</p>
      </div>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant={floor === "primeiro" ? "default" : "outline"} onClick={() => setFloor("primeiro")}>Térreo</Button>
        <Button size="sm" variant={floor === "superior" ? "default" : "outline"} onClick={() => setFloor("superior")}>Andar superior</Button>
      </div>
    </div>

    <div className="player-terminal-card relative min-h-[360px] overflow-hidden border bg-black shadow-2xl">
      <img
        key={`sizer-${floor}-${image}`}
        src={image}
        alt=""
        aria-hidden
        className="block w-full select-none opacity-0"
        draggable={false}
        onLoad={() => { setImageReady(true); setImageFailed(false); }}
        onError={handleImageError}
      />

      {imageReady && safeRegions.map(region => (
        <div
          key={`${floor}-${region.id}`}
          className="absolute overflow-hidden bg-black ring-1 ring-white/10"
          style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }}
        >
          <img
            src={image}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{ width: `${10000 / region.width}%`, height: `${10000 / region.height}%`, left: `${-(region.x / region.width) * 100}%`, top: `${-(region.y / region.height) * 100}%` }}
          />
        </div>
      ))}

      {imageFailed && (
        <div className="map-recovery-panel absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-amber-200">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10"><AlertTriangle className="size-7" /></div>
          <p className="mt-4 font-semibold text-zinc-100">Planta aguardando restauração</p>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-zinc-400">As áreas liberadas continuam preservadas no Cloud. O terminal tentou o asset compartilhado, um asset local validado e a planta estática; nenhuma fonte válida está disponível neste momento.</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-amber-300/80">Fog preservado · nenhuma coordenada foi perdida</p>
        </div>
      )}

      {!imageFailed && safeRegions.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-8 text-center text-zinc-500">
          <MapIcon className="size-12" />
          <p className="mt-3 font-mono text-sm tracking-widest">SEM ÁREAS LIBERADAS</p>
          <p className="mt-1 text-xs">O mestre ainda não revelou nenhuma parte deste piso.</p>
        </div>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Eye className="size-3.5" />
      <span>{safeRegions.length} área(s) visível(is) neste piso.</span>
      {imageReady && <span className="text-route-verde-claro">· planta carregada via {sourceLabel}</span>}
    </div>
  </section>;
}
