import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RadarScan } from "@/components/game/RadarScan";
import { fetchPlayerSnapshot } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { getRankLabel } from "@/game/ranks";
import { BUILDINGS, LOCKABLE_BUILDINGS } from "@/game/buildings";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS, UNITS } from "@/game/units";
import { unitStat } from "@/game/combat";
import { formatNumber } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

function powerOf(p: PlayerState) {
  const attack = OFFENSIVE_UNITS.reduce(
    (sum, id) => sum + unitStat(p.units, p.techLevels, id, "attack") * (p.units[id]?.count ?? 0),
    0,
  );
  const defense = DEFENSIVE_UNITS.reduce(
    (sum, id) => sum + unitStat(p.units, p.techLevels, id, "attack") * (p.units[id]?.count ?? 0),
    0,
  );
  const buildingLevels = BUILDINGS.reduce((sum, b) => sum + (p.buildings[b.id]?.level ?? 0), 0);
  return { attack, defense, buildingLevels };
}

function ComparisonRow({ label, mine, theirs }: { label: string; mine: number; theirs: number }) {
  const max = Math.max(mine, theirs, 1);
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-right tabular-mono text-xs text-cyan-glow">{formatNumber(mine)}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-space-600/80">
          <div className="h-full rounded-full bg-cyan-glow transition-all" style={{ width: `${(mine / max) * 100}%` }} />
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="w-16 shrink-0 text-right tabular-mono text-xs text-danger-glow">{formatNumber(theirs)}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-space-600/80">
          <div className="h-full rounded-full bg-danger-glow transition-all" style={{ width: `${(theirs / max) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export function SpyModal({ uid, onClose }: { uid: string | null; onClose: () => void }) {
  const me = usePlayerStore((s) => s.player);
  const [data, setData] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setData(null);
      return;
    }
    setLoading(true);
    fetchPlayerSnapshot(uid)
      .then(setData)
      .finally(() => setLoading(false));
  }, [uid]);

  return (
    <Dialog open={uid !== null} onOpenChange={(open) => !open && onClose()}>
      {uid && (
        <DialogContent>
          {loading || !data || !me ? (
            <RadarScan label="Espionnage en cours…" />
          ) : (
            <>
              <DialogTitle>{data.pseudo}</DialogTitle>
              <p className="text-sm text-cyan-glow">{getRankLabel(data.xp)}</p>
              <p className="text-xs text-slate-500">{data.xp} XP</p>

              <div className="mt-4 flex items-center justify-between text-[11px]">
                <span className="hud-eyebrow text-cyan-glow">Toi</span>
                <span className="hud-eyebrow text-danger-glow">Cible</span>
              </div>
              <div className="mt-2 space-y-3">
                {(() => {
                  const mine = powerOf(me);
                  const theirs = powerOf(data);
                  return (
                    <>
                      <ComparisonRow label="Puissance d'attaque" mine={mine.attack} theirs={theirs.attack} />
                      <ComparisonRow label="Puissance défensive" mine={mine.defense} theirs={theirs.defense} />
                      <ComparisonRow label="Niveaux de bâtiments cumulés" mine={mine.buildingLevels} theirs={theirs.buildingLevels} />
                    </>
                  );
                })()}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Bâtiments</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {BUILDINGS.map((b) => {
                      const state = data.buildings[b.id];
                      const level = LOCKABLE_BUILDINGS.includes(b.id) && !state?.unlocked ? 0 : state?.level ?? 0;
                      return (
                        <li key={b.id} className="flex justify-between">
                          <span>{b.name}</span>
                          <span>{level} / {b.maxLevel}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Unités</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {UNITS.filter((u) => (data.units[u.id]?.level ?? 0) > 0).map((u) => (
                      <li key={u.id} className="flex justify-between">
                        <span>{u.name}</span>
                        <span>
                          Niv. {data.units[u.id]?.level ?? 0} — x{data.units[u.id]?.count ?? 0}
                        </span>
                      </li>
                    ))}
                    {UNITS.every((u) => (data.units[u.id]?.level ?? 0) <= 0) && (
                      <li className="text-slate-500">Aucune unité</li>
                    )}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
