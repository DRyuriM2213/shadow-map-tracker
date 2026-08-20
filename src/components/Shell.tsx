import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useCampaign } from "@/store/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LOCATIONS, SCENES } from "@/data/campaignFull";
import { FlaskConical, Lock, Save, Users } from "lucide-react";
import { useClockEngine, useSessionPace, useTimelineStatus, paceLabel, paceTone } from "@/lib/clock";
import { ClockControls, EventAlert } from "@/components/ClockBar";
import { CommandPalette } from "@/components/CommandPalette";
import { cloudConfigured, getCloudSession, loginCloud, logoutCloud, requireMasterToken, rpc } from "@/lib/cloud";

const NAV = [
  { to: "/", label: "Painel" },
  { to: "/sessao-v2", label: "Sessão ao vivo" },
  { to: "/players", label: "Players" },
  { to: "/mapa", label: "Mapa" },
  { to: "/timeline", label: "Timeline" },
  { to: "/locais", label: "Locais e salas" },
  { to: "/pistas-v2", label: "Pistas" },
  { to: "/npcs", label: "NPCs" },
  { to: "/personagens", label: "Personagens" },
  { to: "/consequencias", label: "Consequências" },
  { to: "/diagrama", label: "Diagrama" },
  { to: "/resumo", label: "Resumo" },
  { to: "/assets", label: "Imagens / Backup" },
  { to: "/editar", label: "Editar campanha" },
] as const;

