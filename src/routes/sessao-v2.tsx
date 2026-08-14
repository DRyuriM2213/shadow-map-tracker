import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Shell } from "@/components/Shell";
import { TestDialog, type TestResult } from "@/components/TestDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLUES, LOCATIONS } from "@/data/campaignFull";
import { NPCS, npcsForLocation } from "@/data/npcs";
import {
  GENERIC_TEST_RESULTS,
  GUIDE_BY_DAY,
  IMPROV_SITUATIONS,
  IMPROV_TONES,
  SESSION_ONE_RECAP,
  V3_EVENTS,
  buildImprovNarration,
  suggestedTestForSituation,
  type ImprovSituation,
  type ImprovTone,
} from "@/data/sessionV3";
import type { CampaignDay, Clue } from "@/lib/types";
import { useCampaign } from "@/store/campaign";
import { ArrowLeft, BookOpen, Check, ClipboardCopy, Clock3, Compass, History, MapPin, Pause, Pin, PinOff, Play, Search, Sparkles, Undo2, X } from "lucide-react";

export const Route = createFileRoute("/sessao-v2")({ component: SessionCockpit });

type Narration = { kind: "ABERTURA" | "LOCAL" | "AÇÃO" | "IMPROVISO" | "RESULTADO" | "EVENTO"; label: string; text: string };
const DAY_LABEL: Record<CampaignDay, string> = { 1: "SEG · 17/08", 2: "TER · 18/08", 3: "QUA · 19/08", 4: "QUI · 20/08", 5: "SEX · 21/08" };
const FOUND = new Set(["encontrada", "interpretada", "encontrada-parcialmente"]);

