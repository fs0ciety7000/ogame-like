import { PlayerName } from "@/components/ui/player-name";
import { BossRewardsAdmin } from "@/components/game/BossRewardsAdmin";
import { useEffect, useState } from "react";
import { markLeviathanSeen } from "@/store/leviathanSeenStore";
import { toast } from "sonner";
import { Crosshair, Skull, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HudTag, StatTile } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormationPicker } from "@/components/game/FormationPicker";
import { LeviathanAdminPanel } from "@/components/game/LeviathanAdminPanel";
import { MythicRelicNotice } from "@/components/game/MythicRelicNotice";
import { BossRecapPanel } from "@/components/game/BossRecap";
import { BossHero, BossNextCard, bossPhase, type BossArt } from "@/components/game/BossStage";
import { computeFleetPower } from "@/game/combat";
import { formationEffects, type FormationId } from "@/game/formations";
import { describeBossSchedule, hasBossSchedule } from "@/game/events";
import { isActive, LEVIATHAN_RULES, leviathanRanking, leviathanSchedule, nextLeviathanStart, rewardHours, upcomingLeviathanStart, type LeviathanState } from "@/game/leviathan";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { sendLeviathanAssault, useLeviathan } from "@/services/leviathanService";
import { useAdminStatus } from "@/services/maintenanceService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatCompact, formatDuration, formatNumber } from "@/lib/utils";

