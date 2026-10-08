import { RESOURCE_LIST } from "@/game/resources";
import type { BuildingId, Buildings, ResourceId, TechLevels } from "@/types/game";
import { techBonus } from "@/game/technologies";

/* =====================================================
   Bâtiments — définis par des données (voir src/game/content.ts) :
   les valeurs ci-dessous sont celles par défaut, remplaçables depuis
   l'interface d'administration sans toucher au code.
===================================================== */

export type ResourceMap = Partial<Record<ResourceId, number>>;

export type BuildingEffect =
  /** Répare perLevel × niveau des unités perdues en combat (plafonné à max).
   *  À partir de bonusFromLevel, chaque niveau n'ajoute plus que bonusPerLevel. */
  | { type: "repair"; perLevel: number; max: number; bonusFromLevel?: number; bonusPerLevel?: number }
  /** Capacité du hangar (places) = perLevel × niveau. */
  | { type: "hangar"; category: "attack" | "defense"; perLevel: number }
  /** Entrepôt : capacité par ressource commune = base × growth^niveau. */
  | { type: "storage"; base: number; growth: number }
  /** v3.6 : bouclier planétaire supplémentaire (perLevel × niveau, plafonné à max), au-delà du plafond des hangars. */
  | { type: "shield"; perLevel: number; max: number }
  /** 5.28 : Cale sèche : postes pour les vaisseaux en réparation (places = perLevel × niveau), hors hangar. */
  | { type: "dock"; perLevel: number; orbitalRepair?: number };

/** Second palier de coûts (niveaux ≥ fromLevel) : progression géométrique
 *  séparée, pour ne pas modifier les niveaux déjà atteints par les joueurs. */
export interface UpgradeTier {
  fromLevel: number;
  baseCost: ResourceMap;
  maxCost: ResourceMap;
  /** Durée du niveau fromLevel, puis + secondsPerLevel par niveau. */
  baseSeconds: number;
  secondsPerLevel: number;
}

/** Paliers visuels (image et cadre) : niveaux 5, 10, 15 et 20. */
export const VISUAL_TIERS = [5, 10, 15, 20] as const;
export type VisualTier = (typeof VISUAL_TIERS)[number];

export interface BuildingDef {
  id: BuildingId;
  /** 6.14.122 (AP-L8) : date d'ajout (AAAA-MM-JJ) : un contenu récent prend l'épisode « nouveauté » du chapitre suivant. */
  addedOn?: string;
  name: string;
  description: string;
  image: string;
  maxLevel: number;
  /** Débloqué dès l'inscription. */
  startsUnlocked?: boolean;
  /** v3.6 : bâtiment de fin de partie (hors condition d'Ascension, conservé à l'Ascension). */
  endgame?: boolean;
  /** Coût de déblocage (bouton « Débloquer »). */
  unlockCost?: ResourceMap;
  /** Débloqué par une technologie (effet « unlock_buildings ») plutôt que par un coût. */
  unlockedByTech?: string;
  /** 5.28 : bâtiment requis (débloqué, à ce niveau au moins) avant de pouvoir débloquer celui-ci. */
  requires?: { building: BuildingId; level: number };
  /** Coût d'amélioration : progression géométrique de baseCost (au niveau
   *  costFromLevel) jusqu'à maxCost (au niveau max). */
  upgrade: { baseCost: ResourceMap; maxCost: ResourceMap; costFromLevel: number; secondsPerLevel: number; tier2?: UpgradeTier };
  /** Image propre à un palier visuel (sinon `image`). */
  tierImages?: Partial<Record<VisualTier, string>>;
  /** Production par seconde, indexée par niveau (niveau 1 = premier élément). */
  production?: { resource: ResourceId; perSecond: number[] };
  effect?: BuildingEffect;
}

/** 5.28 : identifiant de la Cale sèche. */
export const DOCK_BUILDING_ID = "cale_seche";
/** 5.28 : paliers de la Cale sèche (docs/WORKFLOW.md §4.2) : Triage, remise en service
 *  automatique, priorités, Cale orbitale (+orbitalRepair de vaisseaux sauvés). */
