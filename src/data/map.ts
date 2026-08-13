/**
 * CONFIGURAÇÃO DO MAPA INTERATIVO
 * -------------------------------------------------------------
 * As quatro imagens canônicas devem ficar em `public/mapa/`.
 * Coordenadas permanecem nulas enquanto a imagem não estiver no repositório:
 * assim nenhuma posição de sala é inventada.
 */

export type FloorId = "primeiro" | "superior";

export interface MapHotspot {
  id: string;
  name: string;
  floor: FloorId;
  /** id do local canônico em campaignFull */
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

/**
 * Os nomes abaixo seguem exatamente a legenda escolhida pelo mestre.
 * A ligação com locationId funciona mesmo sem coordenada visual: o cômodo
 * continua acessível pela lista/inspector até as PNGs entrarem no repo.
 */
export const HOTSPOTS: MapHotspot[] = [
  // ---------------- PRIMEIRO ANDAR ----------------
  hs("h-saida-principal", "Saída Principal", "primeiro", { locationId: "l-saida-principal" }),
  hs("h-recepcao", "Recepção", "primeiro", { locationId: "l-recepcao" }),
  hs("h-patio-central", "Pátio Central", "primeiro", { locationId: "l-patio" }),
  hs("h-banheiros", "Banheiros", "primeiro", { locationId: "l-banheiros-primeiro" }),
  hs("h-refeitorio", "Refeitório", "primeiro", { locationId: "l-refeitorio" }),
  hs("h-cozinha", "Cozinha Industrial", "primeiro", { locationId: "l-cozinha" }),
  hs("h-quadra", "Quadra", "primeiro", { locationId: "l-quadra" }),
  hs("h-vestiarios", "Vestiários M/F", "primeiro", { locationId: "l-vestiarios" }),
  hs("h-escadas", "Escadas para o andar superior", "primeiro", { locationId: "l-escadas" }),

  // ---------------- ANDAR SUPERIOR ----------------
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