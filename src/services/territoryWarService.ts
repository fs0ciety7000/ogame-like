import { useEffect, useState } from "react";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { normalizeTerritoryWar, TERRITORY_WAR_KEY, type TerritoryWarState } from "@/game/territoryWar";

/* 5.17 : guerre de territoire, publiée par le serveur dans game_config (clé « territory_war »).
   undefined : chargement ; null : aucune guerre jouée pour l'instant. */

async function fetchTerritoryWar(): Promise<TerritoryWarState | null> {
  try {
    const rec = await pb.collection("game_config").getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: TERRITORY_WAR_KEY }));
    return normalizeTerritoryWar(rec.data);
  } catch {
    return null;
  }
}

export function useTerritoryWar(): TerritoryWarState | null | undefined {
  const [state, setState] = useState<TerritoryWarState | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    const load = () => void fetchTerritoryWar().then((s) => active && setState(s));
    load();
    const stop = subscribeRecords("game_config", "*", (e) => {
      if ((e.record as { key?: string }).key === TERRITORY_WAR_KEY) setState(normalizeTerritoryWar((e.record as { data?: unknown }).data));
    });
    return () => {
      active = false;
      stop();
    };
  }, []);
  return state;
}

export async function adminTerritoryWar(action: "start" | "close", hours?: number): Promise<TerritoryWarState> {
  return pb.send("/api/cosmic/admin/territory-war", { method: "POST", body: { action, hours } });
}
