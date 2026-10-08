import { bumpStat } from "@/game/stats";
import { spendAmber } from "@/game/spending";
import { COMBAT_RULES, unitBaseHp } from "@/game/combat";
import { BUILDINGS, DOCK_TIERS, dockBaseCapacity, dockLevel, effectiveBuildingLevel } from "@/game/buildings";
import { findUnit, scaleUnitCost, type UnitCost } from "@/game/units";
import { unitClasses, type UnitClass } from "@/game/unitClasses";
import { playerUnitCost } from "@/game/effectTargets";
import { effectTotal } from "@/game/effects";
import { allEffects } from "@/game/modifiers";
import type { NewNotification } from "@/game/flush";
import { GameActionError } from "@/game/errors";
import type { PlayerState, ResourceId, Units } from "@/types/game";

/* =====================================================
   5.20 : Atelier de réparation et points de vie conservés.

   Après un combat, les unités gardent leurs dégâts : chaque type d'unité a
   une réserve de PV manquants (`hull`), répartie sur tout le stock. Une
   flotte abîmée se bat avec moins d'unités « valides » tant qu'elle n'est
   pas réparée.

   Les unités détruites que l'Atelier sauve (part de réparation) ne
   reviennent plus d'elles-mêmes : elles entrent en file (`jobs`) et restent
   indisponibles jusqu'à ce que l'Atelier leur ait rendu tous leurs PV.

   L'Atelier répare en PV par seconde, selon son niveau : d'abord les unités
   en file (dans l'ordre), puis les coques abîmées. Sans Atelier, une petite
   cadence de base (équipages) répare quand même les coques.

   5.28 : Cale sèche (docs/proposals/cale-seche.md, docs/GAME_DESIGN.md §8).
   Les lots en file occupent d'abord les postes de la Cale sèche (par ordre
   d'arrivée), le reste garde sa place au hangar. Un lot réparé en cale ne
   rentre au hangar que s'il y a de la place : sinon il attend, « Prêt »
   (`ready`), et la remise en service se fait à la demande (ou toute seule
   au palier 10, côté serveur, qui connaît les flottes en vol).
===================================================== */

export interface WorkshopJob {
  id: string;
  unitId: string;
  count: number;
  /** PV à rendre au total, et PV qu'il reste à rendre. */
  hpTotal: number;
  hpLeft: number;
  source: WorkshopSource;
  addedAtMs: number;
}

export type WorkshopSource = "attack" | "defense" | "bounty" | "lair" | "raid" | "expedition" | "boss";

export const WORKSHOP_SOURCE_LABELS: Record<WorkshopSource, string> = {
  attack: "Attaque",
  defense: "Défense",
  bounty: "Prime",
  lair: "Repaire",
  raid: "Raid repoussé",
  expedition: "Expédition",
  boss: "Boss",
};

/** 5.28 : que faire des vaisseaux sauvés (palier Triage de la Cale sèche). */
export type DockPolicy = "repair" | "scrapOverflow" | "scrapAll";
/** 5.28 : ordre de réparation (palier Priorités) : arrivée, ou une classe d'abord. */
export type DockPriority = "arrival" | UnitClass;

export const DOCK_POLICY_LABELS: Record<DockPolicy, string> = {
  repair: "Tout réparer",
  scrapOverflow: "Démanteler ce qui ne tient pas en cale",
  scrapAll: "Tout démanteler",
};

export interface PlayerWorkshop {
  updatedAtMs: number;
  jobs: WorkshopJob[];
  /** PV manquants par type d'unité (tout le stock). */
  hull: Record<string, number>;
  /** 5.28 : vaisseaux réparés en Cale sèche, en attente d'une place au hangar. */
  ready?: Record<string, number>;
  /** 5.28 : réglage du Triage (absent : tout réparer). */
  policy?: DockPolicy;
  /** 5.28 : ordre de réparation (absent : arrivée). */
  priority?: DockPriority;
  /** 5.28 : dernier démantèlement automatique (affiché dans la Cale sèche). */
  lastScrap?: { atMs: number; units: Record<string, number>; refund: { scrap: number; energy: number } } | null;
}

const ATELIER_ID = "atelier_reparation";

const POLICIES: DockPolicy[] = ["repair", "scrapOverflow", "scrapAll"];
const PRIORITIES: DockPriority[] = ["arrival", "heavy", "medium", "light", "support"];

