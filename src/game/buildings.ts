import type { BuildingId, Buildings } from "@/types/game";

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  imageBase: string;
  maxLevel: number;
  cost: { scrap?: number; energy?: number };
  production: boolean;
  scaled: boolean;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: "extracteur_ferraille",
    name: "Extracteur de ferraille",
    description: "Récupère automatiquement de la ferraille dans les débris environnants.",
    imageBase: "/assets/buildings/extracteur_ferraille",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true,
  },
  {
    id: "reacteur_instable",
    name: "Réacteur instable",
    description: "Génère de l'énergie brute, au prix d'une certaine instabilité.",
    imageBase: "/assets/buildings/reacteur_instable",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true,
  },
  {
    id: "extracteur_nanocomposants",
    name: "Extracteur de nanocomposants",
    description: "Synthétise des nanocomposants à partir de matières recyclées.",
    imageBase: "/assets/buildings/extracteur_nanocomposants",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true,
  },
  {
    id: "archives_fracturees",
    name: "Archives fracturées",
    description: "Fouille des données anciennes dans des serveurs endommagés.",
    imageBase: "/assets/buildings/archives_fracturees",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true,
  },
  {
    id: "atelier_reparation",
    name: "Atelier de réparation",
    description: "Répare une partie des unités perdues après chaque combat.",
    imageBase: "/assets/buildings/atelier_reparation",
    maxLevel: 10,
    cost: {},
    production: false,
    scaled: true,
  },
  {
    id: "hangar_attaque",
    name: "Hangar d'attaque",
    description: "Augmente la capacité de stockage des unités offensives.",
    imageBase: "/assets/buildings/hangar_attaque",
    maxLevel: 10,
    cost: { scrap: 300, energy: 150 },
    production: false,
    scaled: true,
  },
  {
    id: "hangar_defense",
    name: "Hangar de défense",
    description: "Augmente la capacité de stockage des unités défensives.",
    imageBase: "/assets/buildings/hangar_defense",
    maxLevel: 10,
    cost: { scrap: 300, energy: 150 },
    production: false,
    scaled: true,
  },
];

export const LOCKABLE_BUILDINGS: BuildingId[] = [
  "reacteur_instable",
  "extracteur_nanocomposants",
  "archives_fracturees",
];

export const BUILDING_UNLOCK_COST: Partial<
  Record<BuildingId, { resource: string; amount: number; label: string } | { multi: true; resources: { resource: string; amount: number; label: string }[] }>
> = {
  reacteur_instable: { resource: "scrap", amount: 500, label: "Ferraille" },
  extracteur_nanocomposants: { resource: "energy", amount: 500, label: "Énergie" },
  archives_fracturees: { resource: "nano", amount: 500, label: "Nanocomposants" },
  atelier_reparation: {
    multi: true,
    resources: [
      { resource: "reinforcedSteel", amount: 20, label: "Acier renforcé" },
      { resource: "cyberModule", amount: 20, label: "Module cybernétique" },
      { resource: "syntheticNanites", amount: 20, label: "Nanites synthétiques" },
      { resource: "aiFragment", amount: 20, label: "Fragment d'IA" },
    ],
  },
};

export function findBuilding(id: string): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

export function buildingImage(building: BuildingDef, level: number): string {
  const lvl = Math.max(1, Math.min(building.maxLevel, level));
  return `${building.imageBase}_lvl${lvl}.png`;
}

/* ============================
   PRODUCTION (par seconde, niveau 1 -> 10)
   ============================ */
const PRODUCTION_TABLE = [2, 4, 7, 13, 23, 42, 75, 135, 259, 500];

export function productionPerSecond(buildingId: BuildingId, level: number): number {
  if (level <= 0) return 0;
  return PRODUCTION_TABLE[level - 1] ?? 0;
}

export const PRODUCTION_RESOURCE_BY_BUILDING: Partial<Record<BuildingId, string>> = {
  extracteur_ferraille: "scrap",
  reacteur_instable: "energy",
  extracteur_nanocomposants: "nano",
  archives_fracturees: "data",
};

/* ============================
   COÛTS / TEMPS ÉCHELONNÉS
   ============================ */
const REF_BASE_SCRAP = 50;
const REF_BASE_ENERGY = 20;
const REF_TARGET_SCRAP = 2_500_000;
const REF_TARGET_ENERGY = 1_800_000;
const REF_STEPS = 9;
const SCRAP_GROWTH_RATE = Math.pow(REF_TARGET_SCRAP / REF_BASE_SCRAP, 1 / REF_STEPS);
const ENERGY_GROWTH_RATE = Math.pow(REF_TARGET_ENERGY / REF_BASE_ENERGY, 1 / REF_STEPS);

