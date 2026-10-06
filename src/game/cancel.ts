import { playerBuildingDiscount, playerBuildTimeFactor, playerResearchTimeFactor } from "@/game/bonuses";
import { bountyState } from "@/game/bounties";
import { applyBuildingDiscount, findBuilding, getBuildingUpgradeCost, getBuildingUpgradeTime } from "@/game/buildings";
import { colonyBuildingName, colonyDefenseSeconds, colonyOf, colonyUpgradeCost, colonyUpgradeSeconds, startNextColonyDefense } from "@/game/colonies";
import { GameActionError } from "@/game/errors";
import { findTech, getTechCost, getTechTime } from "@/game/technologies";
import { findUnit, getUnitBuildTime } from "@/game/units";
import { playerUnitCost } from "@/game/effectTargets";
import type { PlayerState, QueuesState, ResourceId, UnitQueueEntry } from "@/types/game";

/* =====================================================
   v4.7 : annulation d'un chantier (bâtiment, recherche, unités, travaux
   de colonie). Remboursement : 100 % dans la première minute ou pour ce
   qui n'a pas commencé, sinon 80 % de la part non écoulée. Le
   remboursement ignore la limite de l'entrepôt.
===================================================== */

export const CANCEL_RULES = {
  /** Annulation intégrale dans ce délai après le lancement (clic par erreur). */
  graceMs: 60_000,
  /** Part remboursée du temps restant. */
  refundPct: 0.8,
};

type Cost = Partial<Record<ResourceId, number>>;

/** Part du coût rendue selon l'avancement. */
export function refundFraction(startMs: number, endMs: number, now: number): number {
  if (now - startMs <= CANCEL_RULES.graceMs) return 1;
  const total = endMs - startMs;
  if (!(total > 0)) return 0;
  const remaining = Math.min(1, Math.max(0, (endMs - now) / total));
  return remaining * CANCEL_RULES.refundPct;
}

export function scaleCost(cost: Cost, fraction: number): Cost {
  const out: Cost = {};
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) {
    const v = Math.floor((n ?? 0) * fraction);
    if (v > 0) out[res] = v;
  }
  return out;
}

function addCost(a: Cost, b: Cost): Cost {
  const out: Cost = { ...a };
  for (const [res, n] of Object.entries(b) as [ResourceId, number][]) out[res] = (out[res] ?? 0) + (n ?? 0);
  return out;
}

function credit(target: Partial<Record<ResourceId, number>>, refund: Cost) {
  for (const [res, n] of Object.entries(refund) as [ResourceId, number][]) target[res] = (target[res] ?? 0) + (n ?? 0);
}

export type CancelTarget =
  | { kind: "building"; id: string }
  | { kind: "research"; id: string }
  | { kind: "units"; category: "attack" | "defense"; index: number }
  | { kind: "colonyBuilding"; colonyId: string }
  | { kind: "colonyDefense"; colonyId: string; /** 6.4 : 0 ou absent = lot en construction ; n ≥ 1 = n-ième lot en attente. */ index?: number };

export interface CancelQuote {
  refund: Cost;
  /** Part remboursée (0 → 1) de la partie annulée. */
  fraction: number;
  label: string;
  /** v5.9 : ambre rendu (recherche qui en coûtait). */
  amber?: number;
}

/** Lot d'unités : entrées consécutives du même type à partir de `index`. */
export function unitGroupAt(queue: UnitQueueEntry[], index: number): { start: number; count: number } | null {
  if (index < 0 || index >= queue.length) return null;
  const unitId = queue[index].unitId;
  let start = index;
  while (start > 0 && queue[start - 1].unitId === unitId) start--;
  let end = index;
  while (end + 1 < queue.length && queue[end + 1].unitId === unitId) end++;
  return { start, count: end - start + 1 };
}