export function workshopState(player: Pick<PlayerState, "workshop">): PlayerWorkshop {
  const w = player.workshop;
  const ready: Record<string, number> = {};
  for (const [id, n] of Object.entries(w?.ready && typeof w.ready === "object" ? w.ready : {})) {
    const c = Math.floor(Number(n) || 0);
    if (c > 0) ready[id] = c;
  }
  const out: PlayerWorkshop = {
    updatedAtMs: w?.updatedAtMs ?? 0,
    jobs: Array.isArray(w?.jobs) ? w!.jobs.filter((j) => j && j.count > 0) : [],
    hull: w?.hull && typeof w.hull === "object" ? { ...w.hull } : {},
  };
  if (Object.keys(ready).length) out.ready = ready;
  if (w?.policy && POLICIES.includes(w.policy) && w.policy !== "repair") out.policy = w.policy;
  if (w?.priority && PRIORITIES.includes(w.priority) && w.priority !== "arrival") out.priority = w.priority;
  if (w?.lastScrap && typeof w.lastScrap === "object") out.lastScrap = w.lastScrap;
  return out;
}

/* ---------- 5.28 : Cale sèche ---------- */

type DockPlayer = Pick<PlayerState, "buildings"> & Partial<Pick<PlayerState, "techLevels" | "commanders" | "relics" | "ascensions" | "talents" | "territory" | "modules" | "synthesis">>;

const spaceOf = (unitId: string) => Math.max(1, findUnit(unitId)?.hangarSpace ?? 1);

/** Postes de la Cale sèche (en places de hangar), bonus d'effets compris (stat `dockCapacity`). */
export function dockCapacity(player: DockPlayer, now: number = Date.now()): number {
  const base = dockBaseCapacity(player.buildings ?? {});
  if (base <= 0) return 0;
  const grants = allEffects(player, now);
  const bonus = effectTotal(grants, "tech", "dockCapacity") + effectTotal(grants, "empire", "dockCapacity");
  return bonus > 0 ? Math.floor(base * (1 + bonus)) : base;
}

export interface DockAllocation {
  capacity: number;
  /** Places occupées en cale : vaisseaux prêts + lots en cale. */
  used: number;
  /** Unités de chaque lot posées en cale (par identifiant de lot). */
  jobs: Record<string, number>;
  /** Unités en cale par type : lots en réparation (hors prêts). */
  repairing: Record<string, number>;
  ready: Record<string, number>;
}

/** Répartition des lots entre cale et hangar : les prêts d'abord, puis les lots par ordre d'arrivée. */
export function allocateDock(st: Pick<PlayerWorkshop, "jobs" | "ready">, capacity: number): DockAllocation {
  const ready = { ...(st.ready ?? {}) };
  let used = 0;
  for (const [id, n] of Object.entries(ready)) used += n * spaceOf(id);
  const jobs: Record<string, number> = {};
  const repairing: Record<string, number> = {};
  const byArrival = st.jobs.map((job, i) => ({ job, i })).sort((a, b) => (a.job.addedAtMs ?? 0) - (b.job.addedAtMs ?? 0) || a.i - b.i);
  for (const { job } of byArrival) {
    const space = spaceOf(job.unitId);
    const room = capacity - used;
    const fit = room > 0 ? Math.min(job.count, Math.floor(room / space)) : 0;
    if (fit <= 0) continue;
    jobs[job.id] = fit;
    repairing[job.unitId] = (repairing[job.unitId] ?? 0) + fit;
    used += fit * space;
  }
  return { capacity, used, jobs, repairing, ready };
}

export function dockAllocation(player: DockPlayer & Pick<PlayerState, "workshop">, now: number = Date.now()): DockAllocation {
  return allocateDock(workshopState(player), dockCapacity(player, now));
}

/** Unités à l'Atelier qui gardent une place au hangar (hors Cale sèche). */
export function workshopHangarUnits(player: DockPlayer & Pick<PlayerState, "workshop">, now: number = Date.now()): Record<string, number> {
  const st = workshopState(player);
  const alloc = allocateDock(st, dockCapacity(player, now));
  const out: Record<string, number> = {};
  for (const j of st.jobs) {
    const n = j.count - (alloc.jobs[j.id] ?? 0);
    if (n > 0) out[j.unitId] = (out[j.unitId] ?? 0) + n;
  }
  return out;
}

/** Vaisseaux réparés qui attendent une place au hangar. */
export function dockReady(player: Pick<PlayerState, "workshop">): Record<string, number> {
  return { ...(workshopState(player).ready ?? {}) };
}

export function dockReadyCount(player: Pick<PlayerState, "workshop">): number {
  return Object.values(dockReady(player)).reduce((a, b) => a + b, 0);
}

