import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CLUES, CONSEQUENCES, LOCATIONS, SCENES } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";
import { routeText } from "@/lib/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operação Berço Vazio — Painel do Mestre" },
      {
        name: "description",
        content:
          "Painel interativo para conduzir a campanha de investigação paranormal Operação Berço Vazio na Universidade Valença.",
      },
      { property: "og:title", content: "Operação Berço Vazio — Painel do Mestre" },
      {
        property: "og:description",
        content: "Sistema de condução de sessão: cenas, pistas, testes, consequências e timeline.",
      },
    ],
  }),
  component: Dashboard,
});

const BOTOES = [
  { to: "/sessao", label: "Continuar sessão" },
  { to: "/mapa", label: "Mapa interativo" },
  { to: "/diagrama", label: "Abrir diagrama" },
  { to: "/timeline", label: "Abrir timeline" },
  { to: "/locais", label: "Locais e salas" },
  { to: "/pistas", label: "Pistas" },
  { to: "/personagens", label: "Personagens" },
  { to: "/consequencias", label: "Consequências" },
  { to: "/resumo", label: "Resumo da sessão" },
  { to: "/editar", label: "Editar campanha" },
] as const;

function BlocosOperacionais() {
  const session = useCampaign((s) => s.session);
  const { proximo, countdown } = useTimelineStatus();
  const { pace, narrativo, real } = useSessionPace();
  const local = LOCATIONS.find((l) => l.id === session.currentLocationId);
  const scene = SCENES.find((s) => s.id === session.currentSceneId);
  const pendentes = CLUES.filter(
    (c) =>
      c.importance === "obrigatoria" &&
      !["encontrada", "interpretada", "contingencia"].includes(session.clueStatus[c.id] ?? ""),
  );

  return (
    <section className="grid gap-3 lg:grid-cols-3">
      <div className="dossier rounded-sm p-4">
        <p className="stamp text-primary">Agora</p>
        <p className="mt-1 font-mono text-3xl">{session.time}</p>
        <p className="text-sm">{local?.name ?? "Local não definido"}</p>
        <p className="text-xs text-muted-foreground">{scene?.title ?? "Sem cena ativa"}</p>
        <div className="mt-3">
          <ClockControls />
        </div>
      </div>

      <div className="dossier rounded-sm p-4">
        <p className="stamp text-primary">Próximo evento</p>
        {proximo ? (
          <>
            <p className="mt-1 font-mono text-3xl">{proximo.time}</p>
            <p className="text-sm font-semibold">{proximo.title}</p>
            <p className="text-xs text-muted-foreground">
              em {countdown} min de jogo · {proximo.mandatory ? "obrigatório" : "opcional"}
            </p>
            <p className="mt-2 text-xs">{proximo.description}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum evento pendente para hoje.</p>
        )}
        <p className={`stamp mt-3 ${paceTone[pace]}`}>
          Ritmo: {paceLabel[pace]} — narrativa {Math.round(narrativo * 100)}% / sessão real {Math.round(real * 100)}%
        </p>
      </div>

      <div className="dossier rounded-sm p-4">
        <p className="stamp text-primary">Pistas obrigatórias pendentes</p>
        <p className="mt-1 text-3xl font-semibold">{pendentes.length}</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {pendentes.slice(0, 6).map((c) => (
            <li key={c.id}>
              • {c.name} <span className="text-foreground">(DT {session.dcOverrides[c.id] ?? c.dc})</span>
            </li>
          ))}
        </ul>
        <Link to="/pistas">
          <Button size="sm" variant="outline" className="mt-3 w-full">
            Abrir catálogo de pistas
          </Button>
        </Link>
      </div>
    </section>
  );
}


