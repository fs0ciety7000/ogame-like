import { useEffect } from "react";
import { assetUrl } from "@/lib/assets";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { buildingImage, findBuilding, type VisualTier } from "@/game/buildings";
import { TIER_NAMES, tierBonusText } from "@/game/tierUp";
import { ParticleBurst } from "@/components/ui/particle-burst";
import { dismissTierUp, useTierUpStore } from "@/store/tierUpStore";
import { playTier } from "@/lib/sfx";

/* =====================================================
   v4.4 : passage de palier d'un bâtiment, en plein écran (≈ 2,5 s).
   L'ancienne vignette se dissout sous un balayage lumineux qui révèle la
   nouvelle, puis un bandeau annonce le palier et ce qu'il apporte.
===================================================== */

export const TIER_COLORS: Record<VisualTier, string> = {
  5: "var(--th-medal-bronze)",
  10: "var(--color-slate-200)",
  15: "var(--color-gold-glow)",
  20: "var(--color-cyan-glow)",
};

const DURATION_MS = 2600;

export function TierUpOverlay() {
  const current = useTierUpStore((s) => s.queue[0]);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!current) return;
    playTier();
    const t = setTimeout(dismissTierUp, DURATION_MS + (reduced ? 0 : 400));
    return () => clearTimeout(t);
  }, [current, reduced]);

  const def = current ? findBuilding(current.buildingId) : undefined;
  const color = current ? TIER_COLORS[current.tier] : "white";
  const bonus = current ? tierBonusText(current.buildingId, current.level) : null;

  return (
    <AnimatePresence>
      {current && def && (
        <motion.div
          key={`${current.buildingId}-${current.tier}`}
          className="fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center gap-5 bg-space-950/85 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismissTierUp}
          role="status"
          aria-label={`${def.name} : palier ${TIER_NAMES[current.tier].label}`}
        >
          <div className="relative h-56 w-56 sm:h-72 sm:w-72">
            {/* Halo du nouveau palier */}
            <motion.div
              className="absolute -inset-10 rounded-full blur-3xl"
              style={{ background: color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.35, 0.2] }}
              transition={{ duration: 1.6, times: [0, 0.45, 0.7, 1] }}
            />
            <div className="hud-cut absolute inset-0 overflow-hidden border-2 bg-space-900" style={{ borderColor: color, boxShadow: `0 0 40px -8px ${color}` }}>
              {/* Ancienne vignette : se dissout */}
              <motion.img
                src={assetUrl(buildingImage(def, current.tier - 1))}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 1, filter: "blur(0px) brightness(1)" }}
                animate={reduced ? { opacity: 0 } : { opacity: [1, 1, 0], filter: ["blur(0px) brightness(1)", "blur(2px) brightness(1.6)", "blur(8px) brightness(2.4)"] }}
                transition={{ duration: 1.1, times: [0, 0.4, 1] }}
              />
              {/* Nouvelle vignette : révélée derrière le balayage */}
              <motion.img
                src={assetUrl(buildingImage(def, current.level))}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ clipPath: reduced ? "inset(0 0 0 0)" : "inset(0 100% 0 0)", opacity: reduced ? 0 : 1 }}
                animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
                transition={{ duration: reduced ? 0.4 : 0.9, delay: reduced ? 0 : 0.35, ease: "easeInOut" }}
              />
              {!reduced && (
                <motion.div
                  className="absolute inset-y-[-20%] w-1/3 -skew-x-12"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, white, ${color}, transparent)`, mixBlendMode: "screen" }}
                  initial={{ left: "-40%", opacity: 0.9 }}
                  animate={{ left: "110%", opacity: [0.9, 0.9, 0] }}
                  transition={{ duration: 0.9, delay: 0.35, ease: "easeInOut" }}
                />
              )}
            </div>
            {!reduced && (
              <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}>
                <ParticleBurst count={60} colorVar={color} />
              </motion.div>
            )}
          </div>

          <motion.div
            className="flex max-w-md flex-col items-center gap-1 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0.1 : 1.15, duration: 0.4 }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">{def.name}</span>
            <span className="hud-title text-3xl sm:text-4xl" style={{ color, textShadow: `0 0 18px ${color}` }}>
              Palier {TIER_NAMES[current.tier].roman} · {TIER_NAMES[current.tier].label}
            </span>
            <span className="font-mono text-xs text-slate-300">Niveau {current.level}</span>
            {bonus && <span className="mt-1 text-sm text-slate-200">{bonus}</span>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
