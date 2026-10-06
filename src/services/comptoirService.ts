import { useEffect, useState } from "react";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";
import { weeklyStock, WEEKLY_STOCK_KEY, type WeeklyStock } from "@/game/weeklyStock";
import { patronsState, PATRONS_KEY, type PatronsState } from "@/game/patrons";

/* 5.27 : stock tournant du Comptoir et mécènes du mois (game_config, lecture publique). */

async function readConfig(key: string): Promise<unknown> {
  try {
    const rec = await pb.collection("game_config").getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: key }), { requestKey: null });
    return rec.data;
  } catch {
    return null;
  }
}

/** Valeur d'une clé de game_config, rafraîchie en temps réel. */
function useConfig<T>(key: string, read: (raw: unknown) => T): T {
  const [value, setValue] = useState<T>(() => read(null));
  useEffect(() => {
    let alive = true;
    const refresh = () => void readConfig(key).then((raw) => alive && setValue(read(raw)));
    refresh();
    const unsubscribe = subscribeRecords<{ key?: string }>("game_config", "*", (e) => {
      if (e.record?.key === key) refresh();
    });
    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read est une lecture pure.
  }, [key]);
  return value;
}

export function useWeeklyStock(): WeeklyStock {
  return useConfig(WEEKLY_STOCK_KEY, (raw) => weeklyStock(raw, Date.now()));
}

export function usePatrons(): PatronsState {
  return useConfig(PATRONS_KEY, (raw) => patronsState(raw, Date.now()));
}

export function buyWeeklyOffer(): Promise<{ message: string }> {
  return callGame("bounty", { action: "weekly" });
}
