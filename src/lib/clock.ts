import { useEffect, useMemo } from "react";
import { TIMELINE } from "@/data/campaign";
import { useCampaign, toMinutes } from "@/store/campaign";
import type { TimelineEvent } from "@/lib/types";

/** DTs padrão editáveis */
export const DC_PRESETS: { label: string; value: number }[] = [
  { label: "Fácil", value: 10 },
  { label: "Média", value: 15 },
  { label: "Difícil", value: 20 },
  { label: "Muito difícil", value: 25 },
];

export const SPEEDS = [1, 5, 10, 30, 60];

/** Motor de tempo: roda uma vez, montado no Shell. */
export function useClockEngine() {
  const running = useCampaign((s) => s.session.clockRunning);
  const speed = useCampaign((s) => s.session.clockSpeed);
  const tick = useCampaign((s) => s.tickClock);

  useEffect(() => {
    if (!running || speed <= 0) return;
    // 1 minuto de jogo a cada (60 / speed) segundos reais → 10x = 6s
    const intervalMs = (60 / speed) * 1000;
    const id = setInterval(() => tick(1), Math.max(200, intervalMs));
    return () => clearInterval(id);
  }, [running, speed, tick]);
}

export function useTimelineStatus() {
  const day = useCampaign((s) => s.session.day);
  const time = useCampaign((s) => s.session.time);
  const activated = useCampaign((s) => s.session.activatedEvents);

  return useMemo(() => {
    const now = toMinutes(time);
    const doDia = TIMELINE.filter((e) => e.day === day);
    const pendentes = doDia.filter((e) => !activated.includes(e.id));
    const atual = pendentes.filter((e) => e.mandatory && toMinutes(e.time) <= now);
    const proximo = pendentes
      .filter((e) => toMinutes(e.time) > now)
      .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))[0];
    const agora: TimelineEvent | undefined = atual.sort(
      (a, b) => toMinutes(b.time) - toMinutes(a.time),
    )[0];
    const atrasados = atual.filter((e) => toMinutes(e.time) < now - 5);
    const countdown = proximo ? toMinutes(proximo.time) - now : null;
    return { agora, proximo, atrasados, countdown };
  }, [day, time, activated]);
}

export type Pace = "adiantado" | "no-ritmo" | "atrasado";

/**
 * Ritmo: compara progresso narrativo (Dia 1 08:00 → Dia 2 21:15)
 * com o progresso do relógio real dentro da meta de sessão.
 */
export function useSessionPace(): { pace: Pace; narrativo: number; real: number } {
  const day = useCampaign((s) => s.session.day);
  const time = useCampaign((s) => s.session.time);
  const realStart = useCampaign((s) => s.session.realStart);
  const realEnd = useCampaign((s) => s.session.realEnd);

  const narrativoTotal = 2 * 13.25 * 60; // ~ dois dias de jogo úteis
  const decorridoNarrativo =
    (day === 2 ? 13.25 * 60 : 0) + Math.max(0, toMinutes(time) - toMinutes("08:00"));
  const narrativo = Math.min(1, decorridoNarrativo / narrativoTotal);

  const agora = new Date();
  const nowReal = agora.getHours() * 60 + agora.getMinutes();
  const ini = toMinutes(realStart);
  const fim = toMinutes(realEnd);
  const real = fim > ini ? Math.min(1, Math.max(0, (nowReal - ini) / (fim - ini))) : 0;

  const diff = narrativo - real;
  const pace: Pace = diff > 0.08 ? "adiantado" : diff < -0.08 ? "atrasado" : "no-ritmo";
  return { pace, narrativo, real };
}

export const paceLabel: Record<Pace, string> = {
  adiantado: "Adiantado",
  "no-ritmo": "No ritmo",
  atrasado: "Atrasado",
};

export const paceTone: Record<Pace, string> = {
  adiantado: "text-route-azul",
  "no-ritmo": "text-route-verde-claro",
  atrasado: "text-route-vermelho",
};
