import { COMMANDER_ROLES, setSeasonCommanders, type CommanderId, type SeasonCommanderDef } from "@/game/commanders";
import { OBJECTIVE_LABELS, type ChronicleObjective } from "@/game/chronicles";
import { BASE_COUNTS, generatePass, seededRandom, type WorldDigest } from "@/game/procedural";
import { PASS_RULES, setPassSeasonOverrides, type MonthPass, type PassRequirement, type PassReward } from "@/game/seasonPass";
import { seasonLabel } from "@/game/seasons";
import { STORY_SPEAKERS, type Speaker, type StoryLine } from "@/game/story";
import { catalogEntryFor, catalogIndex, illustrationPrompt, portraitPrompt, THEME_PRIMARY } from "@/game/seasonCatalog";

/* =====================================================
   v5.13 : passes de saison procéduraux. Chaque mois, le moteur écrit un
   brouillon complet que l'équipe relit, retouche puis publie :
   - un thème (nom, accroche, couleur, illustration) : v5.14, celui du
     catalogue (seasonCatalog.ts, douze thèmes en rotation sur trois ans) ;
   - un scénario en quatre temps (prologue, paliers 10, 20 et 30) porté par
     un mentor et un rival ;
   - 30 paliers de récompenses (points par palier ajustés sur le mois écoulé) ;
   - des prérequis aux paliers 10, 20 et 30 (actions du mois, calibrées sur
     l'activité médiane des joueurs) ;
   - au dernier palier : un commandant de saison inédit (rôle principal +
     moitié d'un second rôle) et une forte somme d'Ambre.
   Seuls les passes publiés s'appliquent ; un brouillon oublié est publié
   d'office au début de son mois (tâche du générateur).
===================================================== */

export const PASS_SEASONS_SECTION = "passSeasons";

/** Ambre du dernier palier, en plus du commandant (un recrutement coûte 150). */
export const PASS_FINAL_AMBER = 300;
/** Paliers à prérequis et part du mois de l'activité médiane demandée. */
export const PASS_GATES: { tier: number; share: number; mult: number }[] = [
  { tier: 10, share: 0.25, mult: 1 },
  { tier: 20, share: 0.45, mult: 2 },
  { tier: 30, share: 0.7, mult: 3 },
];

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
  /** Prérequis par palier (clé : numéro de palier). */
  requirements: Record<string, PassRequirement>;
  commander: SeasonCommanderDef & { prompt: string };
  auto?: { generatedAtMs: number; variant: number; reasons: string[] };
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
  names: string[];
  taglines: string[];
  accent: string;
  image: string;
  mentor: Speaker;
  rival: Speaker;
  /** Actions mises en avant (prérequis). */
  focus: ChronicleObjective[];
  /** Rôles du commandant de saison (principal, second). */
  roles: [CommanderId, CommanderId][];
  commanderTitles: string[];
  firstNames: string[];
  lastNames: string[];
  synopsis: string[];
  /** Répliques : prologue, palier 10, palier 20, palier 30 (mentor puis rival). */
  beats: [string[], string[], string[], string[]];
  rivalLines: [string[], string[], string[], string[]];
  lore: string[];
  /** Pour le prompt Midjourney du portrait. */
  look: string;
}

