import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, FileWarning, Goal, Radio, X } from "lucide-react";

export type SpecialEventKind = "EVENTO_VISAO" | "EVENTO_SEGREDO" | "EVENTO_OBJETIVO" | "EVENTO_INTERFERENCIA";

const META: Record<SpecialEventKind,{label:string;icon:typeof Eye}> = {
  EVENTO_VISAO:{label:"VISÃO PARANORMAL",icon:Eye},
  EVENTO_SEGREDO:{label:"MENSAGEM RESTRITA",icon:FileWarning},
  EVENTO_OBJETIVO:{label:"DIRETRIZ URGENTE",icon:Goal},
  EVENTO_INTERFERENCIA:{label:"INTERFERÊNCIA DETECTADA",icon:Radio},
};

export function PlayerSpecialEventOverlay({ kind, title, body, onSound, onLater, onAcknowledge }: {
  kind: SpecialEventKind;
  title: string;
  body: string;
  onSound: () => void;
  onLater: () => void;
  onAcknowledge: () => void;
}) {
  const meta=META[kind], Icon=meta.icon;
  useEffect(()=>{
    onSound();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onLater(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  },[onLater,onSound]);
  return <div className={"special-event-overlay "+kind.toLowerCase()} role="dialog" aria-modal="true" aria-label={title}>
    <div className="special-event-scan" aria-hidden="true"/>
    <button className="special-event-close" onClick={onLater} aria-label="Fechar por enquanto"><X className="size-4"/></button>
    <div className="special-event-card">
      <div className="special-event-emblem"><Icon className="size-6"/></div>
      <p className="stamp text-primary">{meta.label}</p>
      <h2>{title}</h2>
      <p className="special-event-copy">{body}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center"><Button onClick={onAcknowledge}>Registrar no terminal</Button><Button variant="ghost" onClick={onLater}>Agora não</Button></div>
    </div>
  </div>;
}
