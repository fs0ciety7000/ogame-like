import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Gem } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { HudChip } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { AmberIcon } from "@/components/ui/amber";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { nextRestockMs, WEEKLY_OFFERS, weeklyBlocker, weeklyLeft } from "@/game/weeklyStock";
import { buyWeeklyOffer, useWeeklyStock } from "@/services/comptoirService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { formatDuration } from "@/lib/utils";

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
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm text-slate-100">{offer.name}</p>
          <p className="text-xs text-slate-400">{offer.description} Un exemplaire par joueur, pour tout le serveur.</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <CalendarClock className="h-3 w-3" aria-hidden /> Nouvelle offre dans <span className="font-mono tabular-nums">{formatDuration(Math.floor((nextRestockMs(now) - now) / 1000))}</span>
          </p>
        </div>
        <Button size="sm" variant={blocker ? "outline" : "warn"} disabled={busy || !!blocker} title={blocker ?? undefined} onClick={() => void buy()}>
          <AmberIcon className="mr-1 h-4 w-4" /> {offer.price}
          {blocker && blocker !== "Pas assez d'Ambre." ? <span className="ml-2 text-[11px] font-normal text-slate-500">{blocker}</span> : null}
        </Button>
      </div>
    </HudPanel>
  );
}
