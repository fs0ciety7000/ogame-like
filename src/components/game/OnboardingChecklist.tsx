import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Circle, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudChip, HudMeter } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { onboardingEligible, onboardingProgress, onboardingState } from "@/game/onboarding";
import { chapterOf, STORY_CHAPTERS } from "@/game/story";
import { claimOnboarding, GameActionError, hideOnboarding } from "@/services/playerService";
import { cn, formatCompact } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/** Prise en main (v2.9) : dix objectifs récompensés, sur l'accueil.
 *  6.14.63 (AD-8, Q96) : la réduire ne la fait plus disparaître : une ligne « Prise en main 3 / 10 » reste (rien ne se
 *  perd d'un toucher). L'état réduit est le drapeau `hidden` du compte (même réglage qu'avant, réversible ici et dans Réglages). */
export function OnboardingChecklist({ player }: { player: PlayerState }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  // 6.14.63 (AD-8) : la liste des dix objectifs se déplie à la demande (l'objectif courant reste en tête).
  const [listOpen, setListOpen] = useState(false);
  if (!onboardingEligible(player)) return null;

  const steps = onboardingProgress(player);
  const claimedCount = steps.filter((s) => s.claimed).length;
  const reduced = onboardingState(player).hidden === true;
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

  const setReduced = async (on: boolean) => {
    setToggling(true);
    try {
      await hideOnboarding(on);
    } catch {
      toast.error("Impossible de changer l'affichage de la Prise en main.");
    } finally {
      setToggling(false);
    }
  };

  if (reduced) {
    const ready = steps.filter((s) => s.done && !s.claimed).length;
    return (
      <button
        type="button"
        disabled={toggling}
        onClick={() => void setReduced(false)}
        aria-label={`Déplier la Prise en main : ${claimedCount} objectifs sur ${steps.length}`}
        className="glass-panel hud-cut-sm flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:border-cyan-glow/40"
      >
        <span className="hud-eyebrow shrink-0 text-[10px] text-slate-400">Prise en main</span>
        <HudMeter percent={(claimedCount / steps.length) * 100} className="min-w-12 flex-1" />
        <span className="shrink-0 font-mono text-xs tabular-nums text-slate-300">
          {claimedCount} / {steps.length}
        </span>
        {ready > 0 && (
          <HudChip size="sm" tone="gold" className="shrink-0">
            <Gift className="h-3 w-3" aria-hidden /> <span className="tabular-nums">{ready}</span>
          </HudChip>
        )}
        <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    );
  }

  const otherReady = steps.filter((s) => s.done && !s.claimed && s.step.id !== next?.step.id).length;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
          <button
            type="button"
            disabled={toggling}
            onClick={() => void setReduced(true)}
            title="Réduire"
            aria-label="Réduire la Prise en main"
            className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-slate-400 transition hover:text-slate-100"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div>
            <p className="hud-eyebrow pr-7 text-[10px] text-slate-500">{chapter ? `Prise en main · Chapitre ${chapter.id} / ${STORY_CHAPTERS.length}` : "Prise en main"}</p>
            <h2 className="hud-title pr-7 text-lg">{chapter ? chapter.title : "Premiers pas du commandant"}</h2>
            <div className="mt-2 flex items-center gap-3">
              <HudMeter percent={(claimedCount / steps.length) * 100} className="flex-1" />
              <span className="font-mono text-xs text-slate-400">
                {claimedCount} / {steps.length}
              </span>
            </div>
          </div>

          {next && (
            <div className="hud-cut-sm border border-cyan-glow/25 bg-cyan-glow/[0.05] p-4">
              <p className="font-display text-base text-slate-100">{next.step.label}</p>
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

          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
            aria-controls="onboarding-steps"
            className="-my-1 flex min-h-9 items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 hover:text-cyan-glow"
          >
            <ChevronDown aria-hidden className={cn("h-3.5 w-3.5 transition-transform", !listOpen && "-rotate-90")} />
            Tous les objectifs
            {otherReady > 0 && (
              <HudChip size="sm" tone="gold">
                <span className="tabular-nums">{otherReady}</span> à réclamer
              </HudChip>
            )}
          </button>
          {listOpen && (
            <ul id="onboarding-steps" className="grid gap-1 sm:grid-cols-2">
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
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
