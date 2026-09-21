import { cn } from "@/lib/utils";

/** Réticule de ciblage qui apparaît au survol — à poser à l'intérieur d'un
 *  élément portant la classe `group` (ex: un bouton d'action). */
export function TargetReticle({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100",
        className,
      )}
      aria-hidden
    >
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <circle cx="15" cy="15" r="11" stroke={color} strokeWidth="1" opacity="0.6" />
        <line x1="15" y1="0" x2="15" y2="5" stroke={color} strokeWidth="1.5" />
        <line x1="15" y1="25" x2="15" y2="30" stroke={color} strokeWidth="1.5" />
        <line x1="0" y1="15" x2="5" y2="15" stroke={color} strokeWidth="1.5" />
        <line x1="25" y1="15" x2="30" y2="15" stroke={color} strokeWidth="1.5" />
      </svg>
    </span>
  );
}
