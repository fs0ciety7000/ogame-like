import { BUILDINGS, keptOnAscension, requiredForAscension } from "@/game/buildings";
import { defaultResources } from "@/game/defaults";
import { GameActionError } from "@/game/errors";
import { bumpStat } from "@/game/stats";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   Ascension (v3.4) : un joueur dont tous les bâtiments sont au niveau
   maximal peut tout reconstruire contre un bonus permanent. Bâtiments
   remis au niveau 1 et stock de départ ; technologies, flotte, défenses,
   succès, titres, XP et rang conservés. Bouclier de 72 h et entretien de
   flotte suspendu 7 jours pour reconstruire en paix.
===================================================== */

export const ASCENSION_RULES = {
  productionPerAscension: 0.1,
  buildTimePerAscension: 0.05,
  maxAscensions: 5,
  cooldownDays: 7,
  shieldHours: 72,
  upkeepFreeDays: 7,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const ASCENSION_RULES_META = {
  productionPerAscension: { label: "Production en plus par Ascension", unit: "part", min: 0, max: 1, hint: "Bonus permanent : 0,1 = +10 % de production par Ascension." },
  buildTimePerAscension: { label: "Durée de construction en moins par Ascension", unit: "part", min: 0, max: 0.1, hint: "0,05 = −5 % par Ascension, sous le plafond « Temps de construction » des bonus." },
  maxAscensions: { label: "Ascensions au plus", min: 1, max: 50, hint: "Passe à 10 à la bascule du rythme. Ne jamais descendre sous le nombre déjà atteint par un joueur." },
  cooldownDays: { label: "Délai entre deux Ascensions", unit: "j", min: 0, max: 365, hint: "Passe à 30 à la bascule du rythme (groupe « Rythme »)." },
  shieldHours: { label: "Bouclier après une Ascension", unit: "h", min: 0, max: 336, hint: "Aucune attaque ne peut viser le joueur pendant ce temps." },
  upkeepFreeDays: { label: "Entretien de flotte offert après une Ascension", unit: "j", min: 0, max: 60 },
};

/** 5.15 : insigne d'ascension (illustration à venir, voir docs/prompts-ascension.md).
 *  Tant qu'il vaut null, l'interface affiche une icône vectorielle à la place. */
export const ASCENSION_INSIGNIA: string | null = "/assets/ascension/insigne.webp";

/** 6.14.88 (RL-3) : jusqu'à l'Ascension X (maximum de 10 après la bascule du rythme). */
export const ASCENSION_ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
/** « Ascension III » */
export function ascensionLabel(n: number): string {
  return n > 0 ? `Ascension ${ASCENSION_ROMAN[n] ?? n}` : "";
}

const DAY = 24 * 3600_000;

type AscPlayer = Pick<PlayerState, "ascensions" | "ascendedAtMs">;

export function ascensionCount(player: Partial<AscPlayer> | null | undefined): number {
  return Math.max(0, Math.min(ASCENSION_RULES.maxAscensions, Math.floor(Number(player?.ascensions) || 0)));
}

/** Multiplicateur de production (1,3 = +30 %). */
export function ascensionProductionFactor(player: Partial<AscPlayer> | null | undefined): number {
  return 1 + ascensionCount(player) * ASCENSION_RULES.productionPerAscension;
}

/** Multiplicateur des durées de construction (0,85 = −15 %). */
export function ascensionBuildTimeFactor(player: Partial<AscPlayer> | null | undefined): number {
  return Math.max(0.1, 1 - ascensionCount(player) * ASCENSION_RULES.buildTimePerAscension);
}

/** Fin du bouclier d'ascension (0 si aucun). */
export function ascensionShieldUntil(player: Partial<AscPlayer> | null | undefined): number {
  const at = Number(player?.ascendedAtMs) || 0;
  return at > 0 ? at + ASCENSION_RULES.shieldHours * 3600_000 : 0;
}

/** Fin de la suspension de l'entretien de flotte (0 si aucune). */
export function upkeepFreeUntil(player: Partial<AscPlayer> | null | undefined): number {
  const at = Number(player?.ascendedAtMs) || 0;
  return at > 0 ? at + ASCENSION_RULES.upkeepFreeDays * DAY : 0;
}

export interface AscensionCheck {
  ok: boolean;
  reason?: string;
  /** Bâtiments qui ne sont pas encore au niveau maximal. */
  missing: { id: string; name: string; level: number; maxLevel: number }[];
}

export function canAscend(player: PlayerState, queues: Pick<QueuesState, "buildingUpgrades"> | null, now: number): AscensionCheck {
  // v3.6 : les bâtiments de fin de partie ne comptent pas.
  const missing = BUILDINGS.filter((b) => requiredForAscension(b) && (player.buildings[b.id]?.level ?? 0) < b.maxLevel).map((b) => ({
    id: b.id,
    name: b.name,
    level: player.buildings[b.id]?.level ?? 0,
    maxLevel: b.maxLevel,
  }));
  if (ascensionCount(player) >= ASCENSION_RULES.maxAscensions) return { ok: false, reason: `Tu as atteint le maximum de ${ASCENSION_RULES.maxAscensions} ascensions.`, missing };
  if (missing.length > 0) return { ok: false, reason: "Tous tes bâtiments doivent être au niveau maximal.", missing };
  const wait = (Number(player.ascendedAtMs) || 0) + ASCENSION_RULES.cooldownDays * DAY - now;
  if (player.ascendedAtMs && wait > 0) return { ok: false, reason: `Prochaine ascension possible dans ${Math.ceil(wait / DAY)} jour(s).`, missing };
  if (queues && Object.keys(queues.buildingUpgrades ?? {}).length > 0) return { ok: false, reason: "Termine d'abord tes constructions en cours.", missing };
  return { ok: true, missing };
}

/** Ascension : bâtiments au niveau 1 (déblocages conservés), stock de départ. 5.27.2 : hangars et
 *  Cale sèche conservés (la flotte est gardée, son logement aussi : invariant I4). */
export function ascend(player: PlayerState, queues: QueuesState, now: number): void {
  const check = canAscend(player, queues, now);
  if (!check.ok) throw new GameActionError(check.reason ?? "Ascension impossible.");
  for (const b of BUILDINGS) {
    if (keptOnAscension(b)) continue; // conservés
    const cur = player.buildings[b.id];
    player.buildings[b.id] = { ...(cur ?? { unlocked: !!b.startsUnlocked }), level: 1 };
  }
  player.resources = defaultResources();
  player.resourceHistory = [];
  player.ascensions = ascensionCount(player) + 1;
  player.ascendedAtMs = now;
  bumpStat(player, "ascensions");
}
