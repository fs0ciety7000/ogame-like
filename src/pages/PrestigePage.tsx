import { useEffect, useState } from "react";
import { Hammer, Landmark, Trophy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudCallout, HudChip, HudMeter, StatTile } from "@/components/ui/hud";
import { CostPills } from "@/components/ui/afford";
import { Button } from "@/components/ui/button";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { PlayerName } from "@/components/ui/player-name";
import { findBuilding, effectiveBuildingLevel } from "@/game/buildings";
import { canAffordAll } from "@/game/resources";
import {
  nextPrestigeMonument,
  PRESTIGE_EXTRACTORS,
  PRESTIGE_IMAGE,
  PRESTIGE_RULES,
  prestigeBlocker,
  prestigeCost,
  prestigeDurationMs,
  prestigeHours,
  prestigeMonument,
  prestigeMonuments,
  prestigeState,
  prestigeUnlocked,
  prestigeUnlockLevel,
} from "@/game/prestige";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { cn, formatClock, formatDateTime, formatDecimal, formatNumber } from "@/lib/utils";
import { fetchPrestigeLeaderboard, GameActionError, startPrestigeProject, type LeaderboardEntry } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import type { Resources } from "@/types/game";

/* =====================================================
   6.14.85 (RL-2, proposals/rythme-long-terme.md §5.2) : projets de prestige.
   Une carte simple : le chantier (coût en heures de production, durée, un
   projet à la fois), le monument et le classement. Récompense visible
   seulement (Q168) : or = prestige (docs/DESIGN.md, couleurs = sens).
===================================================== */

