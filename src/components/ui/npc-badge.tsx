import { Bot, Palmtree } from "lucide-react";
import { cn } from "@/lib/utils";

const CLIP = "[clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)]";

/** v4.2 : empire tenu par le jeu (seigneur de guerre). */
export function NpcBadge({ className }: { className?: string }) {
  return (
    <span
      title="Seigneur de guerre tenu par le jeu (PNJ) : pas de récompense de classement, mais pillable et prêt à riposter."
      className={cn(
        "inline-flex shrink-0 items-center gap-1 border border-ember-glow/60 bg-ember-glow/15 px-1.5 py-px font-mono text-[11px] font-bold uppercase leading-[1.5] tracking-[0.14em] text-ember-glow",
        CLIP,
        className,
      )}
    >
      <Bot className="h-3 w-3" />
      PNJ
    </span>
  );
}

/** v4.2 : joueur en vacances (inattaquable). */
export function VacationBadge({ untilMs, className }: { untilMs: number; className?: string }) {
  const days = Math.max(1, Math.ceil((untilMs - Date.now()) / 86_400_000));
  return (
    <span
      title={`En vacances encore ${days} jour${days > 1 ? "s" : ""} : impossible de l'attaquer.`}
      className={cn("inline-flex shrink-0 items-center gap-1 border border-cyan-glow/50 bg-cyan-glow/10 px-1.5 py-px font-mono text-[11px] font-bold uppercase leading-[1.5] tracking-[0.14em] text-cyan-glow", CLIP, className)}
    >
      <Palmtree className="h-3 w-3" />
      Vacances
    </span>
  );
}
