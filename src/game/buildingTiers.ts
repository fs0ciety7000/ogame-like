import { BUILDINGS, DOCK_TIERS, effectiveBuildingLevel, findBuilding, type BuildingDef } from "@/game/buildings";
import type { EffectGrant } from "@/game/effects";
import { COMBAT_RULES } from "@/game/combat";
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
  /** 6.14.145 (PB-L4) : niveaux des paliers du hangar d'attaque (baies, file d'attente, spécialisation, signature). */
  hangarAttackLevels: [5, 10, 15, 20],
  /** Niveaux des paliers du hangar de défense. */
  hangarDefenseLevels: [5, 10, 15, 20],
  /** Hangars 5, baies modulaires : part des places d'un hangar prêtée à l'autre (0,1 = 10 %). */
  hangarLendShare: 0.1,
  /** Hangars 10 : commandes au plus en attente d'une place, par hangar (0 : pas de file d'attente). */
  hangarWaitingQueueMax: 5,
  /** Hangar d'attaque 15, Pont d'envol, et hangar de défense 15, Tourelles en série : temps de construction en moins (0,1 = −10 %). */
  hangarSpecUnitTime: 0.1,
  /** Hangar d'attaque 15, Réacteurs : temps de vol en moins (0,05 = −5 %). 6.14.145 : 10 % prévus, ramenés à 5 % pour que le
   *  maximum théorique de la couche empire (Propulsion 24 % + Logisticienne 20 % + Réacteurs) reste sous son plafond de 50 %. */
  hangarSpecFleetSpeed: 0.05,
  /** Hangar de défense 15, Entretien réduit : énergie d'entretien des défenses en moins (0,2 = −20 %). */
  hangarSpecUpkeep: 0.2,
  /** Hangar d'attaque 20, Pont de lancement : emplacements de flotte en plus. */
  hangarFleetSlots: 1,
  /** Hangar de défense 20, Casemates : part des défenses détruites reconstruites en plus (0,1 : 60 % → 70 %). */
  hangarDefenseRebuildBonus: 0.1,
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
  hangarAttackLevels: { label: "Hangar d'attaque : niveaux des paliers (baies, file d'attente, spécialisation, signature)", unit: "niveau", hint: "4 niveaux croissants." },
  hangarDefenseLevels: { label: "Hangar de défense : niveaux des paliers (baies, file d'attente, spécialisation, signature)", unit: "niveau", hint: "4 niveaux croissants." },
  hangarLendShare: { label: "Hangars 5, baies modulaires : part des places prêtée à l'autre hangar", unit: "part", min: 0, max: 0.5, hint: "0,1 = 10 % des places du hangar prêteur. Un prêt ou sa reprise qui créerait une surcharge est refusé." },
  hangarWaitingQueueMax: { label: "Hangars 10 : commandes en attente d'une place, au plus", min: 0, max: 20, hint: "Par hangar. 0 = pas de file d'attente (commande refusée sans place, comme avant)." },
  hangarSpecUnitTime: { label: "Hangars 15, Pont d'envol / Tourelles en série : temps de construction en moins", unit: "part", min: 0, max: 0.5, hint: "0,1 = −10 % (couche empire, plafond des réductions ciblées)." },
  hangarSpecFleetSpeed: { label: "Hangar d'attaque 15, Réacteurs : temps de vol en moins", unit: "part", min: 0, max: 0.5, hint: "0,05 = −5 % (couche empire, plafond 50 % : au-delà de 6 %, le maximum théorique le dépasse)." },
  hangarSpecUpkeep: { label: "Hangar de défense 15, Entretien réduit : entretien des défenses en moins", unit: "part", min: 0, max: 0.5, hint: "0,2 = −20 % de l'énergie d'entretien des défenses seulement." },
  hangarFleetSlots: { label: "Hangar d'attaque 20, Pont de lancement : emplacements de flotte en plus", min: 0, max: 5, hint: "10 → 11 par défaut." },
  hangarDefenseRebuildBonus: { label: "Hangar de défense 20, Casemates : défenses reconstruites en plus", unit: "part", min: 0, max: 0.4, hint: "0,1 = 60 % → 70 % (référence OGame : 70 %). Mesure JcJ : fiche 6.14.145." },
};

