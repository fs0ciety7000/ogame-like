/* 6.14.152 (R4, É30-5b) : données du démarrage demandées par `index.html` avant le JavaScript du jeu.
   Avant : le contenu du jeu (`game_config`) et la fiche du joueur (`players`, `queues`) n'étaient demandés qu'après le
   téléchargement et l'exécution du bloc d'entrée, puis après le premier rendu de la coque (≈ 4 s sur mobile en 4G lente) :
   la page attendait ces deux allers-retours. Le script de tête de `index.html` (joueur connecté, adresse `/game…`) les lance
   dès l'arrivée de la page ; le jeu reprend ici ces réponses une seule fois. Même lecture que le SDK (mêmes adresses,
   même jeton) : le serveur reste seul juge, et toute erreur (jeton expiré, 404, compte suspendu) repasse par le chemin
   habituel du SDK, qui la traite comme avant. */

export type EarlyKey = "content" | "players" | "queues";

interface EarlyData {
  /** Heure de la demande (ms). */
  at: number;
  /** Compte dont le jeton a servi. */
  uid: string;
  content?: Promise<unknown>;
  players?: Promise<unknown>;
  queues?: Promise<unknown>;
}

declare global {
  interface Window {
    __cosmicEarly?: EarlyData;
  }
}

/** Au-delà, une réponse anticipée n'est plus reprise (onglet resté ouvert longtemps avant le démarrage du jeu). */
export const EARLY_MAX_AGE_MS = 60_000;

/** Réponse anticipée de `key` pour le compte `uid` (ou n'importe lequel pour le contenu, public), une seule fois ; `null` sinon.
 *  La promesse rejette si la requête a échoué : l'appelant repasse alors par le SDK. */
export function takeEarly<T>(key: EarlyKey, uid?: string, now = Date.now()): Promise<T> | null {
  const early = typeof window === "undefined" ? undefined : window.__cosmicEarly;
  if (!early || now - early.at > EARLY_MAX_AGE_MS) return null;
  if (uid !== undefined && early.uid !== uid) return null;
  const pending = early[key];
  if (!pending) return null;
  early[key] = undefined;
  return pending as Promise<T>;
}

/** Réponse anticipée si elle existe et réussit, sinon `load()` (chemin habituel). */
export function earlyOr<T>(key: EarlyKey, uid: string | undefined, load: () => Promise<T>): Promise<T> {
  const early = takeEarly<T>(key, uid);
  return early ? early.catch(() => load()) : load();
}
