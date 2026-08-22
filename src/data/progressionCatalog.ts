import type { CharacterSheetData, OrdemAttribute } from "@/data/ordemRules";
import { baseClassOf, type OrdemBaseClass, type ParanormalElement } from "@/data/ordemProgression";

export interface TrailAbilityDef {
  name: string;
  hint: string;
}

export type TrailAbilityNex = 10 | 40 | 65 | 99;

export const TRAIL_ABILITIES: Record<OrdemBaseClass, Record<string, Record<TrailAbilityNex, TrailAbilityDef>>> = {
  Combatente: {
    Aniquilador: {
      10: { name: "A Favorita", hint: "Especializa você em uma arma favorita." },
      40: { name: "Técnica Secreta", hint: "Libera técnicas especiais com a arma favorita." },
      65: { name: "Técnica Sublime", hint: "Aprimora ainda mais suas técnicas de combate." },
      99: { name: "Máquina de Matar", hint: "Representa o auge da especialização ofensiva da trilha." },
    },
    "Comandante de Campo": {
      10: { name: "Inspirar Confiança", hint: "Ajuda aliados a se recuperarem de resultados ruins." },
      40: { name: "Estrategista", hint: "Melhora o posicionamento e as opções táticas do grupo." },
      65: { name: "Brecha na Guarda", hint: "Ajuda aliados a aproveitar aberturas no inimigo." },
      99: { name: "Oficial Comandante", hint: "Amplia sua capacidade de coordenar a equipe." },
    },
    Guerreiro: {
      10: { name: "Técnica Letal", hint: "Aprimora seus golpes corpo a corpo." },
      40: { name: "Revidar", hint: "Permite responder melhor a ataques em combate próximo." },
      65: { name: "Força Opressora", hint: "Torna seus ataques físicos mais difíceis de ignorar." },
      99: { name: "Potência Máxima", hint: "Leva a capacidade ofensiva da trilha ao limite." },
    },
    "Operações Especiais": {
      10: { name: "Iniciativa Aprimorada", hint: "Faz você agir mais cedo e responder rápido ao perigo." },
      40: { name: "Ataque Extra", hint: "Aumenta seu ritmo ofensivo em combate." },
      65: { name: "Surto de Adrenalina", hint: "Permite um pico de ação em momentos importantes." },
      99: { name: "Sempre Alerta", hint: "Representa reflexos e prontidão no nível máximo." },
    },
    "Tropa de Choque": {
      10: { name: "Casca Grossa", hint: "Aumenta sua capacidade de aguentar dano." },
      40: { name: "Cai Dentro", hint: "Ajuda você a proteger aliados e segurar a linha de frente." },
      65: { name: "Duro de Matar", hint: "Torna mais difícil derrubar você definitivamente." },
      99: { name: "Inquebrável", hint: "É o auge da resistência física da trilha." },
    },
  },
  Especialista: {
    "Atirador de Elite": {
      10: { name: "Mira de Elite", hint: "Especializa você em disparos precisos de longa distância." },
      40: { name: "Disparo Letal", hint: "Aprimora o potencial de dano dos seus disparos." },
      65: { name: "Disparo Impactante", hint: "Seus tiros passam a controlar melhor o alvo e o campo." },
      99: { name: "Atirar para Matar", hint: "Representa o auge da precisão ofensiva da trilha." },
    },
    Infiltrador: {
      10: { name: "Ataque Furtivo", hint: "Recompensa atacar sem ser percebido ou em boa posição." },
      40: { name: "Gatuno", hint: "Aprimora infiltração, mobilidade e ações discretas." },
      65: { name: "Assassinar", hint: "Torna emboscadas e ataques preparados mais perigosos." },
      99: { name: "Sombra Fugaz", hint: "Leva sua furtividade e evasão ao extremo." },
    },
    "Médico de Campo": {
      10: { name: "Paramédico", hint: "Melhora sua capacidade de estabilizar e recuperar aliados." },
      40: { name: "Equipe de Trauma", hint: "Aprimora atendimento rápido durante situações perigosas." },
      65: { name: "Resgate", hint: "Ajuda a retirar e salvar aliados em condições críticas." },
      99: { name: "Médico em Plantão", hint: "Representa o auge da eficiência médica da trilha." },
    },
    Negociador: {
      10: { name: "Eloquência", hint: "Aprimora sua capacidade de convencer e conduzir conversas." },
      40: { name: "Discurso Motivador", hint: "Suas palavras passam a ajudar diretamente seus aliados." },
      65: { name: "Eu Conheço um Cara", hint: "Facilita conseguir contatos e soluções sociais úteis." },
      99: { name: "Truque de Mestre", hint: "É o auge da influência e improvisação social da trilha." },
    },
    Técnico: {
      10: { name: "Inventário Otimizado", hint: "Permite aproveitar melhor o espaço e os equipamentos carregados." },
      40: { name: "Remendão", hint: "Aprimora reparos e uso criativo de equipamentos." },
      65: { name: "Improvisar", hint: "Ajuda a encontrar a ferramenta certa para situações inesperadas." },
      99: { name: "Preparado para Tudo", hint: "Representa o auge da versatilidade com equipamentos." },
    },
  },
  Ocultista: {
    Conduíte: {
      10: { name: "Ampliar Ritual", hint: "Aumenta a flexibilidade ao conjurar rituais." },
      40: { name: "Acelerar Ritual", hint: "Permite conjurar com mais velocidade em situações críticas." },
      65: { name: "Anular Ritual", hint: "Dá ferramentas para interferir em rituais inimigos." },
      99: { name: "Canalizar o Medo", hint: "Representa o auge do domínio sobre a condução paranormal." },
    },
    Flagelador: {
      10: { name: "Poder do Flagelo", hint: "Transforma sofrimento em recurso para o paranormal." },
      40: { name: "Abraçar a Dor", hint: "Aprimora sua resistência ao custo de usar o paranormal." },
      65: { name: "Absorver Agonia", hint: "Converte situações dolorosas em vantagem para a trilha." },
      99: { name: "Medo Tangível", hint: "Representa o auge da ligação entre dor e paranormal." },
    },
    Graduado: {
      10: { name: "Saber Ampliado", hint: "Expande seu repertório e conhecimento ritualístico." },
      40: { name: "Grimório Ritualístico", hint: "Organiza e amplia suas opções de rituais conhecidos." },
      65: { name: "Rituais Eficientes", hint: "Torna a conjuração mais eficiente e sustentável." },
      99: { name: "Conhecendo o Medo", hint: "Representa o auge do estudo ritualístico da trilha." },
    },
    Intuitivo: {
      10: { name: "Mente Sã", hint: "Aumenta sua resistência aos impactos mentais do paranormal." },
      40: { name: "Presença Poderosa", hint: "Aprimora sua presença e resistência em situações paranormais." },
      65: { name: "Inabalável", hint: "Torna sua mente muito mais difícil de quebrar." },
      99: { name: "Presença do Medo", hint: "Representa o auge da estabilidade mental da trilha." },
    },
    "Lâmina Paranormal": {
      10: { name: "Lâmina Maldita", hint: "Combina armas e ocultismo desde o início da trilha." },
      40: { name: "Gladiador Paranormal", hint: "Recompensa lutar corpo a corpo usando o paranormal." },
      65: { name: "Conjuração Marcial", hint: "Integra melhor ataques e conjuração no mesmo estilo de combate." },
      99: { name: "Lâmina do Medo", hint: "Representa o auge da união entre arma e paranormal." },
    },
  },
};

