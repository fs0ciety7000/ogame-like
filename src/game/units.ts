import { empireEffects, playerModifiers } from "@/game/modifiers";
import { unitEffect } from "@/game/effectTargets";
import type { UnitCategory } from "@/types/game";
import type { EmpireClassId } from "@/game/empireClass";
import { BLUEPRINT_UNITS, techEffectGrants, techReductionFactor } from "@/game/technologies";

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
  /** Attaque et défense gagnées par niveau au-delà du premier (défaut : UNIT_LEVEL_BONUS_DEFAULT). */
  levelBonus?: number;
  /** v3.9 : débloquée par un plan du Comptoir Kesh'Vaar (pas de techno). */
  blueprint?: boolean;
  /** 5.21 : classe de combat imposée (sinon, tiers de valeur de combat dans sa catégorie). */
  combatClass?: "light" | "medium" | "heavy";
  /** 5.21 : avantage de classe propre à l'unité (sinon COMBAT_RULES.classEdge). */
  classEdge?: number;
  /** 5.21 : PV par seconde ajoutés à l'Atelier par unité à quai (vaisseau-atelier). */
  workshopHpPerSec?: number;
  /** 5.22 : unité d'élite qui contre le trait d'une personnalité de seigneur (voir eliteUnits.ts). */
  elite?: "opportunist" | "builder" | "aggressive";
  /** 6.5 : vaisseau de classe, constructible seulement dans cette classe d'empire (voir classUnits.ts). */
  empireClass?: EmpireClassId;
  /** 6.5 : technologie de référence d'un vaisseau de classe : son niveau suit celui de la techno. */
  classTech?: string;
}

/** v3.9 : vaisseau des Kesh'Vaar, plan acheté au Comptoir de la Ruche.
 *  Toujours présent, même si la liste des unités est personnalisée. */
export const KESH_HUNTER_UNIT: UnitDef = {
  id: "traqueur_kesh",
  name: "Traqueur Kesh",
  image: "/assets/units/traqueur_kesh.webp",
  maxLevel: 1,
  description: "Chasseur organique des Kesh'Vaar, coque de chitine ambrée. Rapide, et redoutable contre tous les PNJ : +50 % d'attaque contre les seigneurs de guerre, les menaces, les primes, les boss et le Léviathan, en attaque comme en défense.",
  // 5.18 : 6 000/3 000 et 25 places → 3 000/1 500 et 3 places (l'audit du combat en tours le
  // plaçait à 0,3 × la norme par coût et 0,1 × par place, même avec son bonus contre les PNJ).
  cost: { scrap: 3000, energy: 1500 },
  stats: { attaque: 420, defense: 90, vitesse: 12, cargo: 20 },
  category: "attack",
  unlockTech: "",
  hangarSpace: 3,
  blueprint: true,
};

/** 5.22 : unités d'élite, contre les seigneurs de guerre seulement. Toujours présentes (comme le Traqueur),
 *  débloquées par un Labo complet et une vendetta gagnée contre la personnalité visée. */
export const ELITE_UNITS: UnitDef[] = [
  {
    id: "chasse_fantome",
    name: "Chasse-Fantôme",
    image: "/assets/units/chasse_fantome.webp",
    maxLevel: 1,
    description: "Traqueur furtif à brouilleur de sillage. Contre les seigneurs opportunistes : leur flotte ne peut plus esquiver tes attaques, et ils ne peuvent plus décrocher quand ils t'attaquent. Ne combat que les seigneurs de guerre.",
    cost: { scrap: 12000, energy: 8000 },
    stats: { attaque: 1000, defense: 600, vitesse: 14, cargo: 50 },
    category: "attack",
    unlockTech: "",
    hangarSpace: 6,
    combatClass: "light",
    elite: "opportunist",
  },
  {
    id: "brise_rempart",
    name: "Brise-Rempart",
    image: "/assets/units/brise_rempart.webp",
    maxLevel: 1,
    description: "Bélier de siège à lance à antimatière. Contre les seigneurs bâtisseurs : leur bouclier planétaire est ignoré et leurs défenses perdent leur bonus. Ne combat que les seigneurs de guerre.",
    cost: { scrap: 14000, energy: 9000 },
    stats: { attaque: 1400, defense: 1800, vitesse: 3, cargo: 100 },
    category: "attack",
    unlockTech: "",
    hangarSpace: 11,
    combatClass: "heavy",
    elite: "builder",
  },
  {
    id: "lame_ecarlate",
    name: "Lame Écarlate",
    image: "/assets/units/lame_ecarlate.webp",
    maxLevel: 1,
    description: "Croiseur duelliste à coque écarlate. Contre les seigneurs agressifs : leurs unités perdent leur avantage de classe, en attaque comme en défense. Ne combat que les seigneurs de guerre.",
    cost: { scrap: 16000, energy: 10000 },
    stats: { attaque: 1500, defense: 1000, vitesse: 8, cargo: 80 },
    category: "attack",
    unlockTech: "",
    hangarSpace: 8,
    combatClass: "medium",
    elite: "aggressive",
  },
];

