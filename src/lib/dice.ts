import type { OrdemAttribute } from "@/data/ordemRules";

export interface DieRoll {
  sides: number;
  value: number;
}

export interface FormulaRoll {
  formula: string;
  dice: DieRoll[];
  modifier: number;
  subtotal: number;
  total: number;
}

export interface OrdemTestRoll {
  attribute: OrdemAttribute;
  attributeValue: number;
  dice: number[];
  chosenIndex: number;
  chosen: number;
  trainingBonus: number;
  otherBonus: number;
  total: number;
  mode: "MAIOR" | "MENOR";
}

const randomDie = (sides: number) => Math.floor(Math.random() * sides) + 1;

export function parseAndRollFormula(raw: string): FormulaRoll {
  const formula = raw.trim().toLowerCase().replace(/\s+/g, "");
  const match = formula.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error("Use uma fórmula como 1d20, 2d6+3 ou 1d8-1.");
  const count = Math.max(1, Math.min(100, Number(match[1] || 1)));
  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);
  if (!Number.isInteger(sides) || sides < 2 || sides > 1000) throw new Error("Número de lados inválido.");
  const dice = Array.from({ length: count }, () => ({ sides, value: randomDie(sides) }));
  const subtotal = dice.reduce((sum, d) => sum + d.value, 0);
  return { formula, dice, modifier, subtotal, total: subtotal + modifier };
}

export function rollOrdemTest(
  attribute: OrdemAttribute,
  attributeValue: number,
  trainingBonus = 0,
  otherBonus = 0,
): OrdemTestRoll {
  const mode: "MAIOR" | "MENOR" = attributeValue > 0 ? "MAIOR" : "MENOR";
  const count = attributeValue > 0 ? attributeValue : 2 + Math.abs(attributeValue);
  const dice = Array.from({ length: Math.max(1, Math.min(20, count)) }, () => randomDie(20));
  let chosenIndex = 0;
  for (let i = 1; i < dice.length; i += 1) {
    if ((mode === "MAIOR" && dice[i]! > dice[chosenIndex]!) || (mode === "MENOR" && dice[i]! < dice[chosenIndex]!)) chosenIndex = i;
  }
  const chosen = dice[chosenIndex]!;
  return { attribute, attributeValue, dice, chosenIndex, chosen, trainingBonus, otherBonus, total: chosen + trainingBonus + otherBonus, mode };
}

export function isCritical(d20: number, margin: number) {
  const threshold = Math.max(2, Math.min(20, margin || 20));
  return d20 >= threshold;
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
