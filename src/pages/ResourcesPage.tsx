import { ResourceSelect } from "@/components/game/ResourceSelect";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ResourceHistoryChart } from "@/components/game/ResourceHistoryChart";
import { StorageRiskCard } from "@/components/game/StorageRiskCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useLiveResources, useProductionRates } from "@/hooks/useLiveResources";
import { economySnapshot, productionBreakdown } from "@/game/economy";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { factorRows } from "@/components/ui/afford";
import { Factory } from "lucide-react";
import type { PlayerState } from "@/types/game";
import { HudCallout, HudMeter } from "@/components/ui/hud";
import { EXCHANGE_RULES, exchangeCapLabel, exchangeRareLeft, exchangeRareUsed, isCommonToRare, RESOURCE_LIST, tradeQuote } from "@/game/resources";
import { formatDecimal } from "@/game/format";
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

  const quote = tradeQuote(sellId, buyId, amount);
  const buyRes = RESOURCE_LIST.find((r) => r.id === buyId)!;
  // 6.14.106 (AE-L3, Q98) : plafond hebdomadaire des rares reçues contre des communes (lu dans la règle).
  const capLabel = exchangeCapLabel(formatCompact);
  const now = Date.now();
  const rareTrade = isCommonToRare(sellId, buyId);
  const rareLeft = exchangeRareLeft(player, now);
  const overCap = rareTrade && quote.net > rareLeft;
  const perRare = EXCHANGE_RULES.commonToRare > 0 ? Math.round(1 / EXCHANGE_RULES.commonToRare) : 0;

  const handleTrade = async () => {
    if (!uid) return;
    setSubmitting(true);
    try {
      const out = await tradeResources(uid, sellId, buyId, amount);
      toast.success(`Échange effectué : +${formatNumber(out.gained)} ${buyRes.name} (taxe ${formatNumber(out.tax)} au pot commun)`);
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
                  <p className="truncate font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">{res.name}</p>
                  <AnimatedNumber value={resources[res.id]} format={formatNumber} className="font-mono font-bold tabular-nums block text-xl text-slate-100" />
                </div>
              </div>
              {res.rarity === "common" && Number.isFinite(economy.capacity) && (
                <div className="relative mt-3">
                  <div className="flex justify-between font-mono text-[11px] text-slate-500">
                    <ProductionWhy player={player} res={res.id}>
                      <span className={(rates[res.id] ?? 0) > 0 ? "text-mint-glow" : (rates[res.id] ?? 0) < 0 ? "text-danger-glow" : ""}>
                        {(rates[res.id] ?? 0) > 0 ? "+" : ""}
                        {formatCompact(rates[res.id] ?? 0)}/s
                      </span>
                    </ProductionWhy>
                    <span>{Math.min(100, Math.round((resources[res.id] / economy.capacity) * 100))} %</span>
                  </div>
                  <HudMeter
                    className="mt-1"
                    percent={(resources[res.id] / economy.capacity) * 100}
                    tone={economy.full.includes(res.id) ? "var(--color-ember-glow)" : undefined}
                  />
                </div>
              )}
              {res.rarity === "rare" && <p className="relative mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-gold-glow/70">Ressource rare</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      {player && <StorageRiskCard player={player} now={Date.now()} />}
      <ResourceHistoryChart history={player?.resourceHistory} />

      <Card>
        <CardHeader>
          <CardTitle>Comptoir d'échange</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Ressources communes → rares : <span className="font-mono tabular-nums">1</span> rare pour <span className="font-mono tabular-nums">{formatNumber(perRare)}</span> communes. Rares → communes :{" "}
            <span className="font-mono tabular-nums">{formatDecimal(EXCHANGE_RULES.rareToCommon, 2)}</span> communes par rare. Aucun échange rare ↔ rare ou commune ↔ commune. Taxe de{" "}
            <span className="font-mono tabular-nums">{Math.round(EXCHANGE_RULES.taxPct * 100)} %</span> sur ce que tu reçois, versée au pot commun du serveur.
          </p>
          {capLabel && (
            <p className="text-xs text-slate-400">
              Plafond : {capLabel}. Cette semaine :{" "}
              <span className="font-mono tabular-nums text-slate-200">{formatCompact(exchangeRareUsed(player, now))}</span> reçues, reste{" "}
              <span className={rareLeft > 0 ? "font-mono tabular-nums text-mint-glow" : "font-mono tabular-nums text-ember-glow"}>{formatCompact(rareLeft)}</span>.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Je vends</label>
              <ResourceSelect value={sellId} onChange={setSellId} ariaLabel="Ressource vendue" className="w-full" />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Je reçois</label>
              <ResourceSelect value={buyId} onChange={setBuyId} ariaLabel="Ressource reçue" className="w-full" />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Quantité</label>
              <NumberInput min={1} max={Math.max(1, Math.floor(resources[sellId] ?? 0))} value={amount} onChange={setAmount} aria-label="Quantité vendue" className="w-full" />
            </div>
          </div>

          <HudCallout tone="accent" className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">Tu recevras</span>
            <span className="flex flex-col items-end gap-0.5">
              <span className="flex items-center gap-1.5 text-lg text-cyan-glow">
                <span className="font-mono tabular-nums">{formatNumber(quote.net)}</span> <ResourceIcon id={buyRes.id} /> <span className="font-display">{buyRes.name}</span>
              </span>
              {quote.tax > 0 && (
                <span className="font-mono text-[11px] tabular-nums text-slate-500">
                  brut {formatNumber(quote.gross)} · taxe {formatNumber(quote.tax)} au pot commun
                </span>
              )}
            </span>
          </HudCallout>

          {overCap && (
            <HudCallout tone="ember" className="text-xs">
              {rareLeft > 0 ? `Au-delà du plafond de la semaine : il te reste ${formatCompact(rareLeft)} rares à recevoir. Échange moins de communes.` : "Plafond de la semaine atteint : reviens lundi."}
            </HudCallout>
          )}
          <Button onClick={() => void handleTrade()} disabled={submitting || sellId === buyId || quote.net <= 0 || overCap}>
            {submitting ? "Échange…" : "Échanger"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** 6.1 (lot L, constat Q3) : d'où vient la production d'une ressource (base des extracteurs, puis chaque bonus). */
function ProductionWhy({ player, res, children }: { player: PlayerState; res: ResourceId; children: React.ReactNode }) {
  const b = productionBreakdown(player, res, Date.now());
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="cursor-help" aria-label="Voir d'où vient cette production">
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <TooltipCard
          title="D'où vient cette production"
          icon={<Factory />}
          rows={[
            { label: "Extracteurs", value: `${formatCompact(b.baseHourly)} / h` },
            ...factorRows(b.lines, true),
            { label: "Total brut", value: `${formatCompact(b.totalHourly)} / h`, tone: "accent" },
          ]}
          note={res === "energy" ? "L'entretien de la flotte est déduit de l'énergie. Les bonus se multiplient entre eux." : "Les bonus se multiplient entre eux. Entrepôt plein : la production s'arrête."}
        />
      </TooltipContent>
    </Tooltip>
  );
}
