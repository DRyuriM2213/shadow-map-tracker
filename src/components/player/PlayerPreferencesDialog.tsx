import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PLAYER_ACCENTS, type PlayerPreferences } from "@/hooks/usePlayerExperience";
import { Check, FileText, Flame, MonitorCog, Sparkles, Volume2, VolumeX } from "lucide-react";

const VISUAL_STYLES = [
  { id: "operacao" as const, label: "Operação", description: "Escudo tático, vidro escuro e foco em informação.", icon: MonitorCog },
  { id: "arquivo" as const, label: "Arquivo", description: "Papel, dossiês e investigação em primeiro plano.", icon: FileText },
  { id: "ocultista" as const, label: "Ocultista", description: "Mais contraste, símbolos e presença paranormal.", icon: Flame },
  { id: "minimalista" as const, label: "Minimalista", description: "Mais limpo, direto e com menos textura.", icon: Sparkles },
];

export function PlayerPreferencesDialog({ open, onOpenChange, preferences, onChange, readOnly }: { open: boolean; onOpenChange: (open: boolean) => void; preferences: PlayerPreferences; onChange: (next: PlayerPreferences) => void; readOnly: boolean }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="player-settings max-w-md rounded-2xl border-border/70 bg-background/95">
    <DialogHeader><DialogTitle className="font-display text-2xl">Seu terminal</DialogTitle><DialogDescription>A aparência e o som ficam somente neste aparelho.</DialogDescription></DialogHeader>
    <div className="space-y-5">
      <div><Label>Cor de destaque</Label><div className="mt-2 grid grid-cols-6 gap-2">{PLAYER_ACCENTS.map((color) => <button key={color.value} type="button" aria-label={color.name} title={color.name} disabled={readOnly} className="relative aspect-square rounded-xl border border-border transition-transform hover:scale-105" style={{ backgroundColor: color.value }} onClick={() => onChange({ ...preferences, accent: color.value })}>{preferences.accent.toLowerCase() === color.value && <Check className="absolute inset-0 m-auto size-4 text-primary-foreground"/>}</button>)}</div><label className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card/40 p-3 text-sm"><span>Cor personalizada</span><input type="color" disabled={readOnly} value={preferences.accent} onChange={(event) => onChange({ ...preferences, accent: event.target.value })} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"/></label></div>
      <div><Label>Estilo do terminal</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{VISUAL_STYLES.map((style) => { const Icon=style.icon; return <button key={style.id} type="button" disabled={readOnly} data-active={preferences.visualStyle===style.id} className="terminal-style-choice" onClick={()=>onChange({ ...preferences, visualStyle: style.id })}><Icon className="size-4"/><div><b>{style.label}</b><p>{style.description}</p></div></button>; })}</div></div>
      <div><Label>Intensidade visual</Label><div className="mt-2 grid grid-cols-2 gap-2">{(["sobrio", "paranormal"] as const).map((value) => <Button key={value} variant={preferences.intensity === value ? "default" : "outline"} disabled={readOnly} onClick={() => onChange({ ...preferences, intensity: value })}>{value === "sobrio" ? "Sóbrio" : "Paranormal"}</Button>)}</div></div>
      <div className="player-audio-settings"><div className="flex items-center justify-between"><Label>Som</Label><Button size="sm" variant="outline" disabled={readOnly} onClick={() => onChange({ ...preferences, sound: !preferences.sound })}>{preferences.sound ? <Volume2 className="mr-2 size-4"/> : <VolumeX className="mr-2 size-4"/>}{preferences.sound ? "Ligado" : "Desligado"}</Button></div>
        <Volume label="Volume geral" value={preferences.volume} disabled={readOnly||!preferences.sound} onChange={(value)=>onChange({...preferences,volume:value})}/>
        <Volume label="Interface" value={preferences.uiVolume} disabled={readOnly||!preferences.sound} onChange={(value)=>onChange({...preferences,uiVolume:value})}/>
        <Volume label="Dados" value={preferences.diceVolume} disabled={readOnly||!preferences.sound} onChange={(value)=>onChange({...preferences,diceVolume:value})}/>
        <Volume label="Eventos paranormais" value={preferences.eventVolume} disabled={readOnly||!preferences.sound} onChange={(value)=>onChange({...preferences,eventVolume:value})}/>
      </div>
      {readOnly && <p className="rounded-xl border border-route-amarelo/30 bg-route-amarelo/5 p-3 text-xs text-route-amarelo">A prévia do mestre não salva preferências.</p>}
    </div>
  </DialogContent></Dialog>;
}

function Volume({label,value,disabled,onChange}:{label:string;value:number;disabled:boolean;onChange:(value:number)=>void}) {
  return <label className="audio-slider"><span>{label}</span><b>{Math.round(value*100)}%</b><input className="accent-primary" type="range" min="0" max="1" step="0.05" disabled={disabled} value={value} onChange={(event)=>onChange(Number(event.target.value))}/></label>;
}