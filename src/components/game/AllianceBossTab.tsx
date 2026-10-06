import { useState } from "react";
import { toast } from "sonner";
import { Crosshair, Flame, Megaphone, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudTag, StatTile } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { AssaultDialog, Ranking } from "@/pages/LeviathanPage";
import { BossRecapPanel } from "@/components/game/BossRecap";
import { BossDeathOverlay, BossFeed, BossHero, BossNextCard, BossPhasePanel, bossPhase, type BossArt } from "@/components/game/BossStage";
import {
  ALLIANCE_BOSS_RULES,
  allianceBossCost,
  allianceBossDef,
  allianceBossOfWeek,
  allianceNextWeekMs,
  allianceWeekId,
  canCallAllianceBoss,
  normalizeAllianceBoss,
} from "@/game/allianceBoss";
import { leviathanRanking } from "@/game/leviathan";
import { AllianceError, callAllianceBoss } from "@/services/allianceService";
import { launchFleet } from "@/services/playerService";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatCompact, formatDuration } from "@/lib/utils";
import type { Alliance, PlayerState, ResourceId } from "@/types/game";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* v4.6 : boss d'alliance, une fois par semaine. */

function sendAllianceBossAssault(fleet: Record<string, number>, formation: string) {
  return launchFleet({ targetUid: "allianceboss", fleet, mission: "allianceboss", formation }, "boss d'alliance");
}

