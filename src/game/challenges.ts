import { nextLeviathanStart } from "@/game/leviathan";
import { productionHours } from "@/game/pirates";
import { RESOURCE_LIST } from "@/game/resources";
import { GameActionError } from "@/game/errors";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Défis hebdomadaires du serveur (v3.8) : un objectif commun du lundi
   00 h au dimanche 23 h 59 (UTC), proportionnel au nombre de joueurs
   actifs. Pas de défi les semaines de Léviathan. Les participants
   (≥ 1 % de l'objectif) sont récompensés si l'objectif est atteint.
===================================================== */

export const CHALLENGE_KEY = "challenge";

export type ChallengeType = "raids" | "missions" | "units" | "market" | "expeditions" | "bounties";

export const CHALLENGE_TYPES: Record<ChallengeType, { label: string; unit: string; perActive: number }> = {
  raids: { label: "Repousser les raids des factions", unit: "raids repoussés", perActive: 3 },
  missions: { label: "Terminer des missions", unit: "missions", perActive: 25 },
  units: { label: "Construire des unités", unit: "unités", perActive: 400 },
  market: { label: "Faire vivre le marché", unit: "ressources échangées", perActive: 2_000_000 },
  expeditions: { label: "Explorer l'inconnu", unit: "expéditions", perActive: 6 },
  bounties: { label: "Remplir les primes de l'Essaim", unit: "primes", perActive: 8 },
};

export const CHALLENGE_RULES = {
  /** Part minimale de l'objectif pour être récompensé. */
  minShare: 0.01,
  tiers: [
    { at: 1, hours: 6, rare: 300 },
    { at: 1.5, hours: 10, rare: 600 },
  ],
  title: "Pilier de la semaine",
  titleDays: 7,
  /** Joueur actif : vu dans les 7 derniers jours. */
  activeDays: 7,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const CHALLENGE_RULES_META = {
  minShare: { label: "Part minimale de l'objectif pour être récompensé", unit: "part", min: 0, max: 1 },
  tiers: { label: "Paliers du défi", hint: "at (× l'objectif), hours (production), rare (ressources rares)." },
  title: { label: "Titre du défi" },
  titleDays: { label: "Titre porté pendant", unit: "j", min: 0, max: 60 },
  activeDays: { label: "Joueur actif : vu dans les", unit: "j", min: 1, max: 60 },
};

export interface Challenge {
  id: string;
  type: ChallengeType;
  target: number;
  startMs: number;
  endMs: number;
  total: number;
  contributions: Record<string, { pseudo: string; amount: number }>;
  status: "active" | "done";
  success: boolean;
  /** v5.10 : participants qui ont réclamé leur récompense. */
  claimed?: string[];
}

export interface ChallengeState {
  current: Challenge | null;
  previous: Challenge | null;
  titleHolder: { uid: string; untilMs: number } | null;
}

const DAY = 86_400_000;

/** Semaine UTC (lundi 00 h → lundi suivant). */
export function weekWindow(now: number): { id: string; startMs: number; endMs: number } {
  const day = new Date(now).getUTCDay(); // 0 = dimanche
  const midnight = Math.floor(now / DAY) * DAY;
  const startMs = midnight - ((day + 6) % 7) * DAY;
  return { id: `wk-${new Date(startMs).toISOString().slice(0, 10)}`, startMs, endMs: startMs + 7 * DAY };
}

/** Un Léviathan commence-t-il pendant cette semaine ? */
export function isLeviathanWeek(now: number): boolean {
  const w = weekWindow(now);
  const next = nextLeviathanStart(w.startMs);
  return next !== null && next >= w.startMs && next < w.endMs;
}

/** Type tiré d'après l'identifiant de semaine, différent du précédent. */
export function pickChallengeType(weekId: string, previous?: ChallengeType | null): ChallengeType {
  const types = Object.keys(CHALLENGE_TYPES) as ChallengeType[];
  let h = 0;
  for (const c of weekId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let type = types[h % types.length];
  if (type === previous) type = types[(h + 1) % types.length];
  return type;
}

export function startChallenge(now: number, activePlayers: number, previous?: ChallengeType | null): Challenge {
  const w = weekWindow(now);
  const type = pickChallengeType(w.id, previous);
  return {
    id: w.id,
    type,
    target: CHALLENGE_TYPES[type].perActive * Math.max(1, activePlayers),
    startMs: w.startMs,
    endMs: w.endMs,
    total: 0,
    contributions: {},
    status: "active",
    success: false,
  };
}

/** Compteurs suivis par les défis, lus dans l'état du joueur. */
export function challengeMetrics(player: Pick<PlayerState, "stats" | "pirates">): Record<ChallengeType, number> {
  const s = player.stats ?? {};
  const pirates = (player.pirates ?? {}) as Record<string, { repelled?: number } | undefined>;
  const raids = Object.values(pirates).reduce((a, p) => a + (Number(p?.repelled) || 0), 0);
  return {
    raids,
    missions: s.missions ?? 0,
    units: s.unitsBuilt ?? 0,
    market: s.marketVolume ?? 0,
    expeditions: s.expeditions ?? 0,
    bounties: s.bounties ?? 0,
  };
}

export function addContribution(ch: Challenge, uid: string, pseudo: string, amount: number, now: number): Challenge {
  if (ch.status !== "active" || !(amount > 0) || now < ch.startMs || now >= ch.endMs) return ch;
  const prev = ch.contributions[uid]?.amount ?? 0;
  return { ...ch, total: ch.total + amount, contributions: { ...ch.contributions, [uid]: { pseudo, amount: prev + amount } } };
}

export function challengeRanking(ch: Challenge): { uid: string; pseudo: string; amount: number }[] {
  return Object.entries(ch.contributions)
    .map(([uid, c]) => ({ uid, ...c }))
    .sort((a, b) => b.amount - a.amount);
}

/** Palier atteint (null si l'objectif est manqué). */
export function challengeTier(ch: Pick<Challenge, "total" | "target">) {
  const ratio = ch.target > 0 ? ch.total / ch.target : 0;
  return [...CHALLENGE_RULES.tiers].reverse().find((t) => ratio >= t.at) ?? null;
}

/** v5.12 : rang du palier atteint (0 : premier palier ; -1 : objectif manqué). */
export function challengeTierIndex(ch: Pick<Challenge, "total" | "target">): number {
  const tier = challengeTier(ch);
  return tier ? CHALLENGE_RULES.tiers.indexOf(tier) : -1;
}

/** Joueurs récompensés à la clôture. */
export function challengeRewardees(ch: Challenge): string[] {
  if (!challengeTier(ch)) return [];
  return challengeRanking(ch)
    .filter((c) => c.amount >= ch.target * CHALLENGE_RULES.minShare)
    .map((c) => c.uid);
}

/** Récompense d'un participant (appliquée à `player`), et titre pour le meilleur. */
export function grantChallengeReward(ch: Challenge, player: PlayerState, opts: { title?: boolean; resources?: boolean } = {}): Partial<Record<ResourceId, number>> {
  const tier = challengeTier(ch);
  if (!tier || !challengeRewardees(ch).includes(player.uid)) return {};
  const gain: Partial<Record<ResourceId, number>> = {};
  if (opts.resources !== false) {
    Object.assign(gain, productionHours(player, tier.hours));
    for (const r of RESOURCE_LIST) if (r.rarity === "rare") gain[r.id] = (gain[r.id] ?? 0) + tier.rare;
    for (const [res, n] of Object.entries(gain) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  }
  if (opts.title !== false && challengeRanking(ch)[0]?.uid === player.uid) {
    player.titles = [...(player.titles ?? []).filter((t) => t.label !== CHALLENGE_RULES.title), { label: CHALLENGE_RULES.title, seasonId: `challenge:${ch.id}`, rank: 1 }];
    player.activeTitle = CHALLENGE_RULES.title;
  }
  return gain;
}

/* ---------- v5.10 : récompense à réclamer ---------- */

/** Le joueur a-t-il une récompense en attente sur ce défi terminé ? */
export function challengeClaimable(ch: Challenge | null | undefined, uid: string): boolean {
  return !!ch && ch.status === "done" && !!challengeTier(ch) && challengeRewardees(ch).includes(uid) && !(ch.claimed ?? []).includes(uid);
}

/** Réclamation : crédite les ressources (pas le titre, remis à la clôture) et note le joueur. */
export function claimChallengeReward(ch: Challenge | null, player: PlayerState): { challenge: Challenge; gain: Partial<Record<ResourceId, number>> } {
  if (!ch || ch.status !== "done") throw new GameActionError("Aucun défi terminé à récupérer.");
  if ((ch.claimed ?? []).includes(player.uid)) throw new GameActionError("Récompense déjà récupérée.");
  if (!challengeClaimable(ch, player.uid)) throw new GameActionError("Pas de récompense pour toi sur ce défi.");
  const gain = grantChallengeReward(ch, player, { title: false });
  return { challenge: { ...ch, claimed: [...(ch.claimed ?? []), player.uid] }, gain };
}

/** Joueurs qui n'ont pas réclamé (versement automatique à la clôture du défi suivant). */
export function unclaimedRewardees(ch: Challenge | null): string[] {
  if (!ch || ch.status !== "done") return [];
  return challengeRewardees(ch).filter((uid) => !(ch.claimed ?? []).includes(uid));
}

export function removeChallengeTitle(player: PlayerState): void {
  player.titles = (player.titles ?? []).filter((t) => t.label !== CHALLENGE_RULES.title);
  if (player.activeTitle === CHALLENGE_RULES.title) player.activeTitle = player.titles[0]?.label;
}

export function normalizeChallengeState(raw: unknown): ChallengeState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<ChallengeState>;
  return { current: r.current ?? null, previous: r.previous ?? null, titleHolder: r.titleHolder ?? null };
}
