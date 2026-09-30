import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { GameActionError, startBuildingUpgrade, unlockBuilding } from "@/services/playerService";
import { formatCost, resourceEmoji } from "@/game/resources";
import type { BuildingId } from "@/types/game";
import { LevelUpBurst } from "@/components/ui/level-up-burst";

export function BuildingsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [pending, setPending] = useState<string | null>(null);

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

  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Infrastructure" title="Bâtiments" description="Débloque et améliore les structures de ton empire." />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-4">
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
          const time = getBuildingUpgradeTime(building, nextLevel);
          const productionResource = PRODUCTION_RESOURCE_BY_BUILDING[building.id];
          const nearlyDone = !!activeUpgrade && activeUpgrade.endTime - now < 10_000;

          return (
            <motion.div
              key={building.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              whileHover={{ y: -3 }}
            >
              <Card className={cn("flex h-full flex-col overflow-hidden", nearlyDone && "animate-pulse-alert")}>
                <div className="relative flex justify-center pt-3">
                  <LevelUpBurst level={level} />
                  <div className={cn("relative h-[180px] w-[180px] overflow-hidden rounded-lg bg-space-800", TIER_FRAME[visualTier(level)])}>
                    <img
                      src={buildingImage(building, level)}
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
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm text-slate-100">{building.name}</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help text-xs text-slate-400">
                          Niv. {level} / {building.maxLevel}
                        </span>
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
                                  Niv. {lvl} — {resourceEmoji(productionResource)} {productionPerSecond(building.id, lvl)}/s
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          <p>Aucune production directe.</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-slate-400">{building.description}</p>

                  {!isLocked && productionResource && (
                    <p className="text-xs text-mint-glow">
                      {resourceEmoji(productionResource)} Production : {productionPerSecond(building.id, level)}/s
                    </p>
                  )}
                  {!isLocked && building.effect?.type === "storage" && (
                    <p className="text-xs text-cyan-glow">
                      📦 Capacité : {formatCompact(storageCapacityAt(building.effect, level))} par ressource commune · 🛡️{" "}
                      {formatCompact(storageCapacityAt(building.effect, level) * ECONOMY_RULES.protectedStoragePct)} à l'abri du pillage
                    </p>
                  )}
                  {!isLocked && building.effect?.type === "repair" && (
                    <p className="text-xs text-cyan-glow">🔧 Répare {Math.round(repairPercentAt(building.effect, level) * 100)} % des vaisseaux perdus</p>
                  )}
                  {!isLocked && building.effect?.type === "hangar" && (
                    <p className="text-xs text-cyan-glow">🛰️ {formatCompact(building.effect.perLevel * level)} places de hangar</p>
                  )}

                  <div className="mt-auto pt-2">
                    {isLocked ? (
                      unlockInfo ? (
                        "multi" in unlockInfo ? (
                          <>
                            <p className="mb-2 text-xs text-slate-500">
                              Déblocage : {unlockInfo.resources.map((r) => `${r.amount} ${r.label}`).join(", ")}
                            </p>
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={pending === building.id}
                              onClick={() => void handleUnlock(building.id)}
                            >
                              Débloquer
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={pending === building.id}
                            onClick={() => void handleUnlock(building.id)}
                          >
                            Débloquer ({unlockInfo.amount} {unlockInfo.label})
                          </Button>
                        )
                      ) : (
                        <Button size="sm" className="w-full" variant="secondary" disabled>
                          Débloqué via le Labo
                        </Button>
                      )
                    ) : activeUpgrade ? (
                      <div>
                        <Progress
                          value={100 - ((activeUpgrade.endTime - now) / (time * 1000)) * 100}
                          className="mb-2"
                        />
                        <p className="text-center text-xs text-slate-400">
                          Temps restant : {formatDuration((activeUpgrade.endTime - now) / 1000)}
                        </p>
                      </div>
                    ) : level >= building.maxLevel ? (
                      <Button size="sm" className="w-full" variant="secondary" disabled>
                        Niveau maximum
                      </Button>
                    ) : (
                      <>
                        <p className="mb-2 text-xs text-slate-500">
                          Coût : {formatCost(cost)} — {formatDuration(time)}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={pending === building.id}
                          onClick={() => void handleUpgrade(building.id)}
                        >
                          Améliorer
                        </Button>
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
        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold-glow text-space-950 shadow-[0_0_12px_-2px_var(--color-gold-glow)]"
        animate={{ rotate: [0, -18, 18, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Wrench className="h-4 w-4" />
      </motion.div>
    </div>
  );
}

/* ---------- paliers visuels (niveaux 5, 10, 15, 20) ---------- */

const TIER_FRAME: Record<number, string> = {
  0: "",
  5: "ring-2 ring-[#cd7f32]/70 shadow-[0_0_14px_rgba(205,127,50,0.35)]",
  10: "ring-2 ring-slate-200/70 shadow-[0_0_16px_rgba(203,213,225,0.35)]",
  15: "ring-2 ring-gold-glow/80 shadow-[0_0_20px_rgba(255,209,102,0.45)]",
  20: "ring-2 ring-cyan-glow shadow-[0_0_26px_rgba(75,232,255,0.6)] tier-neon",
};

const TIER_LABEL: Record<number, { label: string; className: string }> = {
  5: { label: "Bronze", className: "bg-[#cd7f32]/90 text-space-950" },
  10: { label: "Argent", className: "bg-slate-200/90 text-space-950" },
  15: { label: "Or", className: "bg-gold-glow/90 text-space-950" },
  20: { label: "Néon", className: "bg-cyan-glow text-space-950" },
};

function TierBadge({ level }: { level: number }) {
  const tier = visualTier(level);
  if (!tier) return null;
  const { label, className } = TIER_LABEL[tier];
  return (
    <span className={cn("absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", className)}>
      ★ {label}
    </span>
  );
}
