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
}

export const UNITS: UnitDef[] = [
  {
    id: "drone_recuperateur",
    name: "Drone récupérateur",
    image: "/assets/units/drone_recuperateur.png",
    maxLevel: 10,
    description: "Petit drone autonome conçu pour récupérer des ressources dispersées.",
    cost: { scrap: 500, energy: 200 },
    stats: { attaque: 0, defense: 5, vitesse: 5, cargo: 10 },
    category: "attack",
  },
  {
    id: "fregate",
    name: "Frégate",
    image: "/assets/units/fregate.png",
    maxLevel: 10,
    description: "Vaisseau polyvalent, équilibré entre attaque et défense.",
    cost: { scrap: 1000, energy: 500 },
    stats: { attaque: 15, defense: 20, vitesse: 3, cargo: 5 },
    category: "attack",
  },
  {
    id: "cargo",
    name: "Cargo",
    image: "/assets/units/cargo.png",
    maxLevel: 10,
    description: "Transporteur massif conçu pour déplacer de grandes quantités de ressources.",
    cost: { scrap: 1200, energy: 300 },
    stats: { attaque: 0, defense: 10, vitesse: 3, cargo: 50 },
    category: "attack",
  },
  {
    id: "sentinelle",
    name: "Sentinelle",
    image: "/assets/units/Sentinelle.png",
    maxLevel: 10,
    description: "Unité défensive spécialisée dans la détection et la protection.",
    cost: { scrap: 800, energy: 400 },
    stats: { attaque: 5, defense: 30, vitesse: 1, detection: 10, cargo: 0 },
    category: "attack",
  },
  {
    id: "chasseur",
    name: "Chasseur",
    image: "/assets/units/chasseur.png",
    maxLevel: 10,
    description: "Vaisseau rapide conçu pour les attaques éclairs.",
    cost: { scrap: 1500, energy: 800 },
    stats: { attaque: 105, defense: 10, vitesse: 8, cargo: 5 },
    category: "attack",
  },
  {
    id: "etoile_noire",
    name: "Étoile Noire",
    image: "/assets/units/etoile_noire.png",
    maxLevel: 10,
    description: "Arme ultime. Capacité de destruction massive.",
    cost: { scrap: 50000, energy: 30000 },
    stats: { attaque: 500, defense: 500, vitesse: 1, cargo: 1000 },
    category: "attack",
  },
  {
    id: "roquette",
    name: "Roquette",
    image: "/assets/units/roquette.png",
    maxLevel: 10,
    description: "Arme simple mais efficace pour saturer une zone.",
    cost: { scrap: 200, energy: 100 },
    stats: { attaque: 70, defense: 0, vitesse: 0, cargo: 0 },
    category: "defense",
  },
  {
    id: "canon_impulsion",
    name: "Canon à impulsion",
    image: "/assets/units/canon_impulsion.png",
    maxLevel: 10,
    description: "Canon énergétique puissant, idéal contre les cibles blindées.",
    cost: { scrap: 2000, energy: 1200 },
    stats: { attaque: 90, defense: 10, vitesse: 0, cargo: 0 },
    category: "defense",
  },
  {
    id: "canon_plasma",
    name: "Canon Plasma",
    image: "/assets/units/canon_plasma.png",
    maxLevel: 10,
    description: "Arme lourde tirant des projectiles de plasma surchauffé.",
    cost: { scrap: 2500, energy: 1500 },
    stats: { attaque: 125, defense: 20, vitesse: 0, cargo: 0 },
    category: "defense",
  },
  {
    id: "batterie_aa",
    name: "Batterie Anti-Aérienne",
    image: "/assets/units/batterie_aa.png",
    maxLevel: 10,
    description: "Défense spécialisée contre les unités rapides et aériennes.",
    cost: { scrap: 1800, energy: 900 },
    stats: { attaque: 155, defense: 60, vitesse: 0, cargo: 0 },
    category: "defense",
  },
  {
    id: "intercepteur",
    name: "Intercepteur",
    image: "/assets/units/intercepteur.png",
    maxLevel: 10,
    description: "Vaisseau ultra-rapide conçu pour intercepter les cibles prioritaires.",
    cost: { scrap: 2000, energy: 1200 },
    stats: { attaque: 255, defense: 15, vitesse: 12, cargo: 5 },
    category: "defense",
  },
];

export const UNIT_BASE_STATS: Record<string, { attack: number; defense: number }> = {
  drone_recuperateur: { attack: 0, defense: 5 },
  fregate: { attack: 15, defense: 20 },
  cargo: { attack: 0, defense: 10 },
  sentinelle: { attack: 5, defense: 30 },
  chasseur: { attack: 105, defense: 10 },
  etoile_noire: { attack: 500, defense: 500 },
  roquette: { attack: 70, defense: 0 },
  canon_impulsion: { attack: 90, defense: 10 },
  canon_plasma: { attack: 125, defense: 20 },
  batterie_aa: { attack: 155, defense: 60 },
  intercepteur: { attack: 255, defense: 15 },
};

export const UNIT_TO_TECH: Record<string, string> = {
  drone_recuperateur: "tech9",
  fregate: "tech10",
  cargo: "tech11",
  sentinelle: "tech12",
  chasseur: "tech13",
  roquette: "tech14",
  canon_impulsion: "tech15",
  canon_plasma: "tech16",
  batterie_aa: "tech17",
  intercepteur: "tech18",
  etoile_noire: "tech19",
};

export const OFFENSIVE_UNITS = ["drone_recuperateur", "fregate", "sentinelle", "cargo", "chasseur", "etoile_noire"];
export const DEFENSIVE_UNITS = ["roquette", "canon_impulsion", "canon_plasma", "batterie_aa", "intercepteur"];

export function findUnit(id: string): UnitDef | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getUnitBuildTime(unit: UnitDef): number {
  const total = (unit.cost.scrap || 0) + (unit.cost.energy || 0);
  return Math.max(3, Math.ceil(total / 100));
}
