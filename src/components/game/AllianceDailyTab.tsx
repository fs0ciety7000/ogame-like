import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Target, Vote, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ALLIANCE_DAILY_RULES, DAILY_LABEL, dailyPhase, readDaily } from "@/game/allianceDaily";
import { parisDay } from "@/game/retention";
import { voteAllianceDaily } from "@/services/allianceService";
import { GameActionError } from "@/services/playerService";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
import type { Alliance } from "@/types/game";

/* v4.9 : objectif du jour de l'alliance (propositions, vote, progression). */

export function AllianceDailyTab({ alliance, uid, canVote }: { alliance: Alliance; uid: string; canVote: boolean }) {
  const [busy, setBusy] = useState(false);
  const R = ALLIANCE_DAILY_RULES;
  const now = Date.now();
  const raw = readDaily(alliance.daily);
  const daily = raw && raw.day === parisDay(now) ? raw : null;
  const phase = dailyPhase(now);
  const previous = daily?.previous ?? (raw && raw.day !== parisDay(now) ? { day: raw.day, kind: raw.chosen !== null ? raw.proposals[raw.chosen].kind : null, status: raw.status === "done" ? "done" : "failed" } : undefined);

  const vote = async (i: number) => {
    setBusy(true);
    try {
      await voteAllianceDaily(i);
      toast.success("Vote enregistré.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Vote impossible.");
    } finally {
      setBusy(false);
    }
  };

  const rules = (
    <p className="text-[11px] text-slate-500">
      Chaque jour à {R.proposeHour} h, 3 objectifs sont proposés ; le fondateur et les officiers votent jusqu'à {R.voteEndHour} h. Atteint avant minuit : +{R.passPoints} points de passe et {R.rewardHours} h de production pour chaque membre qui a contribué, et {Math.round(R.treasuryPct * 100)} % de la production de l'alliance au trésor.
    </p>
  );

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3 p-4">
        <h3 className="hud-title flex items-center gap-2 text-sm text-white">
          <Target className="h-4 w-4 text-gold-glow" /> Objectif du jour
        </h3>
        {!daily ? (
          <p className="text-sm text-slate-400">{phase === "before" ? `Les objectifs du jour arrivent à ${R.proposeHour} h.` : "Les objectifs arrivent dans quelques minutes."}</p>
        ) : daily.status === "voting" ? (
          <>
            <p className="text-xs text-slate-400">Vote en cours jusqu'à {R.voteEndHour} h.{canVote ? " Choisis l'objectif de l'alliance :" : " Le fondateur et les officiers choisissent."}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {daily.proposals.map((p, i) => {
                const votes = Object.values(daily.votes).filter((v) => v === i).length;
                const mine = daily.votes[uid] === i;
                return (
                  <div key={p.kind} className={cn("flex flex-col gap-1.5 border p-3", mine ? "border-gold-glow/60 bg-gold-glow/[0.06]" : "border-white/10 bg-white/[0.02]")}>
                    <span className="text-sm text-white">{DAILY_LABEL[p.kind]}</span>
                    <span className="font-mono text-lg text-gold-glow">{formatCompact(p.target)}</span>
                    <span className="text-[11px] text-slate-500">{votes} vote{votes > 1 ? "s" : ""}</span>
                    {canVote && (
                      <Button size="sm" variant={mine ? "warn" : "outline"} disabled={busy} onClick={() => void vote(i)}>
                        <Vote className="h-3.5 w-3.5" /> {mine ? "Ton choix" : "Voter"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : daily.chosen !== null ? (
          (() => {
            const p = daily.proposals[daily.chosen];
            const pct = Math.min(100, Math.round((daily.progress / Math.max(1, p.target)) * 100));
            const ranking = Object.entries(daily.contributions).sort((a, b) => b[1] - a[1]);
            return (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-base text-white">{DAILY_LABEL[p.kind]}</span>
                  <span className="font-mono text-sm text-slate-300">
                    {formatCompact(daily.progress)} / {formatCompact(p.target)}
                  </span>
                  {daily.status === "done" && (
                    <span className="flex items-center gap-1 text-xs text-mint-glow">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Atteint, récompenses versées
                    </span>
                  )}
                </div>
                <Progress value={pct} />
                <p className="text-[11px] text-slate-500">Mis à jour {timeAgo(daily.updatedAtMs)} (toutes les 10 min).</p>
                {ranking.length > 0 && (
                  <ul className="grid gap-1 text-xs sm:grid-cols-2">
                    {ranking.map(([m, n]) => (
                      <li key={m} className="flex justify-between border-b border-white/5 py-0.5">
                        <span className="text-slate-300">{alliance.memberPseudos[m] ?? "?"}</span>
                        <span className="font-mono text-slate-400">{formatCompact(n)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          })()
        ) : null}
        {previous && (
          <p className="flex items-center gap-1.5 border-t border-white/5 pt-2 text-xs text-slate-400">
            {previous.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5 text-mint-glow" /> : <XCircle className="h-3.5 w-3.5 text-danger-glow" />}
            Hier : {previous.kind ? DAILY_LABEL[previous.kind] : "aucun objectif"} — {previous.status === "done" ? "atteint" : "manqué"}.
          </p>
        )}
        {rules}
      </Card>
    </div>
  );
}
