import { alpha } from "@/lib/utils";
import { useNowEvery } from "@/hooks/useNowTicker";
import { Link, useLocation } from "react-router-dom";
import { Swords } from "lucide-react";
import { useSeasonAccent } from "@/lib/seasonSkin";
import { useSeasonBoss } from "@/services/seasonBossService";
import { useLeviathan } from "@/services/leviathanService";
import { bossMonthOf } from "@/game/chronicles";
import { isActive, worldBossName, worldBossOf } from "@/game/leviathan";
import { assetUrl } from "@/lib/assets";

/** Minute courante (le thème suit le début et la fin du combat). */
function useMinute(): number {
  return useNowEvery(30_000);
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
      {/* 5.24 : ni filtre blur, ni mode de fusion sur ces calques plein écran : le navigateur
          finissait par les abandonner (mémoire graphique) et tout le fond virait au noir
          jusqu'au rechargement. Dégradés radiaux et simple opacité à la place. */}
      {image && <img src={assetUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.04] grayscale" />}
      <div className={fighting ? "absolute inset-x-0 top-0 h-0.5 animate-pulse" : "absolute inset-x-0 top-0 h-px"} style={{ background: `linear-gradient(90deg, transparent, ${season.accent}, transparent)` }} />
      <div className="absolute -top-40 left-1/2 h-80 w-[70vw] -translate-x-1/2" style={{ background: `radial-gradient(closest-side, ${season.accent}, transparent)`, opacity: fighting ? 0.14 : 0.08 }} />
      <div className="absolute -bottom-40 -right-20 h-72 w-72" style={{ background: `radial-gradient(closest-side, ${season.accent}, transparent)`, opacity: fighting ? 0.1 : 0.05 }} />
      {fighting && <div className="absolute -bottom-40 -left-20 h-72 w-72 opacity-[0.08]" style={{ background: `radial-gradient(closest-side, ${season.accent}, transparent)` }} />}
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
    leviathan && isActive(leviathan, now) ? { to: "/game/uber", name: worldBossName(leviathan), state: leviathan, accent: worldBossOf(leviathan).accent } : null,
    seasonBoss && isActive(seasonBoss, now) ? { to: "/game/boss", name: bossMonthOf(seasonBoss)?.boss.name ?? "Le boss de saison", state: seasonBoss, accent: bossMonthOf(seasonBoss)?.theme.accent ?? "var(--color-ember-glow)" } : null,
  ].filter((b): b is NonNullable<typeof b> => !!b && !pathname.startsWith(b.to));
  if (live.length === 0) return null;
  // 6.14.62 : sans conteneur, chaque ligne est un bandeau de la pile du haut (StripStack, fusion sur téléphone).
  return (
    <>
      {live.map((b) => {
        const pct = Math.round((b.state.hp / b.state.maxHp) * 100);
        const hours = Math.max(0, Math.round((b.state.endMs - now) / 3600_000));
        return (
          <Link key={b.to} to={b.to} data-strip className="group relative z-20 flex items-center gap-2 border-b px-4 py-1.5 text-xs text-slate-200 transition-colors sm:px-6" style={{ borderColor: `${alpha(b.accent, 27)}`, background: `linear-gradient(90deg, ${alpha(b.accent, 13)}, transparent 70%)` }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: b.accent }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: b.accent }} />
            </span>
            <span className="min-w-0 flex-1 truncate">
              <strong className="text-slate-100">{b.name}</strong> est là : {pct} % de structure, encore {hours} h.
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold group-hover:underline" style={{ color: b.accent }}>
              <Swords className="h-3.5 w-3.5" /> Frapper
            </span>
          </Link>
        );
      })}
    </>
  );
}
