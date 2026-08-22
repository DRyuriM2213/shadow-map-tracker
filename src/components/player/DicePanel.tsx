import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseAndRollFormula, type FormulaRoll } from "@/lib/dice";
import type { CloudRoll } from "@/lib/playerCloudTypes";
import { Dice5, Eye, Lock, X } from "lucide-react";

export type RollVisibility = "PUBLICA" | "PRIVADA";

type AnimatedFormulaRoll = { id: number; roll: FormulaRoll };

export function DicePanel({ rolls, onLog }: {
  rolls: CloudRoll[];
  onLog: (data: { label: string; formula: string; payload: Record<string, unknown>; total: number; visibility: RollVisibility }) => Promise<void>;
}) {
  const [formula, setFormula] = useState("1d20");
  const [visibility, setVisibility] = useState<RollVisibility>("PUBLICA");
  const [last, setLast] = useState<FormulaRoll | null>(null);
  const [animated, setAnimated] = useState<AnimatedFormulaRoll | null>(null);
  const [error, setError] = useState("");
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
        <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Rolador</p><h2 className="font-display text-2xl">Dados</h2><p className="mt-1 text-xs text-muted-foreground">Escolha um dado ou escreva uma fórmula. A rolagem é registrada imediatamente; a animação é só visual.</p></div><div className="ml-auto flex gap-1"><Button size="sm" variant={visibility==="PUBLICA"?"default":"outline"} onClick={()=>setVisibility("PUBLICA")}><Eye className="mr-1 size-3.5"/>Pública</Button><Button size="sm" variant={visibility==="PRIVADA"?"default":"outline"} onClick={()=>setVisibility("PRIVADA")}><Lock className="mr-1 size-3.5"/>Privada</Button></div></div>
        <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">{[4,6,8,10,12,20,100].map(s=><button type="button" key={s} onClick={()=>void roll(`1d${s}`)} className="group rounded-xl border border-border bg-background/30 px-2 py-3 text-center transition hover:border-primary/40 hover:bg-primary/[0.05]"><span className="mx-auto flex size-9 items-center justify-center rounded-lg border border-border bg-black/15 font-mono text-sm font-bold transition group-hover:border-primary/30">d{s}</span><span className="mt-1.5 block text-[10px] text-muted-foreground">rolar</span></button>)}</div>
        <div className="mt-4 flex gap-2"><Input className="h-11 font-mono" value={formula} onChange={e=>setFormula(e.target.value)} placeholder="2d6+3" onKeyDown={e=>{if(e.key==="Enter")void roll();}}/><Button className="h-11" onClick={()=>void roll()}><Dice5 className="mr-1 size-4"/>Rolar</Button></div>{error&&<p className="mt-2 text-sm text-destructive">{error}</p>}
        {last&&<div className="mt-5 rounded-2xl border border-primary/25 bg-primary/[0.055] p-4"><div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Última rolagem</p><p className="font-mono text-sm text-muted-foreground">{last.formula}</p></div><b className="ml-auto font-mono text-4xl tracking-tight">{last.total}</b></div><div className="mt-3 flex flex-wrap gap-2">{last.dice.map((d,i)=><span key={i} className="flex min-w-11 items-center justify-center rounded-lg border border-border bg-background/55 px-2 py-2 font-mono font-bold"><small className="mr-1 text-[8px] text-muted-foreground">d{d.sides}</small>{d.value}</span>)}</div><p className="mt-3 text-xs text-muted-foreground">Subtotal {last.subtotal} · modificador {last.modifier>=0?"+":""}{last.modifier}</p></div>}
      </section>

      <section className="player-terminal-card border p-4 sm:p-5"><p className="stamp text-primary">Feed compartilhado</p><h2 className="font-display text-2xl">Rolagens recentes</h2><p className="mt-1 text-xs text-muted-foreground">Rolagens públicas aparecem para todos; privadas apenas para você e o mestre.</p><div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">{rolls.slice(0,60).map(r=><div key={r.id} className="rounded-xl border border-border bg-background/20 p-3 text-sm"><div className="flex items-center gap-2"><b>{r.characterName||r.playerName||"Player"}</b><span className="rounded-full border border-border px-1.5 py-0.5 text-[8px] text-muted-foreground">{r.visibility}</span><b className="ml-auto font-mono text-2xl">{r.total??"—"}</b></div><p className="mt-1 text-xs text-muted-foreground">{r.label} · {r.formula}</p></div>)}{rolls.length===0&&<p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhum dado rolado ainda.</p>}</div></section>
    </div>
    {animated && <DramaticRollOverlay key={animated.id} label="Rolagem manual" formula={animated.roll.formula} dice={animated.roll.dice} total={animated.roll.total} modifier={animated.roll.modifier} onClose={()=>setAnimated(null)}/>} 
  </>;
}

