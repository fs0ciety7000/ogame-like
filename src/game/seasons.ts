import { getProductionRatesPerSecond } from "@/game/production";
import { RESOURCE_LIST } from "@/game/resources";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import { formatInt } from "@/game/format";
import { GameActionError } from "@/game/errors";
import type { PlayerState, PlayerTitle, QueuesState, ResourceId } from "@/types/game";

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
    // Score final gardé pour la clôture de la saison (classement, récompense).
    if (player.seasonId) {
      player.lastSeasonId = player.seasonId;
      player.lastSeasonXp = player.seasonXp ?? 0;
    }
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

/* =====================================================
   Clôture d'une saison (v1.8) : le serveur fige le classement final au
   début du mois suivant, archive le résultat et verse les récompenses.
===================================================== */

export interface SeasonRewardTier {
  /** Rang maximal couvert par ce palier (1 = premier seulement). */
  maxRank: number;
  /** Heures de production offertes. */
  hours: number;
  /** Bonus de chaque ressource rare. */
  rare: number;
  /** Titre décerné (suivi du nom de la saison), vide = aucun. */
  title: string;
}

export const SEASON_RULES: { tiers: SeasonRewardTier[]; participationXp: number; participationHours: number; firstSeasonId: string } = {
  tiers: [
    { maxRank: 1, hours: 24, rare: 500, title: "Champion" },
    { maxRank: 3, hours: 16, rare: 300, title: "Podium" },
    { maxRank: 10, hours: 8, rare: 150, title: "Élite" },
  ],
  participationXp: 100,
  participationHours: 2,
  /** Première saison close automatiquement (les précédentes ne sont pas récompensées). */
  firstSeasonId: "2026-09",
};

export function previousSeasonId(now: number = Date.now()): string {
  const d = new Date(now);
  return currentSeasonId(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - 1);
}

/** Fin de la saison en cours (1er du mois suivant, 0 h UTC). */
export function seasonEndMs(now: number = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

export interface SeasonEntry {
  uid: string;
  pseudo: string;
  allianceId?: string | null;
  xp?: number;
  seasonId?: string;
  seasonXp?: number;
  lastSeasonId?: string;
  lastSeasonXp?: number;
}

export interface SeasonStanding {
  uid: string;
  pseudo: string;
  allianceId: string;
  rank: number;
  seasonXp: number;
}

/** XP d'un joueur pour une saison donnée (en cours ou tout juste terminée). */
export function seasonXpFor(entry: SeasonEntry, seasonId: string): number {
  if (entry.seasonId === seasonId) return entry.seasonXp ?? 0;
  if (entry.lastSeasonId === seasonId) return entry.lastSeasonXp ?? 0;
  return 0;
}

/** Classement final : XP de saison décroissante, puis XP totale, puis pseudo. */
export function seasonStandings(entries: SeasonEntry[], seasonId: string): SeasonStanding[] {
  return entries
    .map((e) => ({ e, seasonXp: seasonXpFor(e, seasonId) }))
    .filter((x) => x.seasonXp > 0)
    .sort((a, b) => b.seasonXp - a.seasonXp || (b.e.xp ?? 0) - (a.e.xp ?? 0) || (a.e.pseudo < b.e.pseudo ? -1 : a.e.pseudo > b.e.pseudo ? 1 : 0))
    .map((x, i) => ({ uid: x.e.uid, pseudo: x.e.pseudo, allianceId: x.e.allianceId ?? "", rank: i + 1, seasonXp: x.seasonXp }));
}

export interface SeasonReward {
  hours: number;
  rare: number;
  title: string;
}

export function seasonRewardFor(rank: number, seasonXp: number): SeasonReward | null {
  const tier = [...SEASON_RULES.tiers].sort((a, b) => a.maxRank - b.maxRank).find((t) => rank <= t.maxRank);
  if (tier) return { hours: tier.hours, rare: tier.rare, title: tier.title };
  if (seasonXp >= SEASON_RULES.participationXp) return { hours: SEASON_RULES.participationHours, rare: 0, title: "" };
  return null;
}

/** Verse la récompense de fin de saison (production rattrapée avant). */
export function performSeasonReward(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  standing: { seasonId: string; rank: number; seasonXp: number },
  reward: SeasonReward,
  now: number,
): { player: PlayerState; queues: QueuesState; notifications: NewNotification[]; gained: Partial<Record<ResourceId, number>> } {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const gained: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) {
    const amount = Math.floor((rates[r.id] ?? 0) * reward.hours * 3600) + (r.rarity === "rare" ? reward.rare : 0);
    if (amount <= 0) continue;
    gained[r.id] = amount;
    player.resources[r.id] = (player.resources[r.id] ?? 0) + amount;
  }
  let titleText = "";
  if (reward.title) {
    titleText = `${reward.title} de ${seasonLabel(standing.seasonId)}`;
    const title: PlayerTitle = { label: titleText, seasonId: standing.seasonId, rank: standing.rank };
    player.titles = [...(player.titles ?? []).filter((t) => t.seasonId !== standing.seasonId), title];
    if (!player.activeTitle) player.activeTitle = titleText;
  }
  const total = Object.values(gained).reduce((a: number, b) => a + (b ?? 0), 0);
  return {
    player,
    queues: flushed.queues,
    gained,
    notifications: [
      ...flushed.notifications,
      {
        kind: "season",
        title: `Saison ${seasonLabel(standing.seasonId)} terminée : ${standing.rank}${standing.rank === 1 ? "er" : "e"} !`,
        message: `${formatInt(standing.seasonXp)} XP de saison. Récompense : ${formatInt(total)} ressources${titleText ? ` et le titre « ${titleText} »` : ""}.`,
        createdAtMs: now,
        read: false,
      },
    ],
  };
}

/** Choix du titre affiché (parmi ceux gagnés ; vide = aucun). */
export function setActiveTitle(player: PlayerState, label: string): void {
  if (label && !(player.titles ?? []).some((t) => t.label === label)) throw new GameActionError("Tu n'as pas gagné ce titre.");
  player.activeTitle = label;
}
