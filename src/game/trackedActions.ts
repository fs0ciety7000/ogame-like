import type { PlayerState } from "@/types/game";

/* =====================================================
   6.14.121 (AU27, lot AP-L7, constat AP-10) : registre des actions suivies.

   Une seule liste des actions mesurables que les générateurs d'objectifs
   peuvent tirer : épisodes des Chroniques, défis du passe, saga d'alliance
   et objectifs du jour. Chaque entrée déclare :
   - son libellé, son verbe (archives), deux ordres (épisodes) ;
   - la page où elle se fait (jamais tirée quand la page est fermée : I31) ;
   - son système (chaîne de contenu), si elle est passive, si elle est
     « mesurée » (nouvelle ou tardive : elle n'entre dans un tirage commun
     que si la médiane du serveur l'atteint) ;
   - son poids, réglable dans l'admin (GameRules.trackedActions).
   Les 9 actions d'avant gardent leur ordre et leur poids 1 : à activité
   égale, les tirages ne changent pas. Les familles par contenu
   (`unit:<id>`, `research:<id>`, `building:<id>`) sont comptées dès
   6.14.121 et servent l'épisode « nouveauté » (6.14.122, AP-L8) ; leur
   poids dans les tirages communs reste 0 (objectifs paramétrés : AJ27-7).
   Module feuille : aucun import à l'exécution (pas de cycle). Les noms des
   contenus viennent d'un résolveur posé par content.ts.
===================================================== */

/** Les 9 actions d'avant 6.14.121 (ordre des tirages d'origine). */
export type BaseObjective = "contract" | "bounty" | "raidRepelled" | "victory" | "bossAssault" | "mission" | "spy" | "market" | "warlordWin";
/** 6.14.121 : lune, phalange, porte de saut, colonies. */
export type NewObjective = "moonUpgrade" | "phalanxScan" | "gateJump" | "colonyConvoy" | "colonyBase" | "colonySpec";
export type StaticObjective = BaseObjective | NewObjective;
/** Familles par contenu : une action par unité, techno ou bâtiment. */
export type ContentFamily = "unit" | "research" | "building";
export type ContentObjective = `${ContentFamily}:${string}`;
/** Toute action suivie (objectif d'épisode, défi de palier, objectif de saga). */
export type TrackedKey = StaticObjective | ContentObjective;

export interface TrackedActionDef {
  key: StaticObjective;
  /** Système du jeu (chaîne de contenu, WORKFLOW §7). */
  system: string;
  /** Libellé court (« Combats gagnés »), suivi de « x / y » à l'écran. */
  label: string;
  /** Verbe des archives, au passé composé, avec `{n}` (« gagné {n} combats »). */
  deed: string;
  /** Ordres de l'allié dans un épisode, avec `{count}` et `{s}` (pluriel). */
  orders: [string, string];
  /** Page où l'action se fait (« J'y vais », menu progressif I30/I31). */
  page: string;
  /** Le joueur ne la déclenche pas à volonté (attaque subie, seigneur, boss). */
  passive: boolean;
  /** Nouvelle ou tardive : n'entre dans un tirage commun que si la médiane du serveur atteint `measuredMinWeekly`. */
  measured: boolean;
  /** Version d'entrée dans le registre. */
  since: string;
  /** Type d'objectif du jour qui la compte (absent : aucun). */
  contract?: string;
}

const def = (key: StaticObjective, system: string, label: string, deed: string, orders: [string, string], page: string, o: Partial<Pick<TrackedActionDef, "passive" | "measured" | "since" | "contract">> = {}): TrackedActionDef => ({
  key,
  system,
  label,
  deed,
  orders,
  page,
  passive: o.passive ?? false,
  measured: o.measured ?? false,
  since: o.since ?? "4.3",
  ...(o.contract ? { contract: o.contract } : {}),
});

