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
  {
    id: "helena-prado",
    name: "Helena Prado",
    role: "Atendimento / Identificação / Achados e Perdidos",
    locationIds: ["l-recepcao", "l-secretaria"],
    schedule: "Atendimento em horário comercial; aparece nos registros de identificação e Achados e Perdidos.",
    personality: ["cordial", "organizada", "atenta a protocolo"],
    voice: "Fala de forma simples e prática; costuma explicar o procedimento antes de opinar.",
    knows: ["Como funciona uma segunda via normal de credencial.", "Há retiradas e transferências antigas de objetos sem termo de entrega anexado."],
    doesNotKnow: ["Não sabe por que a Diretoria retirou determinados objetos nem o destino final deles."],
    initialAttitude: "Prestativa com consulta de rotina; cautelosa se pedirem retirada de objeto sem registro.",
    topics: [
      {
        id: "segunda-via",
        label: "Segunda via de crachá",
        says: "Quando alguém perde a credencial, a via anterior é bloqueada, a identidade é conferida e a retirada da nova fica registrada. É um procedimento bem simples e deixa rastro.",
        master: "Serve como comparação com os bloqueios anormais dos desaparecidos. Baseado no documento 25.",
        unlocks: ["SOLICITAÇÃO DE SEGUNDA VIA DE CREDENCIAL"],
      },
      {
        id: "achados",
        label: "Achados e Perdidos",
        says: "Tem alguns registros antigos que não fecham direito. Objetos foram transferidos ou retirados sem termo de entrega anexado. Eu consigo mostrar o inventário, mas não sei dizer por que fizeram assim.",
        master: "Baseado no documento 40. O papel físico contém uma referência antiga a Alice; não repetir esse nome automaticamente nem cadastrar Alice como NPC.",
        test: "Diplomacia / Investigação",
        dc: 10,
        unlocks: ["INVENTÁRIO DE ACHADOS E PERDIDOS"],
      },
    ],
  },
  {
    id: "larissa-duarte",
    name: "Larissa Duarte",
    role: "Técnica de Laboratório",
    locationIds: ["l-lab-quimica"],
    schedule: "Rotina do Laboratório de Química; o log registra tentativa de acesso negada em 17/08 às 00h12 e 00h13.",
    personality: ["cuidadosa", "prática", "precisa com inventário"],
    voice: "Fala em quantidade, patrimônio e localização; evita afirmar o que não consegue provar.",
    knows: ["Quatro recipientes de contenção e uma bomba de transferência estão ausentes.", "A retirada aparece como administrativa, sem setor de destino."],
    doesNotKnow: ["Não sabe onde o material foi parar nem quem o transportou fisicamente."],
    initialAttitude: "Cooperativa em assunto técnico; fica mais cautelosa quando a conversa vira credencial administrativa.",
    topics: [
      {
        id: "inventario",
        label: "Materiais ausentes",
        says: "Na conferência faltavam quatro recipientes de contenção e uma bomba de transferência. A retirada aparece como administrativa, mas não tem setor de destino nem previsão de devolução.",
        master: "Baseado no documento 20. Não atribuir autoria além da autorização administrativa registrada.",
        unlocks: ["INVENTÁRIO FÍSICO DE MATERIAIS"],
      },
      {
        id: "credencial",
        label: "Acesso noturno",
        says: "Meu acesso foi negado naquela madrugada. O que eu sei é isso. Se outra credencial entrou, o controlador de portas vai mostrar; eu não consigo dizer quem estava usando ela.",
        master: "Mantém a identidade em aberto e direciona ao documento 22.",
        unlocks: ["REGISTRO ELETRÔNICO DE ACESSOS"],
      },
    ],
  },
  {
    id: "marie-barbosa",
    name: "Marie Barbosa",
    role: "Docente de Artes / Coordenação de eventos",
    locationIds: ["l-auditorio", "l-bastidores", "l-salas-aula"],
    schedule: "Segunda: Ateliê 08h–11h e Auditório 14h–17h. Terça: Ateliê 13h–17h, conforme quadro docente.",
    personality: ["expressiva", "organizada", "protetora da equipe"],
    voice: "Fala rápido quando está trabalhando e lembra pessoas pelo que estavam fazendo no evento.",
    knows: ["Rotina de montagem do auditório.", "Quem deveria estar envolvido na organização de eventos e em quais funções."],
    doesNotKnow: ["Não possui conhecimento definido sobre Bloco C nem sobre a autoria do acidente."],
    initialAttitude: "Prestativa sobre horários, escala e evento; defensiva se alguém acusar a equipe sem evidência.",
    topics: [
      {
        id: "montagem",
        label: "Montagem do auditório",
        says: "A montagem tem rotina. Som, luz, chave e equipamento passam por gente específica. Se alguém mexeu em alguma coisa fora do combinado, dá para comparar a escala com quem realmente estava aqui.",
        master: "Ela pode orientar a procurar programação, escala, chaves e credenciamento, sem apontar culpado.",
        unlocks: ["PROGRAMAÇÃO OFICIAL DO AUDITÓRIO", "REGISTRO DE EMPRÉSTIMO DE CHAVES"],
      },
      {
        id: "equipe",
        label: "Equipe / voluntários",
        says: "Eu consigo dizer quem deveria estar na organização e em qual função. Para evento grande, voluntário e equipamento têm horário registrado — pelo menos deveriam ter.",
        master: "Pode direcionar ao documento 31 e aos registros de evento. O prop 31 contém nomes antigos; isso não transforma Thaissa em NPC.",
        unlocks: ["EQUIPE DE VOLUNTÁRIOS — MOSTRA DE ARTES E CIÊNCIA"],
      },
      {
        id: "acidente",
        label: "Acidente do refletor",
        says: "Eu estava preocupada com o evento, não investigando estrutura. O que eu consigo confirmar é quem estava previsto para trabalhar e o que deveria estar fechado ou sob controle.",
        master: "Não inventar que Marie viu a sabotagem ou um responsável. Use-a como testemunha de rotina e organização.",
        test: "Diplomacia",
        dc: 10,
      },
    ],
  },
];

export function npcsForLocation(locationId?: string) {
  return locationId ? NPCS.filter((npc) => npc.locationIds.includes(locationId)) : [];
}