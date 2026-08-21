/** Motor de progressão automática da ficha — regras-base usadas pelo Berço Mestre. */
import type { OrdemAttribute, TrainingLevel } from "@/data/ordemRules";

export type OrdemBaseClass = "Combatente" | "Especialista" | "Ocultista";
export type SheetClassName = OrdemBaseClass | "Custom";
export type ParanormalElement = "SANGUE" | "MORTE" | "CONHECIMENTO" | "ENERGIA";
export type RitualElement = ParanormalElement | "MEDO" | "NEUTRO";

export const ELEMENTS: { id: ParanormalElement; label: string }[] = [
  { id: "SANGUE", label: "Sangue" }, { id: "MORTE", label: "Morte" },
  { id: "CONHECIMENTO", label: "Conhecimento" }, { id: "ENERGIA", label: "Energia" },
];

export const TRAILS_BY_CLASS: Record<OrdemBaseClass, string[]> = {
  Combatente: ["Aniquilador", "Comandante de Campo", "Guerreiro", "Operações Especiais", "Tropa de Choque"],
  Especialista: ["Atirador de Elite", "Infiltrador", "Médico de Campo", "Negociador", "Técnico"],
  Ocultista: ["Conduíte", "Flagelador", "Graduado", "Intuitivo", "Lâmina Paranormal"],
};

export const CLASS_RESOURCES: Record<OrdemBaseClass, { pvBase:number; pvPerAdvance:number; peBase:number; pePerAdvance:number; sanBase:number; sanPerAdvance:number }> = {
  Combatente: { pvBase:20, pvPerAdvance:4, peBase:2, pePerAdvance:2, sanBase:12, sanPerAdvance:3 },
  Especialista: { pvBase:16, pvPerAdvance:3, peBase:3, pePerAdvance:3, sanBase:16, sanPerAdvance:4 },
  Ocultista: { pvBase:12, pvPerAdvance:2, peBase:4, pePerAdvance:4, sanBase:20, sanPerAdvance:5 },
};

export const NEX_STEPS:number[] = [...Array.from({ length:19 }, (_,i)=>(i+1)*5), 99];
export function normalizeNex(raw:number){ const value=Number.isFinite(raw)?Math.round(raw):5; if(value>=97)return 99; return Math.min(95,Math.max(5,Math.round(value/5)*5)); }
export function nexLevel(nex:number){ const value=normalizeNex(nex); return value===99?20:value/5; }
export const nexAdvances=(nex:number)=>Math.max(0,nexLevel(nex)-1);
export const peRoundLimit=(nex:number)=>nexLevel(nex);
export function nextNex(nex:number){ const i=NEX_STEPS.indexOf(normalizeNex(nex)); return i>=0&&i<NEX_STEPS.length-1?NEX_STEPS[i+1]!:null; }
export function previousNex(nex:number){ const i=NEX_STEPS.indexOf(normalizeNex(nex)); return i>0?NEX_STEPS[i-1]!:null; }

export type MilestoneKind="TRILHA"|"HABILIDADE_TRILHA"|"PODER"|"ATRIBUTO"|"TREINAMENTO"|"VERSATILIDADE"|"ELEMENTO";
export interface MilestoneDef { id:string; nex:number; kind:MilestoneKind; label:string; help:string; }
const milestone=(id:string,nex:number,kind:MilestoneKind,label:string,help:string):MilestoneDef=>({id,nex,kind,label,help});

