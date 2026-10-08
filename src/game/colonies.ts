import { allianceProductionFactor } from "@/game/alliances";
import { spendResources } from "@/game/spending";
import { bumpStat, playerStats } from "@/game/stats";
import { ascensionProductionFactor } from "@/game/ascension";
import { playerBuildingDiscount, playerBuildTimeFactor } from "@/game/bonuses";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { playerUnitCapacity } from "@/game/hangar";
import { applyBuildingDiscount, BUILDINGS, effectiveBuildingLevel, findBuilding, getBuildingUpgradeCost, getBuildingUpgradeTime, getUnitCapacity, PRODUCTION_RESOURCE_BY_BUILDING } from "@/game/buildings";
import { advanceResources, COMMON_RESOURCES, storageCapacityOf } from "@/game/economy";
import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { RESOURCE_LIST } from "@/game/resources";
import { findUnit, getUnitBuildTime } from "@/game/units";
import { playerUnitCost } from "@/game/effectTargets";
import type { NewNotification } from "@/game/flush";
import type { Buildings, PlayerState, ResourceId, Resources } from "@/types/game";

/* =====================================================
   Colonies (v3.5) : jusqu'à deux planètes en plus de la planète mère.
   Chacune a ses propres bâtiments (extracteurs, entrepôt, hangar de
   défense), son propre stock et ses défenses. Les technologies, l'alliance
   et les ascensions profitent à tout l'empire. Les ressources circulent
   par transport (flottes de la planète mère).
===================================================== */

export const COLONY_RULES = {
  maxColonies: 2,
  /** Niveaux de bâtiments cumulés (planète mère) requis pour la 1re, puis la 2e colonie. */
  levelsRequired: [120, 140],
  /** Vaisseau colonial : coût par ressource commune et par ressource rare. */
  foundCommonCost: 50_000_000,
  foundRareCost: 1_000_000,
  /** Voyage du vaisseau colonial (heures). */
  foundHours: 2,
  /** Stock de départ de chaque ressource commune (v5.10 : 1 M → 5 M). */
  startStock: 5_000_000,
  /** v5.10 : 15 → 18. */
  maxLevel: 18,
  /** Coût des bâtiments d'une colonie : × ce facteur par rapport à la planète mère (v5.10 : 1,5 → 1). */
  costFactor: 1,
  /** v5.10 : terres neuves — production des colonies × (1 + bonus). */
  productionBonus: 0.5,
  /** v5.10 : à la fondation, chaque extracteur et l'entrepôt démarrent à cette part du niveau de la planète mère… */
  foundationShare: 0.5,
  /** …sans dépasser ce niveau. */
  foundationMax: 8,
  /** 6.4 : lots de défenses en attente par colonie (en plus du lot en construction). */
  defenseQueueMax: 5,
};

/** Bâtiments relevés à la fondation (extracteurs communs et entrepôt). */
function foundationBuildingIds(): string[] {
  return colonyBuildingIds().filter((id) => {
    const res = PRODUCTION_RESOURCE_BY_BUILDING[id];
    return (res && COMMON_RESOURCES.includes(res as ResourceId)) || findBuilding(id)?.effect?.type === "storage";
  });
}

/** v5.10 : niveau de départ d'un bâtiment de colonie selon la planète mère. */
export function foundationLevel(homeLevel: number): number {
  return Math.max(1, Math.min(COLONY_RULES.foundationMax, Math.floor((homeLevel || 0) * COLONY_RULES.foundationShare)));
}

/** v5.10 : relève les extracteurs et l'entrepôt d'une colonie au niveau de fondation (jamais à la baisse). */
export function applyFoundation(colony: Colony, home: Buildings | undefined): void {
  for (const id of foundationBuildingIds()) {
    const target = foundationLevel(home?.[id]?.level ?? 0);
    const cur = colony.buildings[id]?.level ?? 1;
    if (target > cur) colony.buildings[id] = { ...(colony.buildings[id] ?? { unlocked: true }), level: target, unlocked: true };
  }
  colony.foundation = 1;
}

export interface ColonyBuildingJob {
  id: string;
  level: number;
  endTime: number;
  /** v4.7 : départ et coût payé (annulation au prorata). */
  startedAtMs?: number;
  paid?: Partial<Record<ResourceId, number>>;
}

export interface ColonyDefenseJob {
  unitId: string;
  qty: number;
  endTime: number;
  startedAtMs?: number;
  paid?: Partial<Record<ResourceId, number>>;
}

export interface Colony {
  /** `<uid>-c<slot>` : sert aussi de coordonnées sur la carte. */
  id: string;
  slot: number;
  name: string;
  foundedAtMs: number;
  buildings: Buildings;
  resources: Resources;
  updatedAtMs: number;
  building: ColonyBuildingJob | null;
  defenses: Record<string, { level: number; count: number }>;
  defenseJob: ColonyDefenseJob | null;
  /** 6.4 : lots de défenses en attente, payés d'avance (endTime à 0 tant qu'ils n'ont pas démarré). */
  defenseQueue?: ColonyDefenseJob[];
  /** Dernière défaite (bouclier d'une heure, propre à la colonie). */
  lastDefeatAtMs?: number;
  /** v5.1 : biome tiré à la fondation (ressource rare du gisement). */
  biome?: RareResourceId;
  /** v5.10 : niveaux de fondation appliqués (colonies plus anciennes : relevées une fois). */
  foundation?: number;
  /** v5.11 : spécialisation choisie et date du dernier changement. */
  spec?: ColonySpecId | null;
  specChangedAtMs?: number;
  /** 5.33 : route logistique vers la planète mère (null = aucune). */
  route?: ColonyRoute | null;
}

/* ---------- 5.33 : routes logistiques (proposals/routes-logistiques.md) ---------- */

