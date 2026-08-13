import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampaign } from "@/store/campaign";
import { SPEEDS, useTimelineStatus } from "@/lib/clock";
import { Pause, Play } from "lucide-react";

export function ClockControls({ compact = false }: { compact?: boolean }) {
  const session = useCampaign((s) => s.session);
  const toggleClock = useCampaign((s) => s.toggleClock);
  const setClockSpeed = useCampaign((s) => s.setClockSpeed);
  const advanceTime = useCampaign((s) => s.advanceTime);
  const setTime = useCampaign((s) => s.setTime);
  const setAutoPause = useCampaign((s) => s.setAutoPauseOnTest);
  const jumpToNextEvent = useCampaign((s) => s.jumpToNextEvent);
  const transitionToDay2 = useCampaign((s) => s.transitionToDay2);
  const [novo, setNovo] = useState(session.time);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Button size="sm" variant={session.clockRunning ? "destructive" : "default"} onClick={toggleClock}>
        {session.clockRunning ? <Pause className="mr-1 size-3.5" /> : <Play className="mr-1 size-3.5" />}
        {session.clockRunning ? "PAUSAR" : "PLAY"}
      </Button>
      <span
        className={`stamp ${session.clockRunning ? "text-route-verde-claro" : "text-route-amarelo"}`}
      >
        {session.clockRunning ? "RODANDO" : "PAUSADO"}
      </span>
      <select
        className="rounded-sm border border-input bg-background px-2 py-1"
        value={session.clockSpeed}
        onChange={(e) => setClockSpeed(Number(e.target.value))}
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>

      {!compact && (
        <>
          {[5, 15, 30, 60].map((m) => (
            <Button key={m} size="sm" variant="outline" onClick={() => advanceTime(m)}>
              +{m >= 60 ? "1h" : `${m} min`}
            </Button>
          ))}
          <Input
            className="h-8 w-24"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onBlur={() => /^\d{2}:\d{2}$/.test(novo) && setTime(novo)}
          />
          <Button size="sm" variant="outline" onClick={jumpToNextEvent}>
            Próximo evento
          </Button>
          <Button size="sm" variant="outline" onClick={transitionToDay2}>
            Dia 1 → madrugada → Dia 2
          </Button>
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={session.autoPauseOnTest}
              onChange={(e) => setAutoPause(e.target.checked)}
            />
            pausar ao abrir teste/pista
          </label>
        </>
      )}
    </div>
  );
}

/** Alerta persistente de evento obrigatório em curso. */
export function EventAlert({ onOpen }: { onOpen?: () => void }) {
  const { agora, atrasados } = useTimelineStatus();
  const activateEvent = useCampaign((s) => s.activateEvent);
  if (!agora) return null;
  const atrasado = atrasados.some((e) => e.id === agora.id);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-destructive bg-destructive/15 px-4 py-2">
      <span className="stamp text-destructive">
        {atrasado ? "EVENTO ATRASADO" : "EVENTO AGORA"} — {agora.time}
      </span>
      <span className="text-sm font-semibold">{agora.title}</span>
      <span className="text-xs text-muted-foreground">{agora.description}</span>
      <div className="ml-auto flex gap-2">
        <Button size="sm" onClick={() => (onOpen ? onOpen() : activateEvent(agora.id, "ativar"))}>
          Abrir evento
        </Button>
        <Button size="sm" variant="ghost" onClick={() => activateEvent(agora.id, "adiar")}>
          Adiar
        </Button>
      </div>
    </div>
  );
}
