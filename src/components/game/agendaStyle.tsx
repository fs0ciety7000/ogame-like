import { Gift, MessageCircle, ScrollText, Skull, Sparkles, Swords, Trophy, type LucideIcon } from "lucide-react";
import type { AgendaKind } from "@/game/agenda";

/* 6.14.82 (UX-9, AD-15, AD-16) : une catégorie de l'agenda se reconnaît à son icône et à son libellé, plus à une
   couleur de sens (le boss mondial était rouge comme une menace, le concours vert comme un bon point). Tout l'agenda
   est en violet, le second accent des événements (DESIGN.md). `AGENDA_COLORS` (moteur) reste au planificateur de l'admin. */
export const AGENDA_TONE = "var(--color-violet-glow)";

export const AGENDA_ICONS: Record<AgendaKind, LucideIcon> = {
  leviathan: Skull,
  seasonboss: Swords,
  event: Sparkles,
  chronicle: ScrollText,
  season: Trophy,
  contest: Gift,
  room: MessageCircle,
};

/** Icône de la catégorie, en violet (taille par `className`). */
export function AgendaIcon({ kind, className }: { kind: AgendaKind; className?: string }) {
  const Icon = AGENDA_ICONS[kind];
  return <Icon aria-hidden className={className ?? "h-3.5 w-3.5 shrink-0 text-violet-glow"} />;
}
