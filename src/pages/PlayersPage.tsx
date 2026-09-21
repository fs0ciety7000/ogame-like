import { useEffect, useMemo, useState } from "react";
import { Sword, Eye, Search, Gift, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { TargetReticle } from "@/components/ui/target-reticle";
import { subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { subscribeAlliances } from "@/services/allianceService";
import { getRankLabel } from "@/game/ranks";
import { currentSeasonId, seasonLabel } from "@/game/seasons";
import { formatNumber } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";
import { TradeModal } from "@/components/game/TradeModal";
import type { Alliance } from "@/types/game";

type LeaderboardMode = "total" | "season" | "alliances";

export function PlayersPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<LeaderboardMode>("total");
  const uid = useAuthStore((s) => s.user?.uid);
  const [spyTarget, setSpyTarget] = useState<string | null>(null);
  const [attackTarget, setAttackTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{ uid: string; pseudo: string } | null>(null);

  useEffect(() => subscribeLeaderboard(setPlayers), []);
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
    return allianceRanking.filter((a) => a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q));
  }, [allianceRanking, search]);

  // Le classement (#N) reste basé sur la position réelle dans le tableau
  // complet, même une fois la liste filtrée par la recherche. Le tri par
  // saison se fait ici côté client (top 100 déjà chargé) plutôt que via
  // un second abonnement Firestore.
  const ranked = useMemo(() => {
    const sorted = [...players].sort((a, b) =>
      mode === "season"
        ? (b.seasonId === season ? b.seasonXp : 0) - (a.seasonId === season ? a.seasonXp : 0)
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
      <PageHeader eyebrow="Cosmic Empires / Renseignement" title="Classement des joueurs" description="Espionne ou attaque les autres empires." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as LeaderboardMode)}>
          <TabsList>
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="season">Saison en cours</TabsTrigger>
            <TabsTrigger value="alliances">Alliances</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "season" && <span className="hud-eyebrow text-slate-500">{seasonLabel(season)}</span>}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={mode === "alliances" ? "Rechercher une alliance…" : "Rechercher un joueur…"}
          className="pl-9"
        />
      </div>

      {mode === "alliances" ? (
        <Card className="divide-y divide-white/5">
          {allianceRanking.length === 0 && <p className="p-4 text-sm text-slate-500">Aucune alliance pour l'instant.</p>}
          {allianceRanking.length > 0 && filteredAlliances.length === 0 && (
            <p className="p-4 text-sm text-slate-500">Aucune alliance ne correspond à « {search} ».</p>
          )}
          {filteredAlliances.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <span className="tabular-mono w-6 text-center text-xs text-slate-500">#{a.rank}</span>
              <Flag className="h-4 w-4 shrink-0 text-gold-glow" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-100">
                  [{a.tag}] {a.name}
                </p>
                <p className="text-xs text-slate-500">
                  {a.members.length} membre{a.members.length > 1 ? "s" : ""}
                </p>
              </div>
              <span className="tabular-mono text-sm text-cyan-glow">{formatNumber(a.totalXp)} XP</span>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="divide-y divide-white/5">
          {players.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun joueur trouvé.</p>}
          {players.length > 0 && filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500">Aucun joueur ne correspond à « {search} ».</p>
          )}
          {filtered.map((p) => {
            const isSelf = p.uid === uid;
            const displayXp = mode === "season" ? (p.seasonId === season ? p.seasonXp : 0) : p.xp;
            return (
              <div key={p.uid} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  <span className="tabular-mono w-6 text-center text-xs text-slate-500">#{p.rank}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{p.pseudo}</p>
                    <p className="text-xs text-cyan-glow">
                      {getRankLabel(p.xp)}
                      {mode === "season" && (
                        <span className="tabular-mono ml-2 text-slate-500">{formatNumber(displayXp)} XP</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Espionner"
                    className="group relative"
                    onClick={() => setSpyTarget(p.uid)}
                  >
                    <Eye className="h-4 w-4" />
                    <TargetReticle color="var(--color-cyan-glow)" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Attaquer"
                    disabled={isSelf}
                    className="group relative"
                    onClick={() => setAttackTarget({ uid: p.uid, pseudo: p.pseudo })}
                  >
                    <Sword className="h-4 w-4" />
                    <TargetReticle color="var(--color-danger-glow)" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Envoyer des ressources"
                    disabled={isSelf}
                    className="group relative"
                    onClick={() => setTradeTarget({ uid: p.uid, pseudo: p.pseudo })}
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

      <SpyModal uid={spyTarget} onClose={() => setSpyTarget(null)} />
      <AttackModal target={attackTarget} onClose={() => setAttackTarget(null)} />
      <TradeModal target={tradeTarget} onClose={() => setTradeTarget(null)} />
    </div>
  );
}
