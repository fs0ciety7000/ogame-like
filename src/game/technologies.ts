export type TechEffect =
  | "unlock_recipe"
  | "energy_efficiency"
  | "unit_defense"
  | "unit_attack"
  | "building_discount"
  | "unlock_hangars"
  | "unlock_buildings"
  | "unlock_next_level"
  | "unlock_defense_units"
  | "unlock_attack_units";

export interface TechDef {
  id: string;
  nom: string;
  desc: string;
  maxLevel: number;
  baseCost: Record<string, number>;
  baseTime: number;
  effect: TechEffect;
  costGrowth?: number;
  prereq: Record<string, number>;
  /** Valeur de l'effet par niveau (bonus) ; défaut dans TECH_EFFECT_DEFAULTS. */
  effectValue?: number;
  /** Position dans l'arbre du Labo (sinon placée automatiquement). */
  treePos?: { col: number; row: number };
}

/** Bonus par niveau des effets chiffrés, si la techno n'en précise pas. */
export const TECH_EFFECT_DEFAULTS: Partial<Record<TechEffect, number>> = {
  energy_efficiency: 0.1,
  unit_attack: 0.1,
  unit_defense: 0.1,
  building_discount: 0.05,
};

/** Descriptions des effets, pour l'interface d'administration. */
export const TECH_EFFECT_LABELS: Record<TechEffect, string> = {
  unlock_recipe: "Débloque des recettes (niveau = nombre de recettes)",
  energy_efficiency: "Bonus de production de toutes les ressources (% par niveau)",
  unit_attack: "Bonus d'attaque de toutes les unités (% par niveau)",
  unit_defense: "Bonus de défense de toutes les unités (% par niveau)",
  building_discount: "Réduction du coût des bâtiments (% par niveau)",
  unlock_hangars: "Débloque les bâtiments liés (ancien nom de unlock_buildings)",
  unlock_buildings: "Débloque les bâtiments dont « Débloqué par » vaut cette techno",
  unlock_next_level: "Débloque puis améliore l'unité liée (niveau = niveau de l'unité)",
  unlock_defense_units: "Prérequis pour des unités de défense (aucun effet direct)",
  unlock_attack_units: "Prérequis pour des unités d'attaque (aucun effet direct)",
};

