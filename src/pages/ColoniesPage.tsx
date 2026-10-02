import { useState } from "react";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { toast } from "sonner";
import { Clock, Globe2, Hammer, Package, Rocket, Shield, Truck, Warehouse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { BUILDINGS, findBuilding } from "@/game/buildings";
import { fleetCargoCapacity } from "@/game/combat";
import { homeLevels,
  advanceColonies,
  COLONY_RULES,
  colonyBuildingIds,
  colonyDefenseHangar,
  colonyDefenseSeconds,
  colonyFoundCost,
  colonyHourlyRates,
  colonyMaxLevel,
  colonyStorage,
  colonyUpgradeCost,
  colonyUpgradeSeconds,
  nextColonySlot,
  type Colony,
} from "@/game/colonies";
import { RESOURCE_LIST } from "@/game/resources";
import { findUnit, getUnitBuildTime, OFFENSIVE_UNITS, UNITS } from "@/game/units";
import { useNowTicker } from "@/hooks/useNowTicker";
import {
  buildColonyDefense,
  GameActionError,
  renameColony,
  sendTransport,
  startColonization,
  upgradeColonyBuilding,
} from "@/services/playerService";
import { useFleetStore } from "@/store/fleetStore";
import { usePlayerStore } from "@/store/playerStore";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatCompact, formatDuration } from "@/lib/utils";
import type { PlayerState, ResourceId } from "@/types/game";

type Amounts = Partial<Record<ResourceId, number>>;

async function run(fn: () => Promise<unknown>, ok: string, fail: string): Promise<boolean> {
  try {
    await fn();
    toast.success(ok);
    return true;
  } catch (err) {
    toast.error(err instanceof GameActionError ? err.message : fail);
    return false;
  }
}

/** Montants avec les icônes des ressources. */
function AmountsInline({ amounts, className }: { amounts: Amounts; className?: string }) {
  const list = Object.entries(amounts).filter(([, n]) => (n ?? 0) > 0);
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-0.5", className)}>
      {list.map(([r, n]) => (
        <span key={r} className="inline-flex items-center gap-1">
          <ResourceIcon id={r} className="h-4 w-4" /> {formatCompact(n ?? 0)}
        </span>
      ))}
    </span>
  );
}

/* ---------- transport ---------- */

