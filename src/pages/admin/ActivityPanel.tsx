import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Activity, AlertTriangle, ArrowLeft, Clock, Copy, GitCompare, Gift, History, ListChecks, Radar, RefreshCw, Search, ShieldAlert, Store, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, HudChip, StatTile, type HudTone } from "@/components/ui/hud";
import { HudPanel } from "@/components/ui/panel";
import { SkeletonCards } from "@/components/ui/skeleton";
import { AUDIT_WINDOWS, XP_SOURCE_LABELS, type AuditFlag, type AuditWindow, type XpSource, type XpTotals } from "@/game/xpAudit";
import { fetchActivity, fetchPlayerAudit, type ActivityOverview, type ActivityRow, type PlayerAudit } from "@/services/adminActivityService";
import { cn, formatDateTime, formatDecimal, formatDuration, formatNumber, timeAgo } from "@/lib/utils";

/* 5.17.1 : activité des joueurs en temps réel et audit d'un joueur (XP par
   source, rythme, combats, échanges, actions de l'équipe, signaux d'alerte). */

const SEVERITY_TONE: Record<AuditFlag["severity"], HudTone> = { high: "danger", medium: "gold", info: "neutral" };
const SEVERITY_LABEL: Record<AuditFlag["severity"], string> = { high: "Grave", medium: "À vérifier", info: "Info" };
const SOURCE_TONE: Record<XpSource, string> = {
  mission: "var(--color-cyan-glow)",
  attack: "var(--color-danger-glow)",
  defense: "var(--color-mint-glow)",
  expedition: "var(--color-violet-glow)",
  bounty: "var(--color-gold-glow)",
  pirate: "var(--color-ember-glow)",
  achievement: "var(--color-slate-300)",
  contract: "var(--color-slate-400)",
  other: "var(--color-slate-500)",
};
const REFRESH_MS = 30_000;

const parisTime = (ms: number) => formatDateTime(ms, "dayShortTime", "server");
const signed = (n: number) => `${n > 0 ? "+" : ""}${formatNumber(n)}`;

/** Barre empilée de l'XP par source. */
function SourceBar({ totals, className }: { totals: XpTotals; className?: string }) {
  const parts = (Object.entries(totals.bySource) as [XpSource, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const sum = parts.reduce((a, [, v]) => a + v, 0);
  if (sum <= 0) return <div className={cn("h-1.5 w-full bg-slate-800", className)} />;
  return (
    <div className={cn("flex h-1.5 w-full overflow-hidden bg-slate-800", className)} title={parts.map(([k, v]) => `${XP_SOURCE_LABELS[k]} ${formatNumber(v)}`).join(" · ")}>
      {parts.map(([k, v]) => (
        <span key={k} style={{ width: `${(v / sum) * 100}%`, background: SOURCE_TONE[k] }} />
      ))}
    </div>
  );
}

function SourceLegend({ totals }: { totals: XpTotals }) {
  const parts = (Object.entries(totals.bySource) as [XpSource, number][]).filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
  if (!parts.length) return <span className="text-xs text-slate-500">Aucun gain.</span>;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {parts.map(([k, v]) => (
        <span key={k} className="flex items-center gap-1 text-slate-300">
          <span aria-hidden className="h-2 w-2" style={{ background: SOURCE_TONE[k] }} />
          {XP_SOURCE_LABELS[k]} <span className="font-mono">{signed(v)}</span>
        </span>
      ))}
    </div>
  );
}

function FlagChips({ flags, max = 3 }: { flags: AuditFlag[]; max?: number }) {
  if (!flags.length) return <span className="font-mono text-[10px] text-slate-600">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.slice(0, max).map((f) => (
        <HudChip key={f.id} size="sm" tone={SEVERITY_TONE[f.severity]} title={f.detail}>
          {f.title}
        </HudChip>
      ))}
      {flags.length > max && <span className="font-mono text-[10px] text-slate-500">+{flags.length - max}</span>}
    </div>
  );
}

/** Histogramme simple (barres verticales). */
function Bars({ values, tone = "var(--color-cyan-glow)", height = 48, labelEvery, labelOf }: { values: number[]; tone?: string; height?: number; labelEvery?: number; labelOf?: (i: number) => string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-px" style={{ height }}>
        {values.map((v, i) => (
          <span key={i} className="min-w-0 flex-1" title={labelOf ? `${labelOf(i)} : ${formatNumber(v)}` : formatNumber(v)} style={{ height: `${Math.max(v > 0 ? 6 : 2, (v / max) * 100)}%`, background: v > 0 ? tone : "var(--color-slate-800)" }} />
        ))}
      </div>
      {labelEvery && labelOf && (
        <div className="flex justify-between font-mono text-[9px] text-slate-500">
          {values.map((_, i) => (i % labelEvery === 0 ? <span key={i}>{labelOf(i)}</span> : null))}
        </div>
      )}
    </div>
  );
}

