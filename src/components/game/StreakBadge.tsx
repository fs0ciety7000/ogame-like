import { useState } from "react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, PackageOpen } from "lucide-react";
import { AmberAmount } from "@/components/ui/amber";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { HudChip } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { describeGain } from "@/game/format";
import { cycleDay, STREAK_RULES, streakReward, streakState, streakStatus, type StreakChest } from "@/game/streak";
import { claimStreak, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatCompact } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/** Ce que rapporte un jour du cycle (infobulle de la piste). */
function dayLabel(n: number): string {
  const parts = [`${STREAK_RULES.hours[n - 1]} h de production`, `${STREAK_RULES.dailyTokens} jetons`];
  if (n === 6) parts.push(`${STREAK_RULES.amberDay6} Ambre`);
  if (n === 7) parts.push("coffre surprise");
  return `Jour ${n} : ${parts.join(" + ")}`;
}

/** 5.15.6 : coffre du 7e jour, ouvert dans une fenêtre (récompenses une à une). */
function ChestDialog({ chest, onClose }: { chest: StreakChest | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const items = chest
    ? [
        { key: "amber", node: <AmberAmount value={chest.amber} className="font-mono text-sm text-slate-100" /> },
        {
          key: "tokens",
          node: (
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-slate-100">
              <TokenIcon size={16} /> {chest.tokens} jeton{chest.tokens > 1 ? "s" : ""}
            </span>
          ),
        },
        ...(Object.entries(chest.resources) as [ResourceId, number][]).map(([id, n]) => ({
          key: id,
          node: (
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-slate-100">
              <ResourceIcon id={id} className="h-4 w-4" /> +{formatCompact(n)}
            </span>
          ),
        })),
      ]
    : [];
  return (
    <Dialog open={chest !== null} onOpenChange={(o) => !o && onClose()}>
      {chest && (
        <DialogContent className="max-w-md border-t-2 border-t-gold-glow">
          <div className="flex flex-col items-center gap-3 text-center">
            <motion.span
              className="grid h-16 w-16 place-items-center border border-gold-glow/50 bg-gold-glow/10 text-gold-glow hud-cut"
              initial={reduce ? false : { scale: 0.7, rotate: 0 }}
              animate={reduce ? undefined : { scale: [0.7, 1, 1, 1.08, 1], rotate: [0, -10, 10, -6, 0] }}
              transition={{ duration: 0.7 }}
              aria-hidden
            >
              <PackageOpen className="h-8 w-8" />
            </motion.span>
            <DialogTitle className="hud-title text-lg text-white">Coffre de la série</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Sept jours d'affilée : voici ce que contenait le coffre.</DialogDescription>
            <div className="grid w-full grid-cols-2 gap-1.5">
              {items.map((it, i) => (
                <motion.div
                  key={it.key}
                  className="hud-cut-sm flex items-center justify-center border border-gold-glow/20 bg-gold-glow/[0.04] px-2 py-2"
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: reduce ? 0 : 0.5 + i * 0.15 }}
                >
                  {it.node}
                </motion.div>
              ))}
            </div>
            <Button className="mt-1" onClick={onClose}>
              Récupéré
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

/** v5.3 : pastille de l'en-tête — série de connexion quotidienne. */
export function StreakBadge() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  const [chest, setChest] = useState<StreakChest | null>(null);
  if (!player) return null;
  const status = streakStatus(player, Date.now());
  const st = streakState(player);
  const day = cycleDay(status.next);
  const reward = streakReward(player, status.next);

  const claim = async () => {
    setBusy(true);
    try {
      const out = await claimStreak();
      toast.success(`Série : jour ${out.count} !`, {
        description: `${describeGain(out.resources)}, ${out.tokens} jetons${out.amber ? ` et ${out.amber} Ambre` : ""}.${out.chest ? " Et le coffre de la série !" : ""}`,
      });
      if (out.chest) setChest(out.chest);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const track = (
    <div className="mt-1.5 flex gap-1">
      {STREAK_RULES.hours.map((_, i) => {
        const n = i + 1;
        const done = status.claimed ? n <= cycleDay(status.current) : n < day;
        const next = !status.claimed && n === day;
        return (
          <span
            key={n}
            title={dayLabel(n)}
            className={cn("grid h-5 w-5 place-items-center border font-mono text-[9px]", done ? "border-ember-glow/60 bg-ember-glow/25 text-white" : next ? "border-gold-glow bg-gold-glow/20 text-gold-glow" : "border-white/15 text-slate-500")}
          >
            {n === 7 ? <PackageOpen className="h-3 w-3" /> : n}
          </span>
        );
      })}
    </div>
  );

  const c = STREAK_RULES.chest;
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          {status.claimed ? (
            <HudChip tone="neutral">
              <Flame /> Série {status.current} j
            </HudChip>
          ) : (
            <HudChip asChild tone="gold" alert>
              <button type="button" disabled={busy} onClick={() => void claim()}>
                <Flame /> Série j{status.next} · {reward.chest ? "ouvrir le coffre" : "réclamer"}
              </button>
            </HudChip>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <TooltipCard
            title="Série de connexion"
            icon={<Flame className="h-3 w-3" />}
            rows={
              status.claimed
                ? [{ label: "Aujourd'hui", value: "reçu", tone: "mint" }, { label: "Demain", value: `jour ${cycleDay(status.next)}` }]
                : [
                    { label: `Jour ${day}`, value: describeGain(reward.resources) },
                    { label: "Jetons du casino", value: `+${reward.tokens}`, tone: "gold" },
                    ...(reward.amber ? [{ label: "Ambre", value: `+${reward.amber}`, tone: "gold" as const }] : []),
                    ...(reward.chest ? [{ label: "Coffre", value: "à ouvrir !", tone: "gold" as const }] : []),
                  ]
            }
            sections={[
              {
                title: "Coffre du 7e jour (au hasard)",
                rows: [
                  { label: "Ambre", value: `${c.amber[0]} à ${c.amber[1]}` },
                  { label: "Jetons", value: `${c.tokens[0]} à ${c.tokens[1]}` },
                  { label: "Chaque commune", value: `${formatCompact(c.common[0])} à ${formatCompact(c.common[1])}` },
                ],
              },
            ]}
            note={`Un jour manqué remet la série à 1. Meilleure série : ${Math.max(st.best, status.current)} j.${status.current === 0 && st.count > 0 && !status.claimed ? " Ta série précédente s'est arrêtée." : ""}`}
          />
          {track}
        </TooltipContent>
      </Tooltip>
      <ChestDialog chest={chest} onClose={() => setChest(null)} />
    </>
  );
}
