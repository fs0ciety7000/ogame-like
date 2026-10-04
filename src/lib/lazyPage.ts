import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/** 5.15.4 : page chargée à la demande. Si son fichier a disparu avec une mise à jour,
 *  main.tsx recharge le site (vite:preloadError) et Vite résout alors l'import à
 *  `undefined` : on attend le rechargement au lieu de planter (« can't access property
 *  "JournalPage", e is undefined » remonté en erreur automatique). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- même contrainte que React.lazy
export function lazyPage<M, K extends keyof M>(load: () => Promise<M>, name: K): LazyExoticComponent<M[K] & ComponentType<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- idem
  type C = M[K] & ComponentType<any>;
  return lazy(() => load().then((m) => (m ? { default: m[name] as C } : new Promise<{ default: C }>(() => undefined))));
}
