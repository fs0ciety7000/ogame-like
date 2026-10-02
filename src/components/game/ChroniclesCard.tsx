import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Check, Flame, Lock, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SceneDialog } from "@/components/game/StoryDialog";
import { chronicleOf, chronicleState, episodeUnlockMs, OBJECTIVE_LABELS, seasonBossWindow, unlockedEpisodes } from "@/game/chronicles";
import { PASS_POINTS } from "@/game/seasonPass";
import { claimChronicleEpisode, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* v4.3 : les quatre épisodes du mois, leur objectif et le boss de fin. */

const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export function ChroniclesCard() {
  const player = usePlayerStore((s) => s.player);
  const [replay, setReplay] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const now = Date.now();
  const month = chronicleOf(now);
  if (!player || !month) return null;
  const st = chronicleState(player, now);
  const open = unlockedEpisodes(now);
  const boss = seasonBossWindow(now, true);

  const claim = async (i: number) => {
    setBusy(i);
    try {
      await claimChronicleEpisode(i);
      toast.success(`Épisode ${i + 1} terminé`, { description: `+${PASS_POINTS.chronicle} points de passe` });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="overflow-hidden p-0" style={{ boxShadow: `inset 0 2px 0 ${month.theme.accent}` }}>
      <div className="relative">
        <img src={assetUrl(month.boss.image)} onError={(e) => ((e.target as HTMLImageElement).src = assetUrl(month.boss.fallbackImage))} alt="" className="h-32 w-full object-cover opacity-70 sm:h-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-end gap-3">
          <div className="min-w-0">
            <p className="hud-eyebrow flex items-center gap-1.5 text-[10px]" style={{ color: month.theme.accent }}>
              <BookOpen className="h-3.5 w-3.5" /> Chroniques · {month.theme.label}
            </p>
            <h2 className="hud-title text-xl text-white">{month.title}</h2>
          </div>
          {boss && (
            <Link to="/game/boss" className="ml-auto flex items-center gap-1.5 border border-white/15 bg-space-950/80 px-2.5 py-1 text-xs text-slate-200 hover:border-white/40">
              <Flame className="h-3.5 w-3.5" style={{ color: month.theme.accent }} />
              {now >= boss.startMs ? `${month.boss.name} est là !` : `${month.boss.name} · ${fmtDay(boss.startMs)}, 18 h`}
            </Link>
          )}
        </div>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {month.episodes.map((e, i) => {
          const locked = i >= open;
          const done = st.claimed.includes(i);
          const progress = st.progress[i] ?? 0;
          const ready = !locked && !done && progress >= e.objective.count;
          return (
            <div key={i} className={cn("flex flex-col gap-2 border p-3", done ? "border-mint-glow/30" : ready ? "border-gold-glow/50" : "border-white/10", locked && "opacity-60")}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-500">Épisode {i + 1}</span>
                {done && <Check className="h-3.5 w-3.5 text-mint-glow" />}
                {locked && <Lock className="h-3.5 w-3.5 text-slate-500" />}
                {!locked && (
                  <button type="button" title="Revoir la scène" className="ml-auto text-slate-500 hover:text-white" onClick={() => setReplay(i)}>
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-white">{e.title}</p>
              {locked ? (
                <p className="text-xs text-slate-500">S'ouvre le {fmtDay(episodeUnlockMs(month.id, i))}.</p>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    {OBJECTIVE_LABELS[e.objective.type]} : <span className="font-mono text-slate-200">{Math.min(progress, e.objective.count)} / {e.objective.count}</span>
                  </p>
                  <div className="h-1.5 bg-white/5">
                    <div className="h-full" style={{ width: `${Math.min(100, (progress / e.objective.count) * 100)}%`, background: month.theme.accent }} />
                  </div>
                  {!done && (
                    <Button size="sm" disabled={!ready || busy !== null} onClick={() => void claim(i)} className="self-start">
                      Terminer l'épisode (+{PASS_POINTS.chronicle})
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      {replay !== null && (
        <SceneDialog title={`Chroniques · ${month.title} · Épisode ${replay + 1} : ${month.episodes[replay].title}`} lines={month.episodes[replay].lines} pseudo={player.pseudo} onClose={() => setReplay(null)} />
      )}
    </Card>
  );
}
