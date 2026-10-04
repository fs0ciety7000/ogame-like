import { GameActionError } from "@/game/errors";
import type { EffectGrant, EffectStat } from "@/game/effects";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Reliques (v4.0) : objets rares trouvés en expédition, sur la proie
   d'élite et contre le Léviathan. Trois emplacements sur la base (un
   quatrième à la première ascension). Trois reliques identiques fusionnent
   en une relique plus rare ; une relique de trop se recycle en Ambre.
===================================================== */

export type RelicRarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type RelicEffect =
  | "attack"
  | "defense"
  | "build_time"
  | "research_time"
  | "repair"
  | "cargo"
  | "spy"
  | "production_scrap"
  | "production_energy"
  | "production_nano"
  | "production_data"
  | "production_all"
  | "aegis"
  | "boss_damage";

export const RARITIES: { id: RelicRarity; label: string; pct: number; weight: number; recycle: number; color: string }[] = [
  { id: "common", label: "Commune", pct: 0.03, weight: 60, recycle: 5, color: "#cbd5e1" },
  { id: "rare", label: "Rare", pct: 0.06, weight: 28, recycle: 15, color: "#4be8ff" },
  { id: "epic", label: "Épique", pct: 0.1, weight: 10, recycle: 40, color: "#a78bfa" },
  { id: "legendary", label: "Légendaire", pct: 0.15, weight: 2, recycle: 100, color: "#ffd86b" },
  // v5.1 : une seule par saison sur tout le serveur, jamais tirée au hasard.
  { id: "mythic", label: "Mythique", pct: 0.2, weight: 0, recycle: 0, color: "#ff5df0" },
];

export interface RelicTemplate {
  id: string;
  name: string;
  effect: RelicEffect;
  lore: string;
  /** Réservée à la rareté légendaire (effet unique). */
  legendaryOnly?: boolean;
  /** v5.1 : relique mythique (une par saison, décernée au n°1 d'un boss). */
  mythicOnly?: boolean;
  /** v5.9 : image (défaut : /assets/relics/<id>.webp). */
  image?: string;
  /** v5.9 : retirée des tirages et de la rotation des mythiques (les exemplaires déjà trouvés gardent leur effet). */
  disabled?: boolean;
}

export const DEFAULT_RELICS: RelicTemplate[] = [
  { id: "engrenage_varan", name: "Engrenage de Varan", effect: "attack", lore: "Arraché au poste de tir d'un croiseur de la Confrérie." },
  { id: "ecaille_leviathan", name: "Écaille de Léviathan", effect: "defense", lore: "Une plaque de carapace qui encaisse encore les tirs." },
  { id: "noyau_forge", name: "Noyau de forge", effect: "build_time", lore: "Il chauffe sans jamais s'éteindre." },
  { id: "codex_aube", name: "Codex de l'Aube", effect: "research_time", lore: "Des équations interdites, recopiées à la main." },
  { id: "matrice_reparation", name: "Matrice de réparation", effect: "repair", lore: "Des nanites qui referment les coques déchirées." },
  { id: "soute_pliee", name: "Soute pliée", effect: "cargo", lore: "Plus grande dedans que dehors." },
  { id: "oeil_vesper", name: "Œil de Vesper", effect: "spy", lore: "Une lentille du Chœur qui voit à travers les blindages." },
  { id: "racine_ferraille", name: "Racine de ferraille", effect: "production_scrap", lore: "Un organisme qui digère le métal et en recrache le double." },
  { id: "cellule_stellaire", name: "Cellule stellaire", effect: "production_energy", lore: "Un fragment d'étoile en bouteille." },
  { id: "essaim_nanites", name: "Essaim de nanites", effect: "production_nano", lore: "Des milliards d'ouvrières qui ne dorment jamais." },
  { id: "cristal_memoriel", name: "Cristal mémoriel", effect: "production_data", lore: "Il se souvient de civilisations disparues." },
  { id: "couronne_essaim", name: "Couronne de l'Essaim", effect: "production_all", lore: "Portée jadis par la Reine des Kesh'Vaar.", legendaryOnly: true },
  { id: "egide_reine", name: "Égide de la Reine", effect: "aegis", lore: "Chaque semaine, la première défaite n'est pas pillée.", legendaryOnly: true },
  // v5.1 : reliques mythiques, une par saison (le modèle tourne d'une saison à l'autre).
  { id: "coeur_leviathan", name: "Cœur du Léviathan", effect: "boss_damage", lore: "Il bat encore, et sa colère guide tes salves contre les colosses.", mythicOnly: true },
  { id: "couronne_ambre", name: "Couronne d'ambre", effect: "production_all", lore: "Taillée dans l'ambre de la première Reine, elle fait fructifier l'empire.", mythicOnly: true },
  { id: "oeil_neant", name: "Œil du Néant", effect: "attack", lore: "Ce qu'il regarde cesse d'exister.", mythicOnly: true },
  { id: "egide_stellaire", name: "Égide stellaire", effect: "defense", lore: "Un bouclier forgé au cœur d'une étoile mourante.", mythicOnly: true },
];

