import { Button } from "@/components/ui/button";
import { attackSkillLabel, availableAttacks, combatDefense } from "@/data/combatRules";
import { TRAINING_BONUS, type CharacterSheetData } from "@/data/ordemRules";
import { Crosshair, Hand, Shield, ShieldCheck, Swords, Target } from "lucide-react";

export function CombatPanel({ sheet, onRollAttack, onRollDamage }: {
  sheet: CharacterSheetData;
  onRollAttack: (attackId: string) => void;
  onRollDamage: (attackId: string) => void;
}) {
  const attacks = availableAttacks(sheet);
  const defense = combatDefense(sheet);
  const reflexes = sheet.skills.reflexos ?? { training: "DESTREINADO" as const, otherBonus: 0 };
  const fortitude = sheet.skills.fortitude ?? { training: "DESTREINADO" as const, otherBonus: 0 };
  const luta = sheet.skills.luta ?? { training: "DESTREINADO" as const, otherBonus: 0 };
  const trainedReflexes = reflexes.training !== "DESTREINADO";
  const trainedFortitude = fortitude.training !== "DESTREINADO";
  const trainedLuta = luta.training !== "DESTREINADO";

  return <div className="space-y-4">
    <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/70 to-card/30 p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Swords className="size-5"/></div>
        <div className="min-w-0 flex-1"><p className="stamp text-primary">Combate</p><h2 className="font-display text-2xl">Ataques e reações</h2><p className="mt-1 text-xs text-muted-foreground">O painel usa a ficha atual e o equipamento marcado como equipado. Itens desconhecidos não viram armas automaticamente.</p></div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <DefenseCard icon={Shield} label="Defesa" value={String(defense.baseDefense)} note={defense.baseDefense === defense.suggestedBaseDefense ? `10 + AGI (${sheet.attributes.AGI})` : `Valor da ficha · referência sem bônus de proteção: ${defense.suggestedBaseDefense}`}/>
        <DefenseCard icon={Target} label="Esquiva / Reflexos" value={defense.dodgeDefense === null ? "Bloqueada" : String(defense.dodgeDefense)} note={trainedReflexes ? `Defesa ${defense.baseDefense} + Reflexos ${defense.reflexesBonus}` : "Requer Reflexos treinado."}/>
        <DefenseCard icon={ShieldCheck} label="Bloqueio" value={defense.blockReduction === null ? "Bloqueado" : `RD ${defense.blockReduction}`} note={trainedFortitude ? "Usável contra ataque corpo a corpo; reduz o dano desse ataque." : "Requer Fortitude treinada."}/>
        <DefenseCard icon={Swords} label="Contra-ataque" value={defense.canCounterAttack ? "Disponível" : "Bloqueado"} note={trainedLuta ? `Se um ataque corpo a corpo errar contra sua Defesa ${defense.baseDefense}, faça um ataque corpo a corpo.` : "Requer Luta treinada."}/>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Use apenas uma reação especial de defesa na rodada. Esquiva funciona contra ataques em geral; Bloqueio e Contra-ataque dependem de ataque corpo a corpo.</p>
    </section>

    <section className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Ataques disponíveis</p><h3 className="font-semibold">{attacks.length} opção(ões) agora</h3></div><span className="ml-auto rounded-full border border-border bg-background/40 px-2 py-1 text-[10px] text-muted-foreground">equipado → ataque automático</span></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">{attacks.map((attack) => {
        const skill = sheet.skills[attack.skillId] ?? { training: "DESTREINADO" as const, otherBonus: 0 };
        const skillBonus = TRAINING_BONUS[skill.training] + Number(skill.otherBonus || 0) + Number(attack.bonus || 0);
        return <article key={attack.id} className="rounded-xl border border-border bg-background/25 p-3">
          <div className="flex items-start gap-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${attack.melee ? "border-route-amarelo/30 bg-route-amarelo/5 text-route-amarelo" : "border-primary/30 bg-primary/5 text-primary"}`}>{attack.melee ? <Hand className="size-4"/> : <Crosshair className="size-4"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="truncate">{attack.name}</b><span className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{attack.source === "EQUIPAMENTO" ? "EQUIPADO" : attack.source === "DESARMADO" ? "DESARMADO" : "MANUAL"}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{attackSkillLabel(attack)} · {attack.attribute} · bônus de perícia {skillBonus >= 0 ? "+" : ""}{skillBonus}</p></div></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label="Dano" value={attack.damage}/><Stat label="Crítico" value={`${attack.criticalMargin}/x${attack.criticalMultiplier}`}/><Stat label="Alcance" value={rangeLabel(attack.range)}/><Stat label="Tipo" value={damageLabel(attack.damageType)}/></div>
          {attack.ammo && <p className="mt-2 text-[10px] text-muted-foreground">Munição associada: {attack.ammo}. O sistema ainda não remove munição automaticamente.</p>}
          <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => onRollAttack(attack.id)}><Crosshair className="mr-1 size-3.5"/>Rolar ataque</Button><Button type="button" size="sm" variant="secondary" onClick={() => onRollDamage(attack.id)}>Rolar dano</Button>{defense.canCounterAttack && attack.melee && <span className="self-center text-[10px] text-muted-foreground">Pode ser usado em Contra-ataque quando a condição for atendida.</span>}</div>
        </article>;
      })}</div>
    </section>
  </div>;
}

function DefenseCard({ icon: Icon, label, value, note }: { icon: typeof Shield; label: string; value: string; note: string }) {
  return <div className="rounded-xl border border-border bg-background/30 p-3"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4"/><span className="stamp text-[9px]">{label}</span></div><p className="mt-2 font-display text-xl">{value}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{note}</p></div>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border/70 bg-background/35 p-2"><p className="stamp text-[8px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>; }
function rangeLabel(range: string) { return range === "CORPO_A_CORPO" ? "Corpo a corpo" : range === "MEDIO" ? "Médio" : range === "LONGO" ? "Longo" : "Curto"; }
function damageLabel(type: string) { return type === "BALISTICO" ? "Balístico" : type === "PERFURACAO" ? "Perfuração" : type === "CORTE" ? "Corte" : type === "IMPACTO" ? "Impacto" : type === "FOGO" ? "Fogo" : "Outro"; }
