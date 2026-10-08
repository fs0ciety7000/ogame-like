import { useMemo, useState } from "react";
import { CheckCircle2, Hourglass, ListChecks, TriangleAlert, XCircle } from "lucide-react";
import { HudCallout, HudChip, HUD_TONE, type HudTone } from "@/components/ui/hud";
import { currentGameContent } from "@/game/content";
import { chronicleMonthId } from "@/game/chronicles";
import { checkMonth, monthBounds, monthCheckSummary, type CheckStatus } from "@/game/monthCheck";
import { nextMonthId, type PassSeason } from "@/game/passSeasons";
import { defaultSimProfiles, passDurationVerdict, simulatePass, type PassSimResult } from "@/game/passSimulator";
import { objectiveLabel } from "@/game/seasonPass";
import { seasonLabel } from "@/game/seasons";
import { useContentStore } from "@/services/contentService";
import { cn, formatDecimal } from "@/lib/utils";

/* 5.15.4 : outils de l'onglet Passes de saison : vérification d'un mois avant
   son ouverture (passe, Chroniques, boss de saison, alternance) et simulateur
   de durée d'un passe (trois joueurs types, jour par jour). */

const STATUS: Record<CheckStatus, { tone: HudTone; label: string; icon: typeof CheckCircle2 }> = {
  ok: { tone: "mint", label: "OK", icon: CheckCircle2 },
  warn: { tone: "ember", label: "À voir", icon: TriangleAlert },
  bad: { tone: "danger", label: "Bloquant", icon: XCircle },
};

export function MonthCheckCard() {
  const version = useContentStore((s) => s.version);
  const current = chronicleMonthId(Date.now());
  const [monthId, setMonthId] = useState(() => nextMonthId(current));
  const items = useMemo(() => {
    const c = currentGameContent();
    return checkMonth(monthId, { passSeasons: c.passSeasons, chronicles: c.chronicles });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcul à chaque enregistrement de contenu
  }, [monthId, version]);
  const summary = STATUS[monthCheckSummary(items)];
  return (
    <div className="glass-panel hud-cut flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <ListChecks className="h-4 w-4 text-cyan-glow" />
        <h3 className="hud-title text-sm text-slate-100">Vérification du mois</h3>
        <div className="ml-auto flex gap-1.5">
          {[current, nextMonthId(current)].map((id) => (
            <HudChip key={id} asChild size="sm" tone={id === monthId ? "accent" : "neutral"}>
              <button type="button" onClick={() => setMonthId(id)}>
                {seasonLabel(id)}
              </button>
            </HudChip>
          ))}
        </div>
      </div>
      <HudCallout tone={summary.tone} className="text-xs">
        {monthCheckSummary(items) === "ok"
          ? `${seasonLabel(monthId)} est prêt : passe, Chroniques, boss de saison et alternance.`
          : monthCheckSummary(items) === "warn"
            ? `${seasonLabel(monthId)} : ${items.filter((i) => i.status === "warn").length} point(s) à voir, rien de bloquant.`
            : `${seasonLabel(monthId)} : ${items.filter((i) => i.status === "bad").length} point(s) bloquant(s) à corriger avant l'ouverture.`}
      </HudCallout>
      <ul className="divide-y divide-white/5">
        {items.map((i, k) => {
          const s = STATUS[i.status];
          return (
            <li key={k} className="grid grid-cols-[1rem_8.5rem_minmax(0,1fr)] items-baseline gap-x-3 py-2 text-xs sm:grid-cols-[1rem_8.5rem_10rem_minmax(0,1fr)]">
              <s.icon aria-label={s.label} className="h-3.5 w-3.5 self-center" style={{ color: HUD_TONE[s.tone] }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{i.area}</span>
              <span className="text-slate-200 max-sm:col-start-3">{i.label}</span>
              <span className="text-slate-400 max-sm:col-span-2 max-sm:col-start-2">{i.detail}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DayBar({ result, days }: { result: PassSimResult; days: number }) {
  // Une case par palier : vert si acquis dans le mois, ambre après, gris jamais.
  return (
    <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-px" role="img" aria-label={`${result.tiersInMonth} paliers sur 30 dans le mois`}>
      {result.tierDays.map((d, i) => (
        <span
          key={i}
          title={`Palier ${i + 1} : ${d === null ? "pas atteint" : `jour ${d}`}`}
          className={cn("h-3", d === null ? "bg-white/5" : d <= days ? "bg-mint-glow/70" : "bg-ember-glow/60", (i + 1) % 10 === 0 && "outline outline-1 outline-gold-glow/60")}
        />
      ))}
    </div>
  );
}

export function PassDurationCard({ season }: { season: PassSeason | null }) {
  const results = useMemo(() => {
    if (!season) return null;
    const { days } = monthBounds(season.id);
    return { days, list: defaultSimProfiles().map((p) => simulatePass(season, p, days)) };
  }, [season]);
  if (!season || !results) return null;
  const median = results.list[1];
  const verdict = passDurationVerdict(median, results.days);
  return (
    <div className="glass-panel hud-cut flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Hourglass className="h-4 w-4 self-center text-cyan-glow" />
        <h3 className="hud-title text-sm text-slate-100">Simulateur de durée · {seasonLabel(season.id)}</h3>
        <span className="font-mono text-[11px] text-slate-500">
          {season.challengeMode === "cumulative" ? "défis cumulés (totaux du mois)" : "défis un palier à la fois"} · {season.pointsPerTier} pts / palier
        </span>
      </div>
      <HudCallout tone={verdict.tone} className="text-xs">
        {verdict.text} Les retouches du brouillon (points par palier, défis) sont prises en compte avant même d'enregistrer.
      </HudCallout>
      <div className="flex flex-col gap-3">
        {results.list.map((r) => (
          <div key={r.profile.id} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-xs">
              <span className="w-24 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{r.profile.label}</span>
              <span className="font-mono tabular-nums text-slate-200">
                {r.finishDay === null ? "pas fini" : `fini jour ${r.finishDay}`} · {r.tiersInMonth}/30 dans le mois
              </span>
              <span className="font-mono tabular-nums text-slate-500">{formatDecimal(r.pointsPerDay, 1)} pts/jour</span>
              <span className="text-slate-500">
                frein : {r.bottleneck === "points" ? "les points" : r.bottleneck === "challenges" ? "les défis" : "aucun"}
                {r.slowestChallenge && ` · défi le plus long : palier ${r.slowestChallenge.tier} (${r.slowestChallenge.reqs.map((q) => `${objectiveLabel(q.key).toLowerCase()} ${q.count}`).join(", ")}), ${r.slowestChallenge.days} j`}
              </span>
            </div>
            <DayBar result={r} days={results.days} />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">
        Joueurs types autour des quantités de base des objectifs (occasionnel ×0,5, médian ×1, assidu ×2), avec connexions, Chroniques, boss de saison et objectifs d'alliance. Case verte : palier acquis dans le mois ; ambre : après ; liseré or : paliers 10, 20, 30.
      </p>
    </div>
  );
}
