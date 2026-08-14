import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NPCS, type NpcDef } from "@/data/npcs";
import { LOCATIONS } from "@/data/campaignFull";
import { useAsset } from "@/lib/useAsset";
import { useCampaign } from "@/store/campaign";
import { Copy, Image as ImageIcon, Lock, MapPin, Search, Skull } from "lucide-react";

export const Route = createFileRoute("/npcs")({ component: NpcsPage });

type Filter = "todos" | "aqui" | "vivos" | "mortos";

function NpcsPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [npcId, setNpcId] = useState(NPCS[0]?.id ?? "");
  const [topicId, setTopicId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const npc = NPCS.find((n) => n.id === npcId) ?? NPCS[0];
  const topic = npc?.topics.find((t) => t.id === topicId) ?? npc?.topics[0];
  const current = LOCATIONS.find((l) => l.id === session.currentLocationId);

  const filtered = useMemo(() => NPCS.filter((n) => {
    const haystack = `${n.name} ${n.role} ${n.status} ${n.personality.join(" ")} ${n.topics.map((t) => t.label).join(" ")}`.toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (filter === "aqui" && (!session.currentLocationId || !n.locationIds.includes(session.currentLocationId))) return false;
    if (filter === "vivos" && n.status !== "vivo") return false;
    if (filter === "mortos" && n.status !== "morto") return false;
    return true;
  }), [query, filter, session.currentLocationId]);

  const selectNpc = (n: NpcDef) => {
    setNpcId(n.id);
    setTopicId(n.topics[0]?.id ?? "");
  };

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="dossier rounded-sm p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="stamp text-primary">Elenco oficial modelado</p>
              <h1 className="text-3xl font-semibold">NPCs</h1>
              <p className="text-sm text-muted-foreground">
                16 NPCs canônicos · local atual: {current?.name ?? "—"}. Funcionários que existem apenas nos documentos não aparecem nesta lista.
              </p>
            </div>
            <Link to="/assets" className="ml-auto"><Button size="sm" variant="outline"><ImageIcon className="mr-1 size-4" />Gerenciar imagens</Button></Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1 sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar NPC, função ou assunto…" className="pl-8" />
            </div>
            {(["todos", "aqui", "vivos", "mortos"] as Filter[]).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f === "todos" ? "Todos" : f === "aqui" ? "No local atual" : f === "vivos" ? "Vivos" : "Mortos"}
              </Button>
            ))}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="dossier max-h-[72vh] space-y-2 overflow-y-auto rounded-sm p-3">
            {filtered.map((n) => {
              const here = !!session.currentLocationId && n.locationIds.includes(session.currentLocationId);
              return (
                <button
                  key={n.id}
                  onClick={() => selectNpc(n)}
                  className={`flex w-full items-center gap-3 rounded-sm border p-2.5 text-left transition-colors ${n.id === npc?.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}
                >
                  <NpcPortrait npc={n} small />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><b className="truncate">{n.name}</b>{here && <span className="stamp shrink-0 text-route-verde-claro">aqui</span>}</div>
                    <p className="truncate text-xs text-muted-foreground">{n.role}</p>
                    <span className={`stamp text-[10px] ${n.status === "morto" ? "text-muted-foreground" : "text-route-verde-claro"}`}>{n.status}</span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhum NPC corresponde ao filtro.</p>}
          </aside>

          {npc && (
            <section className="space-y-4">
              <div className="dossier rounded-sm p-4 sm:p-5">
                <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                  <NpcPortrait npc={npc} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`stamp rounded-sm border px-2 py-0.5 ${npc.status === "morto" ? "border-muted-foreground text-muted-foreground" : "border-route-verde-claro/50 text-route-verde-claro"}`}>
                        {npc.status === "morto" && <Skull className="mr-1 inline size-3" />}{npc.status}
                      </span>
                      <span className="stamp text-primary">{npc.role}</span>
                    </div>
                    <h2 className="mt-1 font-display text-3xl sm:text-4xl">{npc.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {npc.personality.length ? npc.personality.map((p) => <span key={p} className="rounded-sm border border-border px-2 py-1 text-xs">{p}</span>) : <span className="text-xs text-muted-foreground">Personalidade não definida pelo mestre.</span>}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
                      <Info title="Jeito de falar" text={npc.voice} />
                      <Info title="Atitude inicial" text={npc.initialAttitude} />
                      <Info title="Rotina" text={npc.schedule} />
                      <Info title="Local provável" text={npc.locationIds.length ? npc.locationIds.map((id) => LOCATIONS.find((l) => l.id === id)?.name ?? id).join(" • ") : "não definido pelo mestre"} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  <ListBlock title="O que sabe" items={npc.knows} empty="Nada adicional definido com segurança." />
                  <ListBlock title="O que não sabe" items={npc.doesNotKnow} empty="Não definido pelo mestre." />
                  <ListBlock title="Relações" items={npc.relations} empty="Não definido pelo mestre." />
                  <div className="rounded-sm border border-route-preto bg-black/35 p-3 text-sm">
                    <p className="stamp text-route-cinza"><Lock className="mr-1 inline size-3.5" />Notas privadas do mestre</p>
                    <p className="mt-2">{npc.masterNotes || "Sem notas privadas definidas."}</p>
                    {npc.secrets.length > 0 && <ul className="mt-2 space-y-1">{npc.secrets.map((s) => <li key={s}>• {s}</li>)}</ul>}
                  </div>
                </div>
              </div>

              <div className="dossier rounded-sm p-4 sm:p-5">
                <p className="stamp text-muted-foreground">Perguntar sobre / falas pré-prontas</p>
                {npc.status === "morto" ? (
                  <p className="mt-3 text-sm text-muted-foreground">Arthur não possui diálogo presencial. Use registros, memórias ou menções quando fizer sentido.</p>
                ) : npc.topics.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Nenhuma fala foi fixada no cânone. Improviso livre do mestre.</p>
                ) : (
                  <>
                    <div className="mt-2 flex flex-wrap gap-2">{npc.topics.map((t) => <Button key={t.id} size="sm" variant={topic?.id === t.id ? "default" : "outline"} onClick={() => setTopicId(t.id)}>{t.label}</Button>)}</div>
                    {topic && (
                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <div className="paper-sheet rounded-sm p-4">
                          <div className="flex items-center justify-between gap-3"><p className="stamp opacity-70">O que {npc.name} diz</p><Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => navigator.clipboard.writeText(topic.says)}><Copy className="mr-1 size-3.5" />Copiar</Button></div>
                          <p className="mt-3 font-display text-lg leading-relaxed">“{topic.says}”</p>
                          <Button size="sm" className="mt-3" onClick={() => store.logAction("conversa", `Conversa com ${npc.name}: ${topic.label}`, undefined, "verde")}>Marcar fala usada</Button>
                        </div>
                        <div className="rounded-sm border border-route-preto bg-black/40 p-4 text-sm">
                          <p className="stamp text-route-cinza"><Lock className="mr-1 inline size-3.5" />Para o mestre</p>
                          <p className="mt-2">{topic.master}</p>
                          {(topic.test || topic.dc) && <p className="mt-3"><b>Teste:</b> {topic.test ?? "Social"}{topic.dc ? ` • DT ${topic.dc}` : ""}</p>}
                          {topic.unlocks?.length ? <p className="mt-3"><b>Pode liberar:</b> {topic.unlocks.join(" • ")}</p> : null}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </Shell>
  );
}

function NpcPortrait({ npc, small = false }: { npc: NpcDef; small?: boolean }) {
  const url = useAsset(`npc:${npc.id}`);
  const initials = npc.name.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  if (small) {
    return <div className="size-12 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary/40">{url ? <img src={url} alt={npc.name} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center font-display text-sm text-muted-foreground">{initials}</div>}</div>;
  }
  return (
    <div className="aspect-[4/5] w-full overflow-hidden rounded-sm border border-border bg-secondary/30">
      {url ? <img src={url} alt={`Modelo de ${npc.name}`} className="size-full object-contain" /> : <div className="flex size-full flex-col items-center justify-center gap-2 p-5 text-center text-muted-foreground"><ImageIcon className="size-8 opacity-60" /><span className="font-display text-3xl">{initials}</span><span className="text-xs">Modelo ainda não carregado</span><Link to="/assets" className="text-xs underline">carregar imagem</Link></div>}
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return <div className="rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">{title}</p><p className="mt-1">{text || "—"}</p></div>;
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div className="rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">{title}</p>{items.length ? <ul className="mt-1 space-y-1 text-sm">{items.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">{empty}</p>}</div>;
}