export const MILESTONES:MilestoneDef[] = [
  milestone("m-trilha-10",10,"TRILHA","Escolher trilha","Escolha uma trilha da sua classe. O primeiro marco de trilha vem junto desta escolha."),
  ...[15,30,45,60,75,90].map(nex=>milestone(`m-poder-${nex}`,nex,"PODER",`Poder de classe · ${nex}%`,"Registre um poder de classe ou Transcender. Transcender substitui o ganho de SAN deste avanço.")),
  ...[20,50,80,95].map(nex=>milestone(`m-atributo-${nex}`,nex,"ATRIBUTO",`Aumento de atributo · ${nex}%`,`+1 em um atributo, uma única vez neste marco.`)),
  ...[35,70].map(nex=>milestone(`m-treino-${nex}`,nex,"TREINAMENTO",`Grau de treinamento · ${nex}%`,nex===35?"Treinado → Veterano.":"Veterano → Expert.")),
  milestone("m-versatilidade-50",50,"VERSATILIDADE","Versatilidade · 50%","Registre sua escolha sem o site inventar efeitos."),
  milestone("m-elemento-50",50,"ELEMENTO","Conexão elemental · 50%","Escolha Sangue, Morte, Conhecimento ou Energia."),
  ...[40,65,99].map(nex=>milestone(`m-trilha-hab-${nex}`,nex,"HABILIDADE_TRILHA",`Habilidade da trilha · ${nex}%`,"Confirme o marco da trilha; o texto completo não é copiado pelo site.")),
].sort((a,b)=>a.nex-b.nex||a.label.localeCompare(b.label));

export interface ProgressionChoice {
  id:string; milestoneId:string; nex:number; kind:MilestoneKind; value:string;
  transcender?:boolean; grantsRitual?:boolean; activatesAffinity?:boolean; note?:string; createdAt?:string;
}
export interface KnownRitual { id:string; ritualId?:string; name:string; element:RitualElement; circle:number; legacy?:boolean; note?:string; }
export interface ProgressionState {
  version:number; choices:ProgressionChoice[]; element:ParanormalElement|null; elementLocked:boolean;
  knownRituals:KnownRitual[]; overrides:{pvMax?:number;peMax?:number;sanMax?:number;peRoundLimit?:number};
}
export const PROGRESSION_VERSION=3;
export function emptyProgression():ProgressionState { return {version:PROGRESSION_VERSION,choices:[],element:null,elementLocked:false,knownRituals:[],overrides:{}}; }
export function normalizeProgression(raw:unknown):ProgressionState {
  const base=emptyProgression(); if(!raw||typeof raw!=="object")return base;
  const data=raw as Partial<ProgressionState>; const allowed=new Set(ELEMENTS.map(e=>e.id));
  return { version:PROGRESSION_VERSION,
    choices:Array.isArray(data.choices)?data.choices.filter((c):c is ProgressionChoice=>Boolean(c&&typeof c.value==="string"&&typeof c.milestoneId==="string")):[],
    element:data.element&&allowed.has(data.element)?data.element:null, elementLocked:Boolean(data.elementLocked),
    knownRituals:Array.isArray(data.knownRituals)?data.knownRituals.filter((r):r is KnownRitual=>Boolean(r&&typeof r.name==="string"&&Number.isFinite(Number(r.circle)))):[],
    overrides:{...(data.overrides??{})},
  };
}

export const baseClassOf=(className:SheetClassName):OrdemBaseClass|null=>className==="Combatente"||className==="Especialista"||className==="Ocultista"?className:null;
export function reachedMilestones(nex:number){ const n=normalizeNex(nex); return MILESTONES.filter(m=>n>=m.nex); }
export function pendingMilestones(nex:number,choices:ProgressionChoice[]){ const done=new Set(choices.map(c=>c.milestoneId)); return reachedMilestones(nex).filter(m=>!done.has(m.id)); }
export function suspendedChoices(nex:number,choices:ProgressionChoice[]){ const n=normalizeNex(nex); return choices.filter(c=>c.nex>n); }
export const transcenderChoices=(choices:ProgressionChoice[],nex:number)=>choices.filter(c=>c.kind==="PODER"&&c.transcender&&c.nex<=normalizeNex(nex));

