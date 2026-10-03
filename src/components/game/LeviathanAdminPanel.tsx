import { useState } from "react";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { StatTile } from "@/components/ui/hud";
import { isActive, LEVIATHAN_RULES, leviathanPace, leviathanRanking, type LeviathanState } from "@/game/leviathan";
import { adminLeviathan } from "@/services/leviathanService";
import { formatCompact, formatNumber } from "@/lib/utils";

/** Courbe des points de structure relevés chaque heure. */
function HpChart({ state }: { state: LeviathanState }) {
  const points = [...state.timeline, { t: Math.min(Date.now(), state.endedAtMs || state.endMs), hp: state.hp }];
  const span = Math.max(1, state.endMs - state.startMs);
  const max = Math.max(state.maxHp, ...points.map((p) => p.hp));
  const xy = points.map((p) => `${(((p.t - state.startMs) / span) * 100).toFixed(2)},${(40 - (p.hp / max) * 40).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-24 w-full border border-white/5 bg-white/[0.02]" role="img" aria-label="Évolution de la structure">
      <line x1="0" y1="0" x2="100" y2="40" stroke="currentColor" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" className="text-slate-600" />
      <polyline points={xy} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="text-danger-glow" />
    </svg>
  );
}

/** Suivi en direct du Léviathan pour l'équipe (v3.3) : rythme, projection,
 *  ajustement de la structure à chaud, apparition et retrait manuels. */
export function LeviathanAdminPanel({ state }: { state: LeviathanState | null }) {
  const now = Date.now();
  const active = !!state && isActive(state, now);
  const pace = state ? leviathanPace(state, now) : null;
  const [maxHp, setMaxHp] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: "start" | "stop" | "resize", value?: number) => {
    if (action === "resize" && !window.confirm(`Passer la structure maximale à ${formatNumber(value ?? 0)} ?`)) return;
    setBusy(true);
    try {
      await adminLeviathan(action, value);
      toast.success(action === "start" ? "Le Léviathan est lâché !" : action === "stop" ? "Le Léviathan s'est retiré : récompenses versées." : "Structure ajustée.");
      setMaxHp("");
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  const assaults = state ? Object.values(state.contributions).reduce((a, c) => a + c.assaults, 0) : 0;
  const verdict = !pace || !state
    ? ""
    : state.hp <= 0
      ? "Abattu."
      : pace.ratePerHour <= 0
        ? "Aucun dégât pour l'instant."
        : pace.projectedHp <= 0
          ? `Au rythme actuel, il tombe dans ${Math.round(pace.killInHours ?? 0)} h (${Math.round(pace.remainingHours)} h restantes).`
          : `Au rythme actuel, il survit avec ${formatCompact(pace.projectedHp)} PV (${Math.round((pace.projectedHp / state.maxHp) * 100)} %).`;

  return (
    <Card className="flex flex-col gap-3 border-gold-glow/30 p-4">
      <h2 className="hud-title flex items-center gap-2 text-sm">
        <Activity className="h-4 w-4 text-gold-glow" /> Suivi en direct · administration
      </h2>
      {state && pace ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Structure" value={`${Math.round((state.hp / state.maxHp) * 100)} %`} sub={`${formatCompact(state.hp)} / ${formatCompact(state.maxHp)}`} tone="var(--color-danger-glow)" />
            <StatTile label="Rythme moyen" value={`${formatCompact(pace.ratePerHour)} /h`} sub={`dernière heure : ${formatCompact(pace.lastHour)}`} tone="var(--color-ember-glow)" />
            <StatTile label="Temps" value={`${Math.round(pace.elapsedHours)} h`} sub={`${Math.round(pace.remainingHours)} h restantes`} tone="var(--color-cyan-glow)" />
            <StatTile label="Participants" value={leviathanRanking(state).length} sub={`${assaults} assaut(s)`} tone="var(--color-mint-glow)" />
          </div>
          <HpChart state={state} />
          <p className="text-sm text-slate-300">{verdict}</p>
          {active && (
            <div className="flex flex-wrap items-end gap-2 border-t border-white/5 pt-3">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Structure maximale
                <NumberInput nullable size="sm" stepper={false} min={1} value={maxHp === "" ? undefined : Number(maxHp)} placeholder={String(state.maxHp)} onChange={(v) => setMaxHp(v === undefined ? "" : String(v))} aria-label="Structure maximale" className="w-44" />
              </label>
              <Button size="sm" variant="outline" disabled={busy || !(Number(maxHp) > 0)} onClick={() => void run("resize", Number(maxHp))}>
                Appliquer
              </Button>
              <Button size="sm" variant="ghost" disabled={busy || pace.ratePerHour <= 0} onClick={() => setMaxHp(String(pace.suggestedMaxHp))}>
                Suggestion : {formatCompact(pace.suggestedMaxHp)} (chute à l'échéance)
              </Button>
              <p className="w-full text-[11px] text-slate-500">Les dégâts déjà infligés sont conservés ; l'ajustement est consigné dans le journal admin.</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500">Aucun Léviathan enregistré.</p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
        <Button size="sm" variant="outline" disabled={busy || active} onClick={() => void run("start")}>
          Lâcher le Léviathan maintenant
        </Button>
        <Button size="sm" variant="outline" disabled={busy || !active} onClick={() => void run("stop")}>
          Le faire repartir (récompenses ×{LEVIATHAN_RULES.failedRewardFactor})
        </Button>
      </div>
    </Card>
  );
}
