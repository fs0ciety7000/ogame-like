import type { CommanderId } from "@/game/commanders";

/* =====================================================
   v5.14 : catalogue des saisons du passe. Douze thèmes tournent chaque
   mois, sur trois ans : 36 saisons écrites d'avance, chacune avec son nom,
   son accroche, son scénario, son commandant (rôle du thème + second rôle,
   une paire unique sur les 36) et ses deux prompts Midjourney (portrait et
   illustration du thème). Le générateur part de l'entrée du mois ; l'équipe
   relit, retouche et publie dans l'administration.
===================================================== */

/** Premier mois du catalogue (saison 1, année 1). */
export const CATALOG_START = "2026-11";

/** Ordre des thèmes livrés, à partir de CATALOG_START (un par mois). */
export const DEFAULT_THEME_ROTATION = ["vide", "hiver", "forge", "bazar", "maree", "colonies", "primes", "comete", "moisson", "archives", "chantiers", "rempart"] as const;

/** 6.14.128 (AA9) : un thème ajouté dans l'admin (section `passThemes`) a son propre identifiant. */
export type RotationThemeId = string;

/** Rôle principal du commandant de chaque thème livré : les douze rôles, une fois chacun. */
export const DEFAULT_THEME_PRIMARY: Record<string, CommanderId> = {
  vide: "logistician",
  hiver: "warden",
  forge: "engineer",
  bazar: "diplomat",
  maree: "admiral",
  colonies: "governor",
  primes: "corsair",
  comete: "hunter",
  moisson: "steward",
  archives: "spy",
  chantiers: "mechanic",
  rempart: "strategist",
};

export interface CatalogCommander {
  name: string;
  title: string;
  secondary: CommanderId;
  /** {commander} : son nom. */
  lore: string;
  /** Description physique pour le prompt du portrait. */
  look: string;
}

export interface SeasonCatalogEntry {
  /** 6.14.128 (AA9) : identifiant de la fiche (`<thème>_<année>` pour les fiches livrées). */
  id: string;
  theme: RotationThemeId;
  /** 1, 2 ou 3. */
  year: number;
  name: string;
  tagline: string;
  /** {mentor}, {rival}, {commander} remplacés à la génération. */
  synopsis: string;
  commander: CatalogCommander;
  /** Scène de l'illustration du thème (prompt Midjourney complet construit autour). */
  scene: string;
}

const E = (theme: RotationThemeId, year: number, name: string, tagline: string, synopsis: string, commander: CatalogCommander, scene: string): SeasonCatalogEntry => ({ id: `${theme}_${year}`, theme, year, name, tagline, synopsis, commander, scene });

