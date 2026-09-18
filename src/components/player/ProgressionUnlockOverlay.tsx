import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";

export function ProgressionUnlockOverlay({ nex, unlocks, onClose }: { nex: number; unlocks: string[]; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return <div className="progression-unlock-overlay" role="dialog" aria-modal="true" aria-label={"NEX "+nex+"% alcançado"}>
    <div className="progression-unlock-rings" aria-hidden="true"><i/><i/><i/></div>
    <div className="progression-unlock-card">
      <div className="progression-unlock-icon"><TrendingUp className="size-6"/></div>
      <p className="stamp text-primary">SINCRONIZAÇÃO DE DOSSIÊ</p>
      <h2>NEX {nex}%</h2>
      <p className="progression-unlock-lead">Seu perfil foi atualizado. Novas possibilidades podem ter sido liberadas.</p>
      <div className="progression-unlock-list">{unlocks.length ? unlocks.map((item,index)=><div key={item+index}><Sparkles className="size-4 text-primary"/><span>{item}</span></div>) : <div><Sparkles className="size-4 text-primary"/><span>Recursos e limites do personagem foram atualizados.</span></div>}</div>
      <Button className="mt-6" onClick={onClose}>Continuar</Button>
    </div>
  </div>;
}
