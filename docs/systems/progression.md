# Progression et rétention

## Échelles
| Système | Rythme | Chiffres |
|:--|:--|:--|
| XP et rangs | continu | 28 rangs, de Fer III (100) à Élite (420 000) ; paliers d'XP par source (plein tarif, demi, quart) ; jeu actif ×1,25 à ×1,5 |
| Saisons | mensuel | champion 200 Ambre + 50 jetons ; podium ; participation 35 Ambre |
| Divisions (ligues) | hebdo | 6 divisions Bronze → Mythique, 20 % montent, 20 % descendent |
| Passe | mensuel | 30 paliers ; points par palier calculés (médian fini vers le jour 24, plus actif pas avant le 15, 25 à 200) ; récompenses sous budget de 140 h (jalons 5, 10, 15, 20, 25 ; relique rare au 20 ; plafonds 350 Ambre, 6 jetons, 4 dossiers, 10 capsules) ; catalogue de 36 saisons, prolongé par des saisons générées au-delà (6.14.139) ; répliques des jalons par année du catalogue (6.14.137) ; un seul passe par mois dès novembre 2026 ; points tracés par source |
| Chroniques | mensuel | 4 épisodes, boss de saison ; générées dès novembre 2026 (le 20 du mois d'avant), chapitres écrits en bibliothèque ; récompenses d'épisode sous budget de 10 h × difficulté (0,7 à 1,4) ; faction du thème du passe, par année du catalogue (6.14.137) ; banques de textes réglables, sans reprise sur 12 mois |
| Défis hebdo | hebdo | objectif serveur ; récompenses à 100 % et 150 % |
| Objectifs du jour | quotidien, minuit Paris | 4 (contrats et missions fusionnés en 6.2.1) ; 90 rares × échelle, 15 XP, 1 jeton chacun, +1 jeton si les 4 ; série +10 %/jour (max +50 %) ; coffre tous les 7 ; tirage pondéré (6.14.109 : « Repousser une attaque » 0,5, raids de faction comptés) |
| Série de connexion | quotidien | 1 à 5 h de production, 2 jetons/jour, 35 Ambre au 6e jour, coffre au 7e (50 à 300 Ambre, 1 à 25 jetons ; chaque ressource commune : **6 à 18 h de production** du joueur depuis la 6.14.106, tirées à part, dans la place libre de l'entrepôt, au moins 2 M ; 2 M à 12 M en 6.14.72, 45 M à 280 M avant ; `streak.chest.commonHours`, [0, 0] = bornes fixes, Q99) |
| Succès | continu | 220 succès par défaut (76 écrits, 83 dérivés des catalogues ou ajoutés par lot et 61 par unité et par bâtiment, 6.14.129 ; 6.14.132 : « Spécialiste », « Arsenal légendaire », « Une identité », « Toutes les doctrines » ; 6.14.115 : 4 succès de colonies, « Terres neuves », « Empire des mondes », « Convoyeur », « Avant-poste tenu » ; 178 sur la copie de la prod en Z1 ; 6.14.3 : « Clair de lune », secret, à la naissance de sa lune, et « Lune pleine » au niveau maximal) ; 6.14.14 : « Frappe d'alliance » et « Trophées d'alliance » (secret), boss d'alliance abattus avec une part suffisante, indices payants pour les secrets ; 6.14.146 : paliers des bâtiments, « Première signature », « Architecte » (les 4 paliers signature en même temps, titre « Grand architecte »), « Premier plan », « Bâtisseur avisé » (un choix à chaque palier de spécialisation) |
| Ascension | ≥ 7 jours, puis **≥ 30 jours** dès la bascule du rythme (1er novembre 2026, 6.14.88) | 5 au plus, puis **10** ; +10 % de production, −5 % de temps de construction chacune ; 3 points de talent ; succès Ascension I, II, V et X. 1re Ascension (simulateur) : avant la bascule J10 (actif), J19 (moyen), J46 (occasionnel), J33 (quotidien) ; après **J87, J91, J126, J115** (cibles de `proposals/rythme-long-terme.md` §4.1 : J80–110, J95–125, J130–180, J110–150) |
| Projets de prestige (6.14.85) | un à la fois, 8 h | ouverts quand les 4 extracteurs sont au niveau **10** ; coût **8 h** de production commune du moment (extracteurs × technos), durée **8 h** ; **8 points** par projet, monument de la fiche publique (Stèle à 1 projet … Merveille du secteur à 1 000), classement « Prestige », succès 1 / 10 / 100 (titre « Bâtisseur d'éternité ») / 1 000 (secret) ; **aucun bonus** (Q168, I32) ; Admin → Règles → Projets de prestige |
| Codex, titres, bannières | collection | 11 catégories (6.14.12 : Bâtiments et Technologies, une fiche par contenu en vigueur, débloquée une fois construit / recherché ; 6.14.115 : Colonies, 4 biomes ouverts à la première colonie et 4 spécialisations ouvertes au premier choix) ; récompense par catégorie complète (Unités, Bâtiments, Technologies, Colonies : 5 jetons + 25 Ambre), réglable dans Admin → Chroniques ; titres et bannières procéduraux |

## Code et admin
`seasons.ts`, `leagues.ts`, `seasonPass.ts`, `passSeasons.ts`, `chronicles.ts`, `challenges.ts`, `contracts.ts`, `dailyMissions.ts`,
`streak.ts`, `achievements.ts`, `ascension.ts`, `talents.ts`, `xpTiers.ts`, `codex.ts`, `prestige.ts` (6.14.85, page `PrestigePage.tsx`).

## État (audit 2026-10-06)
- Corvées quotidiennes réunies depuis la 5.30 dans **Ordres du jour** (`/game/ordres`, `dailyOrders.ts`) : liste de contrôle, « Tout réclamer » (série, objectifs du jour, passe, Chroniques, prise en main ; 6.14.17 : catégories du Codex), pastille unique, rendez-vous de la semaine. Contrats et missions fusionnés en 4 objectifs du jour depuis la 6.2.1.
- Nommage unifié (5.31) : « Saison » = le mois (XP, divisions) ; « Passe » = les 30 paliers ; « Chroniques » = l'histoire du mois. Glossaire dans le Portefeuille ; un test interdit « passe de saison » dans les écrans joueurs.

## Revue AU3 (2026-10-06)
Constats PRG-1 à PRG-8 dans `docs/audit/2026-10-06-au3-progression.md` : passe d'octobre fini en 6 jours par 4 joueurs sur 14 (points non
expliqués par le barème du code, à vérifier en production), rien à gagner après le dernier palier, points non tracés par source, titres en
série, succès débloqués vite. Décisions : `docs/proposals/progression.md`.

## 6.8.0 (lot 1 du passe génératif)
- Points du passe gardés par source (`PassState.bySource`) et instant du dernier palier (`finishedAtMs`) ; Admin → Équilibrage → Santé :
  % au dernier palier, jour médian de fin, points par source, part des succès du joueur médian (et courbes quotidiennes).
- Un seul passe par mois dès novembre 2026 (`activePass`, invariant I17).
- Chroniques : novembre → mars écrits à la main passent dans `chronicles.library` (migration `chronicles-library-6.8`) ; le générateur
  écrit chaque mois dès novembre. Admin → Chroniques → Bibliothèque : « Utiliser » place un chapitre écrit sur un mois.
- Profil : titres à paliers groupés par famille (plus haut palier + titre affiché), paliers inférieurs dépliables.

## 6.8.1 (lot 2 du passe génératif)
- `passGen.ts` : récompenses des paliers 1 à 29 tirées sous budget (courbe croissante, jalons renforcés, table pondérée, plafonds du mois),
  valeur de chaque récompense en heures de production. Dernier palier hors budget (commandant, 300 Ambre, cosmétique).
- Points par palier : `computePointsPerTier` sur `WorldDigest.passPace` (points par jour du médian et du 9e décile ; un joueur fini compte
  jusqu'au jour de son dernier palier). Sans mesure : ancien ajustement de ±15 %.
- Défis : poids par action (`challengeWeights`), actions passives (seigneurs, assauts de boss, raids) seulement si la médiane du serveur
  atteint `passiveMinWeekly` ; raids repoussés à 0 par défaut. Dernier défi visé au jour `targetMedianDay`.
- Contrôle : `passPaceCheck` simule le médian et le plus actif ; le palier s'allonge si le plus actif finit avant le jour visé.
- Admin → Règles → Passe généré (tous les chiffres ci-dessus).

## 6.8.2 (lot 3 du passe génératif)
- `chronicleGen.ts` : récompenses des 4 épisodes sous budget (même table de valeurs que le passe), objectifs pondérés, bornes de
  difficulté et de quantités, Ambre et relique du chapitre terminé, faction de chaque thème du catalogue. Admin → Règles → Chroniques générées.

## 6.14.56 à 6.14.58 (revue AU27, lots AP-L1 à AP-L3)
- **Succès par défaut toujours présents** (6.14.56, I25) : la liste enregistrée est complétée par les succès du code qui y manquent
  (`withDefaultAchievements`), sauf ceux retirés exprès dans l'admin (`achievementList.removedDefaults`, noté à la suppression, vidé par
  « Valeurs par défaut ») ; le générateur de paliers n'ajoute que ses paliers. Pré-prod : `chapter_reader`, `chapter_keeper`,
  `seal_bearer`, `pass_finisher` revenus.
- **Générateur versionné** (6.14.57, I17) : `auto.generator` dans chaque passe et chapitre générés (`GENERATOR_VERSION` : 3) ; un brouillon
  de passe (mois en cours ou à venir) ou un chapitre au premier épisode pas encore ouvert, écrit par une version plus ancienne et jamais
  retouché (`auto.editedAtMs`), est régénéré avec la même variante par la tâche horaire des passes et la tâche quotidienne du générateur ;
  ancien état dans Admin → Historique du contenu ; interrupteur `procedural.regenerateOutdated` (Admin → Générateur).
- **Défis faisables** (6.14.58, I18, I19) : rythme d'une action = médiane du serveur entre 0,5 et 3 × sa base, jamais au-dessus de la
  médiane ; action de médiane nulle ou sous 0,25 par semaine hors des défis (Q84), passive sous 0,5 ; points par palier arrondis sans
  dépasser le jour 28 du médian ; garde de faisabilité à la génération et avant la publication d'office (points par palier, 5 nouveaux
  tirages, seuils réduits jusqu'à 40 %, sinon brouillon régénéré) ; épisode 3 des Chroniques parmi les actions de médiane ≥ 0,5 par
  semaine (Q85). Réglages : Admin → Règles → Passe généré et Chroniques générées.
- Simulation (méthode AU27, scripts hors dépôt) : novembre sur l'activité de la pré-prod, médian au dernier palier jour 35 → 27 (points
  par palier 60 → 55), plus actif jour 13 → 10 ; 200 serveurs bruités : médian après le jour 31, 77 → 12 (limite : 25 points par palier
  au minimum) ; ancien brouillon de novembre : jamais fini → régénéré.

## 6.14.71 et 6.14.72 (revue AU27, lots AE-L0 et AE-L1)
- **Simulateur de progression** dans le dépôt (`src/game/balance/progressionSim.ts`, invariant I29) : joueur glouton par profil (actif,
  moyen, occasionnel, quotidien) sur 90 jours, règles en vigueur ; repères : 1re Ascension, arbre complet, premier mur, production perdue,
  origine des gains, coffre du 7e jour. Avant / après un jeu de réglages : `node scripts/progression-sim.mjs [préréglage | fichier.json]
  [--base …]` (préréglages `avant-ae-l1`, `ae-l2`). Garde : `progressionSim.test.ts` (bornes d'Ascension par profil).
- **Coffre du 7e jour** ramené à 2 M à 12 M par ressource commune (AE-3, Q99) : 465 h → 20 h de production du joueur quotidien, production
  perdue à J14 96 % → 67 %. Proposition : `docs/proposals/equilibrage-au27.md`.

## 6.14.84 et 6.14.85 (rythme long terme, lots RL-1 et RL-2)
- **Recherche réglable** (RL-1) : `research.costGrowth`, `timeGrowth`, `lateFromLevel`, `lateTimeFactor`, `maxLevelSeconds` dans les
  règles, valeurs neutres (le jeu ne change pas, `rechercheReglable.test.ts`). La bascule est le lot RL-3.
- **Projets de prestige** (RL-2) : puits durable de la production (groupe `prestige`, I32), page Prestige ouverte par sa condition
  (signal `prestigeReady`), action `prestigeStart`, fin au rattrapage avec notification, classement (`profiles.prestigePoints`), monument
  sur la fiche publique, 4 succès, fiche du Codex, Formules, frise « Prochaines fins », sortie « Entrepôt plein ». Simulateur :
  `node scripts/progression-sim.mjs --prestige [--ascend] [--days 365]` (avant = sans projets, après = règles `prestige` en vigueur).
  Mesure avec les valeurs actuelles (avant RL-3), 365 jours, Ascensions : production perdue 91 / 90 / 74 / 84 % → 74 / 58 / 64 / 75 %
  (actif, moyen, occasionnel, quotidien), jours sans dépense du pire mois 30 / 30 / 20 / 30 → 0 / 1 / 0 / 0, 650 / 609 / 159 / 264
  projets. Fiche : `docs/changes/6.14.85-projets-de-prestige.md`.

## 6.14.88 (rythme long terme, lot RL-3 avec AE-L2) : bascule datée
- **Bascule** au 1er novembre 2026, 0 h (heure de Paris), réglable (Admin → Règles → Rythme sur des mois : date, annonce, valeurs visées,
  case « Bascule active ») ; `rhythm.ts`, fonction pure appliquée à la résolution du contenu avec l'heure du moment (serveur à chaque
  requête, client au chargement et à la date). Avant la date, rien ne change (`rythme.test.ts`). À la date, seul un réglage resté à son
  ancien défaut prend la nouvelle valeur ; rien n'est écrit en base.
- Valeurs : second palier ×4 (9 bâtiments) et **36 h + 27 h** par niveau (8 bâtiments de l'Ascension, Cale sèche exclue ; 30 h + 24 h en
  6.14.88) ; recherche **×25 dès le niveau 7** (×30 dès le 6 en 6.14.88), 7 jours au plus ; Ascension tous les 30 jours, 10 au plus ; comptoir 1 pour 250 ; missions 0,75 et 400 000 ; lune AE-9.
- Comptes existants : rien n'est retiré ; un chantier ou une recherche lancé garde sa fin.
- Mesure (`node scripts/progression-sim.mjs --bascule --prestige --ascend --days 365`, avant → après) : 1re Ascension J10 / J19 / J46 /
  J33 → **J87 / J91 / J126 / J115** (actif, moyen, occasionnel, quotidien) ; Ascensions la 1re année 5 / 5 / 5 / 5 → 6 / 5 / 4 / 4 ;
  jours « fini, sans suite » 324 / 299 / 162 / 227 → **0** ; production perdue 74 / 58 / 64 / 75 % → **2 / 1 / 10 / 9 %**. Écart connu :
  sessions bloquées 26 % (actif) et 50 % (moyen) le mois qui suit la 1re Ascension (fin de l'arbre trop chère pour la production remise à
  zéro), corrigé en 6.14.89 (ci-dessous). Garde : I29 à 365 jours. Fiche : `docs/changes/6.14.88-bascule-rythme.md`.

## 6.14.89 (RL-5 avancé) : réglage fin de la bascule, avant la date
- Cause de l'écart de 6.14.88 : après l'Ascension, l'Entrepôt repart du niveau 1 ; sa capacité (≈ 0,35 à 0,9 Md par ressource aux
  niveaux 11 à 13) est sous le prix des derniers niveaux de recherche (≈ 0,8 Md d'une ressource) : le labo reste vide jusqu'à sa
  reconstruction. Remède : l'arbre de l'actif et du moyen se termine **avant** leur 1re Ascension (recherche tardive plus courte, second
  palier un peu plus long). Garder l'Entrepôt à l'Ascension a été mesuré et écarté (jours sans dépense 6 à 12 par mois).
- Valeurs visées (groupe `rhythm`, défauts) : `tier2BaseSeconds` 129 600 (36 h), `tier2SecondsPerLevel` 97 200 (27 h ; niveau 20 :
  279 h), `researchLateFromLevel` 7, `researchLateTimeFactor` 25 ; le reste inchangé. Avant la date, rien ne change ; un réglage de
  l'admin reste gardé.
- Mesure (`node scripts/progression-sim.mjs --bascule --prestige --ascend --days 365` ; valeurs de 6.14.88 : préréglage
  `rythme-6.14.88`) : 1re Ascension J87 / J91 / J126 / J115 → **J91 / J103 / J133 / J122** (actif, moyen, occasionnel, quotidien),
  dans les bandes du §4.1 ; Ascensions la 1re année 6 / 5 / 4 / 4 → 5 / 5 / 3 / 4 ; sessions bloquées, pire mois 25,8 / 50 / 5 / 6,7 %
  → **0,8 / 6,7 / 5 / 13,3 %** ; production perdue 2 / 1 / 10 / 9 % → 6 / 1 / 14 / 12 % ; première semaine de l'actif 1,8 % → 0.
  Garde : I29 à 365 jours sans exception. Fiche : `docs/changes/6.14.89-reglage-fin-rythme.md`.

## 6.14.104 (revue AU27, lot AA3)
Valeurs inchangées, réglables (Admin → Règles, sections « 6.14.104 ») : valeur par rang des 15 talents (0,02 ; réseau 0,2 ; depuis
6.14.127 dans la section `talents`, Admin → Talents), jetons et part de placement des 6 divisions (`leagues.tiers`, total des parts = 100 %, contrôlé), objectif par joueur actif des 6
défis de la semaine (`weeklyChallenge.perActive`), Ambre rendue à la place d'une capsule (`passOverflow.capsuleAmber`, 15).

## 6.14.107 (AE-L4) : mesures de progression dans la santé de l'équilibre
- Jour de la 1re Ascension : date gardée à la 1re Ascension (`stats.firstAscensionAtMs`) ; un compte d'avant 6.14.107 à une seule
  Ascension est lu par `ascendedAtMs`, au-delà il est écarté (non mesuré). Cible J35 à J90 (seuils `balanceHealth.ascensionDayLow/High`).
- Production perdue à entrepôt plein : relevée à chaque production (`flushState`), semaine en cours et précédente (`stats.prodLoss`) ;
  médiane et quartiles des actifs, cible ≤ 20 % (AE-5). Écart de production entre quartiles (Q3 ÷ Q1), cible ≤ ×5 (AE-15).
- Ambre gagnée par source et par semaine (`stats.amberWeek`) : 12 sources, base de la décision AE-L7 (Ambre des primes, Q102).

## 6.14.108 et 6.14.109 (revue AU27, lots AP-L4 et AP-L5) : objectifs générés
- **Paliers de succès générés bridés** (6.14.108, AP-5, Q82, Q89) : un palier plus dur n'est ajouté que si **3 joueurs actifs** et
  **10 %** des actifs (vus depuis moins de 14 jours) tiennent le dernier ; **1 palier par mesure tous les 30 jours** ; **3 paliers
  générés** au plus par mesure ; titre au dernier seulement. Les 47 paliers de la pré-prod restent (récompenses déjà versées) ; un palier
  sans date est daté au premier passage du générateur (`createdAtMs`), ce qui ouvre sa mesure 30 jours plus tard. Réglages :
  Admin → Règles → « Succès générés : rythme et plafond » (`achievementGen`) ; texte de l'interrupteur (Admin → Générateur) lu dans la
  règle (`achievementGenText`). Fiche : `docs/changes/6.14.108-succes-generes-brides.md`.
- **Objectifs du jour pondérés** (6.14.109, AP-9, Q87) : poids par type (`dailyContracts.weights`), « Repousser une attaque » à 0,5
  (≈ 23 % des journées sur un compte où tout est ouvert, au lieu de 40 %) et compté aussi pour un raid de faction repoussé
  (`defenseCountsFactionRaids`) ; poids tous égaux : tirage d'avant, même graine ; quantités et « Dépenser » réglables (`targets`,
  `spendHours`, `spendMin`, valeurs d'avant). Menu progressif (I31) inchangé : une page fermée n'est jamais tirée. Réglages :
  Admin → Règles → « Objectifs du jour : tirage et quantités ». Fiche : `docs/changes/6.14.109-objectifs-du-jour-ponderes.md`.

## 6.14.114 et 6.14.115 (revue AU27, lots AJ27-4 et AJ27-5)
- **Chaîne de contenu** (6.14.114) : la garde (`contentChain.ts`) vérifie aussi le succès propre (unités et bâtiments, QJ1), le porteur
  propre (unités), la recherche Ctrl+K, et couvre colonies, talents, modules et classes d'empire. Bilan dans Admin → Équilibrage →
  « Chaîne de contenu », contenu de l'admin compris. Manques connus : `KNOWN_GAPS` de `contentChain.test.ts`, chacun avec son lot.
- **Colonies** (6.14.115) : 4 succès dérivés (`colonie_1`, `colonie_all`, `convoyeur_100`, `base_avancee_1`), mesures `coloniesFounded`,
  `coloniesMaxed` (0/1, nombre de colonies lu dans la règle), `colonyConvoys`, `colonyBaseTours` ; catégorie « Colonies » du Codex ;
  section Colonies des Formules. Rien n'est retiré : un succès gagné reste si l'admin relève le nombre de colonies.

## 6.14.117 (É30-6) : rythme des succès
- **Seuil en jeu** = seuil écrit × facteur de la mesure (`achievementPace.scales`) pour 11 mesures de volume (unités ×10, défenses
  ×10, unités construites ×3, réparées ×2, missions ×5, record par jour ×20, pillage ×10, recyclage ×10, marché ×200, dons ×200,
  ultimatums ×2). Le palier bronze garde son seuil (`keepBronze`) ; les mesures bornées (niveaux, technos, rang) ne bougent pas.
- Appliqué à la lecture (`applyAchievementPace`, après les règles dans `applyGameContent`) : la liste enregistrée, l'admin (Succès :
  « seuil écrit », le seuil en jeu en aide) et le générateur (`paceThreshold`) gardent le seuil écrit. Texte réécrit (`paceDescription`).
