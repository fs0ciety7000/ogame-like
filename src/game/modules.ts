import { GameActionError } from "@/game/errors";
import { describeEffect, EFFECT_STATS, type EffectGrant, type EffectStat } from "@/game/effects";
import { unitClasses, UNIT_CLASS_LABELS, type UnitClass } from "@/game/unitClasses";
import { UNITS } from "@/game/units";
import { RELICS } from "@/game/relics";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   5.26 : modules de vaisseaux. Les combats laissent parfois un PLAN de
   module ; on le FABRIQUE (coût en ressources) puis on le MONTE sur une
   classe d'unités (Faible, Moyen, Fort, Soutien), deux emplacements par
   classe. Un module monté donne un effet du circuit d'effets :
     armement → attaque de la classe, blindage → points de vie de la classe,
     soute → capacité de soute, propulsion → temps de vol, voile → contre-
     espionnage. Soute, propulsion et voile ne se montent que sur le Soutien.
   Les plans (pas les modules fabriqués) se vendent à l'Hôtel des enchères.
===================================================== */

export type ModuleRarity = "common" | "rare" | "epic" | "legendary";
/** 6.14.127 (AA9) : identifiant d'une famille (section `moduleFamilies` ; livrées : armement, blindage, soute, propulsion, voile). */
export type ModuleFamily = string;

/** 6.14.127 (AU27, lot AA9, constat AA-5) : modèle de module, fiche de la section `moduleTemplates` (Admin → Modules). Un modèle
 *  enregistré ne se supprime pas : on le **retire** (`retired`) : il ne sort plus au tirage, les plans et modules déjà trouvés
 *  gardent leur effet (invariant I43). */
export interface ModuleTemplate {
  id: string;
  name: string;
  family: ModuleFamily;
  description: string;
  /** Retiré du tirage : plus aucun plan de ce modèle ne tombe ; ceux qu'ont les joueurs restent valables. */
  retired?: boolean;
  /** 6.14.133 (AJ27-10) : plan « signature » : l'unité visée (effet `unit:<id>`, monté sur la classe de l'unité). Modèle
   *  généré (`sig_<unité>`), jamais enregistré dans la section. */
  unit?: string;
}

/** 6.14.127 (AA9) : famille de modules, fiche de la section `moduleFamilies` : effet composé (grandeur ; une grandeur qui vise des
 *  unités vise la classe où le module est monté), classes où il se monte, valeur par rareté, tournure du texte. */
export interface ModuleFamilyDef {
  id: string;
  label: string;
  stat: EffectStat;
  /** Classes d'unités où la famille se monte (Faible, Moyen, Fort, Soutien). */
  classes: UnitClass[];
  /** Valeur par rareté (0,04 = +4 % ; grandeur en niveaux : niveaux). */
  values: Record<ModuleRarity, number>;
  /** Texte de l'effet : « {pct} » (« 11 % »), « {value} » (nombre), « {x} » (« x » au-delà de 1). Vide : texte du circuit d'effets. */
  phrase?: string;
}

export interface ModuleItem {
  id: string;
  template: string;
  rarity: ModuleRarity;
  /** false : plan encore à fabriquer (échangeable) ; true : module prêt à monter. */
  built: boolean;
  foundAtMs: number;
  source: string;
  /** 5.26.3 : rareté déjà relancée (Rappel de plan, une fois par plan). */
  rerolled?: boolean;
}

export interface ModulesState {
  items: ModuleItem[];
  /** Deux emplacements par classe : identifiants des modules montés. */
  slots: Record<UnitClass, (string | null)[]>;
  /** 5.26.2 : préréglages de montage nommés (« Raid », « Défense »…), 5 au plus. */
  presets?: ModulePreset[];
}

export interface ModulePreset {
  name: string;
  slots: Record<UnitClass, (string | null)[]>;
}

