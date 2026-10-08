/* =====================================================
   6.14.137 (AU27, lot AP-L10, constats AP-7 et AP-14) : variété narrative.

   Banques de textes des Chroniques générées (titres d'acte, accroches de
   l'allié, répliques du méchant, lignes de héros, ordres en plus de ceux du
   registre des actions suivies, titres et boss de réserve par archétype),
   faction du chapitre par thème **et par année** du catalogue, répliques des
   jalons du passe choisies selon l'année du catalogue.
   - Tout est dans GameRules.narrative (Admin → Règles → « Chroniques et
     passe : banques de textes »), tiré à la graine du mois.
   - Anti-répétition : un texte (gabarit) déjà lu dans les `noRepeatMonths`
     derniers mois écrits n'est pas repris tant qu'il en reste un autre.
   - Les tirages consomment l'aléa comme avant (un appel par choix) : le
     titre, le boss, les objectifs et les récompenses d'un mois ne changent
     pas ; un mois déjà écrit n'est jamais régénéré (GENERATOR_VERSION
     inchangé, I17).
   - `enabled: false` : textes et tirage d'avant (listes d'origine, sans
     anti-répétition, faction de l'année 1, répliques tirées au hasard).
   Valeurs littérales (CLAUDE.md : pas de constante d'un autre module au chargement).
===================================================== */

export interface ArchetypeExtras {
  /** Titres de chapitre de réserve, pris quand ceux de l'archétype ont tous servi. */
  titles: string[];
  bossNames: string[];
  completionTitles: string[];
}

