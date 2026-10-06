import { EMPIRE_CLASS_RULES, findEmpireClass } from "@/game/empireClass";
import { GameActionError } from "@/game/errors";
import { CLASS_UNITS, findUnit, type UnitDef } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.5 (lot P, proposals/unites-classe.md) : vaisseaux de classe.
   - Constructibles seulement dans leur classe d'empire, une fois leur
     technologie de référence lancée (`classTech`).
   - Leur niveau suit celui de cette techno, tant que la classe correspond.
   - Changer de classe ne retire rien : les vaisseaux restent et volent.
===================================================== */

export const CLASS_UNIT_RULES = {
  /** Récolteur : capacité de recyclage en plus de sa soute (réglable : Admin → Règles → Classes d'empire). */
  get harvesterRecycleBonus(): number {
    return EMPIRE_CLASS_RULES.harvesterRecycleBonus;
  },
  /** Éclaireur lointain : durée d'expédition en moins s'il est dans la flotte. */
  get scoutExpeditionTime(): number {
    return EMPIRE_CLASS_RULES.scoutExpeditionTime;
  },
};

export const HARVESTER_ID = "recolteur";
export const SCOUT_ID = "eclaireur_lointain";

function classUnits(): UnitDef[] {
  return CLASS_UNITS.map((c) => findUnit(c.id) ?? c);
}

/** Met à jour les niveaux des vaisseaux de la classe du joueur. Rend les vaisseaux tout juste débloqués. */
export function syncClassUnits(player: PlayerState): string[] {
  const unlocked: string[] = [];
  const classId = player.empireClass?.id;
  if (!classId) return unlocked;
  for (const u of classUnits()) {
    if (u.empireClass !== classId || !u.classTech) continue;
    const level = Math.min(u.maxLevel, player.techLevels?.[u.classTech] ?? 0);
    if (level <= 0) continue;
    const cur = player.units[u.id];
    if (!cur || cur.level <= 0) unlocked.push(u.id);
    if (!cur || cur.level < level) player.units[u.id] = { ...(cur ?? { count: 0 }), level, count: cur?.count ?? 0 };
  }
  return unlocked;
}

/** Pourquoi le joueur ne peut pas construire ce vaisseau de classe (null : il peut). */
export function classUnitBlocker(player: Pick<PlayerState, "empireClass" | "techLevels">, unit: UnitDef): string | null {
  if (!unit.empireClass) return null;
  if (player.empireClass?.id !== unit.empireClass) return `Réservé à la classe ${findEmpireClass(unit.empireClass)?.name ?? unit.empireClass}.`;
  if (unit.classTech && (player.techLevels?.[unit.classTech] ?? 0) <= 0) return "Recherche d'abord sa technologie de référence au Labo.";
  return null;
}

export function assertClassUnitBuildable(player: Pick<PlayerState, "empireClass" | "techLevels">, unit: UnitDef): void {
  const why = classUnitBlocker(player, unit);
  if (why) throw new GameActionError(why);
}

/** Durée d'une expédition : −15 % si au moins un Éclaireur lointain fait partie de la flotte. */
export function expeditionDurationFactor(units: Record<string, number>): number {
  return (units[SCOUT_ID] ?? 0) > 0 ? 1 - CLASS_UNIT_RULES.scoutExpeditionTime : 1;
}
