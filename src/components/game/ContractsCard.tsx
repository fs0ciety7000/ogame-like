import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Flame, Gift, RefreshCw, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ParticleBurst } from "@/components/ui/particle-burst";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { CONTRACT_LABELS, CONTRACT_RULES, contractDay, contractReward, streakBonus, type Contract } from "@/game/contracts";
import { getRewardText } from "@/game/missions";
import { formatClock } from "@/lib/utils";
import { claimContract, GameActionError, rerollContract } from "@/services/playerService";
import { playUnlock } from "@/lib/sfx";
import { EmojiText } from "@/components/ui/game-icon";

/** Contrats du jour : 3 objectifs, série de jours consécutifs et coffre. */
export function ContractsCard({ compact = false }: { compact?: boolean }) {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [pending, setPending] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(0);

  if (!player) return null;
  const now = Date.now();
  const state = player.contracts;

  // Contrats pas encore générés pour aujourd'hui : le serveur le fait à la prochaine synchro.
  const fresh = !!state && state.day === contractDay(now);
  const items = fresh ? state.items : [];
  const streak = fresh ? state.streak : 0;
  const doneToday = fresh && state.lastCompletedDay === state.day;
  const secondsLeft = Math.max(0, Math.floor((Date.parse(`${contractDay(now)}T00:00:00Z`) + 86_400_000 - now) / 1000));
  const nextChestIn = CONTRACT_RULES.chestEvery - (streak % CONTRACT_RULES.chestEvery);

  const claim = async (c: Contract) => {
    setPending(c.id);
    try {
      const res = await claimContract(c.id);
      playUnlock();
      if (res.chest) {
        setCelebrate((n) => n + 1);
        toast.success("Coffre de série ouvert !", { description: getRewardText(res.chest).join(" · "), duration: 7000 });
      } else if (res.dayCompleted) {
        setCelebrate((n) => n + 1);
        toast.success("Contrats du jour terminés !", { description: "Ta série continue demain." });
      }
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  const reroll = async (c: Contract) => {
    setPending(c.id);
    try {
      await rerollContract(c.id);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="relative overflow-hidden p-4">
      <AnimatePresence>{celebrate > 0 && <ParticleBurst key={celebrate} count={40} colorVar="var(--color-gold-glow)" />}</AnimatePresence>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ScrollText className="h-4 w-4 text-gold-glow" />
        <h3 className="font-display text-sm text-white">Contrats du jour</h3>
        <span
          className={`hud-chip hud-chip-sm ${streak > 0 ? "hud-tone-gold" : "hud-tone-neutral"}`}
          title="Jours consécutifs où les 3 contrats ont été terminés"
        >
          <Flame className="h-3 w-3" /> Série {streak}
          {streak > 0 && ` · +${Math.round(streakBonus(streak) * 100)} %`}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <Gift className="h-3 w-3" /> coffre dans {nextChestIn} jour{nextChestIn > 1 ? "s" : ""}
        </span>
        <span className="ml-auto text-[11px] text-slate-500">nouveaux contrats dans {formatClock(secondsLeft)}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500">Génération des contrats du jour…</p>
      ) : (
        <div className={compact ? "grid gap-2" : "grid gap-2 md:grid-cols-3"}>
          {items.map((c) => {
            const done = c.progress >= c.target;
            return (
              <motion.div
                key={c.id}
                layout
                className={`flex flex-col gap-1.5 p-2.5 ${
                  c.claimed ? "hud-callout hud-tone-mint" : done ? "hud-callout hud-tone-gold" : "hud-cut-sm border border-white/5 bg-black/20"
                }`}
              >
                <div className="flex items-start gap-2">
                  <p className={`flex-1 text-xs ${c.claimed ? "text-slate-500 line-through" : "text-slate-200"}`}>{CONTRACT_LABELS[c.type](c.target)}</p>
                  {c.claimed && <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-glow" />}
                </div>
                <Progress value={(c.progress / c.target) * 100} />
                <p className="text-[10px] text-slate-500"><EmojiText text={getRewardText(contractReward(player, c)).join(" · ")} /></p>
                {!c.claimed && (
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-7 flex-1 text-xs" disabled={!done || pending === c.id} onClick={() => void claim(c)}>
                      {done ? "Récupérer" : `${Math.floor(c.progress).toLocaleString("fr-FR")} / ${c.target.toLocaleString("fr-FR")}`}
                    </Button>
                    {!state?.rerolled && !done && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        title="Relancer ce contrat (1 fois par jour)"
                        disabled={pending === c.id}
                        onClick={() => void reroll(c)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      {doneToday && <p className="mt-2 text-[11px] text-mint-glow">Tous les contrats du jour sont terminés. Reviens demain pour prolonger ta série !</p>}
    </Card>
  );
}
