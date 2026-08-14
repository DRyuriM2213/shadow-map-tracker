import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { TestDialog, type TestResult } from "@/components/TestDialog";
import { Button } from "@/components/ui/button";
import { CLUES, LOCATIONS, SCENES, TESTS } from "@/data/campaignFull";
import { getActionNarration, introNarration, type LiveNarration } from "@/data/sessionEnhancements";
import { masterGuidance } from "@/data/masterGuidance";
import { npcsForLocation, type NpcDef } from "@/data/npcs";
import { useAsset } from "@/lib/useAsset";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, importanceLabel, routeBorder, routeDot, routeText } from "@/lib/ui";
import type { Clue } from "@/lib/types";
import { ArrowLeft, Copy, Eye, EyeOff, Image as ImageIcon, Lock, MapPin, Pin, PinOff, RotateCcw, Undo2, X } from "lucide-react";

export const Route = createFileRoute("/sessao-v2")({ component: SessaoV2 });

function SessaoV2() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const scene = SCENES.find((s) => s.id === session.currentSceneId) ?? SCENES[0]!;
  const location = LOCATIONS.find((l) => l.id === session.currentLocationId);
  const [testId, setTestId] = useState<string | null>(null);
  const [clue, setClue] = useState<Clue | null>(null);
  const [npc, setNpc] = useState<NpcDef | null>(null);
  const [npcTopicId, setNpcTopicId] = useState("");
  const [narration, setNarration] = useState<LiveNarration>(() => introNarration(scene));
  const [history, setHistory] = useState<LiveNarration[]>([]);
  const [pinned, setPinned] = useState(false);
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    setNarration(introNarration(scene));
    setHistory([]);
    setPinned(false);
    setFocus(false);
  }, [scene.id]);

  const localClues = useMemo(() => {
    const ids = new Set([...(scene.clueIds ?? []), ...(location?.clueIds ?? [])]);
    return CLUES.filter((c) => ids.has(c.id) || c.mainLocationId === session.currentLocationId);
  }, [scene.clueIds, location?.clueIds, session.currentLocationId]);
  const localNpcs = useMemo(() => npcsForLocation(session.currentLocationId), [session.currentLocationId]);

  const pauseIfNeeded = () => { if (session.autoPauseOnTest) store.setClockRunning(false); };
  const openTest = (id: string) => { pauseIfNeeded(); setTestId(id); };
  const openClue = (c: Clue) => { pauseIfNeeded(); setClue(c); };
  const openNpc = (n: NpcDef) => { pauseIfNeeded(); setNpc(n); setNpcTopicId(n.topics[0]?.id ?? ""); };

  const showNarration = (next: LiveNarration) => {
    if (pinned) return;
    setHistory((h) => [...h.slice(-9), narration]);
    setNarration(next);
  };
  const doAction = (action: string) => {
    showNarration(getActionNarration(scene, action));
    store.logAction("acao", `Ação: ${action}`, scene.title, scene.route);
  };
  const onTestResult = (result: TestResult, text: string, name: string) => showNarration({ kind: "RESULTADO", label: `${name} — ${result}`, text });
  const restoreIntro = () => {
    if (pinned) return;
    setHistory((h) => [...h.slice(-9), narration]);
    setNarration(introNarration(scene));
  };

  return (
    <Shell>
      <div className={focus ? "mx-auto max-w-5xl" : "grid gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_330px]"}>
        {!focus && (
          <aside className="order-3 dossier max-h-[360px] overflow-y-auto rounded-sm p-4 2xl:order-1 2xl:sticky 2xl:top-44 2xl:max-h-[calc(100vh-190px)]">
            <div className="flex items-center justify-between gap-2"><p className="stamp text-primary">Caminho percorrido</p><Button size="sm" variant="ghost" disabled={!store.past?.length} onClick={store.undo}><Undo2 className="mr-1 size-3.5" />Desfazer</Button></div>
            <div className="mt-3 space-y-2">
              {[...session.log].reverse().slice(0, 40).map((entry) => <div key={entry.id} className="border-l-2 border-border pl-2 text-xs"><span className="font-mono text-muted-foreground">D{entry.day} {entry.time}</span><p>{entry.description}</p>{entry.detail && <p className="text-muted-foreground">{entry.detail}</p>}</div>)}
            </div>
          </aside>
        )}

        <main className={`${focus ? "" : "order-1 2xl:order-2"} space-y-4`}>
          <section className={`dossier rounded-sm border-l-4 ${focus ? "p-4 sm:p-8" : "p-4 sm:p-5"} ${routeBorder[scene.route]}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`stamp ${routeText[scene.route]}`}>{scene.sceneType}</span>
              <span className="stamp text-muted-foreground">DIA {scene.day} · {session.time}</span>
              <span className="stamp text-muted-foreground"><MapPin className="mr-1 inline size-3" />{location?.name ?? "—"}</span>
              {pinned && <span className="stamp rounded-sm border border-primary/60 px-2 py-0.5 text-primary">narração fixada</span>}
              <Button size="sm" variant={focus ? "default" : "outline"} className="ml-auto" onClick={() => setFocus((v) => !v)}>{focus ? <EyeOff className="mr-1 size-3.5" /> : <Eye className="mr-1 size-3.5" />}{focus ? "Sair do foco" : "Foco de narração"}</Button>
            </div>
            <h1 className={`${focus ? "mt-3 text-4xl sm:text-5xl" : "mt-2 text-3xl"} font-semibold`}>{scene.title}</h1>

            {!focus && <div className="mt-3 rounded-sm border border-border/70 bg-secondary/30 p-3"><p className="stamp text-muted-foreground">Orientação para o mestre</p><p className="mt-1 text-sm leading-relaxed">{masterGuidance(scene)}</p></div>}

            <div className={`paper-sheet mt-4 rounded-sm ${focus ? "p-6 sm:p-10" : "p-4 sm:p-5"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="stamp opacity-70">{narration.kind}</p><p className="text-xs opacity-60">{narration.label}</p></div>
                <div className="flex flex-wrap gap-2">
                  {history.length > 0 && <Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => { const previous = history.at(-1); if (!previous) return; setHistory((h) => h.slice(0, -1)); setNarration(previous); }}><ArrowLeft className="mr-1 size-3.5" />Voltar</Button>}
                  <Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" disabled={pinned} onClick={restoreIntro}><RotateCcw className="mr-1 size-3.5" />Introdução</Button>
                  <Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => setPinned((v) => !v)}>{pinned ? <PinOff className="mr-1 size-3.5" /> : <Pin className="mr-1 size-3.5" />}{pinned ? "Desfixar" : "Fixar"}</Button>
                  <Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => navigator.clipboard.writeText(narration.text)}><Copy className="mr-1 size-3.5" />Copiar</Button>
                </div>
              </div>
              <p className={`mt-5 font-display leading-relaxed ${focus ? "text-2xl sm:text-3xl" : "text-xl"}`}>{narration.text}</p>
              {narration.suggestedTestId && <Button className="mt-5" size="sm" onClick={() => openTest(narration.suggestedTestId!)}>Abrir teste sugerido: {TESTS.find((t) => t.id === narration.suggestedTestId)?.name ?? "teste"}</Button>}
            </div>

            {!focus && scene.actions.length > 0 && <div className="mt-5"><p className="stamp text-muted-foreground">Ações possíveis — clique para trocar a narração</p><div className="mt-2 flex flex-wrap gap-2">{scene.actions.map((action) => <Button key={action} size="sm" variant={narration.kind === "AÇÃO" && narration.label === action ? "default" : "outline"} onClick={() => doAction(action)}>{action}</Button>)}</div>{pinned && <p className="mt-2 text-xs text-primary">A ação será registrada, mas o texto permanecerá fixo até desfixar.</p>}</div>}
            {!focus && scene.testIds.length > 0 && <div className="mt-4"><p className="stamp text-muted-foreground">Testes possíveis</p><div className="mt-2 flex flex-wrap gap-2">{scene.testIds.map((id) => <Button key={id} size="sm" variant="secondary" onClick={() => openTest(id)}>{TESTS.find((t) => t.id === id)?.name ?? id}</Button>)}</div></div>}
          </section>

          {!focus && <section className="dossier rounded-sm p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="stamp text-muted-foreground">Pistas neste contexto</p><Link to="/pistas-v2" className="text-xs underline">catálogo completo</Link></div><div className="mt-3 grid gap-2 md:grid-cols-2">{localClues.map((c) => { const status = session.clueStatus[c.id] ?? "escondida"; return <button key={c.id} onClick={() => openClue(c)} className="rounded-sm border border-border p-3 text-left hover:border-primary"><span className="flex items-center gap-2"><span className={`size-2 rounded-full ${routeDot[c.route]}`} /><b>{c.name}</b></span><span className="mt-1 block text-xs text-muted-foreground">{importanceLabel[c.importance]} · {clueStatusLabel[status]} · DT {session.dcOverrides[c.id] ?? c.dc}{c.sourceDocument ? ` · ${c.sourceDocument}` : ""}</span><span className="mt-1 block text-xs">{c.microLocation || c.exactLocation}</span></button>; })}{localClues.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pista cadastrada neste contexto.</p>}</div></section>}

          {!focus && scene.choices.length > 0 && <section className="dossier rounded-sm p-4 sm:p-5"><p className="stamp text-muted-foreground">Próximos caminhos / decisões</p><div className="mt-3 grid gap-3 md:grid-cols-2">{scene.choices.map((choice) => <button key={choice.id} className={`rounded-sm border-l-4 border border-border p-3 text-left ${routeBorder[choice.routeColor]}`} onClick={() => store.choose(scene.id, choice.id)}><b>{choice.title}</b><p className="mt-1 text-xs text-muted-foreground">{choice.description}</p></button>)}</div></section>}
        </main>

        {!focus && <aside className="order-2 space-y-4 2xl:order-3">
          <section className="dossier rounded-sm p-4"><div className="flex items-center justify-between gap-2"><p className="stamp text-primary">NPCs no local</p><Link to="/npcs" className="text-xs underline">ver todos</Link></div><div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">{localNpcs.map((n) => <button key={n.id} onClick={() => openNpc(n)} className="flex items-center gap-3 rounded-sm border border-border p-2.5 text-left hover:border-primary"><NpcMini npc={n} /><div className="min-w-0"><b>{n.name}</b><p className="text-xs text-muted-foreground">{n.role}</p><p className="mt-1 line-clamp-2 text-xs">{n.initialAttitude}</p></div></button>)}{localNpcs.length === 0 && <p className="text-xs text-muted-foreground">Nenhum dos 16 NPCs oficiais está cadastrado como provável neste local.</p>}</div></section>

          <section className="dossier rounded-sm p-4"><div className="flex items-center justify-between gap-2"><p className="stamp text-primary">Controle rápido</p><Button size="sm" variant="ghost" onClick={store.undo}><Undo2 className="mr-1 size-3.5" />Desfazer</Button></div><div className="mt-3 grid grid-cols-4 gap-1">{[5, 15, 30, 60].map((m) => <Button key={m} size="sm" variant="secondary" onClick={() => store.advanceTime(m)}>+{m === 60 ? "1h" : m}</Button>)}</div><div className="mt-2 grid grid-cols-3 gap-2"><Link to="/mapa" className="rounded-sm border border-border px-2 py-2 text-center text-xs hover:border-primary">Mapa</Link><Link to="/pistas-v2" className="rounded-sm border border-border px-2 py-2 text-center text-xs hover:border-primary">Pistas</Link><Link to="/assets" className="rounded-sm border border-border px-2 py-2 text-center text-xs hover:border-primary">Backup</Link></div></section>
        </aside>}
      </div>

      <TestDialog testId={testId} onClose={() => setTestId(null)} onResult={onTestResult} />
      {clue && <ClueModal clue={clue} onClose={() => setClue(null)} onTest={openTest} />}
      {npc && <NpcModal npc={npc} topicId={npcTopicId} setTopicId={setNpcTopicId} onClose={() => setNpc(null)} />}
    </Shell>
  );
}

