import { getUnitCapacity } from "@/game/buildings";
import { effectTotal, type EffectScope } from "@/game/effects";
import { allEffects } from "@/game/modifiers";
import { findUnit, getUnitBuildTime } from "@/game/units";
import { hangarLendShareOf } from "@/game/buildingTiers";
import { commissionReady, dockAllocation, dockReadyCount, dockTier, workshopHangarUnits } from "@/game/workshop";
import type { NewNotification } from "@/game/flush";
import type { PlayerState, QueuesState, UnitQueueEntry } from "@/types/game";

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

type CapacityPlayer = Pick<PlayerState, "buildings"> & Partial<Pick<PlayerState, "buildingChoices">> & Parameters<typeof allEffects>[0];

/** Capacité propre d'un hangar, avant les baies modulaires. */
function ownUnitCapacity(player: CapacityPlayer, category: HangarCategory, now: number, scope: EffectScope, buildings: PlayerState["buildings"]): number {
  const raw = getUnitCapacity(buildings ?? {}, category);
  const grants = allEffects(player, now);
  const tech = effectTotal(grants, "tech", "hangarCapacity", { target: category, scope });
  const empire = effectTotal(grants, "empire", "hangarCapacity", { target: category, scope });
  const withTech = tech > 0 ? Math.floor(raw * (1 + tech)) : raw;
  return empire > 0 ? Math.floor(withTech * (1 + empire)) : withTech;
}

/** 6.14.145 (PB-L4, palier 5 des hangars) : places prêtées (négatif) ou reçues (positif) par les baies modulaires. Planète mère seulement. */
function lentPlaces(player: CapacityPlayer, category: HangarCategory, now: number, own: number, buildings: PlayerState["buildings"]): number {
  const p = { buildings, buildingChoices: player.buildingChoices };
  const other: HangarCategory = category === "attack" ? "defense" : "attack";
  const outShare = hangarLendShareOf(p, category);
  const inShare = hangarLendShareOf(p, other);
  const out = outShare > 0 ? Math.floor(own * outShare) : 0;
  const incoming = inShare > 0 ? Math.floor(ownUnitCapacity(player, other, now, "home", buildings) * inShare) : 0;
  return incoming - out;
}

/**
 * Capacité d'un hangar : bâtiments × technologies (couche « tech », dont « Extension des hangars »)
 * × effets d'empire (reliques, officiers, modules : stat `hangarCapacity`). `scope` : « home » pour
 * la planète mère, « colonies » pour le hangar de défense d'une colonie.
 * 6.14.145 (PB-L4) : sur la planète mère, ± les places des baies modulaires (palier 5, choix « Prêter »).
 */
export function playerUnitCapacity(player: CapacityPlayer, category: HangarCategory, now: number = Date.now(), scope: EffectScope = "home", buildings = player.buildings): number {
  const own = ownUnitCapacity(player, category, now, scope, buildings);
  if (scope !== "home") return own;
  return Math.max(0, own + lentPlaces(player, category, now, own, buildings));
}

/** 6.14.145 : places prêtées (négatif) ou reçues (positif) par les baies modulaires (affichage). */
function hangarLent(player: CapacityPlayer, category: HangarCategory, now: number = Date.now()): number {
  const own = ownUnitCapacity(player, category, now, "home", player.buildings);
  return lentPlaces(player, category, now, own, player.buildings);
}

