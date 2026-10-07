import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { CombatLog, CombatOutcome } from "@/types/game";

/* =====================================================
   Replay animé d'un combat : les deux flottes entrent en scène, échangent
   des tirs (le camp le plus puissant tire davantage), puis les unités
   détruites explosent selon le pourcentage de pertes réel.
===================================================== */

const W = 320;
const H = 132;
const ENTER = 0.6; // arrivée des flottes
const FIRE = 1.6; // durée des échanges de tirs (sans déroulé en tours)
const BOOM = ENTER + FIRE; // explosions
/** 5.20 : durée d'un tour quand le rapport contient le déroulé. */
const ROUND = 0.6;

interface Ship {
  x: number;
  y: number;
  destroyed: boolean;
  boomDelay: number;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/** Nombre de vaisseaux dessinés : croît avec la puissance, sans excès. */
function shipCount(power: number) {
  if (power <= 0) return 0;
  return Math.max(3, Math.min(22, Math.round(3 + Math.log10(power + 1) * 3.5)));
}

/** 5.20 : heure d'explosion de la j-ième unité détruite, au tour où les pertes du camp l'atteignent. */
function roundBoom(j: number, destroyed: number, lossByRound: number[], rand: () => number): number {
  const need = (j + 1) / Math.max(1, destroyed);
  const total = lossByRound[lossByRound.length - 1] || 1;
  const r = Math.max(0, lossByRound.findIndex((l) => l / total >= need - 1e-9));
  return ENTER + r * ROUND + 0.2 + rand() * (ROUND - 0.25);
}

function makeFleet(count: number, side: "left" | "right", lossPct: number, rand: () => number, lossByRound?: number[]): Ship[] {
  const destroyed = Math.round(count * Math.min(1, Math.max(0, lossPct)));
  const ships = Array.from({ length: count }, (_, i) => {
    const col = Math.floor(i / 6);
    const row = i % 6;
    const xFromEdge = 24 + col * 16 + (rand() - 0.5) * 6;
    return {
      x: side === "left" ? xFromEdge : W - xFromEdge,
      y: 16 + row * 19 + (col % 2) * 8 + (rand() - 0.5) * 4,
      destroyed: false,
      boomDelay: BOOM + rand() * 0.5,
    };
  });
  // Les pertes touchent surtout le front (colonnes les plus proches de l'ennemi).
  const order = [...ships.keys()].sort((a, b) => Math.floor(b / 6) - Math.floor(a / 6) || rand() - 0.5);
  order.slice(0, destroyed).forEach((i, j) => {
    ships[i].destroyed = true;
    if (lossByRound?.length) ships[i].boomDelay = roundBoom(j, destroyed, lossByRound, rand);
  });
  return ships;
}

export function CombatReplay({
  myPower,
  opponentPower,
  myLossPercent,
  opponentLossPercent,
  outcome,
  perspective,
  log,
}: {
  myPower: number;
  opponentPower: number;
  myLossPercent: number;
  opponentLossPercent: number;
  outcome: CombatOutcome;
  perspective: "attacker" | "defender";
  /** 5.20 : déroulé en tours (rapports récents) : tirs, explosions et jauges suivent chaque tour. */
  log?: CombatLog;
}) {
  const [run, setRun] = useState(0);
  const still = useReducedMotion() ?? false;
  const rounds = log?.rounds?.length ? log.rounds : null;
  const iAttack = perspective === "attacker";
  // Points de vie restants de chaque camp, tour par tour, vus par ce joueur.
  const myHp = rounds ? rounds.map((r) => (iAttack ? r.attackerHp : r.defenderHp)) : null;
  const theirHp = rounds ? rounds.map((r) => (iAttack ? r.defenderHp : r.attackerHp)) : null;
  const fireEnd = rounds ? ENTER + rounds.length * ROUND : BOOM;
  const retreatMine = !!log?.retreated && iAttack;
  const retreatTheirs = !!log?.retreated && !iAttack;

  const scene = useMemo(() => {
    const rand = rng(1234 + run * 97);
    const lossesOf = (hp: number[] | null) => (hp ? hp.map((h) => 1 - h) : undefined);
    const mine = makeFleet(shipCount(myPower), "left", myLossPercent, rand, lossesOf(myHp));
    const theirs = makeFleet(shipCount(opponentPower), "right", opponentLossPercent, rand, lossesOf(theirHp));
    const total = Math.max(1, myPower + opponentPower);
    if (rounds) {
      // Un salvo par tour et par camp, proportionnel aux dégâts infligés pendant ce tour.
      const maxDmg = Math.max(1, ...rounds.flatMap((r) => [r.attackerDamage, r.defenderDamage]));
      const shots = rounds.flatMap((r, k) =>
        ([true, false] as const).flatMap((fromMe) => {
          const dmg = fromMe === iAttack ? r.attackerDamage : r.defenderDamage;
          const n = Math.max(1, Math.round((dmg / maxDmg) * 7));
          const shooters = fromMe ? mine : theirs;
          const targets = fromMe ? theirs : mine;
          if (!shooters.length || !targets.length || !(dmg > 0)) return [];
          return Array.from({ length: n }, () => ({
            from: shooters[Math.floor(rand() * shooters.length)],
            to: targets[Math.floor(rand() * targets.length)],
            fromMe,
            delay: ENTER + k * ROUND + rand() * (ROUND - 0.2),
          }));
        }),
      );
      return { mine, theirs, shots };
    }
    const shots = Array.from({ length: 26 }, () => {
      const fromMe = rand() < myPower / total;
      const shooters = fromMe ? mine : theirs;
      const targets = fromMe ? theirs : mine;
      if (shooters.length === 0 || targets.length === 0) return null;
      const s = shooters[Math.floor(rand() * shooters.length)];
      const t = targets[Math.floor(rand() * targets.length)];
      return { from: s, to: t, fromMe, delay: ENTER + rand() * FIRE };
    }).filter((s): s is NonNullable<typeof s> => s !== null);
    return { mine, theirs, shots };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, myPower, opponentPower, myLossPercent, opponentLossPercent, log]);

  const iWon = (perspective === "attacker" && outcome === "attacker_win") || (perspective === "defender" && outcome === "defender_win");
  const banner = outcome === "draw" ? "Égalité" : iWon ? "Victoire" : "Défaite";
  const bannerColor = outcome === "draw" ? "var(--color-gold-glow)" : iWon ? "var(--color-mint-glow)" : "var(--color-danger-glow)";

  const renderShip = (ship: Ship, i: number, side: "left" | "right") => {
    const color = side === "left" ? "var(--color-cyan-glow)" : "var(--color-danger-glow)";
    const dir = side === "left" ? 1 : -1;
    const body = `M ${4 * dir} 0 L ${-3 * dir} -3 L ${-1.5 * dir} 0 L ${-3 * dir} 3 Z`;
    if (still) return <path key={`${side}${i}`} d={body} fill={color} opacity={ship.destroyed ? 0.2 : 1} transform={`translate(${ship.x} ${ship.y})`} />;
    return (
      <g key={`${side}${i}-${run}`}>
        <motion.path
          d={body}
          fill={color}
          initial={{ x: ship.x - dir * 60, y: ship.y, opacity: 0 }}
          animate={
            ship.destroyed
              ? { x: ship.x, y: ship.y, opacity: [0, 1, 1, 0] }
              : (side === "left" ? retreatMine : retreatTheirs)
                ? { x: [ship.x - dir * 60, ship.x, ship.x, ship.x - dir * 90], y: ship.y, opacity: [0, 1, 1, 0] }
                : { x: ship.x, y: ship.y, opacity: 1 }
          }
          transition={
            ship.destroyed
              ? { x: { duration: ENTER, ease: "easeOut" }, opacity: { duration: ship.boomDelay + 0.15, times: [0, 0.2, 0.97, 1] } }
              : (side === "left" ? retreatMine : retreatTheirs)
                ? { duration: fireEnd + 0.9, times: [0, ENTER / (fireEnd + 0.9), fireEnd / (fireEnd + 0.9), 1], ease: "easeIn" }
                : { duration: ENTER, ease: "easeOut" }
          }
        />
        {ship.destroyed && (
          <>
            <motion.circle
              cx={ship.x}
              cy={ship.y}
              fill="none"
              stroke="var(--color-ember-glow)"
              strokeWidth={1.5}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: [0, 9], opacity: [1, 0] }}
              transition={{ delay: ship.boomDelay, duration: 0.5, ease: "easeOut" }}
            />
            {/* v3.8 : éclats projetés */}
            {[0, 1, 2, 3, 4].map((k) => {
              const a = (k / 5) * Math.PI * 2 + i;
              return (
                <motion.line
                  key={k}
                  x1={ship.x}
                  y1={ship.y}
                  x2={ship.x + Math.cos(a) * 1.6}
                  y2={ship.y + Math.sin(a) * 1.6}
                  stroke="var(--color-gold-glow)"
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], x: Math.cos(a) * 10, y: Math.sin(a) * 10 }}
                  transition={{ delay: ship.boomDelay, duration: 0.6, ease: "easeOut" }}
                />
              );
            })}
          </>
        )}
      </g>
    );
  };

  return (
    <div className="hud-cut-sm relative mt-3 overflow-hidden border border-white/5 bg-space-900/80">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Replay du combat : ${banner}`}>
        {/* Tirs */}
        {!still &&
          scene.shots.map((s, i) => (
            <motion.line
              key={`shot${i}-${run}`}
              x1={s.from.x}
              y1={s.from.y}
              x2={s.to.x}
              y2={s.to.y}
              stroke={s.fromMe ? "var(--color-cyan-glow)" : "var(--color-danger-glow)"}
              strokeWidth={1}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0.9, 0.9, 0] }}
              transition={{ delay: s.delay, duration: 0.35, times: [0, 0.5, 1] }}
            />
          ))}
        {/* v3.8 : impacts */}
        {!still &&
          scene.shots.map((s, i) => (
            <motion.circle
              key={`hit${i}-${run}`}
              cx={s.to.x}
              cy={s.to.y}
              fill={s.fromMe ? "var(--color-cyan-glow)" : "var(--color-danger-glow)"}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: [0, 3, 0], opacity: [0, 0.9, 0] }}
              transition={{ delay: s.delay + 0.17, duration: 0.25 }}
            />
          ))}

        <motion.g
          key={`shake-${run}`}
          animate={still ? undefined : { x: [0, -1.6, 1.4, -1, 0.6, 0] }}
          transition={{ delay: rounds ? fireEnd - ROUND : BOOM, duration: 0.45 }}
        >
          {scene.mine.map((ship, i) => renderShip(ship, i, "left"))}
          {scene.theirs.map((ship, i) => renderShip(ship, i, "right"))}
        </motion.g>

        {scene.theirs.length === 0 && (
          <text x={W - 70} y={H / 2} textAnchor="middle" className="fill-slate-500 text-[9px]">
            aucune défense
          </text>
        )}
        {scene.mine.length === 0 && (
          <text x={70} y={H / 2} textAnchor="middle" className="fill-slate-500 text-[9px]">
            aucune défense
          </text>
        )}

        {/* Verdict */}
        <motion.text
          key={`banner-${run}`}
          x={W / 2}
          y={H / 2 + 5}
          textAnchor="middle"
          fill={bannerColor}
          className="font-display text-[15px] tracking-[0.2em] uppercase"
          initial={{ opacity: still ? 1 : 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: still ? 0 : fireEnd + 0.6, duration: 0.3 }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        >
          {log?.retreated && outcome === "defender_win" ? (iAttack ? "Retraite" : "Repoussé") : banner}
        </motion.text>
        {/* 5.20 : compteur de tours */}
        {rounds && !still &&
          rounds.map((_, k) => (
            <motion.text
              key={`round${k}-${run}`}
              x={W / 2}
              y={14}
              textAnchor="middle"
              className="fill-slate-400 font-mono text-[8px] tracking-[0.2em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: k === rounds.length - 1 ? [0, 1, 1, 0] : [0, 1, 0] }}
              transition={{ delay: ENTER + k * ROUND, duration: k === rounds.length - 1 ? ROUND + 0.5 : ROUND }}
            >
              {`TOUR ${k + 1}/${rounds.length}`}
            </motion.text>
          ))}
      </svg>
      {/* v3.8 : intégrité des flottes, qui baisse pendant l'échange de tirs */}
      <div className="grid grid-cols-2 gap-3 px-2 pb-2">
        {[
          { label: "Toi", loss: myLossPercent, color: "var(--color-cyan-glow)", hp: myHp },
          { label: "Adversaire", loss: opponentLossPercent, color: "var(--color-danger-glow)", hp: theirHp },
        ].map((b) => {
          // Pertes en fraction (0,18 = 18 %).
          const left = Math.max(0, 100 - Math.round(b.loss * 100));
          // 5.20 : avec le déroulé, la jauge descend par paliers, un par tour.
          const steps = b.hp ? ["100%", ...b.hp.map((h) => `${Math.max(0, Math.round(h * 100))}%`)] : null;
          return (
            <div key={b.label}>
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-wider text-slate-500">
                <span>Intégrité</span>
                <span style={{ color: b.color }}>{b.hp ? Math.max(0, Math.round((b.hp[b.hp.length - 1] ?? 1) * 100)) : left} %</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden bg-white/5">
                <motion.div
                  key={`${b.label}-${run}`}
                  className="h-full"
                  style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }}
                  initial={{ width: still ? (steps ? steps[steps.length - 1] : `${left}%`) : "100%" }}
                  animate={{ width: steps ?? `${left}%` }}
                  transition={
                    steps
                      ? { delay: still ? 0 : ENTER, duration: still ? 0 : (steps.length - 1) * ROUND, ease: "easeOut" }
                      : { delay: still ? 0 : ENTER, duration: still ? 0 : FIRE + 0.4, ease: "easeIn" }
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-x-2 top-1.5 flex justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500">
        <span className="text-cyan-glow/80">Toi</span>
        <span className="text-danger-glow/80">Adversaire</span>
      </div>
      {!still && (
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="absolute bottom-9 right-2 flex items-center gap-1 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <RotateCcw className="h-3 w-3" /> Rejouer
        </button>
      )}
    </div>
  );
}
