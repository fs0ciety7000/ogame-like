import { seasonXpFor, type SeasonEntry } from "@/game/seasons";

/* =====================================================
   v5.10.5 : ligues de classement. Chaque joueur est dans une ligue
   (bronze → diamant) et s'y mesure à l'XP de saison. À la clôture de
   la saison : les premiers de chaque ligue montent, les derniers (et les
   inactifs) descendent, et chacun reçoit des heures de production selon
   sa ligue. Les ligues sont rangées dans game_config « leagues ».
===================================================== */

export const LEAGUES_KEY = "leagues";

export type LeagueTier = "bronze" | "argent" | "or" | "platine" | "diamant";

export const LEAGUE_TIERS: { id: LeagueTier; label: string; emoji: string; color: string; rewardHours: number }[] = [
  { id: "bronze", label: "Bronze", emoji: "🥉", color: "#e0a26b", rewardHours: 1 },
  { id: "argent", label: "Argent", emoji: "🥈", color: "#cbd5e1", rewardHours: 2 },
  { id: "or", label: "Or", emoji: "🥇", color: "#ffd86b", rewardHours: 3 },
  { id: "platine", label: "Platine", emoji: "💠", color: "#4be8ff", rewardHours: 4 },
  { id: "diamant", label: "Diamant", emoji: "💎", color: "#a78bfa", rewardHours: 6 },
];

export const LEAGUE_RULES = {
  /** Part de chaque ligue qui monte / descend à la fin de la saison. */
  promotePct: 0.2,
  relegatePct: 0.2,
};

export interface LeagueState {
  /** Saison à laquelle s'appliquent ces ligues. */
  seasonId: string;
  tiers: Record<string, LeagueTier>;
  /** Dernière clôture : mouvements de chacun. */
  last?: { seasonId: string; moves: Record<string, { from: LeagueTier; to: LeagueTier; rank: number }> } | null;
}

export function normalizeLeagues(raw: unknown): LeagueState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<LeagueState>;
  const ids = new Set(LEAGUE_TIERS.map((t) => t.id));
  const tiers: Record<string, LeagueTier> = {};
  for (const [uid, t] of Object.entries(r.tiers && typeof r.tiers === "object" ? r.tiers : {})) if (ids.has(t)) tiers[uid] = t;
  return { seasonId: typeof r.seasonId === "string" ? r.seasonId : "", tiers, last: r.last && typeof r.last === "object" ? r.last : null };
}

export function leagueTier(state: LeagueState | null | undefined, uid: string): LeagueTier {
  return state?.tiers[uid] ?? "bronze";
}

export function leagueInfo(tier: LeagueTier) {
  return LEAGUE_TIERS.find((t) => t.id === tier) ?? LEAGUE_TIERS[0];
}

const index = (tier: LeagueTier) => LEAGUE_TIERS.findIndex((t) => t.id === tier);

export interface LeagueRow {
  uid: string;
  pseudo: string;
  seasonXp: number;
  rank: number;
  zone: "up" | "down" | "stay";
}

/** Classement d'une ligue : rang à l'XP de saison et zones de montée / descente. */
export function leagueStandings(entries: SeasonEntry[], state: LeagueState, seasonId: string, tier: LeagueTier): LeagueRow[] {
  const members = entries
    .filter((e) => leagueTier(state, e.uid) === tier)
    .map((e) => ({ uid: e.uid, pseudo: e.pseudo, seasonXp: seasonXpFor(e, seasonId) }))
    .sort((a, b) => b.seasonXp - a.seasonXp || (a.pseudo < b.pseudo ? -1 : 1));
  const n = members.length;
  const up = index(tier) < LEAGUE_TIERS.length - 1 ? Math.ceil(n * LEAGUE_RULES.promotePct) : 0;
  const down = index(tier) > 0 ? Math.floor(n * LEAGUE_RULES.relegatePct) : 0;
  return members.map((m, i) => ({
    ...m,
    rank: i + 1,
    // Les inactifs (0 XP) ne montent jamais et descendent toujours (hors bronze).
    zone: m.seasonXp > 0 && i < up ? "up" : index(tier) > 0 && (m.seasonXp <= 0 || i >= n - down) ? "down" : "stay",
  }));
}

/** Clôture : nouvelles ligues, mouvements, récompense (heures) de chaque participant actif. */
export function closeLeagues(state: LeagueState, entries: SeasonEntry[], seasonId: string, nextSeasonId: string): { state: LeagueState; rewards: { uid: string; tier: LeagueTier; hours: number; move: "up" | "down" | "stay"; to: LeagueTier; rank: number }[] } {
  const tiers: Record<string, LeagueTier> = { ...state.tiers };
  const moves: Record<string, { from: LeagueTier; to: LeagueTier; rank: number }> = {};
  const rewards: { uid: string; tier: LeagueTier; hours: number; move: "up" | "down" | "stay"; to: LeagueTier; rank: number }[] = [];
  for (const t of LEAGUE_TIERS) {
    for (const row of leagueStandings(entries, state, seasonId, t.id)) {
      const to = row.zone === "up" ? LEAGUE_TIERS[index(t.id) + 1].id : row.zone === "down" ? LEAGUE_TIERS[index(t.id) - 1].id : t.id;
      tiers[row.uid] = to;
      moves[row.uid] = { from: t.id, to, rank: row.rank };
      if (row.seasonXp > 0) rewards.push({ uid: row.uid, tier: t.id, hours: t.rewardHours, move: row.zone, to, rank: row.rank });
    }
  }
  return { state: { seasonId: nextSeasonId, tiers, last: { seasonId, moves } }, rewards };
}
