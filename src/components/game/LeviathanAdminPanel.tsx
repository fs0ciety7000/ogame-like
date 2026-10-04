import { useState } from "react";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { StatTile } from "@/components/ui/hud";
import { Link } from "react-router-dom";
import { bossWindows, describeBossSchedule } from "@/game/events";
import { isActive, LEVIATHAN_RULES, leviathanPace, leviathanRanking, leviathanSchedule, type LeviathanState, worldBossForStart } from "@/game/leviathan";
import { WORLD_BOSSES } from "@/game/worldBosses";
import { seasonBossSchedule } from "@/game/chronicles";
import { adminLeviathan } from "@/services/leviathanService";
import { adminSeasonBoss } from "@/services/seasonBossService";
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

type BossKindAdmin = "leviathan" | "seasonboss";

const ADMIN_TEXT: Record<BossKindAdmin, { started: string; stopped: string; start: string; stop: string; none: string }> = {
  leviathan: { started: "Le boss mondial est lâché !", stopped: "Le boss mondial s'est retiré : récompenses versées.", start: "Lâcher le boss maintenant", stop: "Le faire repartir", none: "Aucun boss mondial enregistré." },
  seasonboss: { started: "Boss de saison lancé.", stopped: "Boss de saison arrêté : récompenses versées.", start: "Lancer le boss maintenant", stop: "L'arrêter et récompenser", none: "Aucun boss de saison enregistré." },
};

/** « 2026-10-30T18:00 » (heure locale du navigateur) pour un champ datetime-local. */
function toLocalInput(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

/** Suivi en direct d'un boss mondial pour l'équipe (v3.3 ; v5.10.4 : boss de saison,
 *  fin du combat réglable, prochaines occurrences) : rythme, projection, ajustement de
 *  la structure à chaud, apparition et retrait manuels. */
export function LeviathanAdminPanel({ state, kind = "leviathan" }: { state: LeviathanState | null; kind?: BossKindAdmin }) {
  const now = Date.now();
  const active = !!state && isActive(state, now);
  const pace = state ? leviathanPace(state, now) : null;
  const [maxHp, setMaxHp] = useState("");
  const [endAt, setEndAt] = useState("");
  const [busy, setBusy] = useState(false);
  // v5.14 : boss mondial à lâcher manuellement (vide : celui de la semaine).
  const [bossId, setBossId] = useState("");
  const text = ADMIN_TEXT[kind];
  const schedule = kind === "leviathan" ? leviathanSchedule() : seasonBossSchedule();
  const upcoming = bossWindows(now, schedule, 4).filter((w) => w.startMs > now).slice(0, 3);

  const run = async (action: "start" | "stop" | "resize" | "reschedule", value?: number) => {
    if (action === "resize" && !window.confirm(`Passer la structure maximale à ${formatNumber(value ?? 0)} ?`)) return;
    if (action === "reschedule" && !window.confirm(`Déplacer la fin du combat au ${new Date(value ?? 0).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })} ?`)) return;
    setBusy(true);
    try {
      if (kind === "leviathan") await adminLeviathan(action, action === "resize" ? value : undefined, action === "reschedule" ? value : undefined, action === "start" && bossId ? bossId : undefined);
      else await adminSeasonBoss(action, action === "resize" ? value : undefined, action === "reschedule" ? value : undefined);
      toast.success(action === "start" ? text.started : action === "stop" ? text.stopped : action === "resize" ? "Structure ajustée." : "Fin du combat déplacée.");
      setMaxHp("");
      setEndAt("");
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
            <StatTile label="Structure" value={`${Math.round((state.hp / state.maxHp) * 100)} %`} sub={`${formatCompact(state.hp)} / ${formatCompact(state.maxHp)}`} tone="danger" />
            <StatTile label="Rythme moyen" value={`${formatCompact(pace.ratePerHour)} /h`} sub={`dernière heure : ${formatCompact(pace.lastHour)}`} tone="ember" />
            <StatTile label="Temps" value={`${Math.round(pace.elapsedHours)} h`} sub={`${Math.round(pace.remainingHours)} h restantes`} tone="accent" />
            <StatTile label="Participants" value={leviathanRanking(state).length} sub={`${assaults} assaut(s)`} tone="mint" />
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
          {active && (
            <div className="flex flex-wrap items-end gap-2 border-t border-white/5 pt-3">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Fin du combat
                <input
                  type="datetime-local"
                  value={endAt || toLocalInput(state.endMs)}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="h-8 border border-white/10 bg-space-900 px-2 font-mono text-xs text-slate-100"
                  aria-label="Fin du combat"
                />
              </label>
              <Button size="sm" variant="outline" disabled={busy || !endAt || !(new Date(endAt).getTime() > now)} onClick={() => void run("reschedule", new Date(endAt).getTime())}>
                Déplacer la fin
              </Button>
              {[6, 24].map((h) => (
                <Button key={h} size="sm" variant="ghost" disabled={busy} onClick={() => setEndAt(toLocalInput(state.endMs + h * 3600_000))}>
                  +{h} h
                </Button>
              ))}
              <p className="w-full text-[11px] text-slate-500">Prolonger ou écourter le combat en cours (heure de ton navigateur). Consigné dans le journal admin.</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500">{text.none}</p>
      )}
      <div className="flex flex-col gap-1 border-t border-white/5 pt-3 text-xs text-slate-400">
        <p>
          <span className="text-slate-300">Occurrence :</span> {describeBossSchedule(schedule)}.{" "}
          <Link to="/game/admin?onglet=rules" className="text-cyan-glow hover:underline">
            Modifier dans les règles
          </Link>
        </p>
        {upcoming.length > 0 && (
          <p>
            <span className="text-slate-300">Prochaines apparitions :</span>{" "}
            {upcoming.map((w) => `${new Date(w.startMs).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}${kind === "leviathan" ? ` (${worldBossForStart(w.startMs).name})` : ""}`).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
        {kind === "leviathan" && (
          <select value={bossId} onChange={(e) => setBossId(e.target.value)} disabled={busy || active} className="h-8 border border-white/10 bg-black/30 px-2 text-xs text-slate-100" aria-label="Boss à lâcher">
            <option value="">Boss de la semaine</option>
            {WORLD_BOSSES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <Button size="sm" variant="outline" disabled={busy || active} onClick={() => void run("start")}>
          {kind === "leviathan" ? "Lâcher le boss maintenant" : text.start}
        </Button>
        <Button size="sm" variant="outline" disabled={busy || !active} onClick={() => void run("stop")}>
          {text.stop}
          {kind === "leviathan" ? ` (récompenses ×${LEVIATHAN_RULES.failedRewardFactor})` : ""}
        </Button>
      </div>
    </Card>
  );
}
