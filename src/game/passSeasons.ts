import { COMMANDER_ROLES, setSeasonCommanders, type SeasonCommanderDef } from "@/game/commanders";
import { OBJECTIVE_LABELS, type ChronicleObjective } from "@/game/chronicles";
import { BASE_COUNTS, generatePass, seededRandom, type WorldDigest } from "@/game/procedural";
import { normalizeTierReqs, PASS_RULES, setPassSeasonOverrides, type MonthPass, type PassRequirement, type PassReward } from "@/game/seasonPass";
import { seasonLabel } from "@/game/seasons";
import { STORY_SPEAKERS, type Speaker, type StoryLine } from "@/game/story";
import { challengePool, computePointsPerTier, generateBudgetTiers, passGenRules, tiersValue } from "@/game/passGen";
import { defaultSimProfiles, profileFromMedian, simulatePass } from "@/game/passSimulator";
import { CATALOG_START, catalogEntryFor, catalogIndex, illustrationPrompt, portraitPrompt, THEME_PRIMARY } from "@/game/seasonCatalog";

/* =====================================================
   v5.13 : passes de saison procéduraux. Chaque mois, le moteur écrit un
   brouillon complet que l'équipe relit, retouche puis publie :
   - un thème (nom, accroche, couleur, illustration) : v5.14, celui du
     catalogue (seasonCatalog.ts, douze thèmes en rotation sur trois ans) ;
   - un scénario en quatre temps (prologue, paliers 10, 20 et 30) porté par
     un mentor et un rival ;
   - 30 paliers de récompenses (points par palier ajustés sur le mois écoulé) ;
   - un défi à chaque palier (v5.14.1) : un à trois prérequis, jamais deux fois
     le même, de plus en plus exigeant, relevés un palier à la fois ;
   - au dernier palier : un commandant de saison inédit (rôle principal +
     moitié d'un second rôle) et une forte somme d'Ambre.
   Seuls les passes publiés s'appliquent ; un brouillon oublié est publié
   d'office au début de son mois (tâche du générateur).
===================================================== */

export const PASS_SEASONS_SECTION = "passSeasons";

/** Ambre du dernier palier, en plus du commandant (un recrutement coûte 150). */
export const PASS_FINAL_AMBER = 300;
/** v5.14.1 : actions possibles dans un défi de palier. Les raids repoussés et les assauts
 *  de boss n'en font pas partie : le joueur ne les déclenche pas quand il veut, et un
 *  défi bloque les suivants. */
export const CHALLENGE_KEYS: ChronicleObjective[] = ["victory", "contract", "spy", "market", "bounty", "warlordWin"];
// v5.14.2 : les missions terminées sortent du roulement (bien trop faciles).

/** Nombre de prérequis d'un palier : un au début, deux à partir du 11e, trois aux paliers 20 et 30. */
export function challengeSize(tier: number): number {
  if (tier === 20 || tier === 30) return 3;
  if (tier === 10) return 2;
  if (tier < 10) return 1;
  if (tier < 20) return tier % 2 === 0 ? 2 : 1;
  return 2;
}

/** Difficulté d'un palier : de ×0,4 (palier 1) à ×2,5 (palier 30) des valeurs de base. */
export function challengeRamp(tier: number, tiers = 30): number {
  return 0.4 + (2.1 * (tier - 1)) / Math.max(1, tiers - 1);
}

/** v5.14.1 : effort d'un passe complet, en mois d'activité du joueur médian. Le passe
 *  est le contenu d'un mois : ses défis réunis demandent, pour chaque action, un mois
 *  entier de l'activité médiane (et un seul défi avance à la fois). */
export const PASS_MONTH_EFFORT = 1;

/** Quantité d'une action demandée sur tout le passe : 4,3 semaines d'activité médiane
 *  (bornée comme les objectifs des Chroniques ; valeurs de base sans données). */
export function monthlyBudget(key: ChronicleObjective, d: Pick<WorldDigest, "weeklyMedian">): number {
  const base = BASE_COUNTS[key] ?? 3;
  const weekly = d.weeklyMedian[key] ?? 0;
  const eff = weekly > 0 ? Math.max(base * 0.5, Math.min(base * 3, weekly)) : base;
  return Math.max(1, Math.round(eff * 4.3 * PASS_MONTH_EFFORT));
}

/** v5.14.1 : défis des paliers. Chaque palier a les siens (compteur propre, un palier à la
 *  fois) et jamais deux fois les mêmes : l'action change d'un palier au suivant, une action
 *  qui revient ne demande jamais moins, et deux paliers n'ont jamais le même défi. Le mois
 *  d'activité de chaque action est réparti sur ses paliers, plus lourdement en fin de passe. */
