import { grantTokens, tokensLabel } from "@/game/casino";
import { parisDay } from "@/game/retention";
import { GameActionError } from "@/game/errors";
import { addDossiers, findCommander, unlockSeasonCommander } from "@/game/commanders";
import type { ChronicleObjective } from "@/game/chronicles";
import { bountyState } from "@/game/bounties";
import { productionHours } from "@/game/pirates";
import { addRelic, rollRelic, relicLabel, type RelicRarity } from "@/game/relics";
import { CAPSULES, SYNTH_RULES, synthesisState, type CapsuleType } from "@/game/synthesis";
import { currentSeasonId, seasonLabel } from "@/game/seasons";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Passe de saison (v4.1) : gratuit, un par mois, 30 paliers de 40 points.
   Les points viennent de l'activité quotidienne ; chaque palier atteint
   se réclame (le serveur applique la récompense). Un nouveau mois remet
   le passe à zéro ; les cosmétiques gagnés restent.
===================================================== */

export const PASS_RULES = { tiers: 30, pointsPerTier: 40 };

/** Points par action (connexion : une fois par jour). */
export const PASS_POINTS = {
  contract: 10,
  bounty: 8,
  raidRepelled: 8,
  /** v5.13 : le combat est la voie royale du passe (5 → 8). */
  victory: 8,
  bossAssault: 5,
  dailyLogin: 5,
  /** v5.13 : plus de points pour les missions (le passe avançait trop vite) ; l'activité reste comptée pour les Chroniques. */
  mission: 0,
  /** v4.2 : vendetta gagnée contre un seigneur de guerre. */
  vendetta: 40,
  /** v4.3 : épisode des Chroniques terminé, participation au boss de saison. */
  chronicle: 40,
  seasonBoss: 60,
  /** v4.6 : boss d'alliance abattu (au moins 5 % des dégâts), ou simple participation. */
  allianceBoss: 40,
  allianceBossTry: 15,
  /** v4.7 : coalition gagnée contre un seigneur (au moins 3 % de l'objectif). */
  coalition: 50,
  /** v4.9 : objectif du jour d'alliance atteint (membre ayant contribué). */
  allianceDaily: 15,
};
export type PassSource = keyof typeof PASS_POINTS;

export type PassReward =
  | { kind: "production"; hours: number }
  | { kind: "amber"; amount: number }
  | { kind: "dossier"; count: number }
  | { kind: "capsule"; capsule: CapsuleType; level: number }
  | { kind: "relic"; rarity: RelicRarity }
  | { kind: "tokens"; count: number }
  /** v5.13 : commandant de saison (dernier palier des passes générés). */
  | { kind: "commander"; id: string }
  | { kind: "cosmetic" };

/** Actions suivies dans le mois (objectifs des Chroniques, prérequis des passes). */
export const OBJECTIVE_LABELS: Record<ChronicleObjective, string> = {
  contract: "Contrats du jour récupérés",
  bounty: "Primes Kesh'Vaar remplies",
  raidRepelled: "Raids de faction repoussés",
  victory: "Combats gagnés",
  bossAssault: "Assauts sur un boss",
  mission: "Missions terminées",
  spy: "Sondes d'espionnage lancées",
  market: "Offres achetées au marché",
  warlordWin: "Seigneurs de guerre pillés",
};

/** v5.13 : action à accomplir pour réclamer un palier (défi du palier). */
export interface PassRequirement {
  key: ChronicleObjective;
  count: number;
}

/** v5.14.1 : prérequis d'un palier, une liste (l'ancien format n'en avait qu'un). */
export function normalizeTierReqs(raw: unknown): PassRequirement[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
  return list
    .filter((r): r is PassRequirement => !!r && typeof r === "object" && typeof (r as PassRequirement).key === "string" && Number((r as PassRequirement).count) >= 1)
    .map((r) => ({ key: r.key, count: Math.floor(Number(r.count)) }));
}

