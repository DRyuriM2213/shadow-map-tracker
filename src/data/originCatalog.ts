export interface OriginDef {
  name: string;
  skills: string[];
  power: string;
  hint: string;
  supported?: boolean;
}

export const ORIGINS: OriginDef[] = [
  { name: "Acadêmico", skills: ["ciencias", "investigacao"], power: "Saber é Poder", hint: "Bom para personagens estudiosos e investigadores." },
  { name: "Agente de Saúde", skills: ["intuicao", "medicina"], power: "Técnica Medicinal", hint: "Focado em medicina, leitura de pessoas e suporte." },
  { name: "Amnésico", skills: [], power: "Vislumbres do Passado", hint: "As duas perícias são definidas pelo mestre; use quando a campanha quiser trabalhar com memória perdida.", supported: false },
  { name: "Artista", skills: ["artes", "enganacao"], power: "Magnum Opus", hint: "Boa escolha para criatividade, performance e interação social." },
  { name: "Atleta", skills: ["acrobacia", "atletismo"], power: "110%", hint: "Focado em movimento, esforço físico e desempenho atlético." },
  { name: "Chef", skills: ["fortitude", "profissao"], power: "Ingrediente Secreto", hint: "Mistura resistência com uma profissão ligada à cozinha." },
  { name: "Criminoso", skills: ["crime", "furtividade"], power: "O Crime Compensa", hint: "Focado em infiltração, furtividade e atividades ilegais." },
  { name: "Cultista Arrependido", skills: ["ocultismo", "religiao"], power: "Traços do Outro Lado", hint: "Começa com conhecimento forte sobre ocultismo e religião." },
  { name: "Desgarrado", skills: ["fortitude", "sobrevivencia"], power: "Calejado", hint: "Focado em resistência e sobrevivência longe de conforto." },
  { name: "Engenheiro", skills: ["profissao", "tecnologia"], power: "Ferramenta Favorita", hint: "Ótimo para personagens técnicos, construtores e inventores." },
  { name: "Executivo", skills: ["diplomacia", "profissao"], power: "Processo Otimizado", hint: "Focado em negociação, organização e trabalho profissional." },
  { name: "Investigador", skills: ["investigacao", "percepcao"], power: "Faro para Pistas", hint: "Escolha direta para quem quer encontrar pistas e resolver mistérios." },
  { name: "Lutador", skills: ["luta", "reflexos"], power: "Mão Pesada", hint: "Focado em combate corpo a corpo e reação rápida." },
  { name: "Magnata", skills: ["diplomacia", "pilotagem"], power: "Patrocinador da Ordem", hint: "Para personagens com dinheiro, influência e acesso a recursos." },
  { name: "Mercenário", skills: ["iniciativa", "intimidacao"], power: "Posição de Combate", hint: "Focado em prontidão de combate e presença intimidadora." },
  { name: "Militar", skills: ["pontaria", "tatica"], power: "Para Bellum", hint: "Focado em armas de fogo, disciplina e leitura tática." },
  { name: "Operário", skills: ["fortitude", "profissao"], power: "Ferramenta de Trabalho", hint: "Focado em trabalho físico, resistência e experiência prática." },
  { name: "Policial", skills: ["percepcao", "pontaria"], power: "Patrulha", hint: "Focado em vigilância, armas e rotina de campo." },
  { name: "Religioso", skills: ["religiao", "vontade"], power: "Acalentar", hint: "Focado em fé, apoio emocional e força de vontade." },
  { name: "Servidor Público", skills: ["intuicao", "vontade"], power: "Espírito Cívico", hint: "Focado em persistência, leitura de pessoas e burocracia." },
  { name: "Teórico da Conspiração", skills: ["investigacao", "ocultismo"], power: "Eu Já Sabia", hint: "Bom para investigação e conhecimento de fenômenos estranhos." },
  { name: "T.I.", skills: ["investigacao", "tecnologia"], power: "Motor de Busca", hint: "Focado em tecnologia, pesquisa e informação digital." },
  { name: "Trabalhador Rural", skills: ["adestramento", "sobrevivencia"], power: "Desbravador", hint: "Focado em animais, terreno e sobrevivência." },
  { name: "Trambiqueiro", skills: ["crime", "enganacao"], power: "Impostor", hint: "Focado em golpes, blefes e identidades falsas." },
  { name: "Universitário", skills: ["atualidades", "investigacao"], power: "Dedicação", hint: "Bom para personagens jovens, estudiosos e curiosos." },
  { name: "Vítima", skills: ["reflexos", "vontade"], power: "Cicatrizes Psicológicas", hint: "Focado em sobreviver às consequências de um contato traumático." },
];

export function originByName(name: string) {
  return ORIGINS.find((origin) => origin.name === name) ?? null;
}
