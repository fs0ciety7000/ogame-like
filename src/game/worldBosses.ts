/* =====================================================
   v5.14 : boss mondiaux. Six colosses se relaient, un par semaine, à la
   place du Léviathan mensuel (qui devient l'un d'eux). Chaque semaine le
   jour d'apparition change : jamais le même jour que le boss précédent,
   et au moins quatre jours entre deux apparitions. Durée : 72 h par
   défaut (réglable). Le boss de saison des Chroniques reste à part.

   Le moteur de combat est celui du Léviathan (leviathan.ts) : ce module
   ne fournit que l'identité du boss de la semaine (nom, histoire, image,
   prompts, statistiques, phases, titre) et le calendrier.
   Pas d'import de module de jeu : il est lu par events.ts et leviathan.ts.
===================================================== */

export interface WorldBossPhase {
  name: string;
  /** Ce que le boss fait dans cette phase (récit ; la mécanique est commune). */
  flavor: string;
}

export interface WorldBossDef {
  id: string;
  /** v5.14 : retiré de la rotation (ses combats passés gardent son identité). Absent : actif. */
  enabled?: boolean;
  name: string;
  /** « Le dévoreur des abysses ». */
  epithet: string;
  story: string;
  /** Illustration 16:9 (à défaut, celle du Léviathan s'affiche). */
  image: string;
  /** Prompt Midjourney de l'illustration (16:9). */
  prompt: string;
  /** Multiplicateur des points de structure (1 = Léviathan). */
  hpMult: number;
  /** Multiplicateur des pertes à chaque assaut. */
  lossMult: number;
  /** Vaisseaux qui peuvent être sa faiblesse en phase 3. */
  weakness: string[];
  phases: [WorldBossPhase, WorldBossPhase, WorldBossPhase];
  /** Titre (7 jours) du premier en dégâts quand il tombe. */
  title: string;
  /** Couleur (bannière de profil, liserés). */
  accent: string;
  /** Multiplicateur des heures de production de récompense. */
  rewardMult: number;
}

