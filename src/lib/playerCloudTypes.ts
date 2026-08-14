import type { CharacterSheetData } from "@/data/ordemRules";

export type PlayerRoleType = "AGENTE_DA_ORDEM" | "VILAO" | "CIVIL";
export interface PlayerSummary { id:string; playerName:string; characterName:string; roleType:PlayerRoleType; active:boolean; avatarUrl?:string|null; masterNote:string; canEditSheet:boolean; createdAt?:string; updatedAt?:string; lastSeen?:string|null; hasSheet:boolean; }
export interface PublicState { day:1|2; time:string; currentLocationId?:string|null; currentLocationName?:string|null; shareLocation:boolean; objective:string; updatedAt?:string; }
export interface CloudRoll { id:string; playerId:string; playerName?:string; characterName?:string; visibility:"PUBLICA"|"PRIVADA"; label:string; formula:string; payload:Record<string,unknown>; total?:number|null; createdAt:string; }
export interface CloudNotification { id:string; kind:string; title:string; body:string; is_read?:boolean; isRead?:boolean; created_at?:string; createdAt?:string; }
export interface CloudClue { id:string; clue_id?:string; clueId?:string; title:string; description:string; document_title?:string|null; documentTitle?:string|null; private_message?:string; privateMessage?:string; created_at?:string; createdAt?:string; }
export interface CloudDocument { id:string; document_id?:string; documentId?:string; title:string; description:string; private_message?:string; privateMessage?:string; created_at?:string; createdAt?:string; }
export interface PlayerNote { id:string; player_id?:string; playerId?:string; title:string; body:string; tags:string[]; share_with_master?:boolean; shareWithMaster?:boolean; created_at?:string; createdAt?:string; updated_at?:string; updatedAt?:string; }
export interface MapRegion { id?:string; floor:"primeiro"|"superior"|string; location_id?:string; locationId?:string; label:string; x:number; y:number; width:number; height:number; }
export interface MapReveal { id?:string; target_player_id?:string|null; targetPlayerId?:string|null; floor:string; location_id?:string; locationId?:string; revealed:boolean; updated_at?:string; updatedAt?:string; }
export interface SharedAsset { asset_key?:string; assetKey?:string; kind:string; public_url?:string; publicUrl?:string; }
export interface MasterDashboardData { ok:boolean; error?:string; players:PlayerSummary[]; rolls:CloudRoll[]; publicState?:Record<string,unknown>; mapRegions:MapRegion[]; mapReveals:MapReveal[]; }
export interface PlayerBootstrapData { ok:boolean; error?:string; profile:{id:string;playerName:string;characterName:string;roleType:PlayerRoleType;avatarUrl?:string|null;canEditSheet:boolean;lastSeen?:string|null}; publicState:Record<string,unknown>; sheet:Partial<CharacterSheetData>; notes:PlayerNote[]; rolls:CloudRoll[]; notifications:CloudNotification[]; clues:CloudClue[]; documents:CloudDocument[]; mapRegions:MapRegion[]; mapReveals:MapReveal[]; assets:SharedAsset[]; serverTime?:string; }

export function normalizePublicState(raw?: Record<string, unknown>): PublicState {
  const r = raw ?? {};
  const day = Number(r["day"] ?? 1) === 2 ? 2 : 1;
  return {
    day,
    time: String(r["time"] ?? "08:00"),
    currentLocationId: (r["currentLocationId"] ?? r["current_location_id"] ?? null) as string | null,
    currentLocationName: (r["currentLocationName"] ?? r["current_location_name"] ?? null) as string | null,
    shareLocation: Boolean(r["shareLocation"] ?? r["share_location"] ?? false),
    objective: String(r["objective"] ?? ""),
    updatedAt: String(r["updatedAt"] ?? r["updated_at"] ?? ""),
  };
}
export const regionLocationId=(r:MapRegion)=>r.locationId??r.location_id??"";
export const revealLocationId=(r:MapReveal)=>r.locationId??r.location_id??"";
export const revealTargetId=(r:MapReveal)=>r.targetPlayerId??r.target_player_id??null;
