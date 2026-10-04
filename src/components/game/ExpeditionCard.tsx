import { useState } from "react";
import { assetUrl } from "@/lib/assets";
import { toast } from "sonner";
import { Compass, Swords, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HudTag } from "@/components/ui/hud";
import { FormationPicker } from "@/components/game/FormationPicker";
import { EXPEDITION_RULES, describeGain, fleetShips } from "@/game/expeditions";
import { FACTIONS } from "@/game/pirates";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import type { FormationId } from "@/game/formations";
import type { Fleet } from "@/game/fleets";
import { pb } from "@/lib/pocketbase";
import { GameActionError, sendFleet } from "@/services/playerService";
import { useFleetStore } from "@/store/fleetStore";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatCompact, formatDuration } from "@/lib/utils";

const OUTCOMES: { label: string; weight: number }[] = [
  { label: "Gisement (1 à 3 h de production)", weight: EXPEDITION_RULES.weights.deposit },
  { label: "Trésor rare", weight: EXPEDITION_RULES.weights.rare },
  { label: "Embuscade", weight: EXPEDITION_RULES.weights.ambush },
  { label: "Rien", weight: EXPEDITION_RULES.weights.nothing },
  { label: "Épave récupérée", weight: EXPEDITION_RULES.weights.wreck },
  { label: "Rencontre de faction (choix)", weight: EXPEDITION_RULES.weights.faction },
];

function LaunchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [hours, setHours] = useState(EXPEDITION_RULES.durations[0]);
  const [formation, setFormation] = useState<FormationId>("balanced");
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const ids = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (player.units[id]?.count ?? 0) > 0);
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const ships = fleetShips(selected);

  const send = async () => {
    setBusy(true);
    try {
      await sendFleet("", selected, "expedition", { hours, formation });
      triggerWarpEffect();
      toast.success(`Expédition lancée pour ${hours} h.`);
      setFleet({});
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Lancement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Lancer une expédition</DialogTitle>
        <p className="text-sm text-slate-400">
          Au moins {EXPEDITION_RULES.minShips} vaisseaux (hors sondes). Deux événements t'attendent : à mi-parcours puis au retour.
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {ids.length === 0 && <p className="text-xs text-slate-500">Aucun vaisseau disponible à la base.</p>}
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <img src={assetUrl(findUnit(id)?.image ?? "")} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">{findUnit(id)?.name}</span>
                <NumberInput size="sm" value={fleet[id] ?? 0} max={owned} aria-label={`Quantité ${findUnit(id)?.name}`} onChange={(v) => setFleet((f) => ({ ...f, [id]: v }))} className="w-40 shrink-0" />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] text-slate-500" title="À quai">/{formatCompact(owned)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <p className="hud-eyebrow mb-1.5 text-[10px] text-slate-500">Durée</p>
          <div className="flex gap-1.5">
            {EXPEDITION_RULES.durations.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={cn("flex-1 border px-2 py-1.5 font-mono text-xs", hours === h ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400")}
              >
                {h} h · +{h * EXPEDITION_RULES.xpPerHour} XP
              </button>
            ))}
          </div>
        </div>
        <FormationPicker value={formation} onChange={setFormation} className="mt-3" />
        <Button className="mt-4 w-full" disabled={busy || ships < EXPEDITION_RULES.minShips} onClick={() => void send()}>
          <Compass className="mr-1.5 h-4 w-4" /> Partir ({ships} vaisseaux)
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ActiveExpedition({ fleet }: { fleet: Fleet }) {
  useNowTicker();
  const now = Date.now();
  const [busy, setBusy] = useState(false);
  const exp = fleet.expedition;
  const total = fleet.durationMs ?? 1;
  const end = fleet.departAtMs + total;
  const progress = Math.min(1, Math.max(0, (now - fleet.departAtMs) / total));
  const pending = fleet.status === "decision" ? exp?.pending : null;
  const faction = pending ? FACTIONS.find((f) => f.id === pending.factionId) : null;

  const choose = async (choice: "toll" | "force") => {
    setBusy(true);
    try {
      await pb.send("/api/cosmic/expedition/choose", { method: "POST", body: { fleetId: fleet.id, choice } });
      toast.success(choice === "toll" ? "Péage payé, la flotte passe." : "Passage forcé engagé !");
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Décision impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <HudTag tone={pending ? "gold" : "accent"}>{pending ? "Décision requise" : fleet.status === "outbound" ? "Vers l'inconnu" : "Sur le retour"}</HudTag>
        <span className="text-slate-400">{exp?.hours ?? Math.round(total / 3600_000)} h</span>
        <span className="ml-auto font-mono text-xs text-slate-400">{pending ? `réponse avant ${formatDuration(Math.max(0, Math.floor((pending.deadlineMs - now) / 1000)))}` : `retour dans ${formatDuration(Math.max(0, Math.floor((end - now) / 1000)))}`}</span>
      </div>
      <Progress value={progress * 100} />
      {pending && (
        <div className="hud-cut-sm border border-gold-glow/40 bg-gold-glow/[0.06] p-3">
          <p className="text-sm text-slate-200">
            <strong>{faction?.name ?? "Une faction"}</strong> barre la route et exige {describeGain(pending.toll)}.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void choose("toll")}>
              <Coins className="mr-1 h-3.5 w-3.5" /> Payer le péage
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => void choose("force")}>
              <Swords className="mr-1 h-3.5 w-3.5" /> Forcer le passage
            </Button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Payer améliore ta réputation auprès d'eux ; forcer déclenche un combat et augmente ta notoriété. Sans réponse, le péage est payé.</p>
        </div>
      )}
      {(exp?.log ?? []).length > 0 && (
        <ul className="space-y-1 text-xs text-slate-300">
          {exp!.log.map((l, i) => (
            <li key={i} className="border-l-2 border-cyan-glow/30 pl-2">
              <span className="text-slate-500">{l.stage === 1 ? "Mi-parcours" : "Dernier secteur"} · </span>
              {l.text}
            </li>
          ))}
        </ul>
      )}
      {fleet.loot && Object.keys(fleet.loot).length > 0 && <p className="text-xs text-mint-glow">Cale : {describeGain(fleet.loot)}</p>}
    </div>
  );
}

/** Expéditions narratives (v3.1), sur la page Missions. */
export function ExpeditionCard() {
  const [open, setOpen] = useState(false);
  const fleets = useFleetStore((s) => s.fleets);
  const player = usePlayerStore((s) => s.player);
  const active = fleets.find((f) => f.mission === "expedition" && f.ownerUid === player?.uid && f.status !== "done");
  const total = Object.values(EXPEDITION_RULES.weights).reduce((a, b) => a + b, 0);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Compass className="h-4 w-4 text-cyan-glow" />
        <h2 className="hud-title text-sm">Expéditions</h2>
        <span className="text-[11px] text-slate-500">
          {EXPEDITION_RULES.maxPerDay} par jour · {EXPEDITION_RULES.xpPerHour} XP par heure
        </span>
        {!active && (
          <Button size="sm" className="ml-auto" onClick={() => setOpen(true)}>
            Lancer une expédition
          </Button>
        )}
      </div>
      {active ? (
        <ActiveExpedition fleet={active} />
      ) : (
        <div className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o) => (
            <span key={o.label}>
              {o.label} <span className="text-slate-500">· {Math.round((o.weight / total) * 100)} %</span>
            </span>
          ))}
        </div>
      )}
      <LaunchDialog open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}
