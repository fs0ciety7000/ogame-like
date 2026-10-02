import { pb, subscribeRecords } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";
import type { MarketOffer } from "@/game/market";
import type { ResourceId } from "@/types/game";

/* Marché entre joueurs (v3.0) : les offres sont lisibles par tous les
   joueurs connectés ; publier, accepter et annuler passent par le serveur. */

export async function fetchOffers(): Promise<{ open: MarketOffer[]; mine: MarketOffer[] }> {
  const uid = pb.authStore.record?.id ?? "";
  const [open, mine] = await Promise.all([
    pb.collection("market_offers").getFullList<MarketOffer>({ filter: pb.filter('status = "open" && expiresAtMs > {:now}', { now: Date.now() }), sort: "-createdAtMs" }),
    pb.collection("market_offers").getList<MarketOffer>(1, 30, { filter: pb.filter("(sellerId = {:u} || buyerId = {:u}) && status != \"open\"", { u: uid }), sort: "-createdAtMs" }),
  ]);
  return { open, mine: mine.items };
}

export function subscribeOffers(onChange: (data: { open: MarketOffer[]; mine: MarketOffer[] }) => void): () => void {
  let active = true;
  const load = () =>
    fetchOffers()
      .then((d) => active && onChange(d))
      .catch(() => active && onChange({ open: [], mine: [] }));
  load();
  const stop = subscribeRecords("market_offers", "*", () => load());
  return () => {
    active = false;
    stop();
  };
}

export function createMarketOffer(input: { giveRes: ResourceId; giveAmount: number; wantRes: ResourceId; wantAmount: number }) {
  return callGame<MarketOffer>("market/create", input);
}

export function acceptMarketOffer(id: string) {
  return callGame<MarketOffer>("market/accept", { id });
}

export function cancelMarketOffer(id: string) {
  return callGame<MarketOffer>("market/cancel", { id });
}

/** v4.8 : échanges conclus des 30 derniers jours (historique des prix). */
export async function fetchMarketTrades(days = 30): Promise<Pick<MarketOffer, "giveRes" | "giveAmount" | "wantRes" | "wantAmount" | "filledAtMs">[]> {
  return pb.collection("market_offers").getFullList({
    filter: pb.filter('status = "filled" && filledAtMs > {:since}', { since: Date.now() - days * 86400_000 }),
    fields: "giveRes,giveAmount,wantRes,wantAmount,filledAtMs",
    sort: "filledAtMs",
  });
}
