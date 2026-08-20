import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useCampaign } from "@/store/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LOCATIONS, SCENES } from "@/data/campaignFull";
import { FlaskConical, Lock, Save, Shield, Users } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="dossier hero-panel player-terminal-card relative w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="master-brand-mark"><Shield className="size-5" /></div>
          <div><p className="stamp text-primary">Terminal de acesso</p><p className="text-xs text-muted-foreground">Universidade Valença · rede privada</p></div>
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">OPERAÇÃO BERÇO VAZIO</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Acesso do mestre e terminais individuais em uma única entrada segura.</p>

        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN de acesso</Label>
            <Input id="pin" autoFocus inputMode="numeric" autoComplete="off" value={code} onChange={(e) => { setCode(e.target.value); setErro(""); }} placeholder="••••••" className="h-11 text-base tracking-[.25em]" />
            {(!mounted || !pin) && <p className="text-xs text-muted-foreground">PIN inicial do mestre: <b>333</b>. PINs de jogadores são criados pelo mestre.</p>}
          </div>
          {erro && <p role="alert" className="rounded-lg border border-destructive/35 bg-destructive/10 p-2.5 text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="h-11 w-full" disabled={busy}><Lock className="mr-2 size-4" />{busy ? "Verificando…" : "Entrar no terminal"}</Button>
        </form>

        <div className="mt-5 border-t border-border/70 pt-4">
          <button type="button" className="text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground" onClick={() => setEditing((v) => !v)}>{editing ? "Cancelar troca de PIN local" : "Trocar PIN local de emergência do mestre"}</button>
          {editing && <div className="mt-3 flex gap-2"><Input inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Novo PIN (3+ dígitos)" /><Button size="sm" variant="outline" onClick={() => { if (newPin.length < 3) { setErro("O novo PIN precisa ter pelo menos 3 dígitos."); return; } setPin(newPin); setNewPin(""); setEditing(false); setErro("PIN local alterado. O Cloud do mestre continua usando 333."); }}>Salvar</Button></div>}
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${cloudConfigured() ? "bg-route-verde-claro" : "bg-route-amarelo"}`} />{cloudConfigured() ? "Cloud pronto para mestre e players." : "Modo local ativo; multiplayer aguardando Cloud."}</div>
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
      void rpc<{ ok: boolean; error?: string }>("master_sync_public_state", {
        p_token: token,
        p_payload: {
          day: session.day,
          time: session.time,
          currentLocationId: session.currentLocationId ?? "",
          currentLocationName: local?.name ?? "",
        },
      }).then((result) => {
        if (!result.ok) throw new Error(result.error || "Falha ao sincronizar o estado público");
        setCloudSync("online");
      }).catch(() => setCloudSync("offline"));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [authed, session.day, session.time, session.currentLocationId, local?.name]);

  if (!authed || !hydrated) return <LoginScreen />;

  return (
    <div className="master-shell min-h-screen">
      <header className="master-header sticky top-0 z-40">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex shrink-0 items-center gap-3"><div className="master-brand-mark"><Shield className="size-5" /></div><div><p className="stamp text-primary">Operação Berço Vazio</p><p className="text-sm font-semibold tracking-wide">Painel do Mestre</p></div></div>
          <div className="master-status-strip flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-3 py-1.5 text-xs">
            <span className="rounded-md border border-primary/35 bg-primary/90 px-2 py-1 font-semibold text-primary-foreground">DIA {session.day}</span>
            <span className="font-mono text-base font-semibold">{session.time}</span>
            <span className={`stamp ${session.clockRunning ? "text-route-verde-claro" : "text-route-amarelo"}`}>{session.clockRunning ? `rodando ${session.clockSpeed}x` : "pausado"}</span>
            <span className="hidden text-muted-foreground md:inline">Local: <span className="text-foreground">{local?.name ?? "—"}</span></span>
            <span className="hidden text-muted-foreground xl:inline">Cena: <span className="text-foreground">{scene?.title ?? "—"}</span></span>
            {proximo && countdown !== null && <span className="hidden text-muted-foreground lg:inline">Próximo: <span className="text-foreground">{proximo.title} · {countdown} min</span></span>}
            <span className={`hidden stamp 2xl:inline ${paceTone[pace]}`}>Ritmo: {paceLabel[pace]}</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs">
            <span className={`hidden items-center gap-1 rounded-md border border-border/60 px-2 py-1.5 xl:flex ${cloudSync === "online" ? "text-route-verde-claro" : cloudSync === "syncing" ? "text-route-amarelo" : "text-muted-foreground"}`}><Save className="size-3.5" /> {cloudSync === "online" ? "Cloud" : cloudSync === "syncing" ? "Sync…" : "Local"}</span>
            <Link to="/players" className="hidden rounded-lg border border-border/80 bg-card/30 px-2.5 py-1.5 text-xs hover:border-primary/40 hover:bg-accent/60 sm:inline-flex"><Users className="mr-1 size-3.5" />Players</Link>
            <Button size="sm" variant={simulation ? "destructive" : "outline"} onClick={toggleSimulation}><FlaskConical className="size-3.5 sm:mr-1" /><span className="hidden sm:inline">{simulation ? "Sair da simulação" : "Simulação"}</span></Button>
            <Button size="sm" variant="ghost" onClick={() => { logout(); void logoutCloud(); }}>Sair</Button>
          </div>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto border-t border-border/70 px-3 py-1.5 sm:px-5"><div className="shrink-0"><ClockControls compact /></div><span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">Ctrl+K · busca rápida</span></div>
        <nav className="master-nav flex flex-nowrap overflow-x-auto border-t border-border/70 px-3 py-1.5 sm:px-5 [scrollbar-width:thin]">{NAV.map((n) => <Link key={n.to} to={n.to} data-active={pathname === n.to ? "true" : "false"} className={cn("shrink-0 px-3 py-1.5 text-xs", pathname === n.to ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>{n.label}</Link>)}</nav>
        {simulation && <div className="bg-destructive/20 px-3 py-1 text-center text-xs text-destructive-foreground sm:px-5">MODO SIMULAÇÃO ATIVO — nada aqui altera a sessão real. Ao sair, o estado anterior é restaurado.</div>}
      </header>
      <div className="px-3 pt-3 sm:px-5"><EventAlert /></div>
      <main className="master-main px-3 py-4 sm:px-5 sm:py-6">{children}</main>
      <CommandPalette />
    </div>
  );
}
