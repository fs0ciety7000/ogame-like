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
import { openUltimatum, PIRATE_ART } from "@/components/game/PirateUltimatum";
import { defensivePower, lairPower, pirateState, PIRATE_LAIR_UID, PIRATE_RULES, raidPower } from "@/game/pirates";
import { fleetSpeed, LAIR_DISTANCE, travelSeconds } from "@/game/fleets";
import { allianceFlightFactor } from "@/game/alliances";
import { computeFleetPower } from "@/game/combat";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { GameActionError, sendFleet } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { formatClock, formatCompact, formatDuration } from "@/lib/utils";

function LairDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const power = computeFleetPower(player.units, player.techLevels, selected, ["attack"]);
  const lair = lairPower(player);
  const flight = Object.keys(selected).length > 0 ? travelSeconds(LAIR_DISTANCE, fleetSpeed(player.units, selected), allianceFlightFactor(player.allianceResearch)) : null;

  const send = async () => {
    setBusy(true);
    try {
      await sendFleet(PIRATE_LAIR_UID, selected, "lair");
      triggerWarpEffect();
      toast.success("Assaut lancé sur le repaire de Varan !");
      setFleet({});
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Assaut du repaire de Varan</DialogTitle>
        <p className="text-sm text-slate-400">
          Défenses du repaire estimées : <strong className="text-ember-glow">{formatCompact(lair)}</strong> (fixées au décollage). Ta flotte sélectionnée :{" "}
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

/** Page Menaces : la Liste de Varan, la Notoriété et le repaire. */
export function ThreatsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const fleets = useFleetStore((s) => s.fleets);
  const [lairOpen, setLairOpen] = useState(false);
  if (!player) return null;
  const st = pirateState(player);
  const ultimatum = st.ultimatum && st.ultimatum.expiresAtMs > Date.now() ? st.ultimatum : null;
  const raid = fleets.find((f) => f.mission === "pirate" && f.status === "outbound");
  const assault = fleets.find((f) => f.mission === "lair" && f.status !== "done");
  const nextIn = st.nextListAtMs > Date.now() ? Math.floor((st.nextListAtMs - Date.now()) / 1000) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Menaces" title="La Liste de Varan" description="La Confrérie du Vide rôde aux confins de la galaxie." />

      <Card className="overflow-hidden p-0">
        <div className="grid md:grid-cols-[minmax(0,20rem)_1fr]">
          <img src={PIRATE_ART} alt="Le capitaine Varan et le Silencieux" className="h-72 w-full object-cover object-top md:h-full" />
          <div className="flex flex-col gap-3 p-5 text-sm leading-relaxed text-slate-300">
            <p>
              Depuis l'effondrement des routes commerciales, une flotte sans bannière rôde aux confins de la galaxie : <strong className="text-white">la Confrérie du Vide</strong>.
            </p>
            <p>
              Son chef, le <strong className="text-white">capitaine Orsk Varan</strong>, ancien officier impérial à la barbe grise, tient à jour une tablette lumineuse :{" "}
              <em>la Liste</em>, les empires trop riches pour être prudents. Ses ordres sont exécutés par <strong className="text-white">le Silencieux</strong>, un colosse au masque
              respiratoire dont personne n'a jamais entendu la voix. Quand son doigt se pose sur toi, ton nom vient d'entrer sur la Liste.
            </p>
            <p className="text-ember-glow">Varan laisse toujours un choix : payer le tribut, ou voir le Silencieux venir le chercher lui-même.</p>
            <p className="text-slate-500">On murmure qu'en repoussant assez de raids, on finit par remonter jusqu'à son repaire…</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-2 p-4">
          <h3 className="flex items-center gap-2 font-display text-sm text-white">
            <Skull className="h-4 w-4 text-ember-glow" /> Ta situation
          </h3>
          {ultimatum ? (
            <Button variant="danger" size="sm" onClick={openUltimatum}>
              Ultimatum en attente · {formatDuration(Math.floor((ultimatum.expiresAtMs - Date.now()) / 1000))}
            </Button>
          ) : raid ? (
            <p className="text-sm text-danger-glow">Le Silencieux arrive : impact dans {formatClock(Math.max(0, Math.floor((raid.arriveAtMs - Date.now()) / 1000)))}.</p>
          ) : (
            <p className="text-xs text-slate-400">{nextIn !== null ? `Prochaine consultation de la Liste dans environ ${formatDuration(nextIn)}.` : "Tu n'es pas sur la Liste pour l'instant."}</p>
          )}
          <p className="text-xs text-slate-400">
            Force estimée du prochain raid : <strong className="text-slate-200">{formatCompact(raidPower(player, st.notoriety))}</strong> (tes défenses :{" "}
            {formatCompact(defensivePower(player))}, sans garnisons).
          </p>
        </Card>

        <Card className="flex flex-col gap-2 p-4">
          <h3 className="font-display text-sm text-white">Notoriété : {st.notoriety} / {PIRATE_RULES.maxNotoriety}</h3>
          <Progress value={(st.notoriety / PIRATE_RULES.maxNotoriety) * 100} />
          <p className="text-xs text-slate-400">
            Chaque raid repoussé endurcit la Confrérie (+{Math.round(PIRATE_RULES.perNotorietyPct * 100)} % de force) ; chaque raid réussi la rassure (−1).
          </p>
          <p className="text-xs text-slate-500">
            Raids repoussés : {st.raidsWon} · subis : {st.raidsLost} · tributs payés : {st.tributesPaid} · repaires pris : {st.lairsTaken}
          </p>
        </Card>

        <Card className="flex flex-col gap-2 p-4">
          <h3 className="flex items-center gap-2 font-display text-sm text-white">
            <Trophy className="h-4 w-4 text-gold-glow" /> Le repaire
          </h3>
          {st.lairOpen ? (
            <>
              <p className="text-sm text-gold-glow">Position localisée ! Défenses estimées : {formatCompact(lairPower(player))}.</p>
              <p className="text-xs text-slate-400">
                Victoire : {PIRATE_RULES.lairRewardHours} h de production, +{PIRATE_RULES.lairRare} de chaque rare, +{PIRATE_RULES.lairXp} XP et le titre « {PIRATE_RULES.lairTitle} ».
              </p>
              {assault ? (
                <p className="text-xs text-cyan-glow">Assaut en cours.</p>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setLairOpen(true)}>
                  <Crosshair className="mr-1.5 h-4 w-4" /> Attaquer le repaire
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400">
                Repousse {PIRATE_RULES.raidsForLair} raids pour localiser le repaire de Varan ({Math.min(st.repelled, PIRATE_RULES.raidsForLair)} / {PIRATE_RULES.raidsForLair}).
              </p>
              <Progress value={(Math.min(st.repelled, PIRATE_RULES.raidsForLair) / PIRATE_RULES.raidsForLair) * 100} />
            </>
          )}
        </Card>
      </div>

      <FleetsPanel hideWhenEmpty />
      <LairDialog open={lairOpen} onClose={() => setLairOpen(false)} />
    </div>
  );
}
