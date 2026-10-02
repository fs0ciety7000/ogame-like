import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ParticleBurst } from "@/components/ui/particle-burst";

/** Gerbe de particules + « Niv. X ! » quand `level` augmente pendant que
 *  l'élément est affiché (fin d'une construction, d'une recherche…).
 *  Le parent doit être `relative`. */
export function LevelUpBurst({ level, colorVar = "var(--color-gold-glow)" }: { level: number; colorVar?: string }) {
  const previous = useRef(level);
  const [burst, setBurst] = useState<{ key: number; level: number } | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (level > previous.current && !reduced) {
      setBurst({ key: Date.now(), level });
      const t = setTimeout(() => setBurst(null), 1600);
      previous.current = level;
      return () => clearTimeout(t);
    }
    previous.current = level;
  }, [level, reduced]);

  return (
    <AnimatePresence>
      {burst && (
        <motion.div key={burst.key} className="pointer-events-none absolute inset-0 z-10" exit={{ opacity: 0 }}>
          <ParticleBurst count={34} colorVar={colorVar} />
          <motion.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 whitespace-nowrap font-display text-lg text-gold-glow drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -34, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 1.4, times: [0, 0.15, 0.75, 1], ease: "easeOut" }}
          >
            Niv. {burst.level} !
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** v4.4 : pulsation lumineuse du cadre d'une carte quand `level` augmente.
 *  Le parent doit être `relative`. */
export function LevelPulse({ level, color = "var(--color-gold-glow)" }: { level: number; color?: string }) {
  const previous = useRef(level);
  const [key, setKey] = useState<number | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (level > previous.current && !reduced) {
      setKey(Date.now());
      const t = setTimeout(() => setKey(null), 1300);
      previous.current = level;
      return () => clearTimeout(t);
    }
    previous.current = level;
  }, [level, reduced]);

  return (
    <AnimatePresence>
      {key && (
        <motion.span
          key={key}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 border-2"
          style={{ borderColor: color }}
          initial={{ opacity: 0, boxShadow: `0 0 0px 0px ${color}` }}
          animate={{ opacity: [0, 1, 0.6, 0], boxShadow: [`0 0 0px 0px ${color}`, `0 0 28px 2px ${color}`, `0 0 14px 0px ${color}`, `0 0 0px 0px ${color}`] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, times: [0, 0.2, 0.6, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
