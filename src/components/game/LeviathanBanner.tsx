import { Link } from "react-router-dom";
import { assetUrl } from "@/lib/assets";
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
    <Link
      to="/game/leviathan"
      className="hud-cut-sm group relative flex flex-wrap items-center gap-3 overflow-hidden border border-danger-glow/50 bg-danger-glow/[0.08] p-4 transition-colors hover:bg-danger-glow/15"
      style={{ backgroundImage: `linear-gradient(90deg, rgba(5,7,15,0.95) 35%, rgba(5,7,15,0.55)), url(${assetUrl("/assets/leviathan/leviathan.webp")})`, backgroundSize: "cover", backgroundPosition: "center 40%" }}
    >
      <img src={assetUrl("/assets/leviathan/leviathan-emblem.webp")} alt="" className="h-12 w-12 animate-pulse drop-shadow-[0_0_12px_rgba(255,60,60,0.5)]" />
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
