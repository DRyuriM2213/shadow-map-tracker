import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { TestDialog, type TestResult } from "@/components/TestDialog";
import { Button } from "@/components/ui/button";
import { CLUES, LOCATIONS, SCENES, TESTS } from "@/data/campaignFull";
import { getActionNarration, introNarration, type LiveNarration } from "@/data/sessionEnhancements";
import { masterGuidance } from "@/data/masterGuidance";
import { npcsForLocation } from "@/data/npcs";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, importanceLabel, routeBorder, routeDot, routeText } from "@/lib/ui";
import type { Clue } from "@/lib/types";
import { ArrowLeft, Copy, MapPin, Pin, PinOff, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/sessao-v2")({ component: SessaoV2 });

function SessaoV2() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const scene = SCENES.find((s) => s.id === session.currentSceneId) ?? SCENES[0]!;
  const location = LOCATIONS.find((l) => l.id === session.currentLocationId);
  const [testId, setTestId] = useState<string | null>(null);
  const [clue, setClue] = useState<Clue | null>(null);
  const [narration, setNarration] = useState<LiveNarration>(() => introNarration(scene));
  const [history, setHistory] = useState<LiveNarration[]>([]);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setNarration(introNarration(scene));
    setHistory([]);
    setPinned(false);
  }, [scene.id]);

  const localClues = useMemo(() => {
    const ids = new Set([...(scene.clueIds ?? []), ...(location?.clueIds ?? [])]);
    return CLUES.filter((c) => ids.has(c.id) || c.mainLocationId === session.currentLocationId);
  }, [scene.clueIds, location?.clueIds, session.currentLocationId]);

  const localNpcs = useMemo(() => npcsForLocation(session.currentLocationId), [session.currentLocationId]);

  const showNarration = (next: LiveNarration) => {
    if (pinned) return;
    setHistory((h) => [...h.slice(-7), narration]);
    setNarration(next);
  };

  const doAction = (action: string) => {
    showNarration(getActionNarration(scene, action));
    store.logAction("acao", `Ação: ${action}`, scene.title, scene.route);
  };

  const onTestResult = (result: TestResult, text: string, name: string) => {
    showNarration({ kind: "RESULTADO", label: `${name} — ${result}`, text });
  };

  const restoreIntro = () => {
    setHistory((h) => [...h.slice(-7), narration]);
    setNarration(introNarration(scene));
  };

  return (
    <Shell>
      <div className="grid gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="dossier rounded-sm p-4 2xl:sticky 2xl:top-44 2xl:max-h-[calc(100vh-190px)] 2xl:overflow-y-auto">
          <p className="stamp text-primary">Caminho percorrido</p>
          <div className="mt-3 space-y-2">
            {[...session.log].reverse().slice(0, 30).map((entry) => (
              <div key={entry.id} className="border-l-2 border-border pl-2 text-xs">
                <span className="font-mono text-muted-foreground">D{entry.day} {entry.time}</span>
                <p>{entry.description}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <section className={`dossier rounded-sm border-l-4 p-5 ${routeBorder[scene.route]}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`stamp ${routeText[scene.route]}`}>{scene.sceneType}</span>
              <span className="stamp text-muted-foreground">DIA {scene.day} · {session.time}</span>
              <span className="stamp text-muted-foreground"><MapPin className="mr-1 inline size-3" />{location?.name ?? "—"}</span>
              {pinned && <span className="stamp rounded-sm border border-primary/60 px-2 py-0.5 text-primary">narração fixada</span>}
            </div>
            <h1 className="mt-2 text-3xl font-semibold">{scene.title}</h1>

            <div className="mt-3 rounded-sm border border-border/70 bg-secondary/30 p-3">
              <p className="stamp text-muted-foreground">Orientação para o mestre</p>
              <p className="mt-1 text-sm leading-relaxed">{masterGuidance(scene)}</p>
            </div>

            <div className="paper-sheet mt-4 rounded-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="stamp opacity-70">{narration.kind}</p>
                  <p className="text-xs opacity-60">{narration.label}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-paper-foreground/40 text-paper-foreground"
                      onClick={() => {
                        const previous = history.at(-1);
                        if (!previous) return;
                        setHistory((h) => h.slice(0, -1));
                        setNarration(previous);
                      }}
                    >
                      <ArrowLeft className="mr-1 size-3.5" /> Voltar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={restoreIntro}>
                    <RotateCcw className="mr-1 size-3.5" /> Introdução
                  </Button>
                  <Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => setPinned((v) => !v)}>
                    {pinned ? <PinOff className="mr-1 size-3.5" /> : <Pin className="mr-1 size-3.5" />}
                    {pinned ? "Desfixar" : "Fixar"}
                  </Button>
                  <Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => navigator.clipboard.writeText(narration.text)}>
                    <Copy className="mr-1 size-3.5" /> Copiar
                  </Button>
                </div>
              </div>
              <p className="mt-4 font-display text-xl leading-relaxed">{narration.text}</p>
              {narration.suggestedTestId && (
                <Button className="mt-4" size="sm" onClick={() => setTestId(narration.suggestedTestId!)}>
                  Abrir teste sugerido: {TESTS.find((t) => t.id === narration.suggestedTestId)?.name ?? "teste"}
                </Button>
              )}
            </div>

            {scene.actions.length > 0 && (
              <div className="mt-5">
                <p className="stamp text-muted-foreground">Ações possíveis — clique para trocar a narração</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scene.actions.map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant={narration.kind === "AÇÃO" && narration.label === action ? "default" : "outline"}
                      onClick={() => doAction(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
                {pinned && <p className="mt-2 text-xs text-primary">A ação será registrada no histórico, mas a narração ficará fixa até você desfixar.</p>}
              </div>
            )}

            {scene.testIds.length > 0 && (
              <div className="mt-4">
                <p className="stamp text-muted-foreground">Testes possíveis</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scene.testIds.map((id) => (
                    <Button key={id} size="sm" variant="secondary" onClick={() => setTestId(id)}>
                      {TESTS.find((t) => t.id === id)?.name ?? id}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="dossier rounded-sm p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="stamp text-muted-foreground">Pistas neste contexto</p>
              <Link to="/pistas-v2" className="text-xs underline">catálogo completo</Link>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {localClues.map((c) => {
                const status = session.clueStatus[c.id] ?? "escondida";
                return (
                  <button key={c.id} onClick={() => setClue(c)} className="rounded-sm border border-border p-3 text-left hover:border-primary">
                    <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${routeDot[c.route]}`} /><b>{c.name}</b></span>
                    <span className="mt-1 block text-xs text-muted-foreground">{importanceLabel[c.importance]} · {clueStatusLabel[status]}{c.sourceDocument ? ` · ${c.sourceDocument}` : ""}</span>
                  </button>
                );
              })}
              {localClues.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pista cadastrada neste contexto.</p>}
            </div>
          </section>

          {scene.choices.length > 0 && (
            <section className="dossier rounded-sm p-5">
              <p className="stamp text-muted-foreground">Próximos caminhos / decisões</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {scene.choices.map((choice) => (
                  <button key={choice.id} className={`rounded-sm border-l-4 border border-border p-3 text-left ${routeBorder[choice.routeColor]}`} onClick={() => store.choose(scene.id, choice.id)}>
                    <b>{choice.title}</b>
                    <p className="mt-1 text-xs text-muted-foreground">{choice.description}</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-4">
          <section className="dossier rounded-sm p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="stamp text-primary">NPCs no local</p>
              <Link to="/npcs" className="text-xs underline">ver todos</Link>
            </div>
            <div className="mt-3 space-y-2">
              {localNpcs.map((npc) => (
                <Link key={npc.id} to="/npcs" className="block rounded-sm border border-border p-3 hover:border-primary">
                  <b>{npc.name}</b>
                  <p className="text-xs text-muted-foreground">{npc.role}</p>
                  <p className="mt-1 text-xs">{npc.initialAttitude}</p>
                </Link>
              ))}
              {localNpcs.length === 0 && <p className="text-xs text-muted-foreground">Nenhum NPC principal cadastrado como provável neste local.</p>}
            </div>
          </section>

          <section className="dossier rounded-sm p-4">
            <p className="stamp text-primary">Controle rápido</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => store.advanceTime(15)}>+15 min</Button>
              <Button size="sm" variant="secondary" onClick={() => store.advanceTime(60)}>+1 hora</Button>
              <Link to="/mapa" className="rounded-sm border border-border px-3 py-2 text-center text-xs hover:border-primary">Mapa</Link>
              <Link to="/pistas-v2" className="rounded-sm border border-border px-3 py-2 text-center text-xs hover:border-primary">Todas as pistas</Link>
            </div>
          </section>
        </aside>
      </div>

      <TestDialog testId={testId} onClose={() => setTestId(null)} onResult={onTestResult} />

      {clue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setClue(null)}>
          <div className="dossier max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-sm p-5" onClick={(e) => e.stopPropagation()}>
            <p className="stamp text-primary">Pista / documento</p>
            <h2 className="font-display text-2xl">{clue.name}</h2>
            {clue.sourceDocument && <p className="mt-1 font-mono text-xs text-muted-foreground">PROP: {clue.sourceDocument}</p>}
            <div className="paper-sheet mt-4 rounded-sm p-3"><p>{clue.playerDescription}</p></div>
            <p className="mt-3 text-sm"><b>Onde:</b> {clue.microLocation || clue.exactLocation || LOCATIONS.find((l) => l.id === clue.mainLocationId)?.name}</p>
            <p className="mt-2 text-sm"><b>Teste sugerido:</b> {clue.suggestedSkill} • DT {session.dcOverrides[clue.id] ?? clue.dc}</p>
            <p className="mt-2 text-sm"><b>Para o mestre:</b> {clue.masterMeaning}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { store.setClue(clue.id, "encontrada", clue.name); setClue(null); }}>Entregar pista</Button>
              {clue.testId && <Button size="sm" variant="outline" onClick={() => setTestId(clue.testId!)}>Abrir teste</Button>}
              <Button size="sm" variant="ghost" onClick={() => setClue(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}