export function OrdemRollResult({ result }: { result: null | { label: string; dice: number[]; chosenIndex: number; chosen: number; bonus: number; total: number; mode: string; note?: string } }) {
  if (!result) return null;
  const dice = result.dice.map((value) => ({ value, sides: result.mode === "SOMA" ? 0 : 20 }));
  return <DramaticRollOverlay key={`${result.label}-${result.total}-${result.dice.join("-")}`} label={result.label} formula={result.mode === "SOMA" ? "Rolagem de dano" : `${result.dice.length}d20 · usa o ${result.mode.toLowerCase()}`} dice={dice} total={result.total} modifier={result.bonus} chosenIndex={result.chosenIndex} note={result.note}/>;
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
  const critical = /cr[ií]tico/i.test(note ?? "");
  const selectedIndex = chosenIndex >= 0 ? chosenIndex : 0;
  const selected = dice[selectedIndex] ?? dice[0] ?? { value: total, sides: 0 };

  useEffect(() => {
    const reveal = window.setTimeout(() => setPhase("reveal"), 850);
    const hide = window.setTimeout(() => { setPhase("hidden"); onClose?.(); }, 3900);
    return () => { window.clearTimeout(reveal); window.clearTimeout(hide); };
  }, [onClose]);

  if (phase === "hidden") return null;
  return <div className={`dice-overlay ${phase === "rolling" ? "is-rolling" : "is-revealed"} ${critical ? "is-critical" : ""}`} role="status" aria-live="polite">
    <div className="dice-overlay-backdrop"/>
    <div className="dice-arena">
      {onClose && <button type="button" aria-label="Fechar resultado" className="dice-close" onClick={() => { setPhase("hidden"); onClose(); }}><X className="size-4"/></button>}
      <div className="dice-kicker">{critical ? "ACERTO CRÍTICO" : phase === "rolling" ? "ROLANDO..." : "RESULTADO"}</div>
      <h2 className="dice-title">{label}</h2>
      <p className="dice-formula">{formula}</p>
      <div className="dice-main-wrap"><div className="dice-shockwave"/><div className="dice-poly"><span className="dice-side-label">{selected.sides > 0 ? `d${selected.sides}` : "DANO"}</span><strong>{phase === "rolling" ? "?" : selected.value}</strong></div></div>
      <div className="dice-result-row"><span className="dice-result-label">TOTAL</span><b>{phase === "rolling" ? "—" : total}</b>{modifier !== 0 && <span className="dice-modifier">{modifier >= 0 ? "+" : ""}{modifier}</span>}</div>
      <div className="dice-individuals">{dice.slice(0, 12).map((die, index) => <span key={`${index}-${die.value}`} className={index === chosenIndex ? "is-chosen" : ""}><small>{die.sides > 0 ? `d${die.sides}` : ""}</small>{phase === "rolling" ? "•" : die.value}</span>)}</div>
      {dice.length > 12 && <p className="mt-2 text-[10px] text-muted-foreground">+ {dice.length - 12} dado(s) no resultado completo</p>}
      {note && phase === "reveal" && <p className="dice-note">{note}</p>}
    </div>
  </div>;
}
