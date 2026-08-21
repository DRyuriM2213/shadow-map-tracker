/**
 * Catálogo de rituais usado apenas para seleção e validação da ficha.
 * Mantém nome, elemento e círculo — sem reproduzir descrições extensas do livro.
 */

import type { ParanormalElement, RitualElement } from "@/data/ordemProgression";

export interface RitualDef {
  id: string;
  name: string;
  element: Exclude<RitualElement, "NEUTRO">;
  circle: 1 | 2 | 3 | 4;
}

export function normalizeRitualName(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const r = (name: string, element: RitualDef["element"], circle: RitualDef["circle"]): RitualDef => ({
  id: `${normalizeRitualName(name)}-${element.toLowerCase()}`,
  name,
  element,
  circle,
});

export const RITUALS: RitualDef[] = [
  // 1º círculo — Conhecimento
  r("Amaldiçoar Arma", "CONHECIMENTO", 1), r("Compreensão Paranormal", "CONHECIMENTO", 1), r("Enfeitiçar", "CONHECIMENTO", 1),
  r("Perturbação", "CONHECIMENTO", 1), r("Ouvir os Sussurros", "CONHECIMENTO", 1), r("Tecer Ilusão", "CONHECIMENTO", 1), r("Terceiro Olho", "CONHECIMENTO", 1),
  // 1º círculo — Energia
  r("Amaldiçoar Arma", "ENERGIA", 1), r("Amaldiçoar Tecnologia", "ENERGIA", 1), r("Coincidência Forçada", "ENERGIA", 1), r("Eletrocussão", "ENERGIA", 1),
  r("Embaralhar", "ENERGIA", 1), r("Luz", "ENERGIA", 1), r("Polarização Caótica", "ENERGIA", 1),
  // 1º círculo — Morte
  r("Amaldiçoar Arma", "MORTE", 1), r("Cicatrização", "MORTE", 1), r("Consumir Manancial", "MORTE", 1), r("Decadência", "MORTE", 1),
  r("Definhar", "MORTE", 1), r("Espirais da Perdição", "MORTE", 1), r("Nuvem de Cinzas", "MORTE", 1),
  // 1º círculo — Sangue / Medo
  r("Amaldiçoar Arma", "SANGUE", 1), r("Arma Atroz", "SANGUE", 1), r("Armadura de Sangue", "SANGUE", 1), r("Corpo Adaptado", "SANGUE", 1),
  r("Distorcer Aparência", "SANGUE", 1), r("Fortalecimento Sensorial", "SANGUE", 1), r("Ódio Incontrolável", "SANGUE", 1), r("Cinerária", "MEDO", 1),

  // 2º círculo
  r("Aprimorar Mente", "CONHECIMENTO", 2), r("Detecção de Ameaças", "CONHECIMENTO", 2), r("Esconder dos Olhos", "CONHECIMENTO", 2), r("Invadir Mente", "CONHECIMENTO", 2), r("Localização", "CONHECIMENTO", 2),
  r("Chamas do Caos", "ENERGIA", 2), r("Contenção Fantasmagórica", "ENERGIA", 2), r("Dissonância Acústica", "ENERGIA", 2), r("Sopro do Caos", "ENERGIA", 2), r("Tela de Ruído", "ENERGIA", 2),
  r("Desacelerar Impacto", "MORTE", 2), r("Eco Espiral", "MORTE", 2), r("Paradoxo", "MORTE", 2), r("Miasma Entrópico", "MORTE", 2), r("Velocidade Mortal", "MORTE", 2),
  r("Aprimorar Físico", "SANGUE", 2), r("Descarnar", "SANGUE", 2), r("Flagelo de Sangue", "SANGUE", 2), r("Hemofagia", "SANGUE", 2), r("Transfusão Vital", "SANGUE", 2),
  r("Proteção contra Rituais", "MEDO", 2), r("Rejeitar Névoa", "MEDO", 2),

  // 3º círculo
  r("Alterar Memória", "CONHECIMENTO", 3), r("Contato Paranormal", "CONHECIMENTO", 3), r("Mergulho Mental", "CONHECIMENTO", 3), r("Vidência", "CONHECIMENTO", 3),
  r("Convocação Instantânea", "ENERGIA", 3), r("Salto Fantasma", "ENERGIA", 3), r("Transfigurar Água", "ENERGIA", 3), r("Transfigurar Terra", "ENERGIA", 3),
  r("Âncora Temporal", "MORTE", 3), r("Poeira da Podridão", "MORTE", 3), r("Tentáculos de Lodo", "MORTE", 3), r("Zerar Entropia", "MORTE", 3),
  r("Ferver Sangue", "SANGUE", 3), r("Forma Monstruosa", "SANGUE", 3), r("Purgatório", "SANGUE", 3), r("Vomitar Pestes", "SANGUE", 3), r("Dissipar Ritual", "MEDO", 3),

  // 4º círculo
  r("Controle Mental", "CONHECIMENTO", 4), r("Inexistir", "CONHECIMENTO", 4), r("Possessão", "CONHECIMENTO", 4),
  r("Alterar Destino", "ENERGIA", 4), r("Deflagração de Energia", "ENERGIA", 4), r("Teletransporte", "ENERGIA", 4),
  r("Convocar o Algoz", "MORTE", 4), r("Distorção Temporal", "MORTE", 4), r("Fim Inevitável", "MORTE", 4),
  r("Capturar o Coração", "SANGUE", 4), r("Invólucro de Carne", "SANGUE", 4), r("Vínculo de Sangue", "SANGUE", 4),
  r("Canalizar o Medo", "MEDO", 4), r("Conhecendo o Medo", "MEDO", 4), r("Lâmina do Medo", "MEDO", 4), r("Medo Tangível", "MEDO", 4), r("Presença do Medo", "MEDO", 4),
];

export function ritualsAvailable(params: { maxCircle: number; element?: RitualElement | "TODOS" }) {
  return RITUALS.filter((ritual) => ritual.circle <= params.maxCircle && (!params.element || params.element === "TODOS" || ritual.element === params.element));
}

export const ritualById = (id: string) => RITUALS.find((ritual) => ritual.id === id);

export function findRitualByLegacyCard(name: string, element?: string): RitualDef | undefined {
  const normalized = normalizeRitualName(name);
  const candidates = RITUALS.filter((ritual) => normalizeRitualName(ritual.name) === normalized);
  if (candidates.length <= 1) return candidates[0];
  const normalizedElement = String(element ?? "").trim().toUpperCase() as ParanormalElement;
  return candidates.find((ritual) => ritual.element === normalizedElement);
}
