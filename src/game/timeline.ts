import { targetsPlayer } from "@/game/fleets";
import { workshopView } from "@/game/workshop";
import { findBuilding } from "@/game/buildings";
import { MISSIONS } from "@/game/missions";
import { findTech } from "@/game/technologies";
import { findUnit, getUnitBuildTime } from "@/game/units";
import type { PlayerState, QueuesState } from "@/types/game";
import type { Fleet } from "@/game/fleets";

/* =====================================================
   Frise « Prochaines fins » du tableau de bord : tout ce qui se termine
   bientôt (constructions, recherches, missions, files d'unités), trié par
   date de fin.
===================================================== */

export type TimelineKind = "building" | "research" | "mission" | "units" | "fleet" | "hostile" | "colony" | "repair";

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  label: string;
  endTime: number;
  /** Page où agir sur l'élément. */
  to: string;
}

export function upcomingEvents(
  queues: QueuesState | null,
  now: number,
  fleets: Fleet[] = [],
  uid?: string,
  /** v4.9.3 : chantiers des colonies et vaisseau colonial, sur la même frise. */
  empire?: Pick<PlayerState, "colonies" | "colonizing"> | null,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  // 5.21 : unités immobilisées à l'Atelier de réparation (retour au hangar).
  const full = empire as PlayerState | null | undefined;
  if (full?.workshop?.jobs?.length && full.units) {
    for (const { job, endsAtMs } of workshopView(full, now).jobs) {
      events.push({ id: `w:${job.id}`, kind: "repair", label: `Atelier : ${job.count} ${findUnit(job.unitId)?.name ?? job.unitId}`, endTime: endsAtMs, to: "/game/batiments?onglet=atelier" });
    }
  }
  for (const c of empire?.colonies ?? []) {
    if (c.building) events.push({ id: `cb:${c.id}`, kind: "colony", label: `${c.name} : ${findBuilding(c.building.id)?.name ?? c.building.id} niv. ${c.building.level}`, endTime: c.building.endTime, to: "/game/colonies" });
    if (c.defenseJob) events.push({ id: `cd:${c.id}`, kind: "colony", label: `${c.name} : ${c.defenseJob.qty} ${findUnit(c.defenseJob.unitId)?.name ?? c.defenseJob.unitId}`, endTime: c.defenseJob.endTime, to: "/game/colonies" });
  }
  if (empire?.colonizing) events.push({ id: "colonizing", kind: "colony", label: `Fondation de ${empire.colonizing.name}`, endTime: empire.colonizing.endTime, to: "/game/colonies" });
  for (const f of fleets) {
    const mission = f.mission ?? "attack";
    if (f.status === "outbound" && targetsPlayer(f, uid) && f.ownerUid !== uid && (mission === "attack" || mission === "pirate")) {
      const label = mission === "pirate" ? `Raid : ${f.ownerPseudo}` : `Attaque de ${f.ownerPseudo}`;
      events.push({ id: `h:${f.id}`, kind: "hostile", label, endTime: f.arriveAtMs, to: mission === "pirate" ? "/game/menaces" : "/game/galaxie" });
    } else if (f.ownerUid === uid && f.status === "outbound") {
      const label =
        mission === "patrol" ? "Demi-tour de la patrouille" : mission === "spy" ? `Sondes sur ${f.targetPseudo}` : mission === "recycle" ? `Débris de ${f.targetPseudo}` : mission === "garrison" ? `Garnison chez ${f.targetPseudo}` : mission === "delivery" ? `Livraison à ${f.targetPseudo}` : `Impact sur ${f.targetPseudo}`;
      events.push({ id: `f:${f.id}`, kind: "fleet", label, endTime: f.arriveAtMs, to: "/game/galaxie" });
    } else if (f.ownerUid === uid && f.status === "stationed" && f.stationedUntilMs) {
      events.push({ id: `f:${f.id}`, kind: "fleet", label: `Fin de garnison chez ${f.targetPseudo}`, endTime: f.stationedUntilMs, to: "/game/galaxie" });
    } else if (f.ownerUid === uid && f.status === "returning" && f.returnAtMs) {
      const label = mission === "patrol" ? "Retour de patrouille" : `Retour de ${f.targetPseudo}`;
      events.push({ id: `f:${f.id}`, kind: "fleet", label, endTime: f.returnAtMs, to: "/game/galaxie" });
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
