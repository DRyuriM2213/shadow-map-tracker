import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HOTSPOTS, MAP_IMAGES, type FloorId, type MapHotspot } from "@/data/map";
import { LOCATIONS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";
import { RoomInspector, cluesForLocation } from "@/components/RoomInspector";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa Interativo — Berço Vazio" },
      { name: "description", content: "Plantas da Universidade Valença com áreas clicáveis ligadas às salas da campanha." },
      { property: "og:title", content: "Mapa Interativo — Berço Vazio" },
      { property: "og:description", content: "Clique em uma área da planta para abrir o inspector da sala." },
    ],
  }),
  component: MapaPage,
});

function MapaPage() {
  const session = useCampaign((s) => s.session);
  const setLocation = useCampaign((s) => s.setLocation);
  const logAction = useCampaign((s) => s.logAction);

  const [floor, setFloor] = useState<FloorId>("primeiro");
  const [numerado, setNumerado] = useState(false);
  const [aberto, setAberto] = useState<MapHotspot | null>(null);
  const [editar, setEditar] = useState(false);
  const [coords, setCoords] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});

  const doAndar = useMemo(() => HOTSPOTS.filter((h) => h.floor === floor), [floor]);
  const img = MAP_IMAGES[floor];
  const src = numerado ? img.numerado : img.limpo;
  const pos = (h: MapHotspot) => coords[h.id] ?? (h.x !== null && h.y !== null ? { x: h.x, y: h.y!, w: h.w, h: h.h } : null);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-wrap items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Mapa Interativo</h1>
            <p className="text-sm text-muted-foreground">Clique em uma área da planta para abrir a sala. Áreas sem posição continuam acessíveis pela lista ao lado.</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 text-xs">
            {(Object.keys(MAP_IMAGES) as FloorId[]).map((f) => (
              <Button key={f} size="sm" variant={floor === f ? "default" : "outline"} onClick={() => setFloor(f)}>{MAP_IMAGES[f].label}</Button>
            ))}
            <Button size="sm" variant={numerado ? "default" : "outline"} onClick={() => setNumerado((v) => !v)}>{numerado ? "Versão numerada" : "Versão limpa"}</Button>
            <Button size="sm" variant={editar ? "destructive" : "ghost"} onClick={() => setEditar((v) => !v)}>{editar ? "Sair da edição" : "Editar áreas"}</Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="dossier relative overflow-hidden rounded-sm p-2">
            <div className="relative">
              <img src={src} alt={`Planta — ${img.label}`} className="w-full rounded-sm" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.15"; }} />
              {doAndar.map((h) => {
                const p = pos(h);
                if (!p) return null;
                const ativo = h.locationId && session.currentLocationId === h.locationId;
                return (
                  <button
                    key={h.id}
                    onClick={() => setAberto(h)}
                    title={h.name}
                    style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` }}
                    className={`absolute rounded-sm border-2 transition-colors ${ativo ? "border-primary bg-primary/30" : h.restricted ? "border-destructive/60 bg-destructive/10 hover:bg-destructive/25" : "border-transparent bg-primary/0 hover:border-primary hover:bg-primary/20"}`}
                  ><span className="sr-only">{h.name}</span></button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">As salas continuam funcionais pela lista mesmo enquanto as imagens da planta ainda não estão no repositório.</p>
          </div>

          <aside className="dossier space-y-2 rounded-sm p-3">
            <p className="stamp text-primary">Áreas deste andar</p>
            {doAndar.map((h) => {
              const p = pos(h);
              const loc = LOCATIONS.find((l) => l.id === h.locationId);
              return (
                <div key={h.id} className="rounded-sm border border-border p-2">
                  <button className="w-full text-left" onClick={() => setAberto(h)}>
                    <p className="text-sm font-semibold">{h.name}{h.restricted && <span className="stamp ml-2 text-destructive">restrito</span>}</p>
                    <p className="text-[11px] text-muted-foreground">{loc ? `${cluesForLocation(loc.id).length} achados` : "sem sala vinculada"}{p ? "" : " · sem posição no mapa"}</p>
                  </button>
                  {editar && (
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {(["x", "y", "w", "h"] as const).map((k) => (
                        <Input
                          key={k}
                          className="h-7 px-1 text-[11px]"
                          placeholder={k}
                          defaultValue={p ? p[k] : ""}
                          onBlur={(e) => setCoords((c) => ({ ...c, [h.id]: { x: p?.x ?? 0, y: p?.y ?? 0, w: p?.w ?? h.w, h: p?.h ?? h.h, [k]: Number(e.target.value) || 0 } }))}
                        />
                      ))}
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
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          {aberto && (
            <>
              <DialogHeader><DialogTitle className="font-display text-3xl">{aberto.name}</DialogTitle></DialogHeader>
              {aberto.locationId ? (
                <>
                  <RoomInspector locationId={aberto.locationId} />
                  <Button className="mt-2" onClick={() => { setLocation(aberto.locationId!); setAberto(null); }}>Levar o grupo para cá</Button>
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Esta área ainda não está vinculada a uma sala da campanha. Você pode registrar a movimentação do grupo mesmo assim.</p>
                  <Button onClick={() => { logAction("local", `Grupo foi para: ${aberto.name}`); setAberto(null); }}>Registrar deslocamento</Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}