import { BUILDINGS, DOCK_TIERS, effectiveBuildingLevel, findBuilding, type BuildingDef } from "@/game/buildings";
import type { EffectGrant } from "@/game/effects";
import { ECONOMY_RULES } from "@/game/economy";
import { GameActionError } from "@/game/errors";
import { formatDecimal, formatHours, formatPct } from "@/game/format";
import { UNIT_CLASS_LABELS, type UnitClass } from "@/game/unitClasses";
import type { Buildings, PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   6.14.142 (PB-L1, docs/proposals/paliers-batiments.md, option D) : paliers des
   bâtiments de système.

   Règle n° 4 réécrite (GDD §5.4) : un bâtiment **de système** (une capacité ou un
   service) gagne un effet nouveau à chaque palier — choix (5), confort (10),
   spécialisation (15), signature (20) — ; un bâtiment **de courbe** (production,
   bouclier, capsules) n'a que des jalons (image, succès, Codex).

   Ce module porte le moteur commun : niveaux réglables (groupe `buildingTiers`
   du registre), palier atteint (niveau **effectif** : un bâtiment verrouillé n'a
   aucun palier), choix du joueur (`buildingChoices`, un changement gratuit par
   `choiceCooldownHours`, le premier sans délai), source « bâtiment » du circuit
   d'effets, et les lecteurs de chaque effet (entrepôt : PB-L2 ; Atelier : PB-L3).
   Les familles visent les bâtiments par leur effet (`storage`, `repair`), comme
   `dockLevel`, jamais par leur identifiant (contenu personnalisé). Les hangars
   (PB-L4) s'ajouteront par une famille de plus.

   Invariant I46 (GDD §4) : un effet de palier vient du niveau effectif et du choix
   du joueur, passe par le circuit d'effets ou un lecteur de ce module, reste sous
   les plafonds ; un choix change au plus une fois par `choiceCooldownHours` ; aucun
   changement de choix ni de réglage ne détruit d'unité ni de ressource.

   Initialisation : l'objet de règles est littéral (aucune constante importée lue
   au chargement, CLAUDE.md « Initialisation des modules »).
===================================================== */

export const BUILDING_TIER_RULES = {
  /** Niveaux des paliers de l'entrepôt : choix, confort, spécialisation, signature. */
  storageLevels: [5, 10, 15, 20],
  /** Niveaux des paliers de l'Atelier. Le 1er (Cale sèche ouverte) suit le prérequis de la Cale sèche quand elle en a un. */
  repairLevels: [5, 10, 15, 20],
  /** Fonderie quantique : niveaux qui ouvrent un chantier de bâtiment de plus (ancien `BUILD_SLOT_BONUS_LEVELS`). */
  foundrySlotLevels: [5, 10],
  /** Délai entre deux changements d'un même choix (le premier choix est libre). */
  choiceCooldownHours: 24,
  /** Entrepôt 5 : heures d'abri en plus pour la ressource prioritaire. */
  storagePriorityShelterHours: 4,
  /** Entrepôt 10 : heures de production gardées en tampon quand l'entrepôt est plein (0 : pas de tampon). */
  storageBufferHours: 2,
  /** Entrepôt 15, Négoce : points de taxe du comptoir en moins (0,02 = −2 points). */
  storageTradeTaxCut: 0.02,
  /** Entrepôt 15, Convoi : soute des flottes en plus (0,1 = +10 %, circuit d'effets). */
  storageConvoyCargo: 0.1,
  /** Entrepôt 20 : heures d'abri en plus pour les 4 ressources communes. */
  storageOrbitalShelterHours: 4,
  /** Atelier 10 : un lot dont la réparation restante dure au plus ceci rentre aussitôt (s). */
  workshopInstantBelowSeconds: 900,
  /** Atelier 15 : la classe choisie est réparée plus vite (0,5 = 50 % plus vite). */
  workshopClassSpeed: 0.5,
  /** Atelier 20 : accélérations gratuites par jour (heure de Paris). */
  workshopFreeRushPerDay: 1,
  /** Atelier 20 : durée de réparation offerte par accélération (s). */
  workshopFreeRushSeconds: 7200,
};

/** Libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const BUILDING_TIER_RULES_META = {
  storageLevels: { label: "Entrepôt : niveaux des paliers (choix, confort, spécialisation, signature)", unit: "niveau", hint: "4 niveaux croissants. Un palier au-delà du niveau maximal du bâtiment n'est jamais atteint." },
  repairLevels: { label: "Atelier : niveaux des paliers (Cale sèche, confort, spécialisation, signature)", unit: "niveau", hint: "4 niveaux croissants. Le 1er s'affiche au niveau requis par la Cale sèche (Contenu → Bâtiments) quand elle en a un." },
  foundrySlotLevels: { label: "Fonderie quantique : niveaux qui ouvrent un chantier de plus", unit: "niveau", hint: "Niveaux croissants ; chaque niveau atteint ajoute un chantier de bâtiment en parallèle." },
  choiceCooldownHours: { label: "Délai entre deux changements d'un choix de palier", unit: "h", min: 0, max: 720, hint: "Le premier choix est libre ; 0 = changement à volonté." },
  storagePriorityShelterHours: { label: "Entrepôt 5 : heures d'abri en plus (ressource prioritaire)", unit: "h", min: 0, max: 48, hint: "Toujours sous la règle de capacité (part de l'entrepôt à l'abri)." },
  storageBufferHours: { label: "Entrepôt 10 : tampon (heures de production gardées, entrepôt plein)", unit: "h", min: 0, max: 24, hint: "Versé dès que la place se libère. Au-delà de 2 h, le simulateur montre des sessions bloquées en plus (I29)." },
  storageTradeTaxCut: { label: "Entrepôt 15, Négoce : taxe du comptoir en moins", unit: "part", min: 0, max: 1, hint: "0,02 = −2 points (5 % → 3 %). La taxe ne descend pas sous 0." },
  storageConvoyCargo: { label: "Entrepôt 15, Convoi : soute des flottes en plus", unit: "part", min: 0, max: 1, hint: "Couche empire du circuit d'effets (source « bâtiment »)." },
  storageOrbitalShelterHours: { label: "Entrepôt 20 : heures d'abri en plus (4 ressources)", unit: "h", min: 0, max: 48, hint: "S'ajoute à l'abri de base et à la ressource prioritaire ; toujours sous la règle de capacité." },
  workshopInstantBelowSeconds: { label: "Atelier 10 : un lot rentre aussitôt sous cette durée de réparation", unit: "s", min: 0, max: 86_400, hint: "900 = 15 min ; 0 = jamais." },
  workshopClassSpeed: { label: "Atelier 15 : réparation plus rapide de la classe choisie", unit: "part", min: 0, max: 5, hint: "0,5 = 50 % plus vite." },
  workshopFreeRushPerDay: { label: "Atelier 20 : accélérations gratuites par jour", min: 0, max: 10, hint: "Jour de Paris ; 0 = aucune." },
  workshopFreeRushSeconds: { label: "Atelier 20 : réparation offerte par accélération", unit: "s", min: 0, max: 86_400, hint: "7 200 = 2 h (12 Ambre au tarif par défaut)." },
};

/* ---------- familles et paliers ---------- */

/** Famille d'un bâtiment de système (paliers d'effet). `dock` et `foundry` gardent leurs règles propres (DOCK_TIERS, chantiers). */
export type TierFamily = "storage" | "repair" | "dock" | "foundry";
export type TierRole = "choice" | "comfort" | "spec" | "signature";

export const TIER_ROLE_LABELS: Record<TierRole, string> = { choice: "Choix", comfort: "Confort", spec: "Spécialisation", signature: "Signature" };
const ROLES: TierRole[] = ["choice", "comfort", "spec", "signature"];

