import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Crown, Fish, Flame, Newspaper, Skull, Swords, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { allianceCalendar, type CalendarKind } from "@/game/allianceCalendar";
import { normalizeAllianceBoss } from "@/game/allianceBoss";
import { findWarlord } from "@/game/warlords";
import type { AllianceWar } from "@/game/wars";
import { subscribeWars } from "@/services/warService";
import { loadWarlords, useWarlordsStore } from "@/services/warlordService";
import { useLeviathan } from "@/services/leviathanService";
import { cn, formatDuration, formatDateTime } from "@/lib/utils";
import type { Alliance } from "@/types/game";

/* v4.9 : calendrier commun de l'alliance (lecture seule). */

const ICON: Record<CalendarKind, typeof Swords> = { boss: Skull, war: Swords, coalition: Crown, leviathan: Fish, seasonBoss: Flame, gazette: Newspaper, daily: Target };
const TONE: Record<CalendarKind, string> = {
  boss: "text-ember-glow",
  war: "text-danger-glow",
  coalition: "text-gold-glow",
  leviathan: "text-cyan-glow",
  seasonBoss: "text-ember-glow",
  gazette: "text-slate-300",
  daily: "text-gold-glow",
};

function when(ms: number): string {
  return formatDateTime(ms, "short");
}

export function AllianceCalendarTab({ alliance }: { alliance: Alliance }) {
  const [wars, setWars] = useState<AllianceWar[]>([]);
  useEffect(() => {
    return subscribeWars(alliance.id, setWars);
  }, [alliance.id]);
  useEffect(() => {
    void loadWarlords().catch(() => undefined);
  }, []);
  const coalition = useWarlordsStore((s) => s.coalition);
  const leviathan = useLeviathan();
  const now = Date.now();
  const events = useMemo(
    () =>
      allianceCalendar(
        {
          allianceId: alliance.id,
          boss: normalizeAllianceBoss(alliance.boss),
          wars,
          coalition: coalition ? { warlordName: findWarlord(coalition.warlordId)?.name ?? "un seigneur", startedAtMs: coalition.startedAtMs, endsAtMs: coalition.endsAtMs, status: coalition.status } : null,
          leviathan,
        },
        now,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcul à chaque changement des sources
    [alliance.id, alliance.boss, wars, coalition, leviathan],
  );

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
        <CalendarDays className="h-4 w-4 text-cyan-glow" /> Calendrier de l'alliance
      </h3>
      <ol className="flex flex-col gap-2">
        {events.map((e) => {
          const Icon = ICON[e.kind];
          const live = e.startMs <= now && (!e.endMs || e.endMs > now);
          return (
            <li key={`${e.kind}-${e.startMs}-${e.title}`}>
              <Link to={e.to} className={cn("flex items-center gap-3 border p-2.5 transition-colors hover:border-cyan-glow/40", live ? "border-gold-glow/40 bg-gold-glow/[0.05]" : "border-white/10 bg-white/[0.02]")}>
                <Icon className={cn("h-5 w-5 shrink-0", TONE[e.kind])} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-100">{e.title}</span>
                  {e.detail && <span className="block text-[11px] text-slate-500">{e.detail}</span>}
                </span>
                <span className="shrink-0 text-right font-mono text-[11px] text-slate-400">
                  {live ? (
                    <span className="text-gold-glow">En cours{e.endMs ? ` · encore ${formatDuration((e.endMs - now) / 1000)}` : ""}</span>
                  ) : (
                    <>
                      {when(e.startMs)}
                      <span className="block text-slate-500">dans {formatDuration((e.startMs - now) / 1000)}</span>
                    </>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