/** Palier atteint : Triage (5), remise automatique (10), priorités (15), Cale orbitale (20). */
export function dockTier(player: Pick<PlayerState, "buildings">, tier: keyof typeof DOCK_TIERS): boolean {
  return dockLevel(player.buildings ?? {}) >= DOCK_TIERS[tier];
}

/** Ordre de réparation : la classe prioritaire d'abord, sinon l'ordre d'arrivée (tri stable). */
function orderJobs(st: PlayerWorkshop, player: Pick<PlayerState, "buildings">) {
  const pr = st.priority;
  if (!pr || pr === "arrival" || !dockTier(player, "priority")) return;
  const classes = unitClasses();
  const rank = (j: WorkshopJob) => (classes[j.unitId] === pr ? 0 : 1);
  st.jobs = st.jobs.map((job, i) => ({ job, i })).sort((a, b) => rank(a.job) - rank(b.job) || a.i - b.i).map((x) => x.job);
}

/** Remboursement d'un démantèlement en cale (part du prix payé aujourd'hui). */
export function dockScrapValue(player: PlayerState, unitId: string, count: number, now: number): UnitCost {
  const unit = findUnit(unitId);
  if (!unit || count <= 0) return { scrap: 0, energy: 0 };
  const each = playerUnitCost(unit, player, now);
  const k = Math.max(0, Math.min(1, COMBAT_RULES.dockScrapRefund));
  // 6.14.123 (AA5) : chaque ressource du coût.
  return scaleUnitCost(scaleUnitCost(each, k, Math.floor), count);
}

function creditScrap(player: PlayerState, units: Record<string, number>, now: number): UnitCost {
  const total: UnitCost = { scrap: 0, energy: 0 };
  for (const [id, n] of Object.entries(units)) {
    const v = dockScrapValue(player, id, n, now);
    for (const [res, amount] of Object.entries(v)) total[res as ResourceId] = (total[res as ResourceId] ?? 0) + (amount ?? 0);
  }
  for (const [res, amount] of Object.entries(total)) player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + (amount ?? 0);
  bumpStat(player, "unitsDismantled", Object.values(units).reduce((a, b) => a + b, 0));
  return total;
}

/**
 * 5.28 (palier Triage) : démantèle des vaisseaux de la Cale sèche ou de l'Atelier : les prêts d'abord,
 * puis les derniers lots arrivés. Rend `dockScrapRefund` de leur prix et libère la place.
 */
export function dockScrap(player: PlayerState, unitId: string, qtyIn: number, now: number): { count: number; refund: { scrap: number; energy: number } } {
  if (!dockTier(player, "triage")) throw new GameActionError(`Le démantèlement s'ouvre au niveau ${DOCK_TIERS.triage} de la Cale sèche.`);
  const st = workshopState(player);
  let left = Math.floor(Number(qtyIn) || 0);
  if (!(left > 0)) throw new GameActionError("Quantité invalide.");
  const have = (st.ready?.[unitId] ?? 0) + st.jobs.filter((j) => j.unitId === unitId).reduce((a, j) => a + j.count, 0);
  if (have < left) throw new GameActionError("Il n'y a pas autant de vaisseaux de ce type à l'Atelier.");
  const taken = left;
  const fromReady = Math.min(left, st.ready?.[unitId] ?? 0);
  if (fromReady > 0 && st.ready) {
    st.ready[unitId] -= fromReady;
    if (st.ready[unitId] <= 0) delete st.ready[unitId];
    left -= fromReady;
  }
  for (let i = st.jobs.length - 1; i >= 0 && left > 0; i--) {
    const job = st.jobs[i];
    if (job.unitId !== unitId) continue;
    const n = Math.min(left, job.count);
    const perHp = job.count > 0 ? job.hpLeft / job.count : 0;
    const perTotal = job.count > 0 ? job.hpTotal / job.count : 0;
    job.count -= n;
    job.hpLeft = Math.max(0, job.hpLeft - perHp * n);
    job.hpTotal = Math.max(0, job.hpTotal - perTotal * n);
    left -= n;
  }
  st.jobs = st.jobs.filter((j) => j.count > 0);
  if (st.ready && !Object.keys(st.ready).length) delete st.ready;
  if (!st.updatedAtMs) st.updatedAtMs = now;
  player.workshop = st;
  return { count: taken, refund: creditScrap(player, { [unitId]: taken }, now) };
}

/**
 * 5.28.1 : unités remises en état hors chantier (épave d'expédition) : elles attendent, « prêtes », une place
 * au hangar (remise en service manuelle, ou automatique au palier 10). Jamais ajoutées directement au hangar (I3).
 */
