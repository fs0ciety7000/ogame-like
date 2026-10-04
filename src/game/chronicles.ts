import { GameActionError } from "@/game/errors";
import { leviathanSchedule } from "@/game/leviathan";
import { bossWindows, parisLocalToUtc, parisOffsetMs, type BossDate, type BossSchedule, type BossWeekend } from "@/game/events";
import { addPassPoints, grantPassReward, OBJECTIVE_LABELS, onPassPoints, PASS_POINTS, setMonthPasses, trackActivity, validateSeasonPass, type MonthPass, type PassReward } from "@/game/seasonPass";
import { addRelic, relicLabel, rollRelic } from "@/game/relics";
import { computeFullPower } from "@/game/combat";
import { OFFENSIVE_UNITS } from "@/game/units";
import { leviathanRanking, seasonBossCooldownHours, type LeviathanState } from "@/game/leviathan";
import type { StoryLine } from "@/game/story";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Chroniques (v4.3) : chaque mois, un arc de quatre épisodes racontés par
   les personnages du secteur, un par semaine (1er, 8, 15 et 22 du mois).
   Chaque épisode fixe un objectif ; une fois atteint, il rapporte un
   palier de passe (+40 points). Le dernier week-end du mois, le boss de
   saison clôt l'arc (moteur du Léviathan) ; l'habillage du site prend la
   teinte du mois. Contenu modifiable depuis l'administration.
===================================================== */

export type ChronicleObjective = "contract" | "bounty" | "raidRepelled" | "victory" | "bossAssault" | "mission" | "spy" | "market" | "warlordWin";

/** v5.13 : libellés rangés dans seasonPass.ts (prérequis des paliers), ré-exportés ici. */
export { OBJECTIVE_LABELS };

export interface ChronicleEpisode {
  title: string;
  lines: StoryLine[];
  objective: { type: ChronicleObjective; count: number };
  /** v5.4 : récompense en plus des points de passe. */
  reward?: PassReward[];
}

/** v5.4 : fiche de Codex propre à un chapitre (débloquée à sa parution). */
export interface ChronicleCodexEntry {
  id: string;
  name: string;
  subtitle: string;
  text: string;
  image: string;
}

/** v5.4 : chapitre généré automatiquement (trace du calcul). */
export interface ChapterAuto {
  generatedAtMs: number;
  /** Mois dont les données ont servi. */
  sourceMonth: string;
  archetype: string;
  difficulty: number;
  activePlayers: number;
  reasons: string[];
}

export interface SeasonBossDef {
  name: string;
  /** Titre gagné par les participants à sa chute. */
  title: string;
  image: string;
  emblem: string;
  fallbackImage: string;
  lore: string;
}

export interface ChronicleMonth {
  /** « 2026-10 » */
  id: string;
  title: string;
  /** Teinte du mois (habillage du site). */
  theme: { accent: string; label: string };
  boss: SeasonBossDef;
  episodes: ChronicleEpisode[];
  /** v5.4 : prologue affiché avant le premier épisode. */
  synopsis?: string;
  /** v5.4 : chapitre terminé (les 4 épisodes) : titre, bannière de profil, récompenses. */
  completion?: { title: string; banner: string; rewards: PassReward[] };
  codex?: ChronicleCodexEntry[];
  /** v5.4 : passe propre à ce mois (sinon le passe commun). */
  pass?: MonthPass;
  auto?: ChapterAuto;
}

export interface ChroniclesConfig {
  months: ChronicleMonth[];
}

const L = (speaker: StoryLine["speaker"], text: string): StoryLine => ({ speaker, text });

