/**
 * MOTOR DE PROGRESSÃO — Ordem Paranormal (livro base).
 * Funções puras, sem React e sem acesso a estado global.
 * Não usa regras opcionais de Sobrevivendo ao Horror.
 */

import type { OrdemAttribute, TrainingLevel } from "@/data/ordemRules";

export type OrdemBaseClass = "Combatente" | "Especialista" | "Ocultista";
export type SheetClassName = OrdemBaseClass | "Custom";
export type ParanormalElement = "SANGUE" | "MORTE" | "CONHECIMENTO" | "ENERGIA";

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
  pvBase: number; pvPerAdvance: number;
  peBase: number; pePerAdvance: number;
  sanBase: number; sanPerAdvance: number;
}> = {
  Combatente: { pvBase: 20, pvPerAdvance: 4, peBase: 2, pePerAdvance: 2, sanBase: 12, sanPerAdvance: 3 },
  Especialista: { pvBase: 16, pvPerAdvance: 3, peBase: 3, pePerAdvance: 3, sanBase: 16, sanPerAdvance: 4 },
  Ocultista: { pvBase: 12, pvPerAdvance: 2, peBase: 4, pePerAdvance: 4, sanBase: 20, sanPerAdvance: 5 },
};

/* ------------------------------------------------------------------ NEX */

export const NEX_STEPS: number[] = [...Array.from({ length: 19 }, (_, i) => (i + 1) * 5), 99];

export function normalizeNex(raw: number): number {
  const value = Number.isFinite(raw) ? Math.round(raw) : 5;
  if (value >= 99) return 99;
  const snapped = Math.round(value / 5) * 5;
  return Math.min(95, Math.max(5, snapped));
}

/** 5% = 1, 10% = 2, … 95% = 19, 99% = 20 */
export function nexLevel(nex: number): number {
  const n = normalizeNex(nex);
  return n === 99 ? 20 : n / 5;
}

/** Quantos avanços de 5% além do NEX 5% inicial. */
export function nexAdvances(nex: number): number {
  return Math.max(0, nexLevel(nex) - 1);
}

export function peRoundLimit(nex: number): number {
  return nexLevel(nex);
}

export function nextNex(nex: number): number | null {
  const n = normalizeNex(nex);
  const index = NEX_STEPS.indexOf(n);
  return index >= 0 && index < NEX_STEPS.length - 1 ? NEX_STEPS[index + 1]! : null;
}

export function previousNex(nex: number): number | null {
  const n = normalizeNex(nex);
  const index = NEX_STEPS.indexOf(n);
  return index > 0 ? NEX_STEPS[index - 1]! : null;
}

/* --------------------------------------------------------------- Marcos */

export type MilestoneKind =
  | "TRILHA"
  | "HABILIDADE_TRILHA"
  | "PODER"
  | "ATRIBUTO"
  | "TREINAMENTO"
  | "VERSATILIDADE"
  | "ELEMENTO"
  | "RITUAL";

export interface MilestoneDef {
  id: string;
  nex: number;
  kind: MilestoneKind;
  label: string;
  help: string;
}

const TRAIL_ABILITY_NEX = [10, 40, 65, 99];
const CLASS_POWER_NEX = [15, 30, 45, 60, 75, 90];
const ATTRIBUTE_NEX = [20, 50, 80, 95];
const TRAINING_NEX = [35, 70];

export const MILESTONES: MilestoneDef[] = [
  { id: "m-trilha-10", nex: 10, kind: "TRILHA", label: "Escolher trilha", help: "A trilha define a especialização da classe e é escolhida no NEX 10%." },
  ...TRAIL_ABILITY_NEX.map((nex) => ({
    id: `m-trilha-hab-${nex}`,
    nex,
    kind: "HABILIDADE_TRILHA" as MilestoneKind,
    label: `Habilidade de trilha (${nex}%)`,
    help: "Registre a habilidade de trilha obtida neste marco.",
  })),
  ...CLASS_POWER_NEX.map((nex) => ({
    id: `m-poder-${nex}`,
    nex,
    kind: "PODER" as MilestoneKind,
    label: `Poder de classe (${nex}%)`,
    help: "Escolha um poder de classe. Transcender também é escolhido aqui e substitui o ganho de SAN deste avanço.",
  })),
  ...ATTRIBUTE_NEX.map((nex) => ({
    id: `m-atributo-${nex}`,
    nex,
    kind: "ATRIBUTO" as MilestoneKind,
    label: `Aumento de atributo (${nex}%)`,
    help: "+1 em um atributo à sua escolha.",
  })),
  ...TRAINING_NEX.map((nex) => ({
    id: `m-treino-${nex}`,
    nex,
    kind: "TREINAMENTO" as MilestoneKind,
    label: `Grau de treinamento (${nex}%)`,
    help: nex === 35 ? "Treinado → Veterano em uma perícia treinada." : "Veterano → Expert em uma perícia veterana.",
  })),
  { id: "m-versatilidade-50", nex: 50, kind: "VERSATILIDADE", label: "Versatilidade (50%)", help: "Registre a escolha de versatilidade." },
  { id: "m-elemento-50", nex: 50, kind: "ELEMENTO", label: "Conexão elemental (50%)", help: "Escolha Sangue, Morte, Conhecimento ou Energia. No modo padrão a escolha é definitiva." },
];