export const PASS_THEMES: PassTheme[] = [
  {
    id: "maree",
    names: ["Marée d'Acier", "Ressac de guerre", "La Grande Houle"],
    taglines: ["Une flotte se lève, une autre sombre.", "Tenir la ligne, briser la vague."],
    accent: "#4be8ff",
    image: "/assets/blog/articles/5-9/poste-commandement.webp",
    mentor: "vashka",
    rival: "varan",
    focus: ["victory", "raidRepelled", "bounty"],
    roles: [["admiral", "strategist"], ["strategist", "admiral"]],
    commanderTitles: ["Amirale des Marées", "Brise-Ligne", "Capitaine de la Houle"],
    firstNames: ["Ysolde", "Maren", "Corvin", "Thessa", "Joran"],
    lastNames: ["Vael", "Drakmor", "Solenne", "Kestrel", "Haldane"],
    synopsis: ["{rival} rassemble ses escadres au bord du secteur. {mentor} sonne le rassemblement : ce mois-ci, chaque bataille compte."],
    beats: [
      ["Les sondes ont repéré leurs escadres, commandant. Prépare ta flotte : on ne les laissera pas passer."],
      ["Première ligne tenue. Ils reculent, mais ils reviendront plus nombreux."],
      ["Leur vaisseau amiral s'est montré. Un officier hors pair a rejoint nos rangs pour la dernière bataille."],
      ["La houle est retombée. {commander} a choisi ta bannière : sers-toi bien de cet officier."],
    ],
    rivalLines: [["Vos flottes sont des coquilles vides. La marée vous emportera."], ["Une vaguelette. Rien de plus."], ["Assez joué. Toute ma flotte converge sur vous."], ["Cette fois... vous avez gagné."]],
    lore: ["{commander} a commandé trois flottes de ligne avant ses trente ans. On dit qu'elle n'a jamais perdu une bataille qu'elle avait choisie."],
    look: "a fierce naval fleet admiral, weathered face, long coat with cyan trim, holographic tactical map behind",
  },
  {
    id: "forge",
    names: ["Forge Stellaire", "Le Grand Chantier", "Cœur de l'Enclume"],
    taglines: ["Bâtir plus vite que l'ennemi ne détruit.", "Chaque rivet est une victoire."],
    accent: "#ffb347",
    image: "/assets/blog/articles/5-10/pot-commun.webp",
    mentor: "lysa",
    rival: "kragmor",
    focus: ["contract", "victory", "bounty"],
    roles: [["engineer", "steward"], ["engineer", "admiral"]],
    commanderTitles: ["Maître de Forge", "Architecte des Étoiles", "Ingénieure en chef"],
    firstNames: ["Aldric", "Nyra", "Bastien", "Oriane", "Tamsin"],
    lastNames: ["Ferrand", "Okonkwo", "Rivet", "Castellan", "Brandt"],
    synopsis: ["{rival} a mis la main sur les forges du secteur. {mentor} veut les reprendre, chantier par chantier."],
    beats: [
      ["Les forges tournent pour l'ennemi. Il nous faut des contrats et des bras : on commence ce mois-ci."],
      ["Première forge reprise ! Les ouvriers reviennent."],
      ["Un architecte de légende accepte de nous rejoindre si nous tenons jusqu'au bout."],
      ["Les forges sont à nous. {commander} prend la tête de tes chantiers."],
    ],
    rivalLines: [["Mes forges, mes règles. Payez ou partez."], ["Une forge ? J'en ai cent."], ["Vous m'agacez. Mes foreuses vont raser vos chantiers."], ["Gardez vos forges. Pour l'instant."]],
    lore: ["{commander} a bâti une station orbitale entière en quarante jours. Ses plans circulent encore sous le manteau."],
    look: "a brilliant starship engineer, welding goggles on forehead, orange-lit forge sparks, mechanical arm",
  },
  {
    id: "archives",
    names: ["L'Ombre des Archives", "Les Fichiers noirs", "Silence radio"],
    taglines: ["Savoir avant d'agir.", "Ce que l'ennemi cache, nous le trouverons."],
    accent: "#a78bfa",
    image: "/assets/blog/articles/reliques/couverture.webp",
    mentor: "nerea",
    rival: "vesper",
    focus: ["spy", "victory", "raidRepelled"],
    roles: [["spy", "strategist"], ["spy", "admiral"]],
    commanderTitles: ["Maîtresse des Ombres", "Archiviste noire", "Chiffreuse"],
    firstNames: ["Iris", "Calix", "Sélène", "Wren", "Ambroise"],
    lastNames: ["Noct", "Vashenko", "Lisière", "Moreau", "Quill"],
    synopsis: ["Des archives volées circulent dans le secteur. {rival} veut les effacer ; {mentor} veut les lire avant lui."],
    beats: [
      ["Nos sondes doivent percer leurs secrets avant qu'ils ne disparaissent. Espionne, commandant."],
      ["Un premier fichier déchiffré. Il cite un nom que je croyais mort."],
      ["Une agente double propose ses services. Elle demande une seule chose : que tu ailles jusqu'au bout."],
      ["Les archives sont à l'abri. {commander} rejoint ton état-major, avec tous ses secrets."],
    ],
    rivalLines: [["Ce que vous cherchez n'existe pas."], ["Curieux. Trop curieux."], ["J'efface tout. Vous aussi, s'il le faut."], ["Gardez vos archives. Je garde mes ombres."]],
    lore: ["{commander} a lu les dossiers de chaque amiral du secteur. Personne ne sait pour qui elle travaillait avant."],
    look: "a mysterious spymaster in a dark hooded coat, violet holographic data streams, half of face in shadow",
  },
  {
    id: "hiver",
    names: ["Hiver galactique", "La Longue Nuit", "Givre éternel"],
    taglines: ["Tenir jusqu'au dégel.", "Le froid ne pardonne qu'aux préparés."],
    accent: "#9fd8ff",
    image: "/assets/chronicles/2026-12-boss.webp",
    mentor: "ilyon",
    rival: "vesper",
    focus: ["raidRepelled", "contract", "victory"],
    roles: [["strategist", "steward"], ["steward", "strategist"]],
    commanderTitles: ["Gardienne du Givre", "Intendant des Glaces", "Veilleur polaire"],
    firstNames: ["Elin", "Torvald", "Aube", "Sigrun", "Kaël"],
    lastNames: ["Frost", "Nordahl", "Blanchard", "Ivarsen", "Hiems"],
    synopsis: ["Une nuée de glace dérive vers le secteur. {mentor} organise la défense ; {rival} compte bien en profiter."],
    beats: [
      ["Le froid arrive. Remplis tes entrepôts, renforce tes défenses : la nuit sera longue."],
      ["Les premiers raids sont repoussés. Le givre recule d'un cran."],
      ["Une gardienne des glaces a survécu à trois hivers comme celui-ci. Elle veut nous aider."],
      ["Le dégel commence. {commander} veille désormais sur tes réserves."],
    ],
    rivalLines: [["L'hiver est mon allié. Vous gèlerez."], ["Un feu de camp contre une tempête."], ["Mes raids frapperont au plus froid de la nuit."], ["Le printemps... déjà ?"]],
    lore: ["{commander} a tenu une colonie entière pendant un hiver de quatre cents jours, sans perdre un colon."],
    look: "a stoic winter guardian in white armored furs, frost on shoulders, pale blue aurora behind",
  },
  {
    id: "comete",
    names: ["Comète écarlate", "La Pluie de feu", "Sillage rouge"],
    taglines: ["Elle passe une fois par siècle. Pas deux.", "Tout ce qui tombe se ramasse."],
    accent: "#ff5c7a",
    image: "/assets/blog/articles/5-10/coup-de-grace.webp",
    mentor: "brannoc",
    rival: "kor",
    focus: ["bossAssault", "victory", "bounty"],
    roles: [["admiral", "engineer"], ["admiral", "spy"]],
    commanderTitles: ["Chasseuse de comètes", "Pilote du sillage", "Briseur d'astres"],
    firstNames: ["Rook", "Liora", "Dante", "Kira", "Saul"],
    lastNames: ["Ember", "Castaway", "Vortan", "Ashby", "Ruiz"],
    synopsis: ["Une comète écarlate traverse le secteur, chargée de minerais rares. {rival} veut tout rafler ; {mentor} a d'autres plans."],
    beats: [
      ["Elle arrive, commandant ! Tout ce qui s'en détache est à prendre. Fais chauffer les moteurs."],
      ["Premiers fragments récupérés. Le Cartel commence à s'énerver."],
      ["Une pilote a suivi la comète depuis trois systèmes. Elle connaît son cœur."],
      ["La comète s'éloigne, ses trésors dans nos soutes. {commander} reste avec nous."],
    ],
    rivalLines: [["Cette comète m'appartient. Comme tout le reste."], ["Des miettes. Laissez-les-moi."], ["Mes chasseurs vont vous balayer de son sillage."], ["Vous me devez une comète."]],
    lore: ["{commander} a posé son vaisseau sur une comète en pleine course. Deux fois."],
    look: "a daring comet-chasing pilot, scarred flight jacket, red glowing comet tail reflected in visor",
  },
  {
    id: "primes",
    names: ["Saison des chasseurs", "Tableau de chasse", "La Grande Traque"],
    taglines: ["Chaque tête a un prix.", "La proie d'aujourd'hui, le trophée de demain."],
    accent: "#ffd86b",
    image: "/assets/blog/articles/5-9/podium-or.webp",
    mentor: "vashka",
    rival: "maru",
    focus: ["bounty", "victory", "warlordWin"],
    roles: [["admiral", "spy"], ["spy", "admiral"]],
    commanderTitles: ["Grande Traqueuse", "Maître de la chasse", "Lame de l'Essaim"],
    firstNames: ["Vex", "Morgane", "Talon", "Isha", "Bram"],
    lastNames: ["Kesh", "Hollow", "Vargas", "Thorne", "Silvane"],
    synopsis: ["L'Essaim Kesh'Vaar ouvre sa grande traque. {rival} met sa propre tête à prix, par défi. {mentor} veut le meilleur chasseur du secteur."],
    beats: [
      ["La traque est ouverte. Remplis les primes, et que l'Essaim retienne ton nom."],
      ["Ton tableau de chasse s'allonge. Les autres chasseurs commencent à te craindre."],
      ["Une traqueuse légendaire te suit à la trace. Elle veut voir qui chasse aussi bien qu'elle."],
      ["La traque est finie, et tu es en tête. {commander} chassera désormais pour toi."],
    ],
    rivalLines: [["Ma tête vaut une fortune. Venez la prendre."], ["Pas mal, pour un débutant."], ["Je vais vous traquer à mon tour."], ["Bien chassé. Je reviendrai."]],
    lore: ["{commander} porte un collier fait des balises de ses proies. Il en manque une : la sienne."],
    look: "a lethal bounty hunter, golden trophy medallions, insect-like armor plates, predatory eyes",
  },
  {
    id: "bazar",
    names: ["Le Grand Bazar", "Route de la soie stellaire", "Foire des mondes"],
    taglines: ["Tout s'achète. Même la loyauté.", "Le commerce est une guerre sans canons."],
    accent: "#5ef2b0",
    image: "/assets/blog/articles/5-12/salle-de-jeu.webp",
    mentor: "kor",
    rival: "kragmor",
    focus: ["contract", "bounty", "raidRepelled"],
    roles: [["steward", "engineer"], ["steward", "spy"]],
    commanderTitles: ["Intendante des Routes", "Maître des Comptoirs", "Négociatrice"],
    firstNames: ["Esmé", "Rafael", "Odile", "Hakim", "Lune"],
    lastNames: ["Marchetti", "Delacroix", "Sarafian", "Okoro", "Vendôme"],
    synopsis: ["Les routes commerciales rouvrent après des mois de blocus. {mentor} veut en tirer profit ; {rival} veut en tirer un péage."],
    beats: [
      ["Les routes rouvrent, commandant. Honore tes contrats : la réputation vaut plus que l'or."],
      ["Les convois passent. Tes contrats font parler d'eux jusqu'aux franges."],
      ["Une négociatrice redoutable propose de gérer tes affaires. Prouve-lui que tu en vaux la peine."],
      ["Le bazar ferme ses portes, tes coffres pleins. {commander} tient désormais tes comptes."],
    ],
    rivalLines: [["Chaque route passe par mes péages."], ["Un convoi de plus, un péage de plus."], ["Je ferme les routes. Toutes."], ["Bon. Vous pouvez passer. Cette fois."]],
    lore: ["{commander} a vendu une lune à son propriétaire légitime. Et il l'a remerciée."],
    look: "a sharp interstellar merchant, emerald silk coat, holographic ledgers, confident smile",
  },
  {
    id: "vide",
    names: ["L'Appel du Vide", "Au-delà des franges", "Terra incognita"],
    taglines: ["Là où les cartes s'arrêtent, tout commence.", "Le vide répond à ceux qui l'appellent."],
    accent: "#ff5fd2",
    image: "/assets/chronicles/2026-11-boss.webp",
    mentor: "maru",
    rival: "varan",
    focus: ["victory", "raidRepelled", "contract"],
    roles: [["strategist", "spy"], ["engineer", "strategist"]],
    commanderTitles: ["Éclaireuse du Vide", "Cartographe des franges", "Pèlerin des étoiles"],
    firstNames: ["Nox", "Ariane", "Eliott", "Zéphyr", "Mira"],
    lastNames: ["Farlight", "Ombreval", "Quasar", "Delune", "Strand"],
    synopsis: ["Un signal venu d'au-delà des franges appelle le secteur. {mentor} y voit une prophétie ; {rival}, un butin."],
    beats: [
      ["Le Vide appelle, commandant. Ceux qui répondront en reviendront changés."],
      ["Le signal se précise. Il parle de nous."],
      ["Une éclaireuse revenue des franges veut guider celui qui ira jusqu'au bout."],
      ["Le signal s'est tu. {commander} a choisi de rester à tes côtés."],
    ],
    rivalLines: [["Le Vide n'aime pas les curieux."], ["Vous entendez des voix ? Moi, j'entends des ressources."], ["Le premier arrivé prend tout."], ["Gardez votre prophétie."]],
    lore: ["{commander} a cartographié les franges à bord d'un vaisseau sans nom. Elle n'en parle jamais."],
    look: "an enigmatic deep-space scout, star map tattoos glowing magenta, worn explorer gear, nebula behind",
  },
  // v5.14 : quatre thèmes de plus (douze, un par rôle d'officier).
  {
    id: "rempart",
    names: ["Le Rempart", "Les Murs de Vashka", "Ligne de fer"],
    taglines: ["Ils frappent. Nous tenons.", "Pas un pas en arrière."],
    accent: "#7fb2ff",
    image: "/assets/chronicles/2027-01-boss.webp",
    mentor: "ilyon",
    rival: "varan",
    focus: ["raidRepelled", "victory", "contract"],
    roles: [["strategist", "warden"], ["strategist", "mechanic"]],
    commanderTitles: ["Maîtresse des Remparts", "Gardien de la Ligne", "Stratège de siège"],
    firstNames: ["Hadrien", "Irsa", "Malo", "Veyra", "Osric"],
    lastNames: ["Valcourt", "Stenn", "Morvan", "Ashgrove", "Keld"],
    synopsis: ["{rival} assiège les mondes de la frange, vague après vague. {mentor} confie la défense du secteur aux commandants qui tiendront."],
    beats: [
      ["Leurs raids se multiplient, commandant. On fortifie, on tient, et on rend coup pour coup."],
      ["Les premières vagues se sont brisées sur nos défenses. Ils cherchent la faille."],
      ["Un stratège de siège légendaire a vu ta résistance. Il veut se battre à tes côtés."],
      ["Le siège est levé. {commander} rejoint ton état-major : aucun mur ne tombera plus."],
    ],
    rivalLines: [["Vos murs sont en papier. Mes béliers ont faim."], ["Une vague de plus, et vous céderez."], ["Toutes mes escadres sur le même point. Tenez donc, si vous pouvez."], ["Je reviendrai. Les murs finissent toujours par tomber."]],
    lore: ["{commander} a tenu quarante jours un avant-poste que l'état-major avait déjà rayé des cartes."],
    look: "a stern siege strategist in heavy blue-grey armor, battle-worn cloak, fortress walls and shield generators behind",
  },
  {
    id: "colonies",
    names: ["Nouveaux Mondes", "La Ruée vers les franges", "Terres d'aube"],
    taglines: ["Chaque planète est une promesse.", "Planter un drapeau, bâtir un monde."],
    accent: "#5ef2b0",
    image: "/assets/chronicles/2027-02-boss.webp",
    mentor: "lysa",
    rival: "kragmor",
    focus: ["contract", "raidRepelled", "victory"],
    roles: [["governor", "steward"], ["governor", "logistician"]],
    commanderTitles: ["Gouverneure des Franges", "Bâtisseur de mondes", "Intendante coloniale"],
    firstNames: ["Célia", "Anouk", "Ravi", "Soline", "Edric"],
    lastNames: ["Marchal", "Ibarra", "Vey", "Lindqvist", "Okafor"],
    synopsis: ["Des mondes vierges s'ouvrent aux franges du secteur, et {rival} veut tous les revendiquer. {mentor} lance la course aux colonies."],
    beats: [
      ["Les sondes ont trouvé des mondes habitables. À toi de les faire fleurir avant que d'autres ne s'en emparent."],
      ["Tes premières colonies prospèrent. Les colons affluent."],
      ["Une gouverneure de légende cherche un empire digne de ses talents. Le tien l'intéresse."],
      ["Les franges sont à nous. {commander} gouvernera tes colonies."],
    ],
    rivalLines: [["Ces mondes sont à moi. Mes foreuses arrivent."], ["Une colonie ? Un caillou de plus à raser."], ["J'envoie mes équipes de forage sur toutes vos colonies."], ["Gardez vos cailloux. J'en trouverai d'autres."]],
    lore: ["{commander} a transformé une lune stérile en grenier du secteur en moins de dix ans."],
    look: "a visionary colonial governor in a white and mint long coat, terraformed green planet glowing behind, holographic city plans",
  },
  {
    id: "chantiers",
    names: ["L'Arsenal", "Cale sèche", "Rivets et canons"],
    taglines: ["Une flotte se construit, un rivet à la fois.", "Les chantiers ne dorment jamais."],
    accent: "#ff8a3d",
    image: "/assets/blog/articles/5-10/couverture.webp",
    mentor: "brannoc",
    rival: "kor",
    focus: ["victory", "contract", "warlordWin"],
    roles: [["mechanic", "engineer"], ["mechanic", "admiral"]],
    commanderTitles: ["Chef de cale", "Maître armurier", "Mécanicienne en chef"],
    firstNames: ["Gunnar", "Petra", "Silas", "Mira", "Dorian"],
    lastNames: ["Holt", "Varga", "Crane", "Ostrova", "Blackwell"],
    synopsis: ["Une guerre se prépare, et {rival} arme ses flottes plus vite que tout le monde. {mentor} rouvre les vieux chantiers navals : il faut des coques, et vite."],
    beats: [
      ["Les chantiers sont rouillés, mais les plans sont bons. Remets-les en marche, commandant."],
      ["Les premières coques sortent des cales. L'équipage applaudit."],
      ["Une mécanicienne de génie a entendu parler de tes chantiers. Elle veut voir ce qu'ils valent."],
      ["L'arsenal tourne à plein. {commander} veille sur tes cales sèches."],
    ],
    rivalLines: [["Mes chantiers produisent dix coques pour une des vôtres."], ["Jolies coques. Elles brûleront bien."], ["Ma nouvelle flotte est prête. Et la vôtre ?"], ["Hum. Vos chantiers sont meilleurs que prévu."]],
    lore: ["{commander} peut remonter un réacteur les yeux fermés, et l'a déjà fait, en plein combat."],
    look: "a gruff shipyard master mechanic, welding goggles, ember sparks, colossal hull under construction behind",
  },
  {
    id: "moisson",
    names: ["La Grande Moisson", "Saison d'abondance", "Les Greniers d'or"],
    taglines: ["Récolter avant l'hiver.", "Un empire se nourrit de ses récoltes."],
    accent: "#ffd86b",
    image: "/assets/chronicles/2027-03-boss.webp",
    mentor: "kor",
    rival: "maru",
    focus: ["contract", "bounty", "raidRepelled"],
    roles: [["steward", "governor"], ["steward", "warden"]],
    commanderTitles: ["Intendant des Greniers", "Maîtresse des récoltes", "Trésorier d'empire"],
    firstNames: ["Basile", "Eléa", "Tomas", "Ines", "Leopold"],
    lastNames: ["Granger", "Delacroix", "Moreau", "Sato", "Hallberg"],
    synopsis: ["Les gisements du secteur débordent comme jamais. {mentor} veut remplir les greniers ; {rival} veut les vider."],
    beats: [
      ["Les gisements n'ont jamais été aussi riches. Récolte, stocke, et protège tes réserves."],
      ["Les greniers se remplissent. Les pillards rôdent déjà."],
      ["Un intendant légendaire propose ses services à l'empire le mieux tenu du secteur."],
      ["Les greniers débordent. {commander} tiendra tes comptes."],
    ],
    rivalLines: [["Tant de réserves... et si peu de gardes."], ["Vos greniers sentent bon. J'arrive."], ["Toute la Ruche a faim. Vos réserves la nourriront."], ["Vos greniers sont bien gardés. Pour cette saison."]],
    lore: ["{commander} n'a jamais laissé une récolte se perdre ni un compte tomber faux."],
    look: "a prosperous imperial steward in gold-embroidered robes, glowing ledger hologram, golden harvest fields on a planet behind",
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

/** Nombre demandé pour un prérequis : part de l'activité médiane du mois, bornée autour des valeurs de base. */
export function requirementCount(key: ChronicleObjective, d: Pick<WorldDigest, "weeklyMedian">, gate: { share: number; mult: number }): number {
  const base = (BASE_COUNTS[key] ?? 3) * gate.mult;
  const monthly = (d.weeklyMedian[key] ?? 0) * 4;
  const wanted = Math.round(monthly * gate.share);
  return Math.max(base, Math.min(base * 4, wanted));
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

  // Paliers : rythme et récompenses du générateur de chapitres, puis prérequis et final.
  const g = generatePass(rng, o.digest, o.basePointsPerTier ?? PASS_RULES.pointsPerTier);
  const tiers = g.pass.tiers.map((t) => t.map((r) => ({ ...r }))) as PassReward[][];
  tiers[tiers.length - 1] = [{ kind: "commander", id: commander.id }, { kind: "amber", amount: PASS_FINAL_AMBER }, { kind: "cosmetic" }];
  const focus = shuffle(rng, theme.focus);
  const requirements: PassSeason["requirements"] = {};
  const reasons = [...g.reasons, `Thème : ${name} (${theme.id}, année ${entry.year} du catalogue, saison ${catalogIndex(o.monthId) + 1} sur 36).`];
  PASS_GATES.forEach((gate, i) => {
    if (gate.tier > tiers.length) return;
    const key = focus[i % focus.length];
    const count = requirementCount(key, o.digest, gate);
    requirements[String(gate.tier)] = { key, count };
    reasons.push(`Palier ${gate.tier} : ${OBJECTIVE_LABELS[key].toLowerCase()} × ${count} (médiane ${o.digest.weeklyMedian[key] ?? 0} par semaine).`);
  });

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
    pointsPerTier: g.pass.pointsPerTier,
    tiers,
    requirements,
    commander,
    auto: { generatedAtMs: o.now, variant, reasons },
  };
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
    for (const [tier, r] of Object.entries(s.requirements ?? {})) {
      if (!(Number(tier) >= 1 && Number(tier) <= (s.tiers?.length ?? 0))) errors.push(`${at} : prérequis sur un palier inexistant (${tier}).`);
      if (!(r?.key in OBJECTIVE_LABELS)) errors.push(`${at}, palier ${tier} : action de prérequis inconnue.`);
      if (!(Number(r?.count) >= 1)) errors.push(`${at}, palier ${tier} : nombre ≥ 1.`);
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
  for (const s of published) passes.set(s.id, { pointsPerTier: s.pointsPerTier, tiers: s.tiers, requirements: s.requirements ?? {} });
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
export function nextMonthId(id: string): string {
  const [y, m] = id.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}