export const DEFAULT_CHRONICLES: ChroniclesConfig = {
  months: [
    {
      id: "2026-10",
      title: "La Liste",
      theme: { accent: "#ffb347", label: "Ambre de la Ruche" },
      boss: {
        name: "Le Vaisseau-Liste de Varan",
        title: "Pourfendeur du Vaisseau-Liste",
        image: "/assets/chronicles/2026-10-boss.webp",
        emblem: "/assets/chronicles/2026-10-sceau.webp",
        fallbackImage: "/assets/story/varan.webp",
        lore: "Le vaisseau amiral de la Confrérie, couvert des noms de tous les empires que Varan a juré de ruiner. Le Silencieux se tient sur la proue.",
      },
      episodes: [
        {
          title: "Les informateurs",
          lines: [
            L("vashka", "Varan n'a pas digéré sa défaite, {pseudo}. Il a rouvert sa Liste, et il paie des informateurs pour la remplir."),
            L("vashka", "Retourne leur arme contre eux : envoie des sondes, observe qui parle à qui. Un nom sur la Liste, c'est aussi une piste vers lui."),
          ],
          objective: { type: "spy", count: 3 },
        },
        {
          title: "Les comptes de la Confrérie",
          lines: [
            L("varan", "{pseudo}… Ton nom remonte sur ma Liste. Chaque combat que tu gagnes me coûte un client. Chaque combat que tu perds m'en rapporte deux."),
            L("vashka", "Alors gagne. Montre au secteur que la Liste ne fait plus peur."),
          ],
          objective: { type: "victory", count: 3 },
        },
        {
          title: "Les seigneurs vendus",
          lines: [
            L("lysa", "Tu veux savoir qui vend des noms à Varan ? Je tiens les comptes de tout le monde, commandant. Brannoc, par exemple… très bien payé."),
            L("vashka", "Les seigneurs de guerre lui servent de rabatteurs. Frappe-en un : qu'ils comprennent que la Liste a un prix."),
          ],
          objective: { type: "warlordWin", count: 1 },
        },
        {
          title: "Le Vaisseau-Liste",
          lines: [
            L("varan", "Assez joué. Le dernier week-end du mois, le Vaisseau-Liste sortira du Vide. Tous les noms écrits sur sa coque tomberont avec toi."),
            L("vashka", "Prépare ton empire : contrats, réserves, flotte. Ce week-end-là, tout le secteur devra frapper ensemble."),
          ],
          objective: { type: "contract", count: 4 },
        },
      ],
    },
    {
      id: "2026-11",
      title: "Les Œufs de la Reine",
      theme: { accent: "#ff6a3d", label: "Braise de la Confrérie" },
      boss: {
        name: "La Couveuse de Kor",
        title: "Pourfendeur de la Couveuse",
        image: "/assets/chronicles/2026-11-boss.webp",
        emblem: "/assets/chronicles/2026-11-sceau.webp",
        fallbackImage: "/assets/story/cartel.webp",
        lore: "Née d'un œuf volé à la Reine de l'Essaim, bardée d'implants néon par le Cartel. Elle pond une nichée de guerre à chaque heure qui passe.",
      },
      episodes: [
        {
          title: "Les cendres de la Ruche",
          lines: [
            L("vashka", "Les ruines de notre Ruche-Mère fument encore. Dans les cendres, nous avons trouvé des traces de transport : des caisses frappées d'un sceau néon."),
            L("vashka", "Fouille les confins avec moi, {pseudo}. Chaque mission rapporte un indice."),
          ],
          objective: { type: "mission", count: 6 },
        },
        {
          title: "Suivre l'argent",
          lines: [
            L("nerea", "Les œufs de votre Reine ? Ils ont changé de mains trois fois sur le marché. Achetez, commandant, et je vous dirai à qui."),
            L("vashka", "Joue le jeu. Les marchands parlent quand on leur achète."),
          ],
          objective: { type: "market", count: 3 },
        },
        {
          title: "Le Cartel Néon",
          lines: [
            L("kor", "Madame Vashti Kor, enchantée. Les œufs ? Un investissement. Celui-ci a éclos, et ma Couveuse a très faim."),
            L("vashka", "Les chasseurs de la Ruche sont prêts. Remplis nos primes : chaque fugitif ramené affaiblit le Cartel."),
          ],
          objective: { type: "bounty", count: 2 },
        },
        {
          title: "La nichée de guerre",
          lines: [
            L("kor", "Ma Couveuse quitte le casino le dernier week-end du mois. Venez la voir, commandants. L'entrée est gratuite ; la sortie, beaucoup moins."),
            L("vashka", "Aguerris ta flotte d'ici là. Gagne des combats : la Couveuse ne respecte que la force."),
          ],
          objective: { type: "victory", count: 4 },
        },
      ],
    },
    {
      id: "2026-12",
      title: "Le Silence d'hiver",
      theme: { accent: "#9fd8ff", label: "Givre du Chœur" },
      boss: {
        name: "L'Écho de Vesper",
        title: "Pourfendeur de l'Écho",
        image: "/assets/chronicles/2026-12-boss.webp",
        emblem: "/assets/chronicles/2026-12-sceau.webp",
        fallbackImage: "/assets/story/choeur.webp",
        lore: "Une cathédrale de cristal noir prise dans les glaces, qui chante sans bouche. Là où passe son écho, les transmissions gèlent.",
      },
      episodes: [
        {
          title: "Le murmure",
          lines: [
            L("ilyon", "Je… les entends de nouveau. Le Chœur se réveille avec l'hiver. L'Archonte cherche une voix assez forte pour couvrir la mienne."),
            L("vashka", "Un déserteur du Chœur qui vient nous prévenir ? Prudence, {pseudo}. Vérifie ce qu'il dit : sonde le secteur."),
          ],
          objective: { type: "spy", count: 4 },
        },
        {
          title: "Le givre",
          lines: [
            L("vesper", "…"),
            L("ilyon", "C'est sa réponse. Le silence gèle les routes commerciales. Tiens tes contrats coûte que coûte, ou tes chantiers s'arrêteront."),
          ],
          objective: { type: "contract", count: 5 },
        },
        {
          title: "Les voix achetées",
          lines: [
            L("brannoc", "Le Chœur paie bien, gamin. Il ne parle pas, mais il paie. Moi et quelques autres, on lui ouvre la route."),
            L("vashka", "Alors coupe-lui la route. Brise deux seigneurs de guerre avant que l'hiver ne se referme."),
          ],
          objective: { type: "warlordWin", count: 2 },
        },
        {
          title: "La cathédrale de glace",
          lines: [
            L("ilyon", "L'Écho de Vesper arrive le dernier week-end de l'année. Une cathédrale entière, qui chante sans bouche."),
            L("vashka", "Alors faisons-lui entendre le bruit d'une flotte. Rassemble tout ce que tu as, {pseudo}."),
          ],
          objective: { type: "mission", count: 8 },
        },
      ],
    },
    {
      id: "2027-01",
      title: "Le Dégel",
      theme: { accent: "#7fd1ff", label: "Bleu glacier" },
      boss: {
        name: "Le Brise-Glace de Kragmor",
        title: "Pourfendeur du Brise-Glace",
        image: "/assets/chronicles/2027-01-boss.webp",
        emblem: "/assets/chronicles/2027-01-sceau.webp",
        fallbackImage: "/assets/story/gravhorn.webp",
        lore: "Un vaisseau-forage du Syndicat Gravhorn, à l'étrave hérissée de foreuses, qui brise la glace des routes gelées pour les revendre au plus offrant.",
      },
      episodes: [
        {
          title: "Les routes gelées",
          lines: [
            L("vashka", "L'hiver du Chœur s'est retiré, {pseudo}, mais il a laissé les routes prises dans la glace. Les prix flambent."),
            L("kragmor", "Flamber ? Moi, j'appelle ça « le marché ». Achète, petit. Tant que c'est encore moi qui fixe les prix."),
          ],
          objective: { type: "market", count: 4 },
        },
        {
          title: "Les convois",
          lines: [
            L("nerea", "Les convois d'hiver repartent. Escorte-les, ou Kragmor fera payer chaque tonne qui passe."),
            L("vashka", "Envoie tes équipes en mission, {pseudo}. Chaque route rouverte est une route de moins pour lui."),
          ],
          objective: { type: "mission", count: 8 },
        },
        {
          title: "Le prix de la glace",
          lines: [
            L("lysa", "J'ai vu ses registres. Il ne vend pas la glace : il vend des routes qu'il a lui-même bloquées."),
            L("vashka", "Alors trouve où sont ses foreuses. Sonde le secteur avant qu'il ne remette la main sur les passages."),
          ],
          objective: { type: "spy", count: 3 },
        },
        {
          title: "La débâcle",
          lines: [
            L("kragmor", "Mon Brise-Glace sort le dernier week-end du mois. Quiconque se met devant l'étrave finit en copeaux."),
            L("vashka", "Ses alliés d'abord. Brise deux seigneurs de guerre, {pseudo}, et il arrivera seul."),
          ],
          objective: { type: "warlordWin", count: 2 },
        },
      ],
    },
    {
      id: "2027-02",
      title: "Le Chœur brisé",
      theme: { accent: "#c58bff", label: "Violet du Chœur" },
      boss: {
        name: "La Cathédrale d'Ilyon",
        title: "Pourfendeur de la Cathédrale",
        image: "/assets/chronicles/2027-02-boss.webp",
        emblem: "/assets/chronicles/2027-02-sceau.webp",
        fallbackImage: "/assets/story/choeur.webp",
        lore: "La nef de cristal où Ilyon chantait autrefois, rappelée par le Chœur et retournée contre lui. Ses vitraux vibrent assez fort pour fendre une coque.",
      },
      episodes: [
        {
          title: "La fausse note",
          lines: [
            L("ilyon", "Ils ont rallumé ma cathédrale. Sans moi. Ce chant qui traverse le secteur… c'est ma voix, volée."),
            L("vashka", "Tes contrats d'abord, {pseudo}. Un empire qui tient ses engagements ne se laisse pas bercer par une chanson."),
          ],
          objective: { type: "contract", count: 5 },
        },
        {
          title: "Les fidèles",
          lines: [
            L("nerea", "Des empires entiers se tournent vers la cathédrale. Ils envoient leurs flottes là où le chant les appelle."),
            L("vashka", "Alors réveille-les à coups de canon. Gagne quatre combats, que tout le secteur l'entende."),
          ],
          objective: { type: "victory", count: 4 },
        },
        {
          title: "Le contre-chant",
          lines: [
            L("vashka", "L'Essaim ne chante pas, {pseudo}. Il chasse. Remplis trois primes : les chasseurs Kesh feront taire les fidèles."),
            L("ilyon", "Je connais les passages de la nef. Je vous les donnerai… si vous me rendez ma voix."),
          ],
          objective: { type: "bounty", count: 3 },
        },
        {
          title: "La nef",
          lines: [
            L("ilyon", "Le dernier week-end, la cathédrale entrera dans le secteur. Visez les vitraux : c'est là qu'elle respire."),
            L("vashka", "Prépare tes flottes, {pseudo}. Six missions pour rassembler tout ce qui peut voler."),
          ],
          objective: { type: "mission", count: 6 },
        },
      ],
    },
    {
      id: "2027-03",
      title: "Les Racines de Maru",
      theme: { accent: "#7dff9a", label: "Vert des racines" },
      boss: {
        name: "L'Avatar du Prophète",
        title: "Pourfendeur de l'Avatar",
        image: "/assets/chronicles/2027-03-boss.webp",
        emblem: "/assets/chronicles/2027-03-sceau.webp",
        fallbackImage: "/assets/leviathan/leviathan.webp",
        lore: "Un colosse de chair et de racines que le culte de Maru a fait pousser sur un astéroïde, à l'image du Léviathan qu'il vénère. Il grandit à chaque prière.",
      },
      episodes: [
        {
          title: "Les germes",
          lines: [
            L("maru", "Le printemps vient, enfants du vide. Et avec lui, la graine du Léviathan éclot dans votre secteur."),
            L("vashka", "Des racines sur les astéroïdes, {pseudo}. Sonde-les toutes : je veux savoir jusqu'où elles courent."),
          ],
          objective: { type: "spy", count: 4 },
        },
        {
          title: "Les fidèles armés",
          lines: [
            L("maru", "Mes frères seigneurs ont entendu l'appel. Ils protégeront le jardin."),
            L("vashka", "Alors arrache les gardiens. Brise deux seigneurs de guerre, et le jardin restera sans défense."),
          ],
          objective: { type: "warlordWin", count: 2 },
        },
        {
          title: "Les raids de printemps",
          lines: [
            L("varan", "Même moi, je n'aime pas ce qui pousse là-bas. La Confrérie frappera les colonies qui traînent : tiens bon, ou tu serviras d'engrais."),
            L("vashka", "Repousse trois raids, {pseudo}. Un empire qui plie nourrit les racines."),
          ],
          objective: { type: "raidRepelled", count: 3 },
        },
        {
          title: "La floraison",
          lines: [
            L("maru", "Le dernier week-end, l'Avatar ouvrira les yeux. Et le secteur entier priera avec moi."),
            L("vashka", "Le secteur entier tirera, oui. Tes contrats d'abord : il nous faudra chaque ressource, {pseudo}."),
          ],
          objective: { type: "contract", count: 5 },
        },
      ],
    },
  ],
};

