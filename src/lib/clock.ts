import { useEffect, useMemo } from "react";
import { TIMELINE } from "@/data/campaignFull";
import { V3_EVENTS } from "@/data/sessionV3";
import { useCampaign, toMinutes } from "@/store/campaign";
import type { TimelineEvent } from "@/lib/types";

export const DC_PRESETS: { label: string; value: number }[] = [
  { label: "Fácil", value: 10 },
  { label: "Média", value: 15 },
  { label: "Difícil", value: 20 },
  { label: "Muito difícil", value: 25 },
];
export const SPEEDS = [1, 5, 10, 30, 60];

export function useClockEngine() {
  const running = useCampaign((s) => s.session.clockRunning);
  const speed = useCampaign((s) => s.session.clockSpeed);
  const tick = useCampaign((s) => s.tickClock);
  useEffect(() => {
    if (!running || speed <= 0) return;
    const intervalMs = (60 / speed) * 1000;
    const id = setInterval(() => tick(1), Math.max(200, intervalMs));
    return () => clearInterval(id);
  }, [running, speed, tick]);
}

export function useTimelineStatus() {
  const day = useCampaign((s) => s.session.day);
  const time = useCampaign((s) => s.session.time);
  const activated = useCampaign((s) => s.session.activatedEvents);
  const recapApplied = useCampaign((s) => s.session.recapApplied);

  return useMemo(() => {
    const now = toMinutes(time);
    const source: TimelineEvent[] = recapApplied
      ? V3_EVENTS.filter((e) => e.day === day).map((e) => ({ id: e.id, day: e.day, time: e.time, title: e.title, description: e.description, mandatory: e.kind === "CANON" || e.kind === "CLÍMAX" }))
      : TIMELINE.filter((e) => e.day === day);
    const pending = source.filter((e) => !activated.includes(e.id));
    const due = pending.filter((e) => e.mandatory && toMinutes(e.time) <= now);
    const next = pending.filter((e) => toMinutes(e.time) > now).sort((a, b) => toMinutes(a.time) - toMinutes(b.time))[0];
    const current = due.sort((a, b) => toMinutes(b.time) - toMinutes(a.time))[0];
    const overdue = due.filter((e) => toMinutes(e.time) < now - 5);
    const countdown = next ? toMinutes(next.time) - now : null;
    return { agora: current, proximo: next, atrasados: overdue, countdown };
  }, [day, time, activated, recapApplied]);
}

export type Pace = "adiantado" | "no-ritmo" | "atrasado";

export function useSessionPace(): { pace: Pace; narrativo: number; real: number } {
  const day = useCampaign((s) => s.session.day);
  const time = useCampaign((s) => s.session.time);
  const realStart = useCampaign((s) => s.session.realStart);
  const realEnd = useCampaign((s) => s.session.realEnd);

  // Indicador aproximado: agora considera os cinco dias, sem presumir que a mesa
  // precisa percorrer cada minuto narrativo. É só um auxílio visual.
  const dayMinutes = 13.5 * 60;
  const narrativeTotal = 5 * dayMinutes;
  const elapsedNarrative = (day - 1) * dayMinutes + Math.max(0, Math.min(dayMinutes, toMinutes(time) - toMinutes("08:00")));
  const narrativo = Math.min(1, elapsedNarrative / narrativeTotal);
  const now = new Date();
  const nowReal = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(realStart);
  const end = toMinutes(realEnd);
  const real = end > start ? Math.min(1, Math.max(0, (nowReal - start) / (end - start))) : 0;
  const diff = narrativo - real;
  const pace: Pace = diff > 0.08 ? "adiantado" : diff < -0.08 ? "atrasado" : "no-ritmo";
  return { pace, narrativo, real };
}

export const paceLabel: Record<Pace, string> = { adiantado: "Adiantado", "no-ritmo": "No ritmo", atrasado: "Atrasado" };
export const paceTone: Record<Pace, string> = { adiantado: "text-route-azul", "no-ritmo": "text-route-verde-claro", atrasado: "text-route-vermelho" };