/** Registre courant (v5.9 : remplacé par le contenu de l'administration). */
export const RELICS: RelicTemplate[] = DEFAULT_RELICS.map((t) => ({ ...t }));

/** Valeurs par défaut des raretés (bonus, poids de tirage, recyclage). */
export const DEFAULT_RARITY_VALUES: Record<RelicRarity, { pct: number; weight: number; recycle: number }> = Object.fromEntries(
  RARITIES.map((r) => [r.id, { pct: r.pct, weight: r.weight, recycle: r.recycle }]),
) as Record<RelicRarity, { pct: number; weight: number; recycle: number }>;

/** v5.9 : réglages des reliques modifiables dans l'administration. */
export interface RelicSettings {
  slots: number;
  extraSlotAscensions: number;
  maxItems: number;
  fuseCount: number;
  expeditionBase: number;
  expeditionPerHour: number;
  expeditionMax: number;
  rarities: Record<RelicRarity, { pct: number; weight: number; recycle: number }>;
  /** v5.14 : tables de butin des combats (loot.ts), par source. */
  loot?: Partial<Record<string, Record<string, unknown>>>;
}

export function defaultRelicSettings(): RelicSettings {
  return {
    slots: 3,
    extraSlotAscensions: 1,
    maxItems: 30,
    fuseCount: 3,
    expeditionBase: 0.05,
    expeditionPerHour: 0.1 / 6,
    expeditionMax: 0.15,
    rarities: structuredClone(DEFAULT_RARITY_VALUES),
  };
}

/** Applique les reliques et leurs réglages (appelé par applyGameContent). */
export function setRelics(defs: RelicTemplate[], settings: RelicSettings): void {
  // Les modèles du code restent connus (objets déjà trouvés) même s'ils ont été retirés de la liste.
  const byId = new Map<string, RelicTemplate>(DEFAULT_RELICS.map((t) => [t.id, { ...t, disabled: true }]));
  for (const t of defs) byId.set(t.id, { ...t });
  RELICS.splice(0, RELICS.length, ...byId.values());
  const { rarities, loot: _loot, ...rules } = settings;
  void _loot;
  Object.assign(RELIC_RULES, rules);
  for (const r of RARITIES) {
    const v = rarities?.[r.id];
    if (!v) continue;
    r.pct = Number(v.pct) || 0;
    r.weight = r.id === "mythic" ? 0 : Math.max(0, Number(v.weight) || 0);
    r.recycle = Math.max(0, Math.round(Number(v.recycle) || 0));
  }
}

/** Image d'une relique (celle choisie dans l'administration, sinon celle du code). */
export function relicImage(templateId: string): string {
  return findTemplate(templateId)?.image || `/assets/relics/${templateId}.webp`;
}

/** v5.1 : reliques mythiques actives — modèle et source (Léviathan les mois impairs, boss de saison les mois pairs). */
export function mythicTemplates(): RelicTemplate[] {
  const active = RELICS.filter((t) => t.mythicOnly && !t.disabled);
  return active.length > 0 ? active : DEFAULT_RELICS.filter((t) => t.mythicOnly);
}

