import { costValue, techProfile } from "@/game/balance/analysis";
import { simulateSandbox } from "@/game/simulator";
import { findUnit } from "@/game/units";
import type { CombatOutcome, Units } from "@/types/game";

/* =====================================================
   6.14.71 (AU27, lot AE-L0) : combats JcJ à budget égal.

   Un attaquant (frégates, chasseurs, croiseurs de raid) frappe un défenseur
   qui a dépensé `budget` : défenses seules, ou moitié défenses et moitié
   vaisseaux à quai. On cherche le plus petit rapport « dépense de l'attaquant /
   dépense du défenseur » qui donne la victoire (le seuil). Techno à 50 %,
   unités niveau 6, Atelier à 50 % des deux côtés. Moteur pur, déterministe :
   il lit `COMBAT_RULES` en vigueur, un réglage se mesure donc avant d'être
   appliqué (`node scripts/progression-sim.mjs`).
===================================================== */

const PVP_BUDGET_MODEL = {
  budget: 20_000_000,
  unitLevel: 6,
  techFraction: 0.5,
  repairPct: 0.5,
  /** Bouclier du Hangar de défense du défenseur (moitié du plafond, comme au rapport AU27). */
  shieldPct: 0.075,
  /** Ressources du défenseur (le butin ne change pas l'issue). */
  defenderStock: 50_000_000,
  attacker: { fregate: 0.3, chasseur: 0.4, croiseur_raid: 0.3 } as Record<string, number>,
  defensesOnly: { roquette: 0.3, canon_impulsion: 0.3, batterie_aa: 0.2, intercepteur: 0.2 } as Record<string, number>,
  mixedDefenses: { roquette: 0.15, canon_impulsion: 0.15, batterie_aa: 0.1, intercepteur: 0.1 } as Record<string, number>,
  mixedShips: { fregate: 0.15, chasseur: 0.2, croiseur_raid: 0.15 } as Record<string, number>,
  /** Rapports essayés : de 0,3 à 3 par pas de 0,05. */
  ratioMin: 0.3,
  ratioMax: 3,
  ratioStep: 0.05,
};

export type DefenderSetup = "defenses" | "mixed";

function buy(mix: Record<string, number>, budget: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, share] of Object.entries(mix)) {
    const u = findUnit(id);
    if (u) out[id] = Math.max(1, Math.floor((budget * share) / costValue(u.cost)));
  }
  return out;
}

function asUnits(counts: Record<string, number>, extra: Units = {}): Units {
  const units: Units = { ...extra };
  for (const [id, n] of Object.entries(counts)) units[id] = { level: Math.min(PVP_BUDGET_MODEL.unitLevel, findUnit(id)?.maxLevel ?? 1), count: n };
  return units;
}

export interface BudgetDuel {
  ratio: number;
  outcome: CombatOutcome;
  /** Part perdue par l'attaquant et par le défenseur (0 à 1). */
  attackerLoss: number;
  defenderLoss: number;
  /** 6.14.145 (PB-L4) : part de la dépense en défenses perdue pour de bon (après la reconstruction gratuite), 0 à 1. */
  defenseNetLoss: number;
}

/** Un combat : l'attaquant dépense `ratio` fois ce qu'a dépensé le défenseur. */
export function budgetDuel(ratio: number, setup: DefenderSetup = "mixed", opts: { shieldPct?: number; posture?: string; defenseRebuildBonus?: number } = {}): BudgetDuel {
  const M = PVP_BUDGET_MODEL;
  const tech = techProfile(M.techFraction);
  const fleet = buy(M.attacker, M.budget * ratio);
  const share = (mix: Record<string, number>) => Object.values(mix).reduce((a, b) => a + b, 0);
  const defUnits =
    setup === "defenses"
      ? asUnits(buy(M.defensesOnly, M.budget * share(M.defensesOnly)))
      : asUnits(buy(M.mixedDefenses, M.budget * share(M.mixedDefenses)), asUnits(buy(M.mixedShips, M.budget * share(M.mixedShips))));
  const res = simulateSandbox(
    { units: asUnits(fleet), techLevels: tech, repairPct: M.repairPct },
    fleet,
    { units: defUnits, techLevels: tech, shieldPct: opts.shieldPct ?? M.shieldPct, repairPct: M.repairPct, resources: { scrap: M.defenderStock } },
    1,
    { posture: opts.posture, defenseRebuildBonus: opts.defenseRebuildBonus },
  );
  const c = res.combat;
  let spent = 0;
  let lost = 0;
  for (const [id, u] of Object.entries(defUnits)) {
    const def = findUnit(id);
    if (!def || def.category !== "defense") continue;
    spent += u.count * costValue(def.cost);
    lost += (c.defenderLosses[id] ?? 0) * costValue(def.cost);
  }
  return { ratio, outcome: c.outcome, attackerLoss: c.attackerLossPercent, defenderLoss: c.defenderLossPercent, defenseNetLoss: spent > 0 ? lost / spent : 0 };
}

/** Plus petit rapport de dépense qui donne la victoire à l'attaquant (null : pas avant `ratioMax`). */
export function attackerWinThreshold(setup: DefenderSetup = "mixed", opts: { shieldPct?: number; posture?: string; defenseRebuildBonus?: number } = {}): number | null {
  const M = PVP_BUDGET_MODEL;
  const steps = Math.round((M.ratioMax - M.ratioMin) / M.ratioStep);
  for (let i = 0; i <= steps; i++) {
    const ratio = Math.round((M.ratioMin + i * M.ratioStep) * 100) / 100;
    if (budgetDuel(ratio, setup, opts).outcome === "attacker_win") return ratio;
  }
  return null;
}
