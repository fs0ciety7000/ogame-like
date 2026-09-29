import PocketBase, { type RecordSubscription } from "pocketbase";

/** URL du serveur PocketBase (voir .env.example). */
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090";

export const pbConfigured = Boolean(import.meta.env.VITE_POCKETBASE_URL);

export const pb = new PocketBase(pbUrl);

// Plusieurs écrans lancent les mêmes requêtes en parallèle (abonnements,
// heartbeat) : l'annulation automatique du SDK les ferait échouer.
pb.autoCancellation(false);

/** Abonnement temps réel qui renvoie une fonction de désabonnement
 *  synchrone, comme l'API React/Zustand l'attend. Chaque appel a son propre
 *  désabonnement : contrairement à `collection.unsubscribe(topic)`, il ne
 *  coupe pas les autres écrans abonnés au même topic. */
export function subscribeRecords<T = Record<string, unknown>>(
  collection: string,
  topic: string,
  handler: (e: RecordSubscription<T & { id: string }>) => void,
  filter?: string,
): () => void {
  let cancelled = false;
  let unsubscribe: (() => Promise<void>) | null = null;

  pb.collection(collection)
    .subscribe<T & { id: string }>(topic, handler, filter ? { filter } : undefined)
    .then((fn) => {
      if (cancelled) void fn();
      else unsubscribe = fn;
    })
    .catch((err) => console.error(`Abonnement ${collection}/${topic} impossible :`, err));

  return () => {
    cancelled = true;
    void unsubscribe?.();
  };
}

/** Limite une fonction à un appel par intervalle (le dernier appel en
 *  attente est toujours exécuté) — pour les listes rafraîchies à chaque
 *  évènement temps réel, comme le classement. */
export function throttle(fn: () => void, waitMs: number): () => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    const remaining = waitMs - (Date.now() - last);
    if (remaining <= 0) {
      last = Date.now();
      fn();
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn();
      }, remaining);
    }
  };
}

/** true si l'erreur PocketBase correspond à un enregistrement introuvable
 *  (ou masqué par les règles d'accès, qui renvoient aussi 404). */
export function isNotFound(err: unknown): boolean {
  return (err as { status?: number })?.status === 404;
}