/** Récompenses des 30 paliers (370 Ambre, 3 Dossiers, 8 capsules, 2 reliques, 4 jetons du casino). */
export const PASS_TIERS: PassReward[][] = [
  [{ kind: "production", hours: 2 }],
  [{ kind: "amber", amount: 20 }],
  [{ kind: "capsule", capsule: "assault", level: 3 }],
  [{ kind: "production", hours: 3 }],
  [{ kind: "dossier", count: 1 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "production", hours: 4 }, { kind: "tokens", count: 1 }],
  [{ kind: "capsule", capsule: "armor", level: 3 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "amber", amount: 40 }, { kind: "production", hours: 4 }],
  [{ kind: "production", hours: 5 }],
  [{ kind: "capsule", capsule: "decoy", level: 4 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "production", hours: 6 }],
  [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "veil", level: 4 }],
  [{ kind: "production", hours: 7 }, { kind: "tokens", count: 1 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "assault", level: 5 }],
  [{ kind: "relic", rarity: "rare" }],
  [{ kind: "production", hours: 8 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "armor", level: 5 }],
  [{ kind: "production", hours: 9 }],
  [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 40 }],
  [{ kind: "production", hours: 10 }],
  [{ kind: "amber", amount: 50 }, { kind: "tokens", count: 2 }],
  [{ kind: "capsule", capsule: "decoy", level: 5 }],
  [{ kind: "production", hours: 12 }],
  [{ kind: "relic", rarity: "epic" }, { kind: "amber", amount: 40 }, { kind: "cosmetic" }],
];

/* ---------- v4.3 : réglages modifiables depuis l'administration ---------- */

export interface SeasonPassConfig {
  rules: typeof PASS_RULES;
  points: typeof PASS_POINTS;
  tiers: PassReward[][];
}

const DEFAULT_PASS: SeasonPassConfig = structuredClone({ rules: PASS_RULES, points: PASS_POINTS, tiers: PASS_TIERS });

export function defaultSeasonPassConfig(): SeasonPassConfig {
  return structuredClone(DEFAULT_PASS);
}

/** Applique le passe personnalisé (sections absentes = valeurs du code). */
export function setSeasonPass(cfg: Partial<SeasonPassConfig> | null | undefined): void {
  const d = defaultSeasonPassConfig();
  Object.assign(PASS_RULES, d.rules, cfg?.rules ?? {});
  Object.assign(PASS_POINTS, d.points, cfg?.points ?? {});
  // v5.13 : les missions ne rapportent plus de points, même dans un passe personnalisé avant la 5.13.
  PASS_POINTS.mission = 0;
  const tiers = Array.isArray(cfg?.tiers) && cfg!.tiers.length > 0 ? cfg!.tiers : d.tiers;
  PASS_TIERS.splice(0, PASS_TIERS.length, ...structuredClone(tiers));
  PASS_RULES.tiers = PASS_TIERS.length;
}

const REWARD_KINDS = ["production", "amber", "dossier", "capsule", "relic", "tokens", "cosmetic"];

export function validateSeasonPass(cfg: Partial<SeasonPassConfig> | undefined): string[] {
  const errors: string[] = [];
  if (!cfg) return errors;
  if (cfg.rules && !(cfg.rules.pointsPerTier >= 1)) errors.push("Passe : points par palier ≥ 1.");
  for (const [k, v] of Object.entries(cfg.points ?? {})) if (!(typeof v === "number" && v >= 0)) errors.push(`Passe : points invalides pour « ${k} ».`);
  if (cfg.tiers) {
    if (cfg.tiers.length < 1 || cfg.tiers.length > 60) errors.push("Passe : entre 1 et 60 paliers.");
    cfg.tiers.forEach((list, i) =>
      (list ?? []).forEach((r) => {
        if (!REWARD_KINDS.includes(r?.kind)) errors.push(`Passe, palier ${i + 1} : récompense inconnue.`);
        if (r?.kind === "capsule" && !(r.capsule in CAPSULES)) errors.push(`Passe, palier ${i + 1} : capsule inconnue.`);
        if (r?.kind === "relic" && !["common", "rare", "epic", "legendary"].includes(r.rarity)) errors.push(`Passe, palier ${i + 1} : rareté inconnue.`);
        if (r?.kind === "tokens" && !(r.count >= 1 && r.count <= 20)) errors.push(`Passe, palier ${i + 1} : entre 1 et 20 jetons.`);
      }),
    );
  }
  return errors;
}

/** Ambre donnée à la place d'une capsule quand la réserve est pleine. */
const CAPSULE_AMBER = 15;

