import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadarScan } from "@/components/game/RadarScan";
import { adminFetchStats } from "@/services/adminService";
import { resourceEmoji } from "@/game/resources";
import { formatCompact, formatNumber } from "@/lib/utils";
import type { GameStats } from "@/game/analytics";

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="hud-eyebrow text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </Card>
  );
}

function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={`flex flex-col gap-3 p-4 ${className ?? ""}`}>
      <h3 className="hud-title text-sm text-white">{title}</h3>
      {children}
    </Card>
  );
}

/** Barre horizontale : `value` sur `max`, avec libellé et valeur à droite. */
function Bar({ label, value, max, display, color = "var(--color-cyan-glow)", title }: {
  label: string;
  value: number;
  max: number;
  display: string;
  color?: string;
  title?: string;
}) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-xs" title={title}>
      <span className="truncate text-slate-300">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.6 }} />
      </div>
      <span className="tabular-mono w-16 text-right text-slate-400">{display}</span>
    </div>
  );
}

export function StatsPanel() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminFetchStats());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  if (!stats) {
    return loading ? <RadarScan label="Analyse de la galaxie…" /> : <p className="text-sm text-danger-glow">{error ?? "Aucune donnée."}</p>;
  }

  const { players, economy, buildings, technologies, units, missions, combat, insights } = stats;
  const maxRank = Math.max(1, ...players.ranks.map((r) => r.count));
  const maxDay = Math.max(1, ...combat.perDay.map((d) => d.count));
  const maxUnits = Math.max(1, ...units.map((u) => u.total));
  const maxMission = Math.max(1, ...missions.map((m) => m.running));
  const winRate = combat.attacks > 0 ? Math.round((combat.outcomes.attacker_win / combat.attacks) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-base text-white">Statistiques</h2>
        <span className="text-[11px] text-slate-500">calculées le {new Date(stats.generatedAt).toLocaleString("fr-FR")}</span>
        <Button variant="outline" size="sm" className="ml-auto" disabled={loading} onClick={() => void load()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>
      {error && <p className="text-xs text-danger-glow">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Tile label="Joueurs" value={players.total} hint={`${players.new7d} nouveau(x) cette semaine`} />
        <Tile label="Actifs 24 h" value={players.active24h} hint={`${Math.round((players.active24h / Math.max(1, players.total)) * 100)} % des joueurs`} />
        <Tile label="Actifs 7 jours" value={players.active7d} />
        <Tile label="Temps de jeu médian" value={`${players.medianPlaytimeHours} h`} />
        <Tile label={`Combats (${combat.windowDays} j)`} value={combat.attacks} hint={`${winRate} % gagnés par l'attaquant`} />
      </div>

      {insights.length > 0 && (
        <Card className="border-gold-glow/30 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gold-glow">
            <Lightbulb className="h-3.5 w-3.5" /> Pistes d'équilibrage
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
            {insights.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Répartition des rangs">
          {players.ranks.map((r) => (
            <Bar key={r.label} label={r.label} value={r.count} max={maxRank} display={String(r.count)} color="var(--color-gold-glow)" />
          ))}
          <p className="text-[11px] text-slate-500">XP médiane : {formatNumber(players.medianXp)}</p>
        </Panel>

        <Panel title="Meilleurs joueurs (XP)">
          {players.topXp.map((p, i) => (
            <div key={p.pseudo} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                <span className="mr-2 text-slate-500">#{i + 1}</span>
                {p.pseudo}
              </span>
              <span className="tabular-mono text-slate-400">{formatNumber(p.xp)}</span>
            </div>
          ))}
        </Panel>

        <Panel title={`Combats par jour (${combat.windowDays} j)`}>
          <div className="flex h-28 items-end gap-1.5">
            {combat.perDay.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day} : ${d.count}`}>
                <motion.div
                  className="w-full rounded-t bg-danger-glow/70"
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.count / maxDay) * 88}px` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="text-[9px] text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <span className="text-mint-glow">{combat.outcomes.attacker_win} victoires att.</span>
            <span className="text-cyan-glow">{combat.outcomes.defender_win} défenses</span>
            <span className="text-gold-glow">{combat.outcomes.draw} nuls</span>
          </div>
          <p className="text-[11px] text-slate-500">Butin moyen par victoire : {formatNumber(combat.avgLoot)}</p>
          {combat.topAttackers.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Plus offensifs : {combat.topAttackers.map((a) => `${a.pseudo} (${a.count})`).join(", ")}
              <br />
              Plus attaqués : {combat.mostAttacked.map((a) => `${a.pseudo} (${a.count})`).join(", ")}
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Économie (médiane par joueur)">
          <div className="grid gap-1.5 text-xs">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-[10px] uppercase tracking-wide text-slate-500">
              <span>Ressource</span>
              <span className="text-right">Stock médian</span>
              <span className="text-right">Prod. médiane</span>
              <span className="text-right">Total serveur</span>
            </div>
            {economy.resources.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-slate-300">
                <span>
                  {resourceEmoji(r.id)} {r.name}
                </span>
                <span className="tabular-mono text-right">{formatCompact(r.median)}</span>
                <span className="tabular-mono text-right text-mint-glow">{r.medianRate > 0 ? `+${formatCompact(r.medianRate)}/s` : "—"}</span>
                <span className="tabular-mono text-right text-slate-500">{formatCompact(r.total)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Bâtiments (niveau moyen)">
          {buildings.map((b) => (
            <Bar
              key={b.id}
              label={b.name}
              value={b.avgLevel}
              max={b.maxLevel}
              display={`${b.avgLevel} / ${b.maxLevel}`}
              title={`Débloqué : ${b.unlockedPct} % · au max : ${b.maxedPct} %`}
            />
          ))}
        </Panel>

        <Panel title="Technologies (part des joueurs qui l'ont)">
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {[...technologies]
              .sort((a, b) => b.researchedPct - a.researchedPct)
              .map((t) => (
                <Bar
                  key={t.id}
                  label={t.name}
                  value={t.researchedPct}
                  max={100}
                  display={`${t.researchedPct} %`}
                  color="var(--color-mint-glow)"
                  title={`Niveau moyen ${t.avgLevel} / ${t.maxLevel}`}
                />
              ))}
          </div>
        </Panel>

        <Panel title="Unités (total sur le serveur)">
          {units.map((u) => (
            <Bar
              key={u.id}
              label={u.name}
              value={u.total}
              max={maxUnits}
              display={formatCompact(u.total)}
              color="var(--color-danger-glow)"
              title={`Débloquée : ${u.unlockedPct} % · possédée : ${u.ownersPct} %`}
            />
          ))}
        </Panel>

        <Panel title="Missions en cours" className="lg:col-span-2">
          <div className="grid gap-2 md:grid-cols-2">
            {missions.map((m) => (
              <Bar key={m.key} label={m.name} value={m.running} max={maxMission} display={String(m.running)} color="var(--color-gold-glow)" />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
