import type { Scene } from "@/lib/types";

export type NarrationKind = "INTRODUÇÃO" | "AÇÃO" | "RESULTADO" | "FALA DE NPC";

export interface LiveNarration {
  kind: NarrationKind;
  label: string;
  text: string;
  suggestedTestId?: string;
}

const ACTION_TEXTS: Record<string, string> = {
  "Examinar a estrutura": "De perto, a estrutura deixa de parecer apenas um conjunto de cabos e refletores. Quase tudo segue o mesmo padrão de montagem: mesma tensão, mesmas travas, mesmo alinhamento. Um dos pontos foge desse padrão. A diferença é pequena, mas recente o bastante para merecer atenção.",
  "Fotografar": "Vocês registram o ambiente antes que alguém tenha chance de mover, recolher ou reorganizar qualquer coisa. A imagem congela detalhes pequenos: posição de cabos, placas, portas abertas, horários e pessoas ao fundo.",
  "Filmar": "A gravação preserva movimento, som e sequência. Enquanto a câmera acompanha a cena, pequenas reações e deslocamentos que passariam despercebidos ficam registrados para serem revistos depois.",
  "Verificar a porta técnica": "A porta metálica não está fechada como deveria. Ela repousa apenas encostada, com a lingueta fora do encaixe. Do outro lado vem ar mais quente, cheiro de poeira e o som metálico de alguma coisa sendo movimentada.",
  "Subir à passarela": "A escada leva a um espaço mais quente e estreito. O piso de grade range sob o peso de vocês. Lá em cima, a poeira acumulada guarda marcas recentes e a estrutura dos refletores fica ao alcance das mãos.",
  "Examinar cabo": "O cabo está entre poeira, metal e restos da estrutura. De perto, o rompimento não parece tão simples quanto uma peça que cedeu pelo tempo. A ponta merece ser analisada antes que manutenção ou segurança recolham o material.",
  "Observar reações": "O ambiente se divide entre susto, confusão e reação profissional. A maioria olha para o centro do problema. Algumas pessoas, por um instante, olham para outros pontos: uma porta, a passarela, um corredor lateral.",
  "Conversar com testemunhas": "As primeiras versões ainda estão frescas e confusas. Cada pessoa viu um pedaço diferente: um som, uma luz, alguém se movendo, uma porta aberta. Separadas, as versões são incompletas. Comparadas, podem revelar o que realmente aconteceu.",
  "Proteger as provas": "Vocês tentam preservar posição, imagens e objetos antes que limpeza, segurança e manutenção transformem a cena. Cada minuto que passa reduz a quantidade de coisas que continuará exatamente como estava.",
  "Consultar registros de acesso": "Os registros transformam portas em uma linha do tempo. Cada abertura carrega horário, credencial e ponto de acesso. O problema é que algumas credenciais dizem menos do que deveriam.",
  "Comparar horários": "Quando vocês colocam os horários lado a lado, pequenas incompatibilidades aparecem. Um registro antecede outro que deveria vir antes, uma chave não volta, uma credencial aparece numa janela incomum. A sequência começa a importar mais que cada documento isolado.",
  "Pesquisar notícias": "Entre arquivos, recortes e registros antigos, os nomes começam a se repetir. Casos separados por meses ou anos parecem independentes até o campus surgir como ponto comum entre eles.",
  "Buscar Ricardo Nogueira": "O nome de Ricardo Nogueira surge ligado a consultas antigas, caixas de arquivo e registros incompletos. Ele não pesquisou um único tema: cruzou obras, drenagem, segurança e autorizações da Diretoria no mesmo período.",
  "Cruzar pistas": "Vocês espalham horários, nomes, documentos e imagens e deixam de olhar cada pista isoladamente. As conexões surgem nos intervalos: o mesmo código, a mesma janela de tempo e o mesmo setor aparecendo em contextos diferentes.",
  "Formular teoria": "A teoria precisa explicar mais de uma pista ao mesmo tempo. Vocês escolhem a hipótese que melhor conecta horários, acessos, documentos e comportamento, deixando claro onde ainda existem buracos.",
};

export function getActionNarration(scene: Scene, action: string): LiveNarration {
  return {
    kind: "AÇÃO",
    label: action,
    text: ACTION_TEXTS[action] ?? `Vocês decidem ${action.toLowerCase()}. O foco da cena muda para essa ação. Descreva somente o que está disponível agora e peça um teste apenas quando houver risco, oposição ou informação realmente escondida.`,
    suggestedTestId: scene.testIds[0],
  };
}

export function introNarration(scene: Scene): LiveNarration {
  return { kind: "INTRODUÇÃO", label: scene.title, text: scene.narrationText };
}
