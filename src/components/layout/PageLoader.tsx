import { Bone } from "@/components/ui/skeleton";

/** Squelette de page pendant le chargement d'un écran : en-tête, rangée de
 *  cartes et bloc de contenu qui scintillent, à la place d'un simple spinner. */

export function PageLoader() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement">
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-40" />
        <Bone className="h-7 w-64" />
        <Bone className="h-3 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Bone className="h-56" />
        <Bone className="h-56 lg:col-span-2" />
      </div>
    </div>
  );
}
