import { useEffect, useState, type ReactNode } from "react";
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
import {
  CLASS_POWERS,
  PARANORMAL_POWERS,
  classPowerBlockReason,
  labelElement,
  paranormalPowerBlockReason,
  trailAbilityFor,
  type TrailAbilityNex,
} from "@/data/progressionCatalog";
import { ritualById, ritualsAvailable } from "@/data/rituals";
import { CharacterCreationWizard } from "@/components/player/CharacterCreationWizard";
import { AlertTriangle, Check, CircleDot, Plus, Sparkles, Trash2 } from "lucide-react";

const choiceId = () => `prog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const ritualEntryId = () => `rit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const normalizeLabel = (value: string) => value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function CharacterProgressionPanel({ sheet, editable, onChange }: {
  sheet: CharacterSheetData;
  editable: boolean;
  onChange: (next: CharacterSheetData) => void;
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [subSelections, setSubSelections] = useState<Record<string, string>>({});
  const [manualTranscending, setManualTranscending] = useState<Record<string, boolean>>({});
  const [manualParanormalChoice, setManualParanormalChoice] = useState<Record<string, "Aprender Ritual" | "Outro poder paranormal">>({});
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

  useEffect(() => {
    if (!editable || sheet.concept.freeMode || !sheet.concept.trail) return;
    const automatic = pending.filter((milestone) => milestone.kind === "HABILIDADE_TRILHA");
    if (!automatic.length) return;
    const entries: ProgressionChoice[] = automatic.map((milestone) => {
      const ability = trailAbilityFor(sheet.concept.className, sheet.concept.trail, milestone.nex as TrailAbilityNex);
      return {
        id: choiceId(),
        milestoneId: milestone.id,
        nex: milestone.nex,
        kind: milestone.kind,
        value: ability?.name ?? `Habilidade de trilha do NEX ${milestone.nex}%`,
        note: ability ? `${sheet.concept.trail} · ganho automático` : `${sheet.concept.trail} · ganho automático sem nome catalogado`,
        createdAt: new Date().toISOString(),
      };
    });
    onChange({ ...sheet, progression: { ...sheet.progression, choices: [...sheet.progression.choices, ...entries] } });
  }, [editable, onChange, pending, sheet]);

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
    setSelections((current) => ({ ...current, [milestone.id]: "" }));
    setSubSelections((current) => ({ ...current, [milestone.id]: "" }));
    setTrainingSelections((current) => ({ ...current, [milestone.id]: [] }));
    setError("");
  };

  const resolveStructured = (milestone: MilestoneDef) => {
    if (!editable) return;
    const selected = selections[milestone.id] ?? "";

    if (milestone.kind === "TRILHA") {
      if (!cls || !selected || !TRAILS_BY_CLASS[cls].includes(selected)) return setError("Escolha uma das trilhas mostradas abaixo.");
      const ability = trailAbilityFor(sheet.concept.className, selected, 10);
      addChoice(
        milestone,
        { value: selected, note: ability ? `Ganho automático em 10%: ${ability.name}` : "A habilidade de 10% é recebida automaticamente." },
        { concept: { ...sheet.concept, trail: selected } },
      );
      return;
    }

    if (milestone.kind === "HABILIDADE_TRILHA") {
      if (!sheet.concept.trail) return setError("Escolha sua trilha primeiro.");
      const ability = trailAbilityFor(sheet.concept.className, sheet.concept.trail, milestone.nex as TrailAbilityNex);
      addChoice(milestone, { value: ability?.name ?? `Habilidade de trilha do NEX ${milestone.nex}%`, note: `${sheet.concept.trail} · ganho automático` });
      return;
    }

    if (milestone.kind === "ATRIBUTO") {
      const attr = selected as OrdemAttribute;
      if (!ATTRIBUTES.some((item) => item.id === attr)) return setError("Escolha qual atributo vai aumentar.");
      if (!sheet.concept.freeMode && sheet.attributes[attr] >= 5) return setError(`${attr} já está no limite normal 5.`);
      addChoice(milestone, { value: attr }, { attributes: { ...sheet.attributes, [attr]: sheet.attributes[attr] + 1 } });
      return;
    }

    if (milestone.kind === "TREINAMENTO") {
      const milestoneNex = milestone.nex === 35 ? 35 : 70;
      const allowance = degreeTrainingAllowance(sheet.concept.className, sheet.attributes.INT);
      const candidates = degreeTrainingCandidates(milestoneNex, sheet.skills);
      const required = Math.min(allowance, candidates.length);
      const chosen = trainingSelections[milestone.id] ?? [];
      if (chosen.length !== required) return setError(`Escolha ${required} perícia(s) para melhorar.`);
      const candidateMap = new Map(candidates.map((item) => [item.skillId, item]));
      const skills = { ...sheet.skills };
      const labels: string[] = [];
      for (const skillId of chosen) {
        const candidate = candidateMap.get(skillId);
        if (!candidate) continue;
        skills[skillId] = { ...skills[skillId], training: candidate.to };
        const name = SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId;
        labels.push(`${name} ${trainingLabel(candidate.from)}→${trainingLabel(candidate.to)}`);
      }
      addChoice(milestone, { value: labels.join("; "), note: `${chosen.length}/${allowance} melhorias aplicadas.` }, { skills });
      return;
    }

    if (milestone.kind === "ELEMENTO") {
      const element = selected as ParanormalElement;
      if (!ELEMENTS.some((item) => item.id === element)) return setError("Escolha um elemento.");
      if (sheet.progression.elementLocked && !sheet.concept.freeMode) return setError("A conexão elemental já foi confirmada.");
      const entry: ProgressionChoice = { id: choiceId(), milestoneId: milestone.id, nex: milestone.nex, kind: milestone.kind, value: element, createdAt: new Date().toISOString() };
      onChange({ ...sheet, progression: { ...sheet.progression, element, elementLocked: !sheet.concept.freeMode, choices: [...sheet.progression.choices, entry] } });
      setError("");
      return;
    }

    if (milestone.kind === "VERSATILIDADE") {
      if (!selected) return setError("Escolha a habilidade extra que você quer receber.");
      if (selected.startsWith("trail:")) {
        const trail = selected.slice("trail:".length);
        if (!cls || trail === sheet.concept.trail || !TRAILS_BY_CLASS[cls].includes(trail)) return setError("Escolha outra trilha válida da sua classe.");
        const ability = trailAbilityFor(sheet.concept.className, trail, 10);
        addChoice(milestone, { value: `Versatilidade · ${trail} · ${ability?.name ?? "habilidade de 10%"}`, note: "Primeira habilidade de outra trilha da mesma classe." });
        return;
      }
      if (selected.startsWith("power:")) {
        const powerId = selected.slice("power:".length);
        const power = cls ? CLASS_POWERS[cls].find((item) => item.id === powerId) : undefined;
        if (!power) return setError("Escolha um poder válido.");
        const blocked = classPowerBlockReason(power, sheet, milestone.nex);
        if (blocked) return setError(blocked);
        addChoice(milestone, { value: `Versatilidade · ${power.name}`, grantsSkillTraining: power.id === "treinamento-pericia" ? 2 : undefined });
        return;
      }
      return setError("Escolha uma opção válida de Versatilidade.");
    }

    if (milestone.kind === "PODER") {
      if (!cls) return setError("A classe atual não possui catálogo automático de poderes.");
      if (!selected) return setError("Escolha um poder ou Transcender.");
      if (selected === "transcender") {
        const detail = subSelections[milestone.id] ?? "";
        if (detail === "ritual") {
          addChoice(milestone, { value: "Transcender · Aprender Ritual", transcender: true, grantsRitual: true, activatesAffinity: milestone.nex >= 50 && Boolean(sheet.progression.element) });
          return;
        }
        if (detail.startsWith("paranormal:")) {
          const powerId = detail.slice("paranormal:".length);
          const power = PARANORMAL_POWERS.find((item) => item.id === powerId);
          if (!power) return setError("Escolha um poder paranormal da lista.");
          const blocked = paranormalPowerBlockReason(power, sheet);
          if (blocked) return setError(blocked);
          addChoice(milestone, {
            value: `Transcender · ${power.name}`,
            transcender: true,
            activatesAffinity: milestone.nex >= 50 && Boolean(sheet.progression.element) && power.element === sheet.progression.element,
          });
          return;
        }
        return setError("Depois de Transcender, escolha Aprender Ritual ou um Poder Paranormal.");
      }
      if (selected.startsWith("class:")) {
        const powerId = selected.slice("class:".length);
        const power = CLASS_POWERS[cls].find((item) => item.id === powerId);
        if (!power) return setError("Escolha um poder válido da sua classe.");
        const blocked = classPowerBlockReason(power, sheet, milestone.nex);
        if (blocked) return setError(blocked);
        addChoice(milestone, { value: power.name, grantsSkillTraining: power.id === "treinamento-pericia" ? 2 : undefined });
        return;
      }
      return setError("Escolha uma opção válida.");
    }
  };

  const resolveFreeMode = (milestone: MilestoneDef) => {
    if (!editable) return;
    const draft = (selections[milestone.id] ?? "").trim();
    if (milestone.kind === "ATRIBUTO" || milestone.kind === "TREINAMENTO" || milestone.kind === "ELEMENTO") return resolveStructured(milestone);
    if (milestone.kind === "TRILHA") {
      if (!draft) return setError("Informe a trilha homebrew.");
      addChoice(milestone, { value: draft }, { concept: { ...sheet.concept, trail: draft } });
      return;
    }
    if (milestone.kind === "HABILIDADE_TRILHA") {
      if (!draft) return setError("Informe a habilidade homebrew.");
      addChoice(milestone, { value: draft });
      return;
    }
    if (milestone.kind === "VERSATILIDADE") {
      if (!draft) return setError("Registre a escolha homebrew.");
      addChoice(milestone, { value: draft });
      return;
    }
    if (milestone.kind === "PODER") {
      const transcending = Boolean(manualTranscending[milestone.id]);
      if (!transcending && !draft) return setError("Informe o poder homebrew.");
      if (transcending) {
        const paranormal = manualParanormalChoice[milestone.id] ?? "Outro poder paranormal";
        const detail = paranormal === "Aprender Ritual" ? "Aprender Ritual" : draft;
        if (!detail) return setError("Informe o poder paranormal homebrew.");
        addChoice(milestone, {
          value: `Transcender · ${detail}`,
          transcender: true,
          grantsRitual: paranormal === "Aprender Ritual",
          activatesAffinity: milestone.nex >= 50 && Boolean(sheet.progression.element) && Boolean(affinityChoice[milestone.id]),
        });
        return;
      }
      addChoice(milestone, { value: draft, grantsSkillTraining: normalizeLabel(draft) === "treinamento em pericia" ? 2 : undefined });
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

  const currentTrailAbility = sheet.concept.trail ? trailAbilityFor(sheet.concept.className, sheet.concept.trail, 10) : null;

  return <div className="space-y-4">
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="stamp text-primary">{sheet.concept.freeMode ? "Progressão livre / homebrew" : "Progressão guiada"}</p>
          <h2 className="font-display text-2xl">NEX {sheet.concept.nex}% · nível {sheet.concept.nex === 99 ? 20 : Math.round(sheet.concept.nex / 5)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{sheet.concept.freeMode ? "Modo livre ativo: nomes manuais continuam permitidos." : "Você não precisa conhecer as regras de Ordem. Quando houver uma escolha, o site mostra as opções válidas; quando o ganho for automático, ele aplica sozinho."}</p>
        </div>
        <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={!editable || previousNex(sheet.concept.nex) === null} onClick={() => { const value = previousNex(sheet.concept.nex); if (value !== null) setNex(value); }}>− NEX</Button><select aria-label="NEX" disabled={!editable} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" value={sheet.concept.nex} onChange={(event) => setNex(Number(event.target.value))}>{NEX_STEPS.map((value) => <option key={value} value={value}>{value}%</option>)}</select><Button size="sm" disabled={!editable || nextNex(sheet.concept.nex) === null} onClick={() => { const value = nextNex(sheet.concept.nex); if (value !== null) setNex(value); }}>+ NEX</Button></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Mini label="Classe" value={sheet.concept.className}/><Mini label="Trilha" value={sheet.concept.trail || (sheet.concept.nex >= 10 ? "escolha pendente" : "libera em 10%")}/><Mini label="Habilidade inicial" value={currentTrailAbility?.name ?? "—"}/><Mini label="Escolhas pendentes" value={String(pending.filter((item) => item.kind !== "HABILIDADE_TRILHA").length)}/><Mini label="PV máximo" value={derived ? String(derived.pvMax) : "—"}/><Mini label="PE máximo" value={derived ? String(derived.peMax) : "—"}/><Mini label="SAN máxima" value={derived ? String(derived.sanMax) : "—"}/><Mini label="PE / rodada" value={derived ? String(derived.peRoundLimit) : String(sheet.concept.pePerRound)}/></div>
      {sheet.progression.creation.status === "LEGADA" && <p className="mt-3 rounded-lg border border-route-amarelo/35 bg-route-amarelo/5 p-2 text-[11px] text-route-amarelo">Ficha antiga preservada: o sistema não apaga nem reescreve escolhas que já existiam.</p>}
    </section>

    {error && <ErrorBox>{error}</ErrorBox>}
    {issues.map((issue, index) => <p key={`${issue.message}-${index}`} className={`rounded-lg border p-3 text-xs ${issue.level === "erro" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-route-amarelo/40 bg-route-amarelo/5 text-route-amarelo"}`}><AlertTriangle className="mr-1 inline size-3.5"/>{issue.message}</p>)}

    <section className="rounded-xl border border-border bg-card/30 p-4">
      <div className="flex flex-wrap items-center gap-2"><div><p className="stamp text-primary">Agora</p><h3 className="font-semibold">O que você precisa fazer</h3><p className="mt-1 text-xs text-muted-foreground">Escolha somente quando o card disser “Escolha necessária”. Ganhos automáticos não exigem conhecimento das regras.</p></div><span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-xs">{pending.length}</span></div>
      <div className="mt-4 space-y-3">{pending.map((milestone) => <MilestoneCard key={milestone.id} milestone={milestone} sheet={sheet} cls={cls} selection={selections[milestone.id] ?? ""} setSelection={(value) => setSelections((current) => ({ ...current, [milestone.id]: value }))} subSelection={subSelections[milestone.id] ?? ""} setSubSelection={(value) => setSubSelections((current) => ({ ...current, [milestone.id]: value }))} manualTranscending={Boolean(manualTranscending[milestone.id])} setManualTranscending={(value) => setManualTranscending((current) => ({ ...current, [milestone.id]: value }))} manualParanormalChoice={manualParanormalChoice[milestone.id] ?? "Outro poder paranormal"} setManualParanormalChoice={(value) => setManualParanormalChoice((current) => ({ ...current, [milestone.id]: value }))} affinityChoice={Boolean(affinityChoice[milestone.id])} setAffinityChoice={(value) => setAffinityChoice((current) => ({ ...current, [milestone.id]: value }))} trainingSelection={trainingSelections[milestone.id] ?? []} setTrainingSelection={(value) => setTrainingSelections((current) => ({ ...current, [milestone.id]: value }))} editable={editable} onResolve={() => sheet.concept.freeMode ? resolveFreeMode(milestone) : resolveStructured(milestone)} />)}{pending.length === 0 && <div className="rounded-lg border border-route-verde/30 bg-route-verde/5 p-4 text-sm text-route-verde-claro"><Check className="mr-2 inline size-4"/>Tudo certo. Não há nenhuma escolha pendente neste NEX.</div>}</div>
    </section>

    {suspended.length > 0 && <section className="rounded-xl border border-route-amarelo/35 bg-route-amarelo/5 p-4"><p className="stamp text-route-amarelo">Escolhas suspensas</p><p className="mt-1 text-xs text-muted-foreground">O NEX foi reduzido. Essas escolhas continuam salvas e voltam a valer quando o NEX subir novamente.</p><div className="mt-2 flex flex-wrap gap-2">{suspended.map((choice) => <span key={choice.id} className="rounded-full border border-border px-2 py-1 text-xs">{choice.nex}% · {choice.value}</span>)}</div></section>}

    <section className="rounded-xl border border-border bg-card/30 p-4"><p className="stamp text-muted-foreground">O que seu personagem já ganhou</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{reachedMilestones(sheet.concept.nex).map((milestone) => { const choice = sheet.progression.choices.find((item) => item.milestoneId === milestone.id); const automatic = milestone.kind === "HABILIDADE_TRILHA"; return <div key={milestone.id} className={`rounded-lg border p-3 ${choice ? "border-route-verde/30 bg-route-verde/5" : "border-route-amarelo/30 bg-route-amarelo/5"}`}><div className="flex items-center gap-2"><CircleDot className="size-3.5"/><b className="text-sm">{friendlyMilestoneLabel(milestone)}</b><span className="ml-auto text-[10px] text-muted-foreground">{choice ? automatic ? "AUTOMÁTICO" : "RESOLVIDO" : "PENDENTE"}</span></div>{choice && <p className="mt-1 text-xs text-muted-foreground">{choice.value}</p>}</div>; })}</div></section>

    {sheet.progression.element && <section className="rounded-xl border border-border bg-card/30 p-4"><p className="stamp text-primary">Paranormal</p><div className="mt-2 flex flex-wrap items-center gap-3"><b>Conexão: {ELEMENTS.find((element) => element.id === sheet.progression.element)?.label}</b><span className={`rounded-full px-2 py-1 text-xs ${affinityActive(sheet.progression, sheet.concept.nex) ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{affinityActive(sheet.progression, sheet.concept.nex) ? "Afinidade efetivada" : "Afinidade ainda não efetivada"}</span>{sheet.progression.elementLocked && <span className="text-xs text-muted-foreground">escolha confirmada</span>}</div></section>}
  </div>;
}

function MilestoneCard({ milestone, sheet, cls, selection, setSelection, subSelection, setSubSelection, manualTranscending, setManualTranscending, manualParanormalChoice, setManualParanormalChoice, affinityChoice, setAffinityChoice, trainingSelection, setTrainingSelection, editable, onResolve }: {
  milestone: MilestoneDef;
  sheet: CharacterSheetData;
  cls: ReturnType<typeof baseClassOf>;
  selection: string;
  setSelection: (value: string) => void;
  subSelection: string;
  setSubSelection: (value: string) => void;
  manualTranscending: boolean;
  setManualTranscending: (value: boolean) => void;
  manualParanormalChoice: "Aprender Ritual" | "Outro poder paranormal";
  setManualParanormalChoice: (value: "Aprender Ritual" | "Outro poder paranormal") => void;
  affinityChoice: boolean;
  setAffinityChoice: (value: boolean) => void;
  trainingSelection: string[];
  setTrainingSelection: (value: string[]) => void;
  editable: boolean;
  onResolve: () => void;
}) {
  const automatic = !sheet.concept.freeMode && milestone.kind === "HABILIDADE_TRILHA";

  const trainingInput = () => {
    const nex = milestone.nex === 35 ? 35 : 70;
    const allowance = degreeTrainingAllowance(sheet.concept.className, sheet.attributes.INT);
    const candidates = degreeTrainingCandidates(nex, sheet.skills);
    const required = Math.min(allowance, candidates.length);
    return <div className="space-y-2"><p className="text-xs text-muted-foreground">Escolha quais perícias você mais usa. O sistema mostra somente as que podem melhorar agora.</p><div className="flex items-center justify-between text-xs"><span>{nex === 35 ? "Treinado +5 → Veterano +10" : "Melhore um grau; Expert +15 já está liberado"}</span><b>{trainingSelection.length}/{required} escolhidas</b></div><div className="grid gap-2 sm:grid-cols-2">{candidates.map((candidate) => { const skill = SKILLS.find((item) => item.id === candidate.skillId)!; const active = trainingSelection.includes(candidate.skillId); const atLimit = !active && trainingSelection.length >= required; return <button type="button" key={candidate.skillId} disabled={!editable || atLimit} onClick={() => setTrainingSelection(active ? trainingSelection.filter((id) => id !== candidate.skillId) : [...trainingSelection, candidate.skillId])} className={`rounded-lg border p-2 text-left text-xs ${active ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><b>{skill.name}</b><span className="ml-2 text-muted-foreground">{trainingLabel(candidate.from)} → {trainingLabel(candidate.to)}</span></button>; })}</div>{candidates.length < allowance && <p className="text-[11px] text-route-amarelo">Há somente {candidates.length} perícia(s) elegível(is) agora, então o sistema aceita todas as disponíveis.</p>}</div>;
  };

  const renderFreeMode = () => {
    if (milestone.kind === "ATRIBUTO") return <AttributeSelect sheet={sheet} editable={editable} value={selection} onChange={setSelection}/>;
    if (milestone.kind === "ELEMENTO") return <ElementSelect editable={editable} value={selection} onChange={setSelection}/>;
    if (milestone.kind === "TREINAMENTO") return trainingInput();
    if (milestone.kind === "PODER") return <div className="space-y-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={manualTranscending} onChange={(event) => setManualTranscending(event.target.checked)} />Transcender neste marco</label>{manualTranscending ? <><select className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={manualParanormalChoice} onChange={(event) => setManualParanormalChoice(event.target.value as typeof manualParanormalChoice)}><option>Outro poder paranormal</option><option>Aprender Ritual</option></select>{manualParanormalChoice === "Outro poder paranormal" && <Input placeholder="Nome do poder paranormal homebrew" value={selection} onChange={(event) => setSelection(event.target.value)} />}{milestone.nex >= 50 && sheet.progression.element && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={affinityChoice} onChange={(event) => setAffinityChoice(event.target.checked)} />Efetivar afinidade com o elemento</label>}</> : <Input placeholder="Nome do poder homebrew" value={selection} onChange={(event) => setSelection(event.target.value)} />}</div>;
    return <Input placeholder="Conteúdo manual / homebrew" value={selection} onChange={(event) => setSelection(event.target.value)} />;
  };

  const renderStructured = () => {
    if (milestone.kind === "TRILHA") {
      if (!cls) return <HintBox>Esta classe não possui trilhas automáticas. Ative o modo livre para conteúdo homebrew.</HintBox>;
      return <div className="grid gap-2 sm:grid-cols-2">{TRAILS_BY_CLASS[cls].map((trail) => { const ability = trailAbilityFor(sheet.concept.className, trail, 10); const active = selection === trail; return <button type="button" key={trail} disabled={!editable} onClick={() => setSelection(trail)} className={`rounded-xl border p-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border bg-background/30 hover:border-primary/40"}`}><b className="text-sm">{trail}</b><p className="mt-1 text-xs text-muted-foreground">Você recebe automaticamente: <b>{ability?.name ?? "habilidade de 10%"}</b></p>{ability?.hint && <p className="mt-1 text-[11px] text-muted-foreground">{ability.hint}</p>}</button>; })}</div>;
    }
    if (milestone.kind === "ATRIBUTO") return <><HintBox>Seu atributo escolhido aumenta em +1. O sistema atualiza a ficha automaticamente.</HintBox><AttributeSelect sheet={sheet} editable={editable} value={selection} onChange={setSelection}/></>;
    if (milestone.kind === "ELEMENTO") return <><HintBox>Escolha com qual elemento paranormal seu personagem tem maior conexão. Você só precisa clicar.</HintBox><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ELEMENTS.map((element) => <button type="button" key={element.id} disabled={!editable} onClick={() => setSelection(element.id)} className={`rounded-lg border p-3 text-sm ${selection === element.id ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><b>{element.label}</b></button>)}</div></>;
    if (milestone.kind === "TREINAMENTO") return trainingInput();
    if (milestone.kind === "HABILIDADE_TRILHA") {
      const ability = sheet.concept.trail ? trailAbilityFor(sheet.concept.className, sheet.concept.trail, milestone.nex as TrailAbilityNex) : null;
      return <div className="rounded-xl border border-route-verde/30 bg-route-verde/5 p-3"><div className="flex items-center gap-2"><Sparkles className="size-4 text-route-verde-claro"/><b>{ability?.name ?? `Habilidade de trilha do NEX ${milestone.nex}%`}</b><span className="ml-auto rounded-full bg-route-verde/15 px-2 py-1 text-[10px] text-route-verde-claro">AUTOMÁTICO</span></div><p className="mt-1 text-xs text-muted-foreground">{ability?.hint ?? "Este ganho vem da sua trilha e não exige nenhuma escolha."}</p></div>;
    }
    if (milestone.kind === "VERSATILIDADE") {
      if (!cls) return <HintBox>Versatilidade automática exige uma classe padrão.</HintBox>;
      const trails = TRAILS_BY_CLASS[cls].filter((trail) => trail !== sheet.concept.trail);
      const powers = CLASS_POWERS[cls];
      return <div className="space-y-3"><HintBox>Versatilidade dá uma habilidade extra. Escolha o primeiro poder de outra trilha da sua classe ou um poder da sua própria classe.</HintBox><div><Label>Quero a primeira habilidade de outra trilha</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{trails.map((trail) => { const ability = trailAbilityFor(sheet.concept.className, trail, 10); const value = `trail:${trail}`; return <button type="button" key={trail} disabled={!editable} onClick={() => setSelection(value)} className={`rounded-lg border p-2 text-left text-xs ${selection === value ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><b>{trail}</b><p className="mt-1 text-muted-foreground">Recebe: {ability?.name ?? "habilidade de 10%"}</p></button>; })}</div></div><div><Label>Ou quero um poder da minha classe</Label><select disabled={!editable} className="mt-2 w-full rounded-lg border border-input bg-background p-2 text-sm" value={selection.startsWith("power:") ? selection : ""} onChange={(event) => setSelection(event.target.value)}><option value="">Escolha um poder...</option>{powers.map((power) => { const blocked = classPowerBlockReason(power, sheet, milestone.nex); return <option key={power.id} value={`power:${power.id}`} disabled={Boolean(blocked)}>{power.name}{blocked ? ` — ${blocked}` : ""}</option>; })}</select></div></div>;
    }
    if (milestone.kind === "PODER") {
      if (!cls) return <HintBox>Esta classe não possui catálogo automático. Use modo livre para homebrew.</HintBox>;
      const powers = CLASS_POWERS[cls];
      const selectedPowerId = selection.startsWith("class:") ? selection.slice("class:".length) : "";
      const selectedPower = powers.find((power) => power.id === selectedPowerId);
      return <div className="space-y-3"><HintBox>Você ganhou uma escolha de poder. As opções que seu personagem ainda não pode pegar aparecem bloqueadas com o motivo.</HintBox><div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={!editable} onClick={() => { setSelection("transcender"); setSubSelection(""); }} className={`rounded-xl border p-3 text-left ${selection === "transcender" ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><b className="text-sm">Transcender</b><p className="mt-1 text-xs text-muted-foreground">Troque esta escolha por Aprender Ritual ou um Poder Paranormal.</p></button>{powers.map((power) => { const blocked = classPowerBlockReason(power, sheet, milestone.nex); const active = selection === `class:${power.id}`; return <button type="button" key={power.id} disabled={!editable || Boolean(blocked)} onClick={() => { setSelection(`class:${power.id}`); setSubSelection(""); }} className={`rounded-xl border p-3 text-left ${active ? "border-primary bg-primary/10" : blocked ? "cursor-not-allowed border-border bg-secondary/20 opacity-55" : "border-border bg-background/30 hover:border-primary/40"}`}><b className="text-sm">{power.name}</b><p className="mt-1 text-xs text-muted-foreground">{power.hint}</p>{blocked && <p className="mt-1 text-[11px] text-route-amarelo">{blocked}</p>}</button>; })}</div>{selectedPower && <p className="rounded-lg border border-primary/25 bg-primary/5 p-2 text-xs"><b>Selecionado:</b> {selectedPower.name} — {selectedPower.hint}</p>}{selection === "transcender" && <div className="rounded-xl border border-primary/25 bg-primary/5 p-3"><p className="text-sm font-semibold">O que você quer receber ao Transcender?</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><button type="button" disabled={!editable} onClick={() => setSubSelection("ritual")} className={`rounded-lg border p-2 text-left text-xs ${subSelection === "ritual" ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><b>Aprender Ritual</b><p className="mt-1 text-muted-foreground">Libera um espaço de ritual; depois você escolhe o ritual pelo catálogo na aba Poderes/Rituais.</p></button><button type="button" disabled={!editable} onClick={() => setSubSelection("paranormal:")} className={`rounded-lg border p-2 text-left text-xs ${subSelection.startsWith("paranormal:") ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><b>Poder Paranormal</b><p className="mt-1 text-muted-foreground">Escolha um poder sobrenatural da lista.</p></button></div>{subSelection.startsWith("paranormal:") && <div className="mt-3"><Label>Poder paranormal</Label><select disabled={!editable} className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm" value={subSelection} onChange={(event) => setSubSelection(event.target.value)}><option value="paranormal:">Escolha...</option>{PARANORMAL_POWERS.map((power) => { const blocked = paranormalPowerBlockReason(power, sheet); return <option key={power.id} value={`paranormal:${power.id}`} disabled={Boolean(blocked)}>{power.name}{power.element ? ` · ${labelElement(power.element)}` : ""}{blocked ? ` — ${blocked}` : ""}</option>; })}</select>{(() => { const id = subSelection.slice("paranormal:".length); const power = PARANORMAL_POWERS.find((item) => item.id === id); return power ? <p className="mt-2 text-xs text-muted-foreground">{power.hint}</p> : null; })()}</div>}</div>}</div>;
    }
    return null;
  };

  return <article className={`rounded-xl border p-3 ${automatic ? "border-route-verde/30 bg-route-verde/5" : "border-border bg-background/25"}`}><div className="flex flex-wrap items-start gap-2"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="stamp text-primary">NEX {milestone.nex}%</p><span className={`rounded-full px-2 py-0.5 text-[9px] ${automatic ? "bg-route-verde/15 text-route-verde-claro" : "bg-route-amarelo/15 text-route-amarelo"}`}>{automatic ? "GANHO AUTOMÁTICO" : "ESCOLHA NECESSÁRIA"}</span></div><h4 className="mt-1 font-semibold">{friendlyMilestoneLabel(milestone)}</h4><p className="mt-1 text-xs text-muted-foreground">{friendlyMilestoneHelp(milestone, sheet)}</p></div></div><div className="mt-3">{sheet.concept.freeMode ? renderFreeMode() : renderStructured()}</div><Button type="button" size="sm" className="mt-3" disabled={!editable} onClick={onResolve}><Check className="mr-1 size-3.5"/>{automatic ? "Confirmar ganho" : "Confirmar escolha"}</Button></article>;
}

function AttributeSelect({ sheet, editable, value, onChange }: { sheet: CharacterSheetData; editable: boolean; value: string; onChange: (value: string) => void }) {
  return <select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Escolha o atributo...</option>{ATTRIBUTES.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.id} — {attribute.label} (atual {sheet.attributes[attribute.id]})</option>)}</select>;
}

function ElementSelect({ editable, value, onChange }: { editable: boolean; value: string; onChange: (value: string) => void }) {
  return <select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Escolha o elemento...</option>{ELEMENTS.map((element) => <option key={element.id} value={element.id}>{element.label}</option>)}</select>;
}

function HintBox({ children }: { children: ReactNode }) { return <p className="mb-2 rounded-lg border border-border bg-secondary/25 p-2 text-xs text-muted-foreground">{children}</p>; }

function friendlyMilestoneLabel(milestone: MilestoneDef) {
  if (milestone.kind === "TRILHA") return "Escolha seu estilo de especialização (Trilha)";
  if (milestone.kind === "HABILIDADE_TRILHA") return `Nova habilidade automática da sua trilha`;
  if (milestone.kind === "PODER") return "Escolha um novo poder";
  if (milestone.kind === "ATRIBUTO") return "Aumente um atributo";
  if (milestone.kind === "TREINAMENTO") return "Melhore suas perícias";
  if (milestone.kind === "VERSATILIDADE") return "Versatilidade — escolha uma habilidade extra";
  if (milestone.kind === "ELEMENTO") return "Escolha sua conexão paranormal";
  return milestone.label;
}

function friendlyMilestoneHelp(milestone: MilestoneDef, sheet: CharacterSheetData) {
  if (sheet.concept.freeMode) return milestone.help;
  if (milestone.kind === "TRILHA") return "Cada trilha muda o estilo do personagem e já entrega uma primeira habilidade. Você não precisa escrever nada.";
  if (milestone.kind === "HABILIDADE_TRILHA") return "Esta habilidade vem automaticamente da trilha que você escolheu. O sistema cuida dela.";
  if (milestone.kind === "PODER") return "Escolha uma opção da sua classe ou Transcender. O site verifica os requisitos por você.";
  if (milestone.kind === "ATRIBUTO") return "Escolha um atributo; ele aumenta em +1 automaticamente.";
  if (milestone.kind === "TREINAMENTO") return "Escolha as perícias que quer melhorar entre as opções válidas.";
  if (milestone.kind === "VERSATILIDADE") return "Escolha uma habilidade inicial de outra trilha da sua classe ou um poder de classe válido.";
  if (milestone.kind === "ELEMENTO") return "Escolha Sangue, Morte, Conhecimento ou Energia. Não há campo de texto.";
  return milestone.help;
}

export function RitualManager({ sheet, editable, onChange }: { sheet: CharacterSheetData; editable: boolean; onChange: (next: CharacterSheetData) => void }) {
  const [element, setElement] = useState<RitualElement | "TODOS">("TODOS");
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const slots = ritualSlots({ className: sheet.concept.className, nex: sheet.concept.nex, choices: sheet.progression.choices });
  const access = hasRitualAccess({ className: sheet.concept.className, nex: sheet.concept.nex, choices: sheet.progression.choices });
  const circle = maxRitualCircle(sheet.concept.className, sheet.concept.nex, access);
  const knownIds = new Set(sheet.progression.knownRituals.map((ritual) => ritual.ritualId).filter(Boolean));
  const normalizedQuery = sheet.concept.freeMode ? query.trim().toLocaleLowerCase("pt-BR") : "";
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

  return <div className="space-y-4"><section className="rounded-xl border border-primary/25 bg-primary/5 p-4"><div className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><p className="stamp text-primary">Rituais guiados</p><h3 className="font-display text-xl">{sheet.progression.knownRituals.length}/{slots} conhecidos · círculo máximo {circle || "—"}</h3><p className="mt-1 text-xs text-muted-foreground">Escolha pelo catálogo. No modo padrão você nunca precisa digitar o nome de um ritual.</p></div></div></section>{access ? <section className="rounded-xl border border-border bg-card/30 p-4"><div className={`grid gap-2 ${sheet.concept.freeMode ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}><div><Label>Elemento</Label><select className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm" value={element} onChange={(event) => setElement(event.target.value as RitualElement | "TODOS")}><option value="TODOS">Todos</option><option value="SANGUE">Sangue</option><option value="MORTE">Morte</option><option value="CONHECIMENTO">Conhecimento</option><option value="ENERGIA">Energia</option><option value="MEDO">Medo</option></select></div>{sheet.concept.freeMode && <div><Label>Buscar (opcional)</Label><Input className="mt-1" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar pelo nome" /></div>}<div><Label>Ritual</Label><select className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Escolha...</option>{available.map((ritual) => <option key={ritual.id} value={ritual.id}>{ritual.name} · {ritual.circle}º · {ritual.element}</option>)}</select></div></div><Button type="button" className="mt-3" disabled={!editable || !selected || (!sheet.concept.freeMode && sheet.progression.knownRituals.length >= slots)} onClick={add}><Plus className="mr-1 size-4"/>Aprender ritual</Button></section> : <p className="rounded-xl border border-route-amarelo/35 bg-route-amarelo/5 p-3 text-xs text-route-amarelo">Esta ficha ainda não possui uma fonte válida de aprendizado de ritual.</p>}<div className="grid gap-2 md:grid-cols-2">{sheet.progression.knownRituals.map((ritual) => <article key={ritual.id} className="rounded-xl border border-border bg-background/25 p-3"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><b>{ritual.name}</b><p className="text-xs text-muted-foreground">{ritual.element} · {ritual.circle}º círculo {ritual.legacy ? "· migrado de card antigo" : ""}</p></div>{editable && <Button type="button" size="icon" variant="ghost" onClick={() => remove(ritual.id)}><Trash2 className="size-4"/></Button>}</div></article>)}{sheet.progression.knownRituals.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhum ritual conhecido ainda.</p>}</div></div>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-background/25 p-2"><p className="stamp text-[9px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>; }
function ErrorBox({ children }: { children: ReactNode }) { return <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{children}</p>; }
function trainingLabel(level: TrainingLevel) { return level === "DESTREINADO" ? "0" : level === "TREINADO" ? "+5" : level === "VETERANO" ? "+10" : "+15"; }
