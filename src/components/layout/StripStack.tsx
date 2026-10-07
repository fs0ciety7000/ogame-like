import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* 6.14.62 (AD-2) : bandeaux du haut fusionnés sur téléphone. Chaque bandeau porte `data-strip` et reste un enfant
   direct de la pile : au-dessous de 768 px, seul le premier s'affiche (règle `.strip-stack` de index.css) et une
   ligne « +N bandeaux » déplie les autres. Au bureau, rien ne change : tous les bandeaux restent empilés. */
export function StripStack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setCount(el.querySelectorAll(":scope > [data-strip]").length);
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { childList: true });
    return () => obs.disconnect();
  }, []);
  const extra = count - 1;
  return (
    <div ref={ref} data-open={open || undefined} className="strip-stack relative z-30 shrink-0">
      {children}
      {extra > 0 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-end gap-1 border-b border-cyan-glow/10 bg-space-950 px-4 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 hover:text-slate-100 md:hidden"
        >
          {open ? "Réduire" : <span className="tabular-nums">{`+${extra} bandeau${extra > 1 ? "x" : ""}`}</span>}
          <ChevronDown aria-hidden className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
