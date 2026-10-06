import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { priceBounds } from "@/game/market";
import { RESOURCE_LIST } from "@/game/resources";
import { bumpStat } from "@/game/stats";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Contrats entre joueurs (v5.1) : « livre-moi X avant tel délai contre Y ».
   Le client publie le contrat et son paiement Y est bloqué aussitôt. Un
   livreur l'accepte en déposant une caution (10 % du paiement), puis envoie
   une flotte de livraison qui doit arriver avant l'échéance. À l'arrivée, le
   client reçoit X, le livreur touche Y et récupère sa caution. Abandon ou
   retard : le client est remboursé et garde la caution du livreur.
===================================================== */

export const TRADE_CONTRACT_RULES = {
  minHours: 4,
  maxHours: 72,
  /** Contrats actifs par joueur (publiés ouverts ou acceptés, comme client ou livreur). */
  maxActive: 3,
  /** Caution du livreur, en part du paiement. */
  depositPct: 0.1,
  /** Un contrat ouvert sans livreur expire au bout de ce délai (h). */
  openHours: 48,
  /** 6.9.0 : durée en tête de liste d'un contrat prioritaire (consommable du Comptoir), en heures. */
  priorityHours: 24,
};

export type TradeContractStatus = "open" | "accepted" | "delivered" | "failed" | "cancelled" | "expired";

export interface TradeContract {
  id: string;
  clientUid: string;
  clientPseudo: string;
  /** Livreur imposé (vide : ouvert à tous). */
  targetUid: string;
  wantRes: ResourceId;
  wantAmount: number;
  payRes: ResourceId;
  payAmount: number;
  hours: number;
  status: TradeContractStatus;
  createdAtMs: number;
  expiresAtMs: number;
  supplierUid: string;
  supplierPseudo: string;
  deposit: number;
  acceptedAtMs: number;
  deadlineMs: number;
  /** Flotte de livraison en route (une seule par contrat). */
  fleetId: string;
  closedAtMs: number;
  /** 5.26.3 : Contrat prioritaire (Comptoir) : en tête des contrats visibles jusqu'à cette date. */
  priorityUntilMs?: number;
}

const RESOURCE_IDS = new Set(RESOURCE_LIST.map((r) => r.id as string));
const label = (res: string) => RESOURCE_LIST.find((r) => r.id === res)?.name.toLowerCase() ?? res;

function amount(raw: unknown, what: string): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0 || n > 1e13) throw new GameActionError(`${what} invalide.`);
  return n;
}

export function contractDeposit(payAmount: number): number {
  return Math.max(1, Math.floor(payAmount * TRADE_CONTRACT_RULES.depositPct));
}

export type NewTradeContract = Pick<TradeContract, "targetUid" | "wantRes" | "wantAmount" | "payRes" | "payAmount" | "hours" | "expiresAtMs" | "priorityUntilMs">;

/** 5.26.3 : durée de la mise en avant d'un Contrat prioritaire. */

/** Contrats visibles : prioritaires (encore actifs) d'abord, puis les plus récents. */
export function sortTradeContracts<T extends Pick<TradeContract, "createdAtMs" | "priorityUntilMs">>(list: T[], now: number): T[] {
  const prio = (c: T) => ((c.priorityUntilMs ?? 0) > now ? 1 : 0);
  return [...list].sort((a, b) => prio(b) - prio(a) || b.createdAtMs - a.createdAtMs);
}

/** Publication : valide le contrat et bloque le paiement du client. */
export function createTradeContract(client: PlayerState, input: Record<string, unknown>, active: number, now: number): NewTradeContract {
  const wantRes = String(input.wantRes ?? "") as ResourceId;
  const payRes = String(input.payRes ?? "") as ResourceId;
  if (!RESOURCE_IDS.has(wantRes) || !RESOURCE_IDS.has(payRes)) throw new GameActionError("Ressource inconnue.");
  if (wantRes === payRes) throw new GameActionError("Choisis deux ressources différentes.");
  const wantAmount = amount(input.wantAmount, "Quantité demandée");
  const payAmount = amount(input.payAmount, "Paiement");
  const hours = Math.floor(Number(input.hours));
  if (!(hours >= TRADE_CONTRACT_RULES.minHours && hours <= TRADE_CONTRACT_RULES.maxHours)) {
    throw new GameActionError(`Délai entre ${TRADE_CONTRACT_RULES.minHours} et ${TRADE_CONTRACT_RULES.maxHours} h.`);
  }
  if (active >= TRADE_CONTRACT_RULES.maxActive) throw new GameActionError(`${TRADE_CONTRACT_RULES.maxActive} contrats actifs au plus.`);
  // Même garde-fou que le marché : prix proche du comptoir (pas de transfert déguisé).
  const { min, max } = priceBounds(payRes, payAmount, wantRes);
  if (wantAmount < min || wantAmount > max) {
    throw new GameActionError(`Prix hors limites : pour ${formatInt(payAmount)} ${label(payRes)}, demande entre ${formatInt(min)} et ${formatInt(max)} ${label(wantRes)}.`);
  }
  const targetUid = String(input.targetUid ?? "").slice(0, 40);
  if (targetUid && targetUid === client.uid) throw new GameActionError("Tu ne peux pas te livrer toi-même.");
  if ((client.resources[payRes] ?? 0) < payAmount) throw new GameActionError(`Pas assez de ${label(payRes)} pour le paiement.`);
  client.resources[payRes] -= payAmount;
  // 5.26.3 : un Contrat prioritaire en réserve est utilisé par ce contrat.
  const b = (client.bounties ?? {}) as { priorityContracts?: number };
  const charges = Math.max(0, Number(b.priorityContracts) || 0);
  const priorityUntilMs = charges > 0 ? now + TRADE_CONTRACT_RULES.priorityHours * 3600_000 : 0;
  if (charges > 0) client.bounties = { ...(client.bounties as object), priorityContracts: charges - 1 } as PlayerState["bounties"];
  return { targetUid, wantRes, wantAmount, payRes, payAmount, hours, expiresAtMs: now + TRADE_CONTRACT_RULES.openHours * 3600_000, priorityUntilMs };
}