function Dashboard() {
  const session = useCampaign((s) => s.session);
  const newSession = useCampaign((s) => s.newSession);
  const setMeter = useCampaign((s) => s.setMeter);

  const scene = SCENES.find((s) => s.id === session.currentSceneId);
  const local = LOCATIONS.find((l) => l.id === session.currentLocationId);
  const encontradas = CLUES.filter((c) =>
    ["encontrada", "interpretada", "encontrada-parcialmente", "contingencia"].includes(
      session.clueStatus[c.id] ?? "",
    ),
  );
  const disponiveis = CLUES.filter((c) => (session.clueStatus[c.id] ?? "escondida") === "disponivel");
  const pendentes = session.scheduled.filter((s) => s.status === "pendente");
  const ultima = session.log[session.log.length - 1];
  const escolhas = session.log.filter((l) => l.actionType === "escolha");

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="dossier rounded-sm p-6">
          <p className="stamp text-primary">Universidade Valença — arquivo de campanha</p>
          <h1 className="mt-2 text-4xl font-semibold">OPERAÇÃO BERÇO VAZIO</h1>
          <p className="stamp mt-1 text-muted-foreground">Painel do Mestre</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Sessão atual" value={session.sessionName} />
            <Info label="Dia atual" value={`DIA ${session.day} — ${session.day === 1 ? "17/08/2026" : "18/08/2026"}`} />
            <Info label="Horário no RPG" value={session.time} />
            <Info label="Local atual" value={local?.name ?? "—"} />
            <Info label="Cena atual" value={scene?.title ?? "—"} />
            <Info
              label="Caminho escolhido"
              value={
                escolhas.length ? escolhas[escolhas.length - 1]!.description.replace("Escolha: ", "") : "Nenhum ainda"
              }
              tone={scene ? routeText[scene.route] : undefined}
            />
            <Info label="Pistas encontradas" value={`${encontradas.length} de ${CLUES.length}`} />
            <Info label="Pistas disponíveis agora" value={String(disponiveis.length)} />
            <Info label="Eventos futuros agendados" value={String(pendentes.length)} />
            <Info label="Nível de atenção atraída" value={`${session.attentionLevel} / 5`} />
            <Info label="Última ação registrada" value={ultima?.description ?? "—"} />
            <Info label="Registros no histórico" value={String(session.log.length)} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/sessao" className="sm:col-span-2 lg:col-span-1">
            <Button className="h-20 w-full text-base">CONTINUAR SESSÃO</Button>
          </Link>
          <Button
            variant="outline"
            className="h-20 text-base"
            onClick={() => {
              if (confirm("Iniciar uma nova sessão? O estado atual será substituído.")) newSession();
            }}
          >
            INICIAR NOVA SESSÃO
          </Button>
          {BOTOES.slice(1).map((b) => (
            <Link key={b.to} to={b.to}>
              <Button variant="secondary" className="h-20 w-full text-base uppercase">
                {b.label}
              </Button>
            </Link>
          ))}
        </section>

        <section className="dossier rounded-sm p-6">
          <h2 className="text-xl font-semibold">Medidores da campanha</h2>
          <p className="text-xs text-muted-foreground">
            Mudam automaticamente com as escolhas, mas podem ser ajustados manualmente a qualquer momento.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Meter
              label="Atenção da universidade"
              value={session.attentionLevel}
              max={5}
              legend={[
                "0 — ninguém percebeu a investigação",
                "1 — curiosidade leve",
                "2 — funcionários observam",
                "3 — segurança acompanha",
                "4 — acessos são fechados",
                "5 — investigação abertamente comprometida",
              ]}
              onChange={(v) => setMeter("attentionLevel", v as never)}
            />
            <Meter
              label="Evidências concretas"
              value={session.evidenceCount}
              max={10}
              onChange={(v) => setMeter("evidenceCount", v as never)}
            />
            <Meter
              label="Exposição de Percy"
              value={session.percyExposure}
              max={5}
              legend={["Mede apenas o risco de a missão secreta de Percy ser descoberta."]}
              onChange={(v) => setMeter("percyExposure", v as never)}
            />
            <Meter
              label="Conhecimento sobre o Bloco C"
              value={session.blockCKnowledge}
              max={5}
              legend={[
                "0 — nenhuma referência",
                "1 — boato",
                "2 — nome encontrado",
                "3 — possível localização",
                "4 — acesso conhecido",
                "5 — entrada confirmada",
              ]}
              onChange={(v) => setMeter("blockCKnowledge", v as never)}
            />
            <Select
              label="Acesso a áreas restritas"
              value={session.restrictedAccess}
              options={["nenhum", "temporario", "clandestino", "autorizado", "perdido"]}
              onChange={(v) => setMeter("restrictedAccess", v as never)}
            />
            <Select
              label="Estado da vítima do refletor"
              value={session.victimStatus}
              options={["ilesa", "ferida", "gravemente-ferida", "estabilizada"]}
              onChange={(v) => setMeter("victimStatus", v as never)}
            />
          </div>
        </section>

        <section className="dossier rounded-sm p-6">
          <h2 className="text-xl font-semibold">Consequências pendentes</h2>
          {pendentes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma consequência agendada no momento.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {pendentes.map((p) => {
                const q = CONSEQUENCES.find((c) => c.id === p.consequenceId);
                return (
                  <li key={p.id} className="border-l-2 border-l-route-vermelho pl-3">
                    <span className="font-semibold">{q?.name}</span>{" "}
                    <span className="text-muted-foreground">— ativação: {q?.triggerTime}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: string | undefined }) {
  return (
    <div className="rounded-sm border border-border bg-secondary/40 p-3">
      <p className="stamp text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function Meter({
  label,
  value,
  max,
  legend,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  legend?: string[] | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-sm border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="stamp">{label}</p>
        <p className="font-mono text-lg">
          {value} / {max}
        </p>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[oklch(0.6_0.21_25)]"
      />
      {legend && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
          {legend.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-sm border border-border p-3">
      <p className="stamp">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace("-", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