export function generateTierChallenges(rng: () => number, focus: ChronicleObjective[], d: Pick<WorldDigest, "weeklyMedian">, tiers: number): Record<string, PassRequirement[]> {
  // v5.14.2 : les seigneurs de guerre seulement si des joueurs en battent vraiment (sinon un
  // débutant, ou un serveur sans seigneurs, resterait bloqué : un défi bloque les suivants).
  const playable = CHALLENGE_KEYS.filter((k) => k !== "warlordWin" || (d.weeklyMedian.warlordWin ?? 0) > 0);
  const pool = [...focus.filter((k) => playable.includes(k)), ...playable.filter((k) => !focus.includes(k))];
  // 1. Actions de chaque palier : les moins utilisées d'abord (le thème à égalité), jamais celles du palier précédent.
  const used: Record<string, number> = {};
  const plan: ChronicleObjective[][] = [];
  let prev: ChronicleObjective[] = [];
  for (let t = 1; t <= tiers; t++) {
    const keys = pool
      .filter((k) => !prev.includes(k))
      .map((k, i) => ({ k, w: (used[k] ?? 0) * 10 + i + rng() * 3 }))
      .sort((a, b) => a.w - b.w)
      .slice(0, challengeSize(t))
      .map((x) => x.k);
    keys.forEach((k) => (used[k] = (used[k] ?? 0) + 1));
    plan.push(keys);
    prev = keys;
  }
  // 2. Répartition du mois de chaque action sur ses paliers, au poids de la difficulté.
  const weight = (t: number) => challengeRamp(t, tiers) * (plan[t - 1].length > 1 ? 0.8 : 1);
  const totalWeight: Record<string, number> = {};
  plan.forEach((keys, i) => keys.forEach((k) => (totalWeight[k] = (totalWeight[k] ?? 0) + weight(i + 1))));
  const last: Record<string, number> = {};
  const seen = new Set<string>();
  const out: Record<string, PassRequirement[]> = {};
  plan.forEach((keys, i) => {
    const t = i + 1;
    const reqs = keys.map((key) => {
      const share = (monthlyBudget(key, d) * weight(t)) / totalWeight[key];
      return { key, count: Math.max(1, Math.round(share), last[key] ?? 0) };
    });
    // Jamais deux fois le même défi : on monte l'action la plus lourde jusqu'à ce qu'il soit inédit.
    const sig = () => reqs.map((r) => `${r.key}:${r.count}`).sort().join("|");
    while (seen.has(sig())) reqs[reqs.length - 1].count += 1;
    seen.add(sig());
    reqs.forEach((r) => (last[r.key] = r.count));
    out[String(t)] = reqs;
  });
  return out;
}

/** 5.15.4 : jour du mois où le joueur médian doit avoir relevé le dernier défi (mode cumulé).
 *  6.8.1 : réglable (GameRules.passGen.targetMedianDay, 24 par défaut). */
export function passTargetDay(): number {
  return passGenRules().targetMedianDay;
}

/** Rythme de référence d'une action, par semaine : médiane du serveur (bornée), base sinon. */
export function weeklyRate(key: ChronicleObjective, d: Pick<WorldDigest, "weeklyMedian">): number {
  const base = BASE_COUNTS[key] ?? 3;
  const weekly = d.weeklyMedian[key] ?? 0;
  return weekly > 0 ? Math.max(base * 0.5, Math.min(base * 3, weekly)) : base;
}

/** Jour cible de chaque palier (cumul de la difficulté, dernier palier : PASS_TARGET_DAY). */
export function tierTargetDays(tiers: number): number[] {
  const w = Array.from({ length: tiers }, (_, i) => challengeRamp(i + 1, tiers));
  const total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  const target = passTargetDay();
  return w.map((x) => ((acc += x), (target * acc) / total));
}

/** 5.15.4 : défis CUMULÉS. Un palier demande un total d'actions depuis le début du mois
 *  (« 12 victoires ce mois-ci ») : une action compte pour tous les paliers, rien n'est
 *  perdu, et les paliers se débloquent toujours dans l'ordre. Quantités : ce que le
 *  joueur médian a fait au jour cible du palier ; une action trop rare n'apparaît que
 *  lorsqu'elle est atteignable. Toujours une ou plusieurs actions par palier, jamais
 *  celles du palier précédent, jamais deux fois le même défi. */
