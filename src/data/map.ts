/**
 * CONFIGURAÇÃO DO MAPA INTERATIVO
 * -------------------------------------------------------------
 * As quatro imagens canônicas ficam em `public/mapa/`.
 * Coordenadas permanecem nulas até o mestre posicionar hotspots visualmente:
 * nenhuma sala recebe posição inventada.
 */

export type FloorId = "primeiro" | "superior";

export interface MapHotspot {
  id: string;
  name: string;
  floor: FloorId;
  locationId?: string;
  x: number | null;
  y: number | null;
  w: number;
  h: number;
  restricted?: boolean;
  note?: string;
}

export const MAP_IMAGES: Record<FloorId, { limpo: string; numerado: string; label: string }> = {
  primeiro: {
    label: "Térreo",
    limpo: "/mapa/terreo-limpo.webp",
    numerado: "/mapa/terreo-investigacao.webp",
  },
  superior: {
    label: "Andar superior",
    limpo: "/mapa/primeiro-andar-limpo.webp",
    numerado: "/mapa/primeiro-andar-investigacao.webp",
  },
};

const hs = (id: string, name: string, floor: FloorId, extra: Partial<MapHotspot> = {}): MapHotspot => ({ id, name, floor, x: null, y: null, w: 10, h: 8, ...extra });

export const HOTSPOTS: MapHotspot[] = [
  // TÉRREO — legenda canônica 1–9
  hs("h-saida-principal", "Saída Principal", "primeiro", { locationId: "l-saida-principal" }),
  hs("h-recepcao", "Recepção", "primeiro", { locationId: "l-recepcao" }),
  hs("h-patio-central", "Pátio Central", "primeiro", { locationId: "l-patio" }),
  hs("h-banheiros", "Banheiros", "primeiro", { locationId: "l-banheiros-primeiro" }),
  hs("h-refeitorio", "Refeitório", "primeiro", { locationId: "l-refeitorio" }),
  hs("h-cozinha", "Cozinha Industrial", "primeiro", { locationId: "l-cozinha" }),
  hs("h-quadra", "Quadra", "primeiro", { locationId: "l-quadra" }),
  hs("h-vestiarios", "Vestiários M/F", "primeiro", { locationId: "l-vestiarios" }),
  hs("h-escadas", "Escadas para o andar superior", "primeiro", { locationId: "l-escadas" }),

  // ANDAR SUPERIOR — legenda canônica 1–9 + 3A
  hs("h-secretaria", "Secretaria", "superior", { locationId: "l-secretaria" }),
  hs("h-conselho", "Sala do Conselho Estudantil", "superior", { locationId: "l-conselho" }),
  hs("h-biblioteca", "Biblioteca", "superior", { locationId: "l-biblioteca" }),
  hs("h-arquivo-morto", "Arquivo Morto da Biblioteca", "superior", { locationId: "l-arquivo-morto", restricted: true }),
  hs("h-lab-quimica", "Laboratório de Química", "superior", { locationId: "l-lab-quimica" }),
  hs("h-lab-biologia", "Laboratório de Biologia", "superior", { locationId: "l-lab-biologia" }),
  hs("h-salas-aula", "Salas de aula", "superior", { locationId: "l-salas-aula" }),
  hs("h-banheiro-sup", "Banheiro", "superior", { locationId: "l-banheiro-superior" }),
  hs("h-professores", "Sala dos Professores", "superior", { locationId: "l-professores" }),
  hs("h-diretor", "Sala do Diretor", "superior", { locationId: "l-diretor", restricted: true }),
];