export const DEFAULT_WORLD_BOSSES: WorldBossDef[] = [
  {
    id: "leviathan",
    accent: "#4be8ff",
    name: "Le Léviathan",
    epithet: "le dévoreur des abysses",
    story: "Né dans les profondeurs d'une géante gazeuse morte, le Léviathan remonte à la surface du secteur quand la faim le prend. Sa carapace a avalé des flottes entières ; ses écailles en gardent les épaves.",
    image: "/assets/leviathan/leviathan.webp",
    prompt: "/imagine prompt: sci-fi strategy game key art, a colossal armored space leviathan rising from the clouds of a dead gas giant, wrecked warships embedded in its scales, tiny battle fleets swarming around it, cyan #4be8ff and gold #ffd86b light, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250",
    hpMult: 1,
    lossMult: 1,
    weakness: ["fregate", "chasseur", "intercepteur", "croiseur_nova", "lance_gravitationnelle", "etoile_noire"],
    phases: [
      { name: "Assaut", flavor: "Le colosse encaisse sans broncher." },
      { name: "Riposte", flavor: "Blessé, il fouette l'espace de sa queue blindée." },
      { name: "Carapace fissurée", flavor: "Il se replie dans sa carapace, mais une faille s'ouvre." },
    ],
    title: "Fléau du Léviathan",
    rewardMult: 1,
  },
  {
    id: "matriarche",
    accent: "#ffd86b",
    name: "La Matriarche",
    epithet: "mère de l'Essaim",
    story: "Quand la Reine des Kesh'Vaar a disparu, sa sœur a pris le trône de chitine. La Matriarche ne combat pas seule : chaque blessure libère une nuée de rejetons qui harcèlent les flottes.",
    image: "/assets/bosses/matriarche.webp",
    prompt: "/imagine prompt: sci-fi strategy game key art, a gigantic insectoid hive queen floating in space, translucent amber carapace, swarms of smaller bio-ships pouring from her abdomen, hive structures glowing gold #ffd86b, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250",
    hpMult: 0.9,
    lossMult: 1.15,
    weakness: ["chasseur", "intercepteur", "fregate"],
    phases: [
      { name: "Nuée", flavor: "Ses rejetons couvrent son approche." },
      { name: "Frénésie", flavor: "Blessée, elle lâche toute sa couvée sur les assaillants." },
      { name: "Couvée exposée", flavor: "Sa poche de ponte est à nu : frappez-la." },
    ],
    title: "Fléau de la Matriarche",
    rewardMult: 1,
  },
  {
    id: "titan",
    accent: "#ff8a3d",
    name: "Le Titan de rouille",
    epithet: "la forge qui marche",
    story: "Une station-forge de l'ancien empire, devenue folle après trois siècles seule. Elle dévore les épaves pour grandir, et refait ses blindages à mesure qu'on les arrache.",
    image: "/assets/bosses/titan.webp",
    prompt: "/imagine prompt: sci-fi strategy game key art, a colossal rusted war machine made from fused station modules and wrecked hulls, glowing ember #ff8a3d forge furnaces in its chest, mechanical arms tearing a cruiser apart, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250",
    hpMult: 1.25,
    lossMult: 0.85,
    weakness: ["croiseur_nova", "lance_gravitationnelle", "etoile_noire"],
    phases: [
      { name: "Blindage", flavor: "Ses plaques de rouille absorbent les salves." },
      { name: "Refonte", flavor: "Il fond les épaves pour se reconstruire, et frappe en retour." },
      { name: "Fournaise à nu", flavor: "Son cœur de forge est exposé." },
    ],
    title: "Briseur du Titan",
    rewardMult: 1.1,
  },
  {
    id: "spectre",
    accent: "#a78bfa",
    name: "Le Spectre du Chœur",
    epithet: "la voix dans le silence",
    story: "Le Chœur Silencieux a laissé derrière lui une conscience sans corps. Le Spectre brouille les capteurs, retourne les sondes et chante dans les canaux de communication jusqu'à ce que les équipages perdent la raison.",
    image: "/assets/bosses/spectre.webp",
    prompt: "/imagine prompt: sci-fi strategy game key art, an enormous ghostly entity made of violet #a78bfa light and static, a faceless choir of luminous figures forming its body, warships with flickering shields drifting in confusion, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250",
    hpMult: 0.85,
    lossMult: 1.1,
    weakness: ["intercepteur", "fregate", "croiseur_nova"],
    phases: [
      { name: "Brouillage", flavor: "Les capteurs ne voient qu'un mirage." },
      { name: "Chant", flavor: "Son chant retourne les systèmes des vaisseaux." },
      { name: "Silence", flavor: "Il se tait, et devient enfin visible." },
    ],
    title: "Exorciste du Chœur",
    rewardMult: 1,
  },
  {
    id: "cometophage",
    accent: "#ff5c7a",
    name: "Le Cométophage",
    epithet: "le mangeur d'étoiles filantes",
    story: "Il suit les comètes depuis des millénaires et se nourrit de leur glace. Quand il approche, le ciel s'emplit de traînées de feu : chacune est un fragment qu'il a recraché.",
    image: "/assets/bosses/cometophage.webp",
    prompt: "/imagine prompt: sci-fi strategy game key art, a gigantic serpentine space creature wrapped around a blazing scarlet comet, its body shedding burning ice fragments like a meteor shower, hunter fleets diving between the fragments, red #ff5c7a and cyan light, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250",
    hpMult: 1.05,
    lossMult: 1.05,
    weakness: ["lance_gravitationnelle", "croiseur_nova", "chasseur"],
    phases: [
      { name: "Pluie de feu", flavor: "Il s'entoure d'une pluie de fragments brûlants." },
      { name: "Constriction", flavor: "Il s'enroule autour de sa comète et écrase ce qui approche." },
      { name: "Gorge ouverte", flavor: "Il avale la comète : sa gueule est à découvert." },
    ],
    title: "Chasseur du Cométophage",
    rewardMult: 1,
  },
  {
    id: "abyssal",
    accent: "#ff5fd2",
    name: "L'Abyssal",
    epithet: "ce qui dort sous le Vide",
    story: "Personne ne l'a jamais vu en entier. Les éclaireurs parlent d'un œil grand comme une lune et d'une ombre qui éteint les étoiles. Quand l'Abyssal se réveille, même les seigneurs de guerre rentrent au port.",
    image: "/assets/bosses/abyssal.webp",
    prompt: "/imagine prompt: sci-fi strategy game key art, an unfathomably huge shadowy creature emerging from a black void, a single glowing magenta #ff5fd2 eye the size of a moon, stars going dark around its silhouette, a tiny fleet in the foreground for scale, cinematic wide shot, painterly concept art, high detail, no text --ar 16:9 --v 7 --style raw --s 250",
    hpMult: 1.4,
    lossMult: 1.2,
    weakness: ["etoile_noire", "lance_gravitationnelle"],
    phases: [
      { name: "Éveil", flavor: "L'ombre s'étire, lentement." },
      { name: "Marée noire", flavor: "Elle engloutit des escadres entières." },
      { name: "L'Œil", flavor: "L'œil s'ouvre : visez-le." },
    ],
    title: "Veilleur de l'Abîme",
    rewardMult: 1.25,
  },
];

