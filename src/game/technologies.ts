export type TechEffect =
  | "unlock_recipe"
  | "energy_efficiency"
  | "unit_defense"
  | "unit_attack"
  | "building_discount"
  | "unlock_hangars"
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
}

export const TECHNOLOGIES: TechDef[] = [
  { id: "tech1", nom: "Analyse de matériaux", desc: "Débloque de nouvelles recettes dans le laboratoire.", maxLevel: 18, baseCost: { scrap: 100, energy: 20 }, baseTime: 30, effect: "unlock_recipe", costGrowth: 1.92, prereq: {} },
  { id: "tech3", nom: "Amélioration énergétique", desc: "Augmente l'efficacité des générateurs.", maxLevel: 10, baseCost: { scrap: 150, energy: 50 }, baseTime: 45, effect: "energy_efficiency", prereq: {} },
  { id: "tech9", nom: "Drone récupérateur", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 200, reinforcedSteel: 20 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 1 } },
  { id: "tech2", nom: "Blindage avancé", desc: "Renforce la résistance des unités.", maxLevel: 10, baseCost: { scrap: 300, nano: 50 }, baseTime: 60, effect: "unit_defense", prereq: { tech1: 3 } },
  { id: "tech5", nom: "Puissance d'attaque", desc: "Augmente la puissance d'attaque de toutes les unités.", maxLevel: 10, baseCost: { energy: 200, nano: 100 }, baseTime: 50, effect: "unit_attack", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech4", nom: "Optimisation industrielle", desc: "Réduit le coût des améliorations de bâtiments.", maxLevel: 10, baseCost: { scrap: 400, data: 50 }, baseTime: 90, effect: "building_discount", prereq: { tech1: 5, tech3: 4 } },
  { id: "tech6", nom: "Infrastructure spatiale", desc: "Débloque les hangars orbitaux.", maxLevel: 1, baseCost: { scrap: 800, energy: 400, nano: 200 }, baseTime: 120, effect: "unlock_hangars", prereq: { tech4: 3, tech3: 5 } },
  { id: "tech11", nom: "Cargo", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 300, syntheticNanites: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech9: 3, tech6: 1 } },
  { id: "tech10", nom: "Frégate", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 400, energy: 100, cyberModule: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 3, tech3: 2 } },
  { id: "tech14", nom: "Roquette", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 250, nano: 80 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 1, tech2: 4 } },
  { id: "tech8", nom: "Systèmes défensifs", desc: "Débloque les unités de défense renforcées.", maxLevel: 4, baseCost: { scrap: 500, nano: 200, data: 100 }, baseTime: 70, effect: "unlock_defense_units", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech7", nom: "Armes expérimentales", desc: "Débloque les unités d'attaque avancées.", maxLevel: 5, baseCost: { energy: 600, nano: 300, data: 150 }, baseTime: 75, effect: "unlock_attack_units", prereq: { tech5: 6, tech1: 8 } },
  { id: "tech12", nom: "Sentinelle", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 400, syntheticNanites: 150, cyberModule: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 1, tech2: 6 } },
  { id: "tech17", nom: "Batterie Anti-aérienne", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 500, syntheticNanites: 200, nano: 150 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 2, tech14: 5 } },
  { id: "tech13", nom: "Chasseur", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 600, energy: 300, syntheticNanites: 250 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech10: 5, tech7: 1 } },
  { id: "tech15", nom: "Canon à impulsion", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { energy: 800, nano: 400, syntheticNanites: 200 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech7: 2, tech3: 7 } },
  { id: "tech16", nom: "Canon plasma", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { energy: 1200, nano: 600, data: 300, aiFragment: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech15: 5, tech7: 4 } },
  { id: "tech18", nom: "Intercepteur", desc: "Augmente la puissance d'attaque de l'unité.", maxLevel: 10, baseCost: { scrap: 1000, syntheticNanites: 500, data: 400, aiFragment: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech13: 5, tech16: 2 } },
  { id: "tech19", nom: "Étoile noire", desc: "Arme ultime. Capacité de destruction massive.", maxLevel: 10, baseCost: { reinforcedSteel: 1000, syntheticNanites: 1000, cyberModule: 1000, aiFragment: 1000 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech18: 5, tech16: 5 } },
];

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