- Un succès gagné reste gagné. Réglages : Admin → Règles → « Succès : rythme des succès de volume ». Rétro-simulation :
  `node scripts/achievement-pace-sim.mjs` (pré-prod en lecture seule). Proposition : `docs/proposals/rythme-des-succes.md` ; fiche :
  `docs/changes/6.14.117-rythme-des-succes.md`.

## 6.14.121 et 6.14.122 (revue AU27, lots AP-L7 et AP-L8) : registre des actions suivies, épisode « nouveauté »
- **Registre des actions suivies** (6.14.121, AP-10, invariant I38) : `trackedActions.ts` décrit chaque action qu'un générateur
  d'objectifs peut tirer (libellé, verbe des archives, deux ordres, page, système, passive, « mesurée », poids). Y entrent la **lune**
  (amélioration, balayage de phalange, saut par la porte), les **colonies** (convoi arrivé, base avancée tenue, spécialisation) et une
  action par **contenu** (`unit:<id>` lancée au chantier, `research:<id>`, `building:<id>`), toutes comptées par `trackAction`
  (activité du mois, épisodes ouverts, objectif du jour lié). Chroniques, défis du passe et saga les ajoutent **en fin de liste**,
  seulement si la médiane du serveur atteint 0,5 par semaine (`trackedActions.measuredMinWeekly`) : le joueur médian la pratique, sa
  page lui est ouverte. Poids global par action (× poids du générateur), familles par contenu à 0 (objectifs paramétrés : AJ27-7).
  Objectifs du jour : « Ramener 1 flotte par la porte de saut » et « Faire arriver 2 convois de colonie » (poids 0,5), proposés à qui
  a la porte ouverte ou une route (I31). Admin → Règles → « Actions suivies » ; Admin → Générateur : colonne « Dans les tirages ».
  Mois écrits inchangés (`GENERATOR_VERSION` 3) ; à l'activité d'aujourd'hui, 215 tirages identiques avant et après.
  Fiche : `docs/changes/6.14.121-actions-suivies.md`.
