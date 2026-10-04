import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Skull, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlayerName } from "@/components/ui/player-name";
import { bossPhase, type BossPhase, type LeviathanState } from "@/game/leviathan";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* =====================================================
   v5.10 : mise en scène commune des boss (Léviathan, boss de saison) :
   la page change selon l'état du combat — en cours, abattu, retiré ou
   en sommeil.
===================================================== */

export { bossPhase, type BossPhase };

/** « 12 j 4 h », « 5 h 20 min », « 3 min » */
export function bossCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} j ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${Math.max(1, m)} min`;
}

const PHASE_STYLE: Record<BossPhase, { label: string; color: string; stamp?: string }> = {
  dormant: { label: "En sommeil", color: "#94a3b8" },
  active: { label: "Menace en cours", color: "#ff5c7a" },
  killed: { label: "Abattu", color: "#5cf2b0", stamp: "Abattu" },
  failed: { label: "Retiré", color: "#ffb347", stamp: "Retiré" },
};

export interface BossArt {
  name: string;
  image: string;
  /** Image plus haute pour les écrans étroits. */
  portrait?: string;
  fallbackImage?: string;
  emblem: string;
  lore?: string;
  /** Couleur du liseré pendant le combat. */
  accent?: string;
}

/** Bandeau du boss, différent selon l'état du combat. */
export function BossHero({ art, phase, state, now, next }: { art: BossArt; phase: BossPhase; state: LeviathanState | null; now: number; next: number | null }) {
  const st = PHASE_STYLE[phase];
  const ended = phase === "killed" || phase === "failed";
  const hpPct = state ? Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100)) : 0;
  const border = phase === "active" && art.accent ? art.accent : st.color;
  return (
    <div className="hud-cut relative overflow-hidden border" style={{ borderColor: `${border}55` }}>
      <picture>
        {art.portrait && <source media="(max-width: 640px)" srcSet={assetUrl(art.portrait)} />}
        <img
          src={assetUrl(art.image)}
          onError={art.fallbackImage ? (e) => ((e.target as HTMLImageElement).src = assetUrl(art.fallbackImage!)) : undefined}
          alt={art.name}
          className={cn(
            "h-64 w-full object-cover object-[center_72%] transition-[filter,opacity] duration-700 sm:h-72 lg:h-80",
            phase === "killed" && "opacity-50 grayscale",
            phase === "failed" && "opacity-60 grayscale-[60%]",
            phase === "dormant" && "opacity-35 blur-[1px] grayscale-[70%]",
          )}
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/30 to-transparent" />
      {phase === "killed" && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(92,242,176,0.10),transparent_70%)]" />}

      {st.stamp && (
        <div
          className="absolute right-6 top-6 -rotate-6 border-4 px-4 py-1 font-display text-2xl font-black uppercase tracking-[0.25em] sm:right-10 sm:top-10 sm:text-4xl"
          style={{ color: st.color, borderColor: st.color, textShadow: `0 0 18px ${st.color}88`, boxShadow: `0 0 24px ${st.color}44` }}
        >
          {st.stamp}
        </div>
      )}

      <div className="absolute inset-x-4 bottom-3 flex flex-wrap items-end gap-3">
        <img src={assetUrl(art.emblem)} alt="" className={cn("h-14 w-14 object-contain drop-shadow-[0_0_14px_rgba(255,60,60,0.45)]", ended && "grayscale")} onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
        <div className="min-w-0 flex-1">
          <p className="hud-title text-lg text-white">{art.name}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: st.color }}>
            {st.label}
            {phase === "killed" && state && <> · le {new Date(state.endedAtMs || state.endMs).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</>}
            {phase === "failed" && state && <> · structure entamée à {Math.round(100 - hpPct)} %</>}
          </p>
          {phase === "killed" && state?.killedBy ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-300">
              <Skull className="h-3.5 w-3.5 text-danger-glow" /> Coup de grâce : <PlayerName uid={state.killedBy.uid} pseudo={state.killedBy.pseudo} className="font-semibold text-white" />
            </p>
          ) : (
            art.lore && (phase === "active" || phase === "dormant") && <p className="mt-0.5 hidden max-w-2xl text-xs text-slate-300 sm:block">{art.lore}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{phase === "active" ? "Repart dans" : next ? (phase === "dormant" ? "Arrive dans" : "Retour dans") : ""}</p>
          <p className="font-display text-xl tabular-nums text-white">{phase === "active" && state ? bossCountdown(state.endMs - now) : next ? bossCountdown(next - now) : "—"}</p>
        </div>
      </div>

      {phase === "active" && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-black/40">
          <i className="block h-full transition-[width] duration-700" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, var(--color-danger-glow), ${art.accent ?? "var(--color-ember-glow)"})` }} />
        </div>
      )}
    </div>
  );
}

/** Carte « prochaine apparition » (combat terminé ou en sommeil). */
export function BossNextCard({ art, next, now, phase, tip }: { art: BossArt; next: number | null; now: number; phase: BossPhase; tip?: ReactNode }) {
  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      <img src={assetUrl(art.emblem)} alt="" className="h-10 w-10 object-contain opacity-80" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-white">{phase === "dormant" ? `${art.name} n'est pas encore là` : `${art.name} reviendra`}</p>
        <p className="text-xs text-slate-400">
          {next
            ? `Prochaine apparition : ${new Date(next).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} — dans ${bossCountdown(next - now)}.`
            : "Aucune apparition prévue pour l'instant."}{" "}
          {tip}
        </p>
      </div>
      <Link to="/game/hall-of-fame" className="inline-flex items-center gap-1.5 border border-gold-glow/40 px-3 py-1.5 text-xs text-gold-glow hover:bg-gold-glow/10">
        <Trophy className="h-3.5 w-3.5" /> Hall of fame
      </Link>
    </Card>
  );
}
