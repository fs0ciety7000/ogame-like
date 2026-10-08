import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { amberWeeksFromHistory, type BalanceSnapshot } from "@/game/balance/history";
import { BALANCE_HEALTH_RULES } from "@/game/balance/healthRules";
import { AMBER_SOURCE_LABELS, AMBER_SOURCES } from "@/game/healthTrace";
import { pvpAttackBand } from "@/game/balance/diagnostics";
import { COMBAT_KINDS, type CombatKind } from "@/game/balance/combatTypes";
import { adminBalanceSnapshot } from "@/services/adminService";
import { formatCompact } from "@/lib/utils";

/* v5.5 : historique d'équilibrage en petits multiples (une série par
   graphique, une seule échelle), survol avec réticule et infobulle,
   zone cible en fond, tableau des chiffres en dessous. */

interface Series {
  id: string;
  title: string;
  hint: string;
  unit: "%" | "" | "×";
  points: (number | null)[];
  band?: [number, number];
  ref?: number;
  floor0?: boolean;
}

const fmt = (v: number, unit: Series["unit"]) => (unit === "%" ? `${Math.round(v)} %` : unit === "×" ? `×${v.toFixed(1).replace(".", ",")}` : formatCompact(Math.round(v)));
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

function rolling(h: BalanceSnapshot[], i: number, days: number, num: (s: BalanceSnapshot) => number, den: (s: BalanceSnapshot) => number, min: number): number | null {
  const slice = h.slice(Math.max(0, i - days + 1), i + 1);
  const d = slice.reduce((a, s) => a + den(s), 0);
  return d >= min ? (slice.reduce((a, s) => a + num(s), 0) / d) * 100 : null;
}

