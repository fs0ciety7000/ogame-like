import { ALLIANCE_RULES, allianceShieldBonus } from "@/game/alliances";
import { colonyOf, colonyView } from "@/game/colonies";
import { computeFleetPower, getShieldPercent, homeDefensePower, resolveCombat } from "@/game/combat";
import { workshopState } from "@/game/workshop";
import { postureEffects } from "@/game/formations";
import { playerModifiers } from "@/game/modifiers";
import { OFFENSIVE_UNITS } from "@/game/units";
import type { Fleet } from "@/game/fleets";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.1 : comparatif attaque / défense d'une flotte hostile en approche.
   Même calcul que le combat (bouclier, posture, bonus de défense), sans
   les capsules secrètes : c'est une estimation (garnisons comprises en v5.3).
===================================================== */

export type ThreatVerdict = "safe" | "close" | "danger";

export interface ThreatEstimate {
  /** Attaque effective, bouclier déduit. */
  attack: number;
  defense: number;
  /** v5.3 : part des garnisons alliées dans la défense. */
  garrison: number;
  /** Bouclier de la planète visée (0 → 0,95). */
  shield: number;
  /** Attaque recalculée avec tes propres niveaux (ancienne flotte sans puissance connue). */
  estimated: boolean;
  /** Défense / attaque (plus c'est haut, mieux c'est). */
  ratio: number;
  verdict: ThreatVerdict;
  /** Planète visée : la mère ou le nom de la colonie. */
  targetName: string;
}

export function threatEstimate(
  fleet: Pick<Fleet, "power" | "units" | "targetUid" | "mission">,
  player: PlayerState,
  opts: { fleetOnly?: boolean; garrisons?: Pick<Fleet, "power" | "units" | "targetUid" | "status" | "mission">[] } = {},
): ThreatEstimate {
  const colony = colonyOf(player, fleet.targetUid);
  const planet = colony ? colonyView(player, colony) : player;
  const known = (fleet.power ?? 0) > 0;
  const raw = known ? (fleet.power as number) : computeFleetPower(player.units, player.techLevels, fleet.units ?? {}, ["attack"]);
  const shield = Math.max(0, Math.min(0.95, getShieldPercent(planet.buildings, allianceShieldBonus(player.allianceResearch))));
  const attack = raw * (1 - shield);
  // Certains raids pirates visent la flotte à quai seulement (défenses hors jeu).
  const posture = postureEffects(planet.posture?.id, !!opts.fleetOnly);
  const units = opts.fleetOnly ? Object.fromEntries(Object.entries(planet.units ?? {}).filter(([id]) => OFFENSIVE_UNITS.includes(id))) : (planet.units ?? {});
  // v5.3 : garnisons alliées stationnées sur la planète visée (même part qu'au combat).
  const garrison = (opts.garrisons ?? [])
    .filter((g) => g.mission === "garrison" && g.status === "stationed" && g.targetUid === fleet.targetUid)
    .reduce((sum, g) => sum + ((g.power ?? 0) > 0 ? (g.power as number) : computeFleetPower(player.units, player.techLevels, g.units ?? {}, ["attack", "defense"])), 0);
  const garrisonPower = garrison * ALLIANCE_RULES.garrisonPower;
  const defense = (homeDefensePower(units, player.techLevels ?? {}, posture.homeFleetFactor, posture.defenseFactor) + garrisonPower) * (1 + playerModifiers(player).defense);
  const ratio = attack > 0 ? defense / attack : Infinity;
  // 5.20 : verdict joué par le combat en tours (riposte, retraite, coques abîmées de la planète mère) ;
  // les garnisons, sans unités connues ici, renforcent la défense en proportion de leur puissance.
  const base = homeDefensePower(units, player.techLevels ?? {}, posture.homeFleetFactor, posture.defenseFactor);
  const sim = resolveCombat({
    attackerUnits: player.units ?? {},
    attackerTechLevels: player.techLevels ?? {},
    attackerRepairPct: 0,
    fleet: known ? {} : (fleet.units ?? {}),
    attackerPowerOverride: known ? raw : undefined,
    defenderUnits: units,
    defenderTechLevels: player.techLevels ?? {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderShieldPct: shield,
    homeFleetFactor: posture.homeFleetFactor,
    defenseFactor: posture.defenseFactor,
    defenderPowerFactor: (1 + playerModifiers(player).defense) * (1 + (base > 0 ? garrisonPower / base : 0)),
    defenderHull: colony ? undefined : workshopState(player).hull,
  });
  const verdict: ThreatVerdict =
    sim.outcome === "attacker_win" ? "danger" : sim.outcome === "draw" || sim.defenderLossPercent >= 0.5 ? "close" : "safe";
  return { attack, defense, garrison: garrisonPower, shield, estimated: !known && fleet.mission !== "pirate", ratio, verdict, targetName: colony ? colony.name : "planète mère" };
}
