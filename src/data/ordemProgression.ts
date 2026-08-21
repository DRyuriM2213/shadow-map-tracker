/**
 * Motor de progressão da ficha — regras-base usadas pelo Berço Mestre.
 * Mantém apenas metadados e cálculos necessários à automação da ficha.
 */

import type { OrdemAttribute, TrainingLevel } from "@/data/ordemRules";

export type OrdemBaseClass = "Combatente" | "Especialista" | "Ocultista";
export type SheetClassName = OrdemBaseClass | "Custom";
export type ParanormalElement = "SANGUE" | "MORTE" | "CONHECIMENTO" | "ENERGIA";
export type RitualElement = ParanormalElement | "MEDO" | "NEUTRO";

export const ELEMENTS: { id: ParanormalElement; label: string }[] = [
  { id: "SANGUE", label: "Sangue" },
  { id: "MORTE", label: "Morte" },
  { id: "CONHECIMENTO", label: "Conhecimento" },
  { id: "ENERGIA", label: "Energia" },
];

export const TRAILS_BY_CLASS: Record<OrdemBaseClass, string[]> = {
  Combatente: ["Aniquilador", "Comandante de Campo", "Guerreiro", "Operações Especiais", "Tropa de Choque"],
  Especialista: ["Atirador de Elite", "Infiltrador", "Médico de Campo", "Negociador", "Técnico"],
  Ocultista: ["Conduíte", "Flagelador", "Graduado", "Intuitivo", "Lâmina Paranormal"],
};

export const CLASS_RESOURCES: Record<OrdemBaseClass, {
  pvBase: number;
  pvPerAdvance: number;
  peBase: number;
  pePerAdvance: number;
  sanBase: number;
  sanPerAdvance: number;
}> = {
  Combatente: { pvBase: 20, pvPerAdvance: 4, peBase: 2, pePerAdvance: 2, sanBase: 12, sanPerAdvance: 3 },
  Especialista: { pvBase: 16, pvPerAdvance: 3, peBase: 3, pePerAdvance: 3, sanBase: 16, sanPerAdvance: 4 },
  Ocultista: { pvBase: 12, pvPerAdvance: 2, peBase: 4, pePerAdvance: 4, sanBase: 20, sanPerAdvance: 5 },
};

export const NEX_STEPS: number[] = [...Array.from({ length: 19 }, (_, i) => (i + 1) * 5), 99];

export function normalizeNex(raw: number): number {
  const value = Number.isFinite(raw) ? Math.round(raw) : 5;
  if (value >= 97) return 99;
  return Math.min(95, Math.max(5, Math.round(value / 5) * 5));
}

/** 5%=1, 10%=2 ... 95%=19 e 99%=20. */
export function nexLevel(nex: number): number {
  const value = normalizeNex(nex);
  return value === 99 ? 20 : value / 5;
}

export const nexAdvances = (nex: number) => Math.max(0, nexLevel(nex) - 1);
export const peRoundLimit = (nex: number) => nexLevel(nex);

export function nextNex(nex: number): number | null {
  const index = NEX_STEPS.indexOf(normalizeNex(nex));
  return index >= 0 && index < NEX_STEPS.length - 1 ? NEX_STEPS[index + 1]! : null;
}

export function previousNex(nex: number): number | null {
  const index = NEX_STEPS.indexOf(normalizeNex(nex));
  return index > 0 ? NEX_STEPS[index - 1]! : null;
}

export type MilestoneKind =
  | "TRILHA"
  | "HABILIDADE_TRILHA"
  | "PODER"
  | "ATRIBUTO"
  | "TREINAMENTO"
  | "VERSATILIDADE"
  | "ELEMENTO";

export interface MilestoneDef {
  id: string;
  nex: number;
  kind: MilestoneKind;
  label: string;
  help: string;
}

const CLASS_POWER_NEX = [15, 30, 45, 60, 75, 90];
const ATTRIBUTE_NEX = [20, 50, 80, 95];
const TRAINING_NEX = [35, 70];
const TRAIL_ABILITY_NEX = [40, 65, 99];

/**
 * O marco de 10% é somente a escolha da trilha. Ele já representa a primeira
 * habilidade da trilha e, por isso, não existe uma segunda pendência em 10%.
 */
