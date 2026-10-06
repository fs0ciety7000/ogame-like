import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { emptyServerPot, normalizeServerPot, SERVER_POT_KEY, type ServerPot } from "@/game/serverPot";

/* v5.10 : pot commun « Serveur » (lecture publique, versements par l'administration). */

export async function fetchServerPot(): Promise<ServerPot> {
  try {
    const rec = await pb.collection("game_config").getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: SERVER_POT_KEY }));
    return normalizeServerPot(rec.data);
  } catch {
    return emptyServerPot();
  }
}

export function useServerPot(): ServerPot | null {
  const [pot, setPot] = useState<ServerPot | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchServerPot().then((p) => alive && setPot(p));
    return () => {
      alive = false;
    };
  }, []);
  return pot;
}

export function adminServerPot(): Promise<ServerPot> {
  return pb.send("/api/cosmic/admin/serverpot", { method: "GET" });
}

/** v5.14.2 : dépôt de l'administration dans le pot (ressources créées). */
export function adminServerPotDeposit(resources: Record<string, number>, note: string): Promise<ServerPot> {
  return pb.send("/api/cosmic/admin/serverpot", { method: "POST", body: { action: "deposit", resources, note } });
}

export function adminServerPotGrant(toUid: string, resources: Record<string, number>, note: string, amber = 0): Promise<ServerPot> {
  return pb.send("/api/cosmic/admin/serverpot", { method: "POST", body: { action: "grant", toUid, resources, note, amber } });
}