export interface GuidedPower {
  id: string;
  name: string;
  hint: string;
  minNex?: number;
  attribute?: { id: OrdemAttribute; min: number };
  trainedAny?: string[];
  trainedAll?: string[];
  requiresPower?: string;
  repeatable?: boolean;
}

const commonPowers: GuidedPower[] = [
  { id: "treinamento-pericia", name: "Treinamento em Perícia", hint: "Aumenta o treinamento de duas perícias.", repeatable: true },
];

export const CLASS_POWERS: Record<OrdemBaseClass, GuidedPower[]> = {
  Combatente: [
    { id: "armamento-pesado", name: "Armamento Pesado", hint: "Libera melhor uso de armamento pesado.", attribute: { id: "FOR", min: 2 } },
    { id: "artista-marcial", name: "Artista Marcial", hint: "Melhora seu combate desarmado." },
    { id: "ataque-oportunidade", name: "Ataque de Oportunidade", hint: "Ajuda a punir inimigos que abrem a guarda." },
    { id: "combater-duas-armas", name: "Combater com Duas Armas", hint: "Permite lutar de forma eficiente com duas armas.", attribute: { id: "AGI", min: 3 }, trainedAny: ["luta", "pontaria"] },
    { id: "combate-defensivo", name: "Combate Defensivo", hint: "Troca parte da ofensiva por mais segurança.", attribute: { id: "INT", min: 2 } },
    { id: "golpe-demolidor", name: "Golpe Demolidor", hint: "Aumenta sua eficiência ao destruir e quebrar alvos.", attribute: { id: "FOR", min: 2 }, trainedAll: ["luta"] },
    { id: "golpe-pesado", name: "Golpe Pesado", hint: "Aumenta o impacto de ataques corpo a corpo." },
    { id: "incansavel", name: "Incansável", hint: "Ajuda em esforço físico e perseguições prolongadas." },
    { id: "presteza-atletica", name: "Presteza Atlética", hint: "Aprimora sua mobilidade em combate." },
    { id: "protecao-pesada", name: "Proteção Pesada", hint: "Permite usar proteções mais robustas.", minNex: 30 },
    { id: "reflexos-defensivos", name: "Reflexos Defensivos", hint: "Melhora sua defesa através de agilidade.", attribute: { id: "AGI", min: 2 } },
    { id: "saque-rapido", name: "Saque Rápido", hint: "Facilita trocar e preparar equipamentos rapidamente.", trainedAll: ["iniciativa"] },
    { id: "segurar-gatilho", name: "Segurar o Gatilho", hint: "Permite manter uma sequência ofensiva com armas de fogo.", minNex: 60 },
    { id: "sentido-tatico", name: "Sentido Tático", hint: "Transforma leitura de campo em vantagem defensiva.", attribute: { id: "INT", min: 2 }, trainedAll: ["percepcao", "tatica"] },
    { id: "tanque-guerra", name: "Tanque de Guerra", hint: "Aprimora ainda mais o uso de proteção pesada.", requiresPower: "Proteção Pesada" },
    { id: "tiro-certeiro", name: "Tiro Certeiro", hint: "Aprimora ataques com armas de disparo.", trainedAll: ["pontaria"] },
    { id: "tiro-cobertura", name: "Tiro de Cobertura", hint: "Usa disparos para controlar o movimento inimigo." },
    ...commonPowers,
  ],
  Especialista: [
    { id: "balistica-avancada", name: "Balística Avançada", hint: "Amplia sua competência com armas de fogo." },
    { id: "conhecimento-aplicado", name: "Conhecimento Aplicado", hint: "Permite resolver situações usando raciocínio e conhecimento.", attribute: { id: "INT", min: 2 } },
    { id: "hacker", name: "Hacker", hint: "Aprimora invasões e manipulação de sistemas.", trainedAll: ["tecnologia"] },
    { id: "maos-rapidas", name: "Mãos Rápidas", hint: "Favorece ações rápidas e discretas com objetos.", attribute: { id: "AGI", min: 3 }, trainedAll: ["crime"] },
    { id: "mochila-utilidades", name: "Mochila de Utilidades", hint: "Torna um tipo de item mais fácil de carregar." },
    { id: "movimento-tatico", name: "Movimento Tático", hint: "Aprimora deslocamento em situações de risco.", trainedAll: ["atletismo"] },
    { id: "na-trilha-certa", name: "Na Trilha Certa", hint: "Ajuda a seguir pistas e manter uma investigação no rumo certo." },
    { id: "nerd", name: "Nerd", hint: "Transforma conhecimento geral em vantagem durante investigações." },
    { id: "ninja-urbano", name: "Ninja Urbano", hint: "Amplia sua capacidade de usar armas discretas e ágeis." },
    { id: "pensamento-agil", name: "Pensamento Ágil", hint: "Permite reagir e analisar situações com mais rapidez." },
    { id: "perito-explosivos", name: "Perito em Explosivos", hint: "Facilita lidar com explosivos sem colocar a equipe em risco." },
    { id: "primeira-impressao", name: "Primeira Impressão", hint: "Dá vantagem em interações sociais no começo de uma conversa." },
    ...commonPowers,
  ],
  Ocultista: [
    { id: "camuflar-ocultismo", name: "Camuflar Ocultismo", hint: "Ajuda a esconder sinais da sua prática ocultista." },
    { id: "criar-selo", name: "Criar Selo", hint: "Permite preparar efeitos ritualísticos para uso posterior." },
    { id: "envolto-misterio", name: "Envolto em Mistério", hint: "Aumenta sua presença e estranheza sobrenatural." },
    { id: "especialista-elemento", name: "Especialista em Elemento", hint: "Aprofunda sua eficiência com um elemento paranormal." },
    { id: "ferramentas-paranormais", name: "Ferramentas Paranormais", hint: "Facilita o uso de itens ligados ao paranormal." },
    { id: "fluxo-poder", name: "Fluxo de Poder", hint: "Permite sustentar melhor efeitos paranormais simultâneos.", minNex: 60 },
    { id: "guiado-paranormal", name: "Guiado pelo Paranormal", hint: "Ajuda a usar o paranormal como orientação em testes difíceis." },
    { id: "identificacao-paranormal", name: "Identificação Paranormal", hint: "Facilita reconhecer efeitos, criaturas e manifestações." },
    { id: "improvisar-componentes", name: "Improvisar Componentes", hint: "Reduz a dependência de componentes ritualísticos específicos." },
    { id: "intuicao-paranormal", name: "Intuição Paranormal", hint: "Favorece leituras rápidas de fenômenos sobrenaturais." },
    { id: "mestre-elemento", name: "Mestre em Elemento", hint: "Aprofunda ainda mais a especialização elemental.", minNex: 45, requiresPower: "Especialista em Elemento" },
    { id: "ritual-potente", name: "Ritual Potente", hint: "Aumenta a força de determinados efeitos ritualísticos.", attribute: { id: "INT", min: 2 } },
    { id: "ritual-predileto", name: "Ritual Predileto", hint: "Especializa você em um ritual favorito." },
    { id: "tatuagem-ritualistica", name: "Tatuagem Ritualística", hint: "Facilita a conjuração através de marcas preparadas." },
    ...commonPowers,
  ],
};

