import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ResourceIcon } from "@/components/ui/game-icon";
import { CANCEL_RULES, quoteCancel, type CancelTarget } from "@/game/cancel";
import { cancelJob, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { cn, formatCompact } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/* v4.7 : bouton « Annuler » d'un chantier, avec le remboursement exact affiché avant de confirmer. */

export function CancelJobButton({ target, className, compact }: { target: CancelTarget; className?: string; compact?: boolean }) {
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  if (!player || !queues) return null;

  let quote: ReturnType<typeof quoteCancel> | null = null;
  try {
    quote = quoteCancel(player, queues, target, now);
  } catch {
    quote = null;
  }

  const confirm = async () => {
    setBusy(true);
    try {
      const done = await cancelJob(target);
      toast.success("Chantier annulé", { description: `${done.label} : ressources remboursées.` });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Annulation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const entries = quote ? (Object.entries(quote.refund) as [ResourceId, number][]) : [];
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        title="Annuler et récupérer une partie des ressources"
        className={cn("text-slate-400 hover:text-danger-glow", compact ? "h-6 px-1.5 text-[10px]" : "h-7 px-2 text-xs", className)}
        onClick={() => {
          setNow(Date.now());
          setOpen(true);
        }}
      >
        <X className="mr-1 h-3.5 w-3.5" /> Annuler
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Annuler le chantier ?</DialogTitle>
          {quote ? (
            <>
              <DialogDescription>{quote.label}</DialogDescription>
              <div className="mt-3 border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs text-slate-400">Remboursement ({Math.round(quote.fraction * 100)} % du coût)</p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-100">
                  {entries.length === 0 ? "rien" : entries.map(([r, n]) => (
                    <span key={r} className="inline-flex items-center gap-1">
                      <ResourceIcon id={r} className="h-4 w-4" /> {formatCompact(n)}
                    </span>
                  ))}
                </p>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                100 % dans la première minute ou pour ce qui n'a pas commencé, sinon {Math.round(CANCEL_RULES.refundPct * 100)} % de la part non écoulée. Le montant exact est
                recalculé au moment de la confirmation.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Continuer
                </Button>
                <Button variant="danger" disabled={busy} onClick={() => void confirm()}>
                  Oui, annuler
                </Button>
              </div>
            </>
          ) : (
            <DialogDescription>Ce chantier vient de se terminer.</DialogDescription>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
