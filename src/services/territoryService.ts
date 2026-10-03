import { useEffect, useState } from "react";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import type { SectorControl } from "@/game/territories";

/* v5.1 : contrôle des secteurs, publié par le serveur dans game_config (clé « territories »). */

export interface TerritoryMap {
  atMs: number;
  sectors: (SectorControl & { tag: string; contenders: (SectorControl["contenders"][number] & { tag: string })[] })[];
}

async function fetchTerritories(): Promise<TerritoryMap | null> {
  try {
    const rec = await pb.collection("game_config").getFirstListItem<{ data: TerritoryMap }>(pb.filter("key = {:k}", { k: "territories" }));
    return rec.data && Array.isArray(rec.data.sectors) ? rec.data : null;
  } catch {
    return null;
  }
}

export function useTerritories(): TerritoryMap | null {
  const [map, setMap] = useState<TerritoryMap | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => void fetchTerritories().then((m) => active && setMap(m));
    load();
    const stop = subscribeRecords("game_config", "*", (e) => {
      if ((e.record as { key?: string }).key === "territories") load();
    });
    return () => {
      active = false;
      stop();
    };
  }, []);
  return map;
}

/** Couleur stable d'une alliance (teinte dérivée de son identifiant). */
export function allianceHue(allianceId: string): number {
  let h = 0;
  for (let i = 0; i < allianceId.length; i++) h = (h * 31 + allianceId.charCodeAt(i)) % 360;
  return h;
}
