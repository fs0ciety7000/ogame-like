import { allianceFlightFactor } from "@/game/alliances";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Radar, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadarScan } from "@/components/game/RadarScan";
import { espionageLevel, SPY_RULES, SPY_TIER_LABELS, spyTravelSeconds } from "@/game/espionage";
import { distanceBetween, FLEET_MISSION_LABELS, fleetSpeed, type FleetMission } from "@/game/fleets";
import { findUnit } from "@/game/units";
import { findBuilding } from "@/game/buildings";
import { findTech } from "@/game/technologies";
import { RESOURCE_LIST } from "@/game/resources";
import { formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { useFleetStore } from "@/store/fleetStore";
import { fetchLatestSpyReport, GameActionError, sendFleet } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import type { SpyReport } from "@/types/game";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <ul className="space-y-0.5 text-xs text-slate-300">{children}</ul>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <li className="flex justify-between gap-2">
      <span className="truncate">{label}</span>
      <span className="tabular-mono text-slate-200">{value}</span>
    </li>
  );
}

const Empty = () => <li className="text-slate-500">Rien</li>;

/** Contenu d'un rapport d'espionnage, limité au palier atteint. */
export function SpyReportView({ report }: { report: SpyReport }) {
  const data = report.data ?? {};
  const tier = report.tier ?? 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("rounded px-1.5 py-0.5 font-semibold", tier >= 3 ? "bg-mint-glow/15 text-mint-glow" : tier >= 1 ? "bg-cyan-glow/15 text-cyan-glow" : "bg-danger-glow/15 text-danger-glow")}>
          {SPY_TIER_LABELS[tier]}
        </span>
        <span className="text-slate-500">
          {timeAgo(report.timestamp)} · {report.probes ?? 0} sonde{(report.probes ?? 0) > 1 ? "s" : ""} · score {formatNumber(report.score ?? 0)}
        </span>
        {report.detected && (
          <span className="flex items-center gap-1 text-danger-glow">
            <ShieldAlert className="h-3.5 w-3.5" /> sondes abattues
          </span>
        )}
        {report.anomaly && <span className="font-semibold text-violet-300">⚗ anomalie chimique : flotte et défenses peut-être faussées</span>}
      </div>
      {tier === 0 && <p className="text-xs text-slate-500">Brouillage trop fort : envoie plus de sondes ou monte ta techno Espionnage.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.resources && (
          <Block title="Ressources">
            {RESOURCE_LIST.filter((r) => (data.resources?.[r.id] ?? 0) > 0).map((r) => (
              <Row key={r.id} label={<><ResourceIcon id={r.id} /> {r.name}</>} value={formatNumber(data.resources?.[r.id] ?? 0)} />
            ))}
          </Block>
        )}
        {data.units && (
          <Block title="Vaisseaux à quai">
            {Object.entries(data.units).filter(([, u]) => u.count > 0).length === 0 && <Empty />}
            {Object.entries(data.units)
              .filter(([, u]) => u.count > 0)
              .map(([id, u]) => (
                <Row key={id} label={`${findUnit(id)?.name ?? id} (niv. ${u.level})`} value={`×${formatNumber(u.count)}`} />
              ))}
          </Block>
        )}
        {data.defenses && (
          <Block title="Défenses">
            {Object.entries(data.defenses).filter(([, u]) => u.count > 0).length === 0 && <Empty />}
            {Object.entries(data.defenses)
              .filter(([, u]) => u.count > 0)
              .map(([id, u]) => (
                <Row key={id} label={`${findUnit(id)?.name ?? id} (niv. ${u.level})`} value={`×${formatNumber(u.count)}`} />
              ))}
          </Block>
        )}
        {data.garrisons && data.garrisons.length > 0 && (
          <Block title="Garnisons alliées">
            {data.garrisons.map((g, i) => (
              <Row key={i} label={g.ownerPseudo} value={`${Object.values(g.units).reduce((a, b) => a + b, 0)} vx`} />
            ))}
          </Block>
        )}
        {data.buildings && (
          <Block title="Bâtiments">
            {Object.entries(data.buildings)
              .filter(([, level]) => level > 0)
              .map(([id, level]) => (
                <Row key={id} label={findBuilding(id)?.name ?? id} value={`niv. ${level}`} />
              ))}
          </Block>
        )}
        {data.techLevels && (
          <Block title="Technologies">
            {Object.entries(data.techLevels).filter(([, l]) => l > 0).length === 0 && <Empty />}
            {Object.entries(data.techLevels)
              .filter(([, level]) => level > 0)
              .map(([id, level]) => (
                <Row key={id} label={findTech(id)?.nom ?? id} value={`niv. ${level}`} />
              ))}
          </Block>
        )}
        {data.queues && (
          <Block title="Chantiers en cours">
            {data.queues.buildings.length + data.queues.researches.length + data.queues.units.length === 0 && <Empty />}
            {data.queues.buildings.map((q) => (
              <Row key={`b${q.id}`} label={<><GameIcon name="build" /> {findBuilding(q.id)?.name ?? q.id}</>} value={formatDuration(Math.max(0, (q.endTime - report.timestamp) / 1000))} />
            ))}
            {data.queues.researches.map((q) => (
              <Row key={`r${q.id}`} label={<><GameIcon name="research" /> {findTech(q.id)?.nom ?? q.id}</>} value={formatDuration(Math.max(0, (q.endTime - report.timestamp) / 1000))} />
            ))}
            {data.queues.units.length > 0 && <Row label={<><GameIcon name="fleet" /> Unités en production</>} value={data.queues.units.length} />}
          </Block>
        )}
        {data.fleets && (
          <Block title="Flottes en vol">
            {data.fleets.length === 0 && <Empty />}
            {data.fleets.map((f, i) => (
              <Row
                key={i}
                label={`${FLEET_MISSION_LABELS[f.mission as FleetMission] ?? f.mission}${f.mission === "patrol" ? "" : ` → ${f.targetPseudo}`}`}
                value={`${Object.values(f.units).reduce((a, b) => a + b, 0)} vx`}
              />
            ))}
          </Block>
        )}
      </div>
    </div>
  );
}

