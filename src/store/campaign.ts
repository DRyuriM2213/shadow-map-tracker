import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CONSEQUENCES, SCENES, START_SCENE_ID, TIMELINE } from "@/data/campaign";
import type {
  ClueStatus,
  LocationStatus,
  LogEntry,
  MasterNote,
  RouteColor,
  RouteStatus,
  ScheduledConsequence,
} from "@/lib/types";

export type RestrictedAccess = "nenhum" | "temporario" | "clandestino" | "autorizado" | "perdido";
export type VictimStatus = "ilesa" | "ferida" | "gravemente-ferida" | "estabilizada";

export interface SessionState {
  sessionName: string;
  day: 1 | 2;
  time: string;
  currentSceneId: string;
  currentLocationId?: string | undefined;
  attentionLevel: number;
  evidenceCount: number;
  percyExposure: number;
  restrictedAccess: RestrictedAccess;
  blockCKnowledge: number;
  victimStatus: VictimStatus;
  clueStatus: Record<string, ClueStatus>;
  locationStatus: Record<string, LocationStatus>;
  routeStatus: Record<string, RouteStatus>;
  activatedEvents: string[];
  scheduled: ScheduledConsequence[];
  log: LogEntry[];
  notes: MasterNote[];
  /* --- V2: relógio da campanha --- */
  clockRunning: boolean;
  /** minutos de jogo por minuto real */
  clockSpeed: number;
  autoPauseOnTest: boolean;
  /** DTs sobrescritas pelo mestre: clueId -> DT */
  dcOverrides: Record<string, number>;
  /** meta de sessão real (horário de relógio de parede) */
  realStart: string;
  realEnd: string;
  updatedAt: string;
}


interface Store {
  authed: boolean;
  pin: string | null;
  simulation: boolean;
  session: SessionState;
  realBackup: SessionState | null;
  past: SessionState[];
  checkpoints: { id: string; label: string; state: SessionState }[];
  login: (pin?: string) => void;
  logout: () => void;
  setPin: (pin: string) => void;
  newSession: (name?: string) => void;
  choose: (sceneId: string, choiceId: string) => void;
  goToScene: (sceneId: string, reason?: string) => void;
  setClue: (clueId: string, status: ClueStatus, note?: string) => void;
  setLocation: (locationId: string, status?: LocationStatus) => void;
  setLocationStatus: (locationId: string, status: LocationStatus) => void;
  applyTest: (testId: string, result: string, detail: string, clueId?: string) => void;
  advanceTime: (minutes: number) => void;
  setTime: (time: string) => void;
  setDay: (day: 1 | 2) => void;
  activateEvent: (eventId: string, mode: "ativar" | "adiar" | "ignorar") => void;
  scheduleConsequence: (consequenceId: string) => void;
  resolveConsequence: (id: string, status: ScheduledConsequence["status"]) => void;
  setMeter: (key: keyof SessionState, value: never) => void;
  setRouteStatus: (choiceId: string, status: RouteStatus) => void;
  addNote: (targetType: string, targetId: string, text: string) => void;
  removeNote: (id: string) => void;
  logAction: (actionType: string, description: string, detail?: string, route?: RouteColor) => void;
  undo: () => void;
  createCheckpoint: (label: string) => void;
  restoreCheckpoint: (id: string) => void;
  toggleSimulation: () => void;
  /* --- V2 --- */
  setClockRunning: (running: boolean) => void;
  toggleClock: () => void;
  setClockSpeed: (speed: number) => void;
  setAutoPauseOnTest: (v: boolean) => void;
  tickClock: (minutes: number) => void;
  setDc: (clueId: string, dc: number) => void;
  setRealGoal: (start: string, end: string) => void;
  jumpToNextEvent: () => void;
  transitionToDay2: () => void;

}

