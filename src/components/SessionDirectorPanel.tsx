import { useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLUES, LOCATIONS } from "@/data/campaignFull";
import { NPCS, npcsForLocation } from "@/data/npcs";
import { useCampaign } from "@/store/campaign";
import { AlertTriangle, ClipboardCopy, Compass, Dice5, MapPin, Route, Sparkles, WandSparkles, X } from "lucide-react";

type NarrationMode = "CHEGADA" | "OBSERVAÇÃO" | "BUSCA" | "CONVERSA" | "DESCOBERTA" | "SUCESSO" | "PARCIAL" | "FALHA" | "FALHA CRÍTICA" | "TENSÃO" | "HORROR" | "PERSEGUIÇÃO" | "TRANSIÇÃO" | "SILÊNCIO";
type Intensity = "SUTIL" | "ESTRANHO" | "TENSO" | "PARANORMAL";
type Length = "CURTA" | "MÉDIA" | "CINEMATOGRÁFICA";
type Sense = "GERAL" | "VISUAL" | "SOM" | "CHEIRO" | "TEMPERATURA" | "ESPAÇO" | "PESSOAS";

const MODES: NarrationMode[] = ["CHEGADA","OBSERVAÇÃO","BUSCA","CONVERSA","DESCOBERTA","SUCESSO","PARCIAL","FALHA","FALHA CRÍTICA","TENSÃO","HORROR","PERSEGUIÇÃO","TRANSIÇÃO","SILÊNCIO"];
const INTENSITIES: Intensity[] = ["SUTIL","ESTRANHO","TENSO","PARANORMAL"];
const LENGTHS: Length[] = ["CURTA","MÉDIA","CINEMATOGRÁFICA"];
const SENSES: Sense[] = ["GERAL","VISUAL","SOM","CHEIRO","TEMPERATURA","ESPAÇO","PESSOAS"];

const sensory: Record<Sense, string[]> = {
  GERAL: ["A primeira impressão vem do conjunto: luz, distância, ruído e circulação parecem comuns até alguém decidir olhar com atenção.","O espaço não entrega uma resposta pronta. Ele oferece detalhes suficientes para que uma escolha concreta diga onde a cena realmente vai começar."],
  VISUAL: ["A iluminação cria recortes duros entre corredores, portas e objetos. Pequenas diferenças de posição chamam mais atenção do que qualquer coisa ostensiva.","Linhas de visão, reflexos, portas entreabertas e marcas recentes ajudam a separar rotina de interferência."],
  SOM: ["O som chega antes das pessoas: passos, vibração de equipamento, uma porta ao longe e ruídos que somem quando alguém para para ouvir.","O eco do setor torna difícil saber distância exata. Um mesmo ruído parece mudar de direção conforme o grupo se move."],
  CHEIRO: ["O ar mistura cheiro de papel, limpeza, metal, comida ou produto técnico conforme o setor. Uma nota fora desse padrão pode indicar uso recente.","O cheiro mais útil não é o mais forte, e sim o que não combina com o lugar e o horário."],
  TEMPERATURA: ["A temperatura muda pouco a pouco entre portas e corredores. Uma corrente de ar, calor preso ou frio localizado ajuda a perceber circulação e infraestrutura.","A sensação térmica denuncia espaços abertos, máquinas em uso ou áreas que deveriam estar inativas."],
  ESPAÇO: ["Distâncias, quinas, saídas e obstáculos importam. O local deixa claro onde alguém poderia observar sem ser visto e por onde seria possível sair rápido.","O desenho do espaço cria escolhas: ficar exposto para ver melhor, usar cobertura, contornar ou procurar um acesso menos óbvio."],
  PESSOAS: ["Quem está no setor reage primeiro à presença do grupo, não ao mistério. Rotina, pressa, curiosidade e desconforto ajudam a medir o quanto aquela abordagem chama atenção.","Olhares, interrupções e mudanças no ritmo da conversa dizem tanto quanto respostas diretas, mas não provam nada sozinhos."],
};

