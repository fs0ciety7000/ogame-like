import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import gsap from "gsap";
import { RotateCcw } from "lucide-react";
import { findUnit } from "@/game/units";
import { assetUrl } from "@/lib/assets";
import { unitClasses } from "@/game/unitClasses";
import { cn } from "@/lib/utils";
import type { CombatLog, CombatOutcome } from "@/types/game";

/* =====================================================
   5.22.1 : replay du combat en 3D (three.js + GSAP), dans l'esprit des
   poursuites spatiales low-poly. Vaisseaux générés par le code (aucun
   modèle externe), une silhouette par classe : chasseur (Faible),
   croiseur (Moyen), vaisseau de ligne (Fort), station (défenses).

   Le déroulé suit le rapport : arrivée en distorsion, un échange de tirs
   par tour (proportionnel aux dégâts du tour), explosions au rythme des
   PV perdus, retraite de l'attaquant s'il a décroché. Couleurs lues dans
   le thème (ton camp = accent, l'adversaire = danger).
===================================================== */

type Kind = "light" | "medium" | "heavy" | "station";

export interface CombatScene3DProps {
  myPower: number;
  opponentPower: number;
  myLossPercent: number;
  opponentLossPercent: number;
  outcome: CombatOutcome;
  perspective: "attacker" | "defender";
  log?: CombatLog;
  /** WebGL indisponible : l'appelant affiche le replay 2D. */
  onUnsupported?: () => void;
}

/** Couleur d'un jeton CSS du thème (oklch, color-mix…) ramenée en RVB via un pixel de canvas. */
function themeColor(token: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Color(0.4, 0.8, 1);
  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color(r / 255, g / 255, b / 255);
}

/* ---------- géométries low-poly (pointe vers +x) ---------- */

function part(g: THREE.BufferGeometry, x = 0, y = 0, z = 0, rz = 0, ry = 0) {
  g.rotateZ(rz);
  g.rotateY(ry);
  g.translate(x, y, z);
  return g.index ? g.toNonIndexed() : g;
}

function shipGeometry(kind: Kind): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  if (kind === "light") {
    parts.push(part(new THREE.ConeGeometry(0.22, 1.1, 4), 0, 0, 0, -Math.PI / 2));
    parts.push(part(new THREE.BoxGeometry(0.35, 0.04, 1.0), -0.25, 0, 0));
    parts.push(part(new THREE.BoxGeometry(0.25, 0.25, 0.04), -0.4, 0.12, 0));
  } else if (kind === "medium") {
    parts.push(part(new THREE.CylinderGeometry(0.22, 0.32, 1.7, 6), 0, 0, 0, -Math.PI / 2));
    parts.push(part(new THREE.ConeGeometry(0.22, 0.6, 6), 1.15, 0, 0, -Math.PI / 2));
    parts.push(part(new THREE.BoxGeometry(0.7, 0.06, 1.5), -0.35, 0, 0));
    parts.push(part(new THREE.BoxGeometry(0.4, 0.3, 0.3), -0.2, 0.25, 0));
  } else if (kind === "heavy") {
    parts.push(part(new THREE.BoxGeometry(2.6, 0.5, 0.8)));
    parts.push(part(new THREE.ConeGeometry(0.42, 0.9, 4), 1.75, 0, 0, -Math.PI / 2, Math.PI / 4));
    parts.push(part(new THREE.BoxGeometry(0.8, 0.45, 0.5), -0.5, 0.42, 0));
    parts.push(part(new THREE.BoxGeometry(1.4, 0.12, 1.6), -0.6, -0.1, 0));
    parts.push(part(new THREE.BoxGeometry(0.4, 0.4, 0.4), -1.45, 0, 0.3));
    parts.push(part(new THREE.BoxGeometry(0.4, 0.4, 0.4), -1.45, 0, -0.3));
  } else {
    // 5.22.1 : tourelle de défense (socle hexagonal, dôme, deux canons vers l'ennemi) ; l'ancienne
    // station (octaèdre et anneau) se déformait en ellipse vue en plongée.
    parts.push(part(new THREE.CylinderGeometry(0.7, 0.85, 0.22, 6), 0, -0.2, 0));
    parts.push(part(new THREE.CylinderGeometry(0.45, 0.6, 0.18, 6), 0, -0.02, 0));
    parts.push(part(new THREE.SphereGeometry(0.38, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.06, 0));
    parts.push(part(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 6), 0.55, 0.22, 0.13, -Math.PI / 2));
    parts.push(part(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 6), 0.55, 0.22, -0.13, -Math.PI / 2));
  }
  const g = mergeGeometries(parts) ?? parts[0];
  g.computeVertexNormals();
  return g;
}

