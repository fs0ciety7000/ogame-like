import { describeEffect, effectCap, effectTotal, isUnitSelector, TECH_REDUCTION_CAP, validateComposedEffect, type ComposedEffect, type EffectGrant, type EffectScope, type EffectStat, TECH_COMBAT_LIMITS } from "@/game/effects";
/** Effets historiques (un seul par techno, avant la v2.6). */
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

/** Types d'effet (v2.6) : les historiques et les nouveaux. */
export type TechEffectType =
  | TechEffect
  | "resource_production"
  | "storage_capacity"
  | "protected_storage"
  | "fleet_speed"
  | "cargo_capacity"
  | "building_time"
  | "unit_time"
  | "research_time"
  | "fleet_upkeep"
  | "counter_spy"
  | "hangar_capacity"
  | "repair_speed"
  // 5.23 : effet composé (grandeur × cible × portée), valeur par niveau.
  | "stat";

/** Un effet octroyé par une technologie, multiplié par son niveau. */
export interface TechEffectDef {
  type: TechEffectType;
  /** Valeur par niveau (0,1 = 10 %) ; vide = valeur par défaut du type. */
  value?: number;
  /** Ressource visée (resource_production) ou unité (unlock_next_level). */
  target?: string;
  /** Bâtiments débloqués (unlock_buildings), en plus de ceux qui citent la techno. */
  targets?: string[];
  /** 5.23 : effet composé (type « stat ») : grandeur et portée ; la cible est `target`. */
  stat?: EffectStat;
  scope?: EffectScope;
}

export interface TechDef {
  id: string;
  nom: string;
  desc: string;
  maxLevel: number;
  baseCost: Record<string, number>;
  baseTime: number;
  /** Effets (v2.6). Absent : effet historique `effect` / `effectValue`. */
  effects?: TechEffectDef[];
  /** Ancien format : un seul effet. */
  effect?: TechEffect;
  costGrowth?: number;
  /** v5.9 : ambre (monnaie des Kesh'Vaar) demandé à chaque niveau, en plus des ressources. */
  amberCost?: number;
  prereq: Record<string, number>;
  /** Valeur de l'effet historique par niveau ; défaut dans TECH_EFFECT_DEFAULTS. */
  effectValue?: number;
  /** Position dans l'arbre du Labo (sinon placée automatiquement). */
  treePos?: { col: number; row: number };
  /** 6.14.12 : illustration du Codex (défaut : TECH_CODEX_IMAGE, en attendant le rendu Midjourney). */
  image?: string;
}

/** 6.14.12 : image provisoire des technos dans le Codex (rendus : docs/prompts-6.14.md, /assets/technologies/<id>.webp). */
export const TECH_CODEX_IMAGE = "/assets/buildings/archives_fracturees.webp";

/** 6.14.26 : technos qui ont leur illustration définitive (`public/assets/technologies/<id>.webp`, docs/illustrations.md).
 *  Un id ajouté ici suffit, même sur un contenu personnalisé ; le champ `image` de l'admin reste prioritaire. */
export const TECH_ART: readonly string[] = ["tech1", "tech2", "tech3", "tech4", "tech5", "tech6", "tech7", "tech8", "tech9", "tech10", "tech11", "tech12", "tech13", "tech14", "tech15", "tech18", "tech19", "tech20", "tech21", "tech22", "tech23", "tech24", "tech25", "tech26", "tech27", "tech28"];

/** Illustration du Codex d'une techno : image de l'admin, sinon illustration définitive, sinon image provisoire commune. */
export function techImage(t: Pick<TechDef, "id" | "image">): string {
  return t.image || (TECH_ART.includes(t.id) ? `/assets/technologies/${t.id}.webp` : TECH_CODEX_IMAGE);
}

/** v3.6 : technologies de fin de partie (déclencheur « singularité » du Chœur Silencieux). */
export const ENDGAME_TECH_IDS = ["tech21", "tech22", "tech23", "tech24", "tech25"];

/** Valeur par niveau des effets chiffrés, si la techno n'en précise pas. */
export const TECH_EFFECT_DEFAULTS: Partial<Record<TechEffectType, number>> = {
  energy_efficiency: 0.1,
  unit_attack: 0.1,
  unit_defense: 0.1,
  building_discount: 0.05,
  resource_production: 0.1,
  storage_capacity: 0.1,
  protected_storage: 0.02,
  fleet_speed: 0.05,
  cargo_capacity: 0.1,
  building_time: 0.05,
  unit_time: 0.05,
  research_time: 0.05,
  fleet_upkeep: 0.05,
  counter_spy: 1,
  hangar_capacity: 0.05,
  repair_speed: 0.1,
  stat: 0.02,
};

