import { applyBuildingDiscount, BUILDINGS, findBuilding, getBuildingUpgradeCost, getBuildingUpgradeTime } from "@/game/buildings";
import { findTech, getTechCost, getTechTime } from "@/game/technologies";
import { findUnit, getUnitBuildTime, ownedBlueprints, UNIT_TO_TECH } from "@/game/units";
import { playerUnitCost } from "@/game/effectTargets";
import { playerBuildTimeFactor, playerResearchTimeFactor } from "@/game/bonuses";
import { economySnapshot } from "@/game/economy";
import { RESOURCE_LIST } from "@/game/resources";
import type { PlayerState, QueuesState, ResourceId } from "@/types/game";

/* =====================================================
   5.26 : objectifs personnels. Le joueur fixe un but (« Croiseur niveau
   10 », « Fonderie niveau 15 », « 200 frégates ») ; le jeu en déduit le
   plan (prérequis compris, dans l'ordre), le coût total, ce qui manque
   et une date estimée :
     attente des ressources (manque ÷ production actuelle)
     et durée des chantiers (bâtiments et recherches en parallèle),
   la plus longue des deux l'emporte. Une estimation, pas une promesse :
   la production grandit en route.
===================================================== */

export type GoalKind = "building" | "tech" | "unitLevel" | "fleet";

export interface Goal {
  id: string;
  kind: GoalKind;
  target: string;
  /** Niveau visé (bâtiment, techno, unité) ou nombre d'exemplaires (flotte). */
  value: number;
  createdAtMs: number;
}

export const GOAL_RULES = { maxGoals: 6, maxFleet: 100_000 };

export interface PlanStep {
  kind: "unlock" | "building" | "tech" | "units";
  id: string;
  label: string;
  /** Niveau atteint par l'étape (ou quantité pour des unités). */
  level: number;
  cost: Partial<Record<ResourceId, number>>;
  seconds: number;
}

export interface GoalPlan {
  done: boolean;
  /** Avancement 0..1 (niveaux ou exemplaires déjà là). */
  progress: number;
  steps: PlanStep[];
  totalCost: Partial<Record<ResourceId, number>>;
  /** Ce qui manque par rapport au stock actuel. */
  missing: Partial<Record<ResourceId, number>>;
  /** Attente de production pour réunir le manque (Infinity : ressource non produite). */
  waitSeconds: number;
  /** Durée des chantiers (bâtiments et recherches en parallèle, unités à la suite). */
  buildSeconds: number;
  etaSeconds: number;
  /** Ce qui empêche d'y arriver (plan d'unité à acheter, ressource non produite…). */
  blockers: string[];
  label: string;
}

export function goalLabel(goal: Pick<Goal, "kind" | "target" | "value">): string {
  if (goal.kind === "building") return `${findBuilding(goal.target)?.name ?? goal.target} niveau ${goal.value}`;
  if (goal.kind === "tech") return `${findTech(goal.target)?.nom ?? goal.target} niveau ${goal.value}`;
  if (goal.kind === "unitLevel") return `${findUnit(goal.target)?.name ?? goal.target} niveau ${goal.value}`;
  return `${goal.value} × ${findUnit(goal.target)?.name ?? goal.target}`;
}

export function sanitizeGoal(raw: unknown): Goal | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = r.kind;
  if (kind !== "building" && kind !== "tech" && kind !== "unitLevel" && kind !== "fleet") return null;
  const value = Math.floor(Number(r.value));
  if (typeof r.id !== "string" || typeof r.target !== "string" || !(value > 0)) return null;
  return { id: r.id, kind, target: r.target, value: Math.min(value, kind === "fleet" ? GOAL_RULES.maxFleet : 500), createdAtMs: Number(r.createdAtMs) || 0 };
}

const add = (into: Partial<Record<ResourceId, number>>, cost: Partial<Record<string, number>>, k = 1) => {
  for (const [r, n] of Object.entries(cost)) if (n) into[r as ResourceId] = (into[r as ResourceId] ?? 0) + n * k;
};

