import { useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { HudChip } from "@/components/ui/hud";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { describeClaims, pendingClaims, type ClaimAllAction } from "@/game/claimAll";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { useClaimContext } from "@/hooks/useClaimContext";
import { claimAllRewards, GameActionError } from "@/services/playerService";

/** v5.11 : pastille d'en-tête « Tout réclamer » (au moins deux récompenses prêtes). */
export function ClaimAllChip() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const claimCtx = useClaimContext();
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const pending = pendingClaims(player, Date.now(), undefined, claimCtx);
  if (pending.length < 2) return null;
  const counts: Partial<Record<ClaimAllAction["type"], number>> = {};
  for (const p of pending) counts[p.type] = (counts[p.type] ?? 0) + 1;

  const claim = async () => {
    setBusy(true);
    try {
      const out = await claimAllRewards();
      const text = describeClaims(out ?? {});
      if (text) toast.success("Récompenses réclamées", { description: `${text}.` });
      else toast("Rien à réclamer pour l'instant.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HudChip asChild tone="gold" alert>
          <button type="button" disabled={busy} onClick={() => void claim()}>
            <Gift /> Tout réclamer · {pending.length}
          </button>
        </HudChip>
      </TooltipTrigger>
      <TooltipContent>{describeClaims(counts)}.</TooltipContent>
    </Tooltip>
  );
}
