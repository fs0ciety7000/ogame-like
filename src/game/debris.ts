import { CLASS_UNIT_RULES, HARVESTER_ID } from "@/game/classUnits";
import { findUnit, OFFENSIVE_UNITS, unitsWithRole } from "@/game/units";
import { playerCargoCapacity } from "@/game/modifiers";
import { setActionAvailability } from "@/game/trackedActions";

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
  /** Ancien réglage (capacité fixe par niveau), remplacé en 5.16 par la cargaison (CAP) du drone. Ignoré. */
  capacityPerLevel: 250,
  /** 6.14.123 (AA5) : repli si aucune unité n'a le rôle « recycleur ». */
  recyclerUnitId: "drone_recuperateur",
};

/** 6.14.123 (AU27, lot AA5) : recycleurs = unités au rôle « recycler » ; aucune : l'unité des règles (`recyclerUnitId`).
 *  Le Récolteur de l'Industriel recycle en plus, par sa règle de classe (bonus de capacité). */
export function recyclerUnitIds(): string[] {
  const ids = unitsWithRole("recycler");
  return ids.length ? ids : [DEBRIS_RULES.recyclerUnitId];
}

export interface DebrisAmount {
  scrap: number;
  energy: number;
}

export interface DebrisField extends DebrisAmount {
  /** Clé du champ : l'identifiant de la base où il se trouve, ou sa clé dérivée (`debrisKey`) pour une colonie. */
  id: string;
  /** 6.11.4 : identifiant de l'emplacement (planète mère ou colonie `<uid>-c<n>`). Absent sur les champs plus anciens. */
  locationId?: string;
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
/** Hachage 32 bits (FNV-1a) en base 36 sur 7 caractères : sans `Intl` ni API récente (goja). */
function hash7(text: string, seed: number): string {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ("000000" + h.toString(36)).slice(-7);
}

/** 6.11.4 (E1, Q13) : clé d'enregistrement d'un champ de débris. Un identifiant de base PocketBase tient en 15 caractères :
 *  une planète mère garde son identifiant, une colonie (`<uid>-c<n>`, 18) reçoit une clé dérivée stable de 15 caractères. */
export function debrisKey(locationId: string): string {
  const id = String(locationId ?? "");
  if (id.length <= 15) return id;
  return "d" + hash7(id, 2166136261) + hash7(id, 374761393).slice(0, 7);
}

/** Emplacement d'un champ (anciens champs : leur clé est l'identifiant de la planète). */
export function debrisLocation(field: Pick<DebrisField, "id" | "locationId">): string {
  return field.locationId || field.id;
}

export function mergeDebris(field: DebrisField | null, add: DebrisAmount, location: { uid: string; pseudo: string }, now: number): DebrisField {
  const alive = field && field.expiresAtMs > now ? field : null;
  return {
    id: debrisKey(location.uid),
    locationId: location.uid,
    locationPseudo: location.pseudo,
    scrap: (alive?.scrap ?? 0) + add.scrap,
    energy: (alive?.energy ?? 0) + add.energy,
    expiresAtMs: now + DEBRIS_RULES.lifetimeHours * 3600_000,
    updatedAtMs: now,
  };
}

/** Capacité de ramassage d'une flotte de recycleurs. 5.16 : la cargaison (CAP) des drones,
 *  exactement comme sur leur fiche : CAP × niveau × nombre, technos de cale et officiers compris. */
export function recyclerCapacity(player: Parameters<typeof playerCargoCapacity>[0], fleet: Record<string, number>): number {
  // 6.14.123 (AA5) : toutes les unités au rôle « recycleur » (le Drone récupérateur par défaut), soute comprise.
  const plain: Record<string, number> = {};
  for (const id of recyclerUnitIds()) {
    if (id === HARVESTER_ID) continue;
    const n = Math.max(0, Math.floor(Number(fleet?.[id]) || 0));
    if (n > 0) plain[id] = n;
  }
  // 6.5 : le Récolteur (Industriel) recycle aussi, avec 25 % de capacité en plus de sa soute.
  const harvesters = Math.max(0, Math.floor(Number(fleet?.[HARVESTER_ID]) || 0));
  const fromDrones = Object.keys(plain).length > 0 ? playerCargoCapacity(player, plain) : 0;
  const fromHarvesters = harvesters > 0 ? Math.floor(playerCargoCapacity(player, { [HARVESTER_ID]: harvesters }) * (1 + CLASS_UNIT_RULES.harvesterRecycleBonus)) : 0;
  return fromDrones + fromHarvesters;
}

/** 6.5 : unités qui peuvent recycler (rôle « recycleur », et le Récolteur de l'Industriel). */
export function isRecyclerUnit(id: string): boolean {
  return id === HARVESTER_ID || recyclerUnitIds().includes(id);
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

// 6.14.131 (AU27, AJ27-7) : l'objectif du jour « recyclage » n'est proposé qu'au joueur qui possède un recycleur.
setActionAvailability("recycle", (p) => Object.entries(p.units ?? {}).some(([id, u]) => (u?.count ?? 0) > 0 && isRecyclerUnit(id)));