export function addReady(player: PlayerState, units: Record<string, number>): void {
  const st = workshopState(player);
  const ready = { ...(st.ready ?? {}) };
  for (const [id, n] of Object.entries(units)) {
    const c = Math.floor(n ?? 0);
    if (c > 0) ready[id] = (ready[id] ?? 0) + c;
  }
  if (Object.keys(ready).length) st.ready = ready;
  player.workshop = st;
}

/** 5.28 : réglages du Triage (palier 5) et de l'ordre de réparation (palier 15). */
export function setDockSettings(player: PlayerState, settings: { policy?: unknown; priority?: unknown }): void {
  const st = workshopState(player);
  if (settings.policy !== undefined) {
    if (!POLICIES.includes(settings.policy as DockPolicy)) throw new GameActionError("Réglage du triage inconnu.");
    if (settings.policy !== "repair" && !dockTier(player, "triage")) throw new GameActionError(`Le triage s'ouvre au niveau ${DOCK_TIERS.triage} de la Cale sèche.`);
    if (settings.policy === "repair") delete st.policy;
    else st.policy = settings.policy as DockPolicy;
  }
  if (settings.priority !== undefined) {
    if (!PRIORITIES.includes(settings.priority as DockPriority)) throw new GameActionError("Ordre de réparation inconnu.");
    if (settings.priority !== "arrival" && !dockTier(player, "priority")) throw new GameActionError(`L'ordre de réparation se règle au niveau ${DOCK_TIERS.priority} de la Cale sèche.`);
    if (settings.priority === "arrival") delete st.priority;
    else st.priority = settings.priority as DockPriority;
  }
  player.workshop = st;
}

/**
 * 5.28 : remet en service des vaisseaux prêts, dans la limite de `freePlaces` (places libres du hangar,
 * calculées par l'appelant avec les flottes en vol : voir hangar.ts). Rend les unités rentrées.
 */
export function commissionReady(player: PlayerState, freePlaces: number, unitId?: string): Record<string, number> {
  const st = workshopState(player);
  const moved: Record<string, number> = {};
  let free = Math.max(0, Math.floor(freePlaces));
  const ids = Object.keys(st.ready ?? {}).filter((id) => !unitId || id === unitId);
  for (const id of ids) {
    const space = spaceOf(id);
    const n = Math.min(st.ready![id], Math.floor(free / space));
    if (n <= 0) continue;
    const unit = player.units[id] ?? { level: 1, count: 0 };
    player.units[id] = { ...unit, level: Math.max(1, unit.level || 1), count: (unit.count ?? 0) + n };
    st.ready![id] -= n;
    if (st.ready![id] <= 0) delete st.ready![id];
    free -= n * space;
    moved[id] = n;
  }
  if (st.ready && !Object.keys(st.ready).length) delete st.ready;
  player.workshop = st;
  return moved;
}

export function atelierLevel(player: Pick<PlayerState, "buildings">): number {
  const def = BUILDINGS.find((b) => b.effect?.type === "repair") ?? BUILDINGS.find((b) => b.id === ATELIER_ID);
  return def ? effectiveBuildingLevel(player.buildings ?? {}, def.id) : 0;
}

type RatePlayer = Pick<PlayerState, "buildings"> & Partial<Pick<PlayerState, "units" | "techLevels" | "commanders" | "relics" | "ascensions" | "talents" | "territory" | "synthesis">>;

/** 5.21 : bonus de cadence (Nanoréparation, Mécanicien, Clé de soudure), en fraction. */
export function workshopSpeedBonus(player: RatePlayer): number {
  const grants = allEffects(player);
  // 5.28 : Cale sèche au palier 10 : l'Atelier travaille plus vite.
  const dock = dockLevel(player.buildings ?? {}) >= DOCK_TIERS.auto ? Math.max(0, COMBAT_RULES.dockAutoSpeedBonus) : 0;
  return effectTotal(grants, "tech", "repairSpeed") + effectTotal(grants, "empire", "repairSpeed") + dock;
}

/** 5.21 : PV par seconde ajoutés par les vaisseaux-ateliers à quai. */
export function repairShipRate(player: Partial<Pick<PlayerState, "units">>): number {
  let out = 0;
  for (const [id, u] of Object.entries(player.units ?? {})) {
    const per = findUnit(id)?.workshopHpPerSec ?? 0;
    if (per > 0 && (u?.count ?? 0) > 0) out += per * u.count;
  }
  return out;
}

