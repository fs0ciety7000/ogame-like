import { useMemo } from "react";
import { Swords } from "lucide-react";
import { HudCallout } from "@/components/ui/hud";
import { COMBAT_RULES } from "@/game/combat";
import { simulatePveFight } from "@/game/simulator";
import { findUnit } from "@/game/units";
import { formatNumber } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/**
 * 5.20 : estimation d'un combat contre un PNJ (prime, repaire), jouée par le
 * vrai moteur en tours. Indicative : le lancement reste toujours possible,
 * une flotte trop faible décroche d'elle-même au lieu d'être anéantie.
 */
export function PveFightEstimate({ player, fleet, enemyPower, formation, enemyLabel = "l'ennemi" }: { player: PlayerState; fleet: Record<string, number>; enemyPower: number; formation?: string; enemyLabel?: string }) {
  const sent = Object.values(fleet).some((n) => n > 0);
  const r = useMemo(() => (sent ? simulatePveFight(player, fleet, enemyPower, formation) : null), [player, fleet, enemyPower, formation, sent]);
  if (!r) return null;
  const win = r.outcome === "attacker_win";
  const draw = r.outcome === "draw";
  const lost = Object.entries(r.attackerLosses).filter(([, n]) => n > 0);
  const repaired = Object.values(r.attackerRecovered).reduce((s, n) => s + n, 0);
  const tone = win ? "mint" : draw ? "ember" : "danger";
  return (
    <HudCallout tone={tone} className="mt-2 text-xs">
      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]">
        <Swords className="h-3.5 w-3.5" aria-hidden />
        {win ? "Victoire probable" : draw ? "Issue incertaine" : "Défaite probable"}
        <span className="text-slate-500">
          · <span className="tabular-mono">{r.rounds?.length ?? 0}</span> tour{(r.rounds?.length ?? 0) > 1 ? "s" : ""}
          {r.retreated ? " · retraite" : ""}
        </span>
      </p>
      <p className="mt-1 text-slate-300">
        Pertes estimées : <strong className="tabular-mono text-slate-100">{Math.round(r.attackerLossPercent * 100)} %</strong> de tes PV
        {lost.length > 0 && (
          <>
            {" "}(
            {lost.map(([id, n], i) => (
              <span key={id}>
                {i > 0 && ", "}
                <span className="tabular-mono">{formatNumber(n)}</span> {findUnit(id)?.name ?? id}
              </span>
            ))}
            {repaired > 0 && (
              <>
                {" "}+ <span className="tabular-mono">{formatNumber(repaired)}</span> à l'Atelier
              </>
            )}
            )
          </>
        )}
        {" "}· {enemyLabel} : <strong className="tabular-mono text-slate-100">{Math.round(r.defenderLossPercent * 100)} %</strong>.
      </p>
      {!win && (
        <p className="mt-1 text-slate-400">
          Tu peux lancer quand même : ta flotte décroche d'elle-même après {Math.round(COMBAT_RULES.retreatAt * 100)} % de PV perdus ({Math.round(COMBAT_RULES.cautiousRetreatAt * 100)} % en Prudente). Pour l'emporter : plus de vaisseaux, des Traqueurs Kesh, l'Assaut, ou une flotte réparée à l'Atelier.
        </p>
      )}
    </HudCallout>
  );
}