export function mythicFor(seasonId: string): { template: RelicTemplate; source: "leviathan" | "seasonboss" } {
  const [y, m] = seasonId.split("-").map(Number);
  const index = (Number.isFinite(y) ? y : 0) * 12 + (Number.isFinite(m) ? m - 1 : 0);
  const pool = mythicTemplates();
  return { template: pool[index % pool.length], source: (Number.isFinite(m) ? m : 1) % 2 === 1 ? "leviathan" : "seasonboss" };
}

const RELIC_EFFECT_IDS: RelicEffect[] = ["attack", "defense", "build_time", "research_time", "repair", "cargo", "spy", "production_scrap", "production_energy", "production_nano", "production_data", "production_all", "aegis", "boss_damage"];

/** Libellés des effets (administration). */
export const RELIC_EFFECT_LABELS: Record<RelicEffect, string> = {
  attack: "Attaque",
  defense: "Défense",
  build_time: "Temps de construction",
  research_time: "Temps de recherche",
  repair: "Réparation après combat",
  cargo: "Soute (butin, transports, livraisons)",
  spy: "Niveau d'espionnage",
  production_scrap: "Production de ferraille",
  production_energy: "Production d'énergie",
  production_nano: "Production de nanocomposants",
  production_data: "Production de données anciennes",
  production_all: "Toute la production",
  aegis: "Égide (1re défaite de la semaine non pillée)",
  boss_damage: "Dégâts contre les boss",
};

/** Validation des reliques et de leurs réglages (administration). */
export function validateRelics(defs: RelicTemplate[], settings: RelicSettings): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const t of defs) {
    const label = `Relique ${t.name || t.id}`;
    if (!/^[a-z0-9_]+$/.test(t.id ?? "")) errors.push(`${label} : identifiant invalide (minuscules, chiffres, _).`);
    if (ids.has(t.id)) errors.push(`${label} : identifiant en double.`);
    ids.add(t.id);
    if (!t.name?.trim()) errors.push(`${label} : nom manquant.`);
    if (!RELIC_EFFECT_IDS.includes(t.effect)) errors.push(`${label} : effet « ${t.effect} » inconnu.`);
    if (t.legendaryOnly && t.mythicOnly) errors.push(`${label} : réservée aux légendaires OU aux mythiques, pas les deux.`);
  }
  if (!defs.some((t) => !t.disabled && !t.legendaryOnly && !t.mythicOnly)) errors.push("Reliques : il faut au moins une relique active ordinaire (tirable à toutes les raretés).");
  const int = (v: number, min: number) => Number.isInteger(v) && v >= min;
  if (!int(settings.slots, 1)) errors.push("Reliques : emplacements ≥ 1.");
  if (!int(settings.maxItems, 1)) errors.push("Reliques : inventaire ≥ 1.");
  if (!int(settings.fuseCount, 2)) errors.push("Reliques : fusion ≥ 2 reliques.");
  if (!(settings.expeditionBase >= 0 && settings.expeditionBase <= 1)) errors.push("Reliques : chance en expédition entre 0 et 1.");
  if (!(settings.expeditionMax >= 0 && settings.expeditionMax <= 1)) errors.push("Reliques : plafond en expédition entre 0 et 1.");
  if (!(settings.expeditionPerHour >= 0)) errors.push("Reliques : chance par heure ≥ 0.");
  for (const r of RARITIES) {
    const v = settings.rarities?.[r.id];
    if (!v) continue;
    if (!(v.pct >= 0 && v.pct <= 1)) errors.push(`Reliques, ${r.label} : bonus entre 0 et 1 (0,06 = 6 %).`);
    if (r.id !== "mythic" && !(v.weight >= 0)) errors.push(`Reliques, ${r.label} : poids de tirage ≥ 0.`);
  }
  if (RARITIES.filter((r) => r.id !== "mythic").every((r) => !(settings.rarities?.[r.id]?.weight > 0))) errors.push("Reliques : au moins une rareté doit avoir un poids de tirage.");
  return errors;
}