/* ---------- familles et paliers ---------- */

/** Famille d'un bâtiment de système (paliers d'effet). `dock` et `foundry` gardent leurs règles propres (DOCK_TIERS, chantiers). */
export type TierFamily = "storage" | "repair" | "dock" | "foundry" | "hangarAttack" | "hangarDefense";
export type TierRole = "choice" | "comfort" | "spec" | "signature";

export const TIER_ROLE_LABELS: Record<TierRole, string> = { choice: "Choix", comfort: "Confort", spec: "Spécialisation", signature: "Signature" };
const ROLES: TierRole[] = ["choice", "comfort", "spec", "signature"];

/** Choix d'un palier : la ressource prioritaire (entrepôt 5), Négoce ou Convoi (entrepôt 15), la classe de l'Atelier (15). */
export type ChoiceSlot = "storage.priority" | "storage.spec" | "workshop.class" | "hangarAttack.lend" | "hangarDefense.lend" | "hangarAttack.spec" | "hangarDefense.spec";
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
  /** 6.14.146 (PB-L5) : icône du palier (définitive si livrée, sinon l'image du bâtiment : image provisoire). */
  image?: string;
}

/** 6.14.146 (PB-L5) : icônes de palier livrées (`public/assets/tiers/<clé>.webp`, `scripts/illustrations.json`, lignes
 *  « palier-<clé> »). Une clé ajoutée ici quand son rendu est intégré (`docs/illustrations.md`) ; les autres gardent l'image
 *  du bâtiment. */
export const TIER_ART: string[] = [];

/** Clé de l'icône d'un palier : `<famille>-<rôle>` (la Fonderie : une icône pour tous ses chantiers). */
export function tierIconKey(family: TierFamily, index: number): string {
  return family === "foundry" ? "foundry-slot" : `${family}-${ROLES[index] ?? "signature"}`;
}

/** Icône d'un palier : définitive si livrée, sinon `fallback` (image du bâtiment). */
export function tierImage(family: TierFamily, index: number, fallback?: string): string | undefined {
  const key = tierIconKey(family, index);
  return TIER_ART.includes(key) ? `/assets/tiers/${key}.webp` : fallback;
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
  // 6.14.145 (PB-L4) : un hangar par catégorie, visé par son effet (contenu personnalisé).
  if (family === "hangarAttack" || family === "hangarDefense") {
    const cat = family === "hangarAttack" ? "attack" : "defense";
    return BUILDINGS.find((b) => b.effect?.type === "hangar" && b.effect.category === cat);
  }
  return BUILDINGS.find((b) => b.effect?.type === family);
}

/** Famille d'un bâtiment (null : bâtiment de courbe, jalons seulement). */
export function tierFamily(def: Pick<BuildingDef, "id" | "effect">, foundryId?: string): TierFamily | null {
  const t = def.effect?.type;
  if (t === "storage" || t === "repair" || t === "dock") return t;
  if (t === "hangar" && def.effect?.type === "hangar") return def.effect.category === "attack" ? "hangarAttack" : "hangarDefense";
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
  if (family === "hangarAttack") return cleanLevels(R.hangarAttackLevels, 4);
  if (family === "hangarDefense") return cleanLevels(R.hangarDefenseLevels, 4);
  if (family === "dock") return [DOCK_TIERS.triage, DOCK_TIERS.auto, DOCK_TIERS.priority, DOCK_TIERS.orbital];
  return cleanLevels(R.foundrySlotLevels, 10);
}

/** Palier `index` atteint (niveau effectif). */
export function tierReached(buildings: Buildings | undefined, family: TierFamily, index: number, foundryId?: string): boolean {
  const lvl = familyTierLevels(family)[index];
  return lvl !== undefined && familyLevel(buildings, family, foundryId) >= lvl;
}