export function generateCumulativeChallenges(rng: () => number, focus: ChronicleObjective[], d: Pick<WorldDigest, "weeklyMedian">, tiers: number): Record<string, PassRequirement[]> {
  // 6.8.1 : actions et poids réglables (passGen.challengeWeights) ; une action passive n'entre que si le serveur la pratique.
  const weights = new Map(challengePool(d.weeklyMedian).map((x) => [x.key, x.weight]));
  const playable = [...weights.keys()];
  const pool = [...focus.filter((k) => playable.includes(k)), ...playable.filter((k) => !focus.includes(k))];
  const day = tierTargetDays(tiers);
  const by = (k: ChronicleObjective, t: number) => (weeklyRate(k, d) / 7) * day[t - 1];
  const used: Record<string, number> = {};
  const last: Record<string, number> = {};
  const seen = new Set<string>();
  const out: Record<string, PassRequirement[]> = {};
  let prev: ChronicleObjective[] = [];
  for (let t = 1; t <= tiers; t++) {
    const free = pool.filter((k) => !prev.includes(k));
    const feasible = free.filter((k) => by(k, t) >= 1);
    const extra = free.filter((k) => !feasible.includes(k)).sort((a, b) => by(b, t) - by(a, t));
    const candidates = feasible.length >= challengeSize(t) ? feasible : [...feasible, ...extra.slice(0, challengeSize(t) - feasible.length)];
    const keys = candidates
      .map((k) => ({ k, w: ((used[k] ?? 0) * 10 + pool.indexOf(k) + rng() * 3) / (weights.get(k) ?? 1) }))
      .sort((a, b) => a.w - b.w)
      .slice(0, challengeSize(t))
      .map((x) => x.k);
    keys.forEach((k) => (used[k] = (used[k] ?? 0) + 1));
    // Total du mois : jamais moins qu'au précédent passage de l'action.
    const reqs = keys.map((key) => ({ key, count: Math.max(1, Math.round(by(key, t)), last[key] ?? 0) }));
    const sig = () => reqs.map((r) => `${r.key}:${r.count}`).sort().join("|");
    while (seen.has(sig())) reqs[reqs.length - 1].count += 1;
    seen.add(sig());
    reqs.forEach((r) => (last[r.key] = r.count));
    out[String(t)] = reqs;
    prev = keys;
  }
  return out;
}

export type PassSeasonStatus = "draft" | "published";

export interface PassMilestone {
  /** 0 : prologue (visible dès l'ouverture), sinon palier qui le débloque. */
  tier: number;
  title: string;
  lines: StoryLine[];
}

export interface PassSeason {
  /** Mois (AAAA-MM). */
  id: string;
  status: PassSeasonStatus;
  theme: { id: string; name: string; tagline: string; accent: string; image: string; /** v5.14 : prompt Midjourney de l'illustration. */ prompt?: string };
  scenario: { synopsis: string; milestones: PassMilestone[] };
  pointsPerTier: number;
  tiers: PassReward[][];
  /** Prérequis par palier (clé : numéro de palier) ; v5.14.1 : plusieurs par palier. */
  requirements: Record<string, PassRequirement[]>;
  /** 5.15.4 : « cumulative » : totaux du mois (passes générés à partir de la 5.15.4) ;
   *  absent : un palier à la fois, compteur remis à zéro (passes plus anciens). */
  challengeMode?: "cumulative";
  commander: SeasonCommanderDef & { prompt: string };
  auto?: { generatedAtMs: number; variant: number; reasons: string[]; /** 6.8.1 : jours de fin simulés (médian, plus actif). */ pace?: { medianDay: number | null; topDay: number | null } };
  publishedAtMs?: number;
  /** Annonce envoyée aux joueurs (une fois, au début du mois). */
  announcedAtMs?: number;
}

export interface PassSeasonsConfig {
  seasons: PassSeason[];
}

export function defaultPassSeasonsConfig(): PassSeasonsConfig {
  return { seasons: [] };
}

/* ---------- thèmes ---------- */

interface PassTheme {
  id: string;
  accent: string;
  image: string;
  mentor: Speaker;
  rival: Speaker;
  /** Actions mises en avant (prérequis). */
  focus: ChronicleObjective[];
  /** Répliques : prologue, palier 10, palier 20, palier 30 (mentor puis rival).
   *  v5.14 : nom, accroche, scénario et commandant viennent du catalogue (seasonCatalog.ts). */
  beats: [string[], string[], string[], string[]];
  rivalLines: [string[], string[], string[], string[]];
}

