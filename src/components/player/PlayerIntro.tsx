import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerRoleType } from "@/lib/playerCloudTypes";
import { Fingerprint, Shield } from "lucide-react";

export function PlayerIntro({ name, role, symbolUrl, onDone }: { name: string; role: PlayerRoleType; symbolUrl?: string; onDone: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => setReady(true), 500); return () => clearTimeout(t); }, []);

  const agent = role === "AGENTE_DA_ORDEM";
  const villain = role === "VILAO";
  const title = agent ? `BEM-VINDO, AGENTE ${name.toUpperCase()}` : `BEM-VINDO, ${name.toUpperCase()}`;
  const subtitle = agent ? "TERMINAL OPERACIONAL — ACESSO CONFIRMADO" : villain ? "PROTOCOLO RUPTURA — IDENTIDADE RECONHECIDA" : "REGISTRO CIVIL — IDENTIDADE CONFIRMADA";
  const frame = agent ? "border-cyan-400/50 text-cyan-100 shadow-[0_0_80px_rgba(34,211,238,.18)]" : villain ? "border-red-600/50 text-red-100 shadow-[0_0_90px_rgba(220,38,38,.2)]" : "border-amber-400/50 text-amber-100 shadow-[0_0_80px_rgba(251,191,36,.13)]";
  const bg = agent ? "from-[#010812] via-[#03172a] to-black" : villain ? "from-[#160000] via-[#090101] to-black" : "from-[#17120a] via-[#0c0b08] to-black";

  return <div className={`fixed inset-0 z-[100] overflow-hidden bg-gradient-to-br ${bg}`}>
    <div className="player-scanlines pointer-events-none absolute inset-0 opacity-30" />
    <div className={`pointer-events-none absolute inset-0 ${agent ? "player-glitch-blue" : villain ? "player-glitch-red" : "player-glitch-amber"}`} />
    <div className="relative flex min-h-screen items-center justify-center p-5">
      <div className={`w-full max-w-3xl border bg-black/45 p-6 text-center backdrop-blur-sm sm:p-12 ${frame}`}>
        <p className="stamp opacity-70">OPERAÇÃO BERÇO VAZIO // IDENTIFICAÇÃO</p>
        <div className="mx-auto my-8 flex size-36 items-center justify-center sm:size-44">
          {symbolUrl ? <img src={symbolUrl} alt="Símbolo de identificação" className="max-h-full max-w-full object-contain" /> : agent ? <OriginalSeal /> : villain ? <Pentagram /> : <Fingerprint className="size-28 opacity-80" />}
        </div>
        <h1 className={`font-mono text-2xl font-bold tracking-[.12em] sm:text-4xl ${ready ? "player-intro-reveal" : "opacity-0"}`}>{title}</h1>
        <p className="mt-4 font-mono text-xs tracking-[.24em] opacity-65 sm:text-sm">{subtitle}</p>
        <div className="mx-auto mt-8 max-w-md border-t border-current/30 pt-6">
          <Button variant="outline" className="w-full border-current bg-transparent text-current hover:bg-white/10" onClick={onDone}>CONTINUAR</Button>
          <p className="mt-3 text-[10px] opacity-45">SESSÃO CRIPTOGRAFADA · TERMINAL INDIVIDUAL</p>
        </div>
      </div>
    </div>
  </div>;
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
  return <svg viewBox="0 0 120 120" className="size-full text-red-500 player-pentagram" aria-label="Pentagrama geométrico">
    <circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" strokeWidth="2" opacity=".65" />
    <path d="M60 15 70.6 47.5 104.8 47.5 77.1 67.6 87.7 100.1 60 80 32.3 100.1 42.9 67.6 15.2 47.5 49.4 47.5Z" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="60" cy="60" r="4" fill="currentColor" />
  </svg>;
}