let config: ChroniclesConfig = structuredClone(DEFAULT_CHRONICLES);

export function setChronicles(next: Partial<ChroniclesConfig> | null | undefined): void {
  config = { months: Array.isArray(next?.months) && next!.months.length > 0 ? structuredClone(next!.months) : structuredClone(DEFAULT_CHRONICLES.months) };
  setMonthPasses(config.months);
}

export function chroniclesConfig(): ChroniclesConfig {
  return config;
}

export function defaultChroniclesConfig(): ChroniclesConfig {
  return structuredClone(DEFAULT_CHRONICLES);
}

export function validateChronicles(cfg: Partial<ChroniclesConfig> | undefined): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const m of cfg?.months ?? []) {
    if (!/^\d{4}-\d{2}$/.test(m.id ?? "")) errors.push(`Chroniques : mois « ${m.id} » invalide (AAAA-MM).`);
    if (seen.has(m.id)) errors.push(`Chroniques : mois ${m.id} en double.`);
    seen.add(m.id);
    if (!Array.isArray(m.episodes) || m.episodes.length !== 4) errors.push(`Chroniques ${m.id} : il faut 4 épisodes.`);
    (m.episodes ?? []).forEach((e, i) => {
      if (!(e.objective?.type in OBJECTIVE_LABELS)) errors.push(`Chroniques ${m.id}, épisode ${i + 1} : objectif inconnu.`);
      if (!(e.objective?.count >= 1)) errors.push(`Chroniques ${m.id}, épisode ${i + 1} : nombre ≥ 1.`);
    });
    if (!m.boss?.name) errors.push(`Chroniques ${m.id} : nom du boss manquant.`);
    const rewards = [...(m.episodes ?? []).map((e) => e.reward ?? []), m.completion?.rewards ?? []].filter((r) => r.length > 0);
    if (rewards.length > 0) errors.push(...validateSeasonPass({ tiers: rewards }).map((e) => `Chroniques ${m.id} — ${e.replace(/^Passe, palier \d+ : /, "récompense : ")}`));
    if (m.pass) errors.push(...validateSeasonPass({ rules: { tiers: m.pass.tiers.length, pointsPerTier: m.pass.pointsPerTier }, tiers: m.pass.tiers }).map((e) => `Chroniques ${m.id} — ${e}`));
    if (m.completion && !m.completion.title?.trim()) errors.push(`Chroniques ${m.id} : titre de fin de chapitre manquant.`);
  }
  return errors;
}

