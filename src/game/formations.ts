import { COMBAT_RULES } from "@/game/combat";
import { GameActionError } from "@/game/errors";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Formations et postures (v3.0) : une décision avant le combat, sans
   complexifier le moteur. L'attaquant choisit une formation au lancement
   de sa flotte ; le défenseur règle la posture de sa base (modifiable une
   fois par heure). Les chiffres sont dans COMBAT_RULES (administration).
===================================================== */

export type FormationId = "balanced" | "assault" | "cautious" | "raid";
export type PostureId = "standard" | "bunker" | "riposte";

export interface FormationDef<T extends string> {
  id: T;
  name: string;
  description: () => string;
}

const pct = (v: number) => `${v > 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)} %`;

export const FORMATIONS: FormationDef<FormationId>[] = [
  { id: "balanced", name: "Équilibrée", description: () => "Aucun bonus ni malus." },
  { id: "assault", name: "Assaut", description: () => `Attaque ${pct(COMBAT_RULES.assaultAttack)}, pertes subies ${pct(COMBAT_RULES.assaultLosses)}.` },
  { id: "cautious", name: "Prudente", description: () => `Attaque ${pct(COMBAT_RULES.cautiousAttack)}, pertes subies ${pct(COMBAT_RULES.cautiousLosses)}.` },
  { id: "raid", name: "Raid", description: () => `Attaque ${pct(COMBAT_RULES.raidAttack)}, cargaison ${pct(COMBAT_RULES.raidCargo)}.` },
];

export const POSTURES: FormationDef<PostureId>[] = [
  { id: "standard", name: "Standard", description: () => `Les vaisseaux à quai défendent à ${Math.round(COMBAT_RULES.homeFleetDefenseFactor * 100)} %.` },
  { id: "bunker", name: "Bunker", description: () => `Défenses ${pct(COMBAT_RULES.bunkerDefense)}, vaisseaux à quai à l'abri (ni engagés, ni détruits).` },
  { id: "riposte", name: "Riposte", description: () => `Vaisseaux à quai engagés à ${Math.round(COMBAT_RULES.riposteHomeFleet * 100)} %.` },
];

export function isFormation(v: unknown): v is FormationId {
  return FORMATIONS.some((f) => f.id === v);
}
export function isPosture(v: unknown): v is PostureId {
  return POSTURES.some((p) => p.id === v);
}

/** Paramètres de resolveCombat pour la formation de l'attaquant. */
export function formationEffects(id: unknown): { attackFactor: number; attackerLossFactor: number; cargoFactor: number } {
  switch (id) {
    case "assault":
      return { attackFactor: 1 + COMBAT_RULES.assaultAttack, attackerLossFactor: 1 + COMBAT_RULES.assaultLosses, cargoFactor: 1 };
    case "cautious":
      return { attackFactor: 1 + COMBAT_RULES.cautiousAttack, attackerLossFactor: 1 + COMBAT_RULES.cautiousLosses, cargoFactor: 1 };
    case "raid":
      return { attackFactor: 1 + COMBAT_RULES.raidAttack, attackerLossFactor: 1, cargoFactor: 1 + COMBAT_RULES.raidCargo };
    default:
      return { attackFactor: 1, attackerLossFactor: 1, cargoFactor: 1 };
  }
}

/** Paramètres de resolveCombat pour la posture du défenseur. `fleetOnly` : raid visant la flotte à quai. */
export function postureEffects(id: unknown, fleetOnly = false): { defenseFactor: number; homeFleetFactor: number | undefined } {
  if (fleetOnly) return { defenseFactor: 1, homeFleetFactor: 1 };
  switch (id) {
    case "bunker":
      return { defenseFactor: 1 + COMBAT_RULES.bunkerDefense, homeFleetFactor: 0 };
    case "riposte":
      return { defenseFactor: 1, homeFleetFactor: COMBAT_RULES.riposteHomeFleet };
    default:
      return { defenseFactor: 1, homeFleetFactor: undefined };
  }
}

export function playerPosture(p: Pick<PlayerState, "posture">): PostureId {
  return isPosture(p.posture?.id) ? p.posture!.id : "standard";
}

/** Change la posture de la base (une fois par heure au plus). */
export function setPosture(player: PlayerState, id: unknown, now: number): PostureId {
  if (!isPosture(id)) throw new GameActionError("Posture inconnue.");
  const current = playerPosture(player);
  if (current === id) return id;
  const last = player.posture?.changedAtMs ?? 0;
  const wait = last > 0 ? last + COMBAT_RULES.postureCooldownHours * 3600_000 - now : 0;
  if (wait > 0) throw new GameActionError(`Changement de posture possible dans ${Math.ceil(wait / 60_000)} min.`);
  player.posture = { id, changedAtMs: now };
  return id;
}
