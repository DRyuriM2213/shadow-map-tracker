import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUES, LOCATIONS } from "@/data/campaignFull";
import { DOCUMENT_META } from "@/data/documentMeta";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel, importanceLabel, routeBorder } from "@/lib/ui";
import { AlertTriangle, Lock, MapPin, X } from "lucide-react";

export const Route = createFileRoute("/pistas-v2")({ component: PistasV2 });

type F = "todas" | "local" | "pendentes" | "encontradas" | "obrigatorias" | "futuras" | "bloco-c" | "documental" | "fisica" | "digital" | "social" | "ambiental";
const FILTERS: [F, string][] = [
  ["todas", "Todas"], ["local", "No local atual"], ["pendentes", "Não encontradas"], ["encontradas", "Encontradas"], ["obrigatorias", "Obrigatórias"],
  ["futuras", "Futuras"], ["bloco-c", "Bloco C"], ["documental", "Documental"], ["fisica", "Física"], ["digital", "Digital"], ["social", "Social"], ["ambiental", "Ambiental"],
];
const FOUND = ["encontrada", "interpretada", "contingencia"];

function PistasV2() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<F>("todas");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => CLUES.filter((c) => {
    const status = session.clueStatus[c.id] ?? "escondida";
    const meta = DOCUMENT_META[c.sourceDocument];
    const location = LOCATIONS.find((l) => l.id === c.mainLocationId)?.name ?? "";
    const q = query.trim().toLowerCase();
    const haystack = `${c.name} ${c.sourceDocument} ${meta?.code ?? ""} ${c.playerDescription} ${c.masterMeaning} ${c.microLocation} ${c.exactLocation} ${location} ${c.unlocks}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (filter === "local" && c.mainLocationId !== session.currentLocationId && !c.alternativeLocationIds.includes(session.currentLocationId ?? "")) return false;
    if (filter === "pendentes" && FOUND.includes(status)) return false;
    if (filter === "encontradas" && !FOUND.includes(status)) return false;
    if (filter === "obrigatorias" && c.importance !== "obrigatoria") return false;
    if (filter === "futuras" && !c.isFuture) return false;
    if (filter === "bloco-c" && c.mainLocationId !== "l-bloco-c") return false;
    if (["documental", "fisica", "digital", "social", "ambiental"].includes(filter) && c.medium !== filter) return false;
    return true;
  }), [query, filter, session.clueStatus, session.currentLocationId]);

  const clue = CLUES.find((c) => c.id === open);
  const docs = CLUES.filter((c) => c.sourceDocument).length;
  const foundCount = CLUES.filter((c) => FOUND.includes(session.clueStatus[c.id] ?? "")).length;

  return <Shell>
    <div className="mx-auto max-w-7xl space-y-4">
      <header className="dossier rounded-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div><p className="stamp text-primary">Catálogo global do mestre</p><h1 className="text-3xl font-semibold">Pistas e documentos</h1><p className="text-sm text-muted-foreground">{CLUES.length} pistas · {docs} documentos/props · {foundCount} encontradas. “Futura” é só aviso; nada fica oculto do mestre.</p></div>
          <Input className="ml-auto min-w-[240px] max-w-md" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar título, arquivo, código, pessoa, sala…" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{FILTERS.map(([id, label]) => <Button key={id} size="sm" variant={filter === id ? "default" : "outline"} onClick={() => setFilter(id)}>{label}</Button>)}</div>
      </header>

      <p className="text-xs text-muted-foreground">Mostrando {list.length} de {CLUES.length}.</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => {
          const status = session.clueStatus[c.id] ?? "escondida";
          const meta = DOCUMENT_META[c.sourceDocument];
          return <button key={c.id} onClick={() => { if (session.autoPauseOnTest) store.setClockRunning(false); setOpen(c.id); }} className={`dossier rounded-sm border-l-4 p-4 text-left transition-colors hover:border-primary ${routeBorder[c.route]}`}>
            <div className="flex items-start justify-between gap-2"><b>{c.name}</b><span className="shrink-0 font-mono text-xs">DT {session.dcOverrides[c.id] ?? c.dc}</span></div>
            {c.sourceDocument && <p className="mt-1 font-mono text-[10px] text-primary">{c.sourceDocument}{meta?.code ? ` · ${meta.code}` : ""}</p>}
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.playerDescription}</p>
            <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
              <span className="rounded-sm bg-secondary px-2 py-1">{clueStatusLabel[status]}</span><span className="rounded-sm bg-secondary px-2 py-1">{importanceLabel[c.importance]}</span><span className="rounded-sm bg-secondary px-2 py-1">{c.medium}</span>
              {c.isFuture && <span className="rounded-sm border border-route-azul/50 px-2 py-1 text-route-azul">futura</span>}{c.isSecret && <span className="rounded-sm border border-route-roxo/50 px-2 py-1 text-route-roxo">secreta</span>}{meta?.continuityWarning && <span className="rounded-sm border border-route-amarelo/50 px-2 py-1 text-route-amarelo">conflito</span>}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">{LOCATIONS.find((l) => l.id === c.mainLocationId)?.name ?? c.mainLocationId} · {c.recommendedDay ? `Dia ${c.recommendedDay}` : "Livre / sem dia recomendado"}</p>
          </button>;
        })}
      </div>
    </div>

    {clue && <ClueDetail clue={clue} onClose={() => setOpen(null)} />}
  </Shell>;
}

function ClueDetail({ clue, onClose }: { clue: (typeof CLUES)[number]; onClose: () => void }) {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const meta = DOCUMENT_META[clue.sourceDocument];
  const main = LOCATIONS.find((l) => l.id === clue.mainLocationId);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3" onClick={onClose}><div className="dossier max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-sm p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-start justify-between gap-3"><div><p className="stamp text-primary">Pista / documento</p><h2 className="font-display text-2xl sm:text-3xl">{clue.name}</h2>{clue.sourceDocument && <p className="mt-1 font-mono text-xs text-primary">PROP: {clue.sourceDocument}{meta?.code ? ` · ${meta.code}` : ""}</p>}</div><Button size="sm" variant="ghost" onClick={onClose}><X className="size-4" /></Button></div>
    {meta?.continuityWarning && <div className="mt-4 rounded-sm border border-route-amarelo/60 bg-route-amarelo/10 p-3 text-sm"><p className="stamp text-route-amarelo"><AlertTriangle className="mr-1 inline size-4" />Aviso privado de continuidade</p><p className="mt-1">{meta.continuityWarning}</p><p className="mt-1 text-xs text-muted-foreground">Não altere o prop físico; este aviso é só para o mestre.</p></div>}
    <div className="paper-sheet mt-4 rounded-sm p-4">{clue.playerDescription}</div>
    <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
      <Field k="Local principal" v={main?.name ?? clue.mainLocationId} /><Field k="Micro-local" v={clue.microLocation || clue.exactLocation || "—"} /><Field k="Gatilho" v={clue.discoveryTrigger || clue.actionRequired} /><Field k="Teste sugerido" v={`${clue.suggestedSkill} • DT ${session.dcOverrides[clue.id] ?? clue.dc}`} /><Field k="Dia recomendado" v={clue.recommendedDay ? `Dia ${clue.recommendedDay} — recomendação apenas` : "Livre / sem dia recomendado"} /><Field k="Estado" v={clueStatusLabel[session.clueStatus[clue.id] ?? "escondida"]} />
    </div>
    <div className="mt-4 grid gap-2 text-sm lg:grid-cols-2"><Result title="Sucesso" text={clue.successResult} /><Result title="Sucesso parcial" text={clue.partialSuccess} /><Result title="Falha" text={clue.failureResult} /><Result title="Falha crítica" text={clue.criticalFailure} /></div>
    <div className="mt-4 rounded-sm border border-route-preto bg-black/40 p-4 text-sm"><p className="stamp text-route-cinza"><Lock className="mr-1 inline size-4" />Segredo / significado para o mestre</p><p className="mt-2">{clue.masterMeaning || "—"}</p>{clue.unlocks && <p className="mt-2"><b>Desbloqueia:</b> {clue.unlocks}</p>}{clue.fallbackOptions.length > 0 && <p className="mt-2"><b>Contingência:</b> {clue.fallbackOptions.join(" • ")}</p>}</div>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button size="sm" onClick={() => store.setClue(clue.id, "encontrada", clue.name)}>Entregar pista</Button>
      <select className="rounded-sm border border-input bg-background px-2 py-1 text-xs" value={session.clueStatus[clue.id] ?? "escondida"} onChange={(e) => store.setClue(clue.id, e.target.value as Parameters<typeof store.setClue>[1], clue.name)}>{["escondida","disponivel","encontrada","encontrada-parcialmente","interpretada","nao-interpretada","perdida","destruida","removida","contingencia"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
      {main && <Button size="sm" variant="outline" onClick={() => store.setLocation(main.id)}><MapPin className="mr-1 size-3.5" />Mover grupo para {main.name}</Button>}
      <Link to="/mapa"><Button size="sm" variant="outline">Abrir mapa</Button></Link>
      <Link to="/sessao-v2"><Button size="sm" variant="secondary">Ir para Modo Sessão</Button></Link>
      <Button size="sm" variant="ghost" onClick={onClose}>Fechar</Button>
    </div>
  </div></div>;
}

function Field({ k, v }: { k: string; v: string }) { return <p><span className="stamp text-muted-foreground">{k}: </span>{v}</p>; }
function Result({ title, text }: { title: string; text: string }) { return <div className="rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">{title}</p><p className="mt-1">{text}</p></div>; }
