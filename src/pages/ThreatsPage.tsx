import { assetUrl } from "@/lib/assets";
import { EmptyState } from "@/components/ui/hud";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Crosshair, Skull, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { FleetsPanel } from "@/components/game/FleetsPanel";
import { accent, openUltimatum } from "@/components/game/PirateUltimatum";
import { activeUltimatum, FACTIONS, lairPower, lairUid, pirateState, raidPower, targetPower, type FactionDef } from "@/game/pirates";
import { fleetSpeed, LAIR_DISTANCE, travelSeconds } from "@/game/fleets";
import { allianceFlightFactor } from "@/game/alliances";
import { computeFleetPower } from "@/game/combat";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { GameActionError, sendFleet } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatClock, formatCompact, formatDuration } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

function LairDialog({ faction, onClose }: { faction: FactionDef | null; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  if (!player || !faction) return null;
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const power = computeFleetPower(player.units, player.techLevels, selected, ["attack"]);
  const lair = lairPower(faction, player);
  const flight = Object.keys(selected).length > 0 ? travelSeconds(LAIR_DISTANCE, fleetSpeed(player.units, selected), allianceFlightFactor(player.allianceResearch)) : null;

  const send = async () => {
    setBusy(true);
    try {
      await sendFleet(lairUid(faction.id), selected, "lair");
      triggerWarpEffect();
      toast.success(`Assaut lancé sur ${faction.lair.name} !`);
      setFleet({});
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Assaut : {faction.lair.name}</DialogTitle>
        <p className="text-sm text-slate-400">
          Défenses estimées : <strong className="text-ember-glow">{formatCompact(lair)}</strong> (fixées au décollage). Ta flotte sélectionnée :{" "}
          <strong className={power > lair ? "text-mint-glow" : "text-slate-200"}>{formatCompact(power)}</strong>.
        </p>
        <div className="mt-3 space-y-2">
          {OFFENSIVE_UNITS.filter((id) => (player.units[id]?.count ?? 0) > 0).map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-slate-200">{findUnit(id)?.name ?? id}</span>
                <span className="text-xs text-slate-500">À quai : {owned}</span>
                <Input
                  type="number"
                  min={0}
                  max={owned}
                  value={fleet[id] ?? 0}
                  onChange={(e) => setFleet({ ...fleet, [id]: Math.max(0, Math.min(owned, parseInt(e.target.value) || 0)) })}
                  className="w-20"
                />
              </div>
            );
          })}
        </div>
        {flight !== null && (
          <p className="mt-2 text-xs text-slate-400">
            <Clock className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-cyan-glow" />
            Trajet : {formatDuration(flight)}, puis retour des survivants.
          </p>
        )}
        <Button variant="danger" className="mt-3 w-full" disabled={busy || Object.keys(selected).length === 0} onClick={() => void send()}>
          <Crosshair className="mr-1.5 h-4 w-4" /> Lancer l'assaut
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function triggerText(f: FactionDef): string {
  const t = f.trigger;
  switch (t.type) {
    case "aggression":
      return `Vise les agresseurs : ${t.minVictories} victoires ou plus contre des joueurs en ${t.windowDays} jours.`;
    case "research":
      return `Vise les savants : ${t.threshold ?? 0} niveaux de technologies ou plus et une recherche terminée ces ${t.windowDays} derniers jours.`;
    case "hoard":
      return `Vise les coffres pleins : entrepôts remplis à ${t.threshold ?? 0} % ou plus.`;
    case "expansion":
      return `Vise les empires qui grandissent vite : ${t.threshold ?? 0} niveaux de bâtiments gagnés en ${t.windowDays} jours.`;
    default:
      return "Vise les empires actifs, au hasard, tous les quelques jours.";
  }
}

function FactionCard({ faction, player, onLair }: { faction: FactionDef; player: PlayerState; onLair: () => void }) {
  const fleets = useFleetStore((s) => s.fleets);
  const st = pirateState(player, faction.id);
  const a = accent(faction);
  const now = Date.now();
  const active = activeUltimatum(player, now);
  const mine = active?.faction.id === faction.id ? active.ultimatum : null;
  const raid = fleets.find((f) => f.mission === "pirate" && f.status === "outbound" && (f.factionId ?? "varan") === faction.id);
  const assault = fleets.find((f) => f.mission === "lair" && f.status !== "done" && (f.factionId ?? "varan") === faction.id);
  const nextIn = st.nextListAtMs > now ? Math.floor((st.nextListAtMs - now) / 1000) : null;
  const fleetOnly = faction.raid.target === "fleet";

  return (
    <Card className={cn("overflow-hidden p-0", a.border)}>
      <div className="grid md:grid-cols-[minmax(0,18rem)_1fr]">
        <img src={assetUrl(faction.art)} alt={`${faction.leader} et ${faction.enforcer}`} className="h-64 w-full object-cover object-top md:h-full" />
        <div className="flex flex-col gap-3 p-5">
          <div>
            <p className={cn("hud-eyebrow", a.text)}>{faction.name}</p>
            <p className="text-xs text-slate-500">
              {faction.leader} · {faction.enforcer}
            </p>
          </div>
          {faction.story.split(/\n\s*\n/).map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-300">
              {para}
            </p>
          ))}
          <p className="text-xs text-slate-500">
            {triggerText(faction)}{" "}
            {fleetOnly ? "Ses raids frappent la flotte à quai : les défenses ne combattent pas." : "Ses raids frappent la base entière."}
          </p>

          <div className="grid gap-3 border-t border-white/5 pt-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Skull className={cn("h-3.5 w-3.5", a.text)} /> Ta situation
              </p>
              {mine ? (
                <Button variant="danger" size="sm" onClick={openUltimatum}>
                  Ultimatum · {formatDuration(Math.floor((mine.expiresAtMs - now) / 1000))}
                </Button>
              ) : raid ? (
                <p className="text-xs text-danger-glow">{faction.enforcer} arrive : {formatClock(Math.max(0, Math.floor((raid.arriveAtMs - now) / 1000)))}.</p>
              ) : (
                <p className="text-xs text-slate-400">{nextIn !== null ? `Prochaine traque possible dans ~${formatDuration(nextIn)}.` : "Rien en vue pour l'instant."}</p>
              )}
              <p className="text-[11px] text-slate-500">
                Force du prochain raid : {formatCompact(raidPower(faction, player, st.notoriety))} ({fleetOnly ? "ta flotte" : "tes défenses"} :{" "}
                {formatCompact(targetPower(faction, player))}).
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-200">
                Notoriété : {st.notoriety} / {faction.raid.maxNotoriety}
              </p>
              <Progress value={(st.notoriety / Math.max(1, faction.raid.maxNotoriety)) * 100} />
              <p className="text-[11px] text-slate-500">
                Repoussés : {st.raidsWon} · subis : {st.raidsLost} · payés : {st.tributesPaid}
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Trophy className="h-3.5 w-3.5 text-gold-glow" /> {faction.lair.name}
              </p>
              {st.lairOpen ? (
                assault ? (
                  <p className="text-xs text-cyan-glow">Assaut en cours.</p>
                ) : (
                  <Button variant="danger" size="sm" onClick={onLair}>
                    <Crosshair className="mr-1 h-3.5 w-3.5" /> Attaquer ({formatCompact(lairPower(faction, player))})
                  </Button>
                )
              ) : (
                <>
                  <Progress value={(Math.min(st.repelled, faction.lair.raidsNeeded) / faction.lair.raidsNeeded) * 100} />
                  <p className="text-[11px] text-slate-500">
                    {Math.min(st.repelled, faction.lair.raidsNeeded)} / {faction.lair.raidsNeeded} raids repoussés pour le localiser.
                  </p>
                </>
              )}
              {faction.lair.title && <p className="text-[11px] text-slate-500">Titre : « {faction.lair.title} »</p>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Page Menaces : toutes les factions hostiles, leur Notoriété et leur repaire. */
export function ThreatsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [lairFaction, setLairFaction] = useState<FactionDef | null>(null);
  if (!player) return null;
  const factions = FACTIONS.filter((f) => f.enabled);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Menaces" title="Menaces" description="Les factions qui rôdent aux confins de la galaxie. Une seule à la fois peut te viser." />
      {factions.length === 0 && <Card><EmptyState icon="☠️" title="Calme plat">Aucune faction hostile active pour l'instant.</EmptyState></Card>}
      {factions.map((f) => (
        <FactionCard key={f.id} faction={f} player={player} onLair={() => setLairFaction(f)} />
      ))}
      <FleetsPanel hideWhenEmpty />
      <LairDialog faction={lairFaction} onClose={() => setLairFaction(null)} />
    </div>
  );
}
