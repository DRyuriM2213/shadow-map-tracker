import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { TestDialog } from "@/components/TestDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CLUES, CONSEQUENCES, LOCATIONS, SCENES, TESTS } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, importanceLabel, routeBorder, routeDot, routeText } from "@/lib/ui";
import type { Clue } from "@/lib/types";
import { Copy, Lock, Undo2 } from "lucide-react";

export const Route = createFileRoute("/sessao")({
  head: () => ({
    meta: [
      { title: "Modo Sessão ao Vivo — Berço Vazio" },
      { name: "description", content: "Condução em tempo real da sessão: cena atual, ações, pistas, testes e consequências." },
      { property: "og:title", content: "Modo Sessão ao Vivo — Berço Vazio" },
      { property: "og:description", content: "Painel de três colunas para conduzir a sessão de RPG." },
    ],
  }),
  component: SessaoPage,
});

const CONTINGENCIAS = [
  "Uma testemunha procura o grupo.",
  "Uma foto revela o detalhe que faltava.",
  "Um funcionário comenta algo sem perceber.",
  "O documento aparece em um local alternativo.",
  "Um registro fica aberto em um computador.",
  "Uma porta é deixada aberta.",
  "Uma notícia antiga chama atenção.",
  "Uma pista secundária aponta para a pista principal.",
];

function SessaoPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const scene = SCENES.find((s) => s.id === session.currentSceneId) ?? SCENES[0]!;
  const local = LOCATIONS.find((l) => l.id === session.currentLocationId);

  const [testId, setTestId] = useState<string | null>(null);
  const [clue, setClue] = useState<Clue | null>(null);
  const [nota, setNota] = useState("");
  const [contingencia, setContingencia] = useState(false);
  const [rotaAlvo, setRotaAlvo] = useState<string | null>(null);
  const [logAberto, setLogAberto] = useState<string | null>(null);
  const [moverAberto, setMoverAberto] = useState(false);

  const pistasObrigatoriasPendentes = useMemo(
    () =>
      CLUES.filter(
        (c) =>
          c.importance === "obrigatoria" &&
          c.dayAvailable <= session.day &&
          !["encontrada", "interpretada", "contingencia"].includes(session.clueStatus[c.id] ?? ""),
      ),
    [session.clueStatus, session.day],
  );

  const pendentes = session.scheduled.filter((s) => s.status === "pendente");

  return (
    <Shell>
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_330px]">
        {/* COLUNA ESQUERDA */}
        <aside className="dossier max-h-[calc(100vh-190px)] overflow-y-auto rounded-sm p-4">
          <h2 className="stamp text-primary">Caminho percorrido</h2>
          <ol className="mt-3 space-y-2">
            {[...session.log].reverse().map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => setLogAberto(l.id)}
                  className={`w-full border-l-2 pl-3 text-left text-xs hover:bg-secondary/60 ${
                    l.route ? routeBorder[l.route] : "border-l-border"
                  }`}
                >
                  <span className="font-mono text-muted-foreground">
                    D{l.day} {l.time}
                  </span>{" "}
                  — {l.description}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* COLUNA CENTRAL */}
        <section className="space-y-4">
          <div className={`dossier rounded-sm border-l-4 p-5 ${routeBorder[scene.route]}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`stamp ${routeText[scene.route]}`}>{scene.sceneType}</span>
              {scene.mandatory && (
                <span className="stamp rounded-sm border border-destructive px-2 py-0.5 text-destructive">
                  Obrigatória
                </span>
              )}
              <span className="stamp text-muted-foreground">
                DIA {scene.day} · {scene.time} · {local?.name ?? "—"}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold">{scene.title}</h1>

            <div className="mt-4">
              <p className="stamp text-muted-foreground">Descrição para o mestre</p>
              <p className="mt-1 text-sm leading-relaxed">{scene.masterDescription}</p>
            </div>

            <div className="paper-sheet mt-4 rounded-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="stamp opacity-70">Narrar aos jogadores</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-paper-foreground/40 text-paper-foreground hover:bg-paper-foreground/10"
                  onClick={() => navigator.clipboard.writeText(scene.narrationText)}
                >
                  <Copy className="mr-1 size-3.5" /> Copiar
                </Button>
              </div>
              <p className="mt-2 font-display text-lg leading-relaxed">{scene.narrationText}</p>
            </div>

            {scene.mandatoryEvents.length > 0 && (
              <Block title="Acontecimentos obrigatórios" items={scene.mandatoryEvents} tone="text-destructive" />
            )}
            {scene.actions.length > 0 && (
              <div className="mt-4">
                <p className="stamp text-muted-foreground">Ações possíveis</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scene.actions.map((a) => (
                    <button
                      key={a}
                      onClick={() => store.logAction("acao", `Ação: ${a}`, scene.title, scene.route)}
                      className="rounded-sm border border-border bg-secondary/50 px-3 py-1.5 text-xs hover:border-primary"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {scene.testIds.length > 0 && (
              <div className="mt-4">
                <p className="stamp text-muted-foreground">Testes possíveis</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scene.testIds.map((t) => (
                    <Button key={t} size="sm" variant="outline" onClick={() => setTestId(t)}>
                      {TESTS.find((x) => x.id === t)?.name ?? t}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {scene.clueIds.length > 0 && (
              <div className="mt-4">
                <p className="stamp text-muted-foreground">Nesta cena eles podem encontrar</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {scene.clueIds.map((cid) => {
                    const c = CLUES.find((x) => x.id === cid);
                    if (!c) return null;
                    const st = session.clueStatus[cid] ?? "escondida";
                    return (
                      <button
                        key={cid}
                        onClick={() => setClue(c)}
                        className={`rounded-sm border border-border p-2 text-left text-xs hover:border-primary ${
                          ["encontrada", "interpretada", "contingencia"].includes(st) ? "opacity-60" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${routeDot[c.route]}`} />
                          <span className="font-semibold">{c.name}</span>
                        </span>
                        <span className="mt-1 block text-muted-foreground">
                          {importanceLabel[c.importance]} · {clueStatusLabel[st]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {scene.risks.length > 0 && <Block title="Riscos" items={scene.risks} tone="text-route-vermelho" />}
            {scene.masterSecrets.length > 0 && (
              <div className="mt-4 rounded-sm border border-route-preto bg-black/40 p-3">
                <p className="stamp flex items-center gap-2 text-route-cinza">
                  <Lock className="size-3.5" /> Segredos do mestre
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {scene.masterSecrets.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {scene.consequenceIds.length > 0 && (
              <Block
                title="Consequências possíveis"
                items={scene.consequenceIds.map(
                  (q) => `${CONSEQUENCES.find((c) => c.id === q)?.name} — ${CONSEQUENCES.find((c) => c.id === q)?.effect}`,
                )}
                tone="text-route-amarelo"
              />
            )}
            {scene.fallback && (
              <p className="mt-4 rounded-sm border border-route-cinza/50 p-3 text-sm">
                <span className="stamp text-route-cinza">Falha segura: </span>
                {scene.fallback}
              </p>
            )}
          </div>

          {scene.choices.length > 0 && (
            <div className="dossier rounded-sm p-5">
              <h2 className="font-display text-2xl">O que eles fazem?</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {scene.choices.map((c) => {
                  const st = session.routeStatus[c.id] ?? "disponivel";
                  return (
                    <div
                      key={c.id}
                      className={`rounded-sm border-l-4 border border-border p-3 ${routeBorder[c.routeColor]} ${
                        st === "ignorada" || st === "indisponivel" ? "opacity-40" : ""
                      }`}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => store.choose(scene.id, c.id)}
                        disabled={st === "indisponivel"}
                      >
                        <p className="font-semibold uppercase">{c.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                        {c.effects && <p className="mt-1 text-xs text-route-vermelho">{c.effects}</p>}
                      </button>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Status: {st}</span>
                        <button className="underline" onClick={() => setRotaAlvo(c.id)}>
                          Alterar rota
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {scene.nextSceneIds.length > 0 && (
            <div className="dossier rounded-sm p-4">
              <p className="stamp text-muted-foreground">Próximos caminhos possíveis</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {scene.nextSceneIds.map((id) => (
                  <Button key={id} size="sm" variant="ghost" onClick={() => store.goToScene(id, "Avanço manual")}>
                    → {SCENES.find((s) => s.id === id)?.title ?? id}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* COLUNA DIREITA */}
        <aside className="space-y-4">
          <div className="dossier rounded-sm p-4">
            <h2 className="stamp text-primary">Controle rápido</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => setClue(CLUES.find((c) => scene.clueIds.includes(c.id)) ?? CLUES[0]!)}>
                Pista encontrada
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setClue(CLUES.find((c) => scene.clueIds.includes(c.id)) ?? CLUES[0]!)}
              >
                Pista perdida
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestId(scene.testIds[0] ?? TESTS[0]!.id)}
              >
                Teste: sucesso
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestId(scene.testIds[0] ?? TESTS[0]!.id)}
              >
                Teste: falha
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setMoverAberto(true)}>
                Grupo mudou de local
              </Button>
              <Button size="sm" variant="secondary" onClick={() => store.advanceTime(15)}>
                Avançar 15 min
              </Button>
              <Button size="sm" variant="secondary" onClick={() => store.advanceTime(60)}>
                Avançar 1 hora
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const q = CONSEQUENCES.find((c) => c.day === session.day);
                  if (q) store.scheduleConsequence(q.id);
                }}
              >
                Ativar evento
              </Button>
              <Button size="sm" variant="outline" className="col-span-2" onClick={() => store.undo()}>
                <Undo2 className="mr-1 size-3.5" /> Desfazer última ação
              </Button>
            </div>
            <div className="mt-3">
              <p className="stamp text-muted-foreground">Anotação rápida</p>
              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ex.: Percy fotografou o cabo antes do isolamento."
                className="mt-1 h-20 text-xs"
              />
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  if (!nota.trim()) return;
                  store.addNote("cena", scene.id, nota.trim());
                  setNota("");
                }}
              >
                Adicionar nota
              </Button>
            </div>
          </div>

          <div className="dossier rounded-sm p-4">
            <p className="stamp text-muted-foreground">Consequências pendentes</p>
            {pendentes.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">Nenhuma.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-xs">
                {pendentes.map((p) => {
                  const q = CONSEQUENCES.find((c) => c.id === p.consequenceId);
                  return (
                    <li key={p.id} className="border-l-2 border-l-route-vermelho pl-2">
                      <p className="font-semibold">{q?.name}</p>
                      <p className="text-muted-foreground">{q?.triggerTime}</p>
                      <div className="mt-1 flex gap-2">
                        <button className="underline" onClick={() => store.resolveConsequence(p.id, "ativada")}>
                          ativar
                        </button>
                        <button className="underline" onClick={() => store.resolveConsequence(p.id, "adiada")}>
                          adiar
                        </button>
                        <button className="underline" onClick={() => store.resolveConsequence(p.id, "cancelada")}>
                          cancelar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="dossier rounded-sm p-4">
            <p className="stamp text-muted-foreground">Pistas obrigatórias ainda não entregues</p>
            {pistasObrigatoriasPendentes.length === 0 ? (
              <p className="mt-1 text-xs text-route-verde-claro">Todas entregues até aqui.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs">
                {pistasObrigatoriasPendentes.map((c) => (
                  <li key={c.id}>
                    <button className="underline" onClick={() => setClue(c)}>
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="destructive" className="mt-3 w-full" onClick={() => setContingencia(true)}>
              ELES IGNORARAM TUDO
            </Button>
          </div>
        </aside>
      </div>

      <TestDialog testId={testId} onClose={() => setTestId(null)} />

      {/* DETALHE DE PISTA */}
      <Dialog open={!!clue} onOpenChange={(o) => !o && setClue(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {clue && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{clue.name}</DialogTitle>
                <DialogDescription>
                  {importanceLabel[clue.importance]} · {clue.category} · Dia {clue.dayAvailable}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="paper-sheet rounded-sm p-3">{clue.playerDescription}</p>
                {clue.masterMeaning && (
                  <p className="rounded-sm border border-route-preto bg-black/40 p-3">
                    <span className="stamp text-route-cinza">Significado para o mestre: </span>
                    {clue.masterMeaning}
                  </p>
                )}
                <p>
                  <span className="stamp text-muted-foreground">Ação necessária: </span>
                  {clue.actionRequired}
                </p>
                <p>
                  <span className="stamp text-muted-foreground">Sucesso: </span>
                  {clue.successResult}
                </p>
                <p>
                  <span className="stamp text-muted-foreground">Falha: </span>
                  {clue.failureResult}
                </p>
                {clue.unlocks && (
                  <p>
                    <span className="stamp text-muted-foreground">Desbloqueia: </span>
                    {clue.unlocks}
                  </p>
                )}
                <div>
                  <p className="stamp text-muted-foreground">Contingências</p>
                  <ul className="mt-1 space-y-1">
                    {clue.fallbackOptions.map((f) => (
                      <li key={f} className="flex items-center justify-between gap-2">
                        <span>• {f}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            store.setClue(clue.id, "contingencia", f);
                            setClue(null);
                          }}
                        >
                          usar
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                {clue.testId && (
                  <Button variant="outline" size="sm" onClick={() => setTestId(clue.testId!)}>
                    Abrir teste sugerido
                  </Button>
                )}
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {(
                    ["encontrada", "encontrada-parcialmente", "interpretada", "perdida", "destruida", "removida", "disponivel"] as const
                  ).map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={st === "encontrada" ? "default" : "outline"}
                      onClick={() => {
                        store.setClue(clue.id, st, clue.name);
                        setClue(null);
                      }}
                    >
                      {clueStatusLabel[st]}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CONTINGÊNCIA */}
      <Dialog open={contingencia} onOpenChange={setContingencia}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eles ignoraram tudo</DialogTitle>
            <DialogDescription>Escolha uma falha segura para reconectar a investigação.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {CONTINGENCIAS.map((c) => (
              <li key={c}>
                <button
                  className="w-full rounded-sm border border-border p-2 text-left hover:border-primary"
                  onClick={() => {
                    store.logAction("contingencia", "Contingência aplicada", c, "cinza");
                    setContingencia(false);
                  }}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* ROTA */}
      <Dialog open={!!rotaAlvo} onOpenChange={(o) => !o && setRotaAlvo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deseja marcar esta rota como ignorada?</DialogTitle>
            <DialogDescription>Nenhuma rota é fechada permanentemente sem confirmação.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {(["disponivel", "ignorada", "indisponivel", "adiada"] as const).map((st) => (
              <Button
                key={st}
                variant="outline"
                onClick={() => {
                  if (rotaAlvo) store.setRouteStatus(rotaAlvo, st);
                  setRotaAlvo(null);
                }}
              >
                {st === "disponivel"
                  ? "Manter disponível"
                  : st === "ignorada"
                    ? "Marcar como ignorada"
                    : st === "indisponivel"
                      ? "Tornar indisponível"
                      : "Agendar para depois"}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MOVER GRUPO */}
      <Dialog open={moverAberto} onOpenChange={setMoverAberto}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grupo foi para outro local</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {LOCATIONS.map((l) => (
              <Button
                key={l.id}
                variant="outline"
                onClick={() => {
                  store.setLocation(l.id);
                  setMoverAberto(false);
                }}
              >
                {l.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* DETALHE DO LOG */}
      <Dialog open={!!logAberto} onOpenChange={(o) => !o && setLogAberto(null)}>
        <DialogContent>
          {(() => {
            const l = session.log.find((x) => x.id === logAberto);
            if (!l) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{l.description}</DialogTitle>
                  <DialogDescription>
                    DIA {l.day} · {l.time} · {l.actionType}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm">{l.detail ?? "Sem detalhes adicionais."}</p>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Block({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className="mt-4">
      <p className={`stamp ${tone}`}>{title}</p>
      <ul className="mt-1 space-y-1 text-sm">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}