- **Épisode « nouveauté »** (6.14.122, I19) : un contenu daté (`addedOn` dans sa fiche, posé d'office à la création dans l'admin)
  depuis 45 jours au plus au 1er du mois prend l'**épisode 2** du chapitre suivant (5 unités, 1 niveau de recherche, 1 amélioration),
  s'il est accessible à 50 % des joueurs actifs ; un contenu une seule fois ; graine propre (le reste du chapitre ne change pas) ;
  bibliothèque de textes réglable ; mention « Nouveauté » sur l'épisode. Admin → Règles → « Épisode nouveauté » (`novelty`).
  Garde : 67 contenus d'avant sans date, ce nombre ne monte plus. Fiche : `docs/changes/6.14.122-episode-nouveaute.md`.

## 6.14.127 et 6.14.128 (revue AU27, lot AA9)
- **Talents d'Ascension** en section de contenu (`talents`, Admin → Talents) : branche, effets composés par rang, « Retiré » (ne
  s'apprend plus, rangs gardés) ; un talent enregistré ne se supprime pas (I43). Fiche : `docs/changes/6.14.127-talents-modules.md`.
- **Catalogue du passe** en sections (`passThemes`, `seasonCatalog`, Admin → Catalogue du passe) : l'ordre des thèmes est la
  rotation mensuelle (thèmes retirés exclus), cycle = thèmes × années (36 par défaut), une saison par thème en rotation et par année
  (garde du serveur). Un passe déjà écrit garde sa copie du thème ; la bannière d'un passe terminé prend le nom et la couleur du passe
  publié. Succès « Trois ans de campagne » : palier 36 gardé. Fiche : `docs/changes/6.14.128-catalogue-passe.md`.

