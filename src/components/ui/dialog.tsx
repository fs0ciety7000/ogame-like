import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

/** v4.5 : poignée des fenêtres en tiroir (mobile). Glisser vers le bas
 *  au-delà de 90 px ferme la fenêtre. */
function SheetHandle({ onDrag, closeRef }: { onDrag: (dy: number) => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  const start = React.useRef<number | null>(null);
  return (
    <div
      aria-hidden
      className="-mx-4 -mt-4 mb-2 flex touch-none justify-center pb-2 pt-3 sm:hidden"
      onPointerDown={(e) => {
        start.current = e.clientY;
        (e.target as Element).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current !== null) onDrag(Math.max(0, e.clientY - start.current));
      }}
      onPointerUp={(e) => {
        const dy = start.current === null ? 0 : e.clientY - start.current;
        start.current = null;
        onDrag(0);
        if (dy > 90) closeRef.current?.click();
      }}
      onPointerCancel={() => {
        start.current = null;
        onDrag(0);
      }}
    >
      <span className="h-1 w-10 bg-white/25" />
    </div>
  );
}

export function DialogContent({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const [drag, setDrag] = React.useState(0);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
      <DialogPrimitive.Content
        className={cn(
          // !fixed : .glass-panel pose position:relative (pour son ::before
          // décoratif) ; sur ce même élément, à spécificité égale et définie
          // plus loin dans la feuille de style, elle écraserait sinon le
          // position:fixed de Tailwind, faisant sortir la modale du viewport
          // (seul le fond flou de l'overlay resterait visible).
          "!fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 glass-panel hud-cut p-6 focus:outline-none max-h-[85vh] overflow-y-auto [animation-iteration-count:1]",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          // v4.5 : sur mobile, la fenêtre devient un tiroir qui monte du bas.
          "max-sm:!top-auto max-sm:!bottom-0 max-sm:!translate-y-0 max-sm:!w-full max-sm:!max-w-none max-sm:!max-h-[88vh] max-sm:!px-4 max-sm:!pt-4 max-sm:!pb-[calc(env(safe-area-inset-bottom)+1.25rem)]",
          "max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=open]:slide-in-from-bottom-1/2",
          className,
        )}
        style={drag ? { ...style, transform: `translate(-50%, ${drag}px)`, transition: "none" } : style}
        {...props}
      >
        <SheetHandle onDrag={setDrag} closeRef={closeRef} />
        {children}
        <DialogPrimitive.Close ref={closeRef} aria-label="Fermer" className="hud-cut-sm absolute right-4 top-4 p-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/60">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-display text-lg text-slate-100 glow-text tracking-wide", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-slate-400", className)} {...props} />;
}
