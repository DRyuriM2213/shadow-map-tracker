import type { MapRegion } from "@/lib/playerCloudTypes";

export type MapTokenKind = "PLAYER" | "NPC";
export interface ParsedMapToken {
  locationId: string;
  kind: MapTokenKind;
  subjectId: string;
  name: string;
  floor: string;
  x: number;
  y: number;
  size: number;
  archived: boolean;
}

const PREFIX = "token-v1~";
const ARCHIVED_PREFIX = "__token_deleted__";
const clamp = (value: number) => Math.max(0, Math.min(100, Number(value)));

export function makeMapTokenLocationId(kind: MapTokenKind, subjectId: string) {
  const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return `${PREFIX}${kind}~${encodeURIComponent(subjectId)}~${nonce}`;
}

export function isMapTokenRegion(region: MapRegion) {
  const id = region.locationId ?? region.location_id ?? "";
  return id.startsWith(PREFIX);
}

export function parseMapTokenRegion(region: MapRegion): ParsedMapToken | null {
  const locationId = region.locationId ?? region.location_id ?? "";
  if (!locationId.startsWith(PREFIX)) return null;
  const [, kindRaw, subjectRaw] = locationId.split("~");
  if ((kindRaw !== "PLAYER" && kindRaw !== "NPC") || !subjectRaw) return null;
  const x = Number(region.x), y = Number(region.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const rawLabel = String(region.label ?? "Token");
  const archived = rawLabel.startsWith(ARCHIVED_PREFIX);
  const name = archived ? rawLabel.slice(ARCHIVED_PREFIX.length).trim() || "Token" : rawLabel;
  return {
    locationId,
    kind: kindRaw,
    subjectId: decodeURIComponent(subjectRaw),
    name,
    floor: String(region.floor),
    x: clamp(x),
    y: clamp(y),
    size: Math.max(2.5, Math.min(8, Number(region.width) || 4)),
    archived,
  };
}

export function tokenRegionPayload(token: { locationId: string; floor: string; name: string; x: number; y: number; size?: number; archived?: boolean }) {
  const size = Math.max(2.5, Math.min(8, Number(token.size) || 4));
  const label = token.archived ? `${ARCHIVED_PREFIX} ${token.name}` : token.name;
  return {
    floor: token.floor,
    locationId: token.locationId,
    location_id: token.locationId,
    label,
    x: Number(clamp(token.x).toFixed(2)),
    y: Number(clamp(token.y).toFixed(2)),
    width: size,
    height: size,
  };
}
