import { grantTokens, tokensLabel } from "@/game/casino";
import { parisDay } from "@/game/retention";
import { recordContract } from "@/game/contracts";
import { GameActionError } from "@/game/errors";
import { addDossiers, findCommander, unlockSeasonCommander } from "@/game/commanders";
import type { ChronicleObjective } from "@/game/chronicles";
import { objectiveLabel, staticObjectiveLabels, type StaticObjective } from "@/game/trackedActions";
import { bountyState } from "@/game/bounties";
import { productionHours } from "@/game/pirates";
import { addRelic, rollRelic, relicLabel, type RelicRarity } from "@/game/relics";
import { CAPSULES, SYNTH_RULES, synthesisState, type CapsuleType } from "@/game/synthesis";
import { currentSeasonId, seasonLabel } from "@/game/seasons";
import { CATALOG_START } from "@/game/seasonCatalog";
import type { PlayerState, ResourceId } from "@/types/game";
import { noteAmber, type AmberSource } from "@/game/healthTrace";

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
/** 6.14.121 (AP-L7) : libellés lus dans le registre des actions suivies (`trackedActions.ts`), les 9 d'avant et ceux de la
 *  lune et des colonies. Une action par contenu (`unit:<id>`…) : `objectiveLabel`. */
export const OBJECTIVE_LABELS: Record<StaticObjective, string> = staticObjectiveLabels();
export { objectiveLabel };

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
  daily?: { day: string; counts: Record<string, number>; claimed: number[]; settled?: boolean };
  /** v5.14.1 : avancée du défi en cours (un palier à la fois), par action. */
  challenge?: Record<string, number>;
  /** 6.8.0 (AU3, PRG-3) : points réellement gagnés ce mois, par source (connexion, primes, combats…). */
  bySource?: Record<string, number>;
  /** 6.8.0 : instant où le dernier palier a été atteint (rythme du passe, santé de l'équilibre). */
  finishedAtMs?: number;
  /** 6.11.0 (PRG-2, Z3) : points gagnés après le dernier palier et paliers bonus déjà versés ce mois. */
  bonusPoints?: number;
  bonusTiers?: number;
  /** 6.14.150 (AP-11, proposals/rythme-du-passe.md) : points gagnés après le dernier palier, comptés pour le prestige du mois
   *  (cosmétique, plafonnés à la valeur de tous les paliers de prestige). */
  prestigePoints?: number;
  /** 6.14.150 : saisons dont tous les paliers de prestige sont atteints (bannière gardée, comme `completed`). */
  prestiged?: string[];
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
  // 6.14.150 : les saisons au prestige complet restent d'un mois sur l'autre (bannières).
  const prestiged = Array.isArray(raw.prestiged) ? raw.prestiged.map(String) : [];
  const keep = prestiged.length ? { prestiged } : {};
  if (raw.seasonId !== seasonId) return { seasonId, points: 0, claimed: [], loginDay: "", completed, activity: {}, ...keep };
  const activity: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.activity ?? {})) if (Number(v) > 0) activity[k] = Number(v);
  const challenge: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.challenge ?? {})) if (Number(v) > 0) challenge[k] = Number(v);
  const cleared = (Array.isArray(raw.cleared) ? raw.cleared : []).map(Number).filter((n) => n >= 1);
  const bySource: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.bySource ?? {})) if (Number(v) > 0) bySource[k] = Number(v);
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
    ...(Object.keys(bySource).length ? { bySource } : {}),
    ...(Number(raw.finishedAtMs) > 0 ? { finishedAtMs: Number(raw.finishedAtMs) } : {}),
    ...(Number(raw.bonusPoints) > 0 ? { bonusPoints: Math.floor(Number(raw.bonusPoints)) } : {}),
    ...(Number(raw.bonusTiers) > 0 ? { bonusTiers: Math.floor(Number(raw.bonusTiers)) } : {}),
    ...(Number(raw.prestigePoints) > 0 ? { prestigePoints: Math.floor(Number(raw.prestigePoints)) } : {}),
    ...keep,
  };
}

/** 6.8.0 : enregistre les points réellement gagnés (après plafond) et l'instant où le passe est fini. */
function notePoints(st: PassState, source: string, before: number, now: number): void {
  const gained = st.points - before;
  if (gained > 0) st.bySource = { ...(st.bySource ?? {}), [source]: (st.bySource?.[source] ?? 0) + gained };
  if (!st.finishedAtMs && st.points >= passMax(st.seasonId)) st.finishedAtMs = now;
}

/** 5.15.12 : compteurs et réclamations du jour (valeurs positives seulement). */
function normalizeDaily(d: NonNullable<PassState["daily"]>): NonNullable<PassState["daily"]> {
  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(d.counts ?? {})) if (Number(v) > 0) counts[k] = Number(v);
  return { day: d.day, counts, claimed: (Array.isArray(d.claimed) ? d.claimed : []).map(Number).filter((n) => n >= 0 && n < 10), ...(d.settled ? { settled: true } : {}) };
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
  // 6.8.0 : un seul passe par mois. Dès le catalogue (passes de saison générés), le passe du chapitre n'est plus lu.
  const chapterPass = seasonId < CATALOG_START ? MONTH_PASSES.get(seasonId) : undefined;
  return SEASON_OVERRIDES.get(seasonId) ?? chapterPass ?? { pointsPerTier: PASS_RULES.pointsPerTier, tiers: PASS_TIERS };
}

