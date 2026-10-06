import { playerModifiers } from "@/game/modifiers";
import { eliteStatus } from "@/game/eliteUnits";
import { classUnitBlocker } from "@/game/classUnits";
import { findEmpireClass } from "@/game/empireClass";
import { playerUnitCost } from "@/game/effectTargets";
import { PERSONALITY_LABELS } from "@/game/warlords";
import { Link } from "react-router-dom";
import { assetUrl } from "@/lib/assets";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { useMemo, useState } from "react";
import { SortableGrid, SortableGridToggle } from "@/components/ui/sortable-grid";
import { motion } from "framer-motion";
import { Boxes } from "lucide-react";
import { toast } from "sonner";
import { Card, HudBrackets } from "@/components/ui/card";
import { HudCallout, HudChip, HudMeter, HudTag, QtyStepper, StatBar } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { PostureCard } from "@/components/game/PostureCard";
import { HoloCylinderLazy } from "@/components/fx/HoloCylinderLazy";
import { UnitSpecButton } from "@/components/game/UnitSpecSheet";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { hangarLoad, type HangarLoad } from "@/game/hangar";
import { unitsAwayOf } from "@/game/fleets";
import { useFleetStore } from "@/store/fleetStore";
import { findUnit, getUnitBuildTime, UNITS, UNIT_TO_TECH, unitLevelBonus } from "@/game/units";
import { findTech, techBonus } from "@/game/technologies";
import { CLASS_BEATS, COMBAT_RULES, unitStat } from "@/game/combat";
import { UNIT_CLASS_LABELS, unitClasses, type UnitClass } from "@/game/unitClasses";
import { dockReadyCount, hullPercent, workshopUnits } from "@/game/workshop";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // 5.18 : onglets Vaisseaux / Défenses (6.4 : libellés, constat C4) et filtre par classe (calculée d'après les stats).
  // 5.26 : ?onglet=defense ouvre directement les défenses (liens « Renforcer les défenses »).
  const [tab, setTab] = useState<"attack" | "defense">(() => (new URLSearchParams(window.location.search).get("onglet") === "defense" ? "defense" : "attack"));
  const [classFilter, setClassFilter] = useState<UnitClass | "all">("all");
  const [editingCards, setEditingCards] = useState(false);
  const classes = useMemo(() => unitClasses(UNITS), []);
  if (!player || !queues) return null;

  const qty = (id: string) => quantities[id] ?? 1;
  const setQty = (id: string, v: number) => setQuantities((q) => ({ ...q, [id]: Math.max(1, v) }));

  // 5.27.2 : places de hangar, même calcul que le serveur (hangar.ts) : à quai, en vol, à l'Atelier hors
  // Cale sèche, et file du chantier.
  const loads: Record<"attack" | "defense", HangarLoad> = {
    attack: hangarLoad(player, queues, away, "attack"),
    defense: hangarLoad(player, queues, away, "defense"),
  };
  const built = (category: "attack" | "defense") => loads[category].occupied;
  const reserved = (category: "attack" | "defense") => loads[category].queue;
  const capacity = (category: "attack" | "defense") => loads[category].capacity;
  const readyInDock = dockReadyCount(player);
  const repairDock = workshopUnits(player);

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
          const l = loads[cat];
          const percent = l.capacity > 0 ? (l.used / l.capacity) * 100 : 0;
          return (
            <Card key={cat} className="flex items-center gap-4 p-4">
              <RadialGauge value={Math.min(100, percent)} size={64} strokeWidth={5} color={l.overflow > 0 ? "var(--color-ember-glow)" : cat === "attack" ? "var(--color-danger-glow)" : "var(--color-cyan-glow)"}>
                <span className="tabular-mono text-xs font-medium text-slate-200">{Math.round(percent)}%</span>
              </RadialGauge>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-300">
                  Capacité {cat === "attack" ? "d'attaque" : "de défense"}
                  {l.overflow > 0 && <HudTag tone="ember">Surcharge</HudTag>}
                </p>
                <p className="tabular-mono text-xs text-slate-500">
                  {formatNumber(l.used)} / {formatNumber(l.capacity)} places
                  {l.queue > 0 && <span className="text-mint-glow"> (dont {formatNumber(l.queue)} en file)</span>}
                  {l.away > 0 && <span className="text-gold-glow"> (dont {formatNumber(l.away)} en vol)</span>}
                  {l.workshop > 0 && <span className="text-ember-glow"> (dont {formatNumber(l.workshop)} à l'Atelier)</span>}
                </p>
                {cat === "attack" && l.dockCapacity > 0 && (
                  <p className="tabular-mono text-xs text-slate-500">
                    Cale sèche : {formatNumber(l.dockUsed)} / {formatNumber(l.dockCapacity)} postes, hors hangar
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 5.27.2 : surcharge (ex. migration 5.22, Ascension) : rien n'est détruit, les sorties sont proposées. */}
      {(["attack", "defense"] as const)
        .filter((cat) => loads[cat].overflow > 0)
        .map((cat) => (
          <HudCallout key={cat} tone="ember" className="flex flex-col gap-2 text-sm text-slate-300">
            <p>
              <strong className="text-slate-100">Hangar {cat === "attack" ? "d'attaque" : "de défense"} en surcharge</strong> :{" "}
              <span className="font-mono">+{formatNumber(loads[cat].overflow)}</span> places au-delà de la capacité. Tes unités restent, mais le chantier ne
              construit plus rien de cette catégorie tant que la surcharge dure.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/game/batiments">Améliorer le hangar</Link>
              </Button>
              {cat === "attack" && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/game/galaxie">Envoyer une flotte</Link>
                </Button>
              )}
              <span className="self-center text-xs text-slate-400">
                ou vendre l'excédent (bouton « Vendre » de chaque unité, 50 % du prix)
                {cat === "attack" && " ; à l'Atelier, la Cale sèche libère les places des vaisseaux en réparation"}.
              </span>
            </div>
          </HudCallout>
        ))}
      {readyInDock > 0 && (
        <HudCallout tone="accent" className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
          <span>
            <span className="font-mono text-slate-100">{formatNumber(readyInDock)}</span> vaisseau{readyInDock > 1 ? "x" : ""} réparé{readyInDock > 1 ? "s" : ""} attend
            {readyInDock > 1 ? "ent" : ""} une place en Cale sèche.
          </span>
          <Button asChild size="sm">
            <Link to="/game/batiments?onglet=atelier">Remettre en service</Link>
          </Button>
        </HudCallout>
      )}

      {/* 5.24 : vitrine holographique des unités au hangar de l'onglet, effectif sous chacune. */}
      {(() => {
        const owned = UNITS.filter((u) => u.category === tab && (player.units[u.id]?.count ?? 0) > 0);
        if (owned.length === 0) return null;
        return (
          <HoloCylinderLazy
            mode="gallery"
            className="hud-cut h-[260px] border border-cyan-glow/15 bg-space-950/60 sm:h-[300px]"
            items={owned.map((u) => ({ id: u.id, image: u.image, label: u.name, sub: `× ${formatNumber(player.units[u.id]?.count ?? 0)} au hangar` }))}
            fallback={null}
          />
        );
      })()}

      <div className="flex flex-col gap-2">
        <Tabs value={tab} onValueChange={(v) => {
            setTab(v === "defense" ? "defense" : "attack");
            setClassFilter("all");
          }}>
          <TabsList>
            <TabsTrigger value="attack">
              Vaisseaux <span className="ml-1 font-mono text-slate-500">{UNITS.filter((u) => u.category === "attack").length}</span>
            </TabsTrigger>
            <TabsTrigger value="defense">
              Défenses <span className="ml-1 font-mono text-slate-500">{UNITS.filter((u) => u.category === "defense").length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Classe d'unité">
          {(["all", "light", "medium", "heavy", "support"] as const)
            .filter((c) => c === "all" || UNITS.some((u) => u.category === tab && classes[u.id] === c))
            .map((c) => (
              <Button key={c} size="sm" variant={classFilter === c ? "secondary" : "ghost"} aria-pressed={classFilter === c} onClick={() => setClassFilter(c)}>
                {c === "all" ? "Toutes" : UNIT_CLASS_LABELS[c]}
              </Button>
            ))}
          <span className="text-[11px] text-slate-500">
            Classe d'après l'attaque et la résistance. Au combat, Fort bat Moyen, Moyen bat Faible, Faible bat Fort (<span className="font-mono">±{Math.round(COMBAT_RULES.classEdge * 100)} %</span> de dégâts) : panache ta flotte.
          </span>
          <div className="ml-auto">
            <SortableGridToggle page="unites" editing={editingCards} onToggle={() => setEditingCards((e) => !e)} />
          </div>
        </div>
      </div>

      <SortableGrid page="unites" editing={editingCards} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,21rem),1fr))] gap-5" items={UNITS.filter((u) => u.category === tab && (classFilter === "all" || classes[u.id] === classFilter))} getId={(unit) => unit.id} getLabel={(unit) => unit.name} render={(unit, index) => {
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <HudTag tone={unit.category === "attack" ? "danger" : "accent"}>
                      {unit.category === "attack" ? "Vaisseau" : "Défense"} · {unit.hangarSpace} place{unit.hangarSpace > 1 ? "s" : ""}
                    </HudTag>
                    <span title={classes[unit.id] && classes[unit.id] !== "support" ? `Bat la classe ${UNIT_CLASS_LABELS[CLASS_BEATS[classes[unit.id] as "light"]]}, craint la classe ${UNIT_CLASS_LABELS[(Object.keys(CLASS_BEATS) as ("light" | "medium" | "heavy")[]).find((k) => CLASS_BEATS[k] === classes[unit.id])!]}.` : "Ne combat pas."}>
                      <HudTag tone={classes[unit.id] === "heavy" ? "gold" : classes[unit.id] === "medium" ? "accent" : "mint"}>{UNIT_CLASS_LABELS[classes[unit.id] ?? "light"]}</HudTag>
                    </span>
                    {/* 5.20 : coque abîmée et unités immobilisées à l'Atelier. */}
                    {(() => {
                      const hull = hullPercent(player, unit.id);
                      const docked = repairDock[unit.id] ?? 0;
                      return (
                        <>
                          {hull < 0.995 && (
                            <HudChip asChild size="sm" tone={hull >= 0.8 ? "mint" : hull >= 0.4 ? "ember" : "danger"}>
                              <Link to="/game/batiments?onglet=atelier" title="Points de vie restants : la flotte abîmée tire et encaisse moins.">
                                Coque {Math.round(hull * 100)} %
                              </Link>
                            </HudChip>
                          )}
                          {docked > 0 && (
                            <HudChip asChild size="sm" tone="ember">
                              <Link to="/game/batiments?onglet=atelier">{formatNumber(docked)} à l'Atelier</Link>
                            </HudChip>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="hud-stage relative mt-2 grid h-44 place-items-center">
                  <LevelUpBurst level={data.level} colorVar="var(--color-cyan-glow)" />
                  {!isLocked && (
                    <div className="absolute right-4 top-1 z-[2] text-right">
                      <b className="hud-title block text-3xl leading-none text-slate-100">{formatNumber(data.count)}</b>
                      <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">EN HANGAR</span>
                    </div>
                  )}
                  <img
                    src={assetUrl(unit.image)}
                    alt={unit.name}
                    className={cn("hud-float relative max-h-40 w-[78%] object-contain drop-shadow-[0_18px_24px_color-mix(in_srgb,var(--color-space-950)_60%,transparent)]", isLocked && "opacity-40 grayscale")}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0";
                    }}
                  />
                  <div className="hud-scan" />
                </div>

                <div className="relative flex flex-1 flex-col gap-3 p-4 pt-3">
                  <div>
                    <h3 className="hud-title text-xl text-slate-100">{unit.name}</h3>
                    <p className="mt-0.5 text-sm leading-snug text-slate-400">{isLocked && !unit.blueprint && !unit.elite && !unit.empireClass ? "" : unit.description}</p>
                    <div className="-ml-2 mt-1">
                      <UnitSpecButton unit={unit} player={player} />
                    </div>
                  </div>

                  {isLocked ? (
                    <p className="text-sm text-slate-500">
                      <GameIcon name="lock" />{" "}
                      {unit.elite ? (
                        <>
                          Unité d'élite : tout le Labo au maximum et une vendetta gagnée contre un seigneur {PERSONALITY_LABELS[unit.elite].toLowerCase()}.{" "}
                          <Link to="/game/seigneurs" className="font-semibold text-ember-glow hover:underline">
                            Seigneurs
                          </Link>
                        </>
                      ) : unit.empireClass ? (
                        <>
                          Vaisseau de classe {findEmpireClass(unit.empireClass)?.name ?? unit.empireClass} : choisis cette classe, puis recherche{" "}
                          <strong className="text-slate-300">{findTech(unit.classTech ?? "")?.nom ?? "sa technologie"}</strong> au Labo.{" "}
                          <Link to="/game/classe" className="font-semibold text-cyan-glow hover:underline">
                            Classe d'empire
                          </Link>
                        </>
                      ) : unit.blueprint ? (
                        <>
                          Plan vendu au <Link to="/game/primes" className="font-semibold text-gold-glow hover:underline">Comptoir de la Ruche</Link> (Kesh'Vaar).
                        </>
                      ) : (
                        <>
                          Se débloque au Labo : <strong className="text-slate-300">{findTech(UNIT_TO_TECH[unit.id])?.nom ?? "recherche"}</strong>{" "}
                          <Link to="/game/labo" className="font-semibold text-cyan-glow hover:underline">
                            Lancer la recherche
                          </Link>
                        </>
                      )}
                    </p>
                  ) : (
                    <>
                      {unit.elite && !eliteStatus(player, unit.id)?.lab && (
                        <HudCallout tone="ember" className="text-xs">
                          Nouvelles technologies au Labo : termine-les pour reprendre la construction ({eliteStatus(player, unit.id)?.missing.map((m) => m.nom).join(", ")}).
                        </HudCallout>
                      )}
                      {unit.elite && <p className="text-[11px] text-ember-glow">Ne combat que les seigneurs de guerre : reste à quai contre les joueurs.</p>}
                      {(() => {
                        const attackTechBonus = Math.round(techBonus(player.techLevels, "unit_attack") * 100);
                        const defenseTechBonus = Math.round(techBonus(player.techLevels, "unit_defense") * 100);
                        const atk = Math.round(unitStat(player.units, player.techLevels, unit.id, "attack"));
                        const def = Math.round(unitStat(player.units, player.techLevels, unit.id, "defense"));
                        const empireAtk = Math.round(playerModifiers(player).attack * 100);
                        const empireDef = Math.round(playerModifiers(player).defense * 100);
                        return (
                          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="ATK" value={atk} max={statMax.attack} color="var(--color-danger-glow)" display={formatNumber(atk)} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <TooltipCard
                                  title="Attaque"
                                  rows={[
                                    { label: "Base", value: formatNumber(unit.stats.attaque) },
                                    { label: `Niveau ${data.level}`, value: `+${formatNumber((data.level - 1) * unitLevelBonus(unit))}` },
                                    ...(attackTechBonus > 0 ? [{ label: "Puissance d'attaque (tech)", value: `+${attackTechBonus} %`, tone: "mint" as const }] : []),
                                    { label: "Total", value: formatNumber(atk), tone: "accent" },
                                    // 6.1 (lot L) : couche empire, appliquée au combat (officiers, reliques, talents, classe).
                                    ...(empireAtk > 0 ? [{ label: "Au combat : officiers, reliques, talents, classe", value: `+${empireAtk} %`, tone: "mint" as const }] : []),
                                  ]}
                                />
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="RÉS" value={def} max={statMax.defense} color="var(--color-cyan-glow)" display={formatNumber(def)} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <TooltipCard
                                  title="Résistance"
                                  rows={[
                                    { label: "Base", value: formatNumber(unit.stats.defense) },
                                    { label: `Niveau ${data.level}`, value: `+${formatNumber((data.level - 1) * unitLevelBonus(unit))}` },
                                    ...(defenseTechBonus > 0 ? [{ label: "Blindage avancé (tech)", value: `+${defenseTechBonus} %`, tone: "mint" as const }] : []),
                                    { label: "Total", value: formatNumber(def), tone: "accent" },
                                    ...(empireDef > 0 ? [{ label: "Au combat : officiers, reliques, talents, classe", value: `+${empireDef} %`, tone: "mint" as const }] : []),
                                    { label: "Points de vie au combat", value: formatNumber(def * COMBAT_RULES.hpPerResistance) },
                                  ]}
                                />
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="VIT" value={unit.stats.vitesse * data.level} max={statMax.speed} color="var(--color-mint-glow)" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <TooltipCard
                                  title="Vitesse"
                                  rows={[
                                    { label: "Base", value: formatNumber(unit.stats.vitesse) },
                                    { label: "Niveau", value: `× ${data.level}` },
                                    { label: "Total", value: formatNumber(unit.stats.vitesse * data.level), tone: "accent" },
                                  ]}
                                  note="Une flotte avance à la vitesse de son vaisseau le plus lent."
                                />
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <StatBar label="CAP" value={unit.stats.cargo * data.level} max={statMax.cargo} color="var(--color-gold-glow)" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <TooltipCard
                                  title="Capacité de soute"
                                  rows={[
                                    { label: "Base", value: formatNumber(unit.stats.cargo) },
                                    { label: "Niveau", value: `× ${data.level}` },
                                    { label: "Total", value: formatNumber(unit.stats.cargo * data.level), tone: "accent" },
                                  ]}
                                />
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })()}

                      <CostPills cost={{ scrap: playerUnitCost(unit, player).scrap * qty(unit.id), energy: playerUnitCost(unit, player).energy * qty(unit.id) }} stock={player.resources} seconds={buildTime} perUnit />

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
                        const each = playerUnitCost(unit, player);
                        const batch = { scrap: each.scrap * qty(unit.id), energy: each.energy * qty(unit.id) };
                        const wait = secondsToAfford(batch, player.resources, rates);
                        const noRoom = neededSpace > freeSpace;
                        // 6.5 : un vaisseau de classe ne se construit plus après un changement de classe (il reste et vole).
                        const classBlock = classUnitBlocker(player, unit);
                        return (
                          <div>
                            <div className="flex gap-2">
                              <Button className="flex-1" disabled={pending === unit.id || noRoom || wait > 0 || !!classBlock} onClick={() => void handleBuild(unit.id)}>
                                Construire ×{formatNumber(qty(unit.id))}
                              </Button>
                              <Button variant="outline" disabled={pending === unit.id || data.count === 0} onClick={() => void handleSell(unit.id)}>
                                Vendre
                              </Button>
                            </div>
                            {classBlock ? (
                              <BlockedReason tone="block">{classBlock} Tes vaisseaux déjà construits restent à toi.</BlockedReason>
                            ) : noRoom ? (
                              <BlockedReason tone="block">
                                Hangar {hangarLabel} trop petit : {formatNumber(neededSpace)} places demandées pour {formatNumber(freeSpace)} libres. Réduis la quantité ou{" "}
                                <Link to="/game/batiments" className="font-semibold text-cyan-glow hover:underline">
                                  agrandis le hangar
                                </Link>
                                .
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
        }} />
    </div>
  );
}