/* ------------------------------------------------------- Escolhas feitas */

export interface ProgressionChoice {
  id: string;
  milestoneId: string;
  nex: number;
  kind: MilestoneKind;
  /** nome do poder/trilha, id de perícia, id de atributo ou nome do ritual */
  value: string;
  /** poder de classe escolhido como Transcender (não ganha SAN daquele avanço) */
  transcender?: boolean;
  note?: string;
  createdAt?: string;
}

export interface ProgressionState {
  version: number;
  choices: ProgressionChoice[];
  element: ParanormalElement | null;
  elementLocked: boolean;
  /** rituais conhecidos por nome (catálogo ou legado manual) */
  knownRituals: Array<{ id: string; name: string; element: ParanormalElement | "NEUTRO"; circle: number; legacy?: boolean; note?: string }>;
  /** override manual apenas em modo livre */
  overrides: { pvMax?: number; peMax?: number; sanMax?: number; peRoundLimit?: number };
}

export const PROGRESSION_VERSION = 2;

export function emptyProgression(): ProgressionState {
  return { version: PROGRESSION_VERSION, choices: [], element: null, elementLocked: false, knownRituals: [], overrides: {} };
}

export function normalizeProgression(raw: unknown): ProgressionState {
  const base = emptyProgression();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<ProgressionState>;
  return {
    version: PROGRESSION_VERSION,
    choices: Array.isArray(data.choices) ? data.choices.filter((c) => c && typeof c.value === "string") : [],
    element: data.element ?? null,
    elementLocked: Boolean(data.elementLocked),
    knownRituals: Array.isArray(data.knownRituals) ? data.knownRituals : [],
    overrides: { ...(data.overrides ?? {}) },
  };
}

export const baseClassOf = (className: SheetClassName): OrdemBaseClass | null =>
  className === "Combatente" || className === "Especialista" || className === "Ocultista" ? className : null;

/** Marcos já atingidos pelo NEX atual. */
export function reachedMilestones(nex: number): MilestoneDef[] {
  const n = normalizeNex(nex);
  return MILESTONES.filter((m) => n >= m.nex).sort((a, b) => a.nex - b.nex);
}

export function pendingMilestones(nex: number, choices: ProgressionChoice[]): MilestoneDef[] {
  const done = new Set(choices.map((c) => c.milestoneId));
  return reachedMilestones(nex).filter((m) => !done.has(m.id));
}

/** Escolhas registradas acima do NEX atual (NEX reduzido em modo mestre). */
export function suspendedChoices(nex: number, choices: ProgressionChoice[]): ProgressionChoice[] {
  const n = normalizeNex(nex);
  return choices.filter((c) => c.nex > n);
}

export const transcenderCount = (choices: ProgressionChoice[], nex: number) =>
  choices.filter((c) => c.kind === "PODER" && c.transcender && c.nex <= normalizeNex(nex)).length;

/* ------------------------------------------------------- Recursos deriv. */

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
  const r = CLASS_RESOURCES[cls];
  const advances = nexAdvances(params.nex);
  const vig = Number(params.attributes.VIG ?? 0);
  const pre = Number(params.attributes.PRE ?? 0);
  const transcender = transcenderCount(params.choices, params.nex);
  const sanLostToTranscender = transcender * r.sanPerAdvance;
  return {
    pvMax: Math.max(1, r.pvBase + vig + advances * (r.pvPerAdvance + vig)),
    peMax: Math.max(1, r.peBase + pre + advances * (r.pePerAdvance + pre)),
    sanMax: Math.max(1, r.sanBase + advances * r.sanPerAdvance - sanLostToTranscender),
    peRoundLimit: peRoundLimit(params.nex),
    sanLostToTranscender,
  };
}

/**
 * Aplica um novo máximo preservando o dano/gasto já sofrido.
 * Implementação escolhida: mantém a DIFERENÇA (máximo − atual) constante,
 * limitada a 0..novoMáximo. Nunca zera o recurso silenciosamente.
 */
