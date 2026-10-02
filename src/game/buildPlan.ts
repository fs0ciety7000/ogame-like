import { playerBuildTimeFactor } from "@/game/bonuses";
import { applyBuildingDiscount, findBuilding, getBuildingUpgradeCost, getBuildingUpgradeTime } from "@/game/buildings";
import { recordContract } from "@/game/contracts";
import { GameActionError } from "@/game/errors";
import { canAffordAll } from "@/game/resources";
import { bumpStat } from "@/game/stats";
import type { NewNotification } from "@/game/flush";
import type { PlayerState, QueuesState, ResourceId, Resources } from "@/types/game";

/* =====================================================
   v4.9 : file planifiée des bâtiments. Jusqu'à 3 améliorations
   programmées à la suite : 1 emplacement offert, le 2e à la Fonderie
   quantique niveau 5, le 3e au niveau 10. Le coût est payé au lancement ;
   si les ressources manquent, l'amélioration attend jusqu'à 24 h puis est
   retirée. Une amélioration programmée s'annule gratuitement.
===================================================== */

export const BUILD_PLAN_RULES = {
  slotBuilding: "fonderie_quantique",
  /** Niveau de la Fonderie requis pour chaque emplacement (le 1er est offert). */
  slotLevels: [0, 5, 10],
  maxWaitHours: 24,
};

export interface PlannedUpgrade {
  buildingId: string;
  /** Niveau visé. */
  level: number;
  addedAtMs: number;
  /** Depuis quand elle pourrait démarrer mais manque de ressources. */
  waitingSinceMs?: number;
}

export function buildPlan(queues: Pick<QueuesState, "buildPlan">): PlannedUpgrade[] {
  return Array.isArray(queues.buildPlan) ? queues.buildPlan.filter((p) => p && typeof p.buildingId === "string") : [];
}

export function planSlots(player: Pick<PlayerState, "buildings">): number {
  const s = player.buildings[BUILD_PLAN_RULES.slotBuilding];
  const level = s?.unlocked ? s.level ?? 0 : 0;
  return BUILD_PLAN_RULES.slotLevels.filter((l) => level >= l).length;
}

/** Prochain niveau programmable pour ce bâtiment (en tenant compte du chantier et de la file). */
export function nextPlannedLevel(player: PlayerState, queues: QueuesState, buildingId: string): number {
  const current = player.buildings[buildingId]?.level ?? 0;
  const upgrading = queues.buildingUpgrades[buildingId as keyof typeof queues.buildingUpgrades] ? 1 : 0;
  const planned = buildPlan(queues).filter((p) => p.buildingId === buildingId).length;
  return current + upgrading + planned + 1;
}

export function addPlanned(player: PlayerState, queues: QueuesState, buildingId: unknown, now: number): PlannedUpgrade {
  const def = findBuilding(String(buildingId));
  const state = def ? player.buildings[def.id] : undefined;
  if (!def || !state) throw new GameActionError("Bâtiment inconnu.");
  if (!state.unlocked && !def.startsUnlocked) throw new GameActionError("Ce bâtiment n'est pas débloqué.");
  const plan = buildPlan(queues);
  const slots = planSlots(player);
  if (plan.length >= slots) {
    const next = BUILD_PLAN_RULES.slotLevels[slots];
    throw new GameActionError(next !== undefined ? `File pleine : l'emplacement suivant s'ouvre avec la Fonderie quantique niveau ${next}.` : "File pleine.");
  }
  const level = nextPlannedLevel(player, queues, def.id);
  if (level > def.maxLevel) throw new GameActionError("Niveau maximum déjà atteint ou programmé.");
  const entry: PlannedUpgrade = { buildingId: def.id, level, addedAtMs: now };
  queues.buildPlan = [...plan, entry];
  return entry;
}

export function removePlanned(queues: QueuesState, index: unknown): void {
  const plan = buildPlan(queues);
  const i = Math.floor(Number(index));
  if (!(i >= 0 && i < plan.length)) throw new GameActionError("Cette amélioration n'est plus programmée.");
  const removed = plan[i];
  // Les niveaux suivants du même bâtiment n'ont plus de sens sans celui-ci.
  queues.buildPlan = plan.filter((p, j) => j !== i && !(j > i && p.buildingId === removed.buildingId));
}

/**
 * Lance les améliorations programmées dont le bâtiment est libre et le
 * niveau atteignable. `startAt` : fin du chantier qui vient de se terminer
 * (la suivante démarre à cet instant, même hors ligne).
 */
export function advanceBuildPlan(player: PlayerState, queues: QueuesState, now: number, finishedAt: Record<string, number> = {}): NewNotification[] {
  const notes: NewNotification[] = [];
  const keep: PlannedUpgrade[] = [];
  for (const entry of buildPlan(queues)) {
    const def = findBuilding(entry.buildingId);
    const state = def ? player.buildings[def.id] : undefined;
    if (!def || !state || entry.level <= state.level || entry.level > def.maxLevel) continue;
    const busy = !!queues.buildingUpgrades[def.id as keyof typeof queues.buildingUpgrades];
    if (busy) {
      keep.push(entry);
      continue;
    }
    if (entry.level !== state.level + 1) {
      // Un niveau plus haut attend le précédent ; sans lui (annulé), il est retiré.
      if (keep.some((k) => k.buildingId === entry.buildingId)) keep.push(entry);
      continue;
    }
    const cost = applyBuildingDiscount(getBuildingUpgradeCost(def, entry.level), player.bonuses?.buildingUpgradeDiscount ?? 0);
    if (canAffordAll(player.resources, cost as Partial<Resources>)) {
      let total = 0;
      for (const [res, val] of Object.entries(cost)) {
        player.resources[res as ResourceId] -= val ?? 0;
        total += val ?? 0;
      }
      recordContract(player, "spend", total, now);
      bumpStat(player, "spent", total);
      const startAt = Math.min(now, finishedAt[def.id] ?? now);
      queues.buildingUpgrades[def.id as keyof typeof queues.buildingUpgrades] = {
        endTime: startAt + Math.round(getBuildingUpgradeTime(def, entry.level) * playerBuildTimeFactor(player, now)) * 1000,
        startedAtMs: startAt,
        paid: cost,
      };
      recordContract(player, "upgrade_building", 1, now);
      notes.push({ kind: "building", title: "File planifiée", message: `${def.name} niveau ${entry.level} : amélioration lancée.`, createdAtMs: now, read: false });
      continue;
    }
    const since = entry.waitingSinceMs ?? now;
    if (now - since > BUILD_PLAN_RULES.maxWaitHours * 3600_000) {
      notes.push({ kind: "building", title: "File planifiée", message: `${def.name} niveau ${entry.level} retiré : ressources insuffisantes depuis ${BUILD_PLAN_RULES.maxWaitHours} h.`, createdAtMs: now, read: false });
      continue;
    }
    keep.push({ ...entry, waitingSinceMs: since });
  }
  queues.buildPlan = keep;
  return notes;
}