export interface ParanormalPower extends GuidedPower {
  element?: ParanormalElement;
  elementCount?: number;
}

export const PARANORMAL_POWERS: ParanormalPower[] = [
  { id: "sensitivo", name: "Sensitivo", hint: "Aumenta sua percepção e presença diante do paranormal.", element: "CONHECIMENTO" },
  { id: "visao-oculto", name: "Visão do Oculto", hint: "Ajuda a perceber detalhes que normalmente ficam escondidos.", element: "CONHECIMENTO" },
  { id: "percepcao-paranormal", name: "Percepção Paranormal", hint: "Aprimora sua leitura de manifestações sobrenaturais.", element: "CONHECIMENTO" },
  { id: "precognicao", name: "Precognição", hint: "Representa lampejos de antecipação do perigo.", element: "CONHECIMENTO", elementCount: 1 },
  { id: "expansao-conhecimento", name: "Expansão de Conhecimento", hint: "Permite acessar conhecimentos e técnicas além do comum.", element: "CONHECIMENTO", elementCount: 1 },
  { id: "afortunado", name: "Afortunado", hint: "Inclina pequenas probabilidades a seu favor.", element: "ENERGIA" },
  { id: "campo-protetor", name: "Campo Protetor", hint: "Usa Energia para melhorar sua proteção.", element: "ENERGIA", elementCount: 1 },
  { id: "causalidade-fortuita", name: "Causalidade Fortuita", hint: "Transforma coincidências em pequenas vantagens.", element: "ENERGIA" },
  { id: "golpe-sorte", name: "Golpe de Sorte", hint: "Favorece resultados excepcionais em ataques.", element: "ENERGIA", elementCount: 1 },
  { id: "manipular-entropia", name: "Manipular Entropia", hint: "Interfere na sorte de quem está por perto.", element: "ENERGIA", elementCount: 1 },
  { id: "encarar-morte", name: "Encarar a Morte", hint: "Ajuda você a continuar agindo diante do risco extremo.", element: "MORTE" },
  { id: "escapar-morte", name: "Escapar da Morte", hint: "Aumenta suas chances de sobreviver a situações fatais.", element: "MORTE", elementCount: 1 },
  { id: "potencial-aprimorado", name: "Potencial Aprimorado", hint: "Amplia sua reserva para ações paranormais.", element: "MORTE" },
  { id: "potencial-reaproveitado", name: "Potencial Reaproveitado", hint: "Ajuda a recuperar recursos ao encerrar efeitos.", element: "MORTE" },
  { id: "surto-temporal", name: "Surto Temporal", hint: "Permite um pico excepcional de velocidade temporal.", element: "MORTE", elementCount: 2 },
  { id: "arma-sangue", name: "Arma de Sangue", hint: "Cria uma arma paranormal ligada ao Sangue.", element: "SANGUE" },
  { id: "sangue-ferro", name: "Sangue de Ferro", hint: "Torna seu corpo mais resistente.", element: "SANGUE" },
  { id: "sangue-vivo", name: "Sangue Vivo", hint: "Aprimora sua recuperação corporal.", element: "SANGUE", elementCount: 1 },
  { id: "anatomia-insana", name: "Anatomia Insana", hint: "Seu corpo passa a responder de forma anormal a ferimentos.", element: "SANGUE", elementCount: 2 },
  { id: "sangue-fervente", name: "Sangue Fervente", hint: "Leva atributos físicos a um estado paranormal intenso.", element: "SANGUE", elementCount: 2 },
  { id: "resistir-sangue", name: "Resistir a Sangue", hint: "Concede resistência contra efeitos de Sangue.", element: "SANGUE" },
  { id: "resistir-morte", name: "Resistir a Morte", hint: "Concede resistência contra efeitos de Morte.", element: "MORTE" },
  { id: "resistir-conhecimento", name: "Resistir a Conhecimento", hint: "Concede resistência contra efeitos de Conhecimento.", element: "CONHECIMENTO" },
  { id: "resistir-energia", name: "Resistir a Energia", hint: "Concede resistência contra efeitos de Energia.", element: "ENERGIA" },
];