export const NARRATIVE_RULES = {
  /** Faux : textes et tirages d'avant la 6.14.137. */
  enabled: true,
  /** Un texte lu dans les N derniers mois écrits n'est pas repris tant qu'il en reste un autre (0 : sans anti-répétition). */
  noRepeatMonths: 12,
  /** Titres des épisodes, par acte (1 à 4). Les 5 premiers de chaque acte sont ceux d'avant. */
  actTitles: [
    ["Les premiers signes", "L'appel", "Le signal", "Les rumeurs", "La brèche", "Le calme trompeur", "Une ombre au radar", "Le réveil", "Les feux lointains", "Premier contact", "Le message chiffré", "L'alerte"],
    ["La traque", "Les routes rouges", "Sur la piste", "Le filet", "Les éclaireurs", "Coups de sonde", "La contre-offensive", "Le harcèlement", "Les avant-postes", "La course", "Les lignes ennemies", "La poursuite"],
    ["Le prix du silence", "La trahison", "Les masques tombent", "Le pacte brisé", "Le double jeu", "Le revers", "L'imprévu", "La fausse piste", "Le piège", "Le doute", "Le traître", "La donne change"],
    ["L'assaut", "La dernière nuit", "Le jugement", "La chute", "Tous ensemble", "Le front uni", "L'heure décisive", "Le dernier rempart", "La percée", "Le point de rupture", "La riposte", "Le grand soir"],
  ] as string[][],
  /** Accroches de l'allié, par acte ({villain}, {boss}, {faction}, {ofFaction}, {pseudo}). Les 3 premières sont celles d'avant. */
  hooks: [
    [
      "{villain} refait surface, {pseudo}. Et pas les mains vides : {boss} quitte son chantier.",
      "Mes éclaireurs ont repéré la signature {ofFaction} aux confins du secteur. Ils préparent quelque chose de grand.",
      "On parle de {boss} dans tous les ports. Personne ne l'a vu, mais tout le monde l'a entendu.",
      "Trois convois ont disparu cette semaine. Même route, même silence. {faction} est de retour.",
      "Une balise s'est rallumée dans un secteur mort. Quelqu'un veut qu'on la trouve, {pseudo}.",
      "Les assureurs du port ont doublé leurs tarifs. Ils savent quelque chose sur {boss}.",
      "J'ai reçu un message sans signature. Juste un nom : {boss}.",
      "{villain} a envoyé ses éclaireurs. Ce n'est jamais bon signe.",
      "Les sondes de veille captent un bruit de fond inhabituel. Ça ressemble à une flotte qui se rassemble.",
      "Le secteur est trop calme. La dernière fois, {faction} préparait une offensive.",
      "Un pilote rescapé ne parle que de {boss}. Il tremble encore.",
      "On a retrouvé une épave marquée du sceau {ofFaction}. Elle n'est pas arrivée là toute seule.",
    ],
    [
      "Ils se croient à l'abri derrière leurs routes. Remontons-les une à une.",
      "Chaque coup porté maintenant leur coûtera une semaine de préparatifs.",
      "{faction} a besoin de temps. Ne lui en laissons aucun.",
      "Leurs ravitailleurs passent par les zones grises. On y sera avant eux.",
      "Chaque avant-poste qu'on prend, c'est un mouchard de moins pour {villain}.",
      "On a leur piste. Elle est chaude. On ne la lâche plus.",
      "Ils recrutent dans les ports. Montrons-leur que le secteur a déjà choisi son camp.",
      "{boss} n'est pas prêt. Chaque jour de retard nous donne une chance.",
      "Frappe vite, frappe partout : {faction} ne sait pas encore d'où viendra le coup.",
      "Leurs patrouilles sont nerveuses. C'est le moment de les pousser à la faute.",
      "Nos informateurs s'activent. Il faut leur donner de quoi travailler.",
      "Le secteur nous regarde. Donnons-lui une raison d'y croire.",
    ],
    [
      "Un de nos informateurs a changé de camp. {villain} sait déjà où nous frapperons.",
      "Les seigneurs de guerre ont été payés pour regarder ailleurs. Certains, pour regarder vers nous.",
      "Le plan a changé : {boss} n'est pas une arme, c'est un appât. Et l'appât, c'est le secteur entier.",
      "Nos codes ont fuité. On repart de zéro, et vite.",
      "{villain} a frappé là où on ne l'attendait pas. Il faut changer de méthode.",
      "Ce qu'on prenait pour une retraite était une manœuvre. {faction} nous a contournés.",
      "Un allié d'hier vient de signer avec {faction}. On fera sans lui.",
      "Nos routes de ravitaillement sont coupées. Il va falloir improviser.",
      "Ils savaient pour notre dernière opération. Quelqu'un parle trop.",
      "{boss} a changé de cap. Personne ne sait où il va, et c'est bien le problème.",
      "Le secteur doute. Une victoire inattendue le remettrait d'aplomb.",
      "On a sous-estimé {faction}. On ne refera pas l'erreur.",
    ],
    [
      "Le dernier week-end du mois, {boss} sortira de l'ombre. Tout le secteur devra frapper ensemble.",
      "C'est maintenant ou jamais. Rassemble ta flotte : {boss} arrive.",
      "{villain} a mis toutes ses forces dans {boss}. S'il tombe, {faction} tombe avec lui.",
      "Toutes les flottes du secteur sont en route. Il ne manque que la tienne, {pseudo}.",
      "{boss} est à portée. On ne laissera pas passer une autre chance.",
      "Ce soir, on écrit la fin de ce chapitre. À nous de choisir laquelle.",
      "On a payé cher chaque information. Maintenant, on encaisse.",
      "Les alliances ont répondu à l'appel. {faction} va comprendre ce que veut dire « secteur uni ».",
      "Je ne te demande pas d'être prudent. Je te demande d'être là.",
      "Tout le mois mène à cette nuit. {boss} ne doit pas la voir finir.",
      "{villain} croit que nous sommes épuisés. Montrons-lui le contraire.",
      "Dernier briefing, {pseudo}. Après, on parle avec les canons.",
    ],
  ] as string[][],
  /** Répliques du méchant ({pseudo}, {boss}, {faction}). Les 4 premières sont celles d'avant. */
  villainTaunts: [
    "{pseudo}… Ton nom revient souvent. Trop souvent.",
    "Vous pensiez avoir gagné le mois dernier ? Je ne faisais que compter vos forces.",
    "Chaque empire a un prix. Je viens chercher le tien.",
    "Continue de t'agiter, petit commandant. {boss} adore les proies qui bougent.",
    "Le secteur m'appartenait avant toi. Il m'appartiendra après.",
    "Tes alliés te trouvent courageux. Moi, je te trouve prévisible.",
    "J'ai lu tes rapports de combat, {pseudo}. J'ai beaucoup ri.",
    "Garde tes flottes au port. Ce sera plus rapide pour tout le monde.",
    "Tu entends ce silence ? C'est le bruit de tes routes qui se ferment.",
    "On m'a dit que tu étais le meilleur du secteur. On m'a menti, j'espère.",
    "Je n'ai pas besoin de gagner chaque bataille. Seulement la dernière.",
    "{boss} n'est que le début. Profite bien du reste du mois.",
    "Tes défenses sont jolies. Elles brûleront bien.",
    "Rends-toi maintenant, et je te laisserai une lune. Petite.",
    "Chaque victoire que tu remportes me dit où frapper ensuite.",
    "Tu crois chasser {faction}. C'est toi qu'on piste depuis le début.",
    "Tes amis te quitteront avant la fin du mois. Les miens ne partent jamais.",
    "Chaque vaisseau que tu perds, je le repeins à mes couleurs.",
    "J'ai acheté ta dernière victoire. Elle était bon marché.",
    "Le secteur a la mémoire courte. Moi, je n'oublie rien.",
    "Tu joues bien. Dommage que la partie soit truquée.",
    "{boss} a faim, {pseudo}. Et tu sens bon.",
    "Je t'ai laissé gagner une bataille. C'était un cadeau.",
    "Tes sondes me regardent. Je leur fais signe.",
    "On se reverra au dernier week-end. Prépare tes excuses.",
    "Tu comptes tes vaisseaux. Moi, je compte tes erreurs.",
  ] as string[],
  /** Lignes de héros ({hero}, {deed}, {villain}). Les 3 premières sont celles d'avant. */
  heroLines: [
    "Le mois dernier, {hero} a {deed}. Le secteur s'en souvient ; {villain} aussi.",
    "On raconte que {hero} a {deed} en un mois. Voilà l'exemple à suivre.",
    "{hero} a {deed} ; {villain} a mis sa tête à prix. Ça ne passe pas inaperçu.",
    "Dans les ports, on ne parle que de {hero} : {deed}, rien que ça.",
    "{hero} a {deed}. Si chacun en faisait la moitié, {villain} serait déjà loin.",
    "Le dernier rapport est formel : {hero} a {deed}. Le secteur relève la tête.",
    "{villain} a une liste. Depuis que {hero} a {deed}, son nom est en haut.",
    "Souviens-toi de {hero} : {deed} en un mois. Ce mois-ci, à ton tour.",
    "Personne n'y croyait, et pourtant {hero} a {deed}. {villain} a pris note.",
    "Les recrues ont un modèle : {hero}, qui a {deed}.",
    "{hero} a {deed}. Je bois à sa santé ; {villain}, lui, grince des dents.",
    "Un nom circule dans les mess : {hero}. Il paraît qu'il a {deed}.",
    "Quand on m'a dit que {hero} avait {deed}, j'ai demandé à voir les rapports. C'est vrai.",
    "{hero} a {deed}, et le secteur a dormi un peu mieux.",
  ] as string[],
  /** Ordres en plus de ceux du registre des actions suivies (clé d'action → gabarits ; {count}, {s}). */
  orders: {
    contract: ["Nos réserves fondent. {count} objectif{s} du jour rempli{s}, et on tiendra.", "Les petites victoires gagnent les guerres : {count} objectif{s} du jour.", "Chaque objectif du jour tenu nous rapproche du but : {count} à remplir.", "Le quotidien gagne les guerres longues. {count} objectif{s} du jour, sans faute.", "Je compte sur ta régularité : {count} objectif{s} du jour.", "{faction} parie sur notre lassitude. {count} objectif{s} du jour pour le décevoir."],
    bounty: ["Le tableau des primes déborde. Remplis-en {count}, et l'Essaim nous ouvrira ses ports.", "{count} prime{s} Kesh'Vaar : chaque fugitif rendu est un pilote de moins pour eux.", "L'Essaim paie bien ceux qui tiennent parole. {count} prime{s}.", "Les fugitifs filent vers {faction}. Rattrapes-en {count}.", "Le tableau des primes attend un nom. Le tien, {count} fois.", "Chaque prime remplie nous ouvre une porte de plus : {count} prime{s}."],
    raidRepelled: ["Leurs raids vont redoubler. Repousses-en {count}, et ils hésiteront.", "Tes défenses sont notre bouclier : {count} raid{s} repoussé{s}.", "Qu'ils viennent : {count} raid{s} repoussé{s}, et ils comprendront.", "Nos murs doivent parler pour nous. {count} raid{s} repoussé{s}.", "Chaque raid brisé coûte une semaine à {faction}. {count} à briser.", "Ne cède pas un mètre : {count} raid{s} repoussé{s}."],
    victory: ["Le secteur veut des preuves. Gagne {count} combat{s}.", "Chaque victoire fait douter leurs recrues : {count} combat{s} gagné{s}.", "Il nous faut des victoires, pas des promesses. {count} combat{s} gagné{s}.", "Va chercher le combat : {count} victoire{s}, commandant.", "Les ports comptent les victoires. Donne-leur-en {count}.", "{count} combat{s} gagné{s}, et {faction} devra revoir ses plans."],
    mission: ["Il reste des pistes à remonter : {count} mission{s}.", "Nos équipes connaissent le terrain. Envoie-les {count} fois en mission.", "Les confins parlent à qui les écoute. {count} mission{s}.", "Nos meilleures pistes sont en mission. Lance-en {count}.", "Chaque mission rapporte un indice : {count} mission{s}.", "On ne gagne pas sans renseignement. {count} mission{s} terminée{s}."],
    spy: ["Ce qu'on ne voit pas nous tuera. {count} sonde{s}, commandant.", "Mets des yeux sur leurs routes : {count} sonde{s} d'espionnage.", "Sonde leurs positions : {count} sonde{s}, pas une de moins.", "Un œil de plus, une surprise de moins : {count} sonde{s}.", "Je veux leurs plans avant le week-end. {count} sonde{s} d'espionnage.", "Lance {count} sonde{s} : je veux savoir qui ment."],
    market: ["Le marché parle à qui l'écoute : {count} achat{s}.", "Les comptoirs savent qui finance {faction}. {count} achat{s} au marché pour délier les langues.", "Les comptoirs gardent la trace de chaque crédit. {count} achat{s}, et on remontera la piste.", "Fais tourner le commerce : {count} achat{s} au marché.", "Le marché est un champ de bataille comme un autre. {count} achat{s}.", "Achète ce dont tu as besoin, {count} fois : chaque achat nous renseigne."],
    warlordWin: ["Les seigneurs de guerre ont choisi leur camp. Pille-en {count}.", "{count} seigneur{s} de guerre pillé{s} : leurs coffres financent l'ennemi.", "Les seigneurs de guerre comptent sur notre prudence. Pille-en {count}.", "Leurs coffres sont pleins. Vide {count} seigneur{s} de guerre.", "{count} seigneur{s} de guerre pillé{s}, et {faction} perdra ses rabatteurs.", "Un seigneur pillé est un seigneur qui hésite. {count} à convaincre."],
  } as Record<string, string[]>,
  /** Titres, boss et titres de fin de réserve par archétype : pris seulement quand ceux de l'archétype ont tous servi. */
  archetypeExtras: {
    confrerie: { titles: ["Le Grand Recouvrement", "Les Intérêts du Vide", "La Liste rouverte", "Le Dernier Créancier"], bossNames: ["Le Collecteur Noir", "La Barge des Saisies", "L'Usurier de Fer", "Le Registre Vivant"], completionTitles: ["Libre de dettes", "Brûle-registres", "Rayeur de listes", "Quitte du Vide"] },
    cartel: { titles: ["La Partie truquée", "Le Tapis vert", "Quitte ou double", "La Maison gagne"], bossNames: ["Le Croupier d'Acier", "La Table des Damnés", "Le Coffre-Monde", "La Dame de Pique"], completionTitles: ["Main heureuse", "Brise-casino", "As du secteur", "Flambeur"] },
    choeur: { titles: ["Le Requiem gelé", "La Dissonance", "L'Hymne brisé", "Le Dernier Accord"], bossNames: ["La Harpe des Glaces", "Le Diapason Noir", "La Nef du Silence", "Le Bourdon Abyssal"], completionTitles: ["Briseur de chœurs", "Voix retrouvée", "Fausse note", "Maître du silence"] },
    gravhorn: { titles: ["Le Filon profond", "La Grève de fer", "Le Puits sans fond", "La Dernière Veine"], bossNames: ["La Mâchoire de Roc", "Le Tunnelier-Roi", "La Raffinerie Hurlante", "Le Marteau d'Ambre"], completionTitles: ["Casseur de roc", "Briseur de grève", "Veine d'acier", "Mineur libre"] },
    culte: { titles: ["La Moisson sombre", "Le Jardin des cendres", "La Racine-Mère", "Les Fleurs de la fin"], bossNames: ["La Liane-Monde", "Le Semeur Aveugle", "La Serre Abyssale", "Le Prophète Vert"], completionTitles: ["Coupe-racines", "Brûle-jardins", "Moissonneur", "Sans dieu ni graine"] },
    inquisition: { titles: ["Le Second Procès", "La Grâce refusée", "L'Appel des juges", "Le Verdict final"], bossNames: ["La Chaire Orbitale", "Le Grand Greffier", "La Balance d'Or", "Le Confesseur de Fer"], completionTitles: ["Gracié", "Avocat du secteur", "Cassation", "Sans procès"] },
    meute: { titles: ["La Lune des loups", "Les Traces fraîches", "La Battue", "Le Dernier Hurlement"], bossNames: ["Le Loup d'Orbite", "La Tanière Volante", "Le Crocs-Mère", "La Meute d'Acier"], completionTitles: ["Chasseur de meute", "Briseur de crocs", "Loup solitaire", "Maître-chien"] },
  } as Record<string, ArchetypeExtras>,
  /** Faction (archétype) du chapitre selon le thème du passe, pour les années 2 et 3 du catalogue (l'année 1 :
   *  `chronicleGen.themeArchetypes`). Au-delà de l'année 3, les tables reprennent (année 4 = année 1…). */
  yearArchetypes: {
    "2": { vide: "meute", hiver: "inquisition", forge: "confrerie", bazar: "gravhorn", maree: "culte", colonies: "choeur", primes: "cartel", comete: "meute", moisson: "gravhorn", archives: "inquisition", chantiers: "confrerie", rempart: "choeur" },
    "3": { vide: "culte", hiver: "gravhorn", forge: "inquisition", bazar: "confrerie", maree: "meute", colonies: "cartel", primes: "choeur", comete: "culte", moisson: "confrerie", archives: "cartel", chantiers: "meute", rempart: "gravhorn" },
  } as Record<string, Record<string, string>>,
  /** Répliques des jalons du passe : la n-ième réplique d'un temps sert l'année n du catalogue (vrai) ; faux : tirage au hasard. */
  passLinesByYear: true,
};

