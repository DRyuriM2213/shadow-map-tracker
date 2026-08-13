/**
 * CONFIGURAÇÃO DO MAPA INTERATIVO
 * -------------------------------------------------------------
 * Este arquivo é o único lugar que precisa ser editado para o mapa.
 *
 * 1) IMAGENS — coloque os 4 arquivos em `public/mapa/` com estes nomes
 *    (ou troque os caminhos abaixo):
 *      public/mapa/primeiro-andar-limpo.png
 *      public/mapa/primeiro-andar-numerado.png
 *      public/mapa/andar-superior-limpo.png
 *      public/mapa/andar-superior-numerado.png
 *
 * 2) HOTSPOTS — cada hotspot usa coordenadas PERCENTUAIS da imagem
 *    (0 a 100). x/y = canto superior esquerdo, w/h = tamanho.
 *    Deixe `x` como `null` enquanto o hotspot não estiver posicionado:
 *    ele simplesmente não aparece no mapa e continua acessível pela lista.
 *
 * 3) `locationId` liga o hotspot a um local real de src/data/campaign.ts
 *    (LOCATIONS). Sem locationId o hotspot é apenas informativo.
 */

export type FloorId = "primeiro" | "superior";

export interface MapHotspot {
  id: string;
  name: string;
  floor: FloorId;
  /** id de LOCATIONS em src/data/campaign.ts — opcional */
  locationId?: string;
  /** posição em % da imagem; null = ainda não posicionado */
  x: number | null;
  y: number | null;
  w: number;
  h: number;
  restricted?: boolean;
  note?: string;
}

export const MAP_IMAGES: Record<FloorId, { limpo: string; numerado: string; label: string }> = {
  primeiro: {
    label: "Primeiro andar",
    limpo: "/mapa/primeiro-andar-limpo.png",
    numerado: "/mapa/primeiro-andar-numerado.png",
  },
  superior: {
    label: "Andar superior",
    limpo: "/mapa/andar-superior-limpo.png",
    numerado: "/mapa/andar-superior-numerado.png",
  },
};

const hs = (
  id: string,
  name: string,
  floor: FloorId,
  extra: Partial<MapHotspot> = {},
): MapHotspot => ({ id, name, floor, x: null, y: null, w: 10, h: 8, ...extra });

/** Nomes oficiais. Ajuste x/y/w/h quando as imagens forem adicionadas. */
export const HOTSPOTS: MapHotspot[] = [
  // ---------------- PRIMEIRO ANDAR ----------------
  hs("h-saida-principal", "Saída Principal", "primeiro"),
  hs("h-recepcao", "Recepção", "primeiro"),
  hs("h-patio-central", "Pátio Central", "primeiro", { locationId: "l-patio" }),
  hs("h-banheiros", "Banheiros", "primeiro"),
  hs("h-refeitorio", "Refeitório", "primeiro", { locationId: "l-refeitorio" }),
  hs("h-cozinha", "Cozinha Industrial", "primeiro"),
  hs("h-quadra", "Quadra", "primeiro"),
  hs("h-vestiarios", "Vestiários M/F", "primeiro"),
  hs("h-escadas", "Escadas para o andar superior", "primeiro"),

  // ---------------- ANDAR SUPERIOR ----------------
  hs("h-secretaria", "Secretaria", "superior"),
  hs("h-conselho", "Sala do Conselho Estudantil", "superior"),
  hs("h-biblioteca", "Biblioteca", "superior", { locationId: "l-biblioteca" }),
  hs("h-arquivo-morto", "Arquivo Morto da Biblioteca", "superior", { restricted: true }),
  hs("h-lab-quimica", "Laboratório de Química", "superior"),
  hs("h-lab-biologia", "Laboratório de Biologia", "superior"),
  hs("h-salas-aula", "Salas de aula", "superior"),
  hs("h-banheiro-sup", "Banheiro", "superior"),
  hs("h-professores", "Sala dos Professores", "superior"),
  hs("h-diretor", "Sala do Diretor", "superior", { restricted: true }),
];
