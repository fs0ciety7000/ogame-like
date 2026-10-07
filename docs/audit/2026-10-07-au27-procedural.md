# Revue AU27 : contenu procédural et évolutif

Date : 2026-10-07. Périmètre : tout ce que le jeu **génère** ou **fait tourner** seul : Chroniques, passe, catalogue des saisons,
succès procéduraux, saga d'alliance, objectifs du jour, défis hebdomadaires, mutateurs, boss mondiaux, proie d'élite, stock de la
semaine, expéditions, butin, seigneurs et factions. Hors périmètre (autres revues du jour) : équilibre fin des récompenses, design,
actions, illustrations, admin.

Méthode :
- lecture du moteur (`src/game/`) et des tâches serveur (`pocketbase/pb_hooks/cosmic_db.js`, `cosmic.pb.js`) ;
- simulations jetables, hors du dépôt (scratchpad, esbuild + node sur le moteur réel) : 60 mois de Chroniques, 48 mois de passe,
  1 000 variantes d'un même mois, 200 serveurs aux médianes bruitées, 52 semaines de rotations, 1 000 journées d'objectifs du jour,
  1 000 tableaux de primes ;
- **pré-prod en lecture seule** (copie nettoyée de la prod, hooks 6.14.26) : `game_config` (`achievements`, `procedural`,
  `passSeasons`, `chronicles`, `alliance_saga`, `content_migrations`) et l'activité des 17 joueurs (agrégats seulement ici).

Trois profils de serveur dans les simulations :
- **réel** : médianes hebdomadaires mesurées sur la pré-prod au 7 octobre (contrats 5, primes 4, raids repoussés 4, victoires 1,
  missions 88, sondes 0, marché 0, seigneurs 0, assauts de boss 0 ; points de passe par jour : médian 63, 9e décile 171) ;
- **typique** : un serveur calme (raids 0,2 par semaine, marché 2, sondes 5) ;
- **vide** : aucun joueur mesuré (premier mois, serveur neuf).

## 1. Inventaire des générateurs

