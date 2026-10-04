import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { FileDown, Lightbulb, RefreshCw } from "lucide-react";
import { StatsPrintReport } from "@/pages/admin/StatsPrintReport";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadarScan } from "@/components/game/RadarScan";
import { adminFetchStats } from "@/services/adminService";
import { RESOURCE_LIST } from "@/game/resources";
import { ResourceIcon } from "@/components/ui/game-icon";
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
        {/* v4.8 : export PDF (impression du navigateur, mise en page dédiée). */}
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          <FileDown className="mr-1 h-3.5 w-3.5" /> Exporter en PDF
        </Button>
      </div>
      {error && <p className="text-xs text-danger-glow">{error}</p>}
      <StatsPrintReport stats={stats} />

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

      {stats.retention && <RetentionPanels retention={stats.retention} />}

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
                  <ResourceIcon id={r.id} /> {r.name}
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

        {stats.balance && <BalancePanels balance={stats.balance} />}
        {stats.endgame && <EndgamePanel endgame={stats.endgame} />}

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

function BalancePanels({ balance }: { balance: GameStats["balance"] }) {
  const { activity, rankAge, dominantUnits, factions, flows, anomalies, windowDays } = balance;
  return (
    <>
      <Panel title={`Équilibrage · activité et décrochage`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["24 h", activity.active1d],
            ["7 j", activity.active7d],
            ["30 j", activity.active30d],
          ].map(([label, n]) => (
            <div key={label} className="border border-white/5 p-2">
              <p className="font-display text-xl text-white">{n}</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">actifs {label}</p>
            </div>
          ))}
        </div>
        {activity.dormant.length > 0 ? (
          <p className="text-[11px] text-slate-400">
            En train de décrocher (absents de 3 à 30 j) : {activity.dormant.map((d) => `${d.pseudo} (${d.days} j)`).join(", ")}
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">Personne n'a décroché récemment.</p>
        )}
        <p className="hud-eyebrow mt-1 text-[10px] text-slate-500">Ancienneté médiane par rang</p>
        {rankAge.map((r) => (
          <div key={r.label} className="flex justify-between text-xs text-slate-300">
            <span>
              {r.label} <span className="text-slate-500">({r.players})</span>
            </span>
            <span className="tabular-mono text-slate-400">{r.medianDays} j</span>
          </div>
        ))}
      </Panel>

      <Panel title={`Équilibrage · combats (${windowDays} j)`}>
        <p className="hud-eyebrow text-[10px] text-slate-500">Victoires selon l'unité dominante de la flotte</p>
        {dominantUnits.length === 0 ? (
          <p className="text-[11px] text-slate-500">Pas encore de données (la composition des flottes est enregistrée depuis la v2.8).</p>
        ) : (
          dominantUnits.map((u) => (
            <Bar key={u.id} label={`${u.name} (${u.attacks})`} value={u.winPct} max={100} display={`${u.winPct} %`} color="var(--color-ember-glow)" />
          ))
        )}
        <p className="hud-eyebrow mt-2 text-[10px] text-slate-500">Factions</p>
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-[10px] uppercase tracking-wide text-slate-500">
          <span>Faction</span>
          <span className="text-right">Raids repoussés</span>
          <span className="text-right">Repaires pris</span>
        </div>
        {factions.map((f) => (
          <div key={f.id} className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-xs text-slate-300">
            <span className="truncate">{f.name}</span>
            <span className="tabular-mono text-right">{f.raids ? `${f.repelledPct} % / ${f.raids}` : "—"}</span>
            <span className="tabular-mono text-right">{f.lairAssaults ? `${f.lairWinPct} % / ${f.lairAssaults}` : "—"}</span>
          </div>
        ))}
      </Panel>

      <Panel title="Équilibrage · flux de ressources">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="text-slate-400">Production des actifs</span>
          <span className="tabular-mono text-right text-mint-glow">+{formatCompact(flows.productionPerHour)} / h</span>
          <span className="text-slate-400">Pillé entre joueurs ({windowDays} j)</span>
          <span className="tabular-mono text-right">{formatCompact(flows.lootWindow)}</span>
          <span className="text-slate-400">Dépensé (depuis la v2.8)</span>
          <span className="tabular-mono text-right">{formatCompact(flows.spentTotal)}</span>
          <span className="text-slate-400">Échangé au comptoir</span>
          <span className="tabular-mono text-right">{formatCompact(flows.tradedTotal)}</span>
          <span className="text-slate-400">Échanges au marché</span>
          <span className="tabular-mono text-right">{flows.marketTrades ?? 0}</span>
          <span className="text-slate-400">Taxe du marché (retirée du jeu)</span>
          <span className="tabular-mono text-right text-danger-glow">{formatCompact(flows.marketTax ?? 0)}</span>
        </div>
      </Panel>

      <Panel title="Équilibrage · stocks anormaux">
        {anomalies.length === 0 ? (
          <p className="text-[11px] text-slate-500">Aucun stock 20 fois au-dessus des autres joueurs.</p>
        ) : (
          <>
            {anomalies.map((a) => (
              <div key={`${a.pseudo}-${a.resource}`} className="flex justify-between gap-2 text-xs text-slate-300">
                <span className="truncate">
                  {a.pseudo} · {a.resource}
                </span>
                <span className="tabular-mono text-danger-glow">
                  {formatCompact(a.amount)} {a.ratio > 0 ? `(×${a.ratio})` : ""}
                </span>
              </div>
            ))}
            <p className="text-[11px] text-slate-500">Comparé à la médiane des autres joueurs. Vérifie l'historique de ces comptes (journal, échanges, missions).</p>
          </>
        )}
      </Panel>
    </>
  );
}