export const ELITE_UNIT_IDS = ELITE_UNITS.map((u) => u.id);

/** 6.5 (lot P, proposals/unites-classe.md) : un vaisseau par classe d'empire. Toujours présents (comme les
 *  unités d'élite) ; leur niveau suit la technologie de référence (`classTech`), pas `unlockTech`, pour ne pas
 *  détourner le déblocage de l'unité d'origine de cette techno. */
export const CLASS_UNITS: UnitDef[] = [
  {
    id: "recolteur",
    name: "Récolteur",
    image: "/assets/units/recolteur.webp",
    maxLevel: 10,
    description: "Vaisseau-usine de l'Industriel : 80 de soute par place, et il recycle les champs de débris avec 25 % de capacité en plus. Réservé à la classe Industriel.",
    cost: { scrap: 2500, energy: 1000 },
    stats: { attaque: 40, defense: 60, vitesse: 4, cargo: 160 },
    category: "attack",
    unlockTech: "",
    hangarSpace: 2,
    empireClass: "industriel",
    classTech: "tech9",
  },
  {
    id: "croiseur_raid",
    name: "Croiseur de raid",
    image: "/assets/units/croiseur_raid.webp",
    maxLevel: 10,
    description: "Prédateur du Seigneur de guerre : frappe comme un chasseur et emporte 90 de butin (180 au pillage), sans escorte de cargos. Réservé à la classe Seigneur de guerre.",
    cost: { scrap: 6000, energy: 3500 },
    stats: { attaque: 600, defense: 150, vitesse: 9, cargo: 90 },
    category: "attack",
    unlockTech: "",
    hangarSpace: 5,
    empireClass: "seigneur",
    classTech: "tech13",
  },
  {
    id: "eclaireur_lointain",
    name: "Éclaireur lointain",
    image: "/assets/units/eclaireur_lointain.webp",
    maxLevel: 10,
    description: "Le vaisseau le plus rapide du jeu. Une expédition qui en emmène au moins un dure 15 % de moins. Réservé à la classe Explorateur.",
    cost: { scrap: 1500, energy: 1000 },
    stats: { attaque: 60, defense: 40, vitesse: 24, cargo: 30 },
    category: "attack",
    unlockTech: "",
    hangarSpace: 1,
    empireClass: "explorateur",
    classTech: "tech20",
  },
];

export const CLASS_UNIT_IDS = CLASS_UNITS.map((u) => u.id);

export function isEliteUnit(id: string): boolean {
  return ELITE_UNIT_IDS.includes(id);
}

/** v5.9 : unités dont le joueur possède le plan (prérequis des technos qui les améliorent). */
export function ownedBlueprints(player: { bounties?: { owned?: string[] } }): string[] {
  return player.bounties?.owned?.includes("blueprint") ? [KESH_HUNTER_UNIT.id] : [];
}

/** Bonus d'attaque du Traqueur contre les PNJ (seigneurs, menaces, primes, boss, Léviathan), en attaque comme en défense. */
export const KESH_PVE_BONUS = 0.5;

