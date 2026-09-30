import { DEFENSIVE_UNITS, findUnit, OFFENSIVE_UNITS, UNIT_BASE_STATS } from "@/game/units";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { techBonus } from "@/game/technologies";
import type { Buildings, CombatOutcome, ResourceId, TechLevels, Units } from "@/types/game";

/** Règles de combat réglables depuis l'administration. */
export const COMBAT_RULES = {
  /** Part des ressources rares du défenseur pillée par un attaquant vainqueur. */
  lootPercent: 0.08,
  /** Part des ressources communes pillée (ferraille, énergie, nano, données). */
  lootPercentCommon: 0.1,
  /** Bonus de puissance du défenseur, qui se bat chez lui. */
  homeDefenseBonus: 0.15,
  /** Bouclier du Hangar de défense : part de la puissance d'attaque absorbée par niveau… */
  shieldPerLevel: 0.0075,
  /** …plafonnée à cette valeur. */
  shieldMax: 0.15,
  /** Vaisseaux à quai : ils soutiennent la défense avec cette part de leur
   *  puissance, et subissent la même part des pertes. Réglé pour viser
   *  55–60 % de victoires attaquantes (simulation sur les combats réels). */
  homeFleetDefenseFactor: 0.1,
  /** Part des défenses détruites reconstruites gratuitement après le combat. */
  defenseRebuildPct: 0.6,
};

/** Bouclier planétaire du défenseur (Hangar de défense) : 0 → shieldMax. */
export function getShieldPercent(buildings: Buildings, allianceBonus = 0): number {
  let levels = 0;
  for (const b of BUILDINGS) {
    if (b.effect?.type === "hangar" && b.effect.category === "defense") levels += effectiveBuildingLevel(buildings, b.id);
  }
  // Le Bouclier fédéral (alliance) s'ajoute et repousse d'autant le plafond.
  return Math.min(COMBAT_RULES.shieldMax + allianceBonus, levels * COMBAT_RULES.shieldPerLevel + allianceBonus);
}
const RARE_RESOURCES: ResourceId[] = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
const COMMON_RESOURCES: ResourceId[] = ["scrap", "energy", "nano", "data"];

