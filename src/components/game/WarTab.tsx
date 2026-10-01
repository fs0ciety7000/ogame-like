import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Flag, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { WAR_RULES, warStatusAt, type AllianceWar } from "@/game/wars";
import { subscribeAlliances } from "@/services/allianceService";
import { declareWar, subscribeWars, surrenderWar } from "@/services/warService";
import { GameActionError } from "@/services/playerService";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatCompact, formatDuration, timeAgo } from "@/lib/utils";
import type { Alliance } from "@/types/game";

function errorText(err: unknown, fallback: string) {
  return err instanceof GameActionError ? err.message : fallback;
}

function WarCard({ war, allianceId, canLead }: { war: AllianceWar; allianceId: string; canLead: boolean }) {
  useNowTicker();
  const now = Date.now();
  const [confirm, setConfirm] = useState(false);
  const status = warStatusAt(war, now);
  const mineIsAttacker = war.attackerId === allianceId;
  const us = mineIsAttacker ? war.scoreAttacker : war.scoreDefender;
  const them = mineIsAttacker ? war.scoreDefender : war.scoreAttacker;
  const enemy = mineIsAttacker ? `[${war.defenderTag}] ${war.defenderName}` : `[${war.attackerTag}] ${war.attackerName}`;
  const total = Math.max(1, us + them);

  const doSurrender = async () => {
    try {
      await surrenderWar(war.id);
      toast("Ton alliance a rendu les armes.");
    } catch (err) {
      toast.error(errorText(err, "Reddition impossible."));
    } finally {
      setConfirm(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Swords className="h-5 w-5 text-danger-glow" />
        <h3 className="hud-title text-base">Guerre contre {enemy}</h3>
        <HudTag tone={status === "active" ? "danger" : "gold"}>{status === "active" ? "En cours" : "Préparation"}</HudTag>
        <span className="ml-auto font-mono text-xs text-slate-400">
          {status === "preparing" ? `début dans ${formatDuration((war.startMs - now) / 1000)}` : `fin dans ${formatDuration((war.endMs - now) / 1000)}`}
        </span>
      </div>
      <div>
        <div className="flex justify-between font-display text-2xl">
          <span className="text-cyan-glow">{us}</span>
          <span className="text-danger-glow">{them}</span>
        </div>
        <div className="mt-1 flex h-2 overflow-hidden bg-white/5">
          <i className="block bg-cyan-glow" style={{ width: `${(us / total) * 100}%` }} />
          <i className="block flex-1 bg-danger-glow" />
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Attaque gagnée : {WAR_RULES.pointsAttackWin} pts (+1 par {formatCompact(WAR_RULES.lootPerPoint)} de butin) · défense gagnée : {WAR_RULES.pointsDefenseWin} pts · délai entre deux attaques sur une même cible : {WAR_RULES.attackCooldownHours} h.
        </p>
      </div>
      {war.log.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-300">
          {[...war.log].reverse().map((l, i) => (
            <li key={i} className="border-l-2 border-white/10 pl-2">
              <span className="text-slate-500">{timeAgo(l.atMs)} · </span>
              {l.text}
            </li>
          ))}
        </ul>
      )}
      {canLead && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setConfirm(true)}>
          <Flag className="mr-1.5 h-3.5 w-3.5" /> Se rendre
        </Button>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>Rendre les armes ?</DialogTitle>
          <p className="text-sm text-slate-400">{enemy} remportera la guerre et ses récompenses. Cette décision est définitive.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={() => void doSurrender()}>
              Se rendre
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Onglet Guerre de la page Alliance (v3.2). */
export function WarTab({ alliance, canLead }: { alliance: Alliance; canLead: boolean }) {
  const [wars, setWars] = useState<AllianceWar[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => subscribeWars(alliance.id, setWars), [alliance.id]);
  useEffect(() => subscribeAlliances(setAlliances), []);
  const now = Date.now();
  const current = wars.find((w) => warStatusAt(w, now) !== "ended");
  const past = wars.filter((w) => w !== current);
  const targets = useMemo(() => alliances.filter((a) => a.id !== alliance.id && (a.members ?? []).length >= WAR_RULES.minMembers), [alliances, alliance.id]);
  const treasury = alliance.treasury ?? {};
  const affordable = (treasury.scrap ?? 0) >= WAR_RULES.costScrap && (treasury.energy ?? 0) >= WAR_RULES.costEnergy;

  const declare = async () => {
    setBusy(true);
    try {
      await declareWar(target);
      toast.success("Guerre déclarée ! Les hostilités commencent dans 12 h.");
      setTarget("");
    } catch (err) {
      toast.error(errorText(err, "Déclaration impossible."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {current ? (
        <WarCard war={current} allianceId={alliance.id} canLead={canLead} />
      ) : (
        <Card className="flex flex-col gap-3 p-5">
          <h3 className="hud-title text-base">Déclarer une guerre</h3>
          <p className="text-sm text-slate-400">
            Contre une alliance d'au moins {WAR_RULES.minMembers} membres. Coût : {formatCompact(WAR_RULES.costScrap)} ferraille et {formatCompact(WAR_RULES.costEnergy)} énergie du trésor. {WAR_RULES.prepHours} h de préparation, puis{" "}
            {WAR_RULES.durationHours} h de guerre.
          </p>
          <p className="text-sm text-slate-400">
            Le vainqueur reçoit {formatCompact(WAR_RULES.rewardScrap)} ferraille et {formatCompact(WAR_RULES.rewardEnergy)} énergie dans son trésor, +{Math.round(WAR_RULES.seasonBonusPct * 100)} % sur son score de saison d'alliance et le titre « {WAR_RULES.title} » pendant{" "}
            {WAR_RULES.titleDays} jours.
          </p>
          {canLead ? (
            <div className="flex flex-wrap gap-2">
              <select aria-label="Alliance visée" value={target} onChange={(e) => setTarget(e.target.value)} className="h-9 min-w-0 flex-1 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-slate-200">
                <option value="">Choisir une alliance…</option>
                {targets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name} · {a.members.length} membres
                  </option>
                ))}
              </select>
              <Button variant="danger" disabled={busy || !target || !affordable} onClick={() => void declare()}>
                <Swords className="mr-1.5 h-4 w-4" /> Déclarer la guerre
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Seuls le fondateur et les officiers peuvent déclarer une guerre.</p>
          )}
          {canLead && !affordable && <p className="text-xs text-danger-glow">Le trésor n'a pas assez de ferraille ou d'énergie.</p>}
        </Card>
      )}

      <Card className="p-4">
        <h3 className="hud-title mb-2 text-sm">Guerres passées</h3>
        {past.length === 0 ? (
          <EmptyState icon={<Swords className="h-5 w-5" />} title="Aucune guerre">Ton alliance n'a encore jamais combattu.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5 text-sm">
            {past.map((w) => {
              const won = w.winnerId === alliance.id;
              const draw = !w.winnerId;
              return (
                <li key={w.id} className="flex flex-wrap items-center gap-2 py-2">
                  <HudTag tone={draw ? "gold" : won ? "mint" : "danger"}>{draw ? "Égalité" : won ? "Victoire" : "Défaite"}</HudTag>
                  <span className={cn("text-slate-300")}>
                    [{w.attackerTag}] {w.scoreAttacker} – {w.scoreDefender} [{w.defenderTag}]
                  </span>
                  {w.surrenderedBy && <span className="text-xs text-slate-500">reddition</span>}
                  <span className="ml-auto text-xs text-slate-500">{timeAgo(w.endedAtMs || w.endMs)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
