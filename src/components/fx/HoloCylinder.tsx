import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { themeColor } from "@/components/fx/scene3d";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* =====================================================
   5.24 : cylindre holographique (archives, vitrine, roue de récompenses).
   Inspiré de la galerie open source de cortiz (cortiz2894) : les cartes
   sont des plans instanciés, courbés sur un cylindre dans le vertex shader ;
   le fragment shader ajoute le cadre HUD (coins, bordure), les lignes de
   balayage, le scintillement, l'aberration chromatique à la vitesse et un
   tramage pour les fiches verrouillées. Une seule texture (atlas), un seul
   appel de dessin.
===================================================== */

export interface HoloItem {
  id: string;
  image: string;
  label: string;
  sub?: string;
  /** Fiche verrouillée : tramée et sombre. */
  locked?: boolean;
}

export type HoloMode = "gallery" | "background" | "reel";

export interface HoloCylinderProps {
  items: HoloItem[];
  mode?: HoloMode;
  /** Carte de face choisie (clic sur la scène ou Entrée). */
  onSelect?: (item: HoloItem) => void;
  /** Roue : indice où s'arrêter, puis rappel. */
  reelTarget?: number;
  onReelDone?: () => void;
  onUnsupported?: () => void;
  className?: string;
}

const TILE = 256;
const CARD = 2.4;
const MIN_CARDS = 10;

const VERT = /* glsl */ `
  uniform float uRadius;
  uniform float uRotation;
  uniform float uCurvature;
  uniform float uTime;
  attribute float aAngle;
  attribute float aTex;
  attribute float aLocked;
  varying vec2 vUv;
  varying float vTex;
  varying float vLocked;
  varying float vDepth;
  varying float vFront;
  void main() {
    vUv = uv;
    vTex = aTex;
    vLocked = aLocked;
    float angle = aAngle + uRotation;
    float theta = position.x / (uRadius * uCurvature);
    float a = angle + theta;
    float bob = sin(uTime * 0.6 + aAngle * 3.0) * 0.06;
    vec3 p = vec3(sin(a) * uRadius, position.y + bob, cos(a) * uRadius);
    vDepth = smoothstep(-uRadius, uRadius * 0.6, p.z);
    vFront = smoothstep(0.85, 1.0, cos(angle));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uCols;
  uniform float uRows;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uAccent;
  uniform vec3 uNeutral;
  uniform float uDim;
  varying vec2 vUv;
  varying float vTex;
  varying float vLocked;
  varying float vDepth;
  varying float vFront;

  vec2 tile(vec2 uv) {
    float idx = floor(vTex + 0.5);
    float col = mod(idx, uCols);
    float row = floor(idx / uCols);
    return vec2((col + uv.x) / uCols, 1.0 - (row + 1.0 - uv.y) / uRows);
  }
  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  float bayer4(vec2 p) {
    vec2 q = mod(floor(p), 4.0);
    float m[16];
    m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0; m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
    m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0; m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
    int i = int(q.y * 4.0 + q.x);
    for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0;
    return 0.0;
  }
  void main() {
    vec2 p = vUv - 0.5;
    // Coin coupé façon hud-cut : on retire le coin haut-gauche.
    if (p.x + 0.5 + (0.5 - p.y) < 0.12) discard;
    float d = sdRoundBox(p, vec2(0.5), 0.015);
    if (d > 0.0) discard;

    // Aberration chromatique à la vitesse de rotation.
    float ca = clamp(abs(uSpeed) * 0.015, 0.0, 0.012);
    vec3 col;
    col.r = texture2D(uAtlas, tile(vUv + vec2(ca, 0.0))).r;
    col.g = texture2D(uAtlas, tile(vUv)).g;
    col.b = texture2D(uAtlas, tile(vUv - vec2(ca, 0.0))).b;

    // Fiche verrouillée : niveaux de gris, tramée, sombre.
    if (vLocked > 0.5) {
      float g = dot(col, vec3(0.299, 0.587, 0.114));
      float dith = step(bayer4(gl_FragCoord.xy / 2.0), g * 0.9);
      col = mix(uNeutral * 0.08, uNeutral * 0.35, dith);
    }

    // Lignes de balayage et scintillement holographique.
    float scan = 0.92 + 0.08 * sin(vUv.y * 180.0 - uTime * 4.0);
    float flicker = 0.97 + 0.03 * sin(uTime * 23.0 + vTex * 7.0);
    col *= scan * flicker;

    // Cadre : bordure fine, coins en équerre plus vifs ; accent sur la carte de face.
    vec3 frame = mix(uNeutral * 0.6, uAccent, vFront);
    float edge = 1.0 - smoothstep(0.0, 0.012, abs(d));
    vec2 a = abs(p);
    float corner = step(0.43, max(a.x, a.y)) * step(0.36, min(a.x, a.y)) * (1.0 - smoothstep(0.0, 0.02, abs(d)));
    col = mix(col, frame, clamp(edge * 0.7 + corner, 0.0, 1.0));
    col += uAccent * vFront * 0.06 * (1.0 - smoothstep(0.0, 0.25, abs(d)));

    float alpha = mix(0.12, 1.0, vDepth) * uDim;
    gl_FragColor = vec4(col * mix(0.35, 1.0, vDepth), alpha);
  }
`;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = assetUrl(src);
  });
}

