import type { CharacterSheetData, OrdemAttribute } from "@/data/ordemRules";

export type InventoryDamageType = "IMPACTO" | "CORTE" | "PERFURACAO" | "BALISTICO" | "FOGO" | "OUTRO";
export type InventoryCombatRange = "CORPO_A_CORPO" | "CURTO" | "MEDIO" | "LONGO";

export interface InventoryWeaponMeta {
  damage: string;
  criticalMargin: number;
  criticalMultiplier: number;
  range: InventoryCombatRange;
  damageType: InventoryDamageType;
  skillId: "luta" | "pontaria";
  attribute: OrdemAttribute;
  ammo?: string;
  addStrength?: boolean;
}

export interface CatalogEquipment {
  id: string;
  name: string;
  aliases: string[];
  kind: "ARMA" | "MUNICAO";
  category: string;
  rank: "0" | "I" | "II" | "III";
  spaces: number;
  weapon?: InventoryWeaponMeta;
}

const weapon = (
  id: string,
  name: string,
  aliases: string[],
  category: string,
  rank: CatalogEquipment["rank"],
  spaces: number,
  damage: string,
  criticalMargin: number,
  criticalMultiplier: number,
  range: InventoryCombatRange,
  damageType: InventoryDamageType,
  options: { ammo?: string; addStrength?: boolean; skillId?: "luta" | "pontaria"; attribute?: OrdemAttribute } = {},
): CatalogEquipment => ({
  id,
  name,
  aliases,
  kind: "ARMA",
  category,
  rank,
  spaces,
  weapon: {
    damage,
    criticalMargin,
    criticalMultiplier,
    range,
    damageType,
    skillId: options.skillId ?? (range === "CORPO_A_CORPO" ? "luta" : "pontaria"),
    attribute: options.attribute ?? (range === "CORPO_A_CORPO" ? "FOR" : "AGI"),
    ammo: options.ammo,
    addStrength: options.addStrength ?? range === "CORPO_A_CORPO",
  },
});

const ammo = (id: string, name: string, aliases: string[], rank: CatalogEquipment["rank"] = "0"): CatalogEquipment => ({
  id,
  name,
  aliases,
  kind: "MUNICAO",
  category: "Munição",
  rank,
  spaces: 1,
});

/**
 * Catálogo mecânico local. Não usa IA externa: somente reconhecimento por nomes/aliases.
 * Os valores acompanham a tabela 3.3 do livro 1.2 e os presets de combate existentes.
 */
