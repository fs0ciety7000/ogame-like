import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crosshair, Radio, Skull, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlayerName } from "@/components/ui/player-name";
import { bossPhaseLabel, BOSS_PHASE_RULES, bossFightPhase, bossPhase, bossWeakness, type BossFightPhase, type BossPhase, type LeviathanState } from "@/game/leviathan";
import { findUnit } from "@/game/units";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatNumber, alpha } from "@/lib/utils";

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
export function BossHero({ art, phase, state, now, next, nextLabel }: { art: BossArt; phase: BossPhase; state: LeviathanState | null; now: number; next: number | null; nextLabel?: string }) {
  const st = PHASE_STYLE[phase];
  const ended = phase === "killed" || phase === "failed";
  const hpPct = state ? Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100)) : 0;
  const border = phase === "active" && art.accent ? art.accent : st.color;
  return (
    <div className="hud-cut relative overflow-hidden border" style={{ borderColor: `${alpha(border, 33)}` }}>
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
          style={{ color: st.color, borderColor: st.color, textShadow: `0 0 18px ${alpha(st.color, 53)}`, boxShadow: `0 0 24px ${alpha(st.color, 27)}` }}
        >
          {st.stamp}
        </div>
      )}

      <div className="absolute inset-x-4 bottom-3 flex flex-wrap items-end gap-3">
        {art.emblem && <img src={assetUrl(art.emblem)} alt="" className={cn("h-14 w-14 object-contain drop-shadow-[0_0_14px_rgba(255,60,60,0.45)]", ended && "grayscale")} onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
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
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{phase === "active" ? "Repart dans" : nextLabel ?? (next ? (phase === "dormant" ? "Arrive dans" : "Retour dans") : "")}</p>
          <p className="font-display text-xl tabular-nums text-white">{phase === "active" && state ? bossCountdown(state.endMs - now) : next ? bossCountdown(next - now) : nextLabel ? "" : "—"}</p>
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
      {art.emblem && <img src={assetUrl(art.emblem)} alt="" className="h-10 w-10 object-contain opacity-80" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
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

/* ---------- v5.10.5 : boss vivants (phases, fil du combat, chute) ---------- */

/** Phases du combat : barre découpée à 50 % et 25 %, phase en cours et faiblesse révélée. */
export function BossPhasePanel({ state, accent }: { state: LeviathanState; accent?: string }) {
  const phase = bossFightPhase(state);
  const pct = state.maxHp > 0 ? (state.hp / state.maxHp) * 100 : 0;
  const weak = phase === 3 ? findUnit(bossWeakness(state)) : undefined;
  const marks = [BOSS_PHASE_RULES.ripostePct * 100, BOSS_PHASE_RULES.shieldPct * 100];
  const tone = phase === 1 ? "#4be8ff" : phase === 2 ? "#ff8a4c" : "#ff5df0";
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="flex justify-between font-mono text-xs text-slate-400">
          <span>Structure</span>
          <span>
            {formatNumber(state.hp)} / {formatNumber(state.maxHp)}
          </span>
        </div>
        <div className="relative mt-1 h-4 border border-danger-glow/40 bg-danger-glow/10">
          <i className="hud-sheen block h-full transition-[width] duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, var(--color-danger-glow), ${accent ?? tone})` }} />
          {marks.map((m) => (
            <span key={m} className="absolute inset-y-[-4px] w-0.5 bg-white/60" style={{ left: `${m}%` }} title={`Phase suivante sous ${m} %`} aria-hidden />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-[10px] uppercase tracking-[0.14em]">
        {([1, 2, 3] as BossFightPhase[]).map((p) => (
          <span key={p} className={cn("border px-2 py-1 text-center font-mono", p === phase ? "text-white" : p < phase ? "border-white/5 text-slate-600 line-through" : "border-white/10 text-slate-500")} style={p === phase ? { borderColor: `${alpha(tone, 53)}`, background: `${alpha(tone, 9)}`, color: tone } : undefined}>
            {p}. {bossPhaseLabel(state, p).name}
          </span>
        ))}
      </div>
      <p className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <span>{bossPhaseLabel(state, phase).desc}</span>
        {weak && (
          <span className="inline-flex items-center gap-1.5 border border-[#ff5df0]/50 bg-[#ff5df0]/10 px-2 py-0.5 text-[#ff5df0]">
            <img src={assetUrl(weak.image)} alt="" className="h-5 w-5 object-contain" /> Faiblesse : {weak.name}
          </span>
        )}
        {phase < 3 && <span className="text-slate-500">Sa faiblesse se révélera sous {Math.round(BOSS_PHASE_RULES.shieldPct * 100)} %.</span>}
      </p>
    </div>
  );
}

function agoLabel(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.floor(h / 24)} j`;
}

/** Fil du combat : derniers assauts (et passages de phase), le plus récent en haut. */
export function BossFeed({ state, uid, now, max = 12 }: { state: LeviathanState; uid: string; now: number; max?: number }) {
  const feed = [...(state.feed ?? [])].reverse().slice(0, max);
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h2 className="hud-title flex items-center gap-2 text-sm">
        <Radio className="h-4 w-4 text-danger-glow" /> Fil du combat
      </h2>
      {feed.length === 0 ? (
        <p className="text-xs text-slate-500">Aucun assaut pour l'instant. Le premier à frapper ouvrira le fil.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {feed.map((f) => (
              <motion.li key={`${f.t}-${f.uid ?? f.phase}`} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={cn("flex items-center gap-2 text-xs", f.uid === uid && "text-cyan-glow")}>
                {f.phase ? (
                  <span className="flex-1 border-l-2 border-[#ff5df0] pl-2 font-semibold text-[#ff5df0]">
                    Phase {f.phase} : {bossPhaseLabel(state, f.phase).name} ! {f.phase === 3 ? `Faiblesse révélée : ${findUnit(bossWeakness(state))?.name ?? "?"}.` : "Il riposte."}
                  </span>
                ) : (
                  <>
                    {f.killed ? <Skull className="h-3.5 w-3.5 shrink-0 text-mint-glow" /> : <Crosshair className="h-3.5 w-3.5 shrink-0 text-ember-glow" />}
                    <span className="min-w-0 flex-1 truncate">
                      {f.uid ? <PlayerName uid={f.uid} pseudo={f.pseudo ?? "?"} className="font-semibold" /> : f.pseudo} {f.killed ? "porte le coup de grâce" : "frappe"} :{" "}
                      <strong className="font-mono tabular-nums text-white">{formatCompact(f.damage ?? 0)}</strong>
                    </span>
                  </>
                )}
                <span className="shrink-0 font-mono text-[10px] text-slate-500">{agoLabel(now - f.t)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </Card>
  );
}

/**
 * Chute du boss en direct : si la page était ouverte pendant le combat et qu'il
 * tombe, éclair, tampon « ABATTU » qui s'abat, puis le bilan prend le relais.
 */
export function BossDeathOverlay({ phase, name, killer }: { phase: BossPhase; name: string; killer?: { uid: string; pseudo: string } }) {
  const prev = useRef<BossPhase>(phase);
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (prev.current === "active" && phase === "killed") {
      setShow(true);
      const t = setTimeout(() => setShow(false), reduce ? 1500 : 3200);
      prev.current = phase;
      return () => clearTimeout(t);
    }
    prev.current = phase;
  }, [phase, reduce]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-space-950/85 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShow(false)} role="status" aria-live="assertive">
          {!reduce && <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} />}
          <div className="relative flex flex-col items-center gap-3 text-center">
            <motion.div
              initial={reduce ? false : { scale: 3, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: -6, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.25 }}
              className="border-[6px] border-mint-glow px-8 py-2 font-display text-5xl font-black uppercase tracking-[0.3em] text-mint-glow shadow-[0_0_60px_rgba(92,242,176,0.5)] sm:text-7xl"
            >
              Abattu
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="hud-title text-lg text-white">
              {name} est tombé !
            </motion.p>
            {killer && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="flex items-center gap-1.5 text-sm text-slate-300">
                <Skull className="h-4 w-4 text-danger-glow" /> Coup de grâce : <span className="font-semibold text-white">{killer.pseudo}</span>
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
