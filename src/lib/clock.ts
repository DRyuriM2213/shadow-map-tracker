import { useEffect, useMemo, useState } from "react";
import { TIMELINE } from "@/data/campaignFull";
import { V3_EVENTS } from "@/data/sessionV3";
import { useCampaign, toMinutes } from "@/store/campaign";
import type { CampaignDay, TimelineEvent } from "@/lib/types";

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
      ? V3_EVENTS.filter((e) => e.day === day).map((e) => ({
          id: e.id,
          day: e.day,
          time: e.time,
          title: e.title,
          description: e.description,
          mandatory: e.kind === "CANON" || e.kind === "CLÍMAX",
        }))
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
export type PaceTarget = { day: CampaignDay; time: string };

const PACE_TARGET_KEY = "berco-vazio-session-pace-target-v1";
const PACE_TARGET_EVENT = "berco-vazio-session-pace-target-change";
const DEFAULT_TARGET: PaceTarget = { day: 2, time: "21:15" };

export function readPaceTarget(): PaceTarget {
  if (typeof window === "undefined") return DEFAULT_TARGET;
  try {
    const raw = window.localStorage.getItem(PACE_TARGET_KEY);
    if (!raw) return DEFAULT_TARGET;
    const parsed = JSON.parse(raw) as Partial<PaceTarget>;
    const day = Number(parsed.day);
    const time = typeof parsed.time === "string" && /^\d{2}:\d{2}$/.test(parsed.time) ? parsed.time : DEFAULT_TARGET.time;
    if (day < 1 || day > 5) return DEFAULT_TARGET;
    return { day: day as CampaignDay, time };
  } catch {
    return DEFAULT_TARGET;
  }
}

export function savePaceTarget(target: PaceTarget) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PACE_TARGET_KEY, JSON.stringify(target));
  window.dispatchEvent(new CustomEvent(PACE_TARGET_EVENT));
}

export function usePaceTarget() {
  const [target, setTarget] = useState<PaceTarget>(readPaceTarget);
  useEffect(() => {
    const refresh = () => setTarget(readPaceTarget());
    window.addEventListener(PACE_TARGET_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PACE_TARGET_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return target;
}

export function useSessionPace(): { pace: Pace; narrativo: number; real: number; target: PaceTarget } {
  const day = useCampaign((s) => s.session.day);
  const time = useCampaign((s) => s.session.time);
  const realStart = useCampaign((s) => s.session.realStart);
  const realEnd = useCampaign((s) => s.session.realEnd);
  const target = usePaceTarget();

  const narrativeStart = toMinutes("08:00");
  const currentAbsolute = (day - 1) * 1440 + toMinutes(time);
  const targetAbsolute = (target.day - 1) * 1440 + toMinutes(target.time);
  const startAbsolute = narrativeStart;
  const narrativeTotal = Math.max(1, targetAbsolute - startAbsolute);
  const narrativo = Math.min(1, Math.max(0, (currentAbsolute - startAbsolute) / narrativeTotal));

  const now = new Date();
  const nowReal = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(realStart);
  const end = toMinutes(realEnd);
  const real = end > start ? Math.min(1, Math.max(0, (nowReal - start) / (end - start))) : 0;

  const diff = narrativo - real;
  const pace: Pace = diff > 0.08 ? "adiantado" : diff < -0.08 ? "atrasado" : "no-ritmo";
  return { pace, narrativo, real, target };
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
