import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion() ?? false;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="relative"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* v3.8 : balayage lumineux à l'arrivée sur une page (une seule fois). */}
        {!reduced && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-cyan-glow to-transparent shadow-[0_0_12px_var(--color-cyan-glow)]"
            initial={{ y: 0, opacity: 0.9 }}
            animate={{ y: 420, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeIn" }}
          />
        )}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