function TransportDialog({ colony, direction, onClose }: { colony: Colony; direction: "deliver" | "collect" | null; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const [ships, setShips] = useState<Record<string, number>>({});
  const [cargo, setCargo] = useState<Amounts>({});
  const [busy, setBusy] = useState(false);
  if (!player || !direction) return null;
  const ids = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (player.units[id]?.count ?? 0) > 0 && (findUnit(id)?.stats.cargo ?? 0) > 0);
  const selected = Object.fromEntries(Object.entries(ships).filter(([, n]) => n > 0));
  const capacity = fleetCargoCapacity(player.units, selected, player.techLevels);
  const loaded = Object.values(cargo).reduce((a: number, b) => a + (b ?? 0), 0);
  const source = direction === "deliver" ? player.resources : colony.resources;

  const send = async () => {
    setBusy(true);
    const ok = await run(
      () => sendTransport(colony.id, direction, selected, Object.fromEntries(Object.entries(cargo).filter(([, n]) => (n ?? 0) > 0))),
      direction === "deliver" ? `Livraison en route vers ${colony.name}.` : `Transport en route pour rapatrier les ressources de ${colony.name}.`,
      "Départ impossible.",
    );
    setBusy(false);
    if (ok) {
      triggerWarpEffect();
      setShips({});
      setCargo({});
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{direction === "deliver" ? `Livrer ${colony.name}` : `Rapatrier depuis ${colony.name}`}</DialogTitle>
        <DialogDescription>
          {direction === "deliver"
            ? "Les ressources quittent ta planète mère au départ et arrivent dans le stock de la colonie."
            : "Les vaisseaux chargent à l'arrivée (ce que tu demandes, ou tout ce que la soute peut prendre) et rapportent la cargaison sur ta planète mère."}
        </DialogDescription>
        <p className="hud-eyebrow mt-2 text-[10px] text-slate-500">Vaisseaux (planète mère)</p>
        <div className="flex flex-col gap-1.5">
          {ids.length === 0 && <p className="text-xs text-slate-500">Aucun vaisseau avec une soute à la base.</p>}
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <img src={findUnit(id)?.image} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">{findUnit(id)?.name}</span>
                <Input
                  type="number"
                  min={0}
                  value={ships[id] || ""}
                  placeholder="0"
                  aria-label={`Quantité ${findUnit(id)?.name}`}
                  onChange={(e) => setShips((f) => ({ ...f, [id]: Math.min(owned, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  className="h-8 w-24 text-right"
                />
                <button type="button" className="w-12 font-mono text-[10px] text-slate-500 hover:text-cyan-glow" onClick={() => setShips((f) => ({ ...f, [id]: owned }))}>
                  /{formatCompact(owned)}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-xs text-slate-400">
          Soute : {formatCompact(loaded)} / {formatCompact(capacity)}
        </p>
        <p className="hud-eyebrow mt-2 text-[10px] text-slate-500">{direction === "deliver" ? "Chargement" : "À rapatrier (vide = au maximum)"}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RESOURCE_LIST.map((r) => (
            <label key={r.id} className="flex flex-col gap-1 text-[11px] text-slate-400">
              <span className="truncate">
                <ResourceIcon id={r.id} /> {formatCompact(Math.floor(source[r.id] ?? 0))}
              </span>
              <Input type="number" min={0} value={cargo[r.id] ?? ""} onChange={(e) => setCargo((c) => ({ ...c, [r.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))} />
            </label>
          ))}
        </div>
        <Button className="mt-3 w-full" disabled={busy || capacity <= 0 || (direction === "deliver" && (loaded <= 0 || loaded > capacity))} onClick={() => void send()}>
          <Truck className="mr-1.5 h-4 w-4" /> Envoyer
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- une colonie ---------- */

/** Ce que rapporte le niveau suivant d'un entrepôt ou d'un hangar de défense. */
function effectLine(colony: Colony, player: PlayerState, id: string, level: number): string | null {
  const def = findBuilding(id);
  if (def?.effect?.type === "hangar" && def.effect.category === "defense") {
    return `Hangar : ${formatCompact(level * def.effect.perLevel)} places → ${formatCompact((level + 1) * def.effect.perLevel)}`;
  }
  if (def?.effect?.type === "storage") {
    const next = colonyStorage({ ...colony, buildings: { ...colony.buildings, [id]: { ...(colony.buildings[id] ?? { unlocked: true }), level: level + 1 } } }, player);
    return `Stockage : ${formatCompact(colonyStorage(colony, player))} → ${formatCompact(next)} par ressource`;
  }
  return null;
}

function ColonyCard({ colony, player }: { colony: Colony; player: PlayerState }) {
  const [busy, setBusy] = useState(false);
  const [transport, setTransport] = useState<"deliver" | "collect" | null>(null);
  const [defense, setDefense] = useState<{ unitId: string; qty: number }>({ unitId: "", qty: 0 });
  const [rename, setRename] = useState<string | null>(null);
  const fleets = useFleetStore((s) => s.fleets);
  const now = Date.now();
  const rates = colonyHourlyRates(colony, player);
  const storage = colonyStorage(colony, player);
  const inFlight = fleets.filter((f) => f.mission === "transport" && f.targetUid === colony.id && f.status !== "done");
  const defenses = UNITS.filter((u) => u.category === "defense" && (player.units[u.id]?.level ?? 0) > 0);
  const hangar = colonyDefenseHangar(colony);
  const free = Math.max(0, hangar.capacity - hangar.used);
  const picked = defense.unitId ? findUnit(defense.unitId) : undefined;
  const maxQty = picked
    ? Math.max(
        0,
        Math.min(
          Math.floor(free / Math.max(1, picked.hangarSpace)),
          picked.cost.scrap > 0 ? Math.floor((colony.resources.scrap ?? 0) / picked.cost.scrap) : Infinity,
          picked.cost.energy > 0 ? Math.floor((colony.resources.energy ?? 0) / picked.cost.energy) : Infinity,
        ),
      )
    : 0;
  const batchCost = picked ? { scrap: picked.cost.scrap * defense.qty, energy: picked.cost.energy * defense.qty } : {};
  const batchSpace = picked ? picked.hangarSpace * defense.qty : 0;
  const batchAffordable = Object.entries(batchCost).every(([r, n]) => (colony.resources[r as ResourceId] ?? 0) >= (n ?? 0));

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    await run(fn, ok, "Action impossible.");
    setBusy(false);
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Globe2 className="h-5 w-5 text-mint-glow" />
        {rename === null ? (
          <button type="button" className="hud-title text-left text-base hover:text-cyan-glow" title="Renommer" onClick={() => setRename(colony.name)}>
            {colony.name}
          </button>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void act(() => renameColony(colony.id, rename), "Colonie renommée.").then(() => setRename(null));
            }}
          >
            <Input value={rename} onChange={(e) => setRename(e.target.value)} className="h-8 w-48" autoFocus />
            <Button size="sm" type="submit" disabled={busy}>
              OK
            </Button>
          </form>
        )}
        <HudTag tone="mint">Colonie {colony.slot}</HudTag>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setTransport("deliver")}>
            <Package className="mr-1 h-3.5 w-3.5" /> Livrer
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTransport("collect")}>
            <Truck className="mr-1 h-3.5 w-3.5" /> Rapatrier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RESOURCE_LIST.map((r) => {
          const stock = Math.floor(colony.resources[r.id] ?? 0);
          const full = r.rarity === "common" && stock >= storage;
          return (
            <div key={r.id} className={cn("border border-white/5 bg-white/[0.02] px-2 py-1.5", full && "border-ember-glow/40")}>
              <p className="flex items-center gap-1.5 text-sm">
                <ResourceIcon id={r.id} className="h-5 w-5" />
                <span className="tabular-mono text-slate-100">{formatCompact(stock)}</span>
              </p>
              {r.rarity === "common" && <p className="font-mono text-[10px] text-slate-500">{full ? "plein" : `+${formatCompact(rates[r.id] ?? 0)}/h`}</p>}
            </div>
          );
        })}
      </div>
      <p className="-mt-2 text-[11px] text-slate-500">Entrepôt de la colonie : {formatCompact(storage)} par ressource commune. Les ressources rares n'y sont pas plafonnées.</p>
      {inFlight.length > 0 && (
        <p className="text-xs text-cyan-glow">
          {inFlight.length} transport{inFlight.length > 1 ? "s" : ""} en cours ({inFlight.map((f) => (f.transport?.direction === "collect" ? "rapatriement" : "livraison")).join(", ")}).
        </p>
      )}

      <div>
        <p className="hud-eyebrow mb-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <Hammer className="h-3.5 w-3.5" /> Bâtiments (niveau {COLONY_RULES.maxLevel} au plus, coûts × {COLONY_RULES.costFactor})
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {colonyBuildingIds().map((id) => {
            const def = findBuilding(id)!;
            const level = colony.buildings[id]?.level ?? 0;
            const max = colonyMaxLevel(id);
            const running = colony.building?.id === id ? colony.building : null;
            const cost = colonyUpgradeCost(player, id, level + 1);
            const affordable = Object.entries(cost).every(([r, n]) => (colony.resources[r as ResourceId] ?? 0) >= (n ?? 0));
            return (
              <div key={id} className="flex flex-col gap-1 border border-white/5 bg-white/[0.02] p-2.5">
                <div className="flex items-center gap-2">
                  <img src={def.image} alt="" className="h-8 w-8 object-contain" />
                  <span className="flex-1 truncate text-sm text-slate-200">{def.name}</span>
                  <span className="tabular-mono text-xs text-slate-400">
                    {level} / {max}
                  </span>
                </div>
                {(() => {
                  const line = level < max ? effectLine(colony, player, id, level) : null;
                  return line ? <p className="text-[11px] text-slate-400">{line}</p> : null;
                })()}
                {running ? (
                  <div>
                    <p className="text-[11px] text-cyan-glow">Niveau {running.level} — fin dans {formatDuration(Math.max(0, Math.floor((running.endTime - now) / 1000)))}</p>
                    <Progress value={100 - ((running.endTime - now) / Math.max(1, colonyUpgradeSeconds(player, id, running.level, now) * 1000)) * 100} className="mt-1" />
                    <div className="mt-1 flex justify-end">
                      <CancelJobButton target={{ kind: "colonyBuilding", colonyId: colony.id }} compact />
                    </div>
                  </div>
                ) : level >= max ? (
                  <p className="text-[11px] text-mint-glow">Niveau maximum d'une colonie.</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={cn("flex flex-1 flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]", affordable ? "text-slate-400" : "text-ember-glow")}>
                      <AmountsInline amounts={cost} />
                      <span className="inline-flex items-center gap-1 text-slate-300" title="Temps de construction">
                        <Clock className="h-3.5 w-3.5" /> {formatDuration(colonyUpgradeSeconds(player, id, level + 1, now))}
                      </span>
                    </span>
                    <Button size="sm" variant="outline" disabled={busy || !!colony.building || !affordable} onClick={() => void act(() => upgradeColonyBuilding(colony.id, id), "Construction lancée.")}>
                      Niv. {level + 1}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="hud-eyebrow mb-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <Shield className="h-3.5 w-3.5" /> Défenses de la colonie
        </p>
        <div className="mb-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Warehouse className="h-3.5 w-3.5" /> Hangar de défense
            </span>
            <span className="tabular-mono">
              {formatCompact(hangar.used)} / {formatCompact(hangar.capacity)} places
            </span>
          </div>
          <Progress value={hangar.capacity > 0 ? (hangar.used / hangar.capacity) * 100 : 100} className="mt-1" />
          {hangar.capacity === 0 && <p className="mt-1 text-[11px] text-ember-glow">Construis le hangar de défense de la colonie pour y placer des défenses.</p>}
        </div>
        <p className="mb-2 text-xs text-slate-300">
          {Object.entries(colony.defenses).filter(([, s]) => s.count > 0).length === 0
            ? "Aucune défense pour l'instant."
            : Object.entries(colony.defenses)
                .filter(([, s]) => s.count > 0)
                .map(([id, s]) => `${formatCompact(s.count)} ${findUnit(id)?.name ?? id}`)
                .join(" · ")}
        </p>
        {colony.defenseJob ? (
          <p className="flex flex-wrap items-center gap-2 text-[11px] text-cyan-glow">
            {formatCompact(colony.defenseJob.qty)} {findUnit(colony.defenseJob.unitId)?.name} en construction — fin dans {formatDuration(Math.max(0, Math.floor((colony.defenseJob.endTime - now) / 1000)))}
            <CancelJobButton target={{ kind: "colonyDefense", colonyId: colony.id }} compact />
          </p>
        ) : defenses.length === 0 ? (
          <p className="text-[11px] text-slate-500">Débloque des défenses sur ta planète mère pour en construire ici.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex w-full flex-wrap gap-1.5">
              {defenses.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setDefense((d) => ({ ...d, unitId: u.id }))}
                  className={cn(
                    "flex items-center gap-2 border px-2 py-1 text-left text-xs transition-colors",
                    defense.unitId === u.id ? "border-cyan-glow/70 bg-cyan-glow/10 text-cyan-glow" : "border-white/10 text-slate-300 hover:border-cyan-glow/40",
                  )}
                >
                  <img src={u.image} alt="" className="h-7 w-7 object-contain" />
                  <span className="flex flex-col">
                    <span>{u.name}</span>
                    <AmountsInline amounts={{ scrap: u.cost.scrap, energy: u.cost.energy }} className="text-[10px] text-slate-500" />
                    <span className="font-mono text-[10px] text-slate-500">
                      {formatDuration(getUnitBuildTime(u, player.techLevels))} · {u.hangarSpace} place{u.hangarSpace > 1 ? "s" : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <Input type="number" min={0} value={defense.qty || ""} placeholder="Qté" onChange={(e) => setDefense((d) => ({ ...d, qty: Math.max(0, parseInt(e.target.value) || 0) }))} className="h-8 w-24" />
            {picked && (
              <button type="button" className="font-mono text-[10px] text-slate-500 hover:text-cyan-glow" title="Maximum (place et stock)" onClick={() => setDefense((d) => ({ ...d, qty: maxQty }))}>
                max {formatCompact(maxQty)}
              </button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy || !picked || defense.qty <= 0 || batchSpace > free || !batchAffordable}
              onClick={() => void act(() => buildColonyDefense(colony.id, defense.unitId, defense.qty), "Défenses en construction.")}
            >
              Construire
            </Button>
            {picked && defense.qty > 0 && (
              <p className="flex w-full flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                <AmountsInline amounts={batchCost} className={batchAffordable ? "" : "text-ember-glow"} />
                <span className="inline-flex items-center gap-1 text-slate-300" title="Temps de construction">
                  <Clock className="h-3.5 w-3.5" /> {formatDuration(colonyDefenseSeconds(player, picked.id, defense.qty))}
                </span>
                <span className={cn("inline-flex items-center gap-1", batchSpace > free ? "text-ember-glow" : "")}>
                  <Warehouse className="h-3.5 w-3.5" /> {formatCompact(batchSpace)} / {formatCompact(free)} places libres
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      <TransportDialog colony={colony} direction={transport} onClose={() => setTransport(null)} />
    </Card>
  );
}

/* ---------- page ---------- */

function FoundColony({ player }: { player: PlayerState }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const next = nextColonySlot(player);
  if (!next) return null;
  // v4.8 : même compte que le serveur (bâtiments de fin de partie exclus).
  const levels = homeLevels(player);
  const excluded = BUILDINGS.filter((b) => b.endgame).map((b) => b.name);
  const cost = colonyFoundCost();
  const affordable = Object.entries(cost).every(([r, n]) => (player.resources[r as ResourceId] ?? 0) >= (n ?? 0));
  const ready = levels >= next.levels;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="hud-title flex items-center gap-2 text-sm">
        <Rocket className="h-4 w-4 text-cyan-glow" /> Fonder la colonie {next.slot}
      </h2>
      <p className="text-sm text-slate-300">
        Un vaisseau colonial part de ta planète mère et fonde une nouvelle colonie en {COLONY_RULES.foundHours} h. Elle démarre avec {formatCompact(COLONY_RULES.startStock)} de chaque ressource commune, ses
        extracteurs, son entrepôt et son hangar de défense au niveau 1.
      </p>
      <p className={cn("text-xs", ready ? "text-mint-glow" : "text-slate-400")}>
        Niveaux de bâtiments cumulés : {levels} / {next.levels}
        <span className="block text-[11px] text-slate-500">Hors bâtiments de fin de partie ({excluded.join(", ")}).</span>
      </p>
      <p className={cn("text-xs", affordable ? "text-slate-400" : "text-ember-glow")}>Vaisseau colonial : <AmountsInline amounts={cost} /></p>
      <div className="flex flex-wrap gap-2">
        <Input value={name} placeholder={`Colonie ${next.slot}`} maxLength={30} onChange={(e) => setName(e.target.value)} className="h-9 w-56" />
        <Button
          disabled={busy || !ready || !affordable || !!player.colonizing}
          onClick={() => {
            setBusy(true);
            void run(() => startColonization(name), "Le vaisseau colonial a décollé !", "Colonisation impossible.").finally(() => setBusy(false));
          }}
        >
          <Rocket className="mr-1.5 h-4 w-4" /> Lancer le vaisseau colonial
        </Button>
      </div>
    </Card>
  );
}

export function ColoniesPage() {
  useNowTicker();
  const raw = usePlayerStore((s) => s.player);
  if (!raw) return null;
  // Affichage en direct : colonies rattrapées à l'instant présent.
  const player = structuredClone(raw);
  advanceColonies(player, Date.now());
  const colonies = player.colonies ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Expansion"
        title="Colonies"
        description="Jusqu'à deux planètes de plus, avec leurs propres bâtiments, stocks et défenses. Tes technologies, ton alliance et tes ascensions profitent à tout l'empire."
      />
      {raw.colonizing && (
        <Card className="flex flex-col gap-2 p-4">
          <p className="text-sm text-cyan-glow">
            Vaisseau colonial en route vers « {raw.colonizing.name} » — arrivée dans {formatDuration(Math.max(0, Math.floor((raw.colonizing.endTime - Date.now()) / 1000)))}.
          </p>
          <Progress value={100 - ((raw.colonizing.endTime - Date.now()) / (COLONY_RULES.foundHours * 3600_000)) * 100} />
        </Card>
      )}
      {colonies.map((c) => (
        <ColonyCard key={c.id} colony={c} player={player} />
      ))}
      {!raw.colonizing && <FoundColony player={player} />}
      {colonies.length === 0 && !raw.colonizing && (
        <Card>
          <EmptyState icon={<Globe2 className="h-6 w-6" />} title="Aucune colonie pour l'instant">
            Développe ta planète mère jusqu'à {COLONY_RULES.levelsRequired[0]} niveaux de bâtiments cumulés (hors bâtiments de fin de partie) pour fonder ta première colonie.
          </EmptyState>
        </Card>
      )}
    </div>
  );
}