/** v5.14.1 : prérequis d'un palier du passe d'une saison. */
function passTierReqs(seasonId: string, tier: number): PassRequirement[] {
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

export function passMax(seasonId: string): number {
  const pass = activePass(seasonId);
  return pass.tiers.length * pass.pointsPerTier;
}

/** v5.4 : compte une action du mois (même sans points de passe : espionnage, marché…). */
export function trackActivity(player: PlayerState, key: string, now: number, times = 1): void {
  if (!(times > 0)) return;
  const st = passState(player, now);
  st.activity = { ...(st.activity ?? {}), [key]: (st.activity?.[key] ?? 0) + times };
  // 6.2 (lot N) : sondes et achats au marché font avancer les objectifs du jour.
  if (key === "spy" || key === "market") recordContract(player, key, times, now);
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
/** 6.11.0 (PRG-2, Z3, proposals/progression.md option B1) : paliers bonus répétables après le dernier palier.
 *  Chaque tranche de `points` points gagnés au-delà du maximum verse `tokens` jetons de casino, `maxPerMonth` fois au plus. */
export const PASS_BONUS_RULES = {
  enabled: true,
  points: 120,
  tokens: 1,
  maxPerMonth: 10,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const PASS_BONUS_RULES_META = {
  enabled: { label: "Paliers bonus après le dernier palier" },
  points: { label: "Points par palier bonus", unit: "points", min: 1, max: 10_000 },
  tokens: { label: "Jetons par palier bonus", unit: "jetons", min: 0, max: 20 },
  maxPerMonth: { label: "Paliers bonus par mois, au plus", min: 0, max: 100 },
};

/** Paliers bonus versés pour un surplus donné (moteur pur, voir passBonusProgress pour l'affichage). */
function settlePassBonus(st: PassState, extra: number): number {
  const r = PASS_BONUS_RULES;
  if (!r.enabled || !(extra > 0) || !(r.points > 0)) return 0;
  const done = st.bonusTiers ?? 0;
  if (done >= r.maxPerMonth) return 0;
  st.bonusPoints = (st.bonusPoints ?? 0) + Math.floor(extra);
  const due = Math.min(r.maxPerMonth, Math.floor(st.bonusPoints / r.points)) - done;
  if (due <= 0) return 0;
  st.bonusTiers = done + due;
  return due;
}

/** Avancée vers le prochain palier bonus (null : désactivé). */
export function passBonusProgress(st: PassState): { tiers: number; max: number; into: number; size: number; tokens: number } | null {
  const r = PASS_BONUS_RULES;
  if (!r.enabled || !(r.points > 0)) return null;
  const tiers = st.bonusTiers ?? 0;
  return { tiers, max: r.maxPerMonth, into: tiers >= r.maxPerMonth ? r.points : (st.bonusPoints ?? 0) - tiers * r.points, size: r.points, tokens: r.tokens };
}

/** 6.14.150 (AP-11, lot R2, proposals/rythme-du-passe.md) : paliers de prestige après le dernier palier, cosmétiques et sans
 *  budget (rien à réclamer, aucune ressource). Un palier de prestige vaut `tierFactor` paliers du passe du mois ; tous atteints, la
 *  saison donne une bannière de prestige. Défaut : 10 paliers de 4 paliers (le plus actif finit vers le jour 25 à 30). */
export const PASS_PRESTIGE_RULES = {
  enabled: true,
  tiers: 10,
  tierFactor: 4,
};

export const PASS_PRESTIGE_RULES_META = {
  enabled: { label: "Paliers de prestige après le dernier palier (cosmétiques)" },
  tiers: { label: "Paliers de prestige par mois", min: 0, max: 50 },
  tierFactor: {
    label: "Taille d'un palier de prestige",
    unit: "paliers du passe",
    min: 0.5,
    max: 50,
    hint: "Points d'un palier de prestige = ce nombre × points par palier du passe du mois (4 × 60 = 240 points).",
  },
};

/** Points d'un palier de prestige pour le passe d'un mois (0 : prestige désactivé). */
export function passPrestigeSize(seasonId: string): number {
  const r = PASS_PRESTIGE_RULES;
  if (!r.enabled || !(r.tiers >= 1) || !(r.tierFactor > 0)) return 0;
  return Math.max(1, Math.round(r.tierFactor * activePass(seasonId).pointsPerTier));
}

/** Avancée du prestige du mois (null : désactivé). `level` paliers atteints sur `max`, `into` / `size` vers le suivant. */
export function passPrestigeProgress(st: Pick<PassState, "seasonId" | "prestigePoints">): { level: number; max: number; into: number; size: number } | null {
  const size = passPrestigeSize(st.seasonId);
  if (!(size > 0)) return null;
  const max = Math.floor(PASS_PRESTIGE_RULES.tiers);
  const pts = Math.max(0, st.prestigePoints ?? 0);
  const level = Math.min(max, Math.floor(pts / size));
  return { level, max, into: level >= max ? size : pts - level * size, size };
}

/** Ajoute des points de prestige (surplus après le dernier palier) ; tous les paliers atteints : la saison rejoint `prestiged`.
 *  Renvoie le nombre de paliers de prestige franchis. */
function settlePassPrestige(st: PassState, extra: number): number {
  const size = passPrestigeSize(st.seasonId);
  if (!(size > 0) || !(extra > 0)) return 0;
  const before = passPrestigeProgress(st)!;
  st.prestigePoints = Math.min(before.max * size, (st.prestigePoints ?? 0) + Math.floor(extra));
  const after = passPrestigeProgress(st)!;
  if (after.level >= after.max && !(st.prestiged ?? []).includes(st.seasonId)) st.prestiged = [...(st.prestiged ?? []), st.seasonId];
  return after.level - before.level;
}

export const PASS_OVERFLOW = {
  /** Sources rapportant au moins ce nombre de points (petits gains réguliers exclus). */
  minPoints: 40,
  amberPerPoint: 1,
  /** 6.14.104 (AA3, AA-11) : Ambre donnée à la place d'une capsule quand la réserve est pleine. */
  capsuleAmber: 15,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const PASS_OVERFLOW_META = {
  minPoints: { label: "Gain minimal converti", unit: "points", min: 0, max: 1000, hint: "Seules les sources qui rapportent au moins ce nombre de points sont converties (petits gains exclus)." },
  amberPerPoint: { label: "Ambre par point en trop", unit: "Ambre", min: 0, max: 100 },
  capsuleAmber: { label: "Ambre à la place d'une capsule (réserve pleine)", unit: "Ambre", min: 0, max: 500 },
};

/** Ajoute des points de passe. Retourne l'Ambre versée si le passe était déjà au maximum (5.18). */
export function addPassPoints(player: PlayerState, source: PassSource, now: number, times = 1): number {
  passHook?.(player, source, now, times);
  trackActivity(player, source, now, times);
  const st = passState(player, now);
  const max = passMax(st.seasonId);
  const gain = PASS_POINTS[source] * Math.max(0, times);
  const overflow = Math.max(0, st.points + gain - max);
  const before = st.points;
  st.points = Math.min(max, st.points + gain);
  notePoints(st, source, before, now);
  // 6.11.0 (Z3) : tout surplus avance les paliers bonus (jetons de casino, plafonnés par mois).
  const bonus = settlePassBonus(st, overflow);
  if (bonus > 0) grantTokens(player, bonus * PASS_BONUS_RULES.tokens);
  // 6.14.150 (AP-11) : le même surplus avance le prestige du mois (cosmétique, tout dans `seasonPass`).
  settlePassPrestige(st, overflow);
  player.seasonPass = st;
  if (overflow > 0 && PASS_POINTS[source] >= PASS_OVERFLOW.minPoints) {
    const amber = Math.floor(overflow * PASS_OVERFLOW.amberPerPoint);
    if (amber > 0) {
      const b = bountyState(player);
      b.amber += amber;
      player.bounties = b;
      noteAmber(player, "pass", amber, now);
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
  const before = st.points;
  st.points = Math.min(passMax(st.seasonId), st.points + PASS_POINTS.dailyLogin);
  notePoints(st, "dailyLogin", before, now);
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
export function grantPassReward(player: PlayerState, r: PassReward, seasonId: string, now: number, random: () => number = Math.random, amberSource: AmberSource = "pass"): string {
  if (r.kind === "production") {
    for (const [res, n] of Object.entries(productionHours(player, r.hours)) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
    return describePassReward(r);
  }
  if (r.kind === "amber") {
    const b = bountyState(player);
    b.amber += r.amount;
    player.bounties = b;
    noteAmber(player, amberSource, r.amount, now);
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
    const capsuleAmber = Math.max(0, Math.floor(Number(PASS_OVERFLOW.capsuleAmber) || 0));
    b.amber += capsuleAmber;
    player.bounties = b;
    noteAmber(player, amberSource, capsuleAmber, now);
    return `${capsuleAmber} Ambre (réserve de capsules pleine)`;
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
    noteAmber(player, amberSource, 40, now);
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
            .map((r) => `${objectiveLabel(r.key).toLowerCase()} ${r.done} / ${r.count}`)
            .join(", ")}.`,
    );
  const gained = pass.tiers[tier - 1].map((r) => grantPassReward(player, r, st.seasonId, now, random));
  const after = passState(player, now);
  after.claimed = [...st.claimed, tier].sort((a, b) => a - b);
  player.seasonPass = after;
  return gained;
}