/** Relique mythique de la saison pour le vainqueur. */
export function mythicRelic(seasonId: string, now: number, random: () => number = Math.random): RelicItem {
  return { id: newId(now, random), template: mythicFor(seasonId).template.id, rarity: "mythic", foundAtMs: now, source: `mythic:${seasonId}` };
}

export const RELIC_RULES = {
  slots: 3,
  /** Emplacement supplémentaire à partir de cette ascension. */
  extraSlotAscensions: 1,
  maxItems: 30,
  fuseCount: 3,
  /** Expédition : 5 % à 2 h, jusqu'à 15 % à 8 h. */
  expeditionBase: 0.05,
  expeditionPerHour: 0.1 / 6,
  /** Plafond de la chance en expédition. */
  expeditionMax: 0.15,
};

export interface RelicItem {
  id: string;
  template: string;
  rarity: RelicRarity;
  foundAtMs: number;
  source: string;
}

export interface RelicsState {
  items: RelicItem[];
  /** Identifiants des reliques équipées (null : emplacement libre). */
  slots: (string | null)[];
  /** Égide de la Reine : semaine où elle a déjà protégé. */
  aegisWeek: string;
}

export function relicsState(player: Pick<PlayerState, "relics">): RelicsState {
  const raw = (player.relics ?? {}) as Partial<RelicsState>;
  const items = (Array.isArray(raw.items) ? raw.items : []).filter((r) => r && findTemplate(r.template) && RARITIES.some((x) => x.id === r.rarity));
  const ids = new Set(items.map((r) => r.id));
  const slots = (Array.isArray(raw.slots) ? raw.slots : []).map((s) => (s && ids.has(s) ? s : null));
  return { items, slots, aegisWeek: String(raw.aegisWeek ?? "") };
}

export function findTemplate(id: unknown): RelicTemplate | undefined {
  return RELICS.find((t) => t.id === id);
}

export function rarityInfo(r: RelicRarity) {
  return RARITIES.find((x) => x.id === r) ?? RARITIES[0];
}

export function relicSlots(player: Pick<PlayerState, "ascensions">): number {
  return RELIC_RULES.slots + ((player.ascensions ?? 0) >= RELIC_RULES.extraSlotAscensions ? 1 : 0);
}

export function equippedRelics(player: Pick<PlayerState, "relics" | "ascensions">): RelicItem[] {
  const st = relicsState(player);
  const n = relicSlots(player);
  return st.slots
    .slice(0, n)
    .map((id) => st.items.find((r) => r.id === id))
    .filter((r): r is RelicItem => !!r);
}

/** Bonus d'une relique (fraction). */
export function relicBonus(item: Pick<RelicItem, "rarity">): number {
  return rarityInfo(item.rarity).pct;
}

/** « Écaille de Léviathan (rare) ». */
export function relicLabel(item: Pick<RelicItem, "template" | "rarity">): string {
  return `${findTemplate(item.template)?.name ?? "Relique"} (${rarityInfo(item.rarity).label.toLowerCase()})`;
}

export function describeRelic(item: Pick<RelicItem, "template" | "rarity">): string {
  const t = findTemplate(item.template);
  const pct = Math.round(relicBonus(item) * 100);
  switch (t?.effect) {
    case "attack":
      return `+${pct} % d'attaque`;
    case "defense":
      return `+${pct} % de défense`;
    case "build_time":
      return `−${pct} % de temps de construction`;
    case "research_time":
      return `−${pct} % de temps de recherche`;
    case "repair":
      return `+${pct} % de vaisseaux réparés après un combat`;
    case "cargo":
      return `+${pct} % de soute`;
    case "spy":
      return `+${(pct / 10).toFixed(1).replace(".", ",")} niveau d'espionnage`;
    case "production_scrap":
      return `+${pct} % de ferraille`;
    case "production_energy":
      return `+${pct} % d'énergie`;
    case "production_nano":
      return `+${pct} % de nanocomposants`;
    case "production_data":
      return `+${pct} % de données anciennes`;
    case "production_all":
      return `+${pct} % de toute la production`;
    case "aegis":
      return "Chaque semaine, ta première défaite n'est pas pillée";
    case "boss_damage":
      return `+${pct} % de dégâts contre le Léviathan et les boss`;
    default:
      return "";
  }
}

