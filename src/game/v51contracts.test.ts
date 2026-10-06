import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { acceptTradeContract, cancelTradeContract, checkDelivery, completeTradeContract, contractDeposit, createTradeContract, failTradeContract, sortTradeContracts, TRADE_CONTRACT_RULES, type TradeContract } from "@/game/tradeContracts";
import type { PlayerState } from "@/types/game";

function player(uid: string): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  p.resources = { ...p.resources, scrap: 1_000_000, energy: 1_000_000, nano: 1_000_000 };
  return p;
}

const NOW = 5_000_000;
const H = 3600_000;

function contract(client: PlayerState, extra: Partial<TradeContract> = {}): TradeContract {
  const c = createTradeContract(client, { wantRes: "nano", wantAmount: 10_000, payRes: "scrap", payAmount: 10_000, hours: 12 }, 0, NOW);
  return { id: "c1", clientUid: client.uid, clientPseudo: client.uid, status: "open", createdAtMs: NOW, supplierUid: "", supplierPseudo: "", deposit: 0, acceptedAtMs: 0, deadlineMs: 0, fleetId: "", closedAtMs: 0, ...c, ...extra };
}

describe("v5.1 : contrats entre joueurs", () => {
  it("5.26.3 : un Contrat prioritaire passe en tête pendant 24 h", () => {
    const client = player("c");
    client.bounties = { priorityContracts: 1 } as PlayerState["bounties"];
    const c = createTradeContract(client, { wantRes: "nano", wantAmount: 10_000, payRes: "scrap", payAmount: 10_000, hours: 12 }, 0, NOW);
    expect(c.priorityUntilMs).toBe(NOW + 24 * H);
    expect((client.bounties as { priorityContracts: number }).priorityContracts).toBe(0);
    const plain = createTradeContract(client, { wantRes: "nano", wantAmount: 10_000, payRes: "scrap", payAmount: 10_000, hours: 12 }, 0, NOW);
    expect(plain.priorityUntilMs ?? 0).toBe(0);
    const list = [
      { id: "old-prio", createdAtMs: NOW - H, priorityUntilMs: NOW + H },
      { id: "new", createdAtMs: NOW },
      { id: "expired", createdAtMs: NOW + 1, priorityUntilMs: NOW - 1 },
    ];
    expect(sortTradeContracts(list, NOW).map((x) => x.id)).toEqual(["old-prio", "expired", "new"]);
  });

  it("bloque le paiement, valide délai, prix et limite", () => {
    const client = player("c");
    contract(client);
    expect(client.resources.scrap).toBe(990_000);
    expect(() => createTradeContract(client, { wantRes: "nano", wantAmount: 100, payRes: "scrap", payAmount: 100, hours: 2 }, 0, NOW)).toThrow(/Délai/);
    expect(() => createTradeContract(client, { wantRes: "nano", wantAmount: 100, payRes: "scrap", payAmount: 100, hours: 12 }, TRADE_CONTRACT_RULES.maxActive, NOW)).toThrow(/actifs/);
    expect(() => createTradeContract(client, { wantRes: "nano", wantAmount: 99_999, payRes: "scrap", payAmount: 100, hours: 12 }, 0, NOW)).toThrow(/Prix hors limites/);
    expect(() => createTradeContract(client, { wantRes: "nano", wantAmount: 100, payRes: "scrap", payAmount: 100, hours: 12, targetUid: "c" }, 0, NOW)).toThrow(/toi-même/);
  });

  it("acceptation avec caution, livraison à temps : client livré, livreur payé et caution rendue", () => {
    const client = player("c");
    const supplier = player("s");
    const c = contract(client);
    const { deposit, deadlineMs } = acceptTradeContract(c, supplier, 0, NOW);
    expect(deposit).toBe(contractDeposit(10_000));
    expect(deadlineMs).toBe(NOW + 12 * H);
    expect(supplier.resources.scrap).toBe(1_000_000 - deposit);
    const live = { ...c, status: "accepted" as const, supplierUid: "s", deposit, deadlineMs };
    expect(() => checkDelivery(live, "s", 5_000, NOW + H)).toThrow(/soute/);
    expect(() => checkDelivery(live, "s", 20_000, deadlineMs + 1)).toThrow(/après l'échéance/);
    expect(() => checkDelivery(live, "x", 20_000, NOW + H)).toThrow(/pas attribué/);
    checkDelivery(live, "s", 20_000, NOW + H);
    completeTradeContract(live, client, supplier, 10_000, NOW + H);
    expect(client.resources.nano).toBe(1_010_000);
    expect(supplier.resources.scrap).toBe(1_010_000);
    expect(() => completeTradeContract(live, client, supplier, 10_000, deadlineMs + 1)).toThrow(/échu/);
  });

  it("abandon ou retard : le client récupère son paiement et la caution ; annulation avant acceptation", () => {
    const client = player("c");
    const c = contract(client);
    expect(() => acceptTradeContract(c, client, 0, NOW)).toThrow(/propre contrat/);
    expect(() => acceptTradeContract({ ...c, targetUid: "z" }, player("s"), 0, NOW)).toThrow(/réservé/);
    const penalty = failTradeContract({ ...c, status: "accepted", deposit: 1_000 }, client);
    expect(penalty).toBe(1_000);
    expect(client.resources.scrap).toBe(1_000_000 + 1_000);
    const other = player("o");
    const c2 = contract(other);
    cancelTradeContract(c2, other);
    expect(other.resources.scrap).toBe(1_000_000);
    expect(() => cancelTradeContract({ ...c2, status: "accepted" }, other)).toThrow(/ne peut plus/);
  });
});
