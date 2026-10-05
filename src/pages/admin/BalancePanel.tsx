import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AmberBudgetCard } from "@/pages/admin/AmberBudgetCard";
import { NumberInput } from "@/components/ui/number-input";
import { useSearchParams } from "react-router-dom";
import { AlertOctagon, AlertTriangle, ArrowRight, Info, RefreshCw, Scale, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HUD_TONE, HudTag, StatTile } from "@/components/ui/hud";
import { COMBAT_KINDS } from "@/game/balance/combatTypes";
import { adminBalance } from "@/services/adminService";
import { BalanceHistory } from "@/pages/admin/BalanceHistory";
import { allProposals, placeValue, type LiveBalance, type Proposal, type Severity } from "@/game/balance/diagnostics";
import { commonPerHour, empireProfile, extractorCurve, missionTable, techProfile, unitMetrics, unitTable, type UnitMetrics } from "@/game/balance/analysis";
import { findUnit, UNITS } from "@/game/units";
import { UNIT_AUDIT_RULES, UNIT_CLASS_LABELS, unitBalanceAudit } from "@/game/unitClasses";
import { cn, formatCompact, timeAgo } from "@/lib/utils";

/* v5.4 : outil d'équilibrage. Analyse du contenu actuel (code + personnalisation),
   données réelles des joueurs (serveur) et propositions chiffrées, plus un bac à
   sable pour essayer un réglage d'unité avant de le saisir dans l'onglet Unités. */

const SEVERITY: Record<Severity, { label: string; icon: typeof Info; tone: "danger" | "gold" | "accent"; border: string }> = {
  critical: { label: "Critique", icon: AlertOctagon, tone: "danger", border: "border-danger-glow/50" },
  warning: { label: "À revoir", icon: AlertTriangle, tone: "gold", border: "border-gold-glow/40" },
  info: { label: "Info", icon: Info, tone: "accent", border: "border-cyan-glow/25" },
};

/** Onglet de l'administration correspondant à « where ». */
const TAB_OF: Record<string, string> = { Unités: "units", Missions: "missions", Factions: "factions", Seigneurs: "warlords", Technologies: "technologies", Bâtiments: "buildings" };
function tabOf(where: string): string | null {
  if (where.startsWith("Règles")) return "rules";
  return TAB_OF[where] ?? null;
}

const f = (n: number) => (Number.isFinite(n) ? formatCompact(Math.round(n)) : "∞");

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="hud-title text-sm text-slate-100">{title}</h3>
        <div className="ml-auto">{aside}</div>
      </div>
      {children}
    </Card>
  );
}

