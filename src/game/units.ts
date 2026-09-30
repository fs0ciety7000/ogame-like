import type { UnitCategory } from "@/types/game";

export interface UnitStats {
  attaque: number;
  defense: number;
  vitesse: number;
  cargo: number;
  detection?: number;
}

export interface UnitDef {
  id: string;
  name: string;
  image: string;
  maxLevel: number;
  description: string;
  cost: { scrap: number; energy: number };
  stats: UnitStats;
  category: UnitCategory;
  hangarSpace: number;
  /** Technologie du Labo qui débloque puis améliore l'unité. */
  unlockTech: string;
  /** Temps de construction (s) ; par défaut (ferraille + énergie) / 100. */
  buildTime?: number;
}

export const DEFAULT_UNITS: UnitDef[] = [
  {
    id: "drone_recuperateur",
    name: "Drone récupérateur",
    image: "/assets/units/drone_recuperateur.webp",
    maxLevel: 10,
    description: "Petit drone autonome conçu pour récupérer des ressources dispersées.",
    cost: { scrap: 500, energy: 200 },
    stats: { attaque: 15, defense: 5, vitesse: 5, cargo: 10 },
    category: "attack",
    unlockTech: "tech9",
    hangarSpace: 1,
  },
  {
    id: "sonde_espionnage",
    name: "Sonde d'espionnage",
    image: "/assets/units/sonde_espionnage.webp",
    maxLevel: 10,
    description: "Sonde furtive et très rapide : rapporte les ressources, la flotte et les plans d'un autre joueur. Plus tu en envoies, plus le rapport est complet.",
    cost: { scrap: 300, energy: 150 },
    stats: { attaque: 0, defense: 2, vitesse: 20, cargo: 0 },
    category: "attack",
    unlockTech: "tech20",
    hangarSpace: 1,
  },
  {
    id: "fregate",
    name: "Frégate",
    image: "/assets/units/fregate.webp",
    maxLevel: 10,
    description: "Vaisseau polyvalent, équilibré entre attaque et défense.",
    cost: { scrap: 1000, energy: 500 },
    stats: { attaque: 100, defense: 20, vitesse: 3, cargo: 5 },
    category: "attack",
    unlockTech: "tech10",
    hangarSpace: 1,
  },
  {
    id: "cargo",
    name: "Cargo",
    image: "/assets/units/cargo.webp",
    maxLevel: 10,
    description: "Transporteur massif conçu pour déplacer de grandes quantités de ressources.",
    cost: { scrap: 1200, energy: 300 },
    stats: { attaque: 50, defense: 10, vitesse: 3, cargo: 50 },
    category: "attack",
    unlockTech: "tech11",
    hangarSpace: 1,
  },
  {
    id: "sentinelle",
    name: "Sentinelle",
    image: "/assets/units/sentinelle.webp",
    maxLevel: 10,
    description: "Unité offensive spécialisée dans la détection et la protection.",
    cost: { scrap: 800, energy: 400 },
    stats: { attaque: 120, defense: 30, vitesse: 1, detection: 10, cargo: 0 },
    category: "attack",
    unlockTech: "tech12",
    hangarSpace: 1,
  },
  {
    id: "chasseur",
    name: "Chasseur",
    image: "/assets/units/chasseur.webp",
    maxLevel: 10,
    description: "Vaisseau rapide conçu pour les attaques éclairs.",
    cost: { scrap: 1500, energy: 800 },
    stats: { attaque: 245, defense: 10, vitesse: 8, cargo: 5 },
    category: "attack",
    unlockTech: "tech13",
    hangarSpace: 20,
  },
  {
    id: "etoile_noire",
    name: "Étoile Noire",
    image: "/assets/units/etoile_noire.webp",
    maxLevel: 10,
    description: "Arme ultime. Capacité de destruction massive.",
    cost: { scrap: 50000, energy: 30000 },
    stats: { attaque: 500, defense: 500, vitesse: 1, cargo: 1000 },
    category: "attack",
    unlockTech: "tech19",
    hangarSpace: 200,
  },
  {
    id: "roquette",
    name: "Roquette",
    image: "/assets/units/roquette.webp",
    maxLevel: 10,
    description: "Arme simple mais efficace pour saturer une zone.",
    cost: { scrap: 200, energy: 100 },
    stats: { attaque: 60, defense: 0, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech14",
    hangarSpace: 1,
  },
  {
    id: "canon_impulsion",
    name: "Canon à impulsion",
    image: "/assets/units/canon_impulsion.webp",
    maxLevel: 10,
    description: "Canon énergétique puissant, idéal contre les cibles blindées.",
    cost: { scrap: 2000, energy: 1200 },
    stats: { attaque: 80, defense: 10, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech15",
    hangarSpace: 1,
  },
  {
    id: "canon_plasma",
    name: "Canon Plasma",
    image: "/assets/units/canon_plasma.webp",
    maxLevel: 10,
    description: "Arme lourde tirant des projectiles de plasma surchauffé.",
    cost: { scrap: 2500, energy: 1500 },
    stats: { attaque: 105, defense: 20, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech16",
    hangarSpace: 1,
  },
  {
    id: "batterie_aa",
    name: "Batterie Anti-Aérienne",
    image: "/assets/units/batterie_aa.webp",
    maxLevel: 10,
    description: "Défense spécialisée contre les unités rapides et aériennes.",
    cost: { scrap: 1800, energy: 900 },
    stats: { attaque: 135, defense: 15, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech17",
    hangarSpace: 1,
  },
  {
    id: "intercepteur",
    name: "Intercepteur",
    image: "/assets/units/intercepteur.webp",
    maxLevel: 10,
    description: "Vaisseau ultra-rapide conçu pour intercepter les cibles prioritaires.",
    cost: { scrap: 2000, energy: 1200 },
    stats: { attaque: 255, defense: 60, vitesse: 12, cargo: 5 },
    category: "defense",
    unlockTech: "tech18",
    hangarSpace: 20,
  },
];

/* ---------- registre courant (remplacé par applyGameContent) ---------- */

export const UNITS: UnitDef[] = [];
/** Stats de combat de base, dérivées des fiches (plus de double saisie). */
export const UNIT_BASE_STATS: Record<string, { attack: number; defense: number }> = {};
/** Technologie qui débloque/améliore chaque unité. */
export const UNIT_TO_TECH: Record<string, string> = {};
export const OFFENSIVE_UNITS: string[] = [];
export const DEFENSIVE_UNITS: string[] = [];

export function setUnits(defs: UnitDef[]) {
  UNITS.splice(0, UNITS.length, ...defs);
  for (const key of Object.keys(UNIT_BASE_STATS)) delete UNIT_BASE_STATS[key];
  for (const key of Object.keys(UNIT_TO_TECH)) delete UNIT_TO_TECH[key];
  for (const u of defs) {
    UNIT_BASE_STATS[u.id] = { attack: u.stats.attaque, defense: u.stats.defense };
    if (u.unlockTech) UNIT_TO_TECH[u.id] = u.unlockTech;
  }
  OFFENSIVE_UNITS.splice(0, OFFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "attack").map((u) => u.id));
  DEFENSIVE_UNITS.splice(0, DEFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "defense").map((u) => u.id));
}
setUnits(DEFAULT_UNITS);

export function findUnit(id: string): UnitDef | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getUnitBuildTime(unit: UnitDef): number {
  if (unit.buildTime && unit.buildTime > 0) return unit.buildTime;
  const total = (unit.cost.scrap || 0) + (unit.cost.energy || 0);
  return Math.max(3, Math.ceil(total / 100));
}
