import { EmpireClassChip } from "@/components/game/EmpireClassChip";
import { Pager, usePaged } from "@/components/ui/panel";
import { MassSpyDialog } from "@/components/game/MassSpyDialog";
import { quickProbeCount, quickSpy } from "@/lib/quickSpy";
import { EmptyState } from "@/components/ui/hud";
import { TitleBadge } from "@/components/game/TitleBadge";
import { OnlineDot } from "@/components/ui/online-dot";
import { PlayerName } from "@/components/ui/player-name";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { AscensionStars } from "@/components/game/AscensionStars";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RankChip } from "@/components/game/LeaderboardPodium";
import { Sword, Eye, Search, Gift, Flag, ShieldCheck, ShieldPlus, Mail, Crosshair, Radar, Scale, Telescope } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { TargetReticle } from "@/components/ui/target-reticle";
import {
  fetchMyRecentAttacks,
  subscribeLeaderboard,
  type LeaderboardEntry,
} from "@/services/playerService";
import { checkAttackAllowed, PVP_RULES } from "@/game/pvp";
import { useNowTicker } from "@/hooks/useNowTicker";
import { subscribeAlliances } from "@/services/allianceService";
import { currentSeasonId, seasonLabel } from "@/game/seasons";
import { cn, formatNumber } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";
import { TradeModal } from "@/components/game/TradeModal";
import { GarrisonDialog } from "@/components/game/MissionDialogs";
import type { Alliance } from "@/types/game";
import { StaffBadge } from "@/components/ui/staff-badge";
import { NpcBadge, VacationBadge } from "@/components/ui/npc-badge";
import { PlayerSheetDialog } from "@/components/game/PlayerSheetDialog";
import { PlayerCompareDialog } from "@/components/game/PlayerCompareDialog";
import { SeasonRewardsCard } from "@/components/game/SeasonRewardsCard";
import { DivisionPanel, DivisionScore, useLeagues, type DivisionView } from "@/components/game/DivisionPanel";
import { leagueStandings, leagueTier, type LeagueRow } from "@/game/leagues";

type LeaderboardMode = "total" | "season" | "alliances" | "divisions";

