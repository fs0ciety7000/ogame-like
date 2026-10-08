import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { importWithRetry } from "@/lib/updateReload";

/** 6.14.116 (É30-5) : chargeurs des pages, par nom d'export, pour lancer tôt celui de la page ouverte (`preloadPage`). */
const loaders = new Map<string, () => Promise<unknown>>();

/** 5.15.4 : page chargée à la demande. Si son fichier a disparu avec une mise à jour,
 *  main.tsx recharge le site (vite:preloadError) et Vite résout alors l'import à
 *  `undefined` : on attend le rechargement au lieu de planter (« can't access property
 *  "JournalPage", e is undefined » remonté en erreur automatique).
 *  6.14.116 : l'import est mémorisé ; `preloadPage(nom)` le lance avant le rendu (même promesse). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- même contrainte que React.lazy
export function lazyPage<M, K extends keyof M>(load: () => Promise<M>, name: K): LazyExoticComponent<M[K] & ComponentType<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- idem
  type C = M[K] & ComponentType<any>;
  let pending: Promise<M> | null = null;
  const once = () => {
    if (!pending) pending = importWithRetry(load);
    return pending;
  };
  loaders.set(String(name), once);
  return lazy(() => once().then((m) => (m ? { default: m[name] as C } : new Promise<{ default: C }>(() => undefined))));
}

/** 6.14.116 (É30-5) : télécharge le code d'une page sans attendre son rendu (page ouverte au démarrage : en parallèle des
 *  données du jeu, au lieu d'après). Nom inconnu : rien. Une erreur est gardée pour le rendu (même promesse). */
export function preloadPage(name: string | undefined): void {
  if (!name) return;
  const load = loaders.get(name);
  if (load) void load().catch(() => undefined);
}
