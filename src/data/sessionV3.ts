import type { CampaignDay, CampaignLocation } from "@/lib/types";

export type ImprovSituation =
  | "CHEGADA"
  | "EXAMINAR"
  | "PROCURAR"
  | "CONVERSAR"
  | "TENSÃO"
  | "PERSEGUIÇÃO"
  | "CONFRONTO"
  | "DESCOBERTA"
  | "TRANSIÇÃO"
  | "AÇÃO LIVRE";

export type ImprovTone = "NEUTRO" | "INVESTIGAÇÃO" | "TENSÃO" | "HORROR" | "URGÊNCIA" | "PÓS-CAOS";

export interface CanonFact {
  id: string;
  day: CampaignDay;
  time: string;
  title: string;
  detail: string;
  involved: string[];
}

export const SESSION_ONE_RECAP: CanonFact[] = [
  { id: "canon-acidente", day: 1, time: "15:37", title: "Acidente no auditório", detail: "Um refletor/lustre caiu sobre um professor ainda sem nome canônico. O professor foi hospitalizado.", involved: ["Sofia", "Augusto", "Adolfo"] },
  { id: "canon-cabo", day: 1, time: "15:38", title: "Sofia viu o vulto e o cabo cortado", detail: "Sofia percebeu um vulto passando e confirmou que a corda/cabo da estrutura tinha sido cortado.", involved: ["Sofia"] },
  { id: "canon-irmaos", day: 1, time: "20:30", title: "Sofia conheceu os irmãos Nogueira", detail: "Sofia conversou com Jade e Vitor Hugo Nogueira e obteve informações. Os irmãos já haviam tentado chegar ao Bloco C, mas o controle por cartão impediu o acesso.", involved: ["Sofia", "Jade Nogueira", "Vitor Hugo Nogueira"] },
  { id: "canon-adolfo-caos", day: 1, time: "21:00", title: "Caos de Adolfo no fechamento", detail: "Adolfo tentou permanecer escondido no campus. A fuga passou pelo banheiro e terminou em perseguição, portas da Secretaria/Auditório destruídas, queda na escada e confronto com Augusto. Depois os dois conversaram e encerraram o conflito.", involved: ["Adolfo", "Augusto"] },
  { id: "canon-hospital", day: 1, time: "22:00", title: "Augusto foi ao hospital", detail: "Augusto visitou o professor ferido no hospital.", involved: ["Augusto"] },
  { id: "canon-paternidade", day: 2, time: "14:00", title: "Sofia descobriu a paternidade", detail: "Ao investigar caixas de mudança com resultado 24 em Investigação, Sofia encontrou uma foto da mãe com Augusto e descobriu que é filha dele.", involved: ["Sofia", "Augusto"] },
  { id: "canon-aproximacao", day: 2, time: "18:00", title: "Aliança informal", detail: "Sofia se aproximou mais de Jade, Vitor Hugo e Adolfo.", involved: ["Sofia", "Jade Nogueira", "Vitor Hugo Nogueira", "Adolfo"] },
  { id: "canon-invasao", day: 2, time: "21:00", title: "Ponto atual — invasão noturna", detail: "Jade, Vitor Hugo, Adolfo e Sofia combinaram invadir a universidade e a sessão terminou quando estavam entrando/iniciando a invasão.", involved: ["Sofia", "Adolfo", "Jade Nogueira", "Vitor Hugo Nogueira"] },
  { id: "canon-percy-npc", day: 2, time: "21:00", title: "Percy entra como NPC", detail: "Percy deixou de ser personagem de jogador (Andy saiu da campanha). No início da invasão noturna, Percy aparece e se junta ao grupo como NPC controlado pelo mestre, preservando seu histórico e sua missão secreta — que agora é material do mestre.", involved: ["Percy", "Sofia", "Adolfo", "Jade Nogueira", "Vitor Hugo Nogueira"] },
];

