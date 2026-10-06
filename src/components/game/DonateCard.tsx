import { useState } from "react";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { HudChip } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { AmberAmount } from "@/components/ui/amber";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { bountyState, nextPatronTier, patronTier } from "@/game/bounties";
import { donateAmberToPot } from "@/services/bountyService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";

/* 5.26.3 : don d'Ambre au pot commun (badge « Mécène »). Affiché au Comptoir
   de la Ruche et, depuis 5.27, dans l'onglet Pot commun du Commerce. */

/** 5.26.3 : don d'Ambre au pot commun, compté pour le badge « Mécène ». */
export function DonateCard() {
  const player = usePlayerStore((s) => s.player);
  const [amount, setAmount] = useState(10);
  const [busy, setBusy] = useState(false);
  const st = player ? bountyState(player) : null;
  const donated = player?.stats?.amberDonated ?? 0;
  const tier = patronTier(donated);
  const next = nextPatronTier(donated);
  if (!player || !st) return null;
  const donate = async () => {
    if (!(await askConfirm({ title: `Verser ${amount} Ambre au pot commun ?`, message: "Le don est définitif : l'Ambre rejoint la réserve du pot, redistribuée lors des concours.", confirmLabel: "Verser", tone: "gold" }))) return;
    setBusy(true);
    try {
      await donateAmberToPot(amount);
      toast.success(`${amount} Ambre versés au pot commun. Merci, mécène !`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Don impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <HudPanel icon={<HandCoins />} title="Don au pot commun" tone="gold" aside={tier ? <HudChip size="sm" tone={tier.tone}>{tier.label}</HudChip> : undefined}>
      <p className="text-xs text-slate-400">
        L'Ambre versée au pot (dons, taxe des enchères en Ambre) fait monter le badge « Mécène » de ta fiche publique. Total versé : <AmberAmount value={donated} label={false} className="font-mono tabular-nums text-slate-200" />
        {next ? (
          <>
            {" "}
            · <span className="font-mono tabular-nums">{next.at - donated}</span> de plus pour « {next.label} ».
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <NumberInput size="sm" min={1} max={Math.max(1, st.amber)} value={amount} onChange={setAmount} className="w-48" aria-label="Ambre à verser" />
        <span className="text-[11px] text-slate-500">
          Solde : <AmberAmount value={st.amber} label={false} className="font-mono tabular-nums text-slate-300" />
        </span>
        <Button size="sm" variant="warn" disabled={busy || amount < 1 || amount > st.amber} onClick={() => void donate()}>
          Verser
        </Button>
      </div>
    </HudPanel>
  );
}
