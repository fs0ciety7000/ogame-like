import { PlayerName } from "@/components/ui/player-name";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CornerUpLeft, Crosshair, DoorOpen, FlaskConical, Package, Recycle, RotateCcw, Rocket, Satellite, Shield, Skull, Wind, Zap, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { awaitingDeparture, FLEET_MISSION_LABELS, fleetProgress, fleetSlots, SLOT_FREE_MISSIONS, type Fleet } from "@/game/fleets";
import { PatrolDialog } from "@/components/game/MissionDialogs";
import { ThreatGauge } from "@/components/game/ThreatGauge";
import { findUnit } from "@/game/units";
import { factionOfLair, findFaction } from "@/game/pirates";
import { formatClock, formatCompact, formatDateTime } from "@/lib/utils";
import { GameActionError, jumpFleet, recallFleet, launchFleet } from "@/services/playerService";
import { gateCooldownMs, gateReadyAtMs, gateUnlocked, jumpMissions } from "@/game/jumpGate";
import { moonLevel, playerMoon } from "@/game/moon";
import { formatWait } from "@/game/phalanx";
import { ScanButton } from "@/components/game/PhalanxPanel";
import { refreshPhalanx, usePiercedFleet } from "@/store/phalanxStore";
import { resolveRelaunch, useLastMission } from "@/store/lastMissionStore";
import { fireRecallBeacon } from "@/services/bountyService";
import { bountyState } from "@/game/bounties";
import { usePlayerStore } from "@/store/playerStore";
import { EmojiText, GameIcon } from "@/components/ui/game-icon";
import { HudChip } from "@/components/ui/hud";
import { isHostile } from "@/components/game/hostileFleets";

/** 6.14.82 (UX-9, AD-16) : icône lucide par mission (plus d'emoji, qui changeaient de rendu selon le système). */
const FLEET_LABEL_ICON: Partial<Record<NonNullable<Fleet["mission"]>, LucideIcon>> = {
  patrol: Wind,
  spy: Satellite,
  lair: Skull,
  garrison: Shield,
  bounty: Crosshair,
  elite: Crosshair,
  delivery: Package,
  recycle: Recycle,
};

function fleetLabelText(f: Fleet, outbound: boolean): string {
  switch (f.mission) {
    case "patrol":
      return outbound ? "Patrouille (aller)" : "Patrouille (retour)";
    case "spy":
      return outbound ? `Sondes → ${f.targetPseudo}` : `← sondes de ${f.targetPseudo}`;
    case "lair":
      return outbound ? `Assaut : ${findFaction(f.factionId ?? factionOfLair(f.targetUid))?.lair.name ?? "repaire"}` : "← retour du repaire";
    case "garrison":
      return f.status === "stationed" ? `Garnison chez ${f.targetPseudo}` : outbound ? `Garnison → ${f.targetPseudo}` : `← retour de chez ${f.targetPseudo}`;
    case "bounty":
      return outbound ? `Prime : ${f.targetPseudo}` : `← retour de la traque de ${f.targetPseudo}`;
    case "elite":
      return outbound ? `Proie d'élite : ${f.targetPseudo}` : "← retour de la proie d'élite";
    case "delivery":
      return outbound ? `Livraison → ${f.targetPseudo}` : `← retour de livraison (${f.targetPseudo})`;
    case "recycle":
      return outbound ? `Débris de ${f.targetPseudo}` : `← retour des débris de ${f.targetPseudo}`;
    default:
      return outbound ? `→ ${f.targetPseudo}` : `← retour de ${f.targetPseudo}`;
  }
}

function FleetLabel({ f, outbound }: { f: Fleet; outbound: boolean }) {
  const Icon = f.mission ? FLEET_LABEL_ICON[f.mission] : undefined;
  return (
    <span className="inline-flex items-center gap-1">
      {Icon && <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />}
      <EmojiText text={fleetLabelText(f, outbound)} />
    </span>
  );
}

