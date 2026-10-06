import { pb, subscribeRecords } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";
import { sortTradeContracts, type TradeContract } from "@/game/tradeContracts";
import type { Fleet } from "@/game/fleets";
import type { ResourceId } from "@/types/game";

/* v5.1 : contrats entre joueurs — lecture pour tous, actions via le serveur. */

export interface TradeContractsView {
  /** Contrats ouverts des autres (à prendre). */
  open: TradeContract[];
  /** Mes contrats : publiés ou acceptés, en cours puis récents. */
  mine: TradeContract[];
}

export async function fetchTradeContracts(): Promise<TradeContractsView> {
  const uid = pb.authStore.record?.id ?? "";
  const [open, mine] = await Promise.all([
    pb.collection("trade_contracts").getFullList<TradeContract>({ filter: pb.filter('status = "open" && expiresAtMs > {:now} && clientUid != {:u} && (targetUid = "" || targetUid = {:u})', { now: Date.now(), u: uid }), sort: "-createdAtMs" }),
    pb.collection("trade_contracts").getList<TradeContract>(1, 30, { filter: pb.filter("clientUid = {:u} || supplierUid = {:u}", { u: uid }), sort: "-createdAtMs" }),
  ]);
  // 5.26.3 : Contrats prioritaires (Comptoir) en tête pendant 24 h.
  return { open: sortTradeContracts(open, Date.now()), mine: mine.items };
}

export function subscribeTradeContracts(onChange: (data: TradeContractsView) => void): () => void {
  let active = true;
  const load = () =>
    fetchTradeContracts()
      .then((d) => active && onChange(d))
      .catch(() => active && onChange({ open: [], mine: [] }));
  load();
  const stop = subscribeRecords("trade_contracts", "*", () => load());
  return () => {
    active = false;
    stop();
  };
}

export function createTradeContract(input: { wantRes: ResourceId; wantAmount: number; payRes: ResourceId; payAmount: number; hours: number; targetUid?: string }) {
  return callGame<TradeContract>("trade-contract", { action: "create", ...input });
}

export function tradeContractAction(action: "accept" | "cancel" | "abandon", id: string) {
  return callGame<TradeContract>("trade-contract", { action, id });
}

/** Envoie la flotte de livraison d'un contrat accepté. */
export function sendDelivery(contractId: string, fleet: Record<string, number>): Promise<Fleet> {
  return callGame<Fleet>("fleet/send", { mission: "delivery", contractId, fleet });
}