export interface FlexibleEvent {
  id: string;
  day: CampaignDay;
  time: string;
  title: string;
  kind: "CANON" | "POSSÍVEL" | "PRESSÃO" | "CONTINGÊNCIA" | "CLÍMAX";
  description: string;
  trigger: string;
  locationIds: string[];
  narration?: string;
  gmNote?: string;
}

export const V3_EVENTS: FlexibleEvent[] = [
  {
    id: "v3-d2-invasao",
    day: 2,
    time: "21:00",
    title: "Retomar a invasão",
    kind: "CANON",
    description: "Continue exatamente do ponto em que Sofia, Adolfo, Jade e Vitor Hugo estavam entrando no campus. Percy aparece aqui como NPC e se junta ao grupo.",
    trigger: "Abertura da próxima sessão.",
    locationIds: ["l-saida-principal", "l-recepcao", "l-patio"],
    narration: "A universidade à noite não parece vazia; parece suspensa. As luzes de emergência recortam os corredores e todo ruído fica maior do que deveria. As marcas das portas danificadas ainda estão ali, lembrando que qualquer segurança atento já tem motivo para desconfiar de movimento fora de hora. Antes de o grupo escolher por onde entrar, uma figura se destaca do escuro perto do acesso: Percy, esperando, como se já soubesse do plano.",
    gmNote: "Não empurre o grupo para uma sala específica. Mostre os acessos e deixe escolherem o primeiro alvo. Percy é NPC do mestre: pode ter falas e reações prontas, mas o grupo decide se aceita a companhia. Nunca narre fala ou decisão por Augusto, Sofia, Adolfo ou Amelie.",
  },
  {
    id: "v3-d2-ronda",
    day: 2,
    time: "22:00",
    title: "Campus entra em protocolo noturno",
    kind: "PRESSÃO",
    description: "A circulação após 22h fica mais arriscada. Segurança, registros e portas passam a importar.",
    trigger: "Se a invasão se prolongar ou o grupo fizer barulho.",
    locationIds: ["l-corredores", "l-secretaria", "l-seguranca"],
    gmNote: "Use como pressão, não como bloqueio. Uma ronda pode ser evitada, enganada ou seguida.",
  },
  {
    id: "v3-d2-evidencia",
    day: 2,
    time: "22:20",
    title: "Primeira linha concreta da invasão",
    kind: "POSSÍVEL",
    description: "Qualquer uma das rotas — Segurança, Arquivo, Laboratório ou Secretaria — pode entregar uma peça forte do padrão.",
    trigger: "Quando o grupo investigar seriamente um setor.",
    locationIds: ["l-seguranca", "l-arquivo-morto", "l-lab-quimica", "l-secretaria"],
    gmNote: "Evite premiar só uma rota. Segurança → acessos/câmeras; Arquivo → Ricardo/reforma; Química → HF; Secretaria → crachá/Wi-Fi/convocações.",
  },
  {
    id: "v3-d3-abertura",
    day: 3,
    time: "08:00",
    title: "Quarta-feira — o campus absorve o caos",
    kind: "POSSÍVEL",
    description: "A rotina tenta continuar enquanto os danos e a investigação da noite anterior começam a deixar consequências.",
    trigger: "Quando o grupo encerrar a invasão ou a manhã chegar.",
    locationIds: ["l-patio", "l-secretaria", "l-auditorio"],
    narration: "Na quarta-feira, a Universidade Valença abre como se fosse possível resolver dois dias de confusão com fita de isolamento, ordens de serviço e uma camada nova de burocracia. As aulas continuam. As portas danificadas, não.",
  },
  {
    id: "v3-d3-vestiarios",
    day: 3,
    time: "06:30",
    title: "Sanitização dos vestiários",
    kind: "POSSÍVEL",
    description: "O bloqueio programado cria uma janela em que a circulação naquele setor muda e objetos podem ir para Achados e Perdidos.",
    trigger: "Se o grupo investigar quadra/vestiários ou precisar de uma cobertura plausível.",
    locationIds: ["l-vestiarios", "l-quadra"],
  },
  {
    id: "v3-d3-registros",
    day: 3,
    time: "10:00",
    title: "Cruzar o padrão das vítimas",
    kind: "POSSÍVEL",
    description: "Wi-Fi, crachá, convocação noturna e desaparecimento começam a formar um ciclo verificável.",
    trigger: "Quando duas ou mais fontes documentais forem comparadas.",
    locationIds: ["l-secretaria", "l-conselho", "l-biblioteca", "l-seguranca"],
    gmNote: "Entregue o padrão por camadas. Não revele quem executa o ciclo sem evidência obtida em mesa.",
  },
  {
    id: "v3-d3-remocao",
    day: 3,
    time: "15:00",
    title: "Documentos começam a sumir",
    kind: "PRESSÃO",
    description: "Se o grupo chamou muita atenção, alguns registros deixam o lugar habitual ou exigem autorização extra.",
    trigger: "Atenção alta, invasão descoberta ou confronto com funcionário.",
    locationIds: ["l-secretaria", "l-administracao", "l-arquivo-morto"],
    gmNote: "Nunca destrua pista obrigatória. Mova a informação para log digital, cópia, NPC ou documento correlato.",
  },
  {
    id: "v3-d3-blococ",
    day: 3,
    time: "20:30",
    title: "A presença do Bloco C fica mais concreta",
    kind: "POSSÍVEL",
    description: "Rota técnica, etiquetas antigas, controle de acesso e reformas podem convergir para uma área apagada do campus.",
    trigger: "Se o grupo ligar arquivo/reforma + manutenção/acesso.",
    locationIds: ["l-manutencao", "l-bloco-c", "l-arquivo-morto"],
    gmNote: "Aproximar não significa abrir. Permita investigação da barreira e outras formas de conseguir acesso.",
  },
  {
    id: "v3-d4-mostra",
    day: 4,
    time: "10:00",
    title: "Mostra de Artes e Ciência",
    kind: "POSSÍVEL",
    description: "Mais pessoas, materiais e circulação dão cobertura para investigar, mas também criam testemunhas e ruído.",
    trigger: "Durante a quinta-feira, principalmente se o grupo precisar circular sem chamar atenção.",
    locationIds: ["l-patio", "l-auditorio", "l-salas-aula"],
    gmNote: "O prop legado da equipe de voluntários tem nomes antigos; trate isso só como conflito de documento, não como retorno de personagem removido.",
  },
  {
    id: "v3-d4-convergencia",
    day: 4,
    time: "16:00",
    title: "As linhas começam a convergir",
    kind: "PRESSÃO",
    description: "Ácido fluorídrico, acessos administrativos, câmera, arquivo de Ricardo e desaparecimentos podem apontar para o mesmo núcleo físico sem definir automaticamente um culpado.",
    trigger: "Quando o grupo tiver três ou mais linhas fortes de evidência.",
    locationIds: ["l-lab-quimica", "l-seguranca", "l-arquivo-morto", "l-manutencao"],
  },
  {
    id: "v3-d4-organico",
    day: 4,
    time: "22:00",
    title: "Anomalias próximas ao setor oculto",
    kind: "POSSÍVEL",
    description: "Som, temperatura, odor metálico/orgânico ou vibração podem indicar que a explicação já não é apenas administrativa.",
    trigger: "Somente perto do Bloco C ou quando evidências suficientes justificarem horror aberto.",
    locationIds: ["l-manutencao", "l-bloco-c"],
    narration: "Quanto mais perto da área técnica, menos o prédio soa como um prédio. Há uma vibração baixa atravessando o concreto e um cheiro que mistura ferrugem, produto químico e alguma coisa quente demais para estar atrás de uma parede.",
  },
  {
    id: "v3-d5-abertura",
    day: 5,
    time: "08:00",
    title: "Sexta-feira — última margem",
    kind: "PRESSÃO",
    description: "A universidade tenta manter rotina enquanto o prazo real da campanha se aproxima.",
    trigger: "Início da sexta-feira.",
    locationIds: ["l-patio"],
    narration: "Sexta-feira chega sem cerimônia. O campus está aberto, as aulas existem e os avisos continuam nos murais. O problema é que agora cada rotina normal parece estar acontecendo em cima de alguma coisa que não pode continuar escondida por muito mais tempo.",
  },
  {
    id: "v3-d5-apagamento",
    day: 5,
    time: "20:00",
    title: "Sistemas começam a falhar",
    kind: "PRESSÃO",
    description: "Oscilações de energia, rede e registros aumentam a urgência sem retirar a agência do grupo.",
    trigger: "Quando anoitecer ou se o grupo estiver perto de descobrir o núcleo.",
    locationIds: ["l-seguranca", "l-secretaria", "l-manutencao", "l-bloco-c"],
  },
  {
    id: "v3-d5-ultima-rota",
    day: 5,
    time: "23:30",
    title: "Última janela para chegar ao núcleo",
    kind: "CONTINGÊNCIA",
    description: "Se o grupo ainda não encontrou o caminho, uma evidência redundante deve conectar manutenção, acesso administrativo e área apagada.",
    trigger: "Só se a investigação tiver travado antes da madrugada final.",
    locationIds: ["l-manutencao", "l-seguranca", "l-arquivo-morto"],
    gmNote: "Não entregue a resposta; entregue o caminho. O grupo ainda precisa decidir entrar e como agir.",
  },
  {
    id: "v3-d5-0333",
    day: 5,
    time: "03:33",
    title: "03:33 — clímax do Berço",
    kind: "CLÍMAX",
    description: "O prazo do pacto chega. O que acontece depende do que foi descoberto, impedido ou permitido em mesa.",
    trigger: "21/08/2026 às 03:33, se a história alcançar esse ponto.",
    locationIds: ["l-bloco-c"],
    gmNote: "Não force uma única resolução. Use o estado das pistas, relações e ações anteriores para definir opções e consequências.",
  },
];

