import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";
import * as React from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { HUD_TONE, type HudTone } from "@/components/ui/hud";
import { cn } from "@/lib/utils";

/* 5.15 : fenêtre de confirmation du HUD, à la place de window.confirm
   (boîte grise du navigateur, hors thème). Appel impératif :

     if (!(await askConfirm({ title: "Supprimer l'annonce ?", tone: "danger" }))) return;

   Un seul hôte (<ConfirmHost />, monté dans App) affiche la demande en cours. */

export type ConfirmOptions = {
  /** Question courte, en capitales dans la fenêtre. */
  title: ReactNode;
  /** Précision : conséquence, coût, délai. */
  message?: ReactNode;
  /** Bloc libre sous le message (coût, liste…). */
  details?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Mot à recopier avant de pouvoir confirmer (action irréversible de masse). */
  requireText?: string;
  /** accent : action courante ; ember : attention ; danger : perte, suppression ; gold : dépense de prestige. */
  tone?: HudTone;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let pending: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Ouvre la fenêtre et rend true si le joueur confirme. Une nouvelle
 *  demande annule la précédente (réponse false). */
export function askConfirm(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === "string" ? { title: options } : options;
  pending?.resolve(false);
  return new Promise((resolve) => {
    pending = { ...opts, resolve };
    emit();
  });
}

function settle(ok: boolean) {
  const p = pending;
  pending = null;
  emit();
  p?.resolve(ok);
}

const TONE_ICON: Partial<Record<HudTone, typeof HelpCircle>> = { danger: ShieldAlert, ember: AlertTriangle };
const TONE_BUTTON: Partial<Record<HudTone, "danger" | "warn">> = { danger: "danger", ember: "warn" };

export function ConfirmHost() {
  const current = React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pending,
  );
  // Garde le contenu pendant l'animation de fermeture.
  const [shown, setShown] = React.useState<Pending | null>(null);
  React.useEffect(() => {
    if (current) setShown(current);
  }, [current]);
  const view = current ?? shown;
  const [typed, setTyped] = React.useState("");
  React.useEffect(() => setTyped(""), [current]);
  const locked = !!view?.requireText && typed.trim() !== view.requireText;
  const tone = view?.tone ?? "accent";
  const Icon = TONE_ICON[tone] ?? HelpCircle;
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && settle(false)}>
      {view && (
        <DialogContent
          className="hud-dialog max-w-md"
          style={{ ["--c" as string]: HUD_TONE[tone] }}
          onOpenAutoFocus={(e) => {
            // Entrée confirme : le bouton principal (ou le champ à recopier) prend le focus.
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector<HTMLElement>("input, [data-confirm]")?.focus();
          }}
        >
          <div className="flex items-start gap-3 pr-6">
            <span className="hud-dialog-icon" aria-hidden>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="hud-title text-base text-slate-100">{view.title}</DialogTitle>
              {view.message ? (
                <DialogDescription className="mt-2 leading-relaxed text-slate-300">{view.message}</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">Confirmer ou annuler</DialogDescription>
              )}
            </div>
          </div>
          {view.details && <div className="mt-4 pl-11">{view.details}</div>}
          {view.requireText && (
            <label className="mt-4 block pl-11 text-xs text-slate-400">
              Tape <span className="font-mono text-slate-100">{view.requireText}</span> pour confirmer
              <Input
                className="mt-1.5 font-mono"
                autoComplete="off"
                spellCheck={false}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !locked && settle(true)}
              />
            </label>
          )}
          <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end")}>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm">
                {view.cancelLabel ?? "Annuler"}
              </Button>
            </DialogPrimitive.Close>
            <Button data-confirm size="sm" variant={TONE_BUTTON[tone] ?? "primary"} disabled={locked} onClick={() => settle(true)}>
              {view.confirmLabel ?? "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
