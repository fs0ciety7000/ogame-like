import { CalendarDays } from "lucide-react";
import { CasinoPanel } from "@/components/casino/CasinoPanel";
import { ResourceIcon } from "@/components/ui/game-icon";
import { casinoWeek, playerCasino } from "@/game/casino";
import { formatCompact } from "@/lib/utils";
import type { PlayerState, ResourceId } from "@/types/game";

/* v5.12 : bilan personnel de la semaine au casino (remis à zéro le lundi). */
export function WeekRecap({ player }: { player: Pick<PlayerState, "casino"> }) {
  const all = playerCasino(player);
  const w = casinoWeek(player, Date.now());
  const res = (Object.entries(w.resources) as [ResourceId, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const tiles: [string, number][] = [
    ["Jetons joués", w.spins],
    ["Gains", w.wins],
    ["Points", w.points],
  ];
  return (
    <CasinoPanel icon={<CalendarDays />} title="Ma semaine au casino">
      <div className="grid grid-cols-3 gap-2 text-center">
        {tiles.map(([k, v]) => (
          <div key={k}>
            <p className="font-mono text-lg font-bold tabular-nums text-slate-100">{v}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">{k}</p>
          </div>
        ))}
      </div>
      {res.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-2 font-mono text-xs text-slate-200">
          {res.slice(0, 4).map(([id, n]) => (
            <span key={id} className="inline-flex items-center gap-1">
              <ResourceIcon id={id} className="h-3.5 w-3.5" /> +{formatCompact(n)}
            </span>
          ))}
        </p>
      )}
      <p className="text-[11px] text-slate-500">
        Depuis le début : {all.spins} tirage{all.spins > 1 ? "s" : ""}, {all.wins} gain{all.wins > 1 ? "s" : ""}, {all.jackpots} gros lot{all.jackpots > 1 ? "s" : ""}.
      </p>
    </CasinoPanel>
  );
}