/** Paliers d'une famille, textes construits depuis les règles en vigueur (6.14.105 : un texte ne recopie jamais un chiffre). */
export function familyTiers(family: TierFamily, foundryId?: string): BuildingTierDef[] {
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
  } else if (family === "hangarAttack" || family === "hangarDefense") {
    const attack = family === "hangarAttack";
    const other = attack ? "de défense" : "d'attaque";
    const wait = Math.max(0, Math.floor(Number(R.hangarWaitingQueueMax) || 0));
    const slots = Math.max(0, Math.floor(Number(R.hangarFleetSlots) || 0));
    const base = Math.max(0, Number(COMBAT_RULES.defenseRebuildPct) || 0);
    out = [
      tier(0, "Baies modulaires", `Tu peux prêter ${formatPct(Math.max(0, R.hangarLendShare))} des places de ce hangar au hangar ${other}.`, attack ? "hangarAttack.lend" : "hangarDefense.lend"),
      tier(1, "File d'attente", `Hangar plein ? Jusqu'à ${wait} commande${wait > 1 ? "s" : ""} attend${wait > 1 ? "ent" : ""} une place libre, payée${wait > 1 ? "s" : ""} à la commande, et démarre${wait > 1 ? "nt" : ""} dès qu'une place se libère.`),
      attack
        ? tier(2, "Pont d'envol ou Réacteurs", `Au choix : Pont d'envol (vaisseaux construits ${formatPct(Math.max(0, R.hangarSpecUnitTime))} plus vite) ou Réacteurs (temps de vol −${formatPct(Math.max(0, R.hangarSpecFleetSpeed))}).`, "hangarAttack.spec")
        : tier(2, "Tourelles ou Entretien", `Au choix : Tourelles en série (défenses construites ${formatPct(Math.max(0, R.hangarSpecUnitTime))} plus vite) ou Entretien réduit (énergie des défenses −${formatPct(Math.max(0, R.hangarSpecUpkeep))}).`, "hangarDefense.spec"),
      attack
        ? tier(3, "Pont de lancement", `+${slots} emplacement${slots > 1 ? "s" : ""} de flotte.`)
        : tier(3, "Casemates", `Après un combat, ${formatPct(Math.min(1, base + Math.max(0, R.hangarDefenseRebuildBonus)))} des défenses détruites sont reconstruites (au lieu de ${formatPct(base)}).`),
    ];
  } else {
    out = levels.map((_, i) => tier(i, `Chantier ${i + 1}`, "+1 chantier de bâtiment en parallèle."));
  }
  const fallback = familyDef(family, foundryId)?.image;
  return out.filter((t): t is BuildingTierDef => !!t).map((t) => ({ ...t, image: tierImage(family, t.index, fallback) }));
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
  "hangarAttack.lend": { family: "hangarAttack", index: 0, options: () => lendOptions("défense") },
  "hangarDefense.lend": { family: "hangarDefense", index: 0, options: () => lendOptions("attaque") },
  "hangarAttack.spec": {
    family: "hangarAttack",
    index: 2,
    options: () => [
      { id: "deck", label: "Pont d'envol", text: `Vaisseaux construits ${formatPct(Math.max(0, BUILDING_TIER_RULES.hangarSpecUnitTime))} plus vite.` },
      { id: "engines", label: "Réacteurs", text: `Temps de vol −${formatPct(Math.max(0, BUILDING_TIER_RULES.hangarSpecFleetSpeed))}.` },
    ],
  },
  "hangarDefense.spec": {
    family: "hangarDefense",
    index: 2,
    options: () => [
      { id: "turrets", label: "Tourelles en série", text: `Défenses construites ${formatPct(Math.max(0, BUILDING_TIER_RULES.hangarSpecUnitTime))} plus vite.` },
      { id: "upkeep", label: "Entretien réduit", text: `Énergie d'entretien des défenses −${formatPct(Math.max(0, BUILDING_TIER_RULES.hangarSpecUpkeep))}.` },
    ],
  },
};

function lendOptions(to: string): TierOption[] {
  return [
    { id: "keep", label: "Garder", text: "Ce hangar garde toutes ses places." },
    { id: "lend", label: `Prêter au hangar ${to === "défense" ? "de défense" : "d'attaque"}`, text: `${formatPct(Math.max(0, BUILDING_TIER_RULES.hangarLendShare))} des places de ce hangar passent au hangar ${to === "défense" ? "de défense" : "d'attaque"}.` },
  ];
}

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

