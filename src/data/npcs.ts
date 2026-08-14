/**
 * ELENCO OFICIAL DE NPCs MODELADOS — 16 personagens.
 *
 * REGRAS DE CÂNONE APLICADAS AQUI:
 * - Estes são os ÚNICOS NPCs principais/modelados do RPG.
 * - Nomes administrativos que aparecem nos documentos (Cecília, Renato, Samuel,
 *   João, Helena Prado, Larissa, Mariana…) continuam existindo NO TEXTO dos
 *   documentos/props, mas NÃO são NPCs modelados e não entram nesta lista.
 * - Nada de biografia inventada: campos sem dado seguro ficam com
 *   NAO_DEFINIDO e devem ser preenchidos pelo mestre na mesa.
 * - Augusto é personagem de jogador (Guilherme) e nunca é NPC.
 * - Alice não existe como NPC.
 * - A vítima histórica é sempre "Sofia Mendes" (nunca só "Sofia", que é a
 *   personagem da jogadora Luiz).
 */

export const NAO_DEFINIDO = "não definido pelo mestre";

export type NpcStatus = "vivo" | "morto" | "desconhecido";

export interface NpcTopic {
  id: string;
  label: string;
  /** fala pronta, primeira pessoa, curta */
  says: string;
  /** verdade / omissão / limite — nunca ler em voz alta */
  master: string;
  test?: string;
  dc?: number;
  unlocks?: string[];
}

export interface NpcDef {
  id: string;
  name: string;
  /** função, cargo ou origem conhecida */
  role: string;
  status: NpcStatus;
  /** salas prováveis (ids canônicos); vazio = local não definido */
  locationIds: string[];
  schedule: string;
  personality: string[];
  voice: string;
  knows: string[];
  doesNotKnow: string[];
  /** somente mestre */
  secrets: string[];
  relations: string[];
  initialAttitude: string;
  masterNotes: string;
  topics: NpcTopic[];
}

const base = (
  id: string,
  name: string,
  role: string,
  extra: Partial<NpcDef> = {},
): NpcDef => ({
  id,
  name,
  role,
  status: "vivo",
  locationIds: [],
  schedule: NAO_DEFINIDO,
  personality: [],
  voice: NAO_DEFINIDO,
  knows: [],
  doesNotKnow: [],
  secrets: [],
  relations: [],
  initialAttitude: NAO_DEFINIDO,
  masterNotes: "",
  topics: [],
  ...extra,
});

