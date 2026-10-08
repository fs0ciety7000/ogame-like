/* 6.14.157 (R4b) : identifiant et nom de la saison, sortis de `seasons.ts` (qui importe `flush`, donc presque tout le
   moteur) : `defaults.ts` les lit, et `playerService` lit `defaults.ts` ; sans ce module, lire les défauts du joueur chargeait
   tout le moteur (préalable à un découpage du bloc d'entrée). Module sans import. */

export const SEASON_MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** Une saison = un mois calendaire (UTC, pour rester déterministe côté
 *  client quel que soit le fuseau horaire du joueur). Pas de Cloud
 *  Function ni de tâche planifiée : chaque client détecte lui-même le
 *  changement de saison à son prochain flush et réinitialise son propre
 *  compteur — cohérent avec le reste de l'architecture 100% client. */
export function currentSeasonId(now: number = Date.now()): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function seasonLabel(seasonId: string): string {
  const [year, month] = seasonId.split("-").map(Number);
  return `${SEASON_MONTHS[(month ?? 1) - 1] ?? "?"} ${year ?? ""}`.trim();
}
