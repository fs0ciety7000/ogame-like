import { assetUrl } from "@/lib/assets";
import { KESH } from "@/game/bounties";
import { cn, formatNumber } from "@/lib/utils";

/** Image de l'Ambre de Ruche (monnaie des Kesh'Vaar), alignée sur le texte. */
export function AmberIcon({ className }: { className?: string }) {
  return <img src={assetUrl(KESH.amberIcon)} alt="Ambre" className={cn("inline-block h-4 w-4 object-contain align-[-0.2em]", className)} />;
}

/** Montant d'ambre : image + nombre (+ « Ambre » si `label`). */
export function AmberAmount({ value, label = true, className }: { value: number; label?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", className)}>
      <AmberIcon />
      {formatNumber(value)}
      {label && " Ambre"}
    </span>
  );
}
