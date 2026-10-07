import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, Gift, Map as MapIcon, Swords, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, HudChip, StatTile } from "@/components/ui/hud";
import { HudPanel } from "@/components/ui/panel";
import { SkeletonCards } from "@/components/ui/skeleton";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration, formatNumber, timeAgo, formatDateTime } from "@/lib/utils";
import { SECTOR_COUNT, sectorLabel, TERRITORY_RULES } from "@/game/territories";
import { isTerritoryWarActive, nextTerritoryWar, sectorLeaders, TERRITORY_WAR_RULES, territoryWarRewards, territoryWarStandings } from "@/game/territoryWar";
import { allianceHue, useTerritories } from "@/services/territoryService";
import { useTerritoryWar } from "@/services/territoryWarService";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

/* 5.17 : guerre de territoire. Carte des 24 secteurs en direct (meneur, points,
   écart), classement des alliances, fil des combats et récompenses. */

const allianceColor = (id: string) => `hsl(${allianceHue(id)} 80% 62%)`;

function parisDate(ms: number): string {
  return formatDateTime(ms, "long", "server");
}

export function TerritoryWarPage() {
  useNowTicker();
  const now = Date.now();
  const me = usePlayerStore((s) => s.player);
  const war = useTerritoryWar();
  const territories = useTerritories();
  const rules = TERRITORY_WAR_RULES;
  const live = war && isTerritoryWarActive(war, now) ? war : null;
  const active = !!live;
  const next = nextTerritoryWar(now, rules);
  const leaders = useMemo(() => (war ? sectorLeaders(war) : []), [war]);
  const standings = useMemo(() => (war ? (war.status === "closed" && war.results ? war.results : territoryWarStandings(war)) : []), [war]);
  const rewards = useMemo(() => territoryWarRewards(standings, rules), [standings, rules]);
  const myAlliance = me?.allianceId || "";
  const myRow = standings.find((r) => r.allianceId === myAlliance);
  const myReward = myAlliance ? rewards[myAlliance] : undefined;
  if (!me) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Alliance"
        title="Guerre de territoire"
        description="Un week-end sur deux, les alliances se disputent les 24 secteurs de la galaxie. Chaque secteur a son propre tableau de points : à la fin, il revient à l'alliance en tête."
        right={
          live ? (
            <HudChip tone="danger" alert>
              En cours · <span className="font-mono">{formatDuration((live.endMs - now) / 1000)}</span>
            </HudChip>
          ) : next ? (
            <HudChip tone="accent">
              Prochaine dans <span className="font-mono">{formatDuration(Math.max(0, next.startMs - now) / 1000)}</span>
            </HudChip>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={active ? "Fin de la guerre" : "Prochaine guerre"}
          tone={active ? "danger" : "accent"}
          value={<span className="font-mono text-xl">{live ? formatDuration((live.endMs - now) / 1000) : next ? formatDuration(Math.max(0, next.startMs - now) / 1000) : "—"}</span>}
          sub={live ? parisDate(live.endMs) : next ? parisDate(next.startMs) : "Guerre désactivée par l'équipe"}
        />
        <StatTile label="Mon alliance" tone="mint" value={<span className="font-mono">{myRow ? myRow.sectors.length : 0}</span>} sub={myAlliance ? `secteur${(myRow?.sectors.length ?? 0) > 1 ? "s" : ""} menés · ${formatNumber(myRow?.points ?? 0)} points` : "Rejoins une alliance pour participer"} />
        <StatTile label="Récompense en vue" tone="gold" value={<span className="font-mono">{myReward ? myReward.tokens : 0}</span>} sub={myReward?.title ? `jetons + titre « ${myReward.title} »` : "jetons du casino par membre"} />
        <StatTile label="Secteurs disputés" tone="violet" value={<span className="font-mono">{leaders.filter((l) => l.points > 0).length}</span>} sub={`sur ${SECTOR_COUNT}`} />
      </div>

      {war === undefined ? (
        <SkeletonCards count={2} />
      ) : (
        <HudPanel
          icon={<MapIcon />}
          title={active ? "Carte en direct" : war?.status === "closed" ? "Carte finale de la dernière guerre" : "Carte"}
          tone={active ? "danger" : "muted"}
          aside={active ? <span className="font-mono text-[11px] text-slate-500">mise à jour en temps réel</span> : undefined}
        >
          {!war ? (
            <EmptyState icon={<MapIcon />} title="Aucune guerre jouée pour l'instant" size="sm">
              La carte s'allumera au début de la prochaine guerre{next ? `, ${parisDate(next.startMs)}` : ""}.
            </EmptyState>
          ) : (
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${TERRITORY_RULES.cols}, minmax(0, 1fr))` }}>
              {leaders.map((l) => {
                const mine = !!l.allianceId && l.allianceId === myAlliance;
                const control = territories?.sectors[l.sector];
                const share = l.points > 0 ? Math.round((l.points / (l.points + l.runnerUp)) * 100) : 0;
                const myPts = myAlliance ? (war.points[String(l.sector)]?.[myAlliance] ?? 0) : 0;
                return (
                  <div
                    key={l.sector}
                    className={cn("hud-cut relative flex min-h-[78px] min-w-0 flex-col gap-0.5 overflow-hidden border p-1 sm:p-2", mine ? "border-mint-glow/70" : "border-slate-700/60")}
                    style={l.allianceId ? { background: `hsl(${allianceHue(l.allianceId)} 80% 55% / ${mine ? 0.16 : 0.09})` } : undefined}
                    title={`${sectorLabel(l.sector)}${control?.tag ? ` · contrôlé par [${control.tag}]` : ""}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] text-slate-500">{sectorLabel(l.sector)}</span>
                      {control?.allianceId && <span aria-label="contrôle horaire" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: allianceColor(control.allianceId) }} />}
                    </div>
                    {l.allianceId ? (
                      <span className="truncate font-mono text-[11px] font-bold sm:text-sm" style={{ color: allianceColor(l.allianceId) }}>
                        <span className="hidden sm:inline">[</span>
                        {l.tag || "?"}
                        <span className="hidden sm:inline">]</span>
                      </span>
                    ) : (
                      <span className="truncate font-mono text-[11px] text-slate-500 sm:text-xs">{l.points > 0 ? "égalité" : "libre"}</span>
                    )}
                    <span className="font-mono text-[11px] text-slate-300 sm:text-xs">{formatNumber(l.points)}</span>
                    {l.points > 0 && (
                      <div className="mt-auto h-1 w-full overflow-hidden bg-slate-800">
                        <div className="h-full" style={{ width: `${share}%`, background: l.allianceId ? allianceColor(l.allianceId) : "var(--color-slate-500)" }} />
                      </div>
                    )}
                    {myPts > 0 && !mine && <span className="font-mono text-[11px] text-mint-glow">moi {formatNumber(myPts)}</span>}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Couleur : alliance en tête du secteur. Point : alliance qui contrôle le secteur cette heure (territoires). Barre : part du meneur face à son poursuivant.
          </p>
        </HudPanel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel icon={<Trophy />} title="Classement des alliances" tone="gold" aside={<span className="font-mono text-[11px] text-slate-500">secteurs, puis points</span>}>
          {standings.length === 0 ? (
            <EmptyState icon={<Trophy />} title="Personne n'a encore marqué" size="sm">
              Attaques, défenses et contrôle horaire font entrer ton alliance au classement.
            </EmptyState>
          ) : (
            <ol className="flex flex-col gap-1">
              {standings.slice(0, 12).map((r, i) => {
                const rw = rewards[r.allianceId];
                const mine = r.allianceId === myAlliance;
                return (
                  <li key={r.allianceId} className={cn("flex items-center gap-2 border-l-2 px-2 py-1.5", mine ? "border-mint-glow bg-mint-glow/[0.06]" : "border-transparent")}>
                    <span className="w-6 font-mono text-xs text-slate-500">{i + 1}</span>
                    <Link to={`/game/alliance/fiche/${r.allianceId}`} className="font-mono text-sm font-bold hover:underline" style={{ color: allianceColor(r.allianceId) }}>
                      [{r.tag || "?"}]
                    </Link>
                    <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-slate-300 sm:text-xs">
                      {r.sectors.length} sect. · {formatNumber(r.points)} pts
                    </span>
                    {rw && (
                      <HudChip size="sm" tone="gold">
                        <span className="font-mono">{rw.tokens}</span> jetons
                      </HudChip>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </HudPanel>

        <HudPanel icon={<Activity />} title="Fil de la guerre" tone="accent">
          {!war || war.feed.length === 0 ? (
            <EmptyState icon={<Activity />} title="Rien pour l'instant" size="sm">
              Chaque combat qui rapporte des points s'affiche ici.
            </EmptyState>
          ) : (
            <ul className="flex max-h-[360px] flex-col gap-1 overflow-y-auto">
              {[...war.feed].reverse().slice(0, 25).map((f, i) => (
                <li key={`${f.t}-${i}`} className="flex items-baseline gap-2 text-xs">
                  <span className="shrink-0 whitespace-nowrap font-mono text-[11px] text-slate-500">{timeAgo(f.t)}</span>
                  <span className="min-w-0 flex-1 text-slate-300">{f.text}</span>
                  <span className="shrink-0 font-mono" style={{ color: allianceColor(f.allianceId) }}>
                    +{f.pts}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </HudPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel icon={<Swords />} title="Points par secteur" tone="danger">
          <ul className="grid grid-cols-1 gap-1.5 text-sm text-slate-300 sm:grid-cols-2">
            <li>
              Victoire en attaque sur un joueur : <span className="font-mono text-mint-glow">+{rules.points.pvpWin}</span>
            </li>
            <li>
              Seigneur de guerre pillé : <span className="font-mono text-mint-glow">+{rules.points.warlordWin}</span>
            </li>
            <li>
              Défense tenue : <span className="font-mono text-mint-glow">+{rules.points.defenseWin}</span>
            </li>
            <li>
              Contrôle du secteur, par heure : <span className="font-mono text-mint-glow">+{rules.points.holdPerHour}</span>
            </li>
          </ul>
          <p className="text-xs text-slate-500">
            Les points vont au secteur de la planète visée. Entre deux mêmes joueurs, seuls les {rules.maxPerPair} premiers combats comptent. Le contrôle horaire suit la carte des territoires (niveaux de bâtiments posés dans le secteur).
          </p>
        </HudPanel>
        <HudPanel icon={<Gift />} title="Récompenses de fin" tone="gold">
          <ul className="flex flex-col gap-1.5 text-sm text-slate-300">
            <li>
              Par secteur remporté : <span className="font-mono text-gold-glow">{rules.rewards.tokensPerSector}</span> jetons du casino à chaque membre (au plus <span className="font-mono text-gold-glow">{rules.rewards.maxTokens}</span>).
            </li>
            <li>
              Alliance première : <span className="font-mono text-gold-glow">+{rules.rewards.winnerTokens}</span> jetons{rules.rewards.winnerTitle ? <> et le titre « {rules.rewards.winnerTitle} »</> : null}.
            </li>
            <li className="text-xs text-slate-500">Égalité parfaite en tête d'un secteur : personne ne le remporte. Ces jetons ne comptent pas dans le plafond hebdomadaire du butin.</li>
          </ul>
        </HudPanel>
      </div>
    </div>
  );
}
