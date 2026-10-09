import { ASCENSION_RULES } from "@/game/ascension";
import { storageBufferHours } from "@/game/buildingTiers";
import { rawUnitCapacity } from "@/game/hangar";
import { applyBuildingDiscount, BUILDINGS, defaultBuildings, effectiveBuildingLevel, getBuildingUpgradeCost, getBuildingUpgradeTime, getStorageCapacity, keptOnAscension, requiredForAscension } from "@/game/buildings";
import { buildSlots } from "@/game/buildPlan";
import { CONTRACT_RULES } from "@/game/contracts";
import { defaultResources } from "@/game/defaults";
import { missionRewards, rareRewardScale } from "@/game/economy";
import { EXPEDITION_RULES } from "@/game/expeditions";
import { MISSIONS } from "@/game/missions";
import { ONBOARDING_STEPS } from "@/game/onboarding";
import { GUIDE_STEPS, guideStepReward } from "@/game/advancedGuide";
import { DEFAULT_FACTIONS, findFaction } from "@/game/pirates";
import { splitProductionReward, START_REWARD_RULES, tutorialRaidBounty } from "@/game/startRewards";
import { TUTORIAL_RAID } from "@/game/story";
import { PRESTIGE_RULES } from "@/game/prestige";
import { getRank } from "@/game/ranks";
import { getProductionRatesPerSecond } from "@/game/production";
import { EXCHANGE_RULES } from "@/game/resources";
import { chestCommonAmount, chestIndexed, STREAK_RULES } from "@/game/streak";
import { CATCHUP_RULES, catchupBonus } from "@/game/catchup";
import { getTechCost, getTechTime, RESEARCH_RULES, techBonus, techReductionFactor, TECHNOLOGIES } from "@/game/technologies";
import { UNITS } from "@/game/units";
import { rareValue } from "@/game/balance/analysis";
import type { Buildings, TechLevels } from "@/types/game";

/* =====================================================
   6.14.71 (AU27, lot AE-L0) : simulateur de progression.

   Moteur pur (ni DOM, ni réseau, ni hasard) : un joueur glouton par profil, sur
   90 jours, au pas de 10 min. À chaque session, il réclame la série et les
   objectifs du jour, relance les missions débloquées, fait ses expéditions
   (valeur moyenne), remplit ses chantiers (le moins cher d'abord) et ses
   recherches (la moins chère d'abord, rares comptées `rareValue()`). Il passe par le
   comptoir quand seules les rares manquent. La prise en main est versée à J0.

   Production, entrepôt, coûts, durées, échelle des rares, récompenses des
   missions, série, coffre du 7e jour et comptoir sont lus dans les règles en
   vigueur (`applyGameContent` les règle) : un réglage se mesure avant d'être
   appliqué (`node scripts/progression-sim.mjs`, docs/proposals/equilibrage-au27.md).

   Hors modèle (tout accélère le vrai jeu) : achats d'unités, combats, pillage,
   événements, reliques, officiers, talents, alliance, classes, primes.
   Les résultats sont des ordres de grandeur, pas des dates exactes.

   Étude du rythme long terme (docs/proposals/rythme-long-terme.md) : options
   facultatives, toutes éteintes par défaut (les repères d'I29 ne bougent pas) :
   horizon libre (`days`, 365 pour un an), Ascensions successives (`ascend`,
   règles ASCENSION_RULES), modèles d'options à l'étude (conditions d'Ascension,
   coût croissant par Ascension, plafond de niveau par ère, recherche tardive plus
   longue, durées du second palier), puits de dépense (flotte dans la place des
   hangars, projets de prestige), XP et rang, relevés par fenêtre de 30 jours
   (sessions bloquées, sessions sans progression, production perdue, jours « fini »).
===================================================== */

const COMMONS = ["scrap", "energy", "nano", "data"] as const;
const EXTRACTORS = ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"];
const RARES = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"] as const;
const HOUR = 3600;
const DAY = 86_400;

/** Hypothèses du modèle (pas des règles du jeu : elles ne vont pas dans l'admin). */
const PROGRESSION_SIM_MODEL = {
  /** Expédition moyenne : gisement (35 %) de 2 h de production commune… */
  expeditionDepositShare: 0.35,
  expeditionDepositHours: 2,
  /** …et trésor (15 %) de 0,75 h de production converti en rares. */
  expeditionRareShare: 0.15,
  expeditionRareHours: 0.75,
  /** Unités : les hangars (techno « Infrastructure spatiale ») débloquent la construction. */
  hangarTech: "tech6",
  /** Premier mur : au moins ce nombre de chantiers vides alors qu'il reste à construire. */
  wallFreeSlots: 3,
};

export type ProgressionProfileId = "actif" | "moyen" | "occasionnel" | "quotidien";

export interface ProgressionProfile {
  id: ProgressionProfileId;
  label: string;
  /** Heures des sessions (heure du jour, 0 à 23). */
  sessionHours: number[];
  /** Un jour sur N manqué (le N-ième) ; 0 = jamais. */
  skipEvery: number;
  /** Objectifs du jour faits (4 = tous, coffre des objectifs compris). */
  objectives: number;
}

/** Profils du rapport AU27 (§1). */
export const PROGRESSION_PROFILES: Record<ProgressionProfileId, ProgressionProfile> = {
  actif: { id: "actif", label: "Actif (8 sessions par jour)", sessionHours: [7, 9, 11, 13, 15, 17, 19, 21], skipEvery: 0, objectives: 4 },
  moyen: { id: "moyen", label: "Moyen (3 sessions par jour)", sessionHours: [8, 13, 20], skipEvery: 0, objectives: 4 },
  occasionnel: { id: "occasionnel", label: "Occasionnel (1 session, un jour sur 3 manqué)", sessionHours: [20], skipEvery: 3, objectives: 2 },
  quotidien: { id: "quotidien", label: "Quotidien (1 session par jour, sans manquer)", sessionHours: [20], skipEvery: 0, objectives: 2 },
};