/** Cadence de réparation (PV par seconde). */
export function workshopRate(player: RatePlayer): number {
  const R = COMBAT_RULES;
  const level = atelierLevel(player);
  const base = level <= 0 ? R.workshopHpPerSec * R.workshopBaseFactor : R.workshopHpPerSec * (1 + R.workshopLevelGain * (level - 1));
  return (base + repairShipRate(player)) * (1 + Math.max(0, workshopSpeedBonus(player)));
}

/** Unités immobilisées à l'Atelier, par type (en cale ou au hangar ; les prêts n'en font pas partie). */
export function workshopUnits(player: Pick<PlayerState, "workshop">): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of workshopState(player).jobs) out[j.unitId] = (out[j.unitId] ?? 0) + j.count;
  return out;
}

/** PV maximum d'un type (stock à la base, unités à l'Atelier exclues). */
export function hullMax(player: Pick<PlayerState, "units" | "techLevels">, unitId: string): number {
  const count = player.units?.[unitId]?.count ?? 0;
  return count > 0 ? count * unitBaseHp(player.units ?? {}, player.techLevels ?? {}, unitId) : 0;
}

/** État de la coque d'un type d'unité, de 0 à 1 (1 = intacte). */
export function hullPercent(player: Pick<PlayerState, "units" | "techLevels" | "workshop">, unitId: string): number {
  const max = hullMax(player, unitId);
  if (!(max > 0)) return 1;
  const missing = Math.min(max * COMBAT_RULES.hullMaxDamage, workshopState(player).hull[unitId] ?? 0);
  return Math.max(0, 1 - missing / max);
}

/** 5.21 : état moyen des coques de toutes les unités, pondéré par les PV (1 = intactes). */
export function overallHull(player: Pick<PlayerState, "units" | "techLevels" | "workshop">): number {
  let max = 0;
  let missing = 0;
  for (const id of Object.keys(player.units ?? {})) {
    const m = hullMax(player, id);
    if (!(m > 0)) continue;
    max += m;
    missing += Math.min(m * COMBAT_RULES.hullMaxDamage, workshopState(player).hull[id] ?? 0);
  }
  return max > 0 ? 1 - missing / max : 1;
}

/**
 * 5.21 : pertes d'un assaut de boss (ou de proie d'élite), à `lossPct` de chaque type :
 * les unités sauvées par l'Atelier partent en réparation, les survivantes gardent une part
 * des PV perdus en dégâts, comme au combat en tours.
 */
export function bossAssaultLosses(player: Pick<PlayerState, "units" | "techLevels">, fleet: Record<string, number>, lossPct: number, repair: number, active: boolean) {
  const survivors: Record<string, number> = {};
  const lost: Record<string, number> = {};
  const recovered: Record<string, number> = {};
  const hull: Record<string, number> = {};
  const share = Math.min(0.95, Math.max(0, COMBAT_RULES.hullDamageShare));
  for (const [id, qty] of Object.entries(fleet)) {
    const raw = active ? Math.floor(qty * lossPct) : 0;
    const saved = Math.floor(raw * repair);
    const gone = raw - saved;
    if (gone > 0) lost[id] = gone;
    if (saved > 0) recovered[id] = saved;
    survivors[id] = qty - raw;
    const wear = active && survivors[id] > 0 ? Math.round(qty * lossPct * (share / (1 - share)) * unitBaseHp(player.units ?? {}, player.techLevels ?? {}, id)) : 0;
    if (wear > 0) hull[id] = wear;
  }
  return { survivors, lost, recovered, hull };
}

/** 5.21 : usure d'un assaut de boss : unités sauvées à l'Atelier, dégâts ajoutés aux coques. */
export function applyBossWear(player: PlayerState, wear: { recovered?: Record<string, number>; hull?: Record<string, number>; survivors?: Record<string, number> }, now: number) {
  if (player.npc) return;
  const st = workshopState(player);
  // Les survivants sont encore en vol : ils comptent dans le stock de PV.
  const stock = { units: withFleet(player.units ?? {}, wear.survivors ?? {}), techLevels: player.techLevels };
  for (const [id, hp] of Object.entries(wear.hull ?? {})) {
    const max = hullMax(stock, id);
    if (hp > 0 && max > 0) st.hull[id] = Math.round(Math.min(max * COMBAT_RULES.hullMaxDamage, (st.hull[id] ?? 0) + hp));
  }
  if (!st.updatedAtMs) st.updatedAtMs = now;
  player.workshop = st;
  sendToWorkshop(player, wear.recovered ?? {}, now, "boss", false);
}

