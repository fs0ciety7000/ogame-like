import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RadarScan } from "@/components/game/RadarScan";
import { fetchPlayerSnapshot } from "@/services/playerService";
import { getRankLabel } from "@/game/ranks";
import { BUILDINGS, LOCKABLE_BUILDINGS } from "@/game/buildings";
import { UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

export function SpyModal({ uid, onClose }: { uid: string | null; onClose: () => void }) {
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
          {loading || !data ? (
            <RadarScan label="Espionnage en cours…" />
          ) : (
            <>
              <DialogTitle>{data.pseudo}</DialogTitle>
              <p className="text-sm text-cyan-glow">{getRankLabel(data.xp)}</p>
              <p className="text-xs text-slate-500">{data.xp} XP</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
