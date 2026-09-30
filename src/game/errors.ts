/** Erreur « métier » affichée telle quelle au joueur (ressources
 *  insuffisantes, prérequis manquants…). Levée par les actions de jeu,
 *  côté serveur comme côté client. */
export class GameActionError extends Error {}
