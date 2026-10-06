/** v4.3.2 : rechargement unique quand des fichiers de l'ancienne version
 *  manquent (défini dans index.html, avant tout script du jeu). */
declare global {
  interface Window {
    __reloadForUpdate?: () => boolean;
  }
}

export function reloadForUpdate(): boolean {
  return window.__reloadForUpdate?.() ?? false;
}

/** Erreur typique d'un fichier de l'ancienne version introuvable. */
export function isStaleChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /dynamically imported module|Importing a module script failed|is not a valid JavaScript MIME type|Failed to fetch dynamically|error loading dynamically imported module/i.test(msg);
}

/** 5.26.2 : rechargement manuel en contournant le cache de la page (paramètre ?v=). */
export function hardReload(): void {
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString(36));
  window.location.replace(url.toString());
}

/** 5.26.2 : import d'une page retenté deux fois (mise en ligne en cours) avant d'abandonner. */
export async function importWithRetry<M>(load: () => Promise<M>, delays: number[] = [800, 2500]): Promise<M> {
  for (let i = 0; ; i += 1) {
    try {
      return await load();
    } catch (err) {
      if (i >= delays.length || !isStaleChunkError(err)) throw err;
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
}
