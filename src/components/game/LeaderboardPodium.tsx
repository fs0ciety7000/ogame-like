import { AscensionStars } from "@/components/game/AscensionCard";
import { motion, useReducedMotion } from "framer-motion";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { getRankIcon, getRankLabel, getRankProgress } from "@/game/ranks";
import { OnlineDot } from "@/components/ui/online-dot";
import { PlayerName } from "@/components/ui/player-name";
import { cn, formatNumber } from "@/lib/utils";

/* v5.9 : podium du classement et insigne de rang mis en avant. */

export interface PodiumEntry {
  uid: string;
  pseudo: string;
  avatar?: string;
  xp: number;
  /** Ascensions (prestige des bâtiments, 5 au plus). */
  ascensions?: number;
}

const PLACES = [
  { ring: "border-2 border-gold-glow/80", text: "text-gold-glow", glow: "var(--color-gold-glow)", label: "1er", height: "pb-4 pt-5 sm:pb-8 sm:pt-6" },
  { ring: "border-2 border-slate-300/70", text: "text-slate-200", glow: "var(--color-slate-300)", label: "2e", height: "py-3 sm:py-4" },
  { ring: "border-2 border-[var(--th-medal-bronze)]/70", text: "text-[var(--th-medal-bronze)]", glow: "var(--th-medal-bronze)", label: "3e", height: "py-3 sm:py-4" },
] as const;


export function LeaderboardPodium({ top, onOpen, suffix = "" }: { top: PodiumEntry[]; onOpen: (p: PodiumEntry) => void; suffix?: string }) {
  const reduced = useReducedMotion() ?? false;
  const slots = [top[1], top[0], top[2]];
  const placeOf = [1, 0, 2];

  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {slots.map((p, i) => {
        if (!p) return <div key={`empty-${i}`} />;
        const place = placeOf[i];
        const s = PLACES[place];
        return (
          <motion.button
            key={p.uid}
            type="button"
            onClick={() => onOpen(p)}
            initial={reduced ? false : { opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 18, delay: reduced ? 0 : [0.15, 0, 0.3][place] }}
            whileHover={reduced ? undefined : { y: -4 }}
            className="group relative min-w-0 text-center"
          >
            <div
              className={cn(
                "relative flex flex-col items-center gap-1.5 overflow-hidden border bg-gradient-to-b from-white/[0.06] to-white/[0.01] px-2 [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)] sm:gap-2 sm:px-4",
                s.height,
                place === 0 ? "border-gold-glow/50" : "border-white/10",
              )}
            >
              {/* Halo de la place, plus intense pour le premier. */}
              <div
                aria-hidden
                className={cn("pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl", place === 0 ? "opacity-40" : "opacity-20")}
                style={{ background: s.glow }}
              />
              {place === 0 && !reduced && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ left: "-40%" }}
                  animate={{ left: "140%" }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
                />
              )}
              <span className={cn("hud-title absolute right-2 top-1.5 text-xs sm:right-3 sm:top-2 sm:text-sm", s.text)}>{s.label}</span>

              <div className="relative shrink-0">
                <PlayerAvatar uid={p.uid} pseudo={p.pseudo} file={p.avatar} className={cn(place === 0 ? "h-14 w-14 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16", s.ring)} />
                <OnlineDot uid={p.uid} size="md" className="absolute -right-1 -top-1" />
              </div>

              <div className="relative w-full min-w-0">
                <p className="hud-title truncate text-sm normal-case tracking-[0.03em] text-slate-100 group-hover:text-cyan-glow sm:text-lg">
                  <PlayerName uid={p.uid} pseudo={p.pseudo} presence={false} />
                </p>
                <AscensionStars count={p.ascensions} className="mt-0.5 justify-center" />
                <div className="mt-1 flex flex-col items-center gap-1 sm:mt-2">
                  <motion.img
                    src={getRankIcon(p.xp)}
                    alt=""
                    className={place === 0 ? "h-12 w-12 object-contain sm:h-20 sm:w-20" : "h-10 w-10 object-contain sm:h-16 sm:w-16"}
                    style={{ filter: `drop-shadow(0 0 10px ${s.glow})` }}
                    animate={reduced || place !== 0 ? undefined : { y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="min-w-0">
                    <p className={cn("truncate font-mono text-[9px] uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]", s.text)}>{getRankLabel(p.xp)}</p>
                    <p className="tabular-mono truncate text-xs text-slate-200 sm:text-sm">
                      <AnimatedNumber value={p.xp} countUp={!reduced} format={(v) => formatNumber(Math.floor(v))} /> XP{suffix}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Insigne de rang lisible : image, nom, XP et progression vers le rang suivant. */
export function RankChip({ xp, suffix = "", showProgress = true, className }: { xp: number; suffix?: string; showProgress?: boolean; className?: string }) {
  const progress = getRankProgress(xp);
  return (
    <div className={cn("flex items-center gap-2.5", className)} title={progress.next ? `${progress.percent} % vers ${progress.next}` : progress.current}>
      <img src={getRankIcon(xp)} alt="" className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-cyan-glow)_45%,transparent)] max-sm:h-9 max-sm:w-9" />
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-glow">{progress.current}</p>
        <p className="tabular-mono text-sm leading-tight text-slate-100">
          {formatNumber(xp)} <span className="text-[11px] text-slate-500">XP{suffix}</span>
        </p>
        {showProgress && (
          <div className="mt-1 h-1 w-24 overflow-hidden bg-white/10 max-sm:w-20">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-glow/60 to-cyan-glow"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
