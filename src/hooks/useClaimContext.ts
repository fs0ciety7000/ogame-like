import { useMemo } from "react";
import type { ClaimContext } from "@/game/claimAll";
import { useCasinoSettings } from "@/services/casinoService";
import { useChallengeStore } from "@/services/challengeService";

/** 6.14.113 (AU27, AC-G) : données publiques que le client connaît déjà (réglages du casino, défi terminé), pour compter le
 *  jeton du jour et la récompense du défi dans la pastille d'Ordres du jour et « Tout réclamer », sans faux positif. */
export function useClaimContext(): ClaimContext {
  const casino = useCasinoSettings();
  const previous = useChallengeStore((s) => s.previous);
  return useMemo(() => ({ casino, challenge: { previous } }), [casino, previous]);
}
