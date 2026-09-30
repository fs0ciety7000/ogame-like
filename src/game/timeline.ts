import { findBuilding } from "@/game/buildings";
import { MISSIONS } from "@/game/missions";
import { findTech } from "@/game/technologies";
import { findUnit, getUnitBuildTime } from "@/game/units";
import type { QueuesState } from "@/types/game";
import type { Fleet } from "@/game/fleets";

/* =====================================================
   Frise « Prochaines fins » du tableau de bord : tout ce qui se termine
   bientôt (constructions, recherches, missions, files d'unités), trié par
   date de fin.
===================================================== */

export type TimelineKind = "building" | "research" | "mission" | "units" | "fleet" | "hostile";

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  label: string;
  endTime: number;
  /** Page où agir sur l'élément. */
  to: string;
}

export function upcomingEvents(queues: QueuesState | null, now: number, fleets: Fleet[] = [], uid?: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const f of fleets) {
    if (f.status === "outbound" && f.targetUid === uid) {
      events.push({ id: `h:${f.id}`, kind: "hostile", label: `Attaque de ${f.ownerPseudo}`, endTime: f.arriveAtMs, to: "/game/galaxie" });
    } else if (f.ownerUid === uid && f.status === "outbound") {
      events.push({ id: `f:${f.id}`, kind: "fleet", label: `Impact sur ${f.targetPseudo}`, endTime: f.arriveAtMs, to: "/game/galaxie" });
    } else if (f.ownerUid === uid && f.status === "returning" && f.returnAtMs) {
      events.push({ id: `f:${f.id}`, kind: "fleet", label: `Retour de ${f.targetPseudo}`, endTime: f.returnAtMs, to: "/game/galaxie" });
    }
  }
  if (!queues) return events.sort((a, b) => a.endTime - b.endTime);

  for (const [id, upgrade] of Object.entries(queues.buildingUpgrades ?? {})) {
    if (!upgrade) continue;
    events.push({ id: `b:${id}`, kind: "building", label: findBuilding(id)?.name ?? id, endTime: upgrade.endTime, to: "/game/batiments" });
  }
  for (const r of queues.activeResearches ?? []) {
    events.push({ id: `r:${r.id}`, kind: "research", label: findTech(r.id)?.nom ?? r.id, endTime: r.endTime, to: "/game/labo" });
  }
  for (const m of queues.activeMissions ?? []) {
    events.push({ id: `m:${m.key}`, kind: "mission", label: MISSIONS[m.key]?.name ?? m.key, endTime: m.endTime, to: "/game/missions" });
  }

  // Files d'unités : seule la première a une date de fin, les suivantes
  // s'enchaînent. On annonce la fin de toute la file.
  for (const [category, queue] of Object.entries(queues.unitQueues ?? {})) {
    if (!queue || queue.length === 0) continue;
    let end = queue[0].endTime ?? now;
    for (const item of queue.slice(1)) {
      const unit = findUnit(item.unitId);
      end += (unit ? getUnitBuildTime(unit) : 0) * 1000;
    }
    const first = findUnit(queue[0].unitId)?.name ?? queue[0].unitId;
    const label = queue.length === 1 ? first : `${queue.length} unités (${category === "attack" ? "attaque" : "défense"})`;
    events.push({ id: `u:${category}`, kind: "units", label, endTime: end, to: "/game/unites" });
  }

  return events.filter((e) => Number.isFinite(e.endTime)).sort((a, b) => a.endTime - b.endTime);
}

/** Position (0 → 1) d'une échéance sur la frise. Échelle en racine carrée :
 *  les fins proches restent lisibles même quand une autre est à 12 h. */
export function timelinePosition(endTime: number, now: number, horizonMs: number): number {
  if (horizonMs <= 0) return 0;
  const t = Math.min(1, Math.max(0, (endTime - now) / horizonMs));
  return Math.sqrt(t);
}

/** Horizon de la frise : la dernière échéance, arrondie, entre 1 h et 24 h. */
export function timelineHorizon(events: TimelineEvent[], now: number): number {
  const HOUR = 3600_000;
  const last = events.reduce((m, e) => Math.max(m, e.endTime - now), 0);
  const steps = [HOUR, 2 * HOUR, 4 * HOUR, 8 * HOUR, 12 * HOUR, 24 * HOUR];
  return steps.find((s) => s >= last) ?? 24 * HOUR;
}