export interface PassState {
  seasonId: string;
  points: number;
  /** v5.4 : activité du mois par source (sert au générateur de chapitres). */
  activity?: Record<string, number>;
  /** Paliers réclamés (1 à 30). */
  claimed: number[];
  /** Dernier jour (UTC) compté pour la connexion. */
  loginDay: string;
  /** Saisons dont le passe a été terminé (bannière et titre gardés). */
  completed: string[];
  /** v5.10 : dernier palier signalé par une notification « palier prêt ». */
  notifiedTier?: number;
  /** v5.14.1 : paliers dont le défi est relevé. */
  cleared?: number[];
  /** 5.15.12 : actions du jour (heure de Paris) et missions du jour réclamées. */
  daily?: { day: string; counts: Record<string, number>; claimed: number[] };
  /** v5.14.1 : avancée du défi en cours (un palier à la fois), par action. */
  challenge?: Record<string, number>;
}

export function passTitle(seasonId: string): string {
  const month = seasonLabel(seasonId).toLowerCase();
  return /^[aeiouéâ]/.test(month) ? `Vétéran d'${month}` : `Vétéran de ${month}`;
}

/** Passe de la saison en cours (remis à zéro au changement de mois). */
export function passState(player: Pick<PlayerState, "seasonPass">, now: number): PassState {
  const raw = (player.seasonPass ?? {}) as Partial<PassState>;
  const seasonId = currentSeasonId(now);
  const completed = Array.isArray(raw.completed) ? raw.completed.map(String) : [];
  if (raw.seasonId !== seasonId) return { seasonId, points: 0, claimed: [], loginDay: "", completed, activity: {} };
  const activity: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.activity ?? {})) if (Number(v) > 0) activity[k] = Number(v);
  const challenge: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.challenge ?? {})) if (Number(v) > 0) challenge[k] = Number(v);
  const cleared = (Array.isArray(raw.cleared) ? raw.cleared : []).map(Number).filter((n) => n >= 1);
  return {
    seasonId,
    points: Math.max(0, Number(raw.points) || 0),
    claimed: (Array.isArray(raw.claimed) ? raw.claimed : []).map(Number).filter((n) => n >= 1 && n <= activePass(seasonId).tiers.length),
    loginDay: String(raw.loginDay ?? ""),
    completed,
    activity,
    ...(Number(raw.notifiedTier) > 0 ? { notifiedTier: Math.floor(Number(raw.notifiedTier)) } : {}),
    ...(cleared.length ? { cleared } : {}),
    ...(Object.keys(challenge).length ? { challenge } : {}),
    ...(raw.daily && typeof raw.daily === "object" && typeof raw.daily.day === "string" ? { daily: normalizeDaily(raw.daily) } : {}),
  };
}

/** 5.15.12 : compteurs et réclamations du jour (valeurs positives seulement). */
function normalizeDaily(d: NonNullable<PassState["daily"]>): NonNullable<PassState["daily"]> {
  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(d.counts ?? {})) if (Number(v) > 0) counts[k] = Number(v);
  return { day: d.day, counts, claimed: (Array.isArray(d.claimed) ? d.claimed : []).map(Number).filter((n) => n >= 0 && n < 10) };
}

/**
 * v5.10 : nouveaux paliers atteints depuis la dernière notification.
 * Retourne le palier à annoncer (0 = rien) et mémorise qu'il l'est.
 */
export function passTierToAnnounce(player: PlayerState, now: number): { tier: number; claimable: number } {
  if (!player.seasonPass) return { tier: 0, claimable: 0 };
  const st = passState(player, now);
  const tier = passTier(st.points, st.seasonId);
  if (tier <= (st.notifiedTier ?? 0)) return { tier: 0, claimable: 0 };
  st.notifiedTier = tier;
  player.seasonPass = st;
  let claimable = 0;
  for (let t = 1; t <= tier; t++) if (!st.claimed.includes(t) && tierRequirements(player, t, now)?.met !== false) claimable += 1;
  return { tier, claimable };
}

/* ---------- v5.4 : passe propre à un mois (chapitres générés) ---------- */

export interface MonthPass {
  pointsPerTier: number;
  tiers: PassReward[][];
  /** v5.13 : prérequis par palier (passes de saison publiés) ; v5.14.1 : plusieurs par palier. */
  requirements?: Record<string, PassRequirement[] | PassRequirement>;
  /** 5.15.4 : défis en totaux du mois (voir passSeasons.ts). */
  challengeMode?: "cumulative";
}

const MONTH_PASSES = new Map<string, MonthPass>();
/** v5.13 : passes de saison publiés (priment sur les passes des chapitres). */
const SEASON_OVERRIDES = new Map<string, MonthPass>();

