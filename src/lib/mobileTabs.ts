/* Barre d'onglets mobile (NavBar). 6.14.64 (AD-13, AD-14, Q90). */

/** Onglets par défaut : Accueil, Bâtiments, Unités, Galaxie. Le Passe reste à un toucher par la ligne d'Ordres du jour.
 *  Un choix déjà enregistré par le joueur (« Épingler », `localStorage`) ne bouge pas : seul un appareil sans choix les prend. */
export const DEFAULT_TABS = ["/game", "/game/batiments", "/game/unites", "/game/galaxie"];

/** Pastille (neutre) du bouton « Plus » : messages, alliance et signalements non lus des pages qui ne sont pas déjà
 *  épinglées (leur onglet porte sa propre pastille). Le journal des versions n'y compte plus. */
export function moreBadgeCount(counts: { messages: number; alliance: number; reports: number }, pinned: readonly string[]): number {
  return (
    (pinned.includes("/game/messages") ? 0 : counts.messages) +
    (pinned.includes("/game/alliance") ? 0 : counts.alliance) +
    (pinned.includes("/game/signalements") ? 0 : counts.reports)
  );
}
