import { bumpStat } from "@/game/stats";
import { COMBAT_RULES, unitBaseHp } from "@/game/combat";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { findUnit } from "@/game/units";
import { effectTotal } from "@/game/effects";
import { allEffects } from "@/game/modifiers";
import type { NewNotification } from "@/game/flush";
import { GameActionError } from "@/game/errors";
import type { PlayerState, Units } from "@/types/game";

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

export interface PlayerWorkshop {
  updatedAtMs: number;
  jobs: WorkshopJob[];
  /** PV manquants par type d'unité (tout le stock). */
  hull: Record<string, number>;
}

const ATELIER_ID = "atelier_reparation";

export function workshopState(player: Pick<PlayerState, "workshop">): PlayerWorkshop {
  const w = player.workshop;
  return {
    updatedAtMs: w?.updatedAtMs ?? 0,
    jobs: Array.isArray(w?.jobs) ? w!.jobs.filter((j) => j && j.count > 0) : [],
    hull: w?.hull && typeof w.hull === "object" ? { ...w.hull } : {},
  };
}

export function atelierLevel(player: Pick<PlayerState, "buildings">): number {
  const def = BUILDINGS.find((b) => b.effect?.type === "repair") ?? BUILDINGS.find((b) => b.id === ATELIER_ID);
  return def ? effectiveBuildingLevel(player.buildings ?? {}, def.id) : 0;
}

type RatePlayer = Pick<PlayerState, "buildings"> & Partial<Pick<PlayerState, "units" | "techLevels" | "commanders" | "relics" | "ascensions" | "talents" | "territory" | "synthesis">>;

/** 5.21 : bonus de cadence (Nanoréparation, Mécanicien, Clé de soudure), en fraction. */
export function workshopSpeedBonus(player: RatePlayer): number {
  const grants = allEffects(player);
  return effectTotal(grants, "tech", "repairSpeed") + effectTotal(grants, "empire", "repairSpeed");
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

/** Unités immobilisées à l'Atelier, par type (elles gardent leur place de hangar). */
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
  for (const [unitId, n] of Object.entries(recovered ?? {})) {
    const count = Math.floor(n ?? 0);
    if (count <= 0) continue;
    if (fromBase && player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - count);
    const hp = count * unitBaseHp(player.units ?? {}, player.techLevels ?? {}, unitId);
    st.jobs.push({ id: `${now.toString(36)}-${unitId}-${st.jobs.length}`, unitId, count, hpTotal: hp, hpLeft: hp, source, addedAtMs: now });
  }
  player.workshop = st;
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
  const done: Record<string, number> = {};
  while (st.jobs.length && budget > 0) {
    const job = st.jobs[0];
    const spend = Math.min(budget, job.hpLeft);
    job.hpLeft -= spend;
    budget -= spend;
    if (job.hpLeft > 0.5) break;
    st.jobs.shift();
    const unit = player.units[job.unitId] ?? { level: 1, count: 0 };
    player.units[job.unitId] = { ...unit, level: Math.max(1, unit.level || 1), count: (unit.count ?? 0) + job.count };
    done[job.unitId] = (done[job.unitId] ?? 0) + job.count;
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
  bumpStat(player, "unitsRepaired", Object.values(done).reduce((a, b) => a + b, 0));
  const names = Object.entries(done).map(([id, n]) => `${n} × ${findUnit(id)?.name ?? id}`);
  if (!names.length) return [];
  return [{ kind: "building", title: "Atelier : réparations terminées", message: `De retour au hangar : ${names.join(", ")}.`, createdAtMs: now, read: false, link: "/game/batiments?onglet=atelier" }];
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
  return { rate: eta.rate, level: atelierLevel(player), jobs, hulls, hullDoneAtMs: eta.hullDoneAtMs, doneAtMs: eta.hullDoneAtMs ?? lastJob };
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
export function rushWorkshop<W extends { amber: number }>(player: PlayerState, jobId: string | undefined, now: number, walletOf: (p: PlayerState) => W, saveWallet: (p: PlayerState, w: W) => void): { amber: number; units: Record<string, number> } {
  const { amber, jobs } = workshopRushCost(player, jobId);
  if (!jobs.length) throw new GameActionError(jobId ? "Ce lot n'est plus à l'Atelier." : "Aucune unité à l'Atelier.");
  const wallet = walletOf(player);
  if (wallet.amber < amber) throw new GameActionError(`Il faut ${amber} Ambre de Ruche pour terminer ces réparations.`);
  wallet.amber -= amber;
  saveWallet(player, wallet);
  const st = workshopState(player);
  const ids = new Set(jobs.map((j) => j.id));
  const units: Record<string, number> = {};
  for (const job of jobs) {
    const unit = player.units[job.unitId] ?? { level: 1, count: 0 };
    player.units[job.unitId] = { ...unit, level: Math.max(1, unit.level || 1), count: (unit.count ?? 0) + job.count };
    units[job.unitId] = (units[job.unitId] ?? 0) + job.count;
  }
  st.jobs = st.jobs.filter((j) => !ids.has(j.id));
  if (!st.updatedAtMs) st.updatedAtMs = now;
  player.workshop = st;
  bumpStat(player, "unitsRepaired", Object.values(units).reduce((a, b) => a + b, 0));
  return { amber, units };
}