export function setPassSeasonOverrides(map: Map<string, MonthPass>): void {
  SEASON_OVERRIDES.clear();
  for (const [k, v] of map) SEASON_OVERRIDES.set(k, v);
}

/** Passes mensuels déclarés par les chapitres (remplace le passe commun ce mois-là). */
export function setMonthPasses(list: { id: string; pass?: MonthPass }[]): void {
  MONTH_PASSES.clear();
  for (const m of list) if (m.pass && m.pass.pointsPerTier >= 1 && Array.isArray(m.pass.tiers) && m.pass.tiers.length > 0) MONTH_PASSES.set(m.id, m.pass);
}

/** Paliers et points par palier du passe d'une saison. */
export function activePass(seasonId: string = currentSeasonId()): MonthPass {
  return SEASON_OVERRIDES.get(seasonId) ?? MONTH_PASSES.get(seasonId) ?? { pointsPerTier: PASS_RULES.pointsPerTier, tiers: PASS_TIERS };
}

/** v5.14.1 : prérequis d'un palier du passe d'une saison. */
export function passTierReqs(seasonId: string, tier: number): PassRequirement[] {
  return normalizeTierReqs(activePass(seasonId).requirements?.[String(tier)]);
}

/** 5.15.4 : défis en totaux du mois (passe généré récent) plutôt qu'un compteur par palier. */
export function isCumulativePass(seasonId: string): boolean {
  return activePass(seasonId).challengeMode === "cumulative";
}

/** Mode cumulé : paliers relevés dans l'ordre (totaux du mois atteints, précédents relevés). */
function cumulativeCleared(st: PassState): Set<number> {
  const out = new Set<number>();
  const n = activePass(st.seasonId).tiers.length;
  for (let t = 1; t <= n; t++) {
    const reqs = passTierReqs(st.seasonId, t);
    if (reqs.length === 0) continue;
    if (!reqs.every((r) => (st.activity?.[r.key] ?? 0) >= r.count)) break;
    out.add(t);
  }
  return out;
}

/** v5.14.1 : palier dont le défi est en cours (le premier pas encore relevé ; 0 : aucun). */
export function activeChallengeTier(st: PassState): number {
  const n = activePass(st.seasonId).tiers.length;
  const cleared = isCumulativePass(st.seasonId) ? cumulativeCleared(st) : new Set(st.cleared ?? []);
  for (let t = 1; t <= n; t++) if (passTierReqs(st.seasonId, t).length > 0 && !cleared.has(t)) return t;
  return 0;
}

export type TierChallengeStatus = "cleared" | "active" | "waiting";

/** v5.14.1 : défi d'un palier et avancée du joueur (null : pas de prérequis).
 *  Un palier à la fois : les actions ne comptent que pour le défi en cours, puis
 *  le compteur repart de zéro pour le palier suivant. 5.15.4 : en mode cumulé,
 *  l'avancée est le total du mois (une action compte pour tous les paliers). */
export function tierRequirements(player: Pick<PlayerState, "seasonPass">, tier: number, now: number): { status: TierChallengeStatus; met: boolean; reqs: (PassRequirement & { done: number; met: boolean })[] } | null {
  const st = passState(player, now);
  const reqs = passTierReqs(st.seasonId, tier);
  if (reqs.length === 0) return null;
  if (isCumulativePass(st.seasonId)) {
    const status: TierChallengeStatus = cumulativeCleared(st).has(tier) ? "cleared" : activeChallengeTier(st) === tier ? "active" : "waiting";
    const rows = reqs.map((r) => {
      const done = Math.min(r.count, st.activity?.[r.key] ?? 0);
      return { ...r, done, met: done >= r.count };
    });
    return { status, met: status === "cleared", reqs: rows };
  }
  const status: TierChallengeStatus = (st.cleared ?? []).includes(tier) ? "cleared" : activeChallengeTier(st) === tier ? "active" : "waiting";
  const rows = reqs.map((r) => {
    const done = status === "cleared" ? r.count : status === "active" ? Math.min(r.count, st.challenge?.[r.key] ?? 0) : 0;
    return { ...r, done, met: done >= r.count };
  });
  return { status, met: status === "cleared", reqs: rows };
}

export function passTier(points: number, seasonId: string = currentSeasonId()): number {
  const pass = activePass(seasonId);
  return Math.min(pass.tiers.length, Math.floor(points / pass.pointsPerTier));
}

