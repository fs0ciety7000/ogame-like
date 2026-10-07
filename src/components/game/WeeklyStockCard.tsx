import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Gem, Loader2, ShoppingBag } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { CostPill, HudChip } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { AmberAmount } from "@/components/ui/amber";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { nextRestockMs, WEEKLY_OFFERS, weeklyBlocker, weeklyLeft } from "@/game/weeklyStock";
import { buyWeeklyOffer, useWeeklyStock } from "@/services/comptoirService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { formatDuration } from "@/lib/utils";
import { assetUrl } from "@/lib/assets";

/* 5.27 : offre de la semaine au Comptoir, en quantité limitée pour tout le serveur. */

export function WeeklyStockCard() {
  const stock = useWeeklyStock();
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid) ?? "";
  const [busy, setBusy] = useState(false);
  const offer = WEEKLY_OFFERS.find((o) => o.id === stock.offer)!;
  const left = weeklyLeft(stock);
  const now = Date.now();
  if (!player) return null;
  const blocker = weeklyBlocker(player, uid, stock);
  const buy = async () => {
    if (!(await askConfirm({ title: `Acheter ${offer.name} ?`, message: `${offer.description} ${offer.price} Ambre, un exemplaire par joueur et par semaine.`, confirmLabel: "Acheter", tone: "gold" }))) return;
    setBusy(true);
    try {
      toast.success((await buyWeeklyOffer()).message);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Achat impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <HudPanel
      icon={<Gem />}
      title="Offre de la semaine"
      tone="gold"
      aside={
        <HudChip size="sm" tone={left > 0 ? "gold" : "neutral"}>
          <span className="font-mono tabular-nums">
            {left} / {offer.quantity}
          </span>{" "}
          restants
        </HudChip>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* 6.14.26 : illustration de l'offre (public/assets/bounties/items/weekly-<id>.webp). */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
        <img src={assetUrl(`/assets/bounties/items/weekly-${offer.id}.webp`)} alt="" className="h-12 w-12 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm text-slate-100">{offer.name}</p>
          <p className="text-xs text-slate-400">{offer.description} Un exemplaire par joueur, pour tout le serveur.</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <CalendarClock className="h-3 w-3" aria-hidden /> Nouvelle offre dans <span className="font-mono tabular-nums">{formatDuration(Math.floor((nextRestockMs(now) - now) / 1000))}</span>
          </p>
        </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <div className="flex items-center gap-2">
            <CostPill missing={blocker === "Pas assez d'Ambre." ? `il manque ${offer.price - (player.bounties?.amber ?? 0)}` : undefined}>
              <AmberAmount value={offer.price} label={false} />
            </CostPill>
            <Button size="sm" variant="warn" disabled={busy || !!blocker} title={blocker ?? undefined} onClick={() => void buy()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />} Acheter
            </Button>
          </div>
          {blocker && blocker !== "Pas assez d'Ambre." && <p className="text-[11px] text-ember-glow">{blocker}</p>}
        </div>
      </div>
    </HudPanel>
  );
}
