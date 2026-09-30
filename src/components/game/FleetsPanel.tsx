import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CornerUpLeft, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { fleetProgress, type Fleet } from "@/game/fleets";
import { findUnit } from "@/game/units";
import { formatClock, formatCompact } from "@/lib/utils";
import { GameActionError, recallFleet } from "@/services/playerService";

function fleetSummary(fleet: Fleet): string {
  return Object.entries(fleet.units ?? {})
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${formatCompact(n)} ${findUnit(id)?.name ?? id}`)
    .join(", ");
}

/** Flottes du joueur (aller, retour) et flottes hostiles en approche. */
export function FleetsPanel({ hideWhenEmpty = false }: { hideWhenEmpty?: boolean }) {
  useNowTicker();
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const [pending, setPending] = useState<string | null>(null);
  const now = Date.now();

  const incoming = fleets.filter((f) => f.targetUid === uid && f.status === "outbound");
  const mine = fleets.filter((f) => f.ownerUid === uid && f.status !== "done");
  if (hideWhenEmpty && incoming.length === 0 && mine.length === 0) return null;

  const recall = async (fleet: Fleet) => {
    setPending(fleet.id);
    try {
      await recallFleet(fleet.id);
      toast.success("Flotte rappelée : demi-tour !");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Rappel impossible.");
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-cyan-glow" />
        <h3 className="font-display text-sm text-white">Flottes</h3>
        <Link to="/game/galaxie" className="ml-auto text-xs text-cyan-glow hover:underline">
          Voir sur la carte →
        </Link>
      </div>

      {incoming.map((f) => {
        const left = Math.max(0, Math.floor((f.arriveAtMs - now) / 1000));
        return (
          <div key={f.id} className="animate-pulse-alert rounded-lg border border-danger-glow/50 bg-danger-glow/10 p-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-danger-glow">
              <AlertTriangle className="h-3.5 w-3.5" /> Attaque de {f.ownerPseudo} — impact dans {formatClock(left)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{fleetSummary(f)}</p>
            <Progress value={fleetProgress(f, now) * 100} className="mt-1.5" />
          </div>
        );
      })}

      {mine.map((f) => {
        const outbound = f.status === "outbound";
        const at = outbound ? f.arriveAtMs : f.returnAtMs ?? now;
        const left = Math.max(0, Math.floor((at - now) / 1000));
        const loot = Object.values(f.loot ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);
        return (
          <div key={f.id} className="rounded-lg border border-white/5 bg-black/20 p-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className={outbound ? "font-semibold text-gold-glow" : "font-semibold text-mint-glow"}>
                {outbound ? `→ ${f.targetPseudo}` : `← retour de ${f.targetPseudo}`}
              </span>
              <span className="tabular-mono ml-auto text-slate-400">{outbound ? "impact" : "arrivée"} dans {formatClock(left)}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {fleetSummary(f) || "Aucun survivant"}
              {!outbound && loot > 0 && ` · butin ${formatCompact(loot)}`}
              {f.recalled && " · rappelée"}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={(outbound ? fleetProgress(f, now) : 1 - fleetProgress(f, now)) * 100} className="flex-1" />
              {outbound && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={pending === f.id} onClick={() => void recall(f)}>
                  <CornerUpLeft className="mr-1 h-3.5 w-3.5" /> Rappeler
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {incoming.length === 0 && mine.length === 0 && (
        <p className="text-xs text-slate-500">Aucune flotte en vol. Lance une attaque depuis la carte ou la liste des joueurs.</p>
      )}
    </Card>
  );
}

/** Pastille de l'en-tête : flottes hostiles en approche. */
export function HostileFleetAlert() {
  useNowTicker();
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const incoming = fleets.filter((f) => f.targetUid === uid && f.status === "outbound");
  if (incoming.length === 0) return null;
  const next = Math.min(...incoming.map((f) => f.arriveAtMs));
  return (
    <Link
      to="/game/galaxie"
      className="animate-pulse-alert flex items-center gap-1.5 rounded-lg border border-danger-glow/60 bg-danger-glow/15 px-2 py-1 text-[11px] font-semibold text-danger-glow"
      title="Flottes hostiles en approche"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      {incoming.length > 1 ? `${incoming.length} flottes hostiles` : "Flotte hostile"} · {formatClock(Math.max(0, Math.floor((next - Date.now()) / 1000)))}
    </Link>
  );
}
