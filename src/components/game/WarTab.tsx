import { EmptyAction } from "@/components/ui/panel";
import { useEffect, useMemo, useState } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Flag, ShieldHalf, Swords, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { WAR_RULES, warStatusAt, type AllianceWar } from "@/game/wars";
import { subscribeAlliances } from "@/services/allianceService";
import { chestShield, declareWar, fetchSeasonWar, subscribeWars, surrenderWar, type SeasonWarRow } from "@/services/warService";
import { readWarChest, SEASON_WAR_RULES, WAR_CHEST_RULES } from "@/game/seasonWars";
import { ResourceIcon } from "@/components/ui/game-icon";
import type { ResourceId } from "@/types/game";
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
  // v5.1 : le coffre de guerre peut payer la déclaration à la place du trésor.
  const chest = readWarChest(alliance.warChest);
  const chestCovers = (chest.resources.scrap ?? 0) >= WAR_RULES.costScrap && (chest.resources.energy ?? 0) >= WAR_RULES.costEnergy;
  const [payFrom, setPayFrom] = useState<"treasury" | "chest">("treasury");
  const canPay = payFrom === "chest" ? chestCovers : affordable;

  const declare = async () => {
    setBusy(true);
    try {
      await declareWar(target, payFrom);
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
              <select aria-label="Alliance visée" value={target} onChange={(e) => setTarget(e.target.value)} className="h-9 min-w-[12rem] flex-1 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-slate-200">
                <option value="">Choisir une alliance…</option>
                {targets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name} · {a.members.length} membres
                  </option>
                ))}
              </select>
              <select aria-label="Payé par" value={payFrom} onChange={(e) => setPayFrom(e.target.value as "treasury" | "chest")} className="h-9 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-slate-200">
                <option value="treasury">Payé par le trésor</option>
                <option value="chest" disabled={!chestCovers}>
                  Payé par le coffre de guerre{chestCovers ? "" : " (insuffisant)"}
                </option>
              </select>
              <Button variant="danger" disabled={busy || !target || !canPay} onClick={() => void declare()}>
                <Swords className="mr-1.5 h-4 w-4" /> Déclarer la guerre
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Seuls le fondateur et les officiers peuvent déclarer une guerre.</p>
          )}
          {canLead && !canPay && <p className="text-xs text-ember-glow">{payFrom === "chest" ? "Le coffre de guerre" : "Le trésor"} n'a pas assez de ferraille ou d'énergie.</p>}
        </Card>
      )}

      <WarChestCard alliance={alliance} canLead={canLead} />
      <SeasonWarCard allianceId={alliance.id} />

      <Card className="p-4">
        <h3 className="hud-title mb-2 text-sm">Guerres passées</h3>
        {past.length === 0 ? (
          <EmptyState icon={<Swords className="h-5 w-5" />} title="Aucune guerre" action={<EmptyAction to="/game/joueurs?mode=alliances">Voir les alliances</EmptyAction>}>Ton alliance n'a encore jamais combattu.</EmptyState>
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

/** v5.1 : coffre de guerre — dépôts des objectifs du jour, bouclier offert à un membre. */
function WarChestCard({ alliance, canLead }: { alliance: Alliance; canLead: boolean }) {
  const chest = readWarChest(alliance.warChest);
  const [member, setMember] = useState("");
  const [busy, setBusy] = useState(false);
  const entries = Object.entries(chest.resources).filter(([, n]) => (n ?? 0) > 0) as [ResourceId, number][];
  const give = async () => {
    setBusy(true);
    try {
      await chestShield(member);
      toast.success(`Bouclier de ${WAR_CHEST_RULES.shieldHours} h offert.`);
      setMember("");
    } catch (err) {
      toast.error(errorText(err, "Bouclier impossible."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="hud-title flex items-center gap-2 text-sm">
        <ShieldHalf className="h-4 w-4 text-gold-glow" /> Coffre de guerre
      </h3>
      <p className="text-xs text-slate-400">
        Chaque objectif du jour réussi y verse {Math.round(WAR_CHEST_RULES.depositPct * 100)} % du bonus du trésor (jusqu'à {WAR_CHEST_RULES.capDays} jours de dépôts). Il paie une déclaration de guerre sans toucher au trésor, ou un bouclier de {WAR_CHEST_RULES.shieldHours} h pour un membre ({WAR_CHEST_RULES.shieldCostHours} h de sa production).
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">Vide pour l'instant : réussissez des objectifs du jour pour le remplir.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {entries.map(([res, n]) => (
            <span key={res} className="inline-flex items-center gap-1.5 border border-gold-glow/25 bg-gold-glow/[0.05] px-2 py-1 font-mono text-xs text-slate-200" title={`Plafond : ${formatCompact(chest.cap[res] ?? 0)}`}>
              <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n)}
              <span className="text-[10px] text-slate-500">/ {formatCompact(chest.cap[res] ?? 0)}</span>
            </span>
          ))}
        </div>
      )}
      {canLead && (
        <div className="flex flex-wrap gap-2">
          <select aria-label="Membre protégé" value={member} onChange={(e) => setMember(e.target.value)} className="h-9 min-w-[12rem] flex-1 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-slate-200">
            <option value="">Offrir un bouclier à…</option>
            {(alliance.members ?? []).map((uid) => (
              <option key={uid} value={uid}>
                {alliance.memberPseudos?.[uid] ?? uid}
              </option>
            ))}
          </select>
          <Button variant="outline" disabled={busy || !member || entries.length === 0} onClick={() => void give()}>
            <ShieldHalf className="h-4 w-4" /> Bouclier {WAR_CHEST_RULES.shieldHours} h
          </Button>
        </div>
      )}
    </Card>
  );
}

