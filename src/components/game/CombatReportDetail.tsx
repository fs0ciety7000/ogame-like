import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crosshair, Pause, Play, RotateCcw, Shield, Sparkles, Swords, Wrench } from "lucide-react";
import { HUD_TONE, HudCallout, HudTag } from "@/components/ui/hud";
import { findUnit } from "@/game/units";
import { UNIT_CLASS_LABELS } from "@/game/unitClasses";
import { COMBAT_RULES } from "@/game/combat";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import type { CombatLog, CombatLogUnit } from "@/types/game";

/* =====================================================
   5.21.1 : rapport de combat détaillé. Un curseur de tours (lecture
   automatique, pas à pas) pilote l'état de chaque type d'unité des deux
   camps : intactes, détruites, coques abîmées, dégâts infligés. Courbe
   des points de vie, faits marquants et bilan complet en dessous.
===================================================== */

type Side = "attacker" | "defender";
const ROUND_MS = 600;
const GROUP_LABEL: Record<CombatLogUnit["group"], string> = { fleet: "Flotte", defense: "Défenses", home: "Vaisseaux à quai", garrison: "Garnisons alliées" };

const pct = (v: number) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)} %`;

/** Courbe des PV des deux camps, tour par tour, avec le tour courant marqué. */
function HpChart({ log, mine, round }: { log: CombatLog; mine: Side; round: number }) {
  const W = 300;
  const H = 70;
  const n = log.rounds.length;
  const x = (k: number) => (n > 0 ? (k / n) * (W - 8) + 4 : 4);
  const y = (v: number) => 4 + (1 - Math.max(0, Math.min(1, v))) * (H - 8);
  const series = (side: Side) => [1, ...log.rounds.map((r) => (side === "attacker" ? r.attackerHp : r.defenderHp))];
  const path = (vs: number[]) => vs.map((v, k) => `${k ? "L" : "M"}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const theirs: Side = mine === "attacker" ? "defender" : "attacker";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-full" role="img" aria-label="Points de vie restants de chaque camp, tour par tour">
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={4} x2={W - 4} y1={y(g)} y2={y(g)} stroke="currentColor" className="text-white/5" />
      ))}
      <line x1={4} x2={W - 4} y1={y(COMBAT_RULES.attackerWinBelow)} y2={y(COMBAT_RULES.attackerWinBelow)} stroke={HUD_TONE.ember} strokeDasharray="3 3" strokeOpacity={0.5} />
      <path d={path(series(theirs))} fill="none" stroke={HUD_TONE.danger} strokeWidth={2} />
      <path d={path(series(mine))} fill="none" stroke={HUD_TONE.accent} strokeWidth={2} />
      <line x1={x(round)} x2={x(round)} y1={2} y2={H - 2} stroke="currentColor" className="text-slate-400" strokeOpacity={0.6} />
      {(["accent", "danger"] as const).map((tone) => {
        const vs = series(tone === "accent" ? mine : theirs);
        return <circle key={tone} cx={x(round)} cy={y(vs[round] ?? 0)} r={3} fill={HUD_TONE[tone]} />;
      })}
    </svg>
  );
}