export const WORLD_BOSS_RULES = {
  /** Écart minimal entre deux apparitions (jours, de début à début). */
  minGapDays: 4,
  /** Semaine de référence : lundi 5 janvier 2026 (heure de Paris). */
  anchorMondayUtc: Date.UTC(2026, 0, 5),
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const WORLD_BOSS_RULES_META = {
  minGapDays: { label: "Écart minimal entre deux apparitions", unit: "j", min: 1, max: 6, hint: "De début à début ; 6 au plus (une par semaine)." },
  anchorMondayUtc: { label: "Semaine de référence (un lundi)", unit: "date", min: 0, hint: "Changer cette date décale tout le calendrier des boss." },
};

const DAY = 86_400_000;

/** Catalogue en vigueur (remplacé par applyGameContent, section « worldBosses »). */
export const WORLD_BOSSES: WorldBossDef[] = DEFAULT_WORLD_BOSSES.map((b) => ({ ...b, phases: [...b.phases] as WorldBossDef["phases"], weakness: [...b.weakness] }));

/** Applique le catalogue de l'administration : les boss du code restent connus
 *  (combats passés), retouchés champ par champ ; un boss ajouté s'ajoute. */
export function setWorldBosses(defs: Partial<WorldBossDef>[] | undefined): void {
  const byId = new Map<string, WorldBossDef>(DEFAULT_WORLD_BOSSES.map((b) => [b.id, { ...b }]));
  for (const d of defs ?? []) {
    if (!d?.id) continue;
    const base = byId.get(d.id) ?? DEFAULT_WORLD_BOSSES[0];
    byId.set(d.id, { ...base, ...d, id: d.id } as WorldBossDef);
  }
  WORLD_BOSSES.splice(0, WORLD_BOSSES.length, ...byId.values());
}

/** Boss de la rotation (activés), Léviathan à défaut. */
export function activeWorldBosses(): WorldBossDef[] {
  const on = WORLD_BOSSES.filter((b) => b.enabled !== false);
  return on.length ? on : [WORLD_BOSSES[0] ?? DEFAULT_WORLD_BOSSES[0]];
}

export function validateWorldBosses(defs: Partial<WorldBossDef>[] | undefined): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const b of defs ?? []) {
    const at = `Boss mondial ${b?.name || b?.id || "?"}`;
    if (!b?.id || !/^[a-z0-9_]+$/.test(b.id)) errors.push(`${at} : identifiant invalide (minuscules, chiffres, _).`);
    else if (ids.has(b.id)) errors.push(`${at} : identifiant en double.`);
    if (b?.id) ids.add(b.id);
    if (b.name !== undefined && !String(b.name).trim()) errors.push(`${at} : nom manquant.`);
    if (b.title !== undefined && !String(b.title).trim()) errors.push(`${at} : titre manquant.`);
    for (const k of ["hpMult", "lossMult", "rewardMult"] as const) {
      const v = b[k];
      if (v !== undefined && !(typeof v === "number" && v >= 0.1 && v <= 5)) errors.push(`${at} : ${k === "hpMult" ? "structure" : k === "lossMult" ? "pertes" : "récompenses"} entre 0,1 et 5.`);
    }
    if (b.phases !== undefined && (!Array.isArray(b.phases) || b.phases.length !== 3 || b.phases.some((p) => !p?.name?.trim()))) errors.push(`${at} : trois phases nommées.`);
  }
  const merged = new Map<string, boolean>(DEFAULT_WORLD_BOSSES.map((b) => [b.id, true]));
  for (const b of defs ?? []) if (b?.id) merged.set(b.id, b.enabled !== false);
  if (![...merged.values()].some(Boolean)) errors.push("Boss mondiaux : il faut au moins un boss dans la rotation.");
  return errors;
}

export function findWorldBoss(id: string | undefined): WorldBossDef {
  return WORLD_BOSSES.find((b) => b.id === id) ?? WORLD_BOSSES[0] ?? DEFAULT_WORLD_BOSSES[0];
}

/** Petit générateur déterministe (pas de dépendance, code serveur). */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Jours permis après un boss tombé le jour `prev` (0 = lundi) : pas le même jour,
 *  et au moins `minGap` jours entre les deux débuts. */
export function allowedDays(prev: number, minGap: number): number[] {
  const gap = Math.max(1, Math.min(6, Math.floor(minGap)));
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== prev && 7 + d - prev >= gap);
}

const dayCache = new Map<number, number[]>();

/** Jour de la semaine (0 = lundi) du boss de la semaine n (depuis la semaine de référence). */
export function worldBossDay(week: number, minGap = WORLD_BOSS_RULES.minGapDays): number {
  if (week < 0) return Math.floor(hash01(`wb-day:${week}`) * 7);
  let days = dayCache.get(minGap);
  if (!days) {
    days = [Math.floor(hash01("wb-day:0") * 7)];
    dayCache.set(minGap, days);
  }
  while (days.length <= week) {
    const n = days.length;
    const allowed = allowedDays(days[n - 1], minGap);
    days.push(allowed[Math.floor(hash01(`wb-day:${n}`) * allowed.length) % allowed.length]);
  }
  return days[week];
}

/** Boss de la semaine n : rotation des six. */
export function worldBossOfWeek(week: number): WorldBossDef {
  const list = activeWorldBosses();
  return list[((week % list.length) + list.length) % list.length];
}

/** Semaine (depuis la référence) d'un instant exprimé en heure locale de Paris. */
export function weekOfLocal(localMs: number): number {
  return Math.floor((localMs - WORLD_BOSS_RULES.anchorMondayUtc) / (7 * DAY));
}