export const EQUIPMENT_CATALOG: CatalogEquipment[] = [
  weapon("faca", "Faca", ["faca"], "Arma simples · corpo a corpo leve", "0", 1, "1d4", 19, 2, "CORPO_A_CORPO", "CORTE"),
  weapon("martelo", "Martelo", ["martelo"], "Arma simples · corpo a corpo leve", "0", 1, "1d6", 20, 2, "CORPO_A_CORPO", "IMPACTO"),
  weapon("punhal", "Punhal", ["punhal", "adaga"], "Arma simples · corpo a corpo leve", "0", 1, "1d4", 20, 3, "CORPO_A_CORPO", "PERFURACAO"),
  weapon("bastao", "Bastão", ["bastao", "bastão", "cassetete"], "Arma simples · corpo a corpo", "0", 1, "1d6", 20, 2, "CORPO_A_CORPO", "IMPACTO"),
  weapon("machete", "Machete", ["machete"], "Arma simples · corpo a corpo", "0", 1, "1d6", 19, 2, "CORPO_A_CORPO", "CORTE"),
  weapon("lanca", "Lança", ["lanca", "lança"], "Arma simples · corpo a corpo", "0", 1, "1d6", 20, 2, "CORPO_A_CORPO", "PERFURACAO"),
  weapon("cajado", "Cajado", ["cajado"], "Arma simples · duas mãos", "0", 2, "1d6", 20, 2, "CORPO_A_CORPO", "IMPACTO"),
  weapon("arco", "Arco", ["arco simples", "arco"], "Arma simples · disparo", "0", 2, "1d6", 20, 3, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
  weapon("besta", "Besta", ["besta"], "Arma simples · disparo", "0", 2, "1d8", 19, 2, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
  weapon("pistola", "Pistola", ["pistola", "glock", "9mm"], "Arma de fogo leve", "I", 1, "1d12", 18, 2, "CURTO", "BALISTICO", { ammo: "Balas curtas" }),
  weapon("revolver", "Revólver", ["revolver", "revólver", "colt"], "Arma de fogo leve", "I", 1, "2d6", 19, 3, "CURTO", "BALISTICO", { ammo: "Balas curtas" }),
  weapon("fuzil-caca", "Fuzil de caça", ["fuzil de caca", "fuzil de caça", "rifle de caca", "rifle de caça"], "Arma de fogo · duas mãos", "I", 2, "2d8", 19, 3, "MEDIO", "BALISTICO", { ammo: "Balas longas" }),
  weapon("machadinha", "Machadinha", ["machadinha"], "Arma tática · corpo a corpo leve", "0", 1, "1d6", 20, 3, "CORPO_A_CORPO", "CORTE"),
  weapon("nunchaku", "Nunchaku", ["nunchaku", "nunchaco", "nunchaco"], "Arma tática · corpo a corpo leve", "0", 1, "1d8", 20, 2, "CORPO_A_CORPO", "IMPACTO"),
  weapon("corrente", "Corrente", ["corrente"], "Arma tática · corpo a corpo", "0", 1, "1d8", 20, 2, "CORPO_A_CORPO", "IMPACTO"),
  weapon("espada", "Espada", ["espada"], "Arma tática · corpo a corpo", "I", 1, "1d8", 19, 2, "CORPO_A_CORPO", "CORTE"),
  weapon("florete", "Florete", ["florete", "rapier"], "Arma tática · corpo a corpo", "I", 1, "1d6", 18, 2, "CORPO_A_CORPO", "CORTE"),
  weapon("machado", "Machado", ["machado"], "Arma tática · corpo a corpo", "I", 1, "1d8", 20, 3, "CORPO_A_CORPO", "CORTE"),
  weapon("maca", "Maça", ["maca", "maça"], "Arma tática · corpo a corpo", "I", 1, "2d4", 20, 2, "CORPO_A_CORPO", "IMPACTO"),
  weapon("acha", "Acha", ["acha"], "Arma tática · duas mãos", "I", 2, "1d12", 20, 3, "CORPO_A_CORPO", "CORTE"),
  weapon("gadanho", "Gadanho", ["gadanho", "foice de guerra"], "Arma tática · duas mãos", "I", 2, "2d4", 20, 4, "CORPO_A_CORPO", "CORTE"),
  weapon("katana", "Katana", ["katana"], "Arma tática · duas mãos", "I", 2, "1d10", 19, 2, "CORPO_A_CORPO", "CORTE"),
  weapon("marreta", "Marreta", ["marreta"], "Arma tática · duas mãos", "I", 2, "3d4", 20, 2, "CORPO_A_CORPO", "IMPACTO"),
  weapon("montante", "Montante", ["montante", "espadao", "espadão"], "Arma tática · duas mãos", "I", 2, "2d6", 19, 2, "CORPO_A_CORPO", "CORTE"),
  weapon("motosserra", "Motosserra", ["motosserra", "motoserra"], "Arma tática · duas mãos", "I", 2, "3d6", 20, 2, "CORPO_A_CORPO", "CORTE"),
  weapon("arco-composto", "Arco composto", ["arco composto"], "Arma tática · disparo", "I", 2, "1d10", 20, 3, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
  weapon("balestra", "Balestra", ["balestra"], "Arma tática · disparo", "I", 2, "1d12", 19, 2, "MEDIO", "PERFURACAO", { ammo: "Flechas" }),
  weapon("submetralhadora", "Submetralhadora", ["submetralhadora", "smg"], "Arma de fogo · uma mão", "I", 1, "2d6", 19, 3, "CURTO", "BALISTICO", { ammo: "Balas curtas" }),
  weapon("espingarda", "Espingarda", ["espingarda", "shotgun"], "Arma de fogo · duas mãos", "I", 2, "4d6", 20, 3, "CURTO", "BALISTICO", { ammo: "Cartuchos" }),
  weapon("fuzil-assalto", "Fuzil de assalto", ["fuzil de assalto", "rifle de assalto"], "Arma de fogo · duas mãos", "II", 2, "2d10", 19, 3, "MEDIO", "BALISTICO", { ammo: "Balas longas" }),
  weapon("fuzil-precisao", "Fuzil de precisão", ["fuzil de precisao", "fuzil de precisão", "sniper", "rifle sniper"], "Arma de fogo · duas mãos", "III", 2, "2d10", 19, 3, "LONGO", "BALISTICO", { ammo: "Balas longas" }),
  weapon("bazuca", "Bazuca", ["bazuca", "rocket launcher"], "Arma pesada", "III", 2, "10d8", 20, 2, "MEDIO", "IMPACTO", { ammo: "Foguete" }),
  weapon("lanca-chamas", "Lança-chamas", ["lanca chamas", "lança chamas", "lanca-chamas", "lança-chamas"], "Arma pesada", "III", 2, "6d6", 20, 2, "CURTO", "FOGO", { ammo: "Combustível" }),
  weapon("metralhadora", "Metralhadora", ["metralhadora", "machine gun"], "Arma pesada", "II", 2, "2d12", 19, 3, "MEDIO", "BALISTICO", { ammo: "Balas longas" }),
  ammo("balas-curtas", "Balas curtas", ["balas curtas", "municao curta", "munição curta"]),
  ammo("balas-longas", "Balas longas", ["balas longas", "municao longa", "munição longa"], "I"),
  ammo("cartuchos", "Cartuchos", ["cartucho", "cartuchos"]),
  ammo("flechas", "Flechas", ["flecha", "flechas"]),
  ammo("foguete", "Foguete", ["foguete", "foguetes"], "I"),
  ammo("combustivel", "Combustível", ["combustivel", "combustível"]),
];

export function normalizeEquipmentLabel(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function aliasScore(query: string, alias: string) {
  if (!query || !alias) return 0;
  if (query === alias) return 1000 + alias.length;
  if (query.startsWith(alias) || alias.startsWith(query)) return 700 + Math.min(query.length, alias.length);
  if (query.includes(alias)) return 500 + alias.length;
  if (alias.includes(query)) return 350 + query.length;
  const words = query.split(" ").filter(Boolean);
  const aliasWords = alias.split(" ").filter(Boolean);
  const shared = words.filter((word) => aliasWords.some((part) => part.startsWith(word) || word.startsWith(part))).length;
  return shared ? shared * 90 : 0;
}

export function equipmentSuggestions(query: string, limit = 8) {
  const normalized = normalizeEquipmentLabel(query);
  if (!normalized) return EQUIPMENT_CATALOG.slice(0, limit);
  return EQUIPMENT_CATALOG
    .map((item) => ({
      item,
      score: Math.max(...[item.name, ...item.aliases].map((value) => aliasScore(normalized, normalizeEquipmentLabel(value)))),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "pt-BR"))
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function catalogEquipmentById(id?: string) {
  return id ? EQUIPMENT_CATALOG.find((item) => item.id === id) : undefined;
}

export function matchCatalogEquipment(name: string, category = "") {
  const haystack = normalizeEquipmentLabel(`${name} ${category}`);
  if (!haystack) return undefined;
  return [...EQUIPMENT_CATALOG]
    .sort((a, b) => Math.max(...b.aliases.map((alias) => normalizeEquipmentLabel(alias).length)) - Math.max(...a.aliases.map((alias) => normalizeEquipmentLabel(alias).length)))
    .find((item) => [item.name, ...item.aliases].some((alias) => haystack.includes(normalizeEquipmentLabel(alias))));
}

export type InventoryItemExtended = CharacterSheetData["inventory"][number] & {
  catalogId?: string;
  damage?: string;
  criticalMargin?: number;
  criticalMultiplier?: number;
  range?: InventoryCombatRange | string;
  ammo?: string;
  damageType?: InventoryDamageType | string;
  skillId?: "luta" | "pontaria" | string;
  attribute?: OrdemAttribute;
  addStrength?: boolean;
};

export function inventoryCatalogMatch(item: CharacterSheetData["inventory"][number]) {
  const extended = item as InventoryItemExtended;
  return catalogEquipmentById(extended.catalogId) ?? matchCatalogEquipment(item.name, item.category);
}

export function resolveInventoryWeapon(item: CharacterSheetData["inventory"][number]): InventoryWeaponMeta | null {
  const extended = item as InventoryItemExtended;
  const preset = inventoryCatalogMatch(item)?.weapon;
  const damage = extended.damage?.trim() || preset?.damage;
  if (!damage) return null;
  const rawRange = extended.range || preset?.range || "CORPO_A_CORPO";
  const normalizedRange = normalizeEquipmentLabel(String(rawRange));
  const range: InventoryCombatRange = normalizedRange.includes("long") ? "LONGO" : normalizedRange.includes("med") ? "MEDIO" : normalizedRange.includes("cur") ? "CURTO" : "CORPO_A_CORPO";
  const skillId = extended.skillId === "pontaria" || extended.skillId === "luta" ? extended.skillId : preset?.skillId ?? (range === "CORPO_A_CORPO" ? "luta" : "pontaria");
  const attribute = extended.attribute ?? preset?.attribute ?? (skillId === "luta" ? "FOR" : "AGI");
  const damageType = (extended.damageType as InventoryDamageType | undefined) ?? preset?.damageType ?? "OUTRO";
  return {
    damage,
    criticalMargin: Number(extended.criticalMargin ?? preset?.criticalMargin ?? 20),
    criticalMultiplier: Number(extended.criticalMultiplier ?? preset?.criticalMultiplier ?? 2),
    range,
    damageType,
    skillId,
    attribute,
    ammo: extended.ammo ?? preset?.ammo ?? "",
    addStrength: extended.addStrength ?? preset?.addStrength ?? range === "CORPO_A_CORPO",
  };
}

export function catalogItemToInventory(item: CatalogEquipment, id: string): InventoryItemExtended {
  return {
    id,
    name: item.name,
    category: `${item.category}${item.rank !== "0" ? ` · Cat. ${item.rank}` : " · Cat. 0"}`,
    spaces: item.spaces,
    quantity: 1,
    equipped: false,
    notes: "",
    catalogId: item.id,
    damage: item.weapon?.damage,
    criticalMargin: item.weapon?.criticalMargin,
    criticalMultiplier: item.weapon?.criticalMultiplier,
    range: item.weapon?.range,
    ammo: item.weapon?.ammo,
    damageType: item.weapon?.damageType,
    skillId: item.weapon?.skillId,
    attribute: item.weapon?.attribute,
    addStrength: item.weapon?.addStrength,
  };
}

export type InventoryLoadStatus = "NORMAL" | "SOBRECARREGADO" | "IMOVEL";

export function inventoryLoadState(sheet: CharacterSheetData) {
  const force = Math.max(0, Math.trunc(Number(sheet.attributes.FOR || 0)));
  const intellect = Math.max(0, Math.trunc(Number(sheet.attributes.INT || 0)));
  const technician = sheet.concept.trail === "Técnico" && sheet.concept.nex >= 10;
  const effectivePoints = technician ? force + intellect : force;
  const capacity = effectivePoints <= 0 ? 2 : effectivePoints * 5;
  const used = sheet.inventory.reduce((sum, item) => sum + Math.max(0, Number(item.spaces) || 0) * Math.max(0, Number(item.quantity) || 0), 0);
  const overloadLimit = capacity * 2;
  const status: InventoryLoadStatus = used > overloadLimit ? "IMOVEL" : used > capacity ? "SOBRECARREGADO" : "NORMAL";
  return {
    force,
    intellect,
    technician,
    effectivePoints,
    capacity,
    used,
    overloadLimit,
    status,
    percent: capacity > 0 ? Math.min(200, (used / capacity) * 100) : 0,
  };
}
