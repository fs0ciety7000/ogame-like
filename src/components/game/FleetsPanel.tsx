import { PlayerName } from "@/components/ui/player-name";
import { targetsPlayer } from "@/game/fleets";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CornerUpLeft, Rocket, Wind, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { awaitingDeparture, fleetProgress, type Fleet } from "@/game/fleets";
import { PatrolDialog } from "@/components/game/MissionDialogs";
import { ThreatGauge } from "@/components/game/ThreatGauge";
import { findUnit } from "@/game/units";
import { factionOfLair, findFaction } from "@/game/pirates";
import { formatClock, formatCompact } from "@/lib/utils";
import { GameActionError, recallFleet } from "@/services/playerService";
import { fireRecallBeacon } from "@/services/bountyService";
import { bountyState } from "@/game/bounties";
import { usePlayerStore } from "@/store/playerStore";
import { EmojiText, GameIcon } from "@/components/ui/game-icon";
import { HudChip } from "@/components/ui/hud";

/** Flotte hostile : une attaque d'un autre joueur, encore en approche. */
export function isHostile(f: Fleet, uid: string | undefined): boolean {
  return (
    targetsPlayer(f, uid) &&
    f.ownerUid !== uid &&
    f.status === "outbound" &&
    ((f.mission ?? "attack") === "attack" || f.mission === "pirate")
  );
}

function fleetLabel(f: Fleet, outbound: boolean): string {
  switch (f.mission) {
    case "patrol":
      return outbound ? "🌀 Patrouille (aller)" : "🌀 Patrouille (retour)";
    case "spy":
      return outbound
        ? `🛰️ Sondes → ${f.targetPseudo}`
        : `🛰️ ← sondes de ${f.targetPseudo}`;
    case "lair":
      return outbound
        ? `☠️ Assaut : ${findFaction(f.factionId ?? factionOfLair(f.targetUid))?.lair.name ?? "repaire"}`
        : "☠️ ← retour du repaire";
    case "garrison":
      return f.status === "stationed"
        ? `🛡️ Garnison chez ${f.targetPseudo}`
        : outbound
          ? `🛡️ Garnison → ${f.targetPseudo}`
          : `🛡️ ← retour de chez ${f.targetPseudo}`;
    case "bounty":
      return outbound ? `🐝 Prime : ${f.targetPseudo}` : `🐝 ← retour de la traque de ${f.targetPseudo}`;
    case "elite":
      return outbound ? `🐝 Proie d'élite : ${f.targetPseudo}` : "🐝 ← retour de la proie d'élite";
    case "delivery":
      return outbound ? `📦 Livraison → ${f.targetPseudo}` : `📦 ← retour de livraison (${f.targetPseudo})`;
    case "recycle":
      return outbound
        ? `♻️ Débris de ${f.targetPseudo}`
        : `♻️ ← retour des débris de ${f.targetPseudo}`;
    default:
      return outbound ? `→ ${f.targetPseudo}` : `← retour de ${f.targetPseudo}`;
  }
}

