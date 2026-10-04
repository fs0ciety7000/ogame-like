import { playerBuildTimeFactor } from "@/game/bonuses";
import { assetUrl } from "@/lib/assets";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Wrench } from "lucide-react";
import { Card, HudBrackets } from "@/components/ui/card";
import { CostPill, HudTag, LevelTicks } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { AscensionCard } from "@/components/game/AscensionCard";
import { TalentTreeCard } from "@/components/game/TalentTreeCard";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import {
  applyBuildingDiscount,
  BUILDING_UNLOCK_COST,
  BUILDINGS,
  buildingImage,
  getBuildingUpgradeCost,
  repairPercentAt,
  storageCapacityAt,
  visualTier,
  getBuildingUpgradeTime,
  productionPerSecond,
  PRODUCTION_RESOURCE_BY_BUILDING,
} from "@/game/buildings";
import { cn, formatCompact, formatDuration } from "@/lib/utils";
import { ECONOMY_RULES } from "@/game/economy";
import { GameActionError, planBuilding, startBuildingUpgrade, unlockBuilding } from "@/services/playerService";
import { BuildPlanCard } from "@/components/game/BuildPlanCard";
import { buildPlan, nextPlannedLevel, planSlots } from "@/game/buildPlan";
import { RESOURCE_LIST } from "@/game/resources";
import type { BuildingId, ResourceId } from "@/types/game";
import { LevelPulse, LevelUpBurst } from "@/components/ui/level-up-burst";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";
import { affordText, BlockedReason, CostPills, secondsToAfford } from "@/components/ui/afford";
import { useProductionRates } from "@/hooks/useLiveResources";

