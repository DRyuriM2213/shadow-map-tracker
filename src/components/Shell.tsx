import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useCampaign } from "@/store/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LOCATIONS, SCENES } from "@/data/campaignFull";
import { FlaskConical, Lock, Save } from "lucide-react";
import { useClockEngine, useSessionPace, useTimelineStatus, paceLabel, paceTone } from "@/lib/clock";
import { ClockControls, EventAlert } from "@/components/ClockBar";
import { CommandPalette } from "@/components/CommandPalette";

const NAV = [
  { to: "/", label: "Painel" },
  { to: "/sessao-v2", label: "Sessão ao vivo" },
  { to: "/mapa", label: "Mapa" },
  { to: "/diagrama", label: "Diagrama" },
  { to: "/timeline", label: "Timeline" },
  { to: "/locais", label: "Locais e salas" },
  { to: "/pistas-v2", label: "Pistas" },
  { to: "/npcs", label: "NPCs" },
  { to: "/personagens", label: "Personagens" },
  { to: "/consequencias", label: "Consequências" },
  { to: "/resumo", label: "Resumo" },
  { to: "/editar", label: "Editar campanha" },
] as const;

function LoginScreen() {
  const { pin, setPin, login } = useCampaign();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [erro, setErro] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="dossier w-full max-w-md rounded-sm p-8">
        <p className="stamp text-primary">Acesso restrito — painel do mestre</p>
        <h1 className="mt-3 text-3xl font-semibold">OPERAÇÃO BERÇO VAZIO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Universidade Valença — sistema privado de condução de sessão.
        </p>

        {pin ? (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (code === pin) login();
              else setErro("PIN incorreto.");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="pin">PIN rápido</Label>
              <Input
                id="pin"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••"
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full">
              Entrar com PIN
            </Button>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground underline"
              onClick={() => setPin("")}
            >
              Usar e-mail e senha
            </button>
          </form>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes("@") || pass.length < 4) {
                setErro("Informe um e-mail válido e uma senha com 4+ caracteres.");
                return;
              }
              login();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Senha</Label>
              <Input id="pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novopin">PIN rápido para os próximos acessos (opcional)</Label>
              <Input
                id="novopin"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: 1937"
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button
              type="submit"
              className="w-full"
              onClick={() => {
                if (code.length >= 3) setPin(code);
              }}
            >
              <Lock className="mr-2 size-4" /> Entrar no painel
            </Button>
          </form>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Acesso local e privado. Não existe visão pública para jogadores nesta versão.
        </p>
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

  if (!authed) return <LoginScreen />;

  const scene = SCENES.find((s) => s.id === session.currentSceneId);
  const local = LOCATIONS.find((l) => l.id === session.currentLocationId);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <div>
            <p className="stamp text-primary">Operação Berço Vazio</p>
            <p className="text-sm font-semibold">Painel do Mestre</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="rounded-sm bg-primary px-2 py-1 font-semibold text-primary-foreground">
              DIA {session.day}
            </span>
            <span className="font-mono text-base">{session.time}</span>
            <span className={`stamp ${session.clockRunning ? "text-route-verde-claro" : "text-route-amarelo"}`}>
              {session.clockRunning ? `rodando ${session.clockSpeed}x` : "pausado"}
            </span>
            <span className="text-muted-foreground">Local: <span className="text-foreground">{local?.name ?? "—"}</span></span>
            <span className="text-muted-foreground">Cena: <span className="text-foreground">{scene?.title ?? "—"}</span></span>
            {proximo && countdown !== null && (
              <span className="text-muted-foreground">Próximo evento: <span className="text-foreground">{proximo.title} em {countdown} min</span></span>
            )}
            <span className={`stamp ${paceTone[pace]}`}>Ritmo: {paceLabel[pace]}</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-route-verde-claro"><Save className="size-3.5" /> Salvo automaticamente</span>
            <Button size="sm" variant={simulation ? "destructive" : "outline"} onClick={toggleSimulation}>
              <FlaskConical className="mr-1 size-3.5" />{simulation ? "Sair da simulação" : "Modo simulação"}
            </Button>
            <Button size="sm" variant="ghost" onClick={logout}>Sair</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-1.5">
          <ClockControls compact />
          <span className="text-[11px] text-muted-foreground">Ctrl+K para a paleta de comandos</span>
        </div>
        <nav className="flex flex-wrap gap-1 border-t border-border px-5 py-1.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs transition-colors",
                pathname === n.to ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {simulation && <div className="bg-destructive/20 px-5 py-1 text-center text-xs text-destructive-foreground">MODO SIMULAÇÃO ATIVO — nada aqui altera a sessão real. Ao sair, o estado anterior é restaurado.</div>}
      </header>
      <div className="px-5 pt-3"><EventAlert /></div>
      <main className="px-5 py-6">{children}</main>
      <CommandPalette />
    </div>
  );
}