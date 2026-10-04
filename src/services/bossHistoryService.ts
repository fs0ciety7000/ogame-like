import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { BOSS_HISTORY_KEY, normalizeBossHistory, type BossHistoryEntry } from "@/game/bossHistory";

/* v5.10 : historique des boss (Hall of fame), lu dans game_config. */
export function useBossHistory(): BossHistoryEntry[] | null {
  const [list, setList] = useState<BossHistoryEntry[] | null>(null);
  useEffect(() => {
    let alive = true;
    pb.collection("game_config")
      .getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: BOSS_HISTORY_KEY }))
      .then((r) => alive && setList(normalizeBossHistory(r.data)))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, []);
  return list;
}