/** Halo doux (moteurs, tirs, explosions). */
function glowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgb(255,255,255)");
  g.addColorStop(0.25, "hsl(0 0% 100% / 0.6)");
  g.addColorStop(1, "hsl(0 0% 100% / 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/** Composition affichée d'un camp : nombre de coques par silhouette, d'après le rapport. */
function fleetKinds(log: CombatLog | undefined, side: "attacker" | "defender", power: number): Kind[] {
  const total = Math.max(6, Math.min(34, Math.round(6 + Math.log10(power + 1) * 3.2)));
  const units = (log?.units ?? []).filter((u) => u.side === side && u.start > 0);
  if (!units.length) return Array.from({ length: total }, (_, i) => (i % 5 === 0 ? "heavy" : i % 2 ? "light" : "medium"));
  const classes = unitClasses();
  const weight = (u: (typeof units)[number]) => {
    const def = findUnit(u.id);
    return u.start * Math.sqrt(Math.max(1, (def?.stats.attaque ?? 10) + (def?.stats.defense ?? 10)));
  };
  const sum = units.reduce((a, u) => a + weight(u), 0) || 1;
  const out: Kind[] = [];
  for (const u of units) {
    const n = Math.max(1, Math.round((weight(u) / sum) * total));
    const cls = u.cls ?? classes[u.id];
    const kind: Kind = u.group === "defense" ? "station" : cls === "heavy" ? "heavy" : cls === "light" ? "light" : "medium";
    for (let i = 0; i < n && out.length < 40; i++) out.push(kind);
  }
  return out;
}

const SCALE: Record<Kind, number> = { light: 0.75, medium: 0.9, heavy: 1, station: 0.9 };

/* ---------- modèles low-poly (poly.pizza, voir public/assets/models/ships/CREDITS.md) ---------- */

type ModelId = "quaternius" | "mastjie";
/** Modèle par silhouette (les stations restent procédurales) et longueur à l'écran. */
const MODEL_OF: Partial<Record<Kind, { id: ModelId; length: number }>> = {
  light: { id: "quaternius", length: 2.2 },
  medium: { id: "mastjie", length: 2.4 },
  heavy: { id: "mastjie", length: 3.6 },
};
/** Axe avant connu du modèle ; « auto » : détection (axe le plus long, extrémité la plus étroite).
 *  mastjie est un chasseur à cockpit sphérique et ailes hexagonales : son axe le plus long est la
 *  hauteur des ailes, le hublot regarde vers +z. */
const MODEL_FORWARD: Record<ModelId, "auto" | "+z"> = { quaternius: "auto", mastjie: "+z" };

let modelsPromise: Promise<Partial<Record<ModelId, THREE.Object3D>>> | null = null;

/** Charge les deux modèles une fois (4 s au plus chacun) ; un modèle absent laisse la silhouette procédurale. */
function loadModels(): Promise<Partial<Record<ModelId, THREE.Object3D>>> {
  modelsPromise ??= (async () => {
    const out: Partial<Record<ModelId, THREE.Object3D>> = {};
    try {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const within = <T,>(p: Promise<T>) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), 4000))]).catch(() => null);
      const [m, q] = await Promise.all([
        within(new GLTFLoader().loadAsync(assetUrl("/assets/models/ships/mastjie.glb")).then((g) => g.scene)),
        within(new GLTFLoader().loadAsync(assetUrl("/assets/models/ships/quaternius.glb")).then((g) => g.scene)),
      ]);
      if (m) out.mastjie = normalizeModel(m, MODEL_FORWARD.mastjie);
      if (q) out.quaternius = normalizeModel(q, MODEL_FORWARD.quaternius);
    } catch {
      /* modèles indisponibles : silhouettes procédurales */
    }
    return out;
  })();
  return modelsPromise;
}