export function AllianceBossTab({ alliance, player }: { alliance: Alliance; player: PlayerState }) {
  useNowTicker();
  const now = Date.now();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const state = normalizeAllianceBoss(alliance.boss);
  const thisWeek = !!state && state.weekId === allianceWeekId(now);
  const active = !!state && state.status === "active" && now < state.endMs && state.hp > 0;
  const def = state && (thisWeek || active) ? allianceBossDef(state) : allianceBossOfWeek(now);
  // Combat de la semaine (ou encore en cours), sinon rien : le boss attend d'être appelé.
  const shown = state && (thisWeek || active) ? state : null;
  const phase = bossPhase(shown, now);
  const ended = phase === "killed" || phase === "failed";
  const nextWeek = allianceNextWeekMs(now);
  const art: BossArt = { name: def.name, image: def.image, emblem: "", lore: def.lore, accent: "var(--color-ember-glow)" };
  const canCall = canCallAllianceBoss(alliance, player.uid);
  // Estimation du coût : production des membres connus localement (la mienne × membres, à titre indicatif).
  const estimate = allianceBossCost([player]);
  const mine = state?.contributions[player.uid];
  const wait = mine && active ? mine.lastLaunchMs + ALLIANCE_BOSS_RULES.cooldownHours * 3600_000 - now : 0;
  const ranking = state ? leviathanRanking(state) : [];
  const rank = ranking.findIndex((r) => r.uid === player.uid);
  const total = ranking.reduce((a, r) => a + r.damage, 0);
  const share = total > 0 && mine ? mine.damage / total : 0;

  const call = async () => {
    if (!(await askConfirm({ title: `Appeler ${def.name} ?`, message: `Le trésor paie ${ALLIANCE_BOSS_RULES.costHours} h de production cumulée des membres.`, confirmLabel: "Appeler", tone: "gold" }))) return;
    setBusy(true);
    try {
      await callAllianceBoss();
      toast.success(`${def.name} approche : 24 h pour l'abattre !`);
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Appel impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="hud-eyebrow text-[10px] text-ember-glow">Boss d'alliance · semaine du {new Date(`${allianceWeekId(now)}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
      {/* v5.10.5 : même mise en scène que le Léviathan et le boss de saison, selon l'état du combat. */}
      <BossHero art={art} phase={phase} state={shown} now={now} next={ended ? nextWeek : null} nextLabel={phase === "dormant" ? (canCall ? "Prêt à être appelé" : "En attente d'un officier") : ended ? "Nouvel appel dans" : undefined} />

      {ended && shown && <BossRecapPanel state={shown} uid={player.uid} name={def.name} image={def.image} active={false} />}
      {ended && (
        <BossNextCard art={art} next={nextWeek} now={now} phase={phase} tip={`Le fondateur ou un officier pourra appeler le prochain boss dès lundi : ${allianceBossOfWeek(nextWeek).name}.`} />
      )}

      {active && state ? (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Flame className={cn("h-6 w-6", active ? "text-danger-glow" : "text-slate-500")} />
            <HudTag tone={active ? "danger" : state.status === "killed" ? "mint" : "gold"}>{active ? "En cours" : state.status === "killed" ? "Abattu" : "Retiré"}</HudTag>
            <span className="text-xs text-slate-400">appelé par {alliance.memberPseudos[state.launchedBy] ?? "un officier"}</span>
            <span className="ml-auto font-mono text-xs text-slate-400">
              {active ? `repart dans ${formatDuration(Math.max(0, (state.endMs - now) / 1000))}` : "prochain appel lundi"}
            </span>
          </div>
          <BossPhasePanel state={state} />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tes dégâts" value={formatCompact(mine?.damage ?? 0)} sub={`${Math.round(share * 100)} % du total · ${mine?.assaults ?? 0} assaut(s)`} tone="ember" />
            <StatTile label="Ton rang" value={rank >= 0 ? `#${rank + 1}` : "—"} sub={rank === 0 ? "Relique rare s'il tombe" : "Le premier gagne une relique rare"} tone="gold" />
            <StatTile label="Participants" value={ranking.length} sub={`sur ${alliance.members.length} membres`} tone="accent" />
          </div>
          {active && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="danger" disabled={wait > 0} onClick={() => setOpen(true)}>
                <Crosshair className="mr-1.5 h-4 w-4" /> {wait > 0 ? `Prochain assaut dans ${formatDuration(Math.ceil(wait / 1000))}` : "Lancer un assaut"}
              </Button>
              <span className="text-xs text-slate-500">
                Un assaut toutes les {ALLIANCE_BOSS_RULES.cooldownHours} h, {ALLIANCE_BOSS_RULES.flightMinutes} min de trajet.
              </span>
            </div>
          )}
        </Card>
      ) : ended ? null : (
        <Card className="flex flex-col gap-3 p-5">
          <p className="text-sm text-slate-300">
            Une fois par semaine, le fondateur ou un officier peut appeler le boss. Il reste <b>24 h</b>, et chaque membre peut lancer un assaut toutes les{" "}
            {ALLIANCE_BOSS_RULES.cooldownHours} h.
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            Coût : {ALLIANCE_BOSS_RULES.costHours} h de production cumulée des membres, payées par le trésor. Ta part :
            {(Object.entries(estimate) as [ResourceId, number][]).map(([r, n]) => (
              <span key={r} className="inline-flex items-center gap-1">
                <ResourceIcon id={r} className="h-4 w-4" /> {formatCompact(n)}
              </span>
            ))}
          </p>
          {canCall ? (
            <Button className="self-start" disabled={busy} onClick={() => void call()}>
              <Megaphone className="mr-1.5 h-4 w-4" /> Appeler {def.name}
            </Button>
          ) : (
            <p className="text-xs text-slate-500">Seuls le fondateur et les officiers peuvent l'appeler.</p>
          )}
        </Card>
      )}

      {shown && <BossFeed state={shown} uid={player.uid} now={now} boss="alliance" />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-gold-glow" /> {ended ? "Classement final de l'alliance" : "Dégâts de l'alliance"}
          </h2>
          {shown ? <Ranking state={shown} uid={player.uid} /> : <p className="text-xs text-slate-500">Pas encore de combat cette semaine.</p>}
        </Card>
        <Card className="flex flex-col gap-2 p-4 text-sm text-slate-300">
          <h2 className="hud-title text-sm">Récompenses</h2>
          <p>
            S'il tombe, chaque membre qui a fait au moins {Math.round(ALLIANCE_BOSS_RULES.minSharePct * 100)} % des dégâts gagne <b>+{ALLIANCE_BOSS_RULES.killPoints} points de passe</b> et{" "}
            <b>{ALLIANCE_BOSS_RULES.rewardHours} h de production</b>. Le premier en dégâts reçoit une <b>relique rare</b>, et le trésor récupère{" "}
            {Math.round(ALLIANCE_BOSS_RULES.refundPct * 100)} % du coût.
          </p>
          <p>Sinon, chaque participant gagne +{ALLIANCE_BOSS_RULES.failPoints} points de passe.</p>
          <p className="text-xs text-slate-500">Structure : {ALLIANCE_BOSS_RULES.hpFactor} fois la puissance d'attaque des membres actifs ces 7 derniers jours. Rotation : Cuirassé Gravhorn, Nid-mère Kesh'Vaar, Croiseur de la Confrérie.</p>
        </Card>
      </div>

      <AssaultDialog open={open} onClose={() => setOpen(false)} title={`Assaut : ${def.name}`} send={sendAllianceBossAssault} flightMinutes={ALLIANCE_BOSS_RULES.flightMinutes} state={shown} />
      <BossDeathOverlay phase={phase} name={def.name} killer={shown?.killedBy} />
    </div>
  );
}
