import { Link } from "react-router-dom";
import { CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OBJECTIVE_LABELS, activePass, passState, passTier } from "@/game/seasonPass";
import { currentSeasonId, seasonEndMs, seasonLabel } from "@/game/seasons";
import { streakStatus } from "@/game/streak";
import { formatCompact, formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import type { ChronicleObjective } from "@/game/chronicles";

/* 5.15.7 : « Ton mois » sur l'accueil : XP de saison, passe, série, actions
   du mois et rappel du mois dernier. */

const KEYS: ChronicleObjective[] = ["victory", "contract", "bounty", "spy", "market"];

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="font-display text-lg tabular-nums text-white">{value}</span>
      {sub && <span className="truncate text-[11px] text-slate-500">{sub}</span>}
    </div>
  );
}

export function MonthRecapCard({ now }: { now: number }) {
  const player = usePlayerStore((s) => s.player);
  if (!player) return null;
  const season = currentSeasonId(now);
  const st = passState(player, now);
  const tiers = activePass(st.seasonId).tiers.length;
  const seasonXp = player.seasonId === season ? player.seasonXp ?? 0 : 0;
  const streak = streakStatus(player, now);
  const days = Math.max(0, Math.ceil((seasonEndMs(now) - now) / 86_400_000));
  const actions = KEYS.map((k) => ({ k, n: st.activity?.[k] ?? 0 })).filter((a) => a.n > 0);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="hud-title flex items-center gap-2 text-sm text-white">
          <CalendarRange className="h-4 w-4 self-center text-cyan-glow" /> Ton mois · {seasonLabel(season)}
        </h2>
        <span className="font-mono text-[11px] text-slate-500">encore {days} jour{days > 1 ? "s" : ""}</span>
        <Link to="/game/joueurs?mode=season" className="ml-auto text-xs text-slate-400 hover:text-cyan-glow">
          Classement de saison
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="XP de saison" value={formatCompact(seasonXp)} sub={player.lastSeasonId && player.lastSeasonXp ? `${seasonLabel(player.lastSeasonId)} : ${formatCompact(player.lastSeasonXp)}` : undefined} />
        <Stat label="Passe" value={`${passTier(st.points, st.seasonId)}/${tiers}`} sub={`${st.claimed.length} réclamé${st.claimed.length > 1 ? "s" : ""}`} />
        <Stat label="Série" value={`${streak.current} j`} sub={streak.claimed ? "jour reçu" : "à réclamer"} />
      </div>
      {actions.length > 0 && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/5 pt-2 font-mono text-[11px] tabular-nums text-slate-400">
          {actions.map((a) => (
            <span key={a.k}>
              {OBJECTIVE_LABELS[a.k]} <span className="text-slate-200">{formatNumber(a.n)}</span>
            </span>
          ))}
        </p>
      )}
    </Card>
  );
}
