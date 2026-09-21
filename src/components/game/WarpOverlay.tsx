import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useWarpEffectStore } from "@/store/warpEffectStore";

const LINE_COUNT = 16;
const LINE_ANGLES = Array.from({ length: LINE_COUNT }, (_, i) => (360 / LINE_COUNT) * i);
const DURATION_S = 0.75;

/** Effet plein écran de "saut" façon vaisseau spatial (traits qui jaillissent
 *  du centre), déclenché via triggerWarpEffect() — ex: lancement de mission.
 *  Monté une seule fois dans AppShell, pilote son propre montage/démontage
 *  via un minuteur pour ne pas dépendre d'un état externe à réinitialiser. */
export function WarpOverlay() {
  const playId = useWarpEffectStore((s) => s.playId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (playId === 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), DURATION_S * 1000);
    return () => clearTimeout(timer);
  }, [playId]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={playId}
          className="pointer-events-none fixed inset-0 z-[200] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle, rgba(75,232,255,0.35) 0%, transparent 60%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: DURATION_S, ease: "easeOut" }}
          />
          {LINE_ANGLES.map((angle) => (
            <motion.div
              key={angle}
              className="absolute left-1/2 top-1/2 w-[2px] origin-top"
              style={{
                background: "linear-gradient(to bottom, transparent, var(--color-cyan-glow), transparent)",
                rotate: `${angle}deg`,
              }}
              initial={{ height: "0vmax", opacity: 0 }}
              animate={{ height: ["0vmax", "70vmax", "0vmax"], opacity: [0, 1, 0] }}
              transition={{ duration: DURATION_S, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