export function buildSeries(h: BalanceSnapshot[]): Series[] {
  return [
    {
      id: "pvp",
      title: "JcJ : victoires de l'attaquant",
      hint: `7 jours glissants, au moins 10 combats ; zone cible ${pvpAttackBand().low}–${pvpAttackBand().high} %`,
      unit: "%",
      points: h.map((_, i) => rolling(h, i, 7, (s) => s.pvpAttackerWins, (s) => s.pvpBattles, 10)),
      band: [pvpAttackBand().low, pvpAttackBand().high],
    },
    {
      id: "raids",
      title: "Raids de faction repoussés",
      hint: "7 jours glissants ; zone cible 55–80 %",
      unit: "%",
      points: h.map((s, i) => {
        const b = h[Math.max(0, i - 7)];
        const won = s.raidsWon - b.raidsWon;
        const lost = s.raidsLost - b.raidsLost;
        return i > 0 && won + lost > 0 ? (won / (won + lost)) * 100 : null;
      }),
      band: [55, 80],
    },
    // 5.21 : victoires du joueur par type de combat (photos depuis la 5.21).
    ...(["bounty", "lair", "warlord"] as CombatKind[]).map((k) => ({
      id: `kind-${k}`,
      title: `${COMBAT_KINDS[k].label} : victoires`,
      hint: `7 jours glissants, au moins 5 combats ; zone cible ${COMBAT_KINDS[k].target[0]}–${COMBAT_KINDS[k].target[1]} %`,
      unit: "%" as const,
      points: h.map((_, i) => rolling(h, i, 7, (s) => s.kinds?.[k]?.[1] ?? 0, (s) => s.kinds?.[k]?.[0] ?? 0, 5)),
      band: COMBAT_KINDS[k].target,
    })),
    { id: "lairs", title: "Repaires pris (cumul)", hint: "joueurs actifs", unit: "", points: h.map((s) => s.lairsTaken), floor0: true },
    { id: "hangar", title: "Hangars d'attaque remplis (moyenne)", hint: "100 % = hangars pleins", unit: "%", points: h.map((s) => s.avgHangarAttack * 100), ref: 100, floor0: true },
    { id: "prod", title: "Production médiane par heure", hint: "toutes ressources, joueurs actifs", unit: "", points: h.map((s) => s.medianProduction), floor0: true },
    // 6.5.1 (lot U) : courbes des relevés de la santé de l'équilibre (photos depuis la 6.0.1).
    { id: "pillable", title: "Stock pillable (médiane, en heures)", hint: "heures de production exposées au pillage", unit: "", points: h.map((s) => s.pillableHours ?? null), floor0: true },
    { id: "loot", title: "Butin moyen par attaque JcJ réussie", hint: "7 jours glissants", unit: "", points: h.map((s) => s.avgLoot ?? null), floor0: true },
    { id: "pass", title: "Joueurs au dernier palier du passe", hint: "cible : 50 % en fin de mois, pas avant le 15", unit: "%", points: h.map((s) => s.passFinishedPct ?? null), ref: 50, floor0: true },
    { id: "ach", title: "Succès obtenus par le joueur médian", hint: "part du catalogue ; une hausse rapide annonce un manque d'objectifs longs", unit: "%", points: h.map((s) => s.achievementsPct ?? null), floor0: true },
    { id: "slots", title: "Joueurs à court d'emplacements de flotte", hint: "au-delà de 20 %, envisager des emplacements à débloquer (O.2)", unit: "%", points: h.map((s) => s.fullSlotsPct ?? null), ref: 20, floor0: true },
    { id: "routes", title: "Routes de colonies", hint: "toutes routes ; le ravitaillement est dans le tableau", unit: "", points: h.map((s) => s.routes ?? null), floor0: true },
    // 6.14.107 (AE-L4) : santé complétée (photos depuis la 6.14.107 ; seuils dans Admin → Règles).
    { id: "amber", title: "Ambre gagnée la semaine passée (actifs)", hint: "toutes sources ; le détail par source est sous les courbes", unit: "", points: h.map((s) => s.amberTotal ?? null), floor0: true },
    {
      id: "bossHours",
      title: "Boss : heures avant la mort (médiane)",
      hint: `56 jours, boss abattus ; zone cible ${BALANCE_HEALTH_RULES.bossKillHoursLow}–${BALANCE_HEALTH_RULES.bossKillHoursHigh} h`,
      unit: "",
      points: h.map((s) => s.bossKillHours ?? null),
      band: [BALANCE_HEALTH_RULES.bossKillHoursLow, BALANCE_HEALTH_RULES.bossKillHoursHigh],
      floor0: true,
    },
    {
      id: "ascension",
      title: "Jour médian de la 1re Ascension",
      hint: `jours après l'inscription ; zone cible J${BALANCE_HEALTH_RULES.ascensionDayLow}–J${BALANCE_HEALTH_RULES.ascensionDayHigh}`,
      unit: "",
      points: h.map((s) => s.ascensionDay ?? null),
      band: [BALANCE_HEALTH_RULES.ascensionDayLow, BALANCE_HEALTH_RULES.ascensionDayHigh],
      floor0: true,
    },
    { id: "lost", title: "Production perdue, entrepôt plein (médiane)", hint: `au-delà de ${Math.round(BALANCE_HEALTH_RULES.productionLostPct * 100)} %, trop-plein (AE-5)`, unit: "%", points: h.map((s) => s.productionLostPct ?? null), ref: BALANCE_HEALTH_RULES.productionLostPct * 100, floor0: true },
    {
      id: "spread",
      title: "Écart de production Q3 ÷ Q1",
      hint: `au-delà de ×${String(BALANCE_HEALTH_RULES.productionSpreadRatio).replace(".", ",")}, effet boule de neige (AE-15)`,
      unit: "×",
      points: h.map((s) => (s.productionQ1 && s.productionQ3 ? s.productionQ3 / s.productionQ1 : null)),
      ref: BALANCE_HEALTH_RULES.productionSpreadRatio,
      floor0: true,
    },
    { id: "chest", title: "Coffres du 7e jour tout au plancher", hint: "Q267 : coffre coupé à la place libre de l'entrepôt", unit: "%", points: h.map((s) => s.chestFloorPct ?? null), ref: BALANCE_HEALTH_RULES.chestFloorPct * 100, floor0: true },
    { id: "exchange", title: "Actifs au plafond du comptoir", hint: "Q268 : semaine en cours au moment de la photo", unit: "%", points: h.map((s) => s.exchangeAtCapPct ?? null), ref: BALANCE_HEALTH_RULES.exchangeCapPlayersPct * 100, floor0: true },
    {
      id: "warlord",
      title: "Seigneur le plus fort ÷ meilleure défense",
      hint: "au-delà de ×2,5, hors d'atteinte",
      unit: "×",
      points: h.map((s) => (s.bestDefense > 0 ? s.topWarlord / s.bestDefense : null)),
      ref: 2.5,
      floor0: true,
    },
  ];
}

