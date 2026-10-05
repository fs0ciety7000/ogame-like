import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CombatIntro } from "@/components/fx/CombatIntro";
import { emblemOptions, profileStyle } from "@/game/profile";
import { getRankIcon } from "@/game/ranks";
import { warlordsConfig } from "@/game/warlords";
import { FACTIONS } from "@/game/pirates";
import { usePlayerStore } from "@/store/playerStore";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ParticleBurst } from "@/components/ui/particle-burst";
import { CombatReplay } from "@/components/game/CombatReplay";
import { closeCombatResult, useCombatModalStore } from "@/store/combatModalStore";
import { findUnit } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import { formatNumber } from "@/lib/utils";
import type { CombatLog, CombatOutcome } from "@/types/game";
import { ResourceIcon } from "@/components/ui/game-icon";

/** Réplique animée du choc des deux flottes : deux barres de puissance
 *  grandissent l'une vers l'autre depuis les bords, se rencontrent au
 *  point proportionnel à leur rapport de force, puis un flash marque
 *  l'impact — plus parlant que les seuls chiffres qui suivent. */
function CombatClash({ myPower, opponentPower }: { myPower: number; opponentPower: number }) {
  const total = Math.max(myPower + opponentPower, 1);
  const myPct = (myPower / total) * 100;
  const oppPct = 100 - myPct;

  return (
    <div className="hud-cut-sm relative mt-3 h-9 overflow-hidden bg-space-800/80">
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-glow/80 to-cyan-glow/40"
        initial={{ width: "0%" }}
        animate={{ width: `${myPct}%` }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-danger-glow/80 to-danger-glow/40"
        initial={{ width: "0%" }}
        animate={{ width: `${oppPct}%` }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ delay: 0.6, duration: 0.35, ease: "easeOut" }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2.5 text-[11px] font-medium tabular-mono text-slate-100/90">
        <span>{formatNumber(myPower)}</span>
        <span>{formatNumber(opponentPower)}</span>
      </div>
    </div>
  );
}

/** 5.18 : points de vie restants de chaque camp, tour par tour. */
function CombatRounds({ log, perspective }: { log: CombatLog; perspective: "attacker" | "defender" }) {
  if (!log.rounds.length) return null;
  const mine = (r: CombatLog["rounds"][number]) => (perspective === "attacker" ? r.attackerHp : r.defenderHp);
  const theirs = (r: CombatLog["rounds"][number]) => (perspective === "attacker" ? r.defenderHp : r.attackerHp);
  const pct = (v: number) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)} %`;
  return (
    <div className="mt-4">
      <h4 className="mb-1 text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">
        Déroulé · {log.rounds.length} tour{log.rounds.length > 1 ? "s" : ""}
      </h4>
      <ul className="space-y-1">
        {log.rounds.map((r, i) => (
          <li key={i} className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2 text-[11px]">
            <span className="font-mono text-slate-500">T{i + 1}</span>
            <div className="relative h-3 overflow-hidden bg-space-800/80" title={`Tes forces : ${pct(mine(r))}`}>
              <motion.div className="absolute inset-y-0 left-0 bg-cyan-glow/70" initial={{ width: 0 }} animate={{ width: pct(mine(r)) }} transition={{ duration: 0.4, delay: i * 0.08 }} />
              <span className="absolute inset-0 flex items-center px-1 font-mono text-slate-100/90">{pct(mine(r))}</span>
            </div>
            <div className="relative h-3 overflow-hidden bg-space-800/80" title={`Forces adverses : ${pct(theirs(r))}`}>
              <motion.div className="absolute inset-y-0 right-0 bg-danger-glow/70" initial={{ width: 0 }} animate={{ width: pct(theirs(r)) }} transition={{ duration: 0.4, delay: i * 0.08 }} />
              <span className="absolute inset-0 flex items-center justify-end px-1 font-mono text-slate-100/90">{pct(theirs(r))}</span>
            </div>
          </li>
        ))}
      </ul>
      {log.retreated && (
        <p className="mt-1 text-xs text-gold-glow">
          {perspective === "attacker" ? "Ta flotte a décroché après de lourdes pertes." : "L'assaillant a battu en retraite."}
        </p>
      )}
    </div>
  );
}

const OUTCOME_STYLE: Record<CombatOutcome, { attacker: string; defender: string; color: string }> = {
  attacker_win: { attacker: "Victoire !", defender: "Tu as perdu ce combat…", color: "text-mint-glow" },
  defender_win: { attacker: "Défaite…", defender: "Attaque repoussée !", color: "text-danger-glow" },
  draw: { attacker: "Match nul", defender: "Match nul", color: "text-gold-glow" },
};

function LossList({ losses, recovered }: { losses: Record<string, number>; recovered: Record<string, number> }) {
  const entries = Object.entries(losses).filter(([, v]) => v > 0);
  if (entries.length === 0) return <p className="text-sm text-slate-500">Aucune perte</p>;

  return (
    <ul className="space-y-1 text-sm">
      {entries.map(([id, count]) => {
        const rec = recovered[id] ?? 0;
        const name = findUnit(id)?.name ?? id;
        return (
          <li key={id} className="flex items-center justify-between gap-2 text-slate-300">
            <span>{name}</span>
            <span className="text-danger-glow">
              -{count + rec} {rec > 0 && <span className="text-slate-500">(dont {rec} à l'Atelier)</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Blason affiché pour l'adversaire : seigneur, faction pirate, ou insigne générique. */
function opponentEmblem(pseudo: string): string {
  const lord = warlordsConfig().defs.find((d) => d.name === pseudo || d.name.split(",")[0] === pseudo || d.name.startsWith(`${pseudo} `) || pseudo.startsWith(d.name.split(" ")[0]));
  if (lord) return lord.emblem;
  const faction = FACTIONS.find((f) => f.emblem && (f.name === pseudo || f.leader === pseudo || pseudo.includes(f.name)));
  if (faction?.emblem) return faction.emblem;
  return getRankIcon(0);
}

export function CombatResultModal() {
  const current = useCombatModalStore((s) => s.current);
  const player = usePlayerStore((s) => s.player);
  const [intro, setIntro] = useState(false);
  useEffect(() => setIntro(!!current), [current]);
  const endIntro = useCallback(() => setIntro(false), []);
  const style = player ? profileStyle(player) : null;
  const myEmblem = !player || !style || style.emblem === "rank" ? getRankIcon(player?.xp ?? 0) : emblemOptions(player).find((e) => e.id === style.emblem)?.image ?? getRankIcon(player.xp);
  const isVictory =
    !!current &&
    ((current.perspective === "attacker" && current.outcome === "attacker_win") ||
      (current.perspective === "defender" && current.outcome === "defender_win"));

  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && closeCombatResult()}>
      {current && (
        <DialogContent className="relative overflow-visible">
          <CombatIntro
            show={intro}
            left={myEmblem}
            right={opponentEmblem(current.opponentPseudo)}
            verdict={current.outcome === "draw" ? "Match nul" : isVictory ? "Victoire" : "Défaite"}
            tone={current.outcome === "draw" ? "draw" : isVictory ? "win" : "loss"}
            onDone={endIntro}
          />
          {isVictory && !intro && <ParticleBurst />}
          <DialogTitle className={current.outcome === "draw" ? "text-gold-glow" : isVictory ? "text-mint-glow" : "text-danger-glow"}>
            {current.perspective === "attacker" ? OUTCOME_STYLE[current.outcome].attacker : OUTCOME_STYLE[current.outcome].defender}
          </DialogTitle>
          {intro ? (
            <div className="h-72" />
          ) : (
            <>
          <p className="mt-1 text-sm text-slate-400">
            {current.perspective === "attacker" ? "Contre" : "Attaque de"} <strong className="text-slate-200">{current.opponentPseudo}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Ta puissance : {formatNumber(current.myPower)} — Puissance adverse : {formatNumber(current.opponentPower)}
          </p>

          <CombatReplay
            myPower={current.myPower}
            opponentPower={current.opponentPower}
            myLossPercent={current.myLossPercent}
            opponentLossPercent={current.opponentLossPercent}
            outcome={current.outcome}
            perspective={current.perspective}
          />
          <CombatClash myPower={current.myPower} opponentPower={current.opponentPower} />
          {current.combatLog && <CombatRounds log={current.combatLog} perspective={current.perspective} />}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-1 text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Tes pertes</h4>
              <LossList losses={current.myLosses} recovered={current.myRecovered} />
            </div>
            <div>
              <h4 className="mb-1 text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">Pertes adverses</h4>
              <LossList losses={current.opponentLosses} recovered={current.opponentRecovered} />
            </div>
          </div>

          <div className="mt-4">
            <h4 className="mb-1 text-xs font-semibold font-mono uppercase tracking-wide text-slate-500">
              {current.perspective === "attacker" ? "Butin" : "Ressources perdues"}
            </h4>
            {current.loot && Object.values(current.loot).some((v) => v && v > 0) ? (
              <ul className="space-y-1 text-sm">
                {Object.entries(current.loot)
                  .filter(([, v]) => v && v > 0)
                  .map(([res, v]) => (
                    <li key={res} className="flex items-center justify-between text-slate-300">
                      <span>
                        <ResourceIcon id={res} /> {RESOURCE_LIST.find((r) => r.id === res)?.name ?? res}
                      </span>
                      <span className={current.perspective === "attacker" ? "text-mint-glow" : "text-danger-glow"}>
                        {current.perspective === "attacker" ? "+" : "-"}
                        {formatNumber(v ?? 0)}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Aucune ressource concernée</p>
            )}
          </div>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