const FAMILY_NAMES: Record<TierFamily, string> = { storage: "de l'Entrepôt", repair: "de l'Atelier de réparation", dock: "de la Cale sèche", foundry: "de la Fonderie quantique", hangarAttack: "du Hangar d'attaque", hangarDefense: "du Hangar de défense" };

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
  // 6.14.145 (PB-L4) : spécialisations des hangars (palier 15).
  const R = BUILDING_TIER_RULES;
  const att = familyDef("hangarAttack");
  const dfn = familyDef("hangarDefense");
  const src = (def: BuildingDef | undefined, fallback: string, name: string) => ({ kind: "building" as const, id: def?.id ?? fallback, label: `${def?.name ?? fallback} : ${name}` });
  const unitTime = Math.max(0, Number(R.hangarSpecUnitTime) || 0);
  const attackSpec = activeChoice(player, "hangarAttack.spec");
  if (attackSpec === "deck" && unitTime > 0) out.push({ stat: "unitBuildTime", target: "cat:attack", value: unitTime, layer: "empire", source: src(att, "Hangar d'attaque", "Pont d'envol") });
  const speed = Math.max(0, Number(R.hangarSpecFleetSpeed) || 0);
  if (attackSpec === "engines" && speed > 0) out.push({ stat: "fleetSpeed", value: speed, layer: "empire", source: src(att, "Hangar d'attaque", "Réacteurs") });
  const defenseSpec = activeChoice(player, "hangarDefense.spec");
  if (defenseSpec === "turrets" && unitTime > 0) out.push({ stat: "unitBuildTime", target: "cat:defense", value: unitTime, layer: "empire", source: src(dfn, "Hangar de défense", "Tourelles en série") });
  const upkeep = Math.max(0, Number(R.hangarSpecUpkeep) || 0);
  if (defenseSpec === "upkeep" && upkeep > 0) out.push({ stat: "fleetUpkeep", target: "cat:defense", value: upkeep, layer: "empire", source: src(dfn, "Hangar de défense", "Entretien réduit") });
  return out;
}

