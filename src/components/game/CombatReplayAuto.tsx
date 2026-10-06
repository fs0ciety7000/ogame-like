import { importWithRetry } from "@/lib/updateReload";
import { lazy, Suspense, useState, type ComponentProps } from "react";
import { useReducedMotion } from "framer-motion";
import { CombatReplay } from "@/components/game/CombatReplay";

/* 5.22.1 : replay 3D (three.js + GSAP, chargé à la demande) ; replay 2D si WebGL manque
   ou si le joueur a réduit les animations. */
const CombatScene3D = lazy(() => importWithRetry(() => import("@/components/fx/CombatScene3D")));

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function CombatReplayAuto(props: ComponentProps<typeof CombatReplay>) {
  const still = useReducedMotion() ?? false;
  const [fallback, setFallback] = useState(() => !webglAvailable());
  if (still || fallback) return <CombatReplay {...props} />;
  return (
    <Suspense fallback={<div className="mt-3 h-72 animate-pulse border border-cyan-glow/10 bg-space-950/60" />}>
      <CombatScene3D {...props} onUnsupported={() => setFallback(true)} />
    </Suspense>
  );
}
