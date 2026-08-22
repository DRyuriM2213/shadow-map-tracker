/**
 * Motor de progressão automática da ficha do Berço Mestre.
 *
 * O objetivo deste arquivo é manter regras estruturais e cálculos da ficha
 * separados da interface. Textos extensos do livro não são reproduzidos.
 */
import type { OrdemAttribute, TrainingLevel } from "@/data/ordemRules";

export type OrdemBaseClass = "Combatente" | "Especialista" | "Ocultista";
export type SheetClassName = OrdemBaseClass | "Custom" | "Não definida";
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

/**
 * Regras de perícia usadas no modo padrão.
 * fixed: perícias automáticas da classe.
 * requiredGroups: uma escolha obrigatória em cada grupo.
 * freeBase: quantidade livre antes de somar INT.
 * degreeBase: quantidade que pode subir de grau nos marcos 35% e 70% antes de somar INT.
 */
export interface ClassSkillRule {
  fixed: string[];
  requiredGroups: string[][];
  freeBase: number;
  degreeBase: number;
}

export const CLASS_SKILL_RULES: Record<OrdemBaseClass, ClassSkillRule> = {
  Combatente: {
    fixed: [],
    requiredGroups: [["luta", "pontaria"], ["fortitude", "reflexos"]],
    freeBase: 1,
    degreeBase: 2,
  },
  Especialista: {
    fixed: [],
    requiredGroups: [],
    freeBase: 7,
    degreeBase: 5,
  },
  Ocultista: {
    fixed: ["ocultismo", "vontade"],
    requiredGroups: [],
    freeBase: 3,
    degreeBase: 3,
  },
};

export function initialFreeSkillAllowance(className: SheetClassName, intelligence: number) {
  const cls = baseClassOf(className);
  if (!cls) return 0;
  return Math.max(0, CLASS_SKILL_RULES[cls].freeBase + Math.max(0, Math.trunc(intelligence)));
}

export function degreeTrainingAllowance(className: SheetClassName, intelligence: number) {
  const cls = baseClassOf(className);
  if (!cls) return 0;
  return Math.max(0, CLASS_SKILL_RULES[cls].degreeBase + Math.max(0, Math.trunc(intelligence)));
}

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

/* ------------------------------------------------------------------ NEX */

export const NEX_STEPS: number[] = [0, ...Array.from({ length: 19 }, (_, i) => (i + 1) * 5), 99];

export function normalizeNex(raw: number): number {
  const value = Number.isFinite(raw) ? Math.round(raw) : 0;
  if (value <= 2) return 0;
  if (value >= 97) return 99;
  return Math.min(95, Math.max(5, Math.round(value / 5) * 5));
}

