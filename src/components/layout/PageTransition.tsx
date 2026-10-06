import { useEffect, useRef, type ReactNode } from "react";
import { interference } from "@/lib/fx/uiFx";
import { resetPanelLighting } from "@/lib/fx/installUiFx";
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition, type Transition } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useThemeStore, type ThemeId } from "@/lib/theme";

/* 5.16 : chaque thème a sa façon de changer de page.
   - Tactique : glissement vertical + balayage lumineux (la transition d'origine).
   - Holo : l'hologramme se matérialise (flou → net).
   - Cockpit : changement d'instrument, glissement latéral sec.
   - Netrunner : saut de signal (petites secousses horizontales).
   - Aurora : lente montée en fondu.
   - Signal : la page se découpe de gauche à droite, sans lueur.
   - Voyageur : léger recul de caméra, fondu lumineux.
   - Omni : l'interface s'ouvre depuis le centre.
   - Spartan : la visière fait le point (flou + montée).
   - Constellation : panneau qui coulisse depuis la droite, net.
   Animations réduites : simple fondu, quel que soit le thème. */

interface ThemeMotion {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
  /** Balayage lumineux à l'arrivée. */
  sweep: boolean;
}

/* Un filtre ou un découpage laissé sur le conteneur piégerait les fenêtres
   en position fixe des pages : on les retire à la fin de l'animation. */
const CLEAR = { filter: "none", clipPath: "none" };

const BASE: ThemeMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: "easeOut" },
  sweep: true,
};

export const THEME_MOTION: Record<ThemeId, ThemeMotion> = {
  tactique: BASE,
  holo: {
    initial: { opacity: 0, scale: 0.985, filter: "blur(4px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: CLEAR },
    exit: { opacity: 0, filter: "blur(3px)" },
    transition: { duration: 0.24, ease: "easeOut" },
    sweep: true,
  },
  cockpit: {
    initial: { opacity: 0, x: -14 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 14 },
    transition: { duration: 0.16, ease: "easeOut" },
    sweep: true,
  },
  netrunner: {
    initial: { opacity: 0, x: 0 },
    animate: { opacity: [0, 1, 0.6, 1], x: [-6, 4, -2, 0] },
    exit: { opacity: 0, x: 6 },
    transition: { duration: 0.22, ease: "linear" },
    sweep: false,
  },
  aurora: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
    sweep: true,
  },
  signal: {
    initial: { opacity: 1, clipPath: "inset(0 100% 0 0)" },
    animate: { opacity: 1, clipPath: "inset(0 0% 0 0)", transitionEnd: CLEAR },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0.7, 0, 0.3, 1] },
    sweep: false,
  },
  voyageur: {
    initial: { opacity: 0, scale: 1.012 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.995 },
    transition: { duration: 0.34, ease: "easeOut" },
    sweep: false,
  },
  omni: {
    initial: { opacity: 0.4, clipPath: "inset(0 50% 0 50%)" },
    animate: { opacity: 1, clipPath: "inset(0 0% 0 0%)", transitionEnd: CLEAR },
    exit: { opacity: 0 },
    transition: { duration: 0.26, ease: "easeOut" },
    sweep: true,
  },
  spartan: {
    initial: { opacity: 0, y: 10, filter: "blur(3px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: CLEAR },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: "easeOut" },
    sweep: true,
  },
  constellation: {
    initial: { opacity: 0, x: 18 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    sweep: false,
  },
  ishimura: {
    initial: { opacity: 0, scaleY: 0.96, filter: "brightness(1.8)" },
    animate: { opacity: [0, 1, 0.7, 1], scaleY: 1, filter: "brightness(1)", transitionEnd: CLEAR },
    exit: { opacity: 0 },
    transition: { duration: 0.26, ease: "easeOut" },
    sweep: true,
  },
  atlas: {
    initial: { opacity: 0, y: 14, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] },
    sweep: true,
  },
  matrice: {
    initial: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
    animate: { opacity: 1, clipPath: "inset(0 0 0% 0)", transitionEnd: CLEAR },
    exit: { opacity: 0 },
    transition: { duration: 0.28, ease: "linear" },
    sweep: false,
  },
};

const REDUCED: ThemeMotion = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 }, sweep: false };

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion() ?? false;
  const theme = useThemeStore((s) => s.theme);
  const m = reduced ? REDUCED : (THEME_MOTION[theme] ?? BASE);
  // 5.25 : interférence de signal et panneaux qui se rallument à chaque changement de page.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void interference();
    resetPanelLighting();
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} className="relative" initial={m.initial} animate={m.animate} exit={m.exit} transition={m.transition}>
        {/* v3.8 : balayage lumineux à l'arrivée sur une page (une seule fois). */}
        {m.sweep && (
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
