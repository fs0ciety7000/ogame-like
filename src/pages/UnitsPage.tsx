import { Link } from "react-router-dom";
import { assetUrl } from "@/lib/assets";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Boxes } from "lucide-react";
import { toast } from "sonner";
import { Card, HudBrackets } from "@/components/ui/card";
import { HudMeter, HudTag, QtyStepper, StatBar } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { PostureCard } from "@/components/game/PostureCard";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { getUnitCapacity } from "@/game/buildings";
import { hangarUsed } from "@/game/actions";
import { unitsAwayOf } from "@/game/fleets";
import { useFleetStore } from "@/store/fleetStore";
import { findUnit, getUnitBuildTime, UNITS, UNIT_TO_TECH, unitLevelBonus } from "@/game/units";
import { findTech, techBonus } from "@/game/technologies";
import { unitStat } from "@/game/combat";
import { cn, formatDuration, formatNumber } from "@/lib/utils";
import { GameActionError, enqueueUnitBuild, sellUnit } from "@/services/playerService";
import { LevelUpBurst } from "@/components/ui/level-up-burst";
import { GameIcon } from "@/components/ui/game-icon";
import { affordText, BlockedReason, CostPills, secondsToAfford } from "@/components/ui/afford";
import { useProductionRates } from "@/hooks/useLiveResources";

