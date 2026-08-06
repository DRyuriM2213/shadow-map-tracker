import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TESTS } from "@/data/campaign";
import { useCampaign } from "@/store/campaign";

const RESULTS = ["SUCESSO", "SUCESSO PARCIAL", "FALHA", "FALHA CRÍTICA", "RESOLVER SEM TESTE"] as const;

export function TestDialog({ testId, onClose }: { testId: string | null; onClose: () => void }) {
  const applyTest = useCampaign((s) => s.applyTest);
  const test = TESTS.find((t) => t.id === testId);
  const [feito, setFeito] = useState<string | null>(null);

  if (!test) return null;

  const detailFor = (r: string) =>
    r === "SUCESSO"
      ? test.success
      : r === "SUCESSO PARCIAL"
        ? test.partialSuccess
        : r === "FALHA"
          ? test.failure
          : r === "FALHA CRÍTICA"
            ? test.criticalFailure
            : "Resolvido pela narrativa, sem rolagem.";

  return (
    <Dialog
      open={!!testId}
      onOpenChange={(o) => {
        if (!o) {
          setFeito(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{test.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{test.description}</p>
          <dl className="grid grid-cols-2 gap-3">
            <Field label="Dificuldade sugerida" value={test.difficulty} />
            <Field label="Quem pode realizar" value={test.suggestedCharacters} />
            <Field label="Vantagem" value={test.advantages} />
            <Field label="Desvantagem" value={test.disadvantages} />
          </dl>
          <div className="space-y-2 rounded-sm border border-border p-3">
            <Row label="Sucesso" value={test.success} tone="text-route-verde-claro" />
            <Row label="Sucesso parcial" value={test.partialSuccess} tone="text-route-amarelo" />
            <Row label="Falha" value={test.failure} tone="text-route-vermelho" />
            <Row label="Falha crítica" value={test.criticalFailure} tone="text-destructive" />
            <Row label="Falha segura (contingência)" value={test.fallback} tone="text-route-cinza" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {RESULTS.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={r.startsWith("FALHA") ? "destructive" : "default"}
                onClick={() => {
                  applyTest(test.id, r, detailFor(r), test.clueId);
                  setFeito(r);
                }}
              >
                {r}
              </Button>
            ))}
          </div>
          {feito && (
            <div className="rounded-sm border border-primary/60 bg-primary/10 p-3">
              <p className="stamp text-primary">Resultado registrado: {feito}</p>
              <p className="mt-1">{detailFor(feito)}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="stamp text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <p className="text-sm">
      <span className={`stamp ${tone}`}>{label}: </span>
      {value}
    </p>
  );
}
