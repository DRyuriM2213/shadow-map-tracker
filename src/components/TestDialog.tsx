import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TESTS } from "@/data/campaignFull";
import { useCampaign } from "@/store/campaign";

export type TestResult = "SUCESSO" | "SUCESSO PARCIAL" | "FALHA" | "FALHA CRÍTICA" | "RESOLVER SEM TESTE";
const RESULTS: TestResult[] = ["SUCESSO", "SUCESSO PARCIAL", "FALHA", "FALHA CRÍTICA", "RESOLVER SEM TESTE"];
const ALREADY_EVIDENCE = ["encontrada", "interpretada", "contingencia", "encontrada-parcialmente"];

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

  // Texto seguro para leitura em voz alta. O efeito mecânico/canônico abaixo fica
  // separado porque vários testes antigos contêm informação exclusiva do mestre.
  const narrationFor = (r: TestResult) => {
    if (r === "SUCESSO") return "A abordagem funciona. O detalhe que vocês estavam tentando confirmar se torna claro o bastante para avançar a investigação. O mestre pode agora entregar a informação correspondente à pista.";
    if (r === "SUCESSO PARCIAL") return "Vocês conseguem avançar, mas a resposta vem incompleta. Há uma parte útil e confiável aqui, enquanto o restante ainda exige tempo, outra fonte ou uma abordagem diferente.";
    if (r === "FALHA") return "A tentativa não produz uma conclusão segura agora. O que vocês observam ainda permite novas abordagens; nada indica que essa linha de investigação tenha se perdido para sempre.";
    if (r === "FALHA CRÍTICA") return "A tentativa chama atenção ou cria uma complicação perceptível. O objetivo não é alcançado agora, e a situação ao redor fica mais difícil — mas a informação importante ainda pode ser recuperada de outra forma.";
    return "A situação se resolve pela própria narrativa. Não é necessário fazer uma rolagem para prosseguir.";
  };

  const resolve = (r: TestResult) => {
    const clueId = test.clueId;
    const current = clueId ? session.clueStatus[clueId] : undefined;
    const alreadyCounted = current ? ALREADY_EVIDENCE.includes(current) : false;

    if (r === "FALHA CRÍTICA" && clueId) {
      // Aplica a consequência mecânica apenas uma vez e mantém uma rota de
      // contingência para a pista; nenhuma evidência essencial some para sempre.
      applyTest(test.id, r, detailFor(r));
      setClue(clueId, "contingencia", `Falha crítica em ${test.name}; pista deve reaparecer por outra abordagem.`);
    } else {
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
          <div className="rounded-sm border border-route-preto/50 bg-black/25 p-3">
            <p className="stamp text-route-cinza">PARA O MESTRE — NÃO LER AUTOMATICAMENTE</p>
            <div className="mt-2 space-y-2">
              <Row label="Sucesso" value={test.success} tone="text-route-verde-claro" />
              <Row label="Sucesso parcial" value={test.partialSuccess} tone="text-route-amarelo" />
              <Row label="Falha" value={test.failure} tone="text-route-vermelho" />
              <Row label="Falha crítica" value={test.criticalFailure} tone="text-destructive" />
              <Row label="Falha segura / contingência" value={test.fallback} tone="text-route-cinza" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">{RESULTS.map((r) => <Button key={r} size="sm" variant={r.startsWith("FALHA") ? "destructive" : "default"} onClick={() => resolve(r)}>{r}</Button>)}</div>
          {feito && <div className="rounded-sm border border-primary/60 bg-primary/10 p-3"><p className="stamp text-primary">NARRAR RESULTADO — {feito}</p><p className="mt-1 font-display text-base leading-relaxed">{narrationFor(feito)}</p><p className="mt-3 border-t border-primary/20 pt-2 text-xs text-muted-foreground"><b>Efeito para o mestre:</b> {detailFor(feito)}</p></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) { return <div><dt className="stamp text-muted-foreground">{label}</dt><dd>{value}</dd></div>; }
function Row({ label, value, tone }: { label: string; value: string; tone: string }) { return <p className="text-sm"><span className={`stamp ${tone}`}>{label}: </span>{value}</p>; }
