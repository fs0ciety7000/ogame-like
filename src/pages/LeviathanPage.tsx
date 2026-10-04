import { PlayerName } from "@/components/ui/player-name";
import { BossRewardsAdmin } from "@/components/game/BossRewardsAdmin";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { computeFleetPower } from "@/game/combat";
import { formationEffects, type FormationId } from "@/game/formations";
import { isActive, LEVIATHAN_RULES, leviathanRanking, nextLeviathanStart, rewardHours, upcomingLeviathanStart, type LeviathanState } from "@/game/leviathan";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { sendLeviathanAssault, useLeviathan } from "@/services/leviathanService";
import { useAdminStatus } from "@/services/maintenanceService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatCompact, formatDuration, formatNumber } from "@/lib/utils";
import { assetUrl } from "@/lib/assets";

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

/** « 12 j 4 h », « 5 h 20 min », « 3 min » */
function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} j ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${Math.max(1, m)} min`;
}

type Phase = "dormant" | "active" | "killed" | "failed";

const PHASE_STYLE: Record<Phase, { label: string; color: string; stamp?: string }> = {
  dormant: { label: "En sommeil", color: "#94a3b8" },
  active: { label: "Menace en cours", color: "#ff5c7a" },
  killed: { label: "Abattu", color: "#5cf2b0", stamp: "Abattu" },
  failed: { label: "Retiré", color: "#ffb347", stamp: "Retiré" },
};

/** v5.10 : bandeau du Léviathan, différent selon l'état du combat. */
function LeviathanHero({ phase, state, now, next }: { phase: Phase; state: LeviathanState | null; now: number; next: number | null }) {
  const st = PHASE_STYLE[phase];
  const ended = phase === "killed" || phase === "failed";
  const hpPct = state ? Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100)) : 0;
  return (
    <div className="hud-cut relative overflow-hidden border" style={{ borderColor: `${st.color}55` }}>
      <picture>
        <source media="(max-width: 640px)" srcSet={assetUrl("/assets/leviathan/leviathan-portrait.webp")} />
        <img
          src={assetUrl("/assets/leviathan/leviathan.webp")}
          alt="Le Léviathan"
          className={cn(
            "h-64 w-full object-cover object-[center_72%] transition-[filter,opacity] duration-700 sm:h-72 lg:h-80",
            phase === "killed" && "opacity-50 grayscale",
            phase === "failed" && "opacity-60 grayscale-[60%]",
            phase === "dormant" && "opacity-35 blur-[1px] grayscale-[70%]",
          )}
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/30 to-transparent" />
      {phase === "killed" && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(92,242,176,0.10),transparent_70%)]" />}

      {/* Tampon de fin de combat. */}
      {st.stamp && (
        <div
          className="absolute right-6 top-6 -rotate-6 border-4 px-4 py-1 font-display text-2xl font-black uppercase tracking-[0.25em] sm:right-10 sm:top-10 sm:text-4xl"
          style={{ color: st.color, borderColor: st.color, textShadow: `0 0 18px ${st.color}88`, boxShadow: `0 0 24px ${st.color}44` }}
        >
          {st.stamp}
        </div>
      )}

      <div className="absolute inset-x-4 bottom-3 flex flex-wrap items-end gap-3">
        <img src={assetUrl("/assets/leviathan/leviathan-emblem.webp")} alt="" className={cn("h-14 w-14 drop-shadow-[0_0_14px_rgba(255,60,60,0.45)]", ended && "grayscale")} />
        <div className="min-w-0 flex-1">
          <p className="hud-title text-lg text-white">{LEVIATHAN_RULES.name}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: st.color }}>
            {st.label}
            {phase === "killed" && state && <> · le {new Date(state.endedAtMs || state.endMs).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</>}
            {phase === "failed" && state && <> · structure entamée à {Math.round(100 - hpPct)} %</>}
          </p>
          {phase === "killed" && state?.killedBy && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-300">
              <Skull className="h-3.5 w-3.5 text-danger-glow" /> Coup de grâce : <PlayerName uid={state.killedBy.uid} pseudo={state.killedBy.pseudo} className="font-semibold text-white" />
            </p>
          )}
        </div>
        {/* Compte à rebours : départ (en cours) ou retour (sinon). */}
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{phase === "active" ? "Repart dans" : next ? "Retour dans" : ""}</p>
          <p className="font-display text-xl tabular-nums text-white">{phase === "active" && state ? countdown(state.endMs - now) : next ? countdown(next - now) : "—"}</p>
        </div>
      </div>

      {phase === "active" && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-black/40">
          <i className="block h-full bg-gradient-to-r from-danger-glow to-ember-glow transition-[width] duration-700" style={{ width: `${hpPct}%` }} />
        </div>
      )}
    </div>
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

function NextCard({ next, now, phase }: { next: number | null; now: number; phase: Phase }) {
  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      <img src={assetUrl("/assets/leviathan/leviathan-emblem.webp")} alt="" className="h-10 w-10 opacity-80" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-white">{phase === "dormant" ? "Le Léviathan dort" : "Il reviendra"}</p>
        <p className="text-xs text-slate-400">
          {next
            ? `Prochaine apparition : ${new Date(next).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} — dans ${countdown(next - now)}.`
            : "Les apparitions mensuelles sont désactivées."}{" "}
          Renforce ta flotte d'attaque d'ici là : les Traqueurs Kesh frappent 50 % plus fort contre lui.
        </p>
      </div>
      <Link to="/game/hall-of-fame" className="inline-flex items-center gap-1.5 border border-gold-glow/40 px-3 py-1.5 text-xs text-gold-glow hover:bg-gold-glow/10">
        <Trophy className="h-3.5 w-3.5" /> Hall of fame
      </Link>
    </Card>
  );
}

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
  const phase: Phase = !state ? "dormant" : active ? "active" : state.status === "killed" || state.hp <= 0 ? "killed" : "failed";
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
              : "Un monstre colossal surgit le premier week-end de chaque mois. Tout le serveur s'unit pour l'abattre ; chacun est récompensé selon ses dégâts."
        }
      />

      <LeviathanHero phase={phase} state={state} now={now} next={next} />

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

      {(ended || phase === "dormant") && <NextCard next={next} now={now} phase={phase} />}

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