/** Acceptation : le livreur dépose sa caution, le délai démarre. */
export function acceptTradeContract(c: TradeContract, supplier: PlayerState, active: number, now: number): { deposit: number; deadlineMs: number } {
  if (c.status !== "open" || now >= c.expiresAtMs) throw new GameActionError("Ce contrat n'est plus disponible.");
  if (c.clientUid === supplier.uid) throw new GameActionError("Tu ne peux pas accepter ton propre contrat.");
  if (c.targetUid && c.targetUid !== supplier.uid) throw new GameActionError("Ce contrat est réservé à un autre commandant.");
  if (active >= TRADE_CONTRACT_RULES.maxActive) throw new GameActionError(`${TRADE_CONTRACT_RULES.maxActive} contrats actifs au plus.`);
  const deposit = contractDeposit(c.payAmount);
  if ((supplier.resources[c.payRes] ?? 0) < deposit) throw new GameActionError(`Caution : il faut ${formatInt(deposit)} ${label(c.payRes)}.`);
  supplier.resources[c.payRes] -= deposit;
  return { deposit, deadlineMs: now + c.hours * 3600_000 };
}

/** Annulation par le client tant que personne n'a accepté : paiement rendu. */
export function cancelTradeContract(c: Pick<TradeContract, "status" | "payRes" | "payAmount">, client: PlayerState): void {
  if (c.status !== "open") throw new GameActionError("Un livreur a déjà accepté : le contrat ne peut plus être annulé.");
  client.resources[c.payRes] = (client.resources[c.payRes] ?? 0) + c.payAmount;
}

/** Livraison arrivée à temps : marchandise au client, paiement et caution au livreur. */
export function completeTradeContract(c: TradeContract, client: PlayerState, supplier: PlayerState, cargo: number, now: number): void {
  if (c.status !== "accepted" || now > c.deadlineMs) throw new GameActionError("Contrat clos ou échu.");
  client.resources[c.wantRes] = (client.resources[c.wantRes] ?? 0) + cargo;
  supplier.resources[c.payRes] = (supplier.resources[c.payRes] ?? 0) + c.payAmount + c.deposit;
  bumpStat(supplier, "contractsDelivered");
  bumpStat(client, "marketTrades");
  bumpStat(supplier, "marketTrades");
}

/** Abandon ou échéance dépassée : paiement rendu au client, qui garde la caution. Contrat ouvert expiré : paiement rendu. */
export function failTradeContract(c: Pick<TradeContract, "status" | "payRes" | "payAmount" | "deposit">, client: PlayerState): number {
  const penalty = c.status === "accepted" ? c.deposit : 0;
  client.resources[c.payRes] = (client.resources[c.payRes] ?? 0) + c.payAmount + penalty;
  return penalty;
}

/** Livraison : vérifie que la flotte peut porter la commande et arriver avant l'échéance. */
export function checkDelivery(c: { status: string; supplierUid: string; deadlineMs: number; fleetId: string; wantAmount: number }, supplierUid: string, capacity: number, arriveAtMs: number): void {
  if (c.status !== "accepted" || c.supplierUid !== supplierUid) throw new GameActionError("Ce contrat ne t'est pas attribué.");
  if (c.fleetId) throw new GameActionError("Une livraison est déjà en route pour ce contrat.");
  if (capacity < c.wantAmount) throw new GameActionError(`La soute doit contenir ${formatInt(c.wantAmount)} ressources (actuellement ${formatInt(capacity)}).`);
  if (arriveAtMs > c.deadlineMs) throw new GameActionError("Ces vaisseaux arriveraient après l'échéance : choisis une flotte plus rapide.");
}
