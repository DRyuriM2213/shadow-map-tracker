import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLAYERS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";

export const Route = createFileRoute("/personagens")({ component: PersonagensPage });

function PersonagensPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [editados, setEditados] = useState<Record<string, { characterName: string; playerName: string; notes: string }>>({});
  const [nota, setNota] = useState<Record<string, string>>({});
  const ativos = PLAYERS.filter((p) => !p.isPending);
  const pendentes = PLAYERS.filter((p) => p.isPending);

  const card = (p: (typeof PLAYERS)[number]) => {
    const ed = editados[p.id] ?? { characterName: p.characterName, playerName: p.playerName, notes: p.notes };
    const notas = session.notes.filter((n) => n.targetId === p.id);
    return <article key={p.id} className={`dossier rounded-sm p-4 ${p.isPending ? "border-dashed opacity-85" : ""}`}>
      <div className="flex items-start justify-between gap-2"><div><h2 className="font-display text-2xl">{ed.characterName}</h2><p className="text-xs text-muted-foreground">Jogador: {ed.playerName}</p></div><span className="stamp rounded-sm bg-secondary px-2 py-0.5">{p.status}</span></div>
      <p className="mt-2 text-sm">{p.role}</p><p className="mt-2 text-xs text-muted-foreground">{ed.notes}</p>
      {p.isPending && <div className="mt-3 space-y-2"><p className="rounded-sm border border-route-amarelo/40 bg-route-amarelo/5 p-2 text-xs">Esta é só uma posição narrativa reservada. Não é player confirmado e não deve ser usada até o mestre definir alguém.</p><Input value={ed.characterName} onChange={(e)=>setEditados((s)=>({...s,[p.id]:{...ed,characterName:e.target.value}}))} placeholder="Nome do personagem"/><Input value={ed.playerName} onChange={(e)=>setEditados((s)=>({...s,[p.id]:{...ed,playerName:e.target.value}}))} placeholder="Jogador"/><Textarea value={ed.notes} onChange={(e)=>setEditados((s)=>({...s,[p.id]:{...ed,notes:e.target.value}}))} className="h-20"/></div>}
      <div className="mt-4 border-t border-border pt-3"><p className="stamp text-muted-foreground">Notas do mestre</p><ul className="mt-1 space-y-1 text-xs">{notas.map((n)=><li key={n.id} className="flex items-start justify-between gap-2"><span><span className="font-mono text-muted-foreground">D{n.day} {n.time}</span> {n.text}</span><button className="text-destructive underline" onClick={()=>store.removeNote(n.id)}>remover</button></li>)}{notas.length===0&&<li className="text-muted-foreground">Nenhuma nota ainda.</li>}</ul><div className="mt-2 flex gap-2"><Input value={nota[p.id]??""} onChange={(e)=>setNota((s)=>({...s,[p.id]:e.target.value}))} placeholder="Anotação rápida" className="h-8 text-xs"/><Button size="sm" onClick={()=>{const t=(nota[p.id]??"").trim();if(!t)return;store.addNote("personagem",p.id,t);setNota((s)=>({...s,[p.id]:""}));}}>Anotar</Button></div></div>
    </article>;
  };

  return <Shell><div className="mx-auto max-w-5xl space-y-6">
    <header className="dossier rounded-sm p-5"><p className="stamp text-primary">Jogadores confirmados</p><h1 className="text-3xl font-semibold">Personagens</h1><p className="text-sm text-muted-foreground">O sistema apresenta contexto e opções, mas nunca decide falas, pensamentos ou escolhas dos personagens dos jogadores.</p></header>
    <section><h2 className="stamp text-primary">Elenco atual — 4 jogadores</h2><div className="mt-3 grid gap-4 md:grid-cols-2">{ativos.map(card)}</div></section>
    {pendentes.length>0&&<section><h2 className="stamp text-route-amarelo">Posição opcional ainda não confirmada</h2><div className="mt-3 grid gap-4 md:grid-cols-2">{pendentes.map(card)}</div></section>}
    <div className="dossier rounded-sm p-4 text-sm"><p className="stamp text-primary">Regras de cânone</p><ul className="mt-2 space-y-1 text-muted-foreground"><li>• Guilherme joga com Augusto. Augusto também é diretor, mas não é NPC controlado pelo mestre.</li><li>• Luiz joga com Sofia. Quando o assunto for a vítima histórica, use sempre o nome completo <b>Sofia Mendes</b>.</li><li>• Thaissa joga com Amelie; Thaissa não é NPC.</li><li>• Andy joga com Percy; Andy e Percy não são entidades separadas.</li><li>• Alice saiu da campanha e não é player/NPC atual. O nome pode permanecer apenas em props físicos antigos já impressos, sinalizados como conflito de continuidade.</li><li>• Até existir um novo jogador confirmado, a vaga narrativa é chamada somente de “Filho do Diretor”.</li></ul></div>
  </div></Shell>;
}
