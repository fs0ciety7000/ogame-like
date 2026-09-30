import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import type { Units } from "@/types/game";

/* =====================================================
   Champs de débris (v1.7) : une partie du coût des vaisseaux détruits
   (des deux camps) reste en orbite de la base attaquée pendant 48 h. Des
   Drones récupérateurs peuvent aller la ramasser : premier arrivé, premier
   servi. Les défenses (reconstruites en partie) ne laissent rien.
===================================================== */

export const DEBRIS_RULES = {
  /** Part du coût (ferraille, énergie) des vaisseaux détruits. */
  percent: 0.3,
  /** Durée de vie d'un champ, relancée à chaque nouveau combat. */
  lifetimeHours: 48,
  /** Capacité de ramassage d'un recycleur, par niveau. */
  capacityPerLevel: 250,
  recyclerUnitId: "drone_recuperateur",
};

export interface DebrisAmount {
  scrap: number;
  energy: number;
}

export interface DebrisField extends DebrisAmount {
  /** Même identifiant que la base où il se trouve. */
  id: string;
  locationPseudo: string;
  expiresAtMs: number;
  updatedAtMs: number;
}

/** Débris laissés par des vaisseaux détruits. */
export function debrisFromLosses(losses: Record<string, number>[], percent: number = DEBRIS_RULES.percent): DebrisAmount {
  let scrap = 0;
  let energy = 0;
  for (const map of losses) {
    for (const [unitId, qty] of Object.entries(map ?? {})) {
      if (!(qty > 0) || !OFFENSIVE_UNITS.includes(unitId)) continue;
      const cost: Partial<Record<string, number>> = findUnit(unitId)?.cost ?? {};
      scrap += (cost.scrap ?? 0) * qty;
      energy += (cost.energy ?? 0) * qty;
    }
  }
  return { scrap: Math.floor(scrap * percent), energy: Math.floor(energy * percent) };
}

export function debrisTotal(d: DebrisAmount | null | undefined): number {
  return d ? (d.scrap ?? 0) + (d.energy ?? 0) : 0;
}

/** Ajoute des débris à un champ (créé au besoin) et relance sa durée de vie. */
export function mergeDebris(field: DebrisField | null, add: DebrisAmount, location: { uid: string; pseudo: string }, now: number): DebrisField {
  const alive = field && field.expiresAtMs > now ? field : null;
  return {
    id: location.uid,
    locationPseudo: location.pseudo,
    scrap: (alive?.scrap ?? 0) + add.scrap,
    energy: (alive?.energy ?? 0) + add.energy,
    expiresAtMs: now + DEBRIS_RULES.lifetimeHours * 3600_000,
    updatedAtMs: now,
  };
}

/** Capacité de ramassage d'une flotte de recycleurs. */
export function recyclerCapacity(units: Units, fleet: Record<string, number>): number {
  let capacity = 0;
  for (const [unitId, qty] of Object.entries(fleet ?? {})) {
    if (unitId !== DEBRIS_RULES.recyclerUnitId || !(qty > 0)) continue;
    capacity += qty * DEBRIS_RULES.capacityPerLevel * Math.max(1, units[unitId]?.level ?? 1);
  }
  return capacity;
}

/** Ramassage : proportionnel aux deux ressources, dans la limite de la capacité. */
export function collectDebris(field: DebrisAmount, capacity: number): { taken: DebrisAmount; remaining: DebrisAmount } {
  const total = debrisTotal(field);
  if (total <= 0 || capacity <= 0) return { taken: { scrap: 0, energy: 0 }, remaining: { scrap: field.scrap ?? 0, energy: field.energy ?? 0 } };
  const ratio = Math.min(1, capacity / total);
  const scrap = Math.floor((field.scrap ?? 0) * ratio);
  const energy = Math.min(field.energy ?? 0, Math.floor(capacity - scrap), Math.ceil((field.energy ?? 0) * ratio));
  return {
    taken: { scrap, energy },
    remaining: { scrap: (field.scrap ?? 0) - scrap, energy: (field.energy ?? 0) - energy },
  };
}
