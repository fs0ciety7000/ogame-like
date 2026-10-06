import { useEffect, useState } from "react";
import { Activity, Gauge, RefreshCw } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { HudChip, StatTile, type HudTone } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { formatNumber, timeAgo } from "@/lib/utils";
import { VITALS, type CronRun, type CronStatus, type VitalsReport } from "@/game/serverMetrics";

/* 5.26 : exploitation : tâches planifiées (durée, retard, échecs), Web Vitals
   mesurés chez les joueurs (75e centile sur 7 jours), flottes bloquées et
   e-mails programmés. */

interface Metrics {
  now: number;
  crons: (CronRun & { name: string; status: CronStatus })[];
  cronSummary: { total: number; late: number; failing: number; slow: number };
  vitals: VitalsReport;
  stuckFleets: number;
  mailScheduled: number;
  logicVersion: string;
}

const CRON_TONE: Record<CronStatus, { tone: HudTone; label: string }> = {
  ok: { tone: "mint", label: "OK" },
  slow: { tone: "ember", label: "Lente" },
  late: { tone: "danger", label: "En retard" },
  failing: { tone: "danger", label: "En échec" },
};
const RATING: Record<string, { tone: HudTone; label: string }> = {
  good: { tone: "mint", label: "Bon" },
  needs: { tone: "ember", label: "À améliorer" },
  poor: { tone: "danger", label: "Mauvais" },
};

function fmtVital(id: string, v: number | null) {
  if (v === null) return "—";
  return id === "cls" ? v.toFixed(2) : `${formatNumber(v)} ms`;
}

export function MetricsSection() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      setM(await pb.send<Metrics>("/api/cosmic/admin/metrics", { requestKey: null }));
      setError(false);
    } catch {
      setError(true);
    }
    setBusy(false);
  };
  useEffect(() => {
    void load();
  }, []);

  if (error) return <HudPanel icon={<Activity />} title="Exploitation">Route absente : mets à jour les hooks (Outils).</HudPanel>;
  const s = m?.cronSummary;
  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Exploitation">
        <StatTile label="Tâches" value={s ? `${s.total - s.late - s.failing}/${s.total}` : "…"} sub={s ? (s.late || s.failing ? `${s.late} en retard · ${s.failing} en échec` : "toutes à l'heure") : undefined} tone={s && (s.late || s.failing) ? "danger" : "mint"} />
        <StatTile label="Flottes bloquées" value={m ? formatNumber(Math.max(0, m.stuckFleets)) : "…"} tone={m && m.stuckFleets > 0 ? "danger" : "neutral"} />
        <StatTile label="E-mails programmés" value={m ? formatNumber(m.mailScheduled) : "…"} sub="campagnes en attente" tone="neutral" />
        <StatTile label="Mesures Web Vitals" value={m ? formatNumber(m.vitals.samples) : "…"} sub="7 derniers jours" tone="accent" />
      </section>

      <HudPanel
        icon={<Gauge />}
        title="Web Vitals (75e centile, 7 jours)"
        tone="accent"
        aside={
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void load()}>
            <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Actualiser
          </Button>
        }
      >
        {!m || m.vitals.samples === 0 ? (
          <p className="text-xs text-slate-500">Pas encore de mesures : un chargement sur quatre envoie les siennes quand le joueur quitte la page.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="py-1.5 font-normal">Mesure</th>
                    <th className="py-1.5 text-right font-normal">Tous</th>
                    <th className="py-1.5 text-right font-normal">Mobile</th>
                    <th className="py-1.5 text-right font-normal">Ordinateur</th>
                    <th className="py-1.5 text-right font-normal">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {m.vitals.metrics.map((v) => {
                    const def = VITALS.find((x) => x.id === v.id)!;
                    const r = v.rating ? RATING[v.rating] : null;
                    return (
                      <tr key={v.id}>
                        <td className="py-1.5 text-slate-300">{def.label}</td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-slate-100">{fmtVital(v.id, v.p75)}</td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-slate-400">{fmtVital(v.id, v.p75Mobile)}</td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-slate-400">{fmtVital(v.id, v.p75Desktop)}</td>
                        <td className="py-1.5 text-right">{r && <HudChip size="sm" tone={r.tone}>{r.label}</HudChip>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {m.vitals.slowPages.length > 0 && (
              <div>
                <p className="hud-eyebrow mb-1 text-[10px] text-slate-500">Pages les plus lentes (LCP moyen)</p>
                <ul className="flex flex-col gap-1 text-xs">
                  {m.vitals.slowPages.map((p) => (
                    <li key={p.route} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate font-mono text-slate-300">{p.route}</span>
                      <span className="font-mono tabular-nums text-slate-400">{formatNumber(p.lcpAvg)} ms</span>
                      <span className="w-14 text-right font-mono text-[11px] text-slate-500">×{p.n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </HudPanel>

      <HudPanel icon={<Activity />} title="Tâches planifiées" aside={<span className="text-[11px] text-slate-500">mesures depuis le dernier démarrage du serveur</span>}>
        {!m || m.crons.length === 0 ? (
          <p className="text-xs text-slate-500">Aucune mesure encore : les tâches s'enregistrent à leur prochain passage.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-1.5 font-normal">Tâche</th>
                  <th className="py-1.5 font-normal">État</th>
                  <th className="py-1.5 text-right font-normal">Dernier passage</th>
                  <th className="py-1.5 text-right font-normal">Durée</th>
                  <th className="py-1.5 text-right font-normal">Moy. / max</th>
                  <th className="py-1.5 text-right font-normal">Échecs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {m.crons.map((c) => (
                  <tr key={c.name} title={c.lastError || undefined}>
                    <td className="py-1.5 font-mono text-slate-300">{c.name.replace(/^cosmic_/, "")}</td>
                    <td className="py-1.5">
                      <HudChip size="sm" tone={CRON_TONE[c.status].tone}>
                        {CRON_TONE[c.status].label}
                      </HudChip>
                    </td>
                    <td className="py-1.5 text-right font-mono text-slate-400">{timeAgo(c.lastAtMs)}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-slate-100">{formatNumber(c.lastMs)} ms</td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-slate-400">
                      {formatNumber(c.avgMs)} / {formatNumber(c.maxMs)}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-slate-400">
                      {c.fails}/{c.runs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>
    </div>
  );
}
