import { Link } from "react-router-dom";
import { assetUrl } from "@/lib/assets";
import { isActive, worldBossOf } from "@/game/leviathan";
import { useLeviathan } from "@/services/leviathanService";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration, formatNumber } from "@/lib/utils";

/** Bandeau d'accueil pendant le passage du Léviathan (v3.1). */
export function LeviathanBanner() {
  useNowTicker();
  const state = useLeviathan();
  const now = Date.now();
  if (!state || !isActive(state, now)) return null;
  // v5.14 : le boss mondial de la semaine.
  const boss = worldBossOf(state);
  return (
    <Link
      to="/game/uber"
      className="hud-cut-sm group relative flex flex-wrap items-center gap-3 overflow-hidden border border-danger-glow/50 bg-danger-glow/[0.08] p-4 transition-colors hover:bg-danger-glow/15"
      style={{ backgroundImage: `linear-gradient(90deg, color-mix(in srgb,var(--color-space-950) 95%,transparent) 35%, color-mix(in srgb,var(--color-space-950) 55%,transparent)), url(${assetUrl(boss.image)}), url(${assetUrl("/assets/leviathan/leviathan.webp")})`, backgroundSize: "cover", backgroundPosition: "center 40%" }}
    >
      <img src={assetUrl("/assets/leviathan/leviathan-emblem.webp")} alt="" className="h-12 w-12 animate-pulse drop-shadow-[0_0_12px_color-mix(in_srgb,var(--color-danger-glow)_50%,transparent)]" />
      <div className="min-w-0 flex-1">
        <p className="hud-title text-base text-slate-100">{boss.name} menace la galaxie</p>
        <p className="text-xs text-slate-400">
          {formatNumber(state.hp)} / {formatNumber(state.maxHp)} points de structure · repart dans {formatDuration(Math.max(0, Math.floor((state.endMs - now) / 1000)))}
        </p>
      </div>
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-danger-glow group-hover:underline">Attaquer →</span>
    </Link>
  );
}
