import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATTRIBUTES, SKILLS, type CharacterSheetData, type OrdemAttribute } from "@/data/ordemRules";
import {
  ELEMENTS,
  NEX_STEPS,
  TRAILS_BY_CLASS,
  affinityActive,
  baseClassOf,
  derivedResources,
  eligibleTrainingUpgrades,
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
import { RITUALS, ritualById, ritualsAvailable } from "@/data/rituals";
import { AlertTriangle, Check, ChevronDown, ChevronUp, CircleDot, Plus, Sparkles, Trash2 } from "lucide-react";

const choiceId = () => `prog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const ritualEntryId = () => `rit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function CharacterProgressionPanel({ sheet, editable, onChange }: {
  sheet: CharacterSheetData;
  editable: boolean;
  onChange: (next: CharacterSheetData) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [transcending, setTranscending] = useState<Record<string, boolean>>({});
  const [paranormalChoice, setParanormalChoice] = useState<Record<string, "Aprender Ritual" | "Outro poder paranormal">>({});
  const [affinityChoice, setAffinityChoice] = useState<Record<string, boolean>>({});
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

  const addChoice = (milestone: MilestoneDef, choice: Omit<ProgressionChoice, "id" | "milestoneId" | "nex" | "kind" | "createdAt">, patch: Partial<CharacterSheetData> = {}) => {
    const alreadyDone = sheet.progression.choices.some((item) => item.milestoneId === milestone.id);
    if (alreadyDone) return;
    const entry: ProgressionChoice = {
      id: choiceId(), milestoneId: milestone.id, nex: milestone.nex, kind: milestone.kind,
      createdAt: new Date().toISOString(), ...choice,
    };
    onChange({
      ...sheet,
      ...patch,
      progression: { ...sheet.progression, choices: [...sheet.progression.choices, entry] },
    });
    setDrafts((current) => ({ ...current, [milestone.id]: "" }));
    setError("");
  };

  const resolve = (milestone: MilestoneDef) => {
    if (!editable) return;
    const draft = (drafts[milestone.id] ?? "").trim();

    if (milestone.kind === "TRILHA") {
      if (!cls || !draft) return setError("Escolha uma trilha da classe atual.");
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
      const upgrade = eligibleTrainingUpgrades(milestone.nex, sheet.skills);
      if (!upgrade.skillIds.includes(draft)) return setError(`Escolha uma perícia ${upgrade.from.toLowerCase()} elegível.`);
      addChoice(milestone, { value: draft }, { skills: { ...sheet.skills, [draft]: { ...sheet.skills[draft], training: upgrade.to } } });
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
      addChoice(milestone, { value: draft });
    }
  };

  const setNex = (nex: number) => {
    if (!editable) return;
    onChange({ ...sheet, concept: { ...sheet.concept, nex } });
    setError("");
  };

  return <div className="space-y-4">
    <section className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1"><p className="stamp text-primary">Progressão automática</p><h2 className="font-display text-2xl">NEX {sheet.concept.nex}% · nível {sheet.concept.nex === 99 ? 20 : sheet.concept.nex / 5}</h2><p className="mt-1 text-xs text-muted-foreground">Aumente o NEX e resolva as escolhas que forem liberadas. Nada acima do NEX é apagado se você reduzir depois.</p></div>
        <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={!editable || !previousNex(sheet.concept.nex)} onClick={() => { const value = previousNex(sheet.concept.nex); if (value) setNex(value); }}>− NEX</Button><select aria-label="NEX" disabled={!editable} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" value={sheet.concept.nex} onChange={(event) => setNex(Number(event.target.value))}>{NEX_STEPS.map((value) => <option key={value} value={value}>{value}%</option>)}</select><Button size="sm" disabled={!editable || !nextNex(sheet.concept.nex)} onClick={() => { const value = nextNex(sheet.concept.nex); if (value) setNex(value); }}>+ NEX</Button></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Classe" value={sheet.concept.className === "Custom" ? sheet.concept.customClass || "Custom" : sheet.concept.className}/>
        <Mini label="Trilha" value={sheet.concept.trail || (sheet.concept.nex >= 10 ? "pendente" : "libera em 10%")}/>
        <Mini label="Elemento" value={sheet.progression.element ? ELEMENTS.find((element) => element.id === sheet.progression.element)?.label ?? sheet.progression.element : (sheet.concept.nex >= 50 ? "pendente" : "libera em 50%")}/>
        <Mini label="Escolhas pendentes" value={String(pending.length)}/>
        <Mini label="PV máximo" value={derived ? String(derived.pvMax) : String(sheet.resources.pvMax)}/>
        <Mini label="PE máximo" value={derived ? String(derived.peMax) : String(sheet.resources.peMax)}/>
        <Mini label="SAN máxima" value={derived ? String(derived.sanMax) : String(sheet.resources.sanMax)}/>
        <Mini label="PE / rodada" value={derived ? String(derived.peRoundLimit) : String(sheet.concept.pePerRound)}/>
      </div>
      {derived && <p className="mt-3 text-[11px] text-muted-foreground">Quando um máximo muda, a ficha preserva a quantidade já perdida/gasta. Ex.: 15/20 PV vira 20/25, mantendo 5 PV de dano.</p>}
    </section>

    {sheet.concept.className === "Custom" && <Notice>Classe Custom está em modo manual. Escolha Combatente, Especialista ou Ocultista para ativar cálculos e trilhas automáticas.</Notice>}
    {error && <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {issues.map((issue, index) => <p key={`${issue.message}-${index}`} className={`rounded-lg border p-3 text-xs ${issue.level === "erro" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-route-amarelo/40 bg-route-amarelo/5 text-route-amarelo"}`}><AlertTriangle className="mr-1 inline size-3.5"/>{issue.message}</p>)}

    <section className="rounded-xl border border-border bg-card/30 p-4">
      <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Pendências</p><h3 className="font-semibold">Escolhas liberadas pelo NEX</h3></div><span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-xs">{pending.length}</span></div>
      <div className="mt-4 space-y-3">{pending.map((milestone) => <MilestoneCard key={milestone.id} milestone={milestone} sheet={sheet} cls={cls} draft={drafts[milestone.id] ?? ""} setDraft={(value) => setDrafts((current) => ({ ...current, [milestone.id]: value }))} transcending={Boolean(transcending[milestone.id])} setTranscending={(value) => setTranscending((current) => ({ ...current, [milestone.id]: value }))} paranormalChoice={paranormalChoice[milestone.id] ?? "Outro poder paranormal"} setParanormalChoice={(value) => setParanormalChoice((current) => ({ ...current, [milestone.id]: value }))} affinityChoice={Boolean(affinityChoice[milestone.id])} setAffinityChoice={(value) => setAffinityChoice((current) => ({ ...current, [milestone.id]: value }))} editable={editable} onResolve={() => resolve(milestone)}/>) }{pending.length === 0 && <div className="rounded-lg border border-route-verde/30 bg-route-verde/5 p-4 text-sm text-route-verde-claro"><Check className="mr-2 inline size-4"/>Todos os marcos alcançados estão resolvidos.</div>}</div>
    </section>

    {suspended.length > 0 && <section className="rounded-xl border border-route-amarelo/35 bg-route-amarelo/5 p-4"><p className="stamp text-route-amarelo">Escolhas suspensas</p><p className="mt-1 text-xs text-muted-foreground">O NEX foi reduzido. Estas escolhas foram preservadas e voltam a valer quando o NEX alcançá-las novamente.</p><div className="mt-2 flex flex-wrap gap-2">{suspended.map((choice) => <span key={choice.id} className="rounded-full border border-border px-2 py-1 text-xs">{choice.nex}% · {choice.value}</span>)}</div></section>}

    <section className="rounded-xl border border-border bg-card/30 p-4"><p className="stamp text-muted-foreground">Linha de progressão</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{reachedMilestones(sheet.concept.nex).map((milestone) => { const choice = sheet.progression.choices.find((item) => item.milestoneId === milestone.id); return <div key={milestone.id} className={`rounded-lg border p-3 ${choice ? "border-route-verde/30 bg-route-verde/5" : "border-route-amarelo/30 bg-route-amarelo/5"}`}><div className="flex items-center gap-2"><CircleDot className="size-3.5"/><b className="text-sm">{milestone.label}</b><span className="ml-auto text-[10px] text-muted-foreground">{choice ? "RESOLVIDO" : "PENDENTE"}</span></div>{choice && <p className="mt-1 text-xs text-muted-foreground">{choice.value}</p>}</div>; })}</div></section>

    {sheet.progression.element && <section className="rounded-xl border border-border bg-card/30 p-4"><p className="stamp text-primary">Paranormal</p><div className="mt-2 flex flex-wrap items-center gap-3"><b>Conexão: {ELEMENTS.find((element) => element.id === sheet.progression.element)?.label}</b><span className={`rounded-full px-2 py-1 text-xs ${affinityActive(sheet.progression, sheet.concept.nex) ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{affinityActive(sheet.progression, sheet.concept.nex) ? "Afinidade efetivada" : "Afinidade ainda não efetivada"}</span>{sheet.progression.elementLocked && <span className="text-xs text-muted-foreground">escolha travada</span>}{sheet.concept.freeMode && <Button size="sm" variant="ghost" onClick={() => onChange({ ...sheet, progression: { ...sheet.progression, elementLocked: false } })}>Destravar no modo livre</Button>}</div></section>}
  </div>;
}

function MilestoneCard({ milestone, sheet, cls, draft, setDraft, transcending, setTranscending, paranormalChoice, setParanormalChoice, affinityChoice, setAffinityChoice, editable, onResolve }: {
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
  editable: boolean;
  onResolve: () => void;
}) {
  const training = milestone.kind === "TREINAMENTO" ? eligibleTrainingUpgrades(milestone.nex, sheet.skills) : null;
  return <div className="rounded-xl border border-border/80 bg-background/35 p-3"><div><p className="text-sm font-semibold">{milestone.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{milestone.help}</p></div><div className="mt-3 space-y-2">
    {milestone.kind === "TRILHA" && <select disabled={!editable || !cls} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)}><option value="">Escolha a trilha…</option>{cls && TRAILS_BY_CLASS[cls].map((trail) => <option key={trail}>{trail}</option>)}</select>}
    {milestone.kind === "ATRIBUTO" && <select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)}><option value="">Escolha o atributo…</option>{ATTRIBUTES.map((attr) => <option key={attr.id} value={attr.id} disabled={!sheet.concept.freeMode && sheet.attributes[attr.id] >= 5}>{attr.label} ({attr.id}) · atual {sheet.attributes[attr.id]}</option>)}</select>}
    {milestone.kind === "TREINAMENTO" && <select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)}><option value="">Escolha a perícia…</option>{training?.skillIds.map((id) => <option key={id} value={id}>{SKILLS.find((skill) => skill.id === id)?.name ?? id} · {training.from} → {training.to}</option>)}</select>}
    {milestone.kind === "ELEMENTO" && <select disabled={!editable || (sheet.progression.elementLocked && !sheet.concept.freeMode)} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)}><option value="">Escolha o elemento…</option>{ELEMENTS.map((element) => <option key={element.id} value={element.id}>{element.label}</option>)}</select>}
    {milestone.kind === "VERSATILIDADE" && <Input disabled={!editable} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Qual escolha de Versatilidade?"/>}
    {milestone.kind === "HABILIDADE_TRILHA" && <p className="rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground">{sheet.concept.trail ? `${sheet.concept.trail} · marco de ${milestone.nex}%` : "Escolha a trilha antes de confirmar este marco."}</p>}
    {milestone.kind === "PODER" && <><label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"><input type="checkbox" disabled={!editable} checked={transcending} onChange={(event) => setTranscending(event.target.checked)}/>Escolher <b>Transcender</b> neste marco</label>{transcending ? <div className="space-y-2"><select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={paranormalChoice} onChange={(event) => setParanormalChoice(event.target.value as typeof paranormalChoice)}><option>Outro poder paranormal</option><option>Aprender Ritual</option></select>{paranormalChoice === "Outro poder paranormal" && <Input disabled={!editable} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nome do poder paranormal"/>}{milestone.nex >= 50 && sheet.progression.element && <label className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs"><input type="checkbox" checked={affinityChoice} onChange={(event) => setAffinityChoice(event.target.checked)}/>Esta escolha efetiva minha afinidade com {ELEMENTS.find((element) => element.id === sheet.progression.element)?.label}</label>}<p className="text-[11px] text-route-amarelo">Transcender substitui o ganho de SAN deste avanço.</p></div> : <Input disabled={!editable} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nome do poder de classe"/>}</>}
    <Button size="sm" disabled={!editable} onClick={onResolve}><Check className="mr-1 size-3.5"/>Confirmar marco</Button>
  </div></div>;
}

export function RitualManager({ sheet, editable, onChange }: { sheet: CharacterSheetData; editable: boolean; onChange: (next: CharacterSheetData) => void }) {
  const [element, setElement] = useState<RitualElement | "TODOS">("TODOS");
  const [circle, setCircle] = useState<number>(0);
  const [search, setSearch] = useState("");
  const slots = ritualSlots({ className: sheet.concept.className, nex: sheet.concept.nex, choices: sheet.progression.choices });
  const access = hasRitualAccess({ className: sheet.concept.className, nex: sheet.concept.nex, choices: sheet.progression.choices });
  const maxCircle = maxRitualCircle(sheet.concept.className, sheet.concept.nex, access);
  const used = sheet.progression.knownRituals.length;
  const available = useMemo(() => ritualsAvailable({ maxCircle: circle || maxCircle, element }).filter((ritual) => !search.trim() || ritual.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))), [circle, element, maxCircle, search]);
  const canAdd = editable && (sheet.concept.freeMode || used < slots);

  const add = (ritualId: string) => {
    const ritual = ritualById(ritualId);
    if (!ritual || !canAdd) return;
    if (!sheet.concept.freeMode && ritual.circle > maxCircle) return;
    if (sheet.progression.knownRituals.some((known) => known.ritualId === ritual.id)) return;
    onChange({ ...sheet, progression: { ...sheet.progression, knownRituals: [...sheet.progression.knownRituals, { id: ritualEntryId(), ritualId: ritual.id, name: ritual.name, element: ritual.element, circle: ritual.circle }] } });
  };
  const remove = (id: string) => onChange({ ...sheet, progression: { ...sheet.progression, knownRituals: sheet.progression.knownRituals.filter((ritual) => ritual.id !== id) } });
  const updateNote = (id: string, note: string) => onChange({ ...sheet, progression: { ...sheet.progression, knownRituals: sheet.progression.knownRituals.map((ritual) => ritual.id === id ? { ...ritual, note } : ritual) } });

  return <div className="space-y-4"><div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex flex-wrap items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10"><Sparkles className="size-5 text-primary"/></div><div><p className="stamp text-primary">Rituais estruturados</p><h3 className="font-semibold">{used} / {slots} conhecidos · até {maxCircle > 0 ? `${maxCircle}º círculo` : "sem acesso"}</h3></div></div>{baseClassOf(sheet.concept.className) === "Ocultista" && <p className="mt-2 text-xs text-muted-foreground">Ocultista começa com 3 rituais e ganha +1 a cada avanço de NEX. O catálogo libera círculos automaticamente.</p>}{baseClassOf(sheet.concept.className) !== "Ocultista" && <p className="mt-2 text-xs text-muted-foreground">Combatente/Especialista só recebem espaço quando uma escolha de progressão concede explicitamente <b>Aprender Ritual</b>.</p>}</div>

    <div className="grid gap-3 lg:grid-cols-2"><section className="rounded-xl border border-border p-3"><p className="stamp text-muted-foreground">Conhecidos</p><div className="mt-3 space-y-2">{sheet.progression.knownRituals.map((ritual) => <div key={ritual.id} className="rounded-lg border border-border bg-card/30 p-3"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><b className="text-sm">{ritual.name}</b><p className="text-[11px] text-muted-foreground">{ritual.element} · {ritual.circle}º círculo {ritual.legacy ? "· legado reconhecido" : ""}</p></div>{editable && <Button size="sm" variant="ghost" aria-label={`Remover ${ritual.name}`} onClick={() => remove(ritual.id)}><Trash2 className="size-3.5"/></Button>}</div><Input className="mt-2 h-8 text-xs" disabled={!editable} value={ritual.note ?? ""} onChange={(event) => updateNote(ritual.id, event.target.value)} placeholder="Nota curta própria (opcional)"/></div>)}{used === 0 && <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Nenhum ritual estruturado registrado.</p>}</div></section>

      <section className="rounded-xl border border-border p-3"><p className="stamp text-muted-foreground">Catálogo disponível</p><div className="mt-3 grid grid-cols-2 gap-2"><select className="rounded-lg border border-input bg-background p-2 text-xs" value={element} onChange={(event) => setElement(event.target.value as RitualElement | "TODOS")}><option value="TODOS">Todos elementos</option><option value="SANGUE">Sangue</option><option value="MORTE">Morte</option><option value="CONHECIMENTO">Conhecimento</option><option value="ENERGIA">Energia</option><option value="MEDO">Medo</option></select><select className="rounded-lg border border-input bg-background p-2 text-xs" value={circle} onChange={(event) => setCircle(Number(event.target.value))}><option value={0}>Até {maxCircle || "—"}º círculo</option>{[1,2,3,4].filter((value) => value <= maxCircle || sheet.concept.freeMode).map((value) => <option key={value} value={value}>{value}º círculo</option>)}</select></div><Input className="mt-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ritual…"/><div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">{available.map((ritual) => { const duplicate = sheet.progression.knownRituals.some((known) => known.ritualId === ritual.id); return <div key={ritual.id} className="flex items-center gap-2 rounded-lg border border-border/70 p-2"><div className="min-w-0 flex-1"><b className="text-xs">{ritual.name}</b><p className="text-[10px] text-muted-foreground">{ritual.element} · {ritual.circle}º</p></div><Button size="sm" variant="outline" disabled={!canAdd || duplicate} onClick={() => add(ritual.id)}>{duplicate ? <Check className="size-3.5"/> : <Plus className="size-3.5"/>}</Button></div>; })}</div>{!sheet.concept.freeMode && used >= slots && <p className="mt-2 text-xs text-route-amarelo">Todos os espaços de ritual atuais estão ocupados.</p>}</section></div>
  </div>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border/70 bg-background/35 p-2.5"><p className="stamp text-[9px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>; }
function Notice({ children }: { children: React.ReactNode }) { return <div className="rounded-lg border border-route-amarelo/40 bg-route-amarelo/5 p-3 text-sm text-route-amarelo"><AlertTriangle className="mr-2 inline size-4"/>{children}</div>; }
