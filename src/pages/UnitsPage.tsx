import { useState } from "react";
import { motion } from "framer-motion";
import { Boxes } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { getUnitCapacity } from "@/game/buildings";
import { findUnit, getUnitBuildTime, UNITS, UNIT_TO_TECH } from "@/game/units";
import { findTech, techBonus } from "@/game/technologies";
import { unitStat } from "@/game/combat";
import { cn, formatDuration, formatNumber } from "@/lib/utils";
import { GameActionError, enqueueUnitBuild, sellUnit } from "@/services/playerService";
import { LevelUpBurst } from "@/components/ui/level-up-burst";

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

  // Places occupées dans le hangar : unités construites + unités en file
  // (déjà réservées, même calcul que enqueueUnitBuild côté service).
  const built = (category: "attack" | "defense") =>
    Object.entries(player.units).reduce((sum, [id, u]) => {
      const def = findUnit(id);
      return def?.category === category ? sum + u.count * def.hangarSpace : sum;
    }, 0);
  const reserved = (category: "attack" | "defense") =>
    queues.unitQueues[category].reduce((sum, item) => sum + (findUnit(item.unitId)?.hangarSpace ?? 1), 0);

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
      <PageHeader eyebrow="Cosmic Empires / Chantier naval" title="Unités" description="Construis ta flotte d'attaque et de défense." />

      <div className="grid gap-3 sm:grid-cols-2">
        {(["attack", "defense"] as const).map((cat) => {
          const b = built(cat);
          const r = reserved(cat);
          const cap = capacity(cat);
          const percent = cap > 0 ? ((b + r) / cap) * 100 : 0;
          return (
            <Card key={cat} className="flex items-center gap-4 p-4">
              <RadialGauge value={percent} size={64} strokeWidth={5} color={cat === "attack" ? "var(--color-danger-glow)" : "var(--color-cyan-glow)"}>
                <span className="tabular-mono text-xs font-medium text-slate-200">{Math.round(percent)}%</span>
              </RadialGauge>
              <div>
                <p className="text-sm text-slate-300">Capacité {cat === "attack" ? "d'attaque" : "de défense"}</p>
                <p className="tabular-mono text-xs text-slate-500">
                  {formatNumber(b + r)} / {formatNumber(cap)} places
                  {r > 0 && <span className="text-mint-glow"> (dont {formatNumber(r)} en file)</span>}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-4">
        {UNITS.map((unit, index) => {
          const data = player.units[unit.id] ?? { level: 0, count: 0 };
          const isLocked = data.level <= 0;
          const buildTime = getUnitBuildTime(unit);
          const queue = queues.unitQueues[unit.category];
          const isBuildingThis = queue.length > 0 && queue[0].unitId === unit.id;
          const hangarLabel = unit.category === "attack" ? "d'attaque" : "de défense";
          const freeSpace = Math.max(0, capacity(unit.category) - built(unit.category) - reserved(unit.category));
          const neededSpace = qty(unit.id) * unit.hangarSpace;

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
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              whileHover={{ y: -3 }}
            >
              <Card className="flex h-full flex-col overflow-hidden">
                <div className="relative flex justify-center pt-3">
                  <LevelUpBurst level={data.level} colorVar="var(--color-cyan-glow)" />
                  <div className="relative h-[180px] w-[180px] shrink-0 overflow-hidden rounded-lg bg-space-800">
                    <img
                      src={unit.image}
                      alt={unit.name}
                      width={180}
                      height={180}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "absolute right-1.5 top-1.5 flex cursor-help items-center gap-1 rounded-md border bg-space-950/80 px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur tabular-mono",
                            unit.hangarSpace >= 100
                              ? "border-danger-glow/50 text-danger-glow"
                              : unit.hangarSpace > 1
                                ? "border-gold-glow/50 text-gold-glow"
                                : "border-white/15 text-slate-300",
                          )}
                        >
                          <Boxes className="h-3 w-3" />
                          {unit.hangarSpace}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Occupe {unit.hangarSpace} place{unit.hangarSpace > 1 ? "s" : ""} dans le hangar {hangarLabel}
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                      <div className="flex flex-wrap gap-1.5 tabular-mono text-[11px]">
                        {(() => {
                          const attackTechBonus = Math.round(techBonus(player.techLevels, "unit_attack") * 100);
                          const defenseTechBonus = Math.round(techBonus(player.techLevels, "unit_defense") * 100);
                          return (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help rounded bg-space-800 px-1.5 py-0.5 text-danger-glow">
                                    ATK {Math.round(unitStat(player.units, player.techLevels, unit.id, "attack"))}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Base {unit.stats.attaque} + {(data.level - 1) * 5} (niveau) {attackTechBonus > 0 && `× ${attackTechBonus}% (tech Puissance d'attaque)`}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help rounded bg-space-800 px-1.5 py-0.5 text-cyan-glow">
                                    DEF {Math.round(unitStat(player.units, player.techLevels, unit.id, "defense"))}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Base {unit.stats.defense} + {(data.level - 1) * 5} (niveau) {defenseTechBonus > 0 && `× ${defenseTechBonus}% (tech Blindage avancé)`}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help rounded bg-space-800 px-1.5 py-0.5 text-slate-300">
                                    VIT {unit.stats.vitesse * data.level}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Vitesse de base {unit.stats.vitesse} × niveau {data.level}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help rounded bg-space-800 px-1.5 py-0.5 text-slate-300">
                                    CAP {unit.stats.cargo * data.level}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Capacité de cargaison de base {unit.stats.cargo} × niveau {data.level}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex cursor-help items-center gap-1 rounded bg-space-800 px-1.5 py-0.5 text-gold-glow">
                                    <Boxes className="h-3 w-3" /> PLACE {unit.hangarSpace}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {unit.hangarSpace} place{unit.hangarSpace > 1 ? "s" : ""} par unité dans le hangar {hangarLabel}
                                  {data.count > 0 && ` — tes ${data.count} unités en occupent ${formatNumber(data.count * unit.hangarSpace)}`}
                                </TooltipContent>
                              </Tooltip>
                            </>
                          );
                        })()}
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

                      <p
                        className={cn(
                          "mt-auto flex items-center gap-1 pt-2 text-[11px] tabular-mono",
                          neededSpace > freeSpace ? "text-danger-glow" : "text-slate-500",
                        )}
                      >
                        <Boxes className="h-3 w-3 shrink-0" />
                        {formatNumber(neededSpace)} pl. requise{neededSpace > 1 ? "s" : ""} / {formatNumber(freeSpace)} libre
                        {freeSpace > 1 ? "s" : ""}
                      </p>
                      <div className="flex items-center gap-2">
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