export type NarrativeRules = typeof NARRATIVE_RULES;

/** Libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const NARRATIVE_RULES_META = {
  enabled: { label: "Banques de textes étendues et anti-répétition", hint: "Faux : textes et tirages d'avant la 6.14.137. Un mois déjà écrit ne change jamais." },
  noRepeatMonths: { label: "Un texte n'est pas repris avant", unit: "mois", min: 0, max: 36, hint: "Titres d'acte, accroches, répliques, lignes de héros et ordres lus dans les derniers mois écrits. 0 : sans anti-répétition." },
  actTitles: { label: "Titres des épisodes, par acte", hint: "Quatre listes (actes 1 à 4)." },
  hooks: { label: "Accroches de l'allié, par acte", hint: "Quatre listes ; {villain}, {boss}, {faction}, {ofFaction}, {pseudo}." },
  villainTaunts: { label: "Répliques du méchant", hint: "{pseudo}, {boss}, {faction} ; deux par chapitre (épisodes 1 et 3)." },
  heroLines: { label: "Lignes de héros", hint: "{hero}, {deed}, {villain} ; un joueur cité pour son action du mois." },
  orders: { label: "Ordres en plus du registre des actions", hint: "Clé d'action (contract, bounty…) → gabarits ; {count}, {s}." },
  archetypeExtras: { label: "Titres et boss de réserve par faction", hint: "Pris seulement quand les titres de la faction ont tous servi (les chapitres d'avant ne changent pas)." },
  yearArchetypes: { label: "Faction du chapitre par thème, années 2 et 3", hint: "« 2 » et « 3 » : thème → faction. Année 1 : Chroniques générées, faction de chaque thème." },
  passLinesByYear: { label: "Répliques des jalons du passe selon l'année du catalogue", hint: "La 2e réplique de chaque temps sert l'année 2, la 3e l'année 3 (Catalogue du passe → thèmes)." },
};

const NONEMPTY = (xs: unknown): xs is string[] => Array.isArray(xs) && xs.some((x) => typeof x === "string" && x.trim() !== "");

export function validateNarrativeRules(r: Partial<NarrativeRules> | undefined, archetypeIds: string[] = []): string[] {
  if (!r) return [];
  const e: string[] = [];
  const L = "Banques de textes";
  for (const k of ["actTitles", "hooks"] as const) {
    const v = r[k];
    if (v === undefined) continue;
    if (!Array.isArray(v) || v.length !== 4 || !v.every(NONEMPTY)) e.push(`${L} : ${k === "actTitles" ? "titres d'acte" : "accroches"} : quatre actes, au moins un texte chacun.`);
  }
  if (r.villainTaunts !== undefined && !NONEMPTY(r.villainTaunts)) e.push(`${L} : au moins une réplique du méchant.`);
  if (r.heroLines !== undefined && !(NONEMPTY(r.heroLines) && r.heroLines.every((x) => typeof x !== "string" || x.trim() === "" || x.includes("{hero}")))) e.push(`${L} : lignes de héros non vides, chacune avec {hero}.`);
  for (const [k, v] of Object.entries(r.orders ?? {})) if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) e.push(`${L} : ordres « ${k} » : une liste de textes.`);
  for (const [k, v] of Object.entries(r.archetypeExtras ?? {})) {
    if (!v || typeof v !== "object" || !["titles", "bossNames", "completionTitles"].every((f) => Array.isArray((v as unknown as Record<string, unknown>)[f]))) e.push(`${L} : réserve de « ${k} » : titles, bossNames, completionTitles (listes).`);
  }
  for (const [year, table] of Object.entries(r.yearArchetypes ?? {})) {
    if (!/^[2-9]$/.test(year)) e.push(`${L} : année « ${year} » (2 à 9).`);
    if (archetypeIds.length && table && typeof table === "object") for (const [theme, a] of Object.entries(table)) if (!archetypeIds.includes(a)) e.push(`${L} : année ${year}, thème ${theme}, faction « ${a} » inconnue.`);
  }
  if (r.noRepeatMonths !== undefined && !(Number.isInteger(Number(r.noRepeatMonths)) && Number(r.noRepeatMonths) >= 0 && Number(r.noRepeatMonths) <= 36)) e.push(`${L} : « pas repris avant » entier entre 0 et 36 mois.`);
  return e;
}

/** Textes non vides d'une liste réglée (le moteur ignore les lignes vides laissées pendant la saisie). */
export function textList(xs: unknown, fallback: readonly string[] = []): string[] {
  const out = Array.isArray(xs) ? xs.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
  return out.length > 0 ? out : [...fallback];
}