const uid = () => Math.random().toString(36).slice(2, 10);

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
export const fromMinutes = (min: number) => {
  const wrapped = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

const freshSession = (name?: string): SessionState => ({
  sessionName: name ?? `Sessão de ${new Date().toLocaleDateString("pt-BR")}`,
  day: 1,
  time: "08:00",
  currentSceneId: START_SCENE_ID,
  currentLocationId: "l-patio",
  attentionLevel: 0,
  evidenceCount: 0,
  percyExposure: 0,
  restrictedAccess: "nenhum",
  blockCKnowledge: 0,
  victimStatus: "ilesa",
  clueStatus: {},
  locationStatus: {},
  routeStatus: {},
  activatedEvents: [],
  scheduled: [],
  log: [
    {
      id: uid(),
      day: 1,
      time: "08:00",
      actionType: "sessao",
      description: "Sessão iniciada — Universidade Valença",
      createdAt: new Date().toISOString(),
    },
  ],
  notes: [],
  clockRunning: false,
  clockSpeed: 10,
  autoPauseOnTest: true,
  dcOverrides: {},
  realStart: "13:30",
  realEnd: "17:00",

  updatedAt: new Date().toISOString(),
});

export const useCampaign = create<Store>()(
  persist(
    (set, get) => {
      const mutate = (fn: (s: SessionState) => void) => {
        const prev = get().session;
        const next: SessionState = JSON.parse(JSON.stringify(prev));
        fn(next);
        next.updatedAt = new Date().toISOString();
        set({ session: next, past: [...get().past, prev].slice(-50) });
      };

      const pushLog = (
        s: SessionState,
        actionType: string,
        description: string,
        detail?: string,
        route?: RouteColor,
      ) => {
        s.log.push({
          id: uid(),
          day: s.day,
          time: s.time,
          actionType,
          description,
          detail,
          route,
          createdAt: new Date().toISOString(),
        });
      };

      return {
        authed: false,
        pin: null,
        simulation: false,
        session: freshSession(),
        realBackup: null,
        past: [],
        checkpoints: [],

        login: () => set({ authed: true }),
        logout: () => set({ authed: false }),
        setPin: (pin) => set({ pin }),

        newSession: (name) =>
          set({ session: freshSession(name), past: [], checkpoints: [] }),

        choose: (sceneId, choiceId) =>
          mutate((s) => {
            const sc = SCENES.find((x) => x.id === sceneId);
            const ch = sc?.choices.find((c) => c.id === choiceId);
            if (!ch || !sc) return;
            s.routeStatus[choiceId] = "escolhida";
            const target = SCENES.find((x) => x.id === ch.nextSceneId);
            if (target) {
              s.currentSceneId = target.id;
              s.day = target.day;
              if (toMinutes(target.time) > toMinutes(s.time) || target.day !== sc.day) {
                s.time = target.time;
              }
              if (target.locationId) {
                s.currentLocationId = target.locationId;
                if (!s.locationStatus[target.locationId]) {
                  s.locationStatus[target.locationId] = "investigando";
                }
              }
              target.clueIds.forEach((cid) => {
                if (!s.clueStatus[cid]) s.clueStatus[cid] = "disponivel";
              });
              target.consequenceIds.forEach((qid) => {
                const q = CONSEQUENCES.find((c) => c.id === qid);
                if (q && !s.scheduled.some((x) => x.consequenceId === qid && x.status === "pendente")) {
                  s.scheduled.push({
                    id: uid(),
                    consequenceId: qid,
                    day: q.day,
                    time: q.triggerTime,
                    status: "pendente",
                  });
                }
              });
            }
            if (ch.effects?.includes("+1")) s.attentionLevel = Math.min(5, s.attentionLevel + 1);
            if (ch.effects?.includes("+2")) s.attentionLevel = Math.min(5, s.attentionLevel + 2);
            pushLog(s, "escolha", `Escolha: ${ch.title}`, ch.description, ch.routeColor);
          }),

        goToScene: (sceneId, reason) =>
          mutate((s) => {
            const target = SCENES.find((x) => x.id === sceneId);
            if (!target) return;
            s.currentSceneId = target.id;
            s.day = target.day;
            if (target.locationId) s.currentLocationId = target.locationId;
            target.clueIds.forEach((cid) => {
              if (!s.clueStatus[cid]) s.clueStatus[cid] = "disponivel";
            });
            pushLog(s, "cena", `Cena: ${target.title}`, reason, target.route);
          }),

        setClue: (clueId, status, note) =>
          mutate((s) => {
            s.clueStatus[clueId] = status;
            if (status === "encontrada" || status === "interpretada") {
              s.evidenceCount = Math.min(10, s.evidenceCount + 1);
              if (clueId === "c-referencia-bloco-c" || clueId === "c-etiqueta-c") {
                s.blockCKnowledge = Math.max(s.blockCKnowledge, 2);
              }
              if (clueId === "c-setor-removido") s.blockCKnowledge = Math.max(s.blockCKnowledge, 3);
            }
            pushLog(s, "pista", `Pista ${status}: ${clueId}`, note);
          }),

        setLocation: (locationId) =>
          mutate((s) => {
            s.currentLocationId = locationId;
            if (!s.locationStatus[locationId] || s.locationStatus[locationId] === "nao-visitada") {
              s.locationStatus[locationId] = "investigando";
            }
            pushLog(s, "local", `Grupo foi para outro local: ${locationId}`);
          }),

        setLocationStatus: (locationId, status) =>
          mutate((s) => {
            s.locationStatus[locationId] = status;
            pushLog(s, "local", `Estado do local alterado: ${locationId} → ${status}`);
          }),

        applyTest: (testId, result, detail, clueId) =>
          mutate((s) => {
            pushLog(s, "teste", `Teste ${testId}: ${result}`, detail);
            if (clueId) {
              if (result === "SUCESSO") {
                s.clueStatus[clueId] = "encontrada";
                s.evidenceCount = Math.min(10, s.evidenceCount + 1);
              } else if (result === "SUCESSO PARCIAL") {
                s.clueStatus[clueId] = "encontrada-parcialmente";
              } else if (result === "FALHA") {
                s.clueStatus[clueId] = "nao-interpretada";
              } else if (result === "FALHA CRÍTICA") {
                s.clueStatus[clueId] = "perdida";
                s.attentionLevel = Math.min(5, s.attentionLevel + 1);
              } else if (result === "RESOLVER SEM TESTE") {
                s.clueStatus[clueId] = "encontrada";
              }
            }
            if (result === "FALHA CRÍTICA") s.attentionLevel = Math.min(5, s.attentionLevel + 1);
          }),

        advanceTime: (minutes) =>
          mutate((s) => {
            s.time = fromMinutes(toMinutes(s.time) + minutes);
            pushLog(s, "tempo", `Horário avançado em ${minutes} min → ${s.time}`);
          }),

        setTime: (time) =>
          mutate((s) => {
            s.time = time;
            pushLog(s, "tempo", `Horário ajustado para ${time}`);
          }),

        setDay: (day) =>
          mutate((s) => {
            s.day = day;
            pushLog(s, "tempo", `Dia alterado para DIA ${day}`);
          }),

        activateEvent: (eventId, mode) =>
          mutate((s) => {
            const ev = TIMELINE.find((e) => e.id === eventId);
            if (!ev) return;
            if (mode === "ativar") {
              s.activatedEvents.push(eventId);
              if (toMinutes(ev.time) > toMinutes(s.time)) s.time = ev.time;
            }
            pushLog(s, "evento", `Evento ${mode}: ${ev.title}`, ev.description);
          }),

        scheduleConsequence: (consequenceId) =>
          mutate((s) => {
            const q = CONSEQUENCES.find((c) => c.id === consequenceId);
            if (!q) return;
            s.scheduled.push({
              id: uid(),
              consequenceId,
              day: q.day,
              time: q.triggerTime,
              status: "pendente",
            });
            pushLog(s, "consequencia", `Consequência agendada: ${q.name}`, q.triggerTime);
          }),

        resolveConsequence: (id, status) =>
          mutate((s) => {
            const item = s.scheduled.find((x) => x.id === id);
            if (!item) return;
            item.status = status;
            const q = CONSEQUENCES.find((c) => c.id === item.consequenceId);
            if (status === "ativada" && q) {
              q.affectedLocations.forEach((lid) => {
                if (q.id === "q-auditorio-isolado") s.locationStatus[lid] = "isolada";
                if (q.id === "q-acesso-fechado") s.locationStatus[lid] = "inacessivel";
              });
              q.affectedClues.forEach((cid) => {
                if (q.id === "q-documentos-removidos") s.clueStatus[cid] = "removida";
              });
              if (q.id === "q-vigilancia") s.attentionLevel = Math.min(5, s.attentionLevel + 1);
              if (q.id === "q-percy-exposto") s.percyExposure = Math.min(5, s.percyExposure + 1);
            }
            pushLog(s, "consequencia", `Consequência ${status}: ${q?.name ?? item.consequenceId}`);
          }),

        setMeter: (key, value) =>
          mutate((s) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s as any)[key] = value;
            pushLog(s, "medidor", `Medidor ajustado: ${String(key)} → ${String(value)}`);
          }),

        setRouteStatus: (choiceId, status) =>
          mutate((s) => {
            s.routeStatus[choiceId] = status;
            pushLog(s, "rota", `Rota marcada como ${status}`, choiceId);
          }),

        addNote: (targetType, targetId, text) =>
          mutate((s) => {
            s.notes.push({
              id: uid(),
              targetType,
              targetId,
              text,
              day: s.day,
              time: s.time,
              createdAt: new Date().toISOString(),
            });
            pushLog(s, "nota", "Anotação do mestre", text);
          }),

        removeNote: (id) =>
          mutate((s) => {
            s.notes = s.notes.filter((n) => n.id !== id);
          }),

        logAction: (actionType, description, detail, route) =>
          mutate((s) => pushLog(s, actionType, description, detail, route)),

        undo: () => {
          const past = get().past;
          if (!past.length) return;
          const prev = past[past.length - 1]!;
          set({ session: prev, past: past.slice(0, -1) });
        },

        createCheckpoint: (label) =>
          set({
            checkpoints: [
              ...get().checkpoints,
              { id: uid(), label, state: JSON.parse(JSON.stringify(get().session)) },
            ],
          }),

        restoreCheckpoint: (id) => {
          const cp = get().checkpoints.find((c) => c.id === id);
          if (!cp) return;
          set({ session: JSON.parse(JSON.stringify(cp.state)), past: [...get().past, get().session] });
        },

        toggleSimulation: () => {
          const { simulation, realBackup, session } = get();
          if (!simulation) {
            set({ simulation: true, realBackup: JSON.parse(JSON.stringify(session)) });
          } else {
            set({
              simulation: false,
              session: realBackup ? JSON.parse(JSON.stringify(realBackup)) : session,
              realBackup: null,
            });
          }
        },

        /* ------------------------- V2: relógio ------------------------- */
        setClockRunning: (running) =>
          set({ session: { ...get().session, clockRunning: running } }),
        toggleClock: () =>
          set({ session: { ...get().session, clockRunning: !get().session.clockRunning } }),
        setClockSpeed: (speed) => set({ session: { ...get().session, clockSpeed: speed } }),
        setAutoPauseOnTest: (v) => set({ session: { ...get().session, autoPauseOnTest: v } }),

        /** avanço silencioso do motor de tempo (não gera log nem undo) */
        tickClock: (minutes) => {
          const s = get().session;
          set({
            session: { ...s, time: fromMinutes(toMinutes(s.time) + minutes) },
          });
        },

        setDc: (clueId, dc) =>
          mutate((s) => {
            s.dcOverrides[clueId] = dc;
            pushLog(s, "dt", `DT ajustada: ${clueId} → ${dc}`);
          }),

        setRealGoal: (start, end) =>
          set({ session: { ...get().session, realStart: start, realEnd: end } }),

        jumpToNextEvent: () =>
          mutate((s) => {
            const now = toMinutes(s.time);
            const next = TIMELINE.filter(
              (e) => e.day === s.day && toMinutes(e.time) > now && !s.activatedEvents.includes(e.id),
            ).sort((a, b) => toMinutes(a.time) - toMinutes(b.time))[0];
            if (!next) return;
            s.time = next.time;
            s.clockRunning = false;
            pushLog(s, "tempo", `Avançado até o próximo evento: ${next.title}`, next.time);
          }),

        transitionToDay2: () =>
          mutate((s) => {
            s.day = 2;
            s.time = "08:00";
            s.clockRunning = false;
            const madrugada = TIMELINE.find((e) => e.id === "tl-2-0333");
            if (madrugada && !s.activatedEvents.includes(madrugada.id)) {
              s.activatedEvents.push(madrugada.id);
              pushLog(s, "evento", `Evento da madrugada: ${madrugada.title}`, madrugada.description);
            }
            pushLog(s, "tempo", "Transição do Dia 1 para o Dia 2 — 08:00");
          }),
      };
    },
    {
      name: "berco-vazio-painel-mestre",
      version: 2,
      migrate: (persisted: unknown) => {
        const st = persisted as { session?: Partial<SessionState> } | undefined;
        if (st?.session) {
          const s = st.session;
          s.clockRunning = false;
          s.clockSpeed = s.clockSpeed ?? 10;
          s.autoPauseOnTest = s.autoPauseOnTest ?? true;
          s.dcOverrides = s.dcOverrides ?? {};
          s.realStart = s.realStart ?? "13:30";
          s.realEnd = s.realEnd ?? "17:00";
        }
        return persisted as Store;
      },
      partialize: (s) => ({
        authed: s.authed,
        pin: s.pin,
        session: s.session,
        checkpoints: s.checkpoints,
        simulation: s.simulation,
        realBackup: s.realBackup,
      }),
    },

  ),
);