export function UnitsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const uid = useAuthStore((s) => s.user?.uid);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<string | null>(null);
  const fleets = useFleetStore((s) => s.fleets);
  const away = useMemo(() => (uid ? unitsAwayOf(fleets, uid) : {}), [fleets, uid]);
  const rates = useProductionRates(player);

  if (!player || !queues) return null;

  const qty = (id: string) => quantities[id] ?? 1;
  const setQty = (id: string, v: number) => setQuantities((q) => ({ ...q, [id]: Math.max(1, v) }));

  // Places occupées dans le hangar : unités construites + unités en file
  // (déjà réservées, même calcul que enqueueUnitBuild côté service).
  // v3.9.1 : les vaisseaux en mission comptent aussi (ils reviendront).
  const built = (category: "attack" | "defense") => hangarUsed(player.units, away, category);
  const awaySpace = (category: "attack" | "defense") => hangarUsed({}, away, category);
  const reserved = (category: "attack" | "defense") =>
    queues.unitQueues[category].reduce((sum, item) => sum + (findUnit(item.unitId)?.hangarSpace ?? 1), 0);

  const capacity = (category: "attack" | "defense") => getUnitCapacity(player.buildings, category, player.techLevels);

  const handleBuild = async (unitId: string) => {
    if (!uid) return;
    setPending(unitId);
    try {
      const n = qty(unitId);
      const def = findUnit(unitId);
      const ahead = def ? queues?.unitQueues[def.category].filter((e) => e.unitId !== unitId).length ?? 0 : 0;
      await enqueueUnitBuild(uid, unitId, n);
      toast.success(`${n} × ${def?.name ?? unitId} ajouté${n > 1 ? "s" : ""} à la file`, {
        description: ahead > 0 ? "Les unités d'une même catégorie se construisent l'une après l'autre : elles démarreront après la file en cours." : undefined,
      });
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
  // Échelle des jauges : la meilleure unité du jeu remplit la barre.
  const statMax = {
    attack: Math.max(1, ...UNITS.map((u) => unitStat(player.units, player.techLevels, u.id, "attack"))),
    defense: Math.max(1, ...UNITS.map((u) => unitStat(player.units, player.techLevels, u.id, "defense"))),
    speed: Math.max(1, ...UNITS.map((u) => u.stats.vitesse * Math.max(1, player.units[u.id]?.level ?? 1))),
    cargo: Math.max(1, ...UNITS.map((u) => u.stats.cargo * Math.max(1, player.units[u.id]?.level ?? 1))),
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Chantier naval" title="Unités" description="Construis ta flotte d'attaque et de défense." />

      <PostureCard player={player} />

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
                  {awaySpace(cat) > 0 && <span className="text-gold-glow"> (dont {formatNumber(awaySpace(cat))} en vol)</span>}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21rem),1fr))] gap-5">
        {UNITS.map((unit, index) => {
          const data = player.units[unit.id] ?? { level: 0, count: 0 };
          const isLocked = data.level <= 0;
          const buildTime = getUnitBuildTime(unit, player.techLevels, player);
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

          // Unités commandées mais en attente derrière d'autres (file unique
          // par catégorie) : on affiche ce qui passe avant et le délai.
          let waitingInfo: { count: number; startsIn: number; before: string } | null = null;
          if (!isBuildingThis) {
            const firstIndex = queue.findIndex((e) => e.unitId === unit.id);
            if (firstIndex > 0) {
              let startsIn = Math.max(0, Math.floor(((queue[0].endTime ?? now) - now) / 1000));
              for (const e of queue.slice(1, firstIndex)) {
                const u = findUnit(e.unitId);
                startsIn += u ? getUnitBuildTime(u, player.techLevels, player) : 0;
              }
              waitingInfo = {
                count: queue.filter((e) => e.unitId === unit.id).length,
                startsIn,
                before: findUnit(queue[0].unitId)?.name ?? queue[0].unitId,
              };
            }
          }

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              whileHover={{ y: -3 }}
            >
              <Card className="hud-glitch flex h-full flex-col">
                <HudBrackets />
                <div className="relative px-4 pt-4">
                  <HudTag tone={unit.category === "attack" ? "danger" : "accent"}>
                    {unit.category === "attack" ? "Attaque" : "Défense"} · {unit.hangarSpace} place{unit.hangarSpace > 1 ? "s" : ""}
                  </HudTag>
                </div>
                <div className="hud-stage relative mt-2 grid h-44 place-items-center">
                  <LevelUpBurst level={data.level} colorVar="var(--color-cyan-glow)" />
                  {!isLocked && (
                    <div className="absolute right-4 top-1 z-[2] text-right">
                      <b className="hud-title block text-3xl leading-none text-white">{formatNumber(data.count)}</b>
                      <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">EN HANGAR</span>
                    </div>
                  )}
                  <img
                    src={assetUrl(unit.image)}
                    alt={unit.name}
                    className={cn("hud-float relative max-h-40 w-[78%] object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.6)]", isLocked && "opacity-40 grayscale")}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0";
                    }}
                  />
                  <div className="hud-scan" />
                </div>

                <div className="relative flex flex-1 flex-col gap-3 p-4 pt-3">
                  <div>
                    <h3 className="hud-title text-xl text-white">{unit.name}</h3>
                    <p className="mt-0.5 text-sm leading-snug text-slate-400">{isLocked && !unit.blueprint ? "" : unit.description}</p>
                  </div>

                  {isLocked ? (
                    <p className="text-sm text-slate-500">
                      <GameIcon name="lock" />{" "}
                      {unit.blueprint ? (
                        <>
                          Plan vendu au <Link to="/game/primes" className="font-semibold text-gold-glow hover:underline">Comptoir de la Ruche</Link> (Kesh'Vaar).
                        </>
                      ) : (
                        <>
                          Se débloque au Labo : <strong className="text-slate-300">{findTech(UNIT_TO_TECH[unit.id])?.nom ?? "recherche"}</strong>
                        </>
                      )}
                    </p>
                  ) : (
                    <>
                      {(() => {
                        const attackTechBonus = Math.round(techBonus(player.techLevels, "unit_attack") * 100);
                        const defenseTechBonus = Math.round(techBonus(player.techLevels, "unit_defense") * 100);
                        const atk = Math.round(unitStat(player.units, player.techLevels, unit.id, "attack"));
                        const def = Math.round(unitStat(player.units, player.techLevels, unit.id, "defense"));
                        return (
                          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="ATK" value={atk} max={statMax.attack} color="var(--color-danger-glow)" display={formatNumber(atk)} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Base {unit.stats.attaque} + {(data.level - 1) * unitLevelBonus(unit)} (niveau) {attackTechBonus > 0 && `× ${attackTechBonus}% (tech Puissance d'attaque)`}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="DEF" value={def} max={statMax.defense} color="var(--color-cyan-glow)" display={formatNumber(def)} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Base {unit.stats.defense} + {(data.level - 1) * unitLevelBonus(unit)} (niveau) {defenseTechBonus > 0 && `× ${defenseTechBonus}% (tech Blindage avancé)`}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="VIT" value={unit.stats.vitesse * data.level} max={statMax.speed} color="var(--color-mint-glow)" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Base {unit.stats.vitesse} × niveau {data.level}. Une flotte avance à la vitesse de son vaisseau le plus lent.
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="CAP" value={unit.stats.cargo * data.level} max={statMax.cargo} color="var(--color-gold-glow)" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Base {unit.stats.cargo} × niveau {data.level}.</TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })()}

                      <CostPills cost={{ scrap: unit.cost.scrap * qty(unit.id), energy: unit.cost.energy * qty(unit.id) }} stock={player.resources} seconds={buildTime} perUnit />

                      {queueInfo ? (
                        <p className="flex flex-wrap items-center gap-x-2 font-mono text-xs text-mint-glow">
                          ● EN CHANTIER · {formatDuration(queueInfo.remaining)} ({queueInfo.count} en file)
                          <CancelJobButton target={{ kind: "units", category: unit.category, index: 0 }} compact className="ml-auto" />
                        </p>
                      ) : waitingInfo ? (
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-gold-glow" title="Les unités d'une même catégorie se construisent l'une après l'autre.">
                          <span>
                            <GameIcon name="duration" /> {waitingInfo.count} en attente derrière {waitingInfo.before} — début dans {formatDuration(waitingInfo.startsIn)}
                          </span>
                          <CancelJobButton target={{ kind: "units", category: unit.category, index: queue.findIndex((e) => e.unitId === unit.id) }} compact className="ml-auto" />
                        </p>
                      ) : null}

                      <div className="mt-auto">
                        <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.12em]">
                          <span className="text-slate-500">HANGAR {hangarLabel.toUpperCase()}</span>
                          <span className={neededSpace > freeSpace ? "text-danger-glow" : "text-slate-400"}>
                            {formatNumber(freeSpace)} libre{freeSpace > 1 ? "s" : ""}
                          </span>
                        </div>
                        <HudMeter
                          className="mt-1.5"
                          percent={capacity(unit.category) > 0 ? ((built(unit.category) + reserved(unit.category)) / capacity(unit.category)) * 100 : 0}
                          tone={neededSpace > freeSpace ? "var(--color-danger-glow)" : undefined}
                        />
                      </div>
                      <QtyStepper value={qty(unit.id)} onChange={(v) => setQty(unit.id, v)} max={Math.max(1, Math.floor(freeSpace / unit.hangarSpace))} />
                      {(() => {
                        const batch = { scrap: unit.cost.scrap * qty(unit.id), energy: unit.cost.energy * qty(unit.id) };
                        const wait = secondsToAfford(batch, player.resources, rates);
                        const noRoom = neededSpace > freeSpace;
                        return (
                          <div>
                            <div className="flex gap-2">
                              <Button className="flex-1" disabled={pending === unit.id || noRoom || wait > 0} onClick={() => void handleBuild(unit.id)}>
                                Construire ×{formatNumber(qty(unit.id))}
                              </Button>
                              <Button variant="outline" disabled={pending === unit.id || data.count === 0} onClick={() => void handleSell(unit.id)}>
                                Vendre
                              </Button>
                            </div>
                            {noRoom ? (
                              <BlockedReason tone="block">
                                Hangar {hangarLabel} trop petit : {formatNumber(neededSpace)} places demandées pour {formatNumber(freeSpace)} libres. Réduis la quantité ou agrandis le hangar.
                              </BlockedReason>
                            ) : wait > 0 ? (
                              <BlockedReason>{affordText(wait)}</BlockedReason>
                            ) : null}
                          </div>
                        );
                      })()}
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