/** Plafond des réductions cumulées (temps, coûts, entretien) et de la part à l'abri. */
export { TECH_REDUCTION_CAP };

/** Libellés des effets, pour l'administration et le Labo. */
export const TECH_EFFECT_LABELS: Record<TechEffectType, string> = {
  unlock_recipe: "Débloque des recettes (niveau = nombre de recettes)",
  energy_efficiency: "Production de toutes les ressources (% par niveau)",
  unit_attack: "Attaque de toutes les unités (% par niveau)",
  unit_defense: "Défense de toutes les unités (% par niveau)",
  building_discount: "Coût des bâtiments (−% par niveau)",
  unlock_hangars: "Débloque les bâtiments liés (ancien nom de unlock_buildings)",
  unlock_buildings: "Débloque des bâtiments",
  unlock_next_level: "Débloque puis améliore une unité (niveau = niveau de l'unité)",
  unlock_defense_units: "Prérequis pour des unités de défense (aucun effet direct)",
  unlock_attack_units: "Prérequis pour des unités d'attaque (aucun effet direct)",
  resource_production: "Production d'une ressource (% par niveau)",
  storage_capacity: "Capacité des entrepôts (% par niveau)",
  protected_storage: "Part de l'entrepôt à l'abri du pillage (points de % par niveau)",
  fleet_speed: "Temps de vol des flottes (−% par niveau)",
  cargo_capacity: "Cargaison des vaisseaux (% par niveau)",
  building_time: "Temps de construction des bâtiments (−% par niveau)",
  unit_time: "Temps de construction des unités (−% par niveau)",
  research_time: "Temps de recherche (−% par niveau)",
  fleet_upkeep: "Entretien de la flotte (−% par niveau)",
  counter_spy: "Contre-espionnage (points par niveau)",
  hangar_capacity: "Capacité des hangars d'attaque ou de défense (% par niveau)",
  repair_speed: "Cadence de l'Atelier de réparation (% par niveau)",
  stat: "Effet composé : grandeur, cible et portée (valeur par niveau)",
};

/** Effets chiffrés (une valeur par niveau) ; les autres débloquent. */
export const NUMERIC_TECH_EFFECTS = Object.keys(TECH_EFFECT_DEFAULTS) as TechEffectType[];
/** Effets plafonnés à TECH_REDUCTION_CAP une fois cumulés. */
export const CAPPED_TECH_EFFECTS: TechEffectType[] = ["building_discount", "fleet_speed", "building_time", "unit_time", "research_time", "fleet_upkeep", "protected_storage"];

/** 6.9.5 (AU8) : grandeur plafonnée de chaque effet de techno, pour lire son plafond réglable (`effectCaps`). */
const CAPPED_EFFECT_STAT: Partial<Record<TechEffectType, EffectStat>> = {
  building_discount: "buildingDiscount",
  fleet_speed: "fleetSpeed",
  building_time: "buildTime",
  unit_time: "unitTime",
  research_time: "researchTime",
  fleet_upkeep: "fleetUpkeep",
  protected_storage: "protectedStorage",
};

/** Plafond (couche techno) d'un effet de techno plafonné, réglable dans l'admin. */
export function techEffectCap(type: TechEffectType): number {
  const stat = CAPPED_EFFECT_STAT[type];
  return (stat && effectCap(stat, "tech")) ?? TECH_REDUCTION_CAP;
}