/** 0%=0, 5%=1, 10%=2 ... 95%=19 e 99%=20. */
export function nexLevel(nex: number): number {
  const value = normalizeNex(nex);
  if (value === 0) return 0;
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

/* -------------------------------------------------------- Grau de perícia */

export const TRAINING_ORDER: TrainingLevel[] = ["DESTREINADO", "TREINADO", "VETERANO", "EXPERT"];

export function trainingRank(level: TrainingLevel) {
  return TRAINING_ORDER.indexOf(level);
}

export function maxTrainingLevelForNex(nex: number): TrainingLevel {
  const value = normalizeNex(nex);
  if (value >= 70) return "EXPERT";
  if (value >= 35) return "VETERANO";
  return "TREINADO";
}

export function nextTrainingLevel(level: TrainingLevel): TrainingLevel | null {
  const index = TRAINING_ORDER.indexOf(level);
  return index >= 0 && index < TRAINING_ORDER.length - 1 ? TRAINING_ORDER[index + 1]! : null;
}

export function canAdvanceTraining(level: TrainingLevel, nex: number) {
  const next = nextTrainingLevel(level);
  if (!next) return false;
  return trainingRank(next) <= trainingRank(maxTrainingLevelForNex(nex));
}

export function trainingUnlockMessage(level: TrainingLevel, nex: number) {
  if (level === "EXPERT") return "Grau máximo alcançado (+15).";
  const next = nextTrainingLevel(level);
  if (next === "TREINADO") return "Pode se tornar Treinado (+5) quando houver uma fonte de treinamento.";
  if (next === "VETERANO" && normalizeNex(nex) < 35) return "Veterano (+10) libera em NEX 35%.";
  if (next === "EXPERT" && normalizeNex(nex) < 70) return "Expert (+15) libera em NEX 70%.";
  return `Pode avançar para ${next}.`;
}

/* --------------------------------------------------------------- Marcos */

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

const milestone = (id: string, nex: number, kind: MilestoneKind, label: string, help: string): MilestoneDef => ({ id, nex, kind, label, help });

export const MILESTONES: MilestoneDef[] = [
  milestone("m-trilha-10", 10, "TRILHA", "Escolher trilha", "Escolha uma trilha da sua classe. O primeiro marco de trilha vem junto desta escolha."),
  ...[15, 30, 45, 60, 75, 90].map((nex) => milestone(`m-poder-${nex}`, nex, "PODER", `Poder de classe · ${nex}%`, "Registre um poder de classe ou Transcender.")),
  ...[20, 50, 80, 95].map((nex) => milestone(`m-atributo-${nex}`, nex, "ATRIBUTO", `Aumento de atributo · ${nex}%`, "+1 em um atributo, uma única vez neste marco.")),
  milestone("m-treino-35", 35, "TREINAMENTO", "Grau de treinamento · 35%", "Eleve várias perícias Treinadas para Veteranas conforme sua classe + Intelecto."),
  milestone("m-treino-70", 70, "TREINAMENTO", "Grau de treinamento · 70%", "Eleve várias perícias em um grau; Expert (+15) passa a estar disponível."),
  milestone("m-versatilidade-50", 50, "VERSATILIDADE", "Versatilidade · 50%", "Registre sua escolha sem o site inventar seus efeitos."),
  milestone("m-elemento-50", 50, "ELEMENTO", "Conexão elemental · 50%", "Escolha Sangue, Morte, Conhecimento ou Energia."),
  ...[40, 65, 99].map((nex) => milestone(`m-trilha-hab-${nex}`, nex, "HABILIDADE_TRILHA", `Habilidade da trilha · ${nex}%`, "Confirme o marco da trilha; o texto completo não é copiado pelo site.")),
].sort((a, b) => a.nex - b.nex || a.label.localeCompare(b.label));

/* ------------------------------------------------------- Estado persistido */

export type CreationStatus = "NOVA" | "LEGADA" | "CONCLUIDA";

export interface CreationState {
  status: CreationStatus;
  classAtCreation: OrdemBaseClass | null;
  initialInt: number | null;
  /** Maior INT permanente já reconhecido para bônus de novas perícias. */
  maxIntGranted: number | null;
  mandatorySkills: string[];
  initialFreeSkills: string[];
  bonusIntSkills: string[];
  completedAt?: string;
}

export interface SkillTrainingGrant {
  id: string;
  source: "INT_BONUS" | "POWER";
  sourceId?: string;
  nex: number;
  skillId: string;
  from: TrainingLevel;
  to: TrainingLevel;
  createdAt: string;
}

export interface ProgressionChoice {
  id: string;
  milestoneId: string;
  nex: number;
  kind: MilestoneKind;
  value: string;
  transcender?: boolean;
  grantsRitual?: boolean;
  /** Treinamento em Perícia concede duas elevações separadas do Grau de Treinamento. */
  grantsSkillTraining?: number;
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
  creation: CreationState;
  skillTrainingGrants: SkillTrainingGrant[];
  overrides: { pvMax?: number; peMax?: number; sanMax?: number; peRoundLimit?: number };
}

export const PROGRESSION_VERSION = 4;

export function emptyCreation(): CreationState {
  return {
    status: "NOVA",
    classAtCreation: null,
    initialInt: null,
    maxIntGranted: null,
    mandatorySkills: [],
    initialFreeSkills: [],
    bonusIntSkills: [],
  };
}

export function emptyProgression(): ProgressionState {
  return {
    version: PROGRESSION_VERSION,
    choices: [],
    element: null,
    elementLocked: false,
    knownRituals: [],
    creation: emptyCreation(),
    skillTrainingGrants: [],
    overrides: {},
  };
}

export function normalizeProgression(raw: unknown): ProgressionState {
  const base = emptyProgression();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<ProgressionState>;
  const allowed = new Set(ELEMENTS.map((element) => element.id));
  const creationRaw = data.creation && typeof data.creation === "object" ? data.creation : undefined;
  const creation: CreationState = {
    ...base.creation,
    ...(creationRaw ?? {}),
    mandatorySkills: Array.isArray(creationRaw?.mandatorySkills) ? creationRaw.mandatorySkills.filter((value): value is string => typeof value === "string") : [],
    initialFreeSkills: Array.isArray(creationRaw?.initialFreeSkills) ? creationRaw.initialFreeSkills.filter((value): value is string => typeof value === "string") : [],
    bonusIntSkills: Array.isArray(creationRaw?.bonusIntSkills) ? creationRaw.bonusIntSkills.filter((value): value is string => typeof value === "string") : [],
  };

  return {
    version: PROGRESSION_VERSION,
    choices: Array.isArray(data.choices)
      ? data.choices.filter((choice): choice is ProgressionChoice => Boolean(choice && typeof choice.value === "string" && typeof choice.milestoneId === "string"))
      : [],
    element: data.element && allowed.has(data.element) ? data.element : null,
    elementLocked: Boolean(data.elementLocked),
    knownRituals: Array.isArray(data.knownRituals)
      ? data.knownRituals.filter((ritual): ritual is KnownRitual => Boolean(ritual && typeof ritual.name === "string" && Number.isFinite(Number(ritual.circle))))
      : [],
    creation,
    skillTrainingGrants: Array.isArray(data.skillTrainingGrants)
      ? data.skillTrainingGrants.filter((grant): grant is SkillTrainingGrant => Boolean(grant && typeof grant.skillId === "string" && typeof grant.from === "string" && typeof grant.to === "string"))
      : [],
    overrides: { ...(data.overrides ?? {}) },
  };
}

export const baseClassOf = (className: SheetClassName): OrdemBaseClass | null =>
  className === "Combatente" || className === "Especialista" || className === "Ocultista" ? className : null;

export function reachedMilestones(nex: number) {
  const current = normalizeNex(nex);
  return MILESTONES.filter((milestoneDef) => current >= milestoneDef.nex);
}

export function pendingMilestones(nex: number, choices: ProgressionChoice[]) {
  const done = new Set(choices.map((choice) => choice.milestoneId));
  return reachedMilestones(nex).filter((milestoneDef) => !done.has(milestoneDef.id));
}

export function suspendedChoices(nex: number, choices: ProgressionChoice[]) {
  const current = normalizeNex(nex);
  return choices.filter((choice) => choice.nex > current);
}

export const transcenderChoices = (choices: ProgressionChoice[], nex: number) =>
  choices.filter((choice) => choice.kind === "PODER" && choice.transcender && choice.nex <= normalizeNex(nex));

/* ------------------------------------------------------- Recursos derivados */

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
  if (normalizeNex(params.nex) === 0) return null;
  const cls = baseClassOf(params.className);
  if (!cls) return null;
  const rule = CLASS_RESOURCES[cls];
  const advances = nexAdvances(params.nex);
  const vig = Math.max(0, Number(params.attributes.VIG ?? 0));
  const pre = Math.max(0, Number(params.attributes.PRE ?? 0));
  const transcended = new Set(transcenderChoices(params.choices, params.nex).map((choice) => choice.nex));
  const sanLostToTranscender = transcended.size * rule.sanPerAdvance;
  return {
    pvMax: Math.max(1, rule.pvBase + vig + advances * (rule.pvPerAdvance + vig)),
    peMax: Math.max(1, rule.peBase + pre + advances * (rule.pePerAdvance + pre)),
    sanMax: Math.max(1, rule.sanBase + advances * rule.sanPerAdvance - sanLostToTranscender),
    peRoundLimit: peRoundLimit(params.nex),
    sanLostToTranscender,
  };
}