export interface ProgressionOptions {
  days?: number;
  /** Pas de la simulation (s) ; une session tombe sur un pas. */
  stepSeconds?: number;
  /** Comptoir utilisé quand seules les rares manquent (vrai par défaut). */
  useExchange?: boolean;
  /** Jours des relevés. */
  milestones?: number[];
  /** Largeur des fenêtres de relevé (jours), 30 par défaut. */
  windowDays?: number;
  /** Le joueur fait chaque Ascension dès qu'elle est possible (ASCENSION_RULES : délai, maximum, bonus). */
  ascend?: boolean;
  /** Option B (modèle) : condition en plus des bâtiments au maximum, pour la n-ième Ascension. */
  ascensionGate?: (ctx: AscensionGateContext) => boolean;
  /** Option B (modèle) : coût du second palier multiplié par (1 + x)^n après n Ascensions. */
  costGrowthPerAscension?: number;
  /** Option D (modèle) : niveau le plus haut ouvert ce jour-là pour les bâtiments exigés par l'Ascension (ères du serveur). */
  levelCapByDay?: (day: number) => number;
  /** Option A (modèle) : recherche tardive, coût et durée multipliés pour les niveaux ≥ fromLevel ; durée d'un niveau plafonnée à maxSeconds (avant réductions). */
  techLate?: { fromLevel: number; costFactor: number; timeFactor: number; maxSeconds?: number };
  /** Option A (modèle) : durées du second palier des bâtiments multipliées. */
  tier2TimeFactor?: number;
  /** Option A (modèle) : croissance des durées de recherche par niveau (1,67 dans le code, constante TIME_GROWTH). */
  techTimeGrowth?: number;
  /** Puits : surplus commun au-dessus de reserveShare × entrepôt dépensé en vaisseaux d'attaque, dans la place des hangars. */
  fleetSink?: { reserveShare: number };
  /** Option C (modèle, AE-L6) : projets de prestige, un à la fois ; le n-ième coûte hours × growth^n heures de la production commune du moment. */
  prestigeProjects?: { hours: number; growth: number; durationHours: number; reserveShare: number; /** Ouverts quand les 4 extracteurs atteignent ce niveau (0 : dès J0). */ minExtractorLevel?: number };
  /** 6.14.106 (AE-L3, AE-15) : médiane du développement (niveaux de bâtiments + technos) de la population, jour par jour ;
   *  le rattrapage (`CATCHUP_RULES`) est alors appliqué à la production, figé pour la journée. Absent : pas de rattrapage. */
  catchupMedianByDay?: number[];
  /** 6.14.143 (PB-L2) : paliers de l'entrepôt (tampon du palier 10, `buildingTiers.storageBufferHours`) ; faux : sans tampon. */
  storageTiers?: boolean;
  /** 6.14.159 (RD-1) : premières minutes d'un nouveau compte, joueur connecté sans interruption dès J0 0 h (il agit à chaque
   *  pas de `stepSeconds`, 10 s par défaut, qui doit diviser le pas de la simulation). Ces pas ne comptent pas dans les relevés
   *  de sessions. Niveaux relevés aux minutes `marks`. Absent : pas d'ouverture (repères d'I29 inchangés). */
  opening?: { minutes: number; stepSeconds?: number; marks?: number[] };
  /** 6.14.163 (S3, proposals/recompenses-du-depart.md) : récompenses du départ hors prise en main, versées une fois : prime du
   *  raid d'initiation à `raidMinute` et objectif « dailyGoal » du Carnet à `guideMinute` (règles `startRewards` : indexées sur la
   *  production, ou anciennes valeurs si décochées). Absent : non simulées (repères d'I29 inchangés). */
  startRewards?: { raidMinute: number; guideMinute: number; /** 6.14.165 (S6, NJ-25) : palier 1 du passe (2 h de production). */ passMinute?: number };
  /** 6.14.165 (S6, NJ-26, RR-2) : le joueur échange ses ressources communes en trop au comptoir (commune → commune, taux
   *  `exchange.commonToCommon`, taxe comprise) quand seule une commune manque pour le chantier ou la recherche la moins chère. */
  surplusExchange?: boolean;
}

/** 6.14.159 (RD-1) : relevé des premières minutes (option `opening`). */
export interface ProgressionOpeningMark {
  minute: number;
  extractors: number[];
  storageLevel: number;
  /** Chantiers lancés depuis l'inscription. */
  launched: number;
  /** 6.14.165 (RR-2) : stocks des ressources communes (ferraille, énergie, nano, données) au relevé. */
  stocks: number[];
  /** 6.14.165 (RR-2) : communes vendues au comptoir (commune → commune) depuis l'inscription. */
  swapped: number;
}

export interface AscensionGateContext {
  /** Numéro de l'Ascension visée (1 = la première). */
  n: number;
  day: number;
  xp: number;
  techLevels: number;
  techComplete: boolean;
  prestigeProjects: number;
  /** Jour de la précédente Ascension (null : aucune). */
  lastAscensionDay: number | null;
}

export interface ProgressionWindow {
  fromDay: number;
  toDay: number;
  sessions: number;
  /** Sessions avec un chantier ou un labo libre, rien d'abordable alors qu'il reste à faire (mur), en %. */
  blockedPct: number;
  /** Sessions sans bâtiment ni recherche lancés (files pleines comprises), en %. */
  noProgressPct: number;
  /** Sessions sans bâtiment, recherche, vaisseau ni projet lancés, en %. */
  noSpendPct: number;
  /** Jours joués sans aucun bâtiment ni recherche lancés. */
  daysWithoutLaunch: number;
  /** Jours joués sans bâtiment, recherche, vaisseau ni projet lancés. */
  daysWithoutSpend: number;
  /** Jours où bâtiments et arbre sont au maximum, sans Ascension possible (« fini, sans suite »). */
  finishedDays: number;
  /** Production commune perdue dans la fenêtre, en %. */
  lostPct: number;
}

export interface ProgressionSnapshot {
  day: number;
  /** Niveaux des 4 extracteurs. */
  extractors: number[];
  storageLevel: number;
  techLevels: number;
  techCount: number;
  /** Production commune totale par heure. */
  commonPerHour: number;
  /** 6.14.106 : production rare totale par heure (extracteurs et technos, Ascensions comprises). */
  rarePerHour: number;
  storageCap: number;
  commonStock: number;
  rareStock: number;
  /** Production commune perdue (entrepôt plein), cumul depuis J0, en %. */
  lostPct: number;
  /** Somme des niveaux des bâtiments exigés par l'Ascension. */
  buildingLevels: number;
  xp: number;
  rank: string;
  ascensions: number;
  /** Flotte achetée par le puits (valeur en communes) et places occupées / capacité des hangars d'attaque. */
  fleetValue: number;
  fleetPlaces: number;
  fleetCapacity: number;
  prestigeProjects: number;
}

export interface ProgressionChest {
  /** Jours écoulés au moment du coffre. */
  day: number;
  /** Ressources communes du coffre (les 4 réunies). */
  common: number;
  /** En heures de production commune du joueur à ce moment. */
  hoursOfProduction: number;
  storageCap: number;
  /** Stock commun le plus haut juste après le coffre. */
  maxStockAfter: number;
}

