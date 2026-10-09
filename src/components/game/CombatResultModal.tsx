import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CombatIntro } from "@/components/fx/CombatIntro";
import { emblemOptions, profileStyle } from "@/game/profile";
import { getRankIcon } from "@/game/ranks";
import { isWarlordUid, warlordsConfig } from "@/game/warlords";
import { AttackModal } from "@/components/game/AttackModal";
import { Button } from "@/components/ui/button";
import { Save, Swords } from "lucide-react";
import { toast } from "sonner";
import { saveFleetPreset } from "@/lib/fleetPresets";
import { useAuthStore } from "@/store/authStore";
import { FACTIONS } from "@/game/pirates";
import { usePlayerStore } from "@/store/playerStore";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ParticleBurst } from "@/components/ui/particle-burst";
import { CombatReplayAuto } from "@/components/game/CombatReplayAuto";
import { CombatLossTable, CombatReportDetail } from "@/components/game/CombatReportDetail";
import { closeCombatResult, useCombatModalStore, type CombatDisplay } from "@/store/combatModalStore";
import { findUnit } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import { formatNumber, frDeParts } from "@/lib/utils";
import type { CombatLog, CombatOutcome } from "@/types/game";
import { ResourceIcon } from "@/components/ui/game-icon";
import { useExclusiveModal } from "@/store/modalSlotStore";

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

const OUTCOME_STYLE: Record<CombatOutcome, { attacker: string; defender: string; color: string }> = {
  attacker_win: { attacker: "Victoire !", defender: "Tu as perdu ce combat…", color: "text-mint-glow" },
  defender_win: { attacker: "Défaite…", defender: "Attaque repoussée !", color: "text-danger-glow" },
  draw: { attacker: "Match nul", defender: "Match nul", color: "text-gold-glow" },
};

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
  // 6.14.164 (S4) : le rapport prend la place unique des grandes fenêtres (histoire, alerte de raid, annonce) : il attend
  // qu'elles se ferment, et elles l'attendent. Avant, « Attaque repoussée ! » s'ouvrait par-dessus une annonce.
  const visible = useExclusiveModal("combat", current !== null);
  const [intro, setIntro] = useState(false);
  useEffect(() => {
    setIntro(!!current && visible);
  }, [current, visible]);
  const endIntro = useCallback(() => setIntro(false), []);
  const style = player ? profileStyle(player) : null;
  const myEmblem = !player || !style || style.emblem === "rank" ? getRankIcon(player?.xp ?? 0) : emblemOptions(player).find((e) => e.id === style.emblem)?.image ?? getRankIcon(player.xp);
  const isVictory =
    !!current &&
    ((current.perspective === "attacker" && current.outcome === "attacker_win") ||
      (current.perspective === "defender" && current.outcome === "defender_win"));

  const [followUp, setFollowUp] = useState<{ uid: string; pseudo: string; fleet?: Record<string, number> } | null>(null);

  return (
    <>
    <Dialog open={current !== null && visible} onOpenChange={(open) => !open && closeCombatResult()}>
      {current && visible && (
        <DialogContent className="relative sm:max-w-3xl">
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
            {/* 6.14.165 (S6, NJ-29) : « Attaque du Silencieux (…) » (avant : « Attaque de Le Silencieux »). */}
            {current.perspective === "attacker" ? "Contre " : `Attaque ${frDeParts(current.opponentPseudo)[0]}`}
            <strong className="text-slate-200">{current.perspective === "attacker" ? current.opponentPseudo : frDeParts(current.opponentPseudo)[1]}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Ta puissance : {formatNumber(current.myPower)} — Puissance adverse : {formatNumber(current.opponentPower)}
          </p>

          <CombatReplayAuto
            myPower={current.myPower}
            opponentPower={current.opponentPower}
            myLossPercent={current.myLossPercent}
            opponentLossPercent={current.opponentLossPercent}
            outcome={current.outcome}
            perspective={current.perspective}
            log={current.combatLog}
          />
          <CombatClash myPower={current.myPower} opponentPower={current.opponentPower} />
          <CombatReportDetail log={current.combatLog} perspective={current.perspective} opponentName={current.opponentPseudo} />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CombatLossTable title="Tes pertes" tone="accent" losses={current.myLosses} recovered={current.myRecovered} units={current.combatLog?.units?.filter((u) => u.side === current.perspective)} />
            <CombatLossTable title="Pertes adverses" tone="danger" losses={current.opponentLosses} recovered={current.opponentRecovered} units={current.combatLog?.units?.filter((u) => u.side !== current.perspective)} />
          </div>

          <CombatFollowUp
            current={current}
            onAttack={(t) => {
              closeCombatResult();
              setFollowUp(t);
            }}
          />

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
    <AttackModal target={followUp ? { uid: followUp.uid, pseudo: followUp.pseudo } : null} initialFleet={followUp?.fleet} onClose={() => setFollowUp(null)} />
    </>
  );
}

/** 5.23 : suites d'un combat : réattaquer avec la même flotte, enregistrer la composition, riposter. */
function CombatFollowUp({ current, onAttack }: { current: CombatDisplay; onAttack: (t: { uid: string; pseudo: string; fleet?: Record<string, number> }) => void }) {
  const uid = useAuthStore((s) => s.user?.uid);
  // Joueurs et seigneurs seulement (pas les pirates, boss ou primes).
  if (!current.opponentUid || current.opponentUid === uid || !(/^[a-z0-9]{15}$/.test(current.opponentUid) || isWarlordUid(current.opponentUid))) return null;
  const attacker = current.perspective === "attacker";
  const fleet = attacker ? current.myFleet : undefined;
  const hasFleet = !!fleet && Object.values(fleet).some((n) => n > 0);
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {attacker ? (
        <Button size="sm" onClick={() => onAttack({ uid: current.opponentUid!, pseudo: current.opponentPseudo, fleet })}>
          <Swords className="mr-1.5 h-4 w-4" /> {hasFleet ? "Réattaquer avec la même flotte" : "Réattaquer"}
        </Button>
      ) : (
        <Button size="sm" variant="danger" onClick={() => onAttack({ uid: current.opponentUid!, pseudo: current.opponentPseudo })}>
          <Swords className="mr-1.5 h-4 w-4" /> Riposter
        </Button>
      )}
      {attacker && hasFleet && uid && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            saveFleetPreset(uid, `Contre ${current.opponentPseudo}`, fleet!);
            toast.success("Composition enregistrée", { description: "Retrouve-la dans la fenêtre d'attaque (raccourcis)." });
          }}
        >
          <Save className="mr-1.5 h-4 w-4" /> Enregistrer cette flotte
        </Button>
      )}
    </div>
  );
}

