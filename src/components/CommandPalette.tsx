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
import { CLUES, LOCATIONS, SCENES } from "@/data/campaignFull";
import { NPCS } from "@/data/npcs";
import { useCampaign } from "@/store/campaign";

const PAGES = [
  { to: "/", label: "Painel" },
  { to: "/sessao-v2", label: "Sessão ao vivo" },
  { to: "/mapa", label: "Mapa interativo" },
  { to: "/diagrama", label: "Diagrama" },
  { to: "/timeline", label: "Timeline" },
  { to: "/locais", label: "Locais e salas" },
  { to: "/pistas-v2", label: "Pistas e documentos" },
  { to: "/npcs", label: "NPCs e falas" },
  { to: "/personagens", label: "Personagens" },
  { to: "/consequencias", label: "Consequências" },
  { to: "/resumo", label: "Resumo" },
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
      <CommandInput placeholder="Buscar sala, documento, pista, NPC, cena ou página…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Ações rápidas">
          <CommandItem onSelect={() => run(toggleClock)}>Play / pausar relógio da campanha</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Páginas">
          {PAGES.map((p) => (
            <CommandItem key={p.to} onSelect={() => run(() => navigate({ to: p.to }))}>{p.label}</CommandItem>
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
              value={`${c.name} ${c.category} ${c.sourceDocument}`}
              onSelect={() => run(() => setClue(c.id, "encontrada", `Entregue via paleta — ${c.name}`))}
            >
              {c.name}{c.sourceDocument && <span className="ml-2 font-mono text-[10px] text-muted-foreground">{c.sourceDocument}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="NPCs">
          {NPCS.map((npc) => (
            <CommandItem key={npc.id} value={`${npc.name} ${npc.role} ${npc.topics.map((t) => t.label).join(" ")}`} onSelect={() => run(() => navigate({ to: "/npcs" }))}>
              {npc.name} <span className="ml-2 text-xs text-muted-foreground">{npc.role}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Cenas">
          {SCENES.map((s) => (
            <CommandItem key={s.id} value={s.title} onSelect={() => run(() => goToScene(s.id, "Ir para cena (paleta)"))}>{s.title}</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}