/** Catalogue livré (36 saisons). */
export const DEFAULT_SEASON_CATALOG: SeasonCatalogEntry[] = [
  // ---------- L'Appel du Vide (Logisticienne) ----------
  E("vide", 1, "L'Appel du Vide", "Au-delà des cartes, des routes à ouvrir.", "Un signal venu d'au-delà des franges appelle les flottes. {mentor} veut ouvrir une route avant que {rival} ne la ferme.", { name: "Ilka Morrow", title: "Éclaireuse des franges", secondary: "spy", lore: "{commander} a cartographié trois nébuleuses que tout le monde disait infranchissables.", look: "a lean deep-space scout woman with star-map tattoos glowing magenta, worn explorer gear, nebula behind" }, "a lone scout ship crossing a vast magenta nebula toward a faint signal beacon, tiny convoy lights following far behind"),
  E("vide", 2, "Au-delà des franges", "Chaque route ouverte est une colonie promise.", "Les routes ouvertes l'an dernier mènent à des mondes inconnus. {mentor} veut y installer des colons ; {rival} y voit des proies.", { name: "Corentin Vash", title: "Maître des routes", secondary: "governor", lore: "{commander} a mené le premier convoi de colons au-delà du Voile, sans perdre un seul vaisseau.", look: "a calm convoy master in a long travel coat, route holograms around his hands, colony ships glowing behind" }, "a long convoy of colony ships threading a glowing corridor between two magenta nebulae, a green world on the horizon"),
  E("vide", 3, "Terra incognita", "Là où même les colosses se perdent.", "Aux confins du Vide, des formes gigantesques dérivent entre les étoiles. {mentor} veut les pister ; {rival} veut leurs carcasses.", { name: "Sefa Arkwright", title: "Pisteuse du Vide", secondary: "hunter", lore: "{commander} a suivi la piste d'un colosse pendant deux ans, d'un bout à l'autre du Vide.", look: "a scarred void tracker with a long-range targeting monocle, harpoon rig on her back, enormous shadow drifting behind" }, "an immense dark creature silhouette drifting through a magenta void, a small tracker ship following its luminous trail"),

  // ---------- Hiver galactique (Gardienne) ----------
  E("hiver", 1, "Hiver galactique", "Garder le feu, garder les réserves.", "Une nuit glaciale tombe sur le secteur et les réserves deviennent vitales. {mentor} confie les entrepôts aux plus vigilants ; {rival} attend la faille.", { name: "Brynja Solvei", title: "Gardienne du Givre", secondary: "strategist", lore: "{commander} a tenu les entrepôts de Vashka tout un hiver, sans perdre une caisse.", look: "a stoic winter warden in white armored furs, frost on shoulders, sealed vault door glowing pale blue behind" }, "a fortified ice-covered depot planet under a pale blue aurora, armored doors glowing, distant raider lights in the dark"),
  E("hiver", 2, "La Longue Nuit", "Quand le soleil ne revient pas, on compte chaque ressource.", "La nuit dure plus longtemps cette année. {mentor} rationne, {rival} pille : chaque réserve protégée est une victoire.", { name: "Aldo Frostmere", title: "Intendant de la Longue Nuit", secondary: "steward", lore: "{commander} tient les comptes de l'hiver au gramme près, et n'a jamais laissé un colon sans chauffage.", look: "a meticulous quartermaster in thick grey furs, frost-rimmed spectacles, glowing inventory hologram, snow falling" }, "endless night over a frozen colony, warm golden lights in armored granaries, a pale aurora overhead"),
  E("hiver", 3, "Givre éternel", "Le froid ronge les coques ; on les répare.", "Un givre étrange ronge les blindages. {mentor} réunit mécaniciens et gardiens pour tenir jusqu'au dégel ; {rival} parie sur l'usure.", { name: "Halvard Rime", title: "Gardien des Cales gelées", secondary: "mechanic", lore: "{commander} a réparé une station entière à mains nues, par moins quatre-vingts degrés.", look: "a towering armored warden with a frost-covered mechanical arm, blue ice crystals on armor, frozen hangar behind" }, "a frozen orbital hangar with ice crystals on the hulls, welders' blue sparks and a pale aurora through the hangar windows"),

  // ---------- Forge Stellaire (Ingénieure) ----------
  E("forge", 1, "Forge Stellaire", "Bâtir plus vite que l'ennemi ne détruit.", "{rival} a mis la main sur les forges du secteur. {mentor} veut les reprendre, chantier par chantier.", { name: "Oriane Ferrand", title: "Maîtresse de Forge", secondary: "steward", lore: "{commander} a rallumé une forge éteinte depuis un siècle, et tenu ses comptes à l'équilibre.", look: "a brilliant starship engineer woman, welding goggles on forehead, orange-lit forge sparks, mechanical arm" }, "a colossal star forge built around a red dwarf, molten rivers of metal and orange sparks, cyan scaffolding lights"),
  E("forge", 2, "Le Grand Chantier", "Chaque rivet est une victoire.", "Les forges reprises tournent à plein, mais il manque des bras et des pièces. {mentor} lance le plus grand chantier de l'histoire du secteur ; {rival} veut le saboter.", { name: "Bastien Rivet", title: "Architecte des Étoiles", secondary: "mechanic", lore: "{commander} a dessiné les plans de la moitié des stations du secteur, et en a monté l'autre moitié.", look: "a bearded master architect with holographic blueprints floating around him, orange forge light, steel scaffolds" }, "a gigantic space station under construction with thousands of welding sparks, cranes and drones, orange and cyan light"),
  E("forge", 3, "Cœur de l'Enclume", "Forger l'arme qui finira la guerre.", "Au cœur de l'Enclume, une arme de légende attend d'être forgée. {mentor} réunit ingénieurs et amiraux ; {rival} veut la voler avant qu'elle ne soit finie.", { name: "Nyra Okonkwo", title: "Ingénieure en chef", secondary: "admiral", lore: "{commander} conçoit des vaisseaux de ligne, puis les mène elle-même au combat.", look: "a confident chief engineer in an officer's coat with forge-scorched sleeves, warship blueprint hologram, orange glow" }, "a massive anvil-shaped forge station cradling an unfinished capital warship, orange molten light and cyan tactical holograms"),

  // ---------- Le Grand Bazar (Diplomate) ----------
  E("bazar", 1, "Le Grand Bazar", "Tout s'achète, sauf la parole donnée.", "Le Grand Bazar ouvre ses portes à tous les empires. {mentor} veut y nouer des alliances ; {rival} veut y faire la loi.", { name: "Isidore Vantal", title: "Ambassadeur du Bazar", secondary: "steward", lore: "{commander} a négocié la paix entre deux clans marchands qui se battaient depuis trois générations.", look: "a silver-tongued diplomat in emerald silk robes, holographic contracts, warm market lights behind" }, "a huge orbital bazaar ring full of colorful stalls and docked merchant ships, emerald and gold lanterns, crowds of aliens"),
  E("bazar", 2, "Route de la soie stellaire", "Un convoi bien protégé vaut une flotte.", "Une route commerciale relie désormais tout le secteur, et les pirates l'ont vue aussi. {mentor} veut la sécuriser ; {rival} veut la taxer.", { name: "Saskia Brel", title: "Émissaire corsaire", secondary: "corsair", lore: "{commander} a été pirate avant de devenir diplomate. Elle connaît toutes les ruses, et en invente encore.", look: "a charismatic former pirate turned envoy, red sash over a diplomatic coat, golden earrings, convoy lights behind" }, "a long trade route of glowing gates across space, merchant convoys escorted by corsair frigates, emerald and red lights"),
  E("bazar", 3, "Foire des mondes", "On y échange des marchandises… et des secrets.", "La Foire des mondes attire tous les empires, et tous leurs espions. {mentor} veut des traités ; {rival} veut des informations.", { name: "Auriel Kesh", title: "Diplomate de l'ombre", secondary: "spy", lore: "{commander} sait toujours ce que l'autre camp va proposer, avant même qu'il le sache lui-même.", look: "an elegant masked diplomat in violet and emerald silks, whisper-thin holographic veil, festive fair lights behind" }, "a grand festival of worlds inside a domed station, floating lanterns, envoys of many species, a hidden figure watching from a balcony"),

  // ---------- Marée d'Acier (Amiral) ----------
  E("maree", 1, "Marée d'Acier", "Une flotte se lève, une autre sombre.", "{rival} rassemble ses escadres au bord du secteur. {mentor} sonne le rassemblement : ce mois-ci, chaque bataille compte.", { name: "Maren Kestrel", title: "Amirale des Marées", secondary: "strategist", lore: "{commander} a commandé trois flottes de ligne avant ses trente ans. On dit qu'elle n'a jamais perdu une bataille qu'elle avait choisie.", look: "a fierce naval fleet admiral woman, weathered face, long coat with cyan trim, holographic tactical map behind" }, "two enormous battle fleets clashing like waves, cyan and red beams, a capital ship breaking through the line"),
  E("maree", 2, "Ressac de guerre", "Tenir la ligne, briser la vague.", "Les colosses ont été vus dans le sillage des escadres ennemies. {mentor} veut une flotte capable d'abattre les deux ; {rival} veut les lâcher sur nous.", { name: "Corvin Drakmor", title: "Brise-Ligne", secondary: "hunter", lore: "{commander} a éperonné un colosse avec son croiseur, et vécu pour le raconter.", look: "a grim battle-scarred admiral with a cybernetic jaw, heavy navy coat, colossal beast silhouette behind the fleet" }, "a battle fleet charging through the wake of a colossal space beast, cyan beams, debris and a stormy nebula"),
  E("maree", 3, "La Grande Houle", "Frapper loin, frapper vite.", "La guerre s'étend sur tout le secteur. {mentor} veut une flotte qui frappe partout à la fois ; {rival} compte sur nos lignes trop longues.", { name: "Thessa Haldane", title: "Capitaine de la Houle", secondary: "logistician", lore: "{commander} déplace une flotte entière en une nuit, et l'ennemi la cherche encore le lendemain.", look: "a swift fleet captain with windswept hair, flight jacket with cyan route lines, multiple fleet holograms around her" }, "a swarm of fast warships jumping in formation across a star map, cyan hyperspace trails like a rising swell"),

  // ---------- Nouveaux Mondes (Gouverneure) ----------
  E("colonies", 1, "Nouveaux Mondes", "Chaque planète est une promesse.", "Des mondes vierges s'ouvrent aux franges du secteur, et {rival} veut tous les revendiquer. {mentor} lance la course aux colonies.", { name: "Célia Marchal", title: "Gouverneure des Franges", secondary: "steward", lore: "{commander} a transformé une lune stérile en grenier du secteur en moins de dix ans.", look: "a visionary colonial governor woman in a white and mint long coat, terraformed green planet glowing behind" }, "a freshly terraformed green planet at dawn, colony domes and landing ships, a mint-colored sunrise over new cities"),
  E("colonies", 2, "La Ruée vers les franges", "Plus loin, plus vite, plus nombreux.", "Les colonies se multiplient plus vite que les routes pour les ravitailler. {mentor} cherche quelqu'un pour relier les mondes ; {rival} coupe les lignes.", { name: "Ravi Lindqvist", title: "Bâtisseur de mondes", secondary: "logistician", lore: "{commander} a relié vingt colonies par un réseau de convois qui ne s'est jamais arrêté.", look: "an energetic colonial planner with rolled-up sleeves, holographic supply routes connecting planets around him" }, "a chain of young colony worlds linked by glowing supply lanes, cargo ships streaming between them, mint and cyan light"),
  E("colonies", 3, "Terres d'aube", "Des colonies qui ne tombent pas.", "Les colonies sont devenues riches, donc des cibles. {mentor} veut les fortifier ; {rival} veut les dépouiller une à une.", { name: "Anouk Ibarra", title: "Intendante coloniale", secondary: "warden", lore: "{commander} n'a jamais laissé un pillard repartir d'une de ses colonies avec une seule caisse.", look: "a determined colonial administrator in mint and steel armor, shield emblem, fortified colony domes behind" }, "fortified colony domes on a dawn-lit world, shield generators humming, raider ships turning away in the sky"),

  // ---------- Saison des chasseurs (Corsaire) ----------
  E("primes", 1, "Saison des chasseurs", "Chaque prime a un prix, chaque prix une tête.", "Les Kesh'Vaar ont affiché leurs primes les plus folles. {mentor} veut le tableau de chasse le plus long du secteur ; {rival} chasse les chasseurs.", { name: "Jax Varro", title: "Corsaire de la Ruche", secondary: "admiral", lore: "{commander} a rempli plus de primes que n'importe quel capitaine, souvent avec la flotte de quelqu'un d'autre.", look: "a lethal bounty hunter with golden trophy medallions, insect-like armor plates, predatory eyes" }, "a bounty board of glowing holographic wanted posters in a hive-like station, corsair ships docking under golden light"),
  E("primes", 2, "Tableau de chasse", "Ce qu'on ne voit pas, on ne le rate pas.", "Les cibles se cachent mieux que jamais. {mentor} veut des éclaireurs et des corsaires ; {rival} brouille toutes les pistes.", { name: "Nell Sorrow", title: "Traqueuse de primes", secondary: "spy", lore: "{commander} retrouve n'importe qui. On dit qu'elle a retrouvé un fantôme, et qu'il a payé.", look: "a shadowy bounty tracker woman with a hood and violet scanning visor, golden bounty tokens on her belt" }, "a dark asteroid hideout lit by a single violet scanner beam, a corsair ship lurking in the shadows, golden bounty markers"),
  E("primes", 3, "La Grande Traque", "Le plus gros gibier du secteur.", "Une prime colossale est tombée : la tête d'un colosse. {mentor} réunit les meilleurs chasseurs ; {rival} veut le trophée pour lui.", { name: "Garrick Fen", title: "Corsaire des Colosses", secondary: "hunter", lore: "{commander} porte au cou la dent du premier colosse qu'il a abattu. Il en cherche une deuxième.", look: "a grizzled corsair with a giant beast tooth necklace, crimson coat, harpoon cannons on his ship behind" }, "a pack of corsair ships with harpoon cannons circling an enormous space beast, golden bounty hologram above"),

  // ---------- Comète écarlate (Chasseur de colosses) ----------
  E("comete", 1, "Comète écarlate", "Elle ne passe qu'une fois. Ce qu'elle porte aussi.", "Une comète écarlate traverse le secteur, et quelque chose d'énorme voyage dans son sillage. {mentor} sonne la chasse ; {rival} veut la prise.", { name: "Kira Valdane", title: "Chasseuse de comètes", secondary: "admiral", lore: "{commander} a suivi trois comètes jusqu'au bout. La troisième portait un colosse ; elle l'a ramené.", look: "a daring comet-chasing pilot woman, scarred flight jacket, red glowing comet tail reflected in her visor" }, "a blazing scarlet comet crossing the sector, a colossal creature silhouette in its tail, hunter ships in pursuit"),
  E("comete", 2, "La Pluie de feu", "Des fragments partout, des monstres dedans.", "La comète s'est brisée en mille fragments, et chacun abrite une bête. {mentor} veut des armes taillées pour les colosses ; {rival} veut les fragments.", { name: "Orrin Blackthorn", title: "Armurier des chasses", secondary: "engineer", lore: "{commander} forge des harpons capables de percer la carapace d'un colosse, et les teste lui-même.", look: "a burly weaponsmith with glowing red harpoon prototypes, soot-covered apron, comet fire in the sky behind" }, "a rain of fiery comet fragments falling across space, giant beasts hatching from them, hunter ships firing harpoons"),
  E("comete", 3, "Sillage rouge", "Suivre la trace, partager la prise.", "Le sillage de la comète mène aux nids des colosses, gardés par des pirates. {mentor} veut nettoyer la route ; {rival} veut tout garder.", { name: "Vex Haldor", title: "Grand Veneur", secondary: "corsair", lore: "{commander} partage toujours la prise. C'est pour ça que tout le monde veut chasser avec lui.", look: "a charismatic master hunter with a red cloak, trophy-adorned armor, a colossal skull mounted behind" }, "a red glowing trail through space leading to a nest of colossal beasts, corsair and hunter ships side by side"),

  // ---------- La Grande Moisson (Intendant) ----------
  E("moisson", 1, "La Grande Moisson", "Récolter avant l'hiver.", "Les gisements du secteur débordent comme jamais. {mentor} veut remplir les greniers ; {rival} veut les vider.", { name: "Basile Granger", title: "Intendant des Greniers", secondary: "governor", lore: "{commander} n'a jamais laissé une récolte se perdre ni un compte tomber faux.", look: "a prosperous imperial steward in gold-embroidered robes, glowing ledger hologram, golden harvest fields behind" }, "golden harvest fields on a planet seen from orbit, huge harvester ships and granary stations glowing gold"),
  E("moisson", 2, "Saison d'abondance", "Des réserves pleines attirent les rapaces.", "L'abondance attire les pillards. {mentor} veut des greniers imprenables ; {rival} a promis à sa Ruche un festin.", { name: "Ines Hallberg", title: "Trésorière d'empire", secondary: "warden", lore: "{commander} garde les clés de tous les coffres de l'empire, et ne les a jamais perdues.", look: "a stern imperial treasurer with golden keys at her belt, armored robes, sealed golden vaults behind" }, "armored golden granary vaults on a fertile world, shield domes shimmering, a hive swarm gathering on the horizon"),
  E("moisson", 3, "Les Greniers d'or", "Partager la récolte, gagner des alliés.", "Les greniers débordent, et les empires voisins ont faim. {mentor} veut échanger ; {rival} veut prendre.", { name: "Léopold Sato", title: "Maître des récoltes", secondary: "diplomat", lore: "{commander} a nourri trois empires pendant la famine, et en a fait trois alliés.", look: "a wise harvest master in gold and emerald robes, trade agreement holograms, ships loading grain behind" }, "a golden granary station trading with merchant ships of many empires, grain containers glowing gold and emerald"),

  // ---------- L'Ombre des Archives (Espionne) ----------
  E("archives", 1, "L'Ombre des Archives", "Ce qui est écrit peut être volé.", "Les archives du secteur ont été pillées, et les secrets circulent. {mentor} veut les récupérer ; {rival} veut les vendre.", { name: "Selene Marrow", title: "Archiviste de l'ombre", secondary: "strategist", lore: "{commander} a lu tous les rapports d'état-major depuis cinquante ans. Elle sait comment chaque guerre finit.", look: "a mysterious spymaster woman in a dark hooded coat, violet holographic data streams, half of face in shadow" }, "a vast dark archive station with endless violet data shelves, a hooded figure stealing a glowing data core"),
  E("archives", 2, "Les Fichiers noirs", "Un secret bien placé vaut une flotte.", "Les Fichiers noirs contiennent des secrets sur tous les empires. {mentor} veut les utiliser pour la paix ; {rival}, pour le chantage.", { name: "Lucien Grave", title: "Négociateur des secrets", secondary: "diplomat", lore: "{commander} n'a jamais menacé personne. Il lui suffit de sourire en tenant un dossier.", look: "an elegant spy in a dark violet suit, a black data folder glowing in his hand, quiet smile, shadowy embassy behind" }, "a shadowy embassy room with a single glowing black data file on a table, violet light, silhouettes listening behind glass"),
  E("archives", 3, "Silence radio", "On ne voit rien venir. Eux non plus.", "Le secteur est plongé dans un silence radio total. {mentor} veut frapper dans l'ombre ; {rival} fait pareil.", { name: "Nyx Varell", title: "Spectre", secondary: "corsair", lore: "{commander} entre, prend, et ressort. Personne ne l'a jamais vu ; tout le monde a vu ce qui manquait.", look: "a stealthy infiltrator with a dark visor reflecting violet static, sleek black armor, cloaked ship behind" }, "a cloaked raider ship slipping past a sleeping fleet in total radio silence, faint violet static in the dark"),

  // ---------- L'Arsenal (Mécanicien) ----------
  E("chantiers", 1, "L'Arsenal", "Une flotte se construit, un rivet à la fois.", "Une guerre se prépare, et {rival} arme ses flottes plus vite que tout le monde. {mentor} rouvre les vieux chantiers navals : il faut des coques, et vite.", { name: "Petra Varga", title: "Mécanicienne en chef", secondary: "engineer", lore: "{commander} peut remonter un réacteur les yeux fermés, et l'a déjà fait, en plein combat.", look: "a gruff shipyard master mechanic woman, welding goggles, ember sparks, colossal hull under construction behind" }, "an enormous orbital shipyard with rows of warships under construction, ember sparks and scaffolding lights"),
  E("chantiers", 2, "Cale sèche", "Ce qui revient du front repart réparé.", "Les flottes rentrent du front en lambeaux. {mentor} veut les remettre en ligne avant la prochaine offensive ; {rival} frappe avant.", { name: "Gunnar Holt", title: "Chef de cale", secondary: "admiral", lore: "{commander} a remis en état une flotte entière en une semaine, et l'a menée lui-même à la victoire.", look: "a veteran dockmaster with a cybernetic hand, battle-scarred coat over work overalls, damaged warships in dry dock behind" }, "a dry dock full of battle-damaged warships under repair, ember welding sparks, a fleet launching in the background"),
  E("chantiers", 3, "Rivets et canons", "Des pièces partout, à temps.", "Les chantiers tournent, mais les pièces n'arrivent plus. {mentor} veut des convois sûrs ; {rival} vise les cargos.", { name: "Silas Crane", title: "Maître armurier", secondary: "logistician", lore: "{commander} sait où se trouve chaque pièce de l'empire, et comment l'amener là où il faut.", look: "a methodical armorer with a tool harness, holographic parts inventory, cargo ships unloading behind" }, "cargo convoys delivering glowing parts to a busy shipyard, cranes moving cannon barrels, ember and cyan lights"),

  // ---------- Le Rempart (Stratège) ----------
  E("rempart", 1, "Le Rempart", "Ils frappent. Nous tenons.", "{rival} assiège les mondes de la frange, vague après vague. {mentor} confie la défense du secteur aux commandants qui tiendront.", { name: "Hadrien Valcourt", title: "Stratège de siège", secondary: "warden", lore: "{commander} a tenu quarante jours un avant-poste que l'état-major avait déjà rayé des cartes.", look: "a stern siege strategist in heavy blue-grey armor, battle-worn cloak, fortress walls and shield generators behind" }, "a fortress planet ringed with shield walls under siege, waves of raider ships breaking against blue energy barriers"),
  E("rempart", 2, "Les Murs de Vashka", "Un mur réparé est un mur qui tient.", "Les murs ont tenu, mais ils sont fissurés. {mentor} veut les relever avant la prochaine vague ; {rival} masse ses béliers.", { name: "Irsa Stenn", title: "Gardienne de la Ligne", secondary: "mechanic", lore: "{commander} répare un bouclier sous le feu ennemi comme d'autres reprisent une chaussette.", look: "a tough defensive commander with a repair tool and shield emitter, scorched blue armor, cracked fortress wall behind" }, "repair crews welding a cracked fortress wall in orbit while defensive batteries fire at incoming rams, blue and ember light"),
  E("rempart", 3, "Ligne de fer", "Tenir le front, puis abattre le colosse.", "Derrière les vagues ennemies avance un colosse de siège. {mentor} veut une ligne qui tienne et des chasseurs qui frappent ; {rival} veut tout raser.", { name: "Osric Keld", title: "Maître des Remparts", secondary: "hunter", lore: "{commander} a attendu qu'un colosse de siège soit au pied de ses murs pour l'abattre d'une seule salve.", look: "an imposing iron-clad strategist with a long war cloak, siege cannon behind, colossal siege beast on the horizon" }, "an iron defensive line of battleships facing a colossal siege beast, blue shields and heavy cannon fire"),
];

