import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, FlaskConical, Landmark, ShieldAlert, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SpyReportView } from "@/components/game/SpyModal";
import { RESOURCE_LIST } from "@/game/resources";
import { ALLIANCE_RULES, allianceResearchCost, allianceResearchSeconds } from "@/game/alliances";
import { SPY_TIER_LABELS } from "@/game/espionage";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import {
  AllianceError,
  depositToTreasury,
  distributeTreasury,
  fetchAllianceIntel,
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
          <Input
            type="number"
            min={0}
            value={value[r.id] ?? ""}
            onChange={(e) => onChange({ ...value, [r.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
          />
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
  join: "a rejoint l'alliance",
  leave: "a quitté l'alliance",
  kick: "a exclu",
};

function amountsText(res: Amounts | null | undefined): string {
  return Object.entries(res ?? {})
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${RESOURCE_LIST.find((r) => r.id === k)?.emoji ?? k} ${formatCompact(v ?? 0)}`)
    .join(" · ");
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
              {l.resources && <span className="text-slate-400">{amountsText(l.resources)}</span>}
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
                  Niveau {next} : {amountsText(cost)} · {formatDuration(allianceResearchSeconds(next))}
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
