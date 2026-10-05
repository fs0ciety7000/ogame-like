import { cn } from "@/lib/utils";

/* 5.15.9 : squelettes aux formes HUD (coin coupé, pas d'arrondi) pendant un
   chargement, à la place d'un « Chargement… » ou d'un écran vide. */

export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton-bone hud-cut-sm", className)} />;
}

/** Liste : une rangée par ligne attendue (icône, libellé, valeur à droite). */
export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="h-7 w-7 shrink-0" />
          <Bone className={cn("h-3", ["w-2/3", "w-1/2", "w-3/5", "w-2/5"][i % 4])} />
          <Bone className="ml-auto h-3 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Grille de cartes (pages en tuiles). */
export function SkeletonCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)} aria-busy="true" aria-label="Chargement">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="glass-panel hud-cut flex flex-col gap-2 p-4">
          <Bone className="h-3 w-24" />
          <Bone className="h-6 w-2/3" />
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}
