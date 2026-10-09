import { create } from "zustand";

/* 6.14.164 (S4, NJ-11) : serveur injoignable (redéploiement, redémarrage). Pendant une mise à jour, le relais renvoie
   502, 503 ou 504 (sans message du jeu), ou la requête échoue (statut 0). Avant, « Tout réclamer » et les autres
   boutons ne disaient rien : le joueur cliquait dans le vide. Ici, la première réponse de ce genre marque le serveur
   « en mise à jour » (bandeau `ServerDownBanner`) ; la première réponse normale efface la marque. */

export const useServerHealth = create<{ downSince: number | null }>(() => ({ downSince: null }));

/** Statut d'une réponse qui veut dire « serveur absent » (et pas une règle du jeu ni une maintenance annoncée). */
export function isServerUnreachable(status: number, hasGameMessage: boolean): boolean {
  if (status === 0) return true;
  if (status === 502 || status === 504) return true;
  // La maintenance du jeu répond 503 avec son propre message (« Le jeu est en maintenance… ») : ce n'est pas une panne.
  return status === 503 && !hasGameMessage;
}

export function markServerDown(now = Date.now()): void {
  if (useServerHealth.getState().downSince === null) useServerHealth.setState({ downSince: now });
}

export function markServerUp(): void {
  if (useServerHealth.getState().downSince !== null) useServerHealth.setState({ downSince: null });
}
