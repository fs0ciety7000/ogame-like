import { useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PosturePicker } from "@/components/game/FormationPicker";
import { COMBAT_RULES } from "@/game/combat";
import { playerPosture, type PostureId } from "@/game/formations";
import { GameActionError, setBasePosture } from "@/services/playerService";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/** Posture de la base (v3.0) : comment elle accueille les attaques. */
export function PostureCard({ player }: { player: PlayerState }) {
  useNowTicker();
  const now = Date.now();
  const [busy, setBusy] = useState(false);
  const current = playerPosture(player);
  const last = player.posture?.changedAtMs ?? 0;
  const waitMs = last > 0 ? last + COMBAT_RULES.postureCooldownHours * 3600_000 - now : 0;

  const change = async (id: PostureId) => {
    if (id === current) return;
    setBusy(true);
    try {
      await setBasePosture(id);
      toast.success("Posture de la base mise à jour.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Changement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Shield className="h-4 w-4 text-cyan-glow" />
        <h2 className="hud-title text-sm">Posture de la base</h2>
        <span className="ml-auto text-[11px] text-slate-500">
          {waitMs > 0 ? `Prochain changement dans ${formatDuration(Math.ceil(waitMs / 1000))}` : `Modifiable toutes les ${COMBAT_RULES.postureCooldownHours} h`}
        </span>
      </div>
      <PosturePicker value={current} onChange={(p) => void change(p)} disabled={busy || waitMs > 0} />
    </Card>
  );
}