/** Enregistre les dégâts rendus par le moteur de combat (PV manquants par type). */
export function applyHull(player: PlayerState, hull: Record<string, number> | undefined) {
  if (!hull) return;
  const st = workshopState(player);
  for (const [id, hp] of Object.entries(hull)) {
    if (hp > 0) st.hull[id] = Math.round(hp);
    else delete st.hull[id];
  }
  player.workshop = st;
}

/**
 * Envoie à l'Atelier les unités sauvées d'un combat. `fromBase` : elles sont
 * retirées du hangar (défense, attaque résolue à la base) ; sinon elles
 * étaient déjà parties en mission.
 */
export function sendToWorkshop(player: PlayerState, recovered: Record<string, number>, now: number, source: WorkshopSource, fromBase: boolean) {
  if (player.npc) return;
  const st = workshopState(player);
  if (!st.updatedAtMs) st.updatedAtMs = now;
  // 5.28 : Triage (palier 5) : démanteler tout, ou ce qui ne tient pas en cale.
  const policy = dockTier(player, "triage") ? (st.policy ?? "repair") : "repair";
  const scrapped: Record<string, number> = {};
  const added: WorkshopJob[] = [];
  for (const [unitId, n] of Object.entries(recovered ?? {})) {
    const count = Math.floor(n ?? 0);
    if (count <= 0) continue;
    if (fromBase && player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - count);
    if (policy === "scrapAll") {
      scrapped[unitId] = (scrapped[unitId] ?? 0) + count;
      continue;
    }
    const hp = count * unitBaseHp(player.units ?? {}, player.techLevels ?? {}, unitId);
    const job: WorkshopJob = { id: `${now.toString(36)}-${unitId}-${st.jobs.length}`, unitId, count, hpTotal: hp, hpLeft: hp, source, addedAtMs: now };
    st.jobs.push(job);
    added.push(job);
  }
  if (policy === "scrapOverflow" && added.length) {
    const alloc = allocateDock(st, dockCapacity(player, now));
    for (const job of added) {
      const out = job.count - (alloc.jobs[job.id] ?? 0);
      if (out <= 0) continue;
      const per = job.hpTotal / job.count;
      job.count -= out;
      job.hpTotal = per * job.count;
      job.hpLeft = job.hpTotal;
      scrapped[job.unitId] = (scrapped[job.unitId] ?? 0) + out;
    }
    st.jobs = st.jobs.filter((j) => j.count > 0);
  }
  player.workshop = st;
  if (Object.keys(scrapped).length) {
    const refund = creditScrap(player, scrapped, now);
    st.lastScrap = { atMs: now, units: scrapped, refund };
    player.workshop = st;
  }
  // 5.28 : succès « Cale pleine ».
  if (added.length && dockLevel(player.buildings ?? {}) > 0) {
    const alloc = allocateDock(st, dockCapacity(player, now));
    if (alloc.capacity > 0 && alloc.used >= alloc.capacity) bumpStat(player, "dockFull");
  }
}

/**
 * 5.21 : un seigneur de guerre garde ses dégâts mais n'a pas d'Atelier : ses équipages
 * réparent une part fixe de ses PV par heure (sa puissance est sans commune mesure avec
 * une cadence en PV par seconde). Ses unités sauvées reviennent toujours aussitôt.
 */
function advanceWarlordHull(player: PlayerState, now: number, instant: boolean) {
  const st = workshopState(player);
  const hours = Math.max(0, (now - (st.updatedAtMs || now)) / 3600_000);
  st.updatedAtMs = now;
  for (const id of Object.keys(st.hull)) {
    const max = hullMax(player, id);
    const left = instant || !(max > 0) ? 0 : st.hull[id] - max * COMBAT_RULES.warlordHullRepairPerHour * hours;
    if (left < 1) delete st.hull[id];
    else st.hull[id] = Math.round(left);
  }
  st.jobs = [];
  player.workshop = st;
}

