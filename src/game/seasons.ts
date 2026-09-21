import type { PlayerState } from "@/types/game";

const SEASON_MONTHS = [
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

/** Remet à zéro le compteur saisonnier si la saison a changé depuis le
 *  dernier flush de ce joueur — appelé à chaque flush, même sans gain
 *  d'XP, pour que l'affichage se rafraîchisse dès la reconnexion. */
export function ensureSeasonRollover(player: PlayerState, now: number): void {
  const season = currentSeasonId(now);
  if (player.seasonId !== season) {
    player.seasonId = season;
    player.seasonXp = 0;
  }
}

/** Point d'entrée unique pour tout gain/perte d'XP : garde le total
 *  cumulé (player.xp) et le compteur saisonnier (player.seasonXp) en
 *  synchronisation, y compris au moment d'un changement de saison. */
export function applyXpDelta(player: PlayerState, delta: number, now: number): void {
  ensureSeasonRollover(player, now);
  player.xp = Math.max(0, (player.xp ?? 0) + delta);
  player.seasonXp = Math.max(0, (player.seasonXp ?? 0) + delta);
}