/* ---------- 6.14.128 (AU27, lot AA9, constat AA-23) : catalogue en vigueur ---------- */

/** Thèmes en rotation (ordre de la section `passThemes`, thèmes retirés exclus), posés par `setSeasonCatalog`. */
export const THEME_ROTATION: RotationThemeId[] = [...DEFAULT_THEME_ROTATION];

/** Rôle principal du commandant de chaque thème en vigueur (retirés compris : passes déjà écrits). */
export const THEME_PRIMARY: Record<RotationThemeId, CommanderId> = { ...DEFAULT_THEME_PRIMARY };

/** Saisons du catalogue en vigueur (section `seasonCatalog`). */
export const SEASON_CATALOG: SeasonCatalogEntry[] = structuredClone(DEFAULT_SEASON_CATALOG);

/** 6.14.128 (AA9) : pose le catalogue en vigueur (depuis `applyGameContent`) : thèmes dans l'ordre de la rotation. */
export function setSeasonCatalog(themes: { id: string; primary: CommanderId; retired?: boolean }[], entries: SeasonCatalogEntry[]): void {
  THEME_ROTATION.splice(0, THEME_ROTATION.length, ...themes.filter((t) => !t.retired).map((t) => t.id));
  for (const k of Object.keys(THEME_PRIMARY)) delete THEME_PRIMARY[k];
  for (const t of themes) THEME_PRIMARY[t.id] = t.primary;
  SEASON_CATALOG.splice(0, SEASON_CATALOG.length, ...entries);
}