export type ColonyRouteDirection = "collect" | "supply";

export interface ColonyRoute {
  /** Un convoi part toutes les N heures. */
  everyHours: number;
  /** 6.4 : « collect » (colonie → planète mère, par défaut) ou « supply » (planète mère → colonie). */
  direction?: ColonyRouteDirection;
  /** collect : réserve gardée sur la colonie (part de son entrepôt pour les communes, de son stock pour la rare).
   *  supply : remplissage visé de l'entrepôt de la colonie (communes seulement). */
  keepPct: number;
  nextAtMs: number;
  lastAtMs?: number;
  /** Dernier convoi : ce qui est arrivé sur la planète mère. */
  lastDelivered?: Partial<Record<ResourceId, number>>;
}

export const COLONY_ROUTE_RULES = {
  /** Cadences proposées au joueur, en heures. */
  intervals: [6, 12, 24],
  /** Part perdue en route (frais de convoi). Le transport manuel reste gratuit. */
  feePct: 0.1,
  /** Réserve par défaut et réserve maximale. */
  defaultKeepPct: 0.2,
  maxKeepPct: 0.9,
  /** 6.4 : en ravitaillement, la planète mère garde au moins cette part de son entrepôt. */
  supplyHomeReservePct: 0.3,
};


export function setColonyRoute(player: PlayerState, colonyIdIn: string, everyHoursIn: unknown, keepPctIn: unknown, now: number, directionIn?: unknown): ColonyRoute | null {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const everyHours = Math.floor(Number(everyHoursIn));
  if (!everyHours) {
    colony.route = null;
    return null;
  }
  if (!COLONY_ROUTE_RULES.intervals.includes(everyHours)) throw new GameActionError(`Cadence possible : toutes les ${COLONY_ROUTE_RULES.intervals.join(", ")} h.`);
  const raw = Number(keepPctIn);
  const keepPct = Number.isFinite(raw) ? Math.min(COLONY_ROUTE_RULES.maxKeepPct, Math.max(0, Math.round(raw * 100) / 100)) : COLONY_ROUTE_RULES.defaultKeepPct;
  const direction: ColonyRouteDirection = directionIn === "supply" ? "supply" : "collect";
  // Changer la cadence ou le sens repart de maintenant ; changer seulement la réserve garde l'heure du prochain convoi.
  const keepNext = colony.route && colony.route.everyHours === everyHours && (colony.route.direction ?? "collect") === direction;
  colony.route = { ...(colony.route ?? {}), everyHours, direction, keepPct, nextAtMs: keepNext ? colony.route!.nextAtMs : now + everyHours * 3_600_000 };
  return colony.route;
}

/** Ce qu'un convoi enverrait maintenant (frais déduits).
 *  collect : prélevé sur la colonie, livré sur la planète mère ; les communes ne dépassent jamais l'entrepôt de la planète mère,
 *  la ressource rare n'a pas de plafond, comme partout.
 *  supply (6.4) : prélevé sur la planète mère (jamais sous sa réserve), livré sur la colonie jusqu'au remplissage visé ; communes seulement. */
export function colonyRouteLoad(colony: Colony, player: PlayerState): { taken: Partial<Record<ResourceId, number>>; delivered: Partial<Record<ResourceId, number>> } {
  const taken: Partial<Record<ResourceId, number>> = {};
  const delivered: Partial<Record<ResourceId, number>> = {};
  const route = colony.route;
  if (!route) return { taken, delivered };
  const keep = Math.min(COLONY_ROUTE_RULES.maxKeepPct, Math.max(0, route.keepPct));
  const kept = 1 - Math.min(0.99, Math.max(0, COLONY_ROUTE_RULES.feePct));
  const colonyCap = colonyStorage(colony, player);
  const homeCap = storageCapacityOf(player);
  const take = (res: ResourceId, available: number, room: number) => {
    const k = Math.floor(Math.max(0, Math.min(available, room / kept)));
    const d = Math.floor(k * kept);
    if (k > 0 && d > 0) {
      taken[res] = k;
      delivered[res] = d;
    }
  };
  if (route.direction === "supply") {
    if (!Number.isFinite(colonyCap) || !Number.isFinite(homeCap)) return { taken, delivered };
    const homeReserve = Math.floor(homeCap * COLONY_ROUTE_RULES.supplyHomeReservePct);
    const target = Math.floor(colonyCap * keep);
    for (const res of COMMON_RESOURCES) {
      const room = Math.max(0, target - Math.floor(colony.resources[res] ?? 0));
      take(res, Math.floor(player.resources[res] ?? 0) - homeReserve, room);
    }
    return { taken, delivered };
  }
  for (const res of COMMON_RESOURCES) {
    const stock = Math.floor(colony.resources[res] ?? 0);
    const reserve = Number.isFinite(colonyCap) ? Math.floor(colonyCap * keep) : 0;
    const room = Number.isFinite(homeCap) ? Math.max(0, homeCap - (player.resources[res] ?? 0)) : Infinity;
    take(res, stock - reserve, room);
  }
  const rare = colonyBiome(colony);
  const rareStock = Math.floor(colony.resources[rare] ?? 0);
  take(rare, rareStock - Math.floor(rareStock * keep), Infinity);
  return { taken, delivered };
}