/** Preserva a quantidade gasta/dano sofrido ao alterar o máximo. */
export function reconcileCurrent(current: number, oldMax: number, newMax: number) {
  if (!Number.isFinite(current) || oldMax <= 0) return newMax;
  const spent = Math.max(0, oldMax - current);
  return Math.max(0, Math.min(newMax, newMax - spent));
}

/* ------------------------------------------------------------- Rituais */

export function ritualSlots(params: { className: SheetClassName; nex: number; choices: ProgressionChoice[] }) {
  if (normalizeNex(params.nex) === 0) return 0;
  if (baseClassOf(params.className) === "Ocultista") return 3 + nexAdvances(params.nex);
  return params.choices.filter((choice) => choice.nex <= normalizeNex(params.nex) && choice.grantsRitual === true).length;
}

export const hasRitualAccess = (params: { className: SheetClassName; nex: number; choices: ProgressionChoice[] }) =>
  baseClassOf(params.className) === "Ocultista" || ritualSlots(params) > 0;

export function maxRitualCircle(className: SheetClassName, nex: number, access = true) {
  const current = normalizeNex(nex);
  if (current === 0) return 0;
  if (baseClassOf(className) === "Ocultista") return current >= 85 ? 4 : current >= 55 ? 3 : current >= 25 ? 2 : 1;
  if (!access) return 0;
  return current >= 75 ? 3 : current >= 45 ? 2 : 1;
}

