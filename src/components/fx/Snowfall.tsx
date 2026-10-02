import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useWinterActive } from "@/lib/winter";

/* v4.8 : neige légère sur le fond (canvas, ~60 flocons), en pause quand
   l'onglet est caché, absente avec « réduire les animations ». */

export function Snowfall() {
  const active = useWinterActive();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!active || reduce || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const count = w < 640 ? 35 : 60;
    const flakes = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8, vy: 0.25 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2, a: 0.25 + Math.random() * 0.45 }));
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(50, t - last) / 16;
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy * dt;
        f.phase += 0.01 * dt;
        f.x += Math.sin(f.phase) * 0.3 * dt;
        if (f.y > h + 4) {
          f.y = -4;
          f.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 242, 255, ${f.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, reduce]);

  if (!active || reduce) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
