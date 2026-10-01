import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ResourceHistoryChart } from "@/components/game/ResourceHistoryChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useLiveResources, useProductionRates } from "@/hooks/useLiveResources";
import { economySnapshot } from "@/game/economy";
import { HudMeter } from "@/components/ui/hud";
import { RESOURCE_LIST, getTradeRate } from "@/game/resources";
import { GameActionError, tradeResources } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { formatCompact, formatNumber } from "@/lib/utils";
import type { ResourceId } from "@/types/game";
import { ResourceIcon } from "@/components/ui/game-icon";

export function ResourcesPage() {
  const player = usePlayerStore((s) => s.player);
  const resources = useLiveResources(player);
  const rates = useProductionRates(player, resources);
  const uid = useAuthStore((s) => s.user?.uid);

  const [sellId, setSellId] = useState<ResourceId>("scrap");
  const [buyId, setBuyId] = useState<ResourceId>("reinforcedSteel");
  const [amount, setAmount] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  if (!resources || !player) return null;
  const economy = economySnapshot({ ...player, resources }, Date.now());

  const rate = getTradeRate(sellId, buyId);
  const preview = Math.floor(amount * rate);
  const buyRes = RESOURCE_LIST.find((r) => r.id === buyId)!;

  const handleTrade = async () => {
    if (!uid) return;
    setSubmitting(true);
    try {
      const gained = await tradeResources(uid, sellId, buyId, amount);
      toast.success(`Échange effectué : +${formatNumber(gained)} ${buyRes.name}`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Échange impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Stocks" title="Ressources" description="Extraction, réserves et comptoir d'échange." />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {RESOURCE_LIST.map((res, i) => (
          <motion.div
            key={res.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            whileHover={{ y: -2 }}
          >
            <Card className="h-full p-4">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: res.rarity === "rare" ? "var(--color-gold-glow)" : "var(--color-cyan-glow)" }}
              />
              <div className="relative flex items-center gap-3">
                <span className="grid h-11 w-10 shrink-0 place-items-center bg-gradient-to-b from-cyan-glow/25 to-cyan-glow/5 [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]">
                  <ResourceIcon id={res.id} className="h-8 w-8" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{res.name}</p>
                  <AnimatedNumber value={resources[res.id]} format={formatNumber} className="hud-title block text-xl tabular-nums text-white" />
                </div>
              </div>
              {res.rarity === "common" && Number.isFinite(economy.capacity) && (
                <div className="relative mt-3">
                  <div className="flex justify-between font-mono text-[10px] text-slate-500">
                    <span className={(rates[res.id] ?? 0) > 0 ? "text-mint-glow" : (rates[res.id] ?? 0) < 0 ? "text-danger-glow" : ""}>
                      {(rates[res.id] ?? 0) > 0 ? "+" : ""}
                      {formatCompact(rates[res.id] ?? 0)}/s
                    </span>
                    <span>{Math.min(100, Math.round((resources[res.id] / economy.capacity) * 100))} %</span>
                  </div>
                  <HudMeter
                    className="mt-1"
                    percent={(resources[res.id] / economy.capacity) * 100}
                    tone={economy.full.includes(res.id) ? "var(--color-ember-glow)" : undefined}
                  />
                </div>
              )}
              {res.rarity === "rare" && <p className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-glow/70">Ressource rare</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      <ResourceHistoryChart history={player?.resourceHistory} />

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
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Je vends</label>
              <select
                value={sellId}
                onChange={(e) => setSellId(e.target.value as ResourceId)}
                className="h-10 w-full border border-cyan-glow/15 bg-space-900/80 px-3 text-sm text-slate-100 outline-none focus:border-cyan-glow/60"
              >
                {RESOURCE_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Je reçois</label>
              <select
                value={buyId}
                onChange={(e) => setBuyId(e.target.value as ResourceId)}
                className="h-10 w-full border border-cyan-glow/15 bg-space-900/80 px-3 text-sm text-slate-100 outline-none focus:border-cyan-glow/60"
              >
                {RESOURCE_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Quantité</label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-l-2 border-cyan-glow bg-cyan-glow/[0.06] px-4 py-3 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">Tu recevras</span>
            <span className="hud-title text-lg text-cyan-glow">
              {formatNumber(preview)} <ResourceIcon id={buyRes.id} /> {buyRes.name}
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
