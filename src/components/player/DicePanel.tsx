import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseAndRollFormula, type FormulaRoll } from "@/lib/dice";
import type { CloudRoll } from "@/lib/playerCloudTypes";
import { Dice5, Eye, Lock } from "lucide-react";

export type RollVisibility = "PUBLICA" | "PRIVADA";

export function DicePanel({ rolls, onLog }: {
  rolls: CloudRoll[];
  onLog: (data: { label: string; formula: string; payload: Record<string, unknown>; total: number; visibility: RollVisibility }) => Promise<void>;
}) {
  const [formula, setFormula] = useState("1d20");
  const [visibility, setVisibility] = useState<RollVisibility>("PUBLICA");
  const [last, setLast] = useState<FormulaRoll | null>(null);
  const [error, setError] = useState("");
  const roll = async (f = formula) => {
    try {
      const result = parseAndRollFormula(f);
      setLast(result); setError(""); setFormula(f);
      await onLog({ label: "Rolagem manual", formula: result.formula, payload: { dice: result.dice, modifier: result.modifier, subtotal: result.subtotal }, total: result.total, visibility });
    } catch (e) { setError(e instanceof Error ? e.message : "Fórmula inválida"); }
  };

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.75fr)]">
    <section className="rounded-sm border border-border bg-card/35 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Rolador</p><h2 className="font-display text-2xl">Dados</h2></div><div className="ml-auto flex gap-1"><Button size="sm" variant={visibility==="PUBLICA"?"default":"outline"} onClick={()=>setVisibility("PUBLICA")}><Eye className="mr-1 size-3.5"/>Pública</Button><Button size="sm" variant={visibility==="PRIVADA"?"default":"outline"} onClick={()=>setVisibility("PRIVADA")}><Lock className="mr-1 size-3.5"/>Privada</Button></div></div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">{[4,6,8,10,12,20,100].map(s=><Button key={s} variant="outline" onClick={()=>void roll(`1d${s}`)}>d{s}</Button>)}</div>
      <div className="mt-4 flex gap-2"><Input value={formula} onChange={e=>setFormula(e.target.value)} placeholder="2d6+3" onKeyDown={e=>{if(e.key==="Enter")void roll();}}/><Button onClick={()=>void roll()}><Dice5 className="mr-1 size-4"/>Rolar</Button></div>{error&&<p className="mt-2 text-sm text-destructive">{error}</p>}
      {last&&<div className="mt-5 rounded-sm border border-primary/50 bg-primary/10 p-4"><p className="stamp text-primary">Última rolagem · {last.formula}</p><div className="mt-3 flex flex-wrap gap-2">{last.dice.map((d,i)=><span key={i} className="flex size-12 items-center justify-center rounded-sm border border-border bg-background font-mono text-xl font-bold">{d.value}</span>)}</div><div className="mt-3 flex items-end justify-between"><span className="text-sm text-muted-foreground">Modificador {last.modifier>=0?"+":""}{last.modifier}</span><b className="font-mono text-4xl">{last.total}</b></div></div>}
    </section>

    <section className="rounded-sm border border-border bg-card/35 p-4 sm:p-5"><p className="stamp text-primary">Feed compartilhado</p><h2 className="font-display text-2xl">Rolagens recentes</h2><p className="mt-1 text-xs text-muted-foreground">Rolagens públicas aparecem para todos; privadas apenas para você e o mestre.</p><div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto">{rolls.slice(0,60).map(r=><div key={r.id} className="rounded-sm border border-border p-2 text-sm"><div className="flex items-center gap-2"><b>{r.characterName||r.playerName||"Player"}</b><span className="stamp text-[9px] text-muted-foreground">{r.visibility}</span><b className="ml-auto font-mono text-xl">{r.total??"—"}</b></div><p className="text-xs text-muted-foreground">{r.label} · {r.formula}</p></div>)}{rolls.length===0&&<p className="text-sm text-muted-foreground">Nenhum dado rolado ainda.</p>}</div></section>
  </div>;
}

export function OrdemRollResult({ result }: { result: null | { label: string; dice: number[]; chosenIndex: number; chosen: number; bonus: number; total: number; mode: string; note?: string } }) {
  if (!result) return null;
  return <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-lg rounded-sm border border-primary bg-background/95 p-4 shadow-2xl backdrop-blur sm:bottom-6"><div className="flex items-center"><div><p className="stamp text-primary">{result.label}</p><p className="text-xs text-muted-foreground">usa o {result.mode.toLowerCase()} d20 · bônus {result.bonus>=0?"+":""}{result.bonus}</p></div><b className="ml-auto font-mono text-4xl">{result.total}</b></div><div className="mt-3 flex flex-wrap gap-2">{result.dice.map((v,i)=><span key={i} className={`flex size-10 items-center justify-center rounded-sm border font-mono font-bold ${i===result.chosenIndex?"border-primary bg-primary text-primary-foreground":"border-border"}`}>{v}</span>)}</div>{result.note&&<p className="mt-2 text-xs text-muted-foreground">{result.note}</p>}</div>;
}
