import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLAYERS } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";

export const Route = createFileRoute("/personagens")({
  head: () => ({
    meta: [
      { title: "Personagens — Berço Vazio" },
      { name: "description", content: "Jogadores e personagens da campanha, com regras de autonomia e notas do mestre." },
      { property: "og:title", content: "Personagens — Berço Vazio" },
      { property: "og:description", content: "Augusto, Sofia, Amelie, Percy e a vaga do Filho do Diretor." },
    ],
  }),
  component: PersonagensPage,
});

function PersonagensPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [editados, setEditados] = useState<Record<string, { characterName: string; playerName: string; notes: string }>>(
    {},
  );
  const [nota, setNota] = useState<Record<string, string>>({});

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold">Personagens</h1>
          <p className="text-sm text-muted-foreground">
            Todos abaixo são personagens de jogadores. O sistema nunca decide o que eles falam, pensam, em quem confiam ou
            qual decisão tomam — apenas apresenta contexto, opções, testes e consequências.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {PLAYERS.map((p) => {
            const ed = editados[p.id] ?? {
              characterName: p.characterName,
              playerName: p.playerName,
              notes: p.notes,
            };
            const notas = session.notes.filter((n) => n.targetId === p.id);
            return (
              <article key={p.id} className={`dossier rounded-sm p-4 ${p.isPending ? "border-dashed" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-2xl">{ed.characterName}</h2>
                    <p className="text-xs text-muted-foreground">Jogador: {ed.playerName}</p>
                  </div>
                  <span className="stamp rounded-sm bg-secondary px-2 py-0.5">{p.status}</span>
                </div>
                <p className="mt-2 text-sm">{p.role}</p>
                <p className="mt-2 text-xs text-muted-foreground">{ed.notes}</p>

                {p.isPending && (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={ed.characterName}
                      onChange={(e) =>
                        setEditados((s) => ({ ...s, [p.id]: { ...ed, characterName: e.target.value } }))
                      }
                      placeholder="Nome do personagem"
                    />
                    <Input
                      value={ed.playerName}
                      onChange={(e) => setEditados((s) => ({ ...s, [p.id]: { ...ed, playerName: e.target.value } }))}
                      placeholder="Jogador"
                    />
                    <Textarea
                      value={ed.notes}
                      onChange={(e) => setEditados((s) => ({ ...s, [p.id]: { ...ed, notes: e.target.value } }))}
                      className="h-20"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Posição narrativa reservada. Edite quando um novo jogador assumir.
                    </p>
                  </div>
                )}

                <div className="mt-4 border-t border-border pt-3">
                  <p className="stamp text-muted-foreground">Notas do mestre</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {notas.map((n) => (
                      <li key={n.id} className="flex items-start justify-between gap-2">
                        <span>
                          <span className="font-mono text-muted-foreground">
                            D{n.day} {n.time}
                          </span>{" "}
                          {n.text}
                        </span>
                        <button className="text-destructive underline" onClick={() => store.removeNote(n.id)}>
                          remover
                        </button>
                      </li>
                    ))}
                    {notas.length === 0 && <li className="text-muted-foreground">Nenhuma nota ainda.</li>}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={nota[p.id] ?? ""}
                      onChange={(e) => setNota((s) => ({ ...s, [p.id]: e.target.value }))}
                      placeholder="Anotação rápida"
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const t = (nota[p.id] ?? "").trim();
                        if (!t) return;
                        store.addNote("personagem", p.id, t);
                        setNota((s) => ({ ...s, [p.id]: "" }));
                      }}
                    >
                      Anotar
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="dossier rounded-sm p-4 text-sm">
          <p className="stamp text-primary">Regras de mesa registradas no sistema</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• Augusto é personagem de Guilherme e também diretor da universidade — o sistema apenas oferece opções institucionais.</li>
            <li>• Andy nunca é tratada como pessoa separada de Percy.</li>
            <li>• Thaissa nunca é tratada como NPC; Amelie é a personagem.</li>
            <li>• Alice saiu da campanha e não aparece em nenhuma parte do sistema.</li>
            <li>• A posição narrativa em aberto é chamada apenas de “Filho do Diretor”.</li>
          </ul>
        </div>
      </div>
    </Shell>
  );
}
