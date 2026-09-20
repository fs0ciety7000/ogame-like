import { create } from "zustand";
import type { BattleReport, CombatOutcome, RareResourceId } from "@/types/game";

export interface CombatDisplay {
  perspective: "attacker" | "defender";
  opponentPseudo: string;
  outcome: CombatOutcome;
  myPower: number;
  opponentPower: number;
  myLosses: Record<string, number>;
  myRecovered: Record<string, number>;
  opponentLosses: Record<string, number>;
  opponentRecovered: Record<string, number>;
  loot: Partial<Record<RareResourceId, number>> | null;
}

interface CombatModalState {
  current: CombatDisplay | null;
}

export const useCombatModalStore = create<CombatModalState>(() => ({ current: null }));

export function showCombatResult(display: CombatDisplay) {
  useCombatModalStore.setState({ current: display });
}

export function closeCombatResult() {
  useCombatModalStore.setState({ current: null });
}

export function combatDisplayFromAttackerResult(
  opponentPseudo: string,
  combat: {
    outcome: CombatOutcome;
    attackerPower: number;
    defenderPower: number;
    attackerLosses: Record<string, number>;
    attackerRecovered: Record<string, number>;
    defenderLosses: Record<string, number>;
    defenderRecovered: Record<string, number>;
    loot: Partial<Record<RareResourceId, number>> | null;
  },
): CombatDisplay {
  return {
    perspective: "attacker",
    opponentPseudo,
    outcome: combat.outcome,
    myPower: combat.attackerPower,
    opponentPower: combat.defenderPower,
    myLosses: combat.attackerLosses,
    myRecovered: combat.attackerRecovered,
    opponentLosses: combat.defenderLosses,
    opponentRecovered: combat.defenderRecovered,
    loot: combat.loot,
  };
}

export function combatDisplayFromReport(report: BattleReport): CombatDisplay {
  return {
    perspective: "defender",
    opponentPseudo: report.attackerPseudo,
    outcome: report.outcome,
    myPower: report.defenderPower,
    opponentPower: report.attackerPower,
    myLosses: report.defenderLosses,
    myRecovered: report.defenderRecovered,
    opponentLosses: report.attackerLosses,
    opponentRecovered: report.attackerRecovered,
    loot: report.loot,
  };
}

/** Le journal de combat affiche à la fois les attaques lancées et reçues :
 *  on ne peut pas supposer la perspective "défenseur" comme le fait
 *  combatDisplayFromReport (utilisé uniquement pour un rapport qu'on vient
 *  de recevoir en tant que défenseur). Ici on compare avec son propre uid. */
export function combatDisplayFromReportForViewer(report: BattleReport, viewerUid: string): CombatDisplay {
  if (report.attackerUid === viewerUid) {
    return combatDisplayFromAttackerResult(report.defenderPseudo, report);
  }
  return combatDisplayFromReport(report);
}
