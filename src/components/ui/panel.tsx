import { useEffect, useRef, useState, type ReactNode } from "react";
import { cascade, scramble } from "@/lib/fx/uiFx";
import { usePageSize } from "@/lib/pageSize";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
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
  // 5.25 : un titre texte se décode à l'apparition du panneau.
  const titleRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof title === "string" && titleRef.current) void scramble(titleRef.current, title, 0.45);
  }, [title]);
  return (
    <Card className={cn("hud-panel flex flex-col gap-3 p-4", accent && "border-t-2 border-t-gold-glow", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={cn("hud-panel-title hud-eyebrow flex min-w-0 items-center gap-2 text-[10px] [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0", TITLE_TONE[tone])}>
          {icon}
          {typeof title === "string" ? (
            <span ref={titleRef} key={title} className="min-w-0">
              {title}
            </span>
          ) : (
            <span className="min-w-0">{title}</span>
          )}
        </h2>
        {aside && <div className="ml-auto flex flex-wrap items-center gap-2">{aside}</div>}
      </div>
      {children}
    </Card>
  );
}

/* 5.26 : section repliable des longues pages (Commandement, Galaxie…). L'état
   ouvert/fermé est mémorisé sur l'appareil quand `id` est fourni. */
const FOLD_KEY = "cosmic-empires:folds";
function readFolds(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(FOLD_KEY) ?? "{}") as unknown;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function FoldSection({
  id,
  title,
  aside,
  tone = "muted",
  defaultOpen = true,
  className,
  children,
}: {
  id?: string;
  title: ReactNode;
  aside?: ReactNode;
  tone?: HudTone | "muted";
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => (id ? (readFolds()[id] ?? defaultOpen) : defaultOpen));
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!id) return;
    try {
      localStorage.setItem(FOLD_KEY, JSON.stringify({ ...readFolds(), [id]: next }));
    } catch {
      /* stockage indisponible : état gardé pour la session */
    }
  };
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-1.5">
        <button type="button" onClick={toggle} aria-expanded={open} className={cn("hud-hit hud-eyebrow flex min-w-0 items-center gap-2 text-[10px] transition-colors hover:text-cyan-glow", TITLE_TONE[tone])}>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", !open && "-rotate-90")} aria-hidden />
          <span className="flex min-w-0 items-center gap-2 text-left [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0">{title}</span>
        </button>
        {aside && <div className="ml-auto flex flex-wrap items-center gap-2">{aside}</div>}
      </div>
      {open && children}
    </section>
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

/** 5.24 : liste découpée en pages (taille choisie dans les Réglages) ; la page revient en arrière si la liste rétrécit. */
export function usePaged<T>(items: T[], sizeOverride?: number, resetKey?: unknown) {
  // 5.25 : taille de page choisie par le joueur (Réglages, 5 par défaut).
  const pref = usePageSize();
  const size = sizeOverride ?? pref;
  const [page, setPage] = useState(0);
  // Nouveau filtre ou nouvelle recherche : retour en page 1.
  useEffect(() => {
    setPage(0);
  }, [resetKey, size]);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(page, pages - 1);
  return {
    items: items.slice(p * size, (p + 1) * size),
    /** Rang du premier élément de la page (pour les index globaux). */
    offset: p * size,
    /** Aller à la page qui contient l'élément d'indice `index`. */
    showIndex: (index: number) => setPage(Math.max(0, Math.floor(index / size))),
    pager: { page: p, total: items.length, size, onPage: setPage },
  };
}

/** 5.24 : liste paginée prête à poser (conteneur + pagination). `key` sur le filtre pour revenir en page 1. */
export function PagedList<T>({ items, size, className, render, as: Tag = "div" }: { items: T[]; size?: number; className?: string; render: (item: T, index: number) => ReactNode; as?: "div" | "ul" | "ol" }) {
  const pg = usePaged(items, size);
  // 5.25 : en changeant de page, les éléments arrivent en cascade.
  const ref = useRef<HTMLElement>(null);
  const firstPage = useRef(true);
  useEffect(() => {
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    if (ref.current) void cascade(ref.current.children);
  }, [pg.pager.page]);
  return (
    <>
      <Tag ref={ref as never} className={className}>{pg.items.map((it, i) => render(it, pg.offset + i))}</Tag>
      <Pager {...pg.pager} />
    </>
  );
}
