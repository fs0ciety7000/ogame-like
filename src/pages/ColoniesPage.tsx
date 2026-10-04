import { useState } from "react";
import { playerCargoCapacity } from "@/game/modifiers";
import { CancelJobButton } from "@/components/game/CancelJobButton";
import { toast } from "sonner";
import { Check, Clock, Globe2, Hammer, Lock, Package, Pencil, Rocket, Shield, Sparkles, TrendingUp, Truck, Warehouse, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, HudChip, HudTag } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { findBuilding } from "@/game/buildings";
import { homeLevels,
  advanceColonies,
  COLONY_RULES,
  BIOMES,
  colonyBiome,
  colonyBuildingIds,
  colonyBuildingName,
  colonyDefenseHangar,
  DEPOSIT_ID,
  depositLevel,
  depositPerSecond,
  colonyDefenseSeconds,
  colonyFoundCost,
  colonyHourlyRates,
  colonyMaxLevel,
  colonyStorage,
  colonyUpgradeCost,
  colonyUpgradeSeconds,
  nextColonySlot,
  COLONY_SPECS,
  colonySpecEffects,
  colonySpecReadyAt,
  findColonySpec,
  type Colony,
  type ColonySpecId,
} from "@/game/colonies";
import { RESOURCE_LIST } from "@/game/resources";
import { iconUrl, type GameIconName } from "@/lib/icons";
import { assetUrl } from "@/lib/assets";
import { findUnit, getUnitBuildTime, OFFENSIVE_UNITS, UNITS } from "@/game/units";
import { useNowTicker } from "@/hooks/useNowTicker";
import {
  buildColonyDefense,
  GameActionError,
  renameColony,
  sendTransport,
  setColonySpec,
  startColonization,
  upgradeColonyBuilding,
} from "@/services/playerService";
import { useFleetStore } from "@/store/fleetStore";
import { usePlayerStore } from "@/store/playerStore";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatClock, formatCompact, formatDuration, formatPerSecond } from "@/lib/utils";
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
  const capacity = playerCargoCapacity(player, selected);
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
                <img src={assetUrl(findUnit(id)?.image ?? "")} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">{findUnit(id)?.name}</span>
                <NumberInput size="sm" value={ships[id] ?? 0} max={owned} aria-label={`Quantité ${findUnit(id)?.name}`} onChange={(v) => setShips((f) => ({ ...f, [id]: v }))} className="w-40 shrink-0" />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] text-slate-500" title="À quai">/{formatCompact(owned)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-xs text-slate-400">
          Soute : {formatCompact(loaded)} / {formatCompact(capacity)}
        </p>
        <p className="hud-eyebrow mt-2 text-[10px] text-slate-500">{direction === "deliver" ? "Chargement" : "À rapatrier (vide = au maximum)"}</p>
        <div className="grid grid-cols-2 gap-2">
          {RESOURCE_LIST.map((r) => (
            <label key={r.id} className="flex flex-col gap-1 text-[11px] text-slate-400">
              <span className="truncate">
                <ResourceIcon id={r.id} /> {formatCompact(Math.floor(source[r.id] ?? 0))}
              </span>
              <NumberInput
                size="sm"
                stepper={false}
                nullable={direction !== "deliver"}
                value={cargo[r.id]}
                max={Math.max(0, Math.floor(source[r.id] ?? 0))}
                placeholder={direction === "deliver" ? "0" : "max"}
                onChange={(v: number | undefined) => setCargo((c) => ({ ...c, [r.id]: v }))}
                aria-label={r.name}
                className="w-full"
              />
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

/* ---------- éléments visuels ---------- */

/** Planète stylisée (v4.9.1) : sphère, anneau et halo ; `tone` = variable CSS de couleur. */
function PlanetOrb({ tone = "var(--color-mint-glow)", size = 64, dim = false, spin = true }: { tone?: string; size?: number; dim?: boolean; spin?: boolean }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center", dim && "opacity-40 grayscale")} style={{ width: size, height: size, "--orb": tone } as React.CSSProperties}>
      <span aria-hidden className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--orb)_28%,transparent)_0%,transparent_65%)]" />
      <span
        aria-hidden
        className={cn("absolute inset-0 rounded-full shadow-[inset_-8px_-10px_18px_rgba(0,0,0,0.65),0_0_18px_color-mix(in_srgb,var(--orb)_35%,transparent)]", spin && "motion-safe:animate-[spin_60s_linear_infinite]")}
        style={{
          background:
            "radial-gradient(circle at 32% 30%, color-mix(in srgb, var(--orb) 85%, white) 0%, var(--orb) 22%, color-mix(in srgb, var(--orb) 45%, var(--color-space-950)) 58%, var(--color-space-950) 100%), repeating-linear-gradient(115deg, transparent 0 7px, rgba(255,255,255,0.06) 7px 9px)",
          backgroundBlendMode: "screen",
        }}
      />
      <span aria-hidden className="absolute left-[-14%] top-1/2 h-[26%] w-[128%] -translate-y-1/2 -rotate-[18deg] rounded-[50%] border border-[color-mix(in_srgb,var(--orb)_55%,transparent)] [mask-image:linear-gradient(to_bottom,black_45%,transparent_55%)]" />
    </span>
  );
}

