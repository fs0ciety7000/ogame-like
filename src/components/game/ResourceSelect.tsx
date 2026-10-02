import type { ReactNode } from "react";
import { IconSelect, type IconSelectOption } from "@/components/ui/icon-select";
import { ResourceIcon } from "@/components/ui/game-icon";
import { RESOURCE_LIST } from "@/game/resources";
import type { ResourceId } from "@/types/game";

const ALL = "__all__";

/** Choix d'une ressource, avec ses vraies icônes. `allLabel` ajoute une
 *  entrée « toutes » (valeur vide) ; `hint` affiche une info par ressource. */
export function ResourceSelect<T extends string = ResourceId>({
  value,
  onChange,
  ariaLabel,
  className,
  size,
  allLabel,
  only,
  hint,
}: {
  value: T | "";
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
  allLabel?: string;
  only?: string[];
  hint?: (id: ResourceId) => ReactNode;
}) {
  const options: IconSelectOption<T>[] = [
    // Radix n'accepte pas de valeur vide : « toutes » passe par une clé dédiée.
    ...(allLabel ? [{ value: ALL as T, label: allLabel }] : []),
    ...RESOURCE_LIST.filter((r) => !only || only.includes(r.id)).map((r) => ({
      value: r.id as T,
      label: r.name,
      icon: <ResourceIcon id={r.id} />,
      hint: hint?.(r.id as ResourceId),
    })),
  ];
  return (
    <IconSelect
      value={value === "" && allLabel ? (ALL as T) : value}
      onChange={(v) => onChange(v === ALL ? ("" as T) : v)}
      options={options}
      ariaLabel={ariaLabel}
      className={className}
      size={size}
    />
  );
}
