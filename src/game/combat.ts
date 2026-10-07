import { DEFENSIVE_UNITS, findUnit, KESH_HUNTER_UNIT, OFFENSIVE_UNITS, UNIT_BASE_STATS } from "@/game/units";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { techBonus } from "@/game/technologies";
import { unitClasses } from "@/game/unitClasses";
import type { Buildings, CombatLog, CombatLogUnit, CombatOutcome, ResourceId, TechLevels, Units } from "@/types/game";

/** Règles de combat réglables depuis l'administration. */
export const COMBAT_RULES = {
  /** 6.7.1 : plafond de l'attaque et de la défense données par les technos (1,5 = +150 %). */
  techCombatCap: 1.5,
  /** 6.7.1 : une techno, à son niveau maximal, au plus (1 = +100 %). */
  techCombatPerTechMax: 1,
  /** 6.7.1 : bonus du Traqueur Kesh contre tous les PNJ (0,5 = +50 %), en attaque comme en défense. */
  // Valeur littérale : lire une constante d'un autre module ici casse l'initialisation (import circulaire units ↔ combat dans le navigateur).
  keshPveBonus: 0.5,
  /** Part des ressources rares du défenseur pillée par un attaquant vainqueur. */
  lootPercent: 0.08,
  /** Part des ressources communes pillée (ferraille, énergie, nano, données), sur le stock exposé (hors abri).
   *  6.2 (lot M) : 0,1 → 0,3, le butin suit enfin le stock. */
  lootPercentCommon: 0.3,
  /** 6.2 (lot M) : au pillage, une flotte charge jusqu'à ce multiple de sa soute (surcharge). */
  lootCargoFactor: 2,
  /** 6.2 (lot M) : part maximale des vaisseaux détruits sauvés (Atelier, Cale orbitale, bonus). */
  repairCap: 0.85,
  /** 5.23 : part du butin emportée sur un match nul. */
  drawLootShare: 0.3,
  /** Bonus de puissance du défenseur, qui se bat chez lui. */
  homeDefenseBonus: 0.15,
  /** Bouclier du Hangar de défense : part de la puissance d'attaque absorbée par niveau… */
  shieldPerLevel: 0.0075,
  /** …plafonnée à cette valeur. */
  shieldMax: 0.15,
  /** Vaisseaux à quai : part engagée en défense (et exposée aux tirs).
   *  5.18 : 50 % par défaut (Riposte 100 %, Bunker 0 %). */
  homeFleetDefenseFactor: 0.5,
  /** Part des défenses détruites reconstruites gratuitement après le combat. */
  defenseRebuildPct: 0.6,
  /* v3.0 — formations d'attaque (choisies au lancement). */
  /** Assaut : attaque +10 %, pertes subies +15 %. */
  assaultAttack: 0.1,
  assaultLosses: 0.15,
  /** Prudente : attaque −10 %, pertes subies −25 %. */
  cautiousAttack: -0.1,
  cautiousLosses: -0.25,
  /** Raid : attaque −15 %, cargaison +30 %. */
  raidAttack: -0.15,
  raidCargo: 0.3,
  /* v3.0 — postures de la base (défenseur). */
  /** Bunker : défenses +8 %, vaisseaux à quai hors combat. */
  bunkerDefense: 0.08,
  /** Riposte : vaisseaux à quai engagés à 100 %. */
  riposteHomeFleet: 1,
  /** Délai entre deux changements de posture (h). */
  postureCooldownHours: 1,
  /* 5.18 — combat en tours. */
  /** Points de vie d'une unité = résistance × ce facteur. */
  hpPerResistance: 30,
  /** Nombre de tours au plus. */
  maxRounds: 8,
  /** L'attaquant décroche quand il a perdu cette part de ses points de vie… */
  retreatAt: 0.5,
  /** …ou celle-ci en formation Prudente. */
  cautiousRetreatAt: 0.3,
  /** L'attaquant l'emporte quand il reste au défenseur moins de cette part de ses points de vie. */
  attackerWinBelow: 0.2,
  /** Au dernier tour, l'attaquant l'emporte s'il garde au moins cette part de points de vie de plus que le défenseur. */
  timeoutWinMargin: 0.3,
  /** Ennemis PNJ (sans unités réelles) : points de vie relatifs à une flotte de même puissance. */
  pveHpFactor: 0.8,
  /* 5.20 — points de vie conservés entre les combats. */
  /** Part des PV perdus qui reste en dégâts sur les survivants (le reste détruit des unités). */
  hullDamageShare: 0.4,
  /** Une unité abîmée au-delà de cette part de ses PV est détruite. */
  hullMaxDamage: 0.9,
  /** Atelier de réparation : PV réparés par seconde au niveau 1, gain par niveau, et cadence sans Atelier. */
  workshopHpPerSec: 30,
  workshopLevelGain: 0.25,
  workshopBaseFactor: 0.2,
  /** 5.21 : seigneurs de guerre : part de leurs PV réparée par heure (0,08 : ≈ 12 h pour une coque à 0 %). */
  warlordHullRepairPerHour: 0.08,
  /** 5.21 : avantage de classe (Fort > Moyen > Faible > Fort) : dégâts +classEdge contre la classe battue, −classEdge contre celle qui bat. */
  classEdge: 0.2,
  /** 5.21 : cible prioritaire choisie au lancement : poids de la catégorie visée dans la répartition des tirs. */
  targetPriorityWeight: 3,
  /** 5.21 : Ambre pour terminer une réparation : 1 Ambre par tranche de ce nombre de secondes restantes. */
  workshopRushSecondsPerAmber: 600,
  /** 5.28 : Cale sèche : part du coût d'une unité rendue au démantèlement (palier Triage), contre 50 % à la revente au hangar. */
  dockScrapRefund: 0.6,
  /** 5.28 : Cale sèche : cadence de l'Atelier en plus à partir du palier 10. */
  dockAutoSpeedBonus: 0.1,
};

