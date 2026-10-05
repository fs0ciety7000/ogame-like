import { recordXp, type XpSource } from "@/game/xpAudit";
import { applyXpTiers } from "@/game/xpTiers";
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
export function applyXpDelta(player: PlayerState, delta: number, now: number, source: XpSource = "other"): number {
  ensureSeasonRollover(player, now);
  // 5.18 : bonus au jeu actif puis paliers journaliers par source (gains seulement).
  delta = applyXpTiers(player, source, delta, now);
  player.xp = Math.max(0, (player.xp ?? 0) + delta);
  player.seasonXp = Math.max(0, (player.seasonXp ?? 0) + delta);
  // 5.17.1 : registre horaire par source (audit de l'administration).
  recordXp(player, source, delta, now);
  return delta;
}

/* =====================================================
   Clôture d'une saison (v1.8) : le serveur fige le classement final au
   début du mois suivant, archive le résultat et verse les récompenses.
===================================================== */

/** Lot de récompenses (5.15.4) : jetons du casino, Ambre de Ruche et
 *  ressources communes (chacune des quatre). */
export interface SeasonPrize {
  tokens: number;
  amber: number;
  /** Quantité de CHAQUE ressource commune. */
  common: number;
}

export const SEASON_RULES: {
  /** 1er : titre (« Champion du mois d'octobre 2026 ») et lot. */
  champion: SeasonPrize & { title: string };
  /** Lot partagé entre le 2e et le 3e, au prorata de leur XP de saison. */
  podium: SeasonPrize;
  /** Chaque joueur actif de la saison (XP ≥ participationXp), en plus du reste. */
  participation: SeasonPrize;
  participationXp: number;
  firstSeasonId: string;
} = {
  champion: { title: "Champion du mois", tokens: 50, amber: 200, common: 500_000_000 },
  podium: { tokens: 50, amber: 100, common: 50_000_000 },
  participation: { tokens: 15, amber: 35, common: 10_000_000 },
  participationXp: 100,
  /** Première saison close automatiquement (les précédentes ne sont pas récompensées). */
  firstSeasonId: "2026-09",
};

const MONTHS_LOWER = SEASON_MONTHS.map((m) => m.toLowerCase());

/** « du mois d'octobre 2026 », « du mois de novembre 2026 » (élision devant une voyelle). */
export function seasonMonthPhrase(seasonId: string): string {
  const [year, month] = seasonId.split("-").map(Number);
  const name = MONTHS_LOWER[(month ?? 1) - 1] ?? "?";
  return `${/^[aeiouyéè]/.test(name) ? "d'" : "de "}${name} ${year ?? ""}`.trim();
}

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
  /** Heures de production (récompense d'alliance) ; 0 pour le classement individuel. */
  hours: number;
  /** Bonus de chaque ressource rare. */
  rare: number;
  /** Titre complet décerné (vide = aucun). */
  title: string;
  tokens?: number;
  amber?: number;
  /** Quantité de chaque ressource commune. */
  common?: number;
}

/** Récompense du joueur classé `rank` (5.15.4) : la participation pour
 *  chaque joueur actif, plus le lot du champion (1er) ou sa part du lot
 *  du podium (2e et 3e, au prorata de leur XP de saison). `standings` :
 *  classement complet (pour le partage du podium). */
export function seasonRewardFor(rank: number, seasonXp: number, seasonId: string, standings: Pick<SeasonStanding, "rank" | "seasonXp">[] = []): SeasonReward | null {
  const add = (a: SeasonPrize, b: SeasonPrize, f = 1): SeasonPrize => ({
    tokens: a.tokens + Math.floor(b.tokens * f),
    amber: a.amber + Math.floor(b.amber * f),
    common: a.common + Math.floor(b.common * f),
  });
  let prize: SeasonPrize = { tokens: 0, amber: 0, common: 0 };
  let title = "";
  if (seasonXp >= SEASON_RULES.participationXp) prize = add(prize, SEASON_RULES.participation);
  if (rank === 1 && seasonXp > 0) {
    prize = add(prize, SEASON_RULES.champion);
    if (SEASON_RULES.champion.title) title = `${SEASON_RULES.champion.title} ${seasonMonthPhrase(seasonId)}`;
  } else if ((rank === 2 || rank === 3) && seasonXp > 0) {
    const podium = standings.filter((s) => s.rank === 2 || s.rank === 3);
    const total = podium.reduce((a, s) => a + s.seasonXp, 0) || seasonXp;
    prize = add(prize, SEASON_RULES.podium, seasonXp / total);
  }
  if (!prize.tokens && !prize.amber && !prize.common && !title) return null;
  return { hours: 0, rare: 0, title, ...prize };
}