/** Gain d'attaque et de défense par niveau, pour les unités qui n'en précisent pas. */
export const UNIT_LEVEL_BONUS_DEFAULT = 5;

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
    // v5.4 : 20 places (29 ATK/place, dix fois moins que les autres) → 2.
    hangarSpace: 2,
  },
  {
    id: "etoile_noire",
    name: "Étoile Noire",
    image: "/assets/units/etoile_noire.webp",
    maxLevel: 10,
    description: "Arme ultime. Capacité de destruction massive.",
    cost: { scrap: 50000, energy: 30000 },
    // 5.18 : 500 → 4 000 au niveau 1 (elle valait moins qu'un Croiseur Nova), +900 par niveau
    // au lieu de +1 700 (12 100 au niveau 10 au lieu de 15 800) : au niveau des meilleures unités par place.
    stats: { attaque: 4000, defense: 4000, vitesse: 1, cargo: 1000 },
    category: "attack",
    unlockTech: "tech19",
    // v5.4 : 200 → 80 places.
    hangarSpace: 80,
    levelBonus: 900,
  },
  // v3.6 : unités de fin de partie.
  {
    id: "croiseur_nova",
    name: "Croiseur Nova",
    image: "/assets/units/croiseur_nova.webp",
    maxLevel: 10,
    description: "Croiseur de ligne propulsé par un cœur d'antimatière. Assez rapide pour frapper, assez blindé pour encaisser.",
    cost: { scrap: 15000, energy: 9000 },
    stats: { attaque: 1500, defense: 1000, vitesse: 6, cargo: 300 },
    category: "attack",
    unlockTech: "tech24",
    hangarSpace: 20,
    levelBonus: 250,
  },
  {
    id: "lance_gravitationnelle",
    name: "Lance gravitationnelle",
    image: "/assets/units/lance_gravitationnelle.webp",
    maxLevel: 10,
    description: "Projecteur orbital qui écrase les coques ennemies sous un puits de gravité.",
    cost: { scrap: 18000, energy: 12000 },
    stats: { attaque: 600, defense: 1200, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech25",
    // v5.4 : 8 → 12 places (1 189 ATK+DEF/place, 2,4 fois la Batterie AA) : aligné sur l'Étoile Noire.
    hangarSpace: 12,
    levelBonus: 150,
  },
  {
    id: "roquette",
    name: "Roquette",
    image: "/assets/units/roquette.webp",
    maxLevel: 10,
    description: "Arme simple mais efficace pour saturer une zone.",
    cost: { scrap: 200, energy: 100 },
    // 5.18 : 60/0 → 25/3 : 200 d'attaque par 1 000 ressources, quatre fois les autres défenses.
    stats: { attaque: 25, defense: 3, vitesse: 0, cargo: 0 },
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
    // v5.4 : moins cher que la Batterie AA, qu'il ne bat pas (2000/1200 avant).
    cost: { scrap: 1200, energy: 600 },
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
    // v5.4 : entre le Canon à impulsion et la Batterie AA (2500/1500 avant).
    cost: { scrap: 1500, energy: 750 },
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
    // 6.4 (constat C4) : une défense ne vole pas ; vitesse et soute, jamais utilisées, passent à 0.
    // Sans elles, elle était dominée par la Batterie AA : attaque 255 → 320, défense 60 → 80 (503 par place contre 492).
    description: "Tourelle d'interception à tir rapide : elle abat en priorité les vaisseaux qui attaquent ta planète.",
    cost: { scrap: 2000, energy: 1200 },
    stats: { attaque: 320, defense: 80, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech18",
    // v5.4 : 20 places → 2 (aligné sur la Batterie AA par place).
    hangarSpace: 2,
  },
  // 5.21 : trois rôles qui manquaient au combat en tours.
  {
    id: "bastion",
    name: "Bastion",
    image: "/assets/units/bastion.webp",
    maxLevel: 10,
    description: "Vaisseau-forteresse au blindage démesuré. Elle tire peu mais encaisse pour toute la flotte : ses PV énormes absorbent une grosse part des tirs. Classe Fort.",
    cost: { scrap: 9000, energy: 5000 },
    stats: { attaque: 150, defense: 1400, vitesse: 2, cargo: 100 },
    category: "attack",
    unlockTech: "tech28",
    hangarSpace: 12,
    levelBonus: 120,
    combatClass: "heavy",
  },
  {
    id: "batterie_essaim",
    name: "Batterie anti-essaim",
    image: "/assets/units/batterie_essaim.webp",
    maxLevel: 10,
    description: "Tourelles à fragmentation qui hachent les nuées de petits vaisseaux : avantage doublé contre les unités de classe Faible (essaims de chasseurs, drones, roquettes).",
    cost: { scrap: 1000, energy: 500 },
    stats: { attaque: 45, defense: 12, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech29",
    hangarSpace: 1,
    combatClass: "medium",
    classEdge: 0.4,
  },
  {
    id: "vaisseau_atelier",
    name: "Vaisseau-atelier",
    image: "/assets/units/vaisseau_atelier.webp",
    maxLevel: 10,
    description: "Cale de réparation mobile. À quai, chaque Vaisseau-atelier ajoute 15 PV/s à l'Atelier de réparation (avant les bonus de cadence). Ne combat pas.",
    cost: { scrap: 4000, energy: 2500 },
    stats: { attaque: 0, defense: 300, vitesse: 3, cargo: 200 },
    category: "attack",
    unlockTech: "tech30",
    hangarSpace: 4,
    workshopHpPerSec: 15,
  },
  KESH_HUNTER_UNIT,
  ...ELITE_UNITS,
  ...CLASS_UNITS,
];

/* ---------- registre courant (remplacé par applyGameContent) ---------- */

export const UNITS: UnitDef[] = [];
/** Stats de combat de base, dérivées des fiches (plus de double saisie). */
export const UNIT_BASE_STATS: Record<string, { attack: number; defense: number; perLevel: number }> = {};
/** Technologie qui débloque/améliore chaque unité. */
export const UNIT_TO_TECH: Record<string, string> = {};
export const OFFENSIVE_UNITS: string[] = [];
export const DEFENSIVE_UNITS: string[] = [];

export function setUnits(defs: UnitDef[]) {
  UNITS.splice(0, UNITS.length, ...defs);
  for (const key of Object.keys(UNIT_BASE_STATS)) delete UNIT_BASE_STATS[key];
  for (const key of Object.keys(UNIT_TO_TECH)) delete UNIT_TO_TECH[key];
  BLUEPRINT_UNITS.clear();
  for (const u of defs) {
    if (u.blueprint) BLUEPRINT_UNITS.set(u.id, u.name);
    UNIT_BASE_STATS[u.id] = { attack: u.stats.attaque, defense: u.stats.defense, perLevel: unitLevelBonus(u) };
    if (u.unlockTech) UNIT_TO_TECH[u.id] = u.unlockTech;
  }
  OFFENSIVE_UNITS.splice(0, OFFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "attack").map((u) => u.id));
  DEFENSIVE_UNITS.splice(0, DEFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "defense").map((u) => u.id));
}
setUnits(DEFAULT_UNITS);

