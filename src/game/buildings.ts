import { RESOURCE_LIST } from "@/game/resources";
import type { BuildingId, Buildings, ResourceId } from "@/types/game";

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
  | { type: "storage"; base: number; growth: number };

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
  name: string;
  description: string;
  image: string;
  maxLevel: number;
  /** Débloqué dès l'inscription. */
  startsUnlocked?: boolean;
  /** Coût de déblocage (bouton « Débloquer »). */
  unlockCost?: ResourceMap;
  /** Débloqué par une technologie (effet « unlock_buildings ») plutôt que par un coût. */
  unlockedByTech?: string;
  /** Coût d'amélioration : progression géométrique de baseCost (au niveau
   *  costFromLevel) jusqu'à maxCost (au niveau max). */
  upgrade: { baseCost: ResourceMap; maxCost: ResourceMap; costFromLevel: number; secondsPerLevel: number; tier2?: UpgradeTier };
  /** Image propre à un palier visuel (sinon `image`). */
  tierImages?: Partial<Record<VisualTier, string>>;
  /** Production par seconde, indexée par niveau (niveau 1 = premier élément). */
  production?: { resource: ResourceId; perSecond: number[] };
  effect?: BuildingEffect;
}

// Niveaux 1 à 10 inchangés, puis +25 % par niveau jusqu'au niveau 20.
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
];

/* ---------- registre courant (remplacé par applyGameContent) ---------- */

export const BUILDINGS: BuildingDef[] = [];

type UnlockInfo =
  | { resource: string; amount: number; label: string }
  | { multi: true; resources: { resource: string; amount: number; label: string }[] };

/** Bâtiments de production à débloquer (objectif « Premiers pas », succès). */
export const LOCKABLE_BUILDINGS: BuildingId[] = [];
export const BUILDING_UNLOCK_COST: Record<BuildingId, UnlockInfo> = {};
export const PRODUCTION_RESOURCE_BY_BUILDING: Record<BuildingId, string> = {};

export function setBuildings(defs: BuildingDef[]) {
  BUILDINGS.splice(0, BUILDINGS.length, ...defs);
  LOCKABLE_BUILDINGS.splice(
    0,
    LOCKABLE_BUILDINGS.length,
    ...defs.filter((b) => b.production && !b.startsUnlocked).map((b) => b.id),
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

export function getBuildingUpgradeTime(building: BuildingDef, nextLevel: number): number {
  const t2 = tierFor(building, nextLevel);
  if (t2) return t2.baseSeconds + (nextLevel - t2.fromLevel) * t2.secondsPerLevel;
  return (nextLevel - 1) * building.upgrade.secondsPerLevel;
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
  return pct;
}

export function repairPercentAt(effect: Extract<BuildingEffect, { type: "repair" }>, level: number): number {
  const from = effect.bonusFromLevel;
  const base = from ? Math.min(level, from - 1) * effect.perLevel : level * effect.perLevel;
  const bonus = from ? Math.max(0, level - from + 1) * (effect.bonusPerLevel ?? effect.perLevel) : 0;
  return Math.max(0, Math.min(effect.max, base + bonus));
}

/** Capacité de stockage par ressource commune (Infinity sans entrepôt). */
export function getStorageCapacity(buildings: Buildings): number {
  let capacity = 0;
  let hasStorage = false;
  for (const b of BUILDINGS) {
    if (b.effect?.type !== "storage") continue;
    hasStorage = true;
    capacity += storageCapacityAt(b.effect, effectiveBuildingLevel(buildings, b.id));
  }
  return hasStorage ? capacity : Infinity;
}

export function storageCapacityAt(effect: Extract<BuildingEffect, { type: "storage" }>, level: number): number {
  return level > 0 ? Math.floor(effect.base * Math.pow(effect.growth, level)) : 0;
}

export function getUnitCapacity(buildings: Buildings, category: "attack" | "defense"): number {
  let capacity = 0;
  for (const b of BUILDINGS) {
    if (b.effect?.type !== "hangar" || b.effect.category !== category) continue;
    capacity += (buildings[b.id]?.level ?? 0) * b.effect.perLevel;
  }
  return capacity;
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
