import { assetUrl } from "@/lib/assets";
import { TiltPortrait } from "@/components/fx/TiltPortrait";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { describeGain } from "@/game/format";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Crosshair, Handshake, Skull, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { FleetsPanel } from "@/components/game/FleetsPanel";
import { FormationPicker } from "@/components/game/FormationPicker";
import type { FormationId } from "@/game/formations";
import { accent, openUltimatum } from "@/components/game/PirateUltimatum";
import { activeTreaty, activeUltimatum, FACTIONS, lairPower, lairUid, pirateState, productionHours, raidPower, targetPower, TREATY_LABELS, TREATY_RULES, type FactionDef, type TreatyKind } from "@/game/pirates";
import { fleetSpeed, LAIR_DISTANCE, travelSeconds } from "@/game/fleets";
import { allianceFlightFactor } from "@/game/alliances";
import { computeFleetPower } from "@/game/combat";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { GameActionError, sendFleet, signFactionTreaty } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatClock, formatCompact, formatDuration } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

function LairDialog({ faction, onClose }: { faction: FactionDef | null; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [formation, setFormation] = useState<FormationId>("balanced");
  if (!player || !faction) return null;
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const power = computeFleetPower(player.units, player.techLevels, selected, ["attack"]);
  const lair = lairPower(faction, player);
  const flight = Object.keys(selected).length > 0 ? travelSeconds(LAIR_DISTANCE, fleetSpeed(player.units, selected), allianceFlightFactor(player.allianceResearch, player.techLevels, player)) : null;

  const send = async () => {
    setBusy(true);
    try {
      await sendFleet(lairUid(faction.id), selected, "lair", { formation });
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
              <div key={id} className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-sm">
                <span className="flex-1 text-slate-200">{findUnit(id)?.name ?? id}</span>
                <span className="text-xs text-slate-500">À quai : {owned}</span>
                <NumberInput
                  size="sm"
                  max={owned}
                  value={fleet[id] ?? 0}
                  onChange={(v) => setFleet({ ...fleet, [id]: v })}
                  aria-label={`Quantité ${findUnit(id)?.name ?? id}`}
                  className="w-40"
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
        <FormationPicker value={formation} onChange={setFormation} className="mt-3" />
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
    case "singularity":
      return `Vise les empires les plus avancés : ${t.threshold ?? 0} niveaux cumulés ou plus dans les technologies de fin de partie (Métallurgie quantique, Cortex neuronal…).`;
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
      {faction.banner && (
        <div className="relative h-36 overflow-hidden border-b border-white/5 sm:h-44">
          <img src={assetUrl(faction.banner)} alt={faction.lair.name} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent" />
          <p className={cn("absolute bottom-2 left-4 font-mono text-[11px] uppercase tracking-[0.18em]", a.text)}>{faction.lair.name}</p>
        </div>
      )}
      <div className="grid md:grid-cols-[minmax(0,18rem)_1fr]">
        <TiltPortrait glow={`var(--color-${faction.color === "cyan" ? "cyan" : faction.color}-glow)`} className="h-64 w-full md:h-full">
          <img src={assetUrl(faction.art)} alt={`${faction.leader} et ${faction.enforcer}`} className="h-full w-full object-cover object-top" />
        </TiltPortrait>
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-3">
            {faction.emblem && <img src={assetUrl(faction.emblem)} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10" />}
            <div>
              <p className={cn("hud-eyebrow", a.text)}>{faction.name}</p>
              <p className="text-xs text-slate-500">
                {faction.leader} · {faction.enforcer}
              </p>
            </div>
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
                Force du prochain raid : {formatCompact(raidPower(faction, player, st.notoriety, st.adapt))} ({fleetOnly ? "ta flotte" : "tes défenses"} :{" "}
                {formatCompact(targetPower(faction, player))}){st.adapt !== 1 && <> · adaptation ×{st.adapt.toFixed(2).replace(".", ",")} ({st.adapt > 1 ? "tu repousses ses raids, elle se renforce" : "elle a gagné, elle relâche la pression"})</>}.
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
          <TreatyRow faction={faction} player={player} busyThreat={!!mine || !!raid} />
        </div>
      </div>
    </Card>
  );
}

/** 5.16 : traités avec la faction (pacte de péage, escorte, embargo). */
function TreatyRow({ faction, player, busyThreat }: { faction: FactionDef; player: PlayerState; busyThreat: boolean }) {
  const [busy, setBusy] = useState<TreatyKind | null>(null);
  const now = Date.now();
  const st = pirateState(player, faction.id);
  const current = activeTreaty(st, now);
  const sign = async (kind: TreatyKind) => {
    const label = TREATY_LABELS[kind];
    const cost = TREATY_RULES.cost[kind] > 0 ? describeGain(productionHours(player, TREATY_RULES.cost[kind])) : "gratuit";
    if (!(await askConfirm({ title: `${label.name} avec ${faction.name} ?`, message: `${label.effect} Durée : ${TREATY_RULES.durationDays} jours. Coût : ${cost}.`, confirmLabel: "Signer", tone: kind === "embargo" ? "danger" : "accent" }))) return;
    setBusy(kind);
    try {
      await signFactionTreaty(faction.id, kind);
      toast.success(`${label.name} signé avec ${faction.name}.`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Signature impossible.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
        <Handshake className="h-3.5 w-3.5 text-cyan-glow" /> Traités
        {current && (
          <HudChip size="sm" tone={current.kind === "embargo" ? "danger" : "mint"} className="ml-auto">
            {TREATY_LABELS[current.kind].name} · {formatDuration(Math.floor((current.untilMs - now) / 1000))}
          </HudChip>
        )}
      </p>
      {current ? (
        <p className="text-[11px] text-slate-400">{TREATY_LABELS[current.kind].effect}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {(["pact", "escort", "embargo"] as TreatyKind[]).map((kind) => {
            const blocked = st.notoriety > TREATY_RULES.maxNotoriety[kind];
            const cost = TREATY_RULES.cost[kind] > 0 ? `${TREATY_RULES.cost[kind]} h de production` : "gratuit";
            return (
              <div key={kind} className="hud-cut-sm flex flex-col gap-1.5 border border-white/10 bg-white/[0.02] p-2.5">
                <p className="text-xs font-semibold text-slate-100">{TREATY_LABELS[kind].name}</p>
                <p className="flex-1 text-[11px] leading-snug text-slate-400">{TREATY_LABELS[kind].effect}</p>
                <p className="font-mono text-[10px] text-slate-500">
                  {cost} · {TREATY_RULES.durationDays} j{kind !== "embargo" ? ` · notoriété ≤ ${TREATY_RULES.maxNotoriety[kind]}` : ""}
                </p>
                <Button size="sm" variant={kind === "embargo" ? "danger" : "secondary"} disabled={busy !== null || busyThreat || blocked} onClick={() => void sign(kind)} title={blocked ? `Notoriété trop haute (${st.notoriety})` : busyThreat ? "Règle d'abord la menace en cours" : undefined}>
                  {kind === "embargo" ? "Décréter" : "Signer"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