export const PASS_THEMES: PassTheme[] = [
  {
    id: "maree",
    accent: "#4be8ff",
    image: "/assets/blog/articles/5-9/poste-commandement.webp",
    mentor: "vashka",
    rival: "varan",
    focus: ["victory", "raidRepelled", "bounty"],
    beats: [
      ["Les sondes ont repéré leurs escadres, commandant. Prépare ta flotte : on ne les laissera pas passer."],
      ["Première ligne tenue. Ils reculent, mais ils reviendront plus nombreux."],
      ["Leur vaisseau amiral s'est montré. Un officier hors pair a rejoint nos rangs pour la dernière bataille."],
      ["La houle est retombée. {commander} a choisi ta bannière : sers-toi bien de cet officier."],
    ],
    rivalLines: [["Vos flottes sont des coquilles vides. La marée vous emportera."], ["Une vaguelette. Rien de plus."], ["Assez joué. Toute ma flotte converge sur vous."], ["Cette fois... vous avez gagné."]],
  },
  {
    id: "forge",
    accent: "#ffb347",
    image: "/assets/blog/articles/5-10/pot-commun.webp",
    mentor: "lysa",
    rival: "kragmor",
    focus: ["contract", "victory", "bounty"],
    beats: [
      ["Les forges tournent pour l'ennemi. Il nous faut des contrats et des bras : on commence ce mois-ci."],
      ["Première forge reprise ! Les ouvriers reviennent."],
      ["Un architecte de légende accepte de nous rejoindre si nous tenons jusqu'au bout."],
      ["Les forges sont à nous. {commander} prend la tête de tes chantiers."],
    ],
    rivalLines: [["Mes forges, mes règles. Payez ou partez."], ["Une forge ? J'en ai cent."], ["Vous m'agacez. Mes foreuses vont raser vos chantiers."], ["Gardez vos forges. Pour l'instant."]],
  },
  {
    id: "archives",
    accent: "#a78bfa",
    image: "/assets/blog/articles/reliques/couverture.webp",
    mentor: "nerea",
    rival: "vesper",
    focus: ["spy", "victory", "raidRepelled"],
    beats: [
      ["Nos sondes doivent percer leurs secrets avant qu'ils ne disparaissent. Espionne, commandant."],
      ["Un premier fichier déchiffré. Il cite un nom que je croyais mort."],
      ["Une agente double propose ses services. Elle demande une seule chose : que tu ailles jusqu'au bout."],
      ["Les archives sont à l'abri. {commander} rejoint ton état-major, avec tous ses secrets."],
    ],
    rivalLines: [["Ce que vous cherchez n'existe pas."], ["Curieux. Trop curieux."], ["J'efface tout. Vous aussi, s'il le faut."], ["Gardez vos archives. Je garde mes ombres."]],
  },
  {
    id: "hiver",
    accent: "#9fd8ff",
    image: "/assets/chronicles/2026-12-boss.webp",
    mentor: "ilyon",
    rival: "vesper",
    focus: ["raidRepelled", "contract", "victory"],
    beats: [
      ["Le froid arrive. Remplis tes entrepôts, renforce tes défenses : la nuit sera longue."],
      ["Les premiers raids sont repoussés. Le givre recule d'un cran."],
      ["Une gardienne des glaces a survécu à trois hivers comme celui-ci. Elle veut nous aider."],
      ["Le dégel commence. {commander} veille désormais sur tes réserves."],
    ],
    rivalLines: [["L'hiver est mon allié. Vous gèlerez."], ["Un feu de camp contre une tempête."], ["Mes raids frapperont au plus froid de la nuit."], ["Le printemps... déjà ?"]],
  },
  {
    id: "comete",
    accent: "#ff5c7a",
    image: "/assets/blog/articles/5-10/coup-de-grace.webp",
    mentor: "brannoc",
    rival: "kor",
    focus: ["bossAssault", "victory", "bounty"],
    beats: [
      ["Elle arrive, commandant ! Tout ce qui s'en détache est à prendre. Fais chauffer les moteurs."],
      ["Premiers fragments récupérés. Le Cartel commence à s'énerver."],
      ["Une pilote a suivi la comète depuis trois systèmes. Elle connaît son cœur."],
      ["La comète s'éloigne, ses trésors dans nos soutes. {commander} reste avec nous."],
    ],
    rivalLines: [["Cette comète m'appartient. Comme tout le reste."], ["Des miettes. Laissez-les-moi."], ["Mes chasseurs vont vous balayer de son sillage."], ["Vous me devez une comète."]],
  },
  {
    id: "primes",
    accent: "#ffd86b",
    image: "/assets/blog/articles/5-9/podium-or.webp",
    mentor: "vashka",
    rival: "maru",
    focus: ["bounty", "victory", "warlordWin"],
    beats: [
      ["La traque est ouverte. Remplis les primes, et que l'Essaim retienne ton nom."],
      ["Ton tableau de chasse s'allonge. Les autres chasseurs commencent à te craindre."],
      ["Une traqueuse légendaire te suit à la trace. Elle veut voir qui chasse aussi bien qu'elle."],
      ["La traque est finie, et tu es en tête. {commander} chassera désormais pour toi."],
    ],
    rivalLines: [["Ma tête vaut une fortune. Venez la prendre."], ["Pas mal, pour un débutant."], ["Je vais vous traquer à mon tour."], ["Bien chassé. Je reviendrai."]],
  },
  {
    id: "bazar",
    accent: "#5ef2b0",
    image: "/assets/blog/articles/5-12/salle-de-jeu.webp",
    mentor: "kor",
    rival: "kragmor",
    focus: ["contract", "bounty", "raidRepelled"],
    beats: [
      ["Les routes rouvrent, commandant. Honore tes contrats : la réputation vaut plus que l'or."],
      ["Les convois passent. Tes contrats font parler d'eux jusqu'aux franges."],
      ["Une négociatrice redoutable propose de gérer tes affaires. Prouve-lui que tu en vaux la peine."],
      ["Le bazar ferme ses portes, tes coffres pleins. {commander} tient désormais tes comptes."],
    ],
    rivalLines: [["Chaque route passe par mes péages."], ["Un convoi de plus, un péage de plus."], ["Je ferme les routes. Toutes."], ["Bon. Vous pouvez passer. Cette fois."]],
  },
  {
    id: "vide",
    accent: "#ff5fd2",
    image: "/assets/chronicles/2026-11-boss.webp",
    mentor: "maru",
    rival: "varan",
    focus: ["victory", "raidRepelled", "contract"],
    beats: [
      ["Le Vide appelle, commandant. Ceux qui répondront en reviendront changés."],
      ["Le signal se précise. Il parle de nous."],
      ["Une éclaireuse revenue des franges veut guider celui qui ira jusqu'au bout."],
      ["Le signal s'est tu. {commander} a choisi de rester à tes côtés."],
    ],
    rivalLines: [["Le Vide n'aime pas les curieux."], ["Vous entendez des voix ? Moi, j'entends des ressources."], ["Le premier arrivé prend tout."], ["Gardez votre prophétie."]],
  },
  // v5.14 : quatre thèmes de plus (douze, un par rôle d'officier).
  {
    id: "rempart",
    accent: "#7fb2ff",
    image: "/assets/chronicles/2027-01-boss.webp",
    mentor: "ilyon",
    rival: "varan",
    focus: ["raidRepelled", "victory", "contract"],
    beats: [
      ["Leurs raids se multiplient, commandant. On fortifie, on tient, et on rend coup pour coup."],
      ["Les premières vagues se sont brisées sur nos défenses. Ils cherchent la faille."],
      ["Un stratège de siège légendaire a vu ta résistance. Il veut se battre à tes côtés."],
      ["Le siège est levé. {commander} rejoint ton état-major : aucun mur ne tombera plus."],
    ],
    rivalLines: [["Vos murs sont en papier. Mes béliers ont faim."], ["Une vague de plus, et vous céderez."], ["Toutes mes escadres sur le même point. Tenez donc, si vous pouvez."], ["Je reviendrai. Les murs finissent toujours par tomber."]],
  },
  {
    id: "colonies",
    accent: "#5ef2b0",
    image: "/assets/chronicles/2027-02-boss.webp",
    mentor: "lysa",
    rival: "kragmor",
    focus: ["contract", "raidRepelled", "victory"],
    beats: [
      ["Les sondes ont trouvé des mondes habitables. À toi de les faire fleurir avant que d'autres ne s'en emparent."],
      ["Tes premières colonies prospèrent. Les colons affluent."],
      ["Une gouverneure de légende cherche un empire digne de ses talents. Le tien l'intéresse."],
      ["Les franges sont à nous. {commander} gouvernera tes colonies."],
    ],
    rivalLines: [["Ces mondes sont à moi. Mes foreuses arrivent."], ["Une colonie ? Un caillou de plus à raser."], ["J'envoie mes équipes de forage sur toutes vos colonies."], ["Gardez vos cailloux. J'en trouverai d'autres."]],
  },
  {
    id: "chantiers",
    accent: "#ff8a3d",
    image: "/assets/blog/articles/5-10/couverture.webp",
    mentor: "brannoc",
    rival: "kor",
    focus: ["victory", "contract", "warlordWin"],
    beats: [
      ["Les chantiers sont rouillés, mais les plans sont bons. Remets-les en marche, commandant."],
      ["Les premières coques sortent des cales. L'équipage applaudit."],
      ["Une mécanicienne de génie a entendu parler de tes chantiers. Elle veut voir ce qu'ils valent."],
      ["L'arsenal tourne à plein. {commander} veille sur tes cales sèches."],
    ],
    rivalLines: [["Mes chantiers produisent dix coques pour une des vôtres."], ["Jolies coques. Elles brûleront bien."], ["Ma nouvelle flotte est prête. Et la vôtre ?"], ["Hum. Vos chantiers sont meilleurs que prévu."]],
  },
  {
    id: "moisson",
    accent: "#ffd86b",
    image: "/assets/chronicles/2027-03-boss.webp",
    mentor: "kor",
    rival: "maru",
    focus: ["contract", "bounty", "raidRepelled"],
    beats: [
      ["Les gisements n'ont jamais été aussi riches. Récolte, stocke, et protège tes réserves."],
      ["Les greniers se remplissent. Les pillards rôdent déjà."],
      ["Un intendant légendaire propose ses services à l'empire le mieux tenu du secteur."],
      ["Les greniers débordent. {commander} tiendra tes comptes."],
    ],
    rivalLines: [["Tant de réserves... et si peu de gardes."], ["Vos greniers sentent bon. J'arrive."], ["Toute la Ruche a faim. Vos réserves la nourriront."], ["Vos greniers sont bien gardés. Pour cette saison."]],
  },
];