/** Choix d'un palier : la ressource prioritaire (entrepôt 5), Négoce ou Convoi (entrepôt 15), la classe de l'Atelier (15). */
export type ChoiceSlot = "storage.priority" | "storage.spec" | "workshop.class";
export interface BuildingChoiceEntry {
  /** Valeur choisie. */
  v: string;
  /** Date du dernier changement (ms). */
  at: number;
}
export type BuildingChoices = Partial<Record<ChoiceSlot, BuildingChoiceEntry>>;

export interface TierOption {
  id: string;
  label: string;
  text: string;
}

export interface BuildingTierDef {
  index: number;
  level: number;
  role: TierRole;
  name: string;
  /** Texte joueur, construit depuis les règles en vigueur. */
  text: string;
  slot?: ChoiceSlot;
}

const COMMON_IDS: ResourceId[] = ["scrap", "energy", "nano", "data"];
const COMMON_NAMES: Record<string, string> = { scrap: "Ferraille", energy: "Énergie", nano: "Nanocomposants", data: "Données anciennes" };
const CLASS_IDS: UnitClass[] = ["light", "medium", "heavy", "support"];

/** Liste de niveaux propre (entiers ≥ 1, croissants) : une valeur cassée de l'admin ne fait pas planter le jeu. */
function cleanLevels(raw: unknown, size: number): number[] {
  const list = Array.isArray(raw) ? raw.map((x) => Math.floor(Number(x))).filter((x) => Number.isFinite(x) && x >= 1) : [];
  return list.slice(0, size);
}

/** Bâtiment d'une famille (le premier qui porte l'effet) ; `foundry` : bâtiment qui ouvre les chantiers (`foundryId`). */
function familyDef(family: TierFamily, foundryId?: string): BuildingDef | undefined {
  if (family === "foundry") return foundryId ? findBuilding(foundryId) : undefined;
  return BUILDINGS.find((b) => b.effect?.type === family);
}

/** Famille d'un bâtiment (null : bâtiment de courbe, jalons seulement). */
export function tierFamily(def: Pick<BuildingDef, "id" | "effect">, foundryId?: string): TierFamily | null {
  const t = def.effect?.type;
  if (t === "storage" || t === "repair" || t === "dock") return t;
  if (foundryId && def.id === foundryId) return "foundry";
  return null;
}

/** Niveau effectif du bâtiment d'une famille (0 : absent ou verrouillé). */
export function familyLevel(buildings: Buildings | undefined, family: TierFamily, foundryId?: string): number {
  const def = familyDef(family, foundryId);
  return def ? effectiveBuildingLevel(buildings ?? {}, def.id) : 0;
}

/** Niveaux des paliers d'une famille, dans l'ordre (choix, confort, spécialisation, signature). */
export function familyTierLevels(family: TierFamily): number[] {
  const R = BUILDING_TIER_RULES;
  if (family === "storage") return cleanLevels(R.storageLevels, 4);
  if (family === "repair") {
    const levels = cleanLevels(R.repairLevels, 4);
    // 5.28 : la Cale sèche s'ouvre au niveau qu'elle exige de l'Atelier : le palier « choix » de l'Atelier le montre.
    const atelier = familyDef("repair");
    const dock = familyDef("dock");
    if (atelier && dock?.requires?.building === atelier.id && levels.length) levels[0] = Math.max(1, Math.floor(dock.requires.level));
    return levels;
  }
  if (family === "dock") return [DOCK_TIERS.triage, DOCK_TIERS.auto, DOCK_TIERS.priority, DOCK_TIERS.orbital];
  return cleanLevels(R.foundrySlotLevels, 10);
}

/** Palier `index` atteint (niveau effectif). */
export function tierReached(buildings: Buildings | undefined, family: TierFamily, index: number, foundryId?: string): boolean {
  const lvl = familyTierLevels(family)[index];
  return lvl !== undefined && familyLevel(buildings, family, foundryId) >= lvl;
}

