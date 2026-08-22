import { SKILLS, TRAINING_BONUS, type CharacterSheetData, type OrdemAttribute } from "@/data/ordemRules";
import { resolveInventoryWeapon } from "@/data/inventoryRules";

export type CombatRange = "CORPO_A_CORPO" | "CURTO" | "MEDIO" | "LONGO";
export type CombatDamageType = "IMPACTO" | "CORTE" | "PERFURACAO" | "BALISTICO" | "FOGO" | "OUTRO";

export interface CombatAttack {
  id: string;
  name: string;
  source: "DESARMADO" | "EQUIPAMENTO" | "MANUAL";
  sourceItemId?: string;
  attribute: OrdemAttribute;
  skillId: string;
  bonus: number;
  damage: string;
  criticalMargin: number;
  criticalMultiplier: number;
  range: CombatRange;
  damageType: CombatDamageType;
  ammo: string;
  special: string;
  melee: boolean;
}

function withStrength(base: string, strength: number) {
  const value = Math.trunc(strength);
  if (value === 0) return base;
  return `${base}${value > 0 ? "+" : ""}${value}`;
}

function manualRange(range: string): CombatRange {
  const normalized = range?.toLocaleLowerCase("pt-BR") ?? "";
  if (normalized.includes("long")) return "LONGO";
  if (normalized.includes("méd") || normalized.includes("med")) return "MEDIO";
  if (normalized.includes("cur")) return "CURTO";
  return "CORPO_A_CORPO";
}

export function availableAttacks(sheet: CharacterSheetData): CombatAttack[] {
  const manual: CombatAttack[] = sheet.attacks.map((attack) => ({
    ...attack,
    source: "MANUAL",
    range: manualRange(attack.range),
    damageType: "OUTRO",
    melee: manualRange(attack.range) === "CORPO_A_CORPO",
  }));

  const unarmed: CombatAttack = {
    id: "auto:desarmado",
    name: "Soco / ataque desarmado",
    source: "DESARMADO",
    attribute: "FOR",
    skillId: "luta",
    bonus: 0,
    damage: withStrength("1d3", sheet.attributes.FOR),
    criticalMargin: 20,
    criticalMultiplier: 2,
    range: "CORPO_A_CORPO",
    damageType: "IMPACTO",
    ammo: "",
    special: "Ataque desarmado; disponível mesmo sem equipamento.",
    melee: true,
  };

  const equipped = sheet.inventory.flatMap((item): CombatAttack[] => {
    if (!item.equipped || Number(item.quantity) <= 0) return [];
    const weapon = resolveInventoryWeapon(item);
    if (!weapon) return [];
    const melee = weapon.skillId === "luta" || weapon.range === "CORPO_A_CORPO";
    return [{
      id: `auto:item:${item.id}`,
      name: `${melee ? "Golpe" : "Disparo"} · ${item.name}`,
      source: "EQUIPAMENTO",
      sourceItemId: item.id,
      attribute: weapon.attribute,
      skillId: weapon.skillId,
      bonus: 0,
      damage: weapon.addStrength ? withStrength(weapon.damage, sheet.attributes.FOR) : weapon.damage,
      criticalMargin: weapon.criticalMargin,
      criticalMultiplier: weapon.criticalMultiplier,
      range: weapon.range,
      damageType: weapon.damageType,
      ammo: weapon.ammo ?? "",
      special: `Gerado automaticamente a partir do inventário porque “${item.name}” está equipado.`,
      melee,
    }];
  });

  const seen = new Set<string>();
  return [unarmed, ...equipped, ...manual].filter((attack) => {
    if (seen.has(attack.id)) return false;
    seen.add(attack.id);
    return true;
  });
}

export function combatAttackById(sheet: CharacterSheetData, attackId: string) {
  return availableAttacks(sheet).find((attack) => attack.id === attackId);
}

function skillBonus(sheet: CharacterSheetData, skillId: string) {
  const state = sheet.skills[skillId] ?? { training: "DESTREINADO" as const, otherBonus: 0 };
  return TRAINING_BONUS[state.training] + Number(state.otherBonus || 0);
}

function isTrained(sheet: CharacterSheetData, skillId: string) {
  return (sheet.skills[skillId]?.training ?? "DESTREINADO") !== "DESTREINADO";
}

export interface CombatDefense {
  baseDefense: number;
  suggestedBaseDefense: number;
  reflexesBonus: number;
  dodgeDefense: number | null;
  blockReduction: number | null;
  canCounterAttack: boolean;
  counterAttackIds: string[];
}

export function combatDefense(sheet: CharacterSheetData): CombatDefense {
  const suggestedBaseDefense = 10 + Math.max(0, Math.trunc(sheet.attributes.AGI));
  const baseDefense = Number.isFinite(sheet.resources.defense) ? sheet.resources.defense : suggestedBaseDefense;
  const reflexesBonus = skillBonus(sheet, "reflexos");
  const dodgeDefense = isTrained(sheet, "reflexos") ? baseDefense + reflexesBonus : null;
  const blockReduction = isTrained(sheet, "fortitude") ? Math.max(0, skillBonus(sheet, "fortitude")) : null;
  const canCounterAttack = isTrained(sheet, "luta");
  const counterAttackIds = canCounterAttack ? availableAttacks(sheet).filter((attack) => attack.melee).map((attack) => attack.id) : [];
  return { baseDefense, suggestedBaseDefense, reflexesBonus, dodgeDefense, blockReduction, canCounterAttack, counterAttackIds };
}

export function attackSkillLabel(attack: CombatAttack) {
  return SKILLS.find((skill) => skill.id === attack.skillId)?.name ?? attack.skillId;
}
