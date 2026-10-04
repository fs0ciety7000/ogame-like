import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { CONTESTS_KEY, normalizeContests, type Contest, type ContestsState } from "@/game/contests";

/* v5.10.5 : concours du pot commun (lecture publique, création par l'administration). */

export async function fetchContests(): Promise<ContestsState> {
  try {
    const rec = await pb.collection("game_config").getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: CONTESTS_KEY }));
    return normalizeContests(rec.data);
  } catch {
    return { list: [] };
  }
}

/** Concours, relus toutes les 5 minutes (le serveur relève le classement tous les quarts d'heure). */
export function useContests(): ContestsState | null {
  const [state, setState] = useState<ContestsState | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void fetchContests().then((s) => alive && setState(s));
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return state;
}

export function adminCreateContest(contest: Pick<Contest, "title" | "description" | "metric" | "startMs" | "endMs" | "potShare" | "places">): Promise<ContestsState> {
  return pb.send("/api/cosmic/admin/contests", { method: "POST", body: { action: "create", contest } });
}

export function adminCancelContest(id: string): Promise<ContestsState> {
  return pb.send("/api/cosmic/admin/contests", { method: "POST", body: { action: "cancel", id } });
}