/** 6.14.78 : capacité brute (bâtiments × technos, sans effets d'empire) pour les simulateurs (`balance/progressionSim.ts`) : le calcul reste ici (I5). */
export function rawUnitCapacity(buildings: Parameters<typeof getUnitCapacity>[0], category: HangarCategory, techLevels?: Parameters<typeof getUnitCapacity>[2]): number {
  return getUnitCapacity(buildings ?? {}, category, techLevels);
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
  /** En file au chantier (places réservées ; 6.14.145 : commandes démarrées seulement). */
  queue: number;
  /** 6.14.145 (PB-L4, palier 10) : places des commandes en attente d'une place (hors capacité, payées). */
  waiting: number;
  /** 6.14.145 : baies modulaires, places reçues (positif) ou prêtées (négatif), comprises dans `capacity`. */
  lent: number;
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
  // 6.14.145 (PB-L4, I2) : une commande en attente ne prend sa place qu'à son démarrage.
  let queue = 0;
  let waiting = 0;
  for (const item of queues?.unitQueues?.[category] ?? []) {
    const space = findUnit(item.unitId)?.hangarSpace ?? 1;
    if (item.wait) waiting += space;
    else queue += space;
  }
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
    waiting,
    lent: hangarLent(player, category, now),
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

/* =====================================================
   6.14.145 (PB-L4, docs/proposals/paliers-batiments.md §5.4) : file d'attente des hangars (palier 10).
   Une commande au-delà de la place libre attend en fin de file (`wait: true`), payée à la commande ; elle ne prend
   sa place qu'à son démarrage, unité par unité, dans l'ordre, dès qu'une place se libère (I2 réécrit : rien n'entre
   au-delà de la capacité). Les entrées en attente sont toujours après les entrées démarrées.
===================================================== */

export interface WaitingOrder {
  unitId: string;
  /** Index de la première entrée dans la file. */
  index: number;
  count: number;
  places: number;
}

/** Commandes en attente d'une place (lots consécutifs d'un même type), dans l'ordre. */
export function waitingOrders(queue: UnitQueueEntry[] | null | undefined): WaitingOrder[] {
  const out: WaitingOrder[] = [];
  (queue ?? []).forEach((e, i) => {
    if (!e.wait) return;
    const last = out[out.length - 1];
    const space = findUnit(e.unitId)?.hangarSpace ?? 1;
    if (last && last.unitId === e.unitId && last.index + last.count === i) {
      last.count++;
      last.places += space;
    } else out.push({ unitId: e.unitId, index: i, count: 1, places: space });
  });
  return out;
}

/**
 * Démarre les unités en attente qui ont désormais une place (dans l'ordre, sans en sauter une). `away` doit venir des
 * flottes en vol réelles (comme la remise en service, I8). Rend la notification du Journal (`notify` false : aucune).
 */
export function startWaitingUnits(player: PlayerState, queues: QueuesState | null | undefined, away: Record<string, number>, now: number, notify = true): NewNotification[] {
  if (!queues?.unitQueues) return [];
  const started: Record<string, number> = {};
  for (const category of ["attack", "defense"] as const) {
    const queue = queues.unitQueues[category];
    if (!queue?.some((e) => e.wait)) continue;
    let free = hangarLoad(player, queues, away, category, now).free;
    for (const e of queue) {
      if (!e.wait) continue;
      const space = findUnit(e.unitId)?.hangarSpace ?? 1;
      if (space > free) break;
      delete e.wait;
      free -= space;
      started[e.unitId] = (started[e.unitId] ?? 0) + 1;
    }
    const head = queue[0];
    if (head && !head.wait && head.endTime === null) {
      const u = findUnit(head.unitId);
      head.endTime = now + (u ? getUnitBuildTime(u, player.techLevels, player) : 0) * 1000;
    }
  }
  const names = Object.entries(started).map(([id, n]) => `${n} × ${findUnit(id)?.name ?? id}`);
  if (!notify || !names.length) return [];
  return [{ kind: "unit", title: "File d'attente : production lancée", message: `Une place s'est libérée au hangar : ${names.join(", ")} en production.`, createdAtMs: now, read: false, link: "/game/unites" }];
}

/** La file contient-elle des commandes en attente d'une place ? (le serveur lit alors les flottes en vol). */
export function hasWaitingUnits(queues: Pick<QueuesState, "unitQueues"> | null | undefined): boolean {
  return !!queues?.unitQueues && (["attack", "defense"] as const).some((c) => (queues.unitQueues[c] ?? []).some((e) => e.wait));
}
