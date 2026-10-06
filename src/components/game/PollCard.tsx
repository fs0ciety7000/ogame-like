import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Check } from "lucide-react";
import { resultsVisible, type Poll, type PollResults } from "@/game/polls";
import { fetchPollResults, votePoll } from "@/services/pollService";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatDuration, formatNumber } from "@/lib/utils";

/* 5.26 : sondage communautaire d'une annonce : on vote d'un clic (vote
   modifiable jusqu'à la clôture), les barres apparaissent ensuite. */

export function PollCard({ id, poll, className }: { id: string; poll: Poll; className?: string }) {
  useNowTicker();
  const [results, setResults] = useState<PollResults | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchPollResults(id)
      .then((r) => alive && setResults(r))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id]);

  const open = results ? results.open : poll.closesAtMs === null || Date.now() < poll.closesAtMs;
  const show = results ? resultsVisible(poll, results) : false;
  const vote = async (choice: number) => {
    if (!open || busy) return;
    setBusy(true);
    try {
      setResults(await votePoll(id, choice));
      toast.success(results?.mine === null || !results ? "Vote enregistré." : "Vote modifié.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("hud-cut-sm flex flex-col gap-2 border border-cyan-glow/25 bg-space-950/80 p-3 backdrop-blur-sm", className)} onClick={(e) => e.stopPropagation()}>
      <p className="hud-eyebrow flex items-center gap-2 text-[10px] text-cyan-glow">
        <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Sondage
        <span className="ml-auto font-mono normal-case tracking-normal text-slate-500">
          {open ? (poll.closesAtMs ? `clôture dans ${formatDuration(Math.max(0, poll.closesAtMs - Date.now()) / 1000)}` : "ouvert") : "clos"}
        </span>
      </p>
      <p className="text-sm text-slate-100">{poll.question}</p>
      <ul className="flex flex-col gap-1.5" role="list">
        {poll.options.map((label, i) => {
          const count = results?.counts[i] ?? 0;
          const pct = results && results.total > 0 ? Math.round((count / results.total) * 100) : 0;
          const mine = results?.mine === i;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!open || busy}
                onClick={() => void vote(i)}
                aria-pressed={mine}
                className={cn(
                  "relative flex w-full items-center gap-2 overflow-hidden border px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-default",
                  mine ? "border-cyan-glow/70 text-cyan-glow" : "border-white/10 text-slate-200 enabled:hover:border-cyan-glow/40",
                )}
              >
                {show && <span aria-hidden className={cn("absolute inset-y-0 left-0", mine ? "bg-cyan-glow/20" : "bg-white/[0.06]")} style={{ width: `${pct}%` }} />}
                <span className="relative flex-1">{label}</span>
                {mine && <Check className="relative h-3.5 w-3.5" aria-label="Mon vote" />}
                {show && <span className="relative w-10 text-right font-mono tabular-nums text-slate-400">{pct} %</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-slate-500">
        {show ? (
          <>
            <span className="font-mono tabular-nums">{formatNumber(results?.total ?? 0)}</span> vote{(results?.total ?? 0) > 1 ? "s" : ""}
          </>
        ) : (
          "Vote pour voir les résultats."
        )}
        {open && results?.mine !== null && results?.mine !== undefined && " · tu peux changer d'avis jusqu'à la clôture."}
      </p>
    </div>
  );
}