/** Fait avancer les réparations jusqu'à `now`. Rend les unités réparées et une notification. */
export function advanceWorkshop(player: PlayerState, now: number, instant = false): NewNotification[] {
  const w = player.workshop;
  if (!w) return [];
  if (player.npc) {
    advanceWarlordHull(player, now, instant);
    return [];
  }
  const st = workshopState(player);
  const since = st.updatedAtMs || now;
  let budget = instant ? Infinity : Math.max(0, (now - since) / 1000) * workshopRate(player);
  st.updatedAtMs = now;
  orderJobs(st, player);
  const capacity = dockCapacity(player, now);
  const done: Record<string, number> = {};
  const docked: Record<string, number> = {};
  while (st.jobs.length && budget > 0) {
    const job = st.jobs[0];
    const spend = Math.min(budget, job.hpLeft);
    job.hpLeft -= spend;
    budget -= spend;
    if (job.hpLeft > 0.5) break;
    finishJob(player, st, job, capacity, done, docked);
  }
  // Puis les coques abîmées, les plus atteintes d'abord.
  const hullIds = Object.keys(st.hull).sort((a, b) => (st.hull[b] ?? 0) - (st.hull[a] ?? 0));
  for (const id of hullIds) {
    // Type d'unité disparu du jeu : rien à réparer. (Les unités en mission gardent leurs dégâts.)
    if (!player.units[id]) {
      delete st.hull[id];
      continue;
    }
    if (budget <= 0) continue;
    const spend = Math.min(budget, st.hull[id]);
    st.hull[id] -= spend;
    budget -= spend;
    if (st.hull[id] < 1) delete st.hull[id];
    else st.hull[id] = Math.round(st.hull[id]);
  }
  player.workshop = st;
  // 5.26.1 : succès « unités réparées ».
  bumpStat(player, "unitsRepaired", Object.values(done).reduce((a, b) => a + b, 0) + Object.values(docked).reduce((a, b) => a + b, 0));
  return repairNotes(done, docked, now);
}

/** Lot terminé : la part posée en Cale sèche devient « prête », le reste rentre au hangar (il y avait sa place). */
function finishJob(player: PlayerState, st: PlayerWorkshop, job: WorkshopJob, capacity: number, done: Record<string, number>, docked: Record<string, number>) {
  const inDock = Math.min(job.count, allocateDock(st, capacity).jobs[job.id] ?? 0);
  st.jobs = st.jobs.filter((j) => j !== job);
  const home = job.count - inDock;
  if (home > 0) {
    const unit = player.units[job.unitId] ?? { level: 1, count: 0 };
    player.units[job.unitId] = { ...unit, level: Math.max(1, unit.level || 1), count: (unit.count ?? 0) + home };
    done[job.unitId] = (done[job.unitId] ?? 0) + home;
  }
  if (inDock > 0) {
    st.ready = { ...(st.ready ?? {}), [job.unitId]: (st.ready?.[job.unitId] ?? 0) + inDock };
    docked[job.unitId] = (docked[job.unitId] ?? 0) + inDock;
  }
}

function repairNotes(done: Record<string, number>, docked: Record<string, number>, now: number): NewNotification[] {
  const list = (m: Record<string, number>) => Object.entries(m).map(([id, n]) => `${n} × ${findUnit(id)?.name ?? id}`).join(", ");
  const parts: string[] = [];
  if (Object.keys(done).length) parts.push(`De retour au hangar : ${list(done)}.`);
  if (Object.keys(docked).length) parts.push(`Prêts en Cale sèche, à remettre en service : ${list(docked)}.`);
  if (!parts.length) return [];
  return [{ kind: "building", title: "Atelier : réparations terminées", message: parts.join(" "), createdAtMs: now, read: false, link: "/game/batiments?onglet=atelier" }];
}

export interface WorkshopEta {
  jobs: { job: WorkshopJob; endsAtMs: number }[];
  /** Fin de la réparation des coques (null : rien à réparer). */
  hullDoneAtMs: number | null;
  rate: number;
}

/** Heures de fin prévues (affichage), à la cadence actuelle. */
export function workshopEta(player: PlayerState, now: number): WorkshopEta {
  const st = workshopState(player);
  const rate = workshopRate(player);
  // Avance déjà acquise depuis la dernière mise à jour.
  let carry = Math.max(0, (now - (st.updatedAtMs || now)) / 1000) * rate;
  let t = now;
  const jobs = st.jobs.map((job) => {
    const left = Math.max(0, job.hpLeft - carry);
    carry = Math.max(0, carry - job.hpLeft);
    t += (left / rate) * 1000;
    return { job, endsAtMs: t };
  });
  const hullLeft = Math.max(0, Object.entries(st.hull).reduce((s, [id, hp]) => s + ((player.units[id]?.count ?? 0) > 0 ? hp : 0), 0) - carry);
  return { jobs, hullDoneAtMs: hullLeft > 0 ? t + (hullLeft / rate) * 1000 : null, rate };
}

/** Unités du joueur augmentées d'une flotte en mission (stock total, pour répartir les dégâts). */
export function withFleet(units: Units, fleet: Record<string, number>): Units {
  const out: Units = { ...units };
  for (const [id, n] of Object.entries(fleet ?? {})) {
    if (!(n > 0)) continue;
    const u = out[id] ?? { level: 1, count: 0 };
    out[id] = { ...u, count: (u.count ?? 0) + n };
  }
  return out;
}