/** Registre (valeurs littérales : rien n'est lu au chargement du module). */
export const TRACKED_ACTIONS: Record<StaticObjective, TrackedActionDef> = {
  contract: def("contract", "quotidien", "Objectifs du jour récupérés", "rempli {n} contrats", ["Tiens tes objectifs du jour : {count} rempli{s}, et nos routes tiendront.", "Il nous faut des réserves. Remplis {count} objectif{s} du jour avant qu'ils ne coupent les routes."], "/game/ordres"),
  bounty: def("bounty", "primes", "Primes Kesh'Vaar remplies", "rempli {n} primes Kesh'Vaar", ["L'Essaim a des cibles pour toi : remplis {count} prime{s} Kesh'Vaar.", "Chaque fugitif ramené les prive d'un pilote. {count} prime{s}, commandant."], "/game/primes"),
  raidRepelled: def("raidRepelled", "menaces", "Raids de faction repoussés", "repoussé {n} raids de faction", ["Ils vont tester nos défenses. Repousse {count} raid{s} et ils comprendront.", "Tiens la ligne : {count} raid{s} repoussé{s}, pas un de moins."], "/game/menaces", { passive: true }),
  victory: def("victory", "combat", "Combats gagnés", "gagné {n} combats", ["Montre au secteur qu'on peut les battre : gagne {count} combat{s}.", "La peur doit changer de camp : {count} victoire{s}, et le secteur relèvera la tête."], "/game/galaxie"),
  bossAssault: def("bossAssault", "boss", "Assauts sur un boss", "mené {n} assauts", ["Frappe le boss {count} fois.", "{count} assauts sur le boss."], "/game/boss", { passive: true }),
  mission: def("mission", "missions", "Missions terminées", "terminé {n} missions", ["Fouille les confins : {count} mission{s}, et chaque piste nous rapproche.", "Envoie tes équipes en mission, {count} fois. Les indices sont là-bas."], "/game/missions"),
  spy: def("spy", "espionnage", "Sondes d'espionnage lancées", "lancé {n} sondes", ["Sonde le secteur : {count} sonde{s}, et nous saurons qui leur parle.", "Je veux des yeux partout. Lance {count} sonde{s} d'espionnage."], "/game/galaxie"),
  market: def("market", "commerce", "Offres achetées au marché", "conclu {n} achats au marché", ["Les marchands parlent quand on leur achète. {count} achat{s} au marché.", "Suis l'argent : achète {count} offre{s} au marché et regarde qui vend."], "/game/commerce"),
  warlordWin: def("warlordWin", "seigneurs", "Seigneurs de guerre pillés", "pillé {n} seigneurs de guerre", ["Les seigneurs de guerre leur servent de rabatteurs. Pille-en {count}.", "Frappe {count} seigneur{s} de guerre : qu'ils sachent ce que coûte la trahison."], "/game/seigneurs", { passive: true }),
  // 6.14.121 (AP-L7) : lune, phalange, porte de saut.
  moonUpgrade: def("moonUpgrade", "lune", "Améliorations de lune", "amélioré {n} fois leur lune", ["Ta lune peut voir plus loin. Améliore-la {count} fois.", "Renforce ta lune : {count} amélioration{s}, et rien ne nous échappera."], "/game/statistiques", { measured: true, since: "6.14.121" }),
  phalanxScan: def("phalanxScan", "lune", "Balayages de phalange", "lancé {n} balayages de phalange", ["Ceux qui t'attaquent se croient invisibles. Balaie-les {count} fois à la phalange.", "Quand ils viennent, ta phalange doit parler : {count} balayage{s}."], "/game/menaces", { passive: true, measured: true, since: "6.14.121" }),
  gateJump: def("gateJump", "lune", "Sauts par la porte", "fait {n} sauts par la porte", ["La porte de saut raccourcit tout. Ramène {count} flotte{s} par elle.", "Use la porte : {count} saut{s}, et nos flottes seront partout à temps."], "/game/galaxie", { measured: true, since: "6.14.121", contract: "gate_jump" }),
  // 6.14.121 (AP-L7) : colonies (convois, base avancée, spécialisation).
  colonyConvoy: def("colonyConvoy", "colonies", "Convois de colonie arrivés", "fait arriver {n} convois de colonie", ["Nos colonies doivent nourrir l'effort. Fais arriver {count} convoi{s}.", "Chaque convoi compte : {count} arrivée{s} sur tes routes de colonie."], "/game/colonies", { measured: true, since: "6.14.121", contract: "colony_convoy" }),
  colonyBase: def("colonyBase", "colonies", "Bases avancées tenues", "tenu {n} bases avancées", ["Tiens un avant-poste : {count} base{s} avancée{s} jusqu'au bout de leur séjour.", "Une base avancée qui tient vaut une flotte. Tiens-en {count}."], "/game/colonies", { measured: true, since: "6.14.121" }),
  colonySpec: def("colonySpec", "colonies", "Colonies spécialisées", "spécialisé {n} colonies", ["Donne une vocation à tes mondes : spécialise {count} colonie{s}.", "Chaque colonie doit choisir sa voie : {count} spécialisation{s}."], "/game/colonies", { measured: true, since: "6.14.121" }),
};

