import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { makeManualRevealLocationId } from "@/lib/playerCloudTypes";

export type CloudRole = "MASTER" | "PLAYER";

export interface CloudSession {
  role: CloudRole;
  token: string;
  player?: {
    id: string;
    playerName: string;
    characterName: string;
    roleType: "AGENTE_DA_ORDEM" | "VILAO" | "CIVIL";
    avatarUrl?: string | null;
    canEditSheet: boolean;
  };
}

const CLOUD_SESSION_KEY = "berco-vazio-cloud-session";

// Mantém o ID manual criado pela tela do mapa alinhado entre o salvamento
// da região e a liberação feita logo em seguida.
const manualRevealAliases = new Map<string, string>();

function normalizeManualMapRpc(fn: string, body: Record<string, unknown>) {
  if (fn === "master_set_map_region") {
    const rawPayload = body.p_payload;
    if (rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)) {
      const payload = rawPayload as Record<string, unknown>;
      const originalId = String(payload.locationId ?? payload.location_id ?? "");
      const floor = String(payload.floor ?? "");
      const x = Number(payload.x), y = Number(payload.y), width = Number(payload.width), height = Number(payload.height);
      if (originalId.startsWith("manual-") && floor && [x, y, width, height].every(Number.isFinite)) {
        const encodedId = makeManualRevealLocationId({ floor, x, y, width, height });
        manualRevealAliases.set(originalId, encodedId);
        return {
          ...body,
          p_payload: {
            ...payload,
            locationId: encodedId,
            location_id: encodedId,
          },
        };
      }
    }
  }

  if (fn === "master_set_map_reveal") {
    const originalId = String(body.p_location_id ?? "");
    const encodedId = manualRevealAliases.get(originalId);
    if (encodedId) return { ...body, p_location_id: encodedId };
  }

  return body;
}

// Usa o cliente oficial gerado do projeto (Lovable Cloud). Assim as credenciais
// vêm do mesmo lugar no preview e no site publicado.
let clientRef: SupabaseClient | null = null;
let clientChecked = false;

function getClient(): SupabaseClient | null {
  if (clientChecked) return clientRef;
  clientChecked = true;
  try {
    // Acessar uma propriedade força a criação do cliente (proxy lazy).
    void supabase.rpc;
    clientRef = supabase as unknown as SupabaseClient;
  } catch {
    clientRef = null;
  }
  return clientRef;
}

export function cloudConfigured() {
  return getClient() !== null;
}

export function getCloudSession(): CloudSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLOUD_SESSION_KEY);
    return raw ? (JSON.parse(raw) as CloudSession) : null;
  } catch {
    return null;
  }
}

export function setCloudSession(value: CloudSession | null) {
  if (typeof window === "undefined") return;
  if (!value) sessionStorage.removeItem(CLOUD_SESSION_KEY);
  else sessionStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(value));
}

export async function rpc<T = Record<string, unknown>>(
  fn: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const client = getClient();
  if (!client) throw new Error("Lovable Cloud ainda não está disponível neste build.");

  const normalizedBody = normalizeManualMapRpc(fn, body);
  const { data, error } = await (client.rpc as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>)(fn, normalizedBody);

  if (error) throw new Error(error.message || "Erro no Cloud");
  return data as T;
}


export async function loginCloud(pin: string): Promise<CloudSession | null> {
  if (!cloudConfigured()) return null;

  const master = await rpc<{ ok: boolean; token?: string }>("master_login", { p_pin: pin });
  if (master.ok && master.token) {
    const session: CloudSession = { role: "MASTER", token: master.token };
    setCloudSession(session);
    return session;
  }

  const player = await rpc<{
    ok: boolean;
    token?: string;
    player?: CloudSession["player"];
  }>("player_login", { p_pin: pin });
  if (player.ok && player.token && player.player) {
    const session: CloudSession = { role: "PLAYER", token: player.token, player: player.player };
    setCloudSession(session);
    return session;
  }
  return null;
}

export async function logoutCloud() {
  const session = getCloudSession();
  setCloudSession(null);
  if (!session || !cloudConfigured()) return;
  try {
    await rpc("logout_session", { p_token: session.token, p_role: session.role });
  } catch {
    // Sessão local deve encerrar mesmo se o backend estiver indisponível.
  }
}

export function requireMasterToken() {
  const session = getCloudSession();
  return session?.role === "MASTER" ? session.token : null;
}

export function requirePlayerSession() {
  const session = getCloudSession();
  return session?.role === "PLAYER" ? session : null;
}