export const GUIDE_BY_DAY: Record<CampaignDay, { now: string; ifTheyGo: string; events: string; pending: string; contingency: string }> = {
  1: {
    now: "Dia já concluído em mesa. Use apenas para consultar o histórico.",
    ifTheyGo: "Não reencene eventos concluídos; descreva as marcas deixadas por eles.",
    events: "Acidente do auditório, descoberta do cabo, encontro com os Nogueira e caos de Adolfo já aconteceram.",
    pending: "Somente pistas do Dia 1 que ainda façam sentido podem ser recuperadas por foto, testemunha ou registro.",
    contingency: "Se algo antigo for necessário, entregue por fonte redundante sem apagar o cânone da mesa.",
  },
  2: {
    now: "21h: Sofia, Adolfo, Jade e Vitor Hugo iniciam a invasão noturna. Comece perguntando qual setor querem atingir primeiro e mostre atalhos de locais.",
    ifTheyGo: "Segurança = câmeras/acessos; Secretaria = crachá/Wi-Fi/convocações; Arquivo = Ricardo/reforma; Química = HF; Manutenção = setor apagado/Bloco C.",
    events: "Ronda após 22h, danos das portas chamando atenção e qualquer registro digital gerado pela invasão.",
    pending: "Priorize pelo menos uma linha concreta nova. Não exija que encontrem todas na mesma noite.",
    contingency: "Se travarem, um ruído/ronda força movimento e coloca diante deles uma rota de serviço ou um terminal ainda ligado.",
  },
  3: {
    now: "Quarta-feira deve reagir ao que aconteceu na invasão. A universidade continua funcionando, mas as consequências são visíveis.",
    ifTheyGo: "Qualquer sala é válida. Dê uma introdução do local e depois ofereça ações locais, pistas e NPCs compatíveis.",
    events: "Sanitização dos vestiários, cruzamento do padrão das vítimas, possível remoção de documentos e aproximação do Bloco C.",
    pending: "O grupo precisa conseguir conectar ao menos duas entre: vítimas, acesso administrativo, laboratório, CFTV, Ricardo/reforma e Bloco C.",
    contingency: "Pista obrigatória perdida reaparece como cópia, log, testemunho ou documento correlato — nunca como resposta pronta.",
  },
  4: {
    now: "Quinta-feira aumenta cobertura e pressão. A Mostra cria movimento suficiente para investigar e dificuldade suficiente para tudo poder dar errado.",
    ifTheyGo: "Use o evento para justificar circulação. Fora dele, mantenha os setores normais disponíveis e a vigilância proporcional ao que fizeram.",
    events: "Mostra, convergência das linhas documentais e primeiros sinais abertamente anormais perto do setor oculto.",
    pending: "Antes da madrugada final, o grupo deve ter meios de localizar o núcleo e entender que existe um prazo/ritual, mesmo sem dominar todos os detalhes.",
    contingency: "Se estiverem longe do núcleo, faça duas evidências já encontradas apontarem para o mesmo acesso físico.",
  },
  5: {
    now: "Sexta-feira é pressão, não trilho. Eles ainda escolhem onde ir, quem confrontar e se entram no Bloco C.",
    ifTheyGo: "Todos os locais continuam válidos, mas registros podem falhar, pessoas podem ter ido embora e rotas técnicas ganham importância.",
    events: "Falhas crescentes à noite, última janela para localizar o núcleo e clímax às 03:33.",
    pending: "O que ainda não foi descoberto deve mudar opções do clímax, não impedir a história de acontecer.",
    contingency: "Se chegarem à madrugada sem rota, entregue o acesso — não a solução — através de uma anomalia ou registro redundante.",
  },
};

