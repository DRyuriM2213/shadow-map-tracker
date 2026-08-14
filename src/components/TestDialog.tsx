import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TESTS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";

export type TestResult = "SUCESSO" | "SUCESSO PARCIAL" | "FALHA" | "FALHA CRÍTICA" | "RESOLVER SEM TESTE";
const RESULTS: TestResult[] = ["SUCESSO", "SUCESSO PARCIAL", "FALHA", "FALHA CRÍTICA", "RESOLVER SEM TESTE"];
const ALREADY_EVIDENCE = ["encontrada", "interpretada", "contingencia"];

export function TestDialog({ testId, onClose, onResult }: { testId: string | null; onClose: () => void; onResult?: (result: TestResult, narration: string, testName: string) => void }) {
  const applyTest = useCampaign((s) => s.applyTest);
  const setClue = useCampaign((s) => s.setClue);
  const session = useCampaign((s) => s.session);
  const setClockRunning = useCampaign((s) => s.setClockRunning);
  const test = TESTS.find((t) => t.id === testId);
  const [feito, setFeito] = useState<TestResult | null>(null);

  useEffect(() => {
    setFeito(null);
    if (testId && session.autoPauseOnTest) setClockRunning(false);
  }, [testId, session.autoPauseOnTest, setClockRunning]);

  if (!test) return null;

  const detailFor = (r: TestResult) => r === "SUCESSO" ? test.success : r === "SUCESSO PARCIAL" ? test.partialSuccess : r === "FALHA" ? test.failure : r === "FALHA CRÍTICA" ? test.criticalFailure : "Resolvido pela narrativa, sem rolagem.";
  const narrationFor = (r: TestResult) => {
    const detail = detailFor(r);
    if (r === "SUCESSO") return `Depois de observar com atenção, o detalhe finalmente fica claro. ${detail}`;
    if (r === "SUCESSO PARCIAL") return `Vocês conseguem avançar, mas a resposta ainda vem incompleta. ${detail}`;
    if (r === "FALHA") return `A tentativa não entrega uma resposta segura agora. ${detail}`;
    if (r === "FALHA CRÍTICA") return `A tentativa dá errado de um jeito perceptível e deixa consequência. ${detail}`;
    return "A situação é resolvida pela narrativa, sem necessidade de rolagem.";
  };

  const resolve = (r: TestResult) => {
    const clueId = test.clueId;
    const current = clueId ? session.clueStatus[clueId] : undefined;
    const alreadyCounted = current ? ALREADY_EVIDENCE.includes(current) : false;

    // O store antigo soma atenção duas vezes quando FALHA CRÍTICA recebe clueId.
    // Registramos a falha crítica sem clueId e atualizamos a pista separadamente,
    // garantindo apenas +1 de atenção.
    if (r === "FALHA CRÍTICA" && clueId) {
      applyTest(test.id, r, detailFor(r));
      setClue(clueId, "perdida", `Resultado do teste ${test.name}`);
    } else {
      // Repetir um sucesso numa pista já contabilizada não deve inflar evidenceCount.
      applyTest(test.id, r, detailFor(r), alreadyCounted ? undefined : clueId);
    }

    setFeito(r);
    onResult?.(r, narrationFor(r), test.name);
  };

  return (
    <Dialog open={!!testId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">{test.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{test.description}</p>
          <dl className="grid gap-3 sm:grid-cols-2">
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
          <div className="flex flex-wrap gap-2 pt-2">{RESULTS.map((r) => <Button key={r} size="sm" variant={r.startsWith("FALHA") ? "destructive" : "default"} onClick={() => resolve(r)}>{r}</Button>)}</div>
          {feito && <div className="rounded-sm border border-primary/60 bg-primary/10 p-3"><p className="stamp text-primary">Narrar resultado — {feito}</p><p className="mt-1 font-display text-base leading-relaxed">{narrationFor(feito)}</p></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) { return <div><dt className="stamp text-muted-foreground">{label}</dt><dd>{value}</dd></div>; }
function Row({ label, value, tone }: { label: string; value: string; tone: string }) { return <p className="text-sm"><span className={`stamp ${tone}`}>{label}: </span>{value}</p>; }