export const DEFAULT_TECHNOLOGIES: TechDef[] = [
  { id: "tech1", nom: "Analyse de matériaux", desc: "Débloque de nouvelles recettes dans le laboratoire.", maxLevel: 18, baseCost: { scrap: 100, energy: 20 }, baseTime: 30, effect: "unlock_recipe", costGrowth: 1.92, prereq: {} },
  { id: "tech3", nom: "Amélioration énergétique", desc: "Augmente l'efficacité des générateurs.", maxLevel: 10, baseCost: { scrap: 150, energy: 50 }, baseTime: 45, effect: "energy_efficiency", prereq: {} },
  { id: "tech9", nom: "Drone récupérateur", desc: "Débloque le Drone récupérateur, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 200, reinforcedSteel: 20 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 1 } },
  { id: "tech2", nom: "Blindage avancé", desc: "Renforce la résistance des unités.", maxLevel: 10, baseCost: { scrap: 300, nano: 50 }, baseTime: 60, effect: "unit_defense", prereq: { tech8: 1, tech14: 4 } },
  { id: "tech5", nom: "Puissance d'attaque", desc: "Augmente la puissance d'attaque de toutes les unités.", maxLevel: 10, baseCost: { energy: 200, nano: 100 }, baseTime: 50, effect: "unit_attack", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech4", nom: "Optimisation industrielle", desc: "Réduit le coût des améliorations de bâtiments.", maxLevel: 10, baseCost: { scrap: 400, data: 50 }, baseTime: 90, effect: "building_discount", prereq: { tech1: 5, tech3: 4 } },
  { id: "tech6", nom: "Infrastructure spatiale", desc: "Débloque les hangars orbitaux.", maxLevel: 1, baseCost: { scrap: 800, energy: 400, nano: 200 }, baseTime: 120, effect: "unlock_hangars", prereq: { tech4: 3, tech3: 5 } },
  { id: "tech11", nom: "Cargo", desc: "Débloque le Cargo, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 300, syntheticNanites: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech9: 3, tech6: 1 } },
  { id: "tech10", nom: "Frégate", desc: "Débloque la Frégate, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 400, energy: 100, cyberModule: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 3, tech3: 2 } },
  { id: "tech14", nom: "Roquette", desc: "Débloque la Roquette, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 250, nano: 80 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 3 } },
  { id: "tech8", nom: "Systèmes défensifs", desc: "Débloque les unités de défense renforcées.", maxLevel: 4, baseCost: { scrap: 500, nano: 200, data: 100 }, baseTime: 70, effect: "unlock_defense_units", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech7", nom: "Armes expérimentales", desc: "Débloque les unités d'attaque avancées.", maxLevel: 5, baseCost: { energy: 600, nano: 300, data: 150 }, baseTime: 75, effect: "unlock_attack_units", prereq: { tech5: 6, tech1: 8 } },
  { id: "tech12", nom: "Sentinelle", desc: "Débloque la Sentinelle, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 400, syntheticNanites: 150, cyberModule: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 1, tech2: 6 } },
  { id: "tech17", nom: "Batterie Anti-aérienne", desc: "Débloque la Batterie anti-aérienne, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 500, syntheticNanites: 200, nano: 150 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 2, tech14: 5 } },
  { id: "tech13", nom: "Chasseur", desc: "Débloque le Chasseur, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 600, energy: 300, syntheticNanites: 250 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech10: 5, tech7: 1, tech1: 14 } },
  { id: "tech15", nom: "Canon à impulsion", desc: "Débloque le Canon à impulsion, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { energy: 800, nano: 400, syntheticNanites: 200 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech7: 2, tech3: 7 } },
  { id: "tech16", nom: "Canon plasma", desc: "Débloque le Canon plasma, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { energy: 1200, nano: 600, data: 300, aiFragment: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech15: 5, tech7: 4, tech1: 10 } },
  { id: "tech18", nom: "Intercepteur", desc: "Débloque l'Intercepteur, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 1000, syntheticNanites: 500, data: 400, aiFragment: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech13: 5, tech16: 2, tech1: 15 } },
  { id: "tech19", nom: "Étoile noire", desc: "Débloque l'Étoile noire, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { reinforcedSteel: 1000, syntheticNanites: 1000, cyberModule: 1000, aiFragment: 1000 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech18: 5, tech16: 5, tech1: 18 } },
];

/* ---------- registre courant (remplacé par applyGameContent) ---------- */

export const TECHNOLOGIES: TechDef[] = [...DEFAULT_TECHNOLOGIES];

export function setTechnologies(defs: TechDef[]) {
  TECHNOLOGIES.splice(0, TECHNOLOGIES.length, ...defs);
}

/** Bonus total d'un effet chiffré (ex. unit_attack) selon les niveaux du joueur. */
export function techBonus(techLevels: Record<string, number>, effect: TechEffect): number {
  let total = 0;
  for (const tech of TECHNOLOGIES) {
    if (tech.effect !== effect) continue;
    total += (techLevels[tech.id] ?? 0) * (tech.effectValue ?? TECH_EFFECT_DEFAULTS[effect] ?? 0);
  }
  return total;
}

export const MAX_CONCURRENT_RESEARCH = 4;
const COST_GROWTH = 2.7;
const TIME_GROWTH = 1.67;

export function findTech(id: string): TechDef | undefined {
  return TECHNOLOGIES.find((t) => t.id === id);
}

export function getTechCost(tech: TechDef, level: number): Record<string, number> {
  const growth = tech.costGrowth ?? COST_GROWTH;
  const factor = Math.pow(growth, level - 1);
  const cost: Record<string, number> = {};
  for (const [res, amount] of Object.entries(tech.baseCost)) {
    cost[res] = Math.floor(amount * factor);
  }
  return cost;
}

export function getTechTime(tech: TechDef, level: number): number {
  return Math.floor(tech.baseTime * Math.pow(TIME_GROWTH, level - 1));
}

export interface PrereqCheck {
  valid: boolean;
  list: { id: string; nom: string; requis: number; actuel: number; valide: boolean }[];
}

export function checkPrereqs(tech: TechDef, levels: Record<string, number>): PrereqCheck {
  const entries = Object.entries(tech.prereq);
  if (entries.length === 0) return { valid: true, list: [] };

  let allValid = true;
  const list = entries.map(([reqId, reqLevel]) => {
    const current = levels[reqId] ?? 0;
    const valide = current >= reqLevel;
    if (!valide) allValid = false;
    const reqTech = findTech(reqId);
    return { id: reqId, nom: reqTech?.nom ?? reqId, requis: reqLevel, actuel: current, valide };
  });

  return { valid: allValid, list };
}
