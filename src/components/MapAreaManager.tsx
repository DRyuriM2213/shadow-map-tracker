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
  const [open, setOpen] = useState(true);
  const [data, setData] = useState<MasterDashboardData | null>(null);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const token = requireMasterToken();
    if (!token || !cloudConfigured()) return null;
    try {
      const result = await rpc<MasterDashboardData>("master_dashboard", { p_token: token });
      if (!result.ok) throw new Error(result.error || "Falha ao carregar áreas do mapa.");
      setData(result);
      setError("");
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar áreas do mapa.");
      return null;
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/mapa" || !requireMasterToken()) return;
    setOpen(true);
    void refresh();
  }, [pathname, refresh]);

  const areas = useMemo(() => (data?.mapRegions ?? [])
    .filter((region) => regionLocationId(region).startsWith("manual-"))
    .sort((a, b) => String(a.floor).localeCompare(String(b.floor))), [data?.mapRegions]);

  if (pathname !== "/mapa" || !requireMasterToken()) return null;

  const remove = async (floor: string, locationId: string) => {
    if (!confirm("EXCLUIR esta área de forma permanente? Ela também será removida do mapa de todos os players.")) return;
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

      // Não confia apenas no retorno do RPC: confirma no dashboard que saiu de verdade.
      const dashboard = await rpc<MasterDashboardData>("master_dashboard", { p_token: token });
      if (!dashboard.ok) throw new Error(dashboard.error || "Não foi possível confirmar a exclusão.");
      const stillExists = (dashboard.mapRegions ?? []).some((region) => region.floor === floor && regionLocationId(region) === locationId);
      if (stillExists) throw new Error("O Cloud respondeu, mas a área continuou salva. Tente novamente.");

      setData(dashboard);
      setNotice("Área EXCLUÍDA de verdade. Ela também foi removida das liberações dos players.");
      window.setTimeout(() => window.location.reload(), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir a área.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="fixed right-4 top-24 z-[9999] w-[min(420px,calc(100vw-2rem))]">
      {open && (
        <div className="mb-2 max-h-[70vh] overflow-y-auto rounded-sm border-2 border-destructive/70 bg-background/98 p-3 shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="stamp text-destructive">EXCLUIR ÁREAS DO MAPA</p>
              <p className="text-sm font-semibold">Áreas desenhadas pelo mestre</p>
              <p className="text-[11px] text-muted-foreground">O botão vermelho apaga a área do Cloud e remove a liberação dos players.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void refresh()} title="Atualizar lista">
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
                <div key={region.id ?? id} className="flex items-center gap-2 rounded-sm border border-border bg-card/70 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">Área {index + 1} · {floorLabel}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">x {Number(region.x).toFixed(1)} · y {Number(region.y).toFixed(1)} · {Number(region.width).toFixed(1)} × {Number(region.height).toFixed(1)}%</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === id}
                    onClick={() => void remove(region.floor, id)}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    {busyId === id ? "Excluindo…" : "EXCLUIR"}
                  </Button>
                </div>
              );
            })}
            {!areas.length && <p className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Nenhuma área manual salva.</p>}
          </div>
        </div>
      )}

      <Button className="ml-auto flex shadow-2xl" variant="destructive" onClick={() => setOpen((value) => !value)}>
        <Trash2 className="mr-2 size-4" />
        {open ? "Fechar exclusão" : "EXCLUIR ÁREAS"}
        {open ? <ChevronUp className="ml-2 size-4" /> : <ChevronDown className="ml-2 size-4" />}
      </Button>
    </div>
  );
}