export const MODULE_CLASSES: UnitClass[] = ["light", "medium", "heavy", "support"];
export const MODULE_RULES = {
  slotsPerClass: 2,
  maxItems: 30,
  fuseCount: 3,
  maxPresets: 5,
  /** 6.14.104 (AA3, AA-5) : poids du tirage de rareté d'un plan (relatifs). */
  rarityWeights: { common: 60, rare: 28, epic: 10, legendary: 2 } as Record<ModuleRarity, number>,
  /** 6.14.104 (AA3, AA-5) : Ambre rendue au recyclage d'un plan, par rareté. */
  recycleAmber: { common: 1, rare: 3, epic: 8, legendary: 20 } as Record<ModuleRarity, number>,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const MODULE_RULES_META = {
  slotsPerClass: { label: "Emplacements de module par classe", min: 0, max: 6, hint: "En baisser vide les emplacements en trop." },
  maxItems: { label: "Inventaire de modules, au plus", min: 1, max: 500 },
  fuseCount: { label: "Plans identiques pour une fusion", min: 2, max: 10 },
  maxPresets: { label: "Préréglages de modules", min: 0, max: 20 },
  rarityWeights: { label: "Tirage d'un plan : poids de chaque rareté", hint: "Poids relatifs (60 / 28 / 10 / 2 = 60 % de communs). Au moins un poids positif." },
  recycleAmber: { label: "Recyclage d'un plan : Ambre par rareté", unit: "Ambre" },
};

type ModuleTone = "neutral" | "accent" | "violet" | "gold";
const nonNegative = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
/** 6.14.104 (AA3, AA-5) : poids et Ambre de recyclage lus dans MODULE_RULES (admin, Modules de vaisseaux) ; ids en dur. */
const rarity = (id: ModuleRarity, label: string, tone: ModuleTone) => ({
  id,
  label,
  tone,
  get weight() {
    return nonNegative(MODULE_RULES.rarityWeights[id]);
  },
  get recycleAmber() {
    return Math.floor(nonNegative(MODULE_RULES.recycleAmber[id]));
  },
});

export const MODULE_RARITIES: { id: ModuleRarity; label: string; weight: number; tone: ModuleTone; recycleAmber: number }[] = [
  rarity("common", "Commun", "neutral"),
  rarity("rare", "Rare", "accent"),
  rarity("epic", "Épique", "violet"),
  rarity("legendary", "Légendaire", "gold"),
];

const familyDef = (id: string, label: string, stat: EffectStat, classes: UnitClass[], values: [number, number, number, number], phrase: string): ModuleFamilyDef => ({
  id,
  label,
  stat,
  classes,
  values: { common: values[0], rare: values[1], epic: values[2], legendary: values[3] },
  phrase,
});

/** Familles livrées (valeurs de 6.14.104). */
export const DEFAULT_MODULE_FAMILIES: ModuleFamilyDef[] = [
  familyDef("armement", "Armement", "unitAttack", ["light", "medium", "heavy"], [0.04, 0.07, 0.11, 0.16], "+{pct} d'attaque de la classe"),
  familyDef("blindage", "Blindage", "unitHp", ["light", "medium", "heavy"], [0.05, 0.08, 0.12, 0.18], "+{pct} de points de vie de la classe"),
  familyDef("soute", "Soute", "cargo", ["support"], [0.04, 0.07, 0.11, 0.16], "+{pct} de soute"),
  familyDef("propulsion", "Propulsion", "fleetSpeed", ["support"], [0.03, 0.05, 0.08, 0.12], "−{pct} de temps de vol"),
  familyDef("voile", "Voile furtif", "counterSpy", ["support"], [1, 2, 3, 4], "+{value} niveau{x} de contre-espionnage"),
];

/** Modèles livrés (7). */
export const DEFAULT_MODULE_TEMPLATES: ModuleTemplate[] = [
  { id: "canons_surcharges", name: "Canons surchargés", family: "armement", description: "Batteries poussées au-delà des normes : plus de dégâts, plus de chaleur." },
  { id: "matrice_de_visee", name: "Matrice de visée", family: "armement", description: "Calculateur balistique récupéré sur une épave pirate." },
  { id: "blindage_reactif", name: "Blindage réactif", family: "blindage", description: "Plaques qui explosent vers l'extérieur sous l'impact." },
  { id: "champ_dissipateur", name: "Champ dissipateur", family: "blindage", description: "Fine bulle d'énergie qui étale les coups sur toute la coque." },
  { id: "soute_modulaire", name: "Soute modulaire", family: "soute", description: "Cloisons repliables : chaque recoin devient de la place." },
  { id: "post_combustion", name: "Post-combustion", family: "propulsion", description: "Réacteurs gavés de carburant instable : on arrive plus tôt." },
  { id: "voile_furtif", name: "Voile furtif", family: "voile", description: "Brouille les sondes adverses autour de la flotte de soutien." },
];

export interface ModuleFamilyInfo extends ModuleFamilyDef {
  /** pct : valeur en part ; level : niveaux (ou points). */
  unit: "pct" | "level";
}

const familyInfo = (d: ModuleFamilyDef): ModuleFamilyInfo => ({
  ...structuredClone(d),
  values: { common: nonNegative(d.values?.common), rare: nonNegative(d.values?.rare), epic: nonNegative(d.values?.epic), legendary: nonNegative(d.values?.legendary) },
  unit: EFFECT_STATS[d.stat]?.unit === "pct" ? "pct" : "level",
});

/** Familles en vigueur, par identifiant (posées par `setModuleContent`). */
export const MODULE_FAMILIES: Record<ModuleFamily, ModuleFamilyInfo> = Object.fromEntries(DEFAULT_MODULE_FAMILIES.map((f) => [f.id, familyInfo(f)]));

/** Modèles en vigueur (posés par `setModuleContent`). */
export const MODULE_TEMPLATES: ModuleTemplate[] = structuredClone(DEFAULT_MODULE_TEMPLATES);

/** 6.14.127 (AA9) : pose les familles et modèles en vigueur (depuis `applyGameContent`). */
export function setModuleContent(families: ModuleFamilyDef[], templates: ModuleTemplate[]): void {
  for (const k of Object.keys(MODULE_FAMILIES)) delete MODULE_FAMILIES[k];
  for (const f of families) MODULE_FAMILIES[f.id] = familyInfo(f);
  MODULE_TEMPLATES.splice(0, MODULE_TEMPLATES.length, ...templates);
}

/** Liste enregistrée complétée des éléments livrés absents (un élément livré se retire, il ne disparaît pas). */
function withDefaults<T extends { id: string }>(list: unknown, defaults: T[]): T[] {
  const saved = Array.isArray(list) ? (list as T[]).filter((x) => !!x && typeof x === "object") : [];
  const ids = new Set(saved.map((x) => x.id));
  return [...saved, ...defaults.filter((d) => !ids.has(d.id))];
}

/** 6.14.127 (AA9) : familles enregistrées + familles livrées absentes. `legacyValues` : ancien `rules.modules.familyValues`
 *  (6.14.104), lu tant que la section n'est pas enregistrée (migration « module-families-6.14.127 »). */
export function withDefaultModuleFamilies(list: unknown, legacyValues?: unknown): ModuleFamilyDef[] {
  const out = withDefaults(list, DEFAULT_MODULE_FAMILIES);
  if (Array.isArray(list) || !legacyValues || typeof legacyValues !== "object") return out;
  const legacy = legacyValues as Record<string, Record<string, unknown>>;
  return out.map((f) => {
    const v = legacy[f.id];
    if (!v || typeof v !== "object") return f;
    const values = { ...f.values };
    for (const r of ["common", "rare", "epic", "legendary"] as ModuleRarity[]) if (v[r] !== undefined) values[r] = nonNegative(v[r]);
    return { ...f, values };
  });
}

export function withDefaultModuleTemplates(list: unknown): ModuleTemplate[] {
  return withDefaults(list, DEFAULT_MODULE_TEMPLATES);
}

/** Valeur d'un module au plus : grandeur en part 1 (+100 %), en niveaux ou en points 20. */
export function moduleValueMax(stat: EffectStat): number {
  return EFFECT_STATS[stat]?.unit === "pct" ? 1 : 20;
}

const CLASS_LABELS: Record<UnitClass, string> = { support: "Soutien", light: "Faible", medium: "Moyen", heavy: "Fort" };

/** « le Soutien », « les classes Faible, Moyen ou Fort ». */
export function moduleClassesText(classes: UnitClass[]): string {
  if (classes.length === 1) return classes[0] === "support" ? "le Soutien" : `la classe ${CLASS_LABELS[classes[0]]}`;
  const names = classes.map((c) => CLASS_LABELS[c] ?? c);
  return `les classes ${names.slice(0, -1).join(", ")} ou ${names[names.length - 1]}`;
}

/** 6.14.133 (AJ27-10) : erreurs des réglages des plans signature (familles connues, rareté connue). */
export function validateSignatureRules(r: Partial<typeof SIGNATURE_MODULE_RULES> | undefined, familyIds: string[]): string[] {
  if (!r) return [];
  const e: string[] = [];
  const L = "Plans signature";
  if (r.minRarity !== undefined && !MODULE_RARITIES.some((x) => x.id === r.minRarity)) e.push(`${L} : rareté minimale « ${String(r.minRarity)} » inconnue (common, rare, epic, legendary).`);
  for (const k of ["attackFamily", "supportFamily"] as const) if (r[k] !== undefined && !familyIds.includes(String(r[k]))) e.push(`${L} : famille « ${String(r[k])} » inconnue.`);
  if (r.excluded !== undefined && !(Array.isArray(r.excluded) && r.excluded.every((x) => typeof x === "string"))) e.push(`${L} : unités exclues, une liste d'identifiants.`);
  return e;
}

/** Erreurs des sections `moduleFamilies` et `moduleTemplates`. */
export function validateModuleContent(families: unknown, templates: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(families)) return ["Familles de modules : la section doit être une liste."];
  if (!Array.isArray(templates)) return ["Modèles de modules : la section doit être une liste."];
  const famIds = new Set<string>();
  for (const f of families as Partial<ModuleFamilyDef>[]) {
    const label = `Famille de modules ${f?.label || f?.id || "?"}`;
    if (!f || typeof f.id !== "string" || !/^[A-Za-z0-9_]+$/.test(f.id)) errors.push(`${label} : identifiant invalide (lettres, chiffres, _).`);
    else if (famIds.has(f.id)) errors.push(`Familles de modules : identifiant « ${f.id} » en double.`);
    else famIds.add(f.id);
    if (!f) continue;
    if (typeof f.label !== "string" || !f.label.trim()) errors.push(`${label} : nom manquant.`);
    if (!f.stat || !(f.stat in EFFECT_STATS)) {
      errors.push(`${label} : grandeur « ${String(f.stat)} » inconnue.`);
      continue;
    }
    if (f.stat === "production" || f.stat === "hangarCapacity") errors.push(`${label} : cette grandeur demande une cible (ressource ou hangar), choisis-en une autre.`);
    if (!Array.isArray(f.classes) || f.classes.length === 0 || f.classes.some((c) => !MODULE_CLASSES.includes(c))) errors.push(`${label} : au moins une classe (light, medium, heavy, support).`);
    else if (new Set(f.classes).size !== f.classes.length) errors.push(`${label} : classe en double.`);
    const max = moduleValueMax(f.stat);
    for (const r of ["common", "rare", "epic", "legendary"] as ModuleRarity[]) {
      const v = f.values?.[r];
      if (!(typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max)) errors.push(`${label} : valeur « ${r} » entre 0 et ${max}.`);
    }
    if (f.phrase !== undefined && typeof f.phrase !== "string") errors.push(`${label} : tournure du texte invalide.`);
  }
  const tplIds = new Set<string>();
  for (const t of templates as Partial<ModuleTemplate>[]) {
    const label = `Modèle de module ${t?.name || t?.id || "?"}`;
    if (!t || typeof t.id !== "string" || !/^[A-Za-z0-9_]+$/.test(t.id)) errors.push(`${label} : identifiant invalide (lettres, chiffres, _).`);
    else if (tplIds.has(t.id)) errors.push(`Modèles de modules : identifiant « ${t.id} » en double.`);
    else tplIds.add(t.id);
    if (!t) continue;
    if (typeof t.name !== "string" || !t.name.trim()) errors.push(`${label} : nom manquant.`);
    if (typeof t.description !== "string") errors.push(`${label} : texte manquant.`);
    if (!famIds.has(String(t.family))) errors.push(`${label} : famille « ${String(t.family)} » inconnue.`);
    if (t.retired !== undefined && typeof t.retired !== "boolean") errors.push(`${label} : « retiré » doit être oui ou non.`);
    // 6.14.133 (AJ27-10) : `sig_…` est réservé aux plans signature (générés depuis les unités).
    if (typeof t.id === "string" && t.id.startsWith(SIGNATURE_PREFIX)) errors.push(`${label} : identifiant réservé aux plans signature (« ${SIGNATURE_PREFIX}… »).`);
  }
  if (!(templates as Partial<ModuleTemplate>[]).some((t) => t && !t.retired)) errors.push("Modèles de modules : au moins un modèle non retiré (le tirage des plans en a besoin).");
  return errors;
}

