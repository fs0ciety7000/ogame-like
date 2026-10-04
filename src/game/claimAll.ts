import { guideProgress, guideVisible } from "@/game/advancedGuide";
import { contractDay } from "@/game/contracts";
import { onboardingEligible, onboardingProgress } from "@/game/onboarding";
import { passState, passTier } from "@/game/seasonPass";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.11 : actions groupées — « Tout réclamer » rassemble en un clic les
   récompenses prêtes : contrats du jour, paliers du passe, objectifs de la
   prise en main et du Carnet du commandant. Chaque réclamation passe par
   son action habituelle (mêmes contrôles, mêmes effets).
===================================================== */

export type ClaimAllAction =
  | { type: "claimContract"; contractId: string }
  | { type: "passClaim"; tier: number }
  | { type: "claimOnboarding"; stepId: string }
  | { type: "claimGuide"; stepId: string };

/** Réclamations prêtes (lecture seule). */
export function pendingClaims(player: PlayerState, now: number): ClaimAllAction[] {
  const out: ClaimAllAction[] = [];
  // Contrats du jour seulement (un nouveau jour n'a encore rien de rempli).
  const contracts = player.contracts?.day === contractDay(now) ? player.contracts.items : [];
  for (const c of contracts) if (!c.claimed && c.progress >= c.target) out.push({ type: "claimContract", contractId: c.id });
  if (player.seasonPass) {
    const st = passState(player, now);
    const tier = passTier(st.points, st.seasonId);
    for (let t = 1; t <= tier; t++) if (!st.claimed.includes(t)) out.push({ type: "passClaim", tier: t });
  }
  if (onboardingEligible(player)) for (const s of onboardingProgress(player)) if (s.done && !s.claimed) out.push({ type: "claimOnboarding", stepId: s.step.id });
  if (guideVisible(player)) for (const s of guideProgress(player)) if (s.done && !s.claimed) out.push({ type: "claimGuide", stepId: s.step.id });
  return out;
}

export const CLAIM_LABELS: Record<ClaimAllAction["type"], [string, string]> = {
  claimContract: ["contrat", "contrats"],
  passClaim: ["palier du passe", "paliers du passe"],
  claimOnboarding: ["objectif de prise en main", "objectifs de prise en main"],
  claimGuide: ["objectif du Carnet", "objectifs du Carnet"],
};

/** « 2 contrats, 1 palier du passe » */
export function describeClaims(counts: Partial<Record<ClaimAllAction["type"], number>>): string {
  return (Object.entries(counts) as [ClaimAllAction["type"], number][])
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} ${CLAIM_LABELS[t][n > 1 ? 1 : 0]}`)
    .join(", ");
}