/** Années du catalogue (la plus grande année écrite ; 3 pour le catalogue livré). */
export function catalogYears(): number {
  return Math.max(1, ...SEASON_CATALOG.map((e) => Math.floor(Number(e.year)) || 1));
}

/** Saisons d'un cycle : thèmes en rotation × années (36 pour le catalogue livré). */
export function catalogCycle(): number {
  return Math.max(1, THEME_ROTATION.length) * catalogYears();
}

/* ---------- rotation ---------- */

function monthIndex(monthId: string): number {
  const [y, m] = monthId.split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Rang du mois dans le catalogue (0 à 35 pour le catalogue livré), en boucle à chaque cycle. */
export function catalogIndex(monthId: string): number {
  const cycle = catalogCycle();
  const n = monthIndex(monthId) - monthIndex(CATALOG_START);
  return ((n % cycle) + cycle) % cycle;
}

/** Entrée du catalogue pour un mois (AAAA-MM). 6.14.128 : repli sur l'année la plus proche du même thème, puis sur la
 *  première saison (la garde de contenu exige une saison par thème et par année). */
export function catalogEntryFor(monthId: string): SeasonCatalogEntry {
  const i = catalogIndex(monthId);
  const rotation = THEME_ROTATION.length > 0 ? THEME_ROTATION : [...DEFAULT_THEME_ROTATION];
  const theme = rotation[i % rotation.length];
  const year = Math.floor(i / rotation.length) + 1;
  const list = SEASON_CATALOG.length > 0 ? SEASON_CATALOG : DEFAULT_SEASON_CATALOG;
  const same = list.filter((e) => e.theme === theme);
  return same.find((e) => e.year === year) ?? same.sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))[0] ?? list[0];
}

/** Prompt Midjourney de l'illustration du thème (en-tête de la page du passe). */
export function illustrationPrompt(e: SeasonCatalogEntry, accent: string): string {
  return `/imagine prompt: sci-fi strategy game key art, ${e.scene}, cinematic wide shot, dark deep-space palette with ${accent} accent light, painterly concept art, high detail, no text, no letters --ar 16:9 --v 7 --style raw --s 250`;
}

/** Prompt Midjourney du portrait du commandant de saison. */
export function portraitPrompt(e: SeasonCatalogEntry, accent: string): string {
  return `/imagine prompt: sci-fi strategy game character portrait, head and shoulders, ${e.commander.look}, a character named ${e.commander.name}, centered, facing the viewer, dramatic rim light in ${accent}, dark navy background, painterly digital illustration, highly detailed face, clean silhouette, no text, no letters --ar 4:5 --v 7 --style raw --s 250`;
}