export const MILESTONES: MilestoneDef[] = [
  { id: "m-trilha-10", nex: 10, kind: "TRILHA", label: "Escolher trilha", help: "Escolha uma trilha da sua classe. O marco de 10% da trilha vem junto dessa escolha." },
  ...CLASS_POWER_NEX.map((nex) => ({
    id: `m-poder-${nex}`,
    nex,
    kind: "PODER" as const,
    label: `Poder de classe · ${nex}%`,
    help: "Registre um poder de classe ou escolha Transcender. Transcender substitui o ganho de SAN deste avanço.",
  })),
  ...ATTRIBUTE_NEX.map((nex) => ({
    id: `m-atributo-${nex}`,
    nex,
    kind: "ATRIBUTO" as const,
    label: `Aumento de atributo · ${nex}%`,
    help: "+1 em um atributo, uma única vez neste marco.",
  })),
  ...TRAINING_NEX.map((nex) => ({
    id: `m-treino-${nex}`,
    nex,
    kind: "TREINAMENTO" as const,
    label: `Grau de treinamento · ${nex}%`,
    help: nex === 35 ? "Escolha uma perícia Treinada para virar Veterana." : "Escolha uma perícia Veterana para virar Expert.",
  })),
  { id: "m-versatilidade-50", nex: 50, kind: "VERSATILIDADE", label: "Versatilidade · 50%", help: "Registre a escolha de Versatilidade sem o site inventar seus efeitos." },
  { id: "m-elemento-50", nex: 50, kind: "ELEMENTO", label: "Conexão elemental · 50%", help: "Escolha Sangue, Morte, Conhecimento ou Energia. No modo padrão a escolha fica travada." },
  ...TRAIL_ABILITY_NEX.map((nex) => ({
    id: `m-trilha-hab-${nex}`,
    nex,
    kind: "HABILIDADE_TRILHA" as const,
    label: `Habilidade da trilha · ${nex}%`,
    help: "Confirme o marco da sua trilha. O texto completo da habilidade não é copiado pelo site.",
  })),
].sort((a, b) => a.nex - b.nex || a.label.localeCompare(b.label));

export interface ProgressionChoice {
  id: string;
  milestoneId: string;
  nex: number;
  kind: MilestoneKind;
  value: string;
  transcender?: boolean;
  /** Somente Aprender Ritual (ou escolha explicitamente equivalente) concede slot. */
  grantsRitual?: boolean;
  /** Marca que uma escolha paranormal de NEX 50%+ efetivou a afinidade. */
  activatesAffinity?: boolean;
  note?: string;
  createdAt?: string;
}

export interface KnownRitual {
  id: string;
  ritualId?: string;
  name: string;
  element: RitualElement;
  circle: number;
  legacy?: boolean;
  note?: string;
}

export interface ProgressionState {
  version: number;
  choices: ProgressionChoice[];
  element: ParanormalElement | null;
  elementLocked: boolean;
  knownRituals: KnownRitual[];
  overrides: { pvMax?: number; peMax?: number; sanMax?: number; peRoundLimit?: number };
}

export const PROGRESSION_VERSION = 3;

export function emptyProgression(): ProgressionState {
  return { version: PROGRESSION_VERSION, choices: [], element: null, elementLocked: false, knownRituals: [], overrides: {} };
}

export function normalizeProgression(raw: unknown): ProgressionState {
  const base = emptyProgression();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<ProgressionState>;
  const validElements = new Set(ELEMENTS.map((element) => element.id));
  return {
    version: PROGRESSION_VERSION,
    choices: Array.isArray(data.choices)
      ? data.choices.filter((choice): choice is ProgressionChoice => Boolean(choice && typeof choice.value === "string" && typeof choice.milestoneId === "string"))
      : [],
    element: data.element && validElements.has(data.element) ? data.element : null,
    elementLocked: Boolean(data.elementLocked),
    knownRituals: Array.isArray(data.knownRituals)
      ? data.knownRituals.filter((ritual): ritual is KnownRitual => Boolean(ritual && typeof ritual.name === "string" && Number.isFinite(Number(ritual.circle))))
      : [],
    overrides: { ...(data.overrides ?? {}) },
  };
}

export const baseClassOf = (className: SheetClassName): OrdemBaseClass | null =>
  className === "Combatente" || className === "Especialista" || className === "Ocultista" ? className : null;

export function reachedMilestones(nex: number): MilestoneDef[] {
  const current = normalizeNex(nex);
  return MILESTONES.filter((milestone) => current >= milestone.nex);
}

export function pendingMilestones(nex: number, choices: ProgressionChoice[]): MilestoneDef[] {
  const done = new Set(choices.map((choice) => choice.milestoneId));
  return reachedMilestones(nex).filter((milestone) => !done.has(milestone.id));
}

export function suspendedChoices(nex: number, choices: ProgressionChoice[]): ProgressionChoice[] {
  const current = normalizeNex(nex);
  return choices.filter((choice) => choice.nex > current);
}

export const transcenderChoices = (choices: ProgressionChoice[], nex: number) =>
  choices.filter((choice) => choice.kind === "PODER" && choice.transcender && choice.nex <= normalizeNex(nex));

export interface DerivedResources {
  pvMax: number;
  peMax: number;
  sanMax: number;
  peRoundLimit: number;
  sanLostToTranscender: number;
}

