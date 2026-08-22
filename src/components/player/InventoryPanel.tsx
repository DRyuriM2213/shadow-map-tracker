import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CharacterSheetData, OrdemAttribute } from "@/data/ordemRules";
import {
  catalogItemToInventory,
  equipmentSuggestions,
  inventoryCatalogMatch,
  inventoryLoadState,
  resolveInventoryWeapon,
  type InventoryCombatRange,
  type InventoryItemExtended,
} from "@/data/inventoryRules";
import { uid } from "@/lib/dice";
import { AlertTriangle, CheckCircle2, PackagePlus, Search, Swords, Trash2 } from "lucide-react";

export function InventoryPanel({ sheet, editable, onChange }: {
  sheet: CharacterSheetData;
  editable: boolean;
  onChange: (next: CharacterSheetData) => void;
}) {
  const [query, setQuery] = useState("");
  const load = useMemo(() => inventoryLoadState(sheet), [sheet]);
  const suggestions = useMemo(() => equipmentSuggestions(query, 8), [query]);

  const setInventory = (inventory: InventoryItemExtended[]) => onChange({ ...sheet, inventory });
  const items = sheet.inventory as InventoryItemExtended[];

  const addCatalog = (catalogId: string) => {
    const preset = suggestions.find((entry) => entry.id === catalogId);
    if (!editable || !preset) return;
    setInventory([...items, catalogItemToInventory(preset, uid("item"))]);
    setQuery("");
  };

  const addManual = () => {
    if (!editable) return;
    const name = query.trim() || "Novo item";
    setInventory([...items, {
      id: uid("item"),
      name,
      category: "Item manual",
      spaces: 1,
      quantity: 1,
      equipped: false,
      notes: "",
    }]);
    setQuery("");
  };

  const update = (id: string, patch: Partial<InventoryItemExtended>) => {
    setInventory(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const remove = (id: string) => setInventory(items.filter((item) => item.id !== id));

  const statusClass = load.status === "NORMAL"
    ? "border-route-verde/35 bg-route-verde/5 text-route-verde-claro"
    : load.status === "SOBRECARREGADO"
      ? "border-route-amarelo/45 bg-route-amarelo/8 text-route-amarelo"
      : "border-destructive/45 bg-destructive/8 text-destructive";
  const barClass = load.status === "NORMAL" ? "bg-route-verde-claro" : load.status === "SOBRECARREGADO" ? "bg-route-amarelo" : "bg-destructive";
  const visualPercent = Math.min(100, load.percent);

  return <div className="space-y-4">
    <section className="overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2"><p className="stamp text-primary">Carga automática</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>{load.status === "NORMAL" ? "NORMAL" : load.status === "SOBRECARREGADO" ? "SOBRECARREGADO" : "IMÓVEL"}</span></div>
          <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1"><h2 className="font-display text-3xl">{load.used} / {load.capacity}</h2><span className="pb-1 text-xs text-muted-foreground">espaços usados</span></div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-border/70 bg-black/25"><div className={`h-full rounded-full transition-[width] duration-300 ${barClass}`} style={{ width: `${visualPercent}%` }}/></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span>Capacidade segura: <b className="text-foreground">{load.capacity}</b></span><span>Limite absoluto: <b className="text-foreground">{load.overloadLimit}</b></span><span>{load.technician ? `Técnico: (FOR ${load.force} + INT ${load.intellect}) × 5` : load.force === 0 ? "FOR 0: capacidade 2" : `FOR ${load.force} × 5`}</span></div>
        </div>
        <div className={`max-w-md rounded-xl border p-3 text-xs ${statusClass}`}>
          {load.status === "NORMAL" ? <><CheckCircle2 className="mr-1 inline size-4"/>Sem penalidade de carga.</> : load.status === "SOBRECARREGADO" ? <><AlertTriangle className="mr-1 inline size-4"/>Acima da capacidade: –5 em Defesa e perícias afetadas por carga, e –3m de deslocamento.</> : <><AlertTriangle className="mr-1 inline size-4"/>Acima do dobro da capacidade: o personagem não consegue se locomover até aliviar a carga.</>}
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><p className="stamp text-primary">Adicionar equipamento</p><h3 className="text-lg font-semibold">Digite o item; o catálogo tenta reconhecer sozinho</h3><p className="mt-1 text-xs text-muted-foreground">Ex.: pistola, Glock, revólver, sniper, katana, espingarda, balas longas. Se reconhecer, dano, crítico, alcance, espaços e munição já entram prontos.</p></div><PackagePlus className="size-5 text-primary"/></div>
      <div className="relative mt-4"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="h-11 pl-10" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key !== "Enter" || !query.trim()) return; event.preventDefault(); if (suggestions[0]) addCatalog(suggestions[0].id); else addManual(); }} placeholder="Buscar arma, munição ou equipamento..."/></div>
      {query.trim() && <div className="mt-3 grid gap-2 md:grid-cols-2">{suggestions.map((item) => <button type="button" key={item.id} disabled={!editable} onClick={() => addCatalog(item.id)} className="group rounded-xl border border-border bg-background/30 p-3 text-left transition hover:border-primary/40 hover:bg-primary/[0.045] disabled:opacity-50"><div className="flex items-center gap-2"><b className="min-w-0 flex-1 truncate">{item.name}</b><span className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{item.spaces} espaço{item.spaces === 1 ? "" : "s"}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{item.category} · Cat. {item.rank}</p>{item.weapon && <div className="mt-2 flex flex-wrap gap-1.5"><Chip>{item.weapon.damage}</Chip><Chip>crítico {critLabel(item.weapon.criticalMargin, item.weapon.criticalMultiplier)}</Chip><Chip>{rangeLabel(item.weapon.range)}</Chip>{item.weapon.ammo && <Chip>{item.weapon.ammo}</Chip>}</div>}</button>)}{suggestions.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhum item do catálogo bateu com esse nome.</p>}</div>}
      {query.trim() && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3"><div><p className="text-sm font-medium">Não é um item do catálogo?</p><p className="text-[11px] text-muted-foreground">Adicione manualmente e, se for arma, informe os dados mecânicos.</p></div><Button type="button" variant="outline" disabled={!editable} onClick={addManual}>Adicionar manual</Button></div>}
    </section>

    <section className="rounded-2xl border border-border bg-card/30 p-4 sm:p-5">
      <div className="flex items-center gap-2"><div><p className="stamp text-muted-foreground">Equipamento atual</p><h3 className="text-lg font-semibold">Inventário</h3></div><span className="ml-auto rounded-full border border-border bg-background/35 px-2.5 py-1 font-mono text-xs">{items.length} item(ns)</span></div>
      <div className="mt-4 space-y-2.5">{items.map((item) => <InventoryCard key={item.id} item={item} editable={editable} freeMode={sheet.concept.freeMode} update={(patch) => update(item.id, patch)} remove={() => remove(item.id)}/>)}{items.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Inventário vazio. Use a busca acima para adicionar o primeiro item.</p>}</div>
    </section>
  </div>;
}

