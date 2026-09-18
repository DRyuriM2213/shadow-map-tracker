import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { availableAttacks, combatDefense } from "@/data/combatRules";
import { TRAINING_BONUS, type CharacterSheetData } from "@/data/ordemRules";
import { Crosshair, Dice5, HeartPulse, Shield, ShieldCheck, Swords, X, Zap } from "lucide-react";

export function PlayerCombatMode({ sheet, onClose, onRollAttack, onRollDamage, onRollSkill }: {
  sheet: CharacterSheetData;
  onClose: () => void;
  onRollAttack: (attackId: string) => void;
  onRollDamage: (attackId: string) => void;
  onRollSkill: (skillId: string) => void;
}) {
  const attacks = availableAttacks(sheet);
  const defense = combatDefense(sheet);
  const hp = percent(sheet.resources.pv, sheet.resources.pvMax);
  const pe = percent(sheet.resources.pe, sheet.resources.peMax);
  const san = percent(sheet.resources.san, sheet.resources.sanMax);

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

  return <div className="combat-mode-overlay" role="dialog" aria-modal="true" aria-label="Modo Combate">
    <div className="combat-mode-grid" aria-hidden="true"/>
    <header className="combat-mode-header">
      <div><p className="stamp text-primary">PROTOCOLO DE CONFRONTO</p><h1 className="font-display text-3xl">{sheet.identity.name || "Agente"}</h1><p className="text-xs text-muted-foreground">{sheet.concept.className}{sheet.concept.trail ? ` · ${sheet.concept.trail}` : ""} · NEX {sheet.concept.nex}%</p></div>
      <Button size="icon" variant="ghost" onClick={onClose} aria-label="Fechar modo combate"><X className="size-5"/></Button>
    </header>

    <main className="combat-mode-content">
      <section className="combat-vitals">
        <Vital icon={HeartPulse} label="PV" current={sheet.resources.pv} max={sheet.resources.pvMax} pct={hp}/>
        <Vital icon={Zap} label="PE" current={sheet.resources.pe} max={sheet.resources.peMax} pct={pe}/>
        <Vital icon={ShieldCheck} label="SAN" current={sheet.resources.san} max={sheet.resources.sanMax} pct={san}/>
        <div className="combat-defense-main"><Shield className="size-5 text-primary"/><div><span>DEFESA</span><b>{defense.baseDefense}</b></div></div>
      </section>

      <section className="combat-reactions">
        <Reaction label="Esquiva" value={defense.dodgeDefense === null ? "—" : String(defense.dodgeDefense)} enabled={defense.dodgeDefense !== null} onClick={() => onRollSkill("reflexos")}/>
        <Reaction label="Bloqueio" value={defense.blockReduction === null ? "—" : `RD ${defense.blockReduction}`} enabled={defense.blockReduction !== null}/>
        <Reaction label="Contra-ataque" value={defense.canCounterAttack ? "Disponível" : "—"} enabled={defense.canCounterAttack}/>
      </section>

      <section className="combat-arsenal">
        <div className="combat-section-heading"><div><p className="stamp text-primary">ARSENAL ATIVO</p><h2 className="font-display text-2xl">Escolha sua ação</h2></div><Swords className="size-6 text-primary"/></div>
        <div className="combat-attack-grid">{attacks.map((attack) => {
          const skill = sheet.skills[attack.skillId] ?? { training: "DESTREINADO" as const, otherBonus: 0 };
          const bonus = TRAINING_BONUS[skill.training] + Number(skill.otherBonus || 0) + Number(attack.bonus || 0);
          return <article key={attack.id} className="combat-attack-card">
            <div className="combat-attack-icon">{attack.melee ? <Swords className="size-5"/> : <Crosshair className="size-5"/>}</div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3>{attack.name}</h3>{attack.source === "EQUIPAMENTO" && <span>EQUIPADO</span>}</div><p>{attack.skillId.toUpperCase()} · {attack.attribute} · {bonus >= 0 ? "+" : ""}{bonus}</p></div>
            <div className="combat-attack-stats"><div><span>DANO</span><b>{attack.damage}</b></div><div><span>CRÍTICO</span><b>{attack.criticalMargin}/x{attack.criticalMultiplier}</b></div><div><span>ALCANCE</span><b>{attack.range.replaceAll("_"," ")}</b></div></div>
            <div className="combat-actions"><Button onClick={() => onRollAttack(attack.id)}><Crosshair className="mr-1 size-4"/>Atacar</Button><Button variant="secondary" onClick={() => onRollDamage(attack.id)}><Dice5 className="mr-1 size-4"/>Dano</Button></div>
          </article>;
        })}</div>
      </section>
    </main>
  </div>;
}

function Vital({ icon: Icon, label, current, max, pct }: { icon: typeof HeartPulse; label: string; current: number; max: number; pct: number }) {
  return <div className="combat-vital"><div className="flex items-center gap-2"><Icon className="size-4 text-primary"/><span>{label}</span><b className="ml-auto">{current}<small>/{max}</small></b></div><div className="combat-vital-track"><i style={{ width: pct + "%" }}/></div></div>;
}
function Reaction({ label, value, enabled, onClick }: { label: string; value: string; enabled: boolean; onClick?: () => void }) {
  const Tag = onClick && enabled ? "button" : "div";
  return <Tag className={"combat-reaction " + (enabled ? "is-enabled" : "")} {...(onClick && enabled ? { onClick } : {})}><span>{label}</span><b>{value}</b></Tag>;
}
function percent(current: number, max: number) { return max > 0 ? Math.max(0, Math.min(100, current / max * 100)) : 0; }
