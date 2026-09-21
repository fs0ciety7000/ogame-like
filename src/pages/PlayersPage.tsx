import { useEffect, useMemo, useState } from "react";
import { Sword, Eye, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { getRankLabel } from "@/game/ranks";
import { useAuthStore } from "@/store/authStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";

export function PlayersPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState("");
  const uid = useAuthStore((s) => s.user?.uid);
  const [spyTarget, setSpyTarget] = useState<string | null>(null);
  const [attackTarget, setAttackTarget] = useState<{ uid: string; pseudo: string } | null>(null);

  useEffect(() => subscribeLeaderboard(setPlayers), []);

  // Le classement (#N) reste basé sur la position réelle dans le tableau
  // complet, même une fois la liste filtrée par la recherche.
  const ranked = useMemo(() => players.map((p, i) => ({ ...p, rank: i + 1 })), [players]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((p) => p.pseudo.toLowerCase().includes(q));
  }, [ranked, search]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Renseignement" title="Classement des joueurs" description="Espionne ou attaque les autres empires." />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un joueur…"
          className="pl-9"
        />
      </div>

      <Card className="divide-y divide-white/5">
        {players.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun joueur trouvé.</p>}
        {players.length > 0 && filtered.length === 0 && (
          <p className="p-4 text-sm text-slate-500">Aucun joueur ne correspond à « {search} ».</p>
        )}
        {filtered.map((p) => {
          const isSelf = p.uid === uid;
          return (
            <div key={p.uid} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <span className="tabular-mono w-6 text-center text-xs text-slate-500">#{p.rank}</span>
                <div>
                  <p className="text-sm font-medium text-slate-100">{p.pseudo}</p>
                  <p className="text-xs text-cyan-glow">{getRankLabel(p.xp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" title="Espionner" onClick={() => setSpyTarget(p.uid)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Attaquer"
                  disabled={isSelf}
                  onClick={() => setAttackTarget({ uid: p.uid, pseudo: p.pseudo })}
                >
                  <Sword className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </Card>

      <SpyModal uid={spyTarget} onClose={() => setSpyTarget(null)} />
      <AttackModal target={attackTarget} onClose={() => setAttackTarget(null)} />
    </div>
  );
}
