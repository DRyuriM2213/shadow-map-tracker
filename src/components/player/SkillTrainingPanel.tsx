import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SKILLS, TRAINING_BONUS, type CharacterSheetData, type TrainingLevel } from "@/data/ordemRules";
import {
  maxTrainingLevelForNex,
  powerTrainingCandidates,
  remainingBonusIntSkills,
  remainingPowerTrainingSlots,
  trainingUnlockMessage,
  type SkillTrainingGrant,
} from "@/data/ordemProgression";
import { Check, ChevronUp, Search, Sparkles } from "lucide-react";

const FILTERS: Array<{ id: "TODAS" | TrainingLevel; label: string }> = [
  { id: "TODAS", label: "Todas" },
  { id: "DESTREINADO", label: "Destreinadas" },
  { id: "TREINADO", label: "Treinadas" },
  { id: "VETERANO", label: "Veteranas" },
  { id: "EXPERT", label: "Expert" },
];

const grantId = () => `skill-grant-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function SkillTrainingPanel({ sheet, editable, onChange, onRollSkill }: {
  sheet: CharacterSheetData;
  editable: boolean;
  onChange: (next: CharacterSheetData) => void;
  onRollSkill: (skillId: string) => void;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("TODAS");
  const [query, setQuery] = useState("");
  const [powerDrafts, setPowerDrafts] = useState<Record<string, string>>({});
  const cap = maxTrainingLevelForNex(sheet.concept.nex);
  const creation = sheet.progression.creation;

  useEffect(() => {
    if (!editable || sheet.concept.freeMode || creation.initialInt === null) return;
    const current = Math.trunc(sheet.attributes.INT);
    const knownPeak = creation.maxIntGranted ?? creation.initialInt;
    if (current <= knownPeak) return;
    onChange({
      ...sheet,
      progression: {
        ...sheet.progression,
        creation: { ...creation, maxIntGranted: current },
      },
    });
  }, [creation, editable, onChange, sheet, sheet.attributes.INT, sheet.concept.freeMode, sheet.progression]);

  const bonusIntRemaining = remainingBonusIntSkills(sheet.progression, sheet.attributes.INT);
  const counts = useMemo(() => {
    const result: Record<TrainingLevel, number> = { DESTREINADO: 0, TREINADO: 0, VETERANO: 0, EXPERT: 0 };
    for (const skill of SKILLS) result[sheet.skills[skill.id]?.training ?? "DESTREINADO"] += 1;
    return result;
  }, [sheet.skills]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return SKILLS.filter((skill) => {
      const training = sheet.skills[skill.id]?.training ?? "DESTREINADO";
      if (filter !== "TODAS" && training !== filter) return false;
      if (!normalized) return true;
      return skill.name.toLocaleLowerCase("pt-BR").includes(normalized) || skill.id.includes(normalized) || skill.attribute.toLocaleLowerCase("pt-BR").includes(normalized);
    });
  }, [filter, query, sheet.skills]);

  const powerSources = sheet.progression.choices.filter((choice) => (choice.grantsSkillTraining ?? 0) > 0 && choice.nex <= sheet.concept.nex);

  const trainFromInt = (skillId: string) => {
    if (!editable || sheet.concept.freeMode || bonusIntRemaining <= 0) return;
    const current = sheet.skills[skillId]?.training ?? "DESTREINADO";
    if (current !== "DESTREINADO") return;
    const grant: SkillTrainingGrant = {
      id: grantId(),
      source: "INT_BONUS",
      nex: sheet.concept.nex,
      skillId,
      from: "DESTREINADO",
      to: "TREINADO",
      createdAt: new Date().toISOString(),
    };
    onChange({
      ...sheet,
      skills: { ...sheet.skills, [skillId]: { ...sheet.skills[skillId], training: "TREINADO" } },
      progression: {
        ...sheet.progression,
        creation: { ...creation, bonusIntSkills: [...creation.bonusIntSkills, skillId] },
        skillTrainingGrants: [...sheet.progression.skillTrainingGrants, grant],
      },
    });
  };

  const applyPowerTraining = (choiceId: string) => {
    if (!editable || sheet.concept.freeMode) return;
    const source = powerSources.find((choice) => choice.id === choiceId);
    if (!source || remainingPowerTrainingSlots(source, sheet.progression.skillTrainingGrants) <= 0) return;
    const skillId = powerDrafts[choiceId];
    if (!skillId) return;
    const candidate = powerTrainingCandidates(sheet.concept.nex, sheet.skills).find((item) => item.skillId === skillId);
    if (!candidate) return;
    const grant: SkillTrainingGrant = {
      id: grantId(),
      source: "POWER",
      sourceId: source.id,
      nex: sheet.concept.nex,
      skillId,
      from: candidate.from,
      to: candidate.to,
      createdAt: new Date().toISOString(),
    };
    onChange({
      ...sheet,
      skills: { ...sheet.skills, [skillId]: { ...sheet.skills[skillId], training: candidate.to } },
      progression: { ...sheet.progression, skillTrainingGrants: [...sheet.progression.skillTrainingGrants, grant] },
    });
    setPowerDrafts((current) => ({ ...current, [choiceId]: "" }));
  };

  return <div className="space-y-4">
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1"><p className="stamp text-primary">Grau de treinamento</p><h2 className="font-display text-2xl">Máximo atual: {labelTraining(cap)} +{TRAINING_BONUS[cap]}</h2><p className="mt-1 text-xs text-muted-foreground">{cap === "TREINADO" ? "Veterano (+10) libera em NEX 35%. Expert (+15) libera em NEX 70%." : cap === "VETERANO" ? "Veterano (+10) liberado. Expert (+15) libera em NEX 70%." : "Expert (+15) liberado — grau máximo padrão."}</p></div>
        <div className="grid grid-cols-4 gap-1.5 text-center"><Count label="0" value={counts.DESTREINADO}/><Count label="+5" value={counts.TREINADO}/><Count label="+10" value={counts.VETERANO}/><Count label="+15" value={counts.EXPERT}/></div>
      </div>
    </section>

    {creation.status === "LEGADA" && <p className="rounded-xl border border-route-amarelo/35 bg-route-amarelo/5 p-3 text-xs text-route-amarelo">Ficha criada antes do assistente automático. Valores antigos foram preservados; daqui para frente os novos limites e upgrades são guiados normalmente.</p>}

    {bonusIntRemaining > 0 && !sheet.concept.freeMode && <section className="rounded-xl border border-route-verde/35 bg-route-verde/5 p-4"><div className="flex items-center gap-2"><Sparkles className="size-4 text-route-verde-claro"/><div><p className="stamp text-route-verde-claro">Intelecto aumentou</p><p className="text-sm font-semibold">Você pode treinar {bonusIntRemaining} nova(s) perícia(s) em +5.</p></div></div><p className="mt-2 text-xs text-muted-foreground">Use o botão “Treinar +5” em uma perícia destreinada. O bônus não é perdido se o Intelecto diminuir depois.</p></section>}

    {powerSources.map((choice) => {
      const remaining = remainingPowerTrainingSlots(choice, sheet.progression.skillTrainingGrants);
      if (remaining <= 0) return null;
      const candidates = powerTrainingCandidates(sheet.concept.nex, sheet.skills);
      return <section key={choice.id} className="rounded-xl border border-primary/25 bg-card/40 p-4"><p className="stamp text-primary">Treinamento em Perícia · poder</p><div className="mt-1 flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{remaining} elevação(ões) restante(s)</p><span className="text-xs text-muted-foreground">Não consome o lote de Grau de Treinamento.</span></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select className="min-w-0 flex-1 rounded-lg border border-input bg-background p-2 text-sm" value={powerDrafts[choice.id] ?? ""} onChange={(event) => setPowerDrafts((current) => ({ ...current, [choice.id]: event.target.value }))}><option value="">Escolha uma perícia...</option>{candidates.map((candidate) => { const skill = SKILLS.find((item) => item.id === candidate.skillId); return <option key={candidate.skillId} value={candidate.skillId}>{skill?.name ?? candidate.skillId}: {labelTraining(candidate.from)} → {labelTraining(candidate.to)}</option>; })}</select><Button type="button" disabled={!editable || !powerDrafts[choice.id]} onClick={() => applyPowerTraining(choice.id)}><ChevronUp className="mr-1 size-4"/>Aplicar</Button></div></section>;
    })}

    <section className="rounded-xl border border-border bg-card/30 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Buscar perícia..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="flex gap-1 overflow-x-auto">{FILTERS.map((item) => <button type="button" key={item.id} onClick={() => setFilter(item.id)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs ${filter === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/30 text-muted-foreground"}`}>{item.label}</button>)}</div>
      </div>

      <div className="mt-4 space-y-2">{filtered.map((skill) => {
        const state = sheet.skills[skill.id] ?? { training: "DESTREINADO" as TrainingLevel, otherBonus: 0 };
        const trainingBonus = TRAINING_BONUS[state.training];
        const total = trainingBonus + Number(state.otherBonus || 0);
        const canIntTrain = bonusIntRemaining > 0 && state.training === "DESTREINADO" && !sheet.concept.freeMode;
        return <div key={skill.id} className="rounded-xl border border-border bg-background/25 p-3"><div className="flex flex-wrap items-center gap-3"><div className="min-w-[150px] flex-1"><div className="flex items-center gap-2"><b>{skill.id === "profissao" && state.customName ? state.customName : skill.name}</b><span className="stamp text-[9px] text-muted-foreground">{skill.attribute}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{trainingUnlockMessage(state.training, sheet.concept.nex)}</p>{skill.id === "profissao" && editable && <Input className="mt-2 h-8 max-w-xs" placeholder="Nome da profissão" value={state.customName ?? ""} onChange={(event) => onChange({ ...sheet, skills: { ...sheet.skills, [skill.id]: { ...state, customName: event.target.value } } })}/>}</div><div className="text-right"><p className="font-mono text-lg font-bold">{total >= 0 ? "+" : ""}{total}</p><p className="text-[10px] text-muted-foreground">{labelTraining(state.training)} · treino +{trainingBonus}</p></div><div className="flex items-center gap-2">{sheet.concept.freeMode ? <select aria-label={`Treinamento de ${skill.name}`} disabled={!editable} className="rounded-lg border border-input bg-background p-2 text-xs" value={state.training} onChange={(event) => onChange({ ...sheet, skills: { ...sheet.skills, [skill.id]: { ...state, training: event.target.value as TrainingLevel } } })}><option value="DESTREINADO">0</option><option value="TREINADO">+5</option><option value="VETERANO">+10</option><option value="EXPERT">+15</option></select> : canIntTrain ? <Button type="button" size="sm" variant="outline" disabled={!editable} onClick={() => trainFromInt(skill.id)}><Check className="mr-1 size-3.5"/>Treinar +5</Button> : null}<Button type="button" size="sm" variant="outline" onClick={() => onRollSkill(skill.id)}>Rolar</Button></div></div><div className="mt-2 flex max-w-sm items-center gap-2"><Label className="shrink-0 text-[11px] text-muted-foreground">Bônus extra</Label><Input disabled={!editable} className="h-8 w-24" type="number" value={state.otherBonus ?? 0} onChange={(event) => onChange({ ...sheet, skills: { ...sheet.skills, [skill.id]: { ...state, otherBonus: Number(event.target.value) } } })}/></div></div>;
      })}{filtered.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma perícia neste filtro.</p>}</div>
    </section>
  </div>;
}

function labelTraining(level: TrainingLevel) {
  return level === "DESTREINADO" ? "Destreinado" : level === "TREINADO" ? "Treinado" : level === "VETERANO" ? "Veterano" : "Expert";
}

function Count({ label, value }: { label: string; value: number }) {
  return <div className="min-w-12 rounded-lg border border-border bg-background/30 px-2 py-1.5"><p className="font-mono text-sm font-bold">{value}</p><p className="text-[9px] text-muted-foreground">{label}</p></div>;
}