export function AssaultDialog({ open, onClose, title = "Assaut sur le Léviathan", send: sendAssault = sendLeviathanAssault, flightMinutes = LEVIATHAN_RULES.flightMinutes }: { open: boolean; onClose: () => void; title?: string; send?: (fleet: Record<string, number>, formation: string) => Promise<unknown>; flightMinutes?: number }) {
  const player = usePlayerStore((s) => s.player);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [formation, setFormation] = useState<FormationId>("balanced");
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const ids = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (player.units[id]?.count ?? 0) > 0);
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const power = Math.round(computeFleetPower(player.units, player.techLevels, selected, ["attack"]) * formationEffects(formation).attackFactor);

  const send = async () => {
    setBusy(true);
    try {
      await sendAssault(selected, formation);
      triggerWarpEffect();
      toast.success(`Flotte lancée : impact dans ${flightMinutes} min.`);
      setFleet({});
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Lancement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <p className="text-sm text-slate-400">
          Les dégâts valent la puissance d'attaque de la flotte. {Math.round(LEVIATHAN_RULES.lossPct * 100)} % des vaisseaux sont détruits (en partie réparés par l'Atelier). Trajet de {LEVIATHAN_RULES.flightMinutes} min, puis retour.
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <img src={findUnit(id)?.image} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">{findUnit(id)?.name}</span>
                <NumberInput size="sm" value={fleet[id] ?? 0} max={owned} aria-label={`Quantité ${findUnit(id)?.name}`} onChange={(v) => setFleet((f) => ({ ...f, [id]: v }))} className="w-40 shrink-0" />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] text-slate-500" title="À quai">/{formatCompact(owned)}</span>
              </div>
            );
          })}
        </div>
        <FormationPicker value={formation} onChange={setFormation} className="mt-3" />
        <p className="mt-2 text-xs text-slate-400">
          Dégâts estimés : <strong className="text-ember-glow">{formatNumber(power)}</strong>
        </p>
        <Button variant="danger" className="mt-3 w-full" disabled={busy || power <= 0} onClick={() => void send()}>
          <Crosshair className="mr-1.5 h-4 w-4" /> Lancer l'assaut
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function Ranking({ state, uid }: { state: LeviathanState; uid: string }) {
  const ranking = leviathanRanking(state);
  if (ranking.length === 0) return <p className="text-xs text-slate-500">Personne n'a encore frappé.</p>;
  const top = ranking[0].damage;
  return (
    <ol className="flex flex-col gap-1.5">
      {ranking.map((c, i) => (
        <li key={c.uid} className={cn("grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm", c.uid === uid && "text-cyan-glow")}>
          <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
          <span className="min-w-0">
            <PlayerName uid={c.uid} pseudo={c.pseudo} className="block truncate" />
            <span className="mt-0.5 block h-1 bg-white/5">
              <i className="block h-full bg-ember-glow" style={{ width: `${(c.damage / top) * 100}%` }} />
            </span>
          </span>
          <span className="text-right font-mono text-xs tabular-nums">
            {formatCompact(c.damage)} <span className="text-slate-500">· {c.assaults} assaut{c.assaults > 1 ? "s" : ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function RulesCard() {
  return (
    <Card className="flex flex-col gap-2 p-4 text-sm text-slate-300">
      <h2 className="hud-title text-sm">Règles</h2>
      <p>Structure : {LEVIATHAN_RULES.hpFactor} fois la puissance d'attaque cumulée des commandants actifs ces 7 derniers jours.</p>
      <p>
        Récompense : {LEVIATHAN_RULES.baseRewardHours} h de ta production, plus jusqu'à {LEVIATHAN_RULES.bonusRewardHours} h selon tes dégâts comparés au premier ; moitié moins s'il survit.
      </p>
      <p>Le premier en dégâts gagne le titre « {LEVIATHAN_RULES.title} » pendant {LEVIATHAN_RULES.titleDays} jours. Chaque participant à sa chute débloque le succès « Tueur de Léviathan ».</p>
    </Card>
  );
}

const LEVIATHAN_ART: BossArt = {
  name: LEVIATHAN_RULES.name,
  image: "/assets/leviathan/leviathan.webp",
  portrait: "/assets/leviathan/leviathan-portrait.webp",
  emblem: "/assets/leviathan/leviathan-emblem.webp",
};

export function LeviathanPage() {
  useNowTicker();
  const now = Date.now();
  const player = usePlayerStore((s) => s.player);
  const state = useLeviathan();
  const admin = useAdminStatus();
  const [open, setOpen] = useState(false);
  // v4.7.1 : la pastille du menu s'efface une fois la page ouverte.
  useEffect(() => {
    markLeviathanSeen(state?.id);
  }, [state?.id]);
  if (!player) return null;

  const active = !!state && isActive(state, now);
  // v5.10 : la page entière change selon l'état du combat.
  // (fin du temps pas encore clôturée par le serveur : déjà traitée comme une retraite.)
  const phase = bossPhase(state, now);
  const mine = state?.contributions[player.uid];
  const wait = mine ? mine.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * 3600_000 - now : 0;
  // Combat terminé : la fenêtre en cours est passée, on annonce la suivante.
  const next = phase === "active" ? nextLeviathanStart(now) : upcomingLeviathanStart(now);
  const hpPct = state ? (state.hp / state.maxHp) * 100 : 0;
  const ended = phase === "killed" || phase === "failed";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Grands ennemis"
        title="Le Léviathan"
        description={
          phase === "killed"
            ? "Le colosse est tombé : voici le bilan du combat et ce que chacun a gagné."
            : phase === "failed"
              ? "Le colosse s'est retiré avant de tomber. Les participants sont récompensés à moitié."
              : hasBossSchedule(leviathanSchedule())
                ? `Un monstre colossal surgit ${describeBossSchedule(leviathanSchedule())}. Tout le serveur s'unit pour l'abattre ; chacun est récompensé selon ses dégâts.`
                : "Le colosse dort : aucune apparition n'est programmée pour l'instant."
        }
      />

      <BossHero art={LEVIATHAN_ART} phase={phase} state={state} now={now} next={next} />

      {ended && state && (
        <BossRecapPanel
          state={state}
          uid={player.uid}
          name={LEVIATHAN_RULES.name}
          image="/assets/leviathan/leviathan.webp"
          accent="#ff5c7a"
          active={active}
          legacyNote={state.rewards ? undefined : `${String(Math.round(rewardHours(state, player.uid) * 10) / 10).replace(".", ",")} h de ta production${leviathanRanking(state)[0]?.uid === player.uid && state.status === "killed" ? ` et le titre « ${LEVIATHAN_RULES.title} »` : ""}`}
        />
      )}

      {(ended || phase === "dormant") && (
        <BossNextCard art={LEVIATHAN_ART} next={next} now={now} phase={phase} tip="Renforce ta flotte d'attaque d'ici là : les Traqueurs Kesh frappent 50 % plus fort contre lui." />
      )}

      <MythicRelicNotice source="leviathan" />

      {phase === "active" && state && (
        <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Skull className="h-6 w-6 text-danger-glow" />
            <HudTag tone="danger">En approche</HudTag>
            <span className="ml-auto font-mono text-xs text-slate-400">repart dans {formatDuration(Math.max(0, Math.floor((state.endMs - now) / 1000)))}</span>
          </div>
          <div>
            <div className="flex justify-between font-mono text-xs text-slate-400">
              <span>Structure</span>
              <span>
                {formatNumber(state.hp)} / {formatNumber(state.maxHp)}
              </span>
            </div>
            <div className="mt-1 h-4 overflow-hidden border border-danger-glow/40 bg-danger-glow/10">
              <i className="hud-sheen block h-full bg-gradient-to-r from-danger-glow to-ember-glow transition-[width] duration-700" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tes dégâts" value={formatCompact(mine?.damage ?? 0)} sub={`${mine?.assaults ?? 0} assaut(s)`} tone="var(--color-ember-glow)" />
            <StatTile
              label="Récompense prévue"
              value={`${String(Math.round(rewardHours({ ...state, status: "killed" }, player.uid) * 10) / 10).replace(".", ",")} h`}
              sub="de ta production s'il tombe"
              tone="var(--color-mint-glow)"
            />
            <StatTile label="Participants" value={leviathanRanking(state).length} tone="var(--color-cyan-glow)" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" disabled={wait > 0} onClick={() => setOpen(true)}>
              <Crosshair className="mr-1.5 h-4 w-4" /> {wait > 0 ? `Prochain assaut dans ${formatDuration(Math.ceil(wait / 1000))}` : "Lancer un assaut"}
            </Button>
            <span className="text-xs text-slate-500">Un assaut toutes les {LEVIATHAN_RULES.cooldownHours} h.</span>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {state && phase !== "dormant" && (
          <Card className="flex flex-col gap-3 p-4">
            <h2 className="hud-title flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-gold-glow" /> {ended ? "Classement final des dégâts" : "Classement des dégâts"}
            </h2>
            <Ranking state={state} uid={player.uid} />
          </Card>
        )}
        <RulesCard />
      </div>

      {admin === true && <LeviathanAdminPanel state={state} />}
      {admin === true && <BossRewardsAdmin state={state} kind="leviathan" />}

      <AssaultDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