function LoginScreen() {
  const pin = useCampaign((s) => s.pin);
  const login = useCampaign((s) => s.login);
  const logout = useCampaign((s) => s.logout);
  const setPin = useCampaign((s) => s.setPin);
  const [code, setCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [editing, setEditing] = useState(false);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const expected = pin || "333";

  const submit = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setErro("");
    let cloudError = "";
    if (cloudConfigured()) {
      try {
        const cloud = await loginCloud(code.trim());
        if (cloud?.role === "PLAYER") {
          logout();
          window.location.assign("/player");
          return;
        }
        if (cloud?.role === "MASTER") {
          if (!pin) setPin("333");
          login();
          setBusy(false);
          return;
        }
      } catch (error) {
        cloudError = error instanceof Error ? error.message : "Cloud indisponível";
      }
    }

    // Fallback deliberado: o painel do mestre nunca fica inutilizável se o Cloud cair.
    if (code === expected) {
      if (!pin) setPin("333");
      login();
      setBusy(false);
      return;
    }
    setErro(cloudError ? `PIN não reconhecido. Cloud: ${cloudError}` : "PIN não reconhecido.");
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="dossier w-full max-w-md rounded-sm p-6 sm:p-8">
        <p className="stamp text-primary">Terminal de acesso</p>
        <h1 className="mt-3 text-3xl font-semibold">OPERAÇÃO BERÇO VAZIO</h1>
        <p className="mt-1 text-sm text-muted-foreground">O mesmo terminal reconhece mestre e perfis de jogador.</p>

        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN de acesso</Label>
            <Input id="pin" autoFocus inputMode="numeric" autoComplete="off" value={code} onChange={(e) => { setCode(e.target.value); setErro(""); }} placeholder="••••••" />
            {!pin && <p className="text-xs text-muted-foreground">PIN inicial do mestre: <b>333</b>. PINs de jogadores são criados pelo mestre.</p>}
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="w-full" disabled={busy}><Lock className="mr-2 size-4" />{busy ? "Verificando…" : "Entrar"}</Button>
        </form>

        <div className="mt-5 border-t border-border pt-4">
          <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setEditing((v) => !v)}>{editing ? "Cancelar troca de PIN local" : "Trocar PIN local de emergência do mestre"}</button>
          {editing && <div className="mt-3 flex gap-2"><Input inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Novo PIN (3+ dígitos)" /><Button size="sm" variant="outline" onClick={() => { if (newPin.length < 3) { setErro("O novo PIN precisa ter pelo menos 3 dígitos."); return; } setPin(newPin); setNewPin(""); setEditing(false); setErro("PIN local alterado. O Cloud do mestre continua usando 333."); }}>Salvar</Button></div>}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">{cloudConfigured() ? "Cloud conectado — perfis de player podem entrar por outros aparelhos." : "Modo local ativo — o painel do mestre continua disponível, mas o multiplayer aguarda o Cloud deste build."}</p>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const authed = useCampaign((s) => s.authed);
  const session = useCampaign((s) => s.session);
  const simulation = useCampaign((s) => s.simulation);
  const toggleSimulation = useCampaign((s) => s.toggleSimulation);
  const logout = useCampaign((s) => s.logout);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useClockEngine();
  const { proximo, countdown } = useTimelineStatus();
  const { pace } = useSessionPace();
  const [cloudSync, setCloudSync] = useState<"online" | "offline" | "syncing">(() => cloudConfigured() && getCloudSession()?.role === "MASTER" ? "online" : "offline");
  // O estado autenticado vem do localStorage; sem este gate o SSR e o cliente divergem e o React descarta a árvore.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const scene = SCENES.find((s) => s.id === session.currentSceneId);
  const local = LOCATIONS.find((l) => l.id === session.currentLocationId);

  useEffect(() => {
    if (!authed || !cloudConfigured()) return;
    const token = requireMasterToken();
    if (!token) return;
    setCloudSync("syncing");
    const timer = window.setTimeout(() => {
      void rpc<{ ok: boolean }>("master_sync_public_state", {
        p_token: token,
        p_payload: {
          day: session.day,
          time: session.time,
          currentLocationId: session.currentLocationId ?? "",
          currentLocationName: local?.name ?? "",
        },
      }).then(() => setCloudSync("online")).catch(() => setCloudSync("offline"));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [authed, session.day, session.time, session.currentLocationId, local?.name]);

  if (!authed || !hydrated) return <LoginScreen />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="shrink-0"><p className="stamp text-primary">Operação Berço Vazio</p><p className="text-sm font-semibold">Painel do Mestre</p></div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className="rounded-sm bg-primary px-2 py-1 font-semibold text-primary-foreground">DIA {session.day}</span>
            <span className="font-mono text-base">{session.time}</span>
            <span className={`stamp ${session.clockRunning ? "text-route-verde-claro" : "text-route-amarelo"}`}>{session.clockRunning ? `rodando ${session.clockSpeed}x` : "pausado"}</span>
            <span className="hidden text-muted-foreground md:inline">Local: <span className="text-foreground">{local?.name ?? "—"}</span></span>
            <span className="hidden text-muted-foreground xl:inline">Cena: <span className="text-foreground">{scene?.title ?? "—"}</span></span>
            {proximo && countdown !== null && <span className="hidden text-muted-foreground lg:inline">Próximo: <span className="text-foreground">{proximo.title} · {countdown} min</span></span>}
            <span className={`hidden stamp 2xl:inline ${paceTone[pace]}`}>Ritmo: {paceLabel[pace]}</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs">
            <span className={`hidden items-center gap-1 xl:flex ${cloudSync === "online" ? "text-route-verde-claro" : cloudSync === "syncing" ? "text-route-amarelo" : "text-muted-foreground"}`}><Save className="size-3.5" /> {cloudSync === "online" ? "Cloud" : cloudSync === "syncing" ? "Sync…" : "Local"}</span>
            <Link to="/players" className="hidden rounded-sm border border-border px-2 py-1.5 text-xs hover:border-primary sm:inline-flex"><Users className="mr-1 size-3.5" />Players</Link>
            <Button size="sm" variant={simulation ? "destructive" : "outline"} onClick={toggleSimulation}><FlaskConical className="size-3.5 sm:mr-1" /><span className="hidden sm:inline">{simulation ? "Sair da simulação" : "Simulação"}</span></Button>
            <Button size="sm" variant="ghost" onClick={() => { logout(); void logoutCloud(); }}>Sair</Button>
          </div>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto border-t border-border px-3 py-1.5 sm:px-5"><div className="shrink-0"><ClockControls compact /></div><span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">Ctrl+K para busca rápida</span></div>
        <nav className="flex flex-nowrap gap-1 overflow-x-auto border-t border-border px-3 py-1.5 sm:px-5 [scrollbar-width:thin]">{NAV.map((n) => <Link key={n.to} to={n.to} className={cn("shrink-0 rounded-sm px-3 py-1.5 text-xs transition-colors", pathname === n.to ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>{n.label}</Link>)}</nav>
        {simulation && <div className="bg-destructive/20 px-3 py-1 text-center text-xs text-destructive-foreground sm:px-5">MODO SIMULAÇÃO ATIVO — nada aqui altera a sessão real. Ao sair, o estado anterior é restaurado.</div>}
      </header>
      <div className="px-3 pt-3 sm:px-5"><EventAlert /></div>
      <main className="px-3 py-4 sm:px-5 sm:py-6">{children}</main>
      <CommandPalette />
    </div>
  );
}
