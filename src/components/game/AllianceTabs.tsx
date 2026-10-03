import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Eye, FlaskConical, Landmark, ShieldAlert, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Progress } from "@/components/ui/progress";
import { SpyReportView } from "@/components/game/SpyModal";
import { RESOURCE_LIST } from "@/game/resources";
import { ALLIANCE_RULES, allianceProjectCost, allianceProjectProgress, allianceProjectSeconds, allianceResearchCost, allianceResearchSeconds, projectState } from "@/game/alliances";
import { SPY_TIER_LABELS } from "@/game/espionage";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import {
  AllianceError,
  depositToTreasury,
  distributeTreasury,
  fetchAllianceIntel,
  fundAllianceProject,
  startAllianceResearch,
  subscribeAllianceLogs,
  type IntelItem,
} from "@/services/allianceService";
import { cn, formatCompact, formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import type { Alliance, AllianceLog, ResourceId } from "@/types/game";
import { EmojiIcon, ResourceIcon } from "@/components/ui/game-icon";

type Amounts = Partial<Record<ResourceId, number>>;

function AmountsForm({ value, onChange, max }: { value: Amounts; onChange: (v: Amounts) => void; max?: (res: ResourceId) => number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {RESOURCE_LIST.map((r) => (
        <label key={r.id} className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>
            <ResourceIcon id={r.id} /> {r.name}
            {max && <span className="ml-1 text-slate-600">(max {formatCompact(max(r.id))})</span>}
          </span>
          <NumberInput size="sm" stepper={false} value={value[r.id] ?? 0} max={max ? Math.max(0, max(r.id)) : undefined} onChange={(v) => onChange({ ...value, [r.id]: v })} aria-label={r.name} className="w-full" />
        </label>
      ))}
    </div>
  );
}

function clean(a: Amounts): Amounts {
  return Object.fromEntries(Object.entries(a).filter(([, v]) => (v ?? 0) > 0)) as Amounts;
}

const LOG_LABEL: Record<AllianceLog["kind"], string> = {
  deposit: "a déposé",
  distribute: "a versé à",
  research: "a lancé la recherche",
  "research-done": "Recherche terminée :",
  project: "a financé",
  "project-done": "Projet achevé :",
  join: "a rejoint l'alliance",
  leave: "a quitté l'alliance",
  kick: "a exclu",
};

/** Montants avec les vraies icônes de ressources. */
function AmountsText({ res }: { res: Amounts | null | undefined }) {
  const entries = Object.entries(res ?? {}).filter(([, v]) => (v ?? 0) > 0);
  return (
    <>
      {entries.map(([k, v], i) => (
        <span key={k} className="whitespace-nowrap">
          {i > 0 && " · "}
          <ResourceIcon id={k} /> {formatCompact(v ?? 0)}
        </span>
      ))}
    </>
  );
}

/** Trésor : stock, dépôt, versements (fondateur et officiers) et journal. */
export function TreasuryTab({ alliance, uid, canDistribute }: { alliance: Alliance; uid: string; canDistribute: boolean }) {
  const player = usePlayerStore((s) => s.player);
  const [dep, setDep] = useState<Amounts>({});
  const [dist, setDist] = useState<Amounts>({});
  const [target, setTarget] = useState(uid);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<AllianceLog[]>([]);
  useEffect(() => subscribeAllianceLogs(alliance.id, setLogs), [alliance.id]);
  const treasury = alliance.treasury ?? {};
  const today = new Date().toISOString().slice(0, 10);
  const usedToday = alliance.distributions?.day === today ? alliance.distributions.count : 0;

  const run = async (fn: () => Promise<void>, ok: string, reset: () => void) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      reset();
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Opération impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="flex flex-col gap-3 p-4">
        <h3 className="flex items-center gap-2 font-display text-sm text-white">
          <Landmark className="h-4 w-4 text-gold-glow" /> Trésor de l'alliance
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          {RESOURCE_LIST.map((r) => (
            <p key={r.id} className="flex justify-between gap-2">
              <ResourceIcon id={r.id} className="h-5 w-5" />
              <span className="tabular-mono text-slate-200">{formatCompact(treasury[r.id] ?? 0)}</span>
            </p>
          ))}
        </div>
        <div className="border-t border-white/5 pt-3">
          <p className="mb-2 text-xs text-slate-400">Déposer (depuis tes stocks)</p>
          <AmountsForm value={dep} onChange={setDep} max={(res) => Math.floor(player?.resources[res] ?? 0)} />
          <Button className="mt-2" size="sm" disabled={busy || Object.keys(clean(dep)).length === 0} onClick={() => void run(() => depositToTreasury(clean(dep)), "Dépôt effectué.", () => setDep({}))}>
            Déposer
          </Button>
        </div>
        {canDistribute && (
          <div className="border-t border-white/5 pt-3">
            <p className="mb-2 text-xs text-slate-400">
              Verser à un membre : au plus {Math.round(ALLIANCE_RULES.distributionMaxPct * 100)} % du stock par ressource, {ALLIANCE_RULES.distributionsPerDay} versements par jour
              ({usedToday} aujourd'hui).
            </p>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mb-2 h-9 w-full rounded-lg border border-white/10 bg-space-800/70 px-2 text-sm text-slate-100"
            >
              {alliance.members.map((m) => (
                <option key={m} value={m}>
                  {alliance.memberPseudos[m] ?? m}
                </option>
              ))}
            </select>
            <AmountsForm value={dist} onChange={setDist} max={(res) => Math.floor((treasury[res] ?? 0) * ALLIANCE_RULES.distributionMaxPct)} />
            <Button
              className="mt-2"
              size="sm"
              variant="outline"
              disabled={busy || Object.keys(clean(dist)).length === 0 || usedToday >= ALLIANCE_RULES.distributionsPerDay}
              onClick={() => void run(() => distributeTreasury(target, clean(dist)), "Versement effectué.", () => setDist({}))}
            >
              Verser
            </Button>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-sm text-white">Journal du trésor</h3>
        {logs.length === 0 && <p className="text-xs text-slate-500">Rien pour l'instant.</p>}
        <ul className="max-h-[28rem] space-y-1.5 overflow-y-auto text-xs">
          {logs.map((l) => (
            <li key={l.id} className="text-slate-300">
              <span className="text-slate-500">{timeAgo(l.createdAtMs)} · </span>
              {l.actorPseudo && <strong className="text-slate-100">{l.actorPseudo} </strong>}
              {LOG_LABEL[l.kind] ?? l.kind} {l.targetPseudo && <strong className="text-slate-100">{l.targetPseudo} </strong>}
              {l.text && <span>{l.text} </span>}
              {l.resources && <span className="text-slate-400"><AmountsText res={l.resources} /></span>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/** Recherches d'alliance, financées par le trésor. */
export function ResearchTab({ alliance, canStart }: { alliance: Alliance; canStart: boolean }) {
  useNowTicker();
  const [busy, setBusy] = useState(false);
  const active = alliance.activeResearch;
  const treasury = alliance.treasury ?? {};

  const start = async (id: string) => {
    setBusy(true);
    try {
      await startAllianceResearch(id);
      toast.success("Recherche d'alliance lancée !");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Lancement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ALLIANCE_RULES.researches.map((r) => {
        const level = alliance.research?.[r.id] ?? 0;
        const next = level + 1;
        const maxed = level >= r.maxLevel;
        const cost = allianceResearchCost(next);
        const affordable = Object.entries(cost).every(([res, v]) => (treasury[res as ResourceId] ?? 0) >= (v ?? 0));
        const running = active?.id === r.id;
        const pct = r.perLevel < 1 ? `${Math.round(r.perLevel * 100)} %` : `${r.perLevel}`;
        return (
          <Card key={r.id} className={cn("flex flex-col gap-2 p-4", running && "border-cyan-glow/50")}>
            <div className="flex items-center gap-2">
              <EmojiIcon emoji={r.emoji} className="h-7 w-7" />
              <h3 className="flex-1 font-display text-sm text-white">{r.name}</h3>
              <span className="tabular-mono text-xs text-slate-400">
                niv. {level} / {r.maxLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {r.description} ({r.id === "logistique" ? "−" : "+"}
              {pct} par niveau)
            </p>
            {running && active ? (
              <div>
                <p className="text-xs text-cyan-glow">
                  Niveau {active.level} en cours — fin dans {formatDuration(Math.max(0, (active.endTime - Date.now()) / 1000))}
                </p>
                <Progress value={100 - ((active.endTime - Date.now()) / (allianceResearchSeconds(active.level) * 1000)) * 100} className="mt-1" />
              </div>
            ) : maxed ? (
              <p className="text-xs text-mint-glow">Niveau maximum atteint.</p>
            ) : (
              <>
                <p className="text-[11px] text-slate-500">
                  Niveau {next} : <AmountsText res={cost} /> · {formatDuration(allianceResearchSeconds(next))}
                </p>
                {canStart && (
                  <Button size="sm" variant="outline" className="self-start" disabled={busy || !!active || !affordable} onClick={() => void start(r.id)}>
                    <FlaskConical className="mr-1 h-3.5 w-3.5" />
                    {active ? "Une recherche est en cours" : affordable ? "Lancer" : "Trésor insuffisant"}
                  </Button>
                )}
              </>
            )}
          </Card>
        );
      })}
      <p className="text-xs text-slate-500 md:col-span-2">
        Les bonus s'appliquent à tous les membres et se perdent en quittant l'alliance. Seuls le fondateur et les officiers lancent les recherches.
      </p>
    </div>
  );
}

/** Projets d'alliance (v3.3) : méga-structures financées par le trésor ou
 *  par les dons directs des membres. */
export function ProjectsTab({ alliance, canUseTreasury }: { alliance: Alliance; canUseTreasury: boolean }) {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [open, setOpen] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Amounts>({});
  const [busy, setBusy] = useState(false);
  const treasury = alliance.treasury ?? {};
  const contributors = Object.entries(alliance.projectContributors ?? {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const fund = async (projectId: string, source: "treasury" | "self", values: Amounts) => {
    setBusy(true);
    try {
      await fundAllianceProject(projectId, source, clean(values));
      toast.success(source === "treasury" ? "Trésor versé au projet." : "Merci pour ta contribution !");
      setAmounts({});
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Versement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        {ALLIANCE_RULES.projects.map((p) => {
          const st = projectState(alliance, p.id);
          const next = st.level + 1;
          const maxed = st.level >= p.maxLevel;
          const cost = allianceProjectCost(next);
          const missing = Object.fromEntries((Object.entries(cost) as [ResourceId, number][]).map(([r, n]) => [r, Math.max(0, n - (st.funded[r] ?? 0))])) as Amounts;
          const progress = allianceProjectProgress(cost, st.funded);
          const fromTreasury = Object.fromEntries((Object.entries(missing) as [ResourceId, number][]).map(([r, n]) => [r, Math.min(n, Math.floor(treasury[r] ?? 0))])) as Amounts;
          const pct = Math.round(p.perLevel * 100);
          return (
            <Card key={p.id} className={cn("flex flex-col gap-3 p-4", st.buildEndMs > 0 && "border-cyan-glow/50")}>
              <div className="flex items-center gap-2">
                <EmojiIcon emoji={p.emoji} className="h-8 w-8" />
                <div className="flex-1">
                  <h3 className="font-display text-sm text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400">
                    {p.description} ({p.id === "forge" ? "−" : "+"}
                    {pct} % par palier, {p.id === "forge" ? "−" : "+"}
                    {pct * st.level} % aujourd'hui)
                  </p>
                </div>
                <span className="tabular-mono text-xs text-slate-400">
                  palier {st.level} / {p.maxLevel}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: p.maxLevel }, (_, i) => (
                  <i key={i} className={cn("h-1.5 flex-1", i < st.level ? "bg-gold-glow" : i === st.level && st.buildEndMs > 0 ? "animate-pulse bg-cyan-glow" : "bg-white/10")} />
                ))}
              </div>
              {maxed ? (
                <p className="text-xs text-mint-glow">Projet achevé : le bonus maximal s'applique à tous les membres.</p>
              ) : st.buildEndMs > 0 ? (
                <div>
                  <p className="text-xs text-cyan-glow">Palier {next} en construction — fin dans {formatDuration(Math.max(0, (st.buildEndMs - Date.now()) / 1000))}</p>
                  <Progress value={100 - ((st.buildEndMs - Date.now()) / (allianceProjectSeconds(next) * 1000)) * 100} className="mt-1" />
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Palier {next} : financement · construction {formatDuration(allianceProjectSeconds(next))}</span>
                      <span className="tabular-mono" title="En valeur : une ressource rare compte pour 100 communes.">{Math.floor(progress * 100)} %</span>
                    </div>
                    <Progress value={progress * 100} className="mt-1" />
                    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
                      {(Object.entries(cost) as [ResourceId, number][]).map(([r, n]) => {
                        const got = Math.min(n, st.funded[r] ?? 0);
                        return (
                          <li key={r} className="min-w-0" title={`${formatNumber(got)} / ${formatNumber(n)}`}>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <ResourceIcon id={r} className="h-3.5 w-3.5" />
                              <span className={cn("tabular-mono", got >= n ? "text-mint-glow" : "text-slate-300")}>{formatCompact(got)}</span>
                              <span className="tabular-mono text-slate-600">/ {formatCompact(n)}</span>
                            </span>
                            <i className="mt-0.5 block h-1 bg-white/10">
                              <i className={cn("block h-full", got >= n ? "bg-mint-glow" : "bg-gold-glow")} style={{ width: `${(got / Math.max(1, n)) * 100}%` }} />
                            </i>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-1.5 text-[11px] text-slate-500">Reste : <AmountsText res={missing} /></p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setOpen(open === p.id ? null : p.id)}>
                      <Building2 className="mr-1 h-3.5 w-3.5" /> Contribuer
                    </Button>
                    {canUseTreasury && (
                      <Button size="sm" variant="outline" disabled={busy || Object.keys(clean(fromTreasury)).length === 0} onClick={() => void fund(p.id, "treasury", fromTreasury)}>
                        <Landmark className="mr-1 h-3.5 w-3.5" /> Verser depuis le trésor
                      </Button>
                    )}
                  </div>
                  {open === p.id && (
                    <div className="border-t border-white/5 pt-3">
                      <AmountsForm value={amounts} onChange={setAmounts} max={(res) => Math.min(missing[res] ?? 0, Math.floor(player?.resources[res] ?? 0))} />
                      <Button className="mt-2" size="sm" disabled={busy || Object.keys(clean(amounts)).length === 0} onClick={() => void fund(p.id, "self", amounts)}>
                        Verser depuis mes stocks
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}
        <p className="text-xs text-slate-500">
          Chaque palier financé se construit en {ALLIANCE_RULES.projectHoursPerLevel} h × son numéro. Les bonus s'appliquent à tous les membres et se perdent en quittant l'alliance. Tout membre
          peut contribuer depuis ses stocks ; seuls le fondateur et les officiers puisent dans le trésor.
        </p>
      </div>
      <Card className="flex h-fit flex-col gap-2 p-4">
        <h3 className="font-display text-sm text-white">Bâtisseurs</h3>
        {contributors.length === 0 && <p className="text-xs text-slate-500">Aucune contribution personnelle pour l'instant.</p>}
        <ol className="space-y-1 text-sm">
          {contributors.map(([uid, value], i) => (
            <li key={uid} className="flex justify-between gap-2">
              <span className="truncate text-slate-200">
                <span className="text-slate-500">#{i + 1}</span> {alliance.memberPseudos[uid] ?? "Ancien membre"}
              </span>
              <span className="tabular-mono text-xs text-slate-400">{formatCompact(value)}</span>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-slate-500">Valeur versée (une ressource rare compte pour 100).</p>
      </Card>
    </div>
  );
}

/** Rapports d'espionnage et de combat récents des membres. */
export function IntelTab() {
  const [items, setItems] = useState<IntelItem[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    fetchAllianceIntel()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  if (items === null) return <p className="text-sm text-slate-500">Chargement…</p>;
  return (
    <Card className="divide-y divide-white/5">
      {items.length === 0 && (
        <p className="p-4 text-sm text-slate-500">Aucun rapport des {ALLIANCE_RULES.sharedReportsDays} derniers jours chez les membres.</p>
      )}
      {items.map((it) =>
        it.type === "spy" ? (
          <div key={it.id} className="p-3">
            <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === it.id ? null : it.id)}>
              <Eye className="h-4 w-4 shrink-0 text-cyan-glow" />
              <span className="flex-1 text-sm text-slate-200">
                {it.spyPseudo} → {it.targetPseudo ?? "?"} <span className="text-xs text-slate-500">· {SPY_TIER_LABELS[it.tier ?? 0]}</span>
                {it.detected && <ShieldAlert className="ml-1 inline h-3.5 w-3.5 text-danger-glow" />}
              </span>
              <span className="tabular-mono text-xs text-slate-500">{timeAgo(it.timestamp)}</span>
            </button>
            {open === it.id && (
              <div className="mt-3">
                <SpyReportView report={it} />
              </div>
            )}
          </div>
        ) : (
          <div key={it.id} className="flex items-center gap-3 p-3">
            <Swords className="h-4 w-4 shrink-0 text-ember-glow" />
            <span className="flex-1 text-sm text-slate-200">
              {it.attackerPseudo} ⚔ {it.defenderPseudo}
              <span className="ml-2 text-xs text-slate-500">
                {it.outcome === "attacker_win" ? "victoire de l'attaquant" : it.outcome === "defender_win" ? "attaque repoussée" : "match nul"}
                {it.garrisons && it.garrisons.length > 0 && ` · ${it.garrisons.length} garnison(s)`}
                {Object.values(it.loot ?? {}).some((v) => (v ?? 0) > 0) && ` · butin ${formatNumber(Object.values(it.loot ?? {}).reduce((a: number, b) => a + (b ?? 0), 0))}`}
              </span>
            </span>
            <span className="tabular-mono text-xs text-slate-500">{timeAgo(it.timestamp)}</span>
          </div>
        ),
      )}
    </Card>
  );
}