const W = 320;
const H = 120;
const PAD = { l: 8, r: 8, t: 10, b: 18 };

function LineChart({ s, days }: { s: Series; days: string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const vals = s.points.filter((v): v is number => v !== null);
  if (vals.length === 0) return <p className="flex h-[120px] items-center justify-center text-xs text-slate-500">Pas encore assez de données.</p>;
  const extra = [...(s.band ?? []), ...(s.ref !== undefined ? [s.ref] : [])];
  let lo = Math.min(...vals, ...extra);
  let hi = Math.max(...vals, ...extra);
  if (s.floor0) lo = Math.min(0, lo);
  if (hi === lo) hi = lo + 1;
  const span = hi - lo;
  hi += span * 0.08;
  const x = (i: number) => PAD.l + (days.length > 1 ? (i / (days.length - 1)) * (W - PAD.l - PAD.r) : (W - PAD.l - PAD.r) / 2);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  // Segments : une valeur manquante coupe la ligne.
  const segments: string[] = [];
  let cur = "";
  s.points.forEach((v, i) => {
    if (v === null) {
      if (cur) segments.push(cur);
      cur = "";
    } else cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (cur) segments.push(cur);
  const last = [...s.points].reverse().find((v) => v !== null) ?? null;
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((rel - PAD.l) / (W - PAD.l - PAD.r)) * (days.length - 1));
    setHover(Math.max(0, Math.min(days.length - 1, i)));
  };
  const hv = hover !== null ? s.points[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[120px] w-full touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`${s.title} : dernière valeur ${last === null ? "—" : fmt(last, s.unit)}`}>
        {s.band && <rect x={PAD.l} width={W - PAD.l - PAD.r} y={y(s.band[1])} height={Math.max(0, y(s.band[0]) - y(s.band[1]))} fill="color-mix(in srgb, var(--color-mint-glow) 8%, transparent)" />}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="color-mix(in srgb,var(--color-slate-100) 12%,transparent)" strokeWidth={1} />
        {s.ref !== undefined && <line x1={PAD.l} x2={W - PAD.r} y1={y(s.ref)} y2={y(s.ref)} stroke="color-mix(in srgb, var(--color-ember-glow) 60%, transparent)" strokeWidth={1} strokeDasharray="3 3" />}
        {segments.map((d, k) => (
          <path key={k} d={d} fill="none" stroke="var(--color-cyan-glow)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {s.points.map((v, i) => (v !== null && (days.length <= 31 || i === s.points.length - 1) ? <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4 : 2.5} fill="var(--color-cyan-glow)" stroke="var(--color-space-950)" strokeWidth={2} /> : null))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="color-mix(in srgb,var(--color-slate-100) 35%,transparent)" strokeWidth={1} />}
        <text x={PAD.l} y={H - 4} fontSize={9} fill="color-mix(in srgb,var(--color-slate-400) 90%,transparent)">
          {shortDay(days[0])}
        </text>
        <text x={W - PAD.r} y={H - 4} fontSize={9} fill="color-mix(in srgb,var(--color-slate-400) 90%,transparent)" textAnchor="end">
          {shortDay(days[days.length - 1])}
        </text>
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 border border-white/15 bg-space-950/95 px-2 py-1 text-[11px] text-slate-200" style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 40px), calc(100% - 90px))` }}>
          <span className="text-slate-400">{shortDay(days[hover])}</span> · <span className="font-mono">{hv === null ? "—" : fmt(hv, s.unit)}</span>
        </div>
      )}
    </div>
  );
}

export function BalanceHistory({ history, onSnapshot }: { history: BalanceSnapshot[]; onSnapshot: () => void }) {
  const series = useMemo(() => buildSeries(history), [history]);
  const days = history.map((s) => s.day);
  const [busy, setBusy] = useState(false);
  const snap = async () => {
    setBusy(true);
    try {
      await adminBalanceSnapshot();
      toast.success("Photo du jour enregistrée.");
      onSnapshot();
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>
          {history.length} jour(s) d'historique · une photo chaque jour à 3 h 11 (UTC), gardée 180 jours.
        </span>
        <Button size="sm" variant="ghost" className="ml-auto" disabled={busy} onClick={() => void snap()}>
          <Camera className="mr-1 h-3.5 w-3.5" /> Photo maintenant
        </Button>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune photo pour l'instant : la première sera prise cette nuit (ou maintenant avec le bouton).</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {series.map((s) => {
              const last = [...s.points].reverse().find((v) => v !== null) ?? null;
              return (
                <div key={s.id} className="flex flex-col gap-1 border border-white/10 p-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-xs text-slate-200">{s.title}</p>
                    <span className="ml-auto font-mono text-sm text-slate-100">{last === null ? "—" : fmt(last, s.unit)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{s.hint}</p>
                  <LineChart s={s} days={days} />
                </div>
              );
            })}
          </div>
          <AmberWeeksTable history={history} />
          <details className="text-xs text-slate-400">
            <summary className="cursor-pointer">Voir les chiffres</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1 pr-3 font-normal">Jour</th>
                    <th className="py-1 pr-3 font-normal">Actifs</th>
                    <th className="py-1 pr-3 font-normal">JcJ (gagnés / combats)</th>
                    <th className="py-1 pr-3 font-normal">Raids repoussés / perdus (cumul)</th>
                    <th className="py-1 pr-3 font-normal">Repaires</th>
                    <th className="py-1 pr-3 font-normal">Hangars</th>
                    <th className="py-1 pr-3 font-normal">Prod. médiane / h</th>
                    <th className="py-1 pr-3 font-normal">Bonus domicile</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-200">
                  {[...history].reverse().map((s) => (
                    <tr key={s.day} className="border-t border-white/5">
                      <td className="py-1 pr-3">{s.day}</td>
                      <td>{s.activePlayers}</td>
                      <td>
                        {s.pvpAttackerWins} / {s.pvpBattles}
                      </td>
                      <td>
                        {s.raidsWon} / {s.raidsLost}
                      </td>
                      <td>{s.lairsTaken}</td>
                      <td>{Math.round(s.avgHangarAttack * 100)} %</td>
                      <td>{formatCompact(s.medianProduction)}</td>
                      <td>{s.homeDefenseBonus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

/** 6.14.107 (AE-L4, AE-11) : Ambre gagnée par semaine et par source (une ligne par semaine, d'après les photos). */
function AmberWeeksTable({ history }: { history: BalanceSnapshot[] }) {
  const weeks = useMemo(() => amberWeeksFromHistory(history), [history]);
  if (weeks.length === 0) return null;
  const sources = AMBER_SOURCES.filter((k) => weeks.some((w) => (w.bySource[k] ?? 0) > 0));
  return (
    <details className="text-xs text-slate-400">
      <summary className="cursor-pointer">Ambre par semaine et par source ({weeks.length} semaine{weeks.length > 1 ? "s" : ""})</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1 pr-3 font-normal">Semaine du</th>
              <th className="py-1 pr-3 font-normal">Total</th>
              {sources.map((k) => (
                <th key={k} className="py-1 pr-3 font-normal">
                  {AMBER_SOURCE_LABELS[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums text-slate-200">
            {weeks.map((w) => (
              <tr key={w.week} className="border-t border-white/5">
                <td className="py-1 pr-3">{w.week}</td>
                <td className="pr-3">{formatCompact(w.total)}</td>
                {sources.map((k) => (
                  <td key={k} className="pr-3">
                    {w.total > 0 ? `${Math.round(((w.bySource[k] ?? 0) / w.total) * 100)} %` : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
