import { Handshake, Timer, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HudTag } from "@/components/ui/hud";
import { COALITION_RULES, coalitionRanking, type Coalition } from "@/game/coalition";
import { PASS_POINTS } from "@/game/seasonPass";
import type { WarlordPublic } from "@/game/warlords";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatDuration, formatNumber } from "@/lib/utils";

/* v4.7 : coalition de tout le secteur contre un seigneur devenu trop fort. */

export function CoalitionCard({ coalition: co, warlords, uid }: { coalition: Coalition; warlords: WarlordPublic[]; uid: string }) {
  const now = Date.now();
  const w = warlords.find((x) => x.id === co.warlordId);
  const active = co.status === "active" && now < co.endsAtMs;
  // Coalition terminée : affichée une semaine.
  if (!active && now - (co.finishedAtMs ?? co.endsAtMs) > 7 * 24 * 3600_000) return null;
  const pct = Math.min(100, (co.dealt / Math.max(1, co.goal)) * 100);
  const ranking = coalitionRanking(co);
  const mine = co.contributions[uid] ?? 0;
  const myShare = mine / Math.max(1, co.goal);
  const rank = ranking.findIndex((r) => r.uid === uid);

  return (
    <Card className={cn("relative overflow-hidden p-0", active ? "border-ember-glow/50" : "border-white/10")}>
      <div className="flex flex-col sm:flex-row">
        {w && <img src={assetUrl(w.portrait)} alt={w.name} className="h-40 w-full object-cover object-top sm:h-auto sm:w-44" onError={(e) => ((e.target as HTMLImageElement).src = assetUrl(w.fallbackArt))} />}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Handshake className="h-5 w-5 text-ember-glow" />
            <p className="hud-title text-base">Coalition contre {w?.name ?? "un seigneur"}</p>
            <HudTag tone={active ? "danger" : co.status === "won" ? "mint" : "gold"}>{active ? "En cours" : co.status === "won" ? "Victoire" : "Échec"}</HudTag>
            {active && (
              <span className="ml-auto flex items-center gap-1 font-mono text-xs text-slate-400">
                <Timer className="h-3.5 w-3.5" /> {formatDuration(Math.max(0, (co.endsAtMs - now) / 1000))}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300">
            {active
              ? `Tout le secteur a ${COALITION_RULES.durationDays} jours pour lui détruire ${formatNumber(co.goal)} de puissance. Pille-le, repousse ses attaques : chaque vaisseau détruit compte.`
              : co.status === "won"
                ? `Le secteur l'a brisé : il perd ${Math.round(COALITION_RULES.powerLoss * 100)} % de sa puissance et quitte le secteur ${COALITION_RULES.awayDays} jours.`
                : `Il a tenu et sort renforcé de ${Math.round(COALITION_RULES.failGrowth * 100)} %.`}
          </p>
          <div>
            <div className="flex justify-between font-mono text-xs text-slate-400">
              <span>Puissance détruite</span>
              <span>
                {formatCompact(co.dealt)} / {formatCompact(co.goal)}
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden border border-ember-glow/40 bg-ember-glow/10">
              <i className="block h-full transition-[width] duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--color-ember-glow), var(--color-gold-glow))" }} />
            </div>
          </div>
          <div className="grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
            <div>
              <p className="mb-1 flex items-center gap-1 text-slate-300">
                <Trophy className="h-3.5 w-3.5 text-gold-glow" /> Meilleurs coalisés
              </p>
              {ranking.length === 0 ? (
                <p>Personne n'a encore frappé.</p>
              ) : (
                <ol className="space-y-0.5">
                  {ranking.slice(0, 5).map((r, i) => (
                    <li key={r.uid} className={cn(r.uid === uid && "text-cyan-glow")}>
                      {i + 1}. {r.pseudo} · {formatCompact(r.damage)}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-slate-300">Ta part : {formatCompact(mine)} ({(myShare * 100).toFixed(1)} % de l'objectif){rank >= 0 ? ` · rang ${rank + 1}` : ""}</p>
              <p>
                Victoire : +{PASS_POINTS.coalition} points de passe et {COALITION_RULES.rewardHours} h de production dès {Math.round(COALITION_RULES.minShare * 100)} % de l'objectif. Relique épique pour les {COALITION_RULES.topRelics}{" "}
                premiers, titre « Briseur de… » pour le meilleur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
