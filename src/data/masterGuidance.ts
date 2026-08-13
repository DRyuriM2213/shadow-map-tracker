import type { Scene } from "@/lib/types";

const MASTER_OVERRIDES: Record<string, string> = {
  "s1-chegada": "Cena de abertura. A universidade deve parecer normal e viva. Apresente a preparação do auditório apenas como rotina. Não determine antecipadamente quem causará o acidente, intenção ou motivação; qualquer responsável permanece desconhecido até a investigação produzir evidência.",
  "s1-auditorio-cedo": "Rota técnica de alto valor. Tudo que os jogadores registrarem antes do acidente pode servir de comparação depois. A porta e a estrutura podem mostrar sinais de uso ou intervenção, mas não force encontro com um responsável nem atribua autoria sem evidência.",
  "s1-passarela": "Cena de risco alto. Recompense observação e registro do estado da passarela. Eles podem encontrar marcas recentes, acesso à estrutura e uma rota de saída. Não transforme marcas de passagem em identidade automática de ninguém.",
  "s1-acidente": "Evento obrigatório: o refletor cai. Não decida a reação de nenhum personagem de jogador. Apresente socorro, estrutura, registros e movimentação como possibilidades simultâneas. Evidências podem apontar intervenção física, mas autoria e motivação continuam em aberto.",
  "s1-reacao-seguir": "Se seguirem a movimentação, permita descobrir a rota técnica, marcas recentes e caminhos possíveis. Não force que alcancem nem identifiquem uma pessoa específica; a investigação deve sustentar qualquer conclusão sobre quem passou por ali.",
  "s2-oficial": "Use os documentos e horários para confrontar a versão institucional. Augusto é personagem de Guilherme: acesso, autorização, proteção ou exposição institucional são escolhas do jogador, nunca ações automáticas do sistema.",
  "s2-estrutura": "A investigação física deve responder como o acesso e a estrutura funcionam. Marcas, fechaduras e rotas podem indicar intervenção e uso recente, mas não atribuem culpa sozinhas.",
  "s2-pessoas": "Cada conversa pode produzir verdade, omissão, medo, erro de memória ou contradição. Não escolha um culpado por reação social isolada; use falas e documentos como peças que precisam ser cruzadas.",
  "s2-invasao": "Rota de alto risco e alto retorno. Registros e câmeras podem revelar manipulação ou acesso anormal, mas códigos administrativos não identificam automaticamente intenção ou autoria. Preserve as consequências de uma invasão malsucedida.",
};

export function masterGuidance(scene: Scene) {
  return MASTER_OVERRIDES[scene.id] ?? scene.masterDescription;
}