/* ---------- calendrier ---------- */

const HOUR = 3600_000;

/** Date locale de Paris (année, mois 1-12, jour). */
function parisDate(now: number): { y: number; m: number; d: number } {
  const local = new Date(now + parisOffsetMs(now));
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate() };
}

export function chronicleMonthId(now: number): string {
  const { y, m } = parisDate(now);
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function chronicleOf(now: number): ChronicleMonth | null {
  const id = chronicleMonthId(now);
  return config.months.find((m) => m.id === id) ?? null;
}

/** Épisodes ouverts : le 1er, le 8, le 15 et le 22 du mois (heure de Paris). */
export function unlockedEpisodes(now: number): number {
  const { d } = parisDate(now);
  return d >= 22 ? 4 : d >= 15 ? 3 : d >= 8 ? 2 : 1;
}

/** Ouverture d'un épisode (affichage). */
export function episodeUnlockMs(monthId: string, index: number): number {
  const [y, m] = monthId.split("-").map(Number);
  return parisLocalToUtc(Date.UTC(y, m - 1, [1, 8, 15, 22][index] ?? 1));
}

/* ---------- progression du joueur ---------- */

export interface ChronicleState {
  monthId: string;
  progress: number[];
  claimed: number[];
  /** Mois dont le boss est tombé avec ce joueur parmi les assaillants (sceau gardé). */
  emblems: string[];
  /** v5.4 : mois dont les quatre épisodes ont été terminés. */
  chapters: string[];
}

export function chronicleState(player: Pick<PlayerState, "chronicle">, now: number): ChronicleState {
  const raw = (player.chronicle ?? {}) as Partial<ChronicleState>;
  const monthId = chronicleMonthId(now);
  const emblems = Array.isArray(raw.emblems) ? raw.emblems.map(String) : [];
  const chapters = Array.isArray(raw.chapters) ? raw.chapters.map(String) : [];
  if (raw.monthId !== monthId) return { monthId, progress: [0, 0, 0, 0], claimed: [], emblems, chapters };
  const progress = [0, 1, 2, 3].map((i) => Math.max(0, Number(raw.progress?.[i]) || 0));
  return { monthId, progress, claimed: (raw.claimed ?? []).map(Number).filter((n) => n >= 0 && n < 4), emblems, chapters };
}

/** Une action compte pour les épisodes ouverts et pas encore réclamés. */
export function recordChronicle(player: PlayerState, type: ChronicleObjective, now: number, times = 1): void {
  // v5.4 : les actions sans points de passe sont comptées ici (les autres dans addPassPoints).
  if (!(type in PASS_POINTS)) trackActivity(player, type, now, times);
  const month = chronicleOf(now);
  if (!month || !(times > 0)) return;
  const st = chronicleState(player, now);
  const open = unlockedEpisodes(now);
  let changed = false;
  month.episodes.slice(0, open).forEach((e, i) => {
    if (e.objective.type !== type || st.claimed.includes(i)) return;
    const next = Math.min(e.objective.count, st.progress[i] + times);
    if (next !== st.progress[i]) {
      st.progress[i] = next;
      changed = true;
    }
  });
  if (changed) player.chronicle = st;
}

export function claimChronicle(player: PlayerState, episode: unknown, now: number, random: () => number = Math.random): { points: number; gained: string[]; chapter: boolean } {
  const i = Math.floor(Number(episode));
  const month = chronicleOf(now);
  if (!month) throw new GameActionError("Pas de chronique ce mois-ci.");
  if (!(i >= 0 && i < month.episodes.length)) throw new GameActionError("Épisode inconnu.");
  if (i >= unlockedEpisodes(now)) throw new GameActionError("Cet épisode n'est pas encore ouvert.");
  const st = chronicleState(player, now);
  if (st.claimed.includes(i)) throw new GameActionError("Épisode déjà terminé.");
  const e = month.episodes[i];
  if (st.progress[i] < e.objective.count) throw new GameActionError(`Objectif pas encore atteint (${st.progress[i]} / ${e.objective.count}).`);
  st.claimed = [...st.claimed, i];
  player.chronicle = st;
  addPassPoints(player, "chronicle", now);
  const gained = (e.reward ?? []).map((r) => grantPassReward(player, r, month.id, now, random));
  // v5.4 : chapitre terminé : titre, bannière et récompense de fin.
  const chapter = month.episodes.every((_, k) => st.claimed.includes(k));
  if (chapter && month.completion) {
    const after = chronicleState(player, now);
    if (!after.chapters.includes(month.id)) after.chapters = [...after.chapters, month.id];
    player.chronicle = after;
    const title = month.completion.title.trim();
    if (title && !(player.titles ?? []).some((t) => t.label === title)) {
      player.titles = [...(player.titles ?? []), { label: title, seasonId: `chapter:${month.id}`, rank: 1 }];
      gained.push(`Titre « ${title} »`);
    }
    gained.push(`Bannière « ${month.title} »`);
    gained.push(...month.completion.rewards.map((r) => grantPassReward(player, r, month.id, now, random)));
  } else if (chapter) {
    const after = chronicleState(player, now);
    if (!after.chapters.includes(month.id)) after.chapters = [...after.chapters, month.id];
    player.chronicle = after;
  }
  return { points: PASS_POINTS.chronicle, gained, chapter };
}

// Les sources du passe qui sont aussi des objectifs d'épisode.
onPassPoints((player, source, now, times) => {
  if (source in OBJECTIVE_LABELS) recordChronicle(player, source as ChronicleObjective, now, times);
});

/* ---------- boss de saison ---------- */

export const SEASON_BOSS_KEY = "season_boss";

export const SEASON_BOSS_RULES: {
  /** v5.10.4 : réglable dans l'administration (règles « seasonBoss »). */
  enabled: boolean;
  weekend: BossWeekend;
  /** v5.10.5 : apparitions supplémentaires à date précise. */
  dates: BossDate[];
  /** Heure d'apparition le vendredi (heure de Paris). */
  startHour: number;
  /** Points de structure : ce facteur × puissance d'attaque des joueurs actifs (7 j). */
  hpFactor: number;
  minHp: number;
  /** Durée de présence (h). v5.14.2 : 48 h, pour tenir entre deux boss mondiaux. */
  durationHours: number;
  topRelics: number;
  /** v5.14.2 : chaque semaine, en alternance avec le boss mondial (sinon : un week-end par mois). */
  alternate?: boolean;
  /** 5.15 : un assaut toutes les N heures par joueur (absent : comme le boss mondial). */
  cooldownHours?: number;
  /** 5.15 : trajet aller (et retour), en minutes. */
  flightMinutes?: number;
  /** 5.15 : multiplicateur des pertes à chaque assaut (1 = boss mondial). */
  lossMult?: number;
  /** 5.15 : vaisseaux qui peuvent être sa faiblesse en phase 3 (vide : liste commune). */
  weakness?: string[];
} = {
  enabled: true,
  weekend: "last",
  dates: [],
  startHour: 18,
  hpFactor: 3,
  minHp: 100_000,
  durationHours: 48,
  topRelics: 3,
  alternate: true,
};

export function seasonBossSchedule(): BossSchedule {
  return {
    enabled: SEASON_BOSS_RULES.enabled !== false,
    weekend: SEASON_BOSS_RULES.weekend ?? "last",
    startHour: SEASON_BOSS_RULES.startHour ?? 18,
    durationHours: SEASON_BOSS_RULES.durationHours,
    dates: SEASON_BOSS_RULES.dates ?? [],
    // v5.14.2 : une fois par semaine, entre deux passages du boss mondial (repli mensuel sans rotation hebdomadaire).
    ...(SEASON_BOSS_RULES.alternate !== false ? { weekly: { minGapDays: 0, between: leviathanSchedule() } } : {}),
  };
}

/** Fenêtre du boss de saison, en cours ou à venir (ou null si le mois n'a pas de boss). */
export function seasonBossWindow(now: number, includeUpcoming = false): { id: string; monthId: string; startMs: number; endMs: number } | null {
  const [w] = bossWindows(now, seasonBossSchedule(), 1);
  if (!w) return null;
  const friday = parisDate(w.startMs);
  const monthId = `${friday.y}-${String(friday.m).padStart(2, "0")}`;
  if (!config.months.some((m) => m.id === monthId)) return null;
  if (now < w.startMs && !includeUpcoming) return null;
  // Date précise : identifiant propre (plusieurs combats possibles dans le même mois).
  // v5.14.2 : rythme hebdomadaire : un combat par apparition.
  const weekly = !w.fixed && !!seasonBossSchedule().weekly?.between?.weekly;
  return { id: w.fixed ? `boss-${monthId}-d${w.startMs}` : weekly ? `boss-${monthId}-w${w.startMs}` : `boss-${monthId}`, monthId, startMs: w.startMs, endMs: w.endMs };
}

export function seasonBossHp(activePlayers: Pick<PlayerState, "units" | "techLevels">[]): number {
  const power = activePlayers.reduce((a, p) => a + computeFullPower(p.units ?? {}, p.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]), 0);
  return Math.max(SEASON_BOSS_RULES.minHp, Math.round(power * SEASON_BOSS_RULES.hpFactor));
}

