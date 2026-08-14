import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAYERS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";

export const Route = createFileRoute("/personagens")({ component: PersonagensPage });

function PersonagensPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [nota, setNota] = useState<Record<string, string>>({});

  return <Shell><div className="mx-auto max-w-6xl space-y-6">
    <header className="dossier rounded-sm p-5"><p className="stamp text-primary">Elenco atual da campanha</p><h1 className="text-3xl font-semibold">5 personagens de jogador</h1><p className="mt-1 text-sm text-muted-foreground">O painel apresenta contexto e registra fatos, mas nunca escolhe fala, sentimento ou ação por nenhum PJ.</p></header>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{PLAYERS.map((p) => { const notas = session.notes.filter((n) => n.targetId === p.id); return <article key={p.id} className="dossier rounded-sm p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-display text-2xl">{p.characterName}</h2><p className="text-xs text-muted-foreground">Jogador: {p.playerName}</p></div><span className="stamp rounded-sm bg-secondary px-2 py-0.5">{p.status}</span></div><p className="mt-2 text-sm">{p.role}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.notes}</p><div className="mt-4 border-t border-border pt-3"><p className="stamp text-muted-foreground">Notas do mestre</p><ul className="mt-2 space-y-1.5 text-xs">{notas.map((n) => <li key={n.id} className="flex items-start justify-between gap-2 rounded-sm bg-secondary/20 p-2"><span><span className="font-mono text-muted-foreground">D{n.day} {n.time}</span> {n.text}</span><button className="text-destructive underline" onClick={() => store.removeNote(n.id)}>remover</button></li>)}{notas.length === 0 && <li className="text-muted-foreground">Nenhuma nota ainda.</li>}</ul><div className="mt-2 flex gap-2"><Input value={nota[p.id] ?? ""} onChange={(e) => setNota((s) => ({ ...s, [p.id]: e.target.value }))} placeholder="Anotação rápida" className="h-8 text-xs" onKeyDown={(e) => { if (e.key === "Enter") { const t = (nota[p.id] ?? "").trim(); if (!t) return; store.addNote("personagem", p.id, t); setNota((s) => ({ ...s, [p.id]: "" })); } }} /><Button size="sm" onClick={() => { const t = (nota[p.id] ?? "").trim(); if (!t) return; store.addNote("personagem", p.id, t); setNota((s) => ({ ...s, [p.id]: "" })); }}>Anotar</Button></div></div></article>; })}</section>
    <section className="dossier rounded-sm p-4 text-sm"><p className="stamp text-primary">Cânone que o sistema deve respeitar</p><ul className="mt-2 space-y-2 text-muted-foreground"><li>• <b>Guilherme → Augusto</b>. Augusto é diretor e PJ; nunca recebe diálogo/decisão automática.</li><li>• <b>Luiz → Sofia</b>. Sofia descobriu no Dia 2 que é filha de Augusto. A vítima histórica é sempre <b>Sofia Mendes</b>.</li><li>• <b>Vitor → Adolfo</b>. Não confundir Vitor player com o NPC <b>Vitor Hugo Nogueira</b>.</li><li>• <b>Thaissa → Amelie</b>. Thaissa não é NPC.</li><li>• <b>Andy → Percy</b>. Andy e Percy não são entidades separadas.</li><li>• Alice não é personagem atual; referências a ela podem existir apenas em props físicos legados.</li></ul></section>
  </div></Shell>;
}