export interface WorkshopView {
  rate: number;
  level: number;
  jobs: { job: WorkshopJob; endsAtMs: number; progress: number }[];
  /** Types d'unités abîmés (à la base), du plus atteint au moins atteint. */
  hulls: { unitId: string; percent: number; missing: number; count: number }[];
  hullDoneAtMs: number | null;
  /** Fin de toutes les réparations (file + coques). */
  doneAtMs: number | null;
  /** 5.28 : Cale sèche (postes, lots en cale, vaisseaux prêts). */
  dock: DockAllocation & { level: number };
}

/** Vue de l'Atelier à l'instant `now` (avance simulée depuis la dernière mise à jour du serveur). */
export function workshopView(player: PlayerState, now: number): WorkshopView {
  const clone = { ...player, units: structuredClone(player.units ?? {}), workshop: player.workshop ? structuredClone(player.workshop) : player.workshop } as PlayerState;
  advanceWorkshop(clone, now);
  const eta = workshopEta(clone, now);
  const st = workshopState(clone);
  const hulls = Object.entries(st.hull)
    .filter(([id, hp]) => hp > 0 && (clone.units[id]?.count ?? 0) > 0)
    .map(([unitId, missing]) => ({ unitId, percent: hullPercent(clone, unitId), missing: Math.min(missing, hullMax(clone, unitId) * COMBAT_RULES.hullMaxDamage), count: clone.units[unitId]?.count ?? 0 }))
    .sort((a, b) => a.percent - b.percent);
  const jobs = eta.jobs.map(({ job, endsAtMs }) => ({ job, endsAtMs, progress: job.hpTotal > 0 ? 1 - job.hpLeft / job.hpTotal : 1 }));
  const lastJob = jobs.length ? jobs[jobs.length - 1].endsAtMs : null;
  const dock = { ...allocateDock(st, dockCapacity(clone, now)), level: dockLevel(player.buildings ?? {}) };
  return { rate: eta.rate, level: atelierLevel(player), jobs, hulls, hullDoneAtMs: eta.hullDoneAtMs, doneAtMs: eta.hullDoneAtMs ?? lastJob, dock };
}

/* ---------- 5.21 : réparation accélérée à l'Ambre ---------- */

/** Ambre pour terminer tout de suite un lot (`jobId`) ou toute la file : 1 Ambre par tranche de secondes restantes. */
export function workshopRushCost(player: RatePlayer & Pick<PlayerState, "workshop">, jobId?: string): { amber: number; seconds: number; jobs: WorkshopJob[] } {
  const st = workshopState(player);
  const jobs = jobId ? st.jobs.filter((j) => j.id === jobId) : st.jobs;
  const hp = jobs.reduce((a, j) => a + Math.max(0, j.hpLeft), 0);
  const seconds = Math.ceil(hp / Math.max(0.01, workshopRate(player)));
  const amber = jobs.length ? Math.max(1, Math.ceil(seconds / Math.max(1, COMBAT_RULES.workshopRushSecondsPerAmber))) : 0;
  return { amber, seconds, jobs };
}

/** Termine un lot (ou toute la file) contre de l'Ambre : les unités rentrent au hangar. Rend le coût payé. */
export function rushWorkshop<W extends { amber: number }>(player: PlayerState, jobId: string | undefined, now: number, walletOf: (p: PlayerState) => W, saveWallet: (p: PlayerState, w: W) => void): { amber: number; units: Record<string, number>; ready: Record<string, number> } {
  const { amber, jobs } = workshopRushCost(player, jobId);
  if (!jobs.length) throw new GameActionError(jobId ? "Ce lot n'est plus à l'Atelier." : "Aucune unité à l'Atelier.");
  const wallet = walletOf(player);
  spendAmber(player, wallet, amber, `Il faut ${amber} Ambre de Ruche pour terminer ces réparations.`);
  saveWallet(player, wallet);
  const st = workshopState(player);
  const ids = new Set(jobs.map((j) => j.id));
  const capacity = dockCapacity(player, now);
  const units: Record<string, number> = {};
  const ready: Record<string, number> = {};
  // 5.28 : la part en Cale sèche devient « prête » (place au hangar à trouver), le reste rentre.
  for (const job of st.jobs.filter((j) => ids.has(j.id))) finishJob(player, st, job, capacity, units, ready);
  if (!st.updatedAtMs) st.updatedAtMs = now;
  player.workshop = st;
  bumpStat(player, "unitsRepaired", Object.values(units).reduce((a, b) => a + b, 0) + Object.values(ready).reduce((a, b) => a + b, 0));
  return { amber, units, ready };
}