function fleetSummary(fleet: Fleet): string {
  return Object.entries(fleet.units ?? {})
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${formatCompact(n)} ${findUnit(id)?.name ?? id}`)
    .join(", ") + (fleet.decoyed ? " · leurre actif" : "");
}

/** 6.14.70 (É30-1e) : composition d'une attaque entrante ; percée par la phalange, la vraie (comme le panneau Lune). */
function IncomingSummary({ fleet }: { fleet: Fleet }) {
  const pierced = usePiercedFleet(fleet.id);
  return <>{fleetSummary(pierced?.pierced?.decoy ? { ...fleet, units: pierced.units } : fleet)}</>;
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
  const bounties = usePlayerStore((s) => s.player?.bounties);
  const stored = useLastMission((s) => s.last);
  const last = useMemo(() => resolveRelaunch(stored, bountyState({ bounties }).board), [stored, bounties]);
  const now = Date.now();
  // 6.14.49 (É30-1c) : porte de saut (lune de niveau 3+) : patrouille, garnison ou base avancée rapatriée tout de suite.
  const player = usePlayerStore((s) => s.player);
  const gateOpen = gateUnlocked(player);
  const gateWaitMs = Math.max(0, gateReadyAtMs(player) - now);
  const gateFleet = (f: Fleet) =>
    gateOpen && jumpMissions().includes(f.mission) && (f.status === "outbound" || f.status === "stationed" || f.status === "returning") && !Object.values(f.loot ?? {}).some((n) => (n ?? 0) > 0);

  const incoming = fleets.filter((f) => isHostile(f, uid));
  const mine = fleets.filter((f) => f.ownerUid === uid && f.status !== "done");
  // 5.33 : emplacements de flotte (sondes et expéditions exclues, comme au serveur).
  const slots = fleetSlots(usePlayerStore.getState().player);
  const used = mine.filter((f) => !SLOT_FREE_MISSIONS.includes(f.mission)).length;
  const full = used >= slots;
  const relaunchBlocked = !!last && full && !SLOT_FREE_MISSIONS.includes(last.mission);
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

  const relaunch = async () => {
    if (!last) return;
    setPending("relaunch");
    try {
      await launchFleet(last.body, last.targetLabel, last.meta);
      toast.success("Mission relancée.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Relance impossible.");
    } finally {
      setPending(null);
    }
  };

  const jump = async (fleet: Fleet) => {
    const moon = playerMoon(player);
    const cd = moon ? gateCooldownMs(moonLevel(moon), player) : null;
    const what = fleet.mission === "patrol" ? "Ta patrouille" : fleet.mission === "garrison" ? "Ta garnison" : "Ta base avancée";
    const ok = await askConfirm({
      title: "Sauter par la porte ?",
      message: `${what} rentre à quai tout de suite.${fleet.mission === "garrison" && fleet.status === "stationed" ? ` ${fleet.targetPseudo} est prévenu.` : ""}${fleet.mission === "patrol" ? " L'énergie de la patrouille n'est pas rendue." : ""}${cd !== null ? ` Prochain saut dans ${formatWait(cd)}.` : ""}`,
      confirmLabel: "Sauter",
      tone: "accent",
    });
    if (!ok) return;
    setPending(fleet.id);
    try {
      // Succès : le serveur notifie « Saut réussi » (toast et Journal), comme pour un retour de flotte.
      await jumpFleet(fleet.id);
      void refreshPhalanx(undefined, true);
    } catch (err) {
      // Refus du serveur (recharge, mission, flotte chargée…), en tutoiement.
      toast.error(err instanceof GameActionError ? err.message : "Saut impossible.");
    } finally {
      setPending(null);
    }
  };

  const recall = async (fleet: Fleet) => {
    // 6.9.4 (AU7, GAL-1) : rappel confirmé, la mission est abandonnée.
    const mission = FLEET_MISSION_LABELS[fleet.mission] ?? fleet.mission;
    if (!(await askConfirm({ title: "Rappeler la flotte ?", message: `La mission « ${mission} » est abandonnée : la flotte fait demi-tour et rentre avec sa cargaison.`, confirmLabel: "Rappeler", tone: "danger" }))) return;
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
      <div className="flex flex-wrap items-center gap-2">
        <Rocket className="h-4 w-4 text-cyan-glow" />
        <h3 className="hud-title text-sm text-slate-100">Flottes</h3>
        <HudChip size="sm" tone={full ? "ember" : "neutral"} title="Flottes en vol en même temps. Les sondes et les expéditions ne comptent pas.">
          <span className="font-mono tabular-nums">
            {used} / {slots}
          </span>
        </HudChip>
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
          className="whitespace-nowrap text-xs text-cyan-glow hover:underline"
        >
          Voir sur la carte →
        </Link>
      </div>

      {last && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="min-w-0 flex-1 truncate">
            Dernière mission : {FLEET_MISSION_LABELS[last.mission] ?? last.mission}
            {last.targetLabel ? ` · ${last.targetLabel}` : ""}
          </span>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={pending === "relaunch" || relaunchBlocked} title={relaunchBlocked ? "Tous tes emplacements de flotte sont pris." : "Mêmes vaisseaux, même cible, mêmes options (attaque, prime, boss, transport…)."} onClick={() => void relaunch()}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Relancer
          </Button>
        </div>
      )}

      {incoming.map((f) => {
        const left = Math.max(0, Math.floor((f.arriveAtMs - now) / 1000));
        return (
          <div
            key={f.id}
            className="hud-callout hud-tone-danger hud-callout-alert p-2.5"
          >
            {/* 6.14.70 : texte dans un seul bloc (en flex, chaque morceau devenait une colonne à 375 px). */}
            <p className="flex items-start gap-1.5 text-xs font-semibold text-danger-glow">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0">
                {f.mission === "pirate" ? "Raid du" : "Attaque de"} <PlayerName uid={f.ownerUid} pseudo={f.ownerPseudo} /> — impact dans{" "}
                <span className="font-mono tabular-nums">{formatClock(left)}</span>
              </span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {f.mission === "pirate"
                ? `${findFaction(f.factionId ?? "varan")?.name ?? "Faction hostile"}${findFaction(f.factionId ?? "varan")?.raid.target === "fleet" ? " · vise ta flotte à quai" : ""} · puissance ${formatCompact(f.power ?? 0)}`
                : <IncomingSummary fleet={f} />}
            </p>
            <ThreatGauge fleet={f} className="mt-1.5" />
            {f.mission === "attack" && <ScanButton targetUid={f.ownerUid} pseudo={f.ownerPseudo} compact className="mt-1.5" />}
            {f.anomaly && (
              <p className="mt-1 text-[11px] font-semibold text-violet-glow">
                <FlaskConical aria-hidden className="mr-1 inline h-3.5 w-3.5" />
                Anomalie chimique : capsules à bord (stimulant ou leurre), la composition affichée peut être fausse.
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
                <FleetLabel f={f} outbound={outbound} />
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
            {/* 6.14.70 : les boutons passent à la ligne dans une colonne étroite (« Saut » et son décompte étaient coupés). */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
                className="min-w-16 flex-1"
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
              {gateFleet(f) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-violet-glow"
                  disabled={pending === f.id || gateWaitMs > 0}
                  title={gateWaitMs > 0 ? `Ta porte de saut se recharge : encore ${formatWait(gateWaitMs)}.` : "Porte de saut : retour à quai immédiat"}
                  onClick={() => void jump(f)}
                >
                  <DoorOpen className="mr-1 h-3.5 w-3.5" /> Saut
                  {gateWaitMs > 0 && <span className="ml-1 font-mono tabular-nums text-slate-400">{formatClock(Math.ceil(gateWaitMs / 1000))}</span>}
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
                  ? `jusqu'à ${formatDateTime(f.stationedUntilMs ?? 0, "time")}`
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
