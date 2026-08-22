import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ATTRIBUTES, SKILLS, creationPointsUsed, type CharacterSheetData, type OrdemAttribute, type TrainingLevel } from "@/data/ordemRules";
import { CLASS_SKILL_RULES, baseClassOf, derivedResources, initialFreeSkillAllowance, type OrdemBaseClass } from "@/data/ordemProgression";
import { ORIGINS, originByName } from "@/data/originCatalog";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Shield, Sparkles } from "lucide-react";

const CLASSES: Array<{ id: OrdemBaseClass; summary: string }> = [
  { id: "Combatente", summary: "Mais resistente e direto em combate." },
  { id: "Especialista", summary: "Mais perícias para investigação, suporte e soluções técnicas." },
  { id: "Ocultista", summary: "Ligado ao paranormal e à conjuração de rituais." },
];
const STEPS = ["Origem", "Classe", "Atributos", "Perícias", "Revisão"];

export function CharacterCreationWizard({ sheet, editable, onChange }: { sheet: CharacterSheetData; editable: boolean; onChange: (next: CharacterSheetData) => void }) {
  const [step, setStep] = useState(1);
  const [furthest, setFurthest] = useState(1);
  const [error, setError] = useState("");
  const creation = sheet.progression.creation;
  const cls = baseClassOf(sheet.concept.className);
  const origin = originByName(sheet.concept.origin);
  const originSkills = origin?.skills ?? [];
  const points = useMemo(() => creationPointsUsed(sheet.attributes), [sheet.attributes]);
  const rule = cls ? CLASS_SKILL_RULES[cls] : null;
  const allowance = cls ? initialFreeSkillAllowance(cls, sheet.attributes.INT) : 0;
  const mandatory = creation.mandatorySkills;
  const free = creation.initialFreeSkills;

  const setCreation = (patch: Partial<typeof creation>) => onChange({ ...sheet, progression: { ...sheet.progression, creation: { ...creation, ...patch } } });

  const chooseOrigin = (name: string) => {
    const next = originByName(name);
    if (!editable || !next || next.supported === false) return;
    const automatic = new Set(next.skills);
    onChange({ ...sheet, concept: { ...sheet.concept, origin: next.name }, progression: { ...sheet.progression, creation: { ...creation, initialFreeSkills: free.filter((id) => !automatic.has(id)) } } });
    setError("");
  };

  const chooseClass = (className: OrdemBaseClass) => {
    if (!editable) return;
    const classRule = CLASS_SKILL_RULES[className];
    const reset = Object.fromEntries(Object.entries(sheet.skills).map(([id, value]) => [id, { ...value, training: "DESTREINADO" as TrainingLevel }]));
    onChange({ ...sheet, concept: { ...sheet.concept, className, customClass: "", trail: "" }, skills: reset, progression: { ...sheet.progression, creation: { ...creation, status: "NOVA", classAtCreation: className, mandatorySkills: [...classRule.fixed], initialFreeSkills: free.filter((id) => !originSkills.includes(id)) } } });
    setError("");
  };

  const changeAttribute = (attr: OrdemAttribute, delta: number) => {
    if (!editable) return;
    const value = Math.max(0, Math.min(3, sheet.attributes[attr] + delta));
    const next = { ...sheet.attributes, [attr]: value };
    if (value === sheet.attributes[attr] || !creationPointsUsed(next).valid) return;
    onChange({ ...sheet, attributes: next });
  };

  const chooseMandatory = (groupIndex: number, skillId: string) => {
    if (!rule) return;
    const group = new Set(rule.requiredGroups[groupIndex] ?? []);
    const retained = mandatory.filter((id) => !group.has(id));
    const nextMandatory = [...new Set([...rule.fixed, ...retained, skillId])];
    onChange({ ...sheet, progression: { ...sheet.progression, creation: { ...creation, mandatorySkills: nextMandatory, initialFreeSkills: free.filter((id) => !nextMandatory.includes(id) && !originSkills.includes(id)) } } });
  };

  const toggleFree = (skillId: string) => {
    if (!editable || mandatory.includes(skillId) || originSkills.includes(skillId)) return;
    if (free.includes(skillId)) return setCreation({ initialFreeSkills: free.filter((id) => id !== skillId) });
    if (free.length < allowance) setCreation({ initialFreeSkills: [...free, skillId] });
  };

  const canContinue = () => {
    if (step === 1) return Boolean(origin && origin.supported !== false);
    if (step === 2) return Boolean(cls);
    if (step === 3) return points.complete;
    if (step === 4) return Boolean(rule && rule.requiredGroups.every((group) => group.some((id) => mandatory.includes(id))) && free.length === allowance);
    return true;
  };

  const next = () => {
    if (!canContinue()) {
      setError(step === 1 ? "Escolha uma origem." : step === 2 ? "Escolha uma classe." : step === 3 ? `Distribua todos os pontos. Restam ${points.remaining}.` : "Complete as escolhas de perícia.");
      return;
    }
    const nextStep = Math.min(5, step + 1);
    setStep(nextStep); setFurthest((value) => Math.max(value, nextStep)); setError("");
  };

  const complete = () => {
    if (!editable || !origin || origin.supported === false || !cls || !rule || !points.complete) return;
    if (!rule.requiredGroups.every((group) => group.some((id) => mandatory.includes(id))) || free.length !== allowance) return setError("Ainda existem perícias pendentes.");
    const trained = new Set([...originSkills, ...mandatory, ...free]);
    const skills = Object.fromEntries(Object.entries(sheet.skills).map(([id, value]) => [id, { ...value, training: trained.has(id) ? "TREINADO" as TrainingLevel : "DESTREINADO" as TrainingLevel }]));
    const result = derivedResources({ className: cls, nex: 5, attributes: sheet.attributes, choices: sheet.progression.choices });
    onChange({ ...sheet, concept: { ...sheet.concept, className: cls, nex: 5, pePerRound: result?.peRoundLimit ?? 1 }, skills, resources: result ? { ...sheet.resources, pv: result.pvMax, pvMax: result.pvMax, pe: result.peMax, peMax: result.peMax, san: result.sanMax, sanMax: result.sanMax } : sheet.resources, progression: { ...sheet.progression, creation: { ...creation, status: "CONCLUIDA", classAtCreation: cls, initialInt: sheet.attributes.INT, maxIntGranted: sheet.attributes.INT, mandatorySkills: [...mandatory], initialFreeSkills: [...free], bonusIntSkills: [], completedAt: new Date().toISOString() } } });
    setError("");
  };

  return <section className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card/30 shadow-lg shadow-black/20">
    <header className="border-b border-border/70 p-4 sm:p-5"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Shield className="size-5"/></div><div><p className="stamp text-primary">Criação guiada · NEX 0%</p><h2 className="font-display text-2xl">Escolha. O sistema faz as contas.</h2><p className="mt-1 text-xs text-muted-foreground">Não é necessário conhecer Ordem Paranormal para montar a ficha.</p></div></div><div className="mt-4 grid grid-cols-5 gap-1.5">{STEPS.map((label, index) => { const number = index + 1; return <button type="button" key={label} disabled={number > furthest} onClick={() => number <= furthest && setStep(number)} className={`rounded-lg border px-2 py-2 text-[10px] sm:text-xs ${step === number ? "border-primary bg-primary text-primary-foreground" : step > number ? "border-route-verde/30 bg-route-verde/10 text-route-verde-claro" : "border-border bg-background/30 text-muted-foreground"}`}>{label}</button>; })}</div></header>
    <div className="p-4 sm:p-5">
      {step === 1 && <div className="space-y-3"><div><p className="stamp text-primary">Origem</p><h3 className="text-lg font-semibold">O que seu personagem fazia antes?</h3><p className="text-xs text-muted-foreground">A origem concede perícias e um poder automaticamente.</p></div><select disabled={!editable} className="w-full rounded-lg border border-input bg-background p-2 text-sm" value={origin?.name ?? ""} onChange={(event) => chooseOrigin(event.target.value)}><option value="">Escolha...</option>{ORIGINS.map((item) => <option key={item.name} value={item.name} disabled={item.supported === false}>{item.name}{item.supported === false ? " — precisa do mestre" : ""}</option>)}</select>{origin && <div className="rounded-xl border border-primary/25 bg-primary/5 p-3"><b>{origin.name}</b><p className="mt-1 text-xs text-muted-foreground">{origin.hint}</p>{origin.skills.length > 0 && <p className="mt-2 text-xs"><b>Perícias:</b> {origin.skills.map((id) => SKILLS.find((skill) => skill.id === id)?.name ?? id).join(" e ")}</p>}<p className="mt-1 text-xs"><b>Poder:</b> {origin.power}</p></div>}</div>}
      {step === 2 && <div className="space-y-3"><div><p className="stamp text-primary">Classe</p><h3 className="text-lg font-semibold">Como você quer jogar?</h3></div><div className="grid gap-3 md:grid-cols-3">{CLASSES.map((item) => <button type="button" key={item.id} disabled={!editable} onClick={() => chooseClass(item.id)} className={`rounded-xl border p-4 text-left ${cls === item.id ? "border-primary bg-primary/10" : "border-border bg-background/30"}`}><div className="flex items-center gap-2"><Sparkles className="size-4"/><b>{item.id}</b>{cls === item.id && <Check className="ml-auto size-4 text-route-verde-claro"/>}</div><p className="mt-2 text-xs text-muted-foreground">{item.summary}</p></button>)}</div></div>}
      {step === 3 && <div className="space-y-3"><div className="flex items-end gap-3"><div><p className="stamp text-primary">Atributos</p><h3 className="text-lg font-semibold">Distribua seus pontos</h3></div><span className="ml-auto text-sm"><b>{points.remaining}</b> restantes</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{ATTRIBUTES.map((attr) => <div key={attr.id} className="rounded-xl border border-border p-3 text-center"><p className="stamp">{attr.id}</p><p className="text-xs text-muted-foreground">{attr.label}</p><div className="mt-2 flex items-center justify-center gap-2"><Button size="icon" variant="outline" disabled={!editable || sheet.attributes[attr.id] <= 0} onClick={() => changeAttribute(attr.id, -1)}><Minus className="size-4"/></Button><b className="w-7 text-xl">{sheet.attributes[attr.id]}</b><Button size="icon" variant="outline" disabled={!editable || sheet.attributes[attr.id] >= 3} onClick={() => changeAttribute(attr.id, 1)}><Plus className="size-4"/></Button></div></div>)}</div><p className="text-xs text-muted-foreground">Continue até o contador chegar a zero. O sistema impede valores inválidos.</p></div>}
      {step === 4 && <div className="space-y-3">{!rule ? <p>Escolha uma classe primeiro.</p> : <><div><p className="stamp text-primary">Perícias</p><h3 className="text-lg font-semibold">Escolha no que você é treinado</h3><p className="text-xs text-muted-foreground">As opções automáticas já aparecem marcadas. Escolha {allowance} adicionais.</p></div>{originSkills.length > 0 && <p className="rounded-lg border border-route-verde/30 bg-route-verde/5 p-2 text-xs"><b>Da origem:</b> {originSkills.map((id) => SKILLS.find((s) => s.id === id)?.name ?? id).join(" e ")}</p>}{rule.fixed.length > 0 && <p className="rounded-lg border border-route-verde/30 bg-route-verde/5 p-2 text-xs"><b>Da classe:</b> {rule.fixed.map((id) => SKILLS.find((s) => s.id === id)?.name ?? id).join(" e ")}</p>}{rule.requiredGroups.map((group, index) => <div key={group.join("-")} className="rounded-xl border border-border p-3"><Label>Escolha uma</Label><div className="mt-2 grid grid-cols-2 gap-2">{group.map((id) => <button type="button" key={id} onClick={() => chooseMandatory(index, id)} className={`rounded-lg border p-2 text-sm ${mandatory.includes(id) ? "border-primary bg-primary/10" : "border-border"}`}>{SKILLS.find((s) => s.id === id)?.name ?? id}</button>)}</div></div>)}<div className="flex justify-end text-xs"><b>{free.length}/{allowance} livres</b></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SKILLS.map((skill) => { const locked = originSkills.includes(skill.id) || mandatory.includes(skill.id); const active = free.includes(skill.id); const limit = !active && free.length >= allowance; return <button type="button" key={skill.id} disabled={!editable || locked || limit} onClick={() => toggleFree(skill.id)} className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${locked ? "border-route-verde/30 bg-route-verde/5" : active ? "border-primary bg-primary/10" : "border-border"}`}><span className="flex size-5 items-center justify-center rounded border">{(locked || active) && <Check className="size-3"/>}</span>{skill.name}<span className="ml-auto text-[9px] text-muted-foreground">{skill.attribute}</span></button>; })}</div></>}</div>}
      {step === 5 && <div className="space-y-3"><div><p className="stamp text-primary">Revisão</p><h3 className="text-lg font-semibold">Pronto para jogar</h3><p className="text-xs text-muted-foreground">Depois daqui, a ficha continua avisando o que foi liberado e mostrando apenas escolhas válidas.</p></div><div className="grid gap-2 sm:grid-cols-2"><Review label="Origem" value={origin?.name ?? "—"}/><Review label="Poder de origem" value={origin?.power ?? "—"}/><Review label="Classe" value={cls ?? "—"}/><Review label="Perícias treinadas" value={String(new Set([...originSkills, ...mandatory, ...free]).size)}/><Review label="Atributos" value={ATTRIBUTES.map((a) => `${a.id} ${sheet.attributes[a.id]}`).join(" · ")}/></div><Button className="w-full" size="lg" disabled={!editable || !origin || !cls || !points.complete || free.length !== allowance} onClick={complete}><Sparkles className="mr-2 size-4"/>Concluir e entrar em NEX 5%</Button></div>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <footer className="mt-5 flex justify-between border-t border-border/70 pt-4"><Button variant="ghost" disabled={step === 1} onClick={() => { setStep((value) => Math.max(1, value - 1)); setError(""); }}><ChevronLeft className="mr-1 size-4"/>Voltar</Button>{step < 5 && <Button onClick={next}>Continuar<ChevronRight className="ml-1 size-4"/></Button>}</footer>
    </div>
  </section>;
}

function Review({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-background/30 p-3"><p className="stamp text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