/** Paliers d'une famille, textes construits depuis les règles en vigueur (6.14.105 : un texte ne recopie jamais un chiffre). */
export function familyTiers(family: TierFamily): BuildingTierDef[] {
  const R = BUILDING_TIER_RULES;
  const levels = familyTierLevels(family);
  const tier = (index: number, name: string, text: string, slot?: ChoiceSlot): BuildingTierDef | null =>
    levels[index] === undefined ? null : { index, level: levels[index], role: ROLES[index] ?? "signature", name, text, ...(slot ? { slot } : {}) };
  const base = Math.max(0, Number(ECONOMY_RULES.protectedHours) || 0);
  let out: (BuildingTierDef | null)[] = [];
  if (family === "storage") {
    const prio = Math.max(0, R.storagePriorityShelterHours);
    const orb = Math.max(0, R.storageOrbitalShelterHours);
    out = [
      tier(0, "Ressource prioritaire", `Tu choisis une ressource commune : son abri passe de ${formatHours(base)} à ${formatHours(base + prio)} de production.`, "storage.priority"),
      tier(1, "Tampon", `Entrepôt plein ? Ton tampon garde ${formatHours(Math.max(0, R.storageBufferHours))} de production et la verse dès que tu fais de la place.`),
      tier(2, "Négoce ou Convoi", `Au choix : Négoce (taxe du comptoir −${formatDecimal(Math.max(0, R.storageTradeTaxCut) * 100, 1)} points) ou Convoi (soute des flottes +${formatPct(Math.max(0, R.storageConvoyCargo))}).`, "storage.spec"),
      tier(3, "Entrepôt orbital", `Abri de ${formatHours(base + orb)} de production pour les 4 ressources (ressource prioritaire : ${formatHours(base + orb + prio)}).`),
    ];
  } else if (family === "repair") {
    const rush = Math.max(0, Math.floor(R.workshopFreeRushPerDay));
    out = [
      tier(0, "Cale sèche", "Ouvre la Cale sèche : tes vaisseaux sauvés y attendent leur réparation, et tu peux les démanteler."),
      tier(1, "Premiers soins", `Un lot de ${formatMinutes(R.workshopInstantBelowSeconds)} de réparation ou moins rentre aussitôt au hangar.`),
      tier(2, "Atelier spécialisé", `Tu choisis une classe (Faible, Moyen, Fort, Soutien) : elle est réparée ${formatPct(Math.max(0, R.workshopClassSpeed))} plus vite.`, "workshop.class"),
      tier(3, "Réparation d'urgence", `${rush} accélération${rush > 1 ? "s" : ""} gratuite${rush > 1 ? "s" : ""} par jour, jusqu'à ${formatMinutes(R.workshopFreeRushSeconds)} de réparation chacune.`),
    ];
  } else if (family === "dock") {
    out = [
      tier(0, "Triage", "Démantèle en cale, ou règle ce qui part en cale après un combat."),
      tier(1, "Remise automatique", "Les vaisseaux réparés rentrent seuls au hangar dès qu'il y a de la place ; l'Atelier répare plus vite."),
      tier(2, "Priorités", "Choisis la classe réparée en premier."),
      tier(3, "Cale orbitale", "Des vaisseaux sauvés en plus à chaque combat."),
    ];
  } else {
    out = levels.map((_, i) => tier(i, `Chantier ${i + 1}`, "+1 chantier de bâtiment en parallèle."));
  }
  return out.filter((t): t is BuildingTierDef => !!t);
}