/** Capacité de cargaison d'une flotte : cargaison de base × niveau × quantité. */
export function fleetCargoCapacity(units: Units, fleet: Record<string, number>): number {
  let total = 0;
  for (const [id, qty] of Object.entries(fleet)) {
    const def = findUnit(id);
    const level = units[id]?.level ?? 0;
    if (!def || qty <= 0 || level <= 0) continue;
    total += (def.stats.cargo ?? 0) * level * qty;
  }
  return total;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function unitStat(units: Units, techLevels: TechLevels, unitId: string, stat: "attack" | "defense"): number {
  const base = UNIT_BASE_STATS[unitId]?.[stat] ?? 0;
  const level = units[unitId]?.level ?? 0;
  if (level <= 0) return 0;

  let value = base + (level - 1) * 5;
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
}

/** Garnison alliée stationnée chez le défenseur (v1.9). */
export interface CombatGarrison {
  /** Unités du propriétaire (pour les niveaux) et ses technologies. */
  units: Units;
  techLevels: TechLevels;
  fleet: Record<string, number>;
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
  /** Bouclier du défenseur (0 → 1), voir getShieldPercent. */
  defenderShieldPct?: number;
  /** Multiplicateur du butin (événement « Guerre ouverte »). */
  lootMultiplier?: number;
  /** Garnisons alliées et part de leur puissance engagée. */
  garrisons?: CombatGarrison[];
  garrisonFactor?: number;
}): CombatResult {
  const { attackerUnits, attackerTechLevels, attackerRepairPct, fleet, defenderUnits, defenderTechLevels, defenderRepairPct, defenderResources } = params;
  const shield = Math.max(0, Math.min(0.95, params.defenderShieldPct ?? 0));

  // Le bouclier absorbe une part de l'attaque ; le défenseur, chez lui, se
  // bat avec ses défenses ET ses vaisseaux à quai (ceux en vol n'y sont plus).
  const attackerPower = computeFleetPower(attackerUnits, attackerTechLevels, fleet, ["attack"]) * (1 - shield);
  const garrisons = params.garrisons ?? [];
  const garrisonFactor = params.garrisonFactor ?? 0.5;
  const garrisonPower = garrisons.reduce((sum, g) => sum + computeFleetPower(g.units, g.techLevels, g.fleet, ["attack", "defense"]) * garrisonFactor, 0);
  const defenderPower =
    (computeFullPower(defenderUnits, defenderTechLevels, DEFENSIVE_UNITS, ["attack", "defense"]) +
      computeFullPower(defenderUnits, defenderTechLevels, OFFENSIVE_UNITS, ["attack", "defense"]) * COMBAT_RULES.homeFleetDefenseFactor) *
      (1 + COMBAT_RULES.homeDefenseBonus) +
    garrisonPower;

  const totalPower = attackerPower + defenderPower;
  const diffRatio = totalPower > 0 ? Math.abs(attackerPower - defenderPower) / totalPower : 0;

  let outcome: CombatOutcome;
  if (attackerPower > defenderPower) outcome = "attacker_win";
  else if (attackerPower < defenderPower) outcome = "defender_win";
  else outcome = "draw";

  const winnerLossPct = clamp(0.3 * (1 - diffRatio), 0.05, 0.3);
  const loserLossPct = clamp(0.3 + 0.4 * diffRatio, 0.3, 0.7);

  let attackerLossPct: number, defenderLossPct: number;
  if (outcome === "attacker_win") {
    attackerLossPct = winnerLossPct;
    defenderLossPct = loserLossPct;
  } else if (outcome === "defender_win") {
    attackerLossPct = loserLossPct;
    defenderLossPct = winnerLossPct;
  } else {
    attackerLossPct = 0.3;
    defenderLossPct = 0.3;
  }

  // Chaque camp ne peut pas détruire plus que sa propre puissance : sans ce
  // plafond, une attaque à 1 drone faisait perdre 5 % de TOUTE la défense
  // adverse (pertes minimales du vainqueur) sans rien coûter à l'attaquant.
  if (attackerPower > 0) attackerLossPct = Math.min(attackerLossPct, defenderPower / attackerPower);
  if (defenderPower > 0) defenderLossPct = Math.min(defenderLossPct, attackerPower / defenderPower);

  const attackerLosses: Record<string, number> = {};
  const attackerRecovered: Record<string, number> = {};
  for (const unitId in fleet) {
    const sent = fleet[unitId];
    const rawLost = Math.floor(sent * attackerLossPct);
    const recovered = Math.floor(rawLost * attackerRepairPct);
    const effectiveLost = rawLost - recovered;
    if (rawLost > 0) {
      attackerLosses[unitId] = effectiveLost;
      attackerRecovered[unitId] = recovered;
    }
  }

  // Défenseur : les défenses détruites se reconstruisent en partie d'elles-
  // mêmes, les vaisseaux à quai passent par l'Atelier de réparation.
  const defenderLosses: Record<string, number> = {};
  const defenderRecovered: Record<string, number> = {};
  const defenderRebuilt: Record<string, number> = {};
  [...DEFENSIVE_UNITS, ...OFFENSIVE_UNITS].forEach((unitId) => {
    const count = defenderUnits[unitId]?.count ?? 0;
    const isDefense = DEFENSIVE_UNITS.includes(unitId);
    const rawLost = Math.floor(count * defenderLossPct * (isDefense ? 1 : COMBAT_RULES.homeFleetDefenseFactor));
    if (rawLost <= 0) return;
    const recovered = Math.floor(rawLost * (isDefense ? COMBAT_RULES.defenseRebuildPct : defenderRepairPct));
    defenderLosses[unitId] = rawLost - recovered;
    defenderRecovered[unitId] = recovered;
    if (isDefense && recovered > 0) defenderRebuilt[unitId] = recovered;
  });

  // Garnisons : même part de pertes que leur engagement, sans réparation.
  const garrisonLosses = garrisons.map((g) => {
    const lost: Record<string, number> = {};
    for (const [unitId, qty] of Object.entries(g.fleet)) {
      const n = Math.floor(qty * defenderLossPct * garrisonFactor);
      if (n > 0) lost[unitId] = Math.min(qty, n);
    }
    return lost;
  });

  // Butin : une part des ressources du défenseur, dans la limite de ce que
  // la flotte survivante peut transporter (réduit proportionnellement).
  const survivors: Record<string, number> = {};
  for (const [unitId, sent] of Object.entries(fleet)) survivors[unitId] = Math.max(0, sent - (attackerLosses[unitId] ?? 0));
  const cargoCapacity = fleetCargoCapacity(attackerUnits, survivors);
  let loot: Partial<Record<ResourceId, number>> | null = null;
  if (outcome === "attacker_win") {
    const wanted: Partial<Record<ResourceId, number>> = {};
    let total = 0;
    for (const res of [...COMMON_RESOURCES, ...RARE_RESOURCES]) {
      const base = RARE_RESOURCES.includes(res) ? COMBAT_RULES.lootPercent : COMBAT_RULES.lootPercentCommon;
      const pct = Math.min(1, base * (params.lootMultiplier ?? 1));
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

  return {
    outcome,
    attackerPower,
    defenderPower,
    attackerLossPercent: attackerLossPct,
    defenderLossPercent: defenderLossPct,
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
  };
}
