import { Sparkles } from "lucide-react";
import { ASCENSION_INSIGNIA, ASCENSION_RULES, ascensionCount, ascensionLabel } from "@/game/ascension";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* 6.14.157 (R4b) : sorti d'`AscensionCard.tsx` (fenêtre d'ascension, saisie, confirmation) : la carte du commandant du menu
   (coque du jeu) n'affiche que les insignes. */

/** Insigne d'ascension (v3.4, 5.15) ; 5.15.13 : l'insigne généré répété une fois par
 *  ascension (Ascension II = 2 insignes, jusqu'à 5), sans étoile en doublon.
 *  `full` montre tous les emplacements (`maxAscensions`, 10 après la bascule du rythme ; ceux à venir en grisé) et
 *  « Ascension III ». 6.14.88 : les emplacements passent à la ligne sur mobile. */
export function AscensionStars({ count, full, className }: { count?: number; full?: boolean; className?: string }) {
  const n = ascensionCount({ ascensions: count });
  if (n <= 0) return null;
  const label = ascensionLabel(n);
  const slots = full ? ASCENSION_RULES.maxAscensions : n;
  const size = full ? "h-7 w-7" : "h-5 w-5";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-gold-glow", full && "flex-wrap", className)} title={`${label} sur ${ASCENSION_RULES.maxAscensions}`} aria-label={label}>
      <span className={cn("inline-flex items-center", full ? "flex-wrap gap-0.5" : "-space-x-1.5")}>
        {Array.from({ length: slots }, (_, i) =>
          ASCENSION_INSIGNIA ? (
            <img key={i} src={assetUrl(ASCENSION_INSIGNIA)} alt="" className={cn(size, "object-contain", i >= n && "opacity-25 grayscale")} />
          ) : (
            <Sparkles key={i} className={cn(full ? "h-4 w-4" : "h-3.5 w-3.5", i >= n && "text-slate-600")} />
          ),
        )}
      </span>
      {full && <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{label}</span>}
    </span>
  );
}
