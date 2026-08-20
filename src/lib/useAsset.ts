import { useEffect, useState } from "react";
import { getAsset, subscribeAssets } from "@/lib/assets";

function canRenderImage(url: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

/** Retorna uma object URL apenas quando o asset do IndexedDB existe e pode ser renderizado como imagem. */
export function useAsset(key: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;
    let alive = true;
    let loadId = 0;

    const releaseCurrent = () => {
      if (!currentUrl) return;
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    };

    const load = () => {
      const requestId = ++loadId;
      if (!key) {
        releaseCurrent();
        setUrl(null);
        return;
      }

      void getAsset(key)
        .then(async (blob) => {
          if (!alive || requestId !== loadId) return;
          if (!blob) {
            releaseCurrent();
            setUrl(null);
            return;
          }

          const next = URL.createObjectURL(blob);
          const valid = await canRenderImage(next);
          if (!alive || requestId !== loadId) {
            URL.revokeObjectURL(next);
            return;
          }

          if (!valid) {
            URL.revokeObjectURL(next);
            releaseCurrent();
            setUrl(null);
            return;
          }

          releaseCurrent();
          currentUrl = next;
          setUrl(next);
        })
        .catch(() => {
          if (!alive || requestId !== loadId) return;
          releaseCurrent();
          setUrl(null);
        });
    };

    load();
    const unsub = subscribeAssets(load);
    return () => {
      alive = false;
      loadId += 1;
      unsub();
      releaseCurrent();
    };
  }, [key]);

  return url;
}
