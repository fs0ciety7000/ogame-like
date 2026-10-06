import { getUnitCapacity } from "@/game/buildings";
import { effectTotal, type EffectScope } from "@/game/effects";
import { allEffects } from "@/game/modifiers";
import { findUnit } from "@/game/units";
import { commissionReady, dockAllocation, dockReadyCount, dockTier, workshopHangarUnits } from "@/game/workshop";
import type { NewNotification } from "@/game/flush";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   5.27.2 : places de hangar, calculées en un seul endroit (invariant I5,
   docs/GAME_DESIGN.md §4). Serveur, page Unités, Statistiques, accueil et
   remise en service de la Cale sèche lisent tous `hangarLoad`.

   Places occupées = à quai + en vol + à l'Atelier hors Cale sèche + file.
   Une surcharge (occupé > capacité, après la migration 5.22 par exemple)
   n'est jamais résolue en détruisant : elle bloque la construction et la
   page Unités propose ses sorties.
===================================================== */

export type HangarCategory = "attack" | "defense";

type CapacityPlayer = Pick<PlayerState, "buildings"> & Parameters<typeof allEffects>[0];

/**
 * Capacité d'un hangar : bâtiments × technologies (couche « tech », dont « Extension des hangars »)
 * × effets d'empire (reliques, officiers, modules : stat `hangarCapacity`). `scope` : « home » pour
 * la planète mère, « colonies » pour le hangar de défense d'une colonie.
 */
export function playerUnitCapacity(player: CapacityPlayer, category: HangarCategory, now: number = Date.now(), scope: EffectScope = "home", buildings = player.buildings): number {
  const raw = getUnitCapacity(buildings ?? {}, category);
  const grants = allEffects(player, now);
  const tech = effectTotal(grants, "tech", "hangarCapacity", { target: category, scope });
  const empire = effectTotal(grants, "empire", "hangarCapacity", { target: category, scope });
  const withTech = tech > 0 ? Math.floor(raw * (1 + tech)) : raw;
  return empire > 0 ? Math.floor(withTech * (1 + empire)) : withTech;
}

/** Places occupées par un ensemble d'unités d'une catégorie. */
export function placesOf(units: Record<string, number>, category: HangarCategory): number {
  let used = 0;
  for (const [id, n] of Object.entries(units)) {
    const def = findUnit(id);
    if (def?.category === category && n > 0) used += n * def.hangarSpace;
  }
  return used;
}

export interface HangarLoad {
  category: HangarCategory;
  capacity: number;
  home: number;
  away: number;
  /** À l'Atelier hors Cale sèche (gardent leur place). */
  workshop: number;
  /** En file au chantier (places réservées). */
  queue: number;
  /** home + away + workshop. */
  occupied: number;
  /** occupied + queue. */
  used: number;
  free: number;
  /** Places au-delà de la capacité (surcharge), 0 sinon. */
  overflow: number;
  /** Cale sèche (information) : postes occupés par cette catégorie, et postes au total. */
  dockUsed: number;
  dockCapacity: number;
}

type LoadPlayer = Pick<PlayerState, "units" | "workshop" | "buildings"> & CapacityPlayer;

/** État d'un hangar. `away` : unités en vol (flottes du joueur, statut ≠ done). */
export function hangarLoad(player: LoadPlayer, queues: Pick<QueuesState, "unitQueues"> | null | undefined, away: Record<string, number>, category: HangarCategory, now: number = Date.now()): HangarLoad {
  const homeUnits: Record<string, number> = {};
  for (const [id, u] of Object.entries(player.units ?? {})) homeUnits[id] = u?.count ?? 0;
  const home = placesOf(homeUnits, category);
  const awayPlaces = placesOf(away ?? {}, category);
  const workshop = placesOf(workshopHangarUnits(player, now), category);
  const queue = (queues?.unitQueues?.[category] ?? []).reduce((sum, item) => sum + (findUnit(item.unitId)?.hangarSpace ?? 1), 0);
  const capacity = playerUnitCapacity(player, category, now);
  const occupied = home + awayPlaces + workshop;
  const used = occupied + queue;
  const dock = dockAllocation(player, now);
  const dockUnits: Record<string, number> = { ...dock.ready };
  for (const [id, n] of Object.entries(dock.repairing)) dockUnits[id] = (dockUnits[id] ?? 0) + n;
  return {
    category,
    capacity,
    home,
    away: awayPlaces,
    workshop,
    queue,
    occupied,
    used,
    free: Math.max(0, capacity - used),
    overflow: Math.max(0, used - capacity),
    dockUsed: placesOf(dockUnits, category),
    dockCapacity: dock.capacity,
  };
}

/**
 * 5.28 : remet en service les vaisseaux prêts de la Cale sèche, dans les places libres du hangar
 * (flottes en vol comprises). `unitId` : un type seulement. Rend les unités rentrées.
 */
export function commissionDocked(player: PlayerState, queues: Pick<QueuesState, "unitQueues"> | null | undefined, away: Record<string, number>, now: number, unitId?: string): Record<string, number> {
  const moved: Record<string, number> = {};
  const ids = Object.keys(player.workshop?.ready ?? {}).filter((id) => !unitId || id === unitId);
  for (const id of ids) {
    const category = findUnit(id)?.category;
    if (category !== "attack" && category !== "defense") continue;
    // Places libres recalculées à chaque type : le précédent vient d'en prendre.
    Object.assign(moved, commissionReady(player, hangarLoad(player, queues, away, category, now).free, id));
  }
  return moved;
}

/** 5.28 : la remise en service automatique peut-elle tourner (Cale sèche au palier 10 et vaisseaux prêts) ? */
export function dockAutoCommission(player: Pick<PlayerState, "buildings" | "workshop">): boolean {
  return dockTier(player, "auto") && dockReadyCount(player) > 0;
}

/**
 * 5.28 : remise en service automatique (palier 10). `away` doit venir des flottes en vol réelles (le serveur
 * les lit) : sans elles, la place libre serait surestimée (invariant I8). Rend la notification à envoyer.
 */
export function autoCommission(player: PlayerState, queues: Pick<QueuesState, "unitQueues"> | null | undefined, away: Record<string, number>, now: number): NewNotification[] {
  if (!dockAutoCommission(player)) return [];
  const moved = commissionDocked(player, queues, away, now);
  const names = Object.entries(moved).map(([id, n]) => `${n} × ${findUnit(id)?.name ?? id}`);
  if (!names.length) return [];
  return [{ kind: "building", title: "Cale sèche : remise en service", message: `De retour au hangar : ${names.join(", ")}.`, createdAtMs: now, read: false, link: "/game/batiments?onglet=atelier" }];
}
