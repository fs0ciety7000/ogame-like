import { useState } from "react";
import { toast } from "sonner";
import { FastForward, FlaskConical, Gift, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceIcon } from "@/components/ui/game-icon";
import { RESOURCE_LIST } from "@/game/resources";
import { adminPlayerAction, type AdminPlayer } from "@/services/adminService";
import { formatNumber } from "@/lib/utils";

/* v5.5 : actions directes sur un joueur, passées par le serveur et consignées au journal admin. */

export function PlayerToolsCard({ player, onDone }: { player: AdminPlayer; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [grant, setGrant] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  const run = async (label: string, task: () => Promise<Record<string, unknown>>) => {
    setBusy(true);
    try {
      const out = await task();
      toast.success(label, { description: summarize(out) });
      onDone();
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const granted = Object.values(grant).some((v) => v > 0);

  return (
    <div className="flex flex-col gap-3 border border-cyan-glow/20 bg-cyan-glow/[0.03] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200" title="Constructions, recherches, unités et missions se terminent aussitôt ; aucun délai entre deux changements de poste d'officier.">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={!!player.testMode}
            disabled={busy}
            onChange={(e) => void run(e.target.checked ? "Compte test activé" : "Compte test désactivé", () => adminPlayerAction(player.id, { action: "testMode", on: e.target.checked }))}
          />
          <FlaskConical className="h-4 w-4 text-cyan-glow" /> Compte test
        </label>
        <span className="text-xs text-slate-500">chantiers instantanés, aucun délai d'officier</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run("Tout est terminé", () => adminPlayerAction(player.id, { action: "finishAll" }))}>
            <FastForward className="mr-1 h-3.5 w-3.5" /> Tout terminer
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run("Délais d'officiers levés", () => adminPlayerAction(player.id, { action: "officers" }))}>
            <Timer className="mr-1 h-3.5 w-3.5" /> Lever les délais d'officiers
          </Button>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-300">
          <Gift className="mr-1 inline h-3.5 w-3.5 text-gold-glow" /> Rendre des ressources (ajoutées au stock actuel)
        </summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {RESOURCE_LIST.map((r) => (
            <label key={r.id} className="flex flex-col gap-1 text-[11px] text-slate-400">
              <span>
                <ResourceIcon id={r.id} /> {r.name}
              </span>
              <Input type="number" min={0} value={grant[r.id] ?? ""} className="h-8" onChange={(e) => setGrant((g) => ({ ...g, [r.id]: Math.max(0, Number(e.target.value) || 0) }))} />
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input value={reason} maxLength={300} placeholder="Motif (obligatoire, consigné au journal)" className="h-8 flex-1" onChange={(e) => setReason(e.target.value)} />
          <Button
            size="sm"
            disabled={busy || !granted || reason.trim().length < 5}
            onClick={() =>
              void run("Ressources rendues", () => adminPlayerAction(player.id, { action: "grant", resources: grant, reason: reason.trim() })).then(() => {
                setGrant({});
                setReason("");
              })
            }
          >
            Rendre
          </Button>
        </div>
      </details>
    </div>
  );
}

function summarize(out: Record<string, unknown>): string {
  if ("given" in out) return Object.entries(out.given as Record<string, number>).map(([k, v]) => `${formatNumber(v)} ${RESOURCE_LIST.find((r) => r.id === k)?.name ?? k}`).join(", ");
  if ("buildings" in out) {
    const r = out as Record<string, number>;
    return `${r.buildings} bâtiment(s), ${r.researches} recherche(s), ${r.units} unité(s), ${r.missions} mission(s), ${r.officers} délai(s) d'officier`;
  }
  if ("officers" in out) return `${out.officers} officier(s) libéré(s)`;
  return "";
}