export interface ProgressionResult {
  profile: ProgressionProfileId;
  days: number;
  /** Jour où tous les bâtiments requis par l'Ascension sont au niveau maximal (null : pas avant la fin). */
  ascensionDay: number | null;
  /** Jour où tout l'arbre (hors technos à Ambre) est au niveau maximal. */
  techCompleteDay: number | null;
  techTotalLevels: number;
  /** Premier jour (dès J1) avec au moins 3 chantiers vides faute de pouvoir payer. */
  firstWallDay: number | null;
  /** Production commune perdue sur toute la durée, en %. */
  lostPct: number;
  /** Sessions sans aucune action possible alors qu'il reste à faire, en % (J1–7, J8–30, J31–90). */
  deadSessionsPct: { early: number; mid: number; late: number };
  /** Origine des gains (équivalent communes, rares × 50), en %, de J14 à la fin ; la production compte brute (entrepôt plein compris), comme au rapport AU27. */
  incomeShareFromJ14: Record<string, number>;
  /** Premier coffre du 7e jour (null : jamais atteint). */
  firstChest: ProgressionChest | null;
  /** Communes converties au comptoir. */
  exchangedCommon: number;
  /** 6.14.106 : rares obtenues au comptoir (total, et semaine la plus forte) ; plafond `exchange.weeklyRareCap` appliqué. */
  exchangedRare: number;
  exchangedRarePeakWeek: number;
  /** 6.14.106 : développement (niveaux de bâtiments + technos, comme `developmentScore`) au début de chaque jour. */
  devScoreByDay: number[];
  /** 6.14.106 : bonus de rattrapage moyen sur les jours 1 à 30 (0,12 = +12 %), option `catchupMedianByDay`. */
  catchupAvgJ1to30: number;
  snapshots: ProgressionSnapshot[];
  /** Jours des Ascensions faites (option `ascend`). */
  ascensionDays: number[];
  /** Relevés par fenêtre de `windowDays` jours. */
  windows: ProgressionWindow[];
  xp: number;
  /** Jour où la place des hangars d'attaque est pleine pour la première fois (puits de flotte). */
  fleetFullDay: number | null;
  /** 6.14.159 (RD-1) : heures depuis l'inscription jusqu'aux 4 extracteurs au niveau 5, puis 10 (null : pas atteint). */
  reachHours: { l5: number | null; l10: number | null };
  /** 6.14.159 (RD-1) : relevés de l'option `opening` (vide sans elle). */
  opening: ProgressionOpeningMark[];
  /** 6.14.163 (S3) : récompenses du départ versées (option `startRewards`), et production commune par heure à ce moment. */
  startRewardsPaid: { raid: Record<string, number>; raidPerHour: number; guide: Record<string, number>; guidePerHour: number; pass: Record<string, number>; passPerHour: number; passDeferred: Record<string, number> };
}

type Cost = Record<string, number | undefined>;

/** Récompenses de la prise en main réunies (versées à J0). */
export function onboardingTotal(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of ONBOARDING_STEPS) for (const [k, n] of Object.entries(s.reward)) out[k] = (out[k] ?? 0) + (n ?? 0);
  return out;
}

const isRare = (k: string) => (RARES as readonly string[]).includes(k);
const value = (c: Cost) => Object.entries(c).reduce((a, [k, n]) => a + (n ?? 0) * (isRare(k) ? rareValue() : 1), 0);
const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