function fleetSummary(fleet: Fleet): string {
  return Object.entries(fleet.units ?? {})
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${formatCompact(n)} ${findUnit(id)?.name ?? id}`)
    .join(", ") + (fleet.decoyed ? " · leurre actif" : "");
}

/** Flottes du joueur (aller, retour) et flottes hostiles en approche. */
export function FleetsPanel({
  hideWhenEmpty = false,
}: {
  hideWhenEmpty?: boolean;
}) {
  useNowTicker();
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const [pending, setPending] = useState<string | null>(null);
  const [patrolOpen, setPatrolOpen] = useState(false);
  const beacons = usePlayerStore((s) => (s.player ? bountyState(s.player).beacons : 0));
  const now = Date.now();

  const incoming = fleets.filter((f) => isHostile(f, uid));
  const mine = fleets.filter((f) => f.ownerUid === uid && f.status !== "done");
  const hosted = fleets.filter(
    (f) =>
      f.mission === "garrison" &&
      f.targetUid === uid &&
      f.ownerUid !== uid &&
      f.status !== "done",
  );
  if (
    hideWhenEmpty &&
    incoming.length === 0 &&
    mine.length === 0 &&
    hosted.length === 0
  )
    return null;

  const beacon = async (fleet: Fleet) => {
    setPending(fleet.id);
    try {
      toast.success((await fireRecallBeacon(fleet.id)).message);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Balise inutilisable.");
    } finally {
      setPending(null);
    }
  };

  const recall = async (fleet: Fleet) => {
    setPending(fleet.id);
    try {
      await recallFleet(fleet.id);
      toast.success("Flotte rappelée : demi-tour !");
    } catch (err) {
      toast.error(
        err instanceof GameActionError ? err.message : "Rappel impossible.",
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-cyan-glow" />
        <h3 className="font-display text-sm text-slate-100">Flottes</h3>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-7 px-2 text-xs"
          onClick={() => setPatrolOpen(true)}
          title="Mettre la flotte à l'abri"
        >
          <Wind className="mr-1 h-3.5 w-3.5" /> Patrouille
        </Button>
        <Link
          to="/game/galaxie"
          className="text-xs text-cyan-glow hover:underline"
        >
          Voir sur la carte →
        </Link>
      </div>

      {incoming.map((f) => {
        const left = Math.max(0, Math.floor((f.arriveAtMs - now) / 1000));
        return (
          <div
            key={f.id}
            className="hud-callout hud-tone-danger hud-callout-alert p-2.5"
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold text-danger-glow">
              <AlertTriangle className="h-3.5 w-3.5" /> {f.mission === "pirate" ? "Raid du" : "Attaque de"}{" "}
              <PlayerName uid={f.ownerUid} pseudo={f.ownerPseudo} /> — impact dans {formatClock(left)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {f.mission === "pirate"
                ? `${findFaction(f.factionId ?? "varan")?.name ?? "Faction hostile"}${findFaction(f.factionId ?? "varan")?.raid.target === "fleet" ? " · vise ta flotte à quai" : ""} · puissance ${formatCompact(f.power ?? 0)}`
                : fleetSummary(f)}
            </p>
            <ThreatGauge fleet={f} className="mt-1.5" />
            {f.anomaly && (
              <p className="mt-1 text-[11px] font-semibold text-violet-glow">
                ⚗ Anomalie chimique : capsules à bord (stimulant ou leurre), la composition affichée peut être fausse.
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-2">
              <Progress
                value={fleetProgress(f, now) * 100}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-danger-glow"
                onClick={() => setPatrolOpen(true)}
              >
                <Wind className="mr-1 h-3.5 w-3.5" /> Mode fuite
              </Button>
            </div>
          </div>
        );
      })}

      {mine.map((f) => {
        const outbound = f.status === "outbound";
        const stationed = f.status === "stationed";
        const decision = f.status === "decision";
        const recallable = f.mission !== "expedition" && f.mission !== "leviathan" && f.mission !== "seasonboss" && f.mission !== "elite";
        const beaconable = beacons > 0 && f.mission !== "expedition" && !decision && !((f.mission === "leviathan" || f.mission === "seasonboss" || f.mission === "elite") && outbound);
        const at = decision
          ? (f.stationedUntilMs ?? now)
          : outbound
          ? f.arriveAtMs
          : stationed
            ? (f.stationedUntilMs ?? now)
            : (f.returnAtMs ?? now);
        const left = Math.max(0, Math.floor((at - now) / 1000));
        const loot = Object.values(f.loot ?? {}).reduce(
          (a: number, b) => a + (b ?? 0),
          0,
        );
        return (
          <div
            key={f.id}
            className="hud-cut-sm border border-white/5 bg-black/20 p-2.5"
          >
            <div className="flex items-center gap-2 text-xs">
              <span
                className={
                  outbound
                    ? "font-semibold text-gold-glow"
                    : "font-semibold text-mint-glow"
                }
              >
                <EmojiText text={fleetLabel(f, outbound)} />
              </span>
              <span className="tabular-mono ml-auto text-slate-400">
                {decision
                  ? "décision"
                  : stationed
                  ? "fin"
                  : outbound
                    ? f.mission === "expedition"
                      ? "mi-parcours"
                      : f.mission === "patrol"
                      ? "demi-tour"
                      : f.mission === "attack" || !f.mission
                        ? "impact"
                        : "arrivée"
                    : "retour"}{" "}
                dans {formatClock(left)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {fleetSummary(f) || "Aucun survivant"}
              {!outbound &&
                loot > 0 &&
                ` · ${f.mission === "recycle" ? "débris" : "butin"} ${formatCompact(loot)}`}
              {f.recalled && " · rappelée"}
              {awaitingDeparture(f, now) && <span className="text-cyan-glow"> · décollage programmé dans <span className="font-mono">{formatClock(Math.floor((f.departAtMs - now) / 1000))}</span></span>}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress
                value={
                  (stationed
                    ? 1 -
                      Math.max(0, (f.stationedUntilMs ?? now) - now) /
                        Math.max(1, f.durationMs ?? 1)
                    : outbound
                      ? fleetProgress(f, now)
                      : 1 - fleetProgress(f, now)) * 100
                }
                className="flex-1"
              />
              {(outbound || stationed) && recallable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  disabled={pending === f.id}
                  onClick={() => void recall(f)}
                >
                  <CornerUpLeft className="mr-1 h-3.5 w-3.5" /> Rappeler
                </Button>
              )}
              {beaconable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-gold-glow"
                  disabled={pending === f.id}
                  title={`Balise de repli : retour immédiat (${beacons} en réserve)`}
                  onClick={() => void beacon(f)}
                >
                  <Zap className="mr-1 h-3.5 w-3.5" /> Balise
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {hosted.length > 0 && (
        <div className="hud-callout hud-tone-accent p-2.5 text-xs">
          <p className="font-semibold text-cyan-glow">
            <GameIcon name="shield" /> Garnisons alliées chez toi
          </p>
          {hosted.map((f) => (
            <p key={f.id} className="mt-1 text-slate-300">
              <PlayerName uid={f.ownerUid} pseudo={f.ownerPseudo} /> : {fleetSummary(f)}
              <span className="text-slate-500">
                {" "}
                ·{" "}
                {f.status === "stationed"
                  ? `jusqu'à ${new Date(f.stationedUntilMs ?? 0).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                  : f.status === "outbound"
                    ? `arrive dans ${formatClock(Math.max(0, Math.floor((f.arriveAtMs - now) / 1000)))}`
                    : "repartie"}
              </span>
            </p>
          ))}
        </div>
      )}

      {incoming.length === 0 && mine.length === 0 && (
        <p className="text-xs text-slate-500">
          Aucune flotte en vol. Lance une attaque depuis la carte ou la liste
          des joueurs.
        </p>
      )}
      <PatrolDialog open={patrolOpen} onClose={() => setPatrolOpen(false)} />
    </Card>
  );
}

/** Pastille de l'en-tête : flottes hostiles en approche. */
export function HostileFleetAlert() {
  useNowTicker();
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const [patrolOpen, setPatrolOpen] = useState(false);
  const incoming = fleets.filter((f) => isHostile(f, uid));
  if (incoming.length === 0) return null;
  const next = Math.min(...incoming.map((f) => f.arriveAtMs));
  return (
    <div className="flex items-center gap-1">
      <HudChip asChild tone="danger" alert title="Flottes hostiles en approche">
        <Link to="/game/galaxie">
          <AlertTriangle />
          {incoming.length > 1 ? `${incoming.length} flottes hostiles` : "Flotte hostile"} · {formatClock(Math.max(0, Math.floor((next - Date.now()) / 1000)))}
        </Link>
      </HudChip>
      <HudChip asChild tone="danger" title="Mode fuite : mettre la flotte à l'abri en patrouille">
        <button type="button" onClick={() => setPatrolOpen(true)}>
          <Wind /> Fuir
        </button>
      </HudChip>
      <PatrolDialog open={patrolOpen} onClose={() => setPatrolOpen(false)} />
    </div>
  );
}