const LOCATION_FLAVOR: Record<string, { sense: string; useful: string }> = {
  "l-patio": { sense: "vozes espalhadas, passos cruzando o pátio e som de portas abrindo ao redor", useful: "linhas de visão, fluxo de pessoas e acessos para outros setores" },
  "l-auditorio": { sense: "poeira, metal e o eco amplo de um espaço que ainda carrega as marcas do acidente", useful: "estrutura, bastidores, acessos técnicos e marcas deixadas depois da queda" },
  "l-passarela": { sense: "calor preso perto do teto, grade metálica sob os pés e o vazio do auditório abaixo", useful: "fixações, rotas técnicas e sinais de passagem" },
  "l-bastidores": { sense: "cortinas pesadas, caixas de equipamento e corredores estreitos fora da vista do público", useful: "saídas de serviço, objetos esquecidos e circulação técnica" },
  "l-refeitorio": { sense: "cheiro de comida, bandejas batendo e ruído constante de conversa", useful: "rotina de estudantes, equipe de serviço e acessos da cozinha" },
  "l-corredores": { sense: "luz fria, portas repetidas e ruídos que chegam de salas diferentes", useful: "sinalização, circulação e desvios para áreas menos usadas" },
  "l-saida-principal": { sense: "catracas, vidro da portaria e o som seco dos leitores de credencial", useful: "entradas, saídas, crachás e comportamento da segurança" },
  "l-recepcao": { sense: "balcão iluminado, papéis de atendimento e visão direta para a entrada", useful: "listas, achados e perdidos e informação de circulação" },
  "l-secretaria": { sense: "monitores acesos, impressoras e pastas administrativas organizadas por protocolo", useful: "credenciais, chamados, convocações e histórico acadêmico" },
  "l-conselho": { sense: "mural cheio, cadeiras desalinhadas e pastas mantidas por alunos", useful: "atas, reclamações, chaves e registros estudantis" },
  "l-biblioteca": { sense: "ar mais frio, páginas, computadores silenciosos e estantes que abafam o resto do campus", useful: "pesquisa histórica, plantas, nomes e arquivos institucionais" },
  "l-arquivo-morto": { sense: "papel antigo, caixas lacradas e poeira acumulada onde quase ninguém entra", useful: "sequência de documentos, lacres, reformas e consultas antigas" },
  "l-lab-quimica": { sense: "odor químico controlado, bancadas limpas e armários de reagentes trancados", useful: "estoque, livro de ocorrências, acessos e materiais retirados" },
  "l-lab-biologia": { sense: "luz branca, microscópios e material didático organizado nas bancadas", useful: "rotina acadêmica, anatomia e comparação de materiais" },
  "l-professores": { sense: "café frio, escaninhos, papéis de aula e conversas que morrem quando alguém entra", useful: "horários, versões de professores e rumores internos" },
  "l-diretor": { sense: "silêncio de gabinete, arquivos administrativos e uma mesa que concentra decisões institucionais", useful: "autorizações, documentos pessoais e relação com a Diretoria" },
  "l-seguranca": { sense: "monitores, rádio baixo e registros de acesso correndo em telas separadas", useful: "câmeras, sensores, credenciais e horários" },
  "l-manutencao": { sense: "concreto aparente, tubulação, iluminação de serviço e um ruído baixo do prédio", useful: "rotas ocultas, etiquetas antigas e sinais de uso recente" },
  "l-quadra": { sense: "eco de bola, tênis no piso e arquibancadas abertas para o corredor", useful: "movimento de alunos e acesso aos vestiários" },
  "l-vestiarios": { sense: "azulejo úmido, armários metálicos e cheiro recente de produto de limpeza", useful: "objetos deixados, horários de limpeza e circulação lateral" },
  "l-bloco-c": { sense: "ar pesado, concreto antigo e uma vibração quase contínua atravessando a estrutura", useful: "barreiras de acesso, infraestrutura escondida e sinais que não pertencem ao campus comum" },
};

