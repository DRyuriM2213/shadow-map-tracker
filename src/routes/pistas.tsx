import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLUES, LOCATIONS, PLAYERS, TESTS } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, importanceLabel, routeBorder } from "@/lib/ui";
import type { ClueStatus } from "@/lib/types";
import { TestDialog } from "@/components/TestDialog";

export const Route = createFileRoute("/pistas")({
  head: () => ({
    meta: [
      { title: "Quadro de Pistas — Berço Vazio" },
      { name: "description", content: "Todas as pistas dos Dias 1 e 2 com status, testes, consequências e contingências." },
      { property: "og:title", content: "Quadro de Pistas — Berço Vazio" },
      { property: "og:description", content: "Filtre pistas por local, dia, status, importância e rota." },
    ],
  }),
  component: PistasPage,
});

const STATUS_LIST: ClueStatus[] = [
  "escondida",
  "disponivel",
  "encontrada",
  "encontrada-parcialmente",
  "interpretada",
  "nao-interpretada",
  "perdida",
  "destruida",
  "removida",
  "contingencia",
];

function PistasPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [busca, setBusca] = useState("");
  const [fLocal, setFLocal] = useState("todos");
  const [fDia, setFDia] = useState("todos");
  const [fStatus, setFStatus] = useState("todos");
  const [fImp, setFImp] = useState("todos");
  const [fRota, setFRota] = useState("todos");
  const [fPersonagem, setFPersonagem] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);

  const lista = useMemo(
    () =>
      CLUES.filter((c) => {
        const st = session.clueStatus[c.id] ?? "escondida";
        const alvo = busca.trim().toLowerCase();
        if (
          alvo &&
          !`${c.name} ${c.category} ${c.playerDescription} ${c.masterMeaning} ${c.microLocation} ${c.exactLocation} ${c.suggestedSkill} ${c.sourceDocument} ${c.id}`
            .toLowerCase()
            .includes(alvo)
        )
          return false;
        if (
          fLocal !== "todos" &&
          c.mainLocationId !== fLocal &&
          !c.alternativeLocationIds.includes(fLocal)
        )
          return false;
        if (fDia !== "todos" && String(c.recommendedDay) !== fDia) return false;
        if (fStatus !== "todos" && st !== fStatus) return false;
        if (fImp !== "todos" && c.importance !== fImp) return false;
        if (fRota !== "todos" && c.route !== fRota) return false;
        if (fTipo === "secreta" && !c.isSecret) return false;
        if (fTipo === "futura" && !c.isFuture) return false;
        if (fTipo === "pendente" && ["encontrada", "interpretada", "contingencia"].includes(st)) return false;
        if (fPersonagem !== "todos") {
          const notas = session.notes.filter((n) => n.targetId === c.id);
          const nome = PLAYERS.find((p) => p.id === fPersonagem)?.characterName ?? "";
          if (!notas.some((n) => n.text.toLowerCase().includes(nome.toLowerCase()))) return false;
        }
        return true;
      }),
    [busca, fLocal, fDia, fStatus, fImp, fRota, fTipo, fPersonagem, session.clueStatus, session.notes],
  );


  const clue = CLUES.find((c) => c.id === aberto);
  const obrigatoriasPerdidas = CLUES.filter(
    (c) => c.importance === "obrigatoria" && ["perdida", "destruida", "removida"].includes(session.clueStatus[c.id] ?? ""),
  );

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-end gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Catálogo global de pistas</h1>
            <p className="text-sm text-muted-foreground">
              {CLUES.length} pistas visíveis a qualquer momento — o dia é apenas uma recomendação. Pistas obrigatórias
              nunca desaparecem: se forem perdidas, o sistema sugere contingências.
            </p>
          </div>
          <Input
            className="ml-auto max-w-sm"
            placeholder="Buscar por nome, local exato, perícia, documento…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </header>


        {obrigatoriasPerdidas.length > 0 && (
          <div className="rounded-sm border border-destructive bg-destructive/10 p-4">
            <p className="stamp text-destructive">Pista obrigatória perdida</p>
            {obrigatoriasPerdidas.map((c) => (
              <div key={c.id} className="mt-2 text-sm">
                <p className="font-semibold">{c.name}</p>
                <p className="stamp mt-1 text-muted-foreground">Contingências sugeridas</p>
                <ul className="mt-1 space-y-1">
                  {c.fallbackOptions.map((f) => (
                    <li key={f} className="flex items-center justify-between gap-3">
                      <span>• {f}</span>
                      <Button size="sm" variant="outline" onClick={() => store.setClue(c.id, "contingencia", f)}>
                        aplicar
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="dossier grid gap-3 rounded-sm p-4 md:grid-cols-3 xl:grid-cols-6">
          <Filtro label="Local" value={fLocal} onChange={setFLocal} options={[["todos", "Todos"], ...LOCATIONS.map((l) => [l.id, l.name] as [string, string])]} />
          <Filtro label="Dia" value={fDia} onChange={setFDia} options={[["todos", "Todos"], ["1", "Dia 1"], ["2", "Dia 2"]]} />
          <Filtro label="Status" value={fStatus} onChange={setFStatus} options={[["todos", "Todos"], ...STATUS_LIST.map((s) => [s, clueStatusLabel[s]] as [string, string])]} />
          <Filtro label="Importância" value={fImp} onChange={setFImp} options={[["todos", "Todas"], ["ambiental", "Ambiental"], ["secundaria", "Secundária"], ["importante", "Importante"], ["obrigatoria", "Obrigatória"]]} />
          <Filtro label="Rota" value={fRota} onChange={setFRota} options={[["todos", "Todas"], ["amarelo", "Amarelo"], ["azul", "Azul"], ["verde", "Verde"], ["roxo", "Roxo"], ["vermelho", "Vermelho"], ["cinza", "Cinza"], ["verde-claro", "Verde-claro"], ["preto", "Preto"]]} />
          <Filtro label="Personagem (notas)" value={fPersonagem} onChange={setFPersonagem} options={[["todos", "Todos"], ...PLAYERS.map((p) => [p.id, p.characterName] as [string, string])]} />
          <Filtro label="Tipo" value={fTipo} onChange={setFTipo} options={[["todos", "Todas"], ["pendente", "Ainda não entregues"], ["secreta", "Secretas"], ["futura", "Futuras"]]} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((c) => {
            const st = session.clueStatus[c.id] ?? "escondida";
            return (
              <button
                key={c.id}
                onClick={() => setAberto(c.id)}
                className={`dossier rounded-sm border-l-4 p-4 text-left hover:border-primary ${routeBorder[c.route]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.name}</p>
                  <span className="stamp shrink-0 text-muted-foreground">{c.id}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.playerDescription}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-sm bg-secondary px-2 py-0.5">{clueStatusLabel[st]}</span>
                  <span className="rounded-sm bg-secondary px-2 py-0.5">{importanceLabel[c.importance]}</span>
                  <span className="rounded-sm bg-secondary px-2 py-0.5">Dia {c.dayAvailable}</span>
                  <span className="rounded-sm bg-secondary px-2 py-0.5">
                    {LOCATIONS.find((l) => l.id === c.mainLocationId)?.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pista com esses filtros.</p>}
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          {clue && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl">{clue.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="paper-sheet rounded-sm p-3">{clue.playerDescription}</p>
                <p className="rounded-sm border border-route-preto bg-black/40 p-3">
                  <span className="stamp text-route-cinza">Significado para o mestre: </span>
                  {clue.masterMeaning || "—"}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <F label="ID" v={clue.id} />
                  <F label="Categoria" v={clue.category} />
                  <F label="Local principal" v={LOCATIONS.find((l) => l.id === clue.mainLocationId)?.name ?? "—"} />
                  <F
                    label="Locais alternativos"
                    v={clue.alternativeLocationIds.map((id) => LOCATIONS.find((l) => l.id === id)?.name ?? id).join(", ") || "—"}
                  />
                  <F label="Dia disponível" v={`Dia ${clue.dayAvailable}`} />
                  <F label="Pré-requisitos" v={clue.prerequisites} />
                  <F label="Ação necessária" v={clue.actionRequired} />
                  <F label="Teste sugerido" v={TESTS.find((t) => t.id === clue.testId)?.name ?? "Nenhum"} />
                  <F label="Resultado de sucesso" v={clue.successResult} />
                  <F label="Resultado de falha" v={clue.failureResult} />
                  <F label="Importância" v={importanceLabel[clue.importance]!} />
                  <F label="Desbloqueia" v={clue.unlocks || "—"} />
                  <F
                    label="Pistas relacionadas"
                    v={clue.relatedClueIds.map((id) => CLUES.find((c) => c.id === id)?.name ?? id).join(", ") || "—"}
                  />
                  <F label="Status atual" v={clueStatusLabel[session.clueStatus[clue.id] ?? "escondida"]!} />
                </div>
                <div>
                  <p className="stamp text-muted-foreground">Contingências</p>
                  <ul className="mt-1 space-y-1">
                    {clue.fallbackOptions.map((f) => (
                      <li key={f} className="flex items-center justify-between gap-2">
                        <span>• {f}</span>
                        <Button size="sm" variant="ghost" onClick={() => store.setClue(clue.id, "contingencia", f)}>
                          usar
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                {clue.testId && (
                  <Button variant="outline" size="sm" onClick={() => setTestId(clue.testId!)}>
                    Abrir teste
                  </Button>
                )}
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {STATUS_LIST.map((st) => (
                    <Button key={st} size="sm" variant="outline" onClick={() => store.setClue(clue.id, st, clue.name)}>
                      {clueStatusLabel[st]}
                    </Button>
                  ))}
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

function Filtro({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block text-xs">
      <span className="stamp text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-input bg-background px-2 py-1.5 text-xs"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function F({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <p className="stamp text-muted-foreground">{label}</p>
      <p>{v}</p>
    </div>
  );
}
