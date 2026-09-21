import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  angle: number;
  distance: number;
  size: number;
  delay: number;
  duration: number;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    angle: Math.random() * 360,
    distance: 50 + Math.random() * 90,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 0.15,
    duration: 0.7 + Math.random() * 0.4,
  }));
}

/** Petite gerbe de particules superposée au contenu (le parent doit être
 *  `relative`) — utilisée pour célébrer une victoire de combat. */
export function ParticleBurst({ count = 28, colorVar = "var(--color-mint-glow)" }: { count?: number; colorVar?: string }) {
  const particles = useMemo(() => makeParticles(count), [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.distance;
        const y = Math.sin(rad) * p.distance;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{ width: p.size, height: p.size, background: colorVar, boxShadow: `0 0 6px 1px ${colorVar}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.4 }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
