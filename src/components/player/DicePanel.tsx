import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PolyhedralDie3D } from "@/components/player/PolyhedralDie3D";
import { parseAndRollFormula, type FormulaRoll } from "@/lib/dice";
import type { CloudRoll } from "@/lib/playerCloudTypes";
import { Dice5, Eye, Lock, Volume2, VolumeX, X } from "lucide-react";

export type RollVisibility = "PUBLICA" | "PRIVADA";

type AnimatedFormulaRoll = { id: number; roll: FormulaRoll };
type OrdemVisualResult = {
  label: string;
  dice: number[];
  sides?: number[];
  chosenIndex: number;
  chosen: number;
  bonus: number;
  total: number;
  mode: string;
  formula?: string;
  note?: string;
};

const DICE_SOUND_KEY = "berco-dice-sound";

function storedSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DICE_SOUND_KEY) !== "0";
}

function playDiceTone(kind: "roll" | "reveal" | "critical") {
  if (typeof window === "undefined" || !storedSoundEnabled()) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = kind === "roll" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(kind === "roll" ? 92 : kind === "critical" ? 620 : 330, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "roll" ? 54 : kind === "critical" ? 920 : 470, now + (kind === "roll" ? 0.22 : 0.16));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "critical" ? 0.075 : 0.045, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "roll" ? 0.25 : 0.22));
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.28);
    window.setTimeout(() => void context.close(), 420);
  } catch {
    // Som é um extra. Se o navegador bloquear WebAudio, a rolagem continua normalmente.
  }
}

export function DicePanel({ rolls, onLog, visibility, onVisibilityChange }: {
  rolls: CloudRoll[];
  visibility: RollVisibility;
  onVisibilityChange: (visibility: RollVisibility) => void;
  onLog: (data: { label: string; formula: string; payload: Record<string, unknown>; total: number; visibility: RollVisibility }) => Promise<void>;
}) {
  const [formula, setFormula] = useState("1d20");
  const [last, setLast] = useState<FormulaRoll | null>(null);
  const [animated, setAnimated] = useState<AnimatedFormulaRoll | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(storedSoundEnabled);
  const [error, setError] = useState("");

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") window.localStorage.setItem(DICE_SOUND_KEY, next ? "1" : "0");
  };

  const roll = async (f = formula) => {
    try {
      const result = parseAndRollFormula(f);
      setLast(result);
      setAnimated({ id: Date.now() + Math.random(), roll: result });
      setError("");
      setFormula(f);
      await onLog({ label: "Rolagem manual", formula: result.formula, payload: { dice: result.dice, modifier: result.modifier, subtotal: result.subtotal }, total: result.total, visibility });
    } catch (e) { setError(e instanceof Error ? e.message : "Fórmula inválida"); }
  };

  return <>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.75fr)]">
      <section className="player-terminal-card border p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1"><p className="stamp text-primary">Rolador 3D</p><h2 className="font-display text-2xl">Dados</h2><p className="mt-1 max-w-xl text-xs text-muted-foreground">Toda rolagem usa o resultado real primeiro e depois mostra a animação 3D. O visual nunca altera o número sorteado.</p></div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button size="sm" variant={visibility === "PUBLICA" ? "default" : "outline"} onClick={() => onVisibilityChange("PUBLICA")}><Eye className="mr-1 size-3.5"/>Pública</Button>
            <Button size="sm" variant={visibility === "PRIVADA" ? "default" : "outline"} onClick={() => onVisibilityChange("PRIVADA")}><Lock className="mr-1 size-3.5"/>Privada</Button>
            <Button size="sm" variant="ghost" aria-label={soundEnabled ? "Desativar som dos dados" : "Ativar som dos dados"} title={soundEnabled ? "Som dos dados ligado" : "Som dos dados desligado"} onClick={toggleSound}>{soundEnabled ? <Volume2 className="size-4"/> : <VolumeX className="size-4"/>}<span className="hidden sm:inline">Som</span></Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">{[4,6,8,10,12,20,100].map(s => <button type="button" key={s} onClick={() => void roll(`1d${s}`)} className="group rounded-xl border border-border/80 bg-background/25 px-2 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.05]"><span className="mx-auto flex size-9 items-center justify-center rounded-lg border border-border/80 bg-black/15 font-mono text-sm font-bold transition group-hover:border-primary/30 group-hover:bg-primary/[0.06]">d{s}</span><span className="mt-1.5 block text-[10px] text-muted-foreground">rolar</span></button>)}</div>
        <div className="mt-4 flex gap-2"><Input className="h-11 font-mono" value={formula} onChange={e => setFormula(e.target.value)} placeholder="2d6+3" onKeyDown={e => { if (e.key === "Enter") void roll(); }}/><Button className="h-11" onClick={() => void roll()}><Dice5 className="mr-1 size-4"/>Rolar</Button></div>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        {last && <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.045] p-4"><div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Última rolagem</p><p className="font-mono text-sm text-muted-foreground">{last.formula}</p></div><b className="ml-auto font-mono text-4xl tracking-tight">{last.total}</b></div><div className="mt-3 flex flex-wrap gap-2">{last.dice.map((d, i) => <span key={i} className="flex min-w-11 items-center justify-center rounded-lg border border-border/80 bg-background/45 px-2 py-2 font-mono font-bold"><small className="mr-1 text-[8px] text-muted-foreground">d{d.sides}</small>{d.value}</span>)}</div><p className="mt-3 text-xs text-muted-foreground">Subtotal {last.subtotal} · modificador {last.modifier >= 0 ? "+" : ""}{last.modifier}</p></div>}
      </section>

      <section className="player-terminal-card border p-4 sm:p-5"><p className="stamp text-primary">Feed compartilhado</p><h2 className="font-display text-2xl">Rolagens recentes</h2><p className="mt-1 text-xs text-muted-foreground">Pública: todos veem. Privada: somente você e o mestre.</p><div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">{rolls.slice(0, 60).map(r => <div key={r.id} className="group rounded-xl border border-border/80 bg-background/18 p-3 text-sm transition hover:border-primary/25 hover:bg-background/30"><div className="flex items-center gap-2"><b className="min-w-0 truncate">{r.characterName || r.playerName || "Player"}</b><span className="rounded-full border border-border px-1.5 py-0.5 text-[8px] text-muted-foreground">{r.visibility}</span><b className="ml-auto font-mono text-2xl">{r.total ?? "—"}</b></div><p className="mt-1 truncate text-xs text-muted-foreground">{r.label} · {r.formula}</p></div>)}{rolls.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhum dado rolado ainda.</p>}</div></section>
    </div>
    {animated && <DramaticRollOverlay key={animated.id} label="Rolagem manual" formula={animated.roll.formula} dice={animated.roll.dice} total={animated.roll.total} modifier={animated.roll.modifier} onClose={() => setAnimated(null)}/>} 
  </>;
}

