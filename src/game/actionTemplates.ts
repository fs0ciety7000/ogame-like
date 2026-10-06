import { performPlayerAction, type GameAction } from "@/game/actions";
import { GameActionError } from "@/game/errors";
import { findBuilding } from "@/game/buildings";
import { findUnit } from "@/game/units";
import { findTech } from "@/game/technologies";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   5.26 : modèles d'actions (file d'actions globale). Un modèle est une suite
   d'étapes rejouables : améliorer un bâtiment (lancé tout de suite si le
   chantier est libre, sinon programmé dans la file planifiée), construire un
   lot d'unités, lancer une recherche. L'aperçu rejoue les vraies règles du
   serveur sur une copie de l'empire : ce qu'il annonce est ce qui se passera.
===================================================== */

export type ActionStep =
  | { kind: "building"; id: string }
  | { kind: "units"; id: string; qty: number }
  | { kind: "research"; id: string };

export interface ActionTemplate {
  id: string;
  name: string;
  steps: ActionStep[];
  updatedAtMs: number;
}

export const TEMPLATE_RULES = { maxTemplates: 12, maxSteps: 20, maxUnitQty: 100_000 };

export type StepOutcome = "start" | "plan" | "queue" | "error";

export interface StepPreview {
  step: ActionStep;
  outcome: StepOutcome;
  /** Ce qui sera fait, ou pourquoi l'étape échouera. */
  message: string;
  /** Actions serveur à envoyer pour cette étape (vide si erreur). */
  actions: GameAction[];
}

export function stepLabel(step: ActionStep): string {
  if (step.kind === "building") return findBuilding(step.id)?.name ?? step.id;
  if (step.kind === "units") return `${findUnit(step.id)?.name ?? step.id} ×${step.qty}`;
  return findTech(step.id)?.nom ?? step.id;
}

/** Nettoie un modèle lu sur l'appareil (données libres). */
export function sanitizeTemplate(raw: unknown): ActionTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.id !== "string" || typeof t.name !== "string" || !Array.isArray(t.steps)) return null;
  const steps: ActionStep[] = [];
  for (const s of t.steps as Record<string, unknown>[]) {
    if (!s || typeof s.id !== "string") continue;
    if (s.kind === "building" || s.kind === "research") steps.push({ kind: s.kind, id: s.id });
    else if (s.kind === "units") {
      const qty = Math.floor(Number(s.qty));
      if (qty > 0) steps.push({ kind: "units", id: s.id, qty: Math.min(qty, TEMPLATE_RULES.maxUnitQty) });
    }
  }
  return { id: t.id, name: t.name.slice(0, 32) || "Modèle", steps: steps.slice(0, TEMPLATE_RULES.maxSteps), updatedAtMs: Number(t.updatedAtMs) || 0 };
}

function attempt(state: { player: PlayerState; queues: QueuesState }, action: GameAction, now: number, away: Record<string, number>) {
  const out = performPlayerAction(state.player, state.queues, action, now, away);
  state.player = out.player;
  state.queues = out.queues;
}

/**
 * Rejoue le modèle sur une copie de l'empire, étape par étape, comme le
 * serveur le fera : une étape qui échoue n'empêche pas les suivantes.
 */
export function previewTemplate(player: PlayerState, queues: QueuesState, steps: ActionStep[], now: number, unitsAway: Record<string, number> = {}): StepPreview[] {
  const state = { player: structuredClone(player), queues: structuredClone(queues) };
  return steps.map((step): StepPreview => {
    const reason = (err: unknown) => (err instanceof GameActionError ? err.message : "Action impossible.");
    if (step.kind === "building") {
      const start: GameAction = { type: "upgradeBuilding", buildingId: step.id } as GameAction;
      try {
        const copy = { player: structuredClone(state.player), queues: structuredClone(state.queues) };
        attempt(copy, start, now, unitsAway);
        Object.assign(state, copy);
        return { step, outcome: "start", message: "Lancé tout de suite.", actions: [start] };
      } catch (first) {
        const plan: GameAction = { type: "planBuilding", buildingId: step.id } as GameAction;
        try {
          attempt(state, plan, now, unitsAway);
          return { step, outcome: "plan", message: `Programmé : ${reason(first).replace(/\.$/, "").toLowerCase()} pour l'instant.`, actions: [plan] };
        } catch (second) {
          return { step, outcome: "error", message: reason(second), actions: [] };
        }
      }
    }
    const action: GameAction = (step.kind === "units" ? { type: "buildUnits", unitId: step.id, qty: step.qty } : { type: "research", techId: step.id }) as GameAction;
    try {
      attempt(state, action, now, unitsAway);
      return { step, outcome: step.kind === "units" ? "queue" : "start", message: step.kind === "units" ? "Ajouté à la file du hangar." : "Recherche lancée.", actions: [action] };
    } catch (err) {
      return { step, outcome: "error", message: reason(err), actions: [] };
    }
  });
}

/** Modèle tiré de ce qui est prévu en ce moment : file planifiée et files d'unités. */
export function templateFromQueues(queues: QueuesState): ActionStep[] {
  const steps: ActionStep[] = [];
  for (const p of queues.buildPlan ?? []) steps.push({ kind: "building", id: p.buildingId });
  for (const category of ["attack", "defense"] as const) {
    const q = queues.unitQueues[category];
    for (let i = 0; i < q.length; ) {
      let j = i;
      while (j < q.length && q[j].unitId === q[i].unitId) j++;
      steps.push({ kind: "units", id: q[i].unitId, qty: j - i });
      i = j;
    }
  }
  for (const r of queues.activeResearches) steps.push({ kind: "research", id: r.id });
  return steps.slice(0, TEMPLATE_RULES.maxSteps);
}
