import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HOTSPOTS, MAP_IMAGES, type FloorId, type MapHotspot } from "@/data/map";
import { LOCATIONS } from "@/data/campaignFull";
import { useAsset } from "@/lib/useAsset";
import { useCampaign } from "@/store/campaign";
import { RoomInspector, cluesForLocation } from "@/components/RoomInspector";
import { Crosshair, Expand, Image as ImageIcon, Minus, Plus, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa Interativo — Berço Vazio" },
      { name: "description", content: "Plantas da Universidade Valença com áreas clicáveis ligadas às salas da campanha." },
    ],
  }),
  component: MapaPage,
});

type Coords = Record<string, { x: number; y: number; w: number; h: number }>;
const COORDS_KEY = "berco-vazio-map-hotspots-v1";

function loadCoords(): Coords {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(COORDS_KEY) ?? "{}") as Coords;
  } catch {
    return {};
  }
}

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
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const doAndar = useMemo(() => HOTSPOTS.filter((h) => h.floor === floor), [floor]);
  const img = MAP_IMAGES[floor];
  const staticSrc = numerado ? img.numerado : img.limpo;
  const assetKey = `map:${floor}:${numerado ? "numerado" : "limpo"}`;
  const assetUrl = useAsset(assetKey);
  const src = assetUrl ?? staticSrc;
  const hasImage = !!assetUrl || !staticFailed;

  useEffect(() => setStaticFailed(false), [staticSrc]);
  useEffect(() => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
  }, [coords]);

  const pos = (h: MapHotspot) => coords[h.id] ?? (h.x !== null && h.y !== null ? { x: h.x, y: h.y!, w: h.w, h: h.h } : null);
  const resetView = () => { setScale(1); setPan({ x: 0, y: 0 }); };
  const zoom = (delta: number) => setScale((v) => Math.min(4, Math.max(0.75, Number((v + delta).toFixed(2)))));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (editar) return;
    drag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || editar) return;
    setPan({ x: drag.current.panX + e.clientX - drag.current.startX, y: drag.current.panY + e.clientY - drag.current.startY });
  };
  const stopDrag = () => { drag.current = null; };

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stageRef.current.requestFullscreen();
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="dossier rounded-sm p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="stamp text-primary">Plantas da Universidade Valença</p>
              <h1 className="text-3xl font-semibold">Mapa Interativo</h1>
              <p className="text-sm text-muted-foreground">Clique numa sala para abrir o Inspector. Você pode mover o grupo por aqui sem avançar nenhuma cena narrativa.</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {(Object.keys(MAP_IMAGES) as FloorId[]).map((f) => <Button key={f} size="sm" variant={floor === f ? "default" : "outline"} onClick={() => { setFloor(f); resetView(); }}>{MAP_IMAGES[f].label}</Button>)}
              <Button size="sm" variant={numerado ? "default" : "outline"} onClick={() => setNumerado((v) => !v)}>{numerado ? "Numerado" : "Limpo"}</Button>
              <Link to="/sessao-v2"><Button size="sm" variant="secondary">Modo Sessão</Button></Link>
              <Link to="/assets"><Button size="sm" variant="outline"><ImageIcon className="mr-1 size-4" />Imagens</Button></Link>
              <Button size="sm" variant={editar ? "destructive" : "ghost"} onClick={() => setEditar((v) => !v)}>{editar ? "Sair da edição" : "Editar áreas"}</Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div ref={stageRef} className="dossier relative overflow-hidden rounded-sm bg-background p-2">
            <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-1 rounded-sm border border-border bg-background/90 p-1 backdrop-blur">
              <Button size="sm" variant="ghost" title="Diminuir zoom" onClick={() => zoom(-0.25)}><Minus className="size-4" /></Button>
              <span className="min-w-14 self-center text-center font-mono text-xs">{Math.round(scale * 100)}%</span>
              <Button size="sm" variant="ghost" title="Aumentar zoom" onClick={() => zoom(0.25)}><Plus className="size-4" /></Button>
              <Button size="sm" variant="ghost" title="Centralizar" onClick={resetView}><Crosshair className="size-4" /></Button>
              <Button size="sm" variant="ghost" title="Tela cheia" onClick={() => void toggleFullscreen()}><Expand className="size-4" /></Button>
            </div>

            <div
              className={`relative min-h-[440px] select-none overflow-hidden rounded-sm sm:min-h-[560px] ${editar ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              {hasImage ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full transition-transform duration-75" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "center center" }}>
                    <img
                      src={src}
                      alt={`Planta — ${img.label}`}
                      draggable={false}
                      className="mx-auto max-h-[78vh] w-full object-contain"
                      onError={() => { if (!assetUrl) setStaticFailed(true); }}
                    />
                    {doAndar.map((h) => {
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
                          className={`absolute rounded-sm border-2 transition-colors ${ativo ? "border-primary bg-primary/30" : h.restricted ? "border-destructive/70 bg-destructive/10 hover:bg-destructive/25" : pendentes > 0 ? "border-route-amarelo/55 bg-route-amarelo/5 hover:bg-route-amarelo/15" : visitado ? "border-route-verde-claro/40 bg-route-verde-claro/5" : "border-transparent hover:border-primary hover:bg-primary/15"}`}
                        ><span className="sr-only">{h.name}</span></button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                  <ImageIcon className="size-12 opacity-50" />
                  <div><p className="font-semibold text-foreground">Imagem deste mapa ainda não carregada</p><p className="mt-1 max-w-md text-sm">Carregue a planta uma vez no Gerenciador de Imagens. Ela ficará salva neste navegador e não precisa de novo deploy.</p></div>
                  <Link to="/assets"><Button>Carregar mapa</Button></Link>
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Arraste a planta para mover · use +/- para zoom · em “Editar áreas”, ajuste x/y/w/h pela lista lateral.</p>
          </div>

          <aside className="dossier max-h-[78vh] space-y-2 overflow-y-auto rounded-sm p-3">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-background/95 pb-2">
              <p className="stamp text-primary">Áreas deste andar</p>
              {editar && <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover todas as coordenadas personalizadas do mapa?")) setCoords({}); }}><RotateCcw className="mr-1 size-3.5" />Reset geral</Button>}
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
                      <Button size="sm" variant="ghost" className="w-full" onClick={() => setCoords((c) => { const next = { ...c }; delete next[h.id]; return next; })}>Resetar posição desta área</Button>
                    </div>
                  )}
                </div>
              );
            })}
            {editar && <Button size="sm" variant="outline" className="w-full" onClick={() => navigator.clipboard.writeText(JSON.stringify(coords, null, 2))}>Copiar coordenadas (JSON)</Button>}
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
                    <Button
                      onClick={() => setLocation(aberto.locationId!)}
                      variant={session.currentLocationId === aberto.locationId ? "secondary" : "default"}
                    >
                      {session.currentLocationId === aberto.locationId ? "GRUPO JÁ ESTÁ AQUI" : "MOVER GRUPO PARA CÁ"}
                    </Button>
                    <Link to="/sessao-v2"><Button variant="outline">IR PARA MODO SESSÃO</Button></Link>
                    <Button variant="ghost" onClick={() => setAberto(null)}>Fechar</Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Área informativa sem local canônico vinculado.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
