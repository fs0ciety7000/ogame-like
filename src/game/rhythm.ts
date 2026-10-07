import { requiredForAscension, type BuildingDef } from "@/game/buildings";
import type { GameContent } from "@/game/content";

/* =====================================================
   6.14.88 (RL-3, proposals/rythme-long-terme.md §5) : bascule du rythme.

   Les valeurs du rythme « sur des mois » entrent en vigueur à une date
   réglable (`rhythm.switchAt`, défaut : 1er novembre 2026 à 0 h, heure de
   Paris), pas avant. Avant la date, le jeu garde exactement les valeurs
   d'avant (test : rythme.test.ts).

   Mécanisme : fonction pure appliquée à la résolution du contenu
   (`resolveGameContent(overrides, nowMs)`). À partir de la date, chaque
   réglage qui vaut encore son **ancienne valeur par défaut** prend la valeur
   de la bascule ; un réglage modifié par l'admin est toujours gardé. Rien
   n'est écrit en base : décaler la date ou décocher `enabled` rend les
   anciennes valeurs aussitôt. Le serveur résout le contenu à chaque requête
   avec l'heure du moment ; le client le réapplique à la date.

   Les valeurs visées sont elles-mêmes des réglages (groupe `rhythm`) : pour
   garder 7 jours de délai après la bascule, régler `ascensionCooldownDays`
   à 7 ici.

   6.14.89 (RL-5 avancé, docs/changes/6.14.89-reglage-fin-rythme.md) : valeurs
   visées réglées avant la date (second palier 36 h + 27 h, recherche tardive
   dès le niveau 7, ×25) pour tenir les cibles d'I29 à 365 jours, mois qui suit
   la 1re Ascension compris. Avant la date, rien ne change.

   Comptes existants : rien n'est retiré (niveaux, technos, Ascensions
   faites). Un chantier ou une recherche lancé garde sa fin (la durée est
   écrite au lancement) ; seuls les niveaux lancés après la date coûtent ou
   durent plus.
===================================================== */

/** 1er novembre 2026, 0 h à Paris (UTC+1 en hiver). */
const NOVEMBER_1_2026_PARIS = 1_793_487_600_000;

export const RHYTHM_RULES = {
  /** Décoché : la bascule n'a pas lieu (ou est annulée), anciennes valeurs partout. */
  enabled: true,
  /** Date de la bascule (ms depuis 1970, UTC). */
  switchAt: NOVEMBER_1_2026_PARIS,
  /** L'annonce en jeu paraît ce nombre de jours avant la date. */
  announceDays: 7,
  /** Coûts du second palier (niveaux 11 à 20) de chaque bâtiment qui en a un, multipliés (AE-L2, Q97). */
  tier2CostFactor: 4,
  /** Durée du niveau 11 des 8 bâtiments exigés par l'Ascension (s). 6.14.89 (RL-5) : 36 h (30 h validées en RL-3). */
  tier2BaseSeconds: 129_600,
  /** Durée ajoutée par niveau au-delà du 11 (s) : niveau 20 = 279 h. 6.14.89 : 27 h (24 h en RL-3). */
  tier2SecondsPerLevel: 97_200,
  /** Recherche tardive : dès ce niveau… 6.14.89 : 7 (6 en RL-3 : une session sans action sur 56 la première semaine de l'actif). */
  researchLateFromLevel: 7,
  /** …durée multipliée par… 6.14.89 : ×25 (×30 en RL-3 : la fin de l'arbre tombait après la 1re Ascension). */
  researchLateTimeFactor: 25,
  /** …et plafonnée à (s, avant réductions) : 7 jours. */
  researchMaxLevelSeconds: 604_800,
  /** Délai entre deux Ascensions (jours). */
  ascensionCooldownDays: 30,
  /** Nombre maximal d'Ascensions. */
  maxAscensions: 10,
  /** Comptoir : rares obtenues par ressource commune (0,004 = 1 pour 250, Q98). */
  exchangeCommonToRare: 0.004,
  /** Missions : ressources communes = multiplicateur × durée × production. */
  missionProductionMultiplier: 0.75,
  /** Missions : production de référence de l'échelle des rares. */
  missionRareProductionRef: 400_000,
  /** Lune (AE-9) : coût du niveau 2… */
  moonUpgradeCost: { scrap: 20_000_000, energy: 10_000_000 } as Record<string, number>,
  /** …×costGrowth à chaque niveau suivant. */
  moonCostGrowth: 3,
  /** Lune : débris pour 1 % de chance. */
  moonDebrisPerPercent: 2_000_000,
};