export function PlayersPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [massSpy, setMassSpy] = useState(false);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<LeaderboardMode>("total");
  const uid = useAuthStore((s) => s.user?.uid);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [spyTarget, setSpyTarget] = useState<{
    uid: string;
    pseudo: string;
  } | null>(null);
  const [garrisonTarget, setGarrisonTarget] = useState<{
    uid: string;
    pseudo: string;
  } | null>(null);
  const [attackTarget, setAttackTarget] = useState<{
    uid: string;
    pseudo: string;
    xp?: number;
  } | null>(null);
  const [sheetTarget, setSheetTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [comparePair, setComparePair] = useState<{ a: string; b: string } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{
    uid: string;
    pseudo: string;
    allianceId?: string | null;
    createdAtMs?: number;
  } | null>(null);

  useNowTicker();
  const [myRecentAttacks, setMyRecentAttacks] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    return subscribeLeaderboard(setPlayers);
  }, []);
  // v3.8 : ouverture depuis la recherche globale (?fiche=uid, ?mode=alliances).
  useEffect(() => {
    const fiche = params.get("fiche");
    const wanted = params.get("mode");
    if (wanted === "alliances" || wanted === "season" || wanted === "total" || wanted === "divisions") setMode(wanted);
    // 5.15.4 : le palmarès quitte le classement (page /game/palmares), les divisions ont leur onglet.
    if (wanted === "palmares") setMode("season");
    if (params.get("onglet") === "ligues" || wanted === "ligues") setMode("divisions");
    if (fiche) {
      const p = players.find((x) => x.uid === fiche);
      setSheetTarget({ uid: fiche, pseudo: p?.pseudo ?? "" });
    }
    if (fiche || wanted || params.get("onglet")) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lecture unique des paramètres
  }, [params]);
  // Mes attaques des 2 dernières heures (délai avant de réattaquer une cible),
  // rechargées à chaque fermeture de la fenêtre d'attaque.
  useEffect(() => {
    if (!uid || attackTarget) return;
    fetchMyRecentAttacks(uid, Date.now() - PVP_RULES.attackCooldownMs)
      .then(setMyRecentAttacks)
      .catch(() => {});
  }, [uid, attackTarget]);
  useEffect(() => {
    return subscribeAlliances(setAlliances);
  }, []);

  const season = useMemo(() => currentSeasonId(), []);
  // 5.15 : divisions (onglet Saison) — par défaut, celle du joueur.
  const leagues = useLeagues();
  const [divisionPick, setDivisionPick] = useState<DivisionView | null>(null);
  const humans = useMemo(() => players.filter((p) => !p.npc), [players]);
  const division: DivisionView = divisionPick ?? (leagues ? leagueTier(leagues, uid ?? "", humans) : "general");
  const divisionRows = useMemo(() => {
    if (mode !== "divisions" || !leagues || division === "general") return null;
    return new Map<string, LeagueRow>(leagueStandings(humans, leagues, division).map((r) => [r.uid, r]));
  }, [mode, leagues, division, humans]);
  const generalSeasonRank = useMemo(() => {
    const sorted = [...humans].sort((a, b) => (b.seasonId === season ? b.seasonXp : 0) - (a.seasonId === season ? a.seasonXp : 0));
    const i = sorted.findIndex((p) => p.uid === uid);
    return i >= 0 ? i + 1 : null;
  }, [humans, season, uid]);

  // Agrégation client-side à partir du classement déjà chargé (top 100 par
  // XP) : les membres hors de ce top 100 ne comptent pas dans le total —
  // approximation acceptable, cohérente avec les autres limites de
  // classement de l'app (déjà 100 côté joueurs, 100 côté alliances).
  const allianceRanking = useMemo(() => {
    const xpByUid = new Map(players.map((p) => [p.uid, p.xp]));
    return alliances
      .map((a) => ({
        ...a,
        totalXp: a.members.reduce((sum, m) => sum + (xpByUid.get(m) ?? 0), 0),
      }))
      .sort((a, b) => b.totalXp - a.totalXp)
      .map((a, i) => ({ ...a, rank: i + 1 }));
  }, [alliances, players]);
  const filteredAlliances = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allianceRanking;
    return allianceRanking.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q),
    );
  }, [allianceRanking, search]);

  // Le classement (#N) reste basé sur la position réelle dans le tableau
  // complet, même une fois la liste filtrée par la recherche. Le tri par
  // saison se fait ici côté client (top 100 déjà chargé) plutôt que via
  // un second abonnement temps réel.
  const ranked = useMemo(() => {
    // 5.15 : dans une division, l'ordre et le rang sont ceux de la semaine.
    if (divisionRows) {
      return humans
        .filter((p) => divisionRows.has(p.uid))
        .map((p) => ({ ...p, rank: divisionRows.get(p.uid)!.rank }))
        .sort((a, b) => a.rank - b.rank);
    }
    // Les seigneurs de guerre (PNJ) ne sont pas classés.
    const sorted = players.filter((p) => !p.npc).sort((a, b) =>
      mode === "season" || mode === "divisions"
        ? (b.seasonId === season ? b.seasonXp : 0) -
          (a.seasonId === season ? a.seasonXp : 0)
        : b.xp - a.xp,
    );
    return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  }, [players, mode, season, divisionRows, humans]);
  const reduced = useReducedMotion() ?? false;
  const displayXpOf = (p: LeaderboardEntry) => (divisionRows ? (divisionRows.get(p.uid)?.score ?? 0) : mode === "season" || mode === "divisions" ? (p.seasonId === season ? p.seasonXp : 0) : p.xp);
  const xpSuffix = divisionRows ? " cette semaine" : mode === "season" || mode === "divisions" ? " de saison" : "";
  const myRank = ranked.find((p) => p.uid === uid)?.rank ?? null;
  const jumpToMe = () => {
    setSearch("");
    requestAnimationFrame(() => document.getElementById(`rang-${uid}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }));
  };
  const topAllianceXp = allianceRanking[0]?.totalXp || 1;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((p) => p.pseudo.toLowerCase().includes(q));
  }, [ranked, search]);
  // 5.15.12 : 50 joueurs à la fois.
  // 5.24 : joueurs paginés (taille des Réglages).
  const playersPage = usePaged(filtered, undefined, `${mode}|${search}`);
  const shownPlayers = playersPage.items;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Renseignement"
        title="Classement des joueurs"
        description="Espionne ou attaque les autres empires."
      />
      {/* 5.23 : espionnage en masse (5 cibles) et tableau comparatif. */}
      <div className="-mt-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setMassSpy(true)}>
          <Radar className="mr-1.5 h-4 w-4" /> Espionnage en masse
        </Button>
      </div>
      <MassSpyDialog open={massSpy} onClose={() => setMassSpy(false)} candidates={humans.map((p) => ({ uid: p.uid, pseudo: p.pseudo }))} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as LeaderboardMode)} className="min-w-0 max-w-full">
          <TabsList>
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="season">Saison en cours</TabsTrigger>
            <TabsTrigger value="alliances">Alliances</TabsTrigger>
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-3">
          {mode === "season" && (
            <span className="hud-eyebrow text-slate-500">
              {seasonLabel(season)}
            </span>
          )}
          {mode !== "alliances" && myRank && (
            <Button variant="secondary" size="sm" onClick={jumpToMe}>
              <Crosshair className="h-3.5 w-3.5" /> Ma position · #{myRank}
            </Button>
          )}
        </div>
      </div>

      <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            mode === "alliances"
              ? "Rechercher une alliance…"
              : "Rechercher un joueur…"
          }
          className="pl-9"
        />
      </div>

      {mode === "season" && <SeasonRewardsCard seasonId={season} />}
      {mode === "divisions" && leagues && <DivisionPanel state={leagues} entries={humans} uid={uid ?? ""} view={division} onView={setDivisionPick} generalRank={generalSeasonRank} />}

      {mode === "alliances" ? (
        <Card className="divide-y divide-white/5">
          {allianceRanking.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              Aucune alliance pour l'instant.
            </p>
          )}
          {allianceRanking.length > 0 && filteredAlliances.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              Aucune alliance ne correspond à « {search} ».
            </p>
          )}
          {filteredAlliances.map((a, i) => (
            <motion.div
              key={a.id}
              initial={reduced ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: reduced ? 0 : Math.min(i, 15) * 0.035 }}
              className="flex items-center gap-3 p-3"
            >
              <span className={cn("font-mono font-bold tabular-nums w-8 text-center text-lg", a.rank === 1 ? "text-gold-glow" : a.rank === 2 ? "text-slate-200" : a.rank === 3 ? "text-[var(--th-medal-bronze)]" : "text-slate-500")}>
                {String(a.rank).padStart(2, "0")}
              </span>
              <Flag className="h-4 w-4 shrink-0 text-gold-glow" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-100">
                  [{a.tag}] {a.name}
                </p>
                <p className="text-xs text-slate-500">
                  {a.members.length} membre{a.members.length > 1 ? "s" : ""}
                </p>
                <div className="mt-1.5 h-1 max-w-xs overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold-glow/50 to-gold-glow"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((a.totalXp / topAllianceXp) * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: reduced ? 0 : 0.15 + Math.min(i, 15) * 0.035 }}
                  />
                </div>
              </div>
              <span className="tabular-mono text-sm text-cyan-glow">
                {formatNumber(a.totalXp)} XP
              </span>
            </motion.div>
          ))}
        </Card>
      ) : (
        <>
        <Card key={`list-${mode}-${division}`} className="flex flex-col gap-2 p-3">
          {players.length === 0 && (
            <EmptyState icon={<Telescope />} title="Aucun joueur trouvé">Essaie un autre nom ou un autre filtre.</EmptyState>
          )}
          {players.length > 0 && filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              Aucun joueur ne correspond à « {search} ».
            </p>
          )}
          {shownPlayers.map((p, i) => {
            const isSelf = p.uid === uid;
            const me = players.find((x) => x.uid === uid);
            const attackCheck = isSelf
              ? null
              : checkAttackAllowed({
                  now: Date.now(),
                  attackerUid: uid ?? "",
                  attackerXp: me?.xp ?? 0,
                  defenderUid: p.uid,
                  defenderXp: p.xp,
                  defenderCreatedAtMs: p.createdAtMs,
                  defenderHasAttacked: (p.lastAttackAtMs ?? 0) > 0,
                  lastAttackOnTargetMs: myRecentAttacks[p.uid] ?? null,
                  defenderAscendedAtMs: p.ascendedAtMs,
                  lastDefenderDefeatMs: p.lastDefeatAtMs ?? null,
                  defenderVacationUntilMs: p.vacationUntilMs,
                  defenderIsWarlord: !!p.npc,
                });
            // 5.18 : un pacte n'interdit plus l'attaque à titre personnel (seulement la guerre d'alliance).
            const isProtected =
              attackCheck?.reason === "newbie" ||
              attackCheck?.reason === "shield";
            const displayXp = displayXpOf(p);
            // Rang et insigne suivent l'XP affichée (et donc l'ordre du classement) :
            // en saison, le rang de saison, pas celui de l'XP totale.
            return (
              <motion.div
                key={p.uid}
                id={`rang-${p.uid}`}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut", delay: reduced ? 0 : Math.min(i, 20) * 0.03 }}
                whileHover={reduced ? undefined : { x: 3 }}
                className={cn(
                  "relative grid grid-cols-[2.5rem_3rem_minmax(0,1fr)_11rem_auto] items-center gap-3 border bg-gradient-to-r from-white/[0.035] to-transparent px-3 py-2.5 transition-colors [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)] hover:border-cyan-glow/35 hover:from-cyan-glow/[0.08] max-lg:grid-cols-[2.5rem_3rem_minmax(0,1fr)_auto] max-sm:grid-cols-[2rem_2.75rem_1fr] max-sm:gap-2",
                  isSelf ? "leaderboard-self border-cyan-glow/60 from-cyan-glow/[0.12]" : p.rank <= 3 ? "border-gold-glow/25" : "border-cyan-glow/[0.12]",
                )}
              >
                <span
                  className={cn(
                    "font-mono font-bold tabular-nums text-center text-2xl max-sm:text-xl",
                    p.rank === 1 ? "text-gold-glow [text-shadow:0_0_10px_color-mix(in_srgb,var(--color-gold-glow)_60%,transparent)]" : p.rank === 2 ? "text-slate-200" : p.rank === 3 ? "text-[var(--th-medal-bronze)]" : "text-slate-500",
                  )}
                >
                  {String(p.rank).padStart(2, "0")}
                </span>
                <button type="button" title="Voir la fiche" onClick={() => setSheetTarget({ uid: p.uid, pseudo: p.pseudo })} className="relative h-12 w-12 max-sm:h-11 max-sm:w-11">
                  <PlayerAvatar uid={p.uid} pseudo={p.pseudo} file={p.avatar} className="h-full w-full" />
                  <OnlineDot uid={p.uid} className="absolute -right-0.5 -top-0.5" />
                </button>
                <div className="min-w-0">
                  <p className="hud-title flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[17px] normal-case tracking-[0.03em] text-slate-100">
                    <button type="button" title="Voir la fiche" onClick={() => setSheetTarget({ uid: p.uid, pseudo: p.pseudo })} className="min-w-0 max-w-full truncate text-left hover:text-cyan-glow">
                      <PlayerName uid={p.uid} pseudo={p.pseudo} allianceId={p.allianceId ?? null} presence={false} />
                    </button>
                    <AscensionStars count={p.ascensions} />
                    <StaffBadge uid={p.uid} compact />
                    {p.npc && <NpcBadge />}
                    {(p.vacationUntilMs ?? 0) > Date.now() && <VacationBadge untilMs={p.vacationUntilMs!} />}
                    {isProtected && (
                      <span title={attackCheck?.message} className="flex items-center text-mint-glow">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {/* 5.22 : raison visible quand l'attaque est impossible (écart d'XP, délai entre deux attaques). */}
                    {!isSelf && !(me?.allianceId && p.allianceId === me.allianceId) && (attackCheck?.reason === "too_weak" || attackCheck?.reason === "cooldown") && (
                      <span title={attackCheck.message} className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">
                        {attackCheck.reason === "too_weak" ? "hors de portée" : "attaqué récemment"}
                      </span>
                    )}
                  </p>
                  {(p.activeTitle || p.empireClass) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.activeTitle && <TitleBadge label={p.activeTitle} size="xs" />}
                      <EmpireClassChip classId={p.empireClass} />
                    </div>
                  )}
                  {/* Rang sous le pseudo quand la colonne dédiée n'a pas la place. */}
                  {divisionRows ? (
                    <DivisionScore row={divisionRows.get(p.uid) ?? { score: 0, zone: "stay" }} className="mt-1.5 justify-start lg:hidden" />
                  ) : (
                    <RankChip xp={displayXp} suffix={xpSuffix} showProgress={mode !== "season"} className="mt-1.5 lg:hidden" />
                  )}
                </div>
                {divisionRows ? (
                  <DivisionScore row={divisionRows.get(p.uid) ?? { score: 0, zone: "stay" }} className="max-lg:hidden" />
                ) : (
                  <RankChip xp={displayXp} suffix={xpSuffix} showProgress={mode !== "season"} className="max-lg:hidden" />
                )}
                <div className="flex items-center divide-x divide-cyan-glow/15 border border-cyan-glow/15 max-sm:col-span-full max-sm:justify-self-end">
                  {!isSelf && (
                    <Button variant="ghost" size="icon" title={`Sondes en 1 clic (${quickProbeCount()})`} aria-label={`Envoyer ${quickProbeCount()} sondes à ${p.pseudo}`} onClick={() => void quickSpy({ uid: p.uid, pseudo: p.pseudo })}>
                      <Radar className="h-4 w-4 text-cyan-glow" />
                    </Button>
                  )}
                  {!isSelf && !p.npc && uid && (
                    <Button variant="ghost" size="icon" title={`Comparer avec ${p.pseudo}`} aria-label={`Comparer avec ${p.pseudo}`} onClick={() => setComparePair({ a: uid, b: p.uid })}>
                      <Scale className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Espionner"
                    className="group relative"
                    onClick={() =>
                      setSpyTarget({ uid: p.uid, pseudo: p.pseudo })
                    }
                  >
                    <Eye className="h-4 w-4" />
                    <TargetReticle color="var(--color-cyan-glow)" />
                  </Button>
                  {!isSelf &&
                  me?.allianceId &&
                  p.allianceId === me.allianceId ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Renforcer (garnison)" aria-label="Renforcer (garnison)"
                      onClick={() =>
                        setGarrisonTarget({ uid: p.uid, pseudo: p.pseudo })
                      }
                    >
                      <ShieldPlus className="h-4 w-4 text-cyan-glow" />
                    </Button>
                  ) : (
                    // 5.22 : un bouton désactivé n'affiche pas d'infobulle : la raison est portée par l'enveloppe.
                    <span className="inline-flex" title={attackCheck && !attackCheck.allowed ? attackCheck.message : "Attaquer"}>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={attackCheck && !attackCheck.allowed ? attackCheck.message : "Attaquer"}
                      disabled={
                        isSelf || (attackCheck !== null && !attackCheck.allowed)
                      }
                      className="group relative"
                      onClick={() =>
                        setAttackTarget({ uid: p.uid, pseudo: p.pseudo, xp: p.xp })
                      }
                    >
                      <Sword className="h-4 w-4" />
                      <TargetReticle color="var(--color-danger-glow)" />
                    </Button>
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title={p.npc ? "On ne fait pas de cadeau à un seigneur de guerre" : "Envoyer des ressources"}
                    disabled={isSelf || !!p.npc}
                    className="group relative"
                    onClick={() =>
                      setTradeTarget({ uid: p.uid, pseudo: p.pseudo, allianceId: p.allianceId ?? null, createdAtMs: p.createdAtMs })
                    }
                  >
                    <Gift className="h-4 w-4" />
                    <TargetReticle color="var(--color-mint-glow)" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
          <Pager {...playersPage.pager} />
        </Card>
        </>
      )}
      </>

      <PlayerCompareDialog pair={comparePair} players={players} onClose={() => setComparePair(null)} />
      <PlayerSheetDialog
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
        actions={
          sheetTarget && sheetTarget.uid !== uid ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/game/messages?with=${sheetTarget.uid}&pseudo=${encodeURIComponent(sheetTarget.pseudo)}`)}>
                <Mail className="h-3.5 w-3.5" /> Écrire
              </Button>
              {uid && (
                <Button variant="ghost" size="sm" onClick={() => (setComparePair({ a: uid, b: sheetTarget.uid }), setSheetTarget(null))}>
                  <Scale className="h-3.5 w-3.5" /> Comparer
                </Button>
              )}
            </>
          ) : null
        }
      />
      <SpyModal target={spyTarget} onClose={() => setSpyTarget(null)} />
      <GarrisonDialog
        target={garrisonTarget}
        onClose={() => setGarrisonTarget(null)}
      />
      <AttackModal
        target={attackTarget}
        onClose={() => setAttackTarget(null)}
      />
      <TradeModal target={tradeTarget} onClose={() => setTradeTarget(null)} />
    </div>
  );
}
