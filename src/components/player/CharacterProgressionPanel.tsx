import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATTRIBUTES, SKILLS, type CharacterSheetData, type OrdemAttribute, type TrainingLevel } from "@/data/ordemRules";
import {
  ELEMENTS,
  NEX_STEPS,
  TRAILS_BY_CLASS,
  affinityActive,
  baseClassOf,
  degreeTrainingAllowance,
  degreeTrainingCandidates,
  derivedResources,
  hasRitualAccess,
  maxRitualCircle,
  nextNex,
  pendingMilestones,
  previousNex,
  reachedMilestones,
  ritualSlots,
  suspendedChoices,
  validateProgression,
  type MilestoneDef,
  type ParanormalElement,
  type ProgressionChoice,
  type RitualElement,
} from "@/data/ordemProgression";
import { ritualById, ritualsAvailable } from "@/data/rituals";
import { CharacterCreationWizard } from "@/components/player/CharacterCreationWizard";
import { AlertTriangle, Check, CircleDot, Plus, Trash2 } from "lucide-react";

const choiceId = () => `prog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const ritualEntryId = () => `rit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const normalizeLabel = (value: string) => value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function CharacterProgressionPanel({ sheet, editable, onChange }: {
  sheet: CharacterSheetData;
  editable: boolean;
  onChange: (next: CharacterSheetData) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [transcending, setTranscending] = useState<Record<string, boolean>>({});
  const [paranormalChoice, setParanormalChoice] = useState<Record<string, "Aprender Ritual" | "Outro poder paranormal">>({});
  const [affinityChoice, setAffinityChoice] = useState<Record<string, boolean>>({});
  const [trainingSelections, setTrainingSelections] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");

  const cls = baseClassOf(sheet.concept.className);
  const pending = pendingMilestones(sheet.concept.nex, sheet.progression.choices);
  const suspended = suspendedChoices(sheet.concept.nex, sheet.progression.choices);
  const derived = derivedResources({ className: sheet.concept.className, nex: sheet.concept.nex, attributes: sheet.attributes, choices: sheet.progression.choices });
  const issues = validateProgression({
    className: sheet.concept.className,
    trail: sheet.concept.trail,
    nex: sheet.concept.nex,
    attributes: sheet.attributes,
    skills: sheet.skills,
    state: sheet.progression,
    freeMode: sheet.concept.freeMode,
  });

  const addChoice = (
    milestone: MilestoneDef,
    choice: Omit<ProgressionChoice, "id" | "milestoneId" | "nex" | "kind" | "createdAt">,
    patch: Partial<CharacterSheetData> = {},
  ) => {
    if (sheet.progression.choices.some((item) => item.milestoneId === milestone.id)) return;
    const entry: ProgressionChoice = {
      id: choiceId(),
      milestoneId: milestone.id,
      nex: milestone.nex,
      kind: milestone.kind,
      createdAt: new Date().toISOString(),
      ...choice,
    };
    onChange({
      ...sheet,
      ...patch,
      progression: { ...sheet.progression, choices: [...sheet.progression.choices, entry] },
    });
    setDrafts((current) => ({ ...current, [milestone.id]: "" }));
    setTrainingSelections((current) => ({ ...current, [milestone.id]: [] }));
    setError("");
  };

  const resolve = (milestone: MilestoneDef) => {
    if (!editable) return;
    const draft = (drafts[milestone.id] ?? "").trim();

    if (milestone.kind === "TRILHA") {
      if (!cls || !draft || !TRAILS_BY_CLASS[cls].includes(draft)) return setError("Escolha uma trilha válida da classe atual.");
      addChoice(milestone, { value: draft }, { concept: { ...sheet.concept, trail: draft } });
      return;
    }

    if (milestone.kind === "HABILIDADE_TRILHA") {
      if (!sheet.concept.trail) return setError("Resolva a escolha de trilha primeiro.");
      addChoice(milestone, { value: `${sheet.concept.trail} · marco ${milestone.nex}%` });
      return;
    }

    if (milestone.kind === "ATRIBUTO") {
      const attr = draft as OrdemAttribute;
      if (!ATTRIBUTES.some((item) => item.id === attr)) return setError("Escolha o atributo que vai aumentar.");
      if (!sheet.concept.freeMode && sheet.attributes[attr] >= 5) return setError(`${attr} já está no limite normal 5.`);
      addChoice(milestone, { value: attr }, { attributes: { ...sheet.attributes, [attr]: sheet.attributes[attr] + 1 } });
      return;
    }

    if (milestone.kind === "TREINAMENTO") {
      const milestoneNex = milestone.nex === 35 ? 35 : 70;
      const allowance = degreeTrainingAllowance(sheet.concept.className, sheet.attributes.INT);
      const candidates = degreeTrainingCandidates(milestoneNex, sheet.skills);
      const required = Math.min(allowance, candidates.length);
      const selected = trainingSelections[milestone.id] ?? [];
      if (selected.length !== required) return setError(`Escolha ${required} perícia(s) para este lote de Grau de Treinamento.`);
      const candidateMap = new Map(candidates.map((item) => [item.skillId, item]));
      const skills = { ...sheet.skills };
      const labels: string[] = [];
      for (const skillId of selected) {
        const candidate = candidateMap.get(skillId);
        if (!candidate) continue;
        skills[skillId] = { ...skills[skillId], training: candidate.to };
        const name = SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId;
        labels.push(`${name} ${trainingLabel(candidate.from)}→${trainingLabel(candidate.to)}`);
      }
      addChoice(milestone, { value: `${selected.length}/${allowance} elevações · ${labels.join("; ")}`, note: candidates.length < allowance ? `Somente ${candidates.length} perícias elegíveis estavam disponíveis.` : undefined }, { skills });
      return;
    }

    if (milestone.kind === "ELEMENTO") {
      const element = draft as ParanormalElement;
      if (!ELEMENTS.some((item) => item.id === element)) return setError("Escolha um elemento.");
      if (sheet.progression.elementLocked && !sheet.concept.freeMode) return setError("A conexão elemental já foi confirmada.");
      const entry: ProgressionChoice = { id: choiceId(), milestoneId: milestone.id, nex: milestone.nex, kind: milestone.kind, value: element, createdAt: new Date().toISOString() };
      onChange({ ...sheet, progression: { ...sheet.progression, element, elementLocked: !sheet.concept.freeMode, choices: [...sheet.progression.choices, entry] } });
      setError("");
      return;
    }

    if (milestone.kind === "VERSATILIDADE") {
      if (!draft) return setError("Registre sua escolha de Versatilidade.");
      addChoice(milestone, { value: draft });
      return;
    }

    if (milestone.kind === "PODER") {
      const isTranscender = Boolean(transcending[milestone.id]);
      if (!isTranscender && !draft) return setError("Informe o poder de classe escolhido.");
      if (isTranscender) {
        const paranormal = paranormalChoice[milestone.id] ?? "Outro poder paranormal";
        const detail = paranormal === "Aprender Ritual" ? "Aprender Ritual" : draft;
        if (!detail) return setError("Informe qual poder paranormal foi obtido ao Transcender.");
        addChoice(milestone, {
          value: `Transcender · ${detail}`,
          transcender: true,
          grantsRitual: paranormal === "Aprender Ritual",
          activatesAffinity: milestone.nex >= 50 && Boolean(sheet.progression.element) && Boolean(affinityChoice[milestone.id]),
        });
        return;
      }
      const isSkillTraining = normalizeLabel(draft) === "treinamento em pericia";
      addChoice(milestone, { value: draft, grantsSkillTraining: isSkillTraining ? 2 : undefined });
    }
  };

  const setNex = (nex: number) => {
    if (!editable) return;
    if (sheet.concept.nex === 0 && nex > 0 && sheet.progression.creation.status === "NOVA") {
      setError("Conclua a criação guiada abaixo para entrar em NEX 5%.");
      return;
    }
    onChange({ ...sheet, concept: { ...sheet.concept, nex } });
    setError("");
  };

  if (sheet.concept.nex === 0 && sheet.progression.creation.status === "NOVA" && !sheet.concept.freeMode) {
    return <div className="space-y-4">{error && <ErrorBox>{error}</ErrorBox>}<CharacterCreationWizard sheet={sheet} editable={editable} onChange={onChange} /></div>;
  }

  return <div className="space-y-4">
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1"><p className="stamp text-primary">Progressão automática</p><h2 className="font-display text-2xl">NEX {sheet.concept.nex}% · nível {sheet.concept.nex === 99 ? 20 : Math.round(sheet.concept.nex / 5)}</h2><p className="mt-1 text-xs text-muted-foreground">Aumente o NEX e resolva as escolhas liberadas. Pendências podem acumular sem travar a campanha.</p></div>
        <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={!editable || previousNex(sheet.concept.nex) === null} onClick={() => { const value = previousNex(sheet.concept.nex); if (value !== null) setNex(value); }}>− NEX</Button><select aria-label="NEX" disabled={!editable} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" value={sheet.concept.nex} onChange={(event) => setNex(Number(event.target.value))}>{NEX_STEPS.map((value) => <option key={value} value={value}>{value}%</option>)}</select><Button size="sm" disabled={!editable || nextNex(sheet.concept.nex) === null} onClick={() => { const value = nextNex(sheet.concept.nex); if (value !== null) setNex(value); }}>+ NEX</Button></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Mini label="Classe" value={sheet.concept.className}/><Mini label="Trilha" value={sheet.concept.trail || (sheet.concept.nex >= 10 ? "pendente" : "libera em 10%")}/><Mini label="Elemento" value={sheet.progression.element ? ELEMENTS.find((element) => element.id === sheet.progression.element)?.label ?? sheet.progression.element : (sheet.concept.nex >= 50 ? "pendente" : "libera em 50%")}/><Mini label="Escolhas pendentes" value={String(pending.length)}/><Mini label="PV máximo" value={derived ? String(derived.pvMax) : "—"}/><Mini label="PE máximo" value={derived ? String(derived.peMax) : "—"}/><Mini label="SAN máxima" value={derived ? String(derived.sanMax) : "—"}/><Mini label="PE / rodada" value={derived ? String(derived.peRoundLimit) : String(sheet.concept.pePerRound)}/></div>
      {sheet.progression.creation.status === "LEGADA" && <p className="mt-3 rounded-lg border border-route-amarelo/35 bg-route-amarelo/5 p-2 text-[11px] text-route-amarelo">Criação legada preservada: o assistente não reescreveu atributos ou perícias antigos.</p>}
    </section>

    {error && <ErrorBox>{error}</ErrorBox>}
    {issues.map((issue, index) => <p key={`${issue.message}-${index}`} className={`rounded-lg border p-3 text-xs ${issue.level === "erro" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-route-amarelo/40 bg-route-amarelo/5 text-route-amarelo"}`}><AlertTriangle className="mr-1 inline size-3.5"/>{issue.message}</p>)}

    <section className="rounded-xl border border-border bg-card/30 p-4"><div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Pendências</p><h3 className="font-semibold">Escolhas liberadas pelo NEX</h3></div><span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-xs">{pending.length}</span></div><div className="mt-4 space-y-3">{pending.map((milestone) => <MilestoneCard key={milestone.id} milestone={milestone} sheet={sheet} cls={cls} draft={drafts[milestone.id] ?? ""} setDraft={(value) => setDrafts((current) => ({ ...current, [milestone.id]: value }))} transcending={Boolean(transcending[milestone.id])} setTranscending={(value) => setTranscending((current) => ({ ...current, [milestone.id]: value }))} paranormalChoice={paranormalChoice[milestone.id] ?? "Outro poder paranormal"} setParanormalChoice={(value) => setParanormalChoice((current) => ({ ...current, [milestone.id]: value }))} affinityChoice={Boolean(affinityChoice[milestone.id])} setAffinityChoice={(value) => setAffinityChoice((current) => ({ ...current, [milestone.id]: value }))} trainingSelection={trainingSelections[milestone.id] ?? []} setTrainingSelection={(value) => setTrainingSelections((current) => ({ ...current, [milestone.id]: value }))} editable={editable} onResolve={() => resolve(milestone)} />)}{pending.length === 0 && <div className="rounded-lg border border-route-verde/30 bg-route-verde/5 p-4 text-sm text-route-verde-claro"><Check className="mr-2 inline size-4"/>Todos os marcos alcançados estão resolvidos.</div>}</div></section>

    {suspended.length > 0 && <section className="rounded-xl border border-route-amarelo/35 bg-route-amarelo/5 p-4"><p className="stamp text-route-amarelo">Escolhas suspensas</p><p className="mt-1 text-xs text-muted-foreground">O NEX foi reduzido. Estas escolhas continuam salvas e voltam a valer quando o NEX subir novamente.</p><div className="mt-2 flex flex-wrap gap-2">{suspended.map((choice) => <span key={choice.id} className="rounded-full border border-border px-2 py-1 text-xs">{choice.nex}% · {choice.value}</span>)}</div></section>}

    <section className="rounded-xl border border-border bg-card/30 p-4"><p className="stamp text-muted-foreground">Linha de progressão</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{reachedMilestones(sheet.concept.nex).map((milestone) => { const choice = sheet.progression.choices.find((item) => item.milestoneId === milestone.id); return <div key={milestone.id} className={`rounded-lg border p-3 ${choice ? "border-route-verde/30 bg-route-verde/5" : "border-route-amarelo/30 bg-route-amarelo/5"}`}><div className="flex items-center gap-2"><CircleDot className="size-3.5"/><b className="text-sm">{milestone.label}</b><span className="ml-auto text-[10px] text-muted-foreground">{choice ? "RESOLVIDO" : "PENDENTE"}</span></div>{choice && <p className="mt-1 text-xs text-muted-foreground">{choice.value}</p>}</div>; })}</div></section>

    {sheet.progression.element && <section className="rounded-xl border border-border bg-card/30 p-4"><p className="stamp text-primary">Paranormal</p><div className="mt-2 flex flex-wrap items-center gap-3"><b>Conexão: {ELEMENTS.find((element) => element.id === sheet.progression.element)?.label}</b><span className={`rounded-full px-2 py-1 text-xs ${affinityActive(sheet.progression, sheet.concept.nex) ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{affinityActive(sheet.progression, sheet.concept.nex) ? "Afinidade efetivada" : "Afinidade ainda não efetivada"}</span>{sheet.progression.elementLocked && <span className="text-xs text-muted-foreground">escolha travada</span>}</div></section>}
  </div>;
}

function MilestoneCard({ milestone, sheet, cls, draft, setDraft, transcending, setTranscending, paranormalChoice, setParanormalChoice, affinityChoice, setAffinityChoice, trainingSelection, setTrainingSelection, editable, onResolve }: {
  milestone: MilestoneDef;
  sheet: CharacterSheetData;
  cls: ReturnType<typeof baseClassOf>;
  draft: string;
  setDraft: (value: string) => void;
  transcending: boolean;
  setTranscending: (value: boolean) => void;
  paranormalChoice: "Aprender Ritual" | "Outro poder paranormal";
  setParanormalChoice: (value: "Aprender Ritual" | "Outro poder paranormal") => void;
  affinityChoice: boolean;
  setAffinityChoice: (value: boolean) => void;
  trainingSelection: string[];
  setTrainingSelection: (value: string[]) => void;
  editable: boolean;
  onResolve: () => void;
}) {
  const renderInput = () => {
    if (milestone.kind === "TRILHA" && cls) return <select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)}><option value="">Escolha...</option>{TRAILS_BY_CLASS[cls].map((trail) => <option key={trail}>{trail}</option>)}</select>;
    if (milestone.kind === "ATRIBUTO") return <select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)}><option value="">Atributo...</option>{ATTRIBUTES.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.id} — {attribute.label} ({sheet.attributes[attribute.id]})</option>)}</select>;
    if (milestone.kind === "ELEMENTO") return <select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)}><option value="">Elemento...</option>{ELEMENTS.map((element) => <option key={element.id} value={element.id}>{element.label}</option>)}</select>;
    if (milestone.kind === "TREINAMENTO") {
      const nex = milestone.nex === 35 ? 35 : 70;
      const allowance = degreeTrainingAllowance(sheet.concept.className, sheet.attributes.INT);
      const candidates = degreeTrainingCandidates(nex, sheet.skills);
      const required = Math.min(allowance, candidates.length);
      return <div className="space-y-2"><div className="flex items-center justify-between text-xs"><span>{nex === 35 ? "Treinado +5 → Veterano +10" : "Eleve um grau; Expert +15 já está liberado"}</span><b>{trainingSelection.length}/{required} selecionadas</b></div><div className="grid gap-2 sm:grid-cols-2">{candidates.map((candidate) => { const skill = SKILLS.find((item) => item.id === candidate.skillId)!; const active = trainingSelection.includes(candidate.skillId); const atLimit = !active && trainingSelection.length >= required; return <button type="button" key={candidate.skillId} disabled={!editable || atLimit} onClick={() => setTrainingSelection(active ? trainingSelection.filter((id) => id !== candidate.skillId) : [...trainingSelection, candidate.skillId])} className={`rounded-lg border p-2 text-left text-xs ${active ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><b>{skill.name}</b><span className="ml-2 text-muted-foreground">{trainingLabel(candidate.from)} → {trainingLabel(candidate.to)}</span></button>; })}</div>{candidates.length < allowance && <p className="text-[11px] text-route-amarelo">A regra permitiria {allowance}, mas há somente {candidates.length} perícia(s) elegível(is) agora; o lote aceita todas as disponíveis.</p>}</div>;
    }
    if (milestone.kind === "HABILIDADE_TRILHA") return <p className="rounded-lg border border-border bg-secondary/25 p-2 text-xs text-muted-foreground">Confirma o marco de {sheet.concept.trail || "trilha"} no NEX {milestone.nex}%.</p>;
    if (milestone.kind === "PODER") return <div className="space-y-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={transcending} onChange={(event) => setTranscending(event.target.checked)} />Transcender neste marco</label>{transcending ? <><select className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={paranormalChoice} onChange={(event) => setParanormalChoice(event.target.value as typeof paranormalChoice)}><option>Outro poder paranormal</option><option>Aprender Ritual</option></select>{paranormalChoice === "Outro poder paranormal" && <Input placeholder="Nome do poder paranormal" value={draft} onChange={(event) => setDraft(event.target.value)} />}{milestone.nex >= 50 && sheet.progression.element && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={affinityChoice} onChange={(event) => setAffinityChoice(event.target.checked)} />Esta escolha efetiva a afinidade com o elemento</label>}</> : <><Input placeholder="Nome do poder de classe" value={draft} onChange={(event) => setDraft(event.target.value)} /><p className="text-[11px] text-muted-foreground">Se escolher exatamente “Treinamento em Perícia”, a aba Perícias abrirá duas elevações guiadas sem consumir o Grau de Treinamento.</p></>}</div>;
    return <Input placeholder="Registre a escolha" value={draft} onChange={(event) => setDraft(event.target.value)} />;
  };

  return <article className="rounded-xl border border-border bg-background/25 p-3"><div className="flex flex-wrap items-start gap-2"><div className="min-w-0 flex-1"><p className="stamp text-primary">NEX {milestone.nex}% · {milestone.kind.replaceAll("_", " ")}</p><h4 className="font-semibold">{milestone.label}</h4><p className="mt-1 text-xs text-muted-foreground">{milestone.help}</p></div></div><div className="mt-3">{renderInput()}</div><Button type="button" size="sm" className="mt-3" disabled={!editable} onClick={onResolve}><Check className="mr-1 size-3.5"/>Resolver marco</Button></article>;
}