/** Ordre d'origine des 9 actions (tirages d'avant 6.14.121). */
export const BASE_OBJECTIVES: BaseObjective[] = ["contract", "bounty", "raidRepelled", "victory", "bossAssault", "mission", "spy", "market", "warlordWin"];
/** Actions entrées en 6.14.121, dans l'ordre où les générateurs les ajoutent (toujours après celles d'avant). */
export const NEW_OBJECTIVES: NewObjective[] = ["moonUpgrade", "phalanxScan", "gateJump", "colonyConvoy", "colonyBase", "colonySpec"];
export const STATIC_OBJECTIVES: StaticObjective[] = [...BASE_OBJECTIVES, ...NEW_OBJECTIVES];
export const CONTENT_FAMILIES: ContentFamily[] = ["unit", "research", "building"];

/** Familles par contenu : libellé, verbe, ordres, page (`{name}` : nom du contenu). */
export const CONTENT_FAMILY_TEXTS: Record<ContentFamily, { label: string; deed: string; orders: [string, string]; page: string; system: string }> = {
  unit: { label: "Construire : {name}", deed: "lancé {n} × {name}", orders: ["Le chantier attend tes ordres : construis {count} × {name}.", "Il nous faut des {name}. Lance-en {count} au chantier."], page: "/game/unites", system: "unites" },
  research: { label: "Recherche : {name}", deed: "lancé {n} niveaux de {name}", orders: ["Le Labo tient une piste : lance {count} niveau{s} de {name}.", "{name} peut tout changer. {count} niveau{s} de recherche, commandant."], page: "/game/labo", system: "technologies" },
  building: { label: "Amélioration : {name}", deed: "lancé {n} améliorations de {name}", orders: ["Tes ingénieurs sont prêts : lance {count} amélioration{s} de {name}.", "{name} doit grandir : {count} amélioration{s}, et vite."], page: "/game/batiments", system: "batiments" },
};

/* ---------- réglages (registre des règles, Admin → Règles → Actions suivies) ---------- */

export const TRACKED_ACTION_RULES = {
  /** Faux : les générateurs ne tirent que les 9 actions d'avant (registre ignoré pour les nouvelles). */
  enabled: true,
  /** Poids de chaque action dans les tirages communs (Chroniques, défis du passe, saga) : multiplie le poids propre au générateur. 0 = jamais. */
  weights: {
    contract: 1,
    bounty: 1,
    raidRepelled: 1,
    victory: 1,
    bossAssault: 1,
    mission: 1,
    spy: 1,
    market: 1,
    warlordWin: 1,
    moonUpgrade: 1,
    phalanxScan: 1,
    gateJump: 1,
    colonyConvoy: 1,
    colonyBase: 1,
    colonySpec: 0,
  } as Record<string, number>,
  /** Poids des familles par contenu dans les tirages communs (0 : servies seulement par l'épisode « nouveauté »). */
  familyWeights: { unit: 0, research: 0, building: 0 } as Record<string, number>,
  /** Quantité de base d'une famille par contenu, pour une semaine de jeu (comme `chapterBaseCounts`). */
  familyBase: { unit: 10, research: 1, building: 1 } as Record<string, number>,
  /** Une action « mesurée » n'entre dans un tirage commun que si la médiane du serveur atteint ce nombre par semaine. */
  measuredMinWeekly: 0.5,
};

/** Libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const TRACKED_ACTION_RULES_META = {
  enabled: { label: "Actions suivies 6.14.121 dans les tirages", hint: "Décoché : Chroniques, passe, saga et objectifs du jour ne tirent que les actions d'avant la 6.14.121 (lune, phalange, porte de saut et colonies restent comptées)." },
  weights: { label: "Poids de chaque action dans les tirages communs", hint: "Multiplie le poids propre au générateur (Chroniques, défis du passe, saga). 0 = jamais tirée ; 1 = normal." },
  familyWeights: { label: "Poids des familles par contenu (unité, techno, bâtiment)", hint: "0 = jamais dans les tirages communs : ces actions servent l'épisode « nouveauté ». Objectifs paramétrés : lot AJ27-7." },
  familyBase: { label: "Quantité de base d'une famille par contenu (une semaine)", hint: "unit : unités lancées ; research : niveaux de recherche lancés ; building : améliorations lancées." },
  measuredMinWeekly: { label: "Médiane minimale d'une action « mesurée »", unit: "par semaine", min: 0, max: 50, hint: "Une action nouvelle ou tardive (lune, colonies) n'entre dans un tirage commun que si le joueur médian du serveur la fait au moins autant : sa page lui est donc ouverte (I31)." },
};

export function validateTrackedActionRules(r: Partial<typeof TRACKED_ACTION_RULES> | undefined): string[] {
  if (!r) return [];
  const e: string[] = [];
  const L = "Actions suivies";
  for (const [k, v] of Object.entries(r.weights ?? {})) {
    if (!isStaticObjective(k)) e.push(`${L} : action « ${k} » inconnue.`);
    else if (!(Number(v) >= 0 && Number(v) <= 100)) e.push(`${L} : poids de ${k} entre 0 et 100.`);
  }
  for (const [k, v] of Object.entries(r.familyWeights ?? {})) {
    if (!(CONTENT_FAMILIES as string[]).includes(k)) e.push(`${L} : famille « ${k} » inconnue.`);
    else if (!(Number(v) >= 0 && Number(v) <= 100)) e.push(`${L} : poids de la famille ${k} entre 0 et 100.`);
  }
  for (const [k, v] of Object.entries(r.familyBase ?? {})) {
    if (!(CONTENT_FAMILIES as string[]).includes(k)) e.push(`${L} : famille « ${k} » inconnue.`);
    else if (!(Number(v) >= 1 && Number(v) <= 10_000)) e.push(`${L} : quantité de base de ${k} entre 1 et 10 000.`);
  }
  return e;
}

/* ---------- clés ---------- */

