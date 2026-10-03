import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertOctagon, AlertTriangle, ArrowRight, Info, RefreshCw, Scale, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudTag } from "@/components/ui/hud";
import { adminBalance } from "@/services/adminService";
import { allProposals, placeValue, type LiveBalance, type Proposal, type Severity } from "@/game/balance/diagnostics";
import { commonPerHour, empireProfile, extractorCurve, missionTable, techProfile, unitMetrics, unitTable, type UnitMetrics } from "@/game/balance/analysis";
import { findUnit } from "@/game/units";
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
        <h3 className="hud-title text-sm text-white">{title}</h3>
        <div className="ml-auto">{aside}</div>
      </div>
      {children}
    </Card>
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
      <input type="number" value={value} min={0} onChange={(e) => set(Number(e.target.value) || 0)} className="h-8 w-24 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-white outline-none focus:border-cyan-glow/60" />
    </label>
  );
  return (
    <div className="flex flex-col gap-2 border border-violet-glow/30 bg-violet-glow/[0.04] p-3">
      <p className="text-xs text-slate-300">
        Bac à sable — <strong className="text-white">{unit.name}</strong> (niveau {def.maxLevel}, technologies au maximum). Rien n'est enregistré : reporte les valeurs dans l'onglet Unités.
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
          Par place : <strong className="text-white">{f(placeValue(tried))}</strong> <span className="text-slate-500">(avant {f(placeValue(unit))}, médiane {f(med)})</span>
        </span>
        <span className={ratio < 0.55 ? "text-danger-glow" : ratio > 1.8 ? "text-gold-glow" : "text-mint-glow"}>{ratio < 0.55 ? "piège" : ratio > 1.8 ? "trop forte" : "dans la norme"} ({ratio.toFixed(2)} × médiane)</span>
        <span>
          Par 1 000 ressources : <strong className="text-white">{tried.powerPer1k.toFixed(0)}</strong>
        </span>
        <span>
          Entretien : <strong className="text-white">{f(tried.upkeepPerHour)}</strong>/h
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
          <p className="text-sm text-white">
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

      <Section title="Propositions">
        {proposals.length === 0 ? <p className="text-sm text-mint-glow">Aucun déséquilibre détecté.</p> : proposals.map((p) => <ProposalCard key={p.id} p={p} />)}
      </Section>

      <Section title="Unités — niveau max, technologies au maximum" aside={<span className="text-[11px] text-slate-500">Clique une ligne pour l'essayer dans le bac à sable</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
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
                  <td className={cn("font-mono", u.category === "attack" && "text-white")}>{f(u.attackPerPlace)}</td>
                  <td className={cn("font-mono", u.category === "defense" && "text-white")}>{f(u.powerPerPlace)}</td>
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
              <thead className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
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
                    <td className="font-mono text-white">{f(p.attack)}</td>
                    <td className="font-mono text-white">{f(p.defense)}</td>
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

      {live && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Combats (30 jours)">
            <ul className="flex flex-col gap-1 text-sm text-slate-300">
              <li>
                Joueur contre joueur : <strong className="text-white">{live.pvp.battles}</strong> combats, l'attaquant gagne <strong className="text-white">{live.pvp.attackerWinPct} %</strong> <span className="text-slate-500">(cible 45–65 %)</span>
              </li>
              <li>
                Seigneurs de guerre : <strong className="text-white">{live.warlordBattles.battles}</strong> combats, l'attaquant gagne <strong className="text-white">{live.warlordBattles.attackerWinPct} %</strong>
              </li>
              <li>
                Meilleure attaque : <strong className="text-white">{f(live.bestAttack)}</strong> · meilleure défense : <strong className="text-white">{f(live.bestDefense)}</strong>
              </li>
            </ul>
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Extracteurs — amortissement (technologies au maximum)">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
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
            <thead className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
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
