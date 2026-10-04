import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* v4.8 : intro d'un rapport de combat. Les deux blasons foncent l'un vers
   l'autre, se percutent (flash), puis le verdict s'inscrit. ~1,5 s, un clic
   la passe. */

export const COMBAT_INTRO_MS = 1500;

export function CombatIntro({
  show,
  left,
  right,
  verdict,
  tone,
  onDone,
}: {
  show: boolean;
  left: string;
  right: string;
  verdict: string;
  tone: "win" | "loss" | "draw";
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, reduce ? 400 : COMBAT_INTRO_MS);
    return () => clearTimeout(t);
  }, [show, onDone, reduce]);
  const color = tone === "win" ? "text-mint-glow" : tone === "loss" ? "text-danger-glow" : "text-gold-glow";
  const glow = tone === "win" ? "var(--color-mint-glow)" : tone === "loss" ? "var(--color-danger-glow)" : "var(--color-gold-glow)";

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label="Passer l'intro"
          onClick={onDone}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden rounded-[inherit] bg-space-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <div className="relative flex h-28 w-full items-center justify-center">
            <motion.img
              src={assetUrl(left)}
              alt=""
              className="absolute h-24 w-24 object-contain drop-shadow-[0_0_18px_var(--color-cyan-glow)]"
              initial={{ x: "-45vw", rotate: -20, opacity: 0 }}
              animate={{ x: [null, -58, -64], rotate: [null, 0, -8], opacity: 1 }}
              transition={{ duration: 0.55, times: [0, 0.8, 1], ease: "easeIn" }}
            />
            <motion.img
              src={assetUrl(right)}
              alt=""
              className="absolute h-24 w-24 object-contain drop-shadow-[0_0_18px_var(--color-danger-glow)]"
              initial={{ x: "45vw", rotate: 20, opacity: 0 }}
              animate={{ x: [null, 58, 64], rotate: [null, 0, 8], opacity: 1 }}
              transition={{ duration: 0.55, times: [0, 0.8, 1], ease: "easeIn" }}
            />
            <motion.span
              className="absolute h-40 w-40 rounded-full"
              style={{ background: `radial-gradient(circle, white 0%, ${glow} 35%, transparent 70%)` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.8, 2.4], opacity: [0, 1, 0] }}
              transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <motion.p
            className={cn("mt-4 font-display text-3xl uppercase tracking-[0.2em] md:text-4xl", color)}
            initial={{ opacity: 0, scale: 1.6, letterSpacing: "0.6em" }}
            animate={{ opacity: 1, scale: 1, letterSpacing: "0.2em" }}
            transition={{ delay: 0.75, duration: 0.45, ease: "easeOut" }}
          >
            {verdict}
          </motion.p>
          <span className="absolute bottom-3 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600">Toucher pour passer</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
