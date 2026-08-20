import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cloudConfigured, requireMasterToken, rpc } from "@/lib/cloud";
import type { MasterDashboardData } from "@/lib/playerCloudTypes";
import { Image as ImageIcon, Radio, RefreshCw, Send, Square, Trash2, X } from "lucide-react";

type MediaHistoryItem = {
  id: string;
  targetPlayerId?: string | null;
  targetName?: string | null;
  characterName?: string | null;
  title: string;
  caption: string;
  active: boolean;
  createdAt: string;
};

type MediaListResponse = { ok: boolean; error?: string; media?: MediaHistoryItem[] };

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxW = 1440;
  const maxH = 1080;
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.86, 0.76, 0.66, 0.56]) {
    const data = canvas.toDataURL("image/jpeg", quality);
    if (data.length <= 2_000_000) return data;
  }
  throw new Error("Imagem grande demais mesmo após compressão. Tente uma imagem menor.");
}

export function LiveMediaCaster() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const visibleRoute = pathname === "/sessao-v2" || pathname === "/players" || pathname === "/mapa";
  const token = requireMasterToken();
  const [open, setOpen] = useState(false);
  const [dashboard, setDashboard] = useState<MasterDashboardData | null>(null);
  const [target, setTarget] = useState("group");
  const [title, setTitle] = useState("Imagem do mestre");
  const [caption, setCaption] = useState("");
  const [imageData, setImageData] = useState("");
  const [history, setHistory] = useState<MediaHistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const current = requireMasterToken();
    if (!current || !cloudConfigured()) return;
    try {
      const [dash, media] = await Promise.all([
        rpc<MasterDashboardData>("master_dashboard", { p_token: current }),
        rpc<MediaListResponse>("master_list_media", { p_token: current }),
      ]);
      if (!dash.ok) throw new Error(dash.error || "Falha ao carregar players.");
      if (!media.ok) throw new Error(media.error || "Falha ao carregar transmissões.");
      setDashboard(dash);
      setHistory(media.media ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao sincronizar.");
    }
  }, []);

  useEffect(() => {
    if (!visibleRoute || !token) return;
    void refresh();
  }, [visibleRoute, token, refresh]);

  if (!visibleRoute || !token) return null;

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      setImageData(await compressImage(file));
      if (title === "Imagem do mestre") setTitle(file.name.replace(/\.[^.]+$/, "") || "Imagem do mestre");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao preparar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const current = requireMasterToken();
    if (!current || !imageData) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await rpc<{ ok: boolean; error?: string; count?: number }>("master_send_media", {
        p_token: current,
        p_targets: target === "group" ? null : [target],
        p_title: title.trim() || "Imagem do mestre",
        p_caption: caption.trim(),
        p_image_data: imageData,
      });
      if (!result.ok) throw new Error(result.error || "Falha ao transmitir imagem.");
      const targetLabel = target === "group"
        ? "todos os players"
        : dashboard?.players.find((p) => p.id === target)?.playerName ?? "player selecionado";
      setNotice(`Imagem enviada para ${targetLabel}. Ela aparece automaticamente no terminal.`);
      setImageData("");
      setCaption("");
      setTitle("Imagem do mestre");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao transmitir imagem.");
    } finally {
      setBusy(false);
    }
  };

  const clearOne = async (id: string) => {
    const current = requireMasterToken();
    if (!current) return;
    await rpc("master_clear_media", { p_token: current, p_media_id: id });
    await refresh();
  };

  const clearAll = async () => {
    const current = requireMasterToken();
    if (!current || !confirm("Encerrar todas as imagens atualmente exibidas aos players?")) return;
    await rpc("master_clear_all_media", { p_token: current });
    setNotice("Todas as transmissões foram encerradas.");
    await refresh();
  };

  return (
    <div className="fixed bottom-4 left-4 z-[90] w-[min(430px,calc(100vw-2rem))]">
      {open && (
        <div className="mb-2 max-h-[75vh] overflow-y-auto rounded-sm border border-primary/40 bg-background/98 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-sm border border-primary/40 bg-primary/10"><Radio className="size-4 text-primary" /></div>
            <div className="min-w-0 flex-1">
              <p className="stamp text-primary">Broadcast visual</p>
              <h3 className="font-semibold">Mostrar uma imagem na tela do player</h3>
              <p className="mt-1 text-xs text-muted-foreground">Escolha a foto e o destino. O terminal verifica novas transmissões automaticamente.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}><X className="size-4" /></Button>
          </div>

          <label className="mt-4 block text-xs text-muted-foreground">Destino
            <select className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-2 text-sm text-foreground" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="group">Grupo inteiro</option>
              {(dashboard?.players ?? []).filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.playerName} · {p.characterName || "sem personagem"}</option>)}
            </select>
          </label>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da imagem" />
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Legenda opcional" />
          </div>

          <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 flex min-h-36 w-full items-center justify-center overflow-hidden rounded-sm border border-dashed border-primary/50 bg-black/20 p-2 text-center hover:border-primary">
            {imageData ? <img src={imageData} alt="Prévia" className="max-h-64 max-w-full object-contain" /> : <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><ImageIcon className="size-8" />Clique para escolher uma foto</span>}
          </button>
          <input ref={inputRef} hidden type="file" accept="image/*" onChange={onFile} />

          <div className="mt-3 flex gap-2">
            <Button className="flex-1" disabled={!imageData || busy} onClick={() => void send()}><Send className="mr-2 size-4" />{busy ? "Enviando…" : "EXIBIR AGORA"}</Button>
            {imageData && <Button variant="outline" onClick={() => setImageData("")}>Limpar</Button>}
          </div>
          {error && <p className="mt-2 rounded-sm border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
          {notice && <p className="mt-2 rounded-sm border border-route-verde/40 bg-route-verde/10 p-2 text-xs text-route-verde-claro">{notice}</p>}

          <div className="mt-5 border-t border-border pt-3">
            <div className="flex items-center gap-2"><p className="stamp text-muted-foreground">Transmissões recentes</p><Button size="sm" variant="ghost" className="ml-auto" onClick={() => void refresh()}><RefreshCw className="size-3.5" /></Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => void clearAll()}><Trash2 className="mr-1 size-3.5" />Encerrar todas</Button></div>
            <div className="mt-2 space-y-1.5">
              {history.slice(0, 8).map((item) => <div key={item.id} className="flex items-center gap-2 rounded-sm border border-border p-2 text-xs"><div className="min-w-0 flex-1"><b className="block truncate">{item.title}</b><span className="text-muted-foreground">{item.targetPlayerId ? `${item.targetName ?? "Player"}${item.characterName ? ` · ${item.characterName}` : ""}` : "Grupo inteiro"} · {item.active ? "ATIVA" : "encerrada"}</span></div>{item.active && <Button size="sm" variant="outline" onClick={() => void clearOne(item.id)}><Square className="mr-1 size-3" />Encerrar</Button>}</div>)}
              {!history.length && <p className="text-xs text-muted-foreground">Nenhuma imagem transmitida ainda.</p>}
            </div>
          </div>
        </div>
      )}
      <Button className="shadow-2xl" variant={open ? "secondary" : "default"} onClick={() => setOpen((v) => !v)}><Radio className="mr-2 size-4" />{open ? "Fechar broadcast" : "Transmitir imagem"}</Button>
    </div>
  );
}
