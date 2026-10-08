import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* =====================================================
   v4.4 : fond étoilé en trois couches qui glissent à des vitesses
   différentes selon la souris (ou l'inclinaison du téléphone) et le
   déplacement de la carte. Rendu par transformations CSS, sans re-rendu.
===================================================== */

const LAYERS = [
  { count: 140, size: [0.5, 1.1], alpha: [0.25, 0.55], depth: 6, pan: 0.04 },
  { count: 70, size: [0.9, 1.7], alpha: [0.35, 0.75], depth: 14, pan: 0.1 },
  { count: 26, size: [1.4, 2.6], alpha: [0.55, 0.95], depth: 26, pan: 0.2 },
] as const;

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TINTS = ["#ffffff", "#cfe8ff", "#9fd8ff", "#ffe9c4", "#d9c8ff"];

function layerImage(i: number): string {
  const L = LAYERS[i];
  const r = rng(1337 + i * 97);
  const between = (lo: number, hi: number) => lo + r() * (hi - lo);
  const stars = Array.from({ length: L.count }, () => {
    const x = (r() * 400).toFixed(1);
    const y = (r() * 400).toFixed(1);
    const s = between(L.size[0], L.size[1]).toFixed(2);
    const o = between(L.alpha[0], L.alpha[1]).toFixed(2);
    return `<circle cx='${x}' cy='${y}' r='${s}' fill='${TINTS[Math.floor(r() * TINTS.length)]}' fill-opacity='${o}'/>`;
  }).join("");
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>${stars}</svg>`)}")`;
}

export function ParallaxStars({ pan }: { pan: { x: number; y: number } }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;
  const reduced = useReducedMotion() ?? false;
  const images = useMemo(() => LAYERS.map((_, i) => layerImage(i)), []);

  // 6.14.116 (É30-5) : la boucle d'animation ne tourne que pendant un mouvement (souris, inclinaison, carte déplacée) et
  // s'arrête une fois les couches arrivées. Avant, elle repeignait les 3 couches 60 fois par seconde tant que la Galaxie était
  // ouverte (processeur occupé sur mobile).
  const kickRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const cur = { x: 0, y: 0 };
    const last = { x: Number.NaN, y: Number.NaN, px: Number.NaN, py: Number.NaN };
    const tick = () => {
      frame = 0;
      // Lissage : les couches rattrapent doucement la cible.
      cur.x += (pointer.current.x - cur.x) * 0.08;
      cur.y += (pointer.current.y - cur.y) * 0.08;
      const px = panRef.current.x;
      const py = panRef.current.y;
      const settled = Math.abs(pointer.current.x - cur.x) < 0.002 && Math.abs(pointer.current.y - cur.y) < 0.002;
      if (settled) {
        cur.x = pointer.current.x;
        cur.y = pointer.current.y;
      }
      if (cur.x !== last.x || cur.y !== last.y || px !== last.px || py !== last.py) {
        LAYERS.forEach((L, i) => {
          const el = refs.current[i];
          if (!el) return;
          const x = cur.x * L.depth + px * L.pan;
          const y = cur.y * L.depth + py * L.pan;
          el.style.backgroundPosition = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
        });
        Object.assign(last, { x: cur.x, y: cur.y, px, py });
      }
      if (!settled) frame = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    kickRef.current = kick;
    kick();

    const onMove = (e: PointerEvent) => {
      pointer.current = { x: (e.clientX / window.innerWidth - 0.5) * -2, y: (e.clientY / window.innerHeight - 0.5) * -2 };
      kick();
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      pointer.current = { x: Math.max(-1, Math.min(1, -e.gamma / 30)), y: Math.max(-1, Math.min(1, -(e.beta - 45) / 30)) };
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      kickRef.current = () => undefined;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [reduced]);
  // Carte déplacée ou zoomée : une passe d'animation.
  useEffect(() => {
    kickRef.current();
  }, [pan.x, pan.y]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {LAYERS.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute inset-0"
          style={{ backgroundImage: images[i], backgroundRepeat: "repeat", backgroundSize: "400px 400px", opacity: 0.9 }}
        />
      ))}
    </div>
  );
}
