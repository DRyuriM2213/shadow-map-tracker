export type OrdemAttribute = "AGI" | "FOR" | "INT" | "PRE" | "VIG";
export type TrainingLevel = "DESTREINADO" | "TREINADO" | "VETERANO" | "EXPERT";

export const ATTRIBUTES: { id: OrdemAttribute; label: string }[] = [
  { id: "AGI", label: "Agilidade" },
  { id: "FOR", label: "Força" },
  { id: "INT", label: "Intelecto" },
  { id: "PRE", label: "Presença" },
  { id: "VIG", label: "Vigor" },
];

export const TRAINING_BONUS: Record<TrainingLevel, number> = {
  DESTREINADO: 0,
  TREINADO: 5,
  VETERANO: 10,
  EXPERT: 15,
};

export interface SkillDefinition { id: string; name: string; attribute: OrdemAttribute; }

const SKILL_ROWS: Array<[string, string, OrdemAttribute]> = [
  ["acrobacia", "Acrobacia", "AGI"], ["adestramento", "Adestramento", "PRE"], ["artes", "Artes", "PRE"], ["atletismo", "Atletismo", "FOR"],
  ["atualidades", "Atualidades", "INT"], ["ciencias", "Ciências", "INT"], ["crime", "Crime", "AGI"], ["diplomacia", "Diplomacia", "PRE"],
  ["enganacao", "Enganação", "PRE"], ["fortitude", "Fortitude", "VIG"], ["furtividade", "Furtividade", "AGI"], ["iniciativa", "Iniciativa", "AGI"],
  ["intimidacao", "Intimidação", "PRE"], ["intuicao", "Intuição", "PRE"], ["investigacao", "Investigação", "INT"], ["luta", "Luta", "FOR"],
  ["medicina", "Medicina", "INT"], ["ocultismo", "Ocultismo", "INT"], ["percepcao", "Percepção", "PRE"], ["pilotagem", "Pilotagem", "AGI"],
  ["pontaria", "Pontaria", "AGI"], ["profissao", "Profissão", "INT"], ["reflexos", "Reflexos", "AGI"], ["religiao", "Religião", "PRE"],
  ["sobrevivencia", "Sobrevivência", "INT"], ["tatica", "Tática", "INT"], ["tecnologia", "Tecnologia", "INT"], ["vontade", "Vontade", "PRE"],
];
export const SKILLS: SkillDefinition[] = SKILL_ROWS.map(([id, name, attribute]) => ({ id, name, attribute }));

export interface CharacterSheetData {
  identity: { name: string; age: string; appearance: string; avatarUrl: string; personality: string; history: string; objective: string; };
  concept: { origin: string; className: "Combatente" | "Especialista" | "Ocultista" | "Custom"; customClass: string; trail: string; nex: number; rank: string; movement: number; pePerRound: number; freeMode: boolean; };
  attributes: Record<OrdemAttribute, number>;
  resources: { pv: number; pvMax: number; pe: number; peMax: number; san: number; sanMax: number; defense: number; protection: string; resistances: string; load: number; loadMax: number; credit: string; prestige: number; };
  skills: Record<string, { training: TrainingLevel; otherBonus: number; customName?: string }>;
  attacks: Array<{ id: string; name: string; attribute: OrdemAttribute; skillId: string; bonus: number; damage: string; criticalMargin: number; criticalMultiplier: number; range: string; special: string; ammo: string; }>;
  abilities: Array<{ id: string; name: string; costPe: number; type: string; circle: string; element: string; summary: string; }>;
  inventory: Array<{ id: string; name: string; category: string; spaces: number; quantity: number; equipped: boolean; notes: string; }>;
}

export function emptyCharacterSheet(): CharacterSheetData {
  return {
    identity: { name: "", age: "", appearance: "", avatarUrl: "", personality: "", history: "", objective: "" },
    concept: { origin: "", className: "Custom", customClass: "", trail: "", nex: 5, rank: "", movement: 9, pePerRound: 1, freeMode: false },
    attributes: { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 },
    resources: { pv: 0, pvMax: 0, pe: 0, peMax: 0, san: 0, sanMax: 0, defense: 10, protection: "", resistances: "", load: 0, loadMax: 0, credit: "", prestige: 0 },
    skills: Object.fromEntries(SKILLS.map((s) => [s.id, { training: "DESTREINADO" as TrainingLevel, otherBonus: 0 }])),
    attacks: [], abilities: [], inventory: [],
  };
}

export function normalizeSheet(input: unknown): CharacterSheetData {
  const base = emptyCharacterSheet();
  if (!input || typeof input !== "object") return base;
  const data = input as Partial<CharacterSheetData>;
  return { ...base, ...data, identity: { ...base.identity, ...(data.identity ?? {}) }, concept: { ...base.concept, ...(data.concept ?? {}) }, attributes: { ...base.attributes, ...(data.attributes ?? {}) }, resources: { ...base.resources, ...(data.resources ?? {}) }, skills: { ...base.skills, ...(data.skills ?? {}) }, attacks: Array.isArray(data.attacks) ? data.attacks : [], abilities: Array.isArray(data.abilities) ? data.abilities : [], inventory: Array.isArray(data.inventory) ? data.inventory : [] };
}

export function creationPointsUsed(attributes: Record<OrdemAttribute, number>) {
  const values = Object.values(attributes); const zeros = values.filter((v) => v === 0).length; const spent = values.reduce((sum, v) => sum + Math.max(0, v - 1), 0); const budget = 4 + Math.min(1, zeros);
  return { spent, budget, valid: zeros <= 1 && values.every((v) => v >= 0 && v <= 3) && spent <= budget };
}
