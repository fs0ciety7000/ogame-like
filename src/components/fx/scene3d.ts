import * as THREE from "three";
import { assetUrl } from "@/lib/assets";

/* 5.23 : utilitaires communs aux scènes 3D (replay de combat, attaque entrante) :
   couleurs du thème et modèles de vaisseaux (chargés une fois). */

/** Couleur d'un jeton CSS du thème (oklch, color-mix…) ramenée en RVB via un pixel de canvas. */
export function themeColor(token: string, fallback: string): THREE.Color {
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

export type ModelId = "quaternius" | "mastjie";
/** Axe avant connu du modèle ; « auto » : détection (axe le plus long, extrémité la plus étroite).
 *  mastjie est un chasseur à cockpit sphérique et ailes hexagonales : son axe le plus long est la
 *  hauteur des ailes, le hublot regarde vers +z. */
const MODEL_FORWARD: Record<ModelId, "auto" | "+z"> = { quaternius: "auto", mastjie: "+z" };

let modelsPromise: Promise<Partial<Record<ModelId, THREE.Object3D>>> | null = null;

/** Charge les deux modèles une fois (4 s au plus chacun) ; un modèle absent laisse la silhouette procédurale. */
export function loadModels(): Promise<Partial<Record<ModelId, THREE.Object3D>>> {
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
