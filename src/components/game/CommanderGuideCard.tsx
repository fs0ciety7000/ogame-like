import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BookOpenCheck, CheckCircle2, Circle, Gift, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudChip, HudMeter } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { AmberAmount } from "@/components/ui/amber";
import { GUIDE_CHAPTERS, GUIDE_TITLE, guideProgress, guideVisible } from "@/game/advancedGuide";
import { claimGuide, GameActionError, hideGuide } from "@/services/playerService";
import { cn, formatCompact } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/** v5.11 : Carnet du commandant — tutoriel avancé (colonies, reliques, Ascension). */
export function CommanderGuideCard({ player }: { player: PlayerState }) {
  const [busy, setBusy] = useState(false);
  if (!guideVisible(player)) return null;

  const steps = guideProgress(player);
  const claimedCount = steps.filter((s) => s.claimed).length;
  const next = steps.find((s) => !s.claimed);
  const chapter = GUIDE_CHAPTERS.find((c) => c.id === next?.step.chapter) ?? GUIDE_CHAPTERS[0];
  const chapterIndex = GUIDE_CHAPTERS.indexOf(chapter) + 1;

  const claim = async (id: string) => {
    setBusy(true);
    try {
      const out = await claimGuide(id);
      toast.success("Récompense reçue !", { description: out.amber ? `+${out.amber} Ambre` : undefined });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Impossible de réclamer la récompense.");
    } finally {
      setBusy(false);
    }
  };

  const hide = async () => {
    try {
      await hideGuide(true);
      toast("Carnet masqué : tu peux le rouvrir dans les Réglages.");
    } catch {
      /* non bloquant */
    }
  };

  return (
    <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
      <button type="button" onClick={() => void hide()} title="Masquer" aria-label="Masquer le carnet" className="absolute right-3 top-3 p-1 text-slate-500 transition hover:text-slate-200">
        <X className="h-4 w-4" />
      </button>
      <div>
        <p className="hud-eyebrow flex items-center gap-2 text-[10px] text-slate-500">
          <BookOpenCheck className="h-3.5 w-3.5 text-violet-glow" /> Carnet du commandant · Chapitre {chapterIndex} / {GUIDE_CHAPTERS.length}
        </p>
        <h2 className="hud-title text-lg">
          {chapter.emoji} {chapter.label}
        </h2>
        <div className="mt-2 flex items-center gap-3">
          <HudMeter percent={(claimedCount / steps.length) * 100} className="flex-1" tone="var(--color-violet-glow)" />
          <span className="font-mono text-xs text-slate-400">
            {claimedCount} / {steps.length}
          </span>
        </div>
      </div>

      {next && (
        <div className="hud-callout hud-tone-violet p-4">
          <p className="font-display text-base text-white">{next.step.label}</p>
          <p className="mt-1 text-sm text-slate-300">{next.step.learn}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-300">
              <Gift className="h-3.5 w-3.5 text-gold-glow" />
              {Object.entries(next.step.reward).map(([res, n]) => (
                <span key={res} className="flex items-center gap-1">
                  <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n ?? 0)}
                </span>
              ))}
              {next.step.amber ? <AmberAmount value={next.step.amber} /> : null}
              {claimedCount === steps.length - 1 && <span className="text-gold-glow">+ titre « {GUIDE_TITLE} »</span>}
            </span>
            <span className="ml-auto flex gap-2">
              {next.done ? (
                <Button size="sm" disabled={busy} onClick={() => void claim(next.step.id)}>
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

      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
        {GUIDE_CHAPTERS.map((c) => {
          const list = steps.filter((s) => s.step.chapter === c.id);
          const complete = list.every((s) => s.claimed);
          return (
            <div key={c.id} className="min-w-0">
              <p className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                {c.label}
                {complete && <HudChip size="sm" tone="mint">Terminé</HudChip>}
              </p>
              <ul className="grid gap-1">
                {list.map(({ step, done, claimed }) => (
                  <li key={step.id} className="flex items-center gap-2 text-xs">
                    {claimed ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-mint-glow" /> : <Circle className={cn("h-3.5 w-3.5 shrink-0", done ? "text-gold-glow" : "text-slate-600")} />}
                    <Link to={step.to} className={cn("truncate hover:text-cyan-glow", claimed ? "text-slate-500 line-through" : "text-slate-300")}>
                      {step.label}
                    </Link>
                    {done && !claimed && step.id !== next?.step.id && (
                      <button type="button" disabled={busy} onClick={() => void claim(step.id)} className="ml-auto shrink-0 font-mono text-[10px] uppercase text-gold-glow hover:underline">
                        Réclamer
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
