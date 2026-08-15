import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cloudConfigured, requireMasterToken, rpc } from "@/lib/cloud";
import type { MasterDashboardData } from "@/lib/playerCloudTypes";
import { regionLocationId } from "@/lib/playerCloudTypes";
import { MAP_IMAGES, type FloorId } from "@/data/map";
import { ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";

export function MapAreaManager() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MasterDashboardData | null>(null);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const token = requireMasterToken();
    if (!token || !cloudConfigured()) return;
    try {
      const result = await rpc<MasterDashboardData>("master_dashboard", { p_token: token });
      if (!result.ok) throw new Error(result.error || "Falha ao carregar áreas do mapa.");
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar áreas do mapa.");
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/mapa" || !requireMasterToken()) return;
    void refresh();
  }, [pathname, refresh]);

  const areas = useMemo(() => (data?.mapRegions ?? [])
    .filter((region) => regionLocationId(region).startsWith("manual-"))
    .sort((a, b) => String(a.floor).localeCompare(String(b.floor))), [data?.mapRegions]);

  if (pathname !== "/mapa" || !requireMasterToken()) return null;

  const remove = async (floor: string, locationId: string) => {
    if (!confirm("Excluir esta área do mapa? Isso também remove a liberação dos players.")) return;
    const token = requireMasterToken();
    if (!token) return;
    setBusyId(locationId);
    setError("");
    setNotice("");
    try {
      const result = await rpc<{ ok?: boolean; error?: string }>("master_delete_map_region", {
        p_token: token,
        p_floor: floor,
        p_location_id: locationId,
      });
      if (result?.ok === false) throw new Error(result.error || "Falha ao excluir a área.");
      setNotice("Área excluída do mapa e removida dos players.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir a área.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(380px,calc(100vw-2rem))]">
      {open && (
        <div className="mb-2 max-h-[55vh] overflow-y-auto rounded-sm border border-border bg-background/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="stamp text-destructive">Gerenciar fog</p>
              <p className="text-sm font-semibold">Áreas liberadas</p>
              <p className="text-[11px] text-muted-foreground">Excluir remove a região e todas as liberações dela.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void refresh()} title="Atualizar">
              <RefreshCw className="size-4" />
            </Button>
          </div>

          {error && <p className="mb-2 rounded-sm border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
          {notice && <p className="mb-2 rounded-sm border border-route-verde/40 bg-route-verde/10 p-2 text-xs text-route-verde-claro">{notice}</p>}

          <div className="space-y-2">
            {areas.map((region, index) => {
              const id = regionLocationId(region);
              const floor = region.floor as FloorId;
              const floorLabel = MAP_IMAGES[floor]?.label ?? region.floor;
              return (
                <div key={region.id ?? id} className="flex items-center gap-2 rounded-sm border border-border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">Área {index + 1} · {floorLabel}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">{Number(region.width).toFixed(1)} × {Number(region.height).toFixed(1)}%</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === id}
                    onClick={() => void remove(region.floor, id)}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    {busyId === id ? "Excluindo…" : "Excluir"}
                  </Button>
                </div>
              );
            })}
            {!areas.length && <p className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Nenhuma área manual salva.</p>}
          </div>
        </div>
      )}

      <Button className="ml-auto flex shadow-2xl" variant={open ? "secondary" : "destructive"} onClick={() => setOpen((value) => !value)}>
        <Trash2 className="mr-2 size-4" />
        Gerenciar áreas
        {open ? <ChevronDown className="ml-2 size-4" /> : <ChevronUp className="ml-2 size-4" />}
      </Button>
    </div>
  );
}
