import { importWithRetry } from "@/lib/updateReload";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { HoloCylinderProps } from "@/components/fx/HoloCylinder";
import { cn } from "@/lib/utils";

/* 5.24 : cylindre holographique chargé à la demande (three.js hors du paquet principal).
   Sans WebGL ou avec les animations réduites, on rend `fallback` (souvent rien, ou la grille). */

const HoloCylinder = lazy(() => importWithRetry(() => import("@/components/fx/HoloCylinder")));

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

/** 6.14.39 : décor 3D facultatif (fond de l'accueil) : seulement sur grand écran à souris, sans économie de données, et une fois la page
 *  chargée et le navigateur au repos. Sur mobile, three.js (≈ 155 Ko compressés) bloquait le processeur une dizaine de secondes. */
export function useDeferredDecor(query = "(min-width: 1024px) and (pointer: fine)"): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (saveData || !window.matchMedia(query).matches) return;
    let cancelled = false;
    let idle = 0;
    const start = () => {
      const go = () => {
        if (!cancelled) setReady(true);
      };
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 3000 });
      else idle = setTimeout(go, 1500) as unknown as number;
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      clearTimeout(idle);
    };
  }, [query]);
  return ready;
}