/** « 15 min », « 2 h », « 1 h 30 » (sans Intl). */
export function formatMinutes(seconds: number): string {
  const m = Math.round(Math.max(0, Number(seconds) || 0) / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r}` : `${h} h`;
}

/* ---------- choix du joueur ---------- */

const SLOTS: Record<ChoiceSlot, { family: TierFamily; index: number; options: () => TierOption[] }> = {
  "storage.priority": {
    family: "storage",
    index: 0,
    options: () => COMMON_IDS.map((id) => ({ id, label: COMMON_NAMES[id] ?? id, text: `Abri de ${COMMON_NAMES[id] ?? id} : +${formatHours(Math.max(0, BUILDING_TIER_RULES.storagePriorityShelterHours))} de production.` })),
  },
  "storage.spec": {
    family: "storage",
    index: 2,
    options: () => [
      { id: "trade", label: "Négoce", text: `Taxe du comptoir −${formatDecimal(Math.max(0, BUILDING_TIER_RULES.storageTradeTaxCut) * 100, 1)} points.` },
      { id: "convoy", label: "Convoi", text: `Soute des flottes +${formatPct(Math.max(0, BUILDING_TIER_RULES.storageConvoyCargo))}.` },
    ],
  },
  "workshop.class": {
    family: "repair",
    index: 2,
    options: () => CLASS_IDS.map((id) => ({ id, label: UNIT_CLASS_LABELS[id], text: `Classe ${UNIT_CLASS_LABELS[id]} réparée ${formatPct(Math.max(0, BUILDING_TIER_RULES.workshopClassSpeed))} plus vite.` })),
  },
};

export const CHOICE_SLOTS = Object.keys(SLOTS) as ChoiceSlot[];

export function isChoiceSlot(x: unknown): x is ChoiceSlot {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(SLOTS, x);
}

export function choiceOptions(slot: ChoiceSlot): TierOption[] {
  return SLOTS[slot].options();
}

type ChoicePlayer = Partial<Pick<PlayerState, "buildings" | "buildingChoices">>;

/** Choix enregistré, propre (null : aucun, ou valeur devenue inconnue). */
function entryOf(player: ChoicePlayer | null | undefined, slot: ChoiceSlot): BuildingChoiceEntry | null {
  const raw = (player?.buildingChoices as BuildingChoices | null | undefined)?.[slot];
  if (!raw || typeof raw !== "object" || typeof raw.v !== "string") return null;
  if (!SLOTS[slot].options().some((o) => o.id === raw.v)) return null;
  return { v: raw.v, at: Number(raw.at) || 0 };
}

/** Choix **en vigueur** : enregistré et palier atteint (sinon null, aucun effet). */
export function activeChoice(player: ChoicePlayer | null | undefined, slot: ChoiceSlot): string | null {
  const e = entryOf(player, slot);
  if (!e) return null;
  const s = SLOTS[slot];
  return tierReached(player?.buildings, s.family, s.index) ? e.v : null;
}

/** Choix enregistré (même si le palier n'est plus atteint, après une Ascension), pour l'affichage. */
export function savedChoice(player: ChoicePlayer | null | undefined, slot: ChoiceSlot): string | null {
  return entryOf(player, slot)?.v ?? null;
}

/** Temps avant de pouvoir changer ce choix (0 : libre ; le premier choix est toujours libre). */
export function choiceCooldownLeftMs(player: ChoicePlayer | null | undefined, slot: ChoiceSlot, now: number): number {
  const e = entryOf(player, slot);
  if (!e) return 0;
  const cd = Math.max(0, Number(BUILDING_TIER_RULES.choiceCooldownHours) || 0) * 3600_000;
  return Math.max(0, e.at + cd - now);
}

const FAMILY_NAMES: Record<TierFamily, string> = { storage: "de l'Entrepôt", repair: "de l'Atelier de réparation", dock: "de la Cale sèche", foundry: "de la Fonderie quantique" };

/** Action serveur `buildingChoice` : enregistre un choix de palier (palier atteint, valeur connue, délai respecté). */
export function setBuildingChoice(player: PlayerState, slotIn: unknown, valueIn: unknown, now: number): { slot: ChoiceSlot; value: string; label: string } {
  if (!isChoiceSlot(slotIn)) throw new GameActionError("Choix de palier inconnu.");
  const slot = slotIn;
  const s = SLOTS[slot];
  const option = s.options().find((o) => o.id === valueIn);
  if (!option) throw new GameActionError("Option inconnue pour ce palier.");
  if (!tierReached(player.buildings, s.family, s.index)) {
    const def = familyDef(s.family);
    const lvl = familyTierLevels(s.family)[s.index];
    throw new GameActionError(`Ce choix s'ouvre au niveau ${lvl ?? "?"} ${def ? FAMILY_NAMES[s.family] : "du bâtiment"}.`);
  }
  const current = entryOf(player, slot);
  if (current?.v === option.id) throw new GameActionError("C'est déjà ton choix.");
  const left = choiceCooldownLeftMs(player, slot, now);
  if (left > 0) throw new GameActionError(`Tu pourras changer ce choix dans ${formatMinutes(Math.ceil(left / 1000))}.`);
  const next: BuildingChoices = { ...((player.buildingChoices as BuildingChoices | null | undefined) ?? {}) };
  next[slot] = { v: option.id, at: now };
  player.buildingChoices = next;
  return { slot, value: option.id, label: option.label };
}