/** Coût avec icônes : chaque montant manquant passe en orange (survol : stock disponible). */
function CostChips({ cost, stock, className }: { cost: Amounts; stock: Amounts; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {Object.entries(cost)
        .filter(([, n]) => (n ?? 0) > 0)
        .map(([r, n]) => {
          const have = Math.floor(stock[r as ResourceId] ?? 0);
          const short = have < (n ?? 0);
          return (
            <span
              key={r}
              title={short ? `Il manque ${formatCompact((n ?? 0) - have)} (stock : ${formatCompact(have)})` : `Stock : ${formatCompact(have)}`}
              className={cn(
                "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
                short ? "border-ember-glow/40 bg-ember-glow/[0.08] text-ember-glow" : "border-white/[0.07] bg-white/[0.03] text-slate-300",
              )}
            >
              <ResourceIcon id={r} className="h-3.5 w-3.5" /> {formatCompact(n ?? 0)}
            </span>
          );
        })}
    </span>
  );
}

/** Segments de niveau (un par niveau possible). */
function LevelPips({ level, max, running }: { level: number; max: number; running?: boolean }) {
  return (
    <span className="flex gap-[3px]" aria-label={`Niveau ${level} sur ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 skew-x-[-20deg] transition-colors",
            i < level ? "bg-mint-glow shadow-[0_0_6px_color-mix(in_srgb,var(--color-mint-glow)_60%,transparent)]" : i === level && running ? "animate-pulse bg-cyan-glow/70" : "bg-white/[0.07]",
          )}
        />
      ))}
    </span>
  );
}

function SectionTitle({ icon: Icon, children, aside }: { icon: typeof Hammer; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-mint-glow" />
      <p className="hud-eyebrow text-[10px] text-slate-400">{children}</p>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-mint-glow/25 to-transparent" />
      {aside && <span className="hidden sm:inline">{aside}</span>}
    </div>
  );
}

/* ---------- une colonie ---------- */

/** v5.11 : spécialisation (premier choix libre, puis un changement tous les 7 jours). */
function ColonySpecPicker({ colony, busy, onPick }: { colony: Colony; busy: boolean; onPick: (id: ColonySpecId) => void }) {
  const now = Date.now();
  const ready = colonySpecReadyAt(colony);
  const locked = ready > now;
  const current = findColonySpec(colony.spec);
  return (
    <div className="mt-3">
      <p className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
        Spécialisation
        {current ? <HudChip size="sm" tone="mint">{current.emoji} {current.name}</HudChip> : <HudChip size="sm" tone="ember" alert>À choisir</HudChip>}
        {locked && <span className="normal-case tracking-normal">changement possible dans {formatClock(Math.ceil((ready - now) / 1000))}</span>}
      </p>
      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
        {COLONY_SPECS.map((sp) => {
          const active = colony.spec === sp.id;
          return (
            <button
              key={sp.id}
              type="button"
              aria-pressed={active}
              disabled={busy || active || locked}
              onClick={() => {
                if (!current || window.confirm(`Passer ${colony.name} en ${sp.name} ? Prochain changement possible dans 7 jours.`)) onPick(sp.id);
              }}
              className={cn(
                "hud-cut-sm flex flex-col gap-0.5 border p-2 text-left transition-colors disabled:cursor-not-allowed",
                active ? "border-mint-glow/60 bg-mint-glow/10" : "border-white/10 bg-white/[0.02] enabled:hover:border-cyan-glow/50 disabled:opacity-50",
              )}
            >
              <span className="hud-title text-xs text-slate-100">
                {sp.emoji} {sp.name}
              </span>
              <span className="text-[11px] leading-snug text-slate-400">{sp.summary}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Ce que rapporte le niveau suivant d'un entrepôt ou d'un hangar de défense. */
function effectLine(colony: Colony, player: PlayerState, id: string, level: number): string | null {
  if (id === DEPOSIT_ID) {
    const res = RESOURCE_LIST.find((r) => r.id === colonyBiome(colony))?.name ?? "";
    const k = colonySpecEffects(colony).deposit * 3600;
    return `${res} : +${formatPerSecond(depositPerSecond(level) * k)} → +${formatPerSecond(depositPerSecond(level + 1) * k)}`;
  }
  const def = findBuilding(id);
  if (def?.effect?.type === "hangar" && def.effect.category === "defense") {
    return `Hangar : ${formatCompact(level * def.effect.perLevel)} → ${formatCompact((level + 1) * def.effect.perLevel)} places`;
  }
  if (def?.effect?.type === "storage") {
    const next = colonyStorage({ ...colony, buildings: { ...colony.buildings, [id]: { ...(colony.buildings[id] ?? { unlocked: true }), level: level + 1 } } }, player);
    return `Stockage : ${formatCompact(colonyStorage(colony, player))} → ${formatCompact(next)} par ressource`;
  }
  return null;
}

function ResourceTile({ id, stock, storage, rate }: { id: ResourceId; stock: number; storage: number; rate: number }) {
  const def = RESOURCE_LIST.find((r) => r.id === id)!;
  const common = def.rarity === "common";
  const pct = common && storage > 0 ? Math.min(100, (stock / storage) * 100) : 0;
  const full = common && stock >= storage;
  const hoursToFull = common && rate > 0 && !full ? (storage - stock) / rate : null;
  return (
    <div className={cn("hud-cut-sm relative overflow-hidden border bg-space-950/40 px-2.5 py-2", full ? "border-ember-glow/50" : "border-white/[0.06]")}>
      <div className="flex items-center gap-2">
        <ResourceIcon id={id} className="h-6 w-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="tabular-mono truncate text-sm font-semibold text-slate-100">{formatCompact(stock)}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.08em] text-slate-500">{def.name}</p>
        </div>
      </div>
      {common ? (
        <>
          <div className="mt-1.5 h-1 bg-white/[0.06]">
            <div className={cn("h-full transition-[width] duration-700", full ? "bg-ember-glow" : pct > 85 ? "bg-gold-glow" : "bg-mint-glow/80")} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 flex flex-wrap justify-between gap-x-2 font-mono text-[9px] text-slate-500">
            <span className={full ? "text-ember-glow" : "text-mint-glow"}>{full ? "PLEIN" : `+${formatPerSecond(rate)}`}</span>
            <span>{full ? "rapatrie ou agrandis" : hoursToFull !== null ? `plein dans ${hoursToFull >= 48 ? `${Math.round(hoursToFull / 24)} j` : formatDuration(Math.floor(hoursToFull * 3600))}` : "—"}</span>
          </p>
        </>
      ) : (
        <p className="mt-1.5 font-mono text-[9px] text-slate-500">{rate > 0 ? <span className="text-violet-300">+{formatPerSecond(rate)} · gisement</span> : "non plafonnée"}</p>
      )}
    </div>
  );
}

function BuildingTile({ colony, player, id, busy, onUpgrade, now }: { colony: Colony; player: PlayerState; id: string; busy: boolean; onUpgrade: () => void; now: number }) {
  const deposit = id === DEPOSIT_ID;
  // v5.1 : illustration du gisement par biome (repli : icône de la ressource rare).
  const def = deposit ? { name: colonyBuildingName(colony, id), image: assetUrl(`/assets/buildings/gisement_${colonyBiome(colony)}.webp`) } : findBuilding(id)!;
  const level = deposit ? depositLevel(colony) : (colony.buildings[id]?.level ?? 0);
  const max = colonyMaxLevel(id);
  const running = colony.building?.id === id ? colony.building : null;
  const queueBusy = !!colony.building && !running;
  const cost = colonyUpgradeCost(player, id, level + 1);
  const affordable = Object.entries(cost).every(([r, n]) => (colony.resources[r as ResourceId] ?? 0) >= (n ?? 0));
  const maxed = level >= max;
  const line = !maxed ? effectLine(colony, player, id, level) : null;
  const total = running ? colonyUpgradeSeconds(player, id, running.level, now) * 1000 : 0;
  const left = running ? Math.max(0, running.endTime - now) : 0;
  return (
    <div
      className={cn(
        "hud-cut group relative flex gap-3 border p-3 transition-colors",
        running ? "border-cyan-glow/40 bg-cyan-glow/[0.04]" : maxed ? "border-gold-glow/30 bg-gold-glow/[0.03]" : "border-white/[0.06] bg-white/[0.02] hover:border-mint-glow/30",
      )}
    >
      <div className="relative grid h-16 w-16 shrink-0 place-items-center border border-white/[0.06] bg-space-950/60">
        <img
          src={assetUrl(def.image)}
          alt=""
          className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
          onError={deposit ? (e) => { const fallback = iconUrl(colonyBiome(colony) as GameIconName); if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback; } : undefined}
        />
        <span className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap border px-1.5 font-mono text-[10px] font-bold", maxed ? "border-gold-glow/60 bg-space-950 text-gold-glow" : "border-mint-glow/40 bg-space-950 text-mint-glow")}>
          {maxed ? "MAX" : `NIV ${level}`}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="flex-1 truncate font-display text-sm font-semibold text-slate-100">{def.name}</span>
          <span className="tabular-mono text-[11px] text-slate-500">
            {level}/{max}
          </span>
        </div>
        <LevelPips level={level} max={max} running={!!running} />
        {line && (
          <p className="flex items-center gap-1 text-[11px] text-slate-400">
            <TrendingUp className="h-3 w-3 text-mint-glow" /> {line}
          </p>
        )}
        {running ? (
          <div className="mt-auto">
            <div className="flex items-center justify-between font-mono text-[11px] text-cyan-glow">
              <span>→ niveau {running.level}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(Math.floor(left / 1000))}
              </span>
            </div>
            <Progress value={total > 0 ? 100 - (left / total) * 100 : 0} className="mt-1" />
            <div className="mt-1 flex justify-end">
              <CancelJobButton target={{ kind: "colonyBuilding", colonyId: colony.id }} compact />
            </div>
          </div>
        ) : maxed ? (
          <p className="mt-auto inline-flex items-center gap-1 text-[11px] text-gold-glow">
            <Sparkles className="h-3 w-3" /> Niveau maximum d'une colonie
          </p>
        ) : (
          <div className="mt-auto flex flex-wrap items-end gap-2">
            <div className="flex flex-1 flex-wrap items-center gap-1">
              <CostChips cost={cost} stock={colony.resources} />
              <span className="inline-flex items-center gap-1 px-1 font-mono text-[11px] text-slate-400" title="Temps de construction">
                <Clock className="h-3 w-3" /> {formatDuration(colonyUpgradeSeconds(player, id, level + 1, now))}
              </span>
            </div>
            <Button
              size="sm"
              variant={affordable && !queueBusy ? "primary" : "outline"}
              disabled={busy || queueBusy || !affordable}
              title={queueBusy ? "Un chantier est déjà en cours sur cette colonie" : !affordable ? "Ressources de la colonie insuffisantes" : undefined}
              onClick={onUpgrade}
            >
              {queueBusy ? <Lock className="h-3.5 w-3.5" /> : <Hammer className="h-3.5 w-3.5" />} Niv. {level + 1}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
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
  const ids = [DEPOSIT_ID, ...colonyBuildingIds()];
  const levels = ids.reduce((a, id) => a + (id === DEPOSIT_ID ? depositLevel(colony) : (colony.buildings[id]?.level ?? 0)), 0);
  const biome = BIOMES[colonyBiome(colony)];
  const maxLevels = ids.reduce((a, id) => a + colonyMaxLevel(id), 0);
  const hourly = Object.values(rates).reduce((a: number, b) => a + (b ?? 0), 0);
  const placed = Object.entries(colony.defenses).filter(([, s]) => s.count > 0);
  const shielded = colony.lastDefeatAtMs && now - colony.lastDefeatAtMs < 3600_000;

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    await run(fn, ok, "Action impossible.");
    setBusy(false);
  };

  return (
    <Card className="relative overflow-hidden p-0">
      {/* Bandeau : planète, nom, chiffres clés, transports */}
      <div className="relative flex flex-wrap items-center gap-4 border-b border-mint-glow/15 bg-gradient-to-r from-mint-glow/[0.08] via-transparent to-transparent p-4">
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_8%_50%,color-mix(in_srgb,var(--color-mint-glow)_12%,transparent),transparent_45%)]" />
        <PlanetOrb size={72} tone={colony.slot === 2 ? "var(--color-violet-glow)" : "var(--color-mint-glow)"} />
        <div className="relative min-w-0 flex-1">
          <p className="hud-eyebrow text-[10px] text-mint-glow">Colonie {colony.slot} · fondée {new Date(colony.foundedAtMs).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
          <p className="hud-chip hud-chip-sm mt-0.5" style={{ ["--c" as string]: biome.tone }} title={biome.lore}>
            <img src={iconUrl(colonyBiome(colony) as GameIconName)} alt="" className="h-3.5 w-3.5" /> Biome : {biome.name}
          </p>
          {rename === null ? (
            <button type="button" className="group/n flex items-center gap-2 text-left" title="Renommer" onClick={() => setRename(colony.name)}>
              <span className="font-display text-xl font-bold tracking-[0.04em] text-white">{colony.name}</span>
              <Pencil className="h-3.5 w-3.5 text-slate-600 transition-colors group-hover/n:text-cyan-glow" />
            </button>
          ) : (
            <form
              className="mt-1 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void act(() => renameColony(colony.id, rename), "Colonie renommée.").then(() => setRename(null));
              }}
            >
              <Input value={rename} onChange={(e) => setRename(e.target.value)} className="h-8 w-48" autoFocus maxLength={30} />
              <Button size="sm" type="submit" disabled={busy}>
                OK
              </Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setRename(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </form>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-mint-glow" /> +{formatPerSecond(hourly)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Hammer className="h-3 w-3 text-mint-glow" /> {levels}/{maxLevels} niveaux
            </span>
            <span className="inline-flex items-center gap-1">
              <Warehouse className="h-3 w-3 text-mint-glow" /> {formatCompact(storage)} / ressource
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3 w-3 text-mint-glow" /> {formatCompact(hangar.used)}/{formatCompact(hangar.capacity)} places
            </span>
            {shielded && <HudTag tone="accent">Bouclier actif</HudTag>}
          </div>
          <ColonySpecPicker colony={colony} busy={busy} onPick={(id) => void act(() => setColonySpec(colony.id, id), "Spécialisation enregistrée.")} />
        </div>
        <div className="relative flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setTransport("deliver")}>
            <Package className="h-3.5 w-3.5" /> Livrer
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTransport("collect")}>
            <Truck className="h-3.5 w-3.5" /> Rapatrier
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {inFlight.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {inFlight.map((f) => {
              const collect = f.transport?.direction === "collect";
              const end = f.status === "returning" ? f.returnAtMs : f.arriveAtMs;
              const start = f.status === "returning" ? f.arriveAtMs : f.departAtMs;
              const pct = end && start && end > start ? Math.min(100, ((now - start) / (end - start)) * 100) : 0;
              return (
                <div key={f.id} className="flex items-center gap-3 border border-cyan-glow/20 bg-cyan-glow/[0.04] px-3 py-1.5 text-[11px] text-cyan-glow">
                  <Truck className="h-3.5 w-3.5 shrink-0" />
                  <span className="shrink-0">{collect ? (f.status === "returning" ? "Rapatriement : retour" : "Rapatriement : aller") : "Livraison"}</span>
                  <span className="h-1 flex-1 bg-white/[0.06]">
                    <span className="block h-full bg-cyan-glow/80" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="shrink-0 font-mono">{formatDuration(Math.max(0, Math.floor(((end ?? now) - now) / 1000)))}</span>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <SectionTitle icon={Package} aside={<span className="font-mono text-[10px] text-slate-500">entrepôt {formatCompact(storage)} / ressource commune</span>}>
            Stocks de la colonie
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RESOURCE_LIST.map((r) => (
              <ResourceTile key={r.id} id={r.id} stock={Math.floor(colony.resources[r.id] ?? 0)} storage={storage} rate={rates[r.id] ?? 0} />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle
            icon={Hammer}
            aside={<span className="font-mono text-[10px] text-slate-500">niv. {COLONY_RULES.maxLevel} max · production +{Math.round(COLONY_RULES.productionBonus * 100)} % · un chantier à la fois</span>}
          >
            Bâtiments
          </SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {ids.map((id) => (
              <BuildingTile key={id} colony={colony} player={player} id={id} busy={busy} now={now} onUpgrade={() => void act(() => upgradeColonyBuilding(colony.id, id), "Construction lancée.")} />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle icon={Shield} aside={<span className="font-mono text-[10px] text-slate-500">{formatCompact(free)} places libres</span>}>
            Défenses de la colonie
          </SectionTitle>
          <div className="mb-3">
            <div className="h-2 bg-white/[0.06]">
              <div className="hud-sheen h-full bg-gradient-to-r from-mint-glow/70 to-cyan-glow" style={{ width: `${hangar.capacity > 0 ? Math.min(100, (hangar.used / hangar.capacity) * 100) : 0}%` }} />
            </div>
            {hangar.capacity === 0 && <p className="mt-1 text-[11px] text-ember-glow">Construis le hangar de défense de la colonie pour y placer des défenses.</p>}
          </div>
          {placed.length === 0 ? (
            <p className="mb-3 text-xs text-slate-500">Aucune défense pour l'instant.</p>
          ) : (
            <div className="mb-3 flex flex-wrap gap-2">
              {placed.map(([id, st]) => (
                <span key={id} className="hud-cut-sm flex items-center gap-2 border border-white/[0.07] bg-white/[0.03] py-1 pl-1 pr-2.5" title={findUnit(id)?.name}>
                  <img src={assetUrl(findUnit(id)?.image ?? "")} alt="" className="h-8 w-8 object-contain" />
                  <span className="flex flex-col leading-tight">
                    <span className="tabular-mono text-sm font-semibold text-slate-100">{formatCompact(st.count)}</span>
                    <span className="text-[10px] text-slate-500">{findUnit(id)?.name ?? id}</span>
                  </span>
                </span>
              ))}
            </div>
          )}
          {colony.defenseJob ? (
            (() => {
              const job = colony.defenseJob;
              const total = colonyDefenseSeconds(player, job.unitId, job.qty, colony) * 1000;
              const left = Math.max(0, job.endTime - now);
              return (
                <div className="border border-cyan-glow/30 bg-cyan-glow/[0.04] p-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-cyan-glow">
                    <img src={assetUrl(findUnit(job.unitId)?.image ?? "")} alt="" className="h-7 w-7 object-contain" />
                    <span className="flex-1">
                      {formatCompact(job.qty)} {findUnit(job.unitId)?.name} en construction
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" /> {formatDuration(Math.floor(left / 1000))}
                    </span>
                    <CancelJobButton target={{ kind: "colonyDefense", colonyId: colony.id }} compact />
                  </div>
                  <Progress value={total > 0 ? 100 - (left / total) * 100 : 0} className="mt-1.5" />
                </div>
              );
            })()
          ) : defenses.length === 0 ? (
            <p className="text-[11px] text-slate-500">Débloque des défenses sur ta planète mère pour en construire ici.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {defenses.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setDefense((d) => ({ ...d, unitId: u.id }))}
                    className={cn(
                      "hud-cut-sm flex items-center gap-2 border px-2 py-1.5 text-left text-xs transition-colors",
                      defense.unitId === u.id ? "border-cyan-glow/70 bg-cyan-glow/10 text-cyan-glow" : "border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-cyan-glow/40",
                    )}
                  >
                    <img src={assetUrl(u.image)} alt="" className="h-9 w-9 object-contain" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-semibold">{u.name}</span>
                      <AmountsInline amounts={{ scrap: u.cost.scrap, energy: u.cost.energy }} className="text-[10px] text-slate-500" />
                      <span className="font-mono text-[10px] text-slate-500">
                        {formatDuration(getUnitBuildTime(u, player.techLevels, player))} · {u.hangarSpace} place{u.hangarSpace > 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NumberInput size="sm" value={defense.qty} max={picked ? maxQty : 0} disabled={!picked} onChange={(v) => setDefense((d) => ({ ...d, qty: v }))} aria-label="Quantité" title="Maximum : place et stock" className="w-44" />
                {picked && defense.qty > 0 && (
                  <span className="flex flex-1 flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <CostChips cost={batchCost} stock={colony.resources} />
                    <span className="inline-flex items-center gap-1 font-mono" title="Temps de construction">
                      <Clock className="h-3 w-3" /> {formatDuration(colonyDefenseSeconds(player, picked.id, defense.qty, colony))}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 font-mono", batchSpace > free ? "text-ember-glow" : "")}>
                      <Warehouse className="h-3 w-3" /> {formatCompact(batchSpace)}/{formatCompact(free)}
                    </span>
                  </span>
                )}
                <Button
                  size="sm"
                  className="ml-auto"
                  disabled={busy || !picked || defense.qty <= 0 || batchSpace > free || !batchAffordable}
                  onClick={() => void act(() => buildColonyDefense(colony.id, defense.unitId, defense.qty), "Défenses en construction.")}
                >
                  <Shield className="h-3.5 w-3.5" /> Construire
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TransportDialog colony={colony} direction={transport} onClose={() => setTransport(null)} />
    </Card>
  );
}

/* ---------- page ---------- */

/** Une ligne de prérequis : coche, intitulé, détail et jauge éventuelle. */
function Requirement({ ok, label, detail, pct }: { ok: boolean; label: string; detail?: React.ReactNode; pct?: number }) {
  return (
    <div className={cn("flex gap-3 border p-3", ok ? "border-mint-glow/25 bg-mint-glow/[0.04]" : "border-ember-glow/25 bg-ember-glow/[0.03]")}>
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center border", ok ? "border-mint-glow/60 bg-mint-glow/15 text-mint-glow" : "border-ember-glow/50 bg-ember-glow/10 text-ember-glow")}>
        {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", ok ? "text-slate-100" : "text-slate-200")}>{label}</p>
        {detail && <div className="mt-0.5 text-[11px] text-slate-400">{detail}</div>}
        {pct !== undefined && (
          <div className="mt-1.5 h-1.5 bg-white/[0.06]">
            <div className={cn("h-full transition-[width] duration-700", ok ? "bg-mint-glow" : "bg-gradient-to-r from-ember-glow to-gold-glow")} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function FoundColony({ player }: { player: PlayerState }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const next = nextColonySlot(player);
  if (!next) return null;
  // Même compte que le serveur (v4.9.3 : tous les bâtiments, fin de partie comprise).
  const levels = homeLevels(player);
  const cost = colonyFoundCost();
  const affordable = Object.entries(cost).every(([r, n]) => (player.resources[r as ResourceId] ?? 0) >= (n ?? 0));
  const ready = levels >= next.levels;
  const missingRes = Object.entries(cost).filter(([r, n]) => (player.resources[r as ResourceId] ?? 0) < (n ?? 0)).length;
  return (
    <Card className="relative overflow-hidden p-0">
      <div className="relative flex flex-wrap items-center gap-4 border-b border-cyan-glow/15 bg-gradient-to-r from-cyan-glow/[0.08] to-transparent p-4">
        <PlanetOrb size={64} tone="var(--color-cyan-glow)" dim={!ready || !affordable} />
        <div className="min-w-0 flex-1">
          <p className="hud-eyebrow text-[10px] text-cyan-glow">Expansion · emplacement {next.slot} / {COLONY_RULES.maxColonies}</p>
          <h2 className="font-display text-xl font-bold tracking-[0.04em] text-white">Fonder la colonie {next.slot}</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Un vaisseau colonial part de ta planète mère et fonde la colonie en {COLONY_RULES.foundHours} h. Elle démarre avec {formatCompact(COLONY_RULES.startStock)} de chaque ressource commune. Ses
            extracteurs et son entrepôt démarrent à la moitié du niveau de ceux de ta planète mère (niveau {COLONY_RULES.foundationMax} au plus), et ses terres neuves produisent{" "}
            {Math.round(COLONY_RULES.productionBonus * 100)} % de plus. Son biome est tiré au hasard : il lui donne un gisement de ressource rare (acier renforcé, modules
            cybernétiques, nanites ou fragments d'IA) qui produit dès la fondation.
          </p>
        </div>
      </div>
      <div className="grid gap-2 p-4 lg:grid-cols-2">
        <Requirement
          ok={ready}
          label={`Bâtiments de la planète mère : ${levels} / ${next.levels} niveaux`}
          pct={(levels / next.levels) * 100}
          detail={
            <>
              {ready ? "Prérequis atteint." : `Encore ${next.levels - levels} niveau${next.levels - levels > 1 ? "x" : ""} de bâtiments sur ta planète mère.`}
              <span className="block text-[10px] text-slate-500">Tous les bâtiments comptent, fin de partie comprise.</span>
            </>
          }
        />
        <Requirement
          ok={affordable}
          label={affordable ? "Vaisseau colonial finançable" : `Vaisseau colonial : ${missingRes} ressource${missingRes > 1 ? "s" : ""} manquante${missingRes > 1 ? "s" : ""}`}
          detail={<CostChips cost={cost} stock={player.resources} className="mt-1" />}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 p-4">
        <Input value={name} placeholder={`Colonie ${next.slot}`} maxLength={30} onChange={(e) => setName(e.target.value)} className="h-10 w-full sm:w-56" />
        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={busy || !ready || !affordable || !!player.colonizing}
          onClick={() => {
            setBusy(true);
            void run(() => startColonization(name), "Le vaisseau colonial a décollé !", "Colonisation impossible.").finally(() => setBusy(false));
          }}
        >
          <Rocket className="h-4 w-4" /> <span className="sm:hidden">Lancer</span>
          <span className="hidden sm:inline">Lancer le vaisseau colonial</span>
        </Button>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
          <Clock className="h-3 w-3" /> {COLONY_RULES.foundHours} h de voyage
        </span>
      </div>
    </Card>
  );
}

/** Frise des emplacements : planète mère, colonies fondées, en route ou verrouillées. */
function SlotStrip({ player }: { player: PlayerState }) {
  const now = Date.now();
  const levels = homeLevels(player);
  const slots = Array.from({ length: COLONY_RULES.maxColonies }, (_, i) => i + 1);
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="hud-cut flex items-center gap-3 border border-cyan-glow/25 bg-cyan-glow/[0.04] p-3">
        <PlanetOrb size={44} tone="var(--color-cyan-glow)" />
        <div className="min-w-0">
          <p className="hud-eyebrow text-[9px] text-cyan-glow">Planète mère</p>
          <p className="truncate font-display text-sm font-semibold text-white">{player.pseudo}</p>
          <p className="font-mono text-[10px] text-slate-500">{levels} niveaux de bâtiments</p>
        </div>
      </div>
      {slots.map((slot) => {
        const colony = player.colonies?.find((c) => c.slot === slot);
        const flying = player.colonizing?.slot === slot ? player.colonizing : null;
        const need = COLONY_RULES.levelsRequired[slot - 1] ?? 0;
        const tone = slot === 2 ? "var(--color-violet-glow)" : "var(--color-mint-glow)";
        return (
          <div
            key={slot}
            className={cn("hud-cut flex items-center gap-3 border p-3", colony ? "border-mint-glow/25 bg-mint-glow/[0.04]" : flying ? "border-cyan-glow/30 bg-cyan-glow/[0.04]" : "border-dashed border-white/10 bg-white/[0.015]")}
          >
            <PlanetOrb size={44} tone={tone} dim={!colony} spin={!!colony} />
            <div className="min-w-0 flex-1">
              <p className="hud-eyebrow text-[9px] text-slate-500">Emplacement {slot}</p>
              {colony ? (
                <>
                  <p className="truncate font-display text-sm font-semibold text-white">{colony.name}</p>
                  <p className="font-mono text-[10px] text-mint-glow">opérationnelle</p>
                </>
              ) : flying ? (
                <>
                  <p className="truncate font-display text-sm font-semibold text-cyan-glow">{flying.name}</p>
                  <Progress value={100 - ((flying.endTime - now) / (COLONY_RULES.foundHours * 3600_000)) * 100} className="mt-1" />
                  <p className="mt-0.5 font-mono text-[10px] text-cyan-glow">arrivée dans {formatDuration(Math.max(0, Math.floor((flying.endTime - now) / 1000)))}</p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-1 font-display text-sm font-semibold text-slate-400">
                    {levels >= need ? <Rocket className="h-3.5 w-3.5 text-mint-glow" /> : <Lock className="h-3.5 w-3.5" />} {levels >= need ? "Disponible" : "Verrouillé"}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {Math.min(levels, need)} / {need} niveaux
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ColoniesPage() {
  useNowTicker();
  const raw = usePlayerStore((s) => s.player);
  if (!raw) return null;
  // Affichage en direct : colonies rattrapées à l'instant présent.
  const player = structuredClone(raw);
  advanceColonies(player, Date.now());
  const colonies = [...(player.colonies ?? [])].sort((a, b) => a.slot - b.slot);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Expansion"
        title="Colonies"
        description="Jusqu'à deux planètes de plus, avec leurs propres bâtiments, stocks et défenses. Tes technologies, ton alliance et tes ascensions profitent à tout l'empire."
      />
      <SlotStrip player={player} />
      {colonies.map((c) => (
        <ColonyCard key={c.id} colony={c} player={player} />
      ))}
      {!raw.colonizing && <FoundColony player={player} />}
      {colonies.length === 0 && raw.colonizing && (
        <Card>
          <EmptyState icon={<Globe2 className="h-6 w-6" />} title="Colonisation en cours">
            Le vaisseau colonial est en route : la colonie apparaîtra ici dès son arrivée.
          </EmptyState>
        </Card>
      )}
    </div>
  );
}