const situationText: Record<ImprovSituation, string> = {
  CHEGADA: "Ao entrar, o primeiro minuto serve para entender o espaço antes de escolher um alvo.",
  EXAMINAR: "De perto, detalhes pequenos deixam de se misturar ao cenário. Nada aqui confirma uma resposta sozinho; o valor está em comparar o que parece normal com o que foge do padrão.",
  PROCURAR: "A busca começa pelo que faria sentido existir aqui: registros, objetos deslocados, marcas de uso e coisas guardadas fora do lugar habitual.",
  CONVERSAR: "A conversa pode começar comum. O que importa é observar não só a resposta, mas quais assuntos mudam o ritmo, a postura ou a precisão de quem fala.",
  TENSÃO: "O ambiente não muda de uma vez. Primeiro vêm sinais pequenos — um ruído que se repete, movimento ao longe ou a sensação clara de que permanecer parado aumenta o risco de ser percebido.",
  PERSEGUIÇÃO: "O espaço vira parte do problema. Portas, quinas, escadas e corredores definem linhas de visão e rotas possíveis; ninguém recebe vantagem automática só por correr primeiro.",
  CONFRONTO: "A distância entre as pessoas diminui e a conversa perde espaço. Antes de qualquer resultado, posição, cobertura, saídas e quem está presente ainda podem mudar a situação.",
  DESCOBERTA: "O que chama atenção não parece espetacular à primeira vista. É a incompatibilidade com o restante do ambiente que faz o detalhe ganhar peso.",
  TRANSIÇÃO: "Ao deixar o setor, o que foi visto continua útil: posição de portas, pessoas presentes, horários e qualquer mudança que possa ser comparada numa visita futura.",
  "AÇÃO LIVRE": "O ambiente reage de forma coerente ao que foi feito, mas o resultado ainda depende da abordagem e, quando houver risco ou incerteza real, de um teste apropriado.",
};

