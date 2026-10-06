import { GameActionError } from "@/game/errors";
import { findTemplate, rarityInfo, relicLabel, relicsState, type RelicItem } from "@/game/relics";
import { findModuleTemplate, moduleLabel, modulesState, moduleRarity, type ModuleItem } from "@/game/modules";
import { RESOURCE_LIST } from "@/game/resources";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   5.26 : Hôtel des enchères. Un joueur met en vente une relique (ni
   mythique, ni équipée) ou un PLAN de module, contre une ressource
   commune. Chaque enchère est payée tout de suite (mise sous séquestre) ;
   le précédent meilleur enchérisseur est remboursé aussitôt. Une enchère
   dans les 5 dernières minutes repousse la fin à 5 minutes (anti-dernière
   seconde). À la clôture : l'objet part au gagnant, le vendeur reçoit le
   prix moins 5 % de taxe, versée au pot commun. Sans enchère, l'objet
   revient au vendeur.
===================================================== */

export type AuctionKind = "relic" | "module";
export type AuctionStatus = "open" | "sold" | "expired" | "cancelled";

export interface Auction {
  id: string;
  sellerId: string;
  sellerPseudo: string;
  kind: AuctionKind;
  item: RelicItem | ModuleItem;
  label: string;
  rarity: string;
  res: ResourceId;
  startPrice: number;
  /** Meilleure enchère (0 : aucune). */
  bid: number;
  bidderId: string;
  bidderPseudo: string;
  bids: number;
  status: AuctionStatus;
  createdAtMs: number;
  endsAtMs: number;
  closedAtMs: number;
  tax: number;
}

export const AUCTION_RULES = {
  /** Surenchère minimale (5 % au-dessus de la meilleure). */
  minIncrement: 0.05,
  antiSnipeMs: 5 * 60_000,
  taxRate: 0.05,
  maxOpenPerSeller: 5,
  durationsH: [6, 12, 24, 48],
  minStart: 100,
  maxStart: 1e12,
};

export const AUCTION_CURRENCIES: ResourceId[] = RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => r.id as ResourceId);

export interface ListingRequest {
  kind: AuctionKind;
  itemId: string;
  res: ResourceId;
  startPrice: number;
  durationH: number;
}

export function validateListing(raw: unknown, openCount: number): ListingRequest {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kind = r.kind === "relic" || r.kind === "module" ? r.kind : null;
  if (!kind) throw new GameActionError("Objet à vendre inconnu.");
  const itemId = typeof r.itemId === "string" ? r.itemId : "";
  if (!itemId) throw new GameActionError("Choisis l'objet à vendre.");
  const res = String(r.res) as ResourceId;
  if (!AUCTION_CURRENCIES.includes(res)) throw new GameActionError("Monnaie refusée : une ressource commune seulement.");
  const startPrice = Math.floor(Number(r.startPrice));
  if (!(startPrice >= AUCTION_RULES.minStart && startPrice <= AUCTION_RULES.maxStart)) throw new GameActionError(`Mise à prix entre ${AUCTION_RULES.minStart} et 10^12.`);
  const durationH = Math.floor(Number(r.durationH));
  if (!AUCTION_RULES.durationsH.includes(durationH)) throw new GameActionError("Durée refusée.");
  if (openCount >= AUCTION_RULES.maxOpenPerSeller) throw new GameActionError(`${AUCTION_RULES.maxOpenPerSeller} ventes ouvertes au plus.`);
  return { kind, itemId, res, startPrice, durationH };
}

/** Retire l'objet de l'inventaire du vendeur (modifie le joueur). */
export function takeLot(player: PlayerState, kind: AuctionKind, itemId: string): { item: RelicItem | ModuleItem; label: string; rarity: string } {
  if (kind === "relic") {
    const st = relicsState(player);
    const item = st.items.find((r) => r.id === itemId);
    if (!item) throw new GameActionError("Relique introuvable.");
    if (item.rarity === "mythic") throw new GameActionError("Une relique mythique ne se vend pas.");
    if (st.slots.includes(item.id)) throw new GameActionError("Retire d'abord cette relique de son emplacement.");
    st.items = st.items.filter((r) => r.id !== item.id);
    player.relics = st;
    return { item, label: relicLabel(item), rarity: item.rarity };
  }
  const st = modulesState(player);
  const item = st.items.find((m) => m.id === itemId);
  if (!item) throw new GameActionError("Plan introuvable.");
  if (item.built) throw new GameActionError("Seuls les plans (non fabriqués) se vendent aux enchères.");
  st.items = st.items.filter((m) => m.id !== item.id);
  player.modules = st;
  return { item, label: `Plan : ${moduleLabel(item)}`, rarity: item.rarity };
}

/** Remet l'objet dans un inventaire (gagnant ou vendeur), même plein : il a été payé. */
export function giveLot(player: PlayerState, kind: AuctionKind, item: RelicItem | ModuleItem): void {
  if (kind === "relic") {
    const st = relicsState(player);
    if (!st.items.some((r) => r.id === item.id)) st.items.push(item as RelicItem);
    player.relics = st;
    return;
  }
  const st = modulesState(player);
  if (!st.items.some((m) => m.id === item.id)) st.items.push({ ...(item as ModuleItem), built: false });
  player.modules = st;
}

/** Couleur (ton HUD) et libellé de la rareté du lot. */
export function lotRarity(kind: AuctionKind, rarity: string): { label: string; tone: "neutral" | "accent" | "violet" | "gold" | "danger" } {
  if (kind === "module") {
    const r = moduleRarity(rarity as ModuleItem["rarity"]);
    return { label: r.label, tone: r.tone };
  }
  const label = rarityInfo(rarity as RelicItem["rarity"])?.label ?? rarity;
  const tone = rarity === "legendary" ? "gold" : rarity === "epic" ? "violet" : rarity === "rare" ? "accent" : "neutral";
  return { label, tone };
}

export function lotKnown(kind: AuctionKind, item: { template?: string }): boolean {
  return kind === "relic" ? !!findTemplate(item.template) : !!findModuleTemplate(String(item.template));
}

export function minNextBid(a: Pick<Auction, "bid" | "startPrice">): number {
  if (!(a.bid > 0)) return a.startPrice;
  return Math.max(a.bid + 1, Math.ceil(a.bid * (1 + AUCTION_RULES.minIncrement)));
}

export interface BidOutcome {
  /** Enchérisseur à rembourser (null : première enchère ou même joueur). */
  refund: { uid: string; amount: number } | null;
  /** Ce que le nouvel enchérisseur paie maintenant (la différence s'il surenchérit sur lui-même). */
  charge: number;
  endsAtMs: number;
}

/** Contrôle et applique une enchère (modifie l'enchère). */
export function placeBid(a: Auction, uid: string, pseudo: string, amountIn: unknown, now: number): BidOutcome {
  if (a.status !== "open" || now >= a.endsAtMs) throw new GameActionError("Cette vente est close.");
  if (a.sellerId === uid) throw new GameActionError("Tu ne peux pas enchérir sur ta propre vente.");
  const amount = Math.floor(Number(amountIn));
  const min = minNextBid(a);
  if (!(amount >= min)) throw new GameActionError(`Enchère minimale : ${min}.`);
  if (amount > AUCTION_RULES.maxStart * 10) throw new GameActionError("Enchère trop élevée.");
  const same = a.bidderId === uid;
  const refund = a.bidderId && !same ? { uid: a.bidderId, amount: a.bid } : null;
  const charge = same ? amount - a.bid : amount;
  a.bid = amount;
  a.bidderId = uid;
  a.bidderPseudo = pseudo;
  a.bids += 1;
  if (a.endsAtMs - now < AUCTION_RULES.antiSnipeMs) a.endsAtMs = now + AUCTION_RULES.antiSnipeMs;
  return { refund, charge, endsAtMs: a.endsAtMs };
}

export interface Settlement {
  status: "sold" | "expired";
  /** Qui reçoit l'objet. */
  receiver: string;
  /** Ce que touche le vendeur (prix moins taxe ; 0 sans vente). */
  payout: number;
  tax: number;
}

export function settleAuction(a: Pick<Auction, "bid" | "bidderId" | "sellerId">): Settlement {
  if (!(a.bid > 0) || !a.bidderId) return { status: "expired", receiver: a.sellerId, payout: 0, tax: 0 };
  const tax = Math.floor(a.bid * AUCTION_RULES.taxRate);
  return { status: "sold", receiver: a.bidderId, payout: a.bid - tax, tax };
}

export function canCancel(a: Pick<Auction, "status" | "bid">): boolean {
  return a.status === "open" && !(a.bid > 0);
}

/** Débite l'enchérisseur (séquestre). */
export function debitBid(player: PlayerState, res: ResourceId, amount: number): void {
  if (!(amount > 0)) return;
  if (Math.floor(player.resources[res] ?? 0) < amount) throw new GameActionError("Ressources insuffisantes pour cette enchère.");
  player.resources[res] -= amount;
}

/** Rembourse ou paie (enchère dépassée, vente conclue). */
export function creditBid(player: PlayerState, res: ResourceId, amount: number): void {
  if (amount > 0) player.resources[res] = (player.resources[res] ?? 0) + amount;
}
