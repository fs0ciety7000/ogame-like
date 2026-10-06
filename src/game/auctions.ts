import { bumpStat } from "@/game/stats";
import { GameActionError } from "@/game/errors";
import { findTemplate, rarityInfo, relicLabel, relicsState, type RelicItem } from "@/game/relics";
import { findModuleTemplate, moduleLabel, modulesState, moduleRarity, type ModuleItem } from "@/game/modules";
import { RESOURCE_LIST } from "@/game/resources";
import { bountyState } from "@/game/bounties";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   5.26 : Hôtel des enchères. Un joueur met en vente une relique (ni
   mythique, ni équipée) ou un PLAN de module, contre la monnaie de son
   choix : ressource commune, ressource rare ou Ambre. Chaque enchère est payée tout de suite (mise sous séquestre) ;
   le précédent meilleur enchérisseur est remboursé aussitôt. Une enchère
   dans les 5 dernières minutes repousse la fin à 5 minutes (anti-dernière
   seconde). À la clôture : l'objet part au gagnant, le vendeur reçoit le
   prix moins 5 % de taxe, versée au pot commun. Sans enchère, l'objet
   revient au vendeur.
===================================================== */

export type AuctionKind = "relic" | "module";
/** Monnaie d'une vente : une ressource (commune ou rare) ou l'Ambre de Ruche. */
export type AuctionCurrency = ResourceId | "amber";
export type AuctionStatus = "open" | "sold" | "expired" | "cancelled";

export interface Auction {
  id: string;
  sellerId: string;
  sellerPseudo: string;
  kind: AuctionKind;
  item: RelicItem | ModuleItem;
  label: string;
  rarity: string;
  res: AuctionCurrency;
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
  /** 5.26.2 : empreintes (IP hachée, identifiant d'appareil) du vendeur et du meilleur enchérisseur. */
  sellerIp?: string;
  sellerDevice?: string;
  bidderIp?: string;
  bidderDevice?: string;
}

export const AUCTION_RULES = {
  /** Surenchère minimale (5 % au-dessus de la meilleure). */
  minIncrement: 0.05,
  antiSnipeMs: 5 * 60_000,
  taxRate: 0.05,
  maxOpenPerSeller: 5,
  durationsH: [6, 12, 24, 48],
  /** Mise à prix minimale : ressource commune, ressource rare, Ambre. */
  minStart: { common: 100, rare: 1, amber: 1 },
  maxStart: 1e12,
  /** 6.9.0 (AU4) : alertes de vente par joueur, historique des prix (ventes gardées par lot, lots suivis). */
  watchMax: 5,
  historyPerLot: 20,
  historyMaxLots: 400,
};

export const AUCTION_CURRENCIES: AuctionCurrency[] = [...RESOURCE_LIST.map((r) => r.id as ResourceId), "amber"];

export function currencyKind(res: AuctionCurrency): "common" | "rare" | "amber" {
  if (res === "amber") return "amber";
  return RESOURCE_LIST.find((r) => r.id === res)?.rarity === "rare" ? "rare" : "common";
}

export function minStartFor(res: AuctionCurrency): number {
  return AUCTION_RULES.minStart[currencyKind(res)];
}

export function currencyLabel(res: AuctionCurrency): string {
  return res === "amber" ? "Ambre" : (RESOURCE_LIST.find((r) => r.id === res)?.name ?? res);
}

export interface ListingRequest {
  kind: AuctionKind;
  itemId: string;
  res: AuctionCurrency;
  startPrice: number;
  durationH: number;
}

export function validateListing(raw: unknown, openCount: number): ListingRequest {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kind = r.kind === "relic" || r.kind === "module" ? r.kind : null;
  if (!kind) throw new GameActionError("Objet à vendre inconnu.");
  const itemId = typeof r.itemId === "string" ? r.itemId : "";
  if (!itemId) throw new GameActionError("Choisis l'objet à vendre.");
  const res = String(r.res) as AuctionCurrency;
  if (!AUCTION_CURRENCIES.includes(res)) throw new GameActionError("Monnaie inconnue.");
  const startPrice = Math.floor(Number(r.startPrice));
  const min = minStartFor(res);
  if (!(startPrice >= min && startPrice <= AUCTION_RULES.maxStart)) throw new GameActionError(`Mise à prix : au moins ${min} ${currencyLabel(res).toLowerCase()}.`);
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

/** 5.26.1 : compteurs des succès (vente conclue côté vendeur, enchère remportée côté gagnant). */
export function recordAuctionStat(player: PlayerState, side: "sold" | "won"): void {
  bumpStat(player, side === "sold" ? "auctionsSold" : "auctionsWon");
}

/** Solde du joueur dans la monnaie de la vente. */
export function currencyBalance(player: Pick<PlayerState, "resources" | "bounties">, res: AuctionCurrency): number {
  return Math.floor(res === "amber" ? bountyState(player).amber : (player.resources[res] ?? 0));
}

/** Débite l'enchérisseur (séquestre). */
export function debitBid(player: PlayerState, res: AuctionCurrency, amount: number): void {
  if (!(amount > 0)) return;
  if (currencyBalance(player, res) < amount) throw new GameActionError(res === "amber" ? "Pas assez d'Ambre pour cette enchère." : "Ressources insuffisantes pour cette enchère.");
  if (res === "amber") {
    const st = bountyState(player);
    st.amber -= amount;
    player.bounties = st;
  } else player.resources[res] -= amount;
}

/** Rembourse ou paie (enchère dépassée, vente conclue). */
export function creditBid(player: PlayerState, res: AuctionCurrency, amount: number): void {
  if (!(amount > 0)) return;
  if (res === "amber") {
    const st = bountyState(player);
    st.amber += amount;
    player.bounties = st;
  } else player.resources[res] = (player.resources[res] ?? 0) + amount;
}

/* ---------- 5.26.2 : historique des prix et alertes de vente ---------- */

export const AUCTION_HISTORY_KEY = "auction_history";
/** Lus dans AUCTION_RULES (réglables dans l'admin). */
export const AUCTION_HISTORY_RULES = {
  get perLot() {
    return AUCTION_RULES.historyPerLot;
  },
  get maxLots() {
    return AUCTION_RULES.historyMaxLots;
  },
};
export const AUCTION_WATCH_RULES = {
  get maxPerPlayer() {
    return AUCTION_RULES.watchMax;
  },
};

const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };

export interface AuctionSale {
  atMs: number;
  res: AuctionCurrency;
  price: number;
}

/** Ventes conclues par lot (« relic:modele:rarete »), gardées au-delà du ménage des 30 jours. */
export interface AuctionHistory {
  lots: Record<string, { label: string; kind: AuctionKind; rarity: string; sales: AuctionSale[] }>;
}

/** Clé d'un lot : même modèle et même rareté. */
export function lotKey(kind: AuctionKind, item: { template?: string; rarity?: string }): string {
  return `${kind}:${String(item.template ?? "")}:${String(item.rarity ?? "")}`;
}

export function normalizeAuctionHistory(raw: unknown): AuctionHistory {
  const lots: AuctionHistory["lots"] = {};
  const src = raw && typeof raw === "object" ? (raw as Partial<AuctionHistory>).lots : null;
  if (!src || typeof src !== "object") return { lots };
  for (const [k, v] of Object.entries(src)) {
    if (!v || typeof v !== "object" || !Array.isArray(v.sales)) continue;
    const sales = v.sales
      .map((s) => ({ atMs: Number(s?.atMs) || 0, res: String(s?.res) as AuctionCurrency, price: Math.floor(Number(s?.price)) }))
      .filter((s) => AUCTION_CURRENCIES.includes(s.res) && s.price > 0)
      .slice(-AUCTION_HISTORY_RULES.perLot);
    if (sales.length) lots[k] = { label: String(v.label ?? "").slice(0, 120), kind: v.kind === "module" ? "module" : "relic", rarity: String(v.rarity ?? ""), sales };
  }
  return { lots };
}

/** Ajoute une vente conclue (les lots les moins récents sont oubliés au-delà de 400). */
export function recordSale(h: AuctionHistory, a: Pick<Auction, "kind" | "item" | "label" | "rarity" | "res" | "bid">, now: number): AuctionHistory {
  if (!(a.bid > 0)) return h;
  const key = lotKey(a.kind, a.item as { template?: string; rarity?: string });
  const prev = h.lots[key];
  const tpl = (a.item as { template?: string }).template;
  const name = (a.kind === "module" ? findModuleTemplate(String(tpl))?.name : findTemplate(tpl)?.name) ?? a.label.replace(/^Plan : /, "");
  const lots = { ...h.lots, [key]: { label: name, kind: a.kind, rarity: a.rarity, sales: [...(prev?.sales ?? []), { atMs: now, res: a.res, price: Math.floor(a.bid) }].slice(-AUCTION_HISTORY_RULES.perLot) } };
  const keys = Object.keys(lots);
  if (keys.length > AUCTION_HISTORY_RULES.maxLots) {
    const last = (k: string) => lots[k].sales[lots[k].sales.length - 1]?.atMs ?? 0;
    keys.sort((x, y) => last(x) - last(y)).slice(0, keys.length - AUCTION_HISTORY_RULES.maxLots).forEach((k) => delete lots[k]);
  }
  return { lots };
}

