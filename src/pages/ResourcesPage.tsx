import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/playerStore";
import { useLiveResources } from "@/hooks/useLiveResources";
import { RESOURCE_LIST, getTradeRate } from "@/game/resources";
import { GameActionError, tradeResources } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { formatNumber } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

export function ResourcesPage() {
  const player = usePlayerStore((s) => s.player);
  const resources = useLiveResources(player);
  const uid = useAuthStore((s) => s.user?.uid);

  const [sellId, setSellId] = useState<ResourceId>("scrap");
  const [buyId, setBuyId] = useState<ResourceId>("reinforcedSteel");
  const [amount, setAmount] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  if (!resources) return null;

  const rate = getTradeRate(sellId, buyId);
  const preview = Math.floor(amount * rate);

  const handleTrade = async () => {
    if (!uid) return;
    setSubmitting(true);
    try {
      const gained = await tradeResources(uid, sellId, buyId, amount);
      toast.success(`Échange effectué : +${formatNumber(gained)} ${buyId}`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Échange impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl text-white glow-text">Ressources</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RESOURCE_LIST.map((res) => (
          <Card key={res.id}>
            <CardContent className="flex flex-col items-center gap-1 py-4">
              <span className="text-2xl">{res.emoji}</span>
              <span className="text-xs text-slate-400">{res.name}</span>
              <span className="font-display text-lg tabular-nums text-slate-100">{formatNumber(resources[res.id])}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptoir d'échange</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Ressources communes → rares : taux 0,01. Rares → communes : taux 50. Aucun échange rare ↔ rare ou commune ↔ commune.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Je vends</label>
              <select
                value={sellId}
                onChange={(e) => setSellId(e.target.value as ResourceId)}
                className="h-10 w-full rounded-lg border border-white/10 bg-space-800/80 px-3 text-sm text-slate-100"
              >
                {RESOURCE_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Je reçois</label>
              <select
                value={buyId}
                onChange={(e) => setBuyId(e.target.value as ResourceId)}
                className="h-10 w-full rounded-lg border border-white/10 bg-space-800/80 px-3 text-sm text-slate-100"
              >
                {RESOURCE_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Quantité</label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-space-800/60 px-4 py-3 text-sm">
            <span className="text-slate-400">Tu recevras</span>
            <span className="font-display text-cyan-glow">
              {formatNumber(preview)} {buyId}
            </span>
          </div>

          <Button onClick={() => void handleTrade()} disabled={submitting || sellId === buyId}>
            {submitting ? "Échange…" : "Échanger"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
