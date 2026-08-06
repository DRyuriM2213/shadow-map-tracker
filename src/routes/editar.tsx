import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CLUES, LOCATIONS, SCENES, TESTS } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";

export const Route = createFileRoute("/editar")({
  head: () => ({
    meta: [
      { title: "Editar Campanha — Berço Vazio" },
      { name: "description", content: "Consulte e exporte o conteúdo bruto da campanha: cenas, locais, pistas e testes." },
      { property: "og:title", content: "Editar Campanha — Berço Vazio" },
      { property: "og:description", content: "Base de conteúdo da Operação Berço Vazio." },
    ],
  }),
  component: EditarPage,
});

function EditarPage() {
  const store = useCampaign();
  const blocos = [
    { label: "Cenas", data: SCENES },
    { label: "Locais", data: LOCATIONS },
    { label: "Pistas", data: CLUES },
    { label: "Testes", data: TESTS },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Editar Campanha</h1>
            <p className="text-sm text-muted-foreground">
              Conteúdo completo dos Dias 1 e 2. Exporte para editar fora do sistema ou reiniciar a sessão.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([JSON.stringify({ SCENES, LOCATIONS, CLUES, TESTS }, null, 2)], {
                  type: "application/json",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "berco-vazio-campanha.json";
                a.click();
              }}
            >
              Exportar campanha
            </Button>
            <Button size="sm" variant="destructive" onClick={() => store.newSession()}>
              Nova sessão
            </Button>
          </div>
        </header>

        {blocos.map((b) => (
          <details key={b.label} className="dossier rounded-sm p-4">
            <summary className="cursor-pointer font-semibold">
              {b.label} <span className="text-xs text-muted-foreground">({b.data.length})</span>
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
              {JSON.stringify(b.data, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </Shell>
  );
}
