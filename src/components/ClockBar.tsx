import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampaign } from "@/store/campaign";
import { SPEEDS, useTimelineStatus } from "@/lib/clock";
import { AlertTriangle, Clock3, Pause, Play } from "lucide-react";

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

  useEffect(() => setNovo(session.time), [session.time]);

  const quickClass = (minutes: number) => {
    if (!compact) return "";
    if (minutes >= 60) return "hidden xl:inline-flex";
    if (minutes >= 30) return "hidden lg:inline-flex";
    return "";
  };

  return <div className="flex flex-wrap items-center gap-2 text-xs">
    <Button size="sm" variant={session.clockRunning ? "destructive" : "default"} onClick={toggleClock}>
      {session.clockRunning ? <Pause className="mr-1 size-3.5"/> : <Play className="mr-1 size-3.5"/>}
      {session.clockRunning ? "PAUSAR" : "PLAY"}
    </Button>
    <span className={`stamp ${session.clockRunning ? "text-route-verde-claro" : "text-route-amarelo"}`}>
      {session.clockRunning ? "RODANDO" : "PAUSADO"}
    </span>
    <select
      className="rounded-sm border border-input bg-background px-2 py-1"
      value={session.clockSpeed}
      onChange={(e)=>setClockSpeed(Number(e.target.value))}
      aria-label="Velocidade do relógio"
    >
      {SPEEDS.map((s)=><option key={s} value={s}>{s}x</option>)}
    </select>

    {[5,15,30,60].map((m)=><Button
      key={m}
      size="sm"
      variant="outline"
      className={quickClass(m)}
      onClick={()=>advanceTime(m)}
      title={`Avançar ${m} minutos no jogo`}
    >
      +{m>=60?"1h":`${m}`}
    </Button>)}

    <Input
      type="time"
      className={compact ? "hidden h-8 w-24 xl:block" : "h-8 w-28"}
      value={novo}
      onChange={(e)=>setNovo(e.target.value)}
      onBlur={()=>/^\d{2}:\d{2}$/.test(novo)&&setTime(novo)}
      aria-label="Horário da campanha"
    />

    <Button
      size="sm"
      variant="outline"
      className={compact ? "hidden 2xl:inline-flex" : ""}
      onClick={()=>{if(confirm("Avançar o relógio até o próximo evento?"))jumpToNextEvent();}}
    >
      Próximo evento
    </Button>

    {!compact&&<>
      {session.day===1&&<Button size="sm" variant="outline" onClick={()=>{if(confirm("Executar a transição Dia 1 → evento 03:33 → Dia 2 às 08:00?"))transitionToDay2();}}>Dia 1 → madrugada → Dia 2</Button>}
      <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <input type="checkbox" checked={session.autoPauseOnTest} onChange={(e)=>setAutoPause(e.target.checked)}/>
        pausar ao abrir teste/pista/NPC
      </label>
    </>}
  </div>;
}

/** O store atual não implementa snooze real de eventos; por segurança, o alerta só oferece registrar/abrir. */
export function EventAlert({ onOpen }: { onOpen?: () => void }) {
  const { agora, atrasados, proximo, countdown } = useTimelineStatus();
  const activateEvent = useCampaign((s) => s.activateEvent);
  if (agora) {
    const atrasado=atrasados.some((e)=>e.id===agora.id);
    return <div className="flex flex-wrap items-center gap-3 rounded-sm border border-destructive bg-destructive/15 px-3 py-2 sm:px-4"><span className="stamp text-destructive"><AlertTriangle className="mr-1 inline size-4"/>{atrasado?"EVENTO ATRASADO":"EVENTO AGORA"} — {agora.time}</span><span className="text-sm font-semibold">{agora.title}</span><span className="min-w-[220px] flex-1 text-xs text-muted-foreground">{agora.description}</span><Button size="sm" className="ml-auto" onClick={()=>onOpen?onOpen():activateEvent(agora.id,"ativar")}>Registrar / abrir evento</Button></div>;
  }
  if(proximo&&countdown!==null&&countdown>=0&&countdown<=15)return <div className="flex flex-wrap items-center gap-3 rounded-sm border border-route-amarelo/70 bg-route-amarelo/10 px-3 py-2 sm:px-4"><span className="stamp text-route-amarelo"><Clock3 className="mr-1 inline size-4"/>EVENTO EM {countdown} MIN — {proximo.time}</span><span className="text-sm font-semibold">{proximo.title}</span><span className="min-w-[220px] flex-1 text-xs text-muted-foreground">Prepare a transição; o relógio ainda pode continuar rodando.</span></div>;
  return null;
}