export function derivedResources(params: {
  className: SheetClassName;
  nex: number;
  attributes: Record<OrdemAttribute, number>;
  choices: ProgressionChoice[];
}): DerivedResources | null {
  const cls = baseClassOf(params.className);
  if (!cls) return null;
  const rule = CLASS_RESOURCES[cls];
  const advances = nexAdvances(params.nex);
  const vig = Math.max(0, Number(params.attributes.VIG ?? 0));
  const pre = Math.max(0, Number(params.attributes.PRE ?? 0));
  const transcendedAdvances = new Set(transcenderChoices(params.choices, params.nex).map((choice) => choice.nex));
  const sanLostToTranscender = transcendedAdvances.size * rule.sanPerAdvance;
  return {
    pvMax: Math.max(1, rule.pvBase + vig + advances * (rule.pvPerAdvance + vig)),
    peMax: Math.max(1, rule.peBase + pre + advances * (rule.pePerAdvance + pre)),
    sanMax: Math.max(1, rule.sanBase + advances * rule.sanPerAdvance - sanLostToTranscender),
    peRoundLimit: peRoundLimit(params.nex),
    sanLostToTranscender,
  };
}

/** Preserva a quantidade gasta/dano sofrido ao alterar o máximo. */
export function reconcileCurrent(current: number, oldMax: number, newMax: number): number {
  if (!Number.isFinite(current) || oldMax <= 0) return newMax;
  const spent = Math.max(0, oldMax - current);
  return Math.max(0, Math.min(newMax, newMax - spent));
}

export function ritualSlots(params: { className: SheetClassName; nex: number; choices: ProgressionChoice[] }): number {
  if (baseClassOf(params.className) === "Ocultista") return 3 + nexAdvances(params.nex);
  return params.choices.filter((choice) => choice.nex <= normalizeNex(params.nex) && choice.grantsRitual === true).length;
}

export const hasRitualAccess = (params: { className: SheetClassName; nex: number; choices: ProgressionChoice[] }) =>
  baseClassOf(params.className) === "Ocultista" || ritualSlots(params) > 0;

export function maxRitualCircle(className: SheetClassName, nex: number, access = true): number {
  const current = normalizeNex(nex);
  if (baseClassOf(className) === "Ocultista") {
    if (current >= 85) return 4;
    if (current >= 55) return 3;
    if (current >= 25) return 2;
    return 1;
  }
  if (!access) return 0;
  if (current >= 75) return 3;
  if (current >= 45) return 2;
  return 1;
}

/** Conexão no 50% + escolha paranormal posterior marcada explicitamente. */
export function affinityActive(state: ProgressionState, nex: number): boolean {
  if (!state.element || normalizeNex(nex) < 50) return false;
  return state.choices.some((choice) => choice.nex >= 50 && choice.nex <= normalizeNex(nex) && choice.activatesAffinity === true);
}

export function eligibleTrainingUpgrades(
  milestoneNex: number,
  skills: Record<string, { training: TrainingLevel }>,
): { from: TrainingLevel; to: TrainingLevel; skillIds: string[] } {
  const isExpertStep = milestoneNex >= 70;
  const from: TrainingLevel = isExpertStep ? "VETERANO" : "TREINADO";
  const to: TrainingLevel = isExpertStep ? "EXPERT" : "VETERANO";
  return { from, to, skillIds: Object.entries(skills).filter(([, skill]) => skill.training === from).map(([id]) => id) };
}

export interface ProgressionIssue { level: "erro" | "aviso"; message: string }

export function validateProgression(params: {
  className: SheetClassName;
  trail?: string;
  nex: number;
  attributes: Record<OrdemAttribute, number>;
  skills: Record<string, { training: TrainingLevel }>;
  state: ProgressionState;
  freeMode: boolean;
}): ProgressionIssue[] {
  const issues: ProgressionIssue[] = [];
  const cls = baseClassOf(params.className);
  if (!cls) issues.push({ level: "aviso", message: "Classe custom: automação de recursos e trilha fica desativada." });
  if (cls && params.trail && !TRAILS_BY_CLASS[cls].includes(params.trail)) {
    issues.push({ level: "aviso", message: `A trilha “${params.trail}” não pertence à classe ${cls}. A escolha foi preservada para você resolver.` });
  }
  const pending = pendingMilestones(params.nex, params.state.choices);
  if (pending.length) issues.push({ level: "aviso", message: `${pending.length} escolha(s) de progressão pendente(s).` });
  const suspended = suspendedChoices(params.nex, params.state.choices);
  if (suspended.length) issues.push({ level: "aviso", message: `${suspended.length} escolha(s) acima do NEX atual estão suspensas, mas preservadas.` });

  const slots = ritualSlots({ className: params.className, nex: params.nex, choices: params.state.choices });
  if (!params.freeMode && params.state.knownRituals.length > slots) {
    issues.push({ level: "erro", message: `Rituais conhecidos (${params.state.knownRituals.length}) acima do limite atual (${slots}).` });
  }
  const circle = maxRitualCircle(params.className, params.nex, hasRitualAccess({ className: params.className, nex: params.nex, choices: params.state.choices }));
  const tooHigh = params.state.knownRituals.filter((ritual) => !ritual.legacy && ritual.circle > circle);
  if (!params.freeMode && tooHigh.length) issues.push({ level: "erro", message: `${tooHigh.length} ritual(is) acima do círculo liberado (${circle}º).` });
  return issues;
}
