import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLUES, LOCATIONS, TESTS } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, locationStatusLabel, routeBorder, routeDot } from "@/lib/ui";
import type { LocationStatus } from "@/lib/types";
import { TestDialog } from "@/components/TestDialog";

export const Route = createFileRoute("/locais")({
  head: () => ({
    meta: [
      { title: "Locais e Salas — Berço Vazio" },
      { name: "description", content: "Todas as salas da Universidade Valença com pistas, ações, testes e riscos." },
      { property: "og:title", content: "Locais e Salas — Berço Vazio" },
      { property: "og:description", content: "Cards por setor com o que o grupo pode encontrar em cada sala." },
    ],
  }),
  component: LocaisPage,
});

const STATUSES: LocationStatus[] = [
  "nao-visitada",
  "disponivel",
  "investigando",
  "investigada-parcial",
  "investigada-completa",
  "bloqueada",
  "isolada",
  "inacessivel",
  "revisitavel",
];

function LocaisPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [aberto, setAberto] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [clueId, setClueId] = useState<string | null>(null);

  const setores = [...new Set(LOCATIONS.map((l) => l.sector))];
  const local = LOCATIONS.find((l) => l.id === aberto);
  const clue = CLUES.find((c) => c.id === clueId);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Locais e Salas</h1>
          <p className="text-sm text-muted-foreground">
            Organizados por setor. Clique em uma sala para ver o que eles podem encontrar ali.
          </p>
        </header>

        {setores.map((setor) => (
          <section key={setor}>
            <h2 className="stamp text-primary">{setor}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {LOCATIONS.filter((l) => l.sector === setor).map((l) => {
                const st = session.locationStatus[l.id] ?? "nao-visitada";
                return (
                  <button
                    key={l.id}
                    onClick={() => setAberto(l.id)}
                    className={`dossier rounded-sm border-l-4 p-4 text-left transition-colors hover:border-primary ${routeBorder[l.route]}`}
                  >
                    <p className="text-lg font-semibold">{l.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-sm bg-secondary px-2 py-0.5">{locationStatusLabel[st]}</span>
                      <span className="rounded-sm bg-secondary px-2 py-0.5">
                        Dia {l.dayAvailable.join(" e ")}
                      </span>
                      <span className="rounded-sm bg-secondary px-2 py-0.5">{l.clueIds.length} pistas</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          {local && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl">{local.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>{local.description}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Disponibilidade" value={local.availability} />
                  <Field label="Dias de acesso" value={`Dia ${local.dayAvailable.join(" e ")}`} />
                  <Field label="Horário recomendado" value={local.recommendedTime} />
                  <Field label="Pré-requisitos" value={local.prerequisites} />
                  <Field label="Pessoas presentes" value={local.people.join(", ")} />
                  <Field
                    label="Locais conectados"
                    value={local.connectedLocations
                      .map((id) => LOCATIONS.find((x) => x.id === id)?.name ?? id)
                      .join(", ")}
                  />
                </div>

                <div className="rounded-sm border border-primary/50 p-4">
                  <p className="stamp text-primary">Nesta sala eles podem encontrar</p>
                  <ul className="mt-2 space-y-2">
                    {local.clueIds.map((cid) => {
                      const c = CLUES.find((x) => x.id === cid);
                      if (!c) return null;
                      const st = session.clueStatus[cid] ?? "escondida";
                      return (
                        <li key={cid}>
                          <button
                            className="flex w-full items-center gap-2 rounded-sm border border-border p-2 text-left hover:border-primary"
                            onClick={() => setClueId(cid)}
                          >
                            <span className={`size-2 rounded-full ${routeDot[c.route]}`} />
                            <span className="font-semibold">{c.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{clueStatusLabel[st]}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <Listing title="Ações possíveis" items={local.actions} />
                <div>
                  <p className="stamp text-muted-foreground">Testes</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {local.testIds.map((t) => (
                      <Button key={t} size="sm" variant="outline" onClick={() => setTestId(t)}>
                        {TESTS.find((x) => x.id === t)?.name ?? t}
                      </Button>
                    ))}
                  </div>
                </div>
                <Listing title="Perigos" items={local.risks} />
                <Listing title="Consequências" items={local.consequences} />

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <span className="stamp text-muted-foreground">Estado da sala:</span>
                  <select
                    className="rounded-sm border border-input bg-background px-2 py-1 text-xs"
                    value={session.locationStatus[local.id] ?? "nao-visitada"}
                    onChange={(e) => store.setLocationStatus(local.id, e.target.value as LocationStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {locationStatusLabel[s]}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      store.setLocation(local.id);
                      setAberto(null);
                    }}
                  >
                    Levar o grupo para cá
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!clueId} onOpenChange={(o) => !o && setClueId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {clue && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{clue.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="paper-sheet rounded-sm p-3">{clue.playerDescription}</p>
                <p className="rounded-sm border border-route-preto bg-black/40 p-3">
                  <span className="stamp text-route-cinza">Segredo do mestre: </span>
                  {clue.masterMeaning || "—"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      store.setClue(clue.id, "encontrada", clue.name);
                      setClueId(null);
                    }}
                  >
                    Marcar como encontrada
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      store.setClue(clue.id, "perdida", clue.name);
                      setClueId(null);
                    }}
                  >
                    Marcar como perdida
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <TestDialog testId={testId} onClose={() => setTestId(null)} />
    </Shell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="stamp text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function Listing({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="stamp text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}
