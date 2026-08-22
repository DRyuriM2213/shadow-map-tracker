import { Button } from "@/components/ui/button";
import { attackSkillLabel, availableAttacks, combatDefense } from "@/data/combatRules";
import { TRAINING_BONUS, type CharacterSheetData } from "@/data/ordemRules";
import { Activity, Crosshair, Dice5, Hand, HeartPulse, Shield, ShieldCheck, Sparkles, Swords, Target } from "lucide-react";

export function CombatPanel({ sheet, onRollAttack, onRollDamage, onRollSkill }: {
  sheet: CharacterSheetData;
  onRollAttack: (attackId: string) => void;
  onRollDamage: (attackId: string) => void;
  onRollSkill: (skillId: string) => void;
}) {
  const attacks = availableAttacks(sheet);
  const defense = combatDefense(sheet);
  const reflexes = sheet.skills.reflexos ?? { training: "DESTREINADO" as const, otherBonus: 0 };
  const fortitude = sheet.skills.fortitude ?? { training: "DESTREINADO" as const, otherBonus: 0 };
  const luta = sheet.skills.luta ?? { training: "DESTREINADO" as const, otherBonus: 0 };
  const trainedReflexes = reflexes.training !== "DESTREINADO";
  const trainedFortitude = fortitude.training !== "DESTREINADO";
  const trainedLuta = luta.training !== "DESTREINADO";
  const meleeAttacks = attacks.filter((attack) => attack.melee);

  return <div className="space-y-4">
    <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/75 to-card/35 p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Swords className="size-5"/></div>
        <div className="min-w-0 flex-1"><p className="stamp text-primary">Combate</p><h2 className="font-display text-2xl">Ataques e reações</h2><p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">Ataques automáticos vêm apenas do que está realmente equipado. Ataques manuais continuam preservados para homebrew e modo livre.</p></div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Recursos rápidos de combate">
        <ResourceHud icon={HeartPulse} label="PV" current={sheet.resources.pv} max={sheet.resources.pvMax}/>
        <ResourceHud icon={Sparkles} label="PE" current={sheet.resources.pe} max={sheet.resources.peMax}/>
        <ResourceHud icon={Activity} label="SAN" current={sheet.resources.san} max={sheet.resources.sanMax}/>
        <ResourceHud icon={Shield} label="Defesa" current={defense.baseDefense}/>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <DefenseCard icon={Shield} label="Defesa passiva" value={String(defense.baseDefense)} note={defense.baseDefense === defense.suggestedBaseDefense ? `10 + AGI (${sheet.attributes.AGI})` : `Valor da ficha · referência sem outros bônus: ${defense.suggestedBaseDefense}`}/>
        <DefenseCard icon={Target} label="Esquiva" value={defense.dodgeDefense === null ? "Bloqueada" : String(defense.dodgeDefense)} note={trainedReflexes ? `Defesa ${defense.baseDefense} + Reflexos ${defense.reflexesBonus}` : "Requer Reflexos treinado."} action={trainedReflexes ? <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => onRollSkill("reflexos")}><Dice5 className="mr-1 size-3.5"/>Rolar Reflexos</Button> : undefined}/>
        <DefenseCard icon={ShieldCheck} label="Bloqueio" value={defense.blockReduction === null ? "Bloqueado" : `RD ${defense.blockReduction}`} note={trainedFortitude ? `Fortitude concede RD ${defense.blockReduction} contra um ataque corpo a corpo bloqueado.` : "Requer Fortitude treinada."}/>
        <DefenseCard icon={Swords} label="Contra-ataque" value={defense.canCounterAttack ? "Disponível" : "Bloqueado"} note={trainedLuta ? `Quando um ataque corpo a corpo errar contra sua Defesa ${defense.baseDefense}, você pode atacar corpo a corpo.` : "Requer Luta treinada."}/>
      </div>
      <p className="mt-3 rounded-lg border border-border/70 bg-background/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">Escolha apenas uma reação especial apropriada para aquele ataque. O painel não aplica dano, RD ou contra-ataque automaticamente no inimigo.</p>
      {defense.canCounterAttack && meleeAttacks.length > 0 && <div className="mt-3 rounded-xl border border-border bg-background/25 p-3"><p className="stamp text-[9px] text-muted-foreground">Atalhos de contra-ataque</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">{meleeAttacks.map((attack) => <Button type="button" key={attack.id} size="sm" variant="outline" className="w-full justify-start lg:w-auto" onClick={() => onRollAttack(attack.id)}><Swords className="mr-1 size-3.5"/>{attack.name}</Button>)}</div></div>}
    </section>

    <section className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Ataques disponíveis</p><h3 className="font-semibold">{attacks.length} opção(ões) agora</h3></div><span className="ml-auto rounded-full border border-border bg-background/40 px-2 py-1 text-[10px] text-muted-foreground">equipado → ataque automático</span></div>
      {attacks.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-border bg-background/20 p-6 text-center"><Crosshair className="mx-auto size-8 text-muted-foreground"/><p className="mt-2 text-sm font-semibold">Nenhum ataque disponível</p><p className="mt-1 text-xs text-muted-foreground">Equipe uma arma ou configure um ataque manual para ele aparecer aqui.</p></div> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{attacks.map((attack) => {
        const skill = sheet.skills[attack.skillId] ?? { training: "DESTREINADO" as const, otherBonus: 0 };
        const trainingBonus = TRAINING_BONUS[skill.training];
        const extraBonus = Number(skill.otherBonus || 0);
        const attackBonus = Number(attack.bonus || 0);
        const skillBonus = trainingBonus + extraBonus + attackBonus;
        const ammo = findAmmo(sheet, attack.ammo);
        const outOfAmmo = Boolean(attack.ammo) && ammo.quantity <= 0;
        return <article key={attack.id} className={`rounded-xl border p-3 transition-colors ${outOfAmmo ? "border-route-amarelo/35 bg-route-amarelo/5" : "border-border bg-background/25 hover:border-primary/25"}`}>
          <div className="flex items-start gap-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${attack.melee ? "border-route-amarelo/30 bg-route-amarelo/5 text-route-amarelo" : "border-primary/30 bg-primary/5 text-primary"}`}>{attack.melee ? <Hand className="size-4"/> : <Crosshair className="size-4"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="truncate">{attack.name}</b><span className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{attack.source === "EQUIPAMENTO" ? "EQUIPADO" : attack.source === "DESARMADO" ? "DESARMADO" : "MANUAL"}</span>{outOfAmmo && <span className="rounded-full border border-route-amarelo/40 bg-route-amarelo/10 px-2 py-0.5 text-[9px] font-semibold text-route-amarelo">SEM MUNIÇÃO</span>}</div><p className="mt-1 text-[11px] text-muted-foreground">{attackSkillLabel(attack)} · {attack.attribute} · total {skillBonus >= 0 ? "+" : ""}{skillBonus}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Treino {trainingBonus >= 0 ? "+" : ""}{trainingBonus} · extra {extraBonus >= 0 ? "+" : ""}{extraBonus} · ataque {attackBonus >= 0 ? "+" : ""}{attackBonus}</p></div></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label="Dano" value={attack.damage}/><Stat label="Crítico" value={`${attack.criticalMargin}/x${attack.criticalMultiplier}`}/><Stat label="Alcance" value={rangeLabel(attack.range)}/><Stat label="Tipo" value={damageLabel(attack.damageType)}/></div>
          {attack.ammo && <div className={`mt-2 rounded-lg border p-2 text-[10px] ${ammo.quantity > 0 ? "border-route-verde/30 bg-route-verde/5 text-muted-foreground" : "border-route-amarelo/35 bg-route-amarelo/5 text-route-amarelo"}`}><b>Munição:</b> {attack.ammo}. {ammo.quantity > 0 ? `${ammo.quantity} unidade(s) compatível(is) no inventário${ammo.names.length ? ` (${ammo.names.join(", ")})` : ""}.` : "Nenhum item de munição compatível foi encontrado no inventário."} Não é consumida automaticamente.</div>}
          {attack.special && <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{attack.special}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" size="sm" className="w-full" disabled={outOfAmmo} aria-disabled={outOfAmmo} title={outOfAmmo ? "Adicione munição compatível ao inventário para rolar este ataque." : undefined} onClick={() => onRollAttack(attack.id)}><Crosshair className="mr-1 size-3.5"/>Rolar ataque</Button><Button type="button" size="sm" variant="secondary" className="w-full" onClick={() => onRollDamage(attack.id)}>Rolar dano</Button></div>
        </article>;
      })}</div>}
    </section>
  </div>;
}

