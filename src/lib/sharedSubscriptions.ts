/* 5.26 : abonnements temps réel partagés. Plusieurs écrans abonnés au même
   flux (collection, sujet, filtre) n'ouvrent qu'un abonnement côté serveur ;
   chaque évènement est redistribué à tous, et le dernier désabonnement ferme
   le flux. Indépendant de PocketBase pour être testable. */

type Handler<E> = (e: E) => void;
type Opener<E> = (emit: Handler<E>) => Promise<() => Promise<void> | void>;

interface Channel<E> {
  handlers: Set<Handler<E>>;
  close: (() => Promise<void> | void) | null;
  closed: boolean;
}

export function createSharedSubscriber<E>(onError: (key: string, err: unknown) => void = () => undefined) {
  const channels = new Map<string, Channel<E>>();

  function subscribe(key: string, open: Opener<E>, handler: Handler<E>): () => void {
    let ch = channels.get(key);
    if (!ch) {
      const fresh: Channel<E> = { handlers: new Set(), close: null, closed: false };
      ch = fresh;
      channels.set(key, fresh);
      open((e) => {
        // Copie : un écran peut se désabonner pendant la distribution.
        for (const h of [...fresh.handlers]) h(e);
      })
        .then((close) => {
          if (fresh.closed) void close();
          else fresh.close = close;
        })
        .catch((err) => {
          onError(key, err);
          if (channels.get(key) === fresh) channels.delete(key);
        });
    }
    const channel = ch;
    channel.handlers.add(handler);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      channel.handlers.delete(handler);
      if (channel.handlers.size === 0) {
        channel.closed = true;
        if (channels.get(key) === channel) channels.delete(key);
        void channel.close?.();
      }
    };
  }

  return {
    subscribe,
    /** Flux ouverts et nombre d'écrans abonnés (diagnostic). */
    stats: () => ({ channels: channels.size, listeners: [...channels.values()].reduce((n, c) => n + c.handlers.size, 0) }),
  };
}

/** Regroupe les appels rapprochés en un seul (le dernier gagne), après `waitMs`. */
export function coalesce(fn: () => void, waitMs: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, waitMs);
  };
}
