import { lazy, Suspense, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { HoloCylinderProps } from "@/components/fx/HoloCylinder";
import { cn } from "@/lib/utils";

/* 5.24 : cylindre holographique chargé à la demande (three.js hors du paquet principal).
   Sans WebGL ou avec les animations réduites, on rend `fallback` (souvent rien, ou la grille). */

const HoloCylinder = lazy(() => import("@/components/fx/HoloCylinder"));

let webgl: boolean | null = null;
/** Test une seule fois par session, contexte libéré aussitôt (le navigateur en limite le nombre). */
export function hasWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    webgl = !!gl;
  } catch {
    webgl = false;
  }
  return webgl;
}

export function HoloCylinderLazy({ fallback = null, ...props }: HoloCylinderProps & { fallback?: ReactNode }) {
  const still = useReducedMotion() ?? false;
  const [off, setOff] = useState(() => !hasWebGL());
  if (still || off) return <>{fallback}</>;
  return (
    <Suspense fallback={<div className={cn("animate-pulse border border-cyan-glow/10 bg-space-950/40", props.className)} />}>
      <HoloCylinder
        {...props}
        onUnsupported={() => {
          setOff(true);
          props.onUnsupported?.();
        }}
      />
    </Suspense>
  );
}