function NpcMini({ npc }: { npc: NpcDef }) {
  const url = useAsset(`npc:${npc.id}`);
  const initials = npc.name.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  return <div className="size-12 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary/40">{url ? <img src={url} alt={npc.name} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center font-display text-xs text-muted-foreground">{initials}</div>}</div>;
}

function NpcModal({ npc, topicId, setTopicId, onClose }: { npc: NpcDef; topicId: string; setTopicId: (id: string) => void; onClose: () => void }) {
  const store = useCampaign();
  const url = useAsset(`npc:${npc.id}`);
  const topic = npc.topics.find((t) => t.id === topicId) ?? npc.topics[0];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3" onClick={onClose}><div className="dossier max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-sm p-4 sm:p-5" onClick={(e) => e.stopPropagation()}><div className="flex items-start gap-4"><div className="hidden aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary/30 sm:block">{url ? <img src={url} alt={npc.name} className="size-full object-contain" /> : <div className="flex size-full items-center justify-center"><ImageIcon className="size-7 text-muted-foreground" /></div>}</div><div className="min-w-0 flex-1"><p className="stamp text-primary">NPC no local</p><h2 className="font-display text-3xl">{npc.name}</h2><p className="text-sm text-muted-foreground">{npc.role} · {npc.status}</p><p className="mt-2 text-sm"><b>Como interpretar:</b> {npc.voice}</p><p className="mt-1 text-sm"><b>Atitude:</b> {npc.initialAttitude}</p></div><Button size="sm" variant="ghost" onClick={onClose}><X className="size-4" /></Button></div>{npc.topics.length ? <><div className="mt-4 flex flex-wrap gap-2">{npc.topics.map((t) => <Button key={t.id} size="sm" variant={topic?.id === t.id ? "default" : "outline"} onClick={() => setTopicId(t.id)}>{t.label}</Button>)}</div>{topic && <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="paper-sheet rounded-sm p-4"><p className="stamp opacity-70">Fala pronta</p><p className="mt-3 font-display text-xl leading-relaxed">“{topic.says}”</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => store.logAction("conversa", `Conversa com ${npc.name}: ${topic.label}`, undefined, "verde")}>Usar e registrar fala</Button><Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => navigator.clipboard.writeText(topic.says)}><Copy className="mr-1 size-3.5" />Copiar</Button></div></div><div className="rounded-sm border border-route-preto bg-black/40 p-4 text-sm"><p className="stamp text-route-cinza"><Lock className="mr-1 inline size-3.5" />Para o mestre</p><p className="mt-2">{topic.master}</p>{(topic.test || topic.dc) && <p className="mt-3"><b>Teste:</b> {topic.test ?? "Social"}{topic.dc ? ` • DT ${topic.dc}` : ""}</p>}{topic.unlocks?.length ? <p className="mt-3"><b>Pode liberar:</b> {topic.unlocks.join(" • ")}</p> : null}</div></div>}</> : <p className="mt-4 text-sm text-muted-foreground">Nenhuma fala fixa definida. Improviso livre do mestre sem inventar novo cânone.</p>}</div></div>;
}

function ClueModal({ clue, onClose, onTest }: { clue: Clue; onClose: () => void; onTest: (id: string) => void }) {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}><div className="dossier max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm p-4 sm:p-5" onClick={(e) => e.stopPropagation()}><div className="flex justify-between gap-3"><div><p className="stamp text-primary">Pista / documento</p><h2 className="font-display text-2xl">{clue.name}</h2>{clue.sourceDocument && <p className="mt-1 font-mono text-xs text-muted-foreground">PROP: {clue.sourceDocument}</p>}</div><Button size="sm" variant="ghost" onClick={onClose}><X className="size-4" /></Button></div><div className="paper-sheet mt-4 rounded-sm p-3"><p>{clue.playerDescription}</p></div><div className="mt-3 grid gap-2 text-sm md:grid-cols-2"><p><b>Onde:</b> {clue.microLocation || clue.exactLocation || LOCATIONS.find((l) => l.id === clue.mainLocationId)?.name}</p><p><b>Teste sugerido:</b> {clue.suggestedSkill} • DT {session.dcOverrides[clue.id] ?? clue.dc}</p><p><b>Gatilho:</b> {clue.discoveryTrigger || clue.actionRequired}</p><p><b>Dia:</b> {clue.recommendedDay ? `Dia ${clue.recommendedDay} (recomendação)` : "Livre / sem dia recomendado"}</p></div><div className="mt-3 rounded-sm border border-route-preto bg-black/40 p-3 text-sm"><p className="stamp text-route-cinza">Para o mestre</p><p className="mt-1">{clue.masterMeaning || "—"}</p></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => { store.setClue(clue.id, "encontrada", clue.name); onClose(); }}>Entregar pista</Button>{clue.testId && <Button size="sm" variant="outline" onClick={() => onTest(clue.testId!)}>Abrir teste</Button>}<Button size="sm" variant="ghost" onClick={onClose}>Fechar</Button></div></div></div>;
}