/** Atlas carré : chaque image recadrée au centre (haut privilégié pour les portraits). */
async function buildAtlas(items: HoloItem[], fill: string): Promise<{ texture: THREE.CanvasTexture; cols: number; rows: number }> {
  const cols = Math.ceil(Math.sqrt(items.length));
  const rows = Math.ceil(items.length / cols);
  // Plafond de 4096 px par côté (limite courante des textures sur mobile).
  const t = Math.min(TILE, Math.floor(4096 / cols));
  const canvas = document.createElement("canvas");
  canvas.width = cols * t;
  canvas.height = rows * t;
  const ctx = canvas.getContext("2d")!;
  const images = await Promise.all(items.map((i) => loadImage(i.image)));
  images.forEach((img, i) => {
    const x = (i % cols) * t;
    const y = Math.floor(i / cols) * t;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, t, t);
    if (!img) return;
    const s = Math.min(img.width, img.height);
    const sx = (img.width - s) / 2;
    const sy = img.height > img.width ? 0 : (img.height - s) / 2;
    try {
      ctx.drawImage(img, sx, sy, s, s, x, y, t, t);
    } catch {
      /* image d'un autre domaine sans CORS : case vide */
    }
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, cols, rows };
}

export function HoloCylinder({ items, mode = "gallery", onSelect, reelTarget, onReelDone, onUnsupported, className }: HoloCylinderProps) {
  const host = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState(0);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const reelDoneRef = useRef(onReelDone);
  reelDoneRef.current = onReelDone;
  const interactive = mode === "gallery";
  // Moins de MIN_CARDS cartes : on répète la liste pour fermer l'anneau.
  const ring = items.length === 0 ? [] : Array.from({ length: Math.max(items.length, Math.ceil(MIN_CARDS / items.length) * items.length) }, (_, i) => items[i % items.length]);
  const key = items.map((i) => `${i.id}:${i.locked ? 1 : 0}`).join("|");

  useEffect(() => {
    const el = host.current;
    if (!el || ring.length === 0) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onUnsupported?.();
      return;
    }
    const width = () => el.clientWidth || 600;
    const height = () => el.clientHeight || 320;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width(), height());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    el.appendChild(renderer.domElement);

    const n = ring.length;
    const step = (Math.PI * 2) / n;
    const radius = Math.max(4.2, (n * CARD * 1.18) / (Math.PI * 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(mode === "background" ? 50 : 38, width() / height(), 0.1, 200);
    // Caméra à hauteur des cartes, visée sur la carte de face : l'anneau reste centré quel que soit son rayon.
    camera.position.set(0, mode === "background" ? 0.6 : 0.25, radius + (mode === "background" ? 8 : 7.2));
    camera.lookAt(0, mode === "gallery" ? -0.2 : 0, radius - 2);

    const geo = new THREE.PlaneGeometry(CARD, CARD, 24, 1);
    const angles = new Float32Array(n);
    const tex = new Float32Array(n);
    const locked = new Float32Array(n);
    ring.forEach((it, i) => {
      angles[i] = -i * step;
      tex[i] = i % items.length;
      locked[i] = it.locked ? 1 : 0;
    });
    geo.setAttribute("aAngle", new THREE.InstancedBufferAttribute(angles, 1));
    geo.setAttribute("aTex", new THREE.InstancedBufferAttribute(tex, 1));
    geo.setAttribute("aLocked", new THREE.InstancedBufferAttribute(locked, 1));
    const uniforms = {
      uAtlas: { value: null as THREE.Texture | null },
      uCols: { value: 1 },
      uRows: { value: 1 },
      uRadius: { value: radius },
      uRotation: { value: 0 },
      uCurvature: { value: 1.0 },
      uTime: { value: 0 },
      uSpeed: { value: 0 },
      uAccent: { value: themeColor("--color-cyan-glow", "rgb(80,200,255)") },
      uNeutral: { value: themeColor("--color-slate-300", "rgb(200,210,225)") },
      uDim: { value: mode === "background" ? 0.55 : 1 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    mesh.frustumCulled = false;
    // Positions faites dans le shader : matrices identité.
    const id = new THREE.Matrix4();
    for (let i = 0; i < n; i++) mesh.setMatrixAt(i, id);
    scene.add(mesh);

    let disposed = false;
    void buildAtlas(items, `#${themeColor("--color-space-950", "black").getHexString()}`).then((a) => {
      if (disposed) return a.texture.dispose();
      uniforms.uAtlas.value = a.texture;
      uniforms.uCols.value = a.cols;
      uniforms.uRows.value = a.rows;
    });

    // Rotation : cible + inertie, aimantée sur la carte la plus proche au repos.
    let rot = 0;
    let target = 0;
    let velocity = 0;
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastFront = -1;
    const frontIndex = () => (((Math.round(target / step) % n) + n) % n) % items.length;
    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      target += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.0025;
    };
    const onDown = (e: PointerEvent) => {
      if (!interactive) return;
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      target += dx * 0.006;
      velocity = dx * 0.006;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      if (moved < 6) selectRef.current?.(items[frontIndex()]);
      else target += velocity * 12;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!interactive) return;
      if (e.key === "ArrowRight") target += step;
      else if (e.key === "ArrowLeft") target -= step;
      else if (e.key === "Enter") selectRef.current?.(items[frontIndex()]);
      else return;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("keydown", onKey);

    // Roue de récompense : plusieurs tours rapides, puis arrêt sur la cible.
    let reel: gsap.core.Tween | null = null;
    if (mode === "reel" && reelTarget !== undefined) {
      const proxy = { v: 0 };
      const end = Math.PI * 2 * 4 + (reelTarget % items.length) * step;
      reel = gsap.to(proxy, {
        v: end,
        duration: 3.4,
        ease: "power4.out",
        onUpdate: () => {
          target = proxy.v;
        },
        onComplete: () => reelDoneRef.current?.(),
      });
    }

    let raf = 0;
    let last = performance.now();
    const frame = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      uniforms.uTime.value += dt;
      if (mode === "background") target += dt * 0.05;
      else if (!dragging && mode === "gallery") {
        target += (Math.round(target / step) * step - target) * Math.min(1, dt * 4);
      }
      const prev = rot;
      rot += (target - rot) * Math.min(1, dt * 7);
      uniforms.uRotation.value = rot;
      uniforms.uSpeed.value += ((rot - prev) / Math.max(dt, 1e-3) - uniforms.uSpeed.value) * 0.2;
      const f = frontIndex();
      if (f !== lastFront) {
        lastFront = f;
        setFront(f);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    frame();

    const ro = new ResizeObserver(() => {
      renderer.setSize(width(), height());
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      disposed = true;
      reel?.kill();
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("keydown", onKey);
      geo.dispose();
      mat.dispose();
      uniforms.uAtlas.value?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une scène par liste et par mode
  }, [key, mode, reelTarget]);

  const current = items[front];
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        ref={host}
        tabIndex={interactive ? 0 : -1}
        role={interactive ? "listbox" : "img"}
        aria-label={interactive ? "Archives holographiques : glisse ou utilise les flèches, Entrée pour ouvrir" : "Galerie holographique"}
        aria-activedescendant={interactive && current ? `holo-${current.id}` : undefined}
        className={cn("absolute inset-0 outline-none", interactive && "cursor-grab active:cursor-grabbing focus-visible:ring-1 focus-visible:ring-cyan-glow/50")}
      />
      {interactive && current && (
        <div id={`holo-${current.id}`} className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-0.5 text-center">
          <span className={cn("font-display text-sm", current.locked ? "text-slate-500" : "text-slate-100")}>{current.locked ? "???" : current.label}</span>
          {current.sub && <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{current.sub}</span>}
        </div>
      )}
    </div>
  );
}

export default HoloCylinder;
