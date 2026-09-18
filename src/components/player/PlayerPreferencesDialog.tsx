import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PLAYER_ACCENTS, type PlayerPreferences } from "@/hooks/usePlayerExperience";
import { Check, Volume2, VolumeX } from "lucide-react";

export function PlayerPreferencesDialog({ open, onOpenChange, preferences, onChange, readOnly }: { open: boolean; onOpenChange: (open: boolean) => void; preferences: PlayerPreferences; onChange: (next: PlayerPreferences) => void; readOnly: boolean }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="player-settings max-w-md rounded-2xl border-border/70 bg-background/95">
    <DialogHeader><DialogTitle className="font-display text-2xl">Seu terminal</DialogTitle><DialogDescription>A aparência e o som ficam somente neste aparelho.</DialogDescription></DialogHeader>
    <div className="space-y-5">
      <div><Label>Cor de destaque</Label><div className="mt-2 grid grid-cols-6 gap-2">{PLAYER_ACCENTS.map((color) => <button key={color.value} type="button" aria-label={color.name} title={color.name} disabled={readOnly} className="relative aspect-square rounded-xl border border-border transition-transform hover:scale-105" style={{ backgroundColor: color.value }} onClick={() => onChange({ ...preferences, accent: color.value })}>{preferences.accent.toLowerCase() === color.value && <Check className="absolute inset-0 m-auto size-4 text-primary-foreground"/>}</button>)}</div><label className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card/40 p-3 text-sm"><span>Cor personalizada</span><input type="color" disabled={readOnly} value={preferences.accent} onChange={(event) => onChange({ ...preferences, accent: event.target.value })} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"/></label></div>
      <div><Label>Intensidade visual</Label><div className="mt-2 grid grid-cols-2 gap-2">{(["sobrio", "paranormal"] as const).map((value) => <Button key={value} variant={preferences.intensity === value ? "default" : "outline"} disabled={readOnly} onClick={() => onChange({ ...preferences, intensity: value })}>{value === "sobrio" ? "Sóbrio" : "Paranormal"}</Button>)}</div></div>
      <div><div className="flex items-center justify-between"><Label>Som</Label><Button size="sm" variant="outline" disabled={readOnly} onClick={() => onChange({ ...preferences, sound: !preferences.sound })}>{preferences.sound ? <Volume2 className="mr-2 size-4"/> : <VolumeX className="mr-2 size-4"/>}{preferences.sound ? "Ligado" : "Desligado"}</Button></div><input className="mt-3 w-full accent-primary" aria-label="Volume" type="range" min="0" max="1" step="0.05" disabled={readOnly || !preferences.sound} value={preferences.volume} onChange={(event) => onChange({ ...preferences, volume: Number(event.target.value) })}/></div>
      {readOnly && <p className="rounded-xl border border-route-amarelo/30 bg-route-amarelo/5 p-3 text-xs text-route-amarelo">A prévia do mestre não salva preferências.</p>}
    </div>
  </DialogContent></Dialog>;
}