/** Lots d'une file (affichage) : type, quantité, premier index, en cours ou non. */
export function unitGroups(queue: UnitQueueEntry[]): { unitId: string; index: number; count: number; running: boolean }[] {
  const groups: { unitId: string; index: number; count: number; running: boolean }[] = [];
  queue.forEach((e, i) => {
    const last = groups[groups.length - 1];
    if (last && last.unitId === e.unitId) last.count++;
    else groups.push({ unitId: e.unitId, index: i, count: 1, running: false });
  });
  if (groups[0] && queue[0]?.endTime) groups[0].running = true;
  return groups;
}

/** Calcule le remboursement sans rien modifier. */
export function quoteCancel(player: PlayerState, queues: QueuesState, target: CancelTarget, now: number): CancelQuote {
  switch (target.kind) {
    case "building": {
      const entry = queues.buildingUpgrades[target.id as keyof typeof queues.buildingUpgrades];
      const def = findBuilding(target.id);
      if (!entry || !def) throw new GameActionError("Aucune amélioration en cours pour ce bâtiment.");
      const level = (player.buildings[target.id]?.level ?? 0) + 1;
      const paid = entry.paid ?? applyBuildingDiscount(getBuildingUpgradeCost(def, level), playerBuildingDiscount(player));
      const start = entry.startedAtMs ?? entry.endTime - Math.round(getBuildingUpgradeTime(def, level) * playerBuildTimeFactor(player, now)) * 1000;
      const fraction = refundFraction(start, entry.endTime, now);
      return { refund: scaleCost(paid, fraction), fraction, label: `${def.name} niveau ${level}` };
    }
    case "research": {
      const entry = queues.activeResearches.find((r) => r.id === target.id);
      const tech = findTech(target.id);
      if (!entry || !tech) throw new GameActionError("Cette recherche n'est pas en cours.");
      const level = (player.techLevels[target.id] ?? 0) + 1;
      const paid = entry.paid ?? getTechCost(tech, level);
      const start = entry.startedAtMs ?? entry.endTime - Math.round(getTechTime(tech, level) * playerResearchTimeFactor(player, now)) * 1000;
      const fraction = refundFraction(start, entry.endTime, now);
      const amber = Math.floor((entry.paidAmber ?? 0) * fraction);
      return { refund: scaleCost(paid, fraction), fraction, label: `${tech.nom} niveau ${level}`, ...(amber > 0 ? { amber } : {}) };
    }
    case "units": {
      const queue = queues.unitQueues[target.category];
      const group = unitGroupAt(queue, target.index);
      const unit = group ? findUnit(queue[group.start].unitId) : undefined;
      if (!group || !unit) throw new GameActionError("Ce lot n'est plus dans la file.");
      const each: Cost = playerUnitCost(unit, player, now);
      let refund: Cost = {};
      let fraction = 1;
      for (let i = group.start; i < group.start + group.count; i++) {
        const e = queue[i];
        if (e.endTime) {
          // Unité en cours : au prorata de son propre temps de fabrication.
          const f = refundFraction(e.endTime - getUnitBuildTime(unit, player.techLevels, player) * 1000, e.endTime, now);
          fraction = Math.min(fraction, f);
          refund = addCost(refund, scaleCost(each, f));
        } else refund = addCost(refund, each);
      }
      return { refund, fraction, label: `${group.count} × ${unit.name}` };
    }
    case "colonyBuilding": {
      const colony = colonyOf(player, target.colonyId);
      const job = colony?.building;
      if (!colony || !job) throw new GameActionError("Aucune construction en cours sur cette colonie.");
      const paid = job.paid ?? colonyUpgradeCost(player, job.id, job.level);
      const start = job.startedAtMs ?? job.endTime - colonyUpgradeSeconds(player, job.id, job.level, now) * 1000;
      const fraction = refundFraction(start, job.endTime, now);
      return { refund: scaleCost(paid, fraction), fraction, label: `${colony.name} : ${colonyBuildingName(colony, job.id)} niveau ${job.level}` };
    }
    case "colonyDefense": {
      const colony = colonyOf(player, target.colonyId);
      const waiting = target.index && target.index > 0 ? colony?.defenseQueue?.[target.index - 1] : undefined;
      if (target.index && target.index > 0) {
        const wu = waiting ? findUnit(waiting.unitId) : undefined;
        if (!colony || !waiting || !wu) throw new GameActionError("Ce lot n'est plus dans la file.");
        // Pas encore commencé : remboursé en entier.
        return { refund: scaleCost(waiting.paid ?? {}, 1), fraction: 1, label: `${colony.name} : ${waiting.qty} × ${wu.name} (en attente)` };
      }
      const job = colony?.defenseJob;
      const unit = job ? findUnit(job.unitId) : undefined;
      if (!colony || !job || !unit) throw new GameActionError("Aucune défense en construction sur cette colonie.");
      const paid = job.paid ?? { scrap: unit.cost.scrap * job.qty, energy: unit.cost.energy * job.qty };
      const start = job.startedAtMs ?? job.endTime - colonyDefenseSeconds(player, job.unitId, job.qty, colony) * 1000;
      const fraction = refundFraction(start, job.endTime, now);
      return { refund: scaleCost(paid, fraction), fraction, label: `${colony.name} : ${job.qty} × ${unit.name}` };
    }
  }
}