export const MODULE_BUILD_COST: Record<ModuleRarity, Partial<Record<ResourceId, number>>> = {
  common: { scrap: 20_000, energy: 10_000, nano: 5_000 },
  rare: { scrap: 60_000, energy: 30_000, nano: 15_000 },
  epic: { scrap: 180_000, energy: 90_000, nano: 45_000, data: 5_000 },
  legendary: { scrap: 500_000, energy: 250_000, nano: 120_000, data: 20_000 },
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const MODULE_BUILD_COST_META = {
  common: { label: "Module commun", hint: "Ressources par fabrication." },
  rare: { label: "Module rare", hint: "Ressources par fabrication." },
  epic: { label: "Module épique", hint: "Ressources par fabrication." },
  legendary: { label: "Module légendaire", hint: "Ressources par fabrication." },
};

/* ---------- 6.14.133 (AU27, AJ27-10, AJ-1, Q65) : plans de module « signature », un par unité ---------- */

/**
 * Un plan rare ou mieux sort parfois « signature » : il vise une seule unité (`unit:<id>`) au lieu d'une classe, avec la valeur
 * de sa famille × `factor` (armement pour une unité qui tire, blindage sinon), et se monte sur la classe de cette unité. Un
 * modèle par unité du contenu en vigueur (une unité ajoutée dans l'admin a le sien, `sig_<unité>`), sans entrée dans la section
 * des modèles. Valeurs littérales (CLAUDE.md, initialisation des modules) ; les textes acceptent `{name}`, `{class}`, `{pct}`.
 */
export const SIGNATURE_MODULE_RULES = {
  enabled: true,
  /** Part des plans de la rareté minimale ou mieux qui sortent « signature ». */
  chance: 0.15,
  minRarity: "rare" as ModuleRarity,
  /** Valeur = valeur de la famille × ce facteur (une unité au lieu d'une classe entière). 1,25 : +20 % d'attaque en légendaire. */
  factor: 1.25,
  attackFamily: "armement",
  supportFamily: "blindage",
  /** Unités sans plan signature, en plus de celles qui ont déjà une relique propre (le Sceau des Sentinelles). */
  excluded: [] as string[],
  name: "Signature : {name}",
  description: "Plan forgé pour une seule coque : {name}. Il se monte sur sa classe ({class}).",
  attackPhrase: "+{pct} d'attaque pour {name}",
  hpPhrase: "+{pct} de points de vie pour {name}",
};

export const SIGNATURE_MODULE_RULES_META = {
  enabled: { label: "Plans signature (un par unité)", hint: "Décoché : plus aucun plan signature ne tombe ; ceux déjà trouvés gardent leur effet." },
  chance: { label: "Part des plans qui sortent « signature »", unit: "part", min: 0, max: 1, hint: "Parmi les plans de la rareté minimale ou mieux (0,15 = 15 %)." },
  minRarity: { label: "Rareté minimale d'un plan signature", hint: "common, rare, epic ou legendary." },
  factor: { label: "Valeur d'un plan signature (× sa famille)", unit: "×", min: 0, max: 5, hint: "Reste sous les plafonds du circuit d'effets (rapport d'impact)." },
  attackFamily: { label: "Famille d'une unité qui tire", hint: "Identifiant d'une famille de modules (armement)." },
  supportFamily: { label: "Famille d'une unité sans attaque", hint: "Identifiant d'une famille de modules (blindage)." },
  excluded: { label: "Unités sans plan signature", hint: "Identifiants d'unités. Une unité visée par une relique propre (Sceau des Sentinelles) n'en a pas non plus : les deux se cumuleraient au-delà du plafond." },
  name: { label: "Nom d'un plan signature", hint: "{name} : nom de l'unité." },
  description: { label: "Texte d'un plan signature", hint: "{name} : unité ; {class} : sa classe." },
  attackPhrase: { label: "Effet d'attaque d'un plan signature", hint: "{pct} : valeur ; {name} : unité." },
  hpPhrase: { label: "Effet de points de vie d'un plan signature", hint: "{pct} : valeur ; {name} : unité." },
};

export const SIGNATURE_PREFIX = "sig_";

const fillText = (text: string, vars: Record<string, string>) => Object.entries(vars).reduce((t, [k, v]) => t.split(`{${k}}`).join(v), String(text ?? ""));

/** Unités qui ont un plan signature : contenu en vigueur, hors exclues et hors celles qu'une relique active vise déjà (porteur
 *  propre : les deux se cumuleraient au-delà du plafond) ; vide si désactivé. */
export function signatureUnits(): string[] {
  if (SIGNATURE_MODULE_RULES.enabled === false || !Array.isArray(UNITS)) return [];
  const excluded = new Set(Array.isArray(SIGNATURE_MODULE_RULES.excluded) ? SIGNATURE_MODULE_RULES.excluded : []);
  for (const r of Array.isArray(RELICS) ? RELICS : []) {
    const target = r.disabled || r.effect !== "custom" ? "" : String(r.custom?.target ?? "");
    if (target.startsWith("unit:")) excluded.add(target.slice(5));
  }
  return UNITS.filter((u) => !excluded.has(u.id)).map((u) => u.id);
}

/** Unité visée par un modèle signature (`sig_<unité>`), null sinon. */
function signatureUnitOf(templateId: string): string | null {
  return typeof templateId === "string" && templateId.startsWith(SIGNATURE_PREFIX) && templateId.length > SIGNATURE_PREFIX.length ? templateId.slice(SIGNATURE_PREFIX.length) : null;
}

/** Modèle signature d'une unité (toujours résolu, même pour une unité retirée : un plan trouvé ne disparaît pas, I43). */
export function signatureTemplate(unitId: string): ModuleTemplate {
  const u = UNITS.find((x) => x.id === unitId);
  const family = u && !(u.stats.attaque > 0) ? SIGNATURE_MODULE_RULES.supportFamily : SIGNATURE_MODULE_RULES.attackFamily;
  const cls = u ? unitClasses()[u.id] : undefined;
  const vars = { name: u?.name ?? unitId, class: cls ? UNIT_CLASS_LABELS[cls] : "—" };
  return { id: `${SIGNATURE_PREFIX}${unitId}`, name: fillText(SIGNATURE_MODULE_RULES.name, vars), family, description: fillText(SIGNATURE_MODULE_RULES.description, vars), unit: unitId };
}

/** Classes où un module se monte : celles de sa famille, ou la classe de son unité pour un plan signature. */
export function moduleMountClasses(t: Pick<ModuleTemplate, "family" | "unit"> | undefined): UnitClass[] {
  if (!t) return [];
  if (t.unit) {
    const cls = UNITS.some((u) => u.id === t.unit) ? unitClasses()[t.unit] : undefined;
    return cls ? [cls] : [];
  }
  return MODULE_FAMILIES[t.family]?.classes ?? [];
}

/** 6.14.132 (AJ27-9) : image d'un modèle (livré : la sienne ; ajouté dans l'admin ou signature : l'image des plans signature,
 *  provisoire jusqu'au rendu, `scripts/illustrations.json`). */
export function moduleImage(id: string): string {
  return DEFAULT_MODULE_TEMPLATES.some((t) => t.id === id) ? `/assets/modules/${id}.webp` : "/assets/modules/signature.webp";
}

export function findModuleTemplate(id: string): ModuleTemplate | undefined {
  const found = MODULE_TEMPLATES.find((t) => t.id === id);
  if (found) return found;
  // 6.14.133 (AJ27-10) : plan signature, généré depuis son unité.
  const unit = signatureUnitOf(id);
  return unit ? signatureTemplate(unit) : undefined;
}

export function moduleRarity(id: ModuleRarity) {
  return MODULE_RARITIES.find((r) => r.id === id) ?? MODULE_RARITIES[0];
}

export function moduleValue(item: Pick<ModuleItem, "template" | "rarity">): number {
  const t = findModuleTemplate(item.template);
  const v = t ? (MODULE_FAMILIES[t.family]?.values[item.rarity] ?? 0) : 0;
  // 6.14.133 (AJ27-10) : un plan signature vaut sa famille × le facteur (arrondi au dix-millième).
  if (t?.unit) return Math.round(v * Math.max(0, Number(SIGNATURE_MODULE_RULES.factor) || 0) * 10_000) / 10_000;
  return v;
}

export function moduleLabel(item: Pick<ModuleItem, "template" | "rarity">): string {
  return `${findModuleTemplate(item.template)?.name ?? item.template} (${moduleRarity(item.rarity).label.toLowerCase()})`;
}

/** « +11 % d'attaque » / « +2 niveaux de contre-espionnage » (tournure de la famille). */
export function describeModule(item: Pick<ModuleItem, "template" | "rarity">): string {
  const t = findModuleTemplate(item.template);
  const fam = t ? MODULE_FAMILIES[t.family] : undefined;
  if (!t || !fam) return "";
  const v = moduleValue(item);
  if (t.unit) {
    // 6.14.133 (AJ27-10) : plan signature : effet sur son unité.
    const name = UNITS.find((u) => u.id === t.unit)?.name ?? t.unit;
    const phrase = fam.stat === "unitAttack" ? SIGNATURE_MODULE_RULES.attackPhrase : fam.stat === "unitHp" ? SIGNATURE_MODULE_RULES.hpPhrase : "";
    if (phrase) return fillText(phrase, { pct: `${Math.round(v * 100)} %`, name });
    return describeEffect(fam.stat, v, `unit:${t.unit}`).replace(" · ", " ");
  }
  if (!fam.phrase) return describeEffect(fam.stat, v).replace(" · ", " ");
  return fam.phrase
    .split("{pct}")
    .join(`${Math.round(v * 100)} %`)
    .split("{value}")
    .join(String(v).replace(".", ","))
    .split("{x}")
    .join(v > 1 ? "x" : "");
}

const emptySlots = (): ModulesState["slots"] => ({ light: [null, null], medium: [null, null], heavy: [null, null], support: [null, null] });

export function modulesState(player: Pick<PlayerState, "modules">): ModulesState {
  const raw = (player.modules ?? {}) as Partial<ModulesState>;
  const items = (Array.isArray(raw.items) ? raw.items : []).filter(
    (m): m is ModuleItem => !!m && typeof m.id === "string" && !!findModuleTemplate(m.template) && MODULE_RARITIES.some((r) => r.id === m.rarity),
  );
  const ids = new Set(items.filter((m) => m.built).map((m) => m.id));
  const slots = emptySlots();
  for (const cls of MODULE_CLASSES) {
    const list = Array.isArray(raw.slots?.[cls]) ? raw.slots![cls] : [];
    slots[cls] = Array.from({ length: MODULE_RULES.slotsPerClass }, (_, i) => (list[i] && ids.has(list[i]!) ? list[i]! : null));
  }
  const presets = (Array.isArray(raw.presets) ? raw.presets : [])
    .filter((p): p is ModulePreset => !!p && typeof p.name === "string" && !!p.slots && typeof p.slots === "object")
    .slice(0, MODULE_RULES.maxPresets)
    .map((p) => {
      const ps = emptySlots();
      for (const cls of MODULE_CLASSES) {
        const list = Array.isArray(p.slots[cls]) ? p.slots[cls] : [];
        ps[cls] = Array.from({ length: MODULE_RULES.slotsPerClass }, (_, i) => (typeof list[i] === "string" ? list[i] : null));
      }
      return { name: p.name.slice(0, 24), slots: ps };
    });
  return presets.length ? { items, slots, presets } : { items, slots };
}

/** Classe où un module est monté (null s'il est libre). */
export function mountedOn(st: ModulesState, id: string): UnitClass | null {
  return MODULE_CLASSES.find((c) => st.slots[c].includes(id)) ?? null;
}

/** Effets des modules montés (couche empire, ciblés par classe pour l'armement et le blindage). */
export function moduleEffects(player: Pick<PlayerState, "modules">): EffectGrant[] {
  const st = modulesState(player);
  const out: EffectGrant[] = [];
  for (const cls of MODULE_CLASSES) {
    for (const id of st.slots[cls]) {
      const item = id ? st.items.find((m) => m.id === id) : undefined;
      const t = item ? findModuleTemplate(item.template) : undefined;
      if (!item || !t) continue;
      const fam = MODULE_FAMILIES[t.family];
      if (!fam) continue;
      // 6.14.133 (AJ27-10) : plan signature : vise son unité (monté sur sa classe ; une unité retirée n'a plus d'effet à recevoir).
      if (t.unit) {
        if (EFFECT_STATS[fam.stat]?.unitTarget) out.push({ stat: fam.stat, target: `unit:${t.unit}`, value: moduleValue(item), layer: "empire", source: { kind: "module", id: item.id, label: moduleLabel(item) } });
        continue;
      }
      if (!fam.classes.includes(cls)) continue;
      // 6.14.127 (AA9) : une grandeur qui vise des unités vise la classe où le module est monté.
      out.push({ stat: fam.stat, ...(EFFECT_STATS[fam.stat]?.unitTarget ? { target: `class:${cls}` } : {}), value: moduleValue(item), layer: "empire", source: { kind: "module", id: item.id, label: moduleLabel(item) } });
    }
  }
  return out;
}

function newId(now: number, random: () => number): string {
  return `m${now.toString(36)}${Math.floor(random() * 1e9).toString(36)}`;
}

/** Tire un plan (rareté pondérée, au moins `minRarity`). */
export function rollModulePlan(source: string, now: number, random: () => number = Math.random, minRarity: ModuleRarity = "common"): ModuleItem {
  const min = MODULE_RARITIES.findIndex((r) => r.id === minRarity);
  const pool = MODULE_RARITIES.slice(Math.max(0, min));
  const total = pool.reduce((s, r) => s + r.weight, 0);
  let roll = random() * total;
  let rarity = pool[pool.length - 1].id;
  for (const r of pool) {
    if ((roll -= r.weight) < 0) {
      rarity = r.id;
      break;
    }
  }
  // 6.14.127 (AA9) : un modèle retiré ne sort plus (repli sur toute la liste si tous le sont : la garde de contenu l'interdit).
  const active = MODULE_TEMPLATES.filter((t) => !t.retired);
  const drawable = active.length > 0 ? active : MODULE_TEMPLATES;
  let template = drawable[Math.floor(random() * drawable.length) % drawable.length].id;
  // 6.14.133 (AU27, AJ27-10, Q65) : un plan de la rareté minimale ou mieux sort parfois « signature » (une unité tirée au hasard).
  // Tirages en plus seulement dans ce cas (chance nulle ou rareté trop basse : la suite du tirage d'avant ne change pas).
  const sigMin = MODULE_RARITIES.findIndex((r) => r.id === SIGNATURE_MODULE_RULES.minRarity);
  const chance = Math.max(0, Math.min(1, Number(SIGNATURE_MODULE_RULES.chance) || 0));
  if (chance > 0 && MODULE_RARITIES.findIndex((r) => r.id === rarity) >= Math.max(0, sigMin)) {
    const units = signatureUnits();
    if (units.length > 0 && random() < chance) template = `${SIGNATURE_PREFIX}${units[Math.floor(random() * units.length) % units.length]}`;
  }
  return { id: newId(now, random), template, rarity, built: false, foundAtMs: now, source };
}

/** 6.14.132 (AJ27-9) : modèle de module déjà trouvé (Codex « Arsenal »), gardé après un recyclage ou une vente. */
function markModuleSeen(player: Pick<PlayerState, "stats">, template: string): void {
  const seen = Array.isArray(player.stats?.moduleTemplatesSeen) ? player.stats!.moduleTemplatesSeen : [];
  if (!seen.includes(template)) player.stats = { ...(player.stats ?? {}), moduleTemplatesSeen: [...seen, template] } as PlayerState["stats"];
}

/** Modèles de modules trouvés par le joueur : ceux qu'il a vus, et ceux de son inventaire (joueurs d'avant la 6.14.132). */
export function modulesSeen(player: Pick<PlayerState, "stats" | "modules">): Set<string> {
  const out = new Set<string>(Array.isArray(player.stats?.moduleTemplatesSeen) ? player.stats!.moduleTemplatesSeen : []);
  const raw = (player.modules ?? {}) as Partial<ModulesState>;
  for (const m of Array.isArray(raw.items) ? raw.items : []) if (m && typeof m.template === "string") out.add(m.template);
  return out;
}

/** Ajoute un plan ou un module (false si l'inventaire est plein). */
export function addModuleItem(player: PlayerState, item: ModuleItem): boolean {
  const st = modulesState(player);
  if (st.items.length >= MODULE_RULES.maxItems) return false;
  st.items.push(item);
  player.modules = st;
  markModuleSeen(player, item.template);
  return true;
}

function find(st: ModulesState, id: unknown): ModuleItem {
  const item = st.items.find((m) => m.id === String(id));
  if (!item) throw new GameActionError("Module introuvable.");
  return item;
}

/** Fabrique un plan : paie le coût, le plan devient un module monté nulle part. */
export function buildModule(player: PlayerState, id: unknown, pay: (cost: Partial<Record<ResourceId, number>>) => void): ModuleItem {
  const st = modulesState(player);
  const item = find(st, id);
  if (item.built) throw new GameActionError("Ce module est déjà fabriqué.");
  pay(MODULE_BUILD_COST[item.rarity]);
  item.built = true;
  player.modules = st;
  return item;
}

export function mountModule(player: PlayerState, id: unknown, cls: unknown, slot: unknown): void {
  const st = modulesState(player);
  const item = find(st, id);
  if (!item.built) throw new GameActionError("Fabrique d'abord ce plan.");
  const c = String(cls) as UnitClass;
  if (!MODULE_CLASSES.includes(c)) throw new GameActionError("Classe inconnue.");
  const tpl = findModuleTemplate(item.template)!;
  const fam = MODULE_FAMILIES[tpl.family];
  if (!fam) throw new GameActionError("Famille de module inconnue.");
  const allowed = moduleMountClasses(tpl);
  if (tpl.unit && allowed.length === 0) throw new GameActionError(`${tpl.name} : cette unité n'existe plus, le plan ne se monte plus.`);
  if (!allowed.includes(c)) throw new GameActionError(`${tpl.unit ? tpl.name : fam.label} : se monte sur ${moduleClassesText(allowed)}.`);
  const i = Math.floor(Number(slot));
  if (!(i >= 0 && i < MODULE_RULES.slotsPerClass)) throw new GameActionError("Emplacement invalide.");
  // Déjà monté ailleurs : il change de place.
  for (const k of MODULE_CLASSES) st.slots[k] = st.slots[k].map((s) => (s === item.id ? null : s));
  st.slots[c][i] = item.id;
  player.modules = st;
}

export function unmountModule(player: PlayerState, cls: unknown, slot: unknown): void {
  const st = modulesState(player);
  const c = String(cls) as UnitClass;
  const i = Math.floor(Number(slot));
  if (!MODULE_CLASSES.includes(c) || !(i >= 0 && i < MODULE_RULES.slotsPerClass)) throw new GameActionError("Emplacement invalide.");
  st.slots[c][i] = null;
  player.modules = st;
}

/** Démonte puis recycle (plan ou module) contre de l'Ambre ; renvoie l'Ambre gagnée. */
export function recycleModule(player: PlayerState, id: unknown): number {
  const st = modulesState(player);
  const item = find(st, id);
  for (const k of MODULE_CLASSES) st.slots[k] = st.slots[k].map((s) => (s === item.id ? null : s));
  st.items = st.items.filter((m) => m.id !== item.id);
  player.modules = st;
  return moduleRarity(item.rarity).recycleAmber * (item.built ? 2 : 1);
}

/** Retire un plan de l'inventaire (mise aux enchères) ; renvoie le plan. */
export function takeModulePlan(player: PlayerState, id: unknown): ModuleItem {
  const st = modulesState(player);
  const item = find(st, id);
  if (item.built) throw new GameActionError("Seuls les plans (non fabriqués) se vendent aux enchères.");
  st.items = st.items.filter((m) => m.id !== item.id);
  player.modules = st;
  return item;
}

/* ---------- 5.26.2 : fusion des plans et préréglages de montage ---------- */

/** Rareté suivante (null au sommet). */
export function nextModuleRarity(r: ModuleRarity): ModuleRarity | null {
  const i = MODULE_RARITIES.findIndex((x) => x.id === r);
  return i >= 0 && i < MODULE_RARITIES.length - 1 ? MODULE_RARITIES[i + 1].id : null;
}

/** Groupes de plans fusionnables : même modèle, même rareté, au moins trois, pas légendaires. */
export function fusablePlanGroups(st: ModulesState): { template: string; rarity: ModuleRarity; ids: string[] }[] {
  const groups = new Map<string, { template: string; rarity: ModuleRarity; ids: string[] }>();
  for (const m of st.items) {
    if (m.built || !nextModuleRarity(m.rarity)) continue;
    const key = `${m.template}:${m.rarity}`;
    const g = groups.get(key) ?? { template: m.template, rarity: m.rarity, ids: [] };
    g.ids.push(m.id);
    groups.set(key, g);
  }
  return [...groups.values()].filter((g) => g.ids.length >= MODULE_RULES.fuseCount);
}

/** Fusionne trois plans identiques (non fabriqués) en un plan de la rareté supérieure. */
export function fuseModulePlans(player: PlayerState, ids: unknown, now: number, random: () => number = Math.random): ModuleItem {
  const st = modulesState(player);
  const list = Array.isArray(ids) ? [...new Set(ids.map(String))] : [];
  if (list.length !== MODULE_RULES.fuseCount) throw new GameActionError(`Choisis ${MODULE_RULES.fuseCount} plans identiques.`);
  const items = list.map((id) => find(st, id));
  if (items.some((m) => m.built)) throw new GameActionError("Seuls les plans (non fabriqués) se fusionnent.");
  const [first] = items;
  if (items.some((m) => m.template !== first.template || m.rarity !== first.rarity)) throw new GameActionError("Les trois plans doivent être identiques (même modèle, même rareté).");
  const next = nextModuleRarity(first.rarity);
  if (!next) throw new GameActionError("Un plan légendaire ne se fusionne plus.");
  const fused: ModuleItem = { id: newId(now, random), template: first.template, rarity: next, built: false, foundAtMs: now, source: "fusion" };
  st.items = [...st.items.filter((m) => !list.includes(m.id)), fused];
  player.modules = st;
  return fused;
}

/** Enregistre le montage actuel sous un nom (remplace un préréglage du même nom). */
export function saveModulePreset(player: PlayerState, nameIn: unknown): ModulePreset {
  const st = modulesState(player);
  const name = String(nameIn ?? "").trim().slice(0, 24);
  if (!name) throw new GameActionError("Nomme ce préréglage.");
  const presets = [...(st.presets ?? [])];
  const preset = { name, slots: JSON.parse(JSON.stringify(st.slots)) as ModulePreset["slots"] };
  const i = presets.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
  if (i >= 0) presets[i] = preset;
  else if (presets.length >= MODULE_RULES.maxPresets) throw new GameActionError(`${MODULE_RULES.maxPresets} préréglages au plus.`);
  else presets.push(preset);
  player.modules = { ...st, presets };
  return preset;
}

/** Applique un préréglage : les modules disparus (recyclés, vendus) laissent l'emplacement libre. */
export function applyModulePreset(player: PlayerState, index: unknown): { missing: number } {
  const st = modulesState(player);
  const preset = (st.presets ?? [])[Math.floor(Number(index))];
  if (!preset) throw new GameActionError("Préréglage introuvable.");
  const built = new Set(st.items.filter((m) => m.built).map((m) => m.id));
  let missing = 0;
  const slots = emptySlots();
  const used = new Set<string>();
  for (const cls of MODULE_CLASSES) {
    slots[cls] = preset.slots[cls].map((id) => {
      if (!id) return null;
      const item = st.items.find((m) => m.id === id);
      const tpl = item ? findModuleTemplate(item.template) : undefined;
      const fam = tpl ? MODULE_FAMILIES[tpl.family] : null;
      if (!item || !fam || !built.has(id) || used.has(id) || !moduleMountClasses(tpl).includes(cls)) {
        missing += 1;
        return null;
      }
      used.add(id);
      return id;
    });
  }
  player.modules = { ...st, slots };
  return { missing };
}

export function deleteModulePreset(player: PlayerState, index: unknown): void {
  const st = modulesState(player);
  const i = Math.floor(Number(index));
  if (!(st.presets ?? [])[i]) throw new GameActionError("Préréglage introuvable.");
  player.modules = { ...st, presets: st.presets!.filter((_, k) => k !== i) };
}