/* ---------- source « bâtiment » du circuit d'effets ---------- */

/** Effets des paliers qui parlent le vocabulaire du circuit (couche empire). Appelé par `empireEffects` (modifiers.ts). */
export function buildingTierEffects(player: ChoicePlayer | null | undefined): EffectGrant[] {
  if (!player?.buildings) return [];
  const out: EffectGrant[] = [];
  // Entrepôt 15, Convoi : soute des flottes.
  const convoy = Math.max(0, Number(BUILDING_TIER_RULES.storageConvoyCargo) || 0);
  if (convoy > 0 && activeChoice(player, "storage.spec") === "convoy") {
    const def = familyDef("storage");
    out.push({ stat: "cargo", value: convoy, layer: "empire", source: { kind: "building", id: def?.id ?? "storage", label: `${def?.name ?? "Entrepôt"} : Convoi` } });
  }
  return out;
}

/** Plus grande valeur que la source « bâtiment » peut donner, par grandeur (rapport d'impact de l'admin). */
export function buildingTierEffectMaxima(): { stat: "cargo"; label: string; max: number; note: string }[] {
  return [{ stat: "cargo", label: "Entrepôt : Convoi", max: Math.max(0, Number(BUILDING_TIER_RULES.storageConvoyCargo) || 0), note: `palier ${familyTierLevels("storage")[2] ?? "?"}` }];
}

/* ---------- lecteurs de l'entrepôt (PB-L2) ---------- */

/** Heures d'abri en plus pour une ressource : prioritaire (palier 5) et entrepôt orbital (palier 20). */
export function shelterExtraHours(player: ChoicePlayer | null | undefined, res: ResourceId): number {
  if (!player?.buildings) return 0;
  let extra = 0;
  if (activeChoice(player, "storage.priority") === res) extra += Math.max(0, Number(BUILDING_TIER_RULES.storagePriorityShelterHours) || 0);
  if (tierReached(player.buildings, "storage", 3)) extra += Math.max(0, Number(BUILDING_TIER_RULES.storageOrbitalShelterHours) || 0);
  return extra;
}

/** Heures de production gardées en tampon (palier 10 ; 0 sans tampon). */
export function storageBufferHours(buildings: Buildings | undefined): number {
  return tierReached(buildings, "storage", 1) ? Math.max(0, Number(BUILDING_TIER_RULES.storageBufferHours) || 0) : 0;
}

/** Points de taxe du comptoir en moins (Négoce, palier 15). */
export function exchangeTaxCut(player: ChoicePlayer | null | undefined): number {
  return activeChoice(player, "storage.spec") === "trade" ? Math.max(0, Number(BUILDING_TIER_RULES.storageTradeTaxCut) || 0) : 0;
}

/* ---------- lecteurs de l'Atelier (PB-L3) ---------- */

/** Durée de réparation sous laquelle un lot rentre aussitôt (palier 10 ; 0 : jamais). */
export function firstAidSeconds(buildings: Buildings | undefined): number {
  return tierReached(buildings, "repair", 1) ? Math.max(0, Number(BUILDING_TIER_RULES.workshopInstantBelowSeconds) || 0) : 0;
}

