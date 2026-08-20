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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const token = requireMasterToken();
    if (!token || !cloudConfigured()) return null;
    setRefreshing(true);
    try {
      const result = await rpc<MasterDashboardData>("master_dashboard", { p_token: token });
      if (!result.ok) throw new Error(result.error || "Falha ao carregar áreas do mapa.");
      setData(result);
      setError("");
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar áreas do mapa.");
      return null;
    } finally {
      setRefreshing(false);
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
    if (!confirm("Excluir esta área permanentemente? Ela também será removida do mapa dos players.")) return;
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

      const dashboard = await rpc<MasterDashboardData>("master_dashboard", { p_token: token });
      if (!dashboard.ok) throw new Error(dashboard.error || "Não foi possível confirmar a exclusão.");
      const stillExists = (dashboard.mapRegions ?? []).some((region) => region.floor === floor && regionLocationId(region) === locationId);
      if (stillExists) throw new Error("O Cloud respondeu, mas a área continuou salva. Tente novamente.");

      setData(dashboard);
      setNotice("Área excluída do Cloud e das liberações dos players.");
      window.setTimeout(() => window.location.reload(), 450);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir a área.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80] w-[min(390px,calc(100vw-2rem))]">
      {open && (
        <div className="mb-2 max-h-[62vh] overflow-y-auto rounded-md border border-border bg-background/97 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="stamp text-primary">GERENCIAR ÁREAS</p>
              <p className="text-sm font-semibold">Fog of War salvo no Cloud</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Exclua somente áreas que não devem mais existir. A ação também remove as liberações dos players.</p>
            </div>
            <Button size="sm" variant="ghost" disabled={refreshing || !!busyId} onClick={() => void refresh()} title="Atualizar lista">
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
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
                <div key={region.id ?? id} className="flex items-center gap-2 rounded-sm border border-border bg-card/45 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">Área {index + 1} · {floorLabel}</p>
                    <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">x {Number(region.x).toFixed(1)} · y {Number(region.y).toFixed(1)} · {Number(region.width).toFixed(1)} × {Number(region.height).toFixed(1)}%</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={!!busyId}
                    onClick={() => void remove(region.floor, id)}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    {busyId === id ? "Excluindo…" : "Excluir"}
                  </Button>
                </div>
              );
            })}
            {!areas.length && <p className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Nenhuma área manual salva no Cloud.</p>}
          </div>
        </div>
      )}

      <Button
        className="ml-auto flex border-border/80 bg-background/95 shadow-xl backdrop-blur hover:bg-accent"
        variant="outline"
        size="sm"
        onClick={() => setOpen((value) => !value)}
      >
        <Trash2 className="mr-1.5 size-3.5 text-destructive" />
        Áreas do mapa
        <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[10px]">{areas.length}</span>
        {open ? <ChevronUp className="ml-1.5 size-3.5" /> : <ChevronDown className="ml-1.5 size-3.5" />}
      </Button>
    </div>
  );
}
