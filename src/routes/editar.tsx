import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { CLUES, LOCATIONS, SCENES, TESTS } from "@/data/campaignFull";
import { NPCS } from "@/data/npcs";
import { useCampaign } from "@/store/campaign";

export const Route = createFileRoute("/editar")({ component: EditarPage });

function EditarPage() {
  const store = useCampaign();
  const blocos = [
    { label: "Cenas preparadas", data: SCENES },
    { label: "Locais canônicos", data: LOCATIONS },
    { label: "Pistas e documentos globais", data: CLUES },
    { label: "Testes", data: TESTS },
    { label: "NPCs oficiais", data: NPCS },
  ];

  const exportCampaign = () => {
    const blob = new Blob([JSON.stringify({ SCENES, LOCATIONS, CLUES, TESTS, NPCS }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "berco-vazio-campanha-completa.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return <Shell><div className="mx-auto max-w-6xl space-y-6">
    <header className="dossier rounded-sm p-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="stamp text-primary">Diagnóstico e conteúdo bruto</p><h1 className="text-3xl font-semibold">Campanha completa</h1><p className="text-sm text-muted-foreground">Esta tela usa o dataset completo: documentos 01–40, Bloco C, pistas não documentais, locais e os 16 NPCs oficiais. Os Dias 3/4 continuam sem cenas preparadas.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={exportCampaign}>Exportar conteúdo</Button><Link to="/assets"><Button size="sm" variant="outline">Imagens / backup</Button></Link><Button size="sm" variant="destructive" onClick={() => { if (confirm("ATENÇÃO: iniciar uma nova sessão substitui o estado atual. Exporte um backup antes. Continuar?")) store.newSession(); }}>Nova sessão</Button></div></div>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{blocos.map((b)=><div key={b.label} className="dossier rounded-sm p-3"><p className="stamp text-muted-foreground">{b.label}</p><p className="mt-1 text-3xl font-semibold">{b.data.length}</p></div>)}</div>
    {blocos.map((b)=><details key={b.label} className="dossier rounded-sm p-4"><summary className="cursor-pointer font-semibold">{b.label} <span className="text-xs text-muted-foreground">({b.data.length})</span></summary><pre className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">{JSON.stringify(b.data,null,2)}</pre></details>)}
  </div></Shell>;
}