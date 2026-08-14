import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CLUES, LOCATIONS, SCENES, TIMELINE } from "@/data/campaignFull";
import { NPCS } from "@/data/npcs";
import { useCampaign } from "@/store/campaign";

const PAGES = [
  { to: "/", label: "Painel" },
  { to: "/sessao-v2", label: "Sessão ao vivo" },
  { to: "/mapa", label: "Mapa interativo" },
  { to: "/timeline", label: "Timeline" },
  { to: "/locais", label: "Locais e salas" },
  { to: "/pistas-v2", label: "Pistas e documentos" },
  { to: "/npcs", label: "NPCs e falas" },
  { to: "/personagens", label: "Personagens" },
  { to: "/consequencias", label: "Consequências" },
  { to: "/diagrama", label: "Diagrama" },
  { to: "/resumo", label: "Resumo" },
  { to: "/assets", label: "Imagens e backup" },
  { to: "/editar", label: "Editar campanha" },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const setLocation = useCampaign((s) => s.setLocation);
  const setClue = useCampaign((s) => s.setClue);
  const goToScene = useCampaign((s) => s.goToScene);
  const toggleClock = useCampaign((s) => s.toggleClock);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página, sala, documento, pista, NPC, evento ou cena…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Ações rápidas">
          <CommandItem onSelect={() => run(toggleClock)}>Play / pausar relógio da campanha</CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: "/assets" }))}>Carregar mapas / imagens de NPC</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Páginas">
          {PAGES.map((p) => (
            <CommandItem key={p.to} value={`${p.label} página`} onSelect={() => run(() => navigate({ to: p.to }))}>{p.label}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Salas — levar o grupo">
          {LOCATIONS.map((l) => (
            <CommandItem key={l.id} value={`${l.name} ${l.sector}`} onSelect={() => run(() => setLocation(l.id))}>
              {l.name} <span className="ml-2 text-xs text-muted-foreground">{l.sector}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Pistas e documentos — entregar">
          {CLUES.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.category} ${c.sourceDocument} ${c.playerDescription} ${c.microLocation}`}
              onSelect={() => run(() => setClue(c.id, "encontrada", `Entregue via paleta — ${c.name}`))}
            >
              <span className="truncate">{c.name}</span>
              {c.sourceDocument && <span className="ml-2 truncate font-mono text-[10px] text-muted-foreground">{c.sourceDocument}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="NPCs oficiais">
          {NPCS.map((npc) => (
            <CommandItem key={npc.id} value={`${npc.name} ${npc.role} ${npc.status} ${npc.topics.map((t) => t.label).join(" ")}`} onSelect={() => run(() => navigate({ to: "/npcs" }))}>
              {npc.name} <span className="ml-2 text-xs text-muted-foreground">{npc.role} · {npc.status}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Eventos da timeline">
          {TIMELINE.map((event) => (
            <CommandItem key={event.id} value={`${event.title} ${event.description} dia ${event.day} ${event.time}`} onSelect={() => run(() => navigate({ to: "/timeline" }))}>
              <span className="font-mono text-xs">D{event.day} {event.time}</span><span className="ml-2">{event.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Cenas">
          {SCENES.map((s) => (
            <CommandItem key={s.id} value={`${s.title} ${s.masterDescription}`} onSelect={() => run(() => goToScene(s.id, "Ir para cena (paleta)"))}>{s.title}</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}