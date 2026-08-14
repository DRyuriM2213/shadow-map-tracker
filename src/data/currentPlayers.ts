import type { Player } from "@/lib/types";

export const CURRENT_PLAYERS: Player[] = [
  {
    id: "p-augusto",
    playerName: "Guilherme",
    characterName: "Augusto",
    role: "Diretor da Universidade Valença",
    status: "Ativo",
    notes: "Personagem de jogador. Augusto é o diretor, mas o sistema nunca decide falas, ações, sentimentos ou escolhas por Guilherme.",
    isPending: false,
  },
  {
    id: "p-sofia",
    playerName: "Luiz",
    characterName: "Sofia",
    role: "Investigadora",
    status: "Ativo",
    notes: "No Dia 2, Sofia descobriu que é filha de Augusto ao encontrar uma foto da mãe com ele. Não confundir com a vítima histórica Sofia Mendes.",
    isPending: false,
  },
  {
    id: "p-adolfo",
    playerName: "Vitor",
    characterName: "Adolfo",
    role: "Investigador / novo integrante",
    status: "Ativo",
    notes: "Novo PJ. Grande e atrapalhado conforme estabelecido em mesa. No Dia 1 protagonizou a perseguição do fechamento e depois se reconciliou com Augusto. Vitor player nunca é Vitor Hugo Nogueira NPC.",
    isPending: false,
  },
  {
    id: "p-amelie",
    playerName: "Thaissa",
    characterName: "Amelie",
    role: "Investigadora",
    status: "Ativo",
    notes: "Personagem de jogador. Thaissa nunca é tratada como NPC.",
    isPending: false,
  },
  {
    id: "p-percy",
    playerName: "Andy",
    characterName: "Percy",
    role: "Investigadora com missão secreta",
    status: "Ativo",
    notes: "Personagem de jogador. Andy e Percy não são pessoas separadas. A missão da Ordem permanece privada conforme as informações já entregues à jogadora.",
    isPending: false,
  },
];