export function OrdemRollResult({ result, onClose }: { result: OrdemVisualResult | null; onClose?: () => void }) {
  if (!result) return null;
  const dice = result.dice.map((value, index) => ({ value, sides: result.sides?.[index] ?? (result.mode === "SOMA" ? 6 : 20) }));
  return <DramaticRollOverlay
    key={`${result.label}-${result.total}-${result.dice.join("-")}`}
    label={result.label}
    formula={result.formula ?? (result.mode === "SOMA" ? "Rolagem de dano" : `${result.dice.length}d20 · usa o ${result.mode.toLowerCase()}`)}
    dice={dice}
    total={result.total}
    modifier={result.bonus}
    chosenIndex={result.chosenIndex}
    note={result.note}
    onClose={onClose}
  />;
}

function DramaticRollOverlay({ label, formula, dice, total, modifier, chosenIndex = -1, note, onClose }: {
  label: string;
  formula: string;
  dice: Array<{ value: number; sides: number }>;
  total: number;
  modifier: number;
  chosenIndex?: number;
  note?: string;
  onClose?: () => void;
}) {
  const [phase, setPhase] = useState<"rolling" | "reveal" | "hidden">("rolling");
  const critical = /cr[ií]tico/i.test(note ?? "") || /cr[ií]tico/i.test(label);
  const selectedIndex = chosenIndex >= 0 ? chosenIndex : 0;
  const selected = dice[selectedIndex] ?? dice[0] ?? { value: total, sides: 20 };

  const close = () => {
    setPhase("hidden");
    onClose?.();
  };

  useEffect(() => {
    playDiceTone("roll");
    const reveal = window.setTimeout(() => {
      setPhase("reveal");
      playDiceTone(critical ? "critical" : "reveal");
    }, 1150);
    const hide = window.setTimeout(close, 5200);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(hide);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [critical]);

  if (phase === "hidden") return null;
  return <div className={`dice-overlay ${phase === "rolling" ? "is-rolling" : "is-revealed"} ${critical ? "is-critical" : ""}`} role="status" aria-live="polite">
    <button type="button" className="dice-overlay-backdrop" aria-label="Fechar resultado da rolagem" onClick={close}/>
    <div className="dice-arena">
      <button type="button" aria-label="Fechar resultado" className="dice-close" onClick={close}><X className="size-4"/></button>
      <div className="dice-kicker">{critical ? "ACERTO CRÍTICO" : phase === "rolling" ? "ROLANDO..." : "RESULTADO"}</div>
      <h2 className="dice-title">{label}</h2>
      <p className="dice-formula">{formula}</p>
      <div className="dice-main-wrap"><div className="dice-shockwave"/><PolyhedralDie3D value={selected.value} sides={selected.sides} rolling={phase === "rolling"} critical={critical}/></div>
      <div className="dice-result-row"><span className="dice-result-label">TOTAL</span><b>{phase === "rolling" ? "—" : total}</b>{modifier !== 0 && <span className="dice-modifier">{modifier >= 0 ? "+" : ""}{modifier}</span>}</div>
      <div className="dice-individuals">{dice.slice(0, 12).map((die, index) => <span key={`${index}-${die.value}`} className={index === chosenIndex ? "is-chosen" : ""}><small>d{die.sides}</small>{phase === "rolling" ? "•" : die.value}</span>)}</div>
      {dice.length > 12 && <p className="mt-2 text-[10px] text-muted-foreground">+ {dice.length - 12} dado(s) no resultado completo</p>}
      {note && phase === "reveal" && <p className="dice-note">{note}</p>}
      {phase === "reveal" && <p className="dice-dismiss-hint">Clique fora ou pressione Esc para fechar</p>}
    </div>
  </div>;
}
