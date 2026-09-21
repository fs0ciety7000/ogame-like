import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RESOURCE_LIST } from "@/game/resources";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { GameActionError, sendResourceGift } from "@/services/playerService";
import type { ResourceId, Resources } from "@/types/game";

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
      {target && player && (
        <DialogContent>
          <DialogTitle>Envoyer des ressources</DialogTitle>
          <p className="text-sm text-slate-400">
            Destinataire : <strong className="text-slate-200">{target.pseudo}</strong>
          </p>

          <div className="mt-4 space-y-2">
            {RESOURCE_LIST.map((res) => {
              const owned = player.resources[res.id] ?? 0;
              return (
                <div key={res.id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-slate-200">
                    {res.emoji} {res.name}
                  </span>
                  <span className="text-xs text-slate-500">Possédé : {owned}</span>
                  <Input
                    type="number"
                    min={0}
                    max={owned}
                    disabled={owned === 0}
                    value={amounts[res.id] ?? 0}
                    onChange={(e) => setQty(res.id, owned, parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
              );
            })}
          </div>

          <Button className="mt-4 w-full" disabled={submitting} onClick={() => void handleConfirm()}>
            {submitting ? "Envoi…" : "Envoyer"}
          </Button>
        </DialogContent>
      )}
    </Dialog>
  );
}
