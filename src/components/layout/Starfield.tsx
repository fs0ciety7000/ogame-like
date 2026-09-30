import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/** Trois couches d'étoiles (lointaines, moyennes, proches) qui glissent à
 *  des vitesses différentes selon la souris et le défilement : effet de
 *  profondeur (parallaxe). Désactivé si le système réduit les animations. */
const LAYERS = [
  { share: 0.5, size: [0.8, 1.6], depth: 6, opacity: 0.45 },
  { share: 0.35, size: [1.4, 2.4], depth: 14, opacity: 0.7 },
  { share: 0.15, size: [2.2, 3.4], depth: 28, opacity: 0.95 },
];

export function Starfield({ count = 120 }: { count?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  const layers = useMemo(
    () =>
      LAYERS.map((layer, li) => ({
        ...layer,
        stars: Array.from({ length: Math.round(count * layer.share) }, (_, i) => ({
          id: `${li}-${i}`,
          top: Math.random() * 110 - 5,
          left: Math.random() * 110 - 5,
          size: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
          duration: 2 + Math.random() * 2.5,
          delay: Math.random() * 3,
        })),
      })),
    [count],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let frame = 0;
    let px = 0;
    let py = 0;
    let sy = 0;
    const apply = () => {
      frame = 0;
      el.style.setProperty("--px", px.toFixed(3));
      el.style.setProperty("--py", py.toFixed(3));
      el.style.setProperty("--sy", sy.toFixed(1));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      schedule();
    };
    // Le contenu défile dans <main> (desktop) ou dans la fenêtre (mobile).
    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      sy = target instanceof HTMLElement ? target.scrollTop : window.scrollY;
      schedule();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll, { capture: true });
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div ref={ref} className="starfield" aria-hidden>
      {layers.map((layer, li) => (
        <div
          key={li}
          className="starfield-layer"
          style={{
            transform: `translate3d(calc(var(--px, 0) * ${-layer.depth}px), calc(var(--py, 0) * ${-layer.depth}px - var(--sy, 0) * ${layer.depth / 60}px), 0)`,
          }}
        >
          {layer.stars.map((s) => (
            <span
              key={s.id}
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                opacity: layer.opacity,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
