import { Link } from "react-router-dom";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { HudChip } from "@/components/ui/hud";
import { casinoClosesAt, casinoOpen, dailyTokenReady, playerCasino, tournamentRanking } from "@/game/casino";
import { useCasino } from "@/services/casinoService";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { formatDuration } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/** v5.12 : bandeau d'accueil pendant l'ouverture du Casino orbital (fermeture, jeton du jour, place au tournoi). */
export function CasinoBanner({ player }: { player: PlayerState }) {
  useNowTicker();
  const [casino] = useCasino();
  const now = Date.now();
  if (!casino || !casinoOpen(casino.settings, now)) return null;
  const closes = casinoClosesAt(casino.settings, now);
  const daily = dailyTokenReady(player, casino.settings, now);
  const tokens = playerCasino(player).tokens;
  const rank = tournamentRanking(casino.tournament).findIndex((r) => r.uid === player.uid);
  return (
    <Link to="/game/casino" className="casino-banner hud-cut-sm group relative flex flex-wrap items-center gap-3 overflow-hidden p-4">
      <img src={assetUrl("/assets/casino/salle-777.webp")} alt="" aria-hidden className="casino-banner-bg" />
      <TokenIcon size={44} variant="art" className="relative" />
      <div className="relative min-w-0 flex-1">
        <p className="hud-title text-base text-slate-100">Le Casino orbital est ouvert</p>
        <p className="text-xs text-slate-300">
          {closes ? `Ferme dans ${formatDuration(Math.max(0, Math.floor((closes - now) / 1000)))}` : "Ouvert jusqu'à nouvel ordre"} · {tokens} jeton{tokens > 1 ? "s" : ""} en réserve
          {rank >= 0 ? ` · ${rank + 1}${rank === 0 ? "er" : "e"} au tournoi` : ""}
        </p>
      </div>
      {daily && (
        <HudChip size="sm" tone="gold" alert className="relative">
          Jeton du jour à récupérer
        </HudChip>
      )}
      <span className="relative font-mono text-xs uppercase tracking-[0.15em] text-gold-glow group-hover:underline">Jouer →</span>
    </Link>
  );
}
