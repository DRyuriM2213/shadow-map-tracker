import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Radio, X } from "lucide-react";

export function TranscendenceOverlay({ title, body, onAnswer, onLater, onSound }: { title: string; body: string; onAnswer: () => void; onLater: () => void; onSound: () => void }) {
  useEffect(() => { onSound(); }, [onSound]);
  return <div className="transcendence-overlay" role="dialog" aria-modal="true" aria-labelledby="transcendence-title">
    <div className="transcendence-interference" aria-hidden="true"/><div className="transcendence-vignette" aria-hidden="true"/>
    <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="transcendence-symbol"><Eye className="size-8"/></div><p className="stamp mt-7 text-primary"><Radio className="mr-2 inline size-3"/>Sinal além da Membrana</p>
      <h1 id="transcendence-title" className="transcendence-title mt-4 font-display text-4xl font-semibold sm:text-6xl">{title || "O OUTRO LADO ESTÁ CHAMANDO"}</h1>
      <p className="transcendence-copy mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{body || "Há algo além da Membrana. Você pode responder."}</p>
      <p className="mt-3 text-sm text-foreground/80">Há algo além da Membrana. Você pode responder.</p>
      <div className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:flex-row"><Button size="lg" className="flex-1" onClick={onAnswer}>Responder ao chamado</Button><Button size="lg" variant="ghost" className="flex-1" onClick={onLater}><X className="mr-2 size-4"/>Agora não</Button></div>
      <p className="mt-5 text-xs text-muted-foreground">Responder abre a progressão. Nenhum poder é concedido automaticamente.</p>
    </div>
  </div>;
}