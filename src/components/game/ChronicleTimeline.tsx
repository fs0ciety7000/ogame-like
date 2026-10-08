import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudChip } from "@/components/ui/hud";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { AmberAmount } from "@/components/ui/amber";
import { episodeUnlockMs, objectiveLabel, type ChronicleBonus, type ChronicleMonth, type ChronicleObjective } from "@/game/chronicles";
import { describePassReward, PASS_POINTS } from "@/game/seasonPass";
import { cn, formatDateTime } from "@/lib/utils";

/* 5.15.11 : les quatre épisodes du mois en frise (1, 8, 15 et 22), avec ce que
   rapporte chacun : points de passe, bonus (jetons, Ambre) et récompense propre.
   Sert à la page Chroniques et à l'aperçu de l'administration (sans joueur). */

const fmtDay = (ms: number) => formatDateTime(ms, "dayShort", "server");

export interface EpisodeView {
  progress: number;
  done: boolean;
}

export function ChronicleTimeline({
  month,
  bonus,
  now,
  open,
  episodes,
  busy,
  onClaim,
  onReplay,
  goTo,
}: {
  month: ChronicleMonth;
  bonus: ChronicleBonus;
  now: number;
  /** Épisodes ouverts (1 à 4). */
  open: number;
  /** État du joueur par épisode ; absent = aperçu. */
  episodes?: EpisodeView[];
  busy?: number | null;
  onClaim?: (i: number) => void;
  onReplay?: (i: number) => void;
  /** 6.14.76 (DP-L3) : lien vers la page où l'on agit (une page pas encore au menu s'ouvre au clic). */
  goTo?: (objective: ChronicleObjective) => ReactNode;
}) {
  const reduce = useReducedMotion();
  const accent = month.theme.accent;
  const doneCount = episodes?.filter((e) => e.done).length ?? 0;
  return (
    <div className="flex flex-col gap-3">
      {/* Rail : un jalon par épisode, rempli jusqu'au dernier épisode terminé. */}
      <div className="relative mx-2 hidden h-10 sm:block" aria-hidden>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <motion.span
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2"
          style={{ background: accent }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${(Math.max(doneCount, 0) / 3) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {month.episodes.map((_, i) => {
          const done = episodes?.[i]?.done;
          const locked = i >= open;
          return (
            <span key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / 3) * 100}%` }}>
              <span
                className={cn("grid h-6 w-6 rotate-45 place-items-center border", locked ? "border-white/15 bg-space-950" : done ? "border-transparent" : "bg-space-950")}
                style={done ? { background: accent } : locked ? undefined : { borderColor: accent }}
              >
                <span className="-rotate-45 font-mono text-[11px] font-bold text-slate-100">{done ? <Check className="h-3 w-3 text-space-950" /> : i + 1}</span>
              </span>
            </span>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {month.episodes.map((e, i) => {
          const locked = i >= open;
          const view = episodes?.[i];
          const done = !!view?.done;
          const progress = view?.progress ?? 0;
          const ready = !!view && !locked && !done && progress >= e.objective.count;
          const unlock = episodeUnlockMs(month.id, i);
          return (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.07 }}
              className={cn("hud-cut-sm flex flex-col gap-2 border bg-white/[0.02] p-3", done ? "border-mint-glow/30" : ready ? "border-gold-glow/60" : "border-white/10", locked && "opacity-60")}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Épisode {i + 1} · {fmtDay(unlock)}
                </span>
                {done && <Check className="h-3.5 w-3.5 text-mint-glow" />}
                {locked && <Lock className="h-3.5 w-3.5 text-slate-500" />}
                {!locked && onReplay && (
                  <button type="button" title="Revoir la scène" aria-label={`Revoir la scène de l'épisode ${i + 1}`} className="ml-auto text-slate-500 hover:text-slate-100" onClick={() => onReplay(i)}>
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="font-display text-sm text-slate-100">{e.title}</p>
              {/* 6.14.122 (AP-L8) : épisode « nouveauté » (contenu ajouté récemment). */}
              {month.auto?.novelty?.episode === i + 1 && (
                <div className="flex">
                  <HudChip size="sm" tone="violet" className="normal-case tracking-normal" title={`Ajouté le ${month.auto.novelty.addedOn}`}>
                    <Sparkles aria-hidden /> Nouveauté
                  </HudChip>
                </div>
              )}
              <p className="text-xs text-slate-400">
                {objectiveLabel(e.objective.type)} :{" "}
                <span className="font-mono tabular-nums text-slate-200">
                  {view ? `${Math.min(progress, e.objective.count)} / ` : ""}
                  {e.objective.count}
                </span>
              </p>
              {view && !locked && (
                <div className="h-1.5 bg-white/5">
                  <div className="h-full transition-[width] duration-500" style={{ width: `${Math.min(100, (progress / e.objective.count) * 100)}%`, background: accent }} />
                </div>
              )}
              {goTo && view && !locked && !done && !ready && <div className="flex">{goTo(e.objective.type)}</div>}
              <div className="flex flex-wrap gap-1">
                <HudChip size="sm" tone="accent" className="normal-case tracking-normal">
                  +{PASS_POINTS.chronicle} pts
                </HudChip>
                {bonus.episode.tokens > 0 && (
                  <HudChip size="sm" tone="gold" className="normal-case tracking-normal">
                    <TokenIcon size={12} /> +{bonus.episode.tokens}
                  </HudChip>
                )}
                {bonus.episode.amber > 0 && (
                  <HudChip size="sm" tone="gold" className="normal-case tracking-normal">
                    <AmberAmount value={bonus.episode.amber} />
                  </HudChip>
                )}
                {(e.reward ?? []).map((r, k) => (
                  <HudChip key={k} size="sm" tone="mint" className="normal-case tracking-normal">
                    {describePassReward(r, month.id)}
                  </HudChip>
                ))}
              </div>
              {locked ? (
                <p className="text-[11px] text-slate-500">S'ouvre le {fmtDay(unlock)}.</p>
              ) : (
                view &&
                !done &&
                onClaim && (
                  <Button size="sm" disabled={!ready || (busy ?? null) !== null} onClick={() => onClaim(i)} className="mt-auto self-start">
                    {ready ? "Terminer l'épisode" : "En cours"}
                  </Button>
                )
              )}
            </motion.div>
          );
        })}
      </div>
      {now < episodeUnlockMs(month.id, 0) && <p className="text-[11px] text-slate-500">Ce chapitre commence le {fmtDay(episodeUnlockMs(month.id, 0))}.</p>}
    </div>
  );
}
