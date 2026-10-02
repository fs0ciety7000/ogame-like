import { getShieldPercent, resolveCombat, type CombatGarrison, type CombatResult } from "@/game/combat";
import { getRepairPercent } from "@/game/buildings";
import { protectedAmount } from "@/game/economy";
import { ALLIANCE_RULES, allianceShieldBonus, allianceSiegeFactor } from "@/game/alliances";
import { computeCombatXp } from "@/game/pvp";
import { lairPower, raidPower, type FactionDef } from "@/game/pirates";
import { OFFENSIVE_UNITS } from "@/game/units";
import { formationEffects, postureEffects } from "@/game/formations";
import type { Buildings, PlayerState, ResourceId, SpyReport, TechLevels, Units } from "@/types/game";

/* =====================================================
   Simulateur de combat (v2.8) : rejoue la formule exacte du combat
   (resolveCombat) sans rien modifier. Le combat est déterministe : le
   simulateur indique donc l'issue, les pertes, le butin et l'XP, ainsi
   que le multiplicateur de flotte nécessaire pour l'emporter.
===================================================== */

/** Camp entièrement libre (bac à sable). */
export interface SimSide {
  units: Units;
  techLevels: TechLevels;
  /** Bouclier du défenseur, de 0 à 1. */
  shieldPct?: number;
  /** Réparation (Atelier), de 0 à 1. */
  repairPct?: number;
  resources?: Partial<Record<ResourceId, number>>;
}

export interface SimOutcome {
  combat: CombatResult;
  /** XP de l'attaquant et du défenseur (avant plafond quotidien). */
  attackerXp: number;
  defenderXp: number;
  /** Facteur à appliquer à la puissance d'attaque pour gagner (≤ 1 : déjà gagné). */
  winFactor: number;
  /** Ce que le simulateur a dû supposer (données manquantes). */
  notes: string[];
}

function winFactor(combat: CombatResult): number {
  if (combat.attackerPower <= 0) return Infinity;
  return combat.defenderPower / combat.attackerPower;
}

function outcome(combat: CombatResult, notes: string[], xp = true): SimOutcome {
  const x = xp ? computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower) : { attackerXp: 0, defenderXp: 0 };
  return { combat, attackerXp: x.attackerXp, defenderXp: x.defenderXp, winFactor: winFactor(combat), notes };
}

/** Garde les unités d'attaque demandées, en entiers positifs. */
export function cleanFleet(fleet: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(fleet)) {
    const qty = Math.floor(Number(raw));
    if (qty > 0 && OFFENSIVE_UNITS.includes(id)) out[id] = qty;
  }
  return out;
}

/** Bac à sable : deux camps saisis librement. */
export function simulateSandbox(attacker: SimSide, fleet: Record<string, number>, defender: SimSide, lootMultiplier = 1, opts: { formation?: string; posture?: string } = {}): SimOutcome {
  const posture = postureEffects(opts.posture);
  const combat = resolveCombat({
    ...formationEffects(opts.formation),
    defenseFactor: posture.defenseFactor,
    homeFleetFactor: posture.homeFleetFactor,
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: attacker.repairPct ?? 0,
    fleet: cleanFleet(fleet),
    defenderUnits: defender.units,
    defenderTechLevels: defender.techLevels,
    defenderRepairPct: defender.repairPct ?? 0,
    defenderShieldPct: defender.shieldPct ?? 0,
    defenderResources: defender.resources ?? {},
    lootMultiplier,
  });
  return outcome(combat, []);
}

function buildingsFromReport(levels: Record<string, number> | undefined): Buildings {
  const out: Buildings = {};
  for (const [id, level] of Object.entries(levels ?? {})) out[id] = { level: Number(level) || 0, unlocked: (Number(level) || 0) > 0 };
  return out;
}