const toneText: Record<ImprovTone, string> = {
  NEUTRO: "A cena permanece aberta, sem indicar por conta própria que existe perigo ou segredo.",
  INVESTIGAÇÃO: "Há informação suficiente para formular uma próxima pergunta, não para fechar uma conclusão.",
  TENSÃO: "Cada minuto parado torna mais provável que alguém apareça ou perceba que algo está fora da rotina.",
  HORROR: "Algum detalhe físico parece errado de um jeito difícil de explicar como simples manutenção, mas a causa ainda não está visível.",
  URGÊNCIA: "O tempo para agir é curto; o lugar pode mudar, ser isolado ou receber outras pessoas a qualquer momento.",
  "PÓS-CAOS": "O local carrega sinais recentes do que aconteceu, e esses sinais alteram como qualquer pessoa interpreta a presença do grupo ali.",
};

export const IMPROV_SITUATIONS: ImprovSituation[] = ["CHEGADA", "EXAMINAR", "PROCURAR", "CONVERSAR", "TENSÃO", "PERSEGUIÇÃO", "CONFRONTO", "DESCOBERTA", "TRANSIÇÃO", "AÇÃO LIVRE"];
export const IMPROV_TONES: ImprovTone[] = ["NEUTRO", "INVESTIGAÇÃO", "TENSÃO", "HORROR", "URGÊNCIA", "PÓS-CAOS"];

