import { useEffect, useMemo, useState } from "react";
import {
  Sword,
  Eye,
  Search,
  Gift,
  Flag,
  ShieldCheck,
  ShieldPlus,
} from "lucide-react";
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
import { getRankIcon, getRankLabel } from "@/game/ranks";
import { currentSeasonId, seasonLabel } from "@/game/seasons";
import { cn, formatNumber } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";
import { TradeModal } from "@/components/game/TradeModal";
import { GarrisonDialog } from "@/components/game/MissionDialogs";
import type { Alliance } from "@/types/game";

type LeaderboardMode = "total" | "season" | "alliances";

export function PlayersPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<LeaderboardMode>("total");
  const uid = useAuthStore((s) => s.user?.uid);
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
  } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{
    uid: string;
    pseudo: string;
  } | null>(null);

  useNowTicker();
  const [myRecentAttacks, setMyRecentAttacks] = useState<
    Record<string, number>
  >({});

  useEffect(() => subscribeLeaderboard(setPlayers), []);
  // Mes attaques des 2 dernières heures (délai avant de réattaquer une cible),
  // rechargées à chaque fermeture de la fenêtre d'attaque.
  useEffect(() => {
    if (!uid || attackTarget) return;
    fetchMyRecentAttacks(uid, Date.now() - PVP_RULES.attackCooldownMs)
      .then(setMyRecentAttacks)
      .catch(() => {});
  }, [uid, attackTarget]);
  useEffect(() => subscribeAlliances(setAlliances), []);

  const season = useMemo(() => currentSeasonId(), []);

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
    const sorted = [...players].sort((a, b) =>
      mode === "season"
        ? (b.seasonId === season ? b.seasonXp : 0) -
          (a.seasonId === season ? a.seasonXp : 0)
        : b.xp - a.xp,
    );
    return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  }, [players, mode, season]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((p) => p.pseudo.toLowerCase().includes(q));
  }, [ranked, search]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Renseignement"
        title="Classement des joueurs"
        description="Espionne ou attaque les autres empires."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as LeaderboardMode)}>
          <TabsList>
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="season">Saison en cours</TabsTrigger>
            <TabsTrigger value="alliances">Alliances</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "season" && (
          <span className="hud-eyebrow text-slate-500">
            {seasonLabel(season)}
          </span>
        )}
      </div>

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
          {filteredAlliances.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <span className="tabular-mono w-6 text-center text-xs text-slate-500">
                #{a.rank}
              </span>
              <Flag className="h-4 w-4 shrink-0 text-gold-glow" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-100">
                  [{a.tag}] {a.name}
                </p>
                <p className="text-xs text-slate-500">
                  {a.members.length} membre{a.members.length > 1 ? "s" : ""}
                </p>
              </div>
              <span className="tabular-mono text-sm text-cyan-glow">
                {formatNumber(a.totalXp)} XP
              </span>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="flex flex-col gap-2 p-3">
          {players.length === 0 && (
            <p className="p-4 text-sm text-slate-500">Aucun joueur trouvé.</p>
          )}
          {players.length > 0 && filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              Aucun joueur ne correspond à « {search} ».
            </p>
          )}
          {filtered.map((p) => {
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
                  lastDefenderDefeatMs: p.lastDefeatAtMs ?? null,
                });
            const isProtected =
              attackCheck?.reason === "newbie" ||
              attackCheck?.reason === "shield";
            const displayXp =
              mode === "season"
                ? p.seasonId === season
                  ? p.seasonXp
                  : 0
                : p.xp;
            return (
              <div
                key={p.uid}
                className={cn(
                  "relative grid grid-cols-[2.5rem_3rem_1fr_auto] items-center gap-3 border bg-gradient-to-r from-white/[0.035] to-transparent px-3 py-2.5 transition-colors [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)] hover:border-cyan-glow/35 hover:from-cyan-glow/[0.08] max-sm:grid-cols-[2rem_2.75rem_1fr] max-sm:gap-2",
                  isSelf ? "border-cyan-glow/60 from-cyan-glow/[0.12]" : "border-cyan-glow/[0.12]",
                )}
              >
                <span
                  className={cn(
                    "hud-title text-center text-2xl tabular-nums max-sm:text-xl",
                    p.rank === 1 ? "text-gold-glow [text-shadow:0_0_10px_color-mix(in_srgb,var(--color-gold-glow)_60%,transparent)]" : p.rank === 2 ? "text-slate-200" : p.rank === 3 ? "text-[#e19b6d]" : "text-slate-600",
                  )}
                >
                  {String(p.rank).padStart(2, "0")}
                </span>
                <img src={getRankIcon(p.xp)} alt="" className="h-12 w-12 object-contain drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-cyan-glow)_25%,transparent)] max-sm:h-11 max-sm:w-11" />
                <div className="min-w-0">
                  <p className="hud-title flex items-center gap-1.5 text-[17px] normal-case tracking-[0.03em] text-white">
                    <span className="truncate">{p.pseudo}</span>
                    {isProtected && (
                      <span title={attackCheck?.message} className="flex items-center text-mint-glow">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {p.activeTitle && <span className="border border-gold-glow/35 bg-gold-glow/[0.06] px-1.5 py-px text-[11px] text-gold-glow">🏆 {p.activeTitle}</span>}
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-glow">
                      {getRankLabel(p.xp)} · {formatNumber(displayXp)} XP
                    </span>
                  </div>
                </div>
                <div className="flex items-center divide-x divide-cyan-glow/15 border border-cyan-glow/15 max-sm:col-span-full max-sm:justify-self-end">
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
                      title="Renforcer (garnison)"
                      onClick={() =>
                        setGarrisonTarget({ uid: p.uid, pseudo: p.pseudo })
                      }
                    >
                      <ShieldPlus className="h-4 w-4 text-cyan-glow" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={
                        attackCheck && !attackCheck.allowed
                          ? attackCheck.message
                          : "Attaquer"
                      }
                      disabled={
                        isSelf || (attackCheck !== null && !attackCheck.allowed)
                      }
                      className="group relative"
                      onClick={() =>
                        setAttackTarget({ uid: p.uid, pseudo: p.pseudo })
                      }
                    >
                      <Sword className="h-4 w-4" />
                      <TargetReticle color="var(--color-danger-glow)" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Envoyer des ressources"
                    disabled={isSelf}
                    className="group relative"
                    onClick={() =>
                      setTradeTarget({ uid: p.uid, pseudo: p.pseudo })
                    }
                  >
                    <Gift className="h-4 w-4" />
                    <TargetReticle color="var(--color-mint-glow)" />
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

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
