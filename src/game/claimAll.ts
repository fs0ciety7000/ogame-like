import { guideProgress, guideVisible } from "@/game/advancedGuide";
import { contractDay } from "@/game/contracts";
import { onboardingEligible, onboardingProgress } from "@/game/onboarding";
import { passState, passTier, tierRequirements } from "@/game/seasonPass";
import { streakStatus } from "@/game/streak";
import { startReserveReady } from "@/game/startRewards";
import { dailyMissions } from "@/game/dailyMissions";
import { chronicleOf, chronicleState, unlockedEpisodes } from "@/game/chronicles";
import { codexClaimableCategories, codexTitleClaimable, type CodexContext } from "@/game/codex";
import { dailyTokenReady, type CasinoSettings } from "@/game/casino";
import { challengeClaimable, type Challenge } from "@/game/challenges";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.11 : actions groupées — « Tout réclamer » rassemble en un clic les
   récompenses prêtes : contrats du jour, paliers du passe, objectifs de la
   prise en main et du Carnet du commandant. Chaque réclamation passe par
   son action habituelle (mêmes contrôles, mêmes effets).
   5.30 (Ordres du jour) : aussi la série de connexion, les missions du jour
   et les épisodes des Chroniques. La liste sert aussi de pastille unique.
   6.14.17 : et les catégories complètes du Codex (leur pastille propre disparaît).
   6.14.113 (AU27, AC-G, AC-15) : jeton du jour du casino, récompense du défi
   hebdomadaire et titre du Codex. Ils dépendent de données du serveur
   (réglages du casino, état du défi, seigneurs et boss affrontés) : le
   serveur les fournit (`ClaimContext`) et « Tout réclamer » les prend tous ;
   sur le client, la pastille ne compte que ce qu'elle peut vérifier sans
   faux positif (casino et défi si leurs réglages publics sont chargés, jamais
   le titre du Codex).
===================================================== */

export type ClaimAllAction =
  | { type: "casinoDaily" }
  | { type: "challengeClaim" }
  | { type: "codexTitle" }
  | { type: "streakClaim" }
  | { type: "startReserveClaim" }
  | { type: "dailyClaim"; index: number }
  | { type: "chronicleClaim"; episode: number }
  | { type: "claimContract"; contractId: string }
  | { type: "passClaim"; tier: number }
  | { type: "claimOnboarding"; stepId: string }
  | { type: "claimGuide"; stepId: string }
  | { type: "codexClaim"; category: string };

/** 6.14.113 : données du serveur utiles aux réclamations (toutes facultatives : absentes, la réclamation n'est pas proposée).
 *  `challenge` : défi terminé (`previous`) ; après une réclamation, l'action y écrit l'état à enregistrer (`claimed`). */
export interface ClaimContext {
  casino?: CasinoSettings | null;
  challenge?: { previous: Challenge | null; claimed?: Challenge | null } | null;
}

/** Réclamations prêtes (lecture seule). */
export function pendingClaims(player: PlayerState, now: number, codex?: CodexContext, ctx: ClaimContext = {}): ClaimAllAction[] {
  const out: ClaimAllAction[] = [];
  // 6.14.113 (AC-15) : jeton du jour du casino et récompense du défi hebdomadaire, quand leurs données sont connues.
  if (ctx.casino && dailyTokenReady(player, ctx.casino, now)) out.push({ type: "casinoDaily" });
  if (ctx.challenge && player.uid && challengeClaimable(ctx.challenge.previous, player.uid)) out.push({ type: "challengeClaim" });
  // 5.30 : série du jour d'abord, puis missions du jour.
  if (!streakStatus(player, now).claimed) out.push({ type: "streakClaim" });
  // 6.14.165 (S6, NJ-25) : réserve du départ, dès que le compte n'est plus jeune.
  if (startReserveReady(player, now)) out.push({ type: "startReserveClaim" });
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
  // 6.14.17 (Z1-2) : catégories du Codex complètes. 6.14.25 (H29-3) : avec `codex` (serveur), Seigneurs et Boss aussi ;
  // sans lui (pastille du client), seulement celles que le joueur seul permet de vérifier, sans faux positif.
  for (const category of codexClaimableCategories(player, now, codex)) out.push({ type: "codexClaim", category });
  // 6.14.113 : titre « Archiviste » (Codex à 100 %) : seulement avec les données du serveur.
  if (codexTitleClaimable(player, now, codex)) out.push({ type: "codexTitle" });
  return out;
}

export const CLAIM_LABELS: Record<ClaimAllAction["type"], [string, string]> = {
  casinoDaily: ["jeton du jour du casino", "jetons du jour du casino"],
  challengeClaim: ["récompense du défi", "récompenses du défi"],
  codexTitle: ["titre du Codex", "titres du Codex"],
  streakClaim: ["récompense de série", "récompenses de série"],
  startReserveClaim: ["réserve du départ", "réserves du départ"],
  dailyClaim: ["mission du jour", "missions du jour"],
  chronicleClaim: ["épisode des Chroniques", "épisodes des Chroniques"],
  claimContract: ["objectif du jour", "objectifs du jour"],
  passClaim: ["palier du passe", "paliers du passe"],
  claimOnboarding: ["objectif de prise en main", "objectifs de prise en main"],
  claimGuide: ["objectif du Carnet", "objectifs du Carnet"],
  codexClaim: ["catégorie du Codex", "catégories du Codex"],
};

/** « 2 contrats, 1 palier du passe » */
export function describeClaims(counts: Partial<Record<ClaimAllAction["type"], number>>): string {
  return (Object.entries(counts) as [ClaimAllAction["type"], number][])
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} ${CLAIM_LABELS[t][n > 1 ? 1 : 0]}`)
    .join(", ");
}
