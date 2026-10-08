import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { chronicleOf, chronicleState, objectiveLabel, unlockedEpisodes } from "@/game/chronicles";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

/* 6.14.67 (UX-6, AD-18) : sur la page du Passe, les Chroniques tiennent en une ligne qui mène à
   leur page (épisodes, scènes, réclamation). Le bloc complet faisait croire que le Passe et les
   Chroniques étaient une seule chose. */

export function ChronicleLine() {
  const player = usePlayerStore((s) => s.player);
  const now = Date.now();
  const month = chronicleOf(now);
  if (!player || !month) return null;
  const st = chronicleState(player, now);
  const open = unlockedEpisodes(now);
  const current = month.episodes.findIndex((_, i) => i < open && !st.claimed.includes(i));
  const e = current >= 0 ? month.episodes[current] : null;
  const progress = current >= 0 ? Math.min(st.progress[current] ?? 0, e?.objective.count ?? 0) : 0;
  const ready = !!e && progress >= e.objective.count;
  return (
    <Link
      to="/game/chroniques"
      className={cn(
        "glass-panel hud-cut-sm flex min-h-11 items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors hover:bg-cyan-glow/[0.06]",
        ready ? "border-l-cyan-glow" : "border-l-white/15",
      )}
    >
      <BookOpen className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Chroniques</span>{" "}
        {e ? (
          <span className="text-slate-200">
            épisode {current + 1}, {objectiveLabel(e.objective.type).toLowerCase()} <span className="font-mono tabular-nums">{progress}/{e.objective.count}</span>
            {ready && <span className="text-cyan-glow"> : à terminer</span>}
          </span>
        ) : (
          <span className="text-slate-200">
            {month.title} : <span className="font-mono tabular-nums">{st.claimed.length}/{month.episodes.length}</span> épisodes
          </span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
    </Link>
  );
}