export function buildImprovNarration(location: CampaignLocation | undefined, situation: ImprovSituation, tone: ImprovTone, playerAction?: string, npcName?: string) {
  const name = location?.name ?? "o local";
  const flavor = LOCATION_FLAVOR[location?.id ?? ""] ?? {
    sense: location?.description?.toLowerCase() || "sons e movimento coerentes com a rotina do setor",
    useful: "acessos, pessoas, objetos e qualquer detalhe fora do padrão",
  };
  const action = playerAction?.trim()
    ? `O que vocês fizeram — ${playerAction.trim()} — direciona a atenção para ${flavor.useful}, sem decidir antecipadamente se a tentativa deu certo.`
    : situation === "CONVERSAR" && npcName
      ? `${npcName} está no centro da conversa; a resposta deve respeitar apenas o que esse personagem realmente sabe.`
      : `Há espaço para investigar ${flavor.useful}.`;
  return `Em ${name}, o ambiente se apresenta por ${flavor.sense}. ${situationText[situation]}\n\n${action} ${toneText[tone]}`;
}

export const GENERIC_TEST_RESULTS = {
  "SUCESSO ALTO": "A tentativa produz mais do que a resposta imediata: além do objetivo principal, um detalhe coerente do ambiente abre uma nova linha de investigação.",
  SUCESSO: "A abordagem funciona. O resultado aparece de forma clara o bastante para ser usado como informação ou vantagem na cena, sem acrescentar um segredo que ainda não foi descoberto.",
  PARCIAL: "A tentativa avança, mas não resolve tudo. Uma parte útil fica disponível enquanto outra exige tempo, custo, exposição ou uma abordagem diferente.",
  FALHA: "A tentativa não entrega o objetivo agora. A situação continua aberta e a informação importante permanece recuperável por outra abordagem.",
  "FALHA CRÍTICA": "Além de não alcançar o objetivo, a tentativa muda a situação: chama atenção, consome tempo ou cria uma complicação concreta. A pista essencial não desaparece para sempre.",
} as const;

export function suggestedTestForSituation(situation: ImprovSituation) {
  if (situation === "EXAMINAR" || situation === "PROCURAR" || situation === "DESCOBERTA") return "Investigação ou Percepção";
  if (situation === "CONVERSAR") return "Diplomacia, Intuição, Enganação ou Intimidação";
  if (situation === "PERSEGUIÇÃO") return "Atletismo, Acrobacia ou Furtividade";
  if (situation === "CONFRONTO") return "Iniciativa / teste apropriado à ação";
  if (situation === "TENSÃO") return "Percepção, Vontade ou Furtividade";
  return "Sem teste obrigatório — só role se houver risco e incerteza";
}