## 6.14.129 et 6.14.130 (revue AU27, lots AJ27-6 et AJ27-8)
- **Succès par unité et par bâtiment** (6.14.129, AJ-1) : `contentAchievements()` (`achievements.ts`) génère, depuis le contenu en
  vigueur et après les règles, « Escadre » (« Rempart » pour une défense : N exemplaires, N = 20 millions ÷ coût de base, borné par
  25 % du hangar plein), « Maître » (niveau maximal et 2 × N) et un succès de niveau par bâtiment (20, ou son maximum). Mesures ciblées
  `unitOwned`, `unitMastery`, `buildingLevel` (le succès porte `target`), hors concours, titres et paliers générés ; brouillard rangé
  par mesure et contenu. Réglages `contentAchievements` (Admin → Règles → « Succès par unité et par bâtiment » : activation, palier,
  seuils, récompense, textes ; seuils imposés et succès coupés dans Tous les réglages). Rien de repris (I25). Rétro-simulation
  (`scripts/achievement-pace-sim.mjs --content-off` pour l'avant) : médiane 28 % → 24,5 % à J7,6. Fiche :
  `docs/changes/6.14.129-succes-par-contenu.md`.
- **Formules et Ctrl+K** (6.14.130, AJ-8, AJ-9) : bloc « Bonus » des Formules généré (`formulasRegistry.ts` : officiers, sources
  d'effets, plafonds par couche, classes d'empire) ; Ctrl+K trouve reliques, boss, colonies, talents, modules, classes et officiers
  (`paletteContent.ts`). Fiche : `docs/changes/6.14.130-formules-ctrlk.md`.

## 6.14.131 à 6.14.133 (revue AU27, lots AJ27-7, AJ27-9, AJ27-10)
- **Objectifs paramétrés** (6.14.131, AJ-2, Q66) : le registre des actions suivies gagne **expédition** (fin d'expédition) et
  **recyclage** (champ de débris recyclé), mesurées, poids 0. `trackedActions.themeWeights` (vide par défaut) donne, pour un mois d'un
  thème du passe, un poids à une action ou à une famille par contenu (`unit` : construire telle unité, `research`, `building`) dans les
  Chroniques et les défis du passe ; une action par contenu reste soumise à la médiane du serveur (I31, I38). Objectifs du jour :
  types `expedition`, `recycle`, `unit_content`, `research_content`, `building_content` (« Construire 20 × Frégate »), poids 0,
  proposés seulement pour un contenu ouvert au joueur (unité débloquée hors élite, techno ouverte sous son maximum, bâtiment ouvert sous
  son maximum). À règles par défaut, aucun tirage ne change. Admin → Règles → « Actions suivies » (poids par thème) et « Objectifs du
  jour ». Fiche : `docs/changes/6.14.131-objectifs-parametres.md`.
- **Doctrines, Arsenal, officiers de saison** (6.14.132, AJ-4, AJ-16) : Codex « Doctrines » (un talent par fiche, ouvert une fois
  appris ; une classe d'empire par fiche, ouverte une fois choisie) et « Arsenal » (un modèle de module par fiche, ouvert au premier
  plan trouvé), gardés après une redistribution, un changement de classe ou un recyclage (`stats.talentsLearned`,
  `empireClassesUsed`, `moduleTemplatesSeen`) ; récompense de catégorie réglable (5 jetons, 25 Ambre). Commandants de saison publiés :
  fiches « en plus » des Officiers, hors du pourcentage (un mois passé ne se rattrape pas). Succès « Spécialiste » (une branche de
  talents au rang maximal), « Arsenal légendaire » (un module légendaire monté), « Une identité » (une classe), « Toutes les
  doctrines » (chaque classe en vigueur). Fiche : `docs/changes/6.14.132-codex-doctrines-arsenal.md`.
- **Porteurs signature et reliques par source** (6.14.133, AJ-1, AJ-11, Q65, Q67) : voir `docs/systems/bonus-effets.md`. Fiche :
  `docs/changes/6.14.133-porteurs-signature.md`.

## 6.14.136 à 6.14.140 (revue AU27, lots AP-L9 à AP-L12 et AP-L14) : contenu procédural frais
- **Mutateurs sans répétition** (6.14.136, I44) : mois de Paris (minuit, été et hiver) ; dès 2027-01 (`mutators.noRepeatFrom`),
  un mutateur ne revient pas avant 6 mois (`noRepeatMonths`), ceux absents des 12 derniers mois d'abord (`freshMonths`), l'ancien
  tirage gardé s'il est permis : octobre 2026 à janvier 2027 inchangés, 10 mutateurs distincts au moins sur 12 mois (7 avant).
  Admin → Règles → Événements et saisons → « Mutateur de saison ». Défi hebdomadaire laissé hors du registre des actions suivies.
  Fiche : `docs/changes/6.14.136-mutateurs-sans-repetition.md`.
- **Variété narrative** (6.14.137, I45) : groupe `narrative` (Admin → Règles → « Chroniques et passe : banques de textes ») :
  titres d'acte et accroches (12 par acte), 26 répliques du méchant, 14 lignes de héros, ordres de plus par action, réserve de
  titres et de boss par faction ; un texte lu dans les 12 derniers mois écrits ne revient pas tant qu'il en reste ; faction par
  thème et par année (années 2 et 3) ; répliques des jalons du passe par année du catalogue (trois jeux par thème). Même aléa
  consommé : titre, boss, objectifs et récompenses inchangés ; aucun mois écrit régénéré. Répliques distinctes sur 12 mois :
  56 % → 100 % (profil typique). Fiche : `docs/changes/6.14.137-variete-narrative.md`.
- **Illustrations de saison** (6.14.138) : 24 illustrations d'année (thèmes, années 2 et 3), 33 portraits de commandants, 7 seconds
  boss en lignes `/img` ; le générateur prend l'image de l'année (`SEASON_THEME_ART`), le second boss (`AUTO_ART_2`, 2e et 4e nom)
  et le portrait (`SEASON_PORTRAITS`) une fois branchés, sinon l'image du thème, l'image unique du boss, le portrait du rôle.
  Image propre d'une saison : Catalogue du passe → Saisons. Fiche : `docs/changes/6.14.138-illustrations-saison.md`.
- **Saisons au-delà de 36 mois** (6.14.139, I45) : dès novembre 2029, chaque mois prolonge la saison écrite du même rang (nom +
  sous-titre, commandant au prénom et au nom inédits, second rôle jamais pris par le thème, scénario et scène prolongés) ; brouillon
  du passe relu comme les autres ; une année écrite dans l'admin repousse la génération. Groupe `seasonGen` (Admin → Règles →
  « Catalogue du passe : saisons générées », aperçu). Fiche : `docs/changes/6.14.139-catalogue-prolonge.md`.
- **Simulation** (6.14.140) : `node scripts/procedural-sim.mjs [--months 48] [--profile reel|typique|vide|bruite|all] [--base
  avant-ap] [--rules fichier.json]` : Chroniques (factions, titres, images, répliques, épisodes peu pratiqués), passe (noms,
  commandants, paires de rôles, jours de fin simulés), saga, mutateurs. À lancer avant et après chaque lot qui touche un générateur.
  Fiche : `docs/changes/6.14.140-procedural-sim.md`.