/** Contre un joueur, d'après le dernier rapport d'espionnage. */
export function simulateAgainstReport(
  attacker: Pick<PlayerState, "units" | "techLevels" | "buildings">,
  fleet: Record<string, number>,
  report: Pick<SpyReport, "tier" | "data">,
  lootMultiplier = 1,
  formation?: string,
  /** v4.0 : bonus d'attaque du joueur (officiers, reliques, stimulant d'assaut). */
  attackBonus = 0,
): SimOutcome | null {
  const data = report.data;
  if (!data || (report.tier ?? 0) < 2 || (!data.units && !data.defenses)) return null;
  const notes: string[] = [];
  const units: Units = { ...(data.units ?? {}), ...(data.defenses ?? {}) };
  const known = (report.tier ?? 0) >= 3 && !!data.techLevels;
  const techLevels: TechLevels = known ? (data.techLevels ?? {}) : {};
  const buildings = buildingsFromReport(known ? data.buildings : undefined);
  if (!known) notes.push("Bâtiments et technologies inconnus : bouclier, réparation et bonus de la cible ignorés (elle est sans doute plus forte).");

  const garrisons: CombatGarrison[] = (data.garrisons ?? []).map((g) => ({ units, techLevels, fleet: g.units }));
  if (garrisons.length > 0) notes.push("Garnisons alliées estimées avec les niveaux de la cible.");

  let resources: Partial<Record<ResourceId, number>> = {};
  if (data.resources) {
    resources = Object.fromEntries(
      Object.entries(data.resources).map(([res, amount]) => [res, Math.max(0, (amount ?? 0) - (known ? protectedAmount(buildings, res as ResourceId, techLevels) : 0))]),
    );
    if (!known) notes.push("Butin surestimé : la part protégée par l'entrepôt de la cible est inconnue.");
  } else notes.push("Ressources inconnues : pas d'estimation du butin.");
  notes.push("La cible a pu produire, construire ou déplacer sa flotte depuis le rapport.");

  // Posture relevée par les sondes (une posture changée depuis n'est pas connue).
  const posture = postureEffects(data.posture);
  const fx = formationEffects(formation);
  const combat = resolveCombat({
    ...fx,
    attackFactor: fx.attackFactor * (1 + attackBonus),
    defenseFactor: posture.defenseFactor,
    homeFleetFactor: posture.homeFleetFactor,
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: getRepairPercent(attacker.buildings),
    fleet: cleanFleet(fleet),
    defenderUnits: units,
    defenderTechLevels: techLevels,
    defenderRepairPct: getRepairPercent(buildings),
    defenderShieldPct: getShieldPercent(buildings),
    defenderResources: resources,
    garrisons,
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    lootMultiplier,
  });
  return outcome(combat, notes);
}

/** Assaut d'un repaire de faction (puissance du repaire calculée comme le serveur). */
export function simulateLair(player: PlayerState, fleet: Record<string, number>, faction: FactionDef, formation?: string): SimOutcome {
  const fx = formationEffects(formation);
  const combat = resolveCombat({
    ...fx,
    attackFactor: fx.attackFactor * allianceSiegeFactor(player.allianceResearch),
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: getRepairPercent(player.buildings),
    fleet: cleanFleet(fleet),
    defenderUnits: {},
    defenderTechLevels: {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderPowerOverride: lairPower(faction, player),
  });
  const res = outcome(combat, [], false);
  res.attackerXp = combat.outcome === "attacker_win" ? faction.lair.xp : 0;
  return res;
}

/** Raid d'une faction sur ta base, à une notoriété donnée (tu défends). */
export function simulateRaid(player: PlayerState, faction: FactionDef, notoriety: number): SimOutcome {
  const fleetOnly = faction.raid.target === "fleet";
  const defenderUnits: Units = fleetOnly ? Object.fromEntries(Object.entries(player.units ?? {}).filter(([id]) => OFFENSIVE_UNITS.includes(id))) : (player.units ?? {});
  const posture = postureEffects(player.posture?.id, fleetOnly);
  const combat = resolveCombat({
    defenseFactor: posture.defenseFactor,
    attackerUnits: {},
    attackerTechLevels: {},
    attackerRepairPct: 0,
    fleet: {},
    attackerPowerOverride: raidPower(faction, player, notoriety),
    defenderUnits,
    defenderTechLevels: player.techLevels ?? {},
    defenderRepairPct: getRepairPercent(player.buildings),
    defenderShieldPct: getShieldPercent(player.buildings, allianceShieldBonus(player.allianceResearch)),
    defenderResources: {},
    homeFleetFactor: posture.homeFleetFactor,
  });
  const res = outcome(combat, ["Garnisons alliées non comptées : elles renforceraient ta défense."], false);
  res.defenderXp = combat.outcome === "attacker_win" ? 0 : faction.bounty.xp;
  // Ici le joueur défend : il gagne si la puissance du raid reste sous la sienne.
  res.winFactor = combat.defenderPower > 0 ? combat.attackerPower / combat.defenderPower : Infinity;
  return res;
}