const TEMPLATE_CACHE = new Map<string, RegExp>();

/** Gabarit → expression qui reconnaît ses textes remplis (« {boss} » : n'importe quel texte ; première lettre sans casse). */
function templateRegex(t: string): RegExp {
  let re = TEMPLATE_CACHE.get(t);
  if (!re) {
    const parts = t.trim().split(/\{\w+\}/);
    const body = parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s\\S]*?");
    re = new RegExp(`^${body}$`, "i");
    if (TEMPLATE_CACHE.size > 2000) TEMPLATE_CACHE.clear();
    TEMPLATE_CACHE.set(t, re);
  }
  return re;
}

/** Le gabarit a-t-il déjà servi dans ces textes ? */
export function templateUsed(template: string, texts: readonly string[]): boolean {
  if (texts.length === 0) return false;
  const re = templateRegex(template);
  for (const x of texts) if (re.test(x)) return true;
  return false;
}

/** Gabarits pas encore lus dans ces textes (tous si chacun a servi). */
export function freshTemplates(list: readonly string[], texts: readonly string[]): string[] {
  const left = list.filter((t) => !templateUsed(t, texts));
  return left.length > 0 ? left : [...list];
}

/** Mois (AAAA-MM) décalé de `delta` mois. */
export function shiftMonth(monthId: string, delta: number): string {
  const [y, m] = monthId.split("-").map(Number);
  const k = y * 12 + (m - 1) + delta;
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
}

/** Faction (archétype) d'un thème pour une année du catalogue : année 1 → table de base ; 2, 3 → `yearArchetypes` ; au-delà, en boucle. */
export function yearArchetypeFor(theme: string, year: number, base: Record<string, string>, r: NarrativeRules = NARRATIVE_RULES): string | undefined {
  if (r.enabled === false) return base[theme];
  const tables = Object.keys(r.yearArchetypes ?? {}).filter((y) => /^[2-9]$/.test(y)).map(Number);
  const span = Math.max(1, ...tables);
  const y = ((Math.max(1, Math.floor(year)) - 1) % span) + 1;
  return y === 1 ? base[theme] : r.yearArchetypes?.[String(y)]?.[theme] || base[theme];
}