function ResourceHud({ icon: Icon, label, current, max }: { icon: typeof Shield; label: string; current: number; max?: number }) {
  const ratio = typeof max === "number" && max > 0 ? Math.max(0, Math.min(1, current / max)) : null;
  return <div className="rounded-xl border border-border bg-background/30 p-3"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4"/><span className="stamp text-[9px]">{label}</span></div><p className="mt-1 font-display text-xl">{typeof max === "number" ? `${current}/${max}` : current}</p>{ratio !== null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${ratio * 100}%` }}/></div>}</div>;
}
function DefenseCard({ icon: Icon, label, value, note, action }: { icon: typeof Shield; label: string; value: string; note: string; action?: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-background/30 p-3"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4"/><span className="stamp text-[9px]">{label}</span></div><p className="mt-2 font-display text-xl">{value}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{note}</p>{action}</div>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border/70 bg-background/35 p-2"><p className="stamp text-[8px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>; }
function rangeLabel(range: string) { return range === "CORPO_A_CORPO" ? "Corpo a corpo" : range === "MEDIO" ? "Médio" : range === "LONGO" ? "Longo" : "Curto"; }
function damageLabel(type: string) { return type === "BALISTICO" ? "Balístico" : type === "PERFURACAO" ? "Perfuração" : type === "CORTE" ? "Corte" : type === "IMPACTO" ? "Impacto" : type === "FOGO" ? "Fogo" : "Outro"; }
function normalize(value: string) { return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function findAmmo(sheet: CharacterSheetData, ammoName: string) {
  if (!ammoName) return { quantity: 0, names: [] as string[] };
  const needle = normalize(ammoName);
  const tokens = needle.split(" ").filter((token) => token.length > 3);
  const matches = sheet.inventory.filter((item) => {
    if (item.quantity <= 0) return false;
    const haystack = normalize(`${item.name} ${item.category} ${item.notes}`);
    return haystack.includes(needle) || (tokens.length > 0 && tokens.every((token) => haystack.includes(token)));
  });
  return { quantity: matches.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0), names: matches.map((item) => item.name).filter(Boolean) };
}
