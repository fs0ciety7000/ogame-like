import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminStuckFleets, type StuckFleet } from "@/services/adminService";
import { formatDuration } from "@/lib/utils";

/* v4.9.3 : flottes bloquées. La tâche serveur traite chaque minute les flottes arrivées ;
   une flotte encore en attente 10 min après son heure révèle une erreur (cf. raids de l'Inquisition). */

const MISSIONS: Record<string, string> = {
  attack: "Attaque",
  pirate: "Raid de faction",
  spy: "Espionnage",
  recycle: "Recyclage",
  transport: "Transport",
  garrison: "Garnison",
  bounty: "Prime",
  elite: "Proie d'élite",
  lair: "Repaire",
  expedition: "Expédition",
  leviathan: "Léviathan",
  patrol: "Patrouille",
};

export function StuckFleetsCard() {
  const [items, setItems] = useState<StuckFleet[] | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      setItems((await adminStuckFleets()).items);
    } catch (err) {
      toast.error(`Lecture impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const ok = items !== null && items.length === 0;
  return (
    <Card className={ok ? "flex flex-col gap-3 p-4" : "flex flex-col gap-3 border-danger-glow/40 p-4"}>
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-4 w-4 text-mint-glow" /> : <AlertTriangle className="h-4 w-4 text-danger-glow" />}
        <h3 className="hud-title text-sm">Flottes bloquées</h3>
        <Button size="sm" variant="ghost" className="ml-auto" disabled={busy} onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        Flottes toujours en attente plus de 10 minutes après leur heure d'arrivée ou de retour. La dernière erreur du serveur est indiquée quand elle est connue (elle s'efface au redémarrage).
      </p>
      {items === null ? (
        <p className="text-xs text-slate-500">Chargement…</p>
      ) : ok ? (
        <p className="text-xs text-mint-glow">Aucune flotte bloquée : la tâche serveur suit le rythme.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5 border border-white/5">
          {items.map((f) => (
            <li key={f.id} className="flex flex-col gap-0.5 px-3 py-2 text-xs">
              <p className="flex flex-wrap items-center gap-x-2">
                <span className="font-semibold text-slate-100">{MISSIONS[f.mission] ?? f.mission}</span>
                <span className="text-slate-400">
                  {f.ownerPseudo} → {f.targetPseudo}
                </span>
                <span className="ml-auto font-mono text-danger-glow">en retard de {formatDuration(Math.floor(f.lateMs / 1000))}</span>
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                {f.id} · {f.status}
                {f.factionId ? ` · ${f.factionId}` : ""}
              </p>
              {f.lastError && <p className="break-words font-mono text-[10px] text-ember-glow">{f.lastError.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