/**
 * Centre le modèle, oriente la proue vers +x et ramène sa longueur à 1.
 * La proue est cherchée sans connaître le modèle : axe le plus long, et l'extrémité la plus
 * étroite des deux (les réacteurs et les ailes élargissent la poupe).
 */
function normalizeModel(src: THREE.Object3D, forward: "auto" | "+z" = "auto"): THREE.Object3D {
  const inner = src.clone(true);
  inner.updateMatrixWorld(true);
  const pts: THREE.Vector3[] = [];
  inner.traverse((n) => {
    const m = n as THREE.Mesh;
    const pos = m.isMesh ? (m.geometry.getAttribute("position") as THREE.BufferAttribute | undefined) : undefined;
    if (!pos) return;
    const step = Math.max(1, Math.floor(pos.count / 2000));
    for (let i = 0; i < pos.count; i += step) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
  });
  const box = new THREE.Box3().setFromPoints(pts.length ? pts : [new THREE.Vector3()]);
  const size = box.getSize(new THREE.Vector3());
  const axes = ["x", "y", "z"] as const;
  const a = axes.reduce((best, k) => (size[k] > size[best] ? k : best), "x" as (typeof axes)[number]);
  const others = axes.filter((k) => k !== a);
  const spread = (lo: number, hi: number) => {
    const slab = pts.filter((p) => p[a] >= lo && p[a] <= hi);
    if (!slab.length) return 0;
    return others.reduce((sum, k) => sum + Math.max(...slab.map((p) => p[k])) - Math.min(...slab.map((p) => p[k])), 0);
  };
  const len = forward === "+z" ? Math.max(size.x, size.y, size.z) : size[a];
  const nearMax = spread(box.max[a] - len * 0.2, box.max[a]);
  const nearMin = spread(box.min[a], box.min[a] + len * 0.2);
  const nose = new THREE.Vector3();
  if (forward === "+z") nose.set(0, 0, 1);
  else nose[a] = nearMax <= nearMin ? 1 : -1;
  // Rotation autour de y quand c'est possible (le haut du modèle reste en haut).
  const q = nose.x === 0 && nose.y === 0 ? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), nose.z > 0 ? Math.PI / 2 : -Math.PI / 2) : new THREE.Quaternion().setFromUnitVectors(nose, new THREE.Vector3(1, 0, 0));
  const pivot = new THREE.Group();
  pivot.add(inner);
  pivot.quaternion.copy(q);
  pivot.updateMatrixWorld(true);
  const centered = new THREE.Box3().setFromObject(pivot);
  const center = centered.getCenter(new THREE.Vector3());
  const wrap = new THREE.Group();
  wrap.add(pivot);
  pivot.position.sub(center);
  wrap.scale.setScalar(1 / Math.max(len, 1e-6));
  const root = new THREE.Group();
  root.add(wrap);
  return root;
}

interface Ship {
  mesh: THREE.Object3D;
  engine: THREE.Sprite;
  home: THREE.Vector3;
  alive: boolean;
  kind: Kind;
}

