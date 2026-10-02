import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Circle, Gift, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudMeter } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { onboardingEligible, onboardingProgress, onboardingState } from "@/game/onboarding";
import { chapterOf, STORY_CHAPTERS } from "@/game/story";
import { claimOnboarding, GameActionError, hideOnboarding } from "@/services/playerService";
import { cn, formatCompact } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/** Prise en main (v2.9) : dix objectifs récompensés, sur l'accueil. */
export function OnboardingChecklist({ player }: { player: PlayerState }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!onboardingEligible(player) || onboardingState(player).hidden) return null;

  const steps = onboardingProgress(player);
  const claimedCount = steps.filter((s) => s.claimed).length;
  // Objectif courant : le premier non réclamé ; les suivants restent visibles en résumé.
  const next = steps.find((s) => !s.claimed);
  // v4.1 : chapitre en cours du tutoriel scénarisé.
  const chapter = chapterOf(steps.filter((s) => s.claimed).map((s) => s.step.id));

  const claim = async (id: string) => {
    setBusy(id);
    try {
      await claimOnboarding(id);
      toast.success("Récompense reçue !");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Impossible de réclamer la récompense.");
    } finally {
      setBusy(null);
    }
  };

  const hide = async () => {
    try {
      await hideOnboarding(true);
      toast("Objectifs masqués : tu peux les réafficher dans les Réglages.");
    } catch {
      /* non bloquant */
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
          <button onClick={() => void hide()} title="Masquer" className="absolute right-3 top-3 p-1 text-slate-500 transition hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
          <div>
            <p className="hud-eyebrow text-[10px] text-slate-500">{chapter ? `Prise en main · Chapitre ${chapter.id} / ${STORY_CHAPTERS.length}` : "Prise en main"}</p>
            <h2 className="hud-title text-lg">{chapter ? chapter.title : "Premiers pas du commandant"}</h2>
            <div className="mt-2 flex items-center gap-3">
              <HudMeter percent={(claimedCount / steps.length) * 100} className="flex-1" />
              <span className="font-mono text-xs text-slate-400">
                {claimedCount} / {steps.length}
              </span>
            </div>
          </div>

          {next && (
            <div className="hud-cut-sm border border-cyan-glow/25 bg-cyan-glow/[0.05] p-4">
              <p className="font-display text-base text-white">{next.step.label}</p>
              <p className="mt-1 text-sm text-slate-400">{next.step.hint}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-300">
                  <Gift className="h-3.5 w-3.5 text-gold-glow" />
                  {Object.entries(next.step.reward).map(([res, n]) => (
                    <span key={res} className="flex items-center gap-1">
                      <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n ?? 0)}
                    </span>
                  ))}
                  {next.step.title && <span className="text-gold-glow">+ titre « {next.step.title} »</span>}
                </span>
                <span className="ml-auto flex gap-2">
                  {next.done ? (
                    <Button size="sm" disabled={busy !== null} onClick={() => void claim(next.step.id)}>
                      Réclamer
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={next.step.to}>J'y vais</Link>
                    </Button>
                  )}
                </span>
              </div>
            </div>
          )}

          <ul className="grid gap-1 sm:grid-cols-2">
            {steps.map(({ step, done, claimed }) => (
              <li key={step.id} className="flex items-center gap-2 text-xs">
                {claimed ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-mint-glow" /> : <Circle className={cn("h-3.5 w-3.5 shrink-0", done ? "text-gold-glow" : "text-slate-600")} />}
                <Link to={step.to} className={cn("truncate hover:text-cyan-glow", claimed ? "text-slate-500 line-through" : "text-slate-300")}>
                  {step.label}
                </Link>
                {done && !claimed && step.id !== next?.step.id && (
                  <button type="button" disabled={busy !== null} onClick={() => void claim(step.id)} className="ml-auto shrink-0 font-mono text-[10px] uppercase text-gold-glow hover:underline">
                    Réclamer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
