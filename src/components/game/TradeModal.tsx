import { useState } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { RadarScan } from "@/components/game/RadarScan";
import { RESOURCE_LIST } from "@/game/resources";
import { GIFT_RULES, giftAgeBlock, giftDeliveryRate } from "@/game/actions";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { GameActionError, sendResourceGift } from "@/services/playerService";
import type { ResourceId, Resources } from "@/types/game";
import { ResourceIcon } from "@/components/ui/game-icon";

/** v5.10 : règles affichées avant l'envoi (âge des comptes, taxe hors alliance). */
function GiftRules({ player, target }: { player: { createdAtMs?: number; allianceId?: string | null }; target: { pseudo: string; allianceId?: string | null; createdAtMs?: number } }) {
  const now = Date.now();
  const mine = giftAgeBlock(player, now);
  const theirs = giftAgeBlock(target, now);
  const rate = target.allianceId === undefined ? null : giftDeliveryRate(player, target);
  return (
    <div className="mt-2 flex flex-col gap-1 text-xs">
      {mine && <p className="text-danger-glow">Les cadeaux s'ouvrent après {GIFT_RULES.minAccountDays} jours de jeu ({mine}).</p>}
      {theirs && <p className="text-danger-glow">{target.pseudo} est arrivé il y a moins de {GIFT_RULES.minAccountDays} jours ({theirs}).</p>}
      {rate === 1 && <p className="text-mint-glow">Même alliance : tout arrive à destination.</p>}
      {rate !== null && rate < 1 && (
        <p className="text-gold-glow">Hors alliance : {Math.round((1 - rate) * 100)} % se perdent en route (taxe de transport).</p>
      )}
      {rate === null && <p className="text-slate-500">Hors alliance, {Math.round(GIFT_RULES.outsideAllianceTax * 100)} % se perdent en route.</p>}
    </div>
  );
}

export function TradeModal({
  target,
  onClose,
}: {
  /** allianceId / createdAtMs (si connus) : aperçu de la taxe et du délai (v5.10). */
  target: { uid: string; pseudo: string; allianceId?: string | null; createdAtMs?: number } | null;
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
          {player && <GiftRules player={player} target={target} />}

          {!player || submitting ? (
            submitting ? <RadarScan label="Envoi en cours…" /> : <SkeletonList rows={4} className="py-2" />
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
