import { useEffect, useState } from "react";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { coalesce } from "@/lib/sharedSubscriptions";
import { AUCTION_HISTORY_KEY, normalizeAuctionHistory, type Auction, type AuctionCurrency, type AuctionHistory, type AuctionKind, type AuctionWatch } from "@/game/auctions";

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

/** 5.26.2 : identifiant d'appareil (aléatoire, gardé sur l'appareil) joint aux ventes et
 *  enchères : l'équipe repère ainsi les ventes entre comptes d'un même joueur. */
function deviceId(): string {
  const KEY = "cosmic-empires:device";
  try {
    let id = localStorage.getItem(KEY) ?? "";
    if (!/^[0-9a-f]{32}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

async function call<T>(payload: Record<string, unknown>, fallback: string): Promise<T> {
  try {
    return await pb.send<T>("/api/cosmic/auction", { method: "POST", body: { ...payload, device: deviceId() } });
  } catch (err) {
    throw new Error(errorMessage(err, fallback));
  }
}

export function listAuction(input: { kind: AuctionKind; itemId: string; res: AuctionCurrency; startPrice: number; durationH: number }) {
  return call<Auction>({ action: "list", ...input }, "Mise en vente impossible.");
}

export function bidAuction(id: string, amount: number) {
  return call<Auction>({ action: "bid", id, amount }, "Enchère refusée.");
}

export function cancelAuction(id: string) {
  return call<Auction>({ action: "cancel", id }, "Annulation impossible.");
}

/* 5.26.2 : historique des prix (game_config, lecture publique) et alertes de vente. */

export function useAuctionHistory(): AuctionHistory {
  const [h, setH] = useState<AuctionHistory>({ lots: {} });
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void pb
        .collection("game_config")
        .getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: AUCTION_HISTORY_KEY }), { requestKey: null })
        .then((rec) => alive && setH(normalizeAuctionHistory(rec.data)))
        .catch(() => {});
    refresh();
    const unsubscribe = subscribeRecords("auctions", "*", coalesce(refresh, 1500));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  return h;
}

export function useAuctionWatches(uid: string | undefined): { watches: AuctionWatch[]; reload: () => void } {
  const [watches, setWatches] = useState<AuctionWatch[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!uid) {
      return;
    }
    let alive = true;
    void pb
      .collection("auction_watches")
      .getFullList<AuctionWatch>({ filter: pb.filter("uid = {:u}", { u: uid }), sort: "createdAtMs", requestKey: null })
      .then((list) => alive && setWatches(list))
      .catch(() => alive && setWatches([]));
    return () => {
      alive = false;
    };
  }, [uid, tick]);
  return { watches, reload: () => setTick((t) => t + 1) };
}

export function watchAuctions(watch: Pick<AuctionWatch, "kind" | "minRarity" | "template">) {
  return call<AuctionWatch>({ action: "watch", watch }, "Alerte refusée.");
}

export function unwatchAuctions(id: string) {
  return call<{ ok: boolean }>({ action: "unwatch", id }, "Suppression impossible.");
}
