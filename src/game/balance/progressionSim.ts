import { applyBuildingDiscount, BUILDINGS, defaultBuildings, effectiveBuildingLevel, getBuildingUpgradeCost, getBuildingUpgradeTime, getStorageCapacity, requiredForAscension } from "@/game/buildings";
import { buildSlots } from "@/game/buildPlan";
import { CONTRACT_RULES } from "@/game/contracts";
import { defaultResources } from "@/game/defaults";
import { missionRewards, rareRewardScale } from "@/game/economy";
import { EXPEDITION_RULES } from "@/game/expeditions";
import { MISSIONS } from "@/game/missions";
import { ONBOARDING_STEPS } from "@/game/onboarding";
import { getProductionRatesPerSecond } from "@/game/production";
import { EXCHANGE_RULES } from "@/game/resources";
import { STREAK_RULES } from "@/game/streak";
import { getTechCost, getTechTime, RESEARCH_RULES, techBonus, techReductionFactor, TECHNOLOGIES } from "@/game/technologies";
import { UNITS } from "@/game/units";
import { RARE_VALUE } from "@/game/balance/analysis";
import type { Buildings, TechLevels } from "@/types/game";

/* =====================================================
   6.14.71 (AU27, lot AE-L0) : simulateur de progression.

   Moteur pur (ni DOM, ni réseau, ni hasard) : un joueur glouton par profil, sur
   90 jours, au pas de 10 min. À chaque session, il réclame la série et les
   objectifs du jour, relance les missions débloquées, fait ses expéditions
   (valeur moyenne), remplit ses chantiers (le moins cher d'abord) et ses
   recherches (la moins chère d'abord, rares comptées `RARE_VALUE`). Il passe par le
   comptoir quand seules les rares manquent. La prise en main est versée à J0.

   Production, entrepôt, coûts, durées, échelle des rares, récompenses des
   missions, série, coffre du 7e jour et comptoir sont lus dans les règles en
   vigueur (`applyGameContent` les règle) : un réglage se mesure avant d'être
   appliqué (`node scripts/progression-sim.mjs`, docs/proposals/equilibrage-au27.md).

   Hors modèle (tout accélère le vrai jeu) : achats d'unités, combats, pillage,
   événements, reliques, officiers, talents, alliance, classes, primes.
   Les résultats sont des ordres de grandeur, pas des dates exactes.
===================================================== */

const COMMONS = ["scrap", "energy", "nano", "data"] as const;
const RARES = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"] as const;
const HOUR = 3600;
const DAY = 86_400;

/** Hypothèses du modèle (pas des règles du jeu : elles ne vont pas dans l'admin). */
export const PROGRESSION_SIM_MODEL = {
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
  storageCap: number;
  commonStock: number;
  rareStock: number;
  /** Production commune perdue (entrepôt plein), cumul depuis J0, en %. */
  lostPct: number;
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
  snapshots: ProgressionSnapshot[];
}

type Cost = Record<string, number | undefined>;

/** Récompenses de la prise en main réunies (versées à J0). */
export function onboardingTotal(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of ONBOARDING_STEPS) for (const [k, n] of Object.entries(s.reward)) out[k] = (out[k] ?? 0) + (n ?? 0);
  return out;
}

const isRare = (k: string) => (RARES as readonly string[]).includes(k);
const value = (c: Cost) => Object.entries(c).reduce((a, [k, n]) => a + (n ?? 0) * (isRare(k) ? RARE_VALUE : 1), 0);
const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

