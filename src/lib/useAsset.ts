import { useEffect, useState } from "react";
import { getAsset, subscribeAssets } from "@/lib/assets";

/** Retorna uma object URL do asset no IndexedDB, ou null se não houver. */
export function useAsset(key: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let alive = true;

    const load = () => {
      if (!key) return setUrl(null);
      void getAsset(key).then((blob) => {
        if (!alive) return;
        if (revoked) URL.revokeObjectURL(revoked);
        if (!blob) return setUrl(null);
        const next = URL.createObjectURL(blob);
        revoked = next;
        setUrl(next);
      });
    };

    load();
    const unsub = subscribeAssets(load);
    return () => {
      alive = false;
      unsub();
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [key]);

  return url;
}
