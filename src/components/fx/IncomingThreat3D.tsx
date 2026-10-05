import { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadModels, themeColor } from "@/components/fx/scene3d";

/* 5.23 : mini-scène 3D d'une attaque entrante : la flotte hostile approche de
   ta planète au rythme du compte à rebours (position = temps écoulé sur 5 min),
   bouclier planétaire qui pulse. Chargée à la demande par l'alerte de raid. */

export interface IncomingThreat3DProps {
  /** Nombre de vaisseaux affichés (borné à 18). */
  ships: number;
  /** Arrivée prévue (ms) et fenêtre de l'alerte (ms). */
  arriveAtMs: number;
  windowMs: number;
  onUnsupported?: () => void;
}

export function IncomingThreat3D({ ships, arriveAtMs, windowMs, onUnsupported }: IncomingThreat3DProps) {
  const host = useRef<HTMLDivElement>(null);
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
    const width = () => el.clientWidth || 360;
    const height = () => el.clientHeight || 160;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width(), height());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width() / height(), 0.1, 200);
    camera.position.set(-2, 4, 22);
    camera.lookAt(2, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-8, 6, 10);
    scene.add(sun);

    const accent = themeColor("--color-cyan-glow", "rgb(80,200,255)");
    const danger = themeColor("--color-danger-glow", "rgb(255,80,80)");
    const planet = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 3), new THREE.MeshStandardMaterial({ color: accent.clone().multiplyScalar(0.55), flatShading: true, roughness: 0.9 }));
    planet.position.set(8, -0.5, 0);
    scene.add(planet);
    const shield = new THREE.Mesh(new THREE.SphereGeometry(4.1, 32, 16), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
    shield.position.copy(planet.position);
    scene.add(shield);

    const fleet = new THREE.Group();
    scene.add(fleet);
    const count = Math.max(1, Math.min(18, Math.round(ships)));
    const hostileMat = new THREE.MeshStandardMaterial({ color: danger, emissive: danger, emissiveIntensity: 0.25, flatShading: true, metalness: 0.3, roughness: 0.5 });
    let disposed = false;
    void loadModels().then((models) => {
      if (disposed) return;
      const model = models.mastjie ?? models.quaternius;
      for (let i = 0; i < count; i++) {
        const o = model ? model.clone(true) : new THREE.Mesh(new THREE.ConeGeometry(0.3, 1, 5).rotateZ(-Math.PI / 2), hostileMat);
        if (model) {
          o.scale.multiplyScalar(1.1);
          o.traverse((n) => {
            const m = n as THREE.Mesh;
            if (m.isMesh) m.material = hostileMat;
          });
        }
        o.position.set(-(i % 3) * 1.4 - Math.floor(i / 9) * 1.2, ((i % 6) - 2.5) * 0.8, (Math.floor(i / 3) % 3 - 1) * 1.2);
        fleet.add(o);
      }
    });

    let raf = 0;
    const clock = new THREE.Clock();
    const frame = () => {
      const t = clock.getElapsedTime();
      const left = Math.max(0, arriveAtMs - Date.now());
      const progress = 1 - Math.min(1, left / Math.max(1, windowMs));
      // De la bordure gauche jusqu'au bouclier.
      fleet.position.x = -14 + progress * 16 + Math.sin(t * 0.8) * 0.15;
      fleet.position.y = Math.sin(t * 1.1) * 0.2;
      planet.rotation.y = t * 0.15;
      (shield.material as THREE.MeshBasicMaterial).opacity = 0.1 + (0.08 + progress * 0.14) * (0.5 + 0.5 * Math.sin(t * (2 + progress * 4)));
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
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      hostileMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une scène par flotte
  }, [arriveAtMs, ships]);

  return <div ref={host} className="relative h-36 w-full overflow-hidden border border-danger-glow/25 bg-space-950/60" role="img" aria-label="Flotte hostile en approche" />;
}

export default IncomingThreat3D;
