/**
 * Catálogo estruturado de rituais — apenas metadados (nome, elemento, círculo)
 * e um resumo funcional curtíssimo para filtro/validação.
 * Nenhum texto extenso do livro é reproduzido; o jogador pode escrever notas próprias.
 */

import type { ParanormalElement } from "@/data/ordemProgression";

export interface RitualDef {
  id: string;
  name: string;
  element: ParanormalElement;
  circle: 1 | 2 | 3 | 4;
  tag: string;
}

const r = (name: string, element: ParanormalElement, circle: 1 | 2 | 3 | 4, tag: string): RitualDef => ({
  id: name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  name,
  element,
  circle,
  tag,
});

export const RITUALS: RitualDef[] = [
  // Sangue
  r("Armamento Sangrento", "SANGUE", 1, "arma"),
  r("Compartilhar Dor", "SANGUE", 1, "debuff"),
  r("Sangue Fervente", "SANGUE", 1, "dano"),
  r("Presas de Sangue", "SANGUE", 2, "dano/cura"),
  r("Sangue Vital", "SANGUE", 2, "cura"),
  r("Transfusão Vital", "SANGUE", 3, "cura"),
  r("Explosão Sanguínea", "SANGUE", 3, "área"),
  r("Ruína Sanguínea", "SANGUE", 4, "dano"),
  // Morte
  r("Amaldiçoar", "MORTE", 1, "debuff"),
  r("Enfraquecer", "MORTE", 1, "debuff"),
  r("Toque Necrótico", "MORTE", 1, "dano"),
  r("Espada Fantasma", "MORTE", 2, "arma"),
  r("Marca da Morte", "MORTE", 2, "debuff"),
  r("Convocar Morto", "MORTE", 3, "invocação"),
  r("Aura de Decadência", "MORTE", 3, "área"),
  r("Colheita Fúnebre", "MORTE", 4, "dano"),
  // Conhecimento
  r("Detectar Ameaças", "CONHECIMENTO", 1, "detecção"),
  r("Ler Mente", "CONHECIMENTO", 1, "informação"),
  r("Ampliar Sentidos", "CONHECIMENTO", 1, "suporte"),
  r("Sussurros Insanos", "CONHECIMENTO", 2, "debuff"),
  r("Visão do Passado", "CONHECIMENTO", 2, "informação"),
  r("Controlar Mente", "CONHECIMENTO", 3, "controle"),
  r("Olho da Mente", "CONHECIMENTO", 3, "informação"),
  r("Reescrever Memória", "CONHECIMENTO", 4, "controle"),
  // Energia
  r("Lanterna Bruxa", "ENERGIA", 1, "utilidade"),
  r("Repulsão", "ENERGIA", 1, "controle"),
  r("Choque Dimensional", "ENERGIA", 1, "dano"),
  r("Escudo de Energia", "ENERGIA", 2, "defesa"),
  r("Teletransporte Menor", "ENERGIA", 2, "movimento"),
  r("Descarga Cinética", "ENERGIA", 3, "dano"),
  r("Campo de Força", "ENERGIA", 3, "defesa"),
  r("Colapso Dimensional", "ENERGIA", 4, "área"),
];

export function ritualsAvailable(params: { element: ParanormalElement | null; maxCircle: number; onlyAffinity?: boolean }) {
  return RITUALS.filter((ritual) => {
    if (ritual.circle > params.maxCircle) return false;
    if (params.onlyAffinity && params.element && ritual.element !== params.element) return false;
    return true;
  });
}

export const ritualById = (id: string) => RITUALS.find((x) => x.id === id);
