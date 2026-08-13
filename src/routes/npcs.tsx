import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { NPCS } from "@/data/npcs";
import { LOCATIONS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";
import { Copy, Lock } from "lucide-react";

export const Route = createFileRoute("/npcs")({ component: NpcsPage });

function NpcsPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const [npcId, setNpcId] = useState(NPCS[0]?.id ?? "");
  const npc = NPCS.find((n) => n.id === npcId) ?? NPCS[0];
  const [topicId, setTopicId] = useState(npc?.topics[0]?.id ?? "");
  const topic = npc?.topics.find((t) => t.id === topicId) ?? npc?.topics[0];
  const current = LOCATIONS.find((l) => l.id === session.currentLocationId);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-4">
        <header>
          <p className="stamp text-primary">Consulta rápida do mestre</p>
          <h1 className="text-3xl font-semibold">NPCs</h1>
          <p className="text-sm text-muted-foreground">Local atual: {current?.name ?? "—"}. Clique num NPC e depois no assunto.</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="dossier rounded-sm p-3 space-y-2">
            {NPCS.map((n) => {
              const here = !!session.currentLocationId && n.locationIds.includes(session.currentLocationId);
              return (
                <button
                  key={n.id}
                  onClick={() => { setNpcId(n.id); setTopicId(n.topics[0]?.id ?? ""); }}
                  className={`w-full rounded-sm border p-3 text-left ${n.id === npc?.id ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <div className="flex justify-between gap-2"><b>{n.name}</b>{here && <span className="stamp text-route-verde-claro">aqui</span>}</div>
                  <p className="text-xs text-muted-foreground">{n.role}</p>
                </button>
              );
            })}
          </aside>

          {npc && (
            <section className="space-y-4">
              <div className="dossier rounded-sm p-5">
                <p className="stamp text-primary">{npc.role}</p>
                <h2 className="font-display text-3xl">{npc.name}</h2>
                <div className="mt-2 flex flex-wrap gap-1">{npc.personality.map((p) => <span key={p} className="rounded-sm border border-border px-2 py-1 text-xs">{p}</span>)}</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
                  <Info title="Jeito de falar" text={npc.voice} />
                  <Info title="Atitude inicial" text={npc.initialAttitude} />
                  <Info title="Rotina" text={npc.schedule} />
                  <Info title="O que não sabe" text={npc.doesNotKnow.join(" • ")} />
                </div>
                <div className="mt-3 rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">O que sabe</p><ul className="mt-1 text-sm">{npc.knows.map((k) => <li key={k}>• {k}</li>)}</ul></div>
              </div>

              <div className="dossier rounded-sm p-5">
                <p className="stamp text-muted-foreground">Perguntar sobre</p>
                <div className="mt-2 flex flex-wrap gap-2">{npc.topics.map((t) => <Button key={t.id} size="sm" variant={topic?.id === t.id ? "default" : "outline"} onClick={() => setTopicId(t.id)}>{t.label}</Button>)}</div>
                {topic && (
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="paper-sheet rounded-sm p-4">
                      <div className="flex justify-between gap-3"><p className="stamp opacity-70">Fala pronta</p><Button size="sm" variant="outline" className="border-paper-foreground/40 text-paper-foreground" onClick={() => navigator.clipboard.writeText(topic.says)}><Copy className="mr-1 size-3.5" /> Copiar</Button></div>
                      <p className="mt-3 font-display text-lg leading-relaxed">“{topic.says}”</p>
                      <Button size="sm" className="mt-3" onClick={() => store.logAction("conversa", `Conversa com ${npc.name}`, topic.label, "verde")}>Marcar fala usada</Button>
                    </div>
                    <div className="rounded-sm border border-route-preto bg-black/40 p-4 text-sm">
                      <p className="stamp text-route-cinza"><Lock className="mr-1 inline size-3.5" /> Para o mestre</p>
                      <p className="mt-2">{topic.master}</p>
                      {(topic.test || topic.dc) && <p className="mt-3"><b>Teste:</b> {topic.test ?? "Social"}{topic.dc ? ` • DT ${topic.dc}` : ""}</p>}
                      {topic.unlocks?.length ? <p className="mt-3"><b>Pode liberar:</b> {topic.unlocks.join(" • ")}</p> : null}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return <div className="rounded-sm border border-border p-3"><p className="stamp text-muted-foreground">{title}</p><p className="mt-1">{text}</p></div>;
}