function SessionCockpit() {
  const store = useCampaign();
  const session = store.session;
  const location = LOCATIONS.find((l) => l.id === session.currentLocationId) ?? LOCATIONS[0];
  const guide = GUIDE_BY_DAY[session.day];
  const [narration, setNarration] = useState<Narration>(() => ({ kind: "ABERTURA", label: "Ponto atual da campanha", text: "A sessão anterior terminou por volta das 21h de terça-feira. Sofia, Adolfo, Jade e Vitor Hugo estavam entrando na Universidade Valença para investigar o campus à noite. O primeiro alvo ainda é escolha deles." }));
  const [history, setHistory] = useState<Narration[]>([]);
  const [pinned, setPinned] = useState(false);
  const [testId, setTestId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState<ImprovSituation>("CHEGADA");
  const [tone, setTone] = useState<ImprovTone>("INVESTIGAÇÃO");
  const [improvNpc, setImprovNpc] = useState("");
  const [playerAction, setPlayerAction] = useState("");
  const [draft, setDraft] = useState("");
  const [fact, setFact] = useState("");
  const [drawer, setDrawer] = useState<"guide" | "locations" | "recap" | null>(null);
  const [genericResult, setGenericResult] = useState<keyof typeof GENERIC_TEST_RESULTS | "">("");

  const useNarration = (next: Narration, log = true) => {
    if (pinned) return;
    setHistory((h) => [...h.slice(-14), narration]);
    setNarration(next);
    if (log) store.logAction("narracao", `${next.kind}: ${next.label}`, next.text.slice(0, 300));
  };

  const goLocation = (id: string) => {
    const next = LOCATIONS.find((l) => l.id === id);
    if (!next) return;
    store.setLocation(id);
    useNarration({ kind: "LOCAL", label: next.name, text: buildImprovNarration(next, "CHEGADA", tone) });
    setDrawer(null);
  };

  const localClues = useMemo(() => CLUES.filter((c) => c.mainLocationId === location?.id || c.alternativeLocationIds.includes(location?.id ?? "")), [location?.id]);
  const pendingClues = useMemo(() => CLUES.filter((c) => !FOUND.has(session.clueStatus[c.id] ?? "escondida") && (c.importance === "obrigatoria" || c.importance === "importante")).slice(0, 12), [session.clueStatus]);
  const localNpcs = useMemo(() => npcsForLocation(location?.id), [location?.id]);
  const relevantEvents = V3_EVENTS.filter((e) => e.day === session.day && !session.activatedEvents.includes(e.id));
  const filteredLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? LOCATIONS.filter((l) => `${l.name} ${l.sector} ${l.description}`.toLowerCase().includes(q)) : LOCATIONS;
  }, [search]);

  const runLocationAction = (action: string) => {
    const inferred: ImprovSituation = /convers|pergunt|falar/i.test(action) ? "CONVERSAR" : /seguir|correr|fug/i.test(action) ? "PERSEGUIÇÃO" : /procur|buscar|consult|ler|revis/i.test(action) ? "PROCURAR" : "EXAMINAR";
    useNarration({ kind: "AÇÃO", label: action, text: buildImprovNarration(location, inferred, tone, action) });
    store.logAction("acao", `Ação no local: ${action}`, location?.name);
  };

  const generateImprov = () => setDraft(buildImprovNarration(location, situation, tone, playerAction, NPCS.find((n) => n.id === improvNpc)?.name));
  const useDraft = () => {
    const text = draft.trim() || buildImprovNarration(location, situation, tone, playerAction, NPCS.find((n) => n.id === improvNpc)?.name);
    setDraft(text);
    useNarration({ kind: "IMPROVISO", label: `${situation} · ${location?.name ?? "Local"}`, text });
  };
  const openEvent = (id: string) => {
    const ev = V3_EVENTS.find((e) => e.id === id);
    if (!ev) return;
    store.activateEvent(id, "ativar");
    useNarration({ kind: "EVENTO", label: ev.title, text: ev.narration ?? `${ev.description}\n\n${ev.trigger}` }, false);
  };
  const onTestResult = (result: TestResult, text: string, name: string) => useNarration({ kind: "RESULTADO", label: `${name} — ${result}`, text });
  const applyGeneric = () => {
    if (!genericResult) return;
    useNarration({ kind: "RESULTADO", label: genericResult, text: GENERIC_TEST_RESULTS[genericResult] });
    store.logAction("teste-improvisado", genericResult, `${situation} em ${location?.name ?? "local"}`);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1700px] space-y-3">
        {!session.recapApplied && <section className="rounded-sm border border-route-amarelo/70 bg-route-amarelo/10 p-4"><div className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><p className="stamp text-route-amarelo">IMPORTANTE · ESTADO REAL DA MESA</p><p className="mt-1 text-sm">O navegador ainda não recebeu o recap da primeira sessão. Aplicar leva o painel para <b>Dia 2 · 21:00 · início da invasão</b>, marca o cabo cortado e salva os fatos canônicos sem apagar pistas já registradas.</p></div><Button onClick={() => { store.createCheckpoint("Antes do recap da Sessão 1"); store.applySessionOneRecap(); }}>Aplicar recap da Sessão 1</Button></div></section>}

        <section className="dossier rounded-sm p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2"><div className="mr-2"><p className="stamp text-primary">Sessão ao vivo V3</p><p className="text-xs text-muted-foreground">cockpit local-first · improviso livre</p></div>{[1,2,3,4,5].map((d) => <Button key={d} size="sm" variant={session.day === d ? "default" : "outline"} onClick={() => store.setDay(d as CampaignDay)}>{DAY_LABEL[d as CampaignDay]}</Button>)}<div className="ml-auto flex items-center gap-1"><Button size="sm" variant={session.clockRunning ? "destructive" : "secondary"} onClick={store.toggleClock}>{session.clockRunning ? <Pause className="mr-1 size-3.5" /> : <Play className="mr-1 size-3.5" />}{session.clockRunning ? "Pausar" : "Rodar"}</Button>{[5,15,30,60].map((m) => <Button key={m} size="sm" variant="outline" onClick={() => store.advanceTime(m)}>+{m === 60 ? "1h" : m}</Button>)}<Button size="sm" variant="ghost" disabled={!store.past.length} onClick={store.undo}><Undo2 className="size-4" /></Button></div></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Info label="Agora" value={`DIA ${session.day} · ${session.time}`} /><Info label="Local" value={location?.name ?? "Escolha um local"} /><Info label="Atenção" value={`${session.attentionLevel}/5`} /><Info label="Pistas registradas" value={String(Object.values(session.clueStatus).filter((v) => FOUND.has(v)).length)} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setDrawer("locations")}><Compass className="mr-1 size-4" />Ir para qualquer local</Button><Button size="sm" variant="outline" onClick={() => setDrawer("guide")}><BookOpen className="mr-1 size-4" />Guia rápido</Button><Button size="sm" variant="outline" onClick={() => setDrawer("recap")}><History className="mr-1 size-4" />Cânone da mesa</Button><Link to="/mapa" className="rounded-sm border border-border px-3 py-1.5 text-xs hover:border-primary">Mapa</Link><Link to="/players" className="rounded-sm border border-border px-3 py-1.5 text-xs hover:border-primary">Players</Link><Link to="/pistas-v2" className="rounded-sm border border-border px-3 py-1.5 text-xs hover:border-primary">Pistas</Link></div>
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_390px]">
          <main className="space-y-3">
            <section className="dossier rounded-sm p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="stamp text-primary">Narrar aos jogadores</p><h1 className="mt-1 font-display text-2xl sm:text-3xl">{narration.label}</h1><p className="stamp mt-1 text-muted-foreground">{narration.kind}</p></div><div className="flex flex-wrap gap-1.5">{history.length > 0 && <Button size="sm" variant="outline" onClick={() => { const prev = history.at(-1); if (!prev || pinned) return; setHistory((h) => h.slice(0,-1)); setNarration(prev); }}><ArrowLeft className="mr-1 size-3.5" />Voltar</Button>}<Button size="sm" variant="outline" onClick={() => setPinned((v) => !v)}>{pinned ? <PinOff className="mr-1 size-3.5" /> : <Pin className="mr-1 size-3.5" />}{pinned ? "Desfixar" : "Fixar"}</Button><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(narration.text)}><ClipboardCopy className="mr-1 size-3.5" />Copiar</Button></div></div><div className="paper-sheet mt-4 rounded-sm p-5 sm:p-7"><p className="whitespace-pre-line font-display text-xl leading-relaxed sm:text-2xl">{narration.text}</p></div>{pinned && <p className="mt-2 text-xs text-primary">Texto fixado. Ações continuam sendo registradas, mas não substituem a narração até você desfixar.</p>}</section>

            <section className="dossier rounded-sm p-4"><div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">{location?.sector ?? "Campus"}</p><h2 className="text-xl font-semibold">{location?.name ?? "Escolha um local"}</h2></div><Button className="ml-auto" size="sm" variant="outline" onClick={() => setDrawer("locations")}><MapPin className="mr-1 size-3.5" />Trocar local</Button></div><p className="mt-2 text-sm text-muted-foreground">{location?.description}</p><div className="mt-3 flex flex-wrap gap-2">{location?.actions.map((a) => <Button key={a} size="sm" variant="outline" onClick={() => runLocationAction(a)}>{a}</Button>)}</div><div className="mt-4 grid gap-3 lg:grid-cols-2"><div className="rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">Pistas possíveis aqui</p><div className="mt-2 space-y-2">{localClues.slice(0,8).map((c) => <QuickClue key={c.id} clue={c} onUse={() => store.setClue(c.id,"encontrada",`Encontrada em ${location?.name}`)} onTest={() => c.testId && setTestId(c.testId)} status={session.clueStatus[c.id] ?? "escondida"} />)}{!localClues.length && <p className="text-xs text-muted-foreground">Nenhuma pista fixa — use o Console de Improviso sem medo.</p>}</div></div><div className="rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">NPCs oficiais prováveis</p><div className="mt-2 flex flex-wrap gap-2">{localNpcs.map((n) => <Link key={n.id} to="/npcs" className="rounded-sm border border-border px-2 py-1.5 text-xs hover:border-primary">{n.name}</Link>)}{!localNpcs.length && <p className="text-xs text-muted-foreground">Nenhum NPC modelado fixo aqui. Funcionários genéricos podem existir sem virar NPC principal.</p>}</div></div></div></section>

            <section className="dossier rounded-sm border border-primary/30 p-4 sm:p-5"><div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><div><p className="stamp text-primary">Console de improviso</p><h2 className="text-xl font-semibold">Eles fizeram algo que não estava previsto?</h2></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><Field label="Situação"><select className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm" value={situation} onChange={(e) => setSituation(e.target.value as ImprovSituation)}>{IMPROV_SITUATIONS.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Tom"><select className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm" value={tone} onChange={(e) => setTone(e.target.value as ImprovTone)}>{IMPROV_TONES.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="NPC opcional"><select className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm" value={improvNpc} onChange={(e) => setImprovNpc(e.target.value)}><option value="">Sem NPC específico</option>{NPCS.filter((n) => n.status !== "morto").map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}</select></Field></div><Field label="O que os jogadores fizeram"><Input value={playerAction} onChange={(e) => setPlayerAction(e.target.value)} placeholder="Ex.: Adolfo tenta arrombar a porta enquanto Sofia observa o corredor" /></Field><div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="stamp text-muted-foreground">Teste sugerido</span><span>{suggestedTestForSituation(situation)}</span></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={generateImprov}><Sparkles className="mr-1 size-3.5" />Gerar base</Button><Button size="sm" variant="secondary" onClick={useDraft}>Usar na narração</Button><Button size="sm" variant="outline" onClick={() => setDraft("")}>Limpar</Button></div><Textarea className="mt-3 min-h-32" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="O texto gerado aparece aqui e pode ser editado antes de você usar." /><div className="mt-4 rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">Resultado rápido de teste improvisado</p><div className="mt-2 flex flex-wrap gap-2"><select className="h-9 rounded-sm border border-input bg-background px-2 text-sm" value={genericResult} onChange={(e) => setGenericResult(e.target.value as keyof typeof GENERIC_TEST_RESULTS | "")}><option value="">Escolha o resultado…</option>{Object.keys(GENERIC_TEST_RESULTS).map((r) => <option key={r}>{r}</option>)}</select><Button size="sm" variant="outline" disabled={!genericResult} onClick={applyGeneric}>Narrar resultado</Button></div></div></section>

            <section className="dossier rounded-sm p-4"><p className="stamp text-primary">Registrar em 10 segundos</p><div className="mt-2 flex gap-2"><Input value={fact} onChange={(e) => setFact(e.target.value)} placeholder="Fato improvisado que virou cânone na mesa…" onKeyDown={(e) => { if (e.key === "Enter" && fact.trim()) { store.addFact(fact, location?.id); setFact(""); } }} /><Button disabled={!fact.trim()} onClick={() => { store.addFact(fact, location?.id); setFact(""); }}><Check className="mr-1 size-4" />Salvar fato</Button></div><p className="mt-1 text-xs text-muted-foreground">Salva dia, horário e local automaticamente e aparece no histórico/resumo.</p></section>
          </main>

          <aside className="space-y-3 xl:sticky xl:top-44 xl:self-start"><GuideCard title="AGORA" text={guide.now} /><GuideCard title="SE ELES FOREM PARA…" text={guide.ifTheyGo} /><section className="dossier rounded-sm p-4"><p className="stamp text-primary">EVENTOS QUE PODEM ACONTECER</p><div className="mt-2 space-y-2">{relevantEvents.map((ev) => <button key={ev.id} onClick={() => openEvent(ev.id)} className="w-full rounded-sm border border-border p-2.5 text-left hover:border-primary"><span className="flex items-center gap-2 text-xs"><Clock3 className="size-3.5" /><b>{ev.time}</b><span className="stamp text-muted-foreground">{ev.kind}</span></span><p className="mt-1 text-sm font-semibold">{ev.title}</p><p className="mt-1 text-xs text-muted-foreground">{ev.description}</p></button>)}{!relevantEvents.length && <p className="text-xs text-muted-foreground">Nenhum evento pendente neste dia. Continue por local/improviso.</p>}</div></section><section className="dossier rounded-sm p-4"><p className="stamp text-primary">PISTAS PENDENTES</p><div className="mt-2 space-y-1.5">{pendingClues.slice(0,7).map((c) => <div key={c.id} className="rounded-sm border border-border p-2 text-xs"><b>{c.name}</b><p className="text-muted-foreground">{LOCATIONS.find((l) => l.id === c.mainLocationId)?.name ?? c.mainLocationId} · {c.suggestedSkill} DT {session.dcOverrides[c.id] ?? c.dc}</p></div>)}</div><Link to="/pistas-v2" className="mt-2 inline-block text-xs underline">abrir catálogo completo</Link></section><GuideCard title="CONTINGÊNCIA" text={guide.contingency} /></aside>
        </div>
      </div>

      <TestDialog testId={testId} onClose={() => setTestId(null)} onResult={onTestResult} />
      {drawer && <Drawer title={drawer === "guide" ? "Guia rápido do mestre" : drawer === "locations" ? "Todos os locais" : "Cânone da mesa"} onClose={() => setDrawer(null)}>{drawer === "guide" && <div className="space-y-3"><GuideCard title="AGORA" text={guide.now} /><GuideCard title="SE ELES FOREM PARA…" text={guide.ifTheyGo} /><GuideCard title="EVENTOS" text={guide.events} /><GuideCard title="PISTAS" text={guide.pending} /><GuideCard title="CONTINGÊNCIA" text={guide.contingency} /></div>}{drawer === "locations" && <div><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar sala, setor ou descrição…" /></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{filteredLocations.map((l) => <button key={l.id} onClick={() => goLocation(l.id)} className={`rounded-sm border p-3 text-left ${l.id === location?.id ? "border-primary bg-primary/10" : "border-border hover:border-primary"}`}><b>{l.name}</b><p className="text-xs text-muted-foreground">{l.sector}</p><p className="mt-1 line-clamp-2 text-xs">{l.description}</p></button>)}</div></div>}{drawer === "recap" && <div className="space-y-2">{SESSION_ONE_RECAP.map((f) => <div key={f.id} className="rounded-sm border border-border p-3"><p className="font-mono text-xs text-muted-foreground">D{f.day} · {f.time}</p><b>{f.title}</b><p className="mt-1 text-sm">{f.detail}</p></div>)}{session.facts.filter((f) => !f.canonical).map((f) => <div key={f.id} className="rounded-sm border border-primary/30 p-3"><p className="font-mono text-xs text-muted-foreground">D{f.day} · {f.time}</p><p className="text-sm">{f.text}</p></div>)}</div>}</Drawer>}
    </Shell>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-sm border border-border bg-secondary/20 p-2.5"><p className="stamp text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-sm font-semibold">{value}</p></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="mt-3 block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>; }
function GuideCard({ title, text }: { title: string; text: string }) { return <section className="dossier rounded-sm p-4"><p className="stamp text-primary">{title}</p><p className="mt-2 text-sm leading-relaxed">{text}</p></section>; }
function QuickClue({ clue, status, onUse, onTest }: { clue: Clue; status: string; onUse: () => void; onTest: () => void }) { return <div className="rounded-sm border border-border p-2.5"><div className="flex gap-2"><div className="min-w-0 flex-1"><b className="text-sm">{clue.name}</b><p className="text-xs text-muted-foreground">{status} · {clue.suggestedSkill} DT {clue.dc}</p><p className="mt-1 line-clamp-2 text-xs">{clue.playerDescription}</p></div><div className="flex shrink-0 flex-col gap-1"><Button size="sm" variant="outline" disabled={FOUND.has(status)} onClick={onUse}>{FOUND.has(status) ? "Obtida" : "Entregar"}</Button>{clue.testId && <Button size="sm" variant="ghost" onClick={onTest}>Teste</Button>}</div></div></div>; }
function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-black/65" onClick={onClose}><aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background p-4 sm:p-6" onClick={(e) => e.stopPropagation()}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-2xl">{title}</h2><Button size="sm" variant="ghost" onClick={onClose}><X className="size-4" /></Button></div>{children}</aside></div>; }