/** v5.14 : grandeur du circuit d'effets de chaque effet de relique (échelle :
 *  bonus de rareté × scale). « aegis » reste un effet spécial (pas de grandeur). */
export const RELIC_EFFECT_STAT: Partial<Record<RelicEffect, { stat: EffectStat; target?: ResourceId; scale?: number }>> = {
  attack: { stat: "attack" },
  defense: { stat: "defense" },
  build_time: { stat: "buildTime" },
  research_time: { stat: "researchTime" },
  repair: { stat: "repair" },
  cargo: { stat: "cargo" },
  spy: { stat: "spyLevel", scale: 10 },
  production_all: { stat: "productionAll" },
  boss_damage: { stat: "bossDamage" },
  production_scrap: { stat: "production", target: "scrap" },
  production_energy: { stat: "production", target: "energy" },
  production_nano: { stat: "production", target: "nano" },
  production_data: { stat: "production", target: "data" },
};

/** v5.14 : effets des reliques équipées. */
export function relicEffects(player: Pick<PlayerState, "relics" | "ascensions">): EffectGrant[] {
  const out: EffectGrant[] = [];
  for (const item of equippedRelics(player)) {
    const t = findTemplate(item.template);
    const m = t ? RELIC_EFFECT_STAT[t.effect] : undefined;
    if (!m) continue;
    out.push({ stat: m.stat, target: m.target, value: relicBonus(item) * (m.scale ?? 1), layer: "empire", source: { kind: "relic", id: item.id, label: relicLabel(item) } });
  }
  return out;
}

export const PRODUCTION_EFFECT: Partial<Record<RelicEffect, ResourceId>> = {
  production_scrap: "scrap",
  production_energy: "energy",
  production_nano: "nano",
  production_data: "data",
};

function newId(now: number, random: () => number): string {
  return `${now.toString(36)}${Math.floor(random() * 1e9).toString(36)}`;
}

/** Tirage d'une relique (rareté minimale facultative). */
export function rollRelic(source: string, now: number, random: () => number = Math.random, minRarity: RelicRarity = "common"): RelicItem {
  const order = RARITIES.map((r) => r.id);
  // Jamais de mythique au tirage (décernée une fois par saison).
  const pool = RARITIES.filter((r) => r.id !== "mythic" && order.indexOf(r.id) >= order.indexOf(minRarity));
  const total = pool.reduce((a, r) => a + r.weight, 0);
  let pick = random() * total;
  let rarity = pool[pool.length - 1].id;
  for (const r of pool) {
    pick -= r.weight;
    if (pick < 0) {
      rarity = r.id;
      break;
    }
  }
  const templates = RELICS.filter((t) => !t.disabled && !t.mythicOnly && (!t.legendaryOnly || rarity === "legendary"));
  const template = templates[Math.floor(random() * templates.length) % templates.length];
  return { id: newId(now, random), template: template.id, rarity, foundAtMs: now, source };
}

/** Ajoute une relique (refusée si l'inventaire est plein). */
export function addRelic(player: PlayerState, item: RelicItem): boolean {
  const st = relicsState(player);
  if (st.items.length >= RELIC_RULES.maxItems) return false;
  st.items.push(item);
  player.relics = st;
  return true;
}

/** v5.1 : remet la mythique de la saison au n°1 du boss qui la porte, une seule fois
 *  par saison (`given` : saison → uid). Elle passe même si l'inventaire est plein. */
export function grantMythicRelic(
  player: PlayerState,
  source: "leviathan" | "seasonboss",
  now: number,
  given: Record<string, string>,
  random: () => number = Math.random,
): { given: Record<string, string>; name: string } | null {
  const d = new Date(now);
  const seasonId = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const def = mythicFor(seasonId);
  if (def.source !== source || given[seasonId]) return null;
  const st = relicsState(player);
  st.items.push(mythicRelic(seasonId, now, random));
  player.relics = st;
  return { given: { ...given, [seasonId]: player.uid }, name: def.template.name };
}

