import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerRoleType } from "@/lib/playerCloudTypes";
import { Fingerprint } from "lucide-react";

interface PlayerIntroProps {
  name: string;
  role: PlayerRoleType;
  symbolUrl?: string;
  skipFuture?: boolean;
  onSkipFutureChange?: (value: boolean) => void;
  onDone: () => void;
}

export function PlayerIntro({ name, role, symbolUrl, skipFuture = false, onSkipFutureChange, onDone }: PlayerIntroProps) {
  const [canContinue, setCanContinue] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCanContinue(true), 2450);
    return () => window.clearTimeout(t);
  }, []);

  const agent = role === "AGENTE_DA_ORDEM";
  const villain = role === "VILAO";
  const civilian = !agent && !villain;
  const upperName = name.trim().toUpperCase();
  const title = agent ? "BEM-VINDO, AGENTE" : "BEM-VINDO";
  const subtitle = agent
    ? "TERMINAL OPERACIONAL — ACESSO CONFIRMADO"
    : villain
      ? "PROTOCOLO RUPTURA — IDENTIDADE RECONHECIDA"
      : "REGISTRO CIVIL — IDENTIDADE CONFIRMADA";
  const roleLabel = agent ? "AGENTE DA ORDEM" : villain ? "PRESENÇA HOSTIL" : "CIVIL REGISTRADO";
  const frame = agent
    ? "player-intro-agent border-cyan-400/45 text-cyan-100"
    : villain
      ? "player-intro-villain border-red-600/50 text-red-100"
      : "player-intro-civil border-amber-400/45 text-amber-100";
  const bg = agent
    ? "from-[#010812] via-[#03172a] to-black"
    : villain
      ? "from-[#190000] via-[#090101] to-black"
      : "from-[#17120a] via-[#0c0b08] to-black";

  const finish = () => {
    if (!canContinue || closing) return;
    setClosing(true);
    window.setTimeout(onDone, 300);
  };

  return (
    <div className={`player-intro-shell fixed inset-0 z-[100] overflow-hidden bg-gradient-to-br ${bg} ${closing ? "player-intro-exit" : ""}`}>
      <div className="player-intro-vignette pointer-events-none absolute inset-0" />
      <div className="player-scanlines pointer-events-none absolute inset-0 opacity-35" />
      <div className="player-intro-noise pointer-events-none absolute inset-0" />
      <div className={`pointer-events-none absolute inset-0 ${agent ? "player-glitch-blue" : villain ? "player-glitch-red" : "player-glitch-amber"}`} />
      <div className={`player-intro-scan-beam pointer-events-none absolute inset-x-0 top-0 ${agent ? "bg-cyan-300/35" : villain ? "bg-red-500/35" : "bg-amber-300/30"}`} />

      {villain && <div className="player-villain-sigil pointer-events-none absolute left-1/2 top-1/2 size-[min(82vw,760px)] -translate-x-1/2 -translate-y-1/2 opacity-[.12]"><Pentagram /></div>}
      {agent && <div className="player-agent-grid pointer-events-none absolute inset-0" />}
      {civilian && <div className="player-civil-grid pointer-events-none absolute inset-0" />}

      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className={`player-intro-frame relative w-full max-w-4xl overflow-hidden border bg-black/48 p-5 text-center backdrop-blur-md sm:p-10 lg:p-12 ${frame}`}>
          <CornerMarks />
          <div className="player-intro-topline flex items-center justify-between gap-3 font-mono text-[9px] tracking-[.18em] opacity-60 sm:text-[10px]">
            <span>OPERAÇÃO BERÇO VAZIO // IDENTIFICAÇÃO</span>
            <span className="hidden sm:inline">CANAL SEGURO // {roleLabel}</span>
          </div>

          <div className="player-intro-symbol-wrap relative mx-auto my-7 flex size-40 items-center justify-center sm:my-9 sm:size-52">
            <div className="player-intro-ring player-intro-ring-a absolute inset-0 rounded-full border border-current/25" />
            <div className="player-intro-ring player-intro-ring-b absolute inset-[12%] rounded-full border border-current/15" />
            <div className="player-intro-crosshair pointer-events-none absolute inset-[-18%] opacity-30" />
            <div className="player-intro-symbol relative z-10 flex size-[72%] items-center justify-center">
              {agent && symbolUrl ? (
                <img src={symbolUrl} alt="Símbolo da Ordem" className="max-h-full max-w-full object-contain drop-shadow-[0_0_20px_currentColor]" />
              ) : agent ? (
                <OriginalSeal />
              ) : villain ? (
                <Pentagram />
              ) : (
                <Fingerprint className="size-full opacity-85" strokeWidth={1.15} />
              )}
            </div>
            {civilian && <div className="player-fingerprint-scan pointer-events-none absolute inset-x-[20%] top-[18%] h-px bg-current/80" />}
          </div>

          <div className="player-intro-identification mx-auto max-w-2xl">
            <p className="player-intro-kicker font-mono text-[10px] tracking-[.35em] opacity-55">IDENTIDADE VALIDADA</p>
            <h1 className="player-intro-title mt-3 font-mono text-xl font-bold tracking-[.16em] sm:text-3xl lg:text-4xl">{title}</h1>
            <p className="player-intro-name mt-2 font-mono text-3xl font-black tracking-[.1em] sm:text-5xl lg:text-6xl">{upperName}</p>
            <p className="player-intro-subtitle mt-5 font-mono text-[10px] tracking-[.2em] opacity-65 sm:text-xs sm:tracking-[.28em]">{subtitle}</p>
          </div>

          <div className="player-intro-actions mx-auto mt-8 max-w-lg border-t border-current/25 pt-5 sm:mt-10 sm:pt-6">
            {onSkipFutureChange && (
              <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 text-xs opacity-70 transition-opacity hover:opacity-100">
                <input
                  type="checkbox"
                  checked={skipFuture}
                  onChange={(e) => onSkipFutureChange(e.target.checked)}
                  className="accent-current"
                />
                Pular esta intro nas próximas entradas
              </label>
            )}
            <Button
              variant="outline"
              disabled={!canContinue}
              className="w-full border-current bg-transparent font-mono tracking-[.16em] text-current hover:bg-white/10 disabled:opacity-30"
              onClick={finish}
            >
              {canContinue ? "ACESSAR TERMINAL" : "AUTENTICANDO…"}
            </Button>
            <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[9px] opacity-40">
              <span>SESSÃO CRIPTOGRAFADA</span>
              <span>TERMINAL INDIVIDUAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CornerMarks() {
  return <>
    <span className="player-corner player-corner-tl" />
    <span className="player-corner player-corner-tr" />
    <span className="player-corner player-corner-bl" />
    <span className="player-corner player-corner-br" />
  </>;
}

function OriginalSeal() {
  return <svg viewBox="0 0 120 120" className="size-full text-cyan-300" aria-label="Selo geométrico original">
    <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".75" />
    <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1" opacity=".45" />
    <path d="M60 8 74 43 112 45 82 68 91 105 60 84 29 105 38 68 8 45 46 43Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M60 24 91 78 29 78Z M29 42 91 42 60 96Z" fill="none" stroke="currentColor" strokeWidth="1" opacity=".7" />
    <circle cx="60" cy="60" r="7" fill="currentColor" opacity=".18" />
  </svg>;
}

function Pentagram() {
  return <svg viewBox="0 0 120 120" className="player-pentagram size-full text-red-500" aria-label="Pentagrama geométrico">
    <circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" strokeWidth="2" opacity=".65" />
    <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".35" />
    <path d="M60 15 70.6 47.5 104.8 47.5 77.1 67.6 87.7 100.1 60 80 32.3 100.1 42.9 67.6 15.2 47.5 49.4 47.5Z" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="60" cy="60" r="4" fill="currentColor" />
  </svg>;
}