/** Verse la récompense de fin de saison (production rattrapée avant). */
export function performSeasonReward(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  standing: { seasonId: string; rank: number; seasonXp: number },
  reward: SeasonReward,
  now: number,
  /** Titre de la notification (par défaut : le rang individuel). */
  headline?: string,
): { player: PlayerState; queues: QueuesState; notifications: NewNotification[]; gained: Partial<Record<ResourceId, number>> } {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const gained: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) {
    const amount =
      Math.floor((rates[r.id] ?? 0) * reward.hours * 3600) + (r.rarity === "rare" ? reward.rare : 0) + (r.rarity === "common" ? Math.floor(reward.common ?? 0) : 0);
    if (amount <= 0) continue;
    gained[r.id] = amount;
    player.resources[r.id] = (player.resources[r.id] ?? 0) + amount;
  }
  const tokens = Math.max(0, Math.floor(reward.tokens ?? 0));
  if (tokens > 0) {
    const c = (player.casino ?? {}) as { tokens?: number };
    player.casino = { ...(player.casino ?? {}), tokens: (Number(c.tokens) || 0) + tokens } as PlayerState["casino"];
  }
  const amber = Math.max(0, Math.floor(reward.amber ?? 0));
  if (amber > 0) {
    const b = (player.bounties ?? {}) as { amber?: number; amberEarned?: number };
    player.bounties = { ...(player.bounties ?? {}), amber: (Number(b.amber) || 0) + amber, amberEarned: (Number(b.amberEarned) || 0) + amber } as PlayerState["bounties"];
  }
  let titleText = "";
  if (reward.title) {
    // Ancien format (alliances) : « Titre » + « de Mois Année ».
    titleText = reward.hours > 0 && !/ (de |d')\S+ \d{4}$/.test(reward.title) ? `${reward.title} de ${seasonLabel(standing.seasonId)}` : reward.title;
    const title: PlayerTitle = { label: titleText, seasonId: standing.seasonId, rank: standing.rank };
    player.titles = [...(player.titles ?? []).filter((t) => t.label !== titleText), title];
    if (!player.activeTitle) player.activeTitle = titleText;
  }
  const total = Object.values(gained).reduce((a: number, b) => a + (b ?? 0), 0);
  const parts = [
    tokens ? `${formatInt(tokens)} jeton${tokens > 1 ? "s" : ""} du casino` : "",
    amber ? `${formatInt(amber)} Ambre` : "",
    total ? `${formatInt(total)} ressources` : "",
    titleText ? `le titre « ${titleText} »` : "",
  ].filter(Boolean);
  return {
    player,
    queues: flushed.queues,
    gained,
    notifications: [
      ...flushed.notifications,
      {
        kind: "season",
        title: headline ?? `Saison ${seasonLabel(standing.seasonId)} terminée : ${standing.rank}${standing.rank === 1 ? "er" : "e"} !`,
        message: `${formatInt(standing.seasonXp)} XP de saison. Récompense : ${parts.join(", ").replace(/, ([^,]*)$/, " et $1")}.`,
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

/** 5.15.9 : ce que coûte une clôture de saison pour `active` joueurs actifs (aperçu admin).
 *  Le lot du podium est versé en entier (partagé entre le 2e et le 3e). */
export function seasonPayoutSummary(rules: Pick<typeof SEASON_RULES, "champion" | "podium" | "participation">, active: number): { tokens: number; amber: number; common: number } {
  const n = Math.max(0, Math.floor(active));
  const lots = [n >= 1 ? rules.champion : null, n >= 2 ? rules.podium : null].filter((x): x is SeasonPrize => !!x);
  const sum = (k: keyof SeasonPrize) => lots.reduce((a, l) => a + (Number(l[k]) || 0), 0) + n * (Number(rules.participation[k]) || 0);
  return { tokens: sum("tokens"), amber: sum("amber"), common: sum("common") };
}