const isTrained = (sheet: CharacterSheetData, skillId: string) => (sheet.skills[skillId]?.training ?? "DESTREINADO") !== "DESTREINADO";

export function hasNamedPower(sheet: CharacterSheetData, name: string) {
  return sheet.progression.choices.some((choice) => choice.value === name || choice.value.endsWith(`· ${name}`) || choice.value.includes(`· ${name} ·`));
}

export function classPowerBlockReason(power: GuidedPower, sheet: CharacterSheetData, nex: number): string | null {
  if (!power.repeatable && hasNamedPower(sheet, power.name)) return "Você já possui este poder.";
  if (power.minNex && nex < power.minNex) return `Libera em NEX ${power.minNex}%.`;
  if (power.attribute && Number(sheet.attributes[power.attribute.id] ?? 0) < power.attribute.min) return `Requer ${power.attribute.id} ${power.attribute.min}.`;
  if (power.trainedAny?.length && !power.trainedAny.some((id) => isTrained(sheet, id))) return `Requer treinamento em ${power.trainedAny.join(" ou ")}.`;
  if (power.trainedAll?.length && !power.trainedAll.every((id) => isTrained(sheet, id))) return `Requer treinamento em ${power.trainedAll.join(" e ")}.`;
  if (power.requiresPower && !hasNamedPower(sheet, power.requiresPower)) return `Requer ${power.requiresPower}.`;
  return null;
}

export function paranormalElementCount(sheet: CharacterSheetData, element: ParanormalElement) {
  const names = new Set(PARANORMAL_POWERS.filter((power) => power.element === element).map((power) => power.name));
  return sheet.progression.choices.filter((choice) => choice.transcender && [...names].some((name) => choice.value.includes(name))).length;
}

export function paranormalPowerBlockReason(power: ParanormalPower, sheet: CharacterSheetData): string | null {
  if (!power.repeatable && hasNamedPower(sheet, power.name)) return "Você já possui este poder.";
  if (power.element && power.elementCount && paranormalElementCount(sheet, power.element) < power.elementCount) return `Requer ${power.elementCount} poder(es) de ${labelElement(power.element)}.`;
  return null;
}

export function trailAbilityFor(className: CharacterSheetData["concept"]["className"], trail: string, nex: TrailAbilityNex): TrailAbilityDef | null {
  const cls = baseClassOf(className);
  return cls ? TRAIL_ABILITIES[cls]?.[trail]?.[nex] ?? null : null;
}

export function labelElement(element: ParanormalElement) {
  return element === "SANGUE" ? "Sangue" : element === "MORTE" ? "Morte" : element === "CONHECIMENTO" ? "Conhecimento" : "Energia";
}