export function reconcileCurrent(current: number, oldMax: number, newMax: number): number {
  if (!Number.isFinite(current) || oldMax <= 0) return newMax;
  const spent = Math.max(0, oldMax - current);
  return Math.max(0, Math.min(newMax, newMax - spent));
}

/* ------------------------------------------------------------- Rituais */

export function maxRitualCircle(className: SheetClassName, nex: number, hasRitualAccess: boolean): number {
  const n = normalizeNex(nex);
  if (baseClassOf(className) === "Ocultista") {
    if (n >= 85) return 4;
    if (n >= 55) return 3;
    if (n >= 25) return 2;
    return 1;
  }
  if (!hasRitualAccess) return 0;
  if (n >= 75) return 3;
  if (n >= 45) return 2;
  return 1;
}

/** Quantos rituais o personagem pode conhecer. */
export function ritualSlots(params: { className: SheetClassName; nex: number; choices: ProgressionChoice[] }): number {
  if (baseClassOf(params.className) === "Ocultista") return 3 + nexAdvances(params.nex);
  // Combatente/Especialista só ganham conhecimento de ritual por escolhas explícitas.
  return params.choices.filter(
    (c) => c.nex <= normalizeNex(params.nex) && (c.kind === "PODER" || c.kind === "HABILIDADE_TRILHA") && /transcender|ritual/i.test(`${c.value} ${c.note ?? ""}`),
  ).length;
}

export const hasRitualAccess = (params: { className: SheetClassName; nex: number; choices: ProgressionChoice[] }) =>
  baseClassOf(params.className) === "Ocultista" || ritualSlots(params) > 0;

/** Afinidade elemental efetivada: conexão no 50% + poder paranormal/Transcender em NEX 50%+. */
export function affinityActive(state: ProgressionState, nex: number): boolean {
  if (!state.element) return false;
  const n = normalizeNex(nex);
  if (n < 50) return false;
  return state.choices.some((c) => c.nex >= 50 && c.nex <= n && (c.transcender || c.kind === "RITUAL" || /paranormal|transcender/i.test(`${c.value} ${c.note ?? ""}`)));
}

/* ---------------------------------------------------------- Validações */

export interface ProgressionIssue { level: "erro" | "aviso"; message: string }

export function validateProgression(params: {
  className: SheetClassName;
  nex: number;
  attributes: Record<OrdemAttribute, number>;
  skills: Record<string, { training: TrainingLevel }>;
  state: ProgressionState;
  freeMode: boolean;
}): ProgressionIssue[] {
  const issues: ProgressionIssue[] = [];
  const { state, freeMode } = params;
  if (!baseClassOf(params.className)) {
    issues.push({ level: "aviso", message: "Classe custom: os recursos derivados não podem ser calculados automaticamente. Use o modo livre." });
  }
  const pend = pendingMilestones(params.nex, state.choices);
  if (pend.length) issues.push({ level: "aviso", message: `${pend.length} escolha(s) de progressão pendente(s).` });

  const suspended = suspendedChoices(params.nex, state.choices);
  if (suspended.length) issues.push({ level: "aviso", message: `${suspended.length} escolha(s) acima do NEX atual estão suspensas (não foram apagadas).` });

  const slots = ritualSlots({ className: params.className, nex: params.nex, choices: state.choices });
  const known = state.knownRituals.length;
  if (!freeMode && known > slots) issues.push({ level: "erro", message: `Rituais conhecidos (${known}) acima do limite (${slots}).` });

  const circle = maxRitualCircle(params.className, params.nex, hasRitualAccess({ className: params.className, nex: params.nex, choices: state.choices }));
  const tooHigh = state.knownRituals.filter((r) => !r.legacy && r.circle > circle);
  if (!freeMode && tooHigh.length) issues.push({ level: "erro", message: `${tooHigh.length} ritual(is) acima do círculo liberado (${circle}º).` });

  if (!freeMode) {
    const overCap = Object.entries(params.attributes).filter(([, v]) => Number(v) > 5);
    if (overCap.length) issues.push({ level: "aviso", message: "Algum atributo passou de 5; confirme se isso é intencional (modo livre)." });
  }
  return issues;
}

/** Perícias elegíveis para o marco de treinamento no NEX indicado. */
export function eligibleTrainingUpgrades(
  nex: number,
  skills: Record<string, { training: TrainingLevel }>,
): { from: TrainingLevel; to: TrainingLevel; skillIds: string[] } {
  const target = normalizeNex(nex) >= 70 ? { from: "VETERANO" as TrainingLevel, to: "EXPERT" as TrainingLevel } : { from: "TREINADO" as TrainingLevel, to: "VETERANO" as TrainingLevel };
  const skillIds = Object.entries(skills).filter(([, s]) => s.training === target.from).map(([id]) => id);
  return { ...target, skillIds };
}
