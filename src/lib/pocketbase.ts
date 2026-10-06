import PocketBase, { type RecordSubscription } from "pocketbase";
import { createSharedSubscriber } from "@/lib/sharedSubscriptions";

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
const shared = createSharedSubscriber<RecordSubscription<{ id: string }>>((key, err) => console.error(`Abonnement ${key} impossible :`, err));

/** 5.26 : flux temps réel ouverts et écrans abonnés (diagnostic, Web Vitals). */
export const realtimeStats = shared.stats;

export function subscribeRecords<T = Record<string, unknown>>(
  collection: string,
  topic: string,
  handler: (e: RecordSubscription<T & { id: string }>) => void,
  filter?: string,
): () => void {
  // 5.26 : un seul abonnement serveur par (collection, sujet, filtre), partagé entre les écrans.
  return shared.subscribe(
    `${collection}/${topic}${filter ? `?${filter}` : ""}`,
    (emit) => pb.collection(collection).subscribe<{ id: string }>(topic, emit, filter ? { filter } : undefined),
    handler as (e: RecordSubscription<{ id: string }>) => void,
  );
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
