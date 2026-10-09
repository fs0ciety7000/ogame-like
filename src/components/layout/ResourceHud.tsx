import { RESOURCE_LIST } from "@/game/resources";
import { useLiveResources, useProductionRates } from "@/hooks/useLiveResources";
import { usePlayerStore } from "@/store/playerStore";
import { formatCompact, formatDecimal, formatDuration, formatHud, formatNumber } from "@/lib/utils";
import { TapTooltip, TapTooltipTrigger, Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import { motion } from "framer-motion";
import { useFxStore } from "@/store/fxStore";
import { economySnapshot, productionBonuses } from "@/game/economy";
import { HostileFleetAlert } from "@/components/game/hostileFleets";
import { EventBadge } from "@/components/game/EventBanner";
import { StreakBadge } from "@/components/game/StreakBadge";
import { UltimatumBadge } from "@/components/game/PirateUltimatum";
import { cn } from "@/lib/utils";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";
import { HudChip } from "@/components/ui/hud";
import { ClaimAllChip } from "@/components/game/ClaimAllChip";
import { Link } from "react-router-dom";
import { AmberIcon } from "@/components/ui/amber";
import { bountyState } from "@/game/bounties";
import { useNavUnlock } from "@/components/layout/NavBar";

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
  const nav = useNavUnlock();

  // 6.14.116 (É30-5) : place réservée pendant le chargement (hauteurs mesurées : 78 px sur téléphone, 125 px de 640 à 767 px,
  // 89 px au-delà). Avant, la barre apparaissait d'un coup et poussait la page de 78 px (0,08 de CLS sur mobile).
  if (!resources || !player) return <div aria-hidden className="h-[78px] sm:h-[125px] md:h-[89px]" />;

  const history = player.resourceHistory ?? [];
  const economy = economySnapshot({ ...player, resources }, Date.now());
  const amber = bountyState(player).amber;
  // 6.14.81 (DP-L6, I30) : l'Ambre n'apparaît qu'avec son système (Primes) ouvert, ou dès qu'il y en a (on ne cache jamais un solde).
  const showAmber = amber > 0 || !nav.closed.has("/game/primes");

  const common = RESOURCE_LIST.filter((r) => r.rarity === "common");
  const rare = RESOURCE_LIST.filter((r) => r.rarity === "rare");

  return (
    // 6.14.62 (AD-2) : sur téléphone, les 4 ressources communes tiennent sur une ligne (icône, stock, débit ; le nom est dans
    // l'infobulle et le nom accessible) et les pastilles sur une seconde ligne qui défile à l'horizontale.
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 xl:flex xl:flex-wrap xl:items-stretch">
      {common.map((res) => {
        const rate = rates[res.id] ?? 0;
        const trend = history.slice(-12).map((p) => p.r[res.id] ?? 0);
        const full = economy.full.includes(res.id);
        const fill = Number.isFinite(economy.capacity) && economy.capacity > 0 ? (resources[res.id] / economy.capacity) * 100 : 0;
        // v4.9.3 : entrepôt presque plein (≥ 85 %) — temps avant plein.
        const nearFull = !full && fill >= 85;
        const secondsToFull = !full && rate > 0 && Number.isFinite(economy.capacity) ? Math.max(0, (economy.capacity - resources[res.id]) / rate) : null;
        return (
          // 6.14.164 (S4, NJ-7) : l'infobulle (nom, stock, plein dans…) s'ouvre aussi au toucher.
          <TapTooltip key={res.id}>
            <TapTooltipTrigger asChild>
              <motion.div
                key={pulse[res.id] ?? 0}
                data-hud-res={res.id}
                aria-label={`${res.name} : ${formatNumber(resources[res.id])}${full ? ", entrepôt plein" : ""}`}
                initial={pulse[res.id] ? { scale: 1.08 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 14 }}
                className={cn(
                  "hud-cut-sm relative flex min-w-0 items-center gap-1 overflow-hidden border bg-space-900/70 px-1 pb-1.5 pt-1 sm:min-w-[9.5rem] sm:gap-2 sm:px-2.5 sm:pb-2 sm:pt-1.5 xl:flex-1",
                  // 5.21.2 : cadre à la couleur du thème ; seule la mention « plein » garde la couleur d'alerte.
                  full ? "border-cyan-glow/45" : nearFull ? "border-cyan-glow/30" : "border-cyan-glow/15",
                )}
              >
                <ResourceIcon id={res.id} className="h-5 w-5 shrink-0 sm:h-8 sm:w-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                    {/* 6.14.164 (S4, NJ-7) : 3 chiffres au plus (« 150 k ») ; avant, « 150,2 k » finissait en « 150,… » à 375 px. */}
                    <AnimatedNumber value={resources[res.id]} format={formatHud} className="truncate tabular-mono text-[12px] font-semibold leading-tight text-slate-100 sm:text-[15px]" />
                    {full ? (
                      <span className="font-mono text-[11px] font-bold uppercase leading-tight tracking-[0.08em] text-ember-glow">plein</span>
                    ) : nearFull && secondsToFull !== null ? (
                      <>
                        {/* Téléphone : « plein dans » prend la place du débit (la ligne du nom est masquée). */}
                        <span className="truncate font-mono text-[11px] uppercase leading-tight tracking-[0.04em] text-ember-glow sm:hidden">plein {formatDuration(Math.ceil(secondsToFull))}</span>
                        {rate !== 0 && (
                          <span className={cn("hidden truncate tabular-mono text-[11px] leading-tight sm:inline", rate > 0 ? "text-mint-glow" : "text-danger-glow")}>
                            {rate > 0 ? "+" : ""}
                            {formatCompact(rate)}/s
                          </span>
                        )}
                      </>
                    ) : rate !== 0 ? (
                      <span className={cn("truncate tabular-mono text-[11px] leading-tight", rate > 0 ? "text-mint-glow" : "text-danger-glow")}>
                        {rate > 0 ? "+" : ""}
                        {formatCompact(rate)}/s
                      </span>
                    ) : null}
                  </div>
                  {nearFull && secondsToFull !== null ? (
                    <p className="hidden truncate font-mono text-[11px] uppercase tracking-[0.08em] text-ember-glow sm:block">plein dans {formatDuration(Math.ceil(secondsToFull))}</p>
                  ) : (
                    <p className="hidden truncate font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500 sm:block">{res.name}</p>
                  )}
                </div>
                {trend.length >= 2 && <Sparkline values={trend} className="hidden 2xl:block" />}
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.05]">
                  <span
                    className="block h-full transition-[width] duration-700"
                    style={{
                      width: `${Math.min(100, fill)}%`,
                      background: full || fill > 85 ? "var(--color-cyan-glow)" : "linear-gradient(90deg, var(--color-cyan-glow), var(--color-mint-glow))",
                    }}
                  />
                </span>
              </motion.div>
            </TapTooltipTrigger>
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
          </TapTooltip>
        );
      })}
      </div>
      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>*]:shrink-0">
      {/* 5.24 : Ambre, monnaie premium : liseré doré, coin coupé, à part des ressources. */}
      {showAmber && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/game/primes"
            aria-label={`Ambre : ${formatNumber(amber)}`}
            className="hud-cut-sm flex items-center gap-1.5 border border-gold-glow/40 border-t-2 border-t-gold-glow bg-gradient-to-b from-gold-glow/15 to-gold-glow/[0.03] px-2 py-1 text-xs transition-colors hover:border-gold-glow/70 hover:from-gold-glow/25"
          >
            <AmberIcon className="h-5 w-5" />
            <AnimatedNumber value={amber} format={formatNumber} className="tabular-mono font-medium text-gold-glow" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <TooltipCard
            title="Ambre de Ruche"
            icon={<AmberIcon className="h-3.5 w-3.5" />}
            rows={[{ label: "Solde", value: formatNumber(amber) }]}
            note="Monnaie premium : gagnée aux primes, au passe, au Codex et aux Chroniques ; se dépense au Comptoir Kesh'Vaar."
          />
        </TooltipContent>
      </Tooltip>
      )}
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
        // 6.14.164 (S4, NJ-7) : icône et nombre seulement : le nom s'affiche au toucher (avant : au survol seulement).
        <TapTooltip key={res.id}>
          <TapTooltipTrigger asChild>
            <motion.div
              key={pulse[res.id] ?? 0}
              data-hud-res={res.id}
              aria-label={`${res.name} : ${formatNumber(resources[res.id])}`}
              initial={pulse[res.id] ? { scale: 1.15 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 14 }}
              className="flex items-center gap-1.5 border border-gold-glow/15 bg-gold-glow/[0.04] px-2 py-1 text-xs"
            >
              <ResourceIcon id={res.id} className="h-5 w-5" />
              <AnimatedNumber value={resources[res.id]} format={formatCompact} className="tabular-mono text-slate-200" />
            </motion.div>
          </TapTooltipTrigger>
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
        </TapTooltip>
      ))}
      </div>
    </div>
  );
}