export function spawnSeasonBoss(window: { id: string; startMs: number; endMs: number }, activePlayers: Pick<PlayerState, "units" | "techLevels">[]): LeviathanState {
  const maxHp = seasonBossHp(activePlayers);
  return { id: window.id, startMs: window.startMs, endMs: window.endMs, maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [{ t: window.startMs, hp: maxHp }] };
}

export function bossMonthOf(state: Pick<LeviathanState, "id">): ChronicleMonth | null {
  const monthId = state.id.replace(/^boss-/, "").slice(0, 7);
  return config.months.find((m) => m.id === monthId) ?? null;
}

export function checkSeasonBossLaunch(state: LeviathanState | null, uid: string, pseudo: string, now: number): LeviathanState {
  const name = state ? bossMonthOf(state)?.boss.name ?? "Le boss de saison" : "Le boss de saison";
  if (!state || state.status !== "active" || now < state.startMs || now >= state.endMs || state.hp <= 0) throw new GameActionError(`${name} n'est pas là en ce moment.`);
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + seasonBossCooldownHours() * HOUR - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 60_000)} min.`);
  return { ...state, contributions: { ...state.contributions, [uid]: { pseudo, damage: c?.damage ?? 0, assaults: c?.assaults ?? 0, lastLaunchMs: now } } };
}

/** Récompense d'un participant : +60 points de passe ; si le boss tombe, sceau et titre, relique épique pour le podium. */
export function grantSeasonBossReward(state: LeviathanState, player: PlayerState, now: number, random: () => number = Math.random): { points: number; title: string | null; emblem: boolean; relic?: string } {
  const month = bossMonthOf(state);
  const ranking = leviathanRanking(state);
  const rank = ranking.findIndex((r) => r.uid === player.uid);
  if (rank < 0) return { points: 0, title: null, emblem: false };
  addPassPoints(player, "seasonBoss", now);
  if (state.status !== "killed" || !month) return { points: PASS_POINTS.seasonBoss, title: null, emblem: false };
  const title = month.boss.title;
  if (!(player.titles ?? []).some((t) => t.label === title)) player.titles = [...(player.titles ?? []), { label: title, seasonId: `boss:${month.id}`, rank: rank + 1 }];
  const st = chronicleState(player, now);
  if (!st.emblems.includes(month.id)) st.emblems = [...st.emblems, month.id];
  player.chronicle = st;
  let relic: string | undefined;
  if (rank < SEASON_BOSS_RULES.topRelics) {
    const item = rollRelic(`boss:${month.id}`, now, random, "epic");
    if (addRelic(player, item)) relic = relicLabel(item);
  }
  return { points: PASS_POINTS.seasonBoss, title, emblem: true, relic };
}

/** Sceaux de boss gagnés (emblèmes de profil). */
export function bossEmblems(player: Pick<PlayerState, "chronicle">): { id: string; label: string; image: string; unlocked: boolean }[] {
  const owned = new Set(((player.chronicle as ChronicleState | undefined)?.emblems ?? []).map(String));
  return config.months.map((m) => ({ id: `boss:${m.id}`, label: `Sceau : ${m.boss.name}`, image: m.boss.emblem, unlocked: owned.has(m.id) }));
}
