import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CLUES, CONSEQUENCES, LOCATIONS, SCENES } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";
import { clueStatusLabel } from "@/lib/ui";

export const Route = createFileRoute("/resumo")({
  head: () => ({
    meta: [
      { title: "Resumo da Sessão — Berço Vazio" },
      { name: "description", content: "Resumo automático da sessão com horários, escolhas, testes, pistas e consequências." },
      { property: "og:title", content: "Resumo da Sessão — Berço Vazio" },
      { property: "og:description", content: "Exporte o relatório da sessão em texto, JSON, PDF ou impressão." },
    ],
  }),
  component: ResumoPage,
});

function ResumoPage() {
  const session = useCampaign((s) => s.session);
  const store = useCampaign();
  const checkpoints = useCampaign((s) => s.checkpoints);

  const dados = useMemo(() => {
    const escolhas = session.log.filter((l) => l.actionType === "escolha");
    const testes = session.log.filter((l) => l.actionType === "teste");
    const encontradas = CLUES.filter((c) =>
      ["encontrada", "interpretada", "encontrada-parcialmente", "contingencia"].includes(session.clueStatus[c.id] ?? ""),
    );
    const perdidas = CLUES.filter((c) =>
      ["perdida", "destruida", "removida"].includes(session.clueStatus[c.id] ?? ""),
    );
    const locais = Object.entries(session.locationStatus).map(
      ([id, st]) => `${LOCATIONS.find((l) => l.id === id)?.name ?? id} (${st})`,
    );
    const ativas = session.scheduled
      .filter((s) => s.status === "ativada")
      .map((s) => CONSEQUENCES.find((c) => c.id === s.consequenceId)?.name ?? s.consequenceId);
    const ignoradas = Object.entries(session.routeStatus)
      .filter(([, st]) => st === "ignorada" || st === "indisponivel")
      .map(([id]) => SCENES.flatMap((s) => s.choices).find((c) => c.id === id)?.title ?? id);
    return { escolhas, testes, encontradas, perdidas, locais, ativas, ignoradas };
  }, [session]);

  const texto = useMemo(() => {
    const linhas = [
      `OPERAÇÃO BERÇO VAZIO — RESUMO DA SESSÃO`,
      `Sessão: ${session.sessionName}`,
      `Dia atual: ${session.day} — horário ${session.time}`,
      ``,
      `LINHA DO TEMPO`,
      ...session.log.map((l) => `D${l.day} ${l.time} — ${l.description}${l.detail ? ` (${l.detail})` : ""}`),
      ``,
      `LOCAIS VISITADOS`,
      ...dados.locais.map((l) => `- ${l}`),
      ``,
      `ESCOLHAS`,
      ...dados.escolhas.map((e) => `- ${e.description}`),
      ``,
      `TESTES`,
      ...dados.testes.map((t) => `- ${t.description}: ${t.detail ?? ""}`),
      ``,
      `PISTAS ENCONTRADAS`,
      ...dados.encontradas.map((c) => `- ${c.name} (${clueStatusLabel[session.clueStatus[c.id] ?? "encontrada"]})`),
      ``,
      `PISTAS PERDIDAS`,
      ...dados.perdidas.map((c) => `- ${c.name}`),
      ``,
      `CONSEQUÊNCIAS ATIVAS`,
      ...dados.ativas.map((c) => `- ${c}`),
      ``,
      `ROTAS IGNORADAS`,
      ...dados.ignoradas.map((c) => `- ${c}`),
      ``,
      `MEDIDORES`,
      `- Atenção da universidade: ${session.attentionLevel}/5`,
      `- Evidências concretas: ${session.evidenceCount}/10`,
      `- Exposição de Percy: ${session.percyExposure}/5`,
      `- Acesso a áreas restritas: ${session.restrictedAccess}`,
      `- Estado da vítima: ${session.victimStatus}`,
      `- Conhecimento sobre o Bloco C: ${session.blockCKnowledge}/5`,
      ``,
      `ANOTAÇÕES DO MESTRE`,
      ...session.notes.map((n) => `- D${n.day} ${n.time}: ${n.text}`),
    ];
    return linhas.join("\n");
  }, [dados, session]);

  const baixar = (conteudo: string, nome: string, tipo: string) => {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Resumo da Sessão</h1>
            <p className="text-sm text-muted-foreground">Gerado automaticamente a partir de tudo o que foi registrado.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => baixar(texto, "berco-vazio-resumo.txt", "text/plain")}>
              Exportar TXT
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => baixar(JSON.stringify(session, null, 2), "berco-vazio-sessao.json", "application/json")}
            >
              Exportar JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              Imprimir / PDF
            </Button>
          </div>
        </header>

        <section className="dossier rounded-sm p-4">
          <h2 className="stamp text-primary">Pontos de restauração</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => store.createCheckpoint(`Ponto ${new Date().toLocaleTimeString("pt-BR")}`)}>
              Criar ponto de restauração
            </Button>
            <Button size="sm" variant="outline" onClick={() => store.undo()}>
              Desfazer última ação
            </Button>
            {checkpoints.map((c) => (
              <Button key={c.id} size="sm" variant="ghost" onClick={() => store.restoreCheckpoint(c.id)}>
                Carregar “{c.label}”
              </Button>
            ))}
          </div>
        </section>

        <section className="paper-sheet rounded-sm p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{texto}</pre>
        </section>

        <section className="dossier rounded-sm p-5">
          <h2 className="font-display text-2xl">Informações para preparar a próxima parte</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Linha
              label="Qual caminho predominou"
              v={
                dados.escolhas.length
                  ? (dados.escolhas
                      .map((e) => e.route)
                      .filter(Boolean)
                      .sort(
                        (a, b) =>
                          dados.escolhas.filter((x) => x.route === b).length -
                          dados.escolhas.filter((x) => x.route === a).length,
                      )[0] ?? "—")
                  : "Nenhuma escolha registrada"
              }
            />
            <Linha
              label="Pistas que ainda precisam aparecer"
              v={
                CLUES.filter(
                  (c) =>
                    c.importance === "obrigatoria" &&
                    !["encontrada", "interpretada", "contingencia"].includes(session.clueStatus[c.id] ?? ""),
                )
                  .map((c) => c.name)
                  .join(", ") || "Nenhuma pendente"
              }
            />
            <Linha label="Consequências que devem continuar" v={dados.ativas.join(", ") || "Nenhuma"} />
            <Linha
              label="Quanto o grupo chamou atenção"
              v={`Atenção ${session.attentionLevel}/5 · Exposição de Percy ${session.percyExposure}/5`}
            />
            <Linha label="Conhecimento sobre o Bloco C" v={`${session.blockCKnowledge}/5`} />
            <Linha
              label="Teoria final do grupo"
              v={session.notes.filter((n) => n.text.toLowerCase().includes("teoria")).map((n) => n.text).join(" | ") || "Registre com uma anotação contendo a palavra “teoria”."}
            />
          </dl>
        </section>
      </div>
    </Shell>
  );
}

function Linha({ label, v }: { label: string; v: string }) {
  return (
    <div className="grid gap-1 md:grid-cols-[280px_1fr]">
      <dt className="stamp text-muted-foreground">{label}</dt>
      <dd>{v}</dd>
    </div>
  );
}