| Générateur | Code | Produit | Fréquence | Aléa, graine | Réglable (admin) | En dur | Nouveau contenu pris seul ? |
|:--|:--|:--|:--|:--|:--|:--|:--|
| Chapitre des Chroniques | `procedural.ts` (`generateChapter`, `worldDigest`), `chronicleGen.ts` | 4 épisodes (objectif, nombre, récompense), scénario, boss, titre de fin, bannière, 2 fiches de Codex | `cosmic_procedural` (4 h 29 UTC, quotidien) : mois en cours s'il manque, mois suivant dès le jour 20 (`leadDay`) | `seededRandom("<mois>:<variante>")` (FNV + mulberry32, `Math.imul` : goja OK) ; récompenses sur une graine à part | `procedural` (marche, chapitres, passe, succès, jour J), `GameRules.chronicleGen` (budget, poids des objectifs, bornes, faction par thème) | 7 archétypes (faction, 4 boss, 4 titres, 4 titres de fin, 2 textes), titres d'actes (5 par acte), accroches (3 par acte), ordres (2 par action), répliques du méchant (4), lignes de héros (3), `BASE_COUNTS` | non : 9 actions fixes (`ChronicleObjective`) |
| Bibliothèque des chapitres | `chronicles.ts` (`applyLibraryChapter`, `moveWrittenToLibrary`) | chapitres écrits novembre → mars, placés sur un mois par l'admin | à la demande | — | Admin → Chroniques → Bibliothèque | 5 chapitres | — |
| Passe du mois | `passSeasons.ts` (`generatePassSeason`), `passGen.ts`, `passSimulator.ts` | 30 paliers (récompenses sous budget), points par palier, défis cumulés, scénario (4 jalons), commandant | `cosmic_pass_seasons` (h:13) et `cosmic_procedural` : brouillon le 1er (s'il manque) et dès le jour 20 pour le mois suivant ; publication d'office et annonce le 1er | graines `pass:`, `passgen:`, `challenges:` + mois + variante | `GameRules.passGen`, `passRewards`, Admin → Passes (brouillon, régénérer, défis seuls, publier) | 12 thèmes (`PASS_THEMES` : image, mentor, rival, actions mises en avant, **une** réplique par jalon), `CHALLENGE_KEYS`, `challengeSize`, `challengeRamp` (×0,4 → ×2,5), planchers de `weeklyRate` (×0,5 et ×3 de la base) | non (actions fixes) |
| Catalogue des saisons | `seasonCatalog.ts` | nom, accroche, scénario, commandant (paire de rôles), 2 prompts Midjourney par saison | lu par le passe | index = mois depuis 2026-11, modulo 36 | — | 36 saisons écrites | — |
| Succès procéduraux | `procedural.ts` (`proposeAchievementTiers`) | palier suivant (×1,5, ×2 ou ×3) d'une mesure dont le dernier palier est atteint | `cosmic_procedural`, quotidien | déterministe (données) | interrupteur `procedural.achievements` | facteurs, palier « légendaire » + titre, `NO_EXTENSION` | — |
| Succès dérivés | `achievements.ts` (`derivedAchievements`) | succès de collection (officiers rares, commandants de saison, boss mondiaux, lunes) | à chaque `applyGameContent` | — | catalogues | — | **oui** (taille des catalogues) |
| Saga d'alliance | `allianceSaga.ts` | 3 objectifs communs, titre, boss, titre du vainqueur | `cosmic_alliance_saga` (h:53) | `saga:<mois>` | `ALLIANCE_SAGA_RULES` (registre) | 6 titres, 4 titres de vainqueur, faction tirée à part | non |
| Objectifs du jour | `contracts.ts` | 4 objectifs tirés parmi 10 types, par joueur | au premier passage du jour (minuit Paris) | `seededRandom(uid:jour)` de `contracts.ts` (autre algorithme, même nom) | `CONTRACT_RULES` (récompenses, série, coffre) | types, **cibles** (`targetFor` : 20 unités, 2 missions, 2 sondes, 1 sinon) | non |
| Défi hebdomadaire du serveur | `challenges.ts` | 1 objectif commun parmi 6, cible × joueurs actifs | `cosmic_challenge` (CADENCES « ten ») | hachage de l'identifiant de semaine (UTC), jamais deux fois de suite | `CHALLENGE_RULES` (paliers, titre) | `CHALLENGE_TYPES` (types et `perActive`) | non |
| Mutateur du mois | `mutators.ts` | 1 règle de serveur parmi 10 | calculé (pas de tâche) | hachage `mut:<mois>`, jamais deux fois de suite | `GameRules.mutators` (marche, mois imposés) | les 10 mutateurs (définitions) | non |
| Événements du week-end | `events.ts` | bonus du vendredi 18 h au dimanche | calculé | rotation fixe de 5 | `GameRules.events` (rotation, dates, week-ends sautés) | — | oui (types existants) |
| Boss mondiaux | `worldBosses.ts` | boss de la semaine et jour d'apparition (écart ≥ 4 jours) | `cosmic_leviathan` (CADENCES « five ») | `hash01("wb-day:<n>")` en chaîne | section `worldBosses`, `WORLD_BOSS_RULES` | — | oui (catalogue) |
| Proie d'élite | `bounties.ts` (`spawnElite`) | 1 fugitif parmi 6 par semaine | `cosmic_elite` (« ten ») | hachage de la semaine, sans anti-répétition | `ELITE_RULES` | 6 fugitifs d'élite | — |
| Tableau des primes | `bounties.ts` (`generateBoard`) | 3 contrats par créneau de 8 h | à la demande | `seededRandom(uid:bounty:créneau)` | `BOUNTY_RULES` | 22 fugitifs | — |
| Stock de la semaine | `weeklyStock.ts` | 1 offre sur 4, en rotation | calculé (lundi UTC) | semaine modulo 4 | `GameRules.weeklyStock` (prix, quantités) | « 25 jetons » du sac (texte et quantité) | — |
| Expéditions | `expeditions.ts` | 2 événements pondérés (6 types), butin en heures de production | à l'arrivée de la flotte | `Math.random` | `GameRules.expeditions` (poids, bornes) | **un seul texte par type d'événement** | oui (unités de la flotte, reliques) |
| Butin, reliques | `loot.ts`, `relics.ts` | relique, capsule, plan après combat | à chaque combat | `Math.random` | tables de butin, réglages des reliques | — | **oui** (`RELICS` actifs) |
| Seigneurs, factions | `warlords.ts`, `pirates.ts` | flottes, cibles, délais, répliques | `cosmic_warlords` (h:37), `cosmic_pirates` (« ten ») | `Math.random` | `WARLORD_RULES`, factions | répliques | **oui** (`OFFENSIVE_UNITS`, `DEFENSIVE_UNITS`) |
| Gazette | `gazette.ts` | numéro du lundi 9 h (rubriques tirées des données) | `cosmic_gazette` (h:41) | aucun (données) | `GAZETTE_RULES` | — | — |
| Galaxie, biomes | `galaxy.ts`, `colonies.ts` (`biomeFor`) | positions, ressource rare d'une colonie | à la création | hachage stable | — | — | — |

Concours (`contests.ts`) et tournois du casino : créés par l'admin ou à date fixe, rien n'est généré.

## 2. Résultats des simulations

### 2.1 Chroniques (60 mois enchaînés, comme le serveur : `existing` grandit chaque mois)

| Mesure | Typique | Vide | Bruité | Réel (12 mois) |
|:--|:--|:--|:--|:--|
| Factions sur 12 mois | inquisition, chœur, gravhorn, cartel, confrérie, meute, culte, cartel, culte, chœur, cartel, inquisition | idem | idem | idem |
| Faction la plus fréquente | cartel 3 fois par an (thèmes bazar, comète, chantiers) | | | |
| Illustrations de boss distinctes sur 12 mois | 7 (une par archétype : les 4 boss d'un archétype partagent l'image) | 7 | 7 | 7 |
| Titres de chapitre distincts | 12/12, 26/36, 28/60 | 12, 26, 26 | 12, 26, 26 | — |
| Première répétition (titre, boss) | 2028-06 (= 2028-02) | idem | idem | — |
| Première répétition (titre de fin) | 2028-06 (= 2027-09) | idem | idem | — |
| Objectifs : même liste que le mois d'avant | 0 | 0 | 0 | 0 |
| Quantité demandée (min–max) | 1–13 | 1–6 | 1–18 | — |
| Valeur des récompenses d'épisode | 11,0–11,5 h | 10,0–10,5 h | 7,0–14,0 h | — |
| Erreurs de validation, champs vides, `{…}` non remplis | 0 (seul `{pseudo}` reste, rempli à l'affichage) | 0 | 0 | — |
| Synopsis sans ligne de héros | 0 | 36/36 (phrase finale absente, texte correct) | 0 | — |
| Répliques (12 mois) | — | — | — | 132, dont **73 distinctes** ; une réplique revient 7 fois |
| Titres d'épisode (12 mois) | — | — | — | 18 distincts sur 48 |
| Épisode 3 (« rebondissement ») | raids repoussés ×1 (médiane 0,2) un mois sur deux | — | — | **sondes ou marché (médiane 0) 12 mois sur 12** |
| Seigneurs pillés (médiane 0) dans un épisode | — | 18 épisodes sur 144 | — | 4 sur 48 |

1 000 variantes d'avril 2027 : la faction est toujours la meute (thème « colonies ») ; « Régénérer » ne change que le reste.

### 2.2 Passe

| Mesure | Résultat |
|:--|:--|
| Budget, 1 000 variantes | 139,5 à 140 h (cible 140 h, ±5 % : tenu) ; aucun palier vide ; plafonds tenus (Ambre 350, jetons 6, dossiers 4, capsules 10) |
| Plus grosse récompense | 120 Ambre ; **20 h de production** au palier 29 (reste du budget ajouté au-delà de `productionMaxHours` = 12) |
| Même nature deux paliers de suite | 35 sur 29 000 paliers |
| Profil typique (48 mois) | 40 points par palier ; médian au dernier palier jour 27, **plus actif jour 9** (cible : pas avant 15) |
| Profil vide | médian jour 27, plus actif jour 18 |
| **Profil réel, passe de novembre généré par le code actuel** | 60 points par palier ; **médian jour 35** (novembre a 30 jours), plus actif jour 13 ; palier 30 : objectifs du jour 17, victoires 5, **sondes 10** (médiane du serveur : 0) |
| 200 serveurs bruités | médian après le jour 28 : **143/200** ; après le jour 31 : **77/200** ; plus actif avant le jour 15 : 162/200 |
| Sonde : médiane d'une action seule | assauts de boss 0,4 → j27 ; **0,5 → j42 ; 0,6 → j35** ; 0,8 → j27. Marché **0,5 → jamais** (62 jours simulés) ; 1 → j35 ; 1,5 → j27 |
| Noms de thème et commandants | aucune répétition avant **novembre 2029** (= novembre 2026 : le catalogue reboucle) |
| Répliques des jalons (12 mois) | 96 distinctes sur 96, mais une seule réplique par jalon et par thème : **l'année 2 répète l'année 1 mot pour mot** |
| Taille | chapitre 5,6 Ko (dont 1,4 Ko de `month.pass`, plus lu depuis I17) ; passe 7,0 Ko ; ≈ 12,7 Ko par mois, jamais purgés |

### 2.3 Brouillon de novembre stocké sur la pré-prod

Passe `2026-11` en brouillon, écrit le 2026-10-04 à 17 h 05 UTC (générateur de la production, 5.27), copié tel quel :
- pas de `challengeMode` : défis « un palier à la fois », compteur remis à zéro ;
- récompenses de l'ancien gabarit (142 h), pas de `auto.pace` ;
- défis des paliers 20 et 30 : marché ×3, sondes ×2 ou ×3, primes ×4 ou ×5, alors que les médianes réelles du marché et des sondes sont 0 ;
- simulation dans son mode : **ni le médian ni le plus actif ne finissent** en 62 jours.

`autoDraftMonths` n'écrit un brouillon que s'il manque, et aucune migration ne réécrit un brouillon : il sera publié d'office le 1er novembre.

### 2.4 Rotations hebdomadaires et mensuelles (52 semaines, 36 mois)

| Générateur | Résultat |
|:--|:--|
| Défi hebdomadaire | marché 12, primes 10, expéditions 9, unités 7, raids 7, missions 7 ; jamais deux fois de suite |
| Proie d'élite | 6 fugitifs, 7 à 12 semaines chacun ; jamais deux fois de suite sur l'échantillon (aucune garde dans le code) |
| Boss mondiaux | 6 boss, 8 ou 9 semaines chacun ; jour d'apparition du lundi (3) au samedi (10) ; écart de 4 à 12 jours |
| Stock de la semaine | 13 semaines par offre, rotation stricte |
| Mutateurs | 12 mois : 7 sur 10 (rempart 3 fois, guerre 2) ; 36 mois : de 1 (grande chasse) à 6 (marchands) ; jamais deux fois de suite ; **5 heures par an** où le mutateur a déjà changé de mois (31/10, 30/11, 31/12… à 22 h UTC, approximation UTC+2 de `mutatorMonthId`) |
| Saga d'alliance (12 mois) | faction différente de celle du chapitre du mois : **11/12** ; 6 titres distincts, **2 répétitions consécutives** ; raids repoussés dans 4 sagas sur 12 (profil typique : 10 raids demandés à une alliance de 4 qui en fait ≈ 3) |

### 2.5 Objectifs du jour et primes (1 000 tirages)

| Mesure | Résultat |
|:--|:--|
| Types (4 sur 10 par jour) | 384 à 417 apparitions chacun : tirage uniforme |
| Journées avec « Repousser 1 attaque » | **409/1000** (compté seulement si un agresseur attaque et perd : `attack.ts`) |
| Journées avec « Envoyer 1 don » | 406/1000 |
| Journées avec au moins un objectif hors de la main du joueur (attaque, défense, don) | **838/1000**, pour une seule relance par jour |
| Tableau des primes | 22 fugitifs vus, de 114 à 154 fois : uniforme |

### 2.6 Succès procéduraux (pré-prod)

| Mesure | Résultat |
|:--|:--|
| Liste des succès stockée | 119 entrées, dont **47 paliers auto** (37 légendaires avec titre, 6 or, 4 argent) |
| Rythme | 25 paliers le 4 octobre, 11 le 5, 11 le 6 (15 joueurs actifs) |
| Versé par ces paliers à leurs détenteurs | 234 h de production et 6 010 XP au total, plus 2 jetons par palier légendaire |
| Projection sur les statistiques réelles (lot partiel des mesures) | encore **40 paliers légendaires** en 15 jours ; 56 si les statistiques doublent (≈ 1 an) ; 91 titres auto au total |
| **Succès par défaut absents de la liste stockée** | `chapter_reader`, `chapter_keeper`, `seal_bearer`, `pass_finisher` (ajoutés en 6.9.2) |

## 3. Constats

Gravité : 🔴 à corriger avant la mise en production, 🟠 gêne réelle, 🟡 fraîcheur ou dette, ℹ️ note.

| # | Gravité | Constat | Preuve | Effet joueur | Correction | Taille |
|:--|:--|:--|:--|:--|:--|:--|
| AP-1 | 🔴 | Le générateur de succès **fige la liste des succès** : `proceduralTick` écrit `content.achievements.concat(paliers)` dans `game_config.achievements`. La section remplace alors les défauts en bloc (`overrides.achievements ?? defaults`), et aucune migration n'ajoute les succès par défaut. Tout succès ajouté au code après la première écriture manque sur le serveur | pré-prod : 4 succès par défaut absents (§2.6) ; `content.ts` l. 241 ; pas d'entrée `achievements` dans `CONTENT_MIGRATIONS` | les succès des Chroniques et du passe n'existent pas en production ; tout futur succès de la chaîne de contenu (règle n° 4) non plus, alors que `contentChain.test.ts` reste vert | `applyGameContent` complète la liste stockée avec les succès par défaut absents (comme `derivedAchievements`), sauf ceux retirés exprès (liste `removedDefaults`) ; le générateur n'écrit plus la liste entière ; test : liste stockée ancienne + défaut nouveau → présent | S |
| AP-2 | 🔴 | Défis du passe **infaisables pour le joueur médian** quand une action est peu pratiquée. `weeklyRate` impose un plancher (base × 0,5 : marché 1,5, sondes 1,5, assauts 1 par semaine) même si la médiane réelle vaut 0. `challengePool` garde toute action non passive quelle que soit sa médiane, et admet une action passive dès 0,5 par semaine alors que son plancher vaut 1 | code actuel sur les données réelles : médian au dernier palier le jour 35 ; sonde : marché 0,5 → jamais, assauts 0,5 → j42 ; 200 serveurs : 38 % hors du mois (§2.2) | le joueur médian ne finit pas le passe : il manque le commandant de saison et 300 Ambre | (a) une action n'entre que si sa médiane atteint son plancher, ou le plancher descend à la médiane ; (b) seuil passif = plancher ; (c) garde avant publication d'office : si le médian simulé dépasse `latestMedianDay`, nouveau tirage des défis (variantes 1 à 5), sinon seuils réduits au prorata, noté dans « Pourquoi » | M |
| AP-3 | 🔴 | **Brouillon de novembre écrit par l'ancien générateur, jamais réécrit.** Un brouillon existant n'est ni comparé à la version du générateur ni régénéré ; il est publié d'office le 1er | pré-prod (§2.3) : défis par palier, gabarit, pas de contrôle de rythme ; simulation : personne ne finit | passe de novembre bloqué dès le palier 20 pour presque tout le serveur, juste à la mise en production | `auto.generator` (version logique) dans chaque passe et chapitre générés ; migration et tâche : un brouillon d'un mois **non commencé** écrit par un générateur plus ancien est régénéré (même variante), noté au journal ; un passe publié n'est jamais touché | S |
| AP-4 | 🟠 | Chroniques : l'**épisode 3** prend toujours l'une des deux actions les moins pratiquées (`stretch`), sans plancher de faisabilité. `chooseObjectives` n'applique pas le filtre passif du passe : raids repoussés dès une médiane > 0, seigneurs pillés même à 0 | réel : sondes ou marché (médiane 0) 12 mois sur 12 ; seigneurs (médiane 0) 4 épisodes sur 48 ; typique : « repousse 1 raid » (médiane 0,2) un mois sur deux (§2.1) | chapitre rarement terminé (titre, relique, Ambre) ; la difficulté baisse ensuite pour une mauvaise raison | même filtre que `challengePool` (actions passives sous `passiveMinWeekly` exclues) ; « rebondissement » pris parmi les actions dont la médiane est ≥ 0,5 par semaine ; quantité = médiane d'une semaine, au moins 1 | S |
| AP-5 | 🟠 | Succès procéduraux : **inflation de paliers légendaires calés sur un seul joueur**. Un détenteur suffit, un palier par mesure et par jour, toujours « légendaire » avec titre | pré-prod : 47 paliers en 3 jours, 37 titres ; projection : 40 de plus en 15 jours (§2.6) | titres dévalués, liste des succès qui gonfle (159 à 175), récompenses concentrées sur le joueur le plus avancé | réglages `procedural.achievementTiers` : détenteurs minimum (3 joueurs ou 10 % des actifs), au plus un palier par mesure et par mois, plafond de paliers auto par famille (3), titre au dernier palier seulement ; les paliers déjà créés restent (données des joueurs) | S |
| AP-6 | 🟠 | Saga d'alliance **décousue du mois** : faction tirée à part (le chapitre suit le thème du passe), titres sans anti-répétition, objectifs sans filtre passif, image d'un chapitre écrit d'un autre mois | 11/12 mois sur une autre faction ; 2 titres répétés d'un mois sur l'autre ; raids dans 4 sagas sur 12 (§2.4) | trois histoires différentes le même mois (passe, Chroniques, saga) ; objectif de raids parfois hors d'atteinte | la saga lit `auto.archetype` du chapitre du mois ; titres jamais repris des 6 derniers mois ; même filtre d'actions que AP-4 ; image `auto/<archétype>-boss.webp` | S |
| AP-7 | 🟡 | **Fraîcheur des Chroniques** : la faction suit le thème du passe, donc le même ordre chaque année ; une image par archétype pour 4 boss ; 4 titres par archétype : répétitions dès juin 2028 ; banques de répliques courtes | §2.1 : 7 images pour 12 mois, cartel 3 fois par an, 73 répliques distinctes sur 132, 18 titres d'épisode sur 48 ; passe : répliques des jalons identiques d'une année à l'autre | dès la deuxième année, le joueur reconnaît les textes ; dès la troisième, les titres | banques de textes en contenu (admin), anti-répétition des répliques sur 12 mois, deuxième jeu de répliques par thème de passe, table faction par thème **et par année**, 2 boss illustrés par archétype | M (code) + L (écriture, illustrations) |
| AP-8 | 🟡 | **Catalogue des saisons fini** : 36 mois, puis il reboucle (noms, commandants, scénarios) en novembre 2029. Images de thème empruntées (couvertures du blog, boss d'autres mois), portrait du commandant vide ; les 72 prompts Midjourney du catalogue (portrait et illustration) n'ont **aucune ligne dans `scripts/illustrations.json`** | `catalogIndex` modulo 36 ; `PASS_THEMES[].image` ; `portrait: ""` ; 48 lignes dans `illustrations.json`, aucune de passe | commandants homonymes dans l'état-major (`s-2026-11` et `s-2029-11`) ; en-tête de passe sans image propre ; règle n° 4 non suivie pour le passe | lot images : 12 illustrations de thème et 12 portraits en lignes `/img` (année 1 d'abord) ; année 4 générée (nom composé, paire de rôles non utilisée) ou écrite, à trancher (Q-AP5) | M |
| AP-9 | 🟡 | Objectifs du jour : 4 types sur 10 tirés **sans poids ni notion de passif**, cibles en dur | 41 % des journées avec « Repousser 1 attaque », 84 % avec un objectif hors de la main du joueur (§2.5) ; `targetFor` hors de `CONTRACT_RULES` (règle n° 2) | série (+10 % par jour, coffre au 7e jour) cassée par le hasard ; « Tout réclamer » jamais complet | poids par type dans `CONTRACT_RULES.weights` (défense 0 par défaut, ou comptée aussi pour un raid de faction repoussé), cibles dans `CONTRACT_RULES.targets`, éditeur admin | S |
| AP-10 | 🟡 | **Évolutivité** : les générateurs d'objectifs ne voient ni le nouveau contenu ni les nouveaux systèmes. Listes fermées : 9 actions (Chroniques, passe, saga), 10 types (objectifs du jour), 6 (défi hebdo), 10 mutateurs (définitions hors admin) | lunes, colonies, territoires, cale sèche, boss d'alliance, expéditions (hors défi hebdo) n'apparaissent jamais dans les Chroniques ni le passe ; une nouvelle unité ou techno n'entre dans aucun objectif. À l'inverse, reliques, flottes des seigneurs et factions, butin des épaves, boss mondiaux et succès dérivés suivent seuls | le contenu procédural ne met pas en avant ce qui vient d'arriver ; chaque nouveauté demande du code dans 4 générateurs | **registre des actions suivies** (`trackedActions` : clé, libellé, verbe, base par semaine, passif, système) lu par les Chroniques, le passe, la saga, le défi hebdo et les objectifs du jour ; mutateurs déplacés dans le contenu, construits sur le catalogue d'effets ; maillon « objectif » ajouté à la chaîne de contenu (WORKFLOW §7) | L |
| AP-11 | 🟡 | Rythme du passe : quand le plus actif va 2 fois plus vite que le médian ou plus, il finit vers le jour 9 à 13 malgré la cible 15 (le médian garde la priorité, `latestMedianDay` 28) | réel : 63 et 171 points par jour, plus actif j13 ; typique : j9 (§2.2) | 2 à 3 semaines sans palier pour les plus actifs ; l'Ambre de dépassement (`PASS_OVERFLOW`) adoucit | paliers de prestige après le 30 (cosmétiques, sans budget) ; suite de PRG-1 (AU3) | M |
| AP-12 | 🟡 | La configuration **grossit sans fin** : ≈ 12,7 Ko par mois (chapitre et passe), dont `month.pass` généré mais plus lu depuis I17 ; `applyContent` relit et clone tout `game_config` à chaque requête | §2.2 (taille) ; `proceduralTick` garde tous les mois | ≈ 460 Ko relus par requête après 3 ans ; temps de réponse | ne plus générer `month.pass` dès novembre 2026 ; archiver les mois de plus de 12 mois dans `chronicles_archive` (sceaux et Codex gardés) | S |
| AP-13 | ℹ️ | Horloges et graines hétérogènes : `mutatorMonthId` en UTC+2 fixe ; défi hebdo, stock et proie d'élite en semaine UTC, le reste à l'heure de Paris ; deux `seededRandom` différents portent le même nom (`contracts.ts`, `procedural.ts`) ; `worldBossOfWeek` = semaine modulo nombre de boss actifs (désactiver un boss réécrit tout le calendrier, passé compris) ; « Régénérer » ne change pas la faction | §2.4 ; code | 5 h par an avec le mauvais mutateur ; agenda des boss qui change d'un coup | `chronicleMonthId` pour le mutateur ; rotation des boss par identifiant (ordre fixe, boss désactivé sauté) ; renommer `contracts.seededRandom` en `dailyRandom` | S |
| AP-14 | ℹ️ | Entrées en dur (règle n° 2) : textes des archétypes, actes, accroches, ordres et répliques ; `PASS_THEMES` ; `SEASON_CATALOG` ; `BASE_COUNTS` ; planchers de `weeklyRate` (0,5 et 3, alors que `chronicleGen` a les siens, réglables) ; `challengeSize`, `challengeRamp` ; facteurs des paliers de succès ; `CHALLENGE_TYPES.perActive` ; définitions des mutateurs ; titres de saga ; « 25 jetons » du stock ; textes d'expédition (un par événement) | code | réglage impossible sans déploiement | groupe `procedural` étendu et section de contenu « textes générés », éditeur dans Admin → Générateur ; planchers du passe repris de `chronicleGen.objectiveMinFactor` et `objectiveMaxFactor` | M |
| AP-15 | ℹ️ | Bibliothèque : jamais épuisée (un chapitre repris y reste, réutilisable sans limite), mais ses textes sont saisonniers (« Le Silence d'hiver », « Le Dégel »), ses récompenses suivent l'ancien gabarit et ses titres n'entrent pas dans l'anti-répétition du générateur (`existing` = mois seuls) | `applyLibraryChapter` ; `generateChapter` (`usedTitles`) | chapitre d'hiver en juillet ; titre en double possible | saison indiquée sur chaque chapitre de la bibliothèque (avertissement admin) ; récompenses rebudgétées à l'application ; titres de la bibliothèque comptés comme déjà pris | S |
| AP-16 | ℹ️ | Ce qui tient : écriture des chapitres avec `Object.assign` (réglages gardés), mois commencé et passe publié protégés par confirmation, tirages reproductibles (même graine, même résultat), budget du passe tenu sur 1 000 variantes, aucun texte vide. Deux détails : le reste du budget peut porter le palier 29 à 20 h de production (> `productionMaxHours`) ; un chapitre invalide fait échouer toute la tâche du jour (succès et passes compris, une seule transaction) | §2.2 ; `proceduralTick` | — | reste du budget réparti sur les 3 derniers paliers ordinaires ; chapitre, succès et passe dans trois transactions | S |

## 4. Lots proposés

Ordre : d'abord ce qui protège la mise en production (5.27 → 6.14), puis la faisabilité, puis la fraîcheur.

| Lot | Contenu | Constats | Taille | Garde (test) |
|:--|:--|:--|:--|:--|
| **AP-L1** | Succès par défaut toujours présents : complément dans `applyGameContent`, liste `removedDefaults`, le générateur n'écrit plus la liste entière | AP-1 | S | `achievementsDefaults.test.ts` : liste stockée sans un défaut récent → défaut présent ; retiré exprès → absent |
| **AP-L2** | Version du générateur dans `auto` ; migration et tâche qui régénèrent les brouillons et chapitres non commencés écrits par un générateur plus ancien (le brouillon de novembre en tête) | AP-3 | S | intégration : brouillon sans `challengeMode` → régénéré ; passe publié → intact |
| **AP-L3** | Faisabilité : planchers bornés par la médiane, seuil passif unifié, nouveau tirage puis seuils réduits si le médian simulé dépasse `latestMedianDay` ; même filtre pour les Chroniques (épisode 3) et la saga | AP-2, AP-4, AP-6 (objectifs) | M | invariant I18 étendu : sur les 200 serveurs bruités, médian simulé ≤ `latestMedianDay` ; I19 : aucune action de médiane < seuil dans un chapitre |
| **AP-L4** | Succès procéduraux bridés (détenteurs minimum, un palier par mois, plafond par famille, titre au dernier) + réglages et admin | AP-5 | S | `progression68x.test.ts` : 1 détenteur → aucun palier ; 31 jours → au plus 1 palier par mesure |
| **AP-L5** | Objectifs du jour pondérés (types passifs), cibles dans `CONTRACT_RULES`, éditeur | AP-9 | S | `contracts.test.ts` : poids 0 → jamais tiré ; `reglages671.test.ts` |
| **AP-L6** | Saga alignée sur le chapitre du mois (faction, boss, image), titres sans répétition | AP-6 | S | `allianceSaga` : faction = `auto.archetype` du mois |
| **AP-L7** | **Nouveau générateur : registre des actions suivies** (`trackedActions`) lu par les 5 générateurs d'objectifs ; premières entrées : expéditions, colonisation, recherche, construction, lune, boss d'alliance ; maillon « objectif » dans la chaîne de contenu | AP-10 | L | `contentChain.test.ts` : chaque système déclare au moins une action suivie ; chaque action a un libellé, une base et un verbe |
| **AP-L8** | **Nouveau générateur : épisode « nouveauté »** : un contenu ajouté depuis le mois précédent (unité, techno, bâtiment) donne un objectif du chapitre suivant (« Construis 5 Récolteurs »), à partir de la date d'ajout du contenu | AP-10 | M | I19 étendu : un contenu nouveau apparaît dans le chapitre suivant |
| **AP-L9** | Mutateurs en contenu (admin) construits sur le catalogue d'effets ; horloge de Paris ; anti-répétition sur 6 mois | AP-10, AP-13 | M | `mutators.test.ts` : 12 mois → 10 distincts au moins ; changement de mois à minuit, heure de Paris |
| **AP-L10** | Variété narrative : banques de textes en contenu (admin), anti-répétition des répliques sur 12 mois, deuxième jeu de répliques des jalons, table faction par thème et par année | AP-7, AP-14 | M (+ écriture) | simulation : ≥ 90 % de répliques distinctes sur 12 mois |
| **AP-L11** | Illustrations de saison : 12 thèmes et 12 portraits en lignes `illustrations.json` ; deuxième boss par archétype | AP-7, AP-8 | M (+ rendus) | `illustrations.test.ts` : chaque thème du catalogue a sa ligne |
| **AP-L12** | Catalogue au-delà de 36 mois (année 4 générée puis relue, ou écrite) | AP-8 | M | `seasonCatalog.test.ts` : aucun nom ni paire de rôles répétés sur 48 mois |
| **AP-L13** | Hygiène : `month.pass` supprimé dès novembre 2026, archivage des mois anciens, rotation des boss par identifiant, renommage de `seededRandom`, reste du budget réparti, trois transactions dans `proceduralTick`, bibliothèque (saison, rebudget, titres) | AP-12, AP-13, AP-15, AP-16 | S | tests unitaires dédiés |
| **AP-L14** | Outil : `scripts/procedural-sim.mjs` (reprise des simulations de cette revue, à lancer avant chaque lot qui touche un générateur) | toutes | S | — |

## 5. Questions (option recommandée)

À reporter dans `docs/QUESTIONS.md` et `docs/decisions-a-valider.md` (règle n° 3) par le lot qui les tranche.

| # | Question | Options | Recommandée | Retour arrière |
|:--|:--|:--|:--|:--|
| Q-AP1 | Les 47 paliers de succès auto déjà créés (pré-prod, donc production) | garder ; retirer ceux au-delà du nouveau plafond | **garder** (données des joueurs, récompenses déjà versées) et brider la suite (AP-L4) | régler le plafond dans l'admin |
| Q-AP2 | Brouillon de novembre écrit par l'ancien générateur | régénérer automatiquement au déploiement ; laisser l'admin cliquer « Régénérer » | **régénérer automatiquement** tant que le mois n'a pas commencé (AP-L2), noté au journal | Admin → Passes : variante précédente |
| Q-AP3 | Action dont la médiane du serveur est 0 : dans les défis du passe ? | exclure ; garder au plancher « pour varier » | **exclure** du passe (un défi bloque les suivants) ; la variété passe par les Chroniques (épisode 3, à quantité faisable) | poids `challengeWeights` dans l'admin |
| Q-AP4 | Épisode 3 des Chroniques (« rebondissement ») | action la moins pratiquée (actuel) ; action peu pratiquée mais faisable (médiane ≥ 0,5 par semaine, quantité d'une semaine) | **peu pratiquée mais faisable** | réglage `chronicleGen.stretchMinWeekly` = 0 |
| Q-AP5 | Après 36 saisons (novembre 2029) | générer l'année 4 (noms composés, paires de rôles inédites) puis relire ; écrire 12 saisons à la main | **générer puis relire dans l'admin** (même circuit que le brouillon du passe) | brouillons modifiables |
| Q-AP6 | « Repousser une attaque » dans les objectifs du jour | poids 0 ; compter aussi les raids de faction repoussés | **compter aussi les raids de faction repoussés** et poids 0,5 | poids dans `CONTRACT_RULES.weights` |
| Q-AP7 | Faction des Chroniques | suivre le thème du passe (ordre identique chaque année) ; table par thème et par année | **table par thème et par année** (3 tables, une par année du catalogue) | `chronicleGen.themeArchetypes` |
| Q-AP8 | Succès auto : qui fait monter un palier ? | 1 détenteur (actuel) ; 3 joueurs ou 10 % des actifs | **3 joueurs ou 10 % des actifs**, un palier par mesure et par mois | réglage `minHolders` |

## 6. Grille (GDD §6)

| Question | Réponse |
|:--|:--|
| Stat d'effet, plafonds | aucun chiffre changé (revue seule) ; budgets du passe et des épisodes tenus ; récompense isolée hors plafond : 20 h de production (AP-16) |
| Client et serveur d'accord ? | tirages déterministes et partagés (passe, Chroniques, objectifs du jour, mutateur) ; le mutateur peut différer d'une heure de l'horloge des Chroniques (AP-13) |
| Le joueur sait ce qui s'est passé ? | « Pourquoi ces chiffres » côté admin seulement ; un passe infaisable est publié d'office sans alerte (AP-2, AP-3) |
| Test de l'invariant ? | I17 à I19 couvrent la forme, pas la faisabilité sur données réelles ni la persistance d'un brouillon ancien : à étendre (AP-L2, AP-L3) |

## Bilan

Les générateurs sont **reproductibles, bornés et propres** (budgets tenus, aucun texte vide, réglages de l'admin conservés à l'écriture
des chapitres). Trois problèmes touchent la mise en production : liste des succès figée (AP-1), passe infaisable pour le joueur médian
sur les données réelles (AP-2), et brouillon de novembre d'ancien format publié d'office (AP-3). Sur un an, le contenu reste varié
(12 titres et boss distincts) mais s'use dès la deuxième année (répliques, ordre des factions, images). Les générateurs ne voient pas le
nouveau contenu : le registre des actions suivies (AP-L7) est la pièce qui manque pour que « tout s'enchaîne » (règle n° 4).