export function affinityActive(state: ProgressionState, nex: number) {
  return Boolean(state.element && normalizeNex(nex) >= 50 && state.choices.some((choice) => choice.nex >= 50 && choice.nex <= normalizeNex(nex) && choice.activatesAffinity === true));
}

/* ---------------------------------------------------------- Treinamentos */

export function degreeTrainingCandidates(
  milestoneNex: 35 | 70,
  skills: Record<string, { training: TrainingLevel }>,
) {
  return Object.entries(skills)
    .filter(([, skill]) => milestoneNex === 35 ? skill.training === "TREINADO" : skill.training === "TREINADO" || skill.training === "VETERANO")
    .map(([skillId, skill]) => ({ skillId, from: skill.training, to: nextTrainingLevel(skill.training)! }))
    .filter((entry) => entry.to && trainingRank(entry.to) <= trainingRank(maxTrainingLevelForNex(milestoneNex)));
}

export function powerTrainingCandidates(nex: number, skills: Record<string, { training: TrainingLevel }>) {
  return Object.entries(skills)
    .filter(([, skill]) => skill.training !== "EXPERT" && canAdvanceTraining(skill.training, nex))
    .map(([skillId, skill]) => ({ skillId, from: skill.training, to: nextTrainingLevel(skill.training)! }));
}

export function remainingPowerTrainingSlots(choice: ProgressionChoice, grants: SkillTrainingGrant[]) {
  const total = Math.max(0, choice.grantsSkillTraining ?? 0);
  const used = grants.filter((grant) => grant.source === "POWER" && grant.sourceId === choice.id).length;
  return Math.max(0, total - used);
}

export function bonusIntSkillAllowance(state: ProgressionState, currentInt: number) {
  const initial = state.creation.initialInt;
  if (initial === null) return 0;
  const peak = Math.max(initial, state.creation.maxIntGranted ?? initial, Math.trunc(currentInt));
  return Math.max(0, peak - initial);
}

export function remainingBonusIntSkills(state: ProgressionState, currentInt: number) {
  return Math.max(0, bonusIntSkillAllowance(state, currentInt) - state.creation.bonusIntSkills.length);
}

/* ---------------------------------------------------------- Validações */

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
  const currentNex = normalizeNex(params.nex);
  const cls = baseClassOf(params.className);

  if (currentNex === 0 && params.state.creation.status !== "CONCLUIDA") {
    issues.push({ level: "aviso", message: "Personagem em NEX 0%: conclua a criação guiada para entrar em NEX 5%." });
    return issues;
  }
  if (!cls) issues.push({ level: "aviso", message: "Classe custom/indefinida: automação de recursos e trilha fica desativada." });
  if (cls && params.trail && !TRAILS_BY_CLASS[cls].includes(params.trail)) {
    issues.push({ level: "aviso", message: `A trilha “${params.trail}” não pertence à classe ${cls}. A escolha foi preservada.` });
  }

  const pending = pendingMilestones(params.nex, params.state.choices);
  if (pending.length) issues.push({ level: "aviso", message: `${pending.length} escolha(s) de progressão pendente(s).` });
  const suspended = suspendedChoices(params.nex, params.state.choices);
  if (suspended.length) issues.push({ level: "aviso", message: `${suspended.length} escolha(s) acima do NEX atual estão suspensas, mas preservadas.` });

  const cap = maxTrainingLevelForNex(params.nex);
  const illegalTraining = Object.values(params.skills).filter((skill) => trainingRank(skill.training) > trainingRank(cap));
  if (!params.freeMode && illegalTraining.length) {
    issues.push({ level: "erro", message: `${illegalTraining.length} perícia(s) estão acima do grau máximo permitido no NEX atual (${cap}).` });
  }

  const slots = ritualSlots({ className: params.className, nex: params.nex, choices: params.state.choices });
  if (!params.freeMode && params.state.knownRituals.length > slots) {
    issues.push({ level: "erro", message: `Rituais conhecidos (${params.state.knownRituals.length}) acima do limite atual (${slots}).` });
  }
  const circle = maxRitualCircle(params.className, params.nex, hasRitualAccess({ className: params.className, nex: params.nex, choices: params.state.choices }));
  const tooHigh = params.state.knownRituals.filter((ritual) => !ritual.legacy && ritual.circle > circle);
  if (!params.freeMode && tooHigh.length) issues.push({ level: "erro", message: `${tooHigh.length} ritual(is) acima do círculo liberado (${circle}º).` });
  return issues;
}
