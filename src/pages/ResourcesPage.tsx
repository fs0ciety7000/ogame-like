import { ResourceSelect } from "@/components/game/ResourceSelect";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { advanceEconomy, economySnapshot, hourlyProduction, productionBreakdown } from "@/game/economy";
import { exchangeTaxCut, formatMinutes, storageBufferHours } from "@/game/buildingTiers";
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
  // 6.14.161 (NJ-1) : « échange-la au comptoir » (raison d'un bouton grisé) mène ici, au comptoir (?onglet=comptoir).
  const [params] = useSearchParams();
  const focus = params.get("onglet");
  const ready = !!resources && !!player;
  useEffect(() => {
    if (focus === "comptoir" && ready) document.getElementById("comptoir")?.scrollIntoView({ block: "start" });
  }, [focus, ready]);

  // 6.14.164 (S4, NJ-20) : la quantité par défaut (100) donnait « Tu recevras 0 » (100 ferraille → 1 acier, moins 1 de taxe) :
  // à chaque paire choisie, la quantité monte au minimum qui rapporte au moins 1.
  const taxCut = player ? exchangeTaxCut(player) : 0;
  useEffect(() => {
    if (sellId === buyId) return;
    setAmount((a) => (tradeQuote(sellId, buyId, a, taxCut).net >= 1 ? a : minTradeAmount(sellId, buyId, taxCut)));
  }, [sellId, buyId, taxCut]);

  if (!resources || !player) return null;
  const economy = economySnapshot({ ...player, resources }, Date.now());

  // 6.14.143 (PB-L2) : Négoce (palier 15 de l'entrepôt) : taxe du comptoir réduite, comme au serveur.
  const quote = tradeQuote(sellId, buyId, amount, exchangeTaxCut(player));
  // 6.14.143 (PB-L2) : tampon de l'entrepôt (palier 10), au même instant que les compteurs.
  const bufferHours = storageBufferHours(player.buildings);
  const buffer = advanceEconomy(player, Math.max(0, (Date.now() - player.resourcesUpdatedAtMs) / 1000), player.resourcesUpdatedAtMs).buffer;
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
                  {(bufferHours > 0 || (buffer[res.id] ?? 0) > 0) && (
                    <BufferLine amount={buffer[res.id] ?? 0} hourly={hourlyProduction(player.buildings, res.id, player.techLevels)} maxHours={bufferHours} />
                  )}
                </div>
              )}
              {res.rarity === "rare" && <p className="relative mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-gold-glow/70">Ressource rare</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      {player && <StorageRiskCard player={player} now={Date.now()} />}
      <ResourceHistoryChart history={player?.resourceHistory} />

      <Card id="comptoir" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Comptoir d'échange</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Ressources communes → rares : <span className="font-mono tabular-nums">1</span> rare pour <span className="font-mono tabular-nums">{formatNumber(perRare)}</span> communes. Rares → communes :{" "}
            <span className="font-mono tabular-nums">{formatDecimal(EXCHANGE_RULES.rareToCommon, 2)}</span> communes par rare. Aucun échange rare ↔ rare ou commune ↔ commune. Taxe de{" "}
            <span className="font-mono tabular-nums">{formatDecimal(quote.taxPct * 100, 1)} %</span> sur ce que tu reçois, versée au pot commun du serveur
            {quote.taxPct < EXCHANGE_RULES.taxPct && <span className="text-mint-glow"> (Négoce de l'entrepôt)</span>}.
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

          {quote.net <= 0 && sellId !== buyId && (
            <p className="text-xs text-slate-400">
              Il faut au moins <span className="font-mono tabular-nums text-slate-200">{formatNumber(minTradeAmount(sellId, buyId, taxCut))}</span> pour recevoir 1 {buyRes.name}.{" "}
              <button type="button" className="hud-hit font-semibold text-cyan-glow hover:underline" onClick={() => setAmount(minTradeAmount(sellId, buyId, taxCut))}>
                Mettre ce minimum
              </button>
            </p>
          )}
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

/** 6.14.164 (S4, NJ-20) : plus petite quantité vendue qui rapporte au moins 1 (taxe comprise), même calcul que le serveur. */
function minTradeAmount(sellId: ResourceId, buyId: ResourceId, taxCut: number): number {
  let hi = 1;
  while (tradeQuote(sellId, buyId, hi, taxCut).net < 1) {
    hi *= 2;
    if (hi > 1e12) return 1;
  }
  let lo = Math.floor(hi / 2) + 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (tradeQuote(sellId, buyId, mid, taxCut).net >= 1) hi = mid;
    else lo = mid + 1;
  }
  return hi;
}

/** 6.14.143 (PB-L2) : jauge du tampon de l'entrepôt, « Tampon : 1 h 40 en attente ». */
function BufferLine({ amount, hourly, maxHours }: { amount: number; hourly: number; maxHours: number }) {
  const held = hourly > 0 ? (amount / hourly) * 3600 : 0;
  return (
    <p className="mt-1 font-mono text-[11px] text-slate-500" title="Entrepôt plein : le tampon garde la production en trop et la verse dès que tu fais de la place.">
      Tampon : <span className={amount > 0 ? "tabular-nums text-cyan-glow" : "tabular-nums"}>{amount > 0 ? `${formatMinutes(held)} en attente` : "vide"}</span>
      {maxHours > 0 && <span className="tabular-nums"> / {formatMinutes(maxHours * 3600)}</span>}
    </p>
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