export function unitLevelBonus(u: Pick<UnitDef, "levelBonus">): number {
  return typeof u.levelBonus === "number" && Number.isFinite(u.levelBonus) && u.levelBonus >= 0 ? u.levelBonus : UNIT_LEVEL_BONUS_DEFAULT;
}

export function findUnit(id: string): UnitDef | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getUnitBuildTime(unit: UnitDef, techLevels?: Record<string, number>, player?: Parameters<typeof playerModifiers>[0]): number {
  const total = (unit.cost.scrap || 0) + (unit.cost.energy || 0);
  const base = unit.buildTime && unit.buildTime > 0 ? unit.buildTime : Math.max(3, Math.ceil(total / 100));
  // v2.6 : réduction des technos « temps de construction des unités » ;
  // v5.14 : puis le Mécanicien en poste (couche empire du circuit d'effets).
  // 5.23 : puis les réductions ciblées (cette unité, sa classe ou sa catégorie).
  const targeted = player || techLevels ? 1 - unitEffect([...techEffectGrants(techLevels), ...(player ? empireEffects(player) : [])], "unitBuildTime", unit.id) : 1;
  const empire = (player ? 1 - playerModifiers(player).unitTime : 1) * targeted;
  return techLevels || empire !== 1 ? Math.max(1, Math.round(base * techReductionFactor(techLevels, "unit_time") * empire)) : base;
}
