import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATTRIBUTES, SKILLS, creationPointsUsed, type CharacterSheetData, type OrdemAttribute, type TrainingLevel } from "@/data/ordemRules";
import {
  CLASS_SKILL_RULES,
  baseClassOf,
  derivedResources,
  initialFreeSkillAllowance,
  type OrdemBaseClass,
} from "@/data/ordemProgression";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Shield, Sparkles } from "lucide-react";

const CLASS_CARDS: Array<{ id: OrdemBaseClass; title: string; summary: string }> = [
  { id: "Combatente", title: "Combatente", summary: "Mais resistente e focado em confronto direto; possui escolhas obrigatórias de combate e resistência." },
  { id: "Especialista", title: "Especialista", summary: "Maior variedade de perícias e flexibilidade para investigação, suporte e soluções técnicas." },
  { id: "Ocultista", title: "Ocultista", summary: "Ligado ao paranormal; começa treinado em Ocultismo e Vontade e progride com rituais." },
];

const STEP_LABELS = ["Conceito", "Classe", "Atributos", "Perícias", "Revisão"];

export function CharacterCreationWizard({ sheet, editable, onChange }: {
  sheet: CharacterSheetData;
  editable: boolean;
  onChange: (next: CharacterSheetData) => void;
}) {
  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [error, setError] = useState("");
  const creation = sheet.progression.creation;
  const cls = baseClassOf(sheet.concept.className);
  const points = useMemo(() => creationPointsUsed(sheet.attributes), [sheet.attributes]);
  const skillRule = cls ? CLASS_SKILL_RULES[cls] : null;
  const freeAllowance = cls ? initialFreeSkillAllowance(cls, sheet.attributes.INT) : 0;
  const mandatory = creation.mandatorySkills;
  const freeSkills = creation.initialFreeSkills;
  const selectedSet = new Set([...mandatory, ...freeSkills]);

  const updateCreation = (patch: Partial<typeof creation>) => {
    onChange({
      ...sheet,
      progression: { ...sheet.progression, creation: { ...creation, ...patch } },
    });
  };

  const updateAttribute = (attr: OrdemAttribute, delta: number) => {
    if (!editable) return;
    const current = sheet.attributes[attr];
    const next = Math.max(0, Math.min(3, current + delta));
    if (next === current) return;
    const candidate = { ...sheet.attributes, [attr]: next };
    const check = creationPointsUsed(candidate);
    if (!check.valid) return;
    onChange({ ...sheet, attributes: candidate });
    setError("");
  };

  const chooseClass = (className: OrdemBaseClass) => {
    if (!editable) return;
    const rule = CLASS_SKILL_RULES[className];
    const resetSkills = Object.fromEntries(Object.entries(sheet.skills).map(([id, value]) => [id, { ...value, training: "DESTREINADO" as TrainingLevel }]));
    onChange({
      ...sheet,
      concept: { ...sheet.concept, className, customClass: "", trail: "" },
      skills: resetSkills,
      progression: {
        ...sheet.progression,
        creation: {
          ...creation,
          status: "NOVA",
          classAtCreation: className,
          mandatorySkills: [...rule.fixed],
          initialFreeSkills: [],
        },
      },
    });
    setError("");
  };

  const chooseMandatoryFromGroup = (groupIndex: number, skillId: string) => {
    if (!skillRule) return;
    const groups = skillRule.requiredGroups;
    const previousGroupMembers = new Set(groups[groupIndex] ?? []);
    const retained = mandatory.filter((id) => !previousGroupMembers.has(id));
    const nextMandatory = [...new Set([...skillRule.fixed, ...retained, skillId])];
    onChange({
      ...sheet,
      progression: {
        ...sheet.progression,
        creation: {
          ...creation,
          mandatorySkills: nextMandatory,
          initialFreeSkills: freeSkills.filter((id) => !nextMandatory.includes(id)),
        },
      },
    });
  };

  const toggleFreeSkill = (skillId: string) => {
    if (!editable || mandatory.includes(skillId)) return;
    const exists = freeSkills.includes(skillId);
    if (exists) {
      updateCreation({ initialFreeSkills: freeSkills.filter((id) => id !== skillId) });
      return;
    }
    if (freeSkills.length >= freeAllowance) return;
    updateCreation({ initialFreeSkills: [...freeSkills, skillId] });
  };

  const canAdvanceStep = () => {
    if (step === 2) return Boolean(cls);
    if (step === 3) return points.complete;
    if (step === 4) {
      if (!cls || !skillRule) return false;
      const groupsComplete = skillRule.requiredGroups.every((group) => group.some((id) => mandatory.includes(id)));
      return groupsComplete && freeSkills.length === freeAllowance;
    }
    return true;
  };

  const nextStep = () => {
    if (!canAdvanceStep()) {
      if (step === 2) setError("Escolha uma classe para continuar.");
      else if (step === 3) setError(`Distribua todos os pontos de atributo. Restam ${points.remaining}.`);
      else if (step === 4) setError("Complete todas as escolhas de perícia antes de revisar.");
      return;
    }
    setError("");
    setStep((value) => {
      const next = Math.min(5, value + 1);
      setFurthestStep((current) => Math.max(current, next));
      return next;
    });
  };

  const complete = () => {
    if (!editable || !cls || !skillRule || !points.complete) return;
    const groupsComplete = skillRule.requiredGroups.every((group) => group.some((id) => mandatory.includes(id)));
    if (!groupsComplete || freeSkills.length !== freeAllowance) {
      setError("A criação ainda possui escolhas de perícia pendentes.");
      return;
    }

    const trained = new Set([...mandatory, ...freeSkills]);
    const skills = Object.fromEntries(Object.entries(sheet.skills).map(([id, value]) => [
      id,
      { ...value, training: trained.has(id) ? "TREINADO" as TrainingLevel : "DESTREINADO" as TrainingLevel },
    ]));
    const nex = 5;
    const derived = derivedResources({ className: cls, nex, attributes: sheet.attributes, choices: sheet.progression.choices });
    onChange({
      ...sheet,
      concept: { ...sheet.concept, className: cls, nex, pePerRound: derived?.peRoundLimit ?? 1 },
      skills,
      resources: derived ? {
        ...sheet.resources,
        pv: derived.pvMax,
        pvMax: derived.pvMax,
        pe: derived.peMax,
        peMax: derived.peMax,
        san: derived.sanMax,
        sanMax: derived.sanMax,
      } : sheet.resources,
      progression: {
        ...sheet.progression,
        creation: {
          ...creation,
          status: "CONCLUIDA",
          classAtCreation: cls,
          initialInt: sheet.attributes.INT,
          maxIntGranted: sheet.attributes.INT,
          mandatorySkills: [...mandatory],
          initialFreeSkills: [...freeSkills],
          bonusIntSkills: [],
          completedAt: new Date().toISOString(),
        },
      },
    });
    setError("");
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card/30 shadow-lg shadow-black/20">
      <div className="border-b border-border/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Shield className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="stamp text-primary">Criação guiada · NEX 0%</p>
            <h2 className="font-display text-2xl">Prepare o agente antes da primeira exposição</h2>
            <p className="mt-1 text-xs text-muted-foreground">A ficha só entra em NEX 5% depois que atributos, classe e perícias iniciais estiverem válidos.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {STEP_LABELS.map((label, index) => {
            const number = index + 1;
            const active = step === number;
            const done = step > number;
            return <button type="button" key={label} disabled={number > furthestStep} onClick={() => { if (number <= furthestStep) { setError(""); setStep(number); } }} className={`rounded-lg border px-2 py-2 text-[10px] sm:text-xs ${active ? "border-primary bg-primary text-primary-foreground" : done ? "border-route-verde/30 bg-route-verde/10 text-route-verde-claro" : number > furthestStep ? "border-border bg-background/20 text-muted-foreground/40 cursor-not-allowed" : "border-border bg-background/40 text-muted-foreground"}`}><span className="hidden sm:inline">{number}. </span>{label}</button>;
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {step === 1 && <div className="space-y-4">
          <div><Label htmlFor="creation-origin">Origem / conceito</Label><Input id="creation-origin" disabled={!editable} className="mt-1" value={sheet.concept.origin} onChange={(event) => onChange({ ...sheet, concept: { ...sheet.concept, origin: event.target.value } })} placeholder="Ex.: universitário, policial, pesquisador..." /></div>
          <p className="rounded-xl border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">O campo continua livre porque o projeto não precisa copiar um catálogo completo de origens. Você pode usar a origem oficial ou uma opção definida pelo mestre.</p>
        </div>}

        {step === 3 && <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3"><div><p className="stamp text-primary">Atributos iniciais</p><h3 className="text-lg font-semibold">Distribua os pontos</h3></div><div className={`ml-auto rounded-xl border px-3 py-2 text-sm ${points.complete ? "border-route-verde/40 bg-route-verde/10" : "border-primary/30 bg-primary/5"}`}><b>{points.spent}/{points.budget}</b> usados · <b>{points.remaining}</b> restantes</div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{ATTRIBUTES.map((attribute) => <div key={attribute.id} className="rounded-xl border border-border bg-background/35 p-3 text-center"><p className="stamp text-muted-foreground">{attribute.id}</p><p className="text-xs">{attribute.label}</p><div className="mt-3 flex items-center justify-center gap-2"><Button type="button" size="icon" variant="outline" disabled={!editable || sheet.attributes[attribute.id] <= 0} onClick={() => updateAttribute(attribute.id, -1)}><Minus className="size-4" /></Button><span className="w-8 font-mono text-2xl font-bold">{sheet.attributes[attribute.id]}</span><Button type="button" size="icon" variant="outline" disabled={!editable || sheet.attributes[attribute.id] >= 3} onClick={() => updateAttribute(attribute.id, 1)}><Plus className="size-4" /></Button></div></div>)}</div>
          <p className="text-xs text-muted-foreground">Todos começam em 1. Você distribui 4 pontos; pode reduzir no máximo um atributo para 0 e, nesse caso, recebe um ponto extra. Máximo 3 durante a criação padrão.</p>
        </div>}

        {step === 2 && <div className="space-y-4">
          <div><p className="stamp text-primary">Classe</p><h3 className="text-lg font-semibold">Como este agente enfrenta o desconhecido?</h3></div>
          <div className="grid gap-3 md:grid-cols-3">{CLASS_CARDS.map((card) => { const active = cls === card.id; return <button type="button" key={card.id} disabled={!editable} onClick={() => chooseClass(card.id)} className={`rounded-xl border p-4 text-left transition-all ${active ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border bg-background/30 hover:border-primary/40"}`}><div className="flex items-center gap-2"><Sparkles className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`} /><b>{card.title}</b>{active && <Check className="ml-auto size-4 text-route-verde-claro" />}</div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{card.summary}</p></button>; })}</div>
        </div>}

        {step === 4 && <div className="space-y-4">
          {!cls || !skillRule ? <p className="rounded-xl border border-route-amarelo/40 bg-route-amarelo/10 p-3 text-sm">Escolha uma classe primeiro.</p> : <>
            <div className="flex flex-wrap items-end gap-3"><div><p className="stamp text-primary">Perícias iniciais · {cls}</p><h3 className="text-lg font-semibold">Escolha o treinamento +5</h3></div><div className={`ml-auto rounded-xl border px-3 py-2 text-sm ${freeSkills.length === freeAllowance ? "border-route-verde/40 bg-route-verde/10" : "border-primary/30 bg-primary/5"}`}><b>{freeSkills.length}/{freeAllowance}</b> livres</div></div>
            {skillRule.fixed.length > 0 && <div className="rounded-xl border border-route-verde/30 bg-route-verde/5 p-3 text-sm"><b>Automáticas da classe:</b> {skillRule.fixed.map((id) => SKILLS.find((skill) => skill.id === id)?.name ?? id).join(" e ")}.</div>}
            {skillRule.requiredGroups.map((group, groupIndex) => <div key={group.join("-")} className="rounded-xl border border-border p-3"><Label>Escolha obrigatória {groupIndex + 1}</Label><div className="mt-2 grid grid-cols-2 gap-2">{group.map((id) => { const skill = SKILLS.find((item) => item.id === id)!; const active = mandatory.includes(id); return <button type="button" key={id} disabled={!editable} onClick={() => chooseMandatoryFromGroup(groupIndex, id)} className={`rounded-lg border p-2 text-sm ${active ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}>{skill.name} <span className="text-xs text-muted-foreground">({skill.attribute})</span></button>; })}</div></div>)}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SKILLS.map((skill) => { const locked = mandatory.includes(skill.id); const selected = freeSkills.includes(skill.id); const atLimit = !selected && freeSkills.length >= freeAllowance; return <button type="button" key={skill.id} disabled={!editable || locked || atLimit} onClick={() => toggleFreeSkill(skill.id)} className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm ${locked ? "border-route-verde/30 bg-route-verde/5 opacity-80" : selected ? "border-primary/50 bg-primary/10" : "border-border bg-background/25 hover:border-primary/30"}`}><span className={`flex size-5 items-center justify-center rounded border ${locked || selected ? "border-primary/50 bg-primary text-primary-foreground" : "border-border"}`}>{(locked || selected) && <Check className="size-3" />}</span><span className="min-w-0 flex-1 truncate">{skill.name}</span><span className="stamp text-[9px] text-muted-foreground">{skill.attribute}</span>{locked && <span className="text-[9px] text-route-verde-claro">classe</span>}</button>; })}</div>
          </>}
        </div>}

        {step === 5 && <div className="space-y-4">
          <div><p className="stamp text-primary">Revisão</p><h3 className="text-lg font-semibold">Pronto para entrar em NEX 5%</h3></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Review label="Origem" value={sheet.concept.origin || "não informada"} /><Review label="Classe" value={cls ?? "pendente"} /><Review label="Atributos" value={ATTRIBUTES.map((a) => `${a.id} ${sheet.attributes[a.id]}`).join(" · ")} /><Review label="Perícias +5" value={`${selectedSet.size} treinadas`} /></div>
          {cls && (() => { const result = derivedResources({ className: cls, nex: 5, attributes: sheet.attributes, choices: sheet.progression.choices }); return result ? <div className="grid grid-cols-4 gap-2"><Review label="PV" value={String(result.pvMax)} /><Review label="PE" value={String(result.peMax)} /><Review label="SAN" value={String(result.sanMax)} /><Review label="PE/rodada" value={String(result.peRoundLimit)} /></div> : null; })()}
          <div className="rounded-xl border border-border bg-secondary/20 p-3 text-xs text-muted-foreground"><b>Próximos limites:</b> até NEX 34% o maior grau normal de perícia é Treinado (+5). Em NEX 35% libera Veterano (+10), e em NEX 70% libera Expert (+15). A ficha vai avisar automaticamente quantas perícias podem subir em cada marco.</div>
          <Button type="button" className="w-full" size="lg" disabled={!editable || !cls || !points.complete || freeSkills.length !== freeAllowance} onClick={complete}><Sparkles className="mr-2 size-4" />Concluir e entrar em NEX 5%</Button>
        </div>}

        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
          <Button type="button" variant="ghost" disabled={step === 1} onClick={() => { setError(""); setStep((value) => Math.max(1, value - 1)); }}><ChevronLeft className="mr-1 size-4" />Voltar</Button>
          {step < 5 && <Button type="button" onClick={nextStep}>Continuar<ChevronRight className="ml-1 size-4" /></Button>}
        </div>
      </div>
    </section>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/30 p-3"><p className="stamp text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
