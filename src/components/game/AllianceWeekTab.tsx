import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Flame, HandCoins, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, HudMeter } from "@/components/ui/hud";
import { HudPanel } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { PlayerName } from "@/components/ui/player-name";
import { findAllianceChallenge, type AllianceChallengeState } from "@/game/allianceChallenge";
import { normalizeAllianceBoss } from "@/game/allianceBoss";
import { casinoWeekId } from "@/game/casino";
import { fetchAllianceChallenge, subscribeAllianceLogs } from "@/services/allianceService";
import { formatCompact, formatNumber } from "@/lib/utils";
import type { Alliance, AllianceLog } from "@/types/game";

/* 5.15.12 : la semaine de l'alliance d'un coup d'œil : défi, boss, dons au
   trésor et aux projets, et le classement interne des contributions. */

const DAY = 86_400_000;

/** Lundi 0 h (UTC) de la semaine en cours. */
function weekStartMs(now: number): number {
  return Date.parse(`${casinoWeekId(now).slice(3)}T00:00:00Z`);
}

const total = (r: AllianceLog["resources"]) => Object.values(r ?? {}).reduce<number>((a, n) => a + (Number(n) || 0), 0);

export function AllianceWeekTab({ alliance, onOpen }: { alliance: Alliance; onOpen: (tab: string) => void }) {
  const [challenge, setChallenge] = useState<AllianceChallengeState | null | undefined>(undefined);
  const [logs, setLogs] = useState<AllianceLog[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchAllianceChallenge().then((s) => alive && setChallenge(s));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => subscribeAllianceLogs(alliance.id, setLogs), [alliance.id]);
  const now = Date.now();
  const since = weekStartMs(now);

  const ranking = useMemo(() => {
    const by = new Map<string, { uid: string; pseudo: string; deposits: number; projects: number }>();
    for (const l of logs ?? []) {
      if (l.createdAtMs < since || (l.kind !== "deposit" && l.kind !== "project")) continue;
      const row = by.get(l.actorUid) ?? { uid: l.actorUid, pseudo: l.actorPseudo, deposits: 0, projects: 0 };
      if (l.kind === "deposit") row.deposits += total(l.resources);
      else row.projects += total(l.resources);
      by.set(l.actorUid, row);
    }
    return [...by.values()].sort((a, b) => b.deposits + b.projects - (a.deposits + a.projects));
  }, [logs, since]);

  const boss = normalizeAllianceBoss(alliance.boss);
  const bossLive = !!boss && boss.status === "active" && now < boss.endMs && boss.hp > 0;
  const def = challenge ? findAllianceChallenge(challenge.challengeId) : null;
  const rank = challenge ? challenge.standings.findIndex((s) => s.allianceId === alliance.id) : -1;
  const mine = rank >= 0 ? challenge!.standings[rank] : null;
  const daysLeft = Math.max(0, Math.ceil((since + 7 * DAY - now) / DAY));
  const sum = ranking.reduce((a, r) => a + r.deposits + r.projects, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <HudPanel icon={<Trophy />} title={def ? `Défi · ${def.name}` : "Défi de la semaine"} tone="gold" aside={<span className="font-mono text-[11px] text-slate-400">encore {daysLeft} j</span>}>
        {challenge === undefined ? (
          <SkeletonList rows={2} />
        ) : !def ? (
          <p className="text-sm text-slate-400">Le défi commencera au prochain relevé.</p>
        ) : (
          <>
            <p className="text-xs text-slate-400">{def.hint}</p>
            <p className="font-display text-2xl tabular-nums text-slate-100">{mine ? `${rank + 1}e` : "pas encore classée"}</p>
            {mine && (
              <p className="font-mono text-xs text-slate-400">
                {formatNumber(mine.score)} points · {mine.contributors} membre{mine.contributors > 1 ? "s" : ""} ont progressé
              </p>
            )}
          </>
        )}
        <Button size="sm" variant="ghost" className="self-start" onClick={() => onOpen("defi")}>
          Voir le défi
        </Button>
      </HudPanel>

      <HudPanel icon={<Flame />} title="Boss d'alliance" tone="danger">
        {boss ? (
          <>
            <p className="text-sm text-slate-200">{bossLive ? "En cours : chaque assaut compte." : boss.status === "killed" ? "Abattu cette semaine." : boss.status === "failed" ? "Il est reparti." : "Combat terminé."}</p>
            <HudMeter percent={(boss.hp / boss.maxHp) * 100} />
            <p className="font-mono text-[11px] text-slate-400">
              {formatCompact(boss.hp)} / {formatCompact(boss.maxHp)} PV · {Object.keys(boss.contributions ?? {}).length} assaillant(s)
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">Pas encore de boss cette semaine : un officier peut le lancer.</p>
        )}
        <Button size="sm" variant="ghost" className="self-start" onClick={() => onOpen("boss")}>
          Ouvrir le boss
        </Button>
      </HudPanel>

      <HudPanel icon={<HandCoins />} title="Dons de la semaine" tone="accent" aside={<span className="font-mono text-[11px] text-slate-400">{formatCompact(sum)} au total</span>} className="lg:col-span-2">
        {logs === null ? (
          <SkeletonList rows={3} />
        ) : ranking.length === 0 ? (
          <EmptyState size="sm" icon="🏦" title="Aucun don cette semaine" action={<Button size="sm" variant="ghost" onClick={() => onOpen("tresor")}>Déposer au trésor</Button>}>
            Les dépôts au trésor et aux projets depuis lundi s'affichent ici.
          </EmptyState>
        ) : (
          <ol className="grid gap-1.5">
            {ranking.map((r, i) => (
              <li key={r.uid} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto_auto] items-center gap-3 text-sm">
                <span className="font-mono text-xs font-bold tabular-nums text-slate-500">#{i + 1}</span>
                <PlayerName uid={r.uid} pseudo={r.pseudo} className="min-w-0 truncate text-slate-200" />
                <span className="text-right font-mono text-xs tabular-nums text-slate-300" title="Trésor">
                  {formatCompact(r.deposits)}
                </span>
                <span className="w-20 text-right font-mono text-xs tabular-nums text-slate-500" title="Projets">
                  {r.projects > 0 ? `+${formatCompact(r.projects)} proj.` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </HudPanel>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-500 lg:col-span-2">
        <CalendarRange className="h-3.5 w-3.5" /> Semaine du lundi 0 h (UTC) au dimanche soir.
      </p>
    </div>
  );
}
