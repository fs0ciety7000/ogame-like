import { RESOURCE_LIST } from "@/game/resources";
import { useLiveResources, useProductionRates } from "@/hooks/useLiveResources";
import { usePlayerStore } from "@/store/playerStore";
import { formatCompact, formatDecimal, formatDuration, formatNumber } from "@/lib/utils";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import { motion } from "framer-motion";
import { useFxStore } from "@/store/fxStore";
import { economySnapshot, productionBonuses } from "@/game/economy";
import { HostileFleetAlert } from "@/components/game/FleetsPanel";
import { EventBadge } from "@/components/game/EventBanner";
import { StreakBadge } from "@/components/game/StreakBadge";
import { UltimatumBadge } from "@/components/game/PirateUltimatum";
import { cn } from "@/lib/utils";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";
import { HudChip } from "@/components/ui/hud";
import { ClaimAllChip } from "@/components/game/ClaimAllChip";

/** v5.2 : bonus de production actifs (infobulle). Ils se multiplient entre eux. */
/** Bonus de production actifs, en section d'infobulle. */
function bonusSection(bonuses: { label: string; pct: number }[]) {
  return {
    title: "Bonus de production actifs",
    rows: bonuses.map((b) => ({ label: b.label, value: `+${formatDecimal(b.pct * 100, 1)} %`, tone: "mint" as const })),
    empty: "Aucun bonus de production actif.",
  };
}

export function ResourceHud() {
  const player = usePlayerStore((s) => s.player);
  const resources = useLiveResources(player);
  const rates = useProductionRates(player, resources);
  const pulse = useFxStore((s) => s.hudPulse);

  if (!resources || !player) return null;

  const history = player.resourceHistory ?? [];
  const economy = economySnapshot({ ...player, resources }, Date.now());

  const common = RESOURCE_LIST.filter((r) => r.rarity === "common");
  const rare = RESOURCE_LIST.filter((r) => r.rarity === "rare");

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:flex xl:flex-wrap xl:items-stretch">
      {common.map((res) => {
        const rate = rates[res.id] ?? 0;
        const trend = history.slice(-12).map((p) => p.r[res.id] ?? 0);
        const full = economy.full.includes(res.id);
        const fill = Number.isFinite(economy.capacity) && economy.capacity > 0 ? (resources[res.id] / economy.capacity) * 100 : 0;
        // v4.9.3 : entrepôt presque plein (≥ 85 %) — bordure dorée et temps avant plein.
        const nearFull = !full && fill >= 85;
        const secondsToFull = !full && rate > 0 && Number.isFinite(economy.capacity) ? Math.max(0, (economy.capacity - resources[res.id]) / rate) : null;
        return (
          <Tooltip key={res.id}>
            <TooltipTrigger asChild>
              <motion.div
                key={pulse[res.id] ?? 0}
                data-hud-res={res.id}
                initial={pulse[res.id] ? { scale: 1.08 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 14 }}
                className={cn(
                  "hud-cut-sm relative flex min-w-[9.5rem] items-center gap-2 overflow-hidden border bg-space-900/70 px-2.5 pb-2 pt-1.5 xl:flex-1",
                  full ? "border-ember-glow/60" : nearFull ? "border-gold-glow/50" : "border-cyan-glow/15",
                )}
              >
                <ResourceIcon id={res.id} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <AnimatedNumber value={resources[res.id]} format={formatCompact} className="tabular-mono text-[15px] font-semibold text-white" />
                    {full ? (
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ember-glow">plein</span>
                    ) : rate !== 0 ? (
                      <span className={cn("tabular-mono text-[10px]", rate > 0 ? "text-mint-glow" : "text-danger-glow")}>
                        {rate > 0 ? "+" : ""}
                        {formatCompact(rate)}/s
                      </span>
                    ) : null}
                  </div>
                  {nearFull && secondsToFull !== null ? (
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-gold-glow">plein dans {formatDuration(Math.ceil(secondsToFull))}</p>
                  ) : (
                    <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">{res.name}</p>
                  )}
                </div>
                {trend.length >= 2 && <Sparkline values={trend} className="hidden 2xl:block" />}
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.05]">
                  <span
                    className="block h-full transition-[width] duration-700"
                    style={{
                      width: `${Math.min(100, fill)}%`,
                      background: full ? "var(--color-ember-glow)" : fill > 85 ? "var(--color-gold-glow)" : "linear-gradient(90deg, var(--color-cyan-glow), var(--color-mint-glow))",
                    }}
                  />
                </span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <TooltipCard
                title={res.name}
                icon={<ResourceIcon id={res.id} className="h-3.5 w-3.5" />}
                rows={[
                  { label: "Stock", value: `${formatNumber(resources[res.id])} / ${Number.isFinite(economy.capacity) ? formatNumber(economy.capacity) : "∞"}` },
                  ...(rate !== 0 ? [{ label: "Production", value: `${rate > 0 ? "+" : ""}${formatNumber(rate)}/s`, tone: rate > 0 ? ("mint" as const) : ("danger" as const) }] : []),
                  ...(full
                    ? [{ label: "Entrepôt", value: "plein", tone: "ember" as const }]
                    : secondsToFull !== null
                      ? [{ label: "Plein dans", value: formatDuration(Math.ceil(secondsToFull)) }]
                      : []),
                  ...(res.id === "energy" && economy.upkeep > 0 ? [{ label: "Entretien de la flotte", value: `−${formatNumber(Math.round(economy.upkeep))}/s`, tone: "ember" as const }] : []),
                ]}
                sections={[bonusSection(productionBonuses({ ...player, resources }, Date.now(), res.id))]}
                note={full ? "Production à l'arrêt : agrandis l'Entrepôt ou dépense." : undefined}
              />
            </TooltipContent>
          </Tooltip>
        );
      })}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
      <HostileFleetAlert />
      <ClaimAllChip />
      <StreakBadge />
      <EventBadge />
      <UltimatumBadge />
      {economy.outage && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HudChip tone="danger" alert tabIndex={0}>
              <GameIcon name="energy" /> Panne d'énergie
            </HudChip>
          </TooltipTrigger>
          <TooltipContent>
            L'entretien de ta flotte consomme plus d'énergie que tu n'en produis : les autres productions tournent à 50 %. Améliore le
            Réacteur ou réduis ta flotte.
          </TooltipContent>
        </Tooltip>
      )}


      {rare.map((res) => (
        <Tooltip key={res.id}>
          <TooltipTrigger asChild>
            <motion.div
              key={pulse[res.id] ?? 0}
              data-hud-res={res.id}
              initial={pulse[res.id] ? { scale: 1.15 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 14 }}
              className="flex items-center gap-1.5 border border-gold-glow/15 bg-gold-glow/[0.04] px-2 py-1 text-xs"
            >
              <ResourceIcon id={res.id} className="h-5 w-5" />
              <AnimatedNumber value={resources[res.id]} format={formatCompact} className="tabular-mono text-slate-200" />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <TooltipCard
              title={res.name}
              icon={<ResourceIcon id={res.id} className="h-3.5 w-3.5" />}
              rows={[
                { label: "Stock", value: formatNumber(resources[res.id]) },
                ...((rates[res.id] ?? 0) > 0 ? [{ label: "Production", value: `+${formatNumber(rates[res.id] ?? 0)}/s`, tone: "mint" as const }] : []),
              ]}
              sections={(rates[res.id] ?? 0) > 0 ? [bonusSection(productionBonuses({ ...player, resources }, Date.now(), res.id))] : []}
            />
          </TooltipContent>
        </Tooltip>
      ))}
      </div>
    </div>
  );
}