function passMax(seasonId: string): number {
  const pass = activePass(seasonId);
  return pass.tiers.length * pass.pointsPerTier;
}

/** v5.4 : compte une action du mois (même sans points de passe : espionnage, marché…). */
export function trackActivity(player: PlayerState, key: string, now: number, times = 1): void {
  if (!(times > 0)) return;
  const st = passState(player, now);
  st.activity = { ...(st.activity ?? {}), [key]: (st.activity?.[key] ?? 0) + times };
  // 5.15.12 : compteurs du jour (missions du jour).
  const day = parisDay(now);
  const daily = st.daily && st.daily.day === day ? st.daily : { day, counts: {}, claimed: [] };
  st.daily = { ...daily, counts: { ...daily.counts, [key]: (daily.counts[key] ?? 0) + times } };
  // v5.14.1 : défi du palier en cours (le surplus ne passe pas au palier suivant).
  // 5.15.4 : en mode cumulé, le total du mois (activity) suffit.
  if (isCumulativePass(st.seasonId)) {
    player.seasonPass = st;
    return;
  }
  const t = activeChallengeTier(st);
  const reqs = t ? passTierReqs(st.seasonId, t) : [];
  const req = reqs.find((r) => r.key === key);
  if (req) {
    const challenge = { ...(st.challenge ?? {}), [key]: Math.min(req.count, (st.challenge?.[key] ?? 0) + times) };
    if (reqs.every((r) => (challenge[r.key] ?? 0) >= r.count)) {
      st.cleared = [...(st.cleared ?? []), t].sort((a, b) => a - b);
      delete st.challenge;
    } else st.challenge = challenge;
  }
  player.seasonPass = st;
}

/** Ajoute des points (le passe plafonne à 30 paliers). Modifie le joueur. */
/** v4.3 : les Chroniques suivent les mêmes actions que le passe. */
let passHook: ((player: PlayerState, source: PassSource, now: number, times: number) => void) | null = null;
export function onPassPoints(hook: typeof passHook): void {
  passHook = hook;
}

/** 5.18 : passe terminé : les gros gains de points (épisode des Chroniques, vendetta, boss…) deviennent de l'Ambre. */
export const PASS_OVERFLOW = {
  /** Sources rapportant au moins ce nombre de points (petits gains réguliers exclus). */
  minPoints: 40,
  amberPerPoint: 1,
};

/** Ajoute des points de passe. Retourne l'Ambre versée si le passe était déjà au maximum (5.18). */
export function addPassPoints(player: PlayerState, source: PassSource, now: number, times = 1): number {
  passHook?.(player, source, now, times);
  trackActivity(player, source, now, times);
  const st = passState(player, now);
  const max = passMax(st.seasonId);
  const gain = PASS_POINTS[source] * Math.max(0, times);
  const overflow = Math.max(0, st.points + gain - max);
  st.points = Math.min(max, st.points + gain);
  player.seasonPass = st;
  if (overflow > 0 && PASS_POINTS[source] >= PASS_OVERFLOW.minPoints) {
    const amber = Math.floor(overflow * PASS_OVERFLOW.amberPerPoint);
    if (amber > 0) {
      const b = bountyState(player);
      b.amber += amber;
      player.bounties = b;
      return amber;
    }
  }
  return 0;
}

/** Connexion du jour : +5 une fois par jour UTC. */
export function passDailyLogin(player: PlayerState, now: number): boolean {
  const st = passState(player, now);
  const day = new Date(now).toISOString().slice(0, 10);
  if (st.loginDay === day) return false;
  st.loginDay = day;
  st.activity = { ...(st.activity ?? {}), dailyLogin: (st.activity?.dailyLogin ?? 0) + 1 };
  st.points = Math.min(passMax(st.seasonId), st.points + PASS_POINTS.dailyLogin);
  player.seasonPass = st;
  return true;
}

export function describePassReward(r: PassReward, seasonId?: string): string {
  switch (r.kind) {
    case "production":
      return `${r.hours} h de production`;
    case "amber":
      return `${r.amount} Ambre`;
    case "dossier":
      return r.count > 1 ? `${r.count} Dossiers d'entraînement` : "Dossier d'entraînement";
    case "capsule":
      return `${CAPSULES[r.capsule].name} N${r.level}`;
    case "relic":
      return `Relique ${RARITY_LABELS[r.rarity]}`;
    case "tokens":
      return tokensLabel(r.count);
    case "commander": {
      const def = findCommander(r.id);
      return def ? `Commandant de saison : ${def.title} ${def.name}` : "Commandant de saison";
    }
    case "cosmetic":
      return seasonId ? `Bannière et titre « ${passTitle(seasonId)} »` : "Bannière et titre de la saison";
  }
}

