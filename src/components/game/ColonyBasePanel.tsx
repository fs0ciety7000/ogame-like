import { useState } from "react";
import { toast } from "sonner";
import { Anchor, Undo2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { NumberInput } from "@/components/ui/number-input";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { allianceFlightFactor } from "@/game/alliances";
import type { Colony } from "@/game/colonies";
import { COLONY_BASE_RULES, distanceBetween, fleetSpeed, travelSeconds, type Fleet } from "@/game/fleets";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration, formatNumber } from "@/lib/utils";
import { GameActionError, launchFleet, recallFleet } from "@/services/playerService";
import { useFleetStore } from "@/store/fleetStore";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import type { PlayerState } from "@/types/game";

/* 6.10.0 (proposals/flotte-basee.md) : base avancée sur une colonie. La flotte y stationne, attaque depuis là
   (fenêtre d'attaque, « Départ ») et y revient ; depuis la 6.11.1, elle peut défendre la colonie (réglage admin). */

const shipsLine = (units: Record<string, number>) =>
  Object.entries(units)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${findUnit(id)?.name ?? id} ×${formatNumber(n)}`)
    .join(" · ");

export function ColonyBasePanel({ colony, player }: { colony: Colony; player: PlayerState }) {
  useNowTicker();
  const now = Date.now();
  const fleets = useFleetStore((s) => s.fleets);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const base = fleets.find((f) => f.mission === "colonybase" && f.ownerUid === player.uid && f.targetUid === colony.id && (f.status === "outbound" || f.status === "stationed"));
  const returning = fleets.filter((f) => f.mission === "attack" && f.base?.colonyId === colony.id && f.status !== "done");

  const recall = async (f: Fleet) => {
    const ok = await askConfirm({
      title: "Lever la base ?",
      message: `La flotte rentre à ta planète mère (${formatDuration((f.arriveAtMs - f.departAtMs) / 1000)} de trajet). Les attaques parties de la base rentreront aussi à la planète mère.`,
      confirmLabel: "Lever la base",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await recallFleet(f.id);
      toast.success("La flotte quitte la base.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Rappel impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
        Base avancée
        {!base && <HudChip size="sm" tone="neutral">aucune</HudChip>}
        {base?.status === "outbound" && <HudChip size="sm" tone="accent">en route</HudChip>}
        {base?.status === "stationed" && <HudChip size="sm" tone="mint">en place</HudChip>}
        {returning.length > 0 && <HudChip size="sm" tone="ember">{returning.length} en mission</HudChip>}
      </p>
      {base ? (
        <div className="mt-1.5 flex flex-col items-start gap-2 text-[11px] text-slate-400 sm:flex-row sm:items-center">
          <span className="min-w-0 sm:flex-1">
            <span className="font-mono tabular-nums text-slate-200">{shipsLine(base.units) || "vide"}</span>
            <br />
            {base.status === "outbound" ? (
              <>
                Arrivée dans <span className="font-mono tabular-nums">{formatDuration(Math.max(0, (base.arriveAtMs - now) / 1000))}</span>.
              </>
            ) : (
              <>
                Rentre seule dans <span className="font-mono tabular-nums">{formatDuration(Math.max(0, ((base.stationedUntilMs ?? now) - now) / 1000))}</span>. Attaque depuis la base : fenêtre
                d'attaque, « Départ ».
              </>
            )}
          </span>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void recall(base)}>
            <Undo2 className="h-3.5 w-3.5" /> Lever la base
          </Button>
        </div>
      ) : (
        <div className="mt-1.5 flex flex-col items-start gap-2 text-[11px] text-slate-400 sm:flex-row sm:items-center">
          <span className="min-w-0 sm:flex-1">
            Stationne une flotte ici, jusqu'à <span className="font-mono tabular-nums">{COLONY_BASE_RULES.maxDays} j</span> : tes attaques partent de la colonie et y reviennent.{" "}
            {COLONY_BASE_RULES.defendsColony ? "Elle défend aussi la colonie (pertes possibles)." : "Elle ne défend pas la colonie."}
          </span>
          <Button size="sm" variant="outline" disabled={!COLONY_BASE_RULES.enabled} onClick={() => setOpen(true)}>
            <Anchor className="h-3.5 w-3.5" /> Baser une flotte
          </Button>
        </div>
      )}
      {open && <BaseDialog colony={colony} player={player} onClose={() => setOpen(false)} />}
    </div>
  );
}

function BaseDialog({ colony, player, onClose }: { colony: Colony; player: PlayerState; onClose: () => void }) {
  const [ships, setShips] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const ids = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (player.units[id]?.count ?? 0) > 0);
  const selected = Object.fromEntries(Object.entries(ships).filter(([, n]) => n > 0));
  const has = Object.keys(selected).length > 0;
  const trip = has ? travelSeconds(distanceBetween(player.uid, colony.id), fleetSpeed(player.units, selected), allianceFlightFactor(player.allianceResearch, player.techLevels, player)) : null;

  const send = async () => {
    setBusy(true);
    try {
      await launchFleet({ mission: "colonybase", colonyId: colony.id, targetUid: colony.id, fleet: selected }, colony.name);
      triggerWarpEffect();
      toast.success(`Flotte en route vers ${colony.name}.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Départ impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Baser une flotte sur {colony.name}</DialogTitle>
        <DialogDescription>
          La flotte vole jusqu'à la colonie et y reste {COLONY_BASE_RULES.maxDays} jours au plus. Elle occupe un emplacement de flotte et ses places de hangar à la planète mère.
        </DialogDescription>
        <div className="mt-2 flex flex-col gap-1.5">
          {ids.length === 0 && (
            <EmptyState size="sm" icon={<Rocket />} title="Aucun vaisseau à quai">
              Construis des vaisseaux d'attaque pour former une base.
            </EmptyState>
          )}
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-slate-300">{findUnit(id)?.name}</span>
                <NumberInput size="sm" value={ships[id] ?? 0} max={owned} aria-label={`Quantité ${findUnit(id)?.name}`} onChange={(v) => setShips((f) => ({ ...f, [id]: v }))} className="w-40 shrink-0" />
                <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-slate-500">/{formatNumber(owned)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Trajet : <span className="font-mono tabular-nums text-slate-200">{trip !== null ? formatDuration(trip) : "—"}</span>
        </p>
        <Button className="mt-3 w-full" disabled={busy || !has} onClick={() => void send()}>
          <Anchor className="mr-1.5 h-4 w-4" /> Envoyer
        </Button>
      </DialogContent>
    </Dialog>
  );
}