/** Convoi dû : part maintenant (rattrapage compris : un seul convoi, il prend tout ce qui dépasse la réserve). */
export function runColonyRoute(colony: Colony, player: PlayerState, now: number): Partial<Record<ResourceId, number>> | null {
  const route = colony.route;
  if (!route || now < route.nextAtMs) return null;
  const { taken, delivered } = colonyRouteLoad(colony, player);
  const supply = route.direction === "supply";
  const from = supply ? player.resources : colony.resources;
  const to = supply ? colony.resources : player.resources;
  for (const [res, n] of Object.entries(taken) as [ResourceId, number][]) from[res] = (from[res] ?? 0) - n;
  for (const [res, n] of Object.entries(delivered) as [ResourceId, number][]) to[res] = (to[res] ?? 0) + n;
  // 6.14.115 (AJ27-5) : un convoi arrivé (non vide) compte pour le succès « Convoyeur ».
  if (Object.values(delivered).some((n) => (n ?? 0) > 0)) bumpStat(player, "colonyConvoys");
  const every = Math.max(1, route.everyHours) * 3_600_000;
  // Prochain convoi aligné sur la cadence, jamais dans le passé.
  const missed = Math.floor((now - route.nextAtMs) / every);
  colony.route = { ...route, lastAtMs: now, lastDelivered: delivered, nextAtMs: route.nextAtMs + (missed + 1) * every };
  return delivered;
}

/* ---------- v5.11 : spécialisation des colonies ---------- */

export type ColonySpecId = "forge" | "extraction" | "bastion" | "depot";

export interface ColonySpecDef {
  id: ColonySpecId;
  name: string;
  emoji: string;
  /** Bonus et contrepartie, en une phrase. */
  summary: string;
  production?: number;
  deposit?: number;
  storage?: number;
  hangar?: number;
  defenseTime?: number;
}

/** 6.14.104 (AA3, AA-4) : multiplicateurs d'une spécialisation (1 = sans effet). */
export type ColonySpecFactors = Partial<Record<"production" | "deposit" | "storage" | "hangar" | "defenseTime", number>>;

/** « +25 % », « −20 % » (multiplicateur → écart). */
const signedPct = (m: number | undefined) => {
  const pct = Math.round(((m ?? 1) - 1) * 100);
  return pct >= 0 ? `+${pct} %` : `−${-pct} %`;
};

const SPEC_FACTOR_LABELS: Record<keyof ColonySpecFactors, string> = {
  production: "production",
  deposit: "gisement rare",
  storage: "entrepôt",
  hangar: "hangar de défense",
  defenseTime: "durée des défenses",
};

/** 6.14.104 (AA3, AA-4) : chiffres lus dans COLONY_SPEC_RULES.specs (admin, Colonies : spécialisation) ; ids, noms et
 *  phrases en dur. Le résumé est construit depuis les chiffres (un facteur ajouté par l'admin s'y ajoute en fin de phrase). */