/** Annule le chantier et rembourse (ressources de la planète concernée). */
export function performCancel(player: PlayerState, queues: QueuesState, target: CancelTarget, now: number): CancelQuote {
  const quote = quoteCancel(player, queues, target, now);
  switch (target.kind) {
    case "building":
      delete queues.buildingUpgrades[target.id as keyof typeof queues.buildingUpgrades];
      credit(player.resources, quote.refund);
      break;
    case "research":
      queues.activeResearches = queues.activeResearches.filter((r) => r.id !== target.id);
      credit(player.resources, quote.refund);
      if (quote.amber) {
        const bounty = bountyState(player);
        bounty.amber += quote.amber;
        player.bounties = bounty;
      }
      break;
    case "units": {
      const queue = queues.unitQueues[target.category];
      const group = unitGroupAt(queue, target.index)!;
      const wasRunning = group.start === 0 && !!queue[0]?.endTime;
      queue.splice(group.start, group.count);
      // La file reprend aussitôt avec le lot suivant.
      if (wasRunning && queue[0] && !queue[0].endTime) {
        const next = findUnit(queue[0].unitId);
        queue[0].endTime = now + (next ? getUnitBuildTime(next, player.techLevels, player) : 0) * 1000;
      }
      credit(player.resources, quote.refund);
      break;
    }
    case "colonyBuilding": {
      const colony = colonyOf(player, target.colonyId)!;
      colony.building = null;
      credit(colony.resources, quote.refund);
      break;
    }
    case "colonyDefense": {
      const colony = colonyOf(player, target.colonyId)!;
      if (target.index && target.index > 0) {
        colony.defenseQueue!.splice(target.index - 1, 1);
        if (colony.defenseQueue!.length === 0) delete colony.defenseQueue;
      } else {
        colony.defenseJob = null;
        // La file reprend aussitôt avec le lot suivant.
        startNextColonyDefense(colony, player, now);
      }
      credit(colony.resources, quote.refund);
      break;
    }
  }
  return quote;
}

export function isCancelTarget(raw: unknown): raw is CancelTarget {
  const t = raw as Partial<CancelTarget> & Record<string, unknown>;
  if (!t || typeof t !== "object") return false;
  switch (t.kind) {
    case "building":
    case "research":
      return typeof t.id === "string" && !!t.id;
    case "units":
      return (t.category === "attack" || t.category === "defense") && Number.isInteger(t.index) && (t.index as number) >= 0;
    case "colonyBuilding":
    case "colonyDefense":
      return typeof t.colonyId === "string" && !!t.colonyId && (t.index === undefined || (Number.isInteger(t.index) && (t.index as number) >= 0));
    default:
      return false;
  }
}