function EndgamePanel({ endgame }: { endgame: GameStats["endgame"] }) {
  const resName = (id: string | null) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id ?? "";
  return (
    <Panel title={`Fin de partie · ${endgame.players} joueur${endgame.players > 1 ? "s" : ""} engagé${endgame.players > 1 ? "s" : ""}`} className="lg:col-span-2">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <p className="hud-eyebrow text-[10px] text-slate-500">Technologies 21 à 25</p>
          {endgame.techs.map((t) => (
            <div key={t.id} className="text-xs text-slate-300" title={t.leaders.join(", ")}>
              <div className="flex justify-between gap-2">
                <span className="truncate">{t.name}</span>
                <span className="tabular-mono shrink-0 text-slate-400">
                  {t.researchers} · niv. moy. {t.avgLevel}/{t.maxLevel}
                  {t.inProgress > 0 && <span className="text-cyan-glow"> · {t.inProgress} en cours</span>}
                </span>
              </div>
              {t.leaders.length > 0 && <p className="truncate text-[10px] text-slate-500">{t.leaders.join(" · ")}</p>}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="hud-eyebrow text-[10px] text-slate-500">Bâtiments</p>
          {endgame.buildings.map((b) => (
            <div key={b.id} className="text-xs text-slate-300">
              <div className="flex justify-between gap-2">
                <span className="truncate">{b.name}</span>
                <span className="tabular-mono shrink-0 text-slate-400">
                  {b.builders} · niv. moy. {b.avgLevel}/{b.maxLevel}
                </span>
              </div>
              {b.resource && (
                <p className="text-[10px] text-mint-glow">
                  +{formatNumber(b.perHour)} {resName(b.resource)} / h (tous joueurs)
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="hud-eyebrow text-[10px] text-slate-500">Unités ({endgame.windowDays} j)</p>
          {endgame.units.map((u) => (
            <div key={u.id} className="text-xs text-slate-300">
              <div className="flex justify-between gap-2">
                <span className="truncate">{u.name}</span>
                <span className="tabular-mono shrink-0 text-slate-400">
                  {u.owners} joueur{u.owners > 1 ? "s" : ""} · {formatCompact(u.total)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{u.attacks ? `${u.attacks} attaque${u.attacks > 1 ? "s" : ""} · ${u.winPct} % de victoires` : "Pas encore engagée en attaque"}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- v4.5 : rétention ---------- */

function RetentionPanels({ retention }: { retention: NonNullable<GameStats["retention"]> }) {
  const { daily, active, cohorts, funnel, dropoff, trackingSince, recentPlayers } = retention;
  const maxActive = Math.max(1, ...daily.map((d) => d.active));
  const dayLabel = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title="Rétention · joueurs actifs par jour (30 j)" className="lg:col-span-2">
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-4">
          {[
            ["Actifs 24 h", active.d1],
            ["Actifs 7 j", active.d7],
            ["Actifs 30 j", active.d30],
            ["Inscrits", active.total],
          ].map(([label, value]) => (
            <div key={label as string} className="border border-white/5 bg-white/[0.02] p-2">
              <p className="font-display text-xl text-white">{value}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        {trackingSince ? (
          <>
            <div className="flex h-28 items-end gap-[2px]" role="img" aria-label="Joueurs actifs par jour sur 30 jours">
              {daily.map((d) => (
                <div key={d.day} className="group relative flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-[4px] bg-cyan-glow/70 transition-colors group-hover:bg-cyan-glow"
                    style={{ height: `${Math.max(d.active > 0 ? 3 : 0, (d.active / maxActive) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap border border-white/10 bg-space-950 px-2 py-1 text-[11px] text-slate-200 group-hover:block">
                    {dayLabel(d.day)} · {d.active} actif{d.active > 1 ? "s" : ""} · {d.signups} inscription{d.signups > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-mono text-[10px] text-slate-500">
              <span>{dayLabel(daily[0].day)}</span>
              <span>suivi depuis le {dayLabel(trackingSince)}</span>
              <span>{dayLabel(daily[daily.length - 1].day)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500">Le suivi jour par jour commence avec cette version : les premières barres apparaîtront dès les prochaines connexions.</p>
        )}
      </Panel>

      <Panel title="Rétention · cohortes d'inscrits par semaine">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-slate-500">
              <th className="py-1 font-normal">Semaine du</th>
              <th className="py-1 text-right font-normal">Inscrits</th>
              <th className="py-1 text-right font-normal" title="Revenus le lendemain de l'inscription">J+1</th>
              <th className="py-1 text-right font-normal" title="Revenus au moins une fois 7 jours ou plus après l'inscription">J+7</th>
              <th className="py-1 text-right font-normal" title="Revenus au moins une fois 30 jours ou plus après l'inscription">J+30</th>
              <th className="py-1 text-right font-normal" title="Vus ces 3 derniers jours">Encore là</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.week} className="border-t border-white/5 text-slate-300">
                <td className="py-1">{dayLabel(c.week)}</td>
                <td className="py-1 text-right tabular-nums">{c.signups}</td>
                <td className="py-1 text-right tabular-nums">{c.d1Pct === null ? "—" : `${c.d1Pct} %`}</td>
                <td className="py-1 text-right tabular-nums">{c.d7Pct === null ? "—" : `${c.d7Pct} %`}</td>
                <td className="py-1 text-right tabular-nums">{c.d30Pct === null || c.d30Pct === undefined ? "—" : `${c.d30Pct} %`}</td>
                <td className="py-1 text-right tabular-nums">{c.signups ? `${c.activeNowPct} %` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-500">« — » : pas encore mesurable (suivi trop récent ou cohorte trop jeune).</p>
      </Panel>

      {retention.survival && (
        <Panel title="Rétention · survie après l'inscription">
          <div className="flex flex-col gap-1.5">
            {retention.survival.map((s) => (
              <Bar key={s.day} label={`Encore actif à J+${s.day}`} value={s.pct ?? 0} max={100} display={s.pct === null ? "—" : `${s.pct} %`} title={`${s.eligible} inscrit(s) assez anciens`} />
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Part des joueurs revenus au moins une fois N jours après leur inscription, parmi ceux inscrits depuis au moins N jours.</p>
        </Panel>
      )}

      {retention.churn && (
        <Panel title="Décrochage · quand les joueurs partent">
          <div className="flex flex-col gap-1.5">
            {retention.churn.map((c) => (
              <Bar key={c.label} label={c.label} value={c.count} max={Math.max(1, ...retention.churn.map((x) => x.count))} display={String(c.count)} color="var(--color-ember-glow)" />
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Joueurs sans activité depuis 7 jours, selon leur ancienneté lors de leur dernière visite. Le détail par objectif de prise en main est juste à côté.</p>
        </Panel>
      )}

      <Panel title={`Prise en main · ${recentPlayers} inscrit${recentPlayers > 1 ? "s" : ""} sur 60 jours`}>
        <div className="flex flex-col gap-1.5">
          {funnel.map((f) => (
            <Bar key={f.id} label={f.label} value={f.reached} max={Math.max(1, recentPlayers)} display={`${f.pct} %`} title={`${f.reached} joueur(s)`} />
          ))}
        </div>
        {dropoff.length > 0 && (
          <div className="border-t border-white/5 pt-2">
            <p className="mb-1 text-[11px] text-slate-400">Inactifs depuis 3 jours : dernier objectif non atteint</p>
            <div className="flex flex-col gap-1.5">
              {dropoff.map((d) => (
                <Bar key={d.id} label={d.label} value={d.count} max={Math.max(1, ...dropoff.map((x) => x.count))} display={String(d.count)} color="var(--color-ember-glow)" />
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
