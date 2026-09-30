import { RESOURCE_LIST } from "@/game/resources";
import type { BuildingId, Buildings, ResourceId } from "@/types/game";

/* =====================================================
   Bâtiments — définis par des données (voir src/game/content.ts) :
   les valeurs ci-dessous sont celles par défaut, remplaçables depuis
   l'interface d'administration sans toucher au code.
===================================================== */

export type ResourceMap = Partial<Record<ResourceId, number>>;

export type BuildingEffect =
  /** Répare perLevel × niveau des unités perdues en combat (plafonné à max). */
  | { type: "repair"; perLevel: number; max: number }
  /** Capacité du hangar (places) = perLevel × niveau. */
  | { type: "hangar"; category: "attack" | "defense"; perLevel: number };

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
  upgrade: { baseCost: ResourceMap; maxCost: ResourceMap; costFromLevel: number; secondsPerLevel: number };
  /** Production par seconde, indexée par niveau (niveau 1 = premier élément). */
  production?: { resource: ResourceId; perSecond: number[] };
  effect?: BuildingEffect;
}

const PRODUCTION_TABLE = [2, 4, 7, 13, 23, 42, 75, 135, 259, 500];
const EXTRACTOR_UPGRADE = {
  baseCost: { scrap: 50, energy: 20 },
  maxCost: { scrap: 2_500_000, energy: 1_800_000 },
  costFromLevel: 1,
  secondsPerLevel: 600,
};
const HANGAR_UPGRADE = {
  baseCost: { scrap: 300, energy: 150 },
  maxCost: { scrap: 5_000_000, energy: 7_500_000 },
  costFromLevel: 1,
  secondsPerLevel: 900,
};

export const DEFAULT_BUILDINGS: BuildingDef[] = [
  {
    id: "extracteur_ferraille",
    name: "Extracteur de ferraille",
    description: "Récupère automatiquement de la ferraille dans les débris environnants.",
    image: "/assets/buildings/extracteur_ferraille.webp",
    maxLevel: 10,
    startsUnlocked: true,
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "scrap", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "reacteur_instable",
    name: "Réacteur instable",
    description: "Génère de l'énergie brute, au prix d'une certaine instabilité.",
    image: "/assets/buildings/reacteur_instable.webp",
    maxLevel: 10,
    unlockCost: { scrap: 500 },
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "energy", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "extracteur_nanocomposants",
    name: "Extracteur de nanocomposants",
    description: "Synthétise des nanocomposants à partir de matières recyclées.",
    image: "/assets/buildings/extracteur_nanocomposants.webp",
    maxLevel: 10,
    unlockCost: { energy: 500 },
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "nano", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "archives_fracturees",
    name: "Archives fracturées",
    description: "Fouille des données anciennes dans des serveurs endommagés.",
    image: "/assets/buildings/archives_fracturees.webp",
    maxLevel: 10,
    unlockCost: { nano: 500 },
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "data", perSecond: PRODUCTION_TABLE },
  },
  {
    id: "atelier_reparation",
    name: "Atelier de réparation",
    description: "Répare une partie des unités perdues après chaque combat.",
    image: "/assets/buildings/atelier_reparation.webp",
    maxLevel: 10,
    unlockCost: { reinforcedSteel: 20, cyberModule: 20, syntheticNanites: 20, aiFragment: 20 },
    upgrade: {
      baseCost: { nano: 1000, data: 1000 },
      maxCost: { nano: 10_000_000, data: 9_500_000 },
      costFromLevel: 2,
      secondsPerLevel: 1200,
    },
    effect: { type: "repair", perLevel: 0.05, max: 0.5 },
  },
  {
    id: "hangar_attaque",
    name: "Hangar d'attaque",
    description: "Augmente la capacité de stockage des unités offensives.",
    image: "/assets/buildings/hangar_attaque.webp",
    maxLevel: 10,
    unlockedByTech: "tech6",
    upgrade: HANGAR_UPGRADE,
    effect: { type: "hangar", category: "attack", perLevel: 2000 },
  },
  {
    id: "hangar_defense",
    name: "Hangar de défense",
    description: "Augmente la capacité de stockage des unités défensives.",
    image: "/assets/buildings/hangar_defense.webp",
    maxLevel: 10,
    unlockedByTech: "tech6",
    upgrade: HANGAR_UPGRADE,
    effect: { type: "hangar", category: "defense", perLevel: 2000 },
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

export function getBuildingUpgradeCost(building: BuildingDef, nextLevel: number): ResourceMap {
  const { baseCost, maxCost, costFromLevel } = building.upgrade;
  const steps = Math.max(1, building.maxLevel - costFromLevel);
  const cost: ResourceMap = {};
  for (const [res, base] of Object.entries(baseCost) as [ResourceId, number][]) {
    const target = maxCost[res] ?? base;
    const rate = base > 0 ? Math.pow(target / base, 1 / steps) : 1;
    cost[res] = Math.floor(base * Math.pow(rate, nextLevel - costFromLevel));
  }
  return cost;
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
  return (nextLevel - 1) * building.upgrade.secondsPerLevel;
}

/* ---------- effets ---------- */

export function getRepairPercent(buildings: Buildings): number {
  let pct = 0;
  for (const b of BUILDINGS) {
    if (b.effect?.type !== "repair") continue;
    // Bâtiment verrouillé = aucun effet (auparavant, l'Atelier réparait 5 %
    // pour tout le monde, même jamais débloqué).
    const level = effectiveBuildingLevel(buildings, b.id);
    pct += Math.max(0, Math.min(b.effect.max, level * b.effect.perLevel));
  }
  return pct;
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
 *  création (nouveau bâtiment créé dans l'administration). */
export function withMissingBuildings(buildings: Buildings | undefined): Buildings {
  const out: Buildings = { ...(buildings ?? {}) };
  for (const b of BUILDINGS) {
    if (!out[b.id]) out[b.id] = { level: 1, unlocked: !!b.startsUnlocked };
  }
  return out;
}
