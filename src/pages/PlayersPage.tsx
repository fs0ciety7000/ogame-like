import { useEffect, useState } from "react";
import { Sword, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { getRankLabel } from "@/game/ranks";
import { useAuthStore } from "@/store/authStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";

export function PlayersPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const uid = useAuthStore((s) => s.user?.uid);
  const [spyTarget, setSpyTarget] = useState<string | null>(null);
  const [attackTarget, setAttackTarget] = useState<{ uid: string; pseudo: string } | null>(null);

  useEffect(() => subscribeLeaderboard(setPlayers), []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl text-white glow-text">Classement des joueurs</h1>

      <Card className="divide-y divide-white/5">
        {players.length === 0 && <p className="p-4 text-sm text-slate-500">Aucun joueur trouvé.</p>}
        {players.map((p, i) => {
          const isSelf = p.uid === uid;
          return (
            <div key={p.uid} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs text-slate-500">#{i + 1}</span>
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
