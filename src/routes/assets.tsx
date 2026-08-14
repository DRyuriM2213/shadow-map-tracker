import { createFileRoute } from "@tanstack/react-router";
import { ChangeEvent, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NPCS } from "@/data/npcs";
import { MAP_ASSET_SLOTS, deleteAsset, putAsset } from "@/lib/assets";
import { useAsset } from "@/lib/useAsset";
import { useCampaign } from "@/store/campaign";
import { Download, Image as ImageIcon, RotateCcw, Save, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/assets")({ component: AssetsPage });

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AssetsPage() {
  const session = useCampaign((s) => s.session);
  const checkpoints = useCampaign((s) => s.checkpoints);
  const createCheckpoint = useCampaign((s) => s.createCheckpoint);
  const restoreCheckpoint = useCampaign((s) => s.restoreCheckpoint);
  const [importStatus, setImportStatus] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    downloadJson(`berco-vazio-backup-${new Date().toISOString().slice(0, 10)}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      session,
      checkpoints,
    });
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as { session?: typeof session; checkpoints?: typeof checkpoints };
      if (!data.session || typeof data.session.time !== "string" || !data.session.currentSceneId) {
        throw new Error("Arquivo não parece ser um backup válido do Berço Vazio.");
      }
      if (!confirm("Importar este backup e substituir o estado atual da sessão?")) return;
      useCampaign.setState((state) => ({
        ...state,
        session: data.session!,
        checkpoints: Array.isArray(data.checkpoints) ? data.checkpoints : state.checkpoints,
        past: [...state.past, state.session].slice(-50),
      }));
      setImportStatus("Backup importado com sucesso.");
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Falha ao importar backup.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="dossier rounded-sm p-5">
          <p className="stamp text-primary">Configuração local do mestre</p>
          <h1 className="text-3xl font-semibold">Imagens, mapas e backup</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            As imagens ficam salvas apenas neste navegador via IndexedDB. Isso permite colocar os mapas e modelos dos NPCs sem novo deploy e sem limite de tamanho do localStorage.
          </p>
        </header>

        <section className="dossier rounded-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="stamp text-primary">Mapas</p>
              <h2 className="text-xl font-semibold">Quatro imagens canônicas</h2>
            </div>
            <p className="text-xs text-muted-foreground">Depois do upload, a aba Mapa usa estas imagens automaticamente.</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {MAP_ASSET_SLOTS.map((slot) => (
              <AssetCard key={slot.key} assetKey={slot.key} label={slot.label} />
            ))}
          </div>
        </section>

        <section className="dossier rounded-sm p-5">
          <div>
            <p className="stamp text-primary">NPCs modelados</p>
            <h2 className="text-xl font-semibold">Retratos / modelos dos 16 NPCs oficiais</h2>
            <p className="text-xs text-muted-foreground">Nenhum nome administrativo extra aparece aqui.</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {NPCS.map((npc) => (
              <AssetCard key={npc.id} assetKey={`npc:${npc.id}`} label={npc.name} compact />
            ))}
          </div>
        </section>

        <section className="dossier rounded-sm p-5">
          <p className="stamp text-primary">Segurança da sessão</p>
          <h2 className="text-xl font-semibold">Backup e snapshots</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={exportBackup}><Download className="mr-2 size-4" />Exportar backup JSON</Button>
            <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 size-4" />Importar backup</Button>
            <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={importBackup} />
            <Button variant="secondary" onClick={() => createCheckpoint(`Snapshot ${session.day} ${session.time}`)}><Save className="mr-2 size-4" />Criar snapshot agora</Button>
          </div>
          {importStatus && <p className="mt-2 text-sm text-muted-foreground">{importStatus}</p>}

          <div className="mt-5 space-y-2">
            <p className="stamp text-muted-foreground">Snapshots disponíveis</p>
            {checkpoints.length === 0 && <p className="text-sm text-muted-foreground">Nenhum snapshot criado.</p>}
            {[...checkpoints].reverse().map((cp) => (
              <div key={cp.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-border p-3">
                <div className="min-w-0 flex-1">
                  <b>{cp.label}</b>
                  <p className="text-xs text-muted-foreground">DIA {cp.state.day} · {cp.state.time} · {cp.state.log.length} registros</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  if (confirm(`Restaurar o snapshot “${cp.label}”?`)) restoreCheckpoint(cp.id);
                }}><RotateCcw className="mr-1 size-3.5" />Restaurar</Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function AssetCard({ assetKey, label, compact = false }: { assetKey: string; label: string; compact?: boolean }) {
  const url = useAsset(assetKey);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await putAsset(assetKey, file);
    } catch {
      setError("Não foi possível salvar a imagem neste navegador.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card/30 p-3">
      <div className={`overflow-hidden rounded-sm border border-border bg-secondary/30 ${compact ? "aspect-[4/3]" : "aspect-video"}`}>
        {url ? (
          <img src={url} alt={label} className="size-full object-contain" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
            <ImageIcon className="size-7 opacity-60" />
            <span className="text-xs">Imagem ainda não carregada</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{label}</p>
          <p className="text-[11px] text-muted-foreground">{url ? "salvo neste navegador" : "sem asset local"}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1 size-3.5" />{url ? "Substituir" : "Carregar"}
        </Button>
        {url && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void deleteAsset(assetKey)}>
            <Trash2 className="mr-1 size-3.5" />Remover
          </Button>
        )}
        <input ref={inputRef} hidden type="file" accept="image/*" onChange={onFile} />
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