/** Une ligne d'unité : effectif au tour courant (barre intactes / détruites), coque, dégâts. */
function UnitRow({ u, round, tone, enemyName, maxDealt }: { u: CombatLogUnit; round: number; tone: "accent" | "danger"; enemyName: string; maxDealt: number }) {
  const def = u.id ? findUnit(u.id) : undefined;
  const left = round === 0 ? u.start : (u.left[Math.min(round, u.left.length) - 1] ?? u.start);
  const alive = u.start > 0 ? left / u.start : 0;
  const lostNow = Math.max(0, u.start - left);
  const virtual = !u.id;
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-2">
      {def ? <img src={assetUrl(def.image)} alt="" className="h-8 w-8 object-contain" /> : <Swords className="h-5 w-5 justify-self-center text-slate-500" aria-hidden />}
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-200">
            {virtual ? enemyName : (def?.name ?? u.id)}
            {u.cls && <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{UNIT_CLASS_LABELS[u.cls]}</span>}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-slate-300">{virtual ? pct(alive) : `${formatNumber(Math.round(left))} / ${formatNumber(Math.round(u.start))}`}</span>
        </div>
        <div className="relative mt-1 h-1.5 overflow-hidden bg-white/[0.06]">
          <motion.i className="absolute inset-y-0 left-0 block" style={{ background: HUD_TONE[tone] }} initial={false} animate={{ width: pct(alive) }} transition={{ duration: 0.35, ease: "easeOut" }} />
        </div>
        <div className="mt-0.5 flex flex-wrap justify-between gap-x-2 font-mono text-[10px] text-slate-500">
          <span>
            {lostNow >= 0.5 ? <span className="text-danger-glow">−{formatNumber(Math.round(lostNow))} </span> : null}
            {u.hullAfter !== undefined && round >= (u.left.length || 1) && u.hullAfter < 0.995 && <span style={{ color: HUD_TONE.ember }}>coque {pct(u.hullAfter)}</span>}
          </span>
          {u.dealt > 0 && (
            <span className="flex items-center gap-1" title="Dégâts infligés pendant tout le combat">
              <i className="inline-block h-1 bg-slate-500/60" style={{ width: `${Math.max(4, (u.dealt / Math.max(1, maxDealt)) * 40)}px` }} />
              {formatCompact(u.dealt)} dégâts
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function SideColumn({ units, round, tone, title, enemyName }: { units: CombatLogUnit[]; round: number; tone: "accent" | "danger"; title: string; enemyName: string }) {
  const groups = (["fleet", "defense", "home", "garrison"] as const).filter((g) => units.some((u) => u.group === g));
  const maxDealt = Math.max(1, ...units.map((u) => u.dealt));
  return (
    <div className="min-w-0">
      <h4 className="hud-eyebrow mb-1.5 text-[10px]" style={{ color: HUD_TONE[tone] }}>
        {title}
      </h4>
      {units.length === 0 ? (
        <p className="text-xs text-slate-500">Aucune unité engagée.</p>
      ) : (
        groups.map((g) => (
          <div key={g} className="mb-2">
            {groups.length > 1 && <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-slate-500">{GROUP_LABEL[g]}</p>}
            <ul className="flex flex-col gap-2">
              {units
                .filter((u) => u.group === g)
                .sort((a, b) => b.dealt - a.dealt)
                .map((u) => (
                  <UnitRow key={`${u.group}-${u.id}`} u={u} round={round} tone={tone} enemyName={enemyName} maxDealt={maxDealt} />
                ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

/** Faits marquants calculés à partir du déroulé. */
function highlights(log: CombatLog, mine: Side): { icon: typeof Swords; tone: "accent" | "ember" | "mint" | "danger"; text: string }[] {
  const out: ReturnType<typeof highlights> = [];
  const units = log.units ?? [];
  const theirs: Side = mine === "attacker" ? "defender" : "attacker";
  const top = (side: Side) => {
    const list = units.filter((u) => u.side === side && u.id);
    const total = list.reduce((s, u) => s + u.dealt, 0);
    const best = [...list].sort((a, b) => b.dealt - a.dealt)[0];
    return best && total > 0 ? { name: findUnit(best.id)?.name ?? best.id, share: best.dealt / total } : null;
  };
  const myTop = top(mine);
  if (myTop) out.push({ icon: Crosshair, tone: "accent", text: `Ton meilleur tireur : ${myTop.name}, ${pct(myTop.share)} de tes dégâts.` });
  const theirTop = top(theirs);
  if (theirTop) out.push({ icon: Crosshair, tone: "danger", text: `Menace principale en face : ${theirTop.name}, ${pct(theirTop.share)} de ses dégâts.` });
  const cb = log.classBonus;
  if (cb) {
    const mineBonus = mine === "attacker" ? cb.attacker : cb.defender;
    if (Math.abs(mineBonus) >= 1)
      out.push({
        icon: Sparkles,
        tone: mineBonus > 0 ? "mint" : "ember",
        text: mineBonus > 0 ? `Avantage de classe : +${formatCompact(mineBonus)} dégâts grâce à la composition de ta flotte.` : `Désavantage de classe : ${formatCompact(mineBonus)} dégâts. Fort bat Moyen, Moyen bat Faible, Faible bat Fort.`,
      });
  }
  if (log.shield && log.shield > 0) out.push({ icon: Shield, tone: "accent", text: `Bouclier planétaire : ${pct(log.shield)} des tirs de l'attaquant absorbés.` });
  if (log.targetPriority) out.push({ icon: Crosshair, tone: "accent", text: `Cible prioritaire de l'attaquant : ${log.targetPriority === "defenses" ? "les défenses" : "les vaisseaux"}.` });
  if (log.retreated) out.push({ icon: Swords, tone: "ember", text: mine === "attacker" ? "Ta flotte a décroché après de lourdes pertes." : "L'assaillant a battu en retraite." });
  const hurt = units.filter((u) => u.side === mine && u.hullAfter !== undefined && u.hullAfter < 0.9);
  if (hurt.length) out.push({ icon: Wrench, tone: "ember", text: `Coques abîmées : ${hurt.map((u) => `${findUnit(u.id)?.name ?? u.id} ${pct(u.hullAfter ?? 1)}`).join(", ")}. Direction l'Atelier.` });
  return out;
}

export function CombatReportDetail({ log, perspective, opponentName }: { log?: CombatLog; perspective: Side; opponentName: string }) {
  const still = useReducedMotion() ?? false;
  const n = log?.rounds.length ?? 0;
  const [round, setRound] = useState(still ? n : 0);
  const [playing, setPlaying] = useState(!still && n > 0);

  useEffect(() => {
    if (!playing) return;
    if (round >= n) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setRound((r) => Math.min(n, r + 1)), round === 0 ? ROUND_MS * 1.5 : ROUND_MS);
    return () => window.clearTimeout(t);
  }, [playing, round, n]);

  const units = useMemo(() => log?.units ?? [], [log]);
  const facts = useMemo(() => (log?.units ? highlights(log, perspective) : []), [log, perspective]);
  if (!log || n === 0) {
    return (
      <HudCallout tone="neutral" className="mt-4 text-xs text-slate-400">
        Rapport d'avant le combat en tours (5.19) : ni déroulé ni détail par unité. L'issue se jouait alors sur la seule comparaison des puissances.
      </HudCallout>
    );
  }
  const mine = perspective;
  const theirs: Side = mine === "attacker" ? "defender" : "attacker";
  const r = round > 0 ? log.rounds[round - 1] : null;
  const myHp = r ? (mine === "attacker" ? r.attackerHp : r.defenderHp) : 1;
  const theirHp = r ? (mine === "attacker" ? r.defenderHp : r.attackerHp) : 1;
  const myDmg = r ? (mine === "attacker" ? r.attackerDamage : r.defenderDamage) : 0;
  const theirDmg = r ? (mine === "attacker" ? r.defenderDamage : r.attackerDamage) : 0;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Curseur des tours */}
      <section className="hud-cut-sm border border-white/10 bg-space-900/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center border border-cyan-glow/30 text-cyan-glow transition-colors hover:bg-cyan-glow/10"
            aria-label={playing ? "Pause" : round >= n ? "Rejouer le déroulé" : "Lecture"}
            onClick={() => {
              if (round >= n) {
                setRound(0);
                setPlaying(true);
              } else setPlaying((p) => !p);
            }}
          >
            {playing ? <Pause className="h-4 w-4" /> : round >= n ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <div className="flex flex-1 gap-1" role="tablist" aria-label="Tour du combat">
            {Array.from({ length: n + 1 }, (_, k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={round === k}
                onClick={() => {
                  setPlaying(false);
                  setRound(k);
                }}
                className={cn(
                  "h-7 min-w-0 flex-1 border font-mono text-[10px] transition-colors",
                  round === k ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : k < round ? "border-cyan-glow/20 bg-cyan-glow/[0.05] text-slate-400" : "border-white/10 text-slate-500 hover:border-cyan-glow/40",
                )}
              >
                {k === 0 ? "Départ" : `T${k}`}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <p className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span>Toi</span>
              <span style={{ color: HUD_TONE.accent }}>{pct(myHp)} PV</span>
            </p>
            <div className="mt-0.5 h-2 overflow-hidden bg-white/[0.06]">
              <motion.i className="block h-full" style={{ background: HUD_TONE.accent }} initial={false} animate={{ width: pct(myHp) }} transition={{ duration: 0.35 }} />
            </div>
            {r && <p className="mt-0.5 font-mono text-[10px] text-slate-500">tirs : {formatCompact(myDmg)}</p>}
          </div>
          <span className="font-display text-sm font-semibold text-slate-400">{round === 0 ? "—" : `${round}/${n}`}</span>
          <div className="text-right">
            <p className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span style={{ color: HUD_TONE.danger }}>{pct(theirHp)} PV</span>
              <span>Adversaire</span>
            </p>
            <div className="mt-0.5 flex h-2 justify-end overflow-hidden bg-white/[0.06]">
              <motion.i className="block h-full" style={{ background: HUD_TONE.danger }} initial={false} animate={{ width: pct(theirHp) }} transition={{ duration: 0.35 }} />
            </div>
            {r && <p className="mt-0.5 font-mono text-[10px] text-slate-500">tirs : {formatCompact(theirDmg)}</p>}
          </div>
        </div>
        <HpChart log={log} mine={mine} round={round} />
        <p className="font-mono text-[10px] text-slate-500">
          Pointillés : sous <span className="text-slate-300">{Math.round(COMBAT_RULES.attackerWinBelow * 100)} %</span> de PV, le défenseur tombe. L'attaquant décroche après{" "}
          <span className="text-slate-300">{Math.round(COMBAT_RULES.retreatAt * 100)} %</span> de PV perdus.
        </p>
      </section>

      {/* Unités des deux camps, au tour choisi */}
      {units.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          <SideColumn units={units.filter((u) => u.side === mine)} round={round} tone="accent" title="Tes forces" enemyName={opponentName} />
          <SideColumn units={units.filter((u) => u.side === theirs)} round={round} tone="danger" title={`Forces de ${opponentName}`} enemyName={`Forces de ${opponentName}`} />
        </section>
      )}

      {facts.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h4 className="hud-eyebrow text-[10px] text-slate-500">Faits marquants</h4>
          {facts.map((f, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <f.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: HUD_TONE[f.tone] }} aria-hidden />
              {f.text}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}

/** Bilan par type d'unité : engagées, détruites, à l'Atelier, rentrées. */
export function CombatLossTable({ title, losses, recovered, units, tone }: { title: string; losses: Record<string, number>; recovered: Record<string, number>; units?: CombatLogUnit[]; tone: "accent" | "danger" }) {
  const ids = [...new Set([...Object.keys(losses).filter((k) => (losses[k] ?? 0) + (recovered[k] ?? 0) > 0), ...(units ?? []).filter((u) => u.id).map((u) => u.id)])];
  return (
    <div className="min-w-0">
      <h4 className="hud-eyebrow mb-1.5 text-[10px]" style={{ color: HUD_TONE[tone] }}>
        {title}
      </h4>
      {ids.length === 0 ? (
        <p className="text-sm text-slate-500">{units?.some((u) => !u.id) ? "Forces PNJ : pas d'unités réelles (voir leurs PV ci-dessus)." : "Aucune perte"}</p>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-1 font-normal">Unité</th>
              {units && <th className="text-right font-normal">Engagées</th>}
              <th className="text-right font-normal">Détruites</th>
              <th className="text-right font-normal" title="Sauvées : parties à l'Atelier (vaisseaux) ou reconstruites (défenses)">Sauvées</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => {
              const u = units?.filter((x) => x.id === id);
              const start = u?.reduce((s, x) => s + x.start, 0);
              return (
                <tr key={id} className="border-t border-white/5">
                  <td className="py-1 text-slate-200">
                    {findUnit(id)?.name ?? id}
                    {u?.[0]?.hullAfter !== undefined && u[0].hullAfter < 0.995 && <HudTag tone="ember" className="ml-1.5">coque {pct(u[0].hullAfter)}</HudTag>}
                  </td>
                  {units && <td className="text-right font-mono text-slate-400">{start !== undefined ? formatNumber(Math.round(start)) : "—"}</td>}
                  <td className="text-right font-mono text-danger-glow">{(losses[id] ?? 0) > 0 ? `−${formatNumber(losses[id])}` : "—"}</td>
                  <td className="text-right font-mono text-slate-300">{(recovered[id] ?? 0) > 0 ? formatNumber(recovered[id]) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