export function CombatScene3D({ myPower, opponentPower, myLossPercent, opponentLossPercent, outcome, perspective, log, onUnsupported }: CombatScene3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [hp, setHp] = useState<[number, number]>([1, 1]);
  const [ended, setEnded] = useState(false);
  const iAttack = perspective === "attacker";
  const iWon = (iAttack && outcome === "attacker_win") || (!iAttack && outcome === "defender_win");
  const banner = outcome === "draw" ? "Égalité" : iWon ? "Victoire" : "Défaite";
  const bannerTone = outcome === "draw" ? "text-gold-glow" : iWon ? "text-mint-glow" : "text-danger-glow";

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onUnsupported?.();
      return;
    }
    setHp([1, 1]);
    setEnded(false);
    let cleanup: (() => void) | null = null;
    let disposed = false;
    void loadModels().then((models) => {
      if (disposed) return;
      cleanup = start(models);
    });
    const start = (models: Partial<Record<ModelId, THREE.Object3D>>) => {
    const rand = rng(4242 + run * 131);
    const width = () => el.clientWidth || 600;
    const height = () => el.clientHeight || 260;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width(), height());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.className = "absolute inset-0 h-full w-full";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width() / height(), 0.1, 400);
    camera.position.set(0, 7, 30);
    camera.lookAt(0, 0, 0);

    const mine = themeColor("--color-cyan-glow", "rgb(80,200,255)");
    const theirs = themeColor("--color-danger-glow", "rgb(255,80,80)");
    const ember = themeColor("--color-ember-glow", "rgb(255,150,60)");
    const hull = themeColor("--color-slate-300", "rgb(200,205,215)");

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 10, 8);
    scene.add(key);
    const rimA = new THREE.PointLight(mine, 40, 60);
    rimA.position.set(-14, 3, 6);
    const rimB = new THREE.PointLight(theirs, 40, 60);
    rimB.position.set(14, 3, 6);
    scene.add(rimA, rimB);

    // Champ d'étoiles (deux couches pour la parallaxe).
    const stars = new THREE.Group();
    for (const [n, r, size] of [
      [500, 120, 0.35],
      [200, 70, 0.6],
    ] as const) {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const t = rand() * Math.PI * 2;
        const p = Math.acos(2 * rand() - 1);
        pos.set([r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p)], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      stars.add(new THREE.Points(g, new THREE.PointsMaterial({ color: hull, size, sizeAttenuation: true, transparent: true, opacity: 0.8 })));
    }
    scene.add(stars);

    const glow = glowTexture();
    const geos = new Map<Kind, THREE.BufferGeometry>();
    const geo = (k: Kind) => geos.get(k) ?? (geos.set(k, shipGeometry(k)), geos.get(k)!);
    const mats = [mine, theirs].map((c) => new THREE.MeshStandardMaterial({ color: hull, emissive: c, emissiveIntensity: 0.18, flatShading: true, metalness: 0.35, roughness: 0.55 }));
    // Matériaux des modèles teintés par camp (un clone par matériau d'origine et par camp).
    const tinted = new Map<THREE.Material, THREE.Material[]>();
    const tint = (m: THREE.Material, side: 0 | 1) => {
      if (!tinted.has(m)) {
        tinted.set(
          m,
          [mine, theirs].map((c) => {
            const x = m.clone() as THREE.MeshStandardMaterial;
            // Peinture de coque (teintes saturées, ex. l'orange de Quaternius) aux couleurs du camp ;
            // les gris (blindage, verrière) restent tels quels.
            if (x.color) {
              const hsl = { h: 0, s: 0, l: 0 };
              x.color.getHSL(hsl);
              if (hsl.s > 0.35) x.color.copy(c).lerp(hull, 0.25);
            }
            if ("emissive" in x && x.emissive) {
              x.emissive = c.clone();
              x.emissiveIntensity = 0.15;
            }
            return x;
          }),
        );
      }
      return tinted.get(m)![side];
    };
    const body = (kind: Kind, side: 0 | 1): THREE.Object3D => {
      const spec = MODEL_OF[kind];
      const model = spec ? models[spec.id] : undefined;
      if (!spec || !model) return new THREE.Mesh(geo(kind), mats[side]);
      const o = model.clone(true);
      o.scale.multiplyScalar(spec.length);
      o.traverse((n) => {
        const mesh = n as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => tint(m, side)) : tint(mesh.material, side);
      });
      return o;
    };

    const build = (kinds: Kind[], side: 0 | 1): Ship[] => {
      const dir = side === 0 ? 1 : -1;
      return kinds.map((kind, i) => {
        const mesh = body(kind, side);
        const col = Math.floor(i / 7);
        const row = i % 7;
        const home = new THREE.Vector3(-dir * (6 + col * 2.4 + rand() * 0.8), (row - 3) * 1.15 + (rand() - 0.5) * 0.6, (rand() - 0.5) * 6 - col * 0.6);
        if (kind === "station") home.x = -dir * (8 + col * 2 + rand());
        mesh.scale.setScalar(SCALE[kind]);
        mesh.rotation.y = side === 0 ? 0 : Math.PI;
        const engine = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: side === 0 ? mine : theirs, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        const spec = MODEL_OF[kind];
        if (spec && models[spec.id]) {
          // Modèle normalisé (longueur 1) puis agrandi : réacteur juste derrière la poupe.
          engine.scale.setScalar(0.45);
          engine.position.set(-0.55, 0, 0);
        } else {
          engine.scale.setScalar(kind === "heavy" ? 1.4 : 0.8);
          engine.position.set(kind === "heavy" ? -1.7 : -0.8, 0, 0);
        }
        if (kind !== "station") mesh.add(engine);
        mesh.position.copy(home).add(new THREE.Vector3(-dir * 45, 0, 0));
        scene.add(mesh);
        return { mesh, engine, home, alive: true, kind };
      });
    };
    const myFleet = build(fleetKinds(log, perspective, myPower), 0);
    const theirFleet = build(fleetKinds(log, iAttack ? "defender" : "attacker", opponentPower), 1);
    // Les défenses du défenseur sont déjà en place : pas d'arrivée en distorsion.
    for (const s of iAttack ? theirFleet : myFleet) if (s.kind === "station") s.mesh.position.copy(s.home);

    // Réserves de tirs et d'éclats, réutilisées.
    const boltGeo = new THREE.BoxGeometry(1.1, 0.06, 0.06);
    const bolts = Array.from({ length: 90 }, () => {
      const m = new THREE.Mesh(boltGeo, new THREE.MeshBasicMaterial({ color: mine, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.visible = false;
      scene.add(m);
      return m;
    });
    const flashes = Array.from({ length: 40 }, () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: ember, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.visible = false;
      scene.add(s);
      return s;
    });
    let boltI = 0;
    let flashI = 0;

    const tl = gsap.timeline();
    const cam = { angle: -0.3, height: 14, dist: 20 };
    tl.to(cam, { angle: 0.3, height: 10, dist: 17, duration: 14, ease: "sine.inOut" }, 0);

    // Arrivée en distorsion.
    const warp = (fleet: Ship[], at: number) =>
      fleet.forEach((s, i) => {
        if (s.mesh.position.equals(s.home)) return;
        const d = at + i * 0.03;
        tl.fromTo(s.mesh.scale, { x: s.mesh.scale.x * 4 }, { x: s.mesh.scale.x, duration: 0.9, ease: "expo.out" }, d);
        tl.to(s.mesh.position, { x: s.home.x, y: s.home.y, z: s.home.z, duration: 1.1, ease: "expo.out" }, d);
      });
    warp(myFleet, 0.1);
    warp(theirFleet, 0.25);

    const shoot = (from: Ship, to: Ship, color: THREE.Color, at: number) => {
      const b = bolts[boltI++ % bolts.length];
      const mat = b.material as THREE.MeshBasicMaterial;
      const p = { t: 0 };
      tl.call(
        () => {
          mat.color.copy(color);
          b.visible = true;
          mat.opacity = 1;
        },
        undefined,
        at,
      );
      tl.to(
        p,
        {
          t: 1,
          duration: 0.32,
          ease: "none",
          onUpdate: () => {
            const a = from.mesh.position;
            const z = to.mesh.position;
            b.position.lerpVectors(a, z, p.t);
            b.lookAt(z);
            b.rotateY(Math.PI / 2);
          },
          onComplete: () => {
            b.visible = false;
            mat.opacity = 0;
          },
        },
        at,
      );
      flash(to.mesh.position, 0.6, at + 0.32, color);
    };

    const flash = (pos: THREE.Vector3, size: number, at: number, color = ember) => {
      const s = flashes[flashI++ % flashes.length];
      const mat = s.material as THREE.SpriteMaterial;
      tl.call(
        () => {
          s.position.copy(pos);
          mat.color.copy(color);
          s.visible = true;
        },
        undefined,
        at,
      );
      tl.fromTo(s.scale, { x: size * 0.3, y: size * 0.3 }, { x: size * 2.2, y: size * 2.2, duration: 0.5, ease: "expo.out" }, at);
      tl.fromTo(mat, { opacity: 1 }, { opacity: 0, duration: 0.55, ease: "power2.in", onComplete: () => void (s.visible = false) }, at);
    };

    const explode = (s: Ship, at: number) => {
      s.alive = false;
      const big = s.kind === "heavy" || s.kind === "station";
      flash(s.mesh.position.clone(), big ? 3 : 1.8, at);
      tl.to(s.mesh.rotation, { z: (rand() - 0.5) * 3, x: (rand() - 0.5) * 3, duration: 0.6, ease: "power2.out" }, at);
      tl.to(s.mesh.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.45, ease: "power3.in", onComplete: () => void (s.mesh.visible = false) }, at + 0.15);
      if (big) tl.to(cam, { height: "+=0.4", duration: 0.06, yoyo: true, repeat: 3, ease: "none" }, at);
    };

    // Déroulé : un tour = un échange de tirs, puis les pertes du tour.
    const rounds = log?.rounds?.length ? log.rounds : [{ attackerHp: 1 - (iAttack ? myLossPercent : opponentLossPercent), defenderHp: 1 - (iAttack ? opponentLossPercent : myLossPercent), attackerDamage: 1, defenderDamage: 1 }];
    const START = 1.6;
    const ROUND = rounds.length > 6 ? 0.9 : 1.2;
    const maxDmg = Math.max(1, ...rounds.flatMap((r) => [r.attackerDamage, r.defenderDamage]));
    const killedBy = (fleet: Ship[], lossPct: number, hpLeft: number[]) => {
      const total = Math.round(fleet.length * Math.min(1, Math.max(0, lossPct)));
      const lastLoss = 1 - (hpLeft[hpLeft.length - 1] ?? 0) || 1;
      return hpLeft.map((h) => Math.round((total * (1 - h)) / lastLoss));
    };
    const myHp = rounds.map((r) => (iAttack ? r.attackerHp : r.defenderHp));
    const theirHp = rounds.map((r) => (iAttack ? r.defenderHp : r.attackerHp));
    const myKilled = killedBy(myFleet, myLossPercent, myHp);
    const theirKilled = killedBy(theirFleet, opponentLossPercent, theirHp);
    // Le front tombe d'abord (unités les plus proches de l'ennemi).
    const order = (f: Ship[]) => [...f].sort((a, b) => Math.abs(a.home.x) - Math.abs(b.home.x) || rand() - 0.5);
    const myOrder = order(myFleet);
    const theirOrder = order(theirFleet);
    let myDone = 0;
    let theirDone = 0;
    rounds.forEach((r, k) => {
      const at = START + k * ROUND;
      for (const fromMe of [true, false]) {
        const dmg = fromMe === iAttack ? r.attackerDamage : r.defenderDamage;
        const n = dmg > 0 ? Math.max(2, Math.round((dmg / maxDmg) * 14)) : 0;
        const shooters = (fromMe ? myFleet : theirFleet).filter((s) => s.alive);
        const targets = (fromMe ? theirFleet : myFleet).filter((s) => s.alive);
        if (!shooters.length || !targets.length) continue;
        for (let i = 0; i < n; i++) shoot(shooters[Math.floor(rand() * shooters.length)], targets[Math.floor(rand() * targets.length)], fromMe ? mine : theirs, at + rand() * (ROUND * 0.55));
      }
      const end = at + ROUND * 0.7;
      while (myDone < Math.min(myKilled[k], myOrder.length)) explode(myOrder[myDone++], end + rand() * 0.25);
      while (theirDone < Math.min(theirKilled[k], theirOrder.length)) explode(theirOrder[theirDone++], end + rand() * 0.25);
      tl.call(() => setHp([myHp[k], theirHp[k]]), undefined, end + 0.2);
    });
    const finish = START + rounds.length * ROUND + 0.4;
    // Retraite : les survivants de l'attaquant font demi-tour et filent.
    if (log?.retreated) {
      const fleet = iAttack ? myFleet : theirFleet;
      const dir = iAttack ? -1 : 1;
      fleet
        .filter((s) => s.alive)
        .forEach((s, i) => {
          tl.to(s.mesh.rotation, { y: s.mesh.rotation.y + Math.PI, duration: 0.6, ease: "power2.inOut" }, finish + i * 0.02);
          tl.to(s.mesh.position, { x: dir * 60, duration: 1.4, ease: "expo.in" }, finish + 0.5 + i * 0.02);
        });
    }
    tl.call(() => setEnded(true), undefined, finish + (log?.retreated ? 1.6 : 0.3));

    // Rendu : léger roulis des coques, caméra en orbite lente.
    let raf = 0;
    const clock = new THREE.Clock();
    const frame = () => {
      const t = clock.getElapsedTime();
      stars.rotation.y = t * 0.01;
      for (const [i, s] of [...myFleet, ...theirFleet].entries()) {
        if (!s.alive) continue;
        s.mesh.position.y += Math.sin(t * 1.3 + i) * 0.002;
        s.engine.material.opacity = 0.6 + Math.sin(t * 9 + i) * 0.25;
      }
      camera.position.set(Math.sin(cam.angle) * cam.dist, cam.height, Math.cos(cam.angle) * cam.dist);
      camera.lookAt(0, 0, 0);
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
      cancelAnimationFrame(raf);
      tinted.forEach((list) => list.forEach((m) => m.dispose()));
      ro.disconnect();
      tl.kill();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as { material?: THREE.Material | THREE.Material[] }).material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      glow.dispose();
    };
    };
    return () => {
      disposed = true;
      cleanup?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, log, perspective, myPower, opponentPower, myLossPercent, opponentLossPercent]);

  return (
    <div className="relative mt-3 overflow-hidden border border-cyan-glow/15 bg-space-950/60 hud-cut-sm">
      <div ref={host} className="relative h-60 w-full sm:h-72" aria-label="Replay du combat en 3D" role="img" />
      <span className="pointer-events-none absolute left-3 top-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-glow">Toi</span>
      <span className="pointer-events-none absolute right-3 top-2 font-mono text-[10px] uppercase tracking-[0.2em] text-danger-glow">Adversaire</span>
      {ended && <p className={cn("hud-title pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-3xl tracking-[0.3em]", bannerTone)}>{banner}</p>}
      <button type="button" onClick={() => setRun((n) => n + 1)} className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400 hover:text-cyan-glow">
        <RotateCcw className="h-3 w-3" /> Rejouer
      </button>
      <div className="grid grid-cols-2 gap-3 px-3 pb-1">
        {([0, 1] as const).map((i) => (
          <div key={i}>
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
              <span>Intégrité</span>
              <span className={i === 0 ? "text-cyan-glow" : "text-danger-glow"}>{Math.round(hp[i] * 100)} %</span>
            </div>
            <div className="mt-1 h-1.5 bg-white/5">
              <div className={cn("h-full transition-[width] duration-500", i === 0 ? "bg-cyan-glow" : "bg-danger-glow")} style={{ width: `${Math.max(0, hp[i]) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {/* Crédit exigé par la licence CC-BY du modèle de mastjie. */}
      <p className="px-3 pb-1.5 text-right text-[9px] text-slate-600">
        Modèles : Spaceship by Quaternius (CC0) · Spaceship by mastjie [CC-BY] via{" "}
        <a href="https://poly.pizza" target="_blank" rel="noreferrer" className="hover:text-slate-400">
          Poly Pizza
        </a>
      </p>
    </div>
  );
}

export default CombatScene3D;
