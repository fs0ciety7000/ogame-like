import { Link } from "react-router-dom";
import { Skull } from "lucide-react";
import { isActive } from "@/game/leviathan";
import { useLeviathan } from "@/services/leviathanService";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration, formatNumber } from "@/lib/utils";

/** Bandeau d'accueil pendant le passage du Léviathan (v3.1). */
export function LeviathanBanner() {
  useNowTicker();
  const state = useLeviathan();
  const now = Date.now();
  if (!state || !isActive(state, now)) return null;
  return (
    <Link to="/game/leviathan" className="hud-cut-sm group flex flex-wrap items-center gap-3 border border-danger-glow/50 bg-danger-glow/[0.08] p-4 transition-colors hover:bg-danger-glow/15">
      <Skull className="h-6 w-6 animate-pulse text-danger-glow" />
      <div className="min-w-0 flex-1">
        <p className="hud-title text-base text-white">Le Léviathan menace la galaxie</p>
        <p className="text-xs text-slate-400">
          {formatNumber(state.hp)} / {formatNumber(state.maxHp)} points de structure · repart dans {formatDuration(Math.max(0, Math.floor((state.endMs - now) / 1000)))}
        </p>
      </div>
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-danger-glow group-hover:underline">Attaquer →</span>
    </Link>
  );
}