export const DOCK_TIERS = { triage: 5, auto: 10, priority: 15, orbital: 20 } as const;

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const DOCK_TIERS_META = {
  triage: { label: "Cale sèche : niveau du triage", unit: "niveau", min: 1, max: 50, hint: "Démantèlement en cale et réglage par défaut après un combat." },
  auto: { label: "Cale sèche : niveau de la remise automatique", unit: "niveau", min: 1, max: 50 },
  priority: { label: "Cale sèche : niveau des priorités de réparation", unit: "niveau", min: 1, max: 50 },
  orbital: { label: "Cale sèche : niveau de la cale orbitale", unit: "niveau", min: 1, max: 50 },
};

// Niveaux 1 à 10 inchangés, puis +25 % par niveau jusqu'au niveau 20.
// v3.6 : production des bâtiments de fin de partie (ressource rare, par seconde).
const ENDGAME_PRODUCTION = [1, 1, 2, 2, 3, 4, 5, 6, 8, 10];
const PRODUCTION_TABLE = [2, 4, 7, 13, 23, 42, 75, 135, 259, 500, 625, 781, 977, 1221, 1526, 1907, 2384, 2980, 3725, 4657];

/** Niveaux 11 à 20 : 3 h puis +1 h par niveau (12 h au niveau 20). */
function tier2(common: ResourceMap, commonMax: ResourceMap, rare: ResourceMap, rareMax: ResourceMap): UpgradeTier {
  return {
    fromLevel: 11,
    baseCost: { ...common, ...rare },
    maxCost: { ...commonMax, ...rareMax },
    baseSeconds: 3 * 3600,
    secondsPerLevel: 3600,
  };
}

const extractorUpgrade = (rare: ResourceId) => ({
  baseCost: { scrap: 50, energy: 20 },
  maxCost: { scrap: 2_500_000, energy: 1_800_000 },
  costFromLevel: 1,
  secondsPerLevel: 600,
  tier2: tier2({ scrap: 5_000_000, energy: 3_000_000 }, { scrap: 500_000_000, energy: 300_000_000 }, { [rare]: 20_000 }, { [rare]: 2_000_000 }),
});
const hangarUpgrade = (rares: [ResourceId, ResourceId]) => ({
  baseCost: { scrap: 300, energy: 150 },
  maxCost: { scrap: 5_000_000, energy: 7_500_000 },
  costFromLevel: 1,
  secondsPerLevel: 900,
  tier2: tier2(
    { scrap: 8_000_000, energy: 8_000_000 },
    { scrap: 700_000_000, energy: 700_000_000 },
    { [rares[0]]: 15_000, [rares[1]]: 15_000 },
    { [rares[0]]: 1_500_000, [rares[1]]: 1_500_000 },
  ),
});

