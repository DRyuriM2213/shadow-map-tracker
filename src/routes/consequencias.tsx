import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CONSEQUENCES, CLUES, LOCATIONS, PLAYERS } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";

export const Route = createFileRoute("/consequencias")({
  head: () => ({
    meta: [
      { title: "Consequências — Berço Vazio" },
      { name: "description", content: "Consequências imediatas, atrasadas e condicionais da campanha, com agendamento e cancelamento." },
      { property: "og:title", content: "Consequências — Berço Vazio" },
      { property: "og:description", content: "Controle o que muda no campus depois de cada decisão do grupo." },
    ],
  }),
  component: ConsequenciasPage,
});

function ConsequenciasPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [filtro, setFiltro] = useState("todas");

  const lista = CONSEQUENCES.filter((c) => filtro === "todas" || c.type === filtro);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Consequências</h1>
            <p className="text-sm text-muted-foreground">
              Cada consequência pode ser agendada, adiada, cancelada ou ativada manualmente.
            </p>
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-sm border border-input bg-background px-2 py-1.5 text-sm"
          >
            {["todas", "imediata", "atrasada", "condicional", "permanente", "reversivel", "institucional", "social", "investigativa"].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </select>
        </header>

        <section className="dossier rounded-sm p-4">
          <h2 className="stamp text-primary">Agendadas nesta sessão</h2>
          {session.scheduled.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma consequência agendada ainda.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {session.scheduled.map((s) => {
                const q = CONSEQUENCES.find((c) => c.id === s.consequenceId);
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 border-l-2 border-l-primary pl-3">
                    <span className="font-semibold">{q?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      DIA {s.day} · {s.time} · {s.status}
                    </span>
                    {s.status === "pendente" && (
                      <span className="ml-auto flex gap-2">
                        <Button size="sm" onClick={() => store.resolveConsequence(s.id, "ativada")}>
                          Ativar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => store.resolveConsequence(s.id, "adiada")}>
                          Adiar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => store.resolveConsequence(s.id, "cancelada")}>
                          Cancelar
                        </Button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          {lista.map((c) => (
            <article key={c.id} className="dossier rounded-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">{c.name}</h3>
                <span className="stamp rounded-sm bg-secondary px-2 py-0.5">{c.type}</span>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Item label="Causa" v={c.cause} />
                <Item label="Momento de ativação" v={c.triggerTime} />
                <Item label="Condição" v={c.conditions} />
                <Item label="Efeito" v={c.effect} />
                <Item label="Duração" v={c.duration} />
                <Item
                  label="Locais afetados"
                  v={c.affectedLocations.map((id) => LOCATIONS.find((l) => l.id === id)?.name ?? id).join(", ") || "—"}
                />
                <Item
                  label="Pistas afetadas"
                  v={c.affectedClues.map((id) => CLUES.find((x) => x.id === id)?.name ?? id).join(", ") || "—"}
                />
                <Item
                  label="Pessoas afetadas"
                  v={
                    c.affectedCharacters.map((id) => PLAYERS.find((p) => p.id === id)?.characterName ?? id).join(", ") ||
                    "—"
                  }
                />
              </dl>
              <Button size="sm" className="mt-3" onClick={() => store.scheduleConsequence(c.id)}>
                Agendar consequência
              </Button>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Item({ label, v }: { label: string; v: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-2">
      <dt className="stamp text-muted-foreground">{label}</dt>
      <dd>{v}</dd>
    </div>
  );
}