export const DEFAULT_TECHNOLOGIES: TechDef[] = [
  { id: "tech1", nom: "Analyse de matériaux", desc: "Débloque de nouvelles recettes dans le laboratoire.", maxLevel: 18, baseCost: { scrap: 100, energy: 20 }, baseTime: 30, effect: "unlock_recipe", costGrowth: 1.92, prereq: {} },
  { id: "tech3", nom: "Amélioration énergétique", desc: "Augmente l'efficacité des générateurs.", maxLevel: 10, baseCost: { scrap: 150, energy: 50 }, baseTime: 45, effect: "energy_efficiency", prereq: {} },
  { id: "tech9", nom: "Drone récupérateur", desc: "Débloque le Drone récupérateur, puis l'améliore : +5 attaque et +5 défense par niveau.", maxLevel: 10, baseCost: { scrap: 200, reinforcedSteel: 20 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 1 } },
  { id: "tech20", nom: "Espionnage", desc: "Débloque la Sonde d'espionnage, puis l'améliore : chaque niveau rend tes rapports plus complets et protège mieux ta base des sondes adverses.", maxLevel: 10, baseCost: { scrap: 300, energy: 150, data: 50 }, baseTime: 60, effect: "unlock_next_level", prereq: { tech1: 2, tech3: 2 } },
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
  // v3.6 : technologies de fin de partie, entre le Canon plasma / l'Intercepteur et l'Étoile noire.
  { id: "tech21", nom: "Métallurgie quantique", desc: "Alliages stabilisés à l'échelle quantique : +2 % de défense des unités par niveau. Débloque la Fonderie quantique.", maxLevel: 10, baseCost: { scrap: 200_000, nano: 100_000, reinforcedSteel: 400, cyberModule: 200 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "unit_defense", value: 0.02 }, { type: "unlock_buildings" }], prereq: { tech1: 16, tech2: 8, tech16: 3 } },
  { id: "tech22", nom: "Cortex neuronal", desc: "Réseaux de calcul organiques : −2 % de temps de recherche et +1 contre-espionnage par niveau. Débloque le Synthétiseur neuronal.", maxLevel: 10, baseCost: { data: 300_000, energy: 150_000, aiFragment: 300, syntheticNanites: 300 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "research_time", value: 0.02 }, { type: "counter_spy", value: 1 }, { type: "unlock_buildings" }], prereq: { tech1: 17, tech20: 6, tech18: 3 } },
  { id: "tech23", nom: "Champs de confinement", desc: "Contenir l'énergie, protéger les stocks : +1 point de stock à l'abri du pillage par niveau. Débloque le Générateur de bouclier planétaire.", maxLevel: 10, baseCost: { energy: 300_000, nano: 200_000, reinforcedSteel: 300, syntheticNanites: 300 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "protected_storage", value: 0.01 }, { type: "unlock_buildings" }], prereq: { tech1: 16, tech8: 4, tech17: 5 } },
  { id: "tech24", nom: "Propulsion à antimatière", desc: "Débloque le Croiseur Nova, puis l'améliore (+250 attaque et défense par niveau). −2 % de temps de vol par niveau.", maxLevel: 10, baseCost: { scrap: 400_000, energy: 400_000, aiFragment: 500, cyberModule: 500 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "unlock_next_level", target: "croiseur_nova" }, { type: "fleet_speed", value: 0.02 }], prereq: { tech1: 17, tech18: 5, tech11: 6, tech21: 2 } },
  { id: "tech25", nom: "Lance gravitationnelle", desc: "Débloque la Lance gravitationnelle, puis l'améliore : +150 attaque et défense par niveau.", maxLevel: 10, baseCost: { nano: 400_000, data: 300_000, reinforcedSteel: 500, aiFragment: 300 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "unlock_next_level", target: "lance_gravitationnelle" }], prereq: { tech1: 17, tech16: 6, tech23: 3 } },
  // v5.5 : demandée par les joueurs, hangars pleins en fin de partie.
  { id: "tech26", nom: "Extension des hangars", desc: "Modules d'amarrage repliables : +5 % de places dans les hangars d'attaque et de défense par niveau (+50 % au niveau 10).", maxLevel: 10, baseCost: { scrap: 150_000, nano: 80_000, reinforcedSteel: 200, cyberModule: 200 }, baseTime: 600, costGrowth: 2.2, effects: [{ type: "hangar_capacity", value: 0.05, target: "attack" }, { type: "hangar_capacity", value: 0.05, target: "defense" }], prereq: { tech6: 1, tech1: 12 } },
  // 5.21 : cadence de l'Atelier de réparation.
  { id: "tech27", nom: "Nanoréparation", desc: "Essaims de nanites soudeuses : +10 % de cadence de l'Atelier de réparation par niveau (le double au niveau 10).", maxLevel: 10, baseCost: { scrap: 2000, energy: 1000, syntheticNanites: 80 }, baseTime: 120, costGrowth: 1.9, effects: [{ type: "repair_speed", value: 0.1 }], prereq: { tech1: 6, tech2: 3 } },
  { id: "tech28", nom: "Bastion", desc: "Débloque le Bastion (forteresse volante, classe Fort), puis l'améliore : +120 attaque et défense par niveau.", maxLevel: 10, baseCost: { scrap: 8000, energy: 4000, reinforcedSteel: 150, cyberModule: 100 }, baseTime: 300, costGrowth: 1.9, effects: [{ type: "unlock_next_level", target: "bastion" }], prereq: { tech2: 5, tech10: 5, tech1: 12 } },
  { id: "tech29", nom: "Batterie anti-essaim", desc: "Débloque la Batterie anti-essaim (défense, double avantage contre la classe Faible), puis l'améliore : +5 attaque et défense par niveau.", maxLevel: 10, baseCost: { scrap: 1500, nano: 800, syntheticNanites: 200 }, baseTime: 120, costGrowth: 1.9, effects: [{ type: "unlock_next_level", target: "batterie_essaim" }], prereq: { tech17: 3, tech14: 5 } },
  { id: "tech30", nom: "Vaisseau-atelier", desc: "Débloque le Vaisseau-atelier (15 PV/s de réparation par vaisseau à quai), puis l'améliore : +5 attaque et défense par niveau.", maxLevel: 10, baseCost: { scrap: 3000, energy: 1500, syntheticNanites: 150, cyberModule: 50 }, baseTime: 180, costGrowth: 1.9, effects: [{ type: "unlock_next_level", target: "vaisseau_atelier" }], prereq: { tech27: 2, tech11: 3 } },
  { id: "tech19", nom: "Étoile noire", desc: "Débloque l'Étoile noire, puis l'améliore : +1 700 attaque et +1 700 défense par niveau.", maxLevel: 10, baseCost: { reinforcedSteel: 1000, syntheticNanites: 1000, cyberModule: 1000, aiFragment: 1000 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech18: 5, tech16: 5, tech1: 18 } },
];