/** Espionnage (v1.7) : envoi de sondes et dernier rapport obtenu. */
export function SpyModal({ target, onClose }: { target: { uid: string; pseudo: string } | null; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);
  const fleets = useFleetStore((s) => s.fleets);
  const [probes, setProbes] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<SpyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const probeId = SPY_RULES.probeUnitId;
  const probe = findUnit(probeId);
  const owned = player?.units[probeId]?.count ?? 0;
  const inFlight = fleets.filter((f) => f.mission === "spy" && f.ownerUid === uid && f.targetUid === target?.uid && f.status === "outbound");
  // Rechargé quand une de mes missions d'espionnage change d'état.
  const spyFleetsKey = fleets
    .filter((f) => f.mission === "spy" && f.ownerUid === uid)
    .map((f) => `${f.id}:${f.status}`)
    .join(",");

  useEffect(() => {
    if (!target || !uid) {
      setReport(null);
      return;
    }
    let active = true;
    setLoadingReport(true);
    fetchLatestSpyReport(uid, target.uid)
      .then((r) => active && setReport(r))
      .catch(() => active && setReport(null))
      .finally(() => active && setLoadingReport(false));
    return () => {
      active = false;
    };
  }, [target, uid, spyFleetsKey]);

  const count = Math.max(0, Math.min(owned, probes));
  const distance = uid && target ? distanceBetween(uid, target.uid) : 0;
  const flight = player && count > 0 ? spyTravelSeconds(distance, fleetSpeed(player.units, { [probeId]: count }), allianceFlightFactor(player.allianceResearch, player.techLevels)) : null;
  const level = player ? espionageLevel(player) : 0;

  const send = async () => {
    if (!target || count <= 0) return;
    setSubmitting(true);
    try {
      const sent = await sendFleet(target.uid, { [probeId]: count }, "spy");
      triggerWarpEffect();
      toast.success(`Sondes en route vers ${target.pseudo}`, {
        description: `Rapport dans ${formatDuration((sent.arriveAtMs - Date.now()) / 1000)}.`,
      });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Envoi impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Espionner {target.pseudo}</DialogTitle>
          <p className="text-sm text-slate-400">
            Distance {Math.round(distance)} · ta techno Espionnage : <strong className="text-slate-200">niv. {level}</strong>
          </p>

          {!player || submitting ? (
            <RadarScan label={submitting ? "Lancement des sondes…" : "Chargement…"} />
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-slate-200">{probe?.name ?? "Sonde d'espionnage"}</span>
                <span className="text-xs text-slate-500">Possédées : {owned}</span>
                <Input
                  type="number"
                  min={1}
                  max={owned}
                  disabled={owned === 0}
                  value={count}
                  onChange={(e) => setProbes(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              <div className="space-y-1.5 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-cyan-glow" />
                  {flight !== null ? (
                    <span>
                      Trajet : <strong className="tabular-mono text-slate-200">{formatDuration(flight)}</strong>. La cible ne voit pas tes sondes arriver.
                    </span>
                  ) : owned === 0 ? (
                    <span>Construis des Sondes d'espionnage (Unités, débloquées par la techno Espionnage).</span>
                  ) : (
                    <span>Choisis le nombre de sondes.</span>
                  )}
                </p>
                <p>
                  Score = ton Espionnage − son contre-espionnage + log₂(sondes). Chaque doublement du nombre de sondes vaut +1. Paliers :
                  ressources (≥ {SPY_RULES.tierResources}), flotte et défenses (≥ {SPY_RULES.tierForces}), bâtiments et technos (≥{" "}
                  {SPY_RULES.tierInfrastructure}), files et flottes en vol (≥ {SPY_RULES.tierActivity}).
                </p>
                <p className="text-slate-500">Si elles sont repérées, les sondes sont abattues et la cible sait qui l'espionne. Le rapport te parvient quand même.</p>
              </div>
              <Button className="w-full" disabled={count <= 0} onClick={() => void send()}>
                <Radar className="mr-1.5 h-4 w-4" /> Envoyer {count > 0 ? count : ""} sonde{count > 1 ? "s" : ""}
              </Button>
              {inFlight.length > 0 && (
                <p className="text-center text-xs text-cyan-glow">
                  {inFlight.length} mission{inFlight.length > 1 ? "s" : ""} en cours : rapport dans{" "}
                  {formatDuration(Math.max(0, (Math.min(...inFlight.map((f) => f.arriveAtMs)) - Date.now()) / 1000))}.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 border-t border-white/5 pt-3">
            <h3 className="mb-2 font-display text-sm text-white">Dernier rapport</h3>
            {loadingReport && !report ? (
              <p className="text-xs text-slate-500">Chargement…</p>
            ) : report ? (
              <SpyReportView report={report} />
            ) : (
              <p className="text-xs text-slate-500">Aucun rapport sur ce joueur pour l'instant.</p>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