/** v5.1 : classement des guerres de la saison. */
function SeasonWarCard({ allianceId }: { allianceId: string }) {
  const [rows, setRows] = useState<SeasonWarRow[] | null>(null);
  useEffect(() => {
    fetchSeasonWar()
      .then((r) => setRows(r.standings))
      .catch(() => setRows([]));
  }, []);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="hud-title flex items-center gap-2 text-sm">
        <Trophy className="h-4 w-4 text-gold-glow" /> Guerres de saison
      </h3>
      <p className="text-xs text-slate-400">
        Points des guerres de la saison + 1 point par {formatCompact(SEASON_WAR_RULES.powerPerPoint)} de puissance ennemie détruite + {SEASON_WAR_RULES.sectorPoints} points par secteur tenu à la clôture. Podium : {SEASON_WAR_RULES.rewardHours.join(" / ")} h de production des membres versées au trésor, et un titre d'alliance.
      </p>
      {rows === null ? (
        <SkeletonList rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState size="sm" icon="⚔️" title="Aucune alliance classée">Le classement apparaîtra après les premières batailles.</EmptyState>
      ) : (
        <div className="flex flex-col divide-y divide-white/5 text-sm">
          {rows.map((r) => (
            <div key={r.allianceId} className={cn("flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1.5", r.allianceId === allianceId && "bg-cyan-glow/[0.05]")}>
              <span className={cn("w-7 font-display font-bold", r.rank === 1 ? "text-gold-glow" : r.rank <= 3 ? "text-slate-200" : "text-slate-500")}>{r.rank}</span>
              <span className="flex-1 truncate text-slate-200">
                [{r.tag}] {r.name}
              </span>
              <span className="font-mono text-[11px] text-slate-500" title="guerres · puissance · secteurs">
                {r.warPoints} · {r.powerPoints} · {r.sectors}×{SEASON_WAR_RULES.sectorPoints}
              </span>
              <span className="w-16 text-right font-mono font-semibold text-slate-100">{formatCompact(r.score)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