const RARITY_LABELS: Record<RelicRarity, string> = { common: "commune", rare: "rare", epic: "épique", legendary: "légendaire", mythic: "mythique" };

/** Applique une récompense de passe (paliers, épisodes et chapitres). Renvoie son libellé. */
export function grantPassReward(player: PlayerState, r: PassReward, seasonId: string, now: number, random: () => number = Math.random): string {
  if (r.kind === "production") {
    for (const [res, n] of Object.entries(productionHours(player, r.hours)) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
    return describePassReward(r);
  }
  if (r.kind === "amber") {
    const b = bountyState(player);
    b.amber += r.amount;
    player.bounties = b;
    return describePassReward(r);
  }
  if (r.kind === "dossier") {
    addDossiers(player, r.count);
    return describePassReward(r);
  }
  if (r.kind === "capsule") {
    const syn = synthesisState(player);
    if (syn.stock[r.capsule].length < SYNTH_RULES.maxStock) {
      syn.stock[r.capsule] = [...syn.stock[r.capsule], r.level];
      player.synthesis = syn;
      return describePassReward(r);
    }
    const b = bountyState(player);
    b.amber += CAPSULE_AMBER;
    player.bounties = b;
    return `${CAPSULE_AMBER} Ambre (réserve de capsules pleine)`;
  }
  if (r.kind === "tokens") {
    grantTokens(player, r.count);
    return describePassReward(r);
  }
  if (r.kind === "commander") {
    if (unlockSeasonCommander(player, r.id)) return describePassReward(r);
    // Déjà dans l'état-major (ou inconnu) : de quoi le faire progresser à la place.
    addDossiers(player, 2);
    return "2 Dossiers d'entraînement (commandant déjà recruté)";
  }
  if (r.kind === "relic") {
    // Premier tirage à 0 : exactement la rareté promise, puis modèle au hasard.
    let first = true;
    const item = rollRelic("pass", now, () => (first ? ((first = false), 0) : random()), r.rarity);
    if (addRelic(player, item)) return `Relique : ${relicLabel(item)}`;
    const b = bountyState(player);
    b.amber += 40;
    player.bounties = b;
    return "40 Ambre (collection de reliques pleine)";
  }
  const title = passTitle(seasonId);
  if (!(player.titles ?? []).some((t) => t.label === title)) player.titles = [...(player.titles ?? []), { label: title, seasonId: `pass:${seasonId}`, rank: 1 }];
  const st = passState(player, now);
  if (!st.completed.includes(seasonId)) st.completed = [...st.completed, seasonId];
  player.seasonPass = st;
  return describePassReward(r, seasonId);
}

/** Réclame un palier atteint : le serveur applique la récompense. */
export function claimPassTier(player: PlayerState, tierIn: unknown, now: number, random: () => number = Math.random): string[] {
  const tier = Math.floor(Number(tierIn));
  const st = passState(player, now);
  const pass = activePass(st.seasonId);
  if (!(tier >= 1 && tier <= pass.tiers.length)) throw new GameActionError("Palier inconnu.");
  if (st.claimed.includes(tier)) throw new GameActionError("Palier déjà réclamé.");
  if (passTier(st.points, st.seasonId) < tier) throw new GameActionError(`Palier pas encore atteint (${st.points} / ${tier * pass.pointsPerTier} points).`);
  const ch = tierRequirements(player, tier, now);
  if (ch && !ch.met)
    throw new GameActionError(
      ch.status === "waiting"
        ? "Palier verrouillé : relève d'abord le défi des paliers précédents."
        : `Palier verrouillé : ${ch.reqs
            .filter((r) => !r.met)
            .map((r) => `${OBJECTIVE_LABELS[r.key].toLowerCase()} ${r.done} / ${r.count}`)
            .join(", ")}.`,
    );
  const gained = pass.tiers[tier - 1].map((r) => grantPassReward(player, r, st.seasonId, now, random));
  const after = passState(player, now);
  after.claimed = [...st.claimed, tier].sort((a, b) => a - b);
  player.seasonPass = after;
  return gained;
}
