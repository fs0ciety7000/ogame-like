import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { getUnitCapacity } from "@/game/buildings";
import { findUnit, getUnitBuildTime, UNITS, UNIT_TO_TECH } from "@/game/units";
import { findTech } from "@/game/technologies";
import { formatDuration, formatNumber } from "@/lib/utils";
import { GameActionError, enqueueUnitBuild, sellUnit } from "@/services/playerService";

export function UnitsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<string | null>(null);

  if (!player || !queues) return null;

  const qty = (id: string) => quantities[id] ?? 1;
  const setQty = (id: string, v: number) => setQuantities((q) => ({ ...q, [id]: Math.max(1, v) }));

  const built = (category: "attack" | "defense") =>
    Object.entries(player.units).reduce((sum, [id, u]) => {
      const def = findUnit(id);
      return def?.category === category ? sum + u.count : sum;
    }, 0);

  const capacity = (category: "attack" | "defense") => getUnitCapacity(player.buildings, category);

  const handleBuild = async (unitId: string) => {
    if (!uid) return;
    setPending(unitId);
    try {
      await enqueueUnitBuild(uid, unitId, qty(unitId));
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  const handleSell = async (unitId: string) => {
    if (!uid) return;
    setPending(unitId);
    try {
      await sellUnit(uid, unitId, qty(unitId));
      toast.success("Unités vendues.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setPending(null);
    }
  };

  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl text-white glow-text">Unités</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["attack", "defense"] as const).map((cat) => {
          const b = built(cat);
          const cap = capacity(cat);
          return (
            <Card key={cat} className="p-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-300">Capacité {cat === "attack" ? "d'attaque" : "de défense"}</span>
                <span className="text-slate-400">
                  {formatNumber(b)} / {formatNumber(cap)}
                </span>
              </div>
              <Progress value={cap > 0 ? (b / cap) * 100 : 0} />
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {UNITS.map((unit) => {
          const data = player.units[unit.id] ?? { level: 0, count: 0 };
          const isLocked = data.level <= 0;
          const buildTime = getUnitBuildTime(unit);
          const queue = queues.unitQueues[unit.category];
          const isBuildingThis = queue.length > 0 && queue[0].unitId === unit.id;

          let queueInfo: { remaining: number; count: number } | null = null;
          if (isBuildingThis) {
            let count = 0;
            for (const entry of queue) {
              if (entry.unitId === unit.id) count++;
              else break;
            }
            const remaining = Math.max(0, Math.floor(((queue[0].endTime ?? now) - now) / 1000)) + (count - 1) * buildTime;
            queueInfo = { remaining, count };
          }

          return (
            <Card key={unit.id} className="flex flex-col overflow-hidden">
              <div className="aspect-video bg-space-800">
                <img src={unit.image} alt={unit.name} className="h-full w-full object-contain p-4" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-display text-sm text-slate-100">{unit.name}</h3>

                {isLocked ? (
                  <p className="text-xs text-slate-500">
                    🔒 Débloquez via le Labo : <strong>{findTech(UNIT_TO_TECH[unit.id])?.nom ?? "recherche"}</strong>
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-slate-400">{unit.description}</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded bg-space-800 px-1.5 py-0.5 text-danger-glow">
                        ATK {unit.stats.attaque + (data.level - 1) * 5}
                      </span>
                      <span className="rounded bg-space-800 px-1.5 py-0.5 text-cyan-glow">
                        DEF {unit.stats.defense + (data.level - 1) * 5}
                      </span>
                      <span className="rounded bg-space-800 px-1.5 py-0.5 text-slate-300">
                        VIT {unit.stats.vitesse * data.level}
                      </span>
                      <span className="rounded bg-space-800 px-1.5 py-0.5 text-slate-300">
                        CAP {unit.stats.cargo * data.level}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Possédés : <strong className="text-slate-200">{data.count}</strong>
                    </p>

                    {queueInfo ? (
                      <p className="text-xs text-mint-glow">
                        ⏱️ {formatDuration(queueInfo.remaining)} ({queueInfo.count} en file)
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        ⏱️ {formatDuration(buildTime)} / unité — {unit.cost.scrap} 🔩 {unit.cost.energy} ⚡
                      </p>
                    )}

                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <Input
                        type="number"
                        min={1}
                        value={qty(unit.id)}
                        onChange={(e) => setQty(unit.id, parseInt(e.target.value) || 1)}
                        className="w-16"
                      />
                      <Button size="sm" className="flex-1" disabled={pending === unit.id} onClick={() => void handleBuild(unit.id)}>
                        Construire
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending === unit.id || data.count === 0}
                        onClick={() => void handleSell(unit.id)}
                      >
                        Vendre
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