/** Bouclier planétaire du défenseur (Hangar de défense) : 0 → shieldMax. */
export function getShieldPercent(buildings: Buildings, allianceBonus = 0): number {
  let levels = 0;
  let extra = 0;
  for (const b of BUILDINGS) {
    if (b.effect?.type === "hangar" && b.effect.category === "defense") levels += effectiveBuildingLevel(buildings, b.id);
    // v3.6 : Générateur de bouclier planétaire, au-delà du plafond des hangars.
    if (b.effect?.type === "shield") extra += Math.min(b.effect.max, effectiveBuildingLevel(buildings, b.id) * b.effect.perLevel);
  }
  // Le Bouclier fédéral (alliance) s'ajoute et repousse d'autant le plafond.
  return Math.min(COMBAT_RULES.shieldMax + allianceBonus, levels * COMBAT_RULES.shieldPerLevel + allianceBonus) + extra;
}
const RARE_RESOURCES: ResourceId[] = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
const COMMON_RESOURCES: ResourceId[] = ["scrap", "energy", "nano", "data"];

/** Capacité de cargaison d'une flotte : cargaison de base × niveau × quantité. */
export function fleetCargoCapacity(units: Units, fleet: Record<string, number>, techLevels?: TechLevels): number {
  let total = 0;
  for (const [id, qty] of Object.entries(fleet)) {
    const def = findUnit(id);
    const level = units[id]?.level ?? 0;
    if (!def || qty <= 0 || level <= 0) continue;
    total += (def.stats.cargo ?? 0) * level * qty;
  }
  return Math.floor(total * (1 + techBonus(techLevels, "cargo_capacity")));
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function unitStat(units: Units, techLevels: TechLevels, unitId: string, stat: "attack" | "defense"): number {
  const def = UNIT_BASE_STATS[unitId];
  const base = def?.[stat] ?? 0;
  const level = units[unitId]?.level ?? 0;
  if (level <= 0) return 0;

  let value = base + (level - 1) * (def?.perLevel ?? 5);
  if (stat === "attack") value *= 1 + techBonus(techLevels, "unit_attack");
  if (stat === "defense") value *= 1 + techBonus(techLevels, "unit_defense");
  return value;
}

export function computeFleetPower(
  units: Units,
  techLevels: TechLevels,
  fleet: Record<string, number>,
  stats: ("attack" | "defense")[],
): number {
  let total = 0;
  for (const id in fleet) {
    const qty = fleet[id];
    if (qty <= 0) continue;
    let value = 0;
    stats.forEach((s) => (value += unitStat(units, techLevels, id, s)));
    total += value * qty;
  }
  return total;
}

/** 6.9.9 : contribution de chaque type de vaisseau à la puissance d'une flotte (décroissant).
 *  La somme des `power` vaut computeFleetPower(units, techLevels, fleet, stats). */
export function fleetPowerBreakdown(
  units: Units,
  techLevels: TechLevels,
  fleet: Record<string, number>,
  stats: ("attack" | "defense")[] = ["attack"],
): { id: string; count: number; power: number }[] {
  const rows: { id: string; count: number; power: number }[] = [];
  for (const id in fleet) {
    const count = fleet[id];
    if (!(count > 0)) continue;
    rows.push({ id, count, power: computeFleetPower(units, techLevels, { [id]: count }, stats) });
  }
  return rows.sort((a, b) => b.power - a.power || (a.id < b.id ? -1 : 1));
}

/** v3.9 : multiplicateur d'attaque d'une flotte contre des PNJ (Traqueurs Kesh). */
export function pveAttackFactor(units: Units, techLevels: TechLevels, fleet: Record<string, number>): number {
  const hunters = fleet[KESH_HUNTER_UNIT.id] ?? 0;
  if (!(hunters > 0)) return 1;
  const all = computeFleetPower(units, techLevels, fleet, ["attack"]);
  if (!(all > 0)) return 1;
  return 1 + (COMBAT_RULES.keshPveBonus * computeFleetPower(units, techLevels, { [KESH_HUNTER_UNIT.id]: hunters }, ["attack"])) / all;
}

/** v5.9 : en défense contre un PNJ (raid de menace, seigneur de guerre), les
 *  Traqueurs à quai gardent leur +50 % d'attaque dans la puissance défensive. */
export function pveHomeDefenseFactor(units: Units, techLevels: TechLevels, homeFleetFactor = COMBAT_RULES.homeFleetDefenseFactor, defenseFactor = 1): number {
  const hunters = units[KESH_HUNTER_UNIT.id]?.count ?? 0;
  if (!(hunters > 0)) return 1;
  const base = homeDefensePower(units, techLevels, homeFleetFactor, defenseFactor);
  if (!(base > 0)) return 1;
  const extra = COMBAT_RULES.keshPveBonus * computeFleetPower(units, techLevels, { [KESH_HUNTER_UNIT.id]: hunters }, ["attack"]) * homeFleetFactor * (1 + COMBAT_RULES.homeDefenseBonus);
  return 1 + extra / base;
}

export function computeFullPower(
  units: Units,
  techLevels: TechLevels,
  idList: string[],
  stats: ("attack" | "defense")[],
): number {
  let total = 0;
  idList.forEach((id) => {
    const count = units[id]?.count ?? 0;
    let value = 0;
    stats.forEach((s) => (value += unitStat(units, techLevels, id, s)));
    total += value * count;
  });
  return total;
}

/** Puissance défensive d'une base (défenses + vaisseaux à quai, bonus à domicile). */
export function homeDefensePower(units: Units, techLevels: TechLevels, homeFleetFactor = COMBAT_RULES.homeFleetDefenseFactor, defenseFactor = 1): number {
  return (
    (computeFullPower(units, techLevels, DEFENSIVE_UNITS, ["attack", "defense"]) * defenseFactor +
      computeFullPower(units, techLevels, OFFENSIVE_UNITS, ["attack", "defense"]) * homeFleetFactor) *
    (1 + COMBAT_RULES.homeDefenseBonus)
  );
}

export interface CombatResult {
  outcome: CombatOutcome;
  /** Puissances effectives (bouclier et bonus à domicile compris). */
  attackerPower: number;
  defenderPower: number;
  attackerLossPercent: number;
  defenderLossPercent: number;
  attackerLosses: Record<string, number>;
  attackerRecovered: Record<string, number>;
  defenderLosses: Record<string, number>;
  defenderRecovered: Record<string, number>;
  loot: Partial<Record<ResourceId, number>> | null;
  /** Cargaison disponible de la flotte survivante (limite du butin). */
  cargoCapacity: number;
  /** Part de l'attaque absorbée par le bouclier du défenseur. */
  shieldPercent?: number;
  /** Défenses du défenseur reconstruites gratuitement après le combat. */
  defenderRebuilt?: Record<string, number>;
  /** Pertes de chaque garnison alliée (même ordre qu'en entrée). */
  garrisonLosses?: Record<string, number>[];
  /** Puissance apportée par les garnisons (comprise dans defenderPower). */
  garrisonPower?: number;
  /** 5.20 : PV manquants par type d'unité après le combat (tout le stock du joueur), à reporter sur l'Atelier. */
  attackerHull?: Record<string, number>;
  defenderHull?: Record<string, number>;
  /** 5.18 : déroulé tour par tour, et retraite de l'attaquant. */
  rounds?: CombatRound[];
  retreated?: boolean;
  /** 5.21.1 : détail par type d'unité (rapport de combat). */
  units?: CombatLogUnit[];
  targetPriority?: TargetPriority;
  classBonus?: { attacker: number; defender: number };
}

/** Garnison alliée stationnée chez le défenseur (v1.9). */
export interface CombatGarrison {
  /** Unités du propriétaire (pour les niveaux) et ses technologies. */
  units: Units;
  techLevels: TechLevels;
  fleet: Record<string, number>;
}

/* =====================================================
   5.18 : combat en tours. Chaque unité a une attaque (dégâts par tour) et
   une résistance (points de vie = résistance × hpPerResistance). À chaque
   tour, les deux camps tirent en même temps : la flotte attaquante frappe
   les défenses et les vaisseaux à quai engagés, qui ripostent. Les dégâts
   se répartissent selon les points de vie de chaque type d'unité. Le
   bouclier planétaire réduit les dégâts reçus par le défenseur.
   L'attaquant décroche (retraite) après avoir perdu retreatAt de ses points
   de vie. Il l'emporte quand le défenseur tombe sous attackerWinBelow.
   Les ennemis PNJ (factions, primes, repaires, embuscades) n'ont pas
   d'unités : ils deviennent des unités fictives de même composition que la
   flotte d'en face, à la puissance indiquée.
===================================================== */

interface Stack {
  /** Identifiant de l'unité ("" : unité fictive d'un PNJ). */
  id: string;
  /** Propriétaire : "attacker", "defense", "home", ou garnison (index). */
  owner: "attacker" | "defense" | "home" | number;
  count: number;
  /** Nombre réel d'unités derrière la part engagée (vaisseaux à quai, garnisons). */
  realCount: number;
  att: number;
  hp: number;
  /** 5.20 : stock total du joueur pour ce type, dégâts déjà subis (en unités) et PV d'une unité (sans bonus). */
  owned: number;
  damaged: number;
  baseHp: number;
  /** 5.21 : classe de combat et avantage propre (unités fictives : aucune classe). */
  cls?: "light" | "medium" | "heavy";
  edge?: number;
  /** 5.21.1 : dégâts infligés et effectifs à la fin de chaque tour (rapport). */
  dealt?: number;
  trace?: number[];
}

/** 5.21 : Fort bat Moyen, Moyen bat Faible, Faible bat Fort (un essaim submerge un mastodonte). */
export const CLASS_BEATS: Record<"light" | "medium" | "heavy", "light" | "medium" | "heavy"> = { heavy: "medium", medium: "light", light: "heavy" };

/** Multiplicateur des dégâts d'une unité `s` sur une unité `t`. */
export function classFactor(s: Pick<Stack, "cls" | "edge">, t: Pick<Stack, "cls">): number {
  if (!s.cls || !t.cls) return 1;
  if (CLASS_BEATS[s.cls] === t.cls) return 1 + (s.edge ?? COMBAT_RULES.classEdge);
  if (CLASS_BEATS[t.cls] === s.cls) return Math.max(0, 1 - COMBAT_RULES.classEdge);
  return 1;
}

export type TargetPriority = "defenses" | "ships";

export interface CombatRound {
  /** Points de vie restants (part 0 → 1) à la fin du tour. */
  attackerHp: number;
  defenderHp: number;
  /** Dégâts infligés pendant le tour. */
  attackerDamage: number;
  defenderDamage: number;
}

const poolOf = (stacks: Stack[]) => stacks.reduce((s, t) => s + t.count * t.hp, 0);
const fireOf = (stacks: Stack[]) => stacks.reduce((s, t) => s + t.count * t.att, 0);

/**
 * 5.21 : une salve. Chaque unité répartit ses tirs sur les cibles au prorata de leurs PV
 * (pondérés par la cible prioritaire), avec l'avantage de classe. Rend les dégâts par cible
 * (appliqués ensuite, pour que les deux camps tirent en même temps).
 */
function volley(shooters: Stack[], targets: Stack[], factor: number, weight: (t: Stack) => number = () => 1, bonus?: { v: number }): number[] {
  const w = targets.map((t) => (t.count > 0 ? t.count * t.hp * weight(t) : 0));
  const total = w.reduce((a, b) => a + b, 0);
  const dmg = targets.map(() => 0);
  if (!(total > 0) || !(factor > 0)) return dmg;
  for (const s of shooters) {
    const fire = s.count * s.att * factor;
    if (!(fire > 0)) continue;
    for (let j = 0; j < targets.length; j++) {
      if (!(w[j] > 0)) continue;
      const base = fire * (w[j] / total);
      const k = classFactor(s, targets[j]);
      dmg[j] += base * k;
      // Dégâts plafonnés aux PV de la cible : la part au-delà ne compte pas comme infligée.
      s.dealt = (s.dealt ?? 0) + Math.min(base * k, targets[j].count * targets[j].hp);
      if (bonus) bonus.v += base * (k - 1);
    }
  }
  return dmg;
}

function applyDamage(targets: Stack[], dmg: number[]): number {
  let dealt = 0;
  targets.forEach((t, j) => {
    if (!(dmg[j] > 0) || t.count <= 0) return;
    dealt += dmg[j];
    t.count = Math.max(0, t.count - dmg[j] / t.hp);
  });
  return dealt;
}

/** PV d'une unité, sans bonus de combat (base des dégâts conservés). */
export function unitBaseHp(units: Units, techLevels: TechLevels, id: string): number {
  return Math.max(1, unitStat(units, techLevels, id, "defense")) * COMBAT_RULES.hpPerResistance;
}

/**
 * 5.20 : `hull` = PV manquants par type sur tout le stock du joueur (`owned` = ce stock ; défaut : les unités engagées).
 * Les dégâts se répartissent sur le stock : la part engagée se bat avec moins d'unités « valides ».
 */
function realStacks(units: Units, techLevels: TechLevels, fleet: Record<string, number>, owner: Stack["owner"], engaged = 1, factor = 1, hpFactor = factor, hull?: Record<string, number>, bonus?: UnitBonus): Stack[] {
  const out: Stack[] = [];
  const classes = unitClasses();
  for (const [id, qty] of Object.entries(fleet)) {
    if (!(qty > 0) || !(engaged > 0)) continue;
    // 5.23 : effets ciblés (reliques, technos, officiers) sur l'attaque et les PV de cette unité.
    const b = bonus?.[id];
    const att = unitStat(units, techLevels, id, "attack") * factor * (1 + Math.max(-0.9, b?.att ?? 0));
    const res = unitStat(units, techLevels, id, "defense");
    if (!(att > 0) && !(res > 0)) continue;
    const baseHp = Math.max(1, res) * COMBAT_RULES.hpPerResistance;
    const owned = Math.max(qty, units[id]?.count ?? 0);
    const damaged = Math.min(owned * COMBAT_RULES.hullMaxDamage, Math.max(0, (hull?.[id] ?? 0) / baseHp));
    const n = qty * engaged;
    const cls = classes[id];
    out.push({ id, owner, count: Math.max(0, n - (damaged * n) / owned), realCount: qty, att, hp: baseHp * hpFactor * (1 + Math.max(-0.9, b?.hp ?? 0)), owned, damaged, baseHp, ...(cls && cls !== "support" ? { cls, edge: findUnit(id)?.classEdge } : {}) });
  }
  return out;
}

/** 5.23 : bonus d'attaque et de PV par unité (voir effectTargets.ts : combatEffects). */
export type UnitBonus = Record<string, { att?: number; hp?: number }>;

/** Unités fictives d'un PNJ : même rapport attaque / points de vie que la flotte d'en face, à la puissance donnée. */
function virtualStacks(power: number, mirror: Stack[], owner: Stack["owner"], mirrorAttackFactor = 1): Stack[] {
  if (!(power > 0)) return [];
  // Rapport points de vie / attaque de base (hors bonus d'attaque) de la flotte d'en face.
  const att = fireOf(mirror) / Math.max(0.01, mirrorAttackFactor);
  const hpPerAtt = att > 0 ? poolOf(mirror) / att : COMBAT_RULES.hpPerResistance / 4;
  return [{ id: "", owner, count: 1, realCount: 0, att: power, hp: Math.max(1, power * hpPerAtt * COMBAT_RULES.pveHpFactor), owned: 0, damaged: 0, baseHp: 1 }];
}

/** Déroulé compact d'un combat, pour le rapport (points de vie au millième, dégâts arrondis). */
export function combatLogOf(result: Pick<CombatResult, "rounds" | "retreated" | "units" | "shieldPercent" | "targetPriority" | "classBonus">): CombatLog {
  return {
    ...(result.units?.length ? { units: result.units } : {}),
    ...(result.shieldPercent ? { shield: Math.round(result.shieldPercent * 1000) / 1000 } : {}),
    ...(result.targetPriority ? { targetPriority: result.targetPriority } : {}),
    ...(result.classBonus && (result.classBonus.attacker || result.classBonus.defender) ? { classBonus: result.classBonus } : {}),
    rounds: (result.rounds ?? []).map((r) => ({
      attackerHp: Math.round(r.attackerHp * 1000) / 1000,
      defenderHp: Math.round(r.defenderHp * 1000) / 1000,
      attackerDamage: Math.round(r.attackerDamage),
      defenderDamage: Math.round(r.defenderDamage),
    })),
    retreated: !!result.retreated,
  };
}

export function resolveCombat(params: {
  attackerUnits: Units;
  attackerTechLevels: TechLevels;
  attackerRepairPct: number;
  fleet: Record<string, number>;
  defenderUnits: Units;
  defenderTechLevels: TechLevels;
  defenderRepairPct: number;
  defenderResources: Partial<Record<ResourceId, number>>;
  /** Bouclier du défenseur (0 → 1), voir getShieldPercent : réduit les dégâts qu'il reçoit. */
  defenderShieldPct?: number;
  /** Multiplicateur du butin (événement « Guerre ouverte »). */
  lootMultiplier?: number;
  /** Garnisons alliées et part de leur puissance engagée. */
  garrisons?: CombatGarrison[];
  garrisonFactor?: number;
  /** Puissances imposées (PNJ : flotte sans unités réelles). */
  attackerPowerOverride?: number;
  defenderPowerOverride?: number;
  /** Part de la flotte à quai engagée (et touchée) ; défaut : règle de combat. */
  homeFleetFactor?: number;
  /** v3.0 : formation de l'attaquant et posture du défenseur (voir formations.ts). */
  attackFactor?: number;
  attackerLossFactor?: number;
  cargoFactor?: number;
  defenseFactor?: number;
  /** 5.18 : part des points de vie perdue à laquelle l'attaquant décroche. */
  retreatAt?: number;
  /** v4.0 : bonus de défense du joueur défenseur (officiers, reliques, carapace). */
  defenderPowerFactor?: number;
  /** 5.20 : PV manquants par type d'unité (stock entier) avant le combat. */
  attackerHull?: Record<string, number>;
  defenderHull?: Record<string, number>;
  /** 5.21 : cible prioritaire de l'attaquant (défenses ou vaisseaux à quai et garnisons). */
  targetPriority?: TargetPriority;
  /** 5.22 : avantage de classe d'un camp relevé (trait Fureur) ou annulé (Lame Écarlate). */
  classEdge?: { attacker?: { bonus?: number; cancel?: boolean }; defender?: { bonus?: number; cancel?: boolean } };
  /** 5.23 : effets ciblés par unité de chaque camp (les garnisons gardent les leurs, sans bonus). */
  unitBonus?: { attacker?: UnitBonus; defender?: UnitBonus };
}): CombatResult {
  const { attackerUnits, attackerTechLevels, attackerRepairPct, fleet, defenderUnits, defenderTechLevels, defenderRepairPct, defenderResources } = params;
  const R = COMBAT_RULES;
  const shield = Math.max(0, Math.min(0.95, params.defenderShieldPct ?? 0));
  const attackFactor = Math.max(0, params.attackFactor ?? 1);
  const lossFactor = Math.max(0, params.attackerLossFactor ?? 1);
  const defFactor = Math.max(0, params.defenderPowerFactor ?? 1);
  const homeFactor = params.homeFleetFactor ?? R.homeFleetDefenseFactor;
  const garrisons = params.garrisons ?? [];
  const garrisonFactor = params.garrisonFactor ?? 0.5;
  const retreatAt = Math.max(0.05, Math.min(1, params.retreatAt ?? R.retreatAt));

  // --- Camps ---
  let attacker = params.attackerPowerOverride === undefined ? realStacks(attackerUnits, attackerTechLevels, fleet, "attacker", 1, attackFactor, 1, params.attackerHull, params.unitBonus?.attacker) : [];
  const home = 1 + R.homeDefenseBonus;
  let defender: Stack[] = [];
  if (params.defenderPowerOverride === undefined) {
    const defenses = Object.fromEntries(DEFENSIVE_UNITS.map((id) => [id, defenderUnits[id]?.count ?? 0]));
    const ships = Object.fromEntries(OFFENSIVE_UNITS.map((id) => [id, defenderUnits[id]?.count ?? 0]));
    defender = [
      ...realStacks(defenderUnits, defenderTechLevels, defenses, "defense", 1, home * (params.defenseFactor ?? 1) * defFactor, undefined, params.defenderHull, params.unitBonus?.defender),
      ...realStacks(defenderUnits, defenderTechLevels, ships, "home", homeFactor, home * defFactor, undefined, params.defenderHull, params.unitBonus?.defender),
      ...garrisons.flatMap((g, i) => realStacks(g.units, g.techLevels, g.fleet, i, garrisonFactor, defFactor)),
    ];
  }
  if (params.attackerPowerOverride !== undefined) attacker = virtualStacks(params.attackerPowerOverride * attackFactor, defender, "attacker");
  if (params.defenderPowerOverride !== undefined) defender = virtualStacks(params.defenderPowerOverride * defFactor, attacker, "defense", attackFactor);

  // 5.22 : avantage de classe modifié par camp (les garnisons alliées gardent le leur).
  const edgeMod = (stacks: Stack[], m?: { bonus?: number; cancel?: boolean }, owners?: Stack["owner"][]) => {
    if (!m || (!m.cancel && !(m.bonus! > 0))) return;
    for (const t of stacks) {
      if (!t.cls || (owners && !owners.includes(t.owner))) continue;
      t.edge = m.cancel ? 0 : (t.edge ?? R.classEdge) + (m.bonus ?? 0);
    }
  };
  edgeMod(attacker, params.classEdge?.attacker);
  edgeMod(defender, params.classEdge?.defender, ["defense", "home"]);

  const attackerStart = attacker.map((t) => t.count);
  const defenderStart = defender.map((t) => t.count);
  const a0 = poolOf(attacker);
  const d0 = poolOf(defender);
  // Puissance affichée (rapports, XP) : attaque + résistance des forces engagées.
  const powerOf = (stacks: Stack[]) => stacks.reduce((s, t) => s + t.count * (t.att + t.hp / R.hpPerResistance), 0);
  const attackerPower = params.attackerPowerOverride !== undefined ? params.attackerPowerOverride * attackFactor : powerOf(attacker);
  const defenderPower = params.defenderPowerOverride !== undefined ? params.defenderPowerOverride * defFactor : powerOf(defender);
  const garrisonPower = defender.filter((t) => typeof t.owner === "number").reduce((s, t) => s + t.count * (t.att + t.hp / R.hpPerResistance), 0);

  // --- Tours ---
  const prio = params.targetPriority;
  const priorityWeight = (t: Stack) => (!prio ? 1 : (prio === "defenses") === (t.owner === "defense") ? Math.max(1, R.targetPriorityWeight) : 1);
  const rounds: CombatRound[] = [];
  const bonusA = { v: 0 };
  const bonusD = { v: 0 };
  let retreated = false;
  if (a0 > 0 && d0 > 0) {
    for (let r = 0; r < R.maxRounds; r++) {
      const onDefender = volley(attacker, defender, 1 - shield, priorityWeight, bonusA);
      const onAttacker = volley(defender, attacker, 1, undefined, bonusD);
      const dmgByAttacker = applyDamage(defender, onDefender);
      const dmgByDefender = applyDamage(attacker, onAttacker);
      for (const t of [...attacker, ...defender]) (t.trace ??= []).push(Math.round(t.count * 10) / 10);
      const aLeft = poolOf(attacker) / a0;
      const dLeft = poolOf(defender) / d0;
      rounds.push({ attackerHp: aLeft, defenderHp: dLeft, attackerDamage: dmgByAttacker, defenderDamage: dmgByDefender });
      if (aLeft <= 0.001 || dLeft <= 0.001) break;
      if (dLeft < R.attackerWinBelow) break;
      if (1 - aLeft >= retreatAt) {
        retreated = true;
        break;
      }
    }
  }
  const aLeft = a0 > 0 ? poolOf(attacker) / a0 : 0;
  const dLeft = d0 > 0 ? poolOf(defender) / d0 : 0;
  let outcome: CombatOutcome;
  if (!(a0 > 0)) outcome = d0 > 0 ? "defender_win" : "draw";
  // Une flotte sans attaque ne prend rien : égalité contre une base vide, défaite sinon.
  else if (!(fireOf(attacker) > 0) && attacker.every((t, i) => t.count === attackerStart[i])) outcome = d0 > 0 ? "defender_win" : "draw";
  else if (!(d0 > 0)) outcome = "attacker_win";
  else if (retreated || aLeft <= 0.001) outcome = "defender_win";
  else if (dLeft < R.attackerWinBelow) outcome = "attacker_win";
  // Fin des tours sans vainqueur net : un net avantage en points de vie restants suffit à l'attaquant.
  else if (aLeft - dLeft >= R.timeoutWinMargin) outcome = "attacker_win";
  else if (aLeft < dLeft) outcome = "defender_win";
  else outcome = "draw";

  // --- Pertes (unités entières, réparations comprises) ---
  // 5.20 : une part des PV perdus reste en dégâts sur les survivants (hullDamageShare) ; une unité
  // abîmée au-delà de hullMaxDamage est détruite. Les dégâts restants sont rendus par type (attackerHull…).
  const share = Math.max(0, Math.min(1, R.hullDamageShare));
  const maxDmg = Math.max(0, Math.min(0.99, R.hullMaxDamage));
  const settle = (t: Stack, start: number, factor = 1) => {
    const lost = Math.max(0, start - t.count) * factor;
    // Les dégâts déjà subis sont répartis sur tout le stock : une unité détruite emporte sa part
    // (il fallait moins de PV pour l'achever), le reste de l'usure demeure sur les survivantes.
    const prior = t.owned > 0 ? Math.min(maxDmg, t.damaged / t.owned) : 0;
    let destroyed = (lost * (1 - share)) / (1 - prior);
    let damaged = t.damaged - destroyed * prior + lost * share;
    const over = damaged - maxDmg * (t.owned - destroyed);
    if (over > 0) {
      const k = over / (1 - maxDmg);
      destroyed += k;
      damaged -= k;
    }
    const whole = Math.max(0, Math.min(t.realCount, Math.round(destroyed)));
    damaged = Math.max(0, Math.min(maxDmg * Math.max(0, t.owned - whole), damaged + (destroyed - whole)));
    return { destroyed: whole, hull: Math.round(damaged * t.baseHp) };
  };
  const attackerHull: Record<string, number> = {};
  const defenderHull: Record<string, number> = {};
  const lostOf = (stack: Stack, start: number) => settle(stack, start).destroyed;
  const attackerLosses: Record<string, number> = {};
  const attackerRecovered: Record<string, number> = {};
  // Formations : le facteur de pertes s'applique aux pertes de l'attaquant après la bataille.
  attacker.forEach((t, i) => {
    if (!t.id) return;
    const settled = settle(t, attackerStart[i], lossFactor);
    attackerHull[t.id] = settled.hull;
    const rawLost = Math.min(fleet[t.id] ?? 0, settled.destroyed);
    if (rawLost <= 0) return;
    const recovered = Math.floor(rawLost * attackerRepairPct);
    attackerLosses[t.id] = rawLost - recovered;
    attackerRecovered[t.id] = recovered;
  });
  const defenderLosses: Record<string, number> = {};
  const defenderRecovered: Record<string, number> = {};
  const defenderRebuilt: Record<string, number> = {};
  const garrisonLosses: Record<string, number>[] = garrisons.map(() => ({}));
  defender.forEach((t, i) => {
    if (!t.id) return;
    if (typeof t.owner !== "number") {
      const settled = settle(t, defenderStart[i]);
      defenderHull[t.id] = settled.hull;
    }
    const rawLost = lostOf(t, defenderStart[i]);
    if (rawLost <= 0) return;
    if (typeof t.owner === "number") {
      garrisonLosses[t.owner][t.id] = Math.min(garrisons[t.owner].fleet[t.id] ?? 0, rawLost);
      return;
    }
    const isDefense = t.owner === "defense";
    const recovered = Math.floor(rawLost * (isDefense ? R.defenseRebuildPct : defenderRepairPct));
    defenderLosses[t.id] = rawLost - recovered;
    defenderRecovered[t.id] = recovered;
    if (isDefense && recovered > 0) defenderRebuilt[t.id] = recovered;
  });

  // Butin : une part des ressources du défenseur, dans la limite de ce que
  // la flotte survivante peut transporter (réduit proportionnellement).
  const survivors: Record<string, number> = {};
  // 5.20 : les unités sauvées par l'Atelier partent en réparation, elles ne portent pas de butin.
  for (const [unitId, sent] of Object.entries(fleet)) survivors[unitId] = Math.max(0, sent - (attackerLosses[unitId] ?? 0) - (attackerRecovered[unitId] ?? 0));
  // 6.2 (lot M) : surcharge de pillage (COMBAT_RULES.lootCargoFactor).
  const cargoCapacity = Math.floor(fleetCargoCapacity(attackerUnits, survivors, attackerTechLevels) * (params.cargoFactor ?? 1) * Math.max(1, R.lootCargoFactor ?? 1));
  let loot: Partial<Record<ResourceId, number>> | null = null;
  // 5.23 : un match nul rapporte une part du butin (drawLootShare).
  if (outcome === "attacker_win" || (outcome === "draw" && R.drawLootShare > 0)) {
    const wanted: Partial<Record<ResourceId, number>> = {};
    let total = 0;
    const share = outcome === "draw" ? R.drawLootShare : 1;
    for (const res of [...COMMON_RESOURCES, ...RARE_RESOURCES]) {
      const base = RARE_RESOURCES.includes(res) ? R.lootPercent : R.lootPercentCommon;
      const pct = Math.min(1, base * share * (params.lootMultiplier ?? 1));
      const amount = Math.floor(Math.max(0, defenderResources[res] ?? 0) * pct);
      wanted[res] = amount;
      total += amount;
    }
    const ratio = total > cargoCapacity ? cargoCapacity / total : 1;
    loot = {};
    const entries = Object.entries(wanted) as [ResourceId, number][];
    for (const [res, amount] of entries) loot[res] = Math.floor(amount * ratio);
    // Arrondis : le reste de la cale va aux ressources les plus proches de
    // l'unité suivante, pour qu'une petite flotte ne reparte pas à vide.
    let left = Math.min(total, Math.floor(cargoCapacity)) - entries.reduce((s, [res]) => s + (loot![res] ?? 0), 0);
    const byRemainder = entries
      .map(([res, amount]) => ({ res, frac: amount * ratio - Math.floor(amount * ratio) }))
      .sort((a, b) => b.frac - a.frac);
    for (const { res } of byRemainder) {
      if (left <= 0) break;
      if ((loot[res] ?? 0) < (wanted[res] ?? 0)) {
        loot[res] = (loot[res] ?? 0) + 1;
        left--;
      }
    }
  }

  // 5.21.1 : détail par type d'unité pour le rapport (garnisons fusionnées par type).
  const unitLog: CombatLogUnit[] = [];
  const logStack = (t: Stack, start: number, side: CombatLogUnit["side"], factor = 1) => {
    const group: CombatLogUnit["group"] = side === "attacker" ? "fleet" : typeof t.owner === "number" ? "garrison" : t.owner === "defense" ? "defense" : "home";
    const left = (t.trace ?? []).map((n) => Math.round(Math.max(0, start - (start - n) * factor) * 10) / 10);
    const prev = unitLog.find((u) => u.side === side && u.group === group && u.id === t.id);
    if (prev) {
      prev.start = Math.round((prev.start + start) * 10) / 10;
      prev.left = prev.left.map((n, k) => Math.round((n + (left[k] ?? 0)) * 10) / 10);
      prev.dealt = Math.round(prev.dealt + (t.dealt ?? 0));
      return;
    }
    const entry: CombatLogUnit = { id: t.id, side, group, start: Math.round(start * 10) / 10, left, dealt: Math.round(t.dealt ?? 0), ...(t.cls ? { cls: t.cls } : {}) };
    if (t.id && t.owned > 0 && group !== "garrison") {
      const settled = settle(t, start, factor);
      const keep = Math.max(1, t.owned - settled.destroyed);
      entry.hullBefore = Math.round((1 - Math.min(maxDmg, t.damaged / t.owned)) * 1000) / 1000;
      entry.hullAfter = Math.round(Math.max(0, 1 - settled.hull / (keep * t.baseHp)) * 1000) / 1000;
    }
    unitLog.push(entry);
  };
  attacker.forEach((t, i) => logStack(t, attackerStart[i], "attacker", lossFactor));
  defender.forEach((t, i) => logStack(t, defenderStart[i], "defender"));

  return {
    outcome,
    attackerPower,
    defenderPower,
    attackerLossPercent: a0 > 0 ? clamp((1 - aLeft) * lossFactor, 0, 1) : 0,
    defenderLossPercent: d0 > 0 ? clamp(1 - dLeft, 0, 1) : 0,
    attackerLosses,
    attackerRecovered,
    defenderLosses,
    defenderRecovered,
    loot,
    cargoCapacity,
    shieldPercent: shield,
    defenderRebuilt,
    garrisonLosses,
    garrisonPower,
    rounds,
    retreated,
    attackerHull,
    defenderHull,
    units: unitLog,
    ...(params.targetPriority ? { targetPriority: params.targetPriority } : {}),
    classBonus: { attacker: Math.round(bonusA.v), defender: Math.round(bonusD.v) },
  };
}