/** Plus grande valeur que la source « bâtiment » peut donner, par grandeur (rapport d'impact de l'admin). */
export function buildingTierEffectMaxima(): { stat: "cargo" | "unitBuildTime" | "fleetSpeed" | "fleetUpkeep"; target?: string; label: string; max: number; note: string }[] {
  const R = BUILDING_TIER_RULES;
  const att = `palier ${familyTierLevels("hangarAttack")[2] ?? "?"}`;
  const dfn = `palier ${familyTierLevels("hangarDefense")[2] ?? "?"}`;
  const n = (x: unknown) => Math.max(0, Number(x) || 0);
  return [
    { stat: "cargo", label: "Entrepôt : Convoi", max: n(R.storageConvoyCargo), note: `palier ${familyTierLevels("storage")[2] ?? "?"}` },
    // 6.14.145 (PB-L4) : un choix par hangar (Pont d'envol ou Réacteurs ; Tourelles ou Entretien).
    { stat: "unitBuildTime", target: "cat:attack", label: "Hangar d'attaque : Pont d'envol", max: n(R.hangarSpecUnitTime), note: att },
    { stat: "fleetSpeed", label: "Hangar d'attaque : Réacteurs", max: n(R.hangarSpecFleetSpeed), note: att },
    { stat: "unitBuildTime", target: "cat:defense", label: "Hangar de défense : Tourelles en série", max: n(R.hangarSpecUnitTime), note: dfn },
    { stat: "fleetUpkeep", target: "cat:defense", label: "Hangar de défense : Entretien réduit", max: n(R.hangarSpecUpkeep), note: dfn },
  ];
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

/* ---------- lecteurs des hangars (PB-L4) ---------- */

/** Part des places prêtée par le hangar `from` à l'autre (palier 5, choix « Prêter » ; 0 sinon). La capacité reste calculée
 *  dans `hangar.ts` (`playerUnitCapacity`, I5). */
export function hangarLendShareOf(player: ChoicePlayer | null | undefined, from: "attack" | "defense"): number {
  const slot: ChoiceSlot = from === "attack" ? "hangarAttack.lend" : "hangarDefense.lend";
  return activeChoice(player, slot) === "lend" ? Math.min(0.5, Math.max(0, Number(BUILDING_TIER_RULES.hangarLendShare) || 0)) : 0;
}

/** Commandes au plus en attente d'une place dans ce hangar (palier 10 ; 0 : pas de file d'attente). */
export function hangarWaitingMax(buildings: Buildings | undefined, category: "attack" | "defense"): number {
  return tierReached(buildings, category === "attack" ? "hangarAttack" : "hangarDefense", 1) ? Math.max(0, Math.floor(Number(BUILDING_TIER_RULES.hangarWaitingQueueMax) || 0)) : 0;
}

/** Emplacements de flotte en plus (hangar d'attaque, palier 20). */
export function hangarFleetSlotBonus(buildings: Buildings | undefined): number {
  return tierReached(buildings, "hangarAttack", 3) ? Math.max(0, Math.floor(Number(BUILDING_TIER_RULES.hangarFleetSlots) || 0)) : 0;
}

/** Part des défenses reconstruites en plus après un combat (hangar de défense, palier 20 ; 0 sinon). */
export function defenseRebuildBonus(buildings: Buildings | undefined): number {
  return tierReached(buildings, "hangarDefense", 3) ? Math.max(0, Number(BUILDING_TIER_RULES.hangarDefenseRebuildBonus) || 0) : 0;
}

/* ---------- succès des paliers (PB-L5, 6.14.146) ---------- */

/** Bâtiments de système à 4 paliers (signature au 4e) : entrepôt, Atelier, deux hangars. */
export const SIGNATURE_FAMILIES: TierFamily[] = ["storage", "repair", "hangarAttack", "hangarDefense"];
/** Choix des paliers de spécialisation (15). */
export const SPEC_SLOTS: ChoiceSlot[] = ["storage.spec", "workshop.class", "hangarAttack.spec", "hangarDefense.spec"];

/** Signatures (dernier palier) atteintes en ce moment parmi les bâtiments de système (succès « Architecte »). */
export function signatureTiersReached(player: ChoicePlayer | null | undefined): number {
  return SIGNATURE_FAMILIES.filter((f) => {
    const levels = familyTierLevels(f);
    return levels.length > 0 && tierReached(player?.buildings, f, levels.length - 1);
  }).length;
}

/** Choix de spécialisation faits (enregistrés, même palier perdu à l'Ascension ; succès « Bâtisseur avisé »). */
export function specChoicesMade(player: ChoicePlayer | null | undefined): number {
  return SPEC_SLOTS.filter((slot) => !!savedChoice(player, slot)).length;
}

/** 6.14.146 (PB-L5) : lignes de la section « Paliers » des Formules (et de la palette) : bâtiment, niveaux, effets lus dans les règles.
 *  `foundryId` : bâtiment des chantiers (`BUILD_PLAN_RULES.slotBuilding`). `buildings` : niveaux du joueur (palier atteint). */
export function tierFormulaRows(foundryId?: string, buildings?: Buildings): { key: string; family: TierFamily; title: string; tag: string; lines: string[]; reached: number }[] {
  const families: TierFamily[] = ["storage", "repair", "hangarAttack", "hangarDefense", "dock", "foundry"];
  const out: { key: string; family: TierFamily; title: string; tag: string; lines: string[]; reached: number }[] = [];
  for (const f of families) {
    const def = familyDef(f, foundryId);
    const tiers = familyTiers(f, foundryId);
    if (!def || !tiers.length) continue;
    const level = buildings ? familyLevel(buildings, f, foundryId) : 0;
    out.push({
      key: f,
      family: f,
      title: def.name,
      tag: `niv. ${tiers.map((t) => t.level).join(" · ")}`,
      lines: tiers.map((t) => `${t.level} · ${TIER_ROLE_LABELS[t.role]} — ${t.name} : ${t.text}`),
      reached: tiers.filter((t) => level >= t.level).length,
    });
  }
  return out;
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
  const defs = familyTiers(family, foundryId);
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
    ["hangarAttackLevels", "Hangar d'attaque", 4],
    ["hangarDefenseLevels", "Hangar de défense", 4],
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
