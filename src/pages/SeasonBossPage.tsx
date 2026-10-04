import { useState } from "react";
import { BossRewardsAdmin } from "@/components/game/BossRewardsAdmin";
import { toast } from "sonner";
import { Crosshair, Flame, Play, Square, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudTag, StatTile } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { BossRecapPanel } from "@/components/game/BossRecap";
import { BossHero, BossNextCard, bossPhase, type BossArt } from "@/components/game/BossStage";
import { MythicRelicNotice } from "@/components/game/MythicRelicNotice";
import { AssaultDialog, Ranking } from "@/pages/LeviathanPage";
import { bossMonthOf, chronicleOf, seasonBossWindow, SEASON_BOSS_RULES } from "@/game/chronicles";
import { LEVIATHAN_RULES, leviathanRanking } from "@/game/leviathan";
import { PASS_POINTS } from "@/game/seasonPass";
import { adminSeasonBoss, sendSeasonBossAssault, useSeasonBoss } from "@/services/seasonBossService";
import { useAdminStatus } from "@/services/maintenanceService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatCompact, formatDuration, formatNumber } from "@/lib/utils";

/* v4.3 : boss de saison, le dernier week-end du mois (moteur du Léviathan). */

export function SeasonBossPage() {
  useNowTicker();
  const now = Date.now();
  const player = usePlayerStore((s) => s.player);
  const state = useSeasonBoss();
  const admin = useAdminStatus();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!player) return null;

  // v5.10.2 : comme le Léviathan, la page entière change selon l'état du combat.
  const phase = bossPhase(state, now);
  const active = phase === "active";
  const ended = phase === "killed" || phase === "failed";
  // Prochaine apparition : la fenêtre en cours est sautée si son combat est déjà joué.
  const win = seasonBossWindow(now, true);
  const replayed = !!win && (now >= win.startMs || (!!state && state.id === win.id));
  const next = win ? (replayed ? (seasonBossWindow(win.endMs, true)?.startMs ?? null) : win.startMs) : null;
  // Boss affiché : celui du combat connu, sinon celui de la prochaine apparition.
  const month = (state ? bossMonthOf(state) : null) ?? (next ? chronicleOf(next) : null) ?? chronicleOf(now);
  const boss = month?.boss;
  const mine = state?.contributions[player.uid];
  const wait = mine ? mine.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * 3600_000 - now : 0;
  const hpPct = state ? (state.hp / state.maxHp) * 100 : 0;
  const rank = state ? leviathanRanking(state).findIndex((r) => r.uid === player.uid) : -1;
  const art: BossArt = {
    name: boss?.name ?? "Boss de saison",
    image: boss?.image ?? "",
    fallbackImage: boss?.fallbackImage,
    emblem: boss?.emblem ?? "",
    lore: boss?.lore,
    accent: month?.theme.accent,
  };

  const adminRun = async (action: "start" | "stop") => {
    setBusy(true);
    try {
      await adminSeasonBoss(action);
      toast.success(action === "start" ? "Boss de saison lancé." : "Boss de saison arrêté (récompenses versées).");
    } catch (err) {
      toast.error((err as { response?: { message?: string } })?.response?.message ?? "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Chroniques"
        title={boss?.name ?? "Boss de saison"}
        description={
          phase === "killed"
            ? "Le boss de la chronique est tombé : voici le bilan du combat et ce que chacun a gagné."
            : phase === "failed"
              ? "Le boss s'est retiré avant de tomber. Chaque participant garde ses points de passe."
              : "Le dernier week-end de chaque mois, du vendredi 18 h au dimanche 23 h, le boss de la chronique surgit. Tout le serveur frappe ensemble."
        }
      />

      {boss && <BossHero art={art} phase={phase} state={state} now={now} next={next} />}

      {ended && state && (
        <BossRecapPanel
          state={state}
          uid={player.uid}
          name={boss?.name ?? "Le boss de saison"}
          image={boss?.image}
          accent={month?.theme.accent}
          active={false}
          legacyNote={state.rewards ? undefined : `${PASS_POINTS.seasonBoss} points de passe`}
        />
      )}

      {(ended || phase === "dormant") && (
        <BossNextCard
          art={art}
          next={next}
          now={now}
          phase={phase}
          tip={`Le boss change chaque mois avec la chronique : les ${SEASON_BOSS_RULES.topRelics} premiers en dégâts gagnent une relique épique.`}
        />
      )}

      <MythicRelicNotice source="seasonboss" />

      {active && state && (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Flame className="h-6 w-6 text-danger-glow" />
            <HudTag tone="danger">En cours</HudTag>
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
              <i className="hud-sheen block h-full transition-[width] duration-700" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, var(--color-danger-glow), ${month?.theme.accent ?? "var(--color-ember-glow)"})` }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tes dégâts" value={formatCompact(mine?.damage ?? 0)} sub={`${mine?.assaults ?? 0} assaut(s)`} tone="var(--color-ember-glow)" />
            <StatTile label="Ton rang" value={rank >= 0 ? `#${rank + 1}` : "—"} sub={rank >= 0 && rank < SEASON_BOSS_RULES.topRelics ? "Relique épique si le boss tombe" : `Top ${SEASON_BOSS_RULES.topRelics} : relique épique`} tone="var(--color-gold-glow)" />
            <StatTile label="Participants" value={leviathanRanking(state).length} tone="var(--color-cyan-glow)" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" disabled={wait > 0} onClick={() => setOpen(true)}>
              <Crosshair className="mr-1.5 h-4 w-4" /> {wait > 0 ? `Prochain assaut dans ${formatDuration(Math.ceil(wait / 1000))}` : "Lancer un assaut"}
            </Button>
            <span className="text-xs text-slate-500">Un assaut toutes les {LEVIATHAN_RULES.cooldownHours} h, {LEVIATHAN_RULES.flightMinutes} min de trajet.</span>
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
        <Card className="flex flex-col gap-2 p-4 text-sm text-slate-300">
          <h2 className="hud-title text-sm">Récompenses</h2>
          <p>Chaque participant : +{PASS_POINTS.seasonBoss} points de passe, même si le boss survit.</p>
          <p>S'il tombe : le titre « {boss?.title ?? "Pourfendeur"} » et le sceau du mois, unique, à afficher sur ton profil. Les {SEASON_BOSS_RULES.topRelics} premiers en dégâts gagnent une relique épique.</p>
          <p className="text-xs text-slate-500">Structure : {SEASON_BOSS_RULES.hpFactor} fois la puissance d'attaque cumulée des commandants actifs ces 7 derniers jours.</p>
        </Card>
      </div>

      {admin === true && (
        <Card className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-xs text-slate-400">Administration :</span>
          <Button size="sm" variant="secondary" disabled={busy || active} onClick={() => void adminRun("start")}>
            <Play className="mr-1 h-3.5 w-3.5" /> Lancer maintenant
          </Button>
          <Button size="sm" variant="ghost" disabled={busy || !active} onClick={() => void adminRun("stop")}>
            <Square className="mr-1 h-3.5 w-3.5" /> Arrêter et récompenser
          </Button>
        </Card>
      )}
      {admin === true && <BossRewardsAdmin state={state} kind="seasonboss" />}

      <AssaultDialog open={open} onClose={() => setOpen(false)} title={`Assaut : ${boss?.name ?? "boss de saison"}`} send={sendSeasonBossAssault} />
    </div>
  );
}
