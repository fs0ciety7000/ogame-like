import { DEFENSIVE_UNITS, UNIT_BASE_STATS } from "@/game/units";
import type { CombatOutcome, RareResourceId, TechLevels, Units } from "@/types/game";

export const LOOT_PERCENT = 0.08;
const LOOT_RESOURCES: RareResourceId[] = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function unitStat(units: Units, techLevels: TechLevels, unitId: string, stat: "attack" | "defense"): number {
  const base = UNIT_BASE_STATS[unitId]?.[stat] ?? 0;
  const level = units[unitId]?.level ?? 0;
  if (level <= 0) return 0;

  let value = base + (level - 1) * 5;
  if (stat === "attack") value *= 1 + (techLevels.tech5 ?? 0) * 0.1;
  if (stat === "defense") value *= 1 + (techLevels.tech2 ?? 0) * 0.1;
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
  attackerPower: number;
  defenderPower: number;
  attackerLossPercent: number;
  defenderLossPercent: number;
  attackerLosses: Record<string, number>;
  attackerRecovered: Record<string, number>;
  defenderLosses: Record<string, number>;
  defenderRecovered: Record<string, number>;
  loot: Partial<Record<RareResourceId, number>> | null;
}

export function resolveCombat(params: {
  attackerUnits: Units;
  attackerTechLevels: TechLevels;
  attackerRepairPct: number;
  fleet: Record<string, number>;
  defenderUnits: Units;
  defenderTechLevels: TechLevels;
  defenderRepairPct: number;
  defenderResources: Partial<Record<RareResourceId, number>>;
}): CombatResult {
  const { attackerUnits, attackerTechLevels, attackerRepairPct, fleet, defenderUnits, defenderTechLevels, defenderRepairPct, defenderResources } = params;

  const attackerPower = computeFleetPower(attackerUnits, attackerTechLevels, fleet, ["attack"]);
  const defenderPower = computeFullPower(defenderUnits, defenderTechLevels, DEFENSIVE_UNITS, ["attack", "defense"]);

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

  const defenderLosses: Record<string, number> = {};
  const defenderRecovered: Record<string, number> = {};
  DEFENSIVE_UNITS.forEach((unitId) => {
    const count = defenderUnits[unitId]?.count ?? 0;
    const rawLost = Math.floor(count * defenderLossPct);
    const recovered = Math.floor(rawLost * defenderRepairPct);
    const effectiveLost = rawLost - recovered;
    if (rawLost > 0) {
      defenderLosses[unitId] = effectiveLost;
      defenderRecovered[unitId] = recovered;
    }
  });

  let loot: Partial<Record<RareResourceId, number>> | null = null;
  if (outcome === "attacker_win") {
    loot = {};
    LOOT_RESOURCES.forEach((res) => {
      const available = defenderResources[res] ?? 0;
      loot![res] = Math.floor(available * LOOT_PERCENT);
    });
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
  };
}