/* ---------- génération ---------- */

const pick = <T>(rng: () => number, xs: T[]): T => xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))];
const fill = (t: string, vars: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
const shuffle = <T>(rng: () => number, xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** v5.14.2 : le passe a-t-il un défi à chaque palier ? (sinon : ancien format, à compléter) */
export function hasFullChallenges(s: Pick<PassSeason, "tiers" | "requirements">): boolean {
  return (s.tiers ?? []).every((_, i) => normalizeTierReqs(s.requirements?.[String(i + 1)]).length > 0);
}

/** v5.14.2 : réécrit seulement les défis d'un passe (thème, récompenses et points par
 *  palier inchangés : la progression des joueurs ne bouge pas). */
export function regenerateChallenges(season: PassSeason, digest: Pick<WorldDigest, "weeklyMedian">, variant = 0): PassSeason {
  const theme = PASS_THEMES.find((t) => t.id === season.theme.id) ?? PASS_THEMES.find((t) => t.id === catalogEntryFor(season.id).theme) ?? PASS_THEMES[0];
  const rng = seededRandom(`challenges:${season.id}:${variant}`);
  const focus = shuffle(rng, theme.focus);
  const gen = season.challengeMode === "cumulative" ? generateCumulativeChallenges : generateTierChallenges;
  return { ...season, requirements: gen(rng, focus, digest, season.tiers.length) };
}

export interface GeneratePassSeasonOptions {
  monthId: string;
  digest: WorldDigest;
  existing: PassSeason[];
  now: number;
  variant?: number;
  /** Points par palier du mois précédent (base de l'ajustement). */
  basePointsPerTier?: number;
}

export function generatePassSeason(o: GeneratePassSeasonOptions): PassSeason {
  const variant = Math.max(0, Math.floor(o.variant ?? 0));
  const rng = seededRandom(`pass:${o.monthId}:${variant}`);
  // v5.14 : le catalogue fixe le thème du mois (douze en rotation, trois ans), son nom,
  // son scénario et son commandant ; le tirage ne règle plus que paliers et répliques.
  const entry = catalogEntryFor(o.monthId);
  const theme = PASS_THEMES.find((t) => t.id === entry.theme) ?? PASS_THEMES[0];
  const name = entry.name;
  const label = seasonLabel(o.monthId);

  // Commandant de saison : rôle du thème, second rôle propre à l'année.
  const cmdName = entry.commander.name;
  const cmdTitle = entry.commander.title;
  const vars = { mentor: STORY_SPEAKERS[theme.mentor].name, rival: STORY_SPEAKERS[theme.rival].name, commander: cmdName, theme: name };
  const commander: PassSeason["commander"] = {
    id: `s-${o.monthId}`,
    name: cmdName,
    title: cmdTitle,
    portrait: "",
    primary: THEME_PRIMARY[entry.theme],
    secondary: entry.commander.secondary,
    lore: fill(entry.commander.lore, vars),
    seasonId: o.monthId,
    seasonLabel: label,
    prompt: portraitPrompt(entry, theme.accent),
  };

  // Paliers : ancien gabarit du générateur de chapitres (repli), puis prérequis et final.
  const g = generatePass(rng, o.digest, o.basePointsPerTier ?? PASS_RULES.pointsPerTier);
  const rules = passGenRules();
  const reasons: string[] = [];
  // 6.8.1 : récompenses tirées sous budget (tirage à part : le reste du passe ne change pas de graine).
  let tiers = g.pass.tiers.map((t) => t.map((r) => ({ ...r }))) as PassReward[][];
  if (rules.enabled) {
    const b = generateBudgetTiers(seededRandom(`passgen:${o.monthId}:${variant}`), tiers.length, rules);
    tiers = b.tiers;
    reasons.push(...b.reasons);
  } else reasons.push(`Récompenses : gabarit fixe (budget désactivé), ${Math.round(tiersValue(tiers.slice(0, -1), rules))} h de production équivalentes.`);
  tiers[tiers.length - 1] = [{ kind: "commander", id: commander.id }, { kind: "amber", amount: PASS_FINAL_AMBER }, { kind: "cosmetic" }];
  // 6.8.1 : points par palier calculés sur les points par jour mesurés ; sans mesure, l'ancien ajustement de ±15 %.
  const computed = computePointsPerTier(o.digest.passPace, tiers.length, rules);
  let pointsPerTier = computed?.ppt ?? g.pass.pointsPerTier;
  reasons.push(...(computed?.reasons ?? [...g.reasons, "Pas encore de points par jour mesurés : ajustement sur la part de joueurs qui ont fini."]));
  const focus = shuffle(rng, theme.focus);
  reasons.push(`Thème : ${name} (${theme.id}, année ${entry.year} du catalogue, saison ${catalogIndex(o.monthId) + 1} sur 36).`);
  const requirements = generateCumulativeChallenges(rng, focus, o.digest, tiers.length);
  const totals: Record<string, number> = {};
  Object.values(requirements).forEach((list) => list.forEach((r) => (totals[r.key] = (totals[r.key] ?? 0) + r.count)));
  reasons.push(
    `Défis cumulés (totaux du mois, paliers dans l'ordre) : le joueur médian relève le dernier vers le jour ${passTargetDay()}. Sommes des seuils : ${Object.entries(totals)
      .map(([k, n]) => `${OBJECTIVE_LABELS[k as ChronicleObjective].toLowerCase()} ${n} (médiane ${o.digest.weeklyMedian[k as ChronicleObjective] ?? 0} par semaine)`)
      .join(", ")}.`,
  );
  for (const t of [1, 10, 20, 30].filter((x) => x <= tiers.length))
    reasons.push(`Défi du palier ${t} : ${requirements[String(t)].map((r) => `${OBJECTIVE_LABELS[r.key].toLowerCase()} × ${r.count}`).join(", ")}.`);

  // 6.8.1 : contrôle par simulation avant publication (joueur médian et plus actif du serveur).
  const pace = passPaceCheck({ pointsPerTier, tiers, requirements, challengeMode: "cumulative" }, o.digest);
  if (pace.topDay !== null && pace.topDay < rules.targetTopDay && pointsPerTier < rules.pointsMax) {
    // Trop rapide pour le plus actif : on allonge le palier, sans faire finir le médian après le jour limite.
    for (let ppt = pointsPerTier + 5; ppt <= rules.pointsMax; ppt += 5) {
      const c = passPaceCheck({ pointsPerTier: ppt, tiers, requirements, challengeMode: "cumulative" }, o.digest);
      if (c.medianDay === null || c.medianDay > rules.latestMedianDay) break;
      pointsPerTier = ppt;
      if (c.topDay === null || c.topDay >= rules.targetTopDay) break;
    }
    reasons.push(`Simulation : le plus actif finissait au jour ${pace.topDay} ; points par palier portés à ${pointsPerTier}.`);
  }
  const check = passPaceCheck({ pointsPerTier, tiers, requirements, challengeMode: "cumulative" }, o.digest);
  reasons.push(
    `Simulation : joueur médian au dernier palier ${check.medianDay === null ? "après la fin du mois" : `le jour ${check.medianDay}`} (cible ${rules.targetMedianDay}), plus actif ${check.topDay === null ? "après la fin du mois" : `le jour ${check.topDay}`} (pas avant ${rules.targetTopDay}).`,
  );

  const line = (speaker: Speaker, text: string): StoryLine => ({ speaker, text: fill(text, vars) });
  const titles = ["Prologue", "Premier acte", "Deuxième acte", "Dénouement"];
  const milestones: PassMilestone[] = [0, 10, 20, 30].map((tier, i) => ({
    tier: Math.min(tier, tiers.length),
    title: titles[i],
    lines: [line(theme.mentor, pick(rng, theme.beats[i])), line(theme.rival, pick(rng, theme.rivalLines[i]))],
  }));

  return {
    id: o.monthId,
    status: "draft",
    theme: { id: theme.id, name, tagline: entry.tagline, accent: theme.accent, image: theme.image, prompt: illustrationPrompt(entry, theme.accent) },
    scenario: { synopsis: fill(entry.synopsis, vars), milestones },
    pointsPerTier,
    tiers,
    requirements,
    challengeMode: "cumulative",
    commander,
    auto: { generatedAtMs: o.now, variant, reasons, pace: check },
  };
}

/** 6.8.1 : jour de fin simulé du joueur médian et du plus actif (actions du serveur, points par jour mesurés ;
 *  sans mesure : profils par défaut). Le plus actif fait les actions au même rapport que ses points. */
export function passPaceCheck(season: Pick<PassSeason, "pointsPerTier" | "tiers" | "requirements" | "challengeMode">, d: Pick<WorldDigest, "weeklyMedian" | "passPace">): { medianDay: number | null; topDay: number | null } {
  const [, defMedian, defActive] = defaultSimProfiles();
  const hasData = Object.values(d.weeklyMedian).some((v) => (v ?? 0) > 0);
  const median = hasData ? profileFromMedian(d.weeklyMedian) : defMedian;
  const pace = d.passPace;
  const ratio = pace && pace.median > 0 ? Math.min(4, Math.max(1, pace.top / pace.median)) : 2;
  const top = { ...median, id: "top", label: "Plus actif", weekly: Object.fromEntries(Object.entries(median.weekly).map(([k, v]) => [k, (v ?? 0) * ratio])) };
  const run = (p: typeof median, ppd?: number) => simulatePass(season, ppd ? { ...p, pointsPerDay: ppd } : p, 31, 62).finishDay;
  return { medianDay: run(median, pace?.median), topDay: pace ? run(top, Math.max(pace.top, pace.median)) : run(defActive) };
}

/* ---------- validation, application ---------- */

const MONTH = /^\d{4}-\d{2}$/;

export function validatePassSeasons(cfg: PassSeasonsConfig | undefined): string[] {
  const errors: string[] = [];
  if (!cfg) return errors;
  const ids = new Set<string>();
  for (const s of cfg.seasons ?? []) {
    const at = `Passe ${s?.id ?? "?"}`;
    if (!s || !MONTH.test(String(s.id))) {
      errors.push("Passes de saison : mois invalide (AAAA-MM).");
      continue;
    }
    if (ids.has(s.id)) errors.push(`${at} : en double.`);
    ids.add(s.id);
    if (!(s.pointsPerTier >= 1)) errors.push(`${at} : points par palier ≥ 1.`);
    if (!Array.isArray(s.tiers) || s.tiers.length < 1 || s.tiers.length > 60) errors.push(`${at} : entre 1 et 60 paliers.`);
    if (!s.theme?.name?.trim()) errors.push(`${at} : nom du thème manquant.`);
    for (const [tier, raw] of Object.entries(s.requirements ?? {})) {
      if (!(Number(tier) >= 1 && Number(tier) <= (s.tiers?.length ?? 0))) errors.push(`${at} : prérequis sur un palier inexistant (${tier}).`);
      const list = (Array.isArray(raw) ? raw : [raw]) as Partial<PassRequirement>[];
      if (list.length > 4) errors.push(`${at}, palier ${tier} : quatre prérequis au plus.`);
      const keys = new Set<string>();
      for (const r of list) {
        if (!(String(r?.key) in OBJECTIVE_LABELS)) errors.push(`${at}, palier ${tier} : action de prérequis inconnue.`);
        if (!(Number(r?.count) >= 1)) errors.push(`${at}, palier ${tier} : nombre ≥ 1.`);
        if (keys.has(String(r?.key))) errors.push(`${at}, palier ${tier} : la même action deux fois.`);
        keys.add(String(r?.key));
      }
    }
    const c = s.commander;
    if (!c?.name?.trim()) errors.push(`${at} : nom du commandant manquant.`);
    if (c && c.id !== `s-${s.id}`) errors.push(`${at} : identifiant du commandant attendu « s-${s.id} ».`);
    if (c && (!COMMANDER_ROLES.includes(c.primary) || !COMMANDER_ROLES.includes(c.secondary))) errors.push(`${at} : rôles du commandant inconnus.`);
    if (c && c.primary === c.secondary) errors.push(`${at} : le second rôle du commandant doit différer du premier.`);
    if (s.status === "published" && !(s.tiers ?? []).some((t) => (t ?? []).some((r) => r?.kind === "commander" && r.id === c?.id))) errors.push(`${at} : le commandant n'est donné à aucun palier.`);
  }
  return errors;
}

/** Passes publiés : remplacent le passe du mois ; leurs commandants rejoignent le catalogue. */
export function setPassSeasons(cfg: PassSeasonsConfig | undefined): void {
  const published = (cfg?.seasons ?? []).filter((s) => s && s.status === "published" && MONTH.test(s.id) && s.pointsPerTier >= 1 && Array.isArray(s.tiers) && s.tiers.length > 0);
  const passes = new Map<string, MonthPass>();
  for (const s of published)
    passes.set(s.id, {
      pointsPerTier: s.pointsPerTier,
      tiers: s.tiers,
      requirements: Object.fromEntries(Object.entries(s.requirements ?? {}).map(([t, r]) => [t, normalizeTierReqs(r)])),
      ...(s.challengeMode === "cumulative" ? { challengeMode: "cumulative" as const } : {}),
    });
  setPassSeasonOverrides(passes);
  setSeasonCommanders(published.filter((s) => s.commander).map((s) => s.commander));
  PUBLISHED.splice(0, PUBLISHED.length, ...published);
}

const PUBLISHED: PassSeason[] = [];

/** Passe publié d'un mois (thème, scénario…), s'il y en a un. */
export function publishedPassSeason(seasonId: string): PassSeason | null {
  return PUBLISHED.find((s) => s.id === seasonId) ?? null;
}

/** Brouillon ou passe d'un mois dans la configuration. */
export function findPassSeason(cfg: PassSeasonsConfig, id: string): PassSeason | null {
  return cfg.seasons.find((s) => s.id === id) ?? null;
}

/** Remplace (ou ajoute) un passe, trié par mois. */
export function upsertPassSeason(cfg: PassSeasonsConfig, season: PassSeason): PassSeasonsConfig {
  return { seasons: [...cfg.seasons.filter((s) => s.id !== season.id), season].sort((a, b) => (a.id < b.id ? -1 : 1)) };
}

/** Publication : brouillon → publié (garde la date). */
export function publishPassSeason(season: PassSeason, now: number): PassSeason {
  return { ...season, status: "published", publishedAtMs: season.publishedAtMs ?? now };
}

/** Le mois suivant (AAAA-MM). */
/** v5.14.1 : les passes de saison commencent avec le catalogue (novembre 2026) ; avant,
 *  le passe du mois reste celui des Chroniques (sinon le catalogue repartirait par la fin). */
export function passSeasonAllowed(monthId: string): boolean {
  return monthId >= CATALOG_START;
}

/** v5.14.1 : mois dont la tâche horaire peut écrire le brouillon. Le mois en cours seulement
 *  le 1er (un passe écrit en cours de mois remplacerait celui sur lequel les joueurs avancent). */
export function autoDraftMonths(currentMonthId: string, dayOfMonth: number, leadDay: number): string[] {
  const ids = [...(dayOfMonth <= 1 ? [currentMonthId] : []), ...(dayOfMonth >= leadDay ? [nextMonthId(currentMonthId)] : [])];
  return ids.filter(passSeasonAllowed);
}

export function nextMonthId(id: string): string {
  const [y, m] = id.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}