export const NPCS: NpcDef[] = [
  base("arthur", "Arthur", "Filho de Guilherme (origem informada pelo mestre)", {
    status: "morto",
    relations: ["Filho de Guilherme."],
    masterNotes:
      "Status: morto. Nenhuma outra informação está fixada no cânone do projeto — usar apenas o que o mestre decidir na mesa. Não confundir com Augusto, que é o personagem jogado por Guilherme.",
    initialAttitude: "Não interage: personagem morto. Aparece por memória, registro ou menção.",
  }),

  base("marie-barbosa", "Marie Barbosa", "Professora de Artes", {
    locationIds: ["l-auditorio", "l-bastidores", "l-patio"],
    personality: ["atenta", "prática"],
    voice: "Fala de forma direta sobre o que viu e montou; evita especular sobre a instituição.",
    knows: ["Uso do auditório para eventos e ensaios."],
    doesNotKnow: ["Não tem acesso administrativo nem conhecimento técnico da estrutura de iluminação."],
    initialAttitude: "Colaborativa em assuntos de auditório, montagem e eventos.",
    masterNotes:
      "Referência presencial para auditório/eventos. Não atribuir a ela conteúdo de relatório técnico assinado por funcionário documental — isso continua no documento.",
    topics: [
      {
        id: "auditorio",
        label: "Auditório / evento",
        says: "O auditório estava liberado para o evento e a montagem já estava pronta antes de todo mundo chegar. Eu não fui quem instalou a parte de iluminação, isso é da equipe técnica.",
        master:
          "Verdade operacional segura. Ela não confirma sabotagem nem causa do acidente. O laudo técnico continua sendo o documento, não a fala dela.",
      },
      {
        id: "acidente",
        label: "O acidente",
        says: "Foi rápido demais. Eu ouvi o estalo antes de ver qualquer coisa cair. Não sei dizer o que soltou.",
        master: "Não entregar causa. Causa só sai de exame físico do cabo ou do relatório técnico.",
        test: "Diplomacia",
        dc: 10,
      },
    ],
  }),

  base("jade-nogueira", "Jade Nogueira", `Família Nogueira — ${NAO_DEFINIDO}`, {
    relations: ["Ligação familiar com o nome Nogueira (Ricardo Nogueira aparece nos registros do arquivo)."],
    initialAttitude: "Reservada quando o assunto é a família.",
    masterNotes:
      "Pode ser ponto de conversa sobre Ricardo Nogueira e família. Não inventar parentesco exato, culpa ou segredo: se o mestre não definir, manter em aberto.",
    topics: [
      {
        id: "ricardo",
        label: "Ricardo Nogueira",
        says: "Esse nome ainda pesa aqui em casa. Se vocês querem falar sobre ele, falem direito, não por curiosidade.",
        master:
          "Grau de parentesco e detalhes não estão definidos no cânone do projeto. O que existe documentado é a consulta dele ao arquivo institucional em 2018.",
      },
    ],
  }),

  base("vitor-hugo-nogueira", "Vitor Hugo Nogueira", `Família Nogueira — ${NAO_DEFINIDO}`, {
    relations: ["Ligação familiar com o nome Nogueira."],
    initialAttitude: "Desconfiado com perguntas sobre a família.",
    masterNotes: "Mesmo tratamento de Jade: parentesco e segredos ficam em aberto até o mestre definir.",
    topics: [
      {
        id: "familia",
        label: "Família / Ricardo",
        says: "A gente já respondeu isso muitas vezes. O que exatamente vocês encontraram para vir perguntar de novo?",
        master: "Reage ao que o grupo mostrar. Sem documento na mão, não entrega nada novo.",
        test: "Diplomacia",
        dc: 15,
      },
    ],
  }),

  base("cicero-ferreira", "Cícero Ferreira", "Professor de História", {
    locationIds: ["l-salas-aula", "l-biblioteca", "l-professores"],
    personality: ["didático", "detalhista"],
    voice: "Contextualiza tudo historicamente antes de responder.",
    knows: ["Como consultar acervo e material histórico da universidade."],
    initialAttitude: "Cooperativo com pesquisa acadêmica.",
    masterNotes: "Ponto de entrada para assuntos de História/arquivo sem substituir a bibliotecária documental.",
    topics: [
      {
        id: "arquivo",
        label: "Arquivo / registros antigos",
        says: "Registro antigo aqui é um problema conhecido: parte foi reorganizada, parte foi transferida. Se procuram um período específico, comecem pela caixa correspondente e conferem a numeração.",
        master: "Orienta o caminho, não entrega o achado. As divergências continuam vindo dos documentos.",
        test: "Investigação",
        dc: 10,
      },
    ],
  }),

  base("suzanne-de-lima", "Suzanne de Lima", "Estudante — curso de História", {
    locationIds: ["l-biblioteca", "l-salas-aula", "l-patio"],
    initialAttitude: "Curiosa, disposta a ajudar quem parece estar pesquisando de verdade.",
    masterNotes: "Pode dar apoio de pesquisa e boatos de corredor. Não inventar testemunho de crime.",
    topics: [
      {
        id: "boatos",
        label: "O que se comenta no campus",
        says: "Sempre corre alguma história aqui. Nem tudo é verdade, mas tem coisa que muita gente repete e ninguém confirma.",
        master: "Boato não é prova. Não transformar em confirmação de sabotagem ou culpado.",
      },
    ],
  }),

  base("rafael-goncalves", "Rafael Gonçalves", "Professor de Química", {
    locationIds: ["l-lab-quimica"],
    personality: ["técnico", "direto"],
    voice: "Fala em quantidade, procedimento e horário.",
    knows: ["Rotina, controle de estoque e procedimento do laboratório."],
    doesNotKnow: ["Não sabe o destino final de material que saiu fora do procedimento."],
    initialAttitude: "Coopera quando a irregularidade é tratada como problema técnico real.",
    masterNotes:
      "Referência PRESENCIAL de Química. O conteúdo assinado nos relatórios/livros de ocorrência continua sendo do documento; ele confirma procedimento, não autoria.",
    topics: [
      {
        id: "estoque",
        label: "Estoque de reagentes",
        says: "O controle é simples: entrada, saída e conferência. Quando não fecha, alguém tirou fora do procedimento. Eu registro e mando para cima.",
        master: "Sustentado pelo controle de reagentes. Não nomear responsável.",
      },
      {
        id: "acesso",
        label: "Acesso fora de horário",
        says: "Laboratório fora de horário precisa de reserva. Se abriu sem reserva, isso aparece no log eletrônico, não em mim.",
        master: "Direciona ao registro eletrônico de acessos sem inventar o titular da credencial.",
      },
    ],
  }),

  base("jairo-andrade", "Jairo Andrade", "Professor de Matemática", {
    locationIds: ["l-salas-aula", "l-professores"],
    initialAttitude: "Formal, responde ao que foi perguntado.",
    masterNotes: "Testemunha de rotina de aulas e horários. Sem segredo definido.",
    topics: [
      {
        id: "horarios",
        label: "Horários e presença",
        says: "Eu sigo o horário publicado. Se alguém faltou ou saiu no meio, isso normalmente aparece na chamada.",
        master: "Serve para cruzar horários; não inventar ausência específica sem o mestre decidir.",
      },
    ],
  }),

  base("pimentinha", "Pimentinha", NAO_DEFINIDO, {
    initialAttitude: NAO_DEFINIDO,
    masterNotes:
      "Nenhuma função ou origem informada no cânone. Deixar em aberto e preencher na mesa. Apelido é o nome usado no jogo.",
  }),

  base("giovan-cesaire", "Giovan Cesairé", "Clube de História", {
    locationIds: ["l-biblioteca", "l-conselho", "l-salas-aula"],
    initialAttitude: "Entusiasmado com qualquer investigação histórica.",
    masterNotes: "Ponto de conversa ligado ao Clube de História e ao arquivo, quando fizer sentido.",
    topics: [
      {
        id: "clube",
        label: "Clube de História",
        says: "A gente já levantou material antigo do campus. Se me disserem o ano, eu sei mais ou menos onde procurar.",
        master: "Ajuda de pesquisa. Nunca entrega conclusão pronta.",
      },
    ],
  }),

  base("elisa-pereira", "Elisa Pereira", "Professora de Português", {
    locationIds: ["l-salas-aula", "l-professores"],
    initialAttitude: "Atenciosa, cuidadosa com o que afirma.",
    masterNotes: "Sem segredo definido. Boa para leitura/interpretação de documento junto dos jogadores.",
    topics: [
      {
        id: "documento",
        label: "Ler um documento com ela",
        says: "Me mostra o texto. Muita coisa se resolve reparando em como foi escrito, não só no que está escrito.",
        master: "Pode conceder vantagem narrativa em interpretação de documento, a critério do mestre.",
        test: "Investigação / Ofício",
        dc: 10,
      },
    ],
  }),

  base("marcos-de-souza", "Marcos de Souza", "Zelador", {
    locationIds: ["l-corredores", "l-patio", "l-escadas", "l-banheiros-primeiro"],
    personality: ["observador", "discreto"],
    voice: "Fala pouco, em frases curtas, e nota o que está fora do lugar.",
    knows: ["Rotina de limpeza, manutenção e circulação por corredores."],
    initialAttitude: "Reservado; abre quando tratado com respeito.",
    masterNotes:
      "Cobre zeladoria/manutenção/corredores. Não atribuir a ele relatórios técnicos assinados por outro funcionário documental.",
    topics: [
      {
        id: "corredores",
        label: "Movimento nos corredores",
        says: "Eu passo por tudo aqui todo dia. Quando alguma coisa muda de lugar, eu percebo. Mas percebi não é o mesmo que vi quem fez.",
        master: "Pode confirmar anomalia física sem apontar autor.",
      },
      {
        id: "manutencao",
        label: "Manutenção / áreas fechadas",
        says: "Área fechada é fechada. Se estava aberta fora de hora, alguém abriu com chave ou credencial, porque eu não deixo assim.",
        master: "Reforça a pista de acesso credenciado, sem nomear titular.",
        test: "Diplomacia",
        dc: 15,
      },
    ],
  }),

  base("vick", "Vick (Ana Vitória)", "Estudante de Educação Física", {
    locationIds: ["l-quadra", "l-vestiarios", "l-patio"],
    initialAttitude: "Direta e sociável.",
    masterNotes: "Assuntos de quadra, vestiários e circulação de estudantes.",
    topics: [
      {
        id: "quadra",
        label: "Quadra e vestiários",
        says: "A gente treina quase todo dia. Se alguém estranho aparece por ali, chama atenção rápido.",
        master: "Testemunho de rotina, não de crime.",
      },
    ],
  }),

  base("melina-vieira", "Melina Vieira", NAO_DEFINIDO, {
    initialAttitude: NAO_DEFINIDO,
    masterNotes: "Sem função ou origem informada no cânone. Preencher na mesa conforme o uso.",
  }),

  base("camilla-gomes", "Camilla Gomes", "Professora de Educação Física", {
    locationIds: ["l-quadra", "l-vestiarios"],
    initialAttitude: "Objetiva; protege os alunos.",
    masterNotes: "Responsável presencial por quadra/vestiários e turmas de Educação Física.",
    topics: [
      {
        id: "turmas",
        label: "Turmas e frequência",
        says: "Eu sei quem estava na minha aula e quem não estava. O que aconteceu fora dela eu não posso afirmar.",
        master: "Cruzamento de horários, sem afirmar desaparecimento.",
      },
    ],
  }),

  base("lorenzo-juarez", "Lorenzo Juarez", "Policial / apoio externo", {
    locationIds: ["l-recepcao", "l-saida-principal"],
    personality: ["procedimental", "cético"],
    voice: "Fala em termos de ocorrência, prazo e competência.",
    initialAttitude: "Neutro; exige fato registrável antes de agir.",
    masterNotes:
      "Canal para polícia/segurança externa. Escalar com ele aumenta a atenção da universidade — usar como consequência, não como atalho de solução.",
    topics: [
      {
        id: "ocorrencia",
        label: "Registrar ocorrência",
        says: "Posso registrar, mas registro precisa de fato: data, local e o que exatamente vocês têm em mãos. Suspeita sozinha não anda.",
        master: "Se o grupo escalar sem evidência, considerar aumento de atenção institucional.",
        test: "Diplomacia",
        dc: 15,
      },
    ],
  }),
];

export function npcsForLocation(locationId?: string) {
  if (!locationId) return [];
  return NPCS.filter((n) => n.status !== "morto" && n.locationIds.includes(locationId));
}

export const npcById = (id: string) => NPCS.find((n) => n.id === id);
