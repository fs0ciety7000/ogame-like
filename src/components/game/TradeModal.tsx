import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { RadarScan } from "@/components/game/RadarScan";
import { RESOURCE_LIST } from "@/game/resources";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { GameActionError, sendResourceGift } from "@/services/playerService";
import type { ResourceId, Resources } from "@/types/game";
import { ResourceIcon } from "@/components/ui/game-icon";

export function TradeModal({
  target,
  onClose,
}: {
  target: { uid: string; pseudo: string } | null;
  onClose: () => void;
}) {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);
  const [amounts, setAmounts] = useState<Partial<Resources>>({});
  const [submitting, setSubmitting] = useState(false);

  const setQty = (id: ResourceId, owned: number, value: number) => {
    const clamped = Math.max(0, Math.min(owned, value));
    setAmounts((a) => ({ ...a, [id]: clamped }));
  };

  const handleConfirm = async () => {
    if (!uid || !player || !target) return;
    setSubmitting(true);
    try {
      await sendResourceGift({
        fromUid: uid,
        fromPseudo: player.pseudo,
        toUid: target.uid,
        toPseudo: target.pseudo,
        resources: amounts,
      });
      toast.success(`Ressources envoyées à ${target.pseudo} !`);
      setAmounts({});
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Envoi impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent>
          <DialogTitle>Envoyer des ressources</DialogTitle>
          <p className="text-sm text-slate-400">
            Destinataire : <strong className="text-slate-200">{target.pseudo}</strong>
          </p>

          {!player || submitting ? (
            <RadarScan label={submitting ? "Envoi en cours…" : "Chargement…"} />
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {RESOURCE_LIST.map((res) => {
                  const owned = player.resources[res.id] ?? 0;
                  return (
                    <div key={res.id} className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-sm">
                      <span className="flex-1 text-slate-200">
                        <ResourceIcon id={res.id} /> {res.name}
                      </span>
                      <span className="text-xs text-slate-500">Possédé : {owned}</span>
                      <NumberInput
                        size="sm"
                        max={owned}
                        disabled={owned === 0}
                        value={amounts[res.id] ?? 0}
                        onChange={(v) => setQty(res.id, owned, v)}
                        aria-label={`Quantité ${res.name}`}
                        className="w-44"
                      />
                    </div>
                  );
                })}
              </div>

              <Button className="mt-4 w-full" onClick={() => void handleConfirm()}>
                Envoyer
              </Button>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
