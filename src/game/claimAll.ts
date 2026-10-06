import { guideProgress, guideVisible } from "@/game/advancedGuide";
import { contractDay } from "@/game/contracts";
import { onboardingEligible, onboardingProgress } from "@/game/onboarding";
import { passState, passTier, tierRequirements } from "@/game/seasonPass";
import { streakStatus } from "@/game/streak";
import { dailyMissions } from "@/game/dailyMissions";
import { chronicleOf, chronicleState, unlockedEpisodes } from "@/game/chronicles";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.11 : actions groupées — « Tout réclamer » rassemble en un clic les
   récompenses prêtes : contrats du jour, paliers du passe, objectifs de la
   prise en main et du Carnet du commandant. Chaque réclamation passe par
   son action habituelle (mêmes contrôles, mêmes effets).
   5.30 (Ordres du jour) : aussi la série de connexion, les missions du jour
   et les épisodes des Chroniques. La liste sert aussi de pastille unique.
===================================================== */

export type ClaimAllAction =
  | { type: "streakClaim" }
  | { type: "dailyClaim"; index: number }
  | { type: "chronicleClaim"; episode: number }
  | { type: "claimContract"; contractId: string }
  | { type: "passClaim"; tier: number }
  | { type: "claimOnboarding"; stepId: string }
  | { type: "claimGuide"; stepId: string };

/** Réclamations prêtes (lecture seule). */
export function pendingClaims(player: PlayerState, now: number): ClaimAllAction[] {
  const out: ClaimAllAction[] = [];
  // 5.30 : série du jour d'abord, puis missions du jour.
  if (!streakStatus(player, now).claimed) out.push({ type: "streakClaim" });
  dailyMissions(player, now).tasks.forEach((t, i) => {
    if (t.done && !t.claimed) out.push({ type: "dailyClaim", index: i });
  });
  // Contrats du jour seulement (un nouveau jour n'a encore rien de rempli).
  const contracts = player.contracts?.day === contractDay(now) ? player.contracts.items : [];
  for (const c of contracts) if (!c.claimed && c.progress >= c.target) out.push({ type: "claimContract", contractId: c.id });
  if (player.seasonPass) {
    const st = passState(player, now);
    const tier = passTier(st.points, st.seasonId);
    // 5.30 : un palier dont le défi n'est pas rempli n'est pas compté (comme sur l'accueil).
    for (let t = 1; t <= tier; t++) if (!st.claimed.includes(t) && tierRequirements(player, t, now)?.met !== false) out.push({ type: "passClaim", tier: t });
  }
  const month = chronicleOf(now);
  if (month) {
    const cs = chronicleState(player, now);
    const open = unlockedEpisodes(now);
    month.episodes.forEach((e, i) => {
      if (i < open && !cs.claimed.includes(i) && (cs.progress[i] ?? 0) >= e.objective.count) out.push({ type: "chronicleClaim", episode: i });
    });
  }
  if (onboardingEligible(player)) for (const s of onboardingProgress(player)) if (s.done && !s.claimed) out.push({ type: "claimOnboarding", stepId: s.step.id });
  if (guideVisible(player)) for (const s of guideProgress(player)) if (s.done && !s.claimed) out.push({ type: "claimGuide", stepId: s.step.id });
  return out;
}

export const CLAIM_LABELS: Record<ClaimAllAction["type"], [string, string]> = {
  streakClaim: ["récompense de série", "récompenses de série"],
  dailyClaim: ["mission du jour", "missions du jour"],
  chronicleClaim: ["épisode des Chroniques", "épisodes des Chroniques"],
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
