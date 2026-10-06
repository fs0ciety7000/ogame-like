import { useEffect, useState } from "react";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { coalesce } from "@/lib/sharedSubscriptions";
import type { Auction, AuctionKind } from "@/game/auctions";
import type { ResourceId } from "@/types/game";

/* 5.26 : Hôtel des enchères (ventes ouvertes en direct, mes ventes et mises closes). */

async function loadAuctions(uid: string): Promise<{ open: Auction[]; mine: Auction[] }> {
  const [open, mine] = await Promise.all([
    pb.collection("auctions").getFullList<Auction>({ filter: 'status = "open"', sort: "endsAtMs", requestKey: null }),
    pb.collection("auctions").getList<Auction>(1, 30, { filter: pb.filter('status != "open" && (sellerId = {:u} || bidderId = {:u})', { u: uid }), sort: "-closedAtMs", requestKey: null }),
  ]);
  return { open, mine: mine.items };
}

export function useAuctions(uid: string | undefined): { open: Auction[]; closed: Auction[]; loaded: boolean; reload: () => void } {
  const [state, setState] = useState<{ open: Auction[]; mine: Auction[] }>({ open: [], mine: [] });
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!uid) {
      return;
    }
    let alive = true;
    const refresh = () =>
      void loadAuctions(uid)
        .then((s) => {
          if (!alive) return;
          setState(s);
          setLoaded(true);
        })
        .catch(() => alive && setLoaded(true));
    refresh();
    const unsubscribe = subscribeRecords("auctions", "*", coalesce(refresh, 200));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [uid, tick]);
  return { open: state.open, closed: state.mine, loaded, reload: () => setTick((t) => t + 1) };
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { message?: string } })?.response?.message || fallback;
}

async function call<T>(payload: Record<string, unknown>, fallback: string): Promise<T> {
  try {
    return await pb.send<T>("/api/cosmic/auction", { method: "POST", body: payload });
  } catch (err) {
    throw new Error(errorMessage(err, fallback));
  }
}

export function listAuction(input: { kind: AuctionKind; itemId: string; res: ResourceId; startPrice: number; durationH: number }) {
  return call<Auction>({ action: "list", ...input }, "Mise en vente impossible.");
}

export function bidAuction(id: string, amount: number) {
  return call<Auction>({ action: "bid", id, amount }, "Enchère refusée.");
}

export function cancelAuction(id: string) {
  return call<Auction>({ action: "cancel", id }, "Annulation impossible.");
}
