import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { getRewardText, hasPrerequisites, MISSIONS } from "@/game/missions";
import { findUnit } from "@/game/units";
import { formatClock } from "@/lib/utils";
import { GameActionError, startMission } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";

export function MissionsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [pending, setPending] = useState<string | null>(null);

  if (!player || !queues) return null;

  const now = Date.now();

  const handleStart = async (key: string) => {
    if (!uid) return;
    setPending(key);
    try {
      await startMission(uid, key);
      triggerWarpEffect();
      toast.success("Mission lancée !");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl text-white glow-text">Missions</h1>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Object.values(MISSIONS).map((mission) => {
          const active = queues.activeMissions.find((m) => m.key === mission.key);
          const hasReq = hasPrerequisites(mission, player.units);
          const prereqEntries = Object.entries(mission.prereq);

          return (
            <Card key={mission.key} className="flex flex-col gap-2 p-4">
              <h3 className="font-display text-sm text-slate-100">{mission.name}</h3>
              <p className="text-xs text-slate-500">Durée : {Math.floor(mission.duration / 60)} min</p>

              <p className="text-xs text-slate-400">
                Prérequis :{" "}
                {prereqEntries.map(([id, count], i) => (
                  <span key={id}>
                    {i > 0 && " + "}
                    {count} {findUnit(id)?.name ?? id}
                  </span>
                ))}
              </p>

              <p className="text-xs text-mint-glow">{getRewardText(mission.reward).join(" · ")}</p>

              <div className="mt-auto pt-2">
                {active ? (
                  <div>
                    <Progress value={100 - ((active.endTime - now) / (mission.duration * 1000)) * 100} className="mb-2" />
                    <p className="text-center text-xs text-slate-400">
                      Temps restant : {formatClock(Math.max(0, Math.floor((active.endTime - now) / 1000)))}
                    </p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!hasReq || pending === mission.key}
                    onClick={() => void handleStart(mission.key)}
                  >
                    {hasReq ? "Lancer la mission" : "Prérequis non remplis"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
