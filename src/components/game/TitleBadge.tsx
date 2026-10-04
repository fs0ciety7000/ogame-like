import { cn } from "@/lib/utils";
import { titleStyle } from "@/game/titles";

/** v5.10 : titre affiché avec la couleur de sa rareté et son icône (catalogue des titres). */
export function TitleBadge({ label, className, size = "sm" }: { label: string; className?: string; size?: "xs" | "sm" }) {
  const s = titleStyle(label);
  return (
    <span
      title={s.description ? `${s.rarity ? `${s.rarity} — ` : ""}${s.description}` : undefined}
      className={cn("inline-flex items-center gap-1 border", size === "xs" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-xs", className)}
      style={{ color: s.color, borderColor: `${s.color}59`, background: `${s.color}10` }}
    >
      <span aria-hidden>{s.icon}</span> {label}
    </span>
  );
}
