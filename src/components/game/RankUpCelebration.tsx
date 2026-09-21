import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useCelebrationStore } from "@/store/celebrationStore";

const PARTICLE_COUNT = 28;
const DURATION_S = 1.6;
const COLORS = ["var(--color-cyan-glow)", "var(--color-mint-glow)", "var(--color-gold-glow)", "var(--color-ember-glow)"];

function useParticles(seed: number) {
  return useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4;
        const distance = 140 + Math.random() * 180;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 4 + Math.random() * 5,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.15,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- un nouveau tirage à chaque déclenchement (playId), pas à chaque render
    [seed],
  );
}

/** Célébration plein écran (confettis radiaux + nom du rang) déclenchée via
 *  triggerRankCelebration() — bien plus marquant qu'un simple toast pour
 *  une montée de rang. Montée une seule fois dans AppShell, pilotée par un
 *  minuteur comme <WarpOverlay/>. */
export function RankUpCelebration() {
  const playId = useCelebrationStore((s) => s.playId);
  const rankLabel = useCelebrationStore((s) => s.rankLabel);
  const rankIcon = useCelebrationStore((s) => s.rankIcon);
  const [visible, setVisible] = useState(false);
  const particles = useParticles(playId);

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
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle, rgba(5,7,15,0.55) 0%, transparent 65%)" }} />

          <div className="relative flex items-center justify-center">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 8px ${p.color}` }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                animate={{ x: p.x, y: p.y, opacity: [1, 1, 0], scale: 1 }}
                transition={{ duration: DURATION_S, delay: p.delay, ease: "easeOut" }}
              />
            ))}

            <motion.div
              className="relative flex flex-col items-center gap-2 text-center"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {rankIcon && <img src={rankIcon} alt="" className="h-16 w-16 object-contain drop-shadow-[0_0_16px_var(--color-gold-glow)]" />}
              <p className="hud-eyebrow text-slate-400">Nouveau rang</p>
              <p className="font-display glow-text text-3xl text-white">{rankLabel}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