function PrestigeLeaderboard({ uid }: { uid: string }) {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchPrestigeLeaderboard(10)
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch(() => {
        if (alive) setRows([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <HudPanel icon={<Trophy />} title="Classement du prestige" tone="gold">
      {rows === null ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : rows.length === 0 ? (
        <EmptyState size="sm" icon={<Landmark className="h-5 w-5" />} title="Aucun projet achevé">
          Le premier projet achevé ouvre le classement.
        </EmptyState>
      ) : (
        <ol className="flex flex-col gap-1">
          {rows.map((r, i) => (
            <li key={r.uid} className={cn("flex items-center gap-2 border-l-2 px-2 py-1 text-sm", r.uid === uid ? "border-gold-glow bg-gold-glow/10" : "border-white/10")}>
              <span className="w-6 font-mono text-xs tabular-nums text-slate-400">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">
                <PlayerName uid={r.uid} pseudo={r.pseudo} allianceId={r.allianceId ?? null} presence={false} />
              </span>
              <span className="hidden text-xs text-slate-400 sm:inline">{prestigeMonument(r.prestigeProjects ?? 0)?.name ?? ""}</span>
              <span className="font-mono text-xs tabular-nums text-gold-glow">{formatNumber(r.prestigePoints ?? 0)} pts</span>
            </li>
          ))}
        </ol>
      )}
    </HudPanel>
  );
}

export function PrestigePage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const now = Date.now();
  const st = prestigeState(player);
  const unlocked = prestigeUnlocked(player);
  const need = prestigeUnlockLevel();
  const cost = prestigeCost(player);
  const hours = prestigeHours(player);
  const durationS = Math.round(prestigeDurationMs() / 1000);
  const affordable = canAffordAll(player.resources, cost as Partial<Resources>);
  const blocker = prestigeBlocker(player);
  const monument = prestigeMonument(st.projects);
  const next = nextPrestigeMonument(st.projects);
  const active = st.active;

  const launch = async () => {
    const ok = await askConfirm({
      title: "Lancer un projet de prestige ?",
      message: `${formatDecimal(hours, 1)} h de ta production commune, pour ${PRESTIGE_RULES.pointsPerProject} points de prestige dans ${formatDecimal(durationS / 3600, 1)} h. Un projet ne s'annule pas.`,
      details: <CostPills cost={cost} stock={player.resources} seconds={durationS} />,
      confirmLabel: "Lancer",
      tone: "gold",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await startPrestigeProject();
      toast.success("Projet de prestige lancé.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Impossible de lancer le projet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Empire" title="Prestige" description="Ta production en trop bâtit des monuments. Aucun bonus : des points, un classement, un monument sur ta fiche et des succès." />

      <HudPanel
        icon={<Hammer />}
        title="Chantier de prestige"
        tone="gold"
        accent
        aside={
          active ? (
            <HudChip size="sm" tone="gold" alert>
              En cours
            </HudChip>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <img src={assetUrl(PRESTIGE_IMAGE)} alt="" className="hud-cut-sm h-32 w-full object-cover sm:h-36 sm:w-48" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {!unlocked ? (
              <>
                <p className="text-sm text-slate-300">Les projets s'ouvrent quand tes 4 extracteurs atteignent le niveau {need}.</p>
                <ul className="flex flex-col gap-2">
                  {PRESTIGE_EXTRACTORS.map((id) => {
                    const lvl = effectiveBuildingLevel(player.buildings, id);
                    return (
                      <li key={id} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>{findBuilding(id)?.name ?? id}</span>
                          <span className="font-mono tabular-nums">
                            {Math.min(lvl, need)} / {need}
                          </span>
                        </div>
                        <HudMeter percent={need > 0 ? Math.min(100, (lvl / need) * 100) : 100} />
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : active ? (
              <>
                <p className="text-sm text-slate-300">Projet n° {formatNumber(st.projects + 1)} en chantier.</p>
                <HudMeter percent={Math.min(100, ((now - active.startedAtMs) / Math.max(1, active.endsAtMs - active.startedAtMs)) * 100)} tone="var(--color-gold-glow)" />
                <p className="font-mono text-xs tabular-nums text-slate-400">
                  {active.endsAtMs > now ? `Reste ${formatClock(Math.ceil((active.endsAtMs - now) / 1000))} · fin ${formatDateTime(active.endsAtMs, "time")}` : "Achèvement en cours…"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">
                  Prochain projet : <span className="font-mono tabular-nums">{formatDecimal(hours, 1)} h</span> de ta production commune, <span className="font-mono tabular-nums">+{PRESTIGE_RULES.pointsPerProject}</span> points de prestige.
                </p>
                <CostPills cost={cost} stock={player.resources} seconds={durationS} />
                <div className="flex flex-col gap-1">
                  <Button variant="primary" size="sm" className="self-start" disabled={busy || !!blocker || !affordable} onClick={() => void launch()}>
                    <Landmark className="mr-1 h-3.5 w-3.5" /> Lancer le projet
                  </Button>
                  {blocker ? <p className="text-xs text-slate-400">{blocker}</p> : !affordable ? <p className="text-xs text-slate-400">Ressources insuffisantes : attends un peu de production.</p> : null}
                </div>
              </>
            )}
          </div>
        </div>
        <HudCallout tone="neutral" className="text-xs text-slate-300">
          Un projet à la fois. Son prix suit ta production : il reste abordable à tout stade, même après une Ascension. Ton compteur et ton monument restent pour toujours.
        </HudCallout>
      </HudPanel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile tone="gold" label="Projets achevés" value={<span className="font-mono tabular-nums">{formatNumber(st.projects)}</span>} sub={next ? `Prochain monument à ${formatNumber(next.projects)}` : "Dernier monument atteint"} />
        <StatTile tone="gold" label="Points de prestige" value={<span className="font-mono tabular-nums">{formatNumber(st.points)}</span>} sub="classement ci-dessous" />
        <StatTile tone="neutral" label="Monument" value={monument?.name ?? "Aucun"} sub={monument ? "visible sur ta fiche publique" : `au 1er projet achevé`} className="col-span-2 lg:col-span-1" />
      </div>

      <HudPanel icon={<Landmark />} title="Monuments">
        <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {prestigeMonuments().map((m) => {
            const reached = st.projects >= m.projects;
            return (
              <li key={`${m.projects}-${m.name}`} className={cn("flex items-center justify-between border-l-2 px-2 py-1 text-sm", reached ? "border-gold-glow text-slate-100" : "border-white/10 text-slate-400")}>
                <span>{m.name}</span>
                <span className="font-mono text-xs tabular-nums">
                  {formatNumber(m.projects)} {m.projects > 1 ? "projets" : "projet"}
                </span>
              </li>
            );
          })}
        </ol>
      </HudPanel>

      <PrestigeLeaderboard uid={player.uid} />
    </div>
  );
}
