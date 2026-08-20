import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HOTSPOTS, MAP_IMAGES, type FloorId, type MapHotspot } from "@/data/map";
import { LOCATIONS } from "@/data/campaignFull";
import { useAsset } from "@/lib/useAsset";
import { useCampaign } from "@/store/campaign";
import { cloudConfigured, requireMasterToken, rpc } from "@/lib/cloud";
import type { MapRegion, MasterDashboardData } from "@/lib/playerCloudTypes";
import { regionLocationId, revealLocationId, revealTargetId } from "@/lib/playerCloudTypes";
import { RoomInspector, cluesForLocation } from "@/components/RoomInspector";
import { Cloud, Crosshair, Expand, Eye, EyeOff, Image as ImageIcon, Minus, Plus, RotateCcw, ScanLine } from "lucide-react";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa Interativo — Berço Vazio" },
      { name: "description", content: "Plantas da Universidade Valença com áreas clicáveis e fog of war desenhado livremente pelo mestre." },
    ],
  }),
  component: MapaPage,
});

type Coords = Record<string, { x: number; y: number; w: number; h: number }>;
type RevealRect = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };
const COORDS_KEY = "berco-vazio-map-hotspots-v1";

function loadCoords(): Coords {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(COORDS_KEY) ?? "{}") as Coords;
  } catch {
    return {};
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round2 = (value: number) => Math.round(value * 100) / 100;

function MapaPage() {
  const session = useCampaign((s) => s.session);
  const setLocation = useCampaign((s) => s.setLocation);
  const [floor, setFloor] = useState<FloorId>("primeiro");
  const [numerado, setNumerado] = useState(false);
  const [aberto, setAberto] = useState<MapHotspot | null>(null);
  const [editar, setEditar] = useState(false);
  const [coords, setCoords] = useState<Coords>(loadCoords);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [staticFailed, setStaticFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageNatural, setImageNatural] = useState({ w: 0, h: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });

  const [cloudData, setCloudData] = useState<MasterDashboardData | null>(null);
  const [cloudError, setCloudError] = useState("");
  const [cloudNotice, setCloudNotice] = useState("");
  const [revealMode, setRevealMode] = useState(false);
  const [revealTarget, setRevealTarget] = useState("group");
  const [draftRect, setDraftRect] = useState<RevealRect | null>(null);
  const [savingReveal, setSavingReveal] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const drawing = useRef<Point | null>(null);

  const doAndar = useMemo(() => HOTSPOTS.filter((h) => h.floor === floor), [floor]);
  const img = MAP_IMAGES[floor];
  const staticSrc = numerado ? img.numerado : img.limpo;
  const assetKey = `map:${floor}:${numerado ? "numerado" : "limpo"}`;
  const assetUrl = useAsset(assetKey);
  const src = assetUrl ?? staticSrc;
  const hasImage = !!assetUrl || !staticFailed;
  const cloudReady = cloudConfigured() && !!requireMasterToken();

  const refreshCloud = useCallback(async () => {
    const token = requireMasterToken();
    if (!token || !cloudConfigured()) {
      setCloudData(null);
      return;
    }
    try {
      const result = await rpc<MasterDashboardData>("master_dashboard", { p_token: token });
      if (!result.ok) throw new Error(result.error || "Não foi possível carregar o mapa compartilhado.");
      setCloudData(result);
      setCloudError("");
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Falha ao carregar o Cloud.");
    }
  }, []);

  useEffect(() => { void refreshCloud(); }, [refreshCloud]);
  useEffect(() => setStaticFailed(false), [staticSrc]);
  useEffect(() => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
  }, [coords]);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => setViewportSize({ w: element.clientWidth, h: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fitSize = useMemo(() => {
    if (!viewportSize.w || !viewportSize.h || !imageNatural.w || !imageNatural.h) return null;
    const factor = Math.min(viewportSize.w / imageNatural.w, viewportSize.h / imageNatural.h);
    return { w: imageNatural.w * factor, h: imageNatural.h * factor };
  }, [viewportSize, imageNatural]);

  const cloudRegions = useMemo(
    () => (cloudData?.mapRegions ?? []).filter((region) => region.floor === floor),
    [cloudData?.mapRegions, floor],
  );
  const manualRegions = useMemo(
    () => cloudRegions.filter((region) => regionLocationId(region).startsWith("manual-")),
    [cloudRegions],
  );

  const effectiveReveals = useMemo(() => {
    const map = new Map<string, boolean>();
    const reveals = (cloudData?.mapReveals ?? []).filter((reveal) => reveal.floor === floor);
    for (const reveal of reveals) {
      if (!revealTargetId(reveal)) map.set(revealLocationId(reveal), reveal.revealed);
    }
    if (revealTarget !== "group") {
      for (const reveal of reveals) {
        if (revealTargetId(reveal) === revealTarget) map.set(revealLocationId(reveal), reveal.revealed);
      }
    }
    return map;
  }, [cloudData?.mapReveals, floor, revealTarget]);

  const revealTargetLabel = revealTarget === "group"
    ? "grupo inteiro"
    : cloudData?.players.find((player) => player.id === revealTarget)?.playerName ?? "player selecionado";

  const pos = (h: MapHotspot) => coords[h.id] ?? (h.x !== null && h.y !== null ? { x: h.x, y: h.y!, w: h.w, h: h.h } : null);
  const resetView = () => { setScale(1); setPan({ x: 0, y: 0 }); };
  const zoom = (delta: number) => setScale((v) => Math.min(4, Math.max(0.75, Number((v + delta).toFixed(2)))));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (editar || revealMode) return;
    drag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || editar || revealMode) return;
    setPan({ x: drag.current.panX + e.clientX - drag.current.startX, y: drag.current.panY + e.clientY - drag.current.startY });
  };
  const stopDrag = () => { drag.current = null; };

  const pointFromPointer = (e: ReactPointerEvent<HTMLDivElement>): Point | null => {
    const element = mapContentRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  const beginReveal = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!revealMode) return;
    e.preventDefault();
    e.stopPropagation();
    const point = pointFromPointer(e);
    if (!point) return;
    drawing.current = point;
    setDraftRect({ x: point.x, y: point.y, w: 0, h: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveReveal = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    e.stopPropagation();
    const point = pointFromPointer(e);
    if (!point) return;
    const start = drawing.current;
    setDraftRect({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    });
  };

  const endReveal = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    e.stopPropagation();
    drawing.current = null;
  };

  const saveDraftReveal = async () => {
    const token = requireMasterToken();
    if (!token || !cloudConfigured()) {
      setCloudError("Conecte o painel do mestre ao Cloud na página Players antes de liberar o mapa.");
      return;
    }
    if (!draftRect || draftRect.w < 0.6 || draftRect.h < 0.6) {
      setCloudError("Arraste uma área maior sobre a planta antes de liberar.");
      return;
    }
    if (revealTarget !== "group" && !cloudData?.players.some((player) => player.id === revealTarget)) {
      setCloudError("Selecione um player válido.");
      return;
    }

    setSavingReveal(true);
    setCloudError("");
    setCloudNotice("");
    const locationId = `manual-${floor}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const label = `Área manual · ${MAP_IMAGES[floor].label} · ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    const payload = {
      floor,
      locationId,
      location_id: locationId,
      label,
      x: round2(draftRect.x),
      y: round2(draftRect.y),
      width: round2(draftRect.w),
      height: round2(draftRect.h),
    };

    try {
      const regionResult = await rpc<{ ok?: boolean; error?: string }>("master_set_map_region", { p_token: token, p_payload: payload });
      if (regionResult?.ok === false) throw new Error(regionResult.error || "Falha ao salvar a área do mapa.");
      const targets = revealTarget === "group" ? null : [revealTarget];
      const revealResult = await rpc<{ ok?: boolean; error?: string }>("master_set_map_reveal", {
        p_token: token,
        p_floor: floor,
        p_location_id: locationId,
        p_revealed: true,
        p_targets: targets,
      });
      if (revealResult?.ok === false) throw new Error(revealResult.error || "Falha ao liberar a área para o player.");
      setDraftRect(null);
      setCloudNotice(`Área liberada para ${revealTargetLabel}. Você pode arrastar outra área agora.`);
      await refreshCloud();
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Falha ao liberar a área do mapa.");
    } finally {
      setSavingReveal(false);
    }
  };

  const setRegionReveal = async (region: MapRegion, revealed: boolean) => {
    const token = requireMasterToken();
    if (!token || !cloudConfigured()) return;
    const locationId = regionLocationId(region);
    if (!locationId) return;
    setSavingReveal(true);
    setCloudError("");
    try {
      const result = await rpc<{ ok?: boolean; error?: string }>("master_set_map_reveal", {
        p_token: token,
        p_floor: region.floor,
        p_location_id: locationId,
        p_revealed: revealed,
        p_targets: revealTarget === "group" ? null : [revealTarget],
      });
      if (result?.ok === false) throw new Error(result.error || "Falha ao alterar visibilidade.");
      setCloudNotice(`${revealed ? "Área liberada" : "Área ocultada"} para ${revealTargetLabel}.`);
      await refreshCloud();
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Falha ao alterar visibilidade.");
    } finally {
      setSavingReveal(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stageRef.current.requestFullscreen();
  };

  const toggleRevealMode = () => {
    if (!cloudReady) {
      setCloudError("O Cloud do mestre precisa estar conectado. Abra Players e conecte o PIN do mestre primeiro.");
      return;
    }
    setEditar(false);
    setDraftRect(null);
    drawing.current = null;
    setRevealMode((value) => !value);
    setCloudNotice("");
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="dossier rounded-sm p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="stamp text-primary">Plantas da Universidade Valença</p>
              <h1 className="text-3xl font-semibold">Mapa Interativo</h1>
              <p className="text-sm text-muted-foreground">Para mostrar o mapa aos players, ative <b>Liberar área</b> e arraste diretamente sobre o pedaço que eles descobriram. Não depende mais do nome da sala.</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {(Object.keys(MAP_IMAGES) as FloorId[]).map((f) => <Button key={f} size="sm" variant={floor === f ? "default" : "outline"} onClick={() => { setFloor(f); resetView(); setDraftRect(null); }}>{MAP_IMAGES[f].label}</Button>)}
              <Button size="sm" variant={numerado ? "default" : "outline"} onClick={() => setNumerado((v) => !v)}>{numerado ? "Numerado" : "Limpo"}</Button>
              <Button size="sm" variant={revealMode ? "destructive" : "default"} onClick={toggleRevealMode}><ScanLine className="mr-1 size-4" />{revealMode ? "Sair da liberação" : "Liberar área"}</Button>
              <Link to="/sessao-v2"><Button size="sm" variant="secondary">Modo Sessão</Button></Link>
              <Link to="/assets"><Button size="sm" variant="outline"><ImageIcon className="mr-1 size-4" />Imagens</Button></Link>
              <Button size="sm" variant={editar ? "destructive" : "ghost"} disabled={revealMode} onClick={() => setEditar((v) => !v)}>{editar ? "Sair da edição" : "Editar hotspots"}</Button>
            </div>
          </div>
          {!cloudReady && <p className="mt-3 rounded-sm border border-route-amarelo/50 bg-route-amarelo/10 p-2 text-xs text-route-amarelo"><Cloud className="mr-1 inline size-3.5" />Fog of war visual indisponível até o Cloud do mestre estar conectado. <Link to="/players" className="underline">Abrir Players</Link>.</p>}
          {cloudError && <p className="mt-3 rounded-sm border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">{cloudError}</p>}
          {cloudNotice && <p className="mt-3 rounded-sm border border-route-verde/40 bg-route-verde/10 p-2 text-xs text-route-verde-claro">{cloudNotice}</p>}
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div ref={stageRef} className={`dossier relative overflow-hidden bg-background ${isFullscreen ? "h-[100dvh] w-[100dvw] rounded-none border-0 p-0" : "rounded-sm p-2"}`}>
            <div className="absolute left-4 top-4 z-40 flex flex-wrap gap-1 rounded-sm border border-border bg-background/90 p-1 shadow-xl backdrop-blur">
              <Button size="sm" variant="ghost" title="Diminuir zoom" onClick={() => zoom(-0.25)}><Minus className="size-4" /></Button>
              <span className="min-w-14 self-center text-center font-mono text-xs">{Math.round(scale * 100)}%</span>
              <Button size="sm" variant="ghost" title="Aumentar zoom" onClick={() => zoom(0.25)}><Plus className="size-4" /></Button>
              <Button size="sm" variant="ghost" title="Centralizar" onClick={resetView}><Crosshair className="size-4" /></Button>
              <Button size="sm" variant="ghost" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"} onClick={() => void toggleFullscreen()}><Expand className="size-4" /></Button>
            </div>

            {revealMode && (
              <div className="absolute right-4 top-4 z-40 w-[min(360px,calc(100%-2rem))] rounded-sm border border-route-azul/60 bg-background/95 p-3 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-2"><ScanLine className="size-4 text-route-azul" /><div><p className="stamp text-route-azul">Liberar área</p><p className="text-xs text-muted-foreground">Arraste um retângulo diretamente na planta.</p></div></div>
                <label className="mt-3 block text-[11px] text-muted-foreground">Destino
                  <select className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-1.5 text-xs text-foreground" value={revealTarget} onChange={(e) => { setRevealTarget(e.target.value); setDraftRect(null); }}>
                    <option value="group">Grupo inteiro</option>
                    {(cloudData?.players ?? []).filter((player) => player.active).map((player) => <option key={player.id} value={player.id}>{player.playerName} · {player.characterName || "sem personagem"}</option>)}
                  </select>
                </label>
                {draftRect ? (
                  <div className="mt-3 space-y-2">
                    <p className="font-mono text-[10px] text-muted-foreground">x {draftRect.x.toFixed(1)}% · y {draftRect.y.toFixed(1)}% · {draftRect.w.toFixed(1)} × {draftRect.h.toFixed(1)}%</p>
                    <div className="grid grid-cols-2 gap-2"><Button size="sm" variant="outline" onClick={() => setDraftRect(null)}>Refazer</Button><Button size="sm" disabled={savingReveal} onClick={() => void saveDraftReveal()}>{savingReveal ? "Salvando…" : "LIBERAR AGORA"}</Button></div>
                  </div>
                ) : <p className="mt-3 rounded-sm border border-dashed border-route-azul/50 p-2 text-center text-[11px] text-route-azul">CLIQUE + ARRASTE NO MAPA</p>}
              </div>
            )}

            <div
              ref={viewportRef}
              className={`relative select-none overflow-hidden bg-black ${isFullscreen ? "h-full min-h-0 rounded-none" : "min-h-[440px] rounded-sm sm:min-h-[560px]"} ${revealMode ? "cursor-crosshair" : editar ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              {hasImage ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    ref={mapContentRef}
                    className="relative shrink-0 transition-transform duration-75"
                    style={{
                      width: fitSize ? `${fitSize.w}px` : "100%",
                      height: fitSize ? `${fitSize.h}px` : "100%",
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <img
                      src={src}
                      alt={`Planta — ${img.label}`}
                      draggable={false}
                      className="pointer-events-none absolute inset-0 size-full select-none object-fill"
                      onLoad={(e) => setImageNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                      onError={() => { if (!assetUrl) setStaticFailed(true); }}
                    />

                    {manualRegions.map((region) => {
                      const id = regionLocationId(region);
                      const visible = effectiveReveals.get(id) === true;
                      return <div key={region.id ?? id} className={`pointer-events-none absolute z-10 border ${visible ? "border-route-verde-claro/75 bg-route-verde-claro/10" : "border-white/20 bg-black/5"}`} style={{ left: `${Number(region.x)}%`, top: `${Number(region.y)}%`, width: `${Number(region.width)}%`, height: `${Number(region.height)}%` }} />;
                    })}

                    {!revealMode && doAndar.map((h) => {
                      const p = pos(h);
                      if (!p) return null;
                      const ativo = h.locationId && session.currentLocationId === h.locationId;
                      const st = h.locationId ? session.locationStatus[h.locationId] : undefined;
                      const loc = h.locationId ? LOCATIONS.find((l) => l.id === h.locationId) : undefined;
                      const achados = loc ? cluesForLocation(loc.id) : [];
                      const pendentes = achados.filter((c) => !["encontrada", "interpretada", "contingencia"].includes(session.clueStatus[c.id] ?? "")).length;
                      const visitado = st && st !== "nao-visitada";
                      const statusText = ativo ? "grupo aqui" : st ?? "não visitada";
                      return (
                        <button
                          key={h.id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setAberto(h)}
                          title={`${h.name} · ${achados.length} achados · ${pendentes} pendentes · ${statusText}`}
                          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` }}
                          className={`absolute z-20 rounded-sm border-2 transition-colors ${ativo ? "border-primary bg-primary/30" : h.restricted ? "border-destructive/70 bg-destructive/10 hover:bg-destructive/25" : pendentes > 0 ? "border-route-amarelo/55 bg-route-amarelo/5 hover:bg-route-amarelo/15" : visitado ? "border-route-verde-claro/40 bg-route-verde-claro/5" : "border-transparent hover:border-primary hover:bg-primary/15"}`}
                        ><span className="sr-only">{h.name}</span></button>
                      );
                    })}

                    {revealMode && (
                      <div className="absolute inset-0 z-30 touch-none cursor-crosshair" onPointerDown={beginReveal} onPointerMove={moveReveal} onPointerUp={endReveal} onPointerCancel={endReveal}>
                        {draftRect && <div className="pointer-events-none absolute border-2 border-route-azul bg-route-azul/20 shadow-[0_0_24px_rgba(59,130,246,.4)]" style={{ left: `${draftRect.x}%`, top: `${draftRect.y}%`, width: `${draftRect.w}%`, height: `${draftRect.h}%` }} />}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                  <ImageIcon className="size-12 opacity-50" />
                  <div><p className="font-semibold text-foreground">Imagem deste mapa não pôde ser exibida</p><p className="mt-1 max-w-md text-sm">O arquivo estático <code className="font-mono text-xs">{staticSrc}</code> não abriu (ausente ou corrompido). Carregue a planta canônica uma vez no Gerenciador de Imagens: ela fica salva neste navegador e passa a ter prioridade sobre o arquivo estático.</p></div>
                  <Link to="/assets"><Button>Carregar mapa</Button></Link>
                </div>
              )}
            </div>
            {!isFullscreen && <p className="mt-2 text-center text-[11px] text-muted-foreground">Modo normal: arraste a planta para mover · +/- para zoom. Modo “Liberar área”: arraste sobre a planta e confirme a liberação.</p>}
          </div>

          <aside className="max-h-[78vh] space-y-3 overflow-y-auto">
            <section className="dossier rounded-sm p-3">
              <div className="flex items-center justify-between gap-2"><div><p className="stamp text-route-azul">Fog of War</p><p className="text-sm font-semibold">Áreas manuais neste piso</p></div><Button size="sm" variant={revealMode ? "destructive" : "outline"} onClick={toggleRevealMode}><ScanLine className="mr-1 size-3.5" />{revealMode ? "Fechar" : "Desenhar"}</Button></div>
              <label className="mt-3 block text-[11px] text-muted-foreground">Ver/liberar para
                <select className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-1.5 text-xs text-foreground" value={revealTarget} onChange={(e) => setRevealTarget(e.target.value)} disabled={!cloudReady}>
                  <option value="group">Grupo inteiro</option>
                  {(cloudData?.players ?? []).filter((player) => player.active).map((player) => <option key={player.id} value={player.id}>{player.playerName} · {player.characterName || "sem personagem"}</option>)}
                </select>
              </label>
              <div className="mt-3 space-y-2">
                {manualRegions.map((region, index) => {
                  const id = regionLocationId(region);
                  const visible = effectiveReveals.get(id) === true;
                  return <div key={region.id ?? id} className="flex items-center gap-2 rounded-sm border border-border p-2"><div className="min-w-0 flex-1"><b className="text-xs">Área {index + 1}</b><p className="font-mono text-[9px] text-muted-foreground">{Number(region.width).toFixed(1)} × {Number(region.height).toFixed(1)}%</p></div><Button size="sm" variant={visible ? "secondary" : "outline"} disabled={savingReveal} onClick={() => void setRegionReveal(region, !visible)}>{visible ? <EyeOff className="mr-1 size-3.5" /> : <Eye className="mr-1 size-3.5" />}{visible ? "Ocultar" : "Liberar"}</Button></div>;
                })}
                {!manualRegions.length && <p className="rounded-sm border border-dashed border-border p-3 text-xs text-muted-foreground">Nenhuma área manual ainda. Clique em <b>Desenhar</b> e arraste na planta.</p>}
              </div>
              <Button className="mt-3 w-full" size="sm" variant="ghost" disabled={!cloudReady} onClick={() => void refreshCloud()}><Cloud className="mr-1 size-3.5" />Atualizar do Cloud</Button>
            </section>

            <section className="dossier space-y-2 rounded-sm p-3">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-background/95 pb-2">
                <p className="stamp text-primary">Salas / hotspots do mestre</p>
                {editar && <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover todas as coordenadas personalizadas do mapa?")) setCoords({}); }}><RotateCcw className="mr-1 size-3.5" />Reset</Button>}
              </div>
              {doAndar.map((h) => {
                const p = pos(h);
                const loc = LOCATIONS.find((l) => l.id === h.locationId);
                const clues = loc ? cluesForLocation(loc.id) : [];
                const pending = clues.filter((c) => !["encontrada", "interpretada", "contingencia"].includes(session.clueStatus[c.id] ?? "")).length;
                const active = h.locationId === session.currentLocationId;
                const status = h.locationId ? session.locationStatus[h.locationId] ?? "nao-visitada" : "sem local";
                return (
                  <div key={h.id} className={`rounded-sm border p-2 ${active ? "border-primary bg-primary/10" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{h.name}{h.restricted && <span className="stamp ml-2 text-destructive">restrito</span>}</p>
                        <p className="text-[11px] text-muted-foreground">{loc ? `${clues.length} achados · ${pending} pendentes · ${status}` : "sem sala vinculada"}{p ? "" : " · sem posição"}</p>
                      </div>
                      {active && <span className="stamp shrink-0 text-primary">grupo aqui</span>}
                    </div>

                    {!editar && loc && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setAberto(h)}>ABRIR SALA</Button>
                        <Button size="sm" variant={active ? "secondary" : "default"} onClick={() => setLocation(loc.id)}>{active ? "GRUPO AQUI" : "MOVER GRUPO"}</Button>
                      </div>
                    )}

                    {editar && (
                      <div className="mt-2 space-y-2 border-t border-border pt-2">
                        <div className="grid grid-cols-4 gap-1">
                          {(["x", "y", "w", "h"] as const).map((k) => (
                            <label key={`${h.id}-${k}`} className="text-[10px] text-muted-foreground">{k.toUpperCase()}
                              <Input
                                key={`${h.id}-${k}-${p?.[k] ?? "empty"}`}
                                className="mt-0.5 h-7 px-1 text-[11px]"
                                inputMode="decimal"
                                placeholder={k}
                                defaultValue={p ? p[k] : ""}
                                onBlur={(e) => {
                                  if (!e.target.value.trim() && !p) return;
                                  const value = Number(e.target.value);
                                  if (!Number.isFinite(value)) return;
                                  setCoords((c) => ({ ...c, [h.id]: { x: p?.x ?? 0, y: p?.y ?? 0, w: p?.w ?? h.w, h: p?.h ?? h.h, [k]: value } }));
                                }}
                              />
                            </label>
                          ))}
                        </div>
                        <Button size="sm" variant="ghost" className="w-full" onClick={() => setCoords((c) => { const next = { ...c }; delete next[h.id]; return next; })}>Resetar posição desta sala</Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {editar && <Button size="sm" variant="outline" className="w-full" onClick={() => navigator.clipboard.writeText(JSON.stringify(coords, null, 2))}>Copiar hotspots (JSON)</Button>}
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl">{aberto.name}</DialogTitle>
              </DialogHeader>
              {aberto.locationId ? (
                <>
                  <RoomInspector locationId={aberto.locationId} />
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button onClick={() => setLocation(aberto.locationId!)} variant={session.currentLocationId === aberto.locationId ? "secondary" : "default"}>{session.currentLocationId === aberto.locationId ? "GRUPO JÁ ESTÁ AQUI" : "MOVER GRUPO PARA CÁ"}</Button>
                    <Link to="/sessao-v2"><Button variant="outline">IR PARA MODO SESSÃO</Button></Link>
                    <Button variant="ghost" onClick={() => setAberto(null)}>Fechar</Button>
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground">Área informativa sem local canônico vinculado.</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