export function expeditionRelicChance(hours: number): number {
  return Math.min(RELIC_RULES.expeditionMax, RELIC_RULES.expeditionBase + Math.max(0, hours - 2) * RELIC_RULES.expeditionPerHour);
}

export function equipRelic(player: PlayerState, slotIn: unknown, relicId: unknown): void {
  const st = relicsState(player);
  const n = relicSlots(player);
  const slot = Math.floor(Number(slotIn));
  if (!(slot >= 0 && slot < n)) throw new GameActionError("Emplacement invalide.");
  while (st.slots.length < n) st.slots.push(null);
  if (relicId === null || relicId === "") {
    st.slots[slot] = null;
  } else {
    const item = st.items.find((r) => r.id === relicId);
    if (!item) throw new GameActionError("Relique introuvable.");
    const t = findTemplate(item.template);
    // Une seule relique d'un même modèle équipée à la fois.
    const other = st.slots.findIndex((id, i) => i !== slot && id && st.items.find((r) => r.id === id)?.template === item.template);
    if (other >= 0) throw new GameActionError(`${t?.name ?? "Cette relique"} est déjà équipée.`);
    for (let i = 0; i < st.slots.length; i++) if (st.slots[i] === item.id) st.slots[i] = null;
    st.slots[slot] = item.id;
  }
  player.relics = st;
}

/** Fusion : 3 reliques du même modèle et de la même rareté (hors légendaire). */
export function fuseRelics(player: PlayerState, template: unknown, rarity: unknown, now: number, random: () => number = Math.random): RelicItem {
  const st = relicsState(player);
  const order = RARITIES.map((r) => r.id);
  const idx = order.indexOf(rarity as RelicRarity);
  if (idx < 0 || idx >= order.length - 1 || order[idx + 1] === "mythic") throw new GameActionError("Ces reliques ne peuvent plus fusionner.");
  const equipped = new Set(st.slots.filter(Boolean));
  const same = st.items.filter((r) => r.template === template && r.rarity === rarity && !equipped.has(r.id));
  if (same.length < RELIC_RULES.fuseCount) throw new GameActionError(`Il faut ${RELIC_RULES.fuseCount} reliques identiques non équipées.`);
  const used = new Set(same.slice(0, RELIC_RULES.fuseCount).map((r) => r.id));
  const fused: RelicItem = { id: newId(now, random), template: String(template), rarity: order[idx + 1], foundAtMs: now, source: "fusion" };
  st.items = [...st.items.filter((r) => !used.has(r.id)), fused];
  player.relics = st;
  return fused;
}

/** Recyclage en Ambre (relique non équipée). Renvoie l'Ambre gagnée. */
export function recycleRelic(player: PlayerState, relicId: unknown): { item: RelicItem; amber: number } {
  const st = relicsState(player);
  const item = st.items.find((r) => r.id === relicId);
  if (!item) throw new GameActionError("Relique introuvable.");
  if (st.slots.includes(item.id)) throw new GameActionError("Retire d'abord cette relique de son emplacement.");
  if (item.rarity === "mythic") throw new GameActionError("Une relique mythique ne se recycle pas.");
  st.items = st.items.filter((r) => r.id !== item.id);
  player.relics = st;
  return { item, amber: rarityInfo(item.rarity).recycle };
}

/** Semaine UTC (lundi) de l'Égide. */
export function aegisWeek(now: number): string {
  const DAY = 86_400_000;
  const day = new Date(now).getUTCDay();
  const midnight = Math.floor(now / DAY) * DAY;
  return new Date(midnight - ((day + 6) % 7) * DAY).toISOString().slice(0, 10);
}

/** Égide de la Reine équipée et pas encore utilisée cette semaine : la consomme. */
export function consumeAegis(player: PlayerState, now: number): boolean {
  if (!equippedRelics(player).some((r) => findTemplate(r.template)?.effect === "aegis")) return false;
  const st = relicsState(player);
  const week = aegisWeek(now);
  if (st.aegisWeek === week) return false;
  st.aegisWeek = week;
  player.relics = st;
  return true;
}
