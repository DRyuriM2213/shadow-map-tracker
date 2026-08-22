import { SKILLS, TRAINING_BONUS, type CharacterSheetData, type OrdemAttribute } from "@/data/ordemRules";

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

interface WeaponPreset {
  aliases: string[];
  attackLabel: string;
  skillId: "luta" | "pontaria";
  attribute: OrdemAttribute;
  damage: string;
  addStrength?: boolean;
  criticalMargin: number;
  criticalMultiplier: number;
  range: CombatRange;
  damageType: CombatDamageType;
  ammo?: string;
}

const weapon = (
  aliases: string[], attackLabel: string, skillId: "luta" | "pontaria", attribute: OrdemAttribute,
  damage: string, criticalMargin: number, criticalMultiplier: number, range: CombatRange,
  damageType: CombatDamageType, options: { addStrength?: boolean; ammo?: string } = {},
): WeaponPreset => ({ aliases, attackLabel, skillId, attribute, damage, criticalMargin, criticalMultiplier, range, damageType, ...options });

/**
 * Catálogo mecânico enxuto para reconhecer equipamento já cadastrado na ficha.
 * Se um item não casar com o catálogo, ele não gera ataque automaticamente.
 */
export const WEAPON_PRESETS: WeaponPreset[] = [
  weapon(["faca"], "Facada", "luta", "FOR", "1d4", 19, 2, "CORPO_A_CORPO", "CORTE", { addStrength: true }),
  weapon(["punhal", "adaga"], "Estocada", "luta", "FOR", "1d4", 20, 3, "CORPO_A_CORPO", "PERFURACAO", { addStrength: true }),
  weapon(["martelo"], "Martelada", "luta", "FOR", "1d6", 20, 2, "CORPO_A_CORPO", "IMPACTO", { addStrength: true }),
  weapon(["bastao", "bastão", "cassetete"], "Golpe de bastão", "luta", "FOR", "1d6", 20, 2, "CORPO_A_CORPO", "IMPACTO", { addStrength: true }),
  weapon(["machete"], "Golpe de machete", "luta", "FOR", "1d6", 19, 2, "CORPO_A_CORPO", "CORTE", { addStrength: true }),
  weapon(["lanca", "lança"], "Estocada de lança", "luta", "FOR", "1d6", 20, 2, "CORPO_A_CORPO", "PERFURACAO", { addStrength: true }),
  weapon(["espada"], "Golpe de espada", "luta", "FOR", "1d8", 19, 2, "CORPO_A_CORPO", "CORTE", { addStrength: true }),
  weapon(["florete"], "Estocada de florete", "luta", "FOR", "1d6", 18, 2, "CORPO_A_CORPO", "PERFURACAO", { addStrength: true }),
  weapon(["machadinha"], "Golpe de machadinha", "luta", "FOR", "1d6", 20, 3, "CORPO_A_CORPO", "CORTE", { addStrength: true }),
  weapon(["machado"], "Golpe de machado", "luta", "FOR", "1d8", 20, 3, "CORPO_A_CORPO", "CORTE", { addStrength: true }),
  weapon(["maca", "maça"], "Golpe de maça", "luta", "FOR", "2d4", 20, 2, "CORPO_A_CORPO", "IMPACTO", { addStrength: true }),
  weapon(["katana"], "Golpe de katana", "luta", "FOR", "1d10", 19, 2, "CORPO_A_CORPO", "CORTE", { addStrength: true }),
  weapon(["marreta"], "Marretada", "luta", "FOR", "3d4", 20, 2, "CORPO_A_CORPO", "IMPACTO", { addStrength: true }),
  weapon(["montante"], "Golpe de montante", "luta", "FOR", "2d6", 19, 2, "CORPO_A_CORPO", "CORTE", { addStrength: true }),
  weapon(["pistola"], "Tiro de pistola", "pontaria", "AGI", "1d12", 18, 2, "CURTO", "BALISTICO", { ammo: "Balas curtas" }),
  weapon(["revolver", "revólver"], "Tiro de revólver", "pontaria", "AGI", "2d6", 19, 3, "CURTO", "BALISTICO", { ammo: "Balas curtas" }),
  weapon(["submetralhadora"], "Rajada de submetralhadora", "pontaria", "AGI", "2d6", 19, 3, "CURTO", "BALISTICO", { ammo: "Balas curtas" }),
  weapon(["espingarda"], "Tiro de espingarda", "pontaria", "AGI", "4d6", 20, 3, "CURTO", "BALISTICO", { ammo: "Cartuchos" }),
  weapon(["fuzil de caca", "fuzil de caça"], "Tiro de fuzil de caça", "pontaria", "AGI", "2d8", 19, 3, "MEDIO", "BALISTICO", { ammo: "Balas longas" }),
  weapon(["fuzil de assalto"], "Tiro de fuzil de assalto", "pontaria", "AGI", "2d10", 19, 3, "MEDIO", "BALISTICO", { ammo: "Balas longas" }),
  weapon(["fuzil de precisao", "fuzil de precisão", "sniper"], "Tiro de precisão", "pontaria", "AGI", "2d10", 19, 3, "LONGO", "BALISTICO", { ammo: "Balas longas" }),
  weapon(["arco composto"], "Disparo de arco composto", "pontaria", "AGI", "1d10", 20, 3, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
  weapon(["arco"], "Disparo de arco", "pontaria", "AGI", "1d6", 20, 3, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
  weapon(["balestra"], "Disparo de balestra", "pontaria", "AGI", "1d12", 19, 2, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
  weapon(["besta"], "Disparo de besta", "pontaria", "AGI", "1d8", 19, 2, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
];

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function findPreset(name: string, category: string) {
  const haystack = normalize(`${name} ${category}`);
  // aliases mais específicas primeiro para evitar "arco" capturar "arco composto".
  return [...WEAPON_PRESETS]
    .sort((a, b) => Math.max(...b.aliases.map((x) => normalize(x).length)) - Math.max(...a.aliases.map((x) => normalize(x).length)))
    .find((preset) => preset.aliases.some((alias) => haystack.includes(normalize(alias))));
}

function withStrength(base: string, strength: number) {
  const value = Math.trunc(strength);
  if (value === 0) return base;
  return `${base}${value > 0 ? "+" : ""}${value}`;
}

export function availableAttacks(sheet: CharacterSheetData): CombatAttack[] {
  const manual: CombatAttack[] = sheet.attacks.map((attack) => ({
    ...attack,
    source: "MANUAL",
    range: attack.range?.toLocaleLowerCase("pt-BR").includes("long") ? "LONGO" : attack.range?.toLocaleLowerCase("pt-BR").includes("méd") || attack.range?.toLocaleLowerCase("pt-BR").includes("med") ? "MEDIO" : attack.range?.toLocaleLowerCase("pt-BR").includes("cur") ? "CURTO" : "CORPO_A_CORPO",
    damageType: "OUTRO",
    melee: !attack.range || attack.range === "—" || attack.range.toLocaleLowerCase("pt-BR").includes("corpo"),
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
    if (!item.equipped || item.quantity <= 0) return [];
    const preset = findPreset(item.name, item.category);
    if (!preset) return [];
    return [{
      id: `auto:item:${item.id}`,
      name: `${preset.attackLabel} · ${item.name}`,
      source: "EQUIPAMENTO",
      sourceItemId: item.id,
      attribute: preset.attribute,
      skillId: preset.skillId,
      bonus: 0,
      damage: preset.addStrength ? withStrength(preset.damage, sheet.attributes.FOR) : preset.damage,
      criticalMargin: preset.criticalMargin,
      criticalMultiplier: preset.criticalMultiplier,
      range: preset.range,
      damageType: preset.damageType,
      ammo: preset.ammo ?? "",
      special: `Gerado automaticamente porque “${item.name}” está equipado.`,
      melee: preset.skillId === "luta",
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
