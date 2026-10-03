import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { ALLIANCE_SAGA_KEY, readAllianceSaga, sagaMonthId, sagaObjectiveLabel, sagaOf, type AllianceSagaState } from "@/game/allianceSaga";
import { adminAllianceSagaTick } from "@/services/adminService";
import { formatInt } from "@/game/format";

/* v5.5 : saga d'alliance du mois vue depuis le Générateur. */
export function AllianceSagaAdmin() {
  const [state, setState] = useState<AllianceSagaState | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () =>
    pb
      .collection("game_config")
      .getFirstListItem(`key = "${ALLIANCE_SAGA_KEY}"`)
      .then((r) => setState(readAllianceSaga((r as { data?: unknown }).data)))
      .catch(() => setState(readAllianceSaga(null)));
  useEffect(() => {
    void load();
  }, []);
  const run = async () => {
    setBusy(true);
    try {
      const out = await adminAllianceSagaTick();
      toast.success(`Saga recalculée${out.generated ? ` (écrite pour ${out.generated})` : ""}${out.closed ? `, ${out.closed} close et récompensée` : ""}.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible.");
    } finally {
      setBusy(false);
    }
  };
  const saga = state ? sagaOf(state, sagaMonthId(Date.now())) : null;
  const rows = state?.standing?.rows ?? [];
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-slate-300">{saga ? `« ${saga.title} » · ${saga.objectives.map((o) => `${sagaObjectiveLabel(o.type).toLowerCase()} × ${formatInt(o.count)}`).join(" · ")}` : "Pas encore de saga ce mois-ci."}</p>
        <Button size="sm" variant="secondary" className="ml-auto" disabled={busy} onClick={() => void run()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Écrire / recalculer
        </Button>
      </div>
      {saga && <p className="text-xs text-slate-500">Titre des vainqueurs : « {saga.winnerTitle} ». Mois clos : {state?.closed.length ? state.closed.join(", ") : "aucun"}.</p>}
      {rows.slice(0, 5).map((r) => (
        <p key={r.allianceId} className="text-xs text-slate-300">
          {r.rank}. [{r.tag}] {r.name} · {formatInt(r.points)} pts · {r.progress.map((p) => formatInt(p)).join(" / ")}
        </p>
      ))}
    </div>
  );
}