/** Simule un profil sur `days` jours avec les règles en vigueur. Déterministe. */
export function simulateProgression(profile: ProgressionProfile, options: ProgressionOptions = {}): ProgressionResult {
  const days = options.days ?? 90;
  const baseStep = options.stepSeconds ?? 600;
  // 6.14.159 (RD-1) : ouverture à pas fin, jusqu'à un multiple du pas de la simulation (les heures de session restent alignées).
  const openStep = options.opening ? Math.max(1, Math.min(baseStep, options.opening.stepSeconds ?? 10)) : baseStep;
  const openingEnd = options.opening && baseStep % openStep === 0 ? Math.ceil((Math.max(0, options.opening.minutes) * 60) / baseStep) * baseStep : 0;
  const openingMarks = new Set((options.opening?.marks ?? []).map((m) => Math.round(m * 60)));
  const opening: ProgressionOpeningMark[] = [];
  let openingLaunched = 0;
  const reachHours: { l5: number | null; l10: number | null } = { l5: null, l10: null };
  const useExchange = options.useExchange !== false;
  const milestones = new Set(options.milestones ?? [1, 3, 7, 14, 30, 60, 90]);
  const windowDays = Math.max(1, options.windowDays ?? 30);
  const M = PROGRESSION_SIM_MODEL;

  const buildings: Buildings = defaultBuildings();
  const tech: TechLevels = {};
  const res: Record<string, number> = { ...defaultResources() };
  for (const [k, n] of Object.entries(onboardingTotal())) res[k] = (res[k] ?? 0) + n;
  const player = () => ({ buildings, techLevels: tech });

  const bQueue: Record<string, number> = {};
  const rQueue: Record<string, number> = {};
  const mQueue: Record<string, number> = {};
  const researchable = TECHNOLOGIES.filter((t) => !t.amberCost);
  const techTotalLevels = researchable.reduce((a, t) => a + t.maxLevel, 0);

  let streak = 0;
  let lastStreakDay = -2;
  let raidPaid = false;
  let guidePaid = false;
  const startRewardsPaid: ProgressionResult["startRewardsPaid"] = { raid: {}, raidPerHour: 0, guide: {}, guidePerHour: 0, pass: {}, passPerHour: 0, passDeferred: {} };
  let passPaid = false;
  let swapped = 0;
  let objStreak = 0;
  let objDays = 0;
  let expToday = 0;
  let overflow = 0;
  let produced = 0;
  // 6.14.143 (PB-L2) : tampon de l'entrepôt (palier 10), par ressource commune.
  const buffer: Record<string, number> = {};
  let exchanged = 0;
  let exchangedRare = 0;
  const rareByWeek: number[] = [];
  const devScoreByDay: number[] = [];
  let catchupF = 1;
  let catchupSum = 0;
  let catchupDays = 0;
  let firstWall: number | null = null;
  let ascensionDay: number | null = null;
  let techCompleteDay: number | null = null;
  let firstChest: ProgressionChest | null = null;
  const dead = { early: [0, 0], mid: [0, 0], late: [0, 0] };
  const income: Record<string, number> = {};
  const snapshots: ProgressionSnapshot[] = [];

  // Étude du rythme long terme : Ascensions, puits, XP, fenêtres (éteints par défaut).
  const required = BUILDINGS.filter(requiredForAscension);
  let ascensions = 0;
  let lastAscensionT: number | null = null;
  const ascensionDays: number[] = [];
  let xp = 0;
  let fleetValue = 0;
  let fleetPlaces = 0;
  let fleetFullDay: number | null = null;
  let projects = 0;
  let projectEnd = 0;
  type Win = { sessions: number; blocked: number; noProgress: number; noSpend: number; finished: number; overflow: number; produced: number; days: Map<number, boolean>; spendDays: Map<number, boolean> };
  const wins: Win[] = [];
  const openingWin: Win = { sessions: 0, blocked: 0, noProgress: 0, noSpend: 0, finished: 0, overflow: 0, produced: 0, days: new Map(), spendDays: new Map() };
  const win = (day: number): Win => (wins[Math.floor(day / windowDays)] ??= { sessions: 0, blocked: 0, noProgress: 0, noSpend: 0, finished: 0, overflow: 0, produced: 0, days: new Map(), spendDays: new Map() });
  const prodFactor = () => 1 + ascensions * ASCENSION_RULES.productionPerAscension;
  const ascBuildFactor = () => Math.max(0.1, 1 - ascensions * ASCENSION_RULES.buildTimePerAscension);
  const ratesNow = () => {
    const r = getProductionRatesPerSecond(buildings, tech);
    if (ascensions === 0) return r;
    const f = prodFactor();
    return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, (v ?? 0) * f])) as typeof r;
  };
  const levelCap = (b: (typeof BUILDINGS)[number], day: number) => (options.levelCapByDay && requiredForAscension(b) ? Math.min(b.maxLevel, options.levelCapByDay(day)) : b.maxLevel);
  const buildingCost = (b: (typeof BUILDINGS)[number], next: number): Cost => {
    const c = getBuildingUpgradeCost(b, next) as Cost;
    const g = options.costGrowthPerAscension ?? 0;
    if (!g || !ascensions || !b.upgrade.tier2 || next < b.upgrade.tier2.fromLevel) return c;
    const f = Math.pow(1 + g, ascensions);
    return Object.fromEntries(Object.entries(c).map(([k, n]) => [k, (n ?? 0) * f]));
  };
  const buildingTime = (b: (typeof BUILDINGS)[number], next: number) => {
    const s = getBuildingUpgradeTime(b, next);
    return options.tier2TimeFactor && b.upgrade.tier2 && next >= b.upgrade.tier2.fromLevel ? s * options.tier2TimeFactor : s;
  };
  const late = (level: number) => (options.techLate && level >= options.techLate.fromLevel ? options.techLate : null);
  /** Durée d'un niveau de recherche, avec la croissance d'étude si elle est donnée (même formule que getTechTime). */
  const techTime = (tt: (typeof TECHNOLOGIES)[number], level: number) => (options.techTimeGrowth ? Math.floor(tt.baseTime * Math.pow(options.techTimeGrowth, level - 1)) : getTechTime(tt, level));
  const allMaxed = () => required.every((b) => (buildings[b.id]?.level ?? 0) >= b.maxLevel);

  const commonPerHour = () => {
    const r = ratesNow();
    return COMMONS.reduce((a, k) => a + (r[k] ?? 0), 0) * HOUR;
  };
  const unitUnlocked = (id: string) => {
    const u = UNITS.find((x) => x.id === id);
    return !!u && (tech[M.hangarTech] ?? 0) >= 1 && (!u.unlockTech || (tech[u.unlockTech] ?? 0) >= 1);
  };
  const afford = (c: Cost) => Object.entries(c).every(([k, n]) => (res[k] ?? 0) >= (n ?? 0));
  const pay = (c: Cost) => {
    for (const [k, n] of Object.entries(c)) res[k] = (res[k] ?? 0) - (n ?? 0);
  };
  const add = (c: Cost, source: string, t: number) => {
    if (t >= 14 * DAY) income[source] = (income[source] ?? 0) + value(c);
    for (const [k, n] of Object.entries(c)) if (k in res) res[k] += n ?? 0;
  };
  /** Comptoir : seules les rares manquent et les communes en trop paient l'échange (taxe comprise). */
  const tryExchange = (c: Cost) => {
    if (!useExchange || EXCHANGE_RULES.commonToRare <= 0) return false;
    const need: Record<string, number> = {};
    for (const [k, n] of Object.entries(c)) {
      if (!isRare(k) && (res[k] ?? 0) < (n ?? 0)) return false;
      if (isRare(k) && (res[k] ?? 0) < (n ?? 0)) need[k] = (n ?? 0) - (res[k] ?? 0);
    }
    const rareNeeded = Object.values(need).reduce((a, b) => a + b, 0);
    // 6.14.106 (AE-L3, Q98) : plafond hebdomadaire des rares reçues au comptoir (semaines de 7 jours depuis J0).
    const week = Math.floor(exchangeT / (7 * DAY));
    const cap = Number(EXCHANGE_RULES.weeklyRareCap) || 0;
    if (cap > 0 && (rareByWeek[week] ?? 0) + rareNeeded > cap) return false;
    let commonsNeeded = rareNeeded / (EXCHANGE_RULES.commonToRare * (1 - EXCHANGE_RULES.taxPct));
    const spare = (k: string) => Math.max(0, res[k] - (c[k] ?? 0));
    if (COMMONS.reduce((a, k) => a + spare(k), 0) < commonsNeeded) return false;
    for (const k of COMMONS) {
      const take = Math.min(spare(k), commonsNeeded);
      res[k] -= take;
      commonsNeeded -= take;
      exchanged += take;
    }
    for (const [k, n] of Object.entries(need)) res[k] += n;
    rareByWeek[week] = (rareByWeek[week] ?? 0) + rareNeeded;
    exchangedRare += rareNeeded;
    return true;
  };
  /** 6.14.165 (RR-2, option `surplusExchange`) : commune → commune au comptoir, quand seules des communes manquent. */
  const tryCommonExchange = (c: Cost) => {
    const rate = (Number(EXCHANGE_RULES.commonToCommon) || 0) * (1 - EXCHANGE_RULES.taxPct);
    // Comme le conseil « Échange ton surplus » : les `surplusAdviceDays` premiers jours seulement (0 : toujours).
    const days = Math.max(0, Number(EXCHANGE_RULES.surplusAdviceDays) || 0);
    if (!options.surplusExchange || !(rate > 0) || (days > 0 && exchangeT >= days * DAY)) return false;
    for (const [k, n] of Object.entries(c)) if (isRare(k) && (res[k] ?? 0) < (n ?? 0)) return false;
    const need: Record<string, number> = {};
    for (const k of COMMONS) {
      const lack = (c[k] ?? 0) - (res[k] ?? 0);
      if (lack > 0) need[k] = lack;
    }
    if (!Object.keys(need).length) return false;
    const spare = (k: string) => (need[k] ? 0 : Math.max(0, (res[k] ?? 0) - (c[k] ?? 0)));
    let sell = Object.values(need).reduce((a, b) => a + b, 0) / rate;
    if (COMMONS.reduce((a, k) => a + spare(k), 0) < sell) return false;
    for (const k of [...COMMONS].sort((a, b) => spare(b) - spare(a))) {
      const take = Math.min(spare(k), sell);
      res[k] -= take;
      sell -= take;
      swapped += take;
    }
    for (const [k, n] of Object.entries(need)) res[k] += n;
    return true;
  };
  let exchangeT = 0;

  for (let t = 0, step = baseStep; t < days * DAY; t += step) {
    step = t < openingEnd ? openStep : baseStep;
    const inOpening = t < openingEnd;
    exchangeT = t;
    // 6.14.106 : développement du jour et rattrapage figé pour la journée (option catchupMedianByDay).
    if (t % DAY === 0) {
      const score = Object.values(buildings).reduce((a, b) => a + Math.max(0, Number(b?.level) || 0), 0) + Object.values(tech).reduce((a, n) => a + Math.max(0, Number(n) || 0), 0);
      devScoreByDay.push(score);
      const med = options.catchupMedianByDay?.[Math.floor(t / DAY)];
      catchupF = med !== undefined ? 1 + catchupBonus(score, med, CATCHUP_RULES) : 1;
      if (t / DAY >= 1 && t / DAY <= 30) {
        catchupSum += catchupF - 1;
        catchupDays++;
      }
    }
    // Fin des files.
    for (const [id, end] of Object.entries(bQueue)) {
      if (end > t) continue;
      buildings[id] = { ...buildings[id], level: (buildings[id].level ?? 0) + 1 };
      delete bQueue[id];
    }
    for (const [id, end] of Object.entries(rQueue)) {
      if (end > t) continue;
      tech[id] = (tech[id] ?? 0) + 1;
      delete rQueue[id];
    }
    for (const [key, end] of Object.entries(mQueue)) {
      if (end > t) continue;
      const rw = missionRewards(MISSIONS[key], player());
      xp += rw.xp ?? 0;
      delete rw.xp;
      add(rw, "missions", t);
      delete mQueue[key];
    }

    // Production (communes plafonnées par l'entrepôt, rares sans plafond), rattrapage compris (option).
    const rates = catchupF === 1 ? ratesNow() : (Object.fromEntries(Object.entries(ratesNow()).map(([k, v]) => [k, (v ?? 0) * catchupF])) as ReturnType<typeof ratesNow>);
    const cap = getStorageCapacity(buildings, tech);
    const w = win(Math.floor(t / DAY));
    const bufHours = options.storageTiers === false ? 0 : storageBufferHours(buildings);
    for (const [k, rate] of Object.entries(rates)) {
      const g = (rate ?? 0) * step;
      if (isRare(k)) {
        add({ [k]: g }, "production", t);
        continue;
      }
      produced += g;
      w.produced += g;
      if (t >= 14 * DAY) income.production = (income.production ?? 0) + g;
      // Le tampon se verse d'abord dans la place libre, puis garde la production en trop (même règle que le jeu, economy.ts).
      if ((buffer[k] ?? 0) > 0 && (res[k] ?? 0) < cap) {
        const move = Math.min(buffer[k], cap - (res[k] ?? 0));
        res[k] += move;
        buffer[k] -= move;
      }
      const kept = Math.min(Math.max(0, cap - (res[k] ?? 0)), g);
      const over = g - kept;
      const held = bufHours > 0 ? Math.max(0, Math.min(over, (rate ?? 0) * bufHours * HOUR - (buffer[k] ?? 0))) : 0;
      if (held > 0) buffer[k] = (buffer[k] ?? 0) + held;
      overflow += over - held;
      w.overflow += over - held;
      res[k] += kept;
    }

    // 6.14.163 (S3) : prime du raid d'initiation et premier objectif du Carnet (option `startRewards`).
    if (options.startRewards) {
      if (!raidPaid && t >= options.startRewards.raidMinute * 60) {
        raidPaid = true;
        const f = findFaction(TUTORIAL_RAID.factionId) ?? DEFAULT_FACTIONS.find((x) => x.id === TUTORIAL_RAID.factionId);
        const r = getProductionRatesPerSecond(buildings, tech);
        const bounty: Record<string, number> = START_REWARD_RULES.enabled
          ? (tutorialRaidBounty(player()) as Record<string, number>)
          : Object.fromEntries(COMMONS.map((k) => [k, Math.floor((r[k] ?? 0) * (f?.bounty.hours ?? 0) * HOUR)]));
        add(bounty, "raid d'initiation", t);
        startRewardsPaid.raid = bounty;
        startRewardsPaid.raidPerHour = Math.round(COMMONS.reduce((a, k) => a + (r[k] ?? 0), 0) * HOUR);
      }
      if (!guidePaid && t >= options.startRewards.guideMinute * 60) {
        guidePaid = true;
        const step = GUIDE_STEPS.find((s) => s.id === "dailyGoal");
        const reward = step ? (guideStepReward(step, player()) as Record<string, number>) : {};
        add(reward, "Carnet", t);
        startRewardsPaid.guide = reward;
        const r = getProductionRatesPerSecond(buildings, tech);
        startRewardsPaid.guidePerHour = Math.round(COMMONS.reduce((a, k) => a + (r[k] ?? 0), 0) * HOUR);
      }
      // 6.14.165 (S6, NJ-25) : palier 1 du passe (2 h de production), plafonné pour un compte jeune (règles `startRewards`).
      const pm = options.startRewards.passMinute;
      if (pm !== undefined && !passPaid && t >= pm * 60) {
        passPaid = true;
        const split = splitProductionReward({ ...player(), createdAtMs: 1 }, 2, 1 + t * 1000);
        add(split.paid as Cost, "passe", t);
        startRewardsPaid.pass = split.paid as Record<string, number>;
        startRewardsPaid.passDeferred = split.deferred as Record<string, number>;
        const r = getProductionRatesPerSecond(buildings, tech);
        startRewardsPaid.passPerHour = Math.round(COMMONS.reduce((a, k) => a + (r[k] ?? 0), 0) * HOUR);
      }
    }

    const day = Math.floor(t / DAY);
    const sec = t % DAY;
    if (sec === 0) expToday = 0;
    const skipped = profile.skipEvery > 0 && day % profile.skipEvery === profile.skipEvery - 1;
    if (inOpening || (!skipped && profile.sessionHours.some((h) => h * HOUR === sec))) {
      let launched = 0;
      let sunk = 0;
      // Série de connexion, coffre du 7e jour et objectifs du jour (première session du jour).
      if (lastStreakDay !== day) {
        streak = lastStreakDay === day - 1 ? streak + 1 : 1;
        lastStreakDay = day;
        const cycleDay = ((streak - 1) % 7) + 1;
        const r = ratesNow();
        const hours = STREAK_RULES.hours[cycleDay - 1] ?? 0;
        for (const k of COMMONS) add({ [k]: Math.max(STREAK_RULES.floor, (r[k] ?? 0) * hours * HOUR) }, "série", t);
        if (cycleDay === 7) {
          // 6.14.106 (AE-L3, Q99) : coffre indexé, valeur moyenne (milieu de `commonHours`) de la production des extracteurs et
          // technos, dans la place libre de l'entrepôt, au moins le plancher `common[0]` ; sinon milieu des bornes fixes.
          const ch = STREAK_RULES.chest;
          const base = getProductionRatesPerSecond(buildings, tech);
          const midHours = (ch.commonHours[0] + ch.commonHours[1]) / 2;
          const chestRes = Object.fromEntries(COMMONS.map((k) => [k, chestIndexed(ch) ? chestCommonAmount((base[k] ?? 0) * HOUR, midHours, ch.common[0], getStorageCapacity(buildings, tech) - (res[k] ?? 0)) : (ch.common[0] + ch.common[1]) / 2]));
          const total = Object.values(chestRes).reduce((a, b) => a + b, 0);
          const perHour = commonPerHour();
          for (const k of COMMONS) add({ [k]: chestRes[k] }, "coffre du 7e jour", t);
          if (!firstChest) {
            const stock = Math.max(...COMMONS.map((k) => res[k]));
            firstChest = { day: round1(t / DAY), common: total, hoursOfProduction: perHour > 0 ? round1(total / perHour) : 0, storageCap: getStorageCapacity(buildings, tech), maxStockAfter: Math.round(stock) };
          }
        }
        const scale = rareRewardScale(player());
        const mult = (1 + Math.min(CONTRACT_RULES.streakBonusMax, objStreak * CONTRACT_RULES.streakBonusPerDay)) * scale;
        for (let i = 0; i < profile.objectives; i++) add({ [RARES[(i + day) % RARES.length]]: CONTRACT_RULES.rarePerContract * mult }, "objectifs", t);
        xp += profile.objectives * CONTRACT_RULES.xpPerContract;
        if (profile.objectives >= CONTRACT_RULES.perDay) {
          objStreak++;
          objDays++;
          if (objDays % CONTRACT_RULES.chestEvery === 0) for (const k of RARES) add({ [k]: CONTRACT_RULES.chestRare * scale }, "objectifs", t);
        } else objStreak = 0;
      }
      // Missions débloquées, toutes relancées.
      for (const m of Object.values(MISSIONS)) {
        if (mQueue[m.key] || !Object.keys(m.prereq).every(unitUnlocked)) continue;
        mQueue[m.key] = t + m.duration;
      }
      // Expéditions (valeur moyenne, versée tout de suite).
      while (expToday < EXPEDITION_RULES.maxPerDay && unitUnlocked("fregate")) {
        expToday++;
        xp += EXPEDITION_RULES.xpPerHour * (EXPEDITION_RULES.durations[0] ?? 2);
        const ph = commonPerHour();
        for (const k of COMMONS) add({ [k]: (M.expeditionDepositShare * M.expeditionDepositHours * ph) / COMMONS.length }, "expéditions", t);
        for (const k of RARES) add({ [k]: (M.expeditionRareShare * M.expeditionRareHours * ph) / EXPEDITION_RULES.rareRate / RARES.length }, "expéditions", t);
      }
      // Ascension (option `ascend`) : dès que possible ; les chantiers attendent que les files se vident.
      let holdBuilds = false;
      if (options.ascend && ascensions < ASCENSION_RULES.maxAscensions && allMaxed()) {
        const cooldownOk = lastAscensionT === null || t - lastAscensionT >= ASCENSION_RULES.cooldownDays * DAY;
        const techComplete = researchable.every((tt) => (tech[tt.id] ?? 0) >= tt.maxLevel);
        const gateOk =
          !options.ascensionGate ||
          options.ascensionGate({ n: ascensions + 1, day, xp, techLevels: Object.values(tech).reduce((a, b) => a + b, 0), techComplete, prestigeProjects: projects, lastAscensionDay: ascensionDays.length ? ascensionDays[ascensionDays.length - 1] : null });
        if (cooldownOk && gateOk) {
          if (Object.keys(bQueue).length === 0) {
            for (const b of BUILDINGS) {
              if (keptOnAscension(b)) continue;
              const cur = buildings[b.id];
              buildings[b.id] = { ...(cur ?? { unlocked: !!b.startsUnlocked }), level: 1 };
            }
            const start = defaultResources() as Record<string, number>;
            for (const k of Object.keys(res)) res[k] = start[k] ?? 0;
            if (ascensionDay === null) ascensionDay = round1(t / DAY);
            ascensions++;
            lastAscensionT = t;
            ascensionDays.push(round1(t / DAY));
          } else holdBuilds = true;
        }
      }
      // Chantiers : le moins cher d'abord.
      const slots = buildSlots({ buildings });
      const discount = techBonus(tech, "building_discount");
      const buildFactor = techReductionFactor(tech, "building_time") * ascBuildFactor();
      for (let again = !holdBuilds; again && Object.keys(bQueue).length < slots; ) {
        again = false;
        const cands: { id: string; cost: Cost; unlock?: boolean }[] = [];
        for (const b of BUILDINGS) {
          if (bQueue[b.id]) continue;
          const st = buildings[b.id];
          if (!st) continue;
          if (!st.unlocked) {
            if (b.unlockedByTech) {
              if ((tech[b.unlockedByTech] ?? 0) >= 1) buildings[b.id] = { ...st, unlocked: true };
              continue;
            }
            if (b.requires && effectiveBuildingLevel(buildings, b.requires.building) < b.requires.level) continue;
            if (b.unlockCost) cands.push({ id: b.id, cost: b.unlockCost, unlock: true });
            continue;
          }
          if ((st.level ?? 0) >= levelCap(b, day)) continue;
          cands.push({ id: b.id, cost: applyBuildingDiscount(buildingCost(b, (st.level ?? 0) + 1), discount) });
        }
        cands.sort((a, b) => value(a.cost) - value(b.cost));
        const c = cands.find((x) => afford(x.cost)) ?? cands.find((x) => tryExchange(x.cost)) ?? cands.find((x) => tryCommonExchange(x.cost));
        if (!c) break;
        pay(c.cost);
        again = true;
        launched++;
        if (c.unlock) buildings[c.id] = { ...buildings[c.id], unlocked: true };
        else bQueue[c.id] = t + Math.round(buildingTime(BUILDINGS.find((b) => b.id === c.id)!, (buildings[c.id].level ?? 0) + 1) * buildFactor);
      }
      const buildLeft = !holdBuilds && BUILDINGS.some((b) => !bQueue[b.id] && (buildings[b.id]?.level ?? 0) < levelCap(b, day));
      if (firstWall === null && day >= 1 && buildLeft && slots - Object.keys(bQueue).length >= M.wallFreeSlots) firstWall = round1(t / DAY);
      // Recherches : la moins chère d'abord.
      const researchFactor = techReductionFactor(tech, "research_time");
      for (let again = true; again && Object.keys(rQueue).length < RESEARCH_RULES.maxConcurrent; ) {
        again = false;
        const cands = researchable
          .filter((tt) => !rQueue[tt.id] && (tech[tt.id] ?? 0) < tt.maxLevel && Object.entries(tt.prereq).every(([k, n]) => (tech[k] ?? 0) >= n))
          .map((tt) => {
            const next = (tech[tt.id] ?? 0) + 1;
            const cost = getTechCost(tt, next) as Cost;
            const l = late(next);
            return { tt, cost: l ? (Object.fromEntries(Object.entries(cost).map(([k, n]) => [k, (n ?? 0) * l.costFactor])) as Cost) : cost };
          })
          .sort((a, b) => value(a.cost) - value(b.cost));
        const c = cands.find((x) => afford(x.cost)) ?? cands.find((x) => tryExchange(x.cost)) ?? cands.find((x) => tryCommonExchange(x.cost));
        if (!c) break;
        pay(c.cost);
        again = true;
        launched++;
        const next = (tech[c.tt.id] ?? 0) + 1;
        const l = late(next);
        const raw = techTime(c.tt, next) * (l?.timeFactor ?? 1);
        rQueue[c.tt.id] = t + Math.round(Math.min(l?.maxSeconds ?? Infinity, raw) * researchFactor);
      }
      const researchLeft = researchable.some((tt) => !rQueue[tt.id] && (tech[tt.id] ?? 0) < tt.maxLevel);
      // Puits : projets de prestige (un à la fois), puis vaisseaux dans la place des hangars.
      if (options.prestigeProjects && t >= projectEnd && EXTRACTORS.every((id) => effectiveBuildingLevel(buildings, id) >= (options.prestigeProjects?.minExtractorLevel ?? 0))) {
        const pp = options.prestigeProjects;
        const each = (pp.hours * Math.pow(pp.growth, projects) * commonPerHour()) / COMMONS.length;
        const reserve = pp.reserveShare * cap;
        if (each > 0 && COMMONS.every((k) => res[k] - reserve >= each)) {
          for (const k of COMMONS) res[k] -= each;
          projects++;
          projectEnd = t + pp.durationHours * HOUR;
          sunk++;
        }
      }
      if (options.fleetSink) {
        const capPlaces = rawUnitCapacity(buildings, "attack", tech);
        const density = (u: (typeof UNITS)[number]) => (u.cost.scrap + u.cost.energy) / Math.max(1, u.hangarSpace);
        const unit = UNITS.filter((u) => u.category === "attack" && !u.blueprint && !u.empireClass && !u.elite && unitUnlocked(u.id)).sort((a, b) => density(b) - density(a))[0];
        if (unit) {
          const reserve = options.fleetSink.reserveShare * cap;
          const space = Math.max(1, unit.hangarSpace);
          const n = Math.floor(Math.min((res.scrap - reserve) / Math.max(1, unit.cost.scrap), (res.energy - reserve) / Math.max(1, unit.cost.energy), (capPlaces - fleetPlaces) / space));
          if (n > 0) {
            res.scrap -= n * unit.cost.scrap;
            res.energy -= n * unit.cost.energy;
            fleetValue += n * (unit.cost.scrap + unit.cost.energy);
            fleetPlaces += n * space;
            sunk++;
          }
          if (fleetFullDay === null && capPlaces > 0 && capPlaces - fleetPlaces < space) fleetFullDay = round1(t / DAY);
        }
      }
      if (inOpening) openingLaunched += launched;
      // 6.14.159 : les pas de l'ouverture ne sont pas des sessions (relevés inchangés).
      const window = inOpening ? [0, 0] : day < 7 ? dead.early : day < 30 ? dead.mid : dead.late;
      window[1]++;
      const anyLeft = (Object.keys(bQueue).length < slots && buildLeft) || (Object.keys(rQueue).length < RESEARCH_RULES.maxConcurrent && researchLeft);
      if (launched === 0 && anyLeft) window[0]++;
      const sw = inOpening ? openingWin : win(day);
      sw.sessions++;
      if (launched === 0 && anyLeft) sw.blocked++;
      if (launched === 0) sw.noProgress++;
      if (launched === 0 && sunk === 0) sw.noSpend++;
      sw.days.set(day, (sw.days.get(day) ?? false) || launched > 0);
      sw.spendDays.set(day, (sw.spendDays.get(day) ?? false) || launched + sunk > 0);
    }

    const end = t + step;
    // 6.14.159 (RD-1) : extracteurs au niveau 5 puis 10 (heures depuis l'inscription), relevés de l'ouverture.
    const minExtractor = Math.min(...EXTRACTORS.map((id) => effectiveBuildingLevel(buildings, id)));
    if (reachHours.l5 === null && minExtractor >= 5) reachHours.l5 = Math.round((end / HOUR) * 100) / 100;
    if (reachHours.l10 === null && minExtractor >= 10) reachHours.l10 = Math.round((end / HOUR) * 100) / 100;
    if (openingMarks.has(end))
      opening.push({
        minute: end / 60,
        extractors: EXTRACTORS.map((id) => effectiveBuildingLevel(buildings, id)),
        storageLevel: effectiveBuildingLevel(buildings, "entrepot"),
        launched: openingLaunched,
        stocks: COMMONS.map((k) => Math.round(res[k] ?? 0)),
        swapped: Math.round(swapped),
      });
    if (end % DAY === 0) {
      // « Fini, sans suite » : bâtiments et arbre au maximum, files vides, aucune Ascension possible ce jour-là.
      const canAscendNow = !!options.ascend && ascensions < ASCENSION_RULES.maxAscensions && (lastAscensionT === null || end - lastAscensionT >= ASCENSION_RULES.cooldownDays * DAY);
      const techDone = researchable.every((tt) => (tech[tt.id] ?? 0) >= tt.maxLevel);
      if (allMaxed() && techDone && !Object.keys(bQueue).length && !Object.keys(rQueue).length && !canAscendNow) win(end / DAY - 1).finished++;
    }
    if (ascensionDay === null && BUILDINGS.filter(requiredForAscension).every((b) => (buildings[b.id]?.level ?? 0) >= b.maxLevel)) ascensionDay = round1(end / DAY);
    if (techCompleteDay === null && researchable.every((tt) => (tech[tt.id] ?? 0) >= tt.maxLevel)) techCompleteDay = round1(end / DAY);
    if (end % DAY === 0 && milestones.has(end / DAY)) {
      const lv = (id: string) => effectiveBuildingLevel(buildings, id);
      snapshots.push({
        day: end / DAY,
        extractors: EXTRACTORS.map(lv),
        storageLevel: lv("entrepot"),
        techLevels: Object.values(tech).reduce((a, b) => a + b, 0),
        techCount: Object.keys(tech).length,
        commonPerHour: Math.round(commonPerHour()),
        rarePerHour: Math.round(RARES.reduce((a, k) => a + ((ratesNow() as Record<string, number>)[k] ?? 0), 0) * HOUR),
        storageCap: getStorageCapacity(buildings, tech),
        commonStock: Math.round(COMMONS.reduce((a, k) => a + res[k], 0)),
        rareStock: Math.round(RARES.reduce((a, k) => a + res[k], 0)),
        lostPct: pct(overflow, produced),
        buildingLevels: required.reduce((a, b) => a + (buildings[b.id]?.level ?? 0), 0),
        xp: Math.round(xp),
        rank: getRank(xp).name,
        ascensions,
        fleetValue: Math.round(fleetValue),
        fleetPlaces,
        fleetCapacity: rawUnitCapacity(buildings, "attack", tech),
        prestigeProjects: projects,
      });
    }
  }

  const totalIncome = Object.values(income).reduce((a, b) => a + b, 0);
  return {
    profile: profile.id,
    days,
    ascensionDay,
    techCompleteDay,
    techTotalLevels,
    firstWallDay: firstWall,
    lostPct: pct(overflow, produced),
    deadSessionsPct: { early: pct(dead.early[0], dead.early[1]), mid: pct(dead.mid[0], dead.mid[1]), late: pct(dead.late[0], dead.late[1]) },
    incomeShareFromJ14: Object.fromEntries(Object.entries(income).map(([k, v]) => [k, pct(v, totalIncome)])),
    firstChest,
    exchangedCommon: Math.round(exchanged),
    exchangedRare: Math.round(exchangedRare),
    exchangedRarePeakWeek: Math.round(Math.max(0, ...Array.from(rareByWeek, (n) => n ?? 0))),
    devScoreByDay,
    catchupAvgJ1to30: catchupDays > 0 ? Math.round((catchupSum / catchupDays) * 1000) / 1000 : 0,
    snapshots,
    ascensionDays,
    windows: wins.map((x, i) => ({
      fromDay: i * windowDays,
      toDay: Math.min(days, (i + 1) * windowDays),
      sessions: x.sessions,
      blockedPct: pct(x.blocked, x.sessions),
      noProgressPct: pct(x.noProgress, x.sessions),
      noSpendPct: pct(x.noSpend, x.sessions),
      daysWithoutLaunch: [...x.days.values()].filter((v) => !v).length,
      daysWithoutSpend: [...x.spendDays.values()].filter((v) => !v).length,
      finishedDays: x.finished,
      lostPct: pct(x.overflow, x.produced),
    })),
    xp: Math.round(xp),
    fleetFullDay,
    reachHours,
    opening,
    startRewardsPaid,
  };
}