const CONTENT_KEY = /^(unit|research|building):([0-9A-Za-z_-]{1,64})$/;

export function isStaticObjective(k: unknown): k is StaticObjective {
  return typeof k === "string" && Object.prototype.hasOwnProperty.call(TRACKED_ACTIONS, k);
}

export function isBaseObjective(k: unknown): k is BaseObjective {
  return typeof k === "string" && (BASE_OBJECTIVES as string[]).includes(k);
}

export function contentObjective(family: ContentFamily, id: string): ContentObjective {
  return `${family}:${id}`;
}

export function parseContentObjective(k: unknown): { family: ContentFamily; id: string } | null {
  if (typeof k !== "string") return null;
  const m = CONTENT_KEY.exec(k);
  return m ? { family: m[1] as ContentFamily, id: m[2] } : null;
}

/** Clé d'action valide (registre, ou famille par contenu bien formée : un contenu retiré ne rend pas un ancien chapitre invalide). */
export function isTrackedObjective(k: unknown): k is TrackedKey {
  return isStaticObjective(k) || parseContentObjective(k) !== null;
}

/* ---------- noms des contenus (résolveur posé par content.ts) ---------- */

export interface TrackedContentResolver {
  name: (family: ContentFamily, id: string) => string | null;
  ids: (family: ContentFamily) => string[];
}

let resolver: TrackedContentResolver | null = null;

export function setTrackedContentResolver(r: TrackedContentResolver | null): void {
  resolver = r;
}

export function contentName(family: ContentFamily, id: string): string {
  return resolver?.name(family, id) ?? id;
}

export function contentIds(family: ContentFamily): string[] {
  return resolver?.ids(family) ?? [];
}

/* ---------- lecture du registre ---------- */

const fillName = (text: string, name: string) => text.split("{name}").join(name);

export function objectiveLabel(k: TrackedKey | string): string {
  if (isStaticObjective(k)) return TRACKED_ACTIONS[k].label;
  const c = parseContentObjective(k);
  return c ? fillName(CONTENT_FAMILY_TEXTS[c.family].label, contentName(c.family, c.id)) : String(k);
}

export function objectiveDeed(k: TrackedKey): string {
  if (isStaticObjective(k)) return TRACKED_ACTIONS[k].deed;
  const c = parseContentObjective(k);
  return c ? fillName(CONTENT_FAMILY_TEXTS[c.family].deed, contentName(c.family, c.id)) : "fait {n} actions";
}

export function objectiveOrders(k: TrackedKey): string[] {
  if (isStaticObjective(k)) return TRACKED_ACTIONS[k].orders;
  const c = parseContentObjective(k);
  return c ? CONTENT_FAMILY_TEXTS[c.family].orders.map((o) => fillName(o, contentName(c.family, c.id))) : ["Accomplis {count} action{s}."];
}

export function objectivePage(k: TrackedKey | string): string | undefined {
  if (isStaticObjective(k)) return TRACKED_ACTIONS[k].page;
  const c = parseContentObjective(k);
  return c ? CONTENT_FAMILY_TEXTS[c.family].page : undefined;
}

export function objectiveSystem(k: TrackedKey): string {
  if (isStaticObjective(k)) return TRACKED_ACTIONS[k].system;
  const c = parseContentObjective(k);
  return c ? CONTENT_FAMILY_TEXTS[c.family].system : "";
}

export function objectivePassive(k: TrackedKey): boolean {
  return isStaticObjective(k) ? TRACKED_ACTIONS[k].passive : false;
}

