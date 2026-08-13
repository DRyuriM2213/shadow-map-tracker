import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LOCATIONS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";
import { locationStatusLabel, routeBorder } from "@/lib/ui";
import { RoomInspector, cluesForLocation } from "@/components/RoomInspector";

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

function LocaisPage() {
  const session = useCampaign((s) => s.session);
  const setLocation = useCampaign((s) => s.setLocation);
  const [aberto, setAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const filtradas = LOCATIONS.filter(
    (l) =>
      !busca.trim() ||
      `${l.name} ${l.sector} ${l.description}`.toLowerCase().includes(busca.toLowerCase()) ||
      cluesForLocation(l.id).some((c) => c.name.toLowerCase().includes(busca.toLowerCase())),
  );
  const setores = [...new Set(filtradas.map((l) => l.sector))];
  const local = LOCATIONS.find((l) => l.id === aberto);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Locais e Salas</h1>
            <p className="text-sm text-muted-foreground">
              Organizados por setor. Clique em uma sala para abrir o inspector com tudo que pode ser encontrado ali, inclusive documentos futuros e secretos do mestre.
            </p>
          </div>
          <Input
            className="ml-auto max-w-xs"
            placeholder="Buscar sala, setor, pista ou documento…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </header>

        {setores.map((setor) => (
          <section key={setor}>
            <h2 className="stamp text-primary">{setor}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtradas
                .filter((l) => l.sector === setor)
                .map((l) => {
                  const st = session.locationStatus[l.id] ?? "nao-visitada";
                  const achados = cluesForLocation(l.id);
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
                        <span className="rounded-sm bg-secondary px-2 py-0.5">Dia {l.dayAvailable.join(" e ")}</span>
                        <span className="rounded-sm bg-secondary px-2 py-0.5">{achados.length} achados</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          {local && (
            <>
              <DialogHeader><DialogTitle className="font-display text-3xl">{local.name}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Disponibilidade" value={local.availability} />
                  <Field label="Dias de acesso" value={`Dia ${local.dayAvailable.join(" e ")}`} />
                  <Field label="Horário recomendado" value={local.recommendedTime} />
                  <Field label="Pré-requisitos" value={local.prerequisites} />
                  <Field label="Locais conectados" value={local.connectedLocations.map((id) => LOCATIONS.find((x) => x.id === id)?.name ?? id).join(", ")} />
                </div>

                <RoomInspector locationId={local.id} />

                <div className="flex border-t border-border pt-3">
                  <Button size="sm" className="ml-auto" onClick={() => { setLocation(local.id); setAberto(null); }}>
                    Levar o grupo para cá
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="stamp text-muted-foreground">{label}</p><p>{value}</p></div>;
}