/** 6.14.85 (RL-2) : option `prestigeProjects` tirée des règles en vigueur (groupe `prestige`) ; null si les projets sont fermés.
 *  `reserveShare` (part de l'entrepôt gardée avant de lancer un projet) est une hypothèse du modèle, pas une règle.
 *  Écarts du modèle : le coût est lu sur la production avec le bonus d'Ascension et réparti à parts égales entre les 4
 *  ressources communes ; le jeu lit la production des extracteurs et technos (`prestigeCost`), ressource par ressource. */
export function prestigeProjectsFromRules(reserveShare = 0.1): NonNullable<ProgressionOptions["prestigeProjects"]> | null {
  if (!PRESTIGE_RULES.enabled) return null;
  return { hours: Number(PRESTIGE_RULES.hoursPerProject) || 0, growth: Number(PRESTIGE_RULES.growth) || 1, durationHours: Number(PRESTIGE_RULES.durationHours) || 0, reserveShare, minExtractorLevel: Number(PRESTIGE_RULES.unlockExtractorLevel) || 0 };
}

/** Les quatre profils du rapport, dans l'ordre. */
export function simulateAllProfiles(options: ProgressionOptions = {}): ProgressionResult[] {
  return (Object.keys(PROGRESSION_PROFILES) as ProgressionProfileId[]).map((id) => simulateProgression(PROGRESSION_PROFILES[id], options));
}

/** 6.14.106 (AE-L3, AE-15) : les quatre profils avec le rattrapage. Premier passage sans rattrapage : la médiane du
 *  développement des quatre profils, jour par jour, tient lieu de population ; second passage avec le rattrapage des règles.
 *  Écarts du modèle : quatre profils au lieu des joueurs actifs du serveur (`minPlayers` ignoré), médiane figée au premier
 *  passage (elle ne bouge pas avec les bonus). */
export function simulateAllProfilesWithCatchup(options: ProgressionOptions = {}): { medianByDay: number[]; results: ProgressionResult[] } {
  const first = simulateAllProfiles({ ...options, catchupMedianByDay: undefined });
  const days = Math.max(0, ...first.map((r) => r.devScoreByDay.length));
  const medianByDay = Array.from({ length: days }, (_, d) => {
    const v = first.map((r) => r.devScoreByDay[d] ?? r.devScoreByDay[r.devScoreByDay.length - 1] ?? 0).sort((a, b) => a - b);
    const mid = Math.floor(v.length / 2);
    return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  });
  return { medianByDay, results: simulateAllProfiles({ ...options, catchupMedianByDay: medianByDay }) };
}

/** Variante d'étude (lot AE-L2) : coûts du second palier des bâtiments multipliés en mémoire. Rend la fonction qui restaure. */
export function scaleTier2Costs(factor: number): () => void {
  const saved = BUILDINGS.map((b) => (b.upgrade.tier2 ? structuredClone(b.upgrade.tier2) : null));
  for (const b of BUILDINGS) {
    const t2 = b.upgrade.tier2;
    if (!t2) continue;
    for (const cost of [t2.baseCost, t2.maxCost] as Record<string, number | undefined>[]) for (const k of Object.keys(cost)) cost[k] = (cost[k] ?? 0) * factor;
  }
  return () =>
    BUILDINGS.forEach((b, i) => {
      const s = saved[i];
      if (s) b.upgrade.tier2 = s;
    });
}