function InventoryCard({ item, editable, freeMode, update, remove }: {
  item: InventoryItemExtended;
  editable: boolean;
  freeMode: boolean;
  update: (patch: Partial<InventoryItemExtended>) => void;
  remove: () => void;
}) {
  const catalog = inventoryCatalogMatch(item);
  const weapon = resolveInventoryWeapon(item);
  const isManual = !catalog;
  const manualWeapon = Boolean(item.damage?.trim());

  return <article className="rounded-xl border border-border bg-background/25 p-3.5">
    <div className="flex flex-wrap items-start gap-3">
      <div className="min-w-[180px] flex-1">{isManual || freeMode ? <Input disabled={!editable} className="h-9 font-semibold" value={item.name} onChange={(event) => update({ name: event.target.value })}/> : <div className="flex flex-wrap items-center gap-2"><b>{item.name}</b><span className="rounded-full border border-primary/25 bg-primary/[0.06] px-2 py-0.5 text-[9px] text-primary">CATÁLOGO</span>{weapon && <span className={`rounded-full border px-2 py-0.5 text-[9px] ${item.equipped ? "border-route-verde/30 bg-route-verde/5 text-route-verde-claro" : "border-border text-muted-foreground"}`}>{item.equipped ? "ATAQUE PRONTO" : "ARMA"}</span>}</div>}<p className="mt-1 text-[11px] text-muted-foreground">{catalog ? `${catalog.category} · Cat. ${catalog.rank}` : item.category || "Item manual"}</p></div>
      <div className="flex items-center gap-2"><label className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${item.equipped ? "border-primary/35 bg-primary/[0.06]" : "border-border"}`}><input type="checkbox" disabled={!editable} checked={item.equipped} onChange={(event) => update({ equipped: event.target.checked })}/>Equipado</label>{editable && <Button type="button" size="icon" variant="ghost" aria-label={`Remover ${item.name}`} onClick={remove}><Trash2 className="size-4"/></Button>}</div>
    </div>

    <div className="mt-3 grid gap-2 sm:grid-cols-[110px_110px_minmax(0,1fr)]"><div><Label className="text-[10px] text-muted-foreground">Quantidade</Label><Input disabled={!editable} className="mt-1 h-9" type="number" min={0} value={item.quantity} onChange={(event) => update({ quantity: Math.max(0, Number(event.target.value) || 0) })}/></div><div><Label className="text-[10px] text-muted-foreground">Espaços / unidade</Label><Input disabled={!editable || (!isManual && !freeMode)} className="mt-1 h-9" type="number" min={0} step="0.25" value={item.spaces} onChange={(event) => update({ spaces: Math.max(0, Number(event.target.value) || 0) })}/></div><div><Label className="text-[10px] text-muted-foreground">Notas</Label><Input disabled={!editable} className="mt-1 h-9" value={item.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="Modificações, detalhes, observações..."/></div></div>

    {weapon && <div className="mt-3 rounded-xl border border-border/80 bg-black/10 p-2.5"><div className="flex flex-wrap items-center gap-1.5"><Swords className="mr-1 size-4 text-primary"/><Chip>Dano {weapon.damage}{weapon.addStrength ? " + FOR" : ""}</Chip><Chip>Crítico {critLabel(weapon.criticalMargin, weapon.criticalMultiplier)}</Chip><Chip>{rangeLabel(weapon.range)}</Chip><Chip>{damageTypeLabel(weapon.damageType)}</Chip>{weapon.ammo && <Chip>Munição: {weapon.ammo}</Chip>}</div>{item.equipped && <p className="mt-2 text-[10px] text-route-verde-claro">✓ Esta arma já aparece automaticamente na aba Ataques.</p>}</div>}

    {isManual && <div className="mt-3 rounded-xl border border-dashed border-border p-3"><label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" disabled={!editable} checked={manualWeapon} onChange={(event) => event.target.checked ? update({ damage: "1d6", criticalMargin: 20, criticalMultiplier: 2, range: "CORPO_A_CORPO", skillId: "luta", attribute: "FOR", damageType: "OUTRO", addStrength: true }) : update({ damage: "", ammo: "" })}/>Este item pode ser usado como arma</label>{manualWeapon && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><SmallText label="Dano" value={item.damage ?? ""} editable={editable} onChange={(damage) => update({ damage })}/><SmallNumber label="Margem crítica" value={item.criticalMargin ?? 20} editable={editable} onChange={(criticalMargin) => update({ criticalMargin })}/><SmallNumber label="Multiplicador" value={item.criticalMultiplier ?? 2} editable={editable} onChange={(criticalMultiplier) => update({ criticalMultiplier })}/><div><Label className="text-[10px] text-muted-foreground">Alcance</Label><select disabled={!editable} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs" value={(item.range as InventoryCombatRange | undefined) ?? "CORPO_A_CORPO"} onChange={(event) => { const range = event.target.value as InventoryCombatRange; update({ range, skillId: range === "CORPO_A_CORPO" ? "luta" : "pontaria", attribute: range === "CORPO_A_CORPO" ? "FOR" : "AGI", addStrength: range === "CORPO_A_CORPO" }); }}><option value="CORPO_A_CORPO">Corpo a corpo</option><option value="CURTO">Curto</option><option value="MEDIO">Médio</option><option value="LONGO">Longo</option></select></div><SmallText label="Munição" value={item.ammo ?? ""} editable={editable} onChange={(ammo) => update({ ammo })}/><div><Label className="text-[10px] text-muted-foreground">Atributo</Label><select disabled={!editable} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs" value={item.attribute ?? "FOR"} onChange={(event) => update({ attribute: event.target.value as OrdemAttribute })}><option value="FOR">FOR</option><option value="AGI">AGI</option><option value="INT">INT</option><option value="PRE">PRE</option><option value="VIG">VIG</option></select></div></div>}</div>}
  </article>;
}

function Chip({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-border bg-background/55 px-2 py-1 text-[10px] font-medium text-muted-foreground">{children}</span>; }
function critLabel(margin: number, multiplier: number) { return `${margin < 20 ? `${margin}-20` : "20"}/x${multiplier}`; }
function rangeLabel(range: string) { return range === "CORPO_A_CORPO" ? "Corpo a corpo" : range === "CURTO" ? "Curto" : range === "MEDIO" ? "Médio" : range === "LONGO" ? "Longo" : range; }
function damageTypeLabel(type: string) { return type === "CORTE" ? "Corte" : type === "IMPACTO" ? "Impacto" : type === "PERFURACAO" ? "Perfuração" : type === "BALISTICO" ? "Balístico" : type === "FOGO" ? "Fogo" : "Outro"; }
function SmallText({ label, value, editable, onChange }: { label: string; value: string; editable: boolean; onChange: (value: string) => void }) { return <div><Label className="text-[10px] text-muted-foreground">{label}</Label><Input disabled={!editable} className="mt-1 h-9" value={value} onChange={(event) => onChange(event.target.value)}/></div>; }
function SmallNumber({ label, value, editable, onChange }: { label: string; value: number; editable: boolean; onChange: (value: number) => void }) { return <div><Label className="text-[10px] text-muted-foreground">{label}</Label><Input disabled={!editable} className="mt-1 h-9" type="number" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)}/></div>; }