/** Résumé des ventes d'un lot dans une monnaie : nombre, médiane, dernière, min, max. */
export function priceSummary(sales: AuctionSale[], res: AuctionCurrency): { count: number; median: number; last: number; min: number; max: number } | null {
  const list = sales.filter((s) => s.res === res);
  if (list.length === 0) return null;
  const sorted = list.map((s) => s.price).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return { count: list.length, median, last: list[list.length - 1].price, min: sorted[0], max: sorted[sorted.length - 1] };
}

export interface AuctionWatch {
  id?: string;
  uid?: string;
  /** « any » : reliques et plans. */
  kind: AuctionKind | "any";
  /** Rareté minimale (incluse). */
  minRarity: string;
  /** Modèle précis (vide : tous). */
  template: string;
}

export function validateWatch(raw: unknown, count: number): AuctionWatch {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kind = r.kind === "relic" || r.kind === "module" || r.kind === "any" ? r.kind : null;
  if (!kind) throw new GameActionError("Choisis reliques, plans ou les deux.");
  const minRarity = String(r.minRarity ?? "");
  if (!(minRarity in RARITY_RANK) || minRarity === "mythic") throw new GameActionError("Rareté inconnue.");
  const template = typeof r.template === "string" ? r.template.slice(0, 60) : "";
  if (template && kind === "any") throw new GameActionError("Un modèle précis demande de choisir reliques ou plans.");
  if (template && !lotKnown(kind as AuctionKind, { template })) throw new GameActionError("Modèle inconnu.");
  if (count >= AUCTION_WATCH_RULES.maxPerPlayer) throw new GameActionError(`${AUCTION_WATCH_RULES.maxPerPlayer} alertes au plus.`);
  return { kind, minRarity, template };
}

export function watchMatches(w: Pick<AuctionWatch, "kind" | "minRarity" | "template">, kind: AuctionKind, item: { template?: string; rarity?: string }): boolean {
  if (w.kind !== "any" && w.kind !== kind) return false;
  if ((RARITY_RANK[String(item.rarity)] ?? -1) < (RARITY_RANK[w.minRarity] ?? 99)) return false;
  return !w.template || w.template === item.template;
}

/** Joueurs à prévenir d'une mise en vente (un seul avis par joueur, jamais le vendeur). */
export function watchersFor(watches: AuctionWatch[], sellerId: string, kind: AuctionKind, item: { template?: string; rarity?: string }): string[] {
  const out = new Set<string>();
  for (const w of watches) if (w.uid && w.uid !== sellerId && watchMatches(w, kind, item)) out.add(w.uid);
  return [...out];
}

/** « Plans légendaires », « Reliques épiques ou mieux : Cœur de pulsar ». */
export function describeWatch(w: Pick<AuctionWatch, "kind" | "minRarity" | "template">): string {
  const what = w.kind === "relic" ? "Reliques" : w.kind === "module" ? "Plans" : "Reliques et plans";
  const plural: Record<string, [string, string]> = { common: ["communes", "communs"], rare: ["rares", "rares"], epic: ["épiques", "épiques"], legendary: ["légendaires", "légendaires"] };
  const rarity = (plural[w.minRarity] ?? [w.minRarity, w.minRarity])[w.kind === "relic" ? 0 : 1];
  const name = w.template ? (w.kind === "module" ? findModuleTemplate(w.template)?.name : findTemplate(w.template)?.name) : "";
  return `${what} ${w.minRarity === "legendary" ? rarity : `${rarity} ou mieux`}${name ? ` : ${name}` : ""}`;
}

/** 5.26.2 : vente conclue entre deux comptes qui partagent une adresse IP ou un appareil. */
export function linkedAuctionReasons(a: Pick<Auction, "sellerIp" | "sellerDevice" | "bidderIp" | "bidderDevice">): string[] {
  const out: string[] = [];
  if (a.sellerIp && a.sellerIp === a.bidderIp) out.push("même adresse IP");
  if (a.sellerDevice && a.sellerDevice === a.bidderDevice) out.push("même appareil");
  return out;
}

/** Identifiant d'appareil envoyé par le client (hexadécimal, 16 à 64 caractères), sinon vide. */
export function cleanDeviceId(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return /^[0-9a-f]{16,64}$/.test(s) ? s : "";
}