/* ---------- registre courant (remplacé par applyGameContent) ---------- */

export const TECHNOLOGIES: TechDef[] = [...DEFAULT_TECHNOLOGIES];

export function setTechnologies(defs: TechDef[]) {
  TECHNOLOGIES.splice(0, TECHNOLOGIES.length, ...defs);
}

/** Effets d'une technologie (ancien format converti à la volée). */
export function techEffects(tech: TechDef): TechEffectDef[] {
  if (tech.effects && tech.effects.length > 0) return tech.effects;
  if (!tech.effect) return [];
  const type: TechEffectType = tech.effect === "unlock_hangars" ? "unlock_buildings" : tech.effect;
  return [tech.effectValue === undefined ? { type } : { type, value: tech.effectValue }];
}

/** Valeur par niveau d'un effet (celle de la techno, sinon le défaut du type). */
export function effectValuePerLevel(effect: TechEffectDef): number {
  return effect.value ?? TECH_EFFECT_DEFAULTS[effect.type] ?? 0;
}

/** v5.14 : grandeur du circuit d'effets que chaque effet chiffré alimente. */
export const TECH_EFFECT_STAT: Partial<Record<TechEffectType, EffectStat>> = {
  energy_efficiency: "productionAll",
  resource_production: "production",
  unit_attack: "attack",
  unit_defense: "defense",
  building_discount: "buildingDiscount",
  storage_capacity: "storage",
  protected_storage: "protectedStorage",
  fleet_speed: "fleetSpeed",
  cargo_capacity: "cargo",
  building_time: "buildTime",
  unit_time: "unitTime",
  research_time: "researchTime",
  fleet_upkeep: "fleetUpkeep",
  counter_spy: "counterSpy",
  hangar_capacity: "hangarCapacity",
  repair_speed: "repairSpeed",
};

/** v5.14 : effets déclarés par les technologies du joueur (couche « tech »).
 *  Toute techno ajoutée au catalogue avec un effet chiffré est prise en compte. */
export function techEffectGrants(techLevels: Record<string, number> | undefined): EffectGrant[] {
  const out: EffectGrant[] = [];
  if (!techLevels) return out;
  for (const tech of TECHNOLOGIES) {
    const level = techLevels[tech.id] ?? 0;
    if (level <= 0) continue;
    for (const e of techEffects(tech)) {
      const stat = e.type === "stat" ? e.stat : TECH_EFFECT_STAT[e.type];
      if (!stat) continue;
      out.push({ stat, target: e.target, ...(e.type === "stat" && e.scope && e.scope !== "all" ? { scope: e.scope } : {}), value: level * effectValuePerLevel(e), layer: "tech", source: { kind: "tech", id: tech.id, label: tech.nom } });
    }
  }
  return out;
}

