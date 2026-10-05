import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HudTone } from "@/components/ui/hud";
import { cn } from "@/lib/utils";

/* 5.15.9 : cadre de carte commun (docs/DESIGN.md) : titre en capitales mono
   avec son icône, information clé à droite, contenu dessous. Né au casino,
   utilisé aussi par Primes, Seigneurs, Hall of fame, Palmarès et Alliance. */

const TITLE_TONE: Record<HudTone | "muted", string> = {
  muted: "text-slate-500",
  neutral: "text-slate-400",
  accent: "text-cyan-glow",
  mint: "text-mint-glow",
  ember: "text-ember-glow",
  danger: "text-danger-glow",
  gold: "text-gold-glow",
  violet: "text-violet-glow",
};

export function HudPanel({
  icon,
  title,
  tone = "muted",
  aside,
  accent,
  className,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  tone?: HudTone | "muted";
  /** Information clé ou actions, alignées à droite du titre. */
  aside?: ReactNode;
  /** Liseré doré en haut (carte mise en avant). */
  accent?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Card className={cn("hud-panel flex flex-col gap-3 p-4", accent && "border-t-2 border-t-gold-glow", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={cn("hud-panel-title hud-eyebrow flex min-w-0 items-center gap-2 text-[10px] [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0", TITLE_TONE[tone])}>
          {icon}
          <span className="min-w-0">{title}</span>
        </h2>
        {aside && <div className="ml-auto flex flex-wrap items-center gap-2">{aside}</div>}
      </div>
      {children}
    </Card>
  );
}

/** 5.15.9 : bouton d'action d'un état vide (une page où aller pour en sortir). */
export function EmptyAction({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button asChild size="sm" variant="ghost">
      <Link to={to}>
        {children} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}

/** 5.15.12 : bouton « Afficher plus » en bas d'une liste par tranches. */
export function ShowMoreButton({ more, step, onClick }: { more: number; step: number; onClick: () => void }) {
  if (more <= 0) return null;
  return (
    <Button variant="ghost" size="sm" className="self-center" onClick={onClick}>
      Afficher {Math.min(more, step)} de plus <span className="font-mono text-[10px] text-slate-500">({more} restant{more > 1 ? "s" : ""})</span>
    </Button>
  );
}

/** 5.21.2 : pagination « Précédent / Suivant » (20 par page par défaut). Rien si une seule page. */
export const PAGE_SIZE = 20;
export function Pager({ page, total, size = PAGE_SIZE, onPage }: { page: number; total: number; size?: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const p = Math.min(page, pages - 1);
  return (
    <nav className="flex items-center justify-between gap-2 pt-2" aria-label="Pagination">
      <Button variant="ghost" size="sm" disabled={p <= 0} onClick={() => onPage(p - 1)}>
        ← Précédent
      </Button>
      <span className="font-mono text-[11px] text-slate-400">
        {p * size + 1}–{Math.min(total, (p + 1) * size)} sur {total} · page {p + 1} / {pages}
      </span>
      <Button variant="ghost" size="sm" disabled={p >= pages - 1} onClick={() => onPage(p + 1)}>
        Suivant →
      </Button>
    </nav>
  );
}
