import { Link } from "react-router-dom";
import { Palmtree } from "lucide-react";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration } from "@/lib/utils";
import { onVacation } from "@/game/vacation";
import { usePlayerStore } from "@/store/playerStore";

/** v4.2 : rappel permanent pendant les vacances (le jeu est en pause pour le joueur). */
export function VacationBanner() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const now = Date.now();
  if (!player || !onVacation(player, now) || !player.vacation) return null;
  const left = player.vacation.untilMs - now;
  return (
    <div className="relative z-30 flex items-center gap-3 border-b border-cyan-glow/30 bg-space-950 px-4 py-1.5 text-xs sm:px-6">
      <Palmtree className="h-3.5 w-3.5 text-cyan-glow" />
      <span className="font-mono font-bold uppercase tracking-[0.16em] text-cyan-glow">En vacances</span>
      <span className="hidden text-slate-400 sm:inline">Base protégée, production à 25 %, chantiers en pause · retour dans {left > 48 * 3600_000 ? `${Math.ceil(left / 86_400_000)} jours` : formatDuration(left / 1000)}</span>
      <Link to="/game/reglages" className="ml-auto font-semibold text-cyan-glow underline-offset-4 hover:underline">
        Gérer
      </Link>
    </div>
  );
}
