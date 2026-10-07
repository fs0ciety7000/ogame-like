# Progression et rétention

## Échelles
| Système | Rythme | Chiffres |
|:--|:--|:--|
| XP et rangs | continu | 28 rangs, de Fer III (100) à Élite (420 000) ; paliers d'XP par source (plein tarif, demi, quart) ; jeu actif ×1,25 à ×1,5 |
| Saisons | mensuel | champion 200 Ambre + 50 jetons ; podium ; participation 35 Ambre |
| Divisions (ligues) | hebdo | 6 divisions Bronze → Mythique, 20 % montent, 20 % descendent |
| Passe | mensuel | 30 paliers ; points par palier calculés (médian fini vers le jour 24, plus actif pas avant le 15, 25 à 200) ; récompenses sous budget de 140 h (jalons 5, 10, 15, 20, 25 ; relique rare au 20 ; plafonds 350 Ambre, 6 jetons, 4 dossiers, 10 capsules) ; catalogue de 36 saisons ; un seul passe par mois dès novembre 2026 ; points tracés par source |
| Chroniques | mensuel | 4 épisodes, boss de saison ; générées dès novembre 2026 (le 20 du mois d'avant), chapitres écrits en bibliothèque ; récompenses d'épisode sous budget de 10 h × difficulté (0,7 à 1,4) ; faction du thème du passe |
| Défis hebdo | hebdo | objectif serveur ; récompenses à 100 % et 150 % |
| Objectifs du jour | quotidien, minuit Paris | 4 (contrats et missions fusionnés en 6.2.1) ; 90 rares × échelle, 15 XP, 1 jeton chacun, +1 jeton si les 4 ; série +10 %/jour (max +50 %) ; coffre tous les 7 |
| Série de connexion | quotidien | 1 à 5 h de production, 2 jetons/jour, 35 Ambre au 6e jour, coffre au 7e (50 à 300 Ambre, 1 à 25 jetons, **2 M à 12 M** de chaque ressource commune depuis la 6.14.72, 45 M à 280 M avant ; indexation sur la production au lot AE-L3) |
| Succès | continu | 76 (dont dérivés des catalogues ; 6.14.3 : « Clair de lune », secret, à la naissance de sa lune, et « Lune pleine » au niveau maximal) ; 6.14.14 : « Frappe d'alliance » et « Trophées d'alliance » (secret), boss d'alliance abattus avec une part suffisante, indices payants pour les secrets |
| Ascension | ≥ 7 jours | 5 au plus ; +10 % de production, −5 % de temps de construction chacune ; 3 points de talent. 1re Ascension possible (simulateur, 6.14.72) : J10 (actif), J19 (moyen), J46 (occasionnel), J32 (quotidien) ; cible du GDD §2 : J35–50, J60–90, > J120 (lot AE-L2) |
| Projets de prestige (6.14.85) | un à la fois, 8 h | ouverts quand les 4 extracteurs sont au niveau **10** ; coût **8 h** de production commune du moment (extracteurs × technos), durée **8 h** ; **8 points** par projet, monument de la fiche publique (Stèle à 1 projet … Merveille du secteur à 1 000), classement « Prestige », succès 1 / 10 / 100 (titre « Bâtisseur d'éternité ») / 1 000 (secret) ; **aucun bonus** (Q168, I32) ; Admin → Règles → Projets de prestige |
| Codex, titres, bannières | collection | 10 catégories (6.14.12 : Bâtiments et Technologies, une fiche par contenu en vigueur, débloquée une fois construit / recherché) ; récompense par catégorie complète (Unités, Bâtiments, Technologies : 5 jetons + 25 Ambre), réglable dans Admin → Chroniques ; titres et bannières procéduraux |

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