/** Multiplicateur de cadence d'une classe d'unités (palier 15 : classe choisie, sinon 1). */
export function workshopClassFactor(player: ChoicePlayer | null | undefined, unitClass: string | undefined): number {
  if (!unitClass) return 1;
  return activeChoice(player, "workshop.class") === unitClass ? 1 + Math.max(0, Number(BUILDING_TIER_RULES.workshopClassSpeed) || 0) : 1;
}

/** Accélérations gratuites du jour (palier 20) : nombre par jour et durée offerte (0 : palier non atteint). */
export function freeRushAllowance(buildings: Buildings | undefined): { perDay: number; seconds: number } {
  if (!tierReached(buildings, "repair", 3)) return { perDay: 0, seconds: 0 };
  return { perDay: Math.max(0, Math.floor(Number(BUILDING_TIER_RULES.workshopFreeRushPerDay) || 0)), seconds: Math.max(0, Number(BUILDING_TIER_RULES.workshopFreeRushSeconds) || 0) };
}

/* ---------- vue d'une carte de bâtiment ---------- */

export interface BuildingTierView {
  family: TierFamily;
  level: number;
  tiers: (BuildingTierDef & { reached: boolean; next: boolean; choice: string | null; choiceLabel: string | null })[];
  /** Prochain palier (null : tous atteints). */
  next: BuildingTierDef | null;
  /** Choix ouverts mais pas encore faits (« À choisir »). */
  pending: ChoiceSlot[];
}

/** Paliers d'un bâtiment pour sa carte (null : bâtiment de courbe). `foundryId` : bâtiment des chantiers (`BUILD_PLAN_RULES.slotBuilding`). */
export function buildingTierView(def: Pick<BuildingDef, "id" | "effect">, player: ChoicePlayer, foundryId?: string): BuildingTierView | null {
  const family = tierFamily(def, foundryId);
  if (!family) return null;
  // Une famille ne vit que dans son premier bâtiment (comme l'effet lui-même).
  const owner = familyDef(family, foundryId);
  if (owner && owner.id !== def.id) return null;
  const level = familyLevel(player.buildings, family, foundryId);
  const defs = familyTiers(family);
  let next: BuildingTierDef | null = null;
  const tiers = defs.map((t) => {
    const reached = level >= t.level;
    const isNext = !reached && !next;
    if (isNext) next = t;
    const choice = t.slot ? savedChoice(player, t.slot) : null;
    const choiceLabel = t.slot && choice ? (choiceOptions(t.slot).find((o) => o.id === choice)?.label ?? null) : null;
    return { ...t, reached, next: isNext, choice, choiceLabel };
  });
  const pending = tiers.filter((t) => t.reached && t.slot && !t.choice).map((t) => t.slot!) as ChoiceSlot[];
  return { family, level, tiers, next, pending };
}

/* ---------- validation de l'admin ---------- */

/** Erreurs d'un groupe `buildingTiers` fusionné (validateRules) : listes de niveaux entières, ≥ 1, strictement croissantes. */
export function validateBuildingTierRules(r: Partial<typeof BUILDING_TIER_RULES> | null | undefined): string[] {
  const errors: string[] = [];
  if (!r) return errors;
  const lists: [keyof typeof BUILDING_TIER_RULES, string, number | null][] = [
    ["storageLevels", "Entrepôt", 4],
    ["repairLevels", "Atelier", 4],
    ["foundrySlotLevels", "Fonderie quantique", null],
  ];
  for (const [key, name, size] of lists) {
    const v = r[key] as unknown;
    if (v === undefined) continue;
    const ok = Array.isArray(v) && v.every((x) => Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 100) && v.every((x, i) => i === 0 || (x as number) > (v[i - 1] as number));
    if (!ok) errors.push(`Bâtiments : paliers, ${name} : niveaux entiers entre 1 et 100, strictement croissants.`);
    else if (size !== null && v.length !== size) errors.push(`Bâtiments : paliers, ${name} : ${size} niveaux (choix, confort, spécialisation, signature).`);
  }
  return errors;
}
