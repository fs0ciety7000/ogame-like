import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";
import { HudCallout } from "@/components/ui/hud";
import { findUnit } from "@/game/units";
import { hullPercent, workshopView } from "@/game/workshop";
import { formatDuration } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/**
 * 5.21 : avertissement avant de lancer une flotte abîmée (coques conservées entre
 * les combats). Indique l'état moyen des vaisseaux choisis, le plus atteint, et
 * le temps de réparation restant à l'Atelier. N'empêche jamais le lancement.
 */
export function HullWarning({ player, fleet, className }: { player: PlayerState; fleet: Record<string, number>; className?: string }) {
  const picked = Object.entries(fleet).filter(([, n]) => n > 0);
  if (!picked.length) return null;
  let weight = 0;
  let sum = 0;
  let worst: { id: string; hull: number } | null = null;
  for (const [id, n] of picked) {
    const hull = hullPercent(player, id);
    weight += n;
    sum += n * hull;
    if (!worst || hull < worst.hull) worst = { id, hull };
  }
  const avg = weight > 0 ? sum / weight : 1;
  if (avg >= 0.95) return null;
  const view = workshopView(player, Date.now());
  const left = view.hullDoneAtMs ? Math.max(0, Math.ceil((view.hullDoneAtMs - Date.now()) / 1000)) : 0;
  return (
    <HudCallout tone={avg >= 0.6 ? "ember" : "danger"} className={className ?? "mt-2 text-xs"}>
      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]">
        <Wrench className="h-3.5 w-3.5" aria-hidden /> Flotte abîmée · coques à <span className="tabular-mono">{Math.round(avg * 100)} %</span>
      </p>
      <p className="mt-1 text-slate-300">
        Elle se bat comme une flotte <span className="tabular-mono">{Math.round((1 - avg) * 100)} %</span> plus petite
        {worst && worst.hull < avg - 0.05 && (
          <>
            {" "}(la plus atteinte : {findUnit(worst.id)?.name ?? worst.id}, <span className="tabular-mono">{Math.round(worst.hull * 100)} %</span>)
          </>
        )}
        .{left > 0 && <> Réparation complète dans <span className="tabular-mono">{formatDuration(left)}</span>.</>}{" "}
        <Link to="/game/batiments?onglet=atelier" className="text-cyan-glow hover:underline">
          Voir l'Atelier
        </Link>
      </p>
    </HudCallout>
  );
}
