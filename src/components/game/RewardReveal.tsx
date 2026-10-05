import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* 5.15.12 : révélation de récompense commune (coffre de série, rapport de
   saison, fin de chapitre, catégorie du Codex, palier du passe) : un sceau
   qui s'ouvre, un éclat doré, puis les gains un à un. Sans animation si le
   joueur a demandé de les réduire. */

/** Classes écrites en entier (Tailwind ne voit pas les noms construits). */
const TONES = {
  gold: { top: "border-t-gold-glow", seal: "border-gold-glow/50 bg-gold-glow/10 text-gold-glow", tile: "border-gold-glow/20 bg-gold-glow/[0.04]", flare: "bg-gold-glow/20" },
  accent: { top: "border-t-cyan-glow", seal: "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow", tile: "border-cyan-glow/20 bg-cyan-glow/[0.04]", flare: "bg-cyan-glow/20" },
  mint: { top: "border-t-mint-glow", seal: "border-mint-glow/50 bg-mint-glow/10 text-mint-glow", tile: "border-mint-glow/20 bg-mint-glow/[0.04]", flare: "bg-mint-glow/20" },
};

export interface RevealItem {
  key: string;
  node: ReactNode;
}

export function RewardReveal({
  open,
  onClose,
  icon,
  title,
  description,
  items,
  footer,
  closeLabel = "Récupéré",
  tone = "gold",
}: {
  open: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  items: RevealItem[];
  footer?: ReactNode;
  closeLabel?: string;
  tone?: "gold" | "accent" | "mint";
}) {
  const reduce = useReducedMotion();
  const t = TONES[tone];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <DialogContent className={cn("max-w-md border-t-2", t.top)}>
          <div className="relative flex flex-col items-center gap-3 text-center">
            {!reduce && (
              <motion.span
                aria-hidden
                className={cn("pointer-events-none absolute -top-6 h-40 w-40", t.flare)}
                style={{ clipPath: "polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)" }}
                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                animate={{ scale: [0, 1.3, 1], rotate: 45, opacity: [0, 1, 0.5] }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            )}
            <motion.span
              className={cn("hud-cut relative grid h-16 w-16 place-items-center border [&_svg]:h-8 [&_svg]:w-8", t.seal)}
              initial={reduce ? false : { scale: 0.7, rotate: 0 }}
              animate={reduce ? undefined : { scale: [0.7, 1, 1, 1.08, 1], rotate: [0, -10, 10, -6, 0] }}
              transition={{ duration: 0.7 }}
              aria-hidden
            >
              {icon}
            </motion.span>
            <DialogTitle className="hud-title relative text-lg text-white">{title}</DialogTitle>
            {description && <DialogDescription className="relative text-xs text-slate-400">{description}</DialogDescription>}
            {items.length > 0 && (
              <div className="relative grid w-full grid-cols-2 gap-1.5">
                {items.map((it, i) => (
                  <motion.div
                    key={it.key}
                    className={cn("hud-cut-sm flex items-center justify-center border px-2 py-2", t.tile)}
                    initial={reduce ? false : { opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: reduce ? 0 : 0.5 + i * 0.15 }}
                  >
                    {it.node}
                  </motion.div>
                ))}
              </div>
            )}
            {footer}
            <Button className="relative mt-1" onClick={onClose}>
              {closeLabel}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
