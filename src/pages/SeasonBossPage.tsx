import { useState } from "react";
import { BossRewardsAdmin } from "@/components/game/BossRewardsAdmin";
import { toast } from "sonner";
import { Crosshair, Flame, Play, Square, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, HudTag, StatTile } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { BossRecapPanel } from "@/components/game/BossRecap";
import { MythicRelicNotice } from "@/components/game/MythicRelicNotice";
import { AssaultDialog, Ranking } from "@/pages/LeviathanPage";
import { bossMonthOf, chronicleOf, seasonBossWindow, SEASON_BOSS_RULES } from "@/game/chronicles";
import { isActive, LEVIATHAN_RULES, leviathanRanking } from "@/game/leviathan";
import { PASS_POINTS } from "@/game/seasonPass";
import { adminSeasonBoss, sendSeasonBossAssault, useSeasonBoss } from "@/services/seasonBossService";
import { useAdminStatus } from "@/services/maintenanceService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatDuration, formatNumber } from "@/lib/utils";

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

  const stateMonth = state ? bossMonthOf(state) : null;
  const month = stateMonth ?? chronicleOf(now);
  const active = !!state && isActive(state, now);
  const shown = active || (state && stateMonth && stateMonth.id === month?.id) ? state : null;
  const mine = shown?.contributions[player.uid];
  const wait = mine ? mine.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * 3600_000 - now : 0;
  const next = seasonBossWindow(now, true);
  const boss = month?.boss;
  const hpPct = shown ? (shown.hp / shown.maxHp) * 100 : 0;
  const rank = shown ? leviathanRanking(shown).findIndex((r) => r.uid === player.uid) : -1;

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
        description="Le dernier week-end de chaque mois, du vendredi 18 h au dimanche 23 h, le boss de la chronique surgit. Tout le serveur frappe ensemble."
      />
      {/* v5.10 : combat terminé — le bilan passe en tête de page. */}
      {shown && !active && (
        <BossRecapPanel
          state={shown}
          uid={player.uid}
          name={boss?.name ?? "Le boss de saison"}
          image={boss?.image}
          accent={month?.theme.accent}
          active={active}
          legacyNote={shown.rewards ? undefined : `${PASS_POINTS.seasonBoss} points de passe`}
        />
      )}
      <MythicRelicNotice source="seasonboss" />

      {boss && (
        <div className="hud-cut relative overflow-hidden border" style={{ borderColor: `${month!.theme.accent}55` }}>
          <img
            src={assetUrl(boss.image)}
            onError={(e) => ((e.target as HTMLImageElement).src = assetUrl(boss.fallbackImage))}
            alt={boss.name}
            className={cn("h-56 w-full object-cover sm:h-72 lg:h-80", !active && "opacity-60 grayscale-[30%]")}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
            <img src={assetUrl(boss.emblem)} alt="" className="h-14 w-14 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
            <div className="min-w-0">
              <p className="hud-title text-lg text-white">{boss.name}</p>
              <p className="max-w-2xl text-xs text-slate-300">{boss.lore}</p>
            </div>
          </div>
        </div>
      )}

      {shown ? (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Flame className={cn("h-6 w-6", active ? "text-danger-glow" : "text-slate-500")} />
            <HudTag tone={active ? "danger" : shown.status === "killed" ? "mint" : "gold"}>{active ? "En cours" : shown.status === "killed" ? "Abattu" : "Retiré"}</HudTag>
            <span className="ml-auto font-mono text-xs text-slate-400">
              {active ? `repart dans ${formatDuration(Math.max(0, Math.floor((shown.endMs - now) / 1000)))}` : `terminé ${new Date(shown.endedAtMs || shown.endMs).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}
            </span>
          </div>
          <div>
            <div className="flex justify-between font-mono text-xs text-slate-400">
              <span>Structure</span>
              <span>
                {formatNumber(shown.hp)} / {formatNumber(shown.maxHp)}
              </span>
            </div>
            <div className="mt-1 h-4 overflow-hidden border border-danger-glow/40 bg-danger-glow/10">
              <i className="hud-sheen block h-full transition-[width] duration-700" style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, var(--color-danger-glow), ${month?.theme.accent ?? "var(--color-ember-glow)"})` }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tes dégâts" value={formatCompact(mine?.damage ?? 0)} sub={`${mine?.assaults ?? 0} assaut(s)`} tone="var(--color-ember-glow)" />
            <StatTile label="Ton rang" value={rank >= 0 ? `#${rank + 1}` : "—"} sub={rank >= 0 && rank < SEASON_BOSS_RULES.topRelics ? "Relique épique si le boss tombe" : `Top ${SEASON_BOSS_RULES.topRelics} : relique épique`} tone="var(--color-gold-glow)" />
            <StatTile label="Participants" value={leviathanRanking(shown).length} tone="var(--color-cyan-glow)" />
          </div>
          {active && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="danger" disabled={wait > 0} onClick={() => setOpen(true)}>
                <Crosshair className="mr-1.5 h-4 w-4" /> {wait > 0 ? `Prochain assaut dans ${formatDuration(Math.ceil(wait / 1000))}` : "Lancer un assaut"}
              </Button>
              <span className="text-xs text-slate-500">Un assaut toutes les {LEVIATHAN_RULES.cooldownHours} h, {LEVIATHAN_RULES.flightMinutes} min de trajet.</span>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <EmptyState icon={<Flame className="h-10 w-10 text-slate-500" />} title="Pas de boss en ce moment">
            {next ? `Apparition : ${new Date(next.startMs).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.` : "Aucun boss prévu ce mois-ci."}
          </EmptyState>
        </Card>
      )}


      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-gold-glow" /> Classement des dégâts
          </h2>
          {shown ? <Ranking state={shown} uid={player.uid} /> : <p className="text-xs text-slate-500">—</p>}
        </Card>
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
