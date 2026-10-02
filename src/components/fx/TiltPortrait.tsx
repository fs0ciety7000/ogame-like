import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* v4.8 : portrait vivant. L'image suit légèrement la souris (parallaxe) et
   une lueur à la couleur de la faction se lève au survol. Rien sur écran
   tactile ni avec « réduire les animations ». */

export function TiltPortrait({ children, glow = "var(--color-cyan-glow)", className }: { children: ReactNode; glow?: string; className?: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 140, damping: 18 });
  const sy = useSpring(my, { stiffness: 140, damping: 18 });
  const x = useTransform(sx, (v) => v * -10);
  const y = useTransform(sy, (v) => v * -8);
  const rotateY = useTransform(sx, (v) => v * 5);
  const rotateX = useTransform(sy, (v) => v * -4);

  return (
    <motion.div
      className={cn("group/tilt relative overflow-hidden [perspective:800px]", className)}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div className="h-full w-full scale-[1.08]" style={reduce ? undefined : { x, y, rotateX, rotateY }}>
        {children}
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100"
        style={{ boxShadow: `inset 0 0 40px 2px ${glow}`, background: `radial-gradient(circle at 50% 110%, color-mix(in srgb, ${glow} 28%, transparent), transparent 60%)` }}
      />
    </motion.div>
  );
}