function scaledCost(level: number) {
  return {
    scrap: Math.floor(REF_BASE_SCRAP * Math.pow(SCRAP_GROWTH_RATE, level - 1)),
    energy: Math.floor(REF_BASE_ENERGY * Math.pow(ENERGY_GROWTH_RATE, level - 1)),
  };
}
function scaledTime(level: number) {
  return (level - 1) * 600;
}

const ATELIER_L2_NANO = 1000;
const ATELIER_TARGET_NANO = 10_000_000;
const ATELIER_L2_DATA = 1000;
const ATELIER_TARGET_DATA = 9_500_000;
const ATELIER_STEPS = 8;
const ATELIER_NANO_RATE = Math.pow(ATELIER_TARGET_NANO / ATELIER_L2_NANO, 1 / ATELIER_STEPS);
const ATELIER_DATA_RATE = Math.pow(ATELIER_TARGET_DATA / ATELIER_L2_DATA, 1 / ATELIER_STEPS);

function atelierCost(level: number) {
  return {
    nano: Math.floor(ATELIER_L2_NANO * Math.pow(ATELIER_NANO_RATE, level - 2)),
    data: Math.floor(ATELIER_L2_DATA * Math.pow(ATELIER_DATA_RATE, level - 2)),
  };
}
function atelierTime(level: number) {
  return (level - 1) * 1200;
}

const HANGAR_BASE_SCRAP = 300;
const HANGAR_BASE_ENERGY = 150;
const HANGAR_TARGET_SCRAP = 5_000_000;
const HANGAR_TARGET_ENERGY = 7_500_000;
const HANGAR_STEPS = 9;
const HANGAR_SCRAP_RATE = Math.pow(HANGAR_TARGET_SCRAP / HANGAR_BASE_SCRAP, 1 / HANGAR_STEPS);
const HANGAR_ENERGY_RATE = Math.pow(HANGAR_TARGET_ENERGY / HANGAR_BASE_ENERGY, 1 / HANGAR_STEPS);

function hangarCost(level: number) {
  return {
    scrap: Math.floor(HANGAR_BASE_SCRAP * Math.pow(HANGAR_SCRAP_RATE, level - 1)),
    energy: Math.floor(HANGAR_BASE_ENERGY * Math.pow(HANGAR_ENERGY_RATE, level - 1)),
  };
}
function hangarTime(level: number) {
  return (level - 1) * 900;
}

export function getBuildingUpgradeCost(building: BuildingDef, nextLevel: number): { scrap?: number; energy?: number; nano?: number; data?: number } {
  if (building.id === "atelier_reparation") return atelierCost(nextLevel);
  if (building.id === "hangar_attaque" || building.id === "hangar_defense") return hangarCost(nextLevel);
  return scaledCost(nextLevel);
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
  if (building.id === "atelier_reparation") return atelierTime(nextLevel);
  if (building.id === "hangar_attaque" || building.id === "hangar_defense") return hangarTime(nextLevel);
  return scaledTime(nextLevel);
}

export function getRepairPercent(buildings: Buildings): number {
  const level = buildings.atelier_reparation?.level ?? 1;
  return Math.max(0, Math.min(0.5, level * 0.05));
}

export function getUnitCapacity(buildings: Buildings, category: "attack" | "defense"): number {
  const level =
    category === "attack" ? buildings.hangar_attaque?.level ?? 0 : buildings.hangar_defense?.level ?? 0;
  return level * 2000;
}

/** Niveau effectif d'un bâtiment : 0 tant qu'il n'est pas débloqué (tous
 *  démarrent au niveau 1 dans defaultBuildings, y compris les verrouillés). */
export function effectiveBuildingLevel(buildings: Buildings, id: BuildingId): number {
  const state = buildings[id];
  return state?.unlocked ? state.level ?? 0 : 0;
}

export function defaultBuildings(): Buildings {
  return {
    extracteur_ferraille: { level: 1, unlocked: true },
    reacteur_instable: { level: 1, unlocked: false },
    extracteur_nanocomposants: { level: 1, unlocked: false },
    archives_fracturees: { level: 1, unlocked: false },
    atelier_reparation: { level: 1, unlocked: false },
    hangar_attaque: { level: 1, unlocked: false },
    hangar_defense: { level: 1, unlocked: false },
  };
}
