import { Link } from "react-router-dom";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { HudChip } from "@/components/ui/hud";
import { casinoClosesAt, casinoOpen, dailyTokenReady, playerCasino, tournamentEndsAt, tournamentRanking } from "@/game/casino";
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
  // 6.7.1 : casino ouvert en permanence : le bandeau ne s'affiche que pendant le tournoi ou pour le jeton du jour.
  const tournament = !!casino.tournament;
  if (closes === null && !tournament && !daily) return null;
  const ends = tournament ? tournamentEndsAt(casino.settings, now) : null;
  const tokens = playerCasino(player).tokens;
  const rank = tournamentRanking(casino.tournament).findIndex((r) => r.uid === player.uid);
  return (
    // 6.14.63 (AD-9) : le texte garde toute la largeur à côté du jeton (il passait à un mot par ligne dans une colonne étroite) ;
    // la pastille et « Jouer » passent sur une ligne à eux, à toutes les largeurs (la carte vit dans la colonne latérale).
    <Link to="/game/casino" className="casino-banner hud-cut-sm group relative flex flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden p-4">
      <img src={assetUrl("/assets/casino/salle-777.webp")} alt="" aria-hidden className="casino-banner-bg" />
      <TokenIcon size={44} variant="art" className="relative shrink-0" />
      <div className="relative min-w-0 flex-1 basis-[calc(100%-56px)]">
        <p className="hud-title text-base text-slate-100">{tournament ? "Tournoi du Casino orbital" : "Le Casino orbital est ouvert"}</p>
        <p className="text-xs text-slate-300">
          {ends ? (
            <>
              Tournoi : fin dans <span className="font-mono tabular-nums">{formatDuration(Math.max(0, Math.floor((ends - now) / 1000)))}</span>
            </>
          ) : closes ? (
            <>
              Ferme dans <span className="font-mono tabular-nums">{formatDuration(Math.max(0, Math.floor((closes - now) / 1000)))}</span>
            </>
          ) : (
            "Ouvert jusqu'à nouvel ordre"
          )}{" "}
          · <span className="font-mono tabular-nums">{tokens}</span> jeton{tokens > 1 ? "s" : ""} en réserve
          {rank >= 0 && (
            <>
              {" "}
              · <span className="font-mono tabular-nums">{rank + 1}</span>
              {rank === 0 ? "er" : "e"} au tournoi
            </>
          )}
        </p>
      </div>
      <div className="relative flex basis-full flex-wrap items-center justify-between gap-3">
        {daily && (
          <HudChip size="sm" tone="gold" alert>
            Jeton du jour à récupérer
          </HudChip>
        )}
        <span className="ml-auto font-mono text-xs uppercase tracking-[0.15em] text-gold-glow group-hover:underline">Jouer →</span>
      </div>
    </Link>
  );
}