/** 5.18 : audit des unités d'après le combat en tours (valeur = √(ATK × PV)), par coût et par place. */
function CombatUnitAudit() {
  const rows = useMemo(() => unitBalanceAudit(UNITS), []);
  const ratio = (v: number) => (
    <span className={cn("font-mono", v >= UNIT_AUDIT_RULES.strongAbove ? "text-gold-glow" : v < UNIT_AUDIT_RULES.weakBelow ? "text-danger-glow" : "text-slate-300")}>×{v.toFixed(2)}</span>
  );
  const flagged = rows.filter((r) => r.flag).length;
  return (
    <Section
      title="Unités au combat en tours — valeur √(ATK × PV), niveau max"
      aside={<span className="text-[11px] text-slate-500">{flagged ? `${flagged} unité${flagged > 1 ? "s" : ""} à revoir` : "aucune unité hors norme"} · ×1 = médiane de la catégorie</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-xs">
          <thead className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="py-1.5 pr-3 font-normal">Unité</th>
              <th className="py-1.5 pr-3 font-normal">Classe</th>
              <th className="py-1.5 pr-3 text-right font-normal">Valeur niv. 1</th>
              <th className="py-1.5 pr-3 text-right font-normal">Niv. max</th>
              <th className="py-1.5 pr-3 text-right font-normal">/ 1 000 res.</th>
              <th className="py-1.5 pr-3 text-right font-normal">/ place</th>
              <th className="py-1.5 font-normal">Diagnostic</th>
            </tr>
          </thead>
          <tbody>
            {(["attack", "defense"] as const).flatMap((cat) =>
              rows
                .filter((r) => r.category === cat)
                .sort((a, b) => a.valueMax - b.valueMax)
                .map((r) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="py-1.5 pr-3 text-slate-200">
                      {r.name} <span className="text-slate-500">· {cat === "attack" ? "flotte" : "défense"}</span>
                    </td>
                    <td className="py-1.5 pr-3">
                      <HudTag tone={r.cls === "heavy" ? "gold" : r.cls === "medium" ? "accent" : "mint"}>{UNIT_CLASS_LABELS[r.cls]}</HudTag>
                    </td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-300">{formatCompact(r.value)}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-300">{formatCompact(r.valueMax)}</td>
                    <td className="py-1.5 pr-3 text-right">
                      <span className="font-mono text-slate-400">{formatCompact(r.perK)}</span> {ratio(r.perKRatio)}
                    </td>
                    <td className="py-1.5 pr-3 text-right">
                      <span className="font-mono text-slate-400">{formatCompact(r.perSlot)}</span> {ratio(r.perSlotRatio)}
                    </td>
                    <td className={cn("py-1.5", r.flag === "strong" ? "text-gold-glow" : r.flag === "weak" ? "text-danger-glow" : "text-slate-500")}>{r.note || "Dans la norme."}</td>
                  </tr>
                )),
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        Au combat en tours, deux armées s'usent l'une l'autre : doubler l'attaque ou doubler les points de vie se valent, d'où √(ATK × PV). Signalée « trop forte » au-delà de ×{UNIT_AUDIT_RULES.strongAbove} par coût ET par place (×{UNIT_AUDIT_RULES.endgameStrongAbove} pour les unités lourdes de fin de partie), « piège » en deçà de ×{UNIT_AUDIT_RULES.weakBelow} sur les deux. Le bonus des Traqueurs contre les PNJ n'est pas compté.
      </p>
    </Section>
  );
}

function ProposalCard({ p }: { p: Proposal }) {
  const [, setParams] = useSearchParams();
  const s = SEVERITY[p.severity];
  const tab = tabOf(p.where);
  return (
    <div className={cn("flex gap-3 border bg-space-950/40 p-3", s.border)}>
      <s.icon className={cn("mt-0.5 h-4 w-4 shrink-0", p.severity === "critical" ? "text-danger-glow" : p.severity === "warning" ? "text-gold-glow" : "text-cyan-glow")} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <HudTag tone={s.tone}>{s.label}</HudTag>
          <HudTag tone="accent">{p.area}</HudTag>
        </div>
        <p className="text-sm text-slate-200">{p.finding}</p>
        <p className="flex items-start gap-1.5 text-sm text-mint-glow">
          <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {p.proposal}
        </p>
        <p className="text-[11px] text-slate-500">
          Où : {p.where}
          {tab && (
            <button type="button" className="ml-2 inline-flex items-center gap-0.5 text-cyan-glow hover:underline" onClick={() => setParams({ onglet: tab }, { replace: true })}>
              ouvrir <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

/** Bac à sable : essaie un réglage d'unité et compare à la médiane de sa catégorie. */
function UnitSandbox({ unit, table, live }: { unit: UnitMetrics; table: UnitMetrics[]; live: LiveBalance | null }) {
  const def = findUnit(unit.id)!;
  const [places, setPlaces] = useState(def.hangarSpace);
  const [scrap, setScrap] = useState(def.cost.scrap);
  const [energy, setEnergy] = useState(def.cost.energy);
  const [atk, setAtk] = useState(def.stats.attaque);
  const [dfs, setDfs] = useState(def.stats.defense);
  useEffect(() => {
    setPlaces(def.hangarSpace);
    setScrap(def.cost.scrap);
    setEnergy(def.cost.energy);
    setAtk(def.stats.attaque);
    setDfs(def.stats.defense);
  }, [def]);
  const tried = unitMetrics({ ...def, hangarSpace: Math.max(1, places), cost: { scrap, energy }, stats: { ...def.stats, attaque: atk, defense: dfs } }, def.maxLevel, techProfile(1));
  const peers = table.filter((u) => u.category === unit.category && u.id !== "cargo");
  const sorted = peers.map(placeValue).sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const ratio = med > 0 ? placeValue(tried) / med : 0;
  const owned = live?.unitPlaces.find((u) => u.id === unit.id);
  const freed = owned && places !== def.hangarSpace ? Math.round(owned.places * (1 - places / def.hangarSpace)) : 0;
  const num = (label: string, value: number, set: (n: number) => void) => (
    <label className="flex flex-col gap-0.5 text-[11px] text-slate-400">
      {label}
      <NumberInput size="sm" decimals={2} value={value} onChange={set} aria-label={label} className="w-32" />
    </label>
  );
  return (
    <div className="flex flex-col gap-2 border border-violet-glow/30 bg-violet-glow/[0.04] p-3">
      <p className="text-xs text-slate-300">
        Bac à sable — <strong className="text-slate-100">{unit.name}</strong> (niveau {def.maxLevel}, technologies au maximum). Rien n'est enregistré : reporte les valeurs dans l'onglet Unités.
      </p>
      <div className="flex flex-wrap gap-3">
        {num("Places", places, setPlaces)}
        {num("Ferraille", scrap, setScrap)}
        {num("Énergie", energy, setEnergy)}
        {num("ATK de base", atk, setAtk)}
        {num("DEF de base", dfs, setDfs)}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
        <span>
          Par place : <strong className="text-slate-100">{f(placeValue(tried))}</strong> <span className="text-slate-500">(avant {f(placeValue(unit))}, médiane {f(med)})</span>
        </span>
        <span className={ratio < 0.55 ? "text-danger-glow" : ratio > 1.8 ? "text-gold-glow" : "text-mint-glow"}>{ratio < 0.55 ? "piège" : ratio > 1.8 ? "trop forte" : "dans la norme"} ({ratio.toFixed(2)} × médiane)</span>
        <span>
          Par 1 000 ressources : <strong className="text-slate-100">{tried.powerPer1k.toFixed(0)}</strong>
        </span>
        <span>
          Entretien : <strong className="text-slate-100">{f(tried.upkeepPerHour)}</strong>/h
        </span>
        {freed !== 0 && <span className="text-cyan-glow">{freed > 0 ? `${f(freed)} places libérées` : `${f(-freed)} places en plus`} chez les joueurs</span>}
      </div>
    </div>
  );
}

function Bar({ used, cap }: { used: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 bg-white/[0.06]">
        <div className={cn("h-full", pct >= 90 ? "bg-ember-glow" : "bg-cyan-glow/70")} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("font-mono text-[10px]", used > cap ? "text-danger-glow" : "text-slate-400")}>{Math.round(cap > 0 ? (used / cap) * 100 : 0)} %</span>
    </div>
  );
}

export function BalancePanel() {
  const [live, setLive] = useState<LiveBalance | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const load = async () => {
    setBusy(true);
    try {
      setLive(await adminBalance());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const table = useMemo(() => unitTable("max", techProfile(1)), []);
  const proposals = useMemo(() => allProposals(live), [live]);
  const counts = { critical: 0, warning: 0, info: 0 } as Record<Severity, number>;
  proposals.forEach((p) => counts[p.severity]++);
  const flagged = new Set(proposals.filter((p) => p.area === "Unités" || p.area === "Défenses").map((p) => p.id.replace(/^(trap|dominated|overpowered|trap-used)-/, "")));
  const placesOf = new Map(live?.unitPlaces.map((u) => [u.id, u]) ?? []);
  const pickedUnit = table.find((u) => u.id === picked) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Scale className="h-5 w-5 text-cyan-glow" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-100">
            {counts.critical} critique{counts.critical > 1 ? "s" : ""} · {counts.warning} à revoir · {counts.info} info{counts.info > 1 ? "s" : ""}
          </p>
          <p className="text-[11px] text-slate-500">
            Contenu actuel (personnalisation de l'admin comprise) + données réelles {live ? `de ${live.activePlayers} joueurs actifs (14 j), ${timeAgo(live.generatedAt)}` : error ? "indisponibles" : "en chargement…"}.
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void load()}>
          <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> Actualiser
        </Button>
      </Card>

      <AmberBudgetCard />

      <Section title="Propositions">
        {proposals.length === 0 ? <p className="text-sm text-mint-glow">Aucun déséquilibre détecté.</p> : proposals.map((p) => <ProposalCard key={p.id} p={p} />)}
      </Section>

      {live && (
        <Section title="Historique quotidien">
          <BalanceHistory history={live.history ?? []} onSnapshot={() => void load()} />
        </Section>
      )}

      <CombatUnitAudit />

      <Section title="Unités — niveau max, technologies au maximum" aside={<span className="text-[11px] text-slate-500">Clique une ligne pour l'essayer dans le bac à sable</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-xs">
            <thead className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="py-1">Unité</th>
                <th>Places</th>
                <th>Coût</th>
                <th>ATK/place</th>
                <th>ATK+DEF/place</th>
                <th>Puissance/1 k</th>
                <th>Entretien/h</th>
                <th>Places occupées (joueurs)</th>
              </tr>
            </thead>
            <tbody>
              {table.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setPicked(picked === u.id ? null : u.id)}
                  className={cn("cursor-pointer border-t border-white/5 hover:bg-white/[0.03]", flagged.has(u.id) && "bg-danger-glow/[0.06]", picked === u.id && "bg-violet-glow/[0.08]")}
                >
                  <td className="py-1.5 text-slate-200">
                    {u.name} <span className="text-[10px] text-slate-500">{u.category === "attack" ? "flotte" : "défense"}</span>
                  </td>
                  <td className="font-mono">{u.places}</td>
                  <td className="font-mono">{f(u.cost)}</td>
                  <td className={cn("font-mono", u.category === "attack" && "text-slate-100")}>{f(u.attackPerPlace)}</td>
                  <td className={cn("font-mono", u.category === "defense" && "text-slate-100")}>{f(u.powerPerPlace)}</td>
                  <td className="font-mono">{u.powerPer1k.toFixed(0)}</td>
                  <td className="font-mono">{f(u.upkeepPerHour)}</td>
                  <td className="font-mono text-slate-400">{placesOf.get(u.id) ? `${f(placesOf.get(u.id)!.places)} · ${placesOf.get(u.id)!.owners} j.` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pickedUnit && <UnitSandbox unit={pickedUnit} table={table} live={live} />}
      </Section>

      {live && (
        <Section title="Joueurs actifs — puissance et hangars" aside={<span className="text-[11px] text-slate-500">Bonus officiers, reliques et talents compris</span>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-xs">
              <thead className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="py-1">Joueur</th>
                  <th>Attaque</th>
                  <th>Défense</th>
                  <th>Bouclier</th>
                  <th>Bonus DEF</th>
                  <th>Hangar attaque</th>
                  <th>Hangar défense</th>
                  <th>Production/h</th>
                  <th>Alertes</th>
                </tr>
              </thead>
              <tbody>
                {live.players.map((p) => (
                  <tr key={p.pseudo} className="border-t border-white/5">
                    <td className="py-1.5 text-slate-200">{p.pseudo}</td>
                    <td className="font-mono text-slate-100">{f(p.attack)}</td>
                    <td className="font-mono text-slate-100">{f(p.defense)}</td>
                    <td className="font-mono">{p.shieldPct} %</td>
                    <td className="font-mono">{p.defenseBonusPct} %</td>
                    <td>
                      <Bar used={p.attackPlacesUsed} cap={p.attackPlaces} />
                    </td>
                    <td>
                      <Bar used={p.defensePlacesUsed} cap={p.defensePlaces} />
                    </td>
                    <td className="font-mono">{f(p.productionPerHour)}</td>
                    <td className="text-[10px]">
                      {p.outage && <HudTag tone="danger">panne</HudTag>} {p.fullStorage > 0 && <HudTag tone="gold">{p.fullStorage} plein{p.fullStorage > 1 ? "s" : ""}</HudTag>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {live?.v516 && (
        <Section title="Nouveautés 5.16 — sur les joueurs actifs" aside={<span className="text-[11px] text-slate-500">Les propositions de réglage apparaissent dans la liste plus haut</span>}>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatTile
              size="sm"
              tone="accent"
              label="Expéditions profondes"
              value={<span className="font-mono">{live.v516.expeditions.deepPct} %</span>}
              sub={`${f(live.v516.expeditions.deep)} sur ${f(live.v516.expeditions.total)} · ${f(live.v516.expeditions.deepAmbushLost)} embuscades perdues`}
            />
            <StatTile
              size="sm"
              tone="ember"
              label="Traités en cours"
              value={<span className="font-mono">{f(live.v516.treaties.pact + live.v516.treaties.escort + live.v516.treaties.embargo)}</span>}
              sub={`péage ${live.v516.treaties.pact} · escorte ${live.v516.treaties.escort} · embargo ${live.v516.treaties.embargo} · ${live.v516.treaties.players} joueur(s)`}
            />
            <StatTile
              size="sm"
              tone="mint"
              label="Rattrapage actif"
              value={<span className="font-mono">{live.v516.catchup.boosted}</span>}
              sub={`${live.v516.catchup.boostedPct} % des actifs · moyenne +${live.v516.catchup.avgBonusPct} % · max +${live.v516.catchup.maxBonusPct} %`}
            />
            <StatTile
              size="sm"
              tone="gold"
              label="Plafond de jetons atteint"
              value={<span className="font-mono">{live.v516.lootTokens.capped}</span>}
              sub={`${live.v516.lootTokens.cappedPct} % des actifs · moyenne ${live.v516.lootTokens.avgThisWeek} / ${live.v516.lootTokens.cap} cette semaine`}
            />
          </div>
          <p className="text-xs text-slate-500">Mutateur du mois : {live.v516.mutator ? <strong className="text-slate-300">{live.v516.mutator.name}</strong> : "aucun"}.</p>
        </Section>
      )}

      {live?.combatTypes && (
        <Section title="Victoires du joueur par type de combat" aside={<span className="font-mono text-[11px] text-slate-500">depuis la 5.19 · {timeAgo(live.combatTypes.sinceMs)}</span>}>
          <ul className="flex flex-col gap-2.5">
            {live.combatTypes.kinds.map((k) => {
              const def = COMBAT_KINDS[k.kind];
              const tone = k.status === "ok" ? "mint" : k.status === "none" ? "neutral" : "ember";
              return (
                <li key={k.kind} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[16rem_minmax(0,1fr)_7rem]">
                  <span className="truncate text-sm text-slate-200">{def.label}</span>
                  <span className="text-right font-mono text-xs sm:order-last" style={{ color: HUD_TONE[tone] }}>
                    {k.playerWinPct === null ? "—" : `${k.playerWinPct} %`} <span className="text-slate-500">/ {k.battles}</span>
                  </span>
                  <div className="relative col-span-2 h-2 bg-white/[0.06] sm:col-span-1" title={`Cible ${def.target[0]}–${def.target[1]} %`}>
                    <i className="absolute inset-y-0 block bg-mint-glow/20" style={{ left: `${def.target[0]}%`, width: `${def.target[1] - def.target[0]}%` }} />
                    {k.playerWinPct !== null && <i className="absolute -top-0.5 block h-3 w-0.5" style={{ left: `calc(${k.playerWinPct}% - 1px)`, background: HUD_TONE[tone] }} />}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-slate-500">
            Bande verte : fourchette visée. Le pourcentage est celui du joueur (attaquant pour le JcJ, les primes, les repaires et les attaques de seigneurs ; défenseur pour les raids et les répliques). Affiché à partir de 5 combats ; une proposition de réglage apparaît à partir de 10.
          </p>
        </Section>
      )}

      {live && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title="Combats (30 jours)">
            <ul className="flex flex-col gap-1 text-sm text-slate-300">
              <li>
                Joueur contre joueur : <strong className="text-slate-100">{live.pvp.battles}</strong> combats, l'attaquant gagne <strong className="font-mono text-slate-100">{live.pvp.attackerWinPct} %</strong> <span className="text-slate-500">(alerte hors 40–65 %)</span>
              </li>
              <li>
                Seigneurs de guerre : <strong className="text-slate-100">{live.warlordBattles.battles}</strong> combats, l'attaquant gagne <strong className="text-slate-100">{live.warlordBattles.attackerWinPct} %</strong>
              </li>
              <li>
                Meilleure attaque : <strong className="text-slate-100">{f(live.bestAttack)}</strong> · meilleure défense : <strong className="text-slate-100">{f(live.bestDefense)}</strong>
              </li>
            </ul>
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="py-1">Faction</th>
                  <th>Raids repoussés</th>
                  <th>Repaires ouverts / pris</th>
                </tr>
              </thead>
              <tbody>
                {live.factions.map((x) => (
                  <tr key={x.id} className="border-t border-white/5">
                    <td className="py-1 text-slate-200">{x.name}</td>
                    <td className="font-mono">{x.raidsWon + x.raidsLost > 0 ? `${x.repelledPct} % de ${x.raidsWon + x.raidsLost}` : "—"}</td>
                    <td className="font-mono">
                      {x.lairsOpen} / {x.lairsTaken}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Seigneurs de guerre — puissance">
            <ul className="flex flex-col gap-1 text-xs">
              {live.warlords.map((w) => (
                <li key={w.pseudo} className="flex items-center gap-2">
                  <span className="w-48 truncate text-slate-300">{w.pseudo}</span>
                  <div className="h-1.5 flex-1 bg-white/[0.06]">
                    <div className={cn("h-full", w.power > 2.5 * live.bestDefense ? "bg-danger-glow" : "bg-violet-glow/70")} style={{ width: `${Math.min(100, (w.power / Math.max(1, live.warlords[0]?.power ?? 1)) * 100)}%` }} />
                  </div>
                  <span className="w-16 text-right font-mono text-slate-200">{f(w.power)}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500">Rouge : plus de 2,5 × la meilleure défense de joueur ({f(live.bestDefense)}).</p>
          </Section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Extracteurs — amortissement (technologies au maximum)">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="py-1">Niveau</th>
                <th>Coût</th>
                <th>Gain/h</th>
                <th>Remboursé en</th>
              </tr>
            </thead>
            <tbody>
              {extractorCurve("extracteur_ferraille", techProfile(1)).map((s) => (
                <tr key={s.level} className="border-t border-white/5">
                  <td className="py-0.5 font-mono">{s.level}</td>
                  <td className="font-mono">{f(s.cost)}</td>
                  <td className="font-mono">{f(s.gainPerHour)}</td>
                  <td className={cn("font-mono", s.paybackHours > 150 ? "text-danger-glow" : s.paybackHours > 48 ? "text-gold-glow" : "text-slate-300")}>{s.paybackHours < 1 ? "< 1 h" : `${Math.round(s.paybackHours)} h`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Missions — heures de production gagnées par heure">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="py-1">Mission</th>
                <th>Début</th>
                <th>Milieu</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const stages = [empireProfile(5, 0.3), empireProfile(10, 0.6), empireProfile(18, 1)].map(missionTable);
                return stages[0].map((m, i) => (
                  <tr key={m.key} className="border-t border-white/5">
                    <td className="py-0.5 text-slate-300">{m.name}</td>
                    {stages.map((s, k) => (
                      <td key={k} className={cn("font-mono", s[i].productionHoursPerHour < 0.05 ? "text-slate-500" : "text-slate-200")}>
                        {s[i].productionHoursPerHour.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500">
            Production commune de référence : {f(commonPerHour(empireProfile(5, 0.3)))}/h (début), {f(commonPerHour(empireProfile(10, 0.6)))}/h (milieu), {f(commonPerHour(empireProfile(18, 1)))}/h (fin). Les missions rares se jugent en ressources rares, pas en heures de production commune.
          </p>
        </Section>
      </div>
    </div>
  );
}