/** Bonus total d'un effet chiffré selon les niveaux du joueur (`target` :
 *  ressource visée pour resource_production). Les réductions sont plafonnées. */
export function techBonus(techLevels: Record<string, number> | undefined, type: TechEffectType, target?: string): number {
  if (!techLevels) return 0;
  const stat = TECH_EFFECT_STAT[type];
  if (stat) return effectTotal(techEffectGrants(techLevels), "tech", stat, { target });
  // Effets de déblocage : niveau × valeur, sans plafond.
  let total = 0;
  for (const tech of TECHNOLOGIES) {
    const level = techLevels[tech.id] ?? 0;
    if (level <= 0) continue;
    for (const e of techEffects(tech)) {
      if (e.type !== type && !(type === "unlock_buildings" && e.type === "unlock_hangars")) continue;
      if (target !== undefined && e.target !== target) continue;
      total += level * effectValuePerLevel(e);
    }
  }
  return total;
}

/** Multiplicateur d'une réduction (1 − bonus plafonné) : temps, entretien… */
export function techReductionFactor(techLevels: Record<string, number> | undefined, type: TechEffectType): number {
  return 1 - techBonus(techLevels, type);
}

/** Bâtiments débloqués par une techno (ceux qui la citent + ses cibles). */
export function buildingsUnlockedByTech(techId: string, buildings: { id: string; unlockedByTech?: string }[]): string[] {
  const tech = findTech(techId);
  const ids = new Set(buildings.filter((b) => b.unlockedByTech === techId).map((b) => b.id));
  for (const e of tech ? techEffects(tech) : []) if (e.type === "unlock_buildings" || e.type === "unlock_hangars") for (const id of e.targets ?? []) ids.add(id);
  return [...ids];
}

/** 6.9.7 (AU11) : recherches en parallèle au plus (registre « research »).
 *  6.14.84 (RL-1, proposals/rythme-long-terme.md §5.1) : croissance des coûts et des durées, recherche tardive et durée
 *  maximale d'un niveau, réglables dans Admin → Règles → Labo. Valeurs par défaut neutres : mêmes coûts et durées
 *  qu'avant (2,7 et 1,67 étaient des constantes du code). La bascule vers les valeurs de la proposition est le lot RL-3. */
export const RESEARCH_RULES = {
  maxConcurrent: 4,
  /** Coût d'un niveau = coût de base × costGrowth^(niveau − 1) (une techno peut avoir sa propre croissance). */
  costGrowth: 2.7,
  /** Durée d'un niveau = durée de base × timeGrowth^(niveau − 1). */
  timeGrowth: 1.67,
  /** Recherche tardive : à partir de ce niveau, la durée est multipliée par `lateTimeFactor` (0 = jamais). */
  lateFromLevel: 0,
  /** Multiplicateur de durée des niveaux tardifs (1 = sans effet). */
  lateTimeFactor: 1,
  /** Durée maximale d'un niveau, avant les réductions (secondes ; 0 = sans plafond). */
  maxLevelSeconds: 0,
};