const modeText: Record<NarrationMode, string[]> = {
  CHEGADA: ["Ao entrar, vocês ainda têm alguns segundos antes de escolher um alvo. O lugar parece funcionar pela própria rotina, sem indicar sozinho o que merece confiança.","A mudança de ambiente é imediata, mas a ameaça não. Primeiro aparecem acessos, pessoas, objetos e o que parece fora do lugar."],
  OBSERVAÇÃO: ["Sem tocar em nada, dá para comparar organização, marcas de uso, circulação e coisas deslocadas. O cenário começa a separar detalhe de decoração.","Quanto mais vocês observam, menos o espaço parece homogêneo. Certos pontos têm sinais recentes; outros parecem evitados ou usados de forma diferente."],
  BUSCA: ["A busca faz sentido quando parte do que deveria existir aqui: registros, gavetas, terminais, armários, objetos de rotina e vestígios de uso.","Vocês começam pelo provável e deixam o improvável para depois. Isso reduz ruído e aumenta a chance de perceber uma inconsistência verdadeira."],
  CONVERSA: ["A conversa começa melhor pela versão normal dos fatos. Perguntas específicas demais cedo podem fechar a pessoa antes de revelar qualquer contradição.","A resposta vem acompanhada de ritmo, hesitação, escolha de palavras e do que a pessoa tenta encerrar rápido demais. Nada disso substitui evidência, mas ajuda a decidir a próxima pergunta."],
  DESCOBERTA: ["O detalhe não parece espetacular isoladamente. O peso vem da incompatibilidade com o que vocês já viram, tornando aquela pequena informação difícil de ignorar.","Uma peça finalmente encaixa em outra. Ainda não fecha o caso, mas muda quais perguntas valem o tempo de vocês daqui para frente."],
  SUCESSO: ["A abordagem funciona e entrega o objetivo de forma clara. Além da resposta imediata, sobra uma informação prática que pode orientar o próximo movimento.","Vocês conseguem exatamente o que procuravam sem precisar forçar uma conclusão maior do que a evidência permite."],
  PARCIAL: ["A tentativa avança, mas cobra alguma coisa: tempo, exposição, ruído ou uma resposta incompleta. O caminho continua aberto, só não gratuitamente.","Parte do objetivo fica acessível. O restante exige outra abordagem, mais tempo ou aceitar uma complicação concreta."],
  FALHA: ["A tentativa não produz o resultado agora. O local não fecha a investigação; apenas mostra que esse método não foi suficiente.","Nada útil aparece por essa abordagem. A informação importante continua recuperável por outra fonte ou outro ângulo."],
  "FALHA CRÍTICA": ["Além de não funcionar, a ação altera a cena: alguém pode notar, o tempo pode pesar ou uma condição do ambiente pode piorar. A pista essencial não desaparece para sempre.","O erro deixa marca. A próxima tentativa ainda é possível, mas agora acontece sob uma consequência que não existia antes."],
  TENSÃO: ["Primeiro vem um sinal pequeno. Depois outro. Nenhum deles exige pânico, mas permanecer no mesmo lugar começa a parecer uma decisão em si.","O setor continua quase igual, só que agora qualquer passo, porta ou voz distante ganha importância. Existe tempo para agir, mas não para fingir que nada mudou."],
  HORROR: ["Alguma coisa física está errada de um jeito difícil de explicar como manutenção. Não há uma resposta visível, apenas a certeza de que o padrão normal do prédio foi quebrado.","O desconforto deixa de ser abstrato. Textura, som, temperatura ou cheiro apontam para algo que não deveria existir ali daquela maneira."],
  PERSEGUIÇÃO: ["O prédio vira parte da corrida. Portas, escadas, linhas de visão e escolhas de rota importam mais do que simplesmente quem começou na frente.","Cada curva força uma decisão rápida: seguir o caminho óbvio, cortar por um acesso secundário ou perder alguns segundos para desaparecer da linha de visão."],
  TRANSIÇÃO: ["Ao deixar o setor, vocês carregam mais do que uma pista: posição de portas, pessoas presentes, horários e mudanças que poderão ser comparadas depois.","O local fica para trás, mas o que vocês acabaram de descobrir muda a forma como o próximo setor será lido."],
  SILÊNCIO: ["Por alguns segundos, ninguém no ambiente oferece informação nova. Esse vazio cria espaço para os jogadores decidirem o que fazer sem o mestre empurrar uma direção.","A cena segura a respiração. Nada acontece automaticamente; o próximo movimento pertence ao grupo."],
};

function seedPick<T>(items: T[], seed: number) { return items[Math.abs(seed) % items.length]!; }

function buildNarration(locationName: string, description: string, mode: NarrationMode, intensity: Intensity, length: Length, sense: Sense, action: string, seed: number) {
  const base = seedPick(modeText[mode], seed);
  const sensoryLine = seedPick(sensory[sense], seed + 1);
  const intensityLine: Record<Intensity, string> = {
    SUTIL: "Nada no texto confirma perigo por conta própria; a cena continua aberta para interpretação.",
    ESTRANHO: "Existe uma pequena quebra de rotina, perceptível o bastante para merecer atenção, não para provar uma causa.",
    TENSO: "A margem para agir sem consequência está diminuindo, e o ambiente começa a reagir à presença do grupo.",
    PARANORMAL: "Há sinais sensoriais incompatíveis com uma explicação puramente comum, mas a origem ainda depende do que for descoberto em mesa.",
  };
  const actionLine = action.trim() ? `A ação declarada — ${action.trim()} — direciona a cena, mas o resultado ainda depende da abordagem e de teste apenas se houver risco e incerteza.` : "O próximo foco continua em aberto: observar, conversar, procurar, tocar, recuar ou mudar de rota são escolhas válidas.";
  const opener = `Em ${locationName}, ${description ? description.charAt(0).toLowerCase() + description.slice(1) : "o espaço se apresenta pela rotina do setor"}`;
  if (length === "CURTA") return `${opener}. ${base}`;
  if (length === "MÉDIA") return `${opener}. ${sensoryLine}\n\n${base} ${intensityLine[intensity]}\n\n${actionLine}`;
  return `${opener}. ${sensoryLine}\n\n${base}\n\n${intensityLine[intensity]} ${actionLine}\n\nAntes de responder qualquer coisa maior, vale observar o que mudou por causa da presença e das escolhas do grupo. A narração descreve consequência e atmosfera, não decide o que os personagens pensam ou fazem.`;
}

