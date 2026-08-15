import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

  const { data, error } = await (client.rpc as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>)(fn, body);

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