/** Nombre fini et positif d'une règle, sinon sa valeur par défaut (réglage vidé ou absurde). */
function researchRule(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function findTech(id: string): TechDef | undefined {
  return TECHNOLOGIES.find((t) => t.id === id);
}

export function getTechCost(tech: TechDef, level: number): Record<string, number> {
  const growth = tech.costGrowth ?? researchRule(RESEARCH_RULES.costGrowth, 2.7);
  const factor = Math.pow(growth, level - 1);
  const cost: Record<string, number> = {};
  for (const [res, amount] of Object.entries(tech.baseCost)) {
    cost[res] = Math.floor(amount * factor);
  }
  return cost;
}

/** v5.9 : ambre payé pour un niveau (montant fixe, identique à chaque niveau). */
export function getTechAmberCost(tech: Pick<TechDef, "amberCost">): number {
  const n = Number(tech.amberCost);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Durée d'un niveau (secondes, avant les réductions) : croissance, puis facteur des niveaux tardifs, puis plafond (RL-1). */
export function getTechTime(tech: TechDef, level: number): number {
  let seconds = tech.baseTime * Math.pow(researchRule(RESEARCH_RULES.timeGrowth, 1.67), level - 1);
  const lateFrom = Math.floor(Number(RESEARCH_RULES.lateFromLevel) || 0);
  if (lateFrom > 0 && level >= lateFrom) seconds *= researchRule(RESEARCH_RULES.lateTimeFactor, 1);
  const cap = Number(RESEARCH_RULES.maxLevelSeconds) || 0;
  if (cap > 0) seconds = Math.min(seconds, cap);
  return Math.floor(seconds);
}

export interface PrereqCheck {
  valid: boolean;
  /** `kind: "plan"` : plan d'unité à posséder (pas de niveau). */
  list: { id: string; nom: string; requis: number; actuel: number; valide: boolean; kind?: "tech" | "plan" }[];
}

/** v5.9 : unités débloquées par un plan (Comptoir Kesh'Vaar), id → nom.
 *  Rempli par setUnits (units.ts importe déjà ce module). */
export const BLUEPRINT_UNITS = new Map<string, string>();

/** Unités à plan qu'une techno débloque : il faut posséder le plan pour la rechercher. */
export function blueprintsRequiredBy(tech: TechDef): string[] {
  return techEffects(tech)
    .filter((e) => e.type === "unlock_next_level" && e.target && BLUEPRINT_UNITS.has(e.target))
    .map((e) => e.target!);
}

/** Prérequis d'une techno : niveaux d'autres technos et, v5.9, plans d'unités
 *  possédés (`ownedPlans` : ids des unités dont le joueur a le plan). */
export function checkPrereqs(tech: TechDef, levels: Record<string, number>, ownedPlans: readonly string[] = []): PrereqCheck {
  const list: PrereqCheck["list"] = Object.entries(tech.prereq).map(([reqId, reqLevel]) => {
    const current = levels[reqId] ?? 0;
    return { id: reqId, nom: findTech(reqId)?.nom ?? reqId, requis: reqLevel, actuel: current, valide: current >= reqLevel, kind: "tech" };
  });
  for (const unitId of blueprintsRequiredBy(tech)) {
    const owned = ownedPlans.includes(unitId);
    list.push({ id: `plan:${unitId}`, nom: `Plan : ${BLUEPRINT_UNITS.get(unitId)}`, requis: 1, actuel: owned ? 1 : 0, valide: owned, kind: "plan" });
  }
  return { valid: list.every((r) => r.valide), list };
}

/** Bornes de la valeur par niveau, par type d'effet chiffré. */
const EFFECT_MAX_PER_LEVEL: Partial<Record<TechEffectType, number>> = {
  building_discount: 0.5,
  fleet_speed: 0.5,
  building_time: 0.5,
  unit_time: 0.5,
  research_time: 0.5,
  fleet_upkeep: 0.5,
  protected_storage: 0.5,
  counter_spy: 10,
  hangar_capacity: 0.5,
  stat: 0.5,
};

/** Erreurs d'un effet de techno (type, cible, valeur). */
export function validateTechEffect(
  label: string,
  e: TechEffectDef,
  refs: { resources: Set<string>; unitIds: Set<string>; buildingIds: Set<string>; maxLevel?: number; unitMaxLevel?: (id: string) => number | undefined },
): string[] {
  const errors: string[] = [];
  if (!(e.type in TECH_EFFECT_LABELS)) return [`${label} : effet « ${e.type} » inconnu.`];
  if (e.type === "resource_production" && (!e.target || !refs.resources.has(e.target))) errors.push(`${label} : ressource visée manquante ou inconnue.`);
  if (e.type === "hangar_capacity" && e.target !== "attack" && e.target !== "defense") errors.push(`${label} : hangar visé manquant (attaque ou défense).`);
  if (e.type === "unlock_next_level" && e.target && !refs.unitIds.has(e.target)) errors.push(`${label} : unité « ${e.target} » inexistante.`);
  for (const id of e.targets ?? []) if (!refs.buildingIds.has(id)) errors.push(`${label} : bâtiment « ${id} » inexistant.`);
  if (e.type === "stat") for (const m of validateComposedEffect(e as Partial<ComposedEffect>, (sel) => isUnitSelector(sel, (id) => refs.unitIds.has(id)))) errors.push(`${label} : ${m}.`);
  // 6.6 (revue AU1) : une techno d'attaque ou de défense ne dépasse pas +100 % à son niveau maximal.
  if ((e.type === "unit_attack" || e.type === "unit_defense") && refs.maxLevel !== undefined && effectValuePerLevel(e) * refs.maxLevel > TECH_COMBAT_LIMITS.perTechMax + 1e-9) {
    errors.push(`${label} : « ${TECH_EFFECT_LABELS[e.type]} » donnerait +${Math.round(effectValuePerLevel(e) * refs.maxLevel * 100)} % au niveau ${refs.maxLevel} (+${Math.round(TECH_COMBAT_LIMITS.perTechMax * 100)} % au plus).`);
  }
  // 6.6 (revue AU1, PNJ-2) : la techno ne monte pas une unité au-delà de son niveau maximal.
  if (e.type === "unlock_next_level" && e.target && refs.maxLevel !== undefined && refs.unitMaxLevel) {
    const unitMax = refs.unitMaxLevel(e.target);
    if (unitMax !== undefined && unitMax < refs.maxLevel) errors.push(`${label} : monte « ${e.target} » jusqu'au niveau ${refs.maxLevel}, mais l'unité s'arrête au niveau ${unitMax} (relève son niveau maximal).`);
  }
  if (e.value !== undefined) {
    const max = EFFECT_MAX_PER_LEVEL[e.type] ?? 5;
    if (!Number.isFinite(e.value) || e.value < 0 || e.value > max) errors.push(`${label} : valeur par niveau de « ${TECH_EFFECT_LABELS[e.type]} » entre 0 et ${max}.`);
  }
  return errors;
}

/** Résumé lisible d'un effet à un niveau donné (Labo, administration). */
export function describeTechEffect(e: TechEffectDef, level: number, names: { resource?: (id: string) => string; unit?: (id: string) => string; building?: (id: string) => string } = {}): string {
  const v = effectValuePerLevel(e) * level;
  const pct = (x: number) => `${Math.round(x * 1000) / 10} %`;
  const res = e.target ? (names.resource?.(e.target) ?? e.target) : "";
  switch (e.type) {
    case "energy_efficiency":
      return `+${pct(v)} de production de toutes les ressources`;
    case "resource_production":
      return `+${pct(v)} de production de ${res || "?"}`;
    case "unit_attack":
      return `+${pct(v)} d'attaque des unités`;
    case "unit_defense":
      return `+${pct(v)} de défense des unités`;
    case "building_discount":
      return `−${pct(Math.min(techEffectCap("building_discount"), v))} sur le coût des bâtiments`;
    case "storage_capacity":
      return `+${pct(v)} de capacité des entrepôts`;
    case "protected_storage":
      return `+${pct(v)} de l'entrepôt à l'abri du pillage`;
    case "fleet_speed":
      return `−${pct(Math.min(techEffectCap("fleet_speed"), v))} de temps de vol`;
    case "cargo_capacity":
      return `+${pct(v)} de cargaison`;
    case "building_time":
      return `−${pct(Math.min(techEffectCap("building_time"), v))} de temps de construction des bâtiments`;
    case "unit_time":
      return `−${pct(Math.min(techEffectCap("unit_time"), v))} de temps de construction des unités`;
    case "research_time":
      return `−${pct(Math.min(techEffectCap("research_time"), v))} de temps de recherche`;
    case "fleet_upkeep":
      return `−${pct(Math.min(techEffectCap("fleet_upkeep"), v))} d'entretien de la flotte`;
    case "counter_spy":
      return `+${Math.floor(v)} point(s) de contre-espionnage`;
    case "hangar_capacity":
      return `+${pct(v)} de capacité des hangars ${e.target === "defense" ? "de défense" : "d'attaque"}`;
    case "repair_speed":
      return `+${pct(v)} de cadence de l'Atelier`;
    case "stat":
      return e.stat ? describeEffect(e.stat, v, e.target, e.scope) : "Effet composé à régler";
    case "unlock_recipe":
      return `${level} recette(s) débloquée(s)`;
    case "unlock_buildings":
    case "unlock_hangars":
      return `Débloque ${(e.targets ?? []).map((id) => names.building?.(id) ?? id).join(", ") || "les bâtiments liés"}`;
    case "unlock_next_level":
      return `${e.target ? (names.unit?.(e.target) ?? e.target) : "Unité liée"} niveau ${level}`;
    default:
      return TECH_EFFECT_LABELS[e.type];
  }
}
