import type { ClueStatus, RouteColor } from "@/lib/types";

export const routeBorder: Record<RouteColor, string> = {
  amarelo: "border-l-route-amarelo",
  azul: "border-l-route-azul",
  verde: "border-l-route-verde",
  roxo: "border-l-route-roxo",
  vermelho: "border-l-route-vermelho",
  cinza: "border-l-route-cinza",
  "verde-claro": "border-l-route-verde-claro",
  preto: "border-l-route-preto",
};

export const routeText: Record<RouteColor, string> = {
  amarelo: "text-route-amarelo",
  azul: "text-route-azul",
  verde: "text-route-verde",
  roxo: "text-route-roxo",
  vermelho: "text-route-vermelho",
  cinza: "text-route-cinza",
  "verde-claro": "text-route-verde-claro",
  preto: "text-route-preto",
};

export const routeDot: Record<RouteColor, string> = {
  amarelo: "bg-route-amarelo",
  azul: "bg-route-azul",
  verde: "bg-route-verde",
  roxo: "bg-route-roxo",
  vermelho: "bg-route-vermelho",
  cinza: "bg-route-cinza",
  "verde-claro": "bg-route-verde-claro",
  preto: "bg-route-preto",
};

export const routeHex: Record<RouteColor, string> = {
  amarelo: "oklch(0.78 0.15 85)",
  azul: "oklch(0.66 0.13 245)",
  verde: "oklch(0.62 0.12 155)",
  roxo: "oklch(0.62 0.16 300)",
  vermelho: "oklch(0.6 0.21 25)",
  cinza: "oklch(0.68 0.01 60)",
  "verde-claro": "oklch(0.8 0.16 145)",
  preto: "oklch(0.42 0.02 20)",
};

export const clueStatusLabel: Record<ClueStatus, string> = {
  escondida: "Escondida",
  disponivel: "Disponível",
  encontrada: "Encontrada",
  "encontrada-parcialmente": "Encontrada parcialmente",
  interpretada: "Interpretada",
  "nao-interpretada": "Não interpretada",
  perdida: "Perdida",
  destruida: "Destruída",
  removida: "Removida",
  contingencia: "Entregue por contingência",
};

export const locationStatusLabel: Record<string, string> = {
  "nao-visitada": "Não visitada",
  disponivel: "Disponível",
  investigando: "Sendo investigada",
  "investigada-parcial": "Investigada parcialmente",
  "investigada-completa": "Investigada completamente",
  bloqueada: "Bloqueada",
  isolada: "Isolada",
  inacessivel: "Inacessível",
  revisitavel: "Pode ser revisitada",
};

export const importanceLabel: Record<string, string> = {
  ambiental: "Ambiental",
  secundaria: "Secundária",
  importante: "Importante",
  obrigatoria: "Obrigatória",
};
