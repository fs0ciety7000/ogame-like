import { useEffect, useMemo, useState } from "react";
import { Search, Sword, Eye, Gift, LocateFixed } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { galaxyCoords, formatCoords } from "@/game/galaxy";
import { getRankLabel } from "@/game/ranks";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";
import { TradeModal } from "@/components/game/TradeModal";

export function GalaxyPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const uid = useAuthStore((s) => s.user?.uid);
  const [spyTarget, setSpyTarget] = useState<string | null>(null);
  const [attackTarget, setAttackTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{ uid: string; pseudo: string } | null>(null);

  useEffect(() => subscribeLeaderboard(setPlayers), []);

  const blips = useMemo(() => players.map((p) => ({ ...p, coords: galaxyCoords(p.uid) })), [players]);

  useEffect(() => {
    if (uid && !selectedUid && blips.some((b) => b.uid === uid)) setSelectedUid(uid);
  }, [uid, selectedUid, blips]);

  const query = search.trim().toLowerCase();
  const selected = blips.find((b) => b.uid === selectedUid) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Cartographie"
        title="Carte galactique"
        description="Repère les empires voisins et lance une opération."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un empire…"
            className="pl-9"
          />
        </div>
        {uid && blips.some((b) => b.uid === uid) && (
          <Button variant="outline" onClick={() => setSelectedUid(uid)}>
            <LocateFixed className="h-4 w-4" />
            Me localiser
          </Button>
        )}
      </div>

      <Card className="tactical-grid relative h-[420px] overflow-hidden sm:h-[520px]">
        {blips.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            Aucun empire détecté pour l'instant.
          </p>
        )}
        {blips.map((b) => {
          const isSelf = b.uid === uid;
          const isSelected = b.uid === selectedUid;
          const dim = query.length > 0 && !b.pseudo.toLowerCase().includes(query);
          return (
            <button
              key={b.uid}
              onClick={() => setSelectedUid(b.uid)}
              title={`${b.pseudo} · ${formatCoords(b.coords)}`}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-opacity duration-300",
                dim ? "opacity-15" : "opacity-100",
              )}
              style={{ left: `${b.coords.x * 100}%`, top: `${b.coords.y * 100}%` }}
            >
              <span
                className={cn(
                  "block h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]",
                  isSelf ? "bg-gold-glow text-gold-glow" : "bg-cyan-glow text-cyan-glow",
                  isSelected && "ring-2 ring-white/80 ring-offset-2 ring-offset-space-900",
                )}
              />
              <span className="hud-eyebrow whitespace-nowrap text-[9px] text-slate-400">{b.pseudo}</span>
            </button>
          );
        })}
      </Card>

      {selected && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-100">
              {selected.pseudo}
              {selected.uid === uid && <span className="ml-2 text-xs text-gold-glow">(vous)</span>}
            </p>
            <p className="tabular-mono text-xs text-slate-500">
              Secteur {formatCoords(selected.coords)} · {getRankLabel(selected.xp)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Espionner" onClick={() => setSpyTarget(selected.uid)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Attaquer"
              disabled={selected.uid === uid}
              onClick={() => setAttackTarget({ uid: selected.uid, pseudo: selected.pseudo })}
            >
              <Sword className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Envoyer des ressources"
              disabled={selected.uid === uid}
              onClick={() => setTradeTarget({ uid: selected.uid, pseudo: selected.pseudo })}
            >
              <Gift className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <SpyModal uid={spyTarget} onClose={() => setSpyTarget(null)} />
      <AttackModal target={attackTarget} onClose={() => setAttackTarget(null)} />
      <TradeModal target={tradeTarget} onClose={() => setTradeTarget(null)} />
    </div>
  );
}