/** Simule un profil sur `days` jours avec les règles en vigueur. Déterministe. */
export function simulateProgression(profile: ProgressionProfile, options: ProgressionOptions = {}): ProgressionResult {
  const days = options.days ?? 90;
  const step = options.stepSeconds ?? 600;
  const useExchange = options.useExchange !== false;
  const milestones = new Set(options.milestones ?? [1, 3, 7, 14, 30, 60, 90]);
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
  let objStreak = 0;
  let objDays = 0;
  let expToday = 0;
  let overflow = 0;
  let produced = 0;
  let exchanged = 0;
  let firstWall: number | null = null;
  let ascensionDay: number | null = null;
  let techCompleteDay: number | null = null;
  let firstChest: ProgressionChest | null = null;
  const dead = { early: [0, 0], mid: [0, 0], late: [0, 0] };
  const income: Record<string, number> = {};
  const snapshots: ProgressionSnapshot[] = [];

  const commonPerHour = () => {
    const r = getProductionRatesPerSecond(buildings, tech);
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
    let commonsNeeded = Object.values(need).reduce((a, b) => a + b, 0) / (EXCHANGE_RULES.commonToRare * (1 - EXCHANGE_RULES.taxPct));
    const spare = (k: string) => Math.max(0, res[k] - (c[k] ?? 0));
    if (COMMONS.reduce((a, k) => a + spare(k), 0) < commonsNeeded) return false;
    for (const k of COMMONS) {
      const take = Math.min(spare(k), commonsNeeded);
      res[k] -= take;
      commonsNeeded -= take;
      exchanged += take;
    }
    for (const [k, n] of Object.entries(need)) res[k] += n;
    return true;
  };

  for (let t = 0; t < days * DAY; t += step) {
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
      delete rw.xp;
      add(rw, "missions", t);
      delete mQueue[key];
    }

    // Production (communes plafonnées par l'entrepôt, rares sans plafond).
    const rates = getProductionRatesPerSecond(buildings, tech);
    const cap = getStorageCapacity(buildings, tech);
    for (const [k, rate] of Object.entries(rates)) {
      const g = (rate ?? 0) * step;
      if (isRare(k)) {
        add({ [k]: g }, "production", t);
        continue;
      }
      produced += g;
      if (t >= 14 * DAY) income.production = (income.production ?? 0) + g;
      const kept = Math.min(Math.max(0, cap - (res[k] ?? 0)), g);
      overflow += g - kept;
      res[k] += kept;
    }

    const day = Math.floor(t / DAY);
    const sec = t % DAY;
    if (sec === 0) expToday = 0;
    const skipped = profile.skipEvery > 0 && day % profile.skipEvery === profile.skipEvery - 1;
    if (!skipped && profile.sessionHours.some((h) => h * HOUR === sec)) {
      let launched = 0;
      // Série de connexion, coffre du 7e jour et objectifs du jour (première session du jour).
      if (lastStreakDay !== day) {
        streak = lastStreakDay === day - 1 ? streak + 1 : 1;
        lastStreakDay = day;
        const cycleDay = ((streak - 1) % 7) + 1;
        const r = getProductionRatesPerSecond(buildings, tech);
        const hours = STREAK_RULES.hours[cycleDay - 1] ?? 0;
        for (const k of COMMONS) add({ [k]: Math.max(STREAK_RULES.floor, (r[k] ?? 0) * hours * HOUR) }, "série", t);
        if (cycleDay === 7) {
          const each = (STREAK_RULES.chest.common[0] + STREAK_RULES.chest.common[1]) / 2;
          const perHour = commonPerHour();
          for (const k of COMMONS) add({ [k]: each }, "coffre du 7e jour", t);
          if (!firstChest) {
            const stock = Math.max(...COMMONS.map((k) => res[k]));
            firstChest = { day: round1(t / DAY), common: each * COMMONS.length, hoursOfProduction: perHour > 0 ? round1((each * COMMONS.length) / perHour) : 0, storageCap: getStorageCapacity(buildings, tech), maxStockAfter: Math.round(stock) };
          }
        }
        const scale = rareRewardScale(player());
        const mult = (1 + Math.min(CONTRACT_RULES.streakBonusMax, objStreak * CONTRACT_RULES.streakBonusPerDay)) * scale;
        for (let i = 0; i < profile.objectives; i++) add({ [RARES[(i + day) % RARES.length]]: CONTRACT_RULES.rarePerContract * mult }, "objectifs", t);
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
        const ph = commonPerHour();
        for (const k of COMMONS) add({ [k]: (M.expeditionDepositShare * M.expeditionDepositHours * ph) / COMMONS.length }, "expéditions", t);
        for (const k of RARES) add({ [k]: (M.expeditionRareShare * M.expeditionRareHours * ph) / EXPEDITION_RULES.rareRate / RARES.length }, "expéditions", t);
      }
      // Chantiers : le moins cher d'abord.
      const slots = buildSlots({ buildings });
      const discount = techBonus(tech, "building_discount");
      const buildFactor = techReductionFactor(tech, "building_time");
      for (let again = true; again && Object.keys(bQueue).length < slots; ) {
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
          if ((st.level ?? 0) >= b.maxLevel) continue;
          cands.push({ id: b.id, cost: applyBuildingDiscount(getBuildingUpgradeCost(b, (st.level ?? 0) + 1), discount) });
        }
        cands.sort((a, b) => value(a.cost) - value(b.cost));
        const c = cands.find((x) => afford(x.cost)) ?? cands.find((x) => tryExchange(x.cost));
        if (!c) break;
        pay(c.cost);
        again = true;
        launched++;
        if (c.unlock) buildings[c.id] = { ...buildings[c.id], unlocked: true };
        else bQueue[c.id] = t + Math.round(getBuildingUpgradeTime(BUILDINGS.find((b) => b.id === c.id)!, (buildings[c.id].level ?? 0) + 1) * buildFactor);
      }
      const buildLeft = BUILDINGS.some((b) => !bQueue[b.id] && (buildings[b.id]?.level ?? 0) < b.maxLevel);
      if (firstWall === null && day >= 1 && buildLeft && slots - Object.keys(bQueue).length >= M.wallFreeSlots) firstWall = round1(t / DAY);
      // Recherches : la moins chère d'abord.
      const researchFactor = techReductionFactor(tech, "research_time");
      for (let again = true; again && Object.keys(rQueue).length < RESEARCH_RULES.maxConcurrent; ) {
        again = false;
        const cands = researchable
          .filter((tt) => !rQueue[tt.id] && (tech[tt.id] ?? 0) < tt.maxLevel && Object.entries(tt.prereq).every(([k, n]) => (tech[k] ?? 0) >= n))
          .map((tt) => ({ tt, cost: getTechCost(tt, (tech[tt.id] ?? 0) + 1) as Cost }))
          .sort((a, b) => value(a.cost) - value(b.cost));
        const c = cands.find((x) => afford(x.cost)) ?? cands.find((x) => tryExchange(x.cost));
        if (!c) break;
        pay(c.cost);
        again = true;
        launched++;
        rQueue[c.tt.id] = t + Math.round(getTechTime(c.tt, (tech[c.tt.id] ?? 0) + 1) * researchFactor);
      }
      const researchLeft = researchable.some((tt) => !rQueue[tt.id] && (tech[tt.id] ?? 0) < tt.maxLevel);
      const window = day < 7 ? dead.early : day < 30 ? dead.mid : dead.late;
      window[1]++;
      const anyLeft = (Object.keys(bQueue).length < slots && buildLeft) || (Object.keys(rQueue).length < RESEARCH_RULES.maxConcurrent && researchLeft);
      if (launched === 0 && anyLeft) window[0]++;
    }

    const end = t + step;
    if (ascensionDay === null && BUILDINGS.filter(requiredForAscension).every((b) => (buildings[b.id]?.level ?? 0) >= b.maxLevel)) ascensionDay = round1(end / DAY);
    if (techCompleteDay === null && researchable.every((tt) => (tech[tt.id] ?? 0) >= tt.maxLevel)) techCompleteDay = round1(end / DAY);
    if (end % DAY === 0 && milestones.has(end / DAY)) {
      const lv = (id: string) => effectiveBuildingLevel(buildings, id);
      snapshots.push({
        day: end / DAY,
        extractors: ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"].map(lv),
        storageLevel: lv("entrepot"),
        techLevels: Object.values(tech).reduce((a, b) => a + b, 0),
        techCount: Object.keys(tech).length,
        commonPerHour: Math.round(commonPerHour()),
        storageCap: getStorageCapacity(buildings, tech),
        commonStock: Math.round(COMMONS.reduce((a, k) => a + res[k], 0)),
        rareStock: Math.round(RARES.reduce((a, k) => a + res[k], 0)),
        lostPct: pct(overflow, produced),
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
    snapshots,
  };
}

/** Les quatre profils du rapport, dans l'ordre. */
export function simulateAllProfiles(options: ProgressionOptions = {}): ProgressionResult[] {
  return (Object.keys(PROGRESSION_PROFILES) as ProgressionProfileId[]).map((id) => simulateProgression(PROGRESSION_PROFILES[id], options));
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

/** Jour de 1re Ascension et autres repères, sous une forme courte (script, fiches). */
export function progressionSummary(r: ProgressionResult): string {
  const d = (x: number | null) => (x === null ? `> J${r.days}` : `J${x}`);
  const missions = r.incomeShareFromJ14.missions ?? 0;
  return `${r.profile} : Ascension ${d(r.ascensionDay)}, arbre complet ${d(r.techCompleteDay)}, production perdue ${r.lostPct} %, missions ${missions} % des gains (J14+), coffre ${r.firstChest ? `${r.firstChest.hoursOfProduction} h de production (J${r.firstChest.day})` : "jamais"}`;
}
