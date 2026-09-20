import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import {
  applyBuildingDiscount,
  BUILDING_UNLOCK_COST,
  BUILDINGS,
  buildingImage,
  getBuildingUpgradeCost,
  getBuildingUpgradeTime,
  LOCKABLE_BUILDINGS,
  productionPerSecond,
  PRODUCTION_RESOURCE_BY_BUILDING,
} from "@/game/buildings";
import { formatDuration } from "@/lib/utils";
import { GameActionError, startBuildingUpgrade, unlockBuilding } from "@/services/playerService";
import { formatCost, resourceEmoji } from "@/game/resources";
import type { BuildingId } from "@/types/game";

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
      <h1 className="font-display text-xl text-white glow-text">Bâtiments</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BUILDINGS.map((building, index) => {
          const state = player.buildings[building.id];
          const isLocked = LOCKABLE_BUILDINGS.includes(building.id) ? !state.unlocked : false;
          const unlockInfo = BUILDING_UNLOCK_COST[building.id];
          const activeUpgrade = queues.buildingUpgrades[building.id];
          const level = state.level;
          const nextLevel = level + 1;
          const rawCost = getBuildingUpgradeCost(building, nextLevel);
          const cost = applyBuildingDiscount(rawCost, player.bonuses.buildingUpgradeDiscount);
          const time = getBuildingUpgradeTime(building, nextLevel);
          const productionResource = PRODUCTION_RESOURCE_BY_BUILDING[building.id];

          return (
            <motion.div
              key={building.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              whileHover={{ y: -3 }}
            >
              <Card className="flex h-full flex-col overflow-hidden">
                <div className="relative aspect-video bg-space-800">
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
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm text-slate-100">{building.name}</h3>
                    <span className="text-xs text-slate-400">
                      Niv. {level} / {building.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{building.description}</p>

                  {!isLocked && productionResource && (
                    <p className="text-xs text-mint-glow">
                      {resourceEmoji(productionResource)} Production : {productionPerSecond(building.id, level)}/s
                    </p>
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