export function RitualManager({ sheet, editable, onChange }: { sheet: CharacterSheetData; editable: boolean; onChange: (next: CharacterSheetData) => void }) {
  const [element, setElement] = useState<RitualElement | "TODOS">("TODOS");
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const slots = ritualSlots({ className: sheet.concept.className, nex: sheet.concept.nex, choices: sheet.progression.choices });
  const access = hasRitualAccess({ className: sheet.concept.className, nex: sheet.concept.nex, choices: sheet.progression.choices });
  const circle = maxRitualCircle(sheet.concept.className, sheet.concept.nex, access);
  const knownIds = new Set(sheet.progression.knownRituals.map((ritual) => ritual.ritualId).filter(Boolean));
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const available = ritualsAvailable({ maxCircle: circle, element }).filter((ritual) => !knownIds.has(ritual.id) && (!normalizedQuery || ritual.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery)));

  const add = () => {
    if (!editable || !selected) return;
    const ritual = ritualById(selected);
    if (!ritual) return;
    if (!sheet.concept.freeMode && sheet.progression.knownRituals.length >= slots) return;
    onChange({ ...sheet, progression: { ...sheet.progression, knownRituals: [...sheet.progression.knownRituals, { id: ritualEntryId(), ritualId: ritual.id, name: ritual.name, element: ritual.element, circle: ritual.circle }] } });
    setSelected("");
  };

  const remove = (id: string) => onChange({ ...sheet, progression: { ...sheet.progression, knownRituals: sheet.progression.knownRituals.filter((ritual) => ritual.id !== id) } });

  return <div className="space-y-4"><section className="rounded-xl border border-primary/25 bg-primary/5 p-4"><div className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><p className="stamp text-primary">Rituais estruturados</p><h3 className="font-display text-xl">{sheet.progression.knownRituals.length}/{slots} conhecidos · círculo máximo {circle || "—"}</h3><p className="mt-1 text-xs text-muted-foreground">O catálogo guarda somente nome, elemento e círculo. Cards livres continuam disponíveis abaixo.</p></div></div></section>{access ? <section className="rounded-xl border border-border bg-card/30 p-4"><div className="grid gap-2 sm:grid-cols-3"><div><Label>Elemento</Label><select className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm" value={element} onChange={(event) => setElement(event.target.value as RitualElement | "TODOS")}><option value="TODOS">Todos</option><option value="SANGUE">Sangue</option><option value="MORTE">Morte</option><option value="CONHECIMENTO">Conhecimento</option><option value="ENERGIA">Energia</option><option value="MEDO">Medo</option></select></div><div><Label>Buscar</Label><Input className="mt-1" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome do ritual" /></div><div><Label>Ritual</Label><select className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Escolha...</option>{available.map((ritual) => <option key={ritual.id} value={ritual.id}>{ritual.name} · {ritual.circle}º · {ritual.element}</option>)}</select></div></div><Button type="button" className="mt-3" disabled={!editable || !selected || (!sheet.concept.freeMode && sheet.progression.knownRituals.length >= slots)} onClick={add}><Plus className="mr-1 size-4"/>Aprender ritual</Button></section> : <p className="rounded-xl border border-route-amarelo/35 bg-route-amarelo/5 p-3 text-xs text-route-amarelo">Esta ficha ainda não possui uma fonte válida de aprendizado de ritual.</p>}<div className="grid gap-2 md:grid-cols-2">{sheet.progression.knownRituals.map((ritual) => <article key={ritual.id} className="rounded-xl border border-border bg-background/25 p-3"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><b>{ritual.name}</b><p className="text-xs text-muted-foreground">{ritual.element} · {ritual.circle}º círculo {ritual.legacy ? "· migrado de card antigo" : ""}</p></div>{editable && <Button type="button" size="icon" variant="ghost" onClick={() => remove(ritual.id)}><Trash2 className="size-4"/></Button>}</div></article>)}{sheet.progression.knownRituals.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhum ritual estruturado registrado.</p>}</div></div>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-background/25 p-2"><p className="stamp text-[9px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>; }
function ErrorBox({ children }: { children: ReactNode }) { return <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{children}</p>; }
function trainingLabel(level: TrainingLevel) { return level === "DESTREINADO" ? "0" : level === "TREINADO" ? "+5" : level === "VETERANO" ? "+10" : "+15"; }
