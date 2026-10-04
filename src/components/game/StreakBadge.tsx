import { useState } from "react";
import { AmberAmount } from "@/components/ui/amber";
import { toast } from "sonner";
import { Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { describeGain } from "@/game/format";
import { cycleDay, STREAK_RULES, streakReward, streakState, streakStatus } from "@/game/streak";
import { claimStreak, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn } from "@/lib/utils";
import { HudChip } from "@/components/ui/hud";

/** v5.3 : pastille de l'en-tête — série de connexion quotidienne. */
export function StreakBadge() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const status = streakStatus(player, Date.now());
  const st = streakState(player);
  const day = cycleDay(status.next);
  const reward = streakReward(player, status.next);

  const claim = async () => {
    setBusy(true);
    try {
      const out = await claimStreak();
      toast.success(`Série : jour ${out.count} !`, { description: `${describeGain(out.resources)}${out.amber ? ` et ${out.amber} Ambre` : ""}.` });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const track = (
    <div className="mt-1.5 flex gap-1">
      {STREAK_RULES.hours.map((h, i) => {
        const n = i + 1;
        const done = status.claimed ? n <= cycleDay(status.current) : n < day;
        const next = !status.claimed && n === day;
        return (
          <span
            key={n}
            title={`Jour ${n} : ${h} h de production${n === 7 ? ` + ${STREAK_RULES.amberDay7} Ambre` : ""}`}
            className={cn("grid h-5 w-5 place-items-center border font-mono text-[9px]", done ? "border-ember-glow/60 bg-ember-glow/25 text-white" : next ? "border-gold-glow bg-gold-glow/20 text-gold-glow" : "border-white/15 text-slate-500")}
          >
            {n === 7 ? "★" : n}
          </span>
        );
      })}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {status.claimed ? (
          <HudChip tone="neutral">
            <Flame /> Série {status.current} j
          </HudChip>
        ) : (
          <HudChip asChild tone="gold" alert>
            <button type="button" disabled={busy} onClick={() => void claim()}>
              <Flame /> Série j{status.next} · réclamer
            </button>
          </HudChip>
        )}
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">Série de connexion</p>
        {status.claimed ? (
          <p className="text-[11px]">Récompense du jour reçue. Reviens demain pour le jour {status.next}.</p>
        ) : (
          <p className="text-[11px]">
            Aujourd'hui : {describeGain(reward.resources)}
            {reward.amber ? <> et <AmberAmount value={reward.amber} /></> : ""}.{status.current === 0 && st.count > 0 ? " Ta série précédente s'est arrêtée : elle repart à 1." : ""}
          </p>
        )}
        {track}
        <p className="mt-1 text-[10px] text-slate-400">Un jour manqué remet la série à 1. Meilleure série : {Math.max(st.best, status.current)} j.</p>
      </TooltipContent>
    </Tooltip>
  );
}