const routeBlueprints = [
  { keys:["segurança","seguranca"], title:"Segurança / CFTV", gain:"câmeras, sensores, horários e credenciais", risk:"ser registrado ou cruzar com uma ronda" },
  { keys:["secretaria"], title:"Secretaria / TI", gain:"crachás, Wi-Fi, convocações e histórico administrativo", risk:"deixar rastros em sistema ou chamar funcionário" },
  { keys:["biblioteca","arquivo"], title:"Biblioteca / Arquivo", gain:"histórico, reformas, Ricardo Nogueira e documentos antigos", risk:"gastar tempo e precisar cruzar várias fontes" },
  { keys:["química","quimica"], title:"Laboratório de Química", gain:"estoque, materiais, acessos noturnos e ocorrências", risk:"área técnica, armários e controle de acesso" },
  { keys:["manutenção","manutencao"], title:"Manutenção / rota técnica", gain:"acessos de serviço, etiquetas e setor apagado", risk:"isolamento, pouca cobertura social e maior exposição" },
];

export function SessionDirectorPanel() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const store = useCampaign();
  const session = store.session;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<NarrationMode>("CHEGADA");
  const [intensity, setIntensity] = useState<Intensity>("SUTIL");
  const [length, setLength] = useState<Length>("MÉDIA");
  const [sense, setSense] = useState<Sense>("GERAL");
  const [action, setAction] = useState("");
  const [seed, setSeed] = useState(0);
  const [text, setText] = useState("");

  const location = LOCATIONS.find((l) => l.id === session.currentLocationId) ?? LOCATIONS[0];
  const localNpcs = useMemo(() => npcsForLocation(location?.id), [location?.id]);
  const localClues = useMemo(() => CLUES.filter((c) => c.mainLocationId === location?.id), [location?.id]);
  const routes = useMemo(() => routeBlueprints.flatMap((route) => {
    const loc = LOCATIONS.find((l) => route.keys.some((k) => `${l.name} ${l.sector}`.toLowerCase().includes(k)));
    return loc ? [{...route, locationId:loc.id, locationName:loc.name}] : [];
  }), []);

  // Ferramenta exclusiva do mestre: nunca aparece na tela de login nem fora do cockpit.
  if (pathname !== "/sessao-v2" || !store.authed) return null;

  const generate = (nextSeed = seed) => {
    const next = buildNarration(location?.name ?? "o local", location?.description ?? "", mode, intensity, length, sense, action, nextSeed);
    setText(next);
    return next;
  };
  const logNarration = () => {
    const finalText = text.trim() || generate();
    store.logAction("narracao-diretor", `${mode} · ${location?.name ?? "Local"}`, finalText.slice(0, 900));
  };
  const complication = (label: string, detail: string, attention = 0) => {
    if (attention) store.setMeter("attentionLevel", Math.min(5, session.attentionLevel + attention));
    store.logAction("complicacao", label, detail);
    setText(`${detail}\n\nA complicação muda a situação, mas não obriga os jogadores a seguir uma rota específica.`);
  };

  return <div className="fixed bottom-4 right-4 z-[85] w-[min(620px,calc(100vw-2rem))]">
    {open && <div className="mb-2 max-h-[82vh] overflow-y-auto rounded-sm border border-primary/40 bg-background/98 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-3"><div className="flex size-9 items-center justify-center rounded-sm border border-primary/40 bg-primary/10"><WandSparkles className="size-4 text-primary"/></div><div className="min-w-0 flex-1"><p className="stamp text-primary">Diretor de cena</p><h3 className="font-semibold">Narração, improviso e rotas</h3><p className="mt-1 text-xs text-muted-foreground">Ferramenta do mestre. Gera texto sem decidir ações, pensamentos ou conclusões dos personagens.</p></div><Button size="sm" variant="ghost" onClick={()=>setOpen(false)}><X className="size-4"/></Button></div>
      <div className="mt-3 rounded-sm border border-border bg-secondary/20 p-3"><div className="flex items-center gap-2"><MapPin className="size-4 text-primary"/><b>{location?.name}</b><span className="ml-auto text-xs text-muted-foreground">{localClues.length} achados · {localNpcs.length} NPCs prováveis</span></div></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Tipo" value={mode} values={MODES} onChange={(v)=>setMode(v as NarrationMode)}/>
        <Select label="Intensidade" value={intensity} values={INTENSITIES} onChange={(v)=>setIntensity(v as Intensity)}/>
        <Select label="Tamanho" value={length} values={LENGTHS} onChange={(v)=>setLength(v as Length)}/>
        <Select label="Foco" value={sense} values={SENSES} onChange={(v)=>setSense(v as Sense)}/>
      </div>
      <label className="mt-3 block text-xs text-muted-foreground">O que os jogadores acabaram de fazer<Input className="mt-1" value={action} onChange={(e)=>setAction(e.target.value)} placeholder="Ex.: Sofia vasculha o terminal enquanto outro personagem vigia a porta"/></label>
      <div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>generate()}><Sparkles className="mr-1 size-4"/>Gerar narração</Button><Button variant="outline" onClick={()=>{const s=seed+1;setSeed(s);generate(s);}}>Outra versão</Button><Button variant="outline" disabled={!text} onClick={()=>navigator.clipboard.writeText(text)}><ClipboardCopy className="mr-1 size-4"/>Copiar</Button><Button variant="secondary" disabled={!text} onClick={logNarration}>Registrar no histórico</Button></div>
      <Textarea className="mt-3 min-h-44 font-display text-base leading-relaxed" value={text} onChange={(e)=>setText(e.target.value)} placeholder="A narração aparece aqui e pode ser editada antes de você usar."/>

      <div className="mt-5 border-t border-border pt-4"><div className="flex items-center gap-2"><Route className="size-4 text-primary"/><div><p className="stamp text-primary">Rotas de investigação</p><p className="text-xs text-muted-foreground">Sugestões paralelas; nenhuma é obrigatória.</p></div></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{routes.map((route)=><div key={route.locationId} className="rounded-sm border border-border p-3"><b className="text-sm">{route.title}</b><p className="mt-1 text-xs"><span className="text-route-verde-claro">Pode render:</span> {route.gain}</p><p className="mt-1 text-xs"><span className="text-route-amarelo">Risco:</span> {route.risk}</p><Button size="sm" variant="outline" className="mt-2 w-full" onClick={()=>store.setLocation(route.locationId)}><Compass className="mr-1 size-3.5"/>Mover grupo para {route.locationName}</Button></div>)}</div></div>

      <div className="mt-5 border-t border-border pt-4"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-route-amarelo"/><p className="stamp text-route-amarelo">Complicações rápidas</p></div><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>complication("Ronda se aproxima","Um rádio estala no corredor e passos começam a se aproximar. Ainda existe tempo para esconder, conversar, sair ou preparar outra abordagem.",1)}>Ronda +1 atenção</Button><Button size="sm" variant="outline" onClick={()=>complication("Funcionário chega","Uma porta abre e alguém da rotina do campus entra no setor. A pessoa ainda não sabe o que o grupo está fazendo.")}>Funcionário chega</Button><Button size="sm" variant="outline" onClick={()=>complication("Porta trava","O mecanismo de uma porta muda de estado com um clique seco. Há outras soluções possíveis além de forçar a passagem.")}>Porta trava</Button><Button size="sm" variant="outline" onClick={()=>complication("Luz falha","A iluminação oscila e parte do setor mergulha em sombra por alguns segundos. O ambiente muda, não a agência dos jogadores.")}>Luz falha</Button><Button size="sm" variant="outline" onClick={()=>complication("Ruído distante","Alguma coisa pesada se move ou bate longe demais para identificar a origem. O grupo decide se investiga ou ignora.")}>Ruído distante</Button><Button size="sm" variant="outline" onClick={()=>{store.advanceTime(15); store.logAction("complicacao","Tempo consumido","A ação custou aproximadamente 15 minutos de campanha.");}}><Dice5 className="mr-1 size-3.5"/>Custo +15 min</Button></div></div>
    </div>}
    <Button className="ml-auto flex shadow-2xl" variant={open?"secondary":"outline"} onClick={()=>setOpen((v)=>!v)}><WandSparkles className="mr-2 size-4"/>{open?"Fechar diretor":"Diretor de Cena"}</Button>
  </div>;
}

function Select({label,value,values,onChange}:{label:string;value:string;values:string[];onChange:(v:string)=>void}) { return <label className="text-[11px] text-muted-foreground">{label}<select className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-2 text-xs text-foreground" value={value} onChange={(e)=>onChange(e.target.value)}>{values.map((v)=><option key={v}>{v}</option>)}</select></label>; }
