# Proposition : ouverture progressive des systèmes (AE-13, AE-L5)

Statut : **proposée** (2026-10-07). Étude en lecture seule du code, aucun lot livré.
Sources : constat AE-13 et lot AE-L5 de `docs/audit/2026-10-07-au27-equilibrage.md`, Q103 (AE-Q7, **validée** : « tout compte existant
au-delà de Fer II, et tout compte qui a déjà ouvert la page, voit tout ; seuls les nouveaux comptes ont l'ouverture par rang »),
parcours du nouveau joueur de `docs/audit/2026-10-07-au27-design-ux.md` (AD-8, UX-5), lune de `docs/proposals/phalange-porte-de-saut.md`.
Plan de `docs/WORKFLOW.md` §2. Préfixe des lots : **DP** ; des questions : **DP-Q**.

## 1. Constat

La question de l'utilisateur : « Tu ne trouves pas que les lunes, phalanges, colonies etc, c'est un peu de trop pour les nouveaux
joueurs ? Peut-être débloquer au fur et à mesure de la progression ? »

Ce que voit un compte neuf à la première connexion (code actuel) :

| Mesure | Valeur | Source |
|:--|:--|:--|
| Entrées de menu visibles | **40** : 34 dans 5 groupes de la barre latérale, 6 en pied de barre (Compte). Seuls Ascension, Concours et Casino fermé sont cachés (le casino est ouvert en permanence par défaut, I16) | `NavBar.tsx:95-180`, `useHiddenRoutes` `:190-202` |
| Entrées utiles à la Prise en main | **8** : Accueil, Ordres du jour, Ressources, Bâtiments, Unités, Labo, Missions, Galaxie (+ Alliance à l'étape 9) | `onboarding.ts:49-128` (champ `to` des 10 étapes) |
| Monnaies et jauges | 14 | AE-13 |
| Rendez-vous PNJ annoncés | 6 (boss mondial, boss de saison, boss d'alliance, élite, vendettas, raids) | AE-13 |
| Cartes de l'accueil hors Prise en main | Léviathan, retour du boss, casino, concours, événement, colonies, Atelier, agenda… (4 917 px de haut, AD-8) | `DashboardPage.tsx:30-39` |
| Pages qui ne servent à rien avant des jours | Colonies (120 niveaux cumulés), Ascension, Guerre de territoire (alliance), Boss (flotte), État-major (relique ou officier), panneau Lune (lune ou réserve de pitié), Seigneurs, Casino | §2.1 |

Un nouveau joueur voit donc **5 fois** plus d'entrées qu'il ne peut en utiliser, et le seul fil conducteur (la Prise en main) est sous le
pli de l'accueil (AD-8).

## 2. Diagnostic

### 2.1 Inventaire : verrou actuel, visibilité à J1, première utilité réelle (sûr, code lu)

« J1 » : visible dans le menu d'un compte neuf. « Utile » : première fois où le joueur peut y faire quelque chose. Les jours viennent du §2.2.

| Système (page) | Verrou de jeu actuel (code) | Au menu à J1 | Première utilité réelle |
|:--|:--|:--|:--|
| Accueil, Ordres du jour, Ressources, Bâtiments | aucun | oui | J0 |
| Bâtiments verrouillés (réacteur, extracteurs, Atelier, Cale sèche…) | `unlockCost` / `requires` / `unlockedByTech` (`buildings.ts:126-262`) | oui (cartes à débloquer) | J0 à J10 |
| Labo | aucun ; arbre par `prereq` (`technologies.ts:159-191`) | oui | J0 |
| Unités | hangars par la techno « Infrastructure spatiale » `tech6` (`technologies.ts:166`, `buildings.ts:178,188`) ; chaque unité par sa techno (`units.ts:189-401`) | oui | après `tech6` (§2.2) |
| Planificateur | 600 Ambre au Comptoir de la Ruche (`bounties.ts:582`, `NavBar.tsx:108` : visible grisé avec cadenas) | grisé | après ≈ 600 Ambre |
| État-major (officiers, reliques, modules) | aucun ; vide sans relique ni officier | oui | 1re relique ou 1er officier |
| Colonies (et base avancée) | 120 puis 140 niveaux de bâtiments cumulés (`colonies.ts:27`), base avancée : une colonie (`fleets.ts:104-112,780-783`) | oui | 120 niveaux |
| Classe d'empire | aucun ; 1er choix gratuit (`empireClassChoose.ts:10-17`), étape 2 du Carnet | oui | J0 (Carnet : après la Prise en main) |
| Ascension, talents | tous les bâtiments requis au maximum (`buildings.ts:467`) ; talents : points d'Ascension (`talents.ts:86`) | **non** (après la 1re Ascension, `NavBar.tsx:196-199`) | J10 à J46 |
| Statistiques (dont panneau **Lune**, phalange, porte de saut) | lune : combat subi sur la planète mère (`moon.ts:11`, I21) ; phalange : lune (`phalanx.ts:274`) ; porte : niveau de lune (`jumpGate.ts:124`) | oui (le panneau Lune s'affiche même sans lune, avec la réserve de pitié, `EmpireStatsPage.tsx:411`) | lune : rare (§2.5 de `phalange-porte-de-saut.md`) |
| Portefeuille | aucun | oui | 1re monnaie non commune |
| Missions | aucun pour la page ; chaque mission demande des unités (`missions.ts:20-42`) | oui | 1re unité (drones) |
| Galaxie, espionnage | sonde : `tech20` (`units.ts:201`) | oui | Prise en main, étape 8 |
| Combats, Simulateur | aucun | oui | 1er combat (raid scripté de Varan à l'étape « 10 roquettes », `story.ts:73`) |
| Menaces (raids de faction) | aucun raid avant **72 h** de compte (`pirates.ts:668`, en dur) | oui | J3 au plus tôt |
| JcJ | protection de débutant **72 h** (`pvp.ts:18`, `PVP_RULES.newbieProtectionMs`) | — | J3 |
| Primes (Essaim, Comptoir, Ambre) | aucun pour les rangs 1 et 2 ; proie majeure rang 3, élite rang 5 de l'Essaim (`bounties.ts:41-44`) ; proie d'élite rang 2 (`bounties.ts:809`) | oui | J0 (récit du Serment après le raid scripté) |
| Seigneurs, vendettas | vendetta d'alliance : alliance (`warlords.ts:790`), Ascendant : alliance seule (`:795`) ; unités d'élite : tout le Labo + une vendetta (`eliteUnits.ts:92`) | oui | flotte d'attaque crédible |
| Boss mondial (Léviathan) | aucun, hors de sa fenêtre (`leviathan.ts:270`) | oui (pastille rouge dès qu'il est là) | flotte d'attaque |
| Boss de saison, Hall of fame | aucun | oui | flotte d'attaque |
| Boss d'alliance | alliance, fondateur ou officier, trésor (`allianceBoss.ts:150-157`) | — (dans Alliance) | alliance active |
| Alliance | aucun pour rejoindre ; places limitées (`alliances.ts:208`) | oui | J0 (étape 9 de la Prise en main) |
| Guerre de territoire, guerres de saison | alliance | oui | alliance engagée |
| Communications, Classement | aucun | oui | J0 |
| Commerce (marché, enchères, contrats, pot commun) | aucun (`market.ts:100`, `auctions.ts:104` : plafonds seulement) | oui | stock en surplus |
| Casino | ouvert en permanence par défaut ; caché seulement s'il est fermé (`casinoService.ts:43-47`) | oui | J0 (jetons) |
| Gazette | aucun | oui | lecture |
| Passe, Chroniques | aucun ; épisodes ouverts par date (`chronicles.ts:575`) | oui | J0 |
| Succès, Codex, Journal | aucun | oui | J0 |
| Expéditions (dans Missions) | 10 vaisseaux (`expeditions.ts:31,175`) | — | frégates |
| Concours | admins seuls (`NavBar.tsx:197`) | non | — |
| Compte (Profil, Nouveautés, Annonces, Signalements, Bible, Devblog) | aucun | oui | J0 |

À retenir :
- **Presque aucun système n'a de verrou de jeu** : les verrous réels sont dans le moteur (technos, niveaux, alliance, lune, 72 h), pas dans
  le menu. L'interface affiche tout, même ce qui est vide.
- **Un seul point de passage** décide du menu : `useHiddenRoutes()` (`NavBar.tsx:190`), déjà lu par la barre latérale, la barre mobile,
  la palette Ctrl+K (`CommandPalette.tsx:40`) et la carte de retour du boss (`BossReturnCard.tsx:27`). L'étendre suffit à ouvrir le menu
  par paliers, sans toucher aux routes.
- **Une mémoire par compte existe déjà** : `announcementsSeen` garde les astuces de page vues (`tip:<page>`, 6.14.62, `PageTip.tsx:44-51`).
  Elle peut garder les pages ouvertes (`nav:<page>`) sans nouveau champ.
- **Aucun historique de visite des pages** n'existe avant 6.14.62 : « a déjà ouvert la page » (Q103) ne se mesure que par les astuces
  vues depuis 6.14.62, ou par l'usage (statistiques du joueur : `missions`, `spies`, `marketTrades`, `garrisons`…, `stats.ts:107`).

### 2.2 Moment d'arrivée de chaque verrou (probable : simulation)

Simulateur de progression du moteur (`src/game/balance/progressionSim.ts`, AE-L0), copié dans le scratchpad et instrumenté pour compter
l'XP (missions : récompense `xp` ; objectifs du jour : 15 XP chacun, `contracts.ts:54` ; expéditions de 2 h : 120 XP, `expeditions.ts:35`),
le jour de chaque rang, de chaque techno et des niveaux cumulés. Le simulateur ne compte **ni les succès ni les combats** (XP de 10 à 60
par succès, `achievements.ts:54-60` ; raid scripté), et choisit la techno la moins chère, pas la plus utile : les jours sont des
**bornes hautes**, surtout pour les rangs Fer et Bronze et pour l'occasionnel. Jours écoulés depuis l'inscription :

| Jalon | Actif (8 sessions/j) | Moyen (3 sessions/j) | Quotidien (1 session/j) | Occasionnel (1 session, 1 j sur 3 manqué) |
|:--|--:|--:|--:|--:|
| Fer III (100 XP) | 1,3 | 1,3 | 3,8 | 4,8 |
| Hangars (`tech6`) : 1res unités, Missions | 1,5 | 3,6 | 10,8 | 15,8 |
| Fer II (250 XP) : fin de la Prise en main | 1,5 | 3,8 | 8,8 | 12,8 |
| Bronze III (900 XP) | 2,3 | 4,3 | 12,8 | 18,8 |
| 100 niveaux cumulés | 2,6 | 5,4 | 15,0 | 22,0 |
| Argent III (3 000 XP) | 3,3 | 8,3 | 17,8 | 25,8 |
| **120 niveaux : 1re colonie possible** | **3,7** | **6,6** | **18,9** | **27,9** |
| Or III (7 500 XP) | 4,8 | 12,9 | 25,8 | 37,8 |
| 140 niveaux : 2e colonie | 5,0 | 8,1 | 22,2 | 32,2 |
| Platine III (17 000 XP) | 6,8 | 19,4 | 39,8 | 58,8 |
| 1re Ascension possible | 10,3 | 18,8 | 32,3 | 46,3 |
| XP à J7 / J30 | 18 365 / 135 849 | 2 240 / 40 259 | 210 / 10 474 | 150 / 4 179 |

L'XP vient à 90 % des missions (`missions.ts:17`, 60 XP par heure de mission) : elle dépend du nombre de types de missions débloqués, donc
des unités. **Le rang avance 4 à 8 fois plus vite chez l'actif que chez l'occasionnel**, alors que l'économie (niveaux cumulés) ne va que
2 à 7 fois plus vite.

### 2.3 Ce que ça dit des paliers par rang seul d'AE-13 (sûr, calcul)

AE-13 proposait : Bronze III → Missions, Galaxie, Combats ; Argent III → Seigneurs, Boss, Commerce, Casino ; Or III → Guerre de territoire,
Colonies, Classe. Trois contradictions :

1. **La Prise en main enverrait vers des pages cachées** : ses étapes 5 (mission) et 8 (espionnage, Galaxie) se font **avant** Fer II
   (étape 10), donc avant Bronze III. Pour le moyen : Missions utile à J3,6, Bronze III à J4,3.
2. **Le Carnet du commandant viserait une page cachée** : son étape 2 (classe d'empire, `advancedGuide.ts:57-65`) s'ouvre juste après la
   Prise en main (Fer II), alors qu'AE-13 cache la Classe jusqu'à Or III (J12,9 pour le moyen).
3. **Les colonies resteraient cachées alors qu'elles sont prêtes** : Or III arrive 1 à 10 jours après les 120 niveaux (moyen : J12,9
   contre J6,6 ; occasionnel : J37,8 contre J27,9). Le joueur ne verrait pas son objectif de moyen terme.

Conclusion : **le rang est un bon plafond (« au plus tard »), un mauvais déclencheur.** Le bon déclencheur est le moment où le système
devient utile (étape de tutoriel, techno, seuil approché, événement).

### 2.4 Les dangers arrivent sans prévenir (sûr)

Le raid scripté de Varan part 2 min après l'étape « 10 roquettes » (`story.ts:73`). Les raids de faction et le JcJ s'ouvrent à 72 h. Les
seigneurs peuvent piller. Les alertes (`RaidAlert.tsx`, `FleetsPanel.tsx`, notifications) ne dépendent pas du menu : elles resteront.
Mais une page qui explique un danger (Combats, Menaces, Seigneurs) ne doit jamais être cachée au moment où ce danger arrive.

### 2.5 Douteux

- Le simulateur ignore les succès : en vrai, Fer III et Fer II tombent probablement dès J0-J1 pour qui suit la Prise en main.
- Aucune mesure de rétention par page n'existe : le gain attendu (moins d'abandons à J1-J3) se mesurera après coup (AE-L4).

## 3. Benchmark

| Question (grille §3) | OGame | Clash of Clans | Rise of Kingdoms, Lords Mobile (4X mobiles) | Travian |
|:--|:--|:--|:--|:--|
| Que voit-on au départ | une douzaine d'entrées fixes (vue d'ensemble, ressources, installations, recherche, chantier, défense, flotte, galaxie, alliance…) ; tout est visible, les vaisseaux sont grisés tant que la recherche manque | peu de bâtiments ; le château de clan est d'abord une **ruine** à réparer ; la base des ouvriers s'ouvre par le bateau à réparer (hôtel de ville 4) | quêtes de **chapitre** qui guident pas à pas ; les bâtiments et modes apparaissent avec le niveau de la mairie, une icône grisée dit « Mairie niv. X » | quêtes du tutoriel ; protection de débutant de quelques jours |
| Ce qui ouvre un système | recherches (Astrophysique pour coloniser), lune **aléatoire** née des débris (1 % par 100 000, 20 % au plus) avec phalange et porte de saut lunaires | niveau de l'hôtel de ville (nombre et type de bâtiments) | niveau de mairie + chapitre de quêtes | Résidence ou Palais niveau 10 + 3 colons + points de culture pour un 2e village |
| Annonce | aucune (le joueur découvre) | écran « Nouveau bâtiment disponible » après chaque hôtel de ville | animation « Nouvelle fonction débloquée » + tutoriel court | message du maître des quêtes |
| Leçon | les menus fixes et peu nombreux suffisent quand chaque page montre clairement ce qui manque | **un palier visible, une fête à chaque ouverture** | **le tutoriel et l'ouverture sont le même fil** (chapitre = palier) | le prérequis est dit avant d'être atteint |

Ce qu'on reprend : un fil unique (Prise en main → Carnet) qui ouvre les pages (4X mobiles) ; une annonce courte à chaque ouverture (CoC) ;
la condition affichée avant d'être atteinte (Travian, « Prochaine ouverture ») ; la lune reste une surprise (OGame), mais son panneau
n'apparaît qu'avec elle.

## 4. Options

| | Option | Ce que ça règle | Effort | Effet à J1 | Risque pour les comptes existants | Réglable |
|:--|:--|:--|:--|:--|:--|:--|
| A | **Menu par rang seul** (AE-L5 tel quel) : `navUnlock` = rang requis par page | le nombre d'entrées | S-M (front) | 40 → 12 | nul (Q103) | oui (rang par page) |
| B | **Vrai verrou de jeu par « niveau d'empire »** : routes et actions refusées sous le palier, côté serveur | tout, y compris l'accès direct | **L** (serveur, chaque action, tests d'intégration) | 40 → 12 | **fort** : un joueur actuel perdrait l'accès à un système qu'il utilise si la migration rate ; le serveur devrait juger chaque action | oui |
| C | **Hybride** : pages masquées jusqu'à un palier + ouverture annoncée par une étape de la Prise en main ou du Carnet (« Nouveau : … » + astuce de page) | le nombre d'entrées et le fil du tutoriel | M | 40 → 13 | nul | oui |
| D | **Ouverture par l'usage** : la page apparaît quand elle devient utile (1re unité → Missions, 100 niveaux → Colonies, lune → panneau Lune, raid → Menaces) | rien n'est caché quand il sert | M | 40 → 13 | nul | partiel (les signaux sont du code) |
| **C+D** | **Recommandée** : chaque page s'ouvre au **premier** de : un signal d'usage, une étape du tutoriel, un rang plafond ; masquage seulement (aucune route ni action bloquée) ; un danger ouvre toujours sa page | les trois contradictions du §2.3 ; aucun système caché quand il sert ; un rang « au plus tard » garantit que tout s'ouvre | M + S | 40 → 13 (J0), 18 au plus en fin de J1 | nul (Q103) | oui : rang, signaux et étapes par page dans `navUnlock` |

A est la plus simple mais se contredit avec la Prise en main et le Carnet (§2.3). B protège mieux de l'accès direct, mais l'accès direct
n'est pas un problème (personne ne tape `/game/casino` par hasard) et viole « le serveur fait foi » à l'envers : il faudrait juger des
centaines d'actions. D seule laisse des pages sans plafond (un joueur sans alliance ne verrait jamais la Guerre de territoire, ce qui
est juste) mais certaines pages n'ont pas de signal (Gazette, Codex). D'où C+D.

## 5. Recommandation

### 5.1 Principes

1. **Masquer, jamais verrouiller.** Seul le menu change (barre latérale, barre mobile, Ctrl+K, cartes de l'accueil). Les routes, les
   actions et les règles du serveur restent identiques. Un lien direct, une notification ou un objectif mène toujours à la page.
2. **Ouvrir au premier déclencheur** : signal d'usage OU étape du tutoriel OU rang plafond. Une page ouverte ne se referme **jamais**
   (monotone, mémorisée sur le compte : `nav:<page>` dans `announcementsSeen`).
3. **Un danger ouvre sa page** : flotte hostile, rapport de combat ou d'espionnage reçu, ultimatum, contact d'un seigneur, fin de la
   protection de débutant. Les alertes ne passent jamais par le menu.
4. **Chaque ouverture se fête une fois** : pastille « Nouveau » sur l'entrée jusqu'à la première visite, notification « Nouveau :
   Missions » et astuce de page (`PageTip`, déjà écrite pour 20 pages) à l'arrivée.
5. **Le prochain palier se voit** : une ligne grisée en bas du menu, « Prochaine ouverture : Colonies · 87 / 100 niveaux ».
6. **Un objectif ne vise jamais une page fermée** : les objectifs du jour sont tirés parmi les systèmes ouverts ; un objectif commun (passe,
   Chroniques) ou un succès qui vise une page fermée l'ouvre au clic (« ouverture par l'intention »).

### 5.2 Paliers : ce qui s'ouvre et quand

Jours : premier déclencheur, d'après le §2.2 (bornes hautes ; les succès avancent les rangs Fer et Bronze). « → » : entrée du menu.
Le pied de barre (Compte : Profil, Nouveautés, Annonces, Signalements, Bible, Devblog) reste toujours visible : **6 entrées**.

| Palier | Ce qui s'ouvre | Déclencheur (le premier des trois) | Actif | Moyen | Quotidien | Occasionnel | Menu (+ pied) |
|:--|:--|:--|--:|--:|--:|--:|--:|
| **0. Inscription** | → Accueil, Ordres du jour, Ressources, Bâtiments, Unités, Labo, Communications | toujours | J0 | J0 | J0 | J0 | **7 (13)** |
| **1. Premiers pas** | → Galaxie, Alliance | Fer III · ou étape « 10 roquettes » réclamée (Galaxie) · ou invitation reçue (Alliance) | ≤ 1,3 | ≤ 1,3 | ≤ 3,8 | ≤ 4,8 | 9 (15) |
| | → Missions | 1re unité débloquée (hangars + `tech9`) · ou Fer II | 1,5 | 3,6 | 8,8 | 12,8 | 10 (16) |
| | → Combats, Menaces | **danger** : flotte hostile, rapport reçu, ultimatum · ou fin de la protection de 72 h | ≤ 1,5 (raid scripté) | ≤ 3 | ≤ 3 | ≤ 3 | 12 (18) |
| **2. Commandant** (fin de la Prise en main, ouverture du Carnet) | → Classement, Succès, Passe, Primes, Classe d'empire, Journal | Fer II · ou Prise en main finie · (Primes : récit du Serment après le raid scripté ; Classe : étape du Carnet) | 1,5 | 3,8 | 8,8 | 12,8 | 18 (24) |
| **3. Capitaine** | → Commerce, Codex, Chroniques, Gazette, Statistiques, Portefeuille, Simulateur, Planificateur | Bronze III · ou usage : 1re offre reçue ou contrat (Commerce), 1re catégorie du Codex prête, 1re monnaie rare (Portefeuille), 1er rapport d'espionnage (Simulateur), 600 Ambre (Planificateur) | 2,3 | 4,3 | 12,8 | 18,8 | 26 (32) |
| **4. Stratège** | → État-major, Seigneurs, Boss mondial, Boss de saison, Hall of fame, Casino | Argent III · ou usage : 1re relique ou 1er officier (État-major), contact ou raid d'un seigneur (Seigneurs, **danger**), 1re participation à un boss (Boss) | 3,3 | 8,3 | 17,8 | 25,8 | 32 (38) |
| **5. Colonies** | → Colonies (base avancée comprise) | 100 niveaux cumulés (20 avant le seuil, `levelsRequired[0]` − `navUnlock.colonyLead`) · ou Or III | 2,6 | 5,4 | 15,0 | 22,0 | 33 (39) |
| | → Guerre de territoire | membre d'une alliance **et** (alliance engagée · ou Or III) | 4,8 | 12,9 | 25,8 | 37,8 | 34 (40) |
| **6. Ascension** | → Ascension (inchangé : après la 1re ; avant, raccourci sur Bâtiments) | 1re Ascension | 10,3 | 18,8 | 32,3 | 46,3 | 35 (41) |
| **Hors menu** | panneau **Lune** de Statistiques (phalange, porte de saut) | lune · ou réserve de pitié > 0 · ou chapitre « Ta lune » du Carnet atteint | — | — | — | — | — |

Lecture : à J0, **13 entrées** au lieu de 40 ; à la fin de J1, 13 à 18 selon le rythme (objectif d'AE-13 : 12 à 15 à J1, tenu pour le moyen,
l'occasionnel et le quotidien ; l'actif en est déjà au palier 2). Le casino, les boss et les seigneurs, trois sources de confusion à J1
(jetons, pastille rouge du Léviathan, pillages), arrivent au palier 4. Tout est ouvert à Or III au plus tard (Guerre de territoire : avec
une alliance).

Cartes de l'accueil et barres liées (même règle que le menu) : Léviathan, retour du boss, casino, concours, colonies suivent leur page ;
la barre mobile par défaut (`mobileTabs.ts:5`, Accueil, Bâtiments, Unités, Galaxie) remplace Galaxie par Labo tant que Galaxie est fermée ;
la barre des ressources (`ResourceHud.tsx`) ne montre une monnaie (Ambre, jetons, Éclats…) qu'à partir du premier gain.

### 5.3 Règles réglables : groupe `navUnlock` (registre `ruleRegistry.ts`)

```ts
export const NAV_UNLOCK_RULES = {
  /** false : tout le monde voit tout (ancien comportement). */
  enabled: true,
  /** Comptes créés avant cette date (ms) : tout ouvert (Q103). null : ouverture progressive pour personne. */
  newAccountsFrom: DEPLOY_MS as number | null, // valeur littérale : la date du déploiement, posée dans le lot DP-L2
  /** Rang au-delà duquel un compte voit tout s'il a été créé avant `newAccountsFrom` (Q103 : « au-delà de Fer II »). */
  veteranRank: "fer2",
  /** Colonies : ouverture N niveaux avant le seuil de la 1re colonie. */
  colonyLead: 20,
  /** Objectifs du jour tirés parmi les systèmes ouverts. */
  filterContracts: true,
  /** Par page : rang plafond, signaux d'usage (liste fermée NAV_SIGNALS) et étape de tutoriel ; ouverte au premier vrai. */
  pages: {
    "/game/galaxie": { rank: "fer3", signals: ["danger"], step: "rockets10" },
    "/game/missions": { rank: "fer2", signals: ["firstUnit"] },
    "/game/combats": { rank: "fer2", signals: ["danger", "protectionOver", "report"] },
    "/game/colonies": { rank: "or3", signals: ["colonyNear", "hasColony"] },
    // … une entrée par page du menu ; absente = toujours visible
  } as Record<string, { rank?: string; signals?: string[]; step?: string }>,
};
```

- JSON pur, fusionné champ par champ (la fusion de `pages` se fait page par page, pour qu'un réglage partiel n'efface pas les autres).
- `NAV_SIGNALS` (code, liste fermée) : `danger`, `protectionOver`, `report`, `firstUnit`, `colonyNear`, `hasColony`, `inAlliance`,
  `allianceAtWar`, `hasRelicOrOfficer`, `warlordContact`, `bossJoined`, `rareCurrency`, `marketOffer`, `codexReady`, `plannerAmber`,
  `hasMoon`, `ascended`. L'éditeur coche des signaux, choisit un rang (liste des rangs) et une étape (liste des étapes).
- **Admin → Règles → Ouverture du menu** : tableau page par page (rang, signaux, étape), et un aperçu « ce que voit un compte neuf » à J0,
  J1, J7 pour chaque profil du simulateur (nombre d'entrées).
- Le moteur garde les conditions pures dans `src/game/navUnlock.ts` (`navOpenPages(player, now, ctx)`, `nextNavOpening`) : le client
  les lit pour le menu, le serveur pour filtrer les objectifs du jour (export dans `hooksEntry.ts`).

### 5.4 Ce qui reste toujours visible

Accueil, Ordres du jour, Ressources, Bâtiments, Unités, Labo, Communications et tout le pied de barre ; les alertes (flotte hostile,
alerte plein écran à 5 min, notifications) ; la Prise en main et le Carnet ; la palette Ctrl+K, qui montre une page fermée **grisée**
avec sa condition (« s'ouvre à Bronze III ») et l'ouvre si on la choisit ; toute page pour un admin.

### 5.5 Comptes existants (Q103, validée)

Tout est ouvert pour un compte qui remplit **une** de ces conditions :
1. créé avant `newAccountsFrom` **et** XP au-delà de `veteranRank` (Fer II) : les comptes actuels voient tout, sans écriture en base ;
2. page déjà ouverte : marque `nav:<page>` ou astuce vue `tip:<page>` dans `announcementsSeen` (seule trace de visite avant ce lot) ;
3. option « Tout afficher » des Réglages (DP-Q5), pour un ancien joueur qui recrée un compte.

Un compte créé avant la date mais encore sous Fer II garde l'ouverture progressive, sauf pour les pages dont il a déjà vu l'astuce ou
dont il a l'usage (signaux : il a une alliance, des unités…). Rien n'est écrit sur les fiches existantes : la règle se calcule.
Retour en arrière : `navUnlock.enabled` à faux, ou `newAccountsFrom` à `null`.

### 5.6 Attaqué avant d'avoir ouvert le système

- Les alertes ne dépendent pas du menu (`FleetsPanel.tsx`, `RaidAlert.tsx`, notifications) : rien ne change.
- Le signal `danger` (flotte hostile en approche, rapport de combat ou d'espionnage reçu, ultimatum, contact de seigneur) ouvre **sur-le-champ**
  Combats, Menaces ou Seigneurs, avec la notification « Nouveau : Combats — ta base a été attaquée, voici le rapport ».
- La fin des 72 h de protection ouvre Combats et Menaces même sans attaque, avec la notification « Ta protection de débutant est finie ».
- La défense (Unités, roquettes, posture) est au palier 0 : un joueur peut toujours se défendre.
- Garde-fou : un test parcourt chaque type de notification de danger et vérifie que sa page cible est ouverte après l'événement (§6, I30).

### 5.7 Annonces, Prise en main et Carnet

- **Pas de grande annonce** par ouverture (une annonce exige une image, CLAUDE.md) : une notification « Nouveau : … » (texte court, lien),
  la pastille « Nouveau » sur l'entrée et l'astuce de page à la première visite. Les astuces manquantes (Classe, État-major, Colonies,
  Boss, Seigneurs, Casino, Passe, Chroniques, Codex…) s'écrivent dans `PAGE_TIPS`.
- La **Prise en main** et le **Carnet** deviennent le fil des ouvertures : chaque étape qui mène à une page fermée l'ouvre (étape `step` de
  la règle). La carte de l'étape suivante dit ce qu'elle ouvrira (« Débloque : Missions »).
- **Pas d'annonce** pour le lot (DP-Q6) : les comptes existants ne voient aucun changement, et un compte neuf découvre le menu
  progressif de lui-même. Une ligne de changelog suffit.

### 5.8 Succès, passe, Chroniques, objectifs du jour

- **Objectifs du jour** (`contracts.ts:76,143`) : le tirage d'un **nouveau** jour se fait parmi les types dont le système est ouvert
  (`win_attack`, `win_defense`, `spy` : Combats/Galaxie ; `market`, `gift` : Commerce ; `missions` : Missions). Le jour en cours n'est pas
  retiré (I24). Aujourd'hui déjà, un compte neuf peut tirer « gagner une attaque » ou « vendre au marché » : le filtre corrige aussi ça.
- **Passe et Chroniques** (communs à tout le serveur, I17 à I19) : rien ne change dans leur génération. Un défi qui vise une page fermée
  porte la mention « Ouvre : Commerce » ; le bouton « J'y vais » ouvre la page (intention). Les points du passe gardent toutes leurs
  autres sources : la faisabilité (I18) n'est pas touchée.
- **Succès** : aucun retiré (I25). Un succès d'un système fermé s'affiche dans « À découvrir » avec la condition d'ouverture, sans son
  chiffre de progression.
- **Codex** : les fiches d'une page fermée restent lisibles (le Codex est la bible du joueur).

### 5.9 Maquette (barre latérale, compte neuf à J0)

```
EMPIRE         Accueil · Ordres du jour (1) · Ressources · Bâtiments · Unités · Labo
SOCIAL         Communications
               ─────────────────────────────────────
               Prochaine ouverture : Galaxie et Alliance · 40 / 100 XP
COMPTE (pied)  Profil · Nouveautés · Annonces · Signalements · Bible · Devblog
```

Groupe vide : caché (Opérations, Grands ennemis, Progression à J0). Textes clés : « Nouveau : Missions. Envoie tes drones chercher des
ressources pendant que tu construis. » ; « Prochaine ouverture : Colonies · 87 / 100 niveaux ».

## 6. Invariants

| # | Invariant | Où | Test |
|:--|:--|:--|:--|
| **I30** (nouveau) | Menu progressif : il **masque** sans bloquer (aucune route ni action refusée) ; une page ouverte ne se referme jamais ; une page s'ouvre au plus tard à son rang plafond ; un signal `danger` ouvre Combats, Menaces ou Seigneurs avant que la notification soit lue ; un compte créé avant `newAccountsFrom` au-delà de `veteranRank`, ou un admin, voit tout ; `enabled` à faux rend l'ancien menu | `navUnlock.ts`, `NavBar.tsx` (`useHiddenRoutes`) | `navUnlock.test.ts` |
| **I30* (nouveau) | Un objectif du jour d'un **nouveau** jour n'est tiré que parmi les systèmes ouverts du joueur ; le tirage du jour en cours n'est jamais refait | `contracts.ts` (`ensureContracts`) | `contracts.test.ts`, intégration « DP-L4 » |

Gardes ajoutées :
- chaque entrée de `NAV_GROUPS` a une règle dans `NAV_UNLOCK_RULES.pages` ou figure dans la liste « toujours visible » (une nouvelle page
  ne peut pas être oubliée) ;
- chaque étape de la Prise en main et du Carnet mène à une page ouverte au moment où l'étape devient courante (rejoue les étapes
  d'un compte neuf) ;
- chaque signal de `NAV_SIGNALS` est lu par `navOpenPages` ;
- `ruleRegistry.test.ts`, `rulesAdmin.test.ts`, `reglages671.test.ts` : `navUnlock` déclaré, éditable, appliqué ;
- le simulateur (`progressionSim.ts`) rend le jour de chaque palier par profil ; un test borne J0 à 15 entrées au plus et vérifie que
  tout est ouvert avant J40 pour l'occasionnel (hors Guerre de territoire et Ascension).

## 7. Plan de lots

| Lot | Contenu | Fichiers | Taille | Prérequis |
|:--|:--|:--|:--|:--|
| **DP-L0** | Cette proposition ; questions DP-Q1 à DP-Q7 dans `QUESTIONS.md` et `decisions-a-valider.md` ; ligne AE-L5 de la feuille de route renvoyée ici | docs | S | — |
| **DP-L1** | Moteur : `navUnlock.ts` (règles, `NAV_SIGNALS`, `navOpenPages`, `nextNavOpening`), registre, fusion, export `hooksEntry.ts` ; simulateur : XP par source et jour de chaque rang et palier (instrumentation du §2.2 versée dans le dépôt) ; tests I30 | `src/game/navUnlock.ts`, `ruleRegistry.ts`, `content.ts`, `server/hooksEntry.ts`, `balance/progressionSim.ts`, tests | M | — |
| **DP-L2** | Interface : `useHiddenRoutes` lit `navOpenPages` ; marque `nav:<page>` (action `seenAnnouncements`) ; pastille « Nouveau », notification, ligne « Prochaine ouverture », groupes vides cachés ; Ctrl+K grisé ; cartes de l'accueil, barre mobile par défaut, monnaies du HUD ; option « Tout afficher » (Réglages) ; astuces manquantes (`PAGE_TIPS`) ; `newAccountsFrom` = date du déploiement. Audit DESIGN.md, 375 px | `NavBar.tsx`, `CommandPalette.tsx`, `mobileTabs.ts`, `DashboardPage.tsx`, `ResourceHud.tsx`, `PageTip.tsx`, `SettingsPage` | M | DP-L1 |
| **DP-L3** | Fil du tutoriel : étapes de la Prise en main et du Carnet → ouverture (`step`), « Débloque : … » sur la carte ; panneau Lune seulement avec lune, pitié ou chapitre ; « Ouvre : … » et intention sur les défis du passe, des Chroniques et les succès « À découvrir » | `OnboardingChecklist.tsx`, `CommanderGuideCard.tsx`, `EmpireStatsPage.tsx`, `SeasonPassPage`, `ChroniclesPage`, `AchievementsPage` | S-M | DP-L2 |
| **DP-L4** | Serveur : objectifs du jour filtrés (I31), notification « Nouveau : … » au signal `danger` et à la fin des 72 h ; intégration PocketBase | `contracts.ts`, `cosmic_db.js`, `itest` | S | DP-L1 |
| **DP-L5** | Admin : section « Ouverture du menu » (tableau par page, aperçu par profil) | `panels.tsx` (Règles) | S | DP-L1 |
| **DP-L6** | Chaîne et livraison : changelog, pré-prod avec un compte neuf (captures Constellation, J0 et après chaque palier), succès « Tout l'empire » (toutes les pages ouvertes, bronze) et sa ligne de Codex ; GDD (I30, I31, fiche système), `CLAUDE.md` (« une nouvelle page du menu a sa règle `navUnlock` ») | `changelog/`, `achievements.ts`, `codex.ts`, docs | S | DP-L2 à DP-L5 |
| DP-L7 | Mesure, 4 semaines après : jour d'ouverture de chaque page par cohorte, rétention J1/J3/J7 des comptes neufs avant et après (AE-L4) ; ajustement des rangs dans l'admin | `serverMetrics.ts`, rapport | S | DP-L6 + production |

Pas de lot 0 d'urgence : rien n'est cassé, la charge cognitive est un constat de gravité moyenne.

## 8. Questions ouvertes (option recommandée appliquée selon la règle n° 3)

| # | Question | Option recommandée | Autre option | Revenir en arrière |
|:--|:--|:--|:--|:--|
| DP-Q1 | Déclencheur : rang seul (AE-13) ou premier de signal, étape, rang ? | **Premier des trois** : les contradictions du §2.3 disparaissent, le rang reste un plafond | rang seul | vider `signals` et `step` des pages dans l'admin |
| DP-Q2 | Page fermée : cachée ou grisée avec cadenas (comme le Planificateur) ? | **Cachée**, avec une seule ligne « Prochaine ouverture » ; grisée dans Ctrl+K | tout grisé (40 lignes restent) | réglage `navUnlock.style` (`hidden` / `locked`) |
| DP-Q3 | Paliers et rangs du §5.2 (Casino, boss et seigneurs à Argent III ; Colonies 20 niveaux avant le seuil) | **Ceux du §5.2** | ceux d'AE-13 | Admin → Règles → Ouverture du menu |
| DP-Q4 | « A déjà ouvert la page » (Q103) : aucune trace de visite avant 6.14.62 | astuce vue (`tip:`) ou marque `nav:` dans `announcementsSeen`, plus les signaux d'usage ; aucun nouveau champ | nouveau champ `navOpened` (schéma) | supprimer la lecture des marques |
| DP-Q5 | Option « Tout afficher » dans les Réglages pour tout joueur ? | **Oui** (ancien joueur sur un nouveau compte) ; elle ouvre aussi les objectifs du jour | non | retirer l'option |
| DP-Q6 | Annonce pour ce lot ? | **Non** : rien ne change pour les comptes existants ; une ligne de changelog et une mention dans le billet de la prochaine grosse mise à jour | annonce avec image | — |
| DP-Q7 | Objectifs du jour filtrés par les systèmes ouverts | **Oui**, pour les nouveaux jours seulement | tirage inchangé | `navUnlock.filterContracts` à faux |

Hors périmètre, à noter : la protection de 72 h avant les raids de faction est en dur (`pirates.ts:668`, `hours(72)`) : elle devrait lire
`PVP_RULES.newbieProtectionMs` ou une règle à elle (règle n° 2). À traiter dans DP-L4 ou un correctif à part.

## 9. Reproduire

Instrumentation temporaire (scratchpad, hors dépôt) : copie de `progressionSim.ts` qui ajoute, à chaque pas, l'XP des missions
(`missionRewards(...).xp`), des objectifs du jour (`profile.objectives × CONTRACT_RULES.xpPerContract`) et des expéditions (2 h ×
`EXPEDITION_RULES.xpPerHour`), puis relève le premier jour de chaque rang (`RANKS`), de chaque techno à 1 et de 40 à 140 niveaux cumulés.
Empaquetage par esbuild avec l'alias `@` → `src`, comme `scripts/progression-sim.mjs`. Le lot DP-L1 verse cette instrumentation dans le
simulateur pour que chaque réglage de `navUnlock` se mesure avant d'être appliqué.
