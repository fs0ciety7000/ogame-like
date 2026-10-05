import { Link } from "react-router-dom";
import { Check, Gift, Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudChip, HudMeter } from "@/components/ui/hud";
import { publishedPassSeason } from "@/game/passSeasons";
import { activeChallengeTier, activePass, isCumulativePass, OBJECTIVE_LABELS, passState, passTier, tierRequirements } from "@/game/seasonPass";
import { seasonLabel } from "@/game/seasons";
import { formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";

/* 5.15.7 : le passe sur l'accueil : palier, points jusqu'au suivant, défi en
   cours et paliers à réclamer, sans ouvrir la page du passe. */

export function PassProgressCard({ now }: { now: number }) {
  const player = usePlayerStore((s) => s.player);
  if (!player) return null;
  const st = passState(player, now);
  const pass = activePass(st.seasonId);
  const tiers = pass.tiers.length;
  const tier = passTier(st.points, st.seasonId);
  if (st.claimed.length >= tiers) return null;
  const season = publishedPassSeason(st.seasonId);
  const inTier = st.points - tier * pass.pointsPerTier;
  const challengeTier = activeChallengeTier(st);
  const challenge = challengeTier ? tierRequirements(player, challengeTier, now) : null;
  const claimable = Array.from({ length: tier }, (_, i) => i + 1).filter((t) => !st.claimed.includes(t) && tierRequirements(player, t, now)?.met !== false).length;
  return (
    <Card className="flex flex-col gap-3 p-4" style={season ? { borderLeft: `2px solid ${season.theme.accent}` } : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <Ticket className="h-4 w-4 text-gold-glow" />
        <h2 className="hud-title text-sm text-slate-100">{season ? season.theme.name : `Passe de ${seasonLabel(st.seasonId)}`}</h2>
        <span className="font-mono text-xs tabular-nums text-slate-400">
          palier {tier} / {tiers}
        </span>
        {claimable > 0 ? (
          <Button asChild size="sm" className="ml-auto">
            <Link to="/game/passe">
              <Gift className="h-3.5 w-3.5" /> {claimable} à réclamer
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="ghost" className="ml-auto">
            <Link to="/game/passe">Voir le passe</Link>
          </Button>
        )}
      </div>
      {tier < tiers && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] tabular-nums text-slate-400">
            <span>Palier {tier + 1}</span>
            <span>
              {formatNumber(inTier)} / {formatNumber(pass.pointsPerTier)} points
            </span>
          </div>
          <HudMeter percent={(inTier / pass.pointsPerTier) * 100} />
        </div>
      )}
      {challenge && (
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
            Défi du palier {challengeTier}
            {isCumulativePass(st.seasonId) ? " · totaux du mois" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {challenge.reqs.map((r) => (
              <HudChip key={r.key} size="sm" tone={r.met ? "mint" : "accent"} className="normal-case tracking-normal">
                {r.met ? <Check /> : null} {OBJECTIVE_LABELS[r.key]} {r.done}/{r.count}
              </HudChip>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
