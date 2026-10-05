import { COMBAT_RULES, unitBaseHp } from "@/game/combat";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { findUnit } from "@/game/units";
import type { NewNotification, PlayerState, Units } from "@/types/game";

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

export type WorkshopSource = "attack" | "defense" | "bounty" | "lair" | "raid" | "expedition";

export const WORKSHOP_SOURCE_LABELS: Record<WorkshopSource, string> = {
  attack: "Attaque",
  defense: "Défense",
  bounty: "Prime",
  lair: "Repaire",
  raid: "Raid repoussé",
  expedition: "Expédition",
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

/** Cadence de réparation (PV par seconde). */
export function workshopRate(player: Pick<PlayerState, "buildings">): number {
  const R = COMBAT_RULES;
  const level = atelierLevel(player);
  if (level <= 0) return R.workshopHpPerSec * R.workshopBaseFactor;
  return R.workshopHpPerSec * (1 + R.workshopLevelGain * (level - 1));
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

/** Enregistre les dégâts rendus par le moteur de combat (PV manquants par type). */
export function applyHull(player: PlayerState, hull: Record<string, number> | undefined) {
  if (!hull || player.npc) return;
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

/** Fait avancer les réparations jusqu'à `now`. Rend les unités réparées et une notification. */
export function advanceWorkshop(player: PlayerState, now: number, instant = false): NewNotification[] {
  const w = player.workshop;
  if (!w || player.npc) return [];
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