const colonySpec = (id: ColonySpecId, name: string, emoji: string, text: (f: ColonySpecFactors) => string, used: (keyof ColonySpecFactors)[]): ColonySpecDef => {
  const factors = (): ColonySpecFactors => (COLONY_SPEC_RULES.specs[id] ?? {}) as ColonySpecFactors;
  const factor = (k: keyof ColonySpecFactors) => {
    const v = Number(factors()[k]);
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  return {
    id,
    name,
    emoji,
    get summary() {
      const f = factors();
      const extra = (Object.keys(SPEC_FACTOR_LABELS) as (keyof ColonySpecFactors)[]).filter((k) => !used.includes(k) && factor(k) !== undefined && factor(k) !== 1);
      const base = text(f);
      return extra.length === 0 ? base : `${base.replace(/\.$/, "")}, ${extra.map((k) => `${SPEC_FACTOR_LABELS[k]} ${signedPct(factor(k))}`).join(", ")}.`;
    },
    get production() {
      return factor("production");
    },
    get deposit() {
      return factor("deposit");
    },
    get storage() {
      return factor("storage");
    },
    get hangar() {
      return factor("hangar");
    },
    get defenseTime() {
      return factor("defenseTime");
    },
  };
};

export const COLONY_SPECS: ColonySpecDef[] = [
  colonySpec("forge", "Forge industrielle", "🏭", (f) => `Ressources communes ${signedPct(f.production)}, gisement rare ${signedPct(f.deposit)}.`, ["production", "deposit"]),
  colonySpec("extraction", "Comptoir minier", "💎", (f) => `Gisement rare ${signedPct(f.deposit)}, ressources communes ${signedPct(f.production)}.`, ["production", "deposit"]),
  colonySpec(
    "bastion",
    "Bastion",
    "🛡️",
    (f) => `Hangar de défense ${signedPct(f.hangar)} et défenses ${Math.round((1 - (f.defenseTime ?? 1)) * 100)} % plus rapides, production ${signedPct(f.production)}.`,
    ["production", "hangar", "defenseTime"],
  ),
  colonySpec("depot", "Dépôt logistique", "📦", (f) => `Entrepôt ${signedPct(f.storage)} : la colonie stocke plus longtemps sans perte.`, ["storage"]),
];

/** 6.14.115 (AJ27-5) : récit de chaque spécialisation (fiche du Codex) ; les chiffres viennent du résumé, lu dans les règles. */
export const COLONY_SPEC_LORE: Record<ColonySpecId, string> = {
  forge: "Les cheminées ne s'éteignent jamais. On y coule le métal jour et nuit, et la colonie entière sent la limaille chaude. Le gisement rare, lui, attend son tour : ici, on produit d'abord ce qui sert tout de suite.",
  extraction: "Des puits forés si profond que les équipes y descendent pour des semaines. Chaque benne qui remonte vaut une fortune, et les extracteurs de surface tournent au ralenti pour laisser l'énergie aux foreuses.",
  bastion: "Des remparts de roche fondue, des dômes de bouclier, et des batteries qui sortent des ateliers plus vite qu'ailleurs. La colonie produit moins : elle a mieux à faire que de s'enrichir, elle tient.",
  depot: "Des silos à perte de vue, alignés comme des tours de garde. Rien ne se perd, tout attend le prochain convoi. Les logisticiens disent qu'une colonie pleine vaut mieux qu'une colonie riche.",
};

export const COLONY_SPEC_RULES = {
  /** Délai entre deux changements (le premier choix est libre). */
  changeCooldownMs: 7 * 24 * 3600_000,
  /** 6.14.104 (AA3, AA-4) : multiplicateurs de chaque spécialisation (1 = sans effet ; 0,7 en durée = 30 % plus rapide). */
  specs: {
    forge: { production: 1.25, deposit: 0.8 },
    extraction: { production: 0.9, deposit: 1.6 },
    bastion: { production: 0.9, hangar: 1.5, defenseTime: 0.7 },
    depot: { storage: 1.6 },
  } as Record<ColonySpecId, ColonySpecFactors>,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const COLONY_SPEC_RULES_META = {
  changeCooldownMs: { label: "Délai entre deux changements de spécialisation", unit: "ms", min: 0, max: 7_776_000_000, hint: "604 800 000 = 7 jours. Le premier choix est libre." },
  specs: { label: "Multiplicateurs de chaque spécialisation", unit: "×", hint: "production, deposit (gisement rare), storage (entrepôt), hangar (hangar de défense), defenseTime (durée des défenses) : 1 = sans effet, entre 0,1 et 5. Le résumé affiché au joueur suit les chiffres." },
};

export function findColonySpec(id: string | null | undefined): ColonySpecDef | undefined {
  return COLONY_SPECS.find((s) => s.id === id);
}

/** Multiplicateurs de la spécialisation (1 sans spécialisation). */
export function colonySpecEffects(colony: Pick<Colony, "spec">) {
  const s = findColonySpec(colony.spec);
  return { production: s?.production ?? 1, deposit: s?.deposit ?? 1, storage: s?.storage ?? 1, hangar: s?.hangar ?? 1, defenseTime: s?.defenseTime ?? 1 };
}

/** Prochain changement possible (0 : tout de suite). */
export function colonySpecReadyAt(colony: Pick<Colony, "spec" | "specChangedAtMs">): number {
  return colony.spec && colony.specChangedAtMs ? colony.specChangedAtMs + COLONY_SPEC_RULES.changeCooldownMs : 0;
}

export function setColonySpec(player: PlayerState, colonyIdIn: string, specIn: string, now: number): Colony {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const spec = findColonySpec(specIn);
  if (!spec) throw new GameActionError("Spécialisation inconnue.");
  if (colony.spec === spec.id) throw new GameActionError("Cette colonie a déjà cette spécialisation.");
  const ready = colonySpecReadyAt(colony);
  if (ready > now) throw new GameActionError(`Changement possible dans ${Math.ceil((ready - now) / 3600_000)} h.`);
  colony.spec = spec.id;
  colony.specChangedAtMs = now;
  // 6.14.115 (AJ27-5) : la fiche du Codex de la spécialisation reste ouverte après un changement.
  const used = playerStats(player).colonySpecsUsed ?? [];
  if (!used.includes(spec.id)) player.stats = { ...(player.stats ?? {}), colonySpecsUsed: [...used, spec.id] };
  return colony;
}

export interface Colonizing {
  slot: number;
  name: string;
  endTime: number;
}

const HOUR = 3600_000;

/* ---------- v5.1 : biomes et gisements de ressource rare ---------- */

export type RareResourceId = "reinforcedSteel" | "cyberModule" | "syntheticNanites" | "aiFragment";

/** Bâtiment propre aux colonies : extrait la ressource rare du biome. */
export const DEPOSIT_ID = "gisement";

export const BIOMES: Record<RareResourceId, { name: string; deposit: string; lore: string; tone: string }> = {
  reinforcedSteel: { name: "Monde ferreux", deposit: "Mine d'acier profond", lore: "Un noyau saturé de métal : l'acier renforcé affleure presque à la surface.", tone: "#9fb4c8" },
  cyberModule: { name: "Cimetière d'épaves", deposit: "Atelier de récupération", lore: "Des flottes entières s'y sont écrasées ; leurs modules dorment sous la poussière.", tone: "#5de0ff" },
  syntheticNanites: { name: "Marais de nanites", deposit: "Ruche de nanites", lore: "Une brume grise vivante, que l'on récolte comme du miel.", tone: "#7cf0b0" },
  aiFragment: { name: "Nécropole d'IA", deposit: "Excavation de noyaux", lore: "Les ruines d'une civilisation de machines, aux mémoires encore chaudes.", tone: "#c792ff" },
};

export const RARE_DEPOSITS = Object.keys(BIOMES) as RareResourceId[];

/** 6.14.115 (AJ27-5) : biomes qui ont leur illustration définitive (`public/assets/colonies/biome-<id>.webp`, lignes
 *  `colonie-biome-<id>` de `scripts/illustrations.json`, docs/illustrations.md). Un id ajouté ici suffit. */
export const BIOME_ART: readonly RareResourceId[] = [];

/** Illustration d'un biome (Codex) : définitive si elle existe, sinon l'icône de sa ressource rare (image provisoire). */
export function biomeImage(id: RareResourceId): string {
  return BIOME_ART.includes(id) ? `/assets/colonies/biome-${id}.webp` : `/assets/icons/${id}.webp`;
}

/** 6.14.115 (AJ27-5) : illustration d'une spécialisation (lignes `colonie-<id>`, intégrées le 2026-10-07). */
export function colonySpecImage(id: ColonySpecId): string {
  return `/assets/colonies/${id}.webp`;
}

export const DEPOSIT_RULES = {
  /** Production par seconde, niveaux 1 à 15. */
  perSecond: [0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.8, 2.1, 2.4, 3],
  /** Coût : celui d'un extracteur de colonie × ce facteur (plus nanocomposants et données). */
  costFactor: 1.2,
  /** Durée : celle d'un extracteur de colonie × ce facteur. */
  timeFactor: 1.5,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const DEPOSIT_RULES_META = {
  perSecond: { label: "Production par seconde, niveaux 1 à 15", hint: "Une valeur par niveau du gisement." },
  costFactor: { label: "Coût : × celui d'un extracteur de colonie", unit: "×", min: 0.1, max: 10, hint: "Plus des nanocomposants (½) et des données (¼)." },
  timeFactor: { label: "Durée : × celle d'un extracteur de colonie", unit: "×", min: 0.1, max: 10 },
};

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Biome tiré au hasard (déterministe : même résultat côté serveur et navigateur). */
export function biomeFor(seed: string): RareResourceId {
  return RARE_DEPOSITS[hashString(seed) % RARE_DEPOSITS.length];
}

/** Biome d'une colonie (les colonies fondées avant la v5.1 en reçoivent un aussi). */
export function colonyBiome(colony: Pick<Colony, "id" | "foundedAtMs" | "biome">): RareResourceId {
  return colony.biome && BIOMES[colony.biome] ? colony.biome : biomeFor(`${colony.id}:${colony.foundedAtMs}`);
}

export function depositLevel(colony: Pick<Colony, "buildings">): number {
  return colony.buildings[DEPOSIT_ID]?.level ?? 1;
}

export function depositPerSecond(level: number): number {
  if (level <= 0) return 0;
  return DEPOSIT_RULES.perSecond[Math.min(level, DEPOSIT_RULES.perSecond.length) - 1];
}

/** Nom d'un bâtiment de colonie (le gisement dépend du biome). */
/** Gisement d'une colonie, spécialisation comprise. */
export function colonyDepositPerSecond(colony: Pick<Colony, "buildings" | "spec">): number {
  return depositPerSecond(depositLevel(colony)) * colonySpecEffects(colony).deposit;
}

export function colonyBuildingName(colony: Pick<Colony, "id" | "foundedAtMs" | "biome">, id: string): string {
  return id === DEPOSIT_ID ? BIOMES[colonyBiome(colony)].deposit : (findBuilding(id)?.name ?? id);
}

/** Bâtiments constructibles sur une colonie. */
export function colonyBuildingIds(): string[] {
  return BUILDINGS.filter((b) => {
    const res = PRODUCTION_RESOURCE_BY_BUILDING[b.id];
    if (res && COMMON_RESOURCES.includes(res as ResourceId)) return true;
    if (b.effect?.type === "storage") return true;
    return b.effect?.type === "hangar" && b.effect.category === "defense";
  }).map((b) => b.id);
}

export function colonyMaxLevel(id: string): number {
  return Math.min(findBuilding(id)?.maxLevel ?? COLONY_RULES.maxLevel, COLONY_RULES.maxLevel);
}

export function colonyId(uid: string, slot: number): string {
  return `${uid}-c${slot}`;
}

export function colonyOf(player: Pick<PlayerState, "colonies">, id: string): Colony | undefined {
  return (player.colonies ?? []).find((c) => c.id === id);
}

/** Propriétaire d'une colonie d'après son identifiant (null si ce n'en est pas une). */
export function colonyOwnerUid(id: string): string | null {
  const m = /^(.+)-c(\d+)$/.exec(String(id ?? ""));
  return m ? m[1] : null;
}

/** Vue « planète » d'une colonie pour le combat et l'espionnage : ses
 *  défenses, bâtiments et stock à la place de ceux de la planète mère. */
export function colonyView(player: PlayerState, colony: Colony): PlayerState {
  return { ...player, uid: colony.id, pseudo: `${player.pseudo} — ${colony.name}`, units: colony.defenses, buildings: colony.buildings, resources: colony.resources, posture: undefined, lastDefeatAtMs: colony.lastDefeatAtMs };
}

function emptyResources(): Resources {
  return Object.fromEntries(RESOURCE_LIST.map((r) => [r.id, 0])) as unknown as Resources;
}

/** Niveaux cumulés de la planète mère (v4.9.3 : bâtiments de fin de partie compris). */
export function homeLevels(player: Pick<PlayerState, "buildings">): number {
  // 5.28.1 (C3) : un bâtiment verrouillé (niveau 1 par défaut, jamais construit) ne compte pas.
  return BUILDINGS.reduce((a, b) => a + effectiveBuildingLevel(player.buildings, b.id), 0);
}

export function colonyFoundCost(): Partial<Record<ResourceId, number>> {
  const cost: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) cost[r.id] = r.rarity === "rare" ? COLONY_RULES.foundRareCost : COLONY_RULES.foundCommonCost;
  return cost;
}

/** Prochain emplacement libre et niveaux requis (null si plus d'emplacement). */
export function nextColonySlot(player: Pick<PlayerState, "colonies" | "colonizing">): { slot: number; levels: number } | null {
  const used = new Set([...(player.colonies ?? []).map((c) => c.slot), ...(player.colonizing ? [player.colonizing.slot] : [])]);
  for (let slot = 1; slot <= COLONY_RULES.maxColonies; slot++) {
    if (!used.has(slot)) return { slot, levels: COLONY_RULES.levelsRequired[slot - 1] ?? Infinity };
  }
  return null;
}

/** Lancement du vaisseau colonial, payé par la planète mère. */
export function startColonization(player: PlayerState, nameIn: string, now: number): Colonizing {
  if (player.colonizing) throw new GameActionError("Un vaisseau colonial est déjà en route.");
  const next = nextColonySlot(player);
  if (!next) throw new GameActionError(`Tu as déjà ${COLONY_RULES.maxColonies} colonies.`);
  if (homeLevels(player) < next.levels) throw new GameActionError(`Il faut ${next.levels} niveaux de bâtiments cumulés sur ta planète mère (tu en as ${homeLevels(player)}).`);
  const name = String(nameIn ?? "").trim() || `Colonie ${next.slot}`;
  if (name.length > 30) throw new GameActionError("Le nom d'une colonie fait au plus 30 caractères.");
  // 6.14.110 (AC-5) : dépense comptée (objectif « Dépenser », statistique `spent`).
  spendResources(player, colonyFoundCost(), now, { message: "Ressources insuffisantes pour le vaisseau colonial." });
  player.colonizing = { slot: next.slot, name, endTime: now + COLONY_RULES.foundHours * HOUR };
  return player.colonizing;
}

export function foundColony(uid: string, job: Colonizing, at: number, home?: Buildings): Colony {
  const buildings: Buildings = {};
  for (const id of colonyBuildingIds()) buildings[id] = { level: 1, unlocked: true };
  const resources = emptyResources();
  for (const res of COMMON_RESOURCES) resources[res] = COLONY_RULES.startStock;
  buildings[DEPOSIT_ID] = { level: 1, unlocked: true };
  const id = colonyId(uid, job.slot);
  const colony: Colony = { id, slot: job.slot, name: job.name, foundedAtMs: at, buildings, resources, updatedAtMs: at, building: null, defenses: {}, defenseJob: null, biome: biomeFor(`${id}:${at}`) };
  applyFoundation(colony, home);
  return colony;
}

/** Entrées économiques d'une colonie : technologies, alliance et ascensions de l'empire. */
function economyInput(colony: Colony, player: PlayerState) {
  return {
    buildings: colony.buildings,
    techLevels: player.techLevels,
    resources: colony.resources,
    units: colony.defenses,
    allianceResearch: player.allianceResearch,
    ascensions: player.ascensions,
    productionFactor: (1 + COLONY_RULES.productionBonus) * colonySpecEffects(colony).production,
    // v5.14 : effets propres aux colonies (Gouverneure en poste).
    effectScope: "colonies" as const,
    storageFactor: colonySpecEffects(colony).storage,
    // v5.3 : bonus de l'empire (Intendant, reliques, talents, secteurs, Gelée de la Reine).
    commanders: player.commanders,
    relics: player.relics,
    talents: player.talents,
    territory: player.territory,
    bounties: player.bounties,
  };
}

/** Entrepôt de la colonie (v5.3 : Intendant en poste compris, comme pour la production). */
export function colonyStorage(colony: Colony, player: Pick<PlayerState, "techLevels" | "commanders">): number {
  return storageCapacityOf({ buildings: colony.buildings, techLevels: player.techLevels, resources: colony.resources, commanders: player.commanders, storageFactor: colonySpecEffects(colony).storage, effectScope: "colonies" });
}

/** Production horaire d'une colonie (affichage). */
export function colonyHourlyRates(colony: Colony, player: PlayerState): Partial<Record<ResourceId, number>> {
  const a = advanceResources({ ...economyInput(colony, player), resources: emptyResources() }, 3600);
  const out: Partial<Record<ResourceId, number>> = Object.fromEntries(COMMON_RESOURCES.map((r) => [r, Math.round(a[r] ?? 0)]));
  out[colonyBiome(colony)] = Math.round(colonyDepositPerSecond(colony) * 3600);
  return out;
}

/** Rattrape une colonie jusqu'à `now` : production, construction, défenses. */
export function advanceColony(colony: Colony, player: PlayerState, now: number): NewNotification[] {
  const notes: NewNotification[] = [];
  // v5.10 : colonies fondées avant le rééquilibrage — production rattrapée à l'ancien
  // niveau jusqu'ici, puis extracteurs et entrepôt relevés au niveau de fondation.
  const upgradeOld = !colony.foundation;
  let at = colony.updatedAtMs || now;
  for (let guard = 0; guard < 10 + COLONY_RULES.defenseQueueMax; guard++) {
    const next = Math.min(colony.building?.endTime ?? Infinity, colony.defenseJob?.endTime ?? Infinity);
    const until = Math.min(next, now);
    if (until > at) {
      colony.resources = advanceResources(economyInput(colony, player), (until - at) / 1000, at);
      // v5.1 : gisement du biome (ressource rare, non plafonnée).
      const rare = colonyBiome(colony);
      colony.resources[rare] = (colony.resources[rare] ?? 0) + colonyDepositPerSecond(colony) * ((until - at) / 1000);
      at = until;
    }
    if (next > now) break;
    if (colony.building && colony.building.endTime <= now) {
      const job = colony.building;
      // v5.10 : jamais à la baisse (un chantier lancé avant la fondation relevée).
      colony.buildings[job.id] = { ...(colony.buildings[job.id] ?? { unlocked: true }), level: Math.max(job.level, colony.buildings[job.id]?.level ?? 0) };
      colony.building = null;
      // v5.6 : l'Ingénieure en poste progresse aussi avec les chantiers des colonies.
      grantCommanderXp(player, "engineer", COMMANDER_XP.buildingDone);
      grantCommanderXp(player, "governor", COMMANDER_XP.buildingDone);
      notes.push({ kind: "building", title: "Colonie : construction terminée", message: `${colony.name} : ${colonyBuildingName(colony, job.id)} niveau ${job.level}.`, createdAtMs: now, read: false });
    }
    if (colony.defenseJob && colony.defenseJob.endTime <= now) {
      const job = colony.defenseJob;
      const cur = colony.defenses[job.unitId] ?? { level: player.units[job.unitId]?.level ?? 1, count: 0 };
      colony.defenses[job.unitId] = { level: Math.max(cur.level, player.units[job.unitId]?.level ?? 1), count: cur.count + job.qty };
      colony.defenseJob = null;
      startNextColonyDefense(colony, player, job.endTime);
      notes.push({ kind: "building", title: "Colonie : défenses prêtes", message: `${colony.name} : ${formatInt(job.qty)} ${findUnit(job.unitId)?.name ?? job.unitId}.`, createdAtMs: now, read: false });
    }
  }
  colony.updatedAtMs = now;
  if (upgradeOld) {
    applyFoundation(colony, player.buildings);
    notes.push({ kind: "building", title: "Colonie modernisée", message: `${colony.name} : ses extracteurs et son entrepôt ont été relevés au niveau de fondation, et les colonies produisent désormais 50 % de plus.`, createdAtMs: now, read: false, link: "/game/colonies" });
  }
  return notes;
}

/** Rattrape la colonisation en cours et toutes les colonies. */
export function advanceColonies(player: PlayerState, now: number): NewNotification[] {
  const notes: NewNotification[] = [];
  if (player.colonizing && player.colonizing.endTime <= now) {
    const job = player.colonizing;
    player.colonies = [...(player.colonies ?? []), foundColony(player.uid, job, job.endTime, player.buildings)];
    player.colonizing = null;
    notes.push({ kind: "building", title: "Nouvelle colonie !", message: `${job.name} est fondée : construis ses extracteurs et envoie-lui des ressources.`, createdAtMs: now, read: false });
  }
  for (const c of player.colonies ?? []) {
    notes.push(...advanceColony(c, player, now));
    // 5.33 : route logistique, après la production de la colonie (la planète mère est déjà à jour).
    runColonyRoute(c, player, now);
  }
  return notes;
}

function payFrom(resources: Resources, cost: Partial<Record<string, number>>, what: string) {
  for (const [res, n] of Object.entries(cost)) {
    if ((resources[res as ResourceId] ?? 0) < (n ?? 0)) throw new GameActionError(`Le stock de la colonie ne suffit pas pour ${what}.`);
  }
  for (const [res, n] of Object.entries(cost)) resources[res as ResourceId] -= n ?? 0;
}

export function colonyUpgradeCost(player: Pick<PlayerState, "bonuses">, buildingId: string, nextLevel: number): Partial<Record<ResourceId, number>> {
  if (buildingId === DEPOSIT_ID) {
    // v5.1 : gisement, payé en ressources communes seulement.
    const base = colonyUpgradeCost(player, "extracteur_ferraille", nextLevel);
    const scrap = Math.ceil((base.scrap ?? 0) * DEPOSIT_RULES.costFactor);
    return { scrap, energy: Math.ceil((base.energy ?? 0) * DEPOSIT_RULES.costFactor), nano: Math.ceil(scrap / 2), data: Math.ceil(scrap / 4) };
  }
  const def = findBuilding(buildingId);
  if (!def) return {};
  const base = applyBuildingDiscount(getBuildingUpgradeCost(def, nextLevel), playerBuildingDiscount(player));
  return Object.fromEntries(Object.entries(base).map(([r, n]) => [r, Math.ceil((n ?? 0) * COLONY_RULES.costFactor)]));
}

export function colonyUpgradeSeconds(player: PlayerState, buildingId: string, nextLevel: number, now: number): number {
  if (buildingId === DEPOSIT_ID) return Math.round(colonyUpgradeSeconds(player, "extracteur_ferraille", nextLevel, now) * DEPOSIT_RULES.timeFactor);
  const def = findBuilding(buildingId);
  return def ? Math.round(getBuildingUpgradeTime(def, nextLevel) * playerBuildTimeFactor(player, now)) : 0;
}

export function upgradeColonyBuilding(player: PlayerState, colonyIdIn: string, buildingId: string, now: number): ColonyBuildingJob {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  if (buildingId !== DEPOSIT_ID && !colonyBuildingIds().includes(buildingId)) throw new GameActionError("Ce bâtiment ne se construit pas sur une colonie.");
  if (colony.building) throw new GameActionError("Une construction est déjà en cours sur cette colonie.");
  const level = buildingId === DEPOSIT_ID ? depositLevel(colony) : (colony.buildings[buildingId]?.level ?? 0);
  if (level >= colonyMaxLevel(buildingId)) throw new GameActionError(`Niveau maximum d'une colonie atteint (${colonyMaxLevel(buildingId)}).`);
  const paid = colonyUpgradeCost(player, buildingId, level + 1);
  payFrom(colony.resources, paid, "cette construction");
  colony.building = { id: buildingId, level: level + 1, endTime: now + colonyUpgradeSeconds(player, buildingId, level + 1, now) * 1000, startedAtMs: now, paid };
  return colony.building;
}

/** Place occupée et capacité du hangar de défense d'une colonie. 5.27.2 : la tech « Extension des
 *  hangars » et les effets `hangarCapacity` (portée colonies) s'appliquent aussi (docs/proposals/cale-seche.md, C5). */
/** 6.4 : places déjà promises par le lot en construction et la file d'attente. */
export function colonyDefensePendingSpace(colony: Pick<Colony, "defenseJob" | "defenseQueue">): number {
  const jobs = [...(colony.defenseJob ? [colony.defenseJob] : []), ...(colony.defenseQueue ?? [])];
  return jobs.reduce((a, j) => a + (findUnit(j.unitId)?.hangarSpace ?? 1) * j.qty, 0);
}

/** 6.4 : démarre le premier lot en attente à `at` (fin du lot précédent, ou maintenant après une annulation). */
export function startNextColonyDefense(colony: Colony, player: Pick<PlayerState, "techLevels"> & Partial<PlayerState>, at: number): void {
  if (colony.defenseJob || !colony.defenseQueue?.length) return;
  const next = colony.defenseQueue.shift()!;
  colony.defenseJob = { ...next, startedAtMs: at, endTime: at + colonyDefenseSeconds(player, next.unitId, next.qty, colony) * 1000 };
  if (colony.defenseQueue.length === 0) delete colony.defenseQueue;
}

export function colonyDefenseHangar(colony: Colony, player?: Parameters<typeof playerUnitCapacity>[0], now: number = Date.now()): { used: number; capacity: number } {
  const used = Object.entries(colony.defenses).reduce((a, [id, s]) => a + (findUnit(id)?.hangarSpace ?? 1) * s.count, 0);
  const base = player ? playerUnitCapacity(player, "defense", now, "colonies", colony.buildings) : getUnitCapacity(colony.buildings, "defense");
  return { used, capacity: Math.floor(base * colonySpecEffects(colony).hangar) };
}

/** Durée de construction (secondes) d'un lot de défenses sur une colonie. */
export function colonyDefenseSeconds(player: Pick<PlayerState, "techLevels"> & Partial<Pick<PlayerState, "commanders" | "relics" | "ascensions" | "talents" | "territory">>, unitId: string, qty: number, colony?: Pick<Colony, "spec">): number {
  const unit = findUnit(unitId);
  return unit ? getUnitBuildTime(unit, player.techLevels, player) * Math.max(0, qty) * (colony ? colonySpecEffects(colony).defenseTime : 1) : 0;
}

export function buildColonyDefense(player: PlayerState, colonyIdIn: string, unitId: string, qtyIn: number, now: number): ColonyDefenseJob {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const unit = findUnit(unitId);
  if (!unit || unit.category !== "defense") throw new GameActionError("Seules les défenses se construisent sur une colonie.");
  if ((player.units[unitId]?.level ?? 0) <= 0) throw new GameActionError("Débloque d'abord cette défense sur ta planète mère.");
  const qty = Math.floor(Number(qtyIn));
  if (!(qty > 0)) throw new GameActionError("Quantité invalide.");
  // 6.4 : un lot en construction, jusqu'à COLONY_RULES.defenseQueueMax en attente (payés d'avance).
  if (colony.defenseJob && (colony.defenseQueue?.length ?? 0) >= COLONY_RULES.defenseQueueMax) throw new GameActionError(`File pleine : ${COLONY_RULES.defenseQueueMax} lots en attente au plus.`);
  const { used, capacity } = colonyDefenseHangar(colony, player, now);
  if (used + colonyDefensePendingSpace(colony) + qty * unit.hangarSpace > capacity) throw new GameActionError("Capacité du hangar de défense de la colonie insuffisante.");
  const each = playerUnitCost(unit, player, now);
  const paid = { scrap: each.scrap * qty, energy: each.energy * qty };
  payFrom(colony.resources, paid, "ces défenses");
  if (colony.defenseJob) {
    const waiting: ColonyDefenseJob = { unitId, qty, endTime: 0, paid };
    colony.defenseQueue = [...(colony.defenseQueue ?? []), waiting];
    return waiting;
  }
  colony.defenseJob = { unitId, qty, endTime: now + colonyDefenseSeconds(player, unitId, qty, colony) * 1000, startedAtMs: now, paid };
  return colony.defenseJob;
}

export function renameColony(player: PlayerState, colonyIdIn: string, nameIn: string): void {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const name = String(nameIn ?? "").trim();
  if (name.length < 2 || name.length > 30) throw new GameActionError("Le nom d'une colonie fait entre 2 et 30 caractères.");
  colony.name = name;
}

/* ---------- transport (flottes de la planète mère) ---------- */

export type TransportDirection = "deliver" | "collect";

export interface TransportState {
  direction: TransportDirection;
  colonyId: string;
  /** Livraison : chargement au départ. Collecte : quantités demandées (vide = au maximum). */
  cargo: Partial<Record<ResourceId, number>>;
  /** v5.1 : contrat entre joueurs livré par cette flotte. */
  contractId?: string;
}

/** Montants valides d'un chargement, plafonnés à la soute. */
export function parseCargo(raw: unknown, capacity: number): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  let total = 0;
  for (const r of RESOURCE_LIST) {
    const n = Math.floor(Number((raw as Record<string, unknown>)?.[r.id]));
    if (!(n > 0)) continue;
    out[r.id] = n;
    total += n;
  }
  if (total > capacity) throw new GameActionError(`La soute ne contient que ${formatInt(capacity)} ressources.`);
  return out;
}

/** Collecte à l'arrivée : prend dans le stock de la colonie, dans la limite
 *  de la soute (au prorata si rien n'est précisé). */
export function collectFromColony(colony: Colony, requested: Partial<Record<ResourceId, number>>, capacity: number): Partial<Record<ResourceId, number>> {
  const wanted: Partial<Record<ResourceId, number>> = Object.keys(requested).length
    ? requested
    : Object.fromEntries(RESOURCE_LIST.map((r) => [r.id, Math.floor(colony.resources[r.id] ?? 0)]));
  const available = Object.fromEntries(Object.entries(wanted).map(([r, n]) => [r, Math.max(0, Math.min(n ?? 0, Math.floor(colony.resources[r as ResourceId] ?? 0)))])) as Partial<Record<ResourceId, number>>;
  const total = Object.values(available).reduce((a: number, b) => a + (b ?? 0), 0);
  const ratio = total > capacity ? capacity / total : 1;
  const taken: Partial<Record<ResourceId, number>> = {};
  for (const [r, n] of Object.entries(available) as [ResourceId, number][]) {
    const k = Math.floor(n * ratio);
    if (k > 0) {
      taken[r] = k;
      colony.resources[r] -= k;
    }
  }
  return taken;
}

/** Livraison à l'arrivée : le stock de la colonie reçoit tout (comme une livraison, sans plafond). */
export function deliverToColony(colony: Colony, cargo: Partial<Record<ResourceId, number>>): void {
  for (const [r, n] of Object.entries(cargo) as [ResourceId, number][]) colony.resources[r] = (colony.resources[r] ?? 0) + (n ?? 0);
}
