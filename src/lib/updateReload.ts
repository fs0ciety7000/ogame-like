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