export function planGoal(player: PlayerState, queues: QueuesState, goal: Goal, now: number): GoalPlan {
  const steps: PlanStep[] = [];
  const blockers: string[] = [];
  // Niveaux « virtuels » : ce qui est déjà en cours compte comme acquis, puis chaque étape du plan.
  const bLevels: Record<string, number> = {};
  const tLevels: Record<string, number> = { ...player.techLevels };
  for (const [id, b] of Object.entries(player.buildings)) bLevels[id] = (b?.level ?? 0) + (queues.buildingUpgrades[id as keyof typeof queues.buildingUpgrades] ? 1 : 0);
  for (const r of queues.activeResearches) tLevels[r.id] = (tLevels[r.id] ?? 0) + 1;
  const unlocked = new Set(Object.entries(player.buildings).filter(([, b]) => b?.unlocked).map(([id]) => id));
  const plans = ownedBlueprints(player);
  const buildFactor = playerBuildTimeFactor(player, now);
  const researchFactor = playerResearchTimeFactor(player, now);
  const discount = player.bonuses?.buildingUpgradeDiscount ?? 0;

  const needTech = (techId: string, level: number, depth = 0): void => {
    const tech = findTech(techId);
    if (!tech) return void blockers.push(`Technologie inconnue : ${techId}.`);
    if (depth > 20) return;
    const target = Math.min(level, tech.maxLevel);
    if (level > tech.maxLevel) blockers.push(`${tech.nom} plafonne au niveau ${tech.maxLevel}.`);
    if ((tLevels[techId] ?? 0) >= target) return;
    for (const [req, reqLevel] of Object.entries(tech.prereq)) needTech(req, reqLevel, depth + 1);
    for (const e of tech.effects ?? []) {
      if (e.type === "unlock_next_level" && e.target && findUnit(e.target)?.blueprint && !plans.includes(e.target)) blockers.push(`Plan à acheter au Comptoir : ${findUnit(e.target)?.name}.`);
    }
    for (let l = (tLevels[techId] ?? 0) + 1; l <= target; l++) {
      steps.push({ kind: "tech", id: techId, label: `${tech.nom} → niv. ${l}`, level: l, cost: getTechCost(tech, l), seconds: Math.round(getTechTime(tech, l) * researchFactor) });
    }
    tLevels[techId] = target;
  };

  const needBuilding = (buildingId: string, level: number): void => {
    const def = findBuilding(buildingId);
    if (!def) return void blockers.push(`Bâtiment inconnu : ${buildingId}.`);
    const target = Math.min(level, def.maxLevel);
    if (level > def.maxLevel) blockers.push(`${def.name} plafonne au niveau ${def.maxLevel}.`);
    if (!unlocked.has(buildingId) && !def.startsUnlocked) {
      if (def.unlockedByTech) needTech(def.unlockedByTech, 1);
      else steps.push({ kind: "unlock", id: buildingId, label: `Débloquer ${def.name}`, level: 0, cost: def.unlockCost ?? {}, seconds: 0 });
      unlocked.add(buildingId);
    }
    for (let l = (bLevels[buildingId] ?? 0) + 1; l <= target; l++) {
      steps.push({ kind: "building", id: buildingId, label: `${def.name} → niv. ${l}`, level: l, cost: applyBuildingDiscount(getBuildingUpgradeCost(def, l), discount), seconds: Math.round(getBuildingUpgradeTime(def, l) * buildFactor) });
    }
    bLevels[buildingId] = Math.max(bLevels[buildingId] ?? 0, target);
  };

  let progress = 0;
  if (goal.kind === "building") {
    progress = Math.min(1, (player.buildings[goal.target]?.level ?? 0) / goal.value);
    needBuilding(goal.target, goal.value);
  } else if (goal.kind === "tech") {
    progress = Math.min(1, (player.techLevels[goal.target] ?? 0) / goal.value);
    needTech(goal.target, goal.value);
  } else {
    const unit = findUnit(goal.target);
    const techId = UNIT_TO_TECH[goal.target];
    if (!unit) blockers.push(`Unité inconnue : ${goal.target}.`);
    else if (goal.kind === "unitLevel") {
      progress = Math.min(1, (player.units[goal.target]?.level ?? 0) / goal.value);
      if (techId) needTech(techId, goal.value);
      else if (unit.elite) blockers.push(`${unit.name} : unité d'élite, débloquée par une vendetta.`);
    } else {
      const owned = player.units[goal.target]?.count ?? 0;
      const queued = [...queues.unitQueues.attack, ...queues.unitQueues.defense].filter((q) => q.unitId === goal.target).length;
      progress = Math.min(1, (owned + queued) / goal.value);
      if ((player.units[goal.target]?.level ?? 0) <= 0 && techId) needTech(techId, 1);
      const missingQty = Math.max(0, goal.value - owned - queued);
      if (missingQty > 0) {
        const each = playerUnitCost(unit, player, now);
        steps.push({ kind: "units", id: goal.target, label: `${missingQty} × ${unit.name}`, level: missingQty, cost: { scrap: each.scrap * missingQty, energy: each.energy * missingQty }, seconds: getUnitBuildTime(unit, player.techLevels, player) * missingQty });
      }
    }
  }

  const totalCost: Partial<Record<ResourceId, number>> = {};
  for (const s of steps) add(totalCost, s.cost);
  const missing: Partial<Record<ResourceId, number>> = {};
  for (const [r, n] of Object.entries(totalCost) as [ResourceId, number][]) {
    const lack = n - Math.floor(player.resources[r] ?? 0);
    if (lack > 0) missing[r] = lack;
  }
  // Production réelle par seconde (entretien de flotte déduit de l'énergie), même entrepôt plein.
  const eco = economySnapshot(player, now);
  let waitSeconds = 0;
  for (const [r, lack] of Object.entries(missing) as [ResourceId, number][]) {
    const rate = (eco.gross[r] ?? 0) - (r === "energy" ? eco.upkeep : 0);
    if (rate <= 0) {
      waitSeconds = Infinity;
      const name = RESOURCE_LIST.find((x) => x.id === r)?.name ?? r;
      const producer = BUILDINGS.find((b) => b.production?.resource === r);
      blockers.push(producer ? `${name} : aucune production pour l'instant, ${producer.name} à construire ou relancer.` : `${name} : aucune production, à gagner autrement (combats, marché, missions).`);
    } else waitSeconds = Math.max(waitSeconds, lack / rate);
  }
  for (const s of steps) {
    for (const [r, n] of Object.entries(s.cost) as [ResourceId, number][]) {
      if (RESOURCE_LIST.find((x) => x.id === r)?.rarity === "common" && n > eco.capacity) blockers.push(`${s.label} coûte plus que ton entrepôt ne contient : agrandis-le d'abord.`);
    }
  }
  const sum = (k: PlanStep["kind"][]) => steps.filter((s) => k.includes(s.kind)).reduce((a, s) => a + s.seconds, 0);
  const buildSeconds = Math.max(sum(["building", "unlock"]), sum(["tech"])) + sum(["units"]);
  const done = steps.length === 0 && blockers.length === 0;
  return {
    done,
    progress: done ? 1 : progress,
    steps,
    totalCost,
    missing,
    waitSeconds,
    buildSeconds,
    etaSeconds: Math.max(waitSeconds, buildSeconds),
    blockers: [...new Set(blockers)],
    label: goalLabel(goal),
  };
}