export function ActivityPanel() {
  const [win, setWin] = useState<AuditWindow>("24h");
  const [data, setData] = useState<ActivityOverview | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(true);
  const [query, setQuery] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [audited, setAudited] = useState<string | null>(null);
  // 5.17.2 : comparaison de deux joueurs côte à côte.
  const [picked, setPicked] = useState<string[]>([]);
  const [compared, setCompared] = useState<[string, string] | null>(null);
  const [cmpA, setCmpA] = useState("");
  const [cmpB, setCmpB] = useState("");
  const togglePick = (uid: string) => setPicked((p) => (p.includes(uid) ? p.filter((x) => x !== uid) : [...p, uid].slice(-2)));

  const load = useCallback(async () => {
    try {
      setData(await fetchActivity(win));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }, [win]);

  useEffect(() => {
    void load();
    if (!live || audited || compared) return;
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load, live, audited, compared]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.rows ?? []).filter((r) => (!q || r.pseudo.toLowerCase().includes(q)) && (!flaggedOnly || r.flags.some((f) => f.severity !== "info")));
  }, [data, query, flaggedOnly]);

  if (compared) return <PlayerCompareView pair={compared} onBack={() => setCompared(null)} onOpen={(q) => (setCompared(null), setAudited(q))} />;
  if (audited) return <PlayerAuditView q={audited} onBack={() => setAudited(null)} />;

  const flagged = (data?.rows ?? []).filter((r) => r.flags.some((f) => f.severity === "high")).length;
  const busy = (data?.rows ?? []).filter((r) => r.now.missions + r.now.buildings + r.now.research + r.now.fleets > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {AUDIT_WINDOWS.map((w) => (
          <Button key={w.id} size="sm" variant={w.id === win ? "primary" : "outline"} onClick={() => setWin(w.id)}>
            {w.label}
          </Button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="accent-cyan-glow" /> Actualiser toutes les 30 s
        </label>
        <Button size="sm" variant="ghost" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>

      {error && <p className="text-sm text-danger-glow">{error}</p>}
      {!data ? (
        <SkeletonCards count={3} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="En ligne" tone="mint" value={<span className="font-mono">{data.online}</span>} sub={`${busy} joueurs avec quelque chose en cours`} />
            <StatTile label="Signaux graves" tone={flagged ? "danger" : "neutral"} value={<span className="font-mono">{flagged}</span>} sub="compte test, missions au-delà du plafond, moyenne impossible" />
            <StatTile label="XP sur 24 h (actifs)" tone="accent" value={<span className="font-mono">{formatNumber(data.median24h)}</span>} sub={`médiane · 90e centile ${formatNumber(data.p90_24h)}`} />
            <StatTile label="Plafond des missions" tone="gold" value={<span className="font-mono">{formatNumber(data.missionCeiling)}</span>} sub={`XP sur la période, toutes relancées sans pause (${formatNumber(data.missionCeiling24h)} / 24 h)`} />
          </div>

          <HudPanel
            icon={<Users />}
            title={`Joueurs · XP gagnée (${AUDIT_WINDOWS.find((w) => w.id === win)?.label.toLowerCase()})`}
            tone="accent"
            aside={<span className="font-mono text-[10px] text-slate-500">mis à jour {timeAgo(data.now)}</span>}
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer par pseudo" className="pl-7" />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="accent-cyan-glow" /> Signalés seulement
              </label>
              <Button size="sm" variant="outline" disabled={!query.trim()} onClick={() => setAudited(query.trim())}>
                <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Auditer « {query.trim() || "…"} »
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Comparer</span>
              <Input value={cmpA} onChange={(e) => setCmpA(e.target.value)} placeholder="Joueur 1 (ex. Lap1)" className="w-40" />
              <Input value={cmpB} onChange={(e) => setCmpB(e.target.value)} placeholder="Joueur 2 (ex. Vince)" className="w-40" />
              <Button size="sm" variant="outline" disabled={!cmpA.trim() || !cmpB.trim()} onClick={() => setCompared([cmpA.trim(), cmpB.trim()])}>
                <GitCompare className="mr-1 h-3.5 w-3.5" /> Comparer
              </Button>
              {picked.length === 2 && (
                <Button size="sm" variant="primary" onClick={() => setCompared([picked[0], picked[1]])}>
                  <GitCompare className="mr-1 h-3.5 w-3.5" /> Comparer les 2 cochés
                </Button>
              )}
              {picked.length > 0 && <span className="font-mono text-[10px] text-slate-500">{picked.length} / 2 coché(s)</span>}
            </div>
            {rows.length === 0 ? (
              <EmptyState icon={<Users />} title="Aucun joueur" size="sm">
                Rien ne correspond au filtre.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-xs">
                  <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="w-6 py-1.5" aria-label="Comparer" />
                      <th className="py-1.5 pr-2">Joueur</th>
                      <th className="py-1.5 pr-2 text-right">XP gagnée</th>
                      <th className="w-40 py-1.5 pr-2">Sources</th>
                      <th className="py-1.5 pr-2 text-right">Missions 24 h</th>
                      <th className="py-1.5 pr-2 text-right">Heures actives</th>
                      <th className="py-1.5 pr-2 text-right">Combats</th>
                      <th className="py-1.5 pr-2">En cours</th>
                      <th className="py-1.5">Signaux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 200).map((r) => (
                      <ActivityTableRow key={r.uid} r={r} ceiling24h={data.missionCeiling24h} onOpen={() => setAudited(r.uid)} picked={picked.includes(r.uid)} onPick={() => togglePick(r.uid)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Registre exact depuis la 5.17.1 ; avant, l'XP est reconstituée depuis les notifications des joueurs (missions, combats, succès, primes, expéditions). Clique sur une ligne pour l'audit complet.
            </p>
          </HudPanel>
        </>
      )}
    </div>
  );
}

function ActivityTableRow({ r, ceiling24h, onOpen, picked, onPick }: { r: ActivityRow; ceiling24h: number; onOpen: () => void; picked: boolean; onPick: () => void }) {
  const missionPct = ceiling24h > 0 ? Math.round((r.missionXp24h / ceiling24h) * 100) : 0;
  return (
    <tr className={cn("cursor-pointer border-t border-slate-800 hover:bg-cyan-glow/[0.04]", picked && "bg-cyan-glow/[0.06]")} onClick={onOpen}>
      <td className="py-1.5" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={picked} onChange={onPick} aria-label={`Comparer ${r.pseudo}`} className="accent-cyan-glow" />
      </td>
      <td className="py-1.5 pr-2">
        <div className="flex items-center gap-1.5">
          <span aria-label={r.online ? "en ligne" : "hors ligne"} className={cn("h-1.5 w-1.5 shrink-0 rounded-full", r.online ? "bg-mint-glow" : "bg-slate-700")} />
          <span className="font-semibold text-slate-200">{r.pseudo}</span>
          {r.testMode && (
            <HudChip size="sm" tone="danger">
              test
            </HudChip>
          )}
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {formatNumber(r.xp)} XP · vu {r.lastActiveMs ? timeAgo(r.lastActiveMs) : "jamais"}
        </span>
      </td>
      <td className="py-1.5 pr-2 text-right">
        <span className="font-mono text-sm text-slate-100">{signed(r.gained.total)}</span>
        <div className="font-mono text-[9px] text-slate-500">{r.gainedSource === "ledger" ? "registre" : "reconstitué"}</div>
      </td>
      <td className="py-1.5 pr-2">
        <SourceBar totals={r.gained} />
      </td>
      <td className="py-1.5 pr-2 text-right font-mono">
        <span className={cn(missionPct > 100 ? "text-danger-glow" : missionPct > 70 ? "text-gold-glow" : "text-slate-300")}>{formatNumber(r.missionXp24h)}</span>
        <div className="text-[9px] text-slate-500">{missionPct} % du plafond</div>
      </td>
      <td className={cn("py-1.5 pr-2 text-right font-mono", r.activeHours24h >= 20 ? "text-gold-glow" : "text-slate-300")}>{r.activeHours24h} / 24</td>
      <td className="py-1.5 pr-2 text-right font-mono text-slate-300">{r.battles}</td>
      <td className="py-1.5 pr-2 font-mono text-[10px] text-slate-400">
        {[r.now.missions && `${r.now.missions} miss.`, r.now.buildings && `${r.now.buildings} bât.`, r.now.research && `${r.now.research} rech.`, r.now.fleets && `${r.now.fleets} flottes`].filter(Boolean).join(" · ") || "—"}
      </td>
      <td className="py-1.5">
        <FlagChips flags={r.flags} max={2} />
      </td>
    </tr>
  );
}

function PlayerAuditView({ q, onBack }: { q: string; onBack: () => void }) {
  const [a, setA] = useState<PlayerAudit | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    try {
      setA(await fetchPlayerAudit(q));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }, [q]);

  useEffect(() => {
    void load();
    if (!live) return;
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load, live]);

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Tous les joueurs
      </Button>
      <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
        <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="accent-cyan-glow" /> Actualiser toutes les 30 s
      </label>
      <Button size="sm" variant="ghost" onClick={() => void load()}>
        <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
      </Button>
      {a && (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void navigator.clipboard.writeText(JSON.stringify(a, null, 1)).then(
              () => toast.success("Audit copié", { description: "Colle-le dans un message ou un fichier pour l'analyser." }),
              () => toast.error("Copie impossible"),
            )
          }
        >
          <Copy className="mr-1 h-3.5 w-3.5" /> Copier l'audit (JSON)
        </Button>
      )}
    </div>
  );
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <EmptyState icon={<Search />} title="Audit impossible">
          {error}
        </EmptyState>
      </div>
    );
  }
  if (!a) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <SkeletonCards count={3} />
      </div>
    );
  }
  const p = a.player;
  const days = Math.max(1, (a.now - p.createdAtMs) / 86_400_000);
  const startHour = Math.floor(a.now / 3600_000) - 23;
  const startHour7 = Math.floor(a.now / 3600_000) - 7 * 24 + 1;
  const hourLabel = (h: number) => formatDateTime(h * 3600_000, "hour", "server");
  const dayLabel = (h: number) => formatDateTime(h * 3600_000, "weekdayShortNum", "server");

  return (
    <div className="flex flex-col gap-4">
      {header}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="hud-title text-2xl normal-case text-slate-100">{p.pseudo}</h2>
        <HudChip size="sm" tone={p.online ? "mint" : "neutral"}>
          {p.online ? "en ligne" : `vu ${p.lastActiveMs ? timeAgo(p.lastActiveMs) : "jamais"}`}
        </HudChip>
        {p.testMode && (
          <HudChip size="sm" tone="danger" alert>
            Compte test
          </HudChip>
        )}
        {!!p.vacation && (
          <HudChip size="sm" tone="violet">
            vacances
          </HudChip>
        )}
        <span className="font-mono text-[10px] text-slate-500">{p.uid}</span>
      </div>

      <HudPanel icon={<AlertTriangle />} title="Verdict : signaux d'alerte" tone={a.flags.some((f) => f.severity === "high") ? "danger" : a.flags.length ? "gold" : "mint"}>
        {a.flags.length === 0 ? (
          <EmptyState icon={<ShieldAlert />} title="Rien d'anormal" size="sm">
            Aucun signal sur les 7 derniers jours : rythme, sources d'XP et combats compatibles avec un jeu normal.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {a.flags.map((f) => (
              <li key={f.id} className="flex items-start gap-2">
                <HudChip size="sm" tone={SEVERITY_TONE[f.severity]}>
                  {SEVERITY_LABEL[f.severity]}
                </HudChip>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </HudPanel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="XP totale" tone="accent" value={<span className="font-mono">{formatNumber(p.xp)}</span>} sub={`saison ${formatNumber(p.seasonXp)} · ${p.ascensions} ascension(s)`} />
        <StatTile label="XP par jour" tone="gold" value={<span className="font-mono">{formatNumber(Math.round(p.xp / days))}</span>} sub={`depuis l'inscription (${Math.round(days)} j) · plafond missions ${formatNumber(a.windows["24h"].missionCeiling)}`} />
        <StatTile label="Combats (7 j)" tone="danger" value={<span className="font-mono">{a.battleCount}</span>} sub={`${p.victories} victoires · ${p.defeats} défaites au total`} />
        <StatTile label="Activité" tone="mint" value={<span className="font-mono">{a.activity.activeHours24h} / 24</span>} sub={`heures actives sur 24 h · série max ${a.activity.longestStreak7d} h (7 j) · ${p.activeDays} jours joués`} />
      </div>

      <HudPanel icon={<Radar />} title="XP gagnée par source" tone="accent" aside={<span className="font-mono text-[10px] text-slate-500">{a.ledgerSinceMs ? `registre depuis ${parisTime(a.ledgerSinceMs)}` : "registre vide : reconstitution"}</span>}>
        <div className="grid gap-3 md:grid-cols-3">
          {AUDIT_WINDOWS.map((w) => {
            const x = a.windows[w.id];
            const shown = x.best ?? (x.ledger.total !== 0 ? x.ledger : x.rebuilt);
            const mission = shown.bySource.mission ?? 0;
            return (
              <div key={w.id} className="flex flex-col gap-1.5 border border-slate-800 p-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{w.label}</span>
                  <span className="font-mono text-lg text-slate-100">{signed(shown.total)}</span>
                </div>
                <SourceBar totals={shown} />
                <SourceLegend totals={shown} />
                <span className={cn("font-mono text-[10px]", mission > x.missionCeiling ? "text-danger-glow" : "text-slate-500")}>
                  missions {formatNumber(mission)} / plafond {formatNumber(x.missionCeiling)}
                </span>
                <span className="font-mono text-[9px] text-slate-600">
                  {x.bestSource === "ledger" ? "registre" : "reconstitué"} · registre {signed(x.ledger.total)} · notifications {signed(x.rebuilt.total)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500">
          Autres joueurs actifs ({a.comparison.activePlayers}) sur 24 h : médiane <span className="font-mono">{formatNumber(a.comparison.median24h)}</span> XP, 90e centile <span className="font-mono">{formatNumber(a.comparison.p90_24h)}</span>.
        </p>
      </HudPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel icon={<Clock />} title="Activité heure par heure (24 h)" tone="mint">
          <Bars values={a.activity.byHour24} tone="var(--color-mint-glow)" labelEvery={4} labelOf={(i) => hourLabel(startHour + i)} />
          <p className="text-[11px] text-slate-500">Événements enregistrés par heure (fins de missions, combats, succès…), heure de Paris.</p>
        </HudPanel>
        <HudPanel icon={<Activity />} title="XP par heure (7 jours)" tone="accent">
          <Bars values={a.activity.xpByHour7d} labelEvery={24} labelOf={(i) => dayLabel(startHour7 + i)} />
          <p className="text-[11px] text-slate-500">Reconstitué depuis les notifications. Un mur continu sans creux de nuit est suspect.</p>
        </HudPanel>
      </div>

      <HudPanel icon={<ListChecks />} title="En cours maintenant" tone="neutral">
        <div className="grid gap-3 text-xs md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Missions ({a.current.missions.length})</p>
            {a.current.missions.length === 0 ? (
              <span className="text-slate-500">Aucune.</span>
            ) : (
              a.current.missions.map((m) => (
                <span key={m.key} className="flex justify-between text-slate-300">
                  {m.name} <span className="font-mono text-slate-400">{m.endTime > a.now ? formatDuration((m.endTime - a.now) / 1000) : "terminée"}</span>
                </span>
              ))
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Chantiers, recherches, flottes</p>
            {a.current.buildings.map((b) => (
              <span key={b.id} className="flex justify-between text-slate-300">
                Bâtiment {b.id} <span className="font-mono text-slate-400">{formatDuration(Math.max(0, b.endTime - a.now) / 1000)}</span>
              </span>
            ))}
            {a.current.research.map((r) => (
              <span key={r.id} className="flex justify-between text-slate-300">
                Recherche {r.id} <span className="font-mono text-slate-400">{formatDuration(Math.max(0, r.endTime - a.now) / 1000)}</span>
              </span>
            ))}
            {a.current.unitQueues > 0 && <span className="text-slate-300">{a.current.unitQueues} lot(s) d'unités en production</span>}
            {a.current.fleets.map((f) => (
              <span key={f.id} className="flex justify-between text-slate-300">
                Flotte {f.mission} → {f.targetPseudo || "?"} <span className="font-mono text-slate-400">{f.status}</span>
              </span>
            ))}
            {!a.current.buildings.length && !a.current.research.length && !a.current.unitQueues && !a.current.fleets.length && <span className="text-slate-500">Rien.</span>}
          </div>
        </div>
      </HudPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel icon={<Swords />} title="Adversaires (7 jours)" tone="danger">
          {a.pairs.length === 0 ? (
            <span className="text-xs text-slate-500">Aucun combat.</span>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-1">Adversaire</th>
                  <th className="py-1 text-right">Attaques</th>
                  <th className="py-1 text-right">Défenses</th>
                  <th className="py-1 text-right">XP</th>
                </tr>
              </thead>
              <tbody>
                {a.pairs.map((x) => (
                  <tr key={x.uid} className="border-t border-slate-800">
                    <td className="py-1 text-slate-300">{x.pseudo}</td>
                    <td className="py-1 text-right font-mono">{x.attacks}</td>
                    <td className="py-1 text-right font-mono">{x.defenses}</td>
                    <td className="py-1 text-right font-mono text-slate-200">{signed(x.xp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </HudPanel>
        <HudPanel icon={<Swords />} title={`Derniers combats (${a.battleCount})`} tone="danger">
          <ul className="flex max-h-[300px] flex-col gap-1 overflow-y-auto text-xs">
            {a.battles.slice(0, 40).map((b) => {
              const mine = b.attackerUid === p.uid;
              return (
                <li key={b.id} className="flex items-baseline gap-2">
                  <span className="w-24 shrink-0 font-mono text-[10px] text-slate-500">{parisTime(b.timestamp)}</span>
                  <span className="min-w-0 flex-1 text-slate-300">
                    {mine ? `attaque ${b.defenderPseudo}` : `défend contre ${b.attackerPseudo}`} · {b.outcome === "attacker_win" ? (mine ? "victoire" : "défaite") : b.outcome === "defender_win" ? (mine ? "défaite" : "victoire") : "nul"}
                  </span>
                  <span className="font-mono text-slate-200">{signed(mine ? b.attackerXpDelta : b.defenderXpDelta)}</span>
                </li>
              );
            })}
            {a.battles.length === 0 && <li className="text-slate-500">Aucun.</li>}
          </ul>
        </HudPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel icon={<Store />} title={`Marché (7 j) · ${a.trades.length}`} tone="gold">
          <ul className="flex max-h-[220px] flex-col gap-1 overflow-y-auto text-xs text-slate-300">
            {a.trades.map((t) => (
              <li key={t.id}>
                <span className="font-mono text-[10px] text-slate-500">{parisTime(t.filledAtMs)}</span> {t.sellerPseudo} → {t.buyerPseudo || "?"} : <span className="font-mono">{formatNumber(t.giveAmount)}</span> {t.giveRes} contre <span className="font-mono">{formatNumber(t.wantAmount)}</span> {t.wantRes}
              </li>
            ))}
            {a.trades.length === 0 && <li className="text-slate-500">Aucun échange.</li>}
          </ul>
        </HudPanel>
        <HudPanel icon={<Gift />} title={`Cadeaux (7 j) · ${a.gifts.length}`} tone="gold">
          <ul className="flex max-h-[220px] flex-col gap-1 overflow-y-auto text-xs text-slate-300">
            {a.gifts.map((g) => (
              <li key={g.id}>
                <span className="font-mono text-[10px] text-slate-500">{parisTime(g.timestamp)}</span> {g.fromPseudo} → {g.toPseudo} :{" "}
                <span className="font-mono">{Object.entries(g.resources ?? {}).map(([k, v]) => `${formatNumber(v)} ${k}`).join(", ")}</span>
              </li>
            ))}
            {a.gifts.length === 0 && <li className="text-slate-500">Aucun cadeau.</li>}
          </ul>
        </HudPanel>
        <HudPanel icon={<ShieldAlert />} title={`Actions de l'équipe · ${a.adminLogs.length}`} tone="violet">
          <ul className="flex max-h-[220px] flex-col gap-1 overflow-y-auto text-xs text-slate-300">
            {a.adminLogs.map((l) => (
              <li key={l.id}>
                <span className="font-mono text-[10px] text-slate-500">{parisTime(l.createdAtMs)}</span> {l.actorName} · {l.action}
                {l.reason ? ` · « ${l.reason} »` : ""}
              </li>
            ))}
            {a.adminLogs.length === 0 && <li className="text-slate-500">Aucune.</li>}
          </ul>
        </HudPanel>
      </div>

      <HudPanel icon={<History />} title="Chronologie (7 jours, 200 derniers événements)" tone="neutral">
        <ul className="flex max-h-[420px] flex-col gap-1 overflow-y-auto text-xs">
          {a.timeline.map((n, i) => (
            <li key={`${n.createdAtMs}-${i}`} className="flex items-baseline gap-2">
              <span className="w-24 shrink-0 font-mono text-[10px] text-slate-500">{parisTime(n.createdAtMs)}</span>
              <span className="min-w-0 flex-1 text-slate-300">
                <span className="text-slate-100">{n.title}</span> · {n.message}
              </span>
              {n.xp !== 0 && (
                <span className="shrink-0 font-mono" style={{ color: SOURCE_TONE[n.source] }}>
                  {signed(n.xp)}
                </span>
              )}
            </li>
          ))}
          {a.timeline.length === 0 && <li className="text-slate-500">Aucun événement.</li>}
        </ul>
      </HudPanel>

      <HudPanel icon={<ListChecks />} title="Statistiques du joueur" tone="neutral">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(a.stats)
            .filter(([, v]) => typeof v === "number")
            .sort(([x], [y]) => x.localeCompare(y))
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-slate-800 py-0.5">
                <dt className="truncate text-slate-500">{k}</dt>
                <dd className="font-mono text-slate-200">{k.endsWith("AtMs") ? parisTime(v as number) : formatNumber(v as number)}</dd>
              </div>
            ))}
          <div className="flex justify-between gap-2 border-b border-slate-800 py-0.5">
            <dt className="text-slate-500">succès</dt>
            <dd className="font-mono text-slate-200">{p.achievements}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-slate-800 py-0.5">
            <dt className="text-slate-500">temps de jeu</dt>
            <dd className="font-mono text-slate-200">{formatDuration(p.playtimeSeconds)}</dd>
          </div>
        </dl>
      </HudPanel>
    </div>
  );
}

/** 5.17.2 : deux joueurs côte à côte (indicateurs, sources d'XP, rythme, signaux). */
function PlayerCompareView({ pair, onBack, onOpen }: { pair: [string, string]; onBack: () => void; onOpen: (q: string) => void }) {
  const [audits, setAudits] = useState<[PlayerAudit, PlayerAudit] | null>(null);
  const [error, setError] = useState("");
  const [win, setWin] = useState<AuditWindow>("24h");

  const load = useCallback(async () => {
    try {
      const [x, y] = await Promise.all([fetchPlayerAudit(pair[0]), fetchPlayerAudit(pair[1])]);
      setAudits([x, y]);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }, [pair]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Tous les joueurs
      </Button>
      {AUDIT_WINDOWS.map((w) => (
        <Button key={w.id} size="sm" variant={w.id === win ? "primary" : "outline"} onClick={() => setWin(w.id)}>
          {w.label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => void load()}>
        <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
      </Button>
      {audits && (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void navigator.clipboard.writeText(JSON.stringify({ a: audits[0], b: audits[1] }, null, 1)).then(
              () => toast.success("Comparaison copiée"),
              () => toast.error("Copie impossible"),
            )
          }
        >
          <Copy className="mr-1 h-3.5 w-3.5" /> Copier (JSON)
        </Button>
      )}
    </div>
  );
  if (error || !audits) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {error ? (
          <EmptyState icon={<Search />} title="Comparaison impossible">
            {error}
          </EmptyState>
        ) : (
          <SkeletonCards count={3} />
        )}
      </div>
    );
  }
  const shown = (a: PlayerAudit) => a.windows[win].best ?? (a.windows[win].ledger.total !== 0 ? a.windows[win].ledger : a.windows[win].rebuilt);
  const days = (a: PlayerAudit) => Math.max(1, (a.now - a.player.createdAtMs) / 86_400_000);
  const rows: { label: string; get: (a: PlayerAudit) => number; fmt?: (n: number) => string }[] = [
    { label: "XP totale", get: (a) => a.player.xp },
    { label: "XP de saison", get: (a) => a.player.seasonXp },
    { label: "XP par jour depuis l'inscription", get: (a) => Math.round(a.player.xp / days(a)) },
    { label: `XP gagnée (${AUDIT_WINDOWS.find((w) => w.id === win)?.label.toLowerCase()})`, get: (a) => shown(a).total },
    ...(Object.keys(XP_SOURCE_LABELS) as XpSource[]).map((src) => ({ label: `· ${XP_SOURCE_LABELS[src]}`, get: (a: PlayerAudit) => shown(a).bySource[src] ?? 0 })),
    { label: "Part du plafond des missions", get: (a) => Math.round(((shown(a).bySource.mission ?? 0) / Math.max(1, a.windows[win].missionCeiling)) * 100), fmt: (n) => `${n} %` },
    { label: "Heures actives sur 24 h", get: (a) => a.activity.activeHours24h },
    { label: "Plus longue série (7 j, heures)", get: (a) => a.activity.longestStreak7d },
    { label: "Combats (7 j)", get: (a) => a.battleCount },
    { label: "Victoires (total)", get: (a) => a.player.victories },
    { label: "Défaites (total)", get: (a) => a.player.defeats },
    { label: "Missions terminées (total)", get: (a) => Number(a.stats.missions) || 0 },
    { label: "Record de missions en un jour", get: (a) => Number(a.stats.bestMissionDay) || 0 },
    { label: "Expéditions", get: (a) => Number(a.stats.expeditions) || 0 },
    { label: "Primes", get: (a) => Number(a.stats.bounties) || 0 },
    { label: "Succès débloqués", get: (a) => a.player.achievements },
    { label: "Jours joués (60 derniers)", get: (a) => a.player.activeDays },
    { label: "Temps de jeu (heures)", get: (a) => Math.round(a.player.playtimeSeconds / 3600) },
    { label: "Échanges au marché (7 j)", get: (a) => a.trades.length },
    { label: "Cadeaux (7 j)", get: (a) => a.gifts.length },
    { label: "Actions de l'équipe", get: (a) => a.adminLogs.length },
  ];
  const [x, y] = audits;
  const mutual = x.battles.filter((b) => (b.attackerUid === y.player.uid || b.defenderUid === y.player.uid)).length;
  const startHour = Math.floor(x.now / 3600_000) - 23;
  const hourLabel = (h: number) => formatDateTime(h * 3600_000, "hour", "server");

  return (
    <div className="flex flex-col gap-4">
      {header}
      <div className="grid gap-4 md:grid-cols-2">
        {audits.map((a) => (
          <HudPanel
            key={a.player.uid}
            icon={<ShieldAlert />}
            title={a.player.pseudo}
            tone={a.flags.some((f) => f.severity === "high") ? "danger" : a.flags.length ? "gold" : "mint"}
            aside={
              <Button size="sm" variant="ghost" onClick={() => onOpen(a.player.uid)}>
                Audit complet
              </Button>
            }
          >
            <div className="flex flex-wrap gap-1">
              <HudChip size="sm" tone={a.player.online ? "mint" : "neutral"}>
                {a.player.online ? "en ligne" : `vu ${a.player.lastActiveMs ? timeAgo(a.player.lastActiveMs) : "jamais"}`}
              </HudChip>
              {a.player.testMode && (
                <HudChip size="sm" tone="danger">
                  compte test
                </HudChip>
              )}
            </div>
            <SourceBar totals={shown(a)} />
            <SourceLegend totals={shown(a)} />
            {a.flags.length === 0 ? (
              <span className="text-xs text-mint-glow">Aucun signal.</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {a.flags.map((f) => (
                  <li key={f.id} className="flex items-start gap-2 text-xs">
                    <HudChip size="sm" tone={SEVERITY_TONE[f.severity]}>
                      {SEVERITY_LABEL[f.severity]}
                    </HudChip>
                    <span className="min-w-0 text-slate-300" title={f.detail}>
                      {f.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Bars values={a.activity.byHour24} tone="var(--color-mint-glow)" height={36} labelEvery={6} labelOf={(i) => hourLabel(startHour + i)} />
          </HudPanel>
        ))}
      </div>

      <HudPanel icon={<GitCompare />} title="Comparaison chiffrée" tone="accent" aside={mutual > 0 ? <HudChip size="sm" tone="gold">{mutual} combat(s) entre eux sur 7 j</HudChip> : undefined}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="py-1.5 pr-2">Indicateur</th>
                <th className="py-1.5 pr-2 text-right">{x.player.pseudo}</th>
                <th className="py-1.5 pr-2 text-right">{y.player.pseudo}</th>
                <th className="py-1.5 text-right">Rapport</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const vx = r.get(x);
                const vy = r.get(y);
                const fmt = r.fmt ?? ((n: number) => formatNumber(n));
                const ratio = vy !== 0 ? vx / vy : vx !== 0 ? Infinity : 1;
                const far = ratio >= 3 || ratio <= 1 / 3;
                return (
                  <tr key={r.label} className="border-t border-slate-800">
                    <td className="py-1 pr-2 text-slate-400">{r.label}</td>
                    <td className={cn("py-1 pr-2 text-right font-mono", vx > vy ? "text-slate-100" : "text-slate-400")}>{fmt(vx)}</td>
                    <td className={cn("py-1 pr-2 text-right font-mono", vy > vx ? "text-slate-100" : "text-slate-400")}>{fmt(vy)}</td>
                    <td className={cn("py-1 text-right font-mono", far ? "text-gold-glow" : "text-slate-500")}>
                      {vx === 0 && vy === 0 ? "—" : !Number.isFinite(ratio) ? "∞" : `×${formatDecimal(ratio, 1)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500">« Rapport » = joueur 1 ÷ joueur 2 ; en or quand l'écart dépasse ×3.</p>
      </HudPanel>
    </div>
  );
}