export function BuildingsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [pending, setPending] = useState<string | null>(null);
  const rates = useProductionRates(player);

  if (!player || !queues) return null;

  const handleUnlock = async (buildingId: BuildingId) => {
    if (!uid) return;
    setPending(buildingId);
    try {
      await unlockBuilding(uid, buildingId);
      toast.success("Bâtiment débloqué !");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  const handleUpgrade = async (buildingId: BuildingId) => {
    if (!uid) return;
    setPending(buildingId);
    try {
      await startBuildingUpgrade(uid, buildingId);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  const handlePlan = async (buildingId: BuildingId) => {
    setPending(buildingId);
    try {
      await planBuilding(buildingId);
      toast.success("Amélioration programmée.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  const now = Date.now();
  const planFull = buildPlan(queues).length >= planSlots(player);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Infrastructure" title="Bâtiments" description="Débloque et améliore les structures de ton empire." />

      <AscensionCard />
      <TalentTreeCard />
      <BuildPlanCard player={player} queues={queues} now={now} />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-5">
        {BUILDINGS.map((building, index) => {
          const state = player.buildings[building.id];
          // Aligné sur la vérification serveur (startBuildingUpgrade) : tout
          // bâtiment non débloqué est verrouillé, y compris l'Atelier de
          // réparation et les hangars (débloqués via le Labo).
          const isLocked = !state.unlocked;
          const unlockInfo = BUILDING_UNLOCK_COST[building.id];
          const activeUpgrade = queues.buildingUpgrades[building.id];
          const level = state.level;
          const nextLevel = level + 1;
          const rawCost = getBuildingUpgradeCost(building, nextLevel);
          const cost = applyBuildingDiscount(rawCost, player.bonuses.buildingUpgradeDiscount);
          const time = Math.round(getBuildingUpgradeTime(building, nextLevel) * playerBuildTimeFactor(player, now));
          const productionResource = PRODUCTION_RESOURCE_BY_BUILDING[building.id];
          const nearlyDone = !!activeUpgrade && activeUpgrade.endTime - now < 10_000;
          const plannable = nextPlannedLevel(player, queues, building.id);
          const planButton =
            // Utile quand le chantier est occupé ou que les ressources manquent ; sinon, « Améliorer » suffit.
            !isLocked && !planFull && plannable <= building.maxLevel && (activeUpgrade || !Object.entries(cost).every(([r, n]) => (player.resources[r as ResourceId] ?? 0) >= (n ?? 0))) ? (
              <button type="button" disabled={pending === building.id} onClick={() => void handlePlan(building.id)} className="mt-1.5 w-full font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-glow/80 hover:text-cyan-glow hover:underline">
                + Programmer niv. {plannable}
              </button>
            ) : null;

          return (
            <motion.div
              key={building.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              whileHover={{ y: -3 }}
            >
              <Card className={cn("hud-glitch relative flex h-full flex-col", nearlyDone && "animate-pulse-alert", building.endgame && "legendary-frame")}>
                <HudBrackets className="border-gold-glow/70" />
                <LevelPulse level={level} />
                <div className="relative grid grid-cols-[minmax(0,9.5rem)_1fr] gap-4 p-4 max-[380px]:grid-cols-1">
                  <div className={cn("hud-cut relative aspect-square overflow-hidden border border-gold-glow/25 bg-space-900", TIER_FRAME[visualTier(level)])}>
                    <LevelUpBurst level={level} />
                    <img
                      src={assetUrl(buildingImage(building, level))}
                      alt={building.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Lock className="h-8 w-8 text-slate-400" />
                      </div>
                    )}
                    {activeUpgrade && <ConstructionOverlay />}
                    {!isLocked && <TierBadge level={level} />}
                  </div>
                  <div className="min-w-0">
                    <span className="flex flex-wrap gap-1.5">
                      <HudTag tone={productionResource ? "ember" : "accent"} className="max-w-full whitespace-normal">{categoryLabel(building)}</HudTag>
                      {building.endgame && <HudTag tone="gold">Légendaire</HudTag>}
                    </span>
                    <h3 className="hud-title mt-2 text-[17px] text-white [hyphens:auto] [overflow-wrap:anywhere]" lang="fr">{building.name}</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-1 flex cursor-help items-baseline gap-1.5">
                          <b className="hud-title text-3xl leading-none text-white">{level}</b>
                          <span className="font-mono text-xs text-slate-500">/ {building.maxLevel}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-56">
                        {!isLocked && productionResource ? (
                          <div className="space-y-0.5">
                            <p className="mb-1 font-semibold text-slate-300">Prochains paliers</p>
                            {[1, 2, 3].map((step) => {
                              const lvl = level + step;
                              if (lvl > building.maxLevel) return null;
                              return (
                                <p key={lvl} className="tabular-mono">
                                  Niv. {lvl} — <ResourceIcon id={productionResource} /> {productionPerSecond(building.id, lvl)}/s
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          <p>Aucune production directe.</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <LevelTicks level={level} max={building.maxLevel} next={!isLocked && level < building.maxLevel} className="mt-2" />
                  </div>
                </div>

                <div className="relative flex flex-1 flex-col gap-3 px-4 pb-4">
                  <p className="text-sm leading-snug text-slate-400">{building.description}</p>

                  {!isLocked && productionResource && (() => {
                    const cur = productionPerSecond(building.id, level);
                    const nxt = level < building.maxLevel ? productionPerSecond(building.id, nextLevel) : null;
                    return (
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-l-2 border-mint-glow bg-mint-glow/[0.06] px-2.5 py-2 font-mono text-[13px]">
                        <ResourceIcon id={productionResource} className="h-5 w-5" />
                        <b className="text-mint-glow">{formatCompact(cur)}/s</b>
                        {nxt !== null && (
                          <>
                            <span className="text-slate-500">→</span>
                            <span className="text-slate-300">
                              {formatCompact(nxt)}/s <span className="text-slate-500">niv. {nextLevel}</span>
                            </span>
                            {cur > 0 && <span className="ml-auto text-mint-glow">+{Math.round(((nxt - cur) / cur) * 100)} %</span>}
                          </>
                        )}
                      </div>
                    );
                  })()}
                  {!isLocked && building.effect?.type === "storage" && (
                    <p className="border-l-2 border-cyan-glow bg-cyan-glow/[0.05] px-2.5 py-2 text-xs text-slate-300">
                      <GameIcon name="storage" /> {formatCompact(storageCapacityAt(building.effect, level))} par ressource commune · <GameIcon name="shield" />{" "}
                      {formatCompact(storageCapacityAt(building.effect, level) * ECONOMY_RULES.protectedStoragePct)} à l'abri du pillage
                    </p>
                  )}
                  {!isLocked && building.effect?.type === "repair" && (
                    <p className="border-l-2 border-cyan-glow bg-cyan-glow/[0.05] px-2.5 py-2 text-xs text-slate-300">
                      <GameIcon name="repair" /> Répare {Math.round(repairPercentAt(building.effect, level) * 100)} % des vaisseaux perdus
                    </p>
                  )}
                  {!isLocked && building.effect?.type === "hangar" && (
                    <p className="border-l-2 border-cyan-glow bg-cyan-glow/[0.05] px-2.5 py-2 text-xs text-slate-300"><GameIcon name="fleet" /> {formatCompact(building.effect.perLevel * level)} places de hangar</p>
                  )}

                  <div className="mt-auto">
                    {isLocked ? (
                      unlockInfo ? (
                        "multi" in unlockInfo ? (
                          <>
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {unlockInfo.resources.map((r) => (
                                <CostPill key={r.label}>
                                  {formatCompact(r.amount)} {r.label}
                                </CostPill>
                              ))}
                            </div>
                            <Button className="w-full" disabled={pending === building.id} onClick={() => void handleUnlock(building.id)}>
                              Débloquer
                            </Button>
                          </>
                        ) : (
                          <Button className="w-full" disabled={pending === building.id} onClick={() => void handleUnlock(building.id)}>
                            Débloquer · {formatCompact(unlockInfo.amount)} {unlockInfo.label}
                          </Button>
                        )
                      ) : (
                        <Button className="w-full" variant="secondary" disabled>
                          Débloqué via le Labo
                        </Button>
                      )
                    ) : activeUpgrade ? (
                      <div>
                        <div className="mb-1.5 flex items-baseline justify-between font-mono text-[11px] tracking-[0.12em]">
                          <span className="text-mint-glow">● EN CHANTIER → NIV. {nextLevel}</span>
                          <span className="text-slate-400">{formatDuration((activeUpgrade.endTime - now) / 1000)}</span>
                        </div>
                        <Progress value={100 - ((activeUpgrade.endTime - now) / (time * 1000)) * 100} />
                        <div className="mt-1.5 flex justify-end">
                          <CancelJobButton target={{ kind: "building", id: building.id }} compact />
                        </div>
                        {planButton}
                      </div>
                    ) : level >= building.maxLevel ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Niveau maximum
                      </Button>
                    ) : (
                      <>
                        <CostPills cost={cost} stock={player.resources} seconds={time} className="mb-2.5" />
                        {(() => {
                          const wait = secondsToAfford(cost, player.resources, rates);
                          return (
                            <>
                              <Button variant="warn" className="w-full" disabled={pending === building.id || wait > 0} onClick={() => void handleUpgrade(building.id)}>
                                Améliorer → niv. {nextLevel}
                              </Button>
                              {wait > 0 && <BlockedReason>{affordText(wait)}</BlockedReason>}
                            </>
                          );
                        })()}
                        {planButton}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Effet visuel "chantier en cours" sur la vignette d'un bâtiment en
 *  amélioration : hachures de sécurité, faisceau qui balaye l'image, et
 *  badge outil animé — plus parlant qu'une simple barre de progression. */
function ConstructionOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-space-950/45" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,216,107,0.12) 0px, rgba(255,216,107,0.12) 10px, transparent 10px, transparent 20px)",
        }}
      />
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-glow/25 to-transparent"
        animate={{ x: ["-120%", "220%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center bg-gold-glow text-space-950 shadow-[0_0_12px_-2px_var(--color-gold-glow)]"
        animate={{ rotate: [0, -18, 18, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Wrench className="h-4 w-4" />
      </motion.div>
    </div>
  );
}

function categoryLabel(building: (typeof BUILDINGS)[number]): string {
  const res = PRODUCTION_RESOURCE_BY_BUILDING[building.id];
  if (res) return `Production · ${RESOURCE_LIST.find((r) => r.id === res)?.name ?? res}`;
  switch (building.effect?.type) {
    case "storage":
      return "Logistique · Stockage";
    case "repair":
      return "Soutien · Réparation";
    case "hangar":
      return "Militaire · Hangar";
    default:
      return "Infrastructure";
  }
}

/* ---------- paliers visuels (niveaux 5, 10, 15, 20) ---------- */

const TIER_FRAME: Record<number, string> = {
  0: "",
  5: "!border-[var(--th-medal-bronze)]/70",
  10: "!border-slate-200/70",
  15: "!border-gold-glow/80",
  20: "!border-cyan-glow tier-neon",
};

const TIER_LABEL: Record<number, { label: string; className: string }> = {
  5: { label: "Bronze", className: "bg-[var(--th-medal-bronze)]/90 text-space-950" },
  10: { label: "Argent", className: "bg-slate-200/90 text-space-950" },
  15: { label: "Or", className: "hud-holo" },
  20: { label: "Néon", className: "bg-cyan-glow text-space-950" },
};

function TierBadge({ level }: { level: number }) {
  const tier = visualTier(level);
  if (!tier) return null;
  const { label, className } = TIER_LABEL[tier];
  return (
    <span className={cn("absolute left-1.5 top-1.5 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em]", className)}>
      Palier {label}
    </span>
  );
}