export const DEFAULT_BUILDINGS: BuildingDef[] = [
  {
    id: "extracteur_ferraille",
    name: "Extracteur de ferraille",
    description: "Récupère automatiquement de la ferraille dans les débris environnants.",
    image: "/assets/buildings/extracteur_ferraille.webp",
    maxLevel: 20,
    startsUnlocked: true,
    upgrade: extractorUpgrade("reinforcedSteel"),
    production: { resource: "scrap", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "reacteur_instable",
    name: "Réacteur instable",
    description: "Génère de l'énergie brute, au prix d'une certaine instabilité.",
    image: "/assets/buildings/reacteur_instable.webp",
    maxLevel: 20,
    unlockCost: { scrap: 500 },
    upgrade: extractorUpgrade("cyberModule"),
    production: { resource: "energy", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "extracteur_nanocomposants",
    name: "Extracteur de nanocomposants",
    description: "Synthétise des nanocomposants à partir de matières recyclées.",
    image: "/assets/buildings/extracteur_nanocomposants.webp",
    maxLevel: 20,
    unlockCost: { energy: 500 },
    upgrade: extractorUpgrade("syntheticNanites"),
    production: { resource: "nano", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "archives_fracturees",
    name: "Archives fracturées",
    description: "Fouille des données anciennes dans des serveurs endommagés.",
    image: "/assets/buildings/archives_fracturees.webp",
    maxLevel: 20,
    unlockCost: { nano: 500 },
    upgrade: extractorUpgrade("aiFragment"),
    production: { resource: "data", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "atelier_reparation",
    name: "Atelier de réparation",
    description: "Répare une partie des unités perdues après chaque combat.",
    image: "/assets/buildings/atelier_reparation.webp",
    maxLevel: 20,
    unlockCost: { reinforcedSteel: 20, cyberModule: 20, syntheticNanites: 20, aiFragment: 20 },
    upgrade: {
      baseCost: { nano: 1000, data: 1000 },
      maxCost: { nano: 10_000_000, data: 9_500_000 },
      costFromLevel: 2,
      secondsPerLevel: 1200,
      tier2: tier2(
        { nano: 10_000_000, data: 10_000_000 },
        { nano: 800_000_000, data: 800_000_000 },
        { reinforcedSteel: 10_000, cyberModule: 10_000, syntheticNanites: 10_000, aiFragment: 10_000 },
        { reinforcedSteel: 1_000_000, cyberModule: 1_000_000, syntheticNanites: 1_000_000, aiFragment: 1_000_000 },
      ),
    },
    // 5 % par niveau jusqu'au niveau 10 (50 %), puis 2 % par niveau (70 % au niveau 20).
    effect: { type: "repair", perLevel: 0.05, max: 0.7, bonusFromLevel: 11, bonusPerLevel: 0.02 },
  },
  {
    id: "hangar_attaque",
    name: "Hangar d'attaque",
    description: "Augmente la capacité de stockage des unités offensives.",
    image: "/assets/buildings/hangar_attaque.webp",
    maxLevel: 20,
    unlockedByTech: "tech6",
    upgrade: hangarUpgrade(["reinforcedSteel", "cyberModule"]),
    effect: { type: "hangar", category: "attack", perLevel: 2000 },
  },
  {
    id: "hangar_defense",
    name: "Hangar de défense",
    description: "Augmente la capacité de stockage des unités défensives.",
    image: "/assets/buildings/hangar_defense.webp",
    maxLevel: 20,
    unlockedByTech: "tech6",
    upgrade: hangarUpgrade(["syntheticNanites", "aiFragment"]),
    effect: { type: "hangar", category: "defense", perLevel: 2000 },
  },
  // 5.28 : Cale sèche (docs/proposals/cale-seche.md) : les vaisseaux sauvés attendent leur réparation
  // sur des postes, hors du hangar. Courbe de coût de l'Atelier, 1 200 s par niveau.
  {
    id: DOCK_BUILDING_ID,
    name: "Cale sèche",
    description: "Des postes d'amarrage pour les vaisseaux sauvés au combat : ils attendent leur réparation ici, et le hangar reste libre pour reconstruire.",
    image: "/assets/buildings/cale_seche.webp",
    maxLevel: 20,
    unlockCost: { reinforcedSteel: 20, cyberModule: 20, syntheticNanites: 20, aiFragment: 20 },
    requires: { building: "atelier_reparation", level: 5 },
    upgrade: {
      baseCost: { nano: 2000, data: 2000 },
      maxCost: { nano: 10_000_000, data: 10_000_000 },
      costFromLevel: 2,
      secondsPerLevel: 1200,
      tier2: tier2(
        { nano: 10_000_000, data: 10_000_000 },
        { nano: 800_000_000, data: 800_000_000 },
        { reinforcedSteel: 10_000, cyberModule: 10_000, syntheticNanites: 10_000, aiFragment: 10_000 },
        { reinforcedSteel: 1_000_000, cyberModule: 1_000_000, syntheticNanites: 1_000_000, aiFragment: 1_000_000 },
      ),
    },
    effect: { type: "dock", perLevel: 1000, orbitalRepair: 0.05 },
  },
  {
    id: "entrepot",
    name: "Entrepôt",
    description: "Stocke les ressources communes. Plein, la production s'arrête ; une partie du stock est à l'abri du pillage.",
    image: "/assets/buildings/entrepot.webp",
    maxLevel: 20,
    startsUnlocked: true,
    upgrade: {
      baseCost: { scrap: 20_000, energy: 10_000 },
      maxCost: { scrap: 20_000_000, energy: 10_000_000 },
      costFromLevel: 2,
      secondsPerLevel: 600,
      tier2: tier2({ scrap: 30_000_000, energy: 15_000_000 }, { scrap: 400_000_000, energy: 200_000_000 }, {}, {}),
    },
    effect: { type: "storage", base: 2_000_000, growth: 1.6 },
  },
  // v3.6 : bâtiments de fin de partie, débloqués par les nouvelles technologies.
  {
    id: "fonderie_quantique",
    name: "Fonderie quantique",
    description: "Forge de l'acier renforcé à partir de matière stabilisée à l'échelle quantique : une production continue de ressource rare.",
    image: "/assets/buildings/fonderie_quantique.webp",
    maxLevel: 10,
    endgame: true,
    unlockedByTech: "tech21",
    upgrade: { baseCost: { scrap: 20_000_000, energy: 10_000_000, cyberModule: 20_000 }, maxCost: { scrap: 1_500_000_000, energy: 800_000_000, cyberModule: 2_000_000 }, costFromLevel: 2, secondsPerLevel: 10_800 },
    production: { resource: "reinforcedSteel", perSecond: ENDGAME_PRODUCTION },
  },
  {
    id: "synthetiseur_neuronal",
    name: "Synthétiseur neuronal",
    description: "Un cortex de cristal cultive des fragments d'IA, jour et nuit : une production continue de ressource rare.",
    image: "/assets/buildings/synthetiseur_neuronal.webp",
    maxLevel: 10,
    endgame: true,
    unlockedByTech: "tech22",
    upgrade: { baseCost: { data: 20_000_000, nano: 10_000_000, syntheticNanites: 20_000 }, maxCost: { data: 1_500_000_000, nano: 800_000_000, syntheticNanites: 2_000_000 }, costFromLevel: 2, secondsPerLevel: 10_800 },
    production: { resource: "aiFragment", perSecond: ENDGAME_PRODUCTION },
  },
  {
    id: "generateur_bouclier",
    name: "Générateur de bouclier planétaire",
    description: "Un dôme d'énergie hexagonal renforce le bouclier de la base au-delà de ce que permettent les hangars.",
    image: "/assets/buildings/generateur_bouclier.webp",
    maxLevel: 10,
    endgame: true,
    unlockedByTech: "tech23",
    upgrade: { baseCost: { energy: 30_000_000, scrap: 20_000_000, reinforcedSteel: 20_000 }, maxCost: { energy: 2_000_000_000, scrap: 1_300_000_000, reinforcedSteel: 2_000_000 }, costFromLevel: 2, secondsPerLevel: 10_800 },
    effect: { type: "shield", perLevel: 0.005, max: 0.05 },
  },
];

/** v4.0 : Labo de synthèse (capsules, voir synthesis.ts). Toujours présent,
 *  même si la liste des bâtiments a été personnalisée avant son arrivée ;
 *  hors condition d'Ascension et conservé à l'Ascension. */
export const SYNTH_BUILDING_ID = "labo_synthese";
export const SYNTH_BUILDING: BuildingDef = {
  id: SYNTH_BUILDING_ID,
  name: "Labo de synthèse",
  description: "Des cuves bouillonnantes où mûrissent stimulants, carapaces et brouilleurs. Son niveau fixe la puissance des capsules (5 % par niveau).",
  image: "/assets/buildings/labo_synthese.webp",
  maxLevel: 10,
  endgame: true,
  unlockCost: { scrap: 1_500_000, energy: 800_000, data: 300_000 },
  upgrade: {
    baseCost: { scrap: 400_000, energy: 250_000, data: 100_000 },
    maxCost: { scrap: 150_000_000, energy: 90_000_000, data: 40_000_000 },
    costFromLevel: 2,
    secondsPerLevel: 5_400,
  },
};
DEFAULT_BUILDINGS.push(SYNTH_BUILDING);

export function withFixedBuildings(defs: BuildingDef[]): BuildingDef[] {
  return defs.some((b) => b.id === SYNTH_BUILDING_ID) ? defs : [...defs, SYNTH_BUILDING];
}

/* ---------- registre courant (remplacé par applyGameContent) ---------- */

export const BUILDINGS: BuildingDef[] = [];

type UnlockInfo =
  | { resource: string; amount: number; label: string }
  | { multi: true; resources: { resource: string; amount: number; label: string }[] };

/** Bâtiments de production à débloquer (objectif « Premiers pas », succès). */
export const LOCKABLE_BUILDINGS: BuildingId[] = [];
export const BUILDING_UNLOCK_COST: Record<BuildingId, UnlockInfo> = {};
export const PRODUCTION_RESOURCE_BY_BUILDING: Record<BuildingId, string> = {};

/** 6.14.95 (AA2) : métadonnées de « Bâtiments : coût de déblocage », une entrée par bâtiment (liste du contenu, lue à l'usage). */
export function buildingUnlockCostMeta(): Record<string, { label: string; hint: string }> {
  const hint = "Recalculé depuis le coût de déblocage de l'onglet Bâtiments : le régler là-bas.";
  return Object.fromEntries(Object.keys(BUILDING_UNLOCK_COST).map((id) => [id, { label: `Déblocage : ${BUILDINGS.find((b) => b.id === id)?.name ?? id}`, hint }]));
}

export function setBuildings(defs: BuildingDef[]) {
  BUILDINGS.splice(0, BUILDINGS.length, ...defs);
  LOCKABLE_BUILDINGS.splice(
    0,
    LOCKABLE_BUILDINGS.length,
    ...defs.filter((b) => b.production && !b.startsUnlocked && !b.unlockedByTech).map((b) => b.id),
  );
  for (const key of Object.keys(BUILDING_UNLOCK_COST)) delete BUILDING_UNLOCK_COST[key];
  for (const key of Object.keys(PRODUCTION_RESOURCE_BY_BUILDING)) delete PRODUCTION_RESOURCE_BY_BUILDING[key];
  for (const b of defs) {
    const entries = Object.entries(b.unlockCost ?? {}).filter(([, v]) => (v ?? 0) > 0) as [string, number][];
    const items = entries.map(([resource, amount]) => ({ resource, amount, label: RESOURCE_LIST.find((r) => r.id === resource)?.name ?? resource }));
    if (items.length === 1) BUILDING_UNLOCK_COST[b.id] = items[0];
    else if (items.length > 1) BUILDING_UNLOCK_COST[b.id] = { multi: true, resources: items };
    if (b.production) PRODUCTION_RESOURCE_BY_BUILDING[b.id] = b.production.resource;
  }
}
setBuildings(DEFAULT_BUILDINGS);

export function findBuilding(id: string): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

/* ---------- production ---------- */

export function productionPerSecond(buildingId: BuildingId, level: number): number {
  if (level <= 0) return 0;
  const table = findBuilding(buildingId)?.production?.perSecond ?? [];
  return table[Math.min(level, table.length) - 1] ?? 0;
}

/* ---------- coûts / temps ---------- */

function geometricCost(baseCost: ResourceMap, maxCost: ResourceMap, fromLevel: number, toLevel: number, level: number): ResourceMap {
  const steps = Math.max(1, toLevel - fromLevel);
  const cost: ResourceMap = {};
  for (const [res, base] of Object.entries(baseCost) as [ResourceId, number][]) {
    const target = maxCost[res] ?? base;
    const rate = base > 0 ? Math.pow(target / base, 1 / steps) : 1;
    cost[res] = Math.floor(base * Math.pow(rate, level - fromLevel));
  }
  return cost;
}

/** Palier de coûts qui s'applique à ce niveau (null = premier palier). */
function tierFor(building: BuildingDef, level: number): UpgradeTier | null {
  const t2 = building.upgrade.tier2;
  return t2 && level >= t2.fromLevel ? t2 : null;
}

export function getBuildingUpgradeCost(building: BuildingDef, nextLevel: number): ResourceMap {
  const { baseCost, maxCost, costFromLevel, tier2 } = building.upgrade;
  const t2 = tierFor(building, nextLevel);
  if (t2) return geometricCost(t2.baseCost, t2.maxCost, t2.fromLevel, building.maxLevel, nextLevel);
  // Premier palier : jusqu'au niveau précédant le second palier (ou au niveau max).
  const lastLevel = tier2 ? Math.min(building.maxLevel, tier2.fromLevel - 1) : building.maxLevel;
  return geometricCost(baseCost, maxCost, costFromLevel, lastLevel, nextLevel);
}

/** tech4 (Optimisation industrielle) réduit le coût des améliorations de bâtiments. */
export function applyBuildingDiscount<T extends Record<string, number | undefined>>(cost: T, discount: number): T {
  if (!discount) return cost;
  const out = { ...cost };
  for (const key of Object.keys(out) as (keyof T)[]) {
    const val = out[key];
    if (typeof val === "number") {
      out[key] = Math.max(0, Math.floor(val * (1 - discount))) as T[keyof T];
    }
  }
  return out;
}

/* 6.14.159 (RD-1, docs/proposals/rythme-du-depart.md) : courbe du départ.
   Premier palier géométrique au lieu de linéaire : le niveau 2 dure `secondsPerLevel ÷ startDivisor`
   (20 s pour un extracteur), le dernier niveau du premier palier garde sa durée d'avant
   ((dernier − 1) × secondsPerLevel : 1 h 30 au niveau 10 d'un extracteur), et chaque niveau entre les deux
   multiplie la durée par le même facteur (×2 environ). Aucun niveau du premier palier ne dure plus qu'avant.
   Jonction avec le second palier : un niveau dure au moins le premier niveau du second palier
   ÷ junctionMaxRatio^(écart de niveaux). Avant la bascule du rythme (3 h au niveau 11), rien ne bouge ;
   après (36 h), les niveaux 8 à 10 montent en pente (34 min, 2 h 15, 9 h) au lieu d'un saut ×24.
   La durée est écrite au lancement : un chantier en cours garde sa fin. */
export const BUILD_TIME_RULES = {
  /** Décoché : ancienne formule linéaire, (niveau − 1) × durée par niveau. */
  enabled: true,
  /** Niveau 2 = durée par niveau du bâtiment ÷ ce nombre (600 s ÷ 30 = 20 s). */
  startDivisor: 30,
  /** Jonction : un niveau dure au moins le niveau suivant ÷ ce nombre, en remontant du second palier (0 = sans lissage). */
  junctionMaxRatio: 4,
};

/** 6.14.159 : libellé, unité, bornes et aide de chaque réglage (admin ; bornes vérifiées par validateRules). */
export const BUILD_TIME_RULES_META = {
  enabled: { label: "Courbe du départ activée", hint: "Décoché : (niveau − 1) × durée par niveau, comme avant la 6.14.159." },
  startDivisor: { label: "Niveau 2 : durée par niveau divisée par", unit: "×", min: 1, max: 1000, hint: "30 : 600 s → 20 s pour un extracteur, 6 min pour la Fonderie quantique." },
  junctionMaxRatio: { label: "Jonction avec le second palier : écart maximal entre deux niveaux", unit: "×", min: 0, max: 100, hint: "4 : après la bascule du rythme, niveau 10 en 9 h avant les 36 h du niveau 11. 0 = sans lissage." },
};

/** Durée d'un niveau du premier palier (courbe du départ, ou ancienne formule linéaire). */
function firstTierSeconds(building: BuildingDef, nextLevel: number, r: BuildTimeRules): number {
  const spl = building.upgrade.secondsPerLevel;
  const linear = (nextLevel - 1) * spl;
  if (r.enabled === false || !(r.startDivisor > 1) || !(spl > 0) || nextLevel < 2) return linear;
  const t2 = building.upgrade.tier2;
  const last = t2 ? Math.min(building.maxLevel, t2.fromLevel - 1) : building.maxLevel;
  if (last <= 2) return linear;
  const start = spl / r.startDivisor;
  const end = (last - 1) * spl;
  let s = start * Math.pow(end / start, (Math.min(nextLevel, last) - 2) / (last - 2));
  if (t2 && r.junctionMaxRatio > 1 && t2.fromLevel <= building.maxLevel && t2.baseSeconds > 0) {
    s = Math.max(s, t2.baseSeconds / Math.pow(r.junctionMaxRatio, t2.fromLevel - nextLevel));
  }
  return Math.max(1, Math.round(s));
}

type BuildTimeRules = typeof BUILD_TIME_RULES;

/** Durée d'un niveau (s, avant réductions). `rules` : réglages de la courbe du départ (en vigueur par défaut ; l'admin passe
 *  les réglages en cours d'édition pour son aperçu avant / après). */
export function getBuildingUpgradeTime(building: BuildingDef, nextLevel: number, rules: BuildTimeRules = BUILD_TIME_RULES): number {
  const t2 = tierFor(building, nextLevel);
  if (t2) return t2.baseSeconds + (nextLevel - t2.fromLevel) * t2.secondsPerLevel;
  return firstTierSeconds(building, nextLevel, rules);
}

/** Palier visuel atteint (0 = aucun) : 5, 10, 15 ou 20. */
export function visualTier(level: number): 0 | VisualTier {
  let tier: 0 | VisualTier = 0;
  for (const t of VISUAL_TIERS) if (level >= t) tier = t;
  return tier;
}

/** Image à afficher pour ce niveau (image du palier atteint le plus haut, sinon l'image de base). */
export function buildingImage(building: BuildingDef, level: number): string {
  for (const t of [...VISUAL_TIERS].reverse()) {
    if (level >= t && building.tierImages?.[t]) return building.tierImages[t]!;
  }
  return building.image;
}

/* ---------- effets ---------- */

export function getRepairPercent(buildings: Buildings): number {
  let pct = 0;
  for (const b of BUILDINGS) {
    if (b.effect?.type !== "repair") continue;
    // Bâtiment verrouillé = aucun effet (auparavant, l'Atelier réparait 5 %
    // pour tout le monde, même jamais débloqué).
    pct += repairPercentAt(b.effect, effectiveBuildingLevel(buildings, b.id));
  }
  // 5.28 : Cale orbitale (Cale sèche au palier 20).
  for (const b of BUILDINGS) {
    if (b.effect?.type === "dock" && effectiveBuildingLevel(buildings, b.id) >= DOCK_TIERS.orbital) pct += Math.max(0, b.effect.orbitalRepair ?? 0);
  }
  return pct;
}

export function repairPercentAt(effect: Extract<BuildingEffect, { type: "repair" }>, level: number): number {
  const from = effect.bonusFromLevel;
  const base = from ? Math.min(level, from - 1) * effect.perLevel : level * effect.perLevel;
  const bonus = from ? Math.max(0, level - from + 1) * (effect.bonusPerLevel ?? effect.perLevel) : 0;
  return Math.max(0, Math.min(effect.max, base + bonus));
}

/** Capacité de stockage par ressource commune (Infinity sans entrepôt). */
export function getStorageCapacity(buildings: Buildings, techLevels?: Record<string, number>): number {
  let capacity = 0;
  let hasStorage = false;
  for (const b of BUILDINGS) {
    if (b.effect?.type !== "storage") continue;
    hasStorage = true;
    capacity += storageCapacityAt(b.effect, effectiveBuildingLevel(buildings, b.id));
  }
  return hasStorage ? Math.floor(capacity * (1 + techBonus(techLevels, "storage_capacity"))) : Infinity;
}

export function storageCapacityAt(effect: Extract<BuildingEffect, { type: "storage" }>, level: number): number {
  return level > 0 ? Math.floor(effect.base * Math.pow(effect.growth, level)) : 0;
}

/** Places des hangars ; v5.3 : + les technologies « Capacité des hangars » (cible attack / defense). */
export function getUnitCapacity(buildings: Buildings, category: "attack" | "defense", techLevels?: TechLevels): number {
  let capacity = 0;
  for (const b of BUILDINGS) {
    if (b.effect?.type !== "hangar" || b.effect.category !== category) continue;
    capacity += (buildings[b.id]?.level ?? 0) * b.effect.perLevel;
  }
  const bonus = techLevels ? techBonus(techLevels, "hangar_capacity", category) : 0;
  return bonus > 0 ? Math.floor(capacity * (1 + bonus)) : capacity;
}

/** 6.14.129 (AJ27-6) : capacité brute d'un hangar quand tous les bâtiments sont au niveau maximal (sans techno ni effet) ;
 *  borne des succès « Escadre » et « Maître » (achievements.ts). Calcul de capacité gardé ici (invariant I5). */
export function fullHangarCapacity(category: "attack" | "defense"): number {
  const all: Buildings = {};
  for (const b of BUILDINGS) (all as Record<string, { level: number }>)[b.id] = { level: b.maxLevel };
  return getUnitCapacity(all, category);
}

/** 5.28 : niveau effectif de la Cale sèche (0 sans elle), quel que soit l'identifiant donné en administration. */
export function dockLevel(buildings: Buildings): number {
  const def = BUILDINGS.find((b) => b.effect?.type === "dock");
  return def ? effectiveBuildingLevel(buildings, def.id) : 0;
}

/** 5.28 : postes de la Cale sèche (places de hangar), sans bonus d'effets. */
export function dockBaseCapacity(buildings: Buildings): number {
  let capacity = 0;
  for (const b of BUILDINGS) {
    if (b.effect?.type !== "dock") continue;
    capacity += effectiveBuildingLevel(buildings, b.id) * b.effect.perLevel;
  }
  return capacity;
}

/** 5.28 : bâtiments exigés au niveau maximum pour l'Ascension (la Cale sèche, arrivée après coup, n'en fait pas partie). */
export function requiredForAscension(b: Pick<BuildingDef, "endgame" | "effect">): boolean {
  return !b.endgame && b.effect?.type !== "dock";
}

/** 5.28 : bâtiments conservés à l'Ascension : fin de partie, hangars et Cale sèche (la flotte est gardée, son logement aussi). */
export function keptOnAscension(b: Pick<BuildingDef, "endgame" | "effect">): boolean {
  return !!b.endgame || b.effect?.type === "hangar" || b.effect?.type === "dock";
}

/** 5.28 : raison qui empêche de débloquer ce bâtiment (bâtiment requis), ou null. */
export function unlockBlocker(def: Pick<BuildingDef, "requires">, buildings: Buildings): string | null {
  const req = def.requires;
  if (!req) return null;
  if (effectiveBuildingLevel(buildings, req.building) >= req.level) return null;
  return `Requis : ${findBuilding(req.building)?.name ?? req.building} niveau ${req.level}.`;
}

/** Niveau effectif d'un bâtiment : 0 tant qu'il n'est pas débloqué (tous
 *  démarrent au niveau 1 dans defaultBuildings, y compris les verrouillés). */
export function effectiveBuildingLevel(buildings: Buildings, id: BuildingId): number {
  const state = buildings[id];
  return state?.unlocked ? state.level ?? 0 : 0;
}

export function defaultBuildings(): Buildings {
  return Object.fromEntries(BUILDINGS.map((b) => [b.id, { level: 1, unlocked: !!b.startsUnlocked }]));
}

/** Complète l'état d'un joueur avec les bâtiments ajoutés depuis sa
 *  création (nouveau bâtiment créé dans l'administration). Un entrepôt
 *  ajouté après coup démarre au niveau qui contient déjà le plus gros stock
 *  commun du joueur : personne n'est bloqué par son arrivée. */
export function withMissingBuildings(buildings: Buildings | undefined, resources?: Partial<Record<ResourceId, number>>): Buildings {
  const out: Buildings = { ...(buildings ?? {}) };
  for (const b of BUILDINGS) {
    if (out[b.id]) continue;
    let level = 1;
    if (b.effect?.type === "storage" && resources) {
      const biggest = Math.max(0, ...RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => resources[r.id] ?? 0));
      while (level < b.maxLevel && storageCapacityAt(b.effect, level) < biggest) level++;
    }
    out[b.id] = { level, unlocked: !!b.startsUnlocked };
  }
  return out;
}
