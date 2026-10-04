import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Swords } from "lucide-react";
import { useSeasonAccent } from "@/lib/seasonSkin";
import { useSeasonBoss } from "@/services/seasonBossService";
import { useLeviathan } from "@/services/leviathanService";
import { bossMonthOf } from "@/game/chronicles";
import { isActive, LEVIATHAN_RULES } from "@/game/leviathan";
import { assetUrl } from "@/lib/assets";

/** Minute courante (le thème suit le début et la fin du combat). */
function useMinute(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * v4.3 : liseré et halo aux couleurs du mois (habillage de saison).
 * v5.10.5 : pendant le combat du boss de saison, l'habillage s'intensifie
 * (halo plus fort, silhouette du boss en fond, liseré qui pulse).
 */
export function SeasonGlow() {
  const season = useSeasonAccent();
  const boss = useSeasonBoss();
  const now = useMinute();
  if (!season) return null;
  const fighting = !!boss && isActive(boss, now);
  const image = fighting ? bossMonthOf(boss)?.boss.image : undefined;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {image && <img src={assetUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.07] mix-blend-screen blur-[2px]" />}
      <div className={fighting ? "absolute inset-x-0 top-0 h-0.5 animate-pulse" : "absolute inset-x-0 top-0 h-px"} style={{ background: `linear-gradient(90deg, transparent, ${season.accent}, transparent)` }} />
      <div className="absolute -top-40 left-1/2 h-80 w-[70vw] -translate-x-1/2 rounded-full blur-3xl" style={{ background: season.accent, opacity: fighting ? 0.24 : 0.12 }} />
      <div className="absolute -bottom-40 -right-20 h-72 w-72 rounded-full blur-3xl" style={{ background: season.accent, opacity: fighting ? 0.16 : 0.08 }} />
      {fighting && <div className="absolute -bottom-40 -left-20 h-72 w-72 rounded-full opacity-[0.12] blur-3xl" style={{ background: season.accent }} />}
    </div>
  );
}

/** v5.10.5 : bandeau « boss en cours » sous l'en-tête, sur toutes les pages sauf la sienne. */
export function BossLiveStrip() {
  const leviathan = useLeviathan();
  const seasonBoss = useSeasonBoss();
  const { pathname } = useLocation();
  const now = useMinute();
  const live = [
    leviathan && isActive(leviathan, now) ? { to: "/game/leviathan", name: LEVIATHAN_RULES.name, state: leviathan, accent: "#ff5c7a" } : null,
    seasonBoss && isActive(seasonBoss, now) ? { to: "/game/boss", name: bossMonthOf(seasonBoss)?.boss.name ?? "Le boss de saison", state: seasonBoss, accent: bossMonthOf(seasonBoss)?.theme.accent ?? "#ff8a4c" } : null,
  ].filter((b): b is NonNullable<typeof b> => !!b && !pathname.startsWith(b.to));
  if (live.length === 0) return null;
  return (
    <div className="relative z-20 flex flex-col">
      {live.map((b) => {
        const pct = Math.round((b.state.hp / b.state.maxHp) * 100);
        const hours = Math.max(0, Math.round((b.state.endMs - now) / 3600_000));
        return (
          <Link key={b.to} to={b.to} className="group flex items-center gap-2 border-b px-4 py-1.5 text-xs text-slate-200 transition-colors sm:px-6" style={{ borderColor: `${b.accent}44`, background: `linear-gradient(90deg, ${b.accent}22, transparent 70%)` }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: b.accent }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: b.accent }} />
            </span>
            <span className="min-w-0 flex-1 truncate">
              <strong className="text-white">{b.name}</strong> est là : {pct} % de structure, encore {hours} h.
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold group-hover:underline" style={{ color: b.accent }}>
              <Swords className="h-3.5 w-3.5" /> Frapper
            </span>
          </Link>
        );
      })}
    </div>
  );
}
