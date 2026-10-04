import { useEffect, useRef } from "react";
import { useThemeStore } from "@/lib/theme";

/* =====================================================
   Verrière du cockpit : la planète mère en orbite, les flottes du joueur
   sur l'orbite et les flottes hostiles qui approchent (à leur vraie
   progression). Parallaxe à la souris, couleurs du thème actif.
===================================================== */

export interface ViewportFleet {
  id: string;
  label: string;
  /** 0 → 1 : avancée vers la cible (hostile) ou position sur l'orbite (amie). */
  progress: number;
}

interface Star {
  x: number;
  y: number;
  l: number;
  s: number;
  p: number;
}

function seedStars(): Star[] {
  const stars: Star[] = [];
  const n = [70, 46, 26];
  for (let l = 0; l < 3; l++) for (let i = 0; i < n[l]; i++) stars.push({ x: Math.random(), y: Math.random(), l, s: Math.random() * 1.3 + 0.3, p: Math.random() * 6 });
  return stars;
}

export function CockpitViewport({ friendly, hostile, pulse }: { friendly: ViewportFleet[]; hostile: ViewportFleet[]; pulse: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  // Données lues par la boucle d'animation sans la relancer.
  const data = useRef({ friendly, hostile, pulse, pulseAt: 0 });
  useEffect(() => {
    if (pulse !== data.current.pulse) data.current.pulseAt = performance.now();
    data.current = { ...data.current, friendly, hostile, pulse };
  }, [friendly, hostile, pulse]);

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !wrap || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cs = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
    const accent = color("--th-accent", "#4be8ff");
    const accent2 = color("--th-accent2", "#a78bfa");
    const danger = color("--th-danger", "#ff5d6c");
    const gold = color("--th-gold", "#ffd86b");
    const deep = color("--th-space-700", "#0b1d33");
    const stars = seedStars();
    let W = 0;
    let H = 0;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let visible = true;
    const t0 = performance.now();

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(performance.now());
    };
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };

    function draw(now: number) {
      const t = (now - t0) / 1000;
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      ctx!.clearRect(0, 0, W, H);
      // Nébuleuses
      let g = ctx!.createRadialGradient(W * 0.72 - mx * 20, H * 0.3 - my * 14, 10, W * 0.72, H * 0.3, Math.max(W, H) * 0.6);
      g.addColorStop(0, accent2);
      g.addColorStop(1, "transparent");
      ctx!.globalAlpha = 0.16;
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, W, H);
      g = ctx!.createRadialGradient(W * 0.2 - mx * 12, H * 0.75, 10, W * 0.2, H * 0.75, Math.max(W, H) * 0.5);
      g.addColorStop(0, accent);
      g.addColorStop(1, "transparent");
      ctx!.globalAlpha = 0.1;
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, W, H);
      // Étoiles (trois plans)
      for (const s of stars) {
        const depth = (s.l + 1) * 7;
        const sp = (s.l + 1) * 3;
        const x = (((s.x * W + (reduce ? 0 : t * sp) - mx * depth) % W) + W) % W;
        const y = s.y * H - my * depth;
        const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * 1.4 + s.p);
        ctx!.globalAlpha = tw * (0.35 + s.l * 0.25);
        ctx!.fillStyle = "#fff";
        ctx!.beginPath();
        ctx!.arc(x, y, s.s * (0.7 + s.l * 0.3), 0, 6.283);
        ctx!.fill();
      }
      const narrow = W < 600;
      const cx = W * 0.5 + mx * 10;
      const cy = H * (narrow ? 0.38 : 0.46) + my * 7;
      const R = Math.min(W, H) * (narrow ? 0.2 : 0.18);
      const tilt = -0.28;
      // Orbites
      ctx!.globalAlpha = 0.5;
      ctx!.strokeStyle = accent;
      ctx!.lineWidth = 1;
      ctx!.setLineDash([3, 6]);
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, R * 2.1, R * 0.62, tilt, 0, 6.283);
      ctx!.stroke();
      ctx!.setLineDash([]);
      ctx!.beginPath();
      ctx!.ellipse(cx, cy, R * 3.0, R * 0.9, tilt, 0, 6.283);
      ctx!.globalAlpha = 0.18;
      ctx!.stroke();
      // Atmosphère et planète
      g = ctx!.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.55);
      g.addColorStop(0, accent);
      g.addColorStop(1, "transparent");
      ctx!.globalAlpha = 0.38;
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R * 1.55, 0, 6.283);
      ctx!.fill();
      g = ctx!.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, "#f4fbff");
      g.addColorStop(0.25, accent);
      g.addColorStop(0.7, deep);
      g.addColorStop(1, "#02050c");
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, 6.283);
      ctx!.fill();
      // Continents qui tournent + terminateur
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, 6.283);
      ctx!.clip();
      ctx!.globalAlpha = 0.22;
      ctx!.fillStyle = "#001018";
      const off = reduce ? 0 : (t * 8) % (R * 2);
      for (let i = -1; i < 3; i++) {
        const bx = cx - R + i * R * 0.9 + off;
        ctx!.beginPath();
        ctx!.ellipse(bx, cy - R * 0.2, R * 0.38, R * 0.22, 0.4, 0, 6.283);
        ctx!.fill();
        ctx!.beginPath();
        ctx!.ellipse(bx + R * 0.4, cy + R * 0.35, R * 0.3, R * 0.16, -0.3, 0, 6.283);
        ctx!.fill();
      }
      g = ctx!.createLinearGradient(cx - R, cy, cx + R, cy);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.55, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,.78)");
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = g;
      ctx!.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx!.restore();
      // Lumières de la face nocturne
      ctx!.globalAlpha = 0.9;
      ctx!.fillStyle = gold;
      for (let k = 0; k < 14; k++) {
        const a = k * 2.399;
        const rr = R * (0.2 + (k % 5) * 0.13);
        ctx!.fillRect(cx + R * 0.38 + Math.cos(a) * rr * 0.5, cy + Math.sin(a) * rr * 0.8, 1.6, 1.6);
      }
      ctx!.font = "9px JetBrains Mono, monospace";
      // Flottes du joueur, réparties sur l'orbite
      const { friendly: fr, hostile: ho, pulseAt } = data.current;
      fr.slice(0, 6).forEach((f, i) => {
        const ang = (reduce ? 1.2 : t * 0.35) + i * (6.283 / Math.max(1, Math.min(6, fr.length)));
        const fx = cx + Math.cos(ang) * R * 2.1 * Math.cos(tilt) - Math.sin(ang) * R * 0.62 * Math.sin(tilt);
        const fy = cy + Math.cos(ang) * R * 2.1 * Math.sin(tilt) + Math.sin(ang) * R * 0.62 * Math.cos(tilt);
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = "#fff";
        ctx!.shadowColor = accent;
        ctx!.shadowBlur = 12;
        ctx!.beginPath();
        ctx!.moveTo(fx + 6, fy);
        ctx!.lineTo(fx - 4, fy - 4);
        ctx!.lineTo(fx - 4, fy + 4);
        ctx!.closePath();
        ctx!.fill();
        ctx!.shadowBlur = 0;
        if (!narrow || i === 0) {
          ctx!.globalAlpha = 0.7;
          ctx!.fillStyle = accent;
          ctx!.fillText(f.label.toUpperCase().slice(0, 22), fx + 10, fy - 8);
        }
      });
      // Flottes hostiles : du bord vers la planète, à leur progression réelle
      const pulseWave = (Math.sin(t * 5) + 1) / 2;
      ho.slice(0, 4).forEach((h, i) => {
        const sx = i % 2 === 0 ? W * 0.08 : W * 0.92;
        // Départ sous les instruments du haut de la verrière.
        const sy = H * (0.3 + i * 0.08);
        const ex = cx + (i % 2 === 0 ? -R * 1.8 : R * 1.8);
        const ey = cy - R * 1.1;
        const p = Math.min(1, Math.max(0, h.progress));
        const hx = sx + (ex - sx) * p;
        const hy = sy + (ey - sy) * p;
        ctx!.globalAlpha = 0.35;
        ctx!.strokeStyle = danger;
        ctx!.setLineDash([2, 5]);
        ctx!.beginPath();
        ctx!.moveTo(sx, sy);
        ctx!.lineTo(ex, ey);
        ctx!.stroke();
        ctx!.setLineDash([]);
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = danger;
        ctx!.shadowColor = danger;
        ctx!.shadowBlur = 8 + pulseWave * 10;
        const dir = i % 2 === 0 ? 1 : -1;
        for (let m = 0; m < 3; m++) {
          const ox = hx - dir * m * 9;
          const oy = hy - 5 + (m % 2) * 7;
          ctx!.beginPath();
          ctx!.moveTo(ox + dir * 6, oy);
          ctx!.lineTo(ox - dir * 4, oy - 4);
          ctx!.lineTo(ox - dir * 4, oy + 4);
          ctx!.closePath();
          ctx!.fill();
        }
        ctx!.shadowBlur = 0;
        ctx!.globalAlpha = 0.9;
        ctx!.fillText(h.label.toUpperCase().slice(0, 24), hx - 10, hy - 16);
      });
      // Onde d'alerte (nouvelle menace)
      if (pulseAt > 0) {
        const a = (now - pulseAt) / 1400;
        if (a <= 1) {
          ctx!.globalAlpha = (1 - a) * 0.8;
          ctx!.strokeStyle = danger;
          ctx!.lineWidth = 3;
          ctx!.beginPath();
          ctx!.arc(cx, cy, R * (1 + a * 3), 0, 6.283);
          ctx!.stroke();
          ctx!.lineWidth = 1;
        }
      }
      ctx!.globalAlpha = 1;
    }

    const loop = (now: number) => {
      if (visible && !document.hidden) draw(now);
      raf = requestAnimationFrame(loop);
    };
    const io = "IntersectionObserver" in window ? new IntersectionObserver((e) => (visible = e[0].isIntersecting)) : null;
    io?.observe(wrap);
    const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    ro?.observe(wrap);
    resize();
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    if (reduce) {
      draw(performance.now());
      // Mouvement réduit : une image par seconde suffit pour suivre les flottes.
      const id = window.setInterval(() => draw(performance.now()), 1000);
      return () => {
        window.clearInterval(id);
        io?.disconnect();
        ro?.disconnect();
        wrap.removeEventListener("pointermove", onMove);
        wrap.removeEventListener("pointerleave", onLeave);
      };
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      ro?.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [theme]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  );
}
