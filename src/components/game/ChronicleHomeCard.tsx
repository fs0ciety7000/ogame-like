import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudMeter } from "@/components/ui/hud";
import { HudPanel } from "@/components/ui/panel";
import { chronicleOf, chronicleState, episodeUnlockMs, OBJECTIVE_LABELS, unlockedEpisodes } from "@/game/chronicles";
import { usePlayerStore } from "@/store/playerStore";

/* 5.15.12 : l'épisode des Chroniques en cours, sur l'accueil (objectif, avancement, lien). */

const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

export function ChronicleHomeCard({ now }: { now: number }) {
  const player = usePlayerStore((s) => s.player);
  const month = chronicleOf(now);
  if (!player || !month) return null;
  const st = chronicleState(player, now);
  const open = unlockedEpisodes(now);
  // Premier épisode ouvert et pas encore terminé ; sinon le prochain à paraître.
  const current = month.episodes.findIndex((_, i) => i < open && !st.claimed.includes(i));
  const next = open < month.episodes.length ? open : -1;
  const e = current >= 0 ? month.episodes[current] : null;
  const progress = current >= 0 ? (st.progress[current] ?? 0) : 0;
  const ready = !!e && progress >= e.objective.count;
  return (
    <HudPanel
      icon={<BookOpen />}
      title={`Chroniques · ${month.title}`}
      tone="accent"
      accent={ready}
      aside={
        <span className="font-mono text-[11px] tabular-nums text-slate-400">
          {st.claimed.length}/{month.episodes.length}
        </span>
      }
    >
      {e ? (
        <>
          <p className="text-sm text-slate-100">
            Épisode {current + 1} : {e.title}
          </p>
          <div className="flex justify-between font-mono text-[11px] tabular-nums text-slate-400">
            <span>{OBJECTIVE_LABELS[e.objective.type]}</span>
            <span>
              {Math.min(progress, e.objective.count)} / {e.objective.count}
            </span>
          </div>
          <HudMeter percent={(progress / e.objective.count) * 100} />
        </>
      ) : (
        <p className="text-sm text-slate-400">{next >= 0 ? `Épisodes ouverts terminés. Le suivant paraît le ${fmtDay(episodeUnlockMs(month.id, next))}.` : "Chapitre terminé ce mois-ci."}</p>
      )}
      <Button asChild size="sm" variant={ready ? "primary" : "ghost"} className="self-start">
        <Link to="/game/chroniques">{ready ? "Terminer l'épisode" : "Ouvrir les Chroniques"}</Link>
      </Button>
    </HudPanel>
  );
}
