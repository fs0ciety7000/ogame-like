import { BUILDINGS, findBuilding, productionPerSecond, PRODUCTION_RESOURCE_BY_BUILDING, repairPercentAt, storageCapacityAt, visualTier, VISUAL_TIERS, type VisualTier } from "@/game/buildings";
import { formatDecimal, formatShort as formatCompact } from "@/game/format";
import { RESOURCE_LIST } from "@/game/resources";
import type { Buildings } from "@/types/game";

/* =====================================================
   v4.4 : passages de palier visuel (niveaux 5, 10, 15, 20). Le dernier
   palier vu par bâtiment est mémorisé : un palier atteint hors ligne est
   célébré à la connexion suivante.
===================================================== */

export interface TierUp {
  buildingId: string;
  tier: VisualTier;
  level: number;
}

export const TIER_NAMES: Record<VisualTier, { roman: string; label: string }> = {
  5: { roman: "I", label: "Bronze" },
  10: { roman: "II", label: "Argent" },
  15: { roman: "III", label: "Or" },
  20: { roman: "IV", label: "Néon" },
};

export type SeenTiers = Record<string, number>;

export function currentTiers(buildings: Buildings): SeenTiers {
  const out: SeenTiers = {};
  for (const b of BUILDINGS) {
    const s = buildings[b.id];
    out[b.id] = s?.unlocked ? visualTier(s.level) : 0;
  }
  return out;
}

/** Paliers franchis depuis `seen` (un seul par bâtiment : le plus haut). */
export function newTierUps(seen: SeenTiers, buildings: Buildings): TierUp[] {
  const now = currentTiers(buildings);
  const ups: TierUp[] = [];
  for (const [id, tier] of Object.entries(now)) {
    if (tier > (seen[id] ?? 0)) ups.push({ buildingId: id, tier: tier as VisualTier, level: buildings[id]?.level ?? tier });
  }
  return ups.sort((a, b) => a.tier - b.tier);
}

/** Palier précédent (0 = aucun). */
export function previousTier(tier: VisualTier): 0 | VisualTier {
  const i = VISUAL_TIERS.indexOf(tier);
  return i > 0 ? VISUAL_TIERS[i - 1] : 0;
}

/** Ce que vaut le bâtiment à ce niveau, en une ligne. */
export function tierBonusText(buildingId: string, level: number): string | null {
  const def = findBuilding(buildingId);
  if (!def) return null;
  const res = PRODUCTION_RESOURCE_BY_BUILDING[buildingId];
  if (res) {
    const now = productionPerSecond(buildingId, level);
    const before = productionPerSecond(buildingId, Math.max(1, level - 5));
    const name = RESOURCE_LIST.find((r) => r.id === res)?.name ?? res;
    const ratio = before > 0 && level > 5 ? now / before : 0;
    const gain = ratio >= 2 ? ` (×${formatDecimal(ratio, 1)} depuis le palier précédent)` : ratio > 1 ? ` (+${Math.round((ratio - 1) * 100)} % depuis le palier précédent)` : "";
    return `${formatCompact(now)}/s de ${name.toLowerCase()}${gain}`;
  }
  switch (def.effect?.type) {
    case "storage":
      return `${formatCompact(storageCapacityAt(def.effect, level))} de stockage par ressource commune`;
    case "repair":
      return `Répare ${Math.round(repairPercentAt(def.effect, level) * 100)} % des vaisseaux perdus`;
    case "hangar":
      return `${formatCompact(def.effect.perLevel * level)} places de hangar`;
    default:
      return null;
  }
}
