export interface NpcTopic {
  id: string;
  label: string;
  says: string;
  master: string;
  test?: string;
  dc?: number;
  unlocks?: string[];
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  locationIds: string[];
  schedule: string;
  personality: string[];
  voice: string;
  knows: string[];
  doesNotKnow: string[];
  initialAttitude: string;
  topics: NpcTopic[];
}

export const NPCS: NpcDef[] = [
  {
    id: "cecilia",
    name: "Cecília Azevedo",
    role: "Bibliotecária / Arquivo Institucional",
    locationIds: ["l-biblioteca", "l-arquivo-morto"],
    schedule: "Biblioteca 08h–17h. Em 17/08, agenda prevê Arquivo às 15h10.",
    personality: ["metódica", "observadora", "protetora do acervo"],
    voice: "Fala baixa e precisa; prefere datas, códigos e fatos verificáveis.",
    knows: ["Ricardo consultou quatro caixas em 2018.", "OBR-17/18-A voltou à estante errada.", "Quatro caixas têm divergências."],
    doesNotKnow: ["Não conhece o propósito real do Bloco C."],
    initialAttitude: "Prestativa em assunto acadêmico; cautelosa com Diretoria e retiradas irregulares.",
    topics: [
      {
        id: "ricardo",
        label: "Ricardo Nogueira",
        says: "Ricardo? Sim. Ele veio como visitante e ficou horas no arquivo. Consultou obras, drenagem, segurança e autorizações da Diretoria no mesmo dia. Foi uma pesquisa bem específica.",
        master: "Sustentado pela ficha de consulta de 27/11/2018. Pode indicar DIR-18-R.",
        test: "Diplomacia / Investigação",
        dc: 10,
        unlocks: ["FICHA DE CONSULTA AO ARQUIVO INSTITUCIONAL"],
      },
      {
        id: "obr",
        label: "Caixa OBR-17/18-A",
        says: "Essa caixa está me incomodando. Voltou para a estante errada e duas folhas não batem com o restante. Eu ia conferir o lacre ainda hoje.",
        master: "Verdade registrada na agenda e no relatório de reorganização.",
        unlocks: ["AGENDA DE SERVIÇO", "RELATÓRIO DE REORGANIZAÇÃO DO ARQUIVO INSTITUCIONAL"],
      },
      {
        id: "bloco-c",
        label: "Bloco C",
        says: "Bloco C? Nesse nome, não. Se isso aparece em documento antigo, eu precisaria ver a referência antes de afirmar qualquer coisa.",
        master: "Não entregar conhecimento que os documentos ainda não sustentam.",
        test: "Diplomacia",
        dc: 15,
      },
    ],
  },
  {
    id: "mariana",
    name: "Mariana Costa",
    role: "Secretária Acadêmica",
    locationIds: ["l-secretaria", "l-administracao"],
    schedule: "Secretaria durante o expediente regular.",
    personality: ["procedimental", "cuidadosa", "institucional"],
    voice: "Responde em linguagem administrativa e evita especular.",
    knows: ["Há atendimentos extraordinários.", "A pasta de trancamentos 2023–2026 sumiu.", "A Diretoria controla registros extraordinários."],
    doesNotKnow: ["Não conhece a finalidade real das convocações."],
    initialAttitude: "Normal até perceber que o grupo está cruzando casos antigos.",
    topics: [
      {
        id: "22h",
        label: "Convocações às 22h",
        says: "Existem atendimentos extraordinários, sim. Eles são individuais e precisam ser confirmados com o setor responsável. A Secretaria não divulga lista pública.",
        master: "Não implica conhecimento da finalidade real.",
        unlocks: ["MEMORANDO INTERNO Nº 014/2023", "REGISTRO DE CORRESPONDÊNCIAS AUTOMATIZADAS"],
      },
      {
        id: "trancamentos",
        label: "Trancamentos",
        says: "No sistema, as alterações constam como trancamentos voluntários. Os anexos dessas solicitações não aparecem no cadastro atual.",
        master: "Com o documento 01, pode confirmar homologação em lote por UV-ADMIN-01.",
        test: "Diplomacia / Investigação",
        dc: 15,
        unlocks: ["RELATÓRIO CONSOLIDADO DE ALTERAÇÕES DE SITUAÇÃO ACADÊMICA"],
      },
    ],
  },
  {
    id: "renato",
    name: "Prof. Renato Moura",
    role: "Coordenador do Laboratório de Química",
    locationIds: ["l-lab-quimica"],
    schedule: "Segunda 08h–17h; terça 13h–18h.",
    personality: ["técnico", "franco", "irritado com burocracia"],
    voice: "Fala direto e usa quantidade, horário e procedimento como argumento.",
    knows: ["Faltam 42 L no estoque.", "Parte do lote saiu antes da conferência.", "A investigação interna foi indeferida."],
    doesNotKnow: ["Não sabe o destino real do material."],
    initialAttitude: "Coopera quando percebem a irregularidade como problema real.",
    topics: [
      {
        id: "42l",
        label: "42 litros ausentes",
        says: "O estoque não fecha. São quarenta e dois litros de diferença e não existe aula, pesquisa ou descarte que explique isso. Eu mandei o relatório para a Diretoria e a investigação foi indeferida.",
        master: "Sustentado pelos documentos 17 e 19.",
        unlocks: ["CONTROLE CONSOLIDADO DE REAGENTES", "LIVRO DE OCORRÊNCIAS DO LABORATÓRIO"],
      },
      {
        id: "madrugada",
        label: "Acesso de madrugada",
        says: "Eu não reservei o laboratório naquela madrugada. O sensor registrou abertura às 02h37. Para saber quem entrou, precisam do log eletrônico ou do cadastro mestre.",
        master: "Direciona ao documento 22 sem inventar o titular de UV-ADMIN-01.",
        unlocks: ["REGISTRO ELETRÔNICO DE ACESSOS"],
      },
    ],
  },
  {
    id: "samuel",
    name: "Samuel Nunes",
    role: "Infraestrutura / Tecnologia",
    locationIds: ["l-auditorio", "l-bastidores", "l-seguranca", "l-administracao"],
    schedule: "Segunda TI 08h–12h; terça palestra 10h30 e laboratório 14h–18h.",
    personality: ["analítico", "prático", "objetivo"],
    voice: "Usa linguagem técnica e traduz quando percebe que estão acompanhando.",
    knows: ["A manutenção criou exceção para credencial administrativa.", "O relatório do auditório aponta intervenção física."],
    doesNotKnow: ["Não conhece o propósito do Bloco C."],
    initialAttitude: "Neutro; melhora com evidência técnica.",
    topics: [
      {
        id: "refletor",
        label: "Refletor / cabo",
        says: "Se um cabo rompe por fadiga, a borda não fica daquele jeito. E a trava secundária estava aberta sem deformação. Tecnicamente, eu não chamaria isso de desgaste natural.",
        master: "Conteúdo técnico do documento 34. A hora impressa conflita com a timeline; não use o horário como prova até o mestre decidir.",
        unlocks: ["RELATÓRIO TÉCNICO DE MANUTENÇÃO DO AUDITÓRIO"],
      },
      {
        id: "catracas",
        label: "Manutenção das catracas",
        says: "A ordem de serviço mudou a lógica de acesso. Os bloqueios passaram a sincronizar com o sistema acadêmico e a credencial administrativa ganhou uma exceção própria.",
        master: "Baseado no documento 27.",
        unlocks: ["ORDEM DE SERVIÇO — MANUTENÇÃO DE CATRACAS"],
      },
    ],
  },
  {
    id: "joao",
    name: "João Batista",
    role: "Segurança Patrimonial",
    locationIds: ["l-seguranca", "l-corredores"],
    schedule: "Ronda documentada de 16→17/08: 22h–06h.",
    personality: ["atento", "objetivo", "cauteloso"],
    voice: "Fala em horário e localização, como quem preenche ocorrência.",
    knows: ["Viu uma pessoa no corredor sul às 02h38.", "Registrou alarme às 03h06 e odor metálico às 01h12."],
    doesNotKnow: ["Não confirmou a identidade da pessoa."],
    initialAttitude: "Coopera se pedirem confirmação, não um culpado pronto.",
    topics: [
      {
        id: "ronda",
        label: "Ronda noturna",
        says: "Às 02h38 eu vi uma pessoa cruzar o corredor sul, mas não consegui confirmar quem era. Às 03h06 a saída de serviço disparou por dezenove segundos. Isso está no relatório.",
        master: "Não dar identidade; o próprio documento diz que não foi confirmada.",
        unlocks: ["RELATÓRIO DE RONDA NOTURNA"],
      },
    ],
  },
];

export function npcsForLocation(locationId?: string) {
  return locationId ? NPCS.filter((npc) => npc.locationIds.includes(locationId)) : [];
}