export interface DerivedResources { pvMax:number; peMax:number; sanMax:number; peRoundLimit:number; sanLostToTranscender:number; }
export function derivedResources(params:{className:SheetClassName;nex:number;attributes:Record<OrdemAttribute,number>;choices:ProgressionChoice[]}):DerivedResources|null {
  const cls=baseClassOf(params.className); if(!cls)return null; const rule=CLASS_RESOURCES[cls]; const advances=nexAdvances(params.nex);
  const vig=Math.max(0,Number(params.attributes.VIG??0)), pre=Math.max(0,Number(params.attributes.PRE??0));
  const transcended=new Set(transcenderChoices(params.choices,params.nex).map(c=>c.nex)); const sanLostToTranscender=transcended.size*rule.sanPerAdvance;
  return { pvMax:Math.max(1,rule.pvBase+vig+advances*(rule.pvPerAdvance+vig)), peMax:Math.max(1,rule.peBase+pre+advances*(rule.pePerAdvance+pre)), sanMax:Math.max(1,rule.sanBase+advances*rule.sanPerAdvance-sanLostToTranscender), peRoundLimit:peRoundLimit(params.nex), sanLostToTranscender };
}
export function reconcileCurrent(current:number,oldMax:number,newMax:number){ if(!Number.isFinite(current)||oldMax<=0)return newMax; const spent=Math.max(0,oldMax-current); return Math.max(0,Math.min(newMax,newMax-spent)); }

export function ritualSlots(params:{className:SheetClassName;nex:number;choices:ProgressionChoice[]}){ if(baseClassOf(params.className)==="Ocultista")return 3+nexAdvances(params.nex); return params.choices.filter(c=>c.nex<=normalizeNex(params.nex)&&c.grantsRitual===true).length; }
export const hasRitualAccess=(params:{className:SheetClassName;nex:number;choices:ProgressionChoice[]})=>baseClassOf(params.className)==="Ocultista"||ritualSlots(params)>0;
export function maxRitualCircle(className:SheetClassName,nex:number,access=true){ const n=normalizeNex(nex); if(baseClassOf(className)==="Ocultista")return n>=85?4:n>=55?3:n>=25?2:1; if(!access)return 0; return n>=75?3:n>=45?2:1; }
export function affinityActive(state:ProgressionState,nex:number){ return Boolean(state.element&&normalizeNex(nex)>=50&&state.choices.some(c=>c.nex>=50&&c.nex<=normalizeNex(nex)&&c.activatesAffinity===true)); }

export function eligibleTrainingUpgrades(milestoneNex:number,skills:Record<string,{training:TrainingLevel}>){ const expert=milestoneNex>=70; const from:TrainingLevel=expert?"VETERANO":"TREINADO"; const to:TrainingLevel=expert?"EXPERT":"VETERANO"; return {from,to,skillIds:Object.entries(skills).filter(([,s])=>s.training===from).map(([id])=>id)}; }

export interface ProgressionIssue { level:"erro"|"aviso"; message:string; }
export function validateProgression(params:{className:SheetClassName;trail?:string;nex:number;attributes:Record<OrdemAttribute,number>;skills:Record<string,{training:TrainingLevel}>;state:ProgressionState;freeMode:boolean}):ProgressionIssue[] {
  const issues:ProgressionIssue[]=[]; const cls=baseClassOf(params.className);
  if(!cls)issues.push({level:"aviso",message:"Classe custom: automação de recursos e trilha fica desativada."});
  if(cls&&params.trail&&!TRAILS_BY_CLASS[cls].includes(params.trail))issues.push({level:"aviso",message:`A trilha “${params.trail}” não pertence à classe ${cls}. A escolha foi preservada.`});
  const pending=pendingMilestones(params.nex,params.state.choices); if(pending.length)issues.push({level:"aviso",message:`${pending.length} escolha(s) de progressão pendente(s).`});
  const suspended=suspendedChoices(params.nex,params.state.choices); if(suspended.length)issues.push({level:"aviso",message:`${suspended.length} escolha(s) acima do NEX atual estão suspensas, mas preservadas.`});
  const slots=ritualSlots({className:params.className,nex:params.nex,choices:params.state.choices}); if(!params.freeMode&&params.state.knownRituals.length>slots)issues.push({level:"erro",message:`Rituais conhecidos (${params.state.knownRituals.length}) acima do limite atual (${slots}).`});
  const circle=maxRitualCircle(params.className,params.nex,hasRitualAccess({className:params.className,nex:params.nex,choices:params.state.choices})); const tooHigh=params.state.knownRituals.filter(r=>!r.legacy&&r.circle>circle); if(!params.freeMode&&tooHigh.length)issues.push({level:"erro",message:`${tooHigh.length} ritual(is) acima do círculo liberado (${circle}º).`});
  return issues;
}
