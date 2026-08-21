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
];

/**
 * Percy NÃO é mais PJ. Andy saiu da campanha. Percy passou a ser NPC controlado
 * pelo mestre (ver src/data/npcs.ts, id "percy"). Mantido aqui apenas como aviso
 * para qualquer UI legada que ainda espere encontrá-lo na lista de players.
 */
export const FORMER_PLAYERS: Player[] = [
  {
    id: "p-percy",
    playerName: "Andy (fora da campanha)",
    characterName: "Percy",
    role: "Agora NPC controlado pelo mestre",
    status: "Encerrado como PJ",
    notes: "Percy deixou de ser personagem de jogador. Histórico, conhecimentos e missão secreta continuam válidos, mas agora são material exclusivo do mestre. Ele reaparece como NPC no início da invasão noturna.",
    isPending: false,
  },
];
