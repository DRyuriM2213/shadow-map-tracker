export type RouteColor =
  | "amarelo"
  | "azul"
  | "verde"
  | "roxo"
  | "vermelho"
  | "cinza"
  | "verde-claro"
  | "preto";

export type ClueImportance = "ambiental" | "secundaria" | "importante" | "obrigatoria";

export type ClueStatus =
  | "escondida"
  | "disponivel"
  | "encontrada"
  | "encontrada-parcialmente"
  | "interpretada"
  | "nao-interpretada"
  | "perdida"
  | "destruida"
  | "removida"
  | "contingencia";

export type LocationStatus =
  | "nao-visitada"
  | "disponivel"
  | "investigando"
  | "investigada-parcial"
  | "investigada-completa"
  | "bloqueada"
  | "isolada"
  | "inacessivel"
  | "revisitavel";

export type RouteStatus = "disponivel" | "escolhida" | "ignorada" | "indisponivel" | "adiada";

export interface Player {
  id: string;
  playerName: string;
  characterName: string;
  role: string;
  status: string;
  notes: string;
  isPending: boolean;
}

export interface TestDef {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  suggestedCharacters: string;
  advantages: string;
  disadvantages: string;
  success: string;
  partialSuccess: string;
  failure: string;
  criticalFailure: string;
  fallback: string;
  clueId?: string | undefined;
}

export interface Clue {
  id: string;
  name: string;
  category: string;
  playerDescription: string;
  masterMeaning: string;
  mainLocationId: string;
  alternativeLocationIds: string[];
  dayAvailable: 1 | 2;
  prerequisites: string;
  actionRequired: string;
  testId?: string | undefined;
  successResult: string;
  failureResult: string;
  consequenceIds: string[];
  relatedClueIds: string[];
  unlocks: string;
  importance: ClueImportance;
  fallbackOptions: string[];
  route: RouteColor;
}

export interface CampaignLocation {
  id: string;
  name: string;
  sector: string;
  description: string;
  availability: string;
  dayAvailable: (1 | 2)[];
  recommendedTime: string;
  prerequisites: string;
  people: string[];
  connectedLocations: string[];
  actions: string[];
  clueIds: string[];
  testIds: string[];
  risks: string[];
  consequences: string[];
  route: RouteColor;
}

export interface Choice {
  id: string;
  title: string;
  description: string;
  routeColor: RouteColor;
  requirements?: string | undefined;
  effects?: string | undefined;
  nextSceneId: string;
}

export interface Scene {
  id: string;
  title: string;
  day: 1 | 2;
  time: string;
  locationId?: string | undefined;
  sceneType: "abertura" | "exploracao" | "decisao" | "evento" | "convergencia" | "encerramento";
  mandatory: boolean;
  masterDescription: string;
  narrationText: string;
  prerequisites: string;
  mandatoryEvents: string[];
  actions: string[];
  clueIds: string[];
  testIds: string[];
  risks: string[];
  masterSecrets: string[];
  consequenceIds: string[];
  fallback: string;
  choices: Choice[];
  nextSceneIds: string[];
  route: RouteColor;
}

export type ConsequenceType =
  | "imediata"
  | "atrasada"
  | "condicional"
  | "permanente"
  | "reversivel"
  | "institucional"
  | "social"
  | "investigativa";

export interface Consequence {
  id: string;
  name: string;
  type: ConsequenceType;
  cause: string;
  triggerTime: string;
  conditions: string;
  effect: string;
  duration: string;
  affectedLocations: string[];
  affectedClues: string[];
  affectedCharacters: string[];
  day: 1 | 2;
}

export interface TimelineEvent {
  id: string;
  day: 1 | 2;
  time: string;
  title: string;
  description: string;
  mandatory: boolean;
}

export interface LogEntry {
  id: string;
  day: 1 | 2;
  time: string;
  actionType: string;
  description: string;
  detail?: string | undefined;
  route?: RouteColor | undefined;
  createdAt: string;
}

export interface MasterNote {
  id: string;
  targetType: string;
  targetId: string;
  text: string;
  day: 1 | 2;
  time: string;
  createdAt: string;
}

export interface ScheduledConsequence {
  id: string;
  consequenceId: string;
  day: 1 | 2;
  time: string;
  status: "pendente" | "ativada" | "cancelada" | "adiada";
}
