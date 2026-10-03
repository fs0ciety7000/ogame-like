import { allianceShieldBonus } from "@/game/alliances";
import { colonyOf, colonyView } from "@/game/colonies";
import { computeFleetPower, getShieldPercent, homeDefensePower } from "@/game/combat";
import { postureEffects } from "@/game/formations";
import { playerModifiers } from "@/game/modifiers";
import { OFFENSIVE_UNITS } from "@/game/units";
import type { Fleet } from "@/game/fleets";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.1 : comparatif attaque / défense d'une flotte hostile en approche.
   Même calcul que le combat (bouclier, posture, bonus de défense), sans
   les garnisons ni les capsules secrètes : c'est une estimation.
===================================================== */

export type ThreatVerdict = "safe" | "close" | "danger";

export interface ThreatEstimate {
  /** Attaque effective, bouclier déduit. */
  attack: number;
  defense: number;
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

export function threatEstimate(fleet: Pick<Fleet, "power" | "units" | "targetUid" | "mission">, player: PlayerState, opts: { fleetOnly?: boolean } = {}): ThreatEstimate {
  const colony = colonyOf(player, fleet.targetUid);
  const planet = colony ? colonyView(player, colony) : player;
  const known = (fleet.power ?? 0) > 0;
  const raw = known ? (fleet.power as number) : computeFleetPower(player.units, player.techLevels, fleet.units ?? {}, ["attack"]);
  const shield = Math.max(0, Math.min(0.95, getShieldPercent(planet.buildings, allianceShieldBonus(player.allianceResearch))));
  const attack = raw * (1 - shield);
  // Certains raids pirates visent la flotte à quai seulement (défenses hors jeu).
  const posture = postureEffects(planet.posture?.id, !!opts.fleetOnly);
  const units = opts.fleetOnly ? Object.fromEntries(Object.entries(planet.units ?? {}).filter(([id]) => OFFENSIVE_UNITS.includes(id))) : (planet.units ?? {});
  const defense = homeDefensePower(units, player.techLevels ?? {}, posture.homeFleetFactor, posture.defenseFactor) * (1 + playerModifiers(player).defense);
  const ratio = attack > 0 ? defense / attack : Infinity;
  const verdict: ThreatVerdict = ratio >= 1.25 ? "safe" : ratio >= 0.8 ? "close" : "danger";
  return { attack, defense, shield, estimated: !known && fleet.mission !== "pirate", ratio, verdict, targetName: colony ? colony.name : "planète mère" };
}