/** Action « mesurée » : nouvelle, tardive ou par contenu (jamais tirée sans médiane suffisante du serveur). */
export function objectiveMeasured(k: TrackedKey): boolean {
  return isStaticObjective(k) ? TRACKED_ACTIONS[k].measured : true;
}

/** Libellés des actions du registre (ancien `OBJECTIVE_LABELS`). */
export function staticObjectiveLabels(): Record<StaticObjective, string> {
  return Object.fromEntries(STATIC_OBJECTIVES.map((k) => [k, TRACKED_ACTIONS[k].label])) as Record<StaticObjective, string>;
}

/** Poids global d'une action (réglage absent ou illisible : 1 pour une action du registre, celui de sa famille sinon). */
export function trackedWeight(k: TrackedKey): number {
  const r = TRACKED_ACTION_RULES;
  const c = parseContentObjective(k);
  const raw = c ? r.familyWeights?.[c.family] : r.weights?.[k];
  const w = Number(raw);
  if (!Number.isFinite(w)) return c ? 0 : 1;
  return Math.max(0, w);
}

/** Quantité de base d'une famille par contenu (une semaine). */
export function familyBase(family: ContentFamily): number {
  const n = Number(TRACKED_ACTION_RULES.familyBase?.[family]);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Les actions 6.14.121 entrent-elles dans les tirages ? */
export function trackedActionsEnabled(): boolean {
  return TRACKED_ACTION_RULES.enabled !== false;
}

/**
 * Actions ajoutées aux tirages communs après celles d'avant (toujours en fin de liste : l'ordre et le tirage d'origine ne changent
 * pas tant qu'elles ne sont pas jouables). Nouvelles actions du registre de poids > 0, puis familles par contenu de poids > 0.
 */
export function extraObjectives(): TrackedKey[] {
  if (!trackedActionsEnabled()) return [];
  const out: TrackedKey[] = NEW_OBJECTIVES.filter((k) => trackedWeight(k) > 0);
  for (const f of CONTENT_FAMILIES) if (trackedWeight(contentObjective(f, "x")) > 0) for (const id of contentIds(f)) out.push(contentObjective(f, id));
  return out;
}

/**
 * Une action « mesurée » est-elle jouable dans un tirage commun ? Sa médiane hebdomadaire doit atteindre `measuredMinWeekly`
 * (et rester non nulle) : le joueur médian la pratique, sa page lui est ouverte (I31). Une action d'avant : toujours vrai ici
 * (les générateurs gardent leurs propres seuils).
 */
export function measuredPlayable(k: TrackedKey, weeklyMedian: Partial<Record<string, number>>): boolean {
  if (!objectiveMeasured(k)) return true;
  const m = Number(weeklyMedian[k] ?? 0);
  return m > 0 && m >= Math.max(0, Number(TRACKED_ACTION_RULES.measuredMinWeekly) || 0);
}

/* ---------- comptage ---------- */

type TrackListener = (player: PlayerState, key: TrackedKey, now: number, times: number) => void;
const listeners: Record<string, TrackListener> = {};

/** Abonne un consommateur (Chroniques et passe, objectifs du jour) ; un même identifiant remplace le précédent. */
export function onTrackedAction(id: string, fn: TrackListener): void {
  listeners[id] = fn;
}

/** Compte une action suivie : épisodes ouverts, activité du mois (défis du passe, saga, médianes), objectif du jour lié. */
export function trackAction(player: PlayerState, key: TrackedKey, now: number, times = 1): void {
  if (!(times > 0) || !isTrackedObjective(key)) return;
  for (const fn of Object.values(listeners)) fn(player, key, now, times);
}

/* ---------- disponibilité pour un joueur (objectifs du jour) ---------- */

type Availability = (player: PlayerState) => boolean;
const availability: Partial<Record<StaticObjective, Availability>> = {};

/** Pose la condition d'une action (posée par son module : lune, colonies). */
export function setActionAvailability(key: StaticObjective, fn: Availability): void {
  availability[key] = fn;
}

/** Le joueur peut-il faire cette action aujourd'hui ? Une action sans condition posée n'est jamais proposée (prudent). */
export function actionAvailable(key: StaticObjective, player: PlayerState): boolean {
  const fn = availability[key];
  if (!fn) return false;
  try {
    return fn(player) === true;
  } catch {
    return false;
  }
}

/** Action du registre comptée par un type d'objectif du jour (ex. `gate_jump` → `gateJump`). */
export function actionOfContract(contractType: string): StaticObjective | null {
  for (const k of NEW_OBJECTIVES) if (TRACKED_ACTIONS[k].contract === contractType) return k;
  return null;
}