export type RhythmRules = typeof RHYTHM_RULES;

/** Anciennes valeurs par défaut (avant 6.14.88) : seule une valeur égale est remplacée à la bascule. Référence de migration,
 *  pas un réglage (comme le `from` de CONTENT_MIGRATIONS). */
export const RHYTHM_PREVIOUS = {
  tier2BaseSeconds: 10_800,
  tier2SecondsPerLevel: 3_600,
  researchLateFromLevel: 0,
  researchLateTimeFactor: 1,
  researchMaxLevelSeconds: 0,
  ascensionCooldownDays: 7,
  maxAscensions: 5,
  exchangeCommonToRare: 0.01,
  missionProductionMultiplier: 1.5,
  missionRareProductionRef: 150_000,
  moonUpgradeCost: { scrap: 500_000, energy: 250_000 } as Record<string, number>,
  moonCostGrowth: 2,
  moonDebrisPerPercent: 100_000,
};

const DAY_MS = 86_400_000;

/** Réglages de la bascule lus dans un contenu (valeurs absentes ou invalides : défauts). */
export function rhythmRulesOf(rules: unknown): RhythmRules {
  const raw = (rules && typeof rules === "object" ? (rules as Record<string, unknown>).rhythm : null) as Partial<RhythmRules> | null;
  const out: RhythmRules = { ...RHYTHM_RULES, moonUpgradeCost: { ...RHYTHM_RULES.moonUpgradeCost } };
  if (!raw || typeof raw !== "object") return out;
  for (const k of Object.keys(RHYTHM_RULES) as (keyof RhythmRules)[]) {
    const v = raw[k];
    if (k === "enabled") out.enabled = v !== false;
    else if (k === "moonUpgradeCost") {
      if (v && typeof v === "object" && !Array.isArray(v)) out.moonUpgradeCost = { ...(v as Record<string, number>) };
    } else if (typeof v === "number" && Number.isFinite(v) && v >= 0) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** La bascule est-elle faite à cet instant ? */
export function rhythmSwitched(rules: Pick<RhythmRules, "enabled" | "switchAt">, nowMs: number): boolean {
  return rules.enabled !== false && Number.isFinite(rules.switchAt) && rules.switchAt > 0 && nowMs >= rules.switchAt;
}

/** État affiché (Formules, admin, annonce) : « à venir » dès `announceDays` jours avant la date. */
export function rhythmPhase(rules: Pick<RhythmRules, "enabled" | "switchAt" | "announceDays">, nowMs: number): "off" | "later" | "announced" | "switched" {
  if (rules.enabled === false || !(rules.switchAt > 0)) return "off";
  if (nowMs >= rules.switchAt) return "switched";
  return nowMs >= rules.switchAt - Math.max(0, rules.announceDays) * DAY_MS ? "announced" : "later";
}

/** Date d'ouverture de l'annonce de la bascule (ms). */
export function rhythmAnnounceAt(rules: Pick<RhythmRules, "switchAt" | "announceDays"> = RHYTHM_RULES): number {
  return rules.switchAt - Math.max(0, rules.announceDays) * DAY_MS;
}

const canon = (v: unknown): string => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return JSON.stringify(v);
  const o = v as Record<string, unknown>;
  return JSON.stringify(Object.fromEntries(Object.keys(o).filter((k) => o[k] !== undefined && o[k] !== 0).sort().map((k) => [k, o[k]])));
};

const scaleCost = (cost: Record<string, number | undefined>, f: number) => Object.fromEntries(Object.entries(cost).map(([k, n]) => [k, Math.round((n ?? 0) * f)]));

/** Bâtiment après la bascule : coûts du second palier × facteur s'ils valent encore ceux du code, durées des bâtiments exigés
 *  par l'Ascension remplacées si elles valent encore les anciennes (la Cale sèche garde ses durées, §5.1). */
function switchBuilding(b: BuildingDef, def: BuildingDef | undefined, r: RhythmRules): BuildingDef {
  const t2 = b.upgrade?.tier2;
  if (!t2) return b;
  const next = { ...t2 };
  const dt2 = def?.upgrade?.tier2;
  if (dt2 && r.tier2CostFactor > 0 && r.tier2CostFactor !== 1 && canon(t2.baseCost) === canon(dt2.baseCost) && canon(t2.maxCost) === canon(dt2.maxCost)) {
    next.baseCost = scaleCost(t2.baseCost, r.tier2CostFactor);
    next.maxCost = scaleCost(t2.maxCost, r.tier2CostFactor);
  }
  if (requiredForAscension(b)) {
    if (t2.baseSeconds === RHYTHM_PREVIOUS.tier2BaseSeconds && r.tier2BaseSeconds > 0) next.baseSeconds = r.tier2BaseSeconds;
    if (t2.secondsPerLevel === RHYTHM_PREVIOUS.tier2SecondsPerLevel) next.secondsPerLevel = r.tier2SecondsPerLevel;
  }
  return { ...b, upgrade: { ...b.upgrade, tier2: next } };
}

/**
 * Contenu en vigueur à `nowMs` : avant la bascule (ou bascule coupée), le contenu tel quel ; après, chaque réglage resté à
 * son ancienne valeur par défaut prend la valeur du groupe `rhythm`. Pur : ne modifie pas `content`.
 * `defaultBuildings` : bâtiments du code (référence des coûts du second palier).
 */
export function applyRhythmSwitch(content: GameContent, defaultBuildings: BuildingDef[], nowMs: number): GameContent {
  const r = rhythmRulesOf(content.rules);
  if (!rhythmSwitched(r, nowMs)) return content;
  const P = RHYTHM_PREVIOUS;
  const rules = content.rules as unknown as Record<string, Record<string, unknown>>;
  const group = (k: string) => ({ ...(rules[k] ?? {}) });
  const research = group("research");
  if (research.lateFromLevel === P.researchLateFromLevel) research.lateFromLevel = r.researchLateFromLevel;
  if (research.lateTimeFactor === P.researchLateTimeFactor) research.lateTimeFactor = r.researchLateTimeFactor;
  if (research.maxLevelSeconds === P.researchMaxLevelSeconds) research.maxLevelSeconds = r.researchMaxLevelSeconds;
  const ascension = group("ascension");
  if (ascension.cooldownDays === P.ascensionCooldownDays) ascension.cooldownDays = r.ascensionCooldownDays;
  // Le maximum ne baisse jamais à la bascule : personne ne perd une Ascension faite (comptes existants).
  if (ascension.maxAscensions === P.maxAscensions) ascension.maxAscensions = Math.max(P.maxAscensions, Math.floor(r.maxAscensions));
  const exchange = group("exchange");
  if (exchange.commonToRare === P.exchangeCommonToRare) exchange.commonToRare = r.exchangeCommonToRare;
  const economy = group("economy");
  if (economy.missionProductionMultiplier === P.missionProductionMultiplier) economy.missionProductionMultiplier = r.missionProductionMultiplier;
  if (economy.missionRareProductionRef === P.missionRareProductionRef) economy.missionRareProductionRef = r.missionRareProductionRef;
  const moon = group("moon");
  if (canon(moon.upgradeCost) === canon(P.moonUpgradeCost)) moon.upgradeCost = { ...r.moonUpgradeCost };
  if (moon.costGrowth === P.moonCostGrowth) moon.costGrowth = r.moonCostGrowth;
  if (moon.debrisPerPercent === P.moonDebrisPerPercent) moon.debrisPerPercent = r.moonDebrisPerPercent;
  const byId = new Map(defaultBuildings.map((b) => [b.id, b]));
  return {
    ...content,
    buildings: content.buildings.map((b) => switchBuilding(b, byId.get(b.id), r)),
    rules: { ...content.rules, research, ascension, exchange, economy, moon } as GameContent["rules"],
  };
}
