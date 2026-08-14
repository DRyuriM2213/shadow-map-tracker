/**
 * GERENCIADOR DE ASSETS DO MESTRE
 * Imagens grandes (plantas e retratos de NPC) ficam no IndexedDB — nunca no
 * localStorage. Chaves fixas para os 4 mapas; `npc:<id>` para retratos.
 */

const DB_NAME = "berco-vazio-assets";
const STORE = "files";

export type MapAssetKey =
  | "map:primeiro:limpo"
  | "map:primeiro:numerado"
  | "map:superior:limpo"
  | "map:superior:numerado";

export const MAP_ASSET_SLOTS: { key: MapAssetKey; label: string }[] = [
  { key: "map:primeiro:limpo", label: "Primeiro andar — limpo" },
  { key: "map:primeiro:numerado", label: "Primeiro andar — numerado" },
  { key: "map:superior:limpo", label: "Andar superior — limpo" },
  { key: "map:superior:numerado", label: "Andar superior — numerado" },
];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function subscribeAssets(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function putAsset(key: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notify();
}

export async function deleteAsset(key: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notify();
}

export async function getAsset(key: string): Promise<Blob | null> {
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function listAssetKeys(): Promise<string[]> {
  const db = await openDb();
  const keys = await new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
    req.onerror = () => reject(req.error);
  });
  db.close();
  return keys;
}
