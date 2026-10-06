import { useState } from "react";
import { toast } from "sonner";
import { Check, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudPanel } from "@/components/ui/panel";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { DAILY_RULES, dailyMissions } from "@/game/dailyMissions";
import { claimDailyMissionAction, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

/* 5.15.12 : trois missions du jour (les mêmes pour tous), un jeton chacune,
   un bonus pour les trois. Renouvelées à minuit (heure de Paris). */

export function DailyMissionsCard({ now }: { now: number }) {
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState<number | null>(null);
  if (!player) return null;
  const { tasks, allClaimed } = dailyMissions(player, now);
  // 6.2 (lot N) : fusionnées dans les objectifs du jour.
  if (tasks.length === 0) return null;
  const claim = async (i: number) => {
    setBusy(i);
    try {
      const out = await claimDailyMissionAction(i);
      toast.success(out.bonus ? "Les trois missions du jour !" : "Mission du jour accomplie", { description: `+${out.tokens} jeton${out.tokens > 1 ? "s" : ""}${out.bonus ? " (bonus compris)" : ""}.` });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Impossible pour l'instant.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <HudPanel
      icon={<ListChecks />}
      title="Missions du jour"
      tone="gold"
      accent={tasks.some((t) => t.done && !t.claimed)}
      aside={
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
          <TokenIcon size={12} /> {DAILY_RULES.tokensPerTask} chacune, +{DAILY_RULES.allBonusTokens} les trois
        </span>
      }
    >
      <ul className="flex flex-col gap-1.5">
        {tasks.map((t, i) => (
          <li key={t.key} className={cn("flex items-center gap-2 border px-2.5 py-1.5", t.claimed ? "border-mint-glow/25 opacity-70" : t.done ? "border-gold-glow/50" : "border-white/10")}>
            <span className={cn("grid h-5 w-5 shrink-0 place-items-center border", t.claimed ? "border-mint-glow/60 text-mint-glow" : "border-white/15 text-transparent")}>
              <Check className="h-3 w-3" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{t.label}</span>
            <span className="font-mono text-xs tabular-nums text-slate-400">
              {t.progress}/{t.count}
            </span>
            {t.done && !t.claimed && (
              <Button size="sm" disabled={busy !== null} onClick={() => void claim(i)}>
                Réclamer
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500">{allClaimed ? "Tout est fait pour aujourd'hui. Nouvelles missions à minuit." : "Les mêmes pour tout le monde, renouvelées à minuit (heure de Paris)."}</p>
    </HudPanel>
  );
}
