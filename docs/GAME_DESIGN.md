# Game design : Cosmic Empires (GDD)

Document de conception de référence (GDD). `DESIGN.md` dit à quoi le jeu ressemble ; ce document dit **comment il fonctionne et pourquoi**.
Toute proposition (`docs/proposals/`) s'appuie dessus ; une fois livrée, ses règles rejoignent les fiches systèmes (§7) et le lot a sa fiche dans `docs/changes/`. Une règle qui change ici change aussi dans le moteur et ses tests.

## 1. Piliers

| Pilier | Ce que le joueur ressent | Ce que ça interdit |
|:--|:--|:--|
| **Bâtir sans attendre devant l'écran** | je lance, je reviens, ça a avancé | une action qui exige d'être connecté à heure fixe pour ne rien perdre |
| **Perdre, oui ; perdre sans choix, non** | une défaite coûte, mais je savais et je peux réagir | une perte silencieuse, un plafond qui bloque sans dire pourquoi ni comment en sortir |
| **Chaque nombre s'explique** | je comprends d'où vient un chiffre (page Formules, infobulles) | un bonus caché, deux écrans qui affichent deux valeurs |
| **Le serveur fait foi** | ce que je vois est ce qui est | une règle appliquée par le client seul |
| **Social d'abord, payant jamais** | l'Ambre se gagne à la chasse, le prestige se voit | un avantage de combat achetable hors du jeu |

## 2. Boucles de jeu

| Boucle | Durée | Contenu | Récompense |
|:--|:--|:--|:--|
| Session | 2 à 10 min | relancer les files (bâtiments, labo, chantier), récolter, envoyer des flottes | progression visible, notifications |
| Journée | 24 h | 4 objectifs du jour (minuit Paris), série de connexion, raids pirates ; tout réuni dans **Ordres du jour** (5.30) | ressources, jetons, Ambre (j6), coffre (j7) |
| Semaine | 7 jours | boss en rotation, défis hebdo, offre de la semaine, tournoi du casino | reliques, plans, titres |
| Saison | 1 mois | passe (30 paliers), Chroniques, guerres de saison, divisions | bannières, titres, Ambre |
| Méta | plusieurs mois | Ascension (bâtiments remis au niveau 1, talents), colonies, fin de partie | étoiles, talents, prestige |

Une boucle courte ne doit jamais casser une boucle longue. Exemple : une défaite (session) ne doit pas bloquer
le chantier naval pendant des jours (semaine). C'est le problème de la 5.20 à la 5.27 (voir `proposals/cale-seche.md`).

## 3. Carte des systèmes

```
Ressources ──► Bâtiments ──► Capacités (entrepôt, hangars, Atelier, bouclier)
     │             │
     ▼             ▼
Laboratoire ──► Unités ──► Flottes ──► Combats (JcJ, pirates, seigneurs, boss, primes, expéditions)
                  ▲                         │
                  │                         ├─► Pertes ─► Débris ─► Recyclage ─► Ressources
                  │                         ├─► Sauvées ─► Atelier ─► (retour au hangar)
                  │                         └─► Butin, XP, Ambre, reliques, plans
                  └──── Modules, officiers, reliques, technologies (effets : src/game/effects.ts)
```

Effets : toute source de bonus passe par le circuit unique de `effects.ts` (stat, cible, valeur).
**Une stat déclarée doit être lue par le moteur.** La grille d'audit (§6) vérifie ce point.

## 4. Invariants du moteur

Chaque invariant a (ou doit avoir) un test. Si une fonctionnalité doit en violer un, la proposition le dit explicitement.

| # | Invariant | Où | Test |
|:--|:--|:--|:--|
| I1 | Unités conservées : base + en vol + Atelier + prêts + pertes = avant combat | `attack.ts`, `pirates.ts`, `bounties.ts`, `workshop.ts` | `workshop.test.ts`, `attack.test.ts`, `caleSeche.test.ts` |
| I2 | **Places de hangar** : base + en vol + Atelier hors Cale sèche + file ≤ capacité, **à chaque construction** ; en cale ≤ postes | `actions.ts` (`buildUnits`) via `hangarLoad` | `actions.test.ts`, `caleSeche.test.ts` |
| I3 | Aucun ajout d'unités hors construction, retour de flotte, fin de réparation ou remise en service (qui vérifie la place) ; une récompense en vaisseaux (épave d'expédition) passe par les « prêts » | tout `src/game` + migrations | `caleSeche.test.ts` (I3), `expeditions.test.ts` |
| I4 | La capacité ne baisse jamais sous la flotte sans état « surcharge » visible ; l'Ascension garde hangars et Cale sèche | `ascension.ts` (`keptOnAscension`) | `ascension.test.ts`, `caleSeche.test.ts` (I4) |
| I5 | Places et capacité des hangars : une seule fonction (`hangarLoad`, `playerUnitCapacity` dans `hangar.ts`) | client, serveur, Statistiques | `caleSeche.test.ts` (I5, garde sur `getUnitCapacity(`) |
| I6 | Le butin et les livraisons arrivent même entrepôt plein (choix assumé) : retour d'attaque, rapatriement, livraison rappelée, livraison vers une colonie ou un client de contrat ; le stock au-delà de la capacité est gardé (la production s'arrête, rien n'est retiré) | `fleets.ts` (`completeFleetReturn`), `colonies.ts` (`deliverToColony`), `tradeContracts.ts` (`completeTradeContract`), `economy.ts` (`addCapped`) | `fleets.test.ts` (« I6 : entrepôt plein », 6.14.61) |
| I7 | Rien dans `src/game` n'utilise `Intl` / `localeCompare` / `toLocaleString` | tout `src/game` | `serverSafe.test.ts` |
| I8 | Une remise en service automatique ne tourne que si le serveur a lu les flottes en vol (`awayKnown`) | `actions.ts` (`performPlayerAction`), `cosmic_db.js` (`dockAutoOnReturn`) | `caleSeche.test.ts` |
| I9 | Chaque stat d'effet est lue dans la couche empire (champ de `Modifiers` consommé, ou lecteur direct) ; 6.14.124 : les effets des recherches et projets d'alliance hors calcul d'alliance entrent par `empireEffects` (I40) | `modifiers.ts`, `effectTargets.ts`, `hangar.ts`, `workshop.ts`, `alliances.ts` (`allianceEmpireEffects`) | `effectsRead.test.ts`, `allianceEffects.test.ts` |
| I10 | La part à l'abri du pillage ne dépasse jamais la règle de capacité ; une fois la règle en heures active, elle vaut au plus max(plancher, H h de production) | `economy.ts` (`protectedAmount`) | `storageRisk.test.ts` |
| I11 | Un chantier de bâtiment ne se lance que si un chantier est libre (`buildSlots`) ; un chantier déjà en cours n'est jamais annulé par la règle | `buildPlan.ts`, `actions.ts` | `storageRisk.test.ts` |
| I12 | Une flotte ne décolle que si une place est libre : flottes en vol hors sondes et expéditions < emplacements (`FLEET_RULES.slotsBase`) ; une flotte déjà en vol n'est jamais rappelée par la règle | `fleets.ts` (`fleetSlotBlocker`), `cosmic_db.js` (`fleetsActive`) | `fleetSlots.test.ts` |
| I13 | Un convoi de route logistique ne prend jamais sous la réserve de la colonie et ne porte jamais les ressources communes de la planète mère au-delà de son entrepôt | `colonies.ts` (`colonyRouteLoad`, `runColonyRoute`) | `colonyRoutes.test.ts` |
| I14 | Au plus une classe d'empire active ; ses effets passent par la couche empire et ses plafonds ; aucun maximum théorique de la couche empire (rapport d'impact) ne dépasse son plafond | `empireClass.ts`, `modifiers.ts`, `impact.ts` | `empireClass.test.ts`, `derived.test.ts` |
| I15 | Couche techno : attaque et défense des unités ≤ +150 % au total ; une techno ≤ +100 % à son niveau maximal et ne monte pas une unité au-delà de son niveau maximal | `effects.ts` (`TECH_COMBAT_CAP`), `technologies.ts` (`validateTechEffect`) | `menaces66.test.ts` |
| I16 | Avec les réglages par défaut, boss de la chronique (mardi), tournoi du casino (mercredi, casino ouvert en permanence) et événement du week-end (vendredi) ne commencent jamais le même jour ; le boss de la chronique ne chevauche jamais le boss mondial | `events.ts` (`bossWindows`), `casino.ts` (`tournamentWeeklyWindows`) | `calendrier67.test.ts` |
| I17 | Un seul passe par mois : dès novembre 2026, le passe du chapitre n'est plus lu ; un chapitre écrit à la main ne remplace un mois généré que par choix de l'admin (bibliothèque), et un mois déjà commencé n'est jamais déplacé ; 6.14.57 : un brouillon de passe ou un chapitre non commencé écrit par un générateur plus ancien (`auto.generator` < `GENERATOR_VERSION`) est régénéré avec la même variante, l'ancien état gardé dans l'historique du contenu, jamais un passe publié, un chapitre commencé, écrit, repris de la bibliothèque ou retouché dans l'admin (`auto.editedAtMs`) | `seasonPass.ts` (`activePass`), `chronicles.ts` (`moveWrittenToLibrary`, `applyLibraryChapter`), `procedural.ts` (`outdatedChapters`), `passSeasons.ts` (`outdatedPassDrafts`), `cosmic_db.js` (`passSeasonsTick`, `regenerateOutdatedChapters`) | `progression680.test.ts`, `generateurVersionne.test.ts`, intégration « 6.14.57 (AP-3) » |
| I18 | Passe généré : paliers 1 à 29 dans ±5 % du budget (`passGen.budgetHours`), plafonds du mois respectés (Ambre, jetons, dossiers, capsules), dernier palier hors budget ; points par palier entre `pointsMin` et `pointsMax`, même graine → même passe ; 6.14.58 : rythme d'une action dans les défis jamais au-dessus de la médiane du serveur, action de médiane nulle ou sous `challengeMinWeekly` (passive : sous `passiveMinWeekly`) hors des défis ; joueur médian simulé au dernier palier au plus tard le jour `latestMedianDay`, sauf si ses points par jour ne le permettent pas au minimum de points par palier ; un brouillon publié d'office passe d'abord la même garde (défis tirés à nouveau, réduits, ou brouillon régénéré) | `passGen.ts` (`challengePool`, `actionPlayable`, `computePointsPerTier`), `passSeasons.ts` (`generatePassSeason`, `weeklyRate`, `fitChallenges`, `ensureFeasiblePass`), `cosmic_db.js` (`passSeasonsTick`) | `progression681.test.ts`, `defisFaisables.test.ts` |
| I19 | Chapitre généré : 4 épisodes, objectifs pris parmi les actions autorisées (`chronicleGen.objectiveWeights` > 0), difficulté dans ses bornes ; faction du thème du passe sauf si elle était là le mois précédent ; les récompenses par budget ne changent pas le reste du tirage ; 6.14.58 : action passive (raids, seigneurs) seulement si sa médiane atteint `passGen.passiveMinWeekly`, épisode 3 parmi les actions dont la médiane atteint `chronicleGen.stretchMinWeekly` (serveur mesuré), quantité jamais au-dessus de médiane × difficulté quand la médiane est sous le plancher ; 6.14.122 : seule exception, l'**épisode « nouveauté »** (`novelty.episode`, le 2e par défaut) prend l'action par contenu (`unit:<id>`, `research:<id>`, `building:<id>`) d'un contenu daté (`addedOn`) depuis au plus `novelty.noveltyDays` jours au 1er du mois, accessible à au moins `novelty.minAccessShare` des joueurs actifs, jamais mis en avant deux fois, au plus un mois sur `novelty.everyMonths`, avec sa propre graine (le reste du chapitre est celui d'avant) ; sans contenu daté récent, chapitre inchangé | `procedural.ts` (`generateChapter`, `chooseObjectives`, `objectiveCount`), `chronicleGen.ts`, `novelty.ts` (`chooseNovelty`) | `progression682.test.ts`, `defisFaisables.test.ts`, `nouveaute.test.ts`, intégration « 6.14.121 (AP-L7) et 6.14.122 (AP-L8) » |
| I20 | Base avancée : une attaque partie d'une base ne prend jamais plus de vaisseaux que la base n'en contient et ne touche pas aux vaisseaux à quai de la planète mère ; les vaisseaux basés restent comptés dans le hangar de la planète mère (`unitsAwayOf`) | `fleets.ts` (`takeFromBase`, `baseReturnUnits`) | `flotteBasee.test.ts` |
| I21 | Lune : un joueur en a au plus une ; elle ne naît que d'un combat sur sa planète mère (jamais sur une colonie ni pour un PNJ) ; chance = `min(1, moonChance(débris) + moonPity)`, `moonChance` = 1 % par tranche de `debrisPerPercent`, `maxChance` au plus ; 6.14.44 : chaque combat subi sur la planète mère sans lune (attaquant joueur) ajoute `pityPerDefense` à la réserve **avant** le tirage (lune garantie au 20e à 5 %), une naissance la remet à 0, `pityPerDefense = 0` la rend inerte ; ses effets passent par la couche empire et ses plafonds ; son bouclier au niveau maximal reste sous le plafond (15 %) | `moon.ts` (`addMoonPity`, `rollMoon`, `moonEffects`), `attack.ts` | `lunes.test.ts`, `derived.test.ts` |
| I22 | Phalange : rend une flotte cachée (`trueUnits` au niveau `revealDecoyLevel`, `boosts` au niveau `revealBoostLevel`) seulement à sa cible (planète mère ou colonie), jamais à un allié ni à un tiers, sans rien écrire dans la flotte ; le radar ne signale une attaque de joueur qu'aux alliés de la cible (même alliance, lune, portée couvrant la planète visée), ni la cible ni l'attaquant, `radarMaxNotified` au plus ; un balayage ne vise qu'un agresseur (flotte d'attaque en approche vers soi, une de ses colonies ou un allié couvert), respecte sa recharge et son coût, et ne montre que la composition affichée (jamais `trueUnits`) | `phalanx.ts` (`revealIncoming`, `radarRecipients`, `isAggressor`, `scanRefusal`, `buildScanReport`) | `phalange.test.ts` |
| I23 | Porte de saut : ne fait que rapatrier une flotte du joueur vers sa planète mère, pour les missions permises (patrouille, garnison, base avancée : le réglage peut en retirer, jamais en ajouter), hors statut « done » ou « decision », sans cargaison, une fois par recharge ; unités conservées (I1), aucune ressource créée | `jumpGate.ts` (`jumpRefusal`, `jumpedFleet`, `markJump`) | `porteSaut.test.ts`, `attack.test.ts` (I1) |
| I24 | Une fiche joueur n'est réécrite que dans une transaction qui l'a relue (jamais depuis une lecture ancienne : campagne d'e-mails, statistiques, désinscription) ; tout rattrapage sauvé (`loadFlushed`, `flushPlayer`) écrit ses notifications dans la même fonction, hors PNJ ; un raid de faction a toujours sa date de départ | `cosmic_db.js` (`ensureMailTokens`, `bumpPlayerStat`, `unsubscribe`, `createPirateRaid`), `cosmic.pb.js` | `ecrituresSures.test.ts`, intégration « 6.14.52 (AC-1) », « 6.14.52 (AC-13) », « v5.1 » (pseudo) |
| I25 | Liste des succès : tout succès par défaut absent de la liste enregistrée (`game_config.achievements`) est complété à l'application du contenu, sauf s'il est dans `achievementList.removedDefaults` (retiré exprès dans l'admin) ; le générateur de paliers n'ajoute que ses paliers à la liste enregistrée, et date (`createdAtMs`) un ancien palier généré sans date, sans rien retirer (6.14.108) | `achievements.ts` (`withDefaultAchievements`), `content.ts` (`applyGameContent`), `cosmic_db.js` (`proceduralTick`) | `achievementsDefaults.test.ts` |
| I26 | Contenu de l'admin : une section de `CONTENT_SECTIONS` écrite par une requête (`game_config`) n'apporte aucune erreur nouvelle de `validateGameContent` ; chaque valeur garde la forme de son défaut, à toute profondeur (nombre fini, jamais `null` sauf défaut `null`, pas de négatif si tous les défauts sont positifs, champ chiffré présent dans tous les éléments par défaut d'une liste obligatoire) ; un écart de plus de ×2 au défaut est seulement averti (Q75) | `contentShape.ts`, `content.ts` (`contentSectionErrors`, `validateRules`, `validateGameContent`), `cosmic_db.js` (`guardContentConfig`) | `gardeFous.test.ts`, intégration « 6.14.59 garde-fous » |
| I27 | Tout identifiant par défaut d'unité, de bâtiment, de techno ou de relique ajouté après la première liste a une entrée `appendFromDefaults` dans `CONTENT_MIGRATIONS`, ou est ajouté d'office (`withFixedUnits`, `withFixedBuildings`) ; un champ ajouté au contenu livré qui porte une règle (rôles d'unités 6.14.123, effets d'alliance 6.14.124) a sa migration `run` qui ne remplit que les entrées livrées sans ce champ | `cosmic_db.js` (`CONTENT_MIGRATIONS`) | `contentMigrations.test.ts` |
| I28 | L'état de jeu d'un joueur ne s'écrit et ne s'efface que par le serveur : l'éditeur de l'admin envoie des **différences**, appliquées sur la fiche relue et rattrapée dans la transaction, sous les plafonds (niveaux maximaux, entrepôt des ressources communes, hangars par `hangarLoad`), motif et journal obligatoires ; la suppression d'un compte (admin ou joueur) passe par `purgePlayer`, qui rend aux autres joueurs ce qui leur revient (mises, cautions, garnisons, rôle de fondateur) ; les règles d'API réservent la suppression de `players` et `queues` aux admins et refusent l'écriture directe de l'état de jeu, y compris aux admins du jeu | `adminEdit.ts` (`adminEditDiff`, `applyAdminEdit`), `cosmic_db.js` (`adminPlayerAction`, `purgePlayer`, `accountDelete`, `guardUserDelete`, `SCHEMA_RULE_SYNC`), `pb_schema.json` | `adminEdit.test.ts`, `compteServeur.test.ts`, intégration « 6.14.65 (AC-B) », « 6.14.66 (AC-C) » |
| I29 | Équilibre gardé par simulation (6.14.88 : étendu à 365 jours). **Avant la bascule du rythme** (contenu résolu sans heure) : le simulateur de progression (déterministe, 4 profils sur 90 jours) garde la 1re Ascension de chaque profil dans ses bornes (actif J8–13, moyen J15–23, occasionnel J38–56, quotidien J26–40) ; à budget égal, un défenseur moitié défenses, moitié vaisseaux à quai tient jusqu'à ×0,85 au moins de sa dépense, des défenses seules jusqu'à ×2 ; le coffre du 7e jour vaut au plus `streak.chest.commonHours[1]` (18) heures de production et ne remplit pas l'entrepôt au-delà du plancher (6.14.106 ; avant : sous 24 h de production du joueur quotidien). **Après la bascule** (`applyGameContent({}, rhythm.switchAt)`, 365 jours, Ascension dès que possible, projets de prestige) : 1re Ascension dans les bandes cibles de `proposals/rythme-long-terme.md` §4.1, bas élargi de 10 % (actif J72–110, moyen J85–125, quotidien J99–150, occasionnel J117–180), 30 jours au moins entre deux Ascensions, 3 à 6 la 1re année selon le profil ; aucun jour « fini, sans suite » ; production perdue ≤ 15 % sur l'année ; au plus 3 jours sans dépense par mois (4 pour l'occasionnel) ; sessions bloquées ≤ 15 % chaque mois, **mois qui suit la 1re Ascension compris** (6.14.89 : exception de 6.14.88 retirée), un mois par profil toléré jusqu'à 20 % (6.14.106 : bruit du modèle de ± 3 sessions, quotidien 16,7 % le mois de sa 1re Ascension avec le coffre indexé) ; première semaine : moins de 2 % de sessions sans action, extracteurs de l'actif au niveau 8 à J7. Un réglage qui sort de ces bornes passe par une proposition et change les bornes dans le même commit | `balance/progressionSim.ts`, `balance/pvpBudget.ts`, `rhythm.ts` (`node scripts/progression-sim.mjs`, `--bascule`) | `progressionSim.test.ts` |
| I30 | Menu progressif : il **masque** sans bloquer (aucune route ni action ne lit l'ouverture du menu) ; une page s'ouvre au premier de ses déclencheurs (signal d'usage, étape de la Prise en main ou du Carnet atteinte, rang plafond) et au plus tard à son rang plafond ; une page ouverte ne se referme jamais (marque `nav:<page>` à la première visite ou à l'ouverture par un danger passager, astuce `tip:<page>` vue, page annoncée `stats.navAnnounced`) ; un danger (flotte hostile, rapport reçu, combat subi, ultimatum, raid scripté) ouvre Galaxie, Combats et Menaces, un contact de seigneur ouvre Seigneurs ; l'étape en cours de la Prise en main et du Carnet ne vise jamais une page fermée ; un compte créé avant `newAccountsFrom` et au moins à `veteranRank`, un admin, l'option « Tout afficher » ou `enabled` à faux rendent le menu complet, sans rien écrire sur la fiche ; chaque entrée du menu a une règle `navUnlock.pages` ou figure dans `NAV_ALWAYS_VISIBLE` | `navUnlock.ts` (`navOpenPages`, `navSignals`), `NavBar.tsx` (`useNavUnlock`, `useHiddenRoutes`) | `navUnlock.test.ts` |
| I31 | Objectifs du jour du menu progressif : un objectif d'un **nouveau** jour (et une relance) n'est tiré que parmi les types dont la page est ouverte pour le joueur (`CONTRACT_PAGES` : attaque, sondes → Galaxie ; défense → Combats ; missions → Missions ; marché, dons → Commerce ; les autres sur une page toujours visible) ; le tirage du jour en cours n'est jamais refait ; `navUnlock.filterContracts` à faux, « Tout afficher », un ancien compte ou `enabled` à faux tirent parmi tous les types. 6.14.109 : parmi ces types, le tirage suit `dailyContracts.weights` (poids 0 : jamais tiré ; tous égaux : tirage uniforme d'avant). Le serveur annonce les pages ouvertes par une notification « Nouveau : … » (une par ouverture, dans la transaction de l'action, I24), jamais pour un ancien compte ni un admin. 6.14.121 : un type du registre des actions suivies (« porte de saut », « convoi de colonie ») n'est tiré que pour un joueur qui peut faire l'action (`actionAvailable` : porte ouverte, route de colonie) et dont la page est ouverte, jamais quand `trackedActions.enabled` est faux ; un compte sans lune ni route tire comme avant | `contracts.ts` (`openContractTypes`, `ensureContracts`, `rerollContract`), `navUnlock.ts` (`navOpeningNotice`), `cosmic.pb.js` (route des actions), `trackedActions.ts` (`actionAvailable`) | `contracts.test.ts`, `navUnlock.test.ts`, `actionsSuivies.test.ts`, intégration « 6.14.79 (DP-L4) » |
| I32 | Projets de prestige : un projet coûte exactement `prestige.hoursPerProject` × `prestige.growth`^(projets achevés) heures de la production commune du moment (extracteurs × technos, `getProductionRatesPerSecond`, ressource par ressource, arrondi à l'unité inférieure), payé à l'action dans la transaction du serveur (I24) ; un seul tourne à la fois ; il ne s'ouvre que si les 4 extracteurs atteignent `prestige.unlockExtractorLevel` ; il ne donne **aucun** bonus de combat ni de production (rien n'entre dans la couche empire : I14 intact) ; compteur et points ne baissent jamais (l'Ascension les garde, un projet en cours se termine même si `enabled` passe à faux) | `prestige.ts` (`prestigeCost`, `prestigeStartCost`, `advancePrestige`), `actions.ts` (`prestigeStart`), `flush.ts` | `prestige.test.ts`, intégration « 6.14.85 (RL-2) » |
| I33 | Plafonds d'équilibre arbitrés par le serveur (6.14.106) : un échange communes → rares au comptoir est refusé, sans rien retirer, si ses rares reçues (après taxe) dépassent ce qui reste de `exchange.weeklyRareCap` pour la semaine (lundi 00 h UTC, compteur `exchangeWeek` du profil ; 0 = sans plafond) ; un joueur qui compte `pvp.maxDefeatsPer24h` défaites en défense ou plus sur 24 h glissantes (rapports « attacker_win », toutes planètes) ne peut être visé ni par un décollage ni à l'arrivée d'une flotte (retour sans combat), joueur ou seigneur, jusqu'à ce que la plus ancienne des dernières `max` ait 24 h (0 = sans limite) ; le coffre du 7e jour donne par ressource commune entre `streak.chest.commonHours` heures de production (extracteurs et technos), dans la place libre de l'entrepôt, au moins `streak.chest.common[0]` ([0, 0] : bornes fixes `common`) | `resources.ts` (`exchangeRareLeft`), `actions.ts` (`trade`), `pvp.ts` (`defeatLimitUntil`, `checkAttackAllowed`), `attack.ts`, `fleets.ts`, `warlords.ts`, `streak.ts` (`rollStreakChest`), `cosmic_db.js` (`recentDefeatsMs`) | `plafondsEquilibre.test.ts`, intégration « 6.14.106 (AE-L3) » |
| I34 | Un seul chemin de dépense (6.14.110) : toute dépense de ressources de la planète mère passe par `spendResources` (vérifie, refuse un montant négatif ou non numérique, débite, compte la statistique `spent` et l'objectif du jour « Dépenser », sauf cadeau) et toute dépense d'Ambre par `spendAmber` (compte `amberSpent`) ; une soustraction ailleurs est un transfert listé avec sa raison (marché, contrats de commerce, cargaison, dépôt d'alliance, mise d'enchère, comptoir, butin, tribut, stock de colonie, coffre de guerre, pot commun). Chaque réclamation par l'action (`performPlayerAction`) laisse une ligne lue au Journal avec le gain mesuré, « Tout réclamer » une seule ; un rappel de flotte laisse une ligne lue au joueur et prévient l'hôte d'une garnison ; les succès sont vérifiés aussi après l'action (sauf `sync`) | `spending.ts`, `actions.ts` (`pay`, `performPlayerAction`), `flush.ts` (`grantNewAchievements`), `fleets.ts` (`recallNotices`), `cosmic.pb.js` (`fleet/recall`) | `spending.test.ts` (garde de balayage), `chaineActions.test.ts`, intégration « 6.14.110 (AC-D) » |
| I35 | Tâches planifiées (6.14.111) : une cadence de `CADENCES` ne tourne pas deux fois en même temps (verrou dans `$app.store()`, mort au-delà de `serverTasks.lockFactor` intervalles ; passage sauté compté, colonne « Sautés » de la page Santé) ; une campagne d'e-mails entre en file (`mail_queue`, `server_metrics`) et part par lots (`serverTasks.mailBatchSize`) dans la dernière étape de la cadence minute, au plus une fois par destinataire, adresse et désinscription relues à l'envoi, sans jamais réécrire une fiche (I24) ; une tâche qui touche tous les joueurs écrit par paquets (`playersPerTransaction`), fiche relue dans chaque transaction ; pendant une maintenance, guerres, Léviathan, boss d'alliance et de saison et guerre de territoire attendent, et leurs échéances encore ouvertes au début de la coupure sont décalées de sa durée à la fin (Q77) ; les flottes continuent | `serverTasks.ts`, `serverMetrics.ts`, `cosmic_db.js` (`cadenceTick`, `queueCampaign`, `mailQueueTick`, `deadlinesOnHold`, `shiftDeadlinesAfterMaintenance`, `catchupTick`, `shopRemindersTick`) | `serverTasks.test.ts`, `cadences.test.ts`, `ecrituresSures.test.ts`, intégration « 6.14.111 (AC-E) » |
| I36 | Vacances (6.14.112, Q79) : une seule garde (`vacationBlock`, liste blanche `vacation.allowed`, réglable) pour l'action et les routes ; toute route qui rapporte ou dépense l'interroge avec sa clé (`route:geste`) ; aucune route ne teste `onVacation` seule ; un seul message (« Tu es en vacances : reviens d'abord (Paramètres) pour … ») ; la lecture reste permise | `vacation.ts`, `actions.ts`, `cosmic_db.js` (`vacationGuard`) | `chaineActions.test.ts`, `gardeVacances.test.ts`, intégration « 6.14.112 (AC-F) » |
| I37 | « Tout réclamer » (6.14.113) prend tout ce que `pendingClaims` liste avec le contexte du serveur (Codex : seigneurs et boss ; casino : réglages ; défi : état) ; chaque sous-action est isolée (refus d'une règle : fiche, files et défi rendus ; autre erreur : l'action entière échoue, rien n'est versé à moitié) ; la pastille et l'en-tête ne comptent que ce que le client vérifie sans faux positif (titre du Codex, Seigneurs et Boss : jamais) ; une réclamation a un seul chemin, l'action, que les routes historiques (`codex/claim`, `challenge/claim`, jeton du casino) empruntent | `claimAll.ts` (`pendingClaims`, `ClaimContext`), `actions.ts` (`claimAll`, `casinoDaily`, `challengeClaim`, `codexTitle`), `codex.ts`, `dailyOrders.ts`, `cosmic_db.js` (`claimByAction`), `cosmic.pb.js` | `chaineActions.test.ts`, `dailyOrders.test.ts`, `gardeVacances.test.ts`, intégration « 6.14.113 (AC-G) » |
| I38 | Registre des actions suivies (6.14.121) : toute action qu'un générateur d'objectifs tire (épisodes des Chroniques, défis du passe, saga d'alliance, objectifs du jour) vient de `trackedActions.ts` (libellé, verbe, deux ordres, base, page, système) ; les 9 actions d'avant gardent leur ordre et leur poids, les nouvelles s'ajoutent en fin de liste : à activité égale (nouvelles actions non mesurées), mêmes tirages, même graine ; une action « mesurée » (lune, phalange, porte de saut, colonies, contenus) n'entre dans un tirage commun que si la médiane hebdomadaire du serveur atteint `trackedActions.measuredMinWeekly` (le joueur médian la pratique : sa page lui est ouverte) ; poids réglable (`trackedActions.weights`, × poids du générateur ; 0 = jamais) ; un mois déjà écrit n'est jamais retiré ni régénéré pour ces règles (`GENERATOR_VERSION` inchangée) | `trackedActions.ts` (`extraObjectives`, `measuredPlayable`, `trackAction`), `procedural.ts` (`chooseObjectives`, `worldDigest`), `passGen.ts` (`challengePool`, `actionPlayable`), `allianceSaga.ts`, `contracts.ts` | `actionsSuivies.test.ts` |
| I39 | Rôles d'unités (6.14.123) : une règle de jeu qui vise une sorte d'unité lit son rôle (`UnitDef.roles` : sonde, recycleur, transport, soutien, faiblesse de boss, contre-espionnage), jamais un identifiant ; sans unité au rôle, l'identifiant des règles sert de repli (`spy.probeUnitId`, `spy.sentinelUnitId`, `debris.recyclerUnitId`) ; une fiche sans `roles` prend ceux de l'unité livrée du même identifiant, une liste écrite (même vide) est gardée ; la faiblesse de boss par défaut se tire parmi les vaisseaux au rôle, du moins cher au plus cher ; à contenu par défaut, sondes, recyclage, faiblesses, flottes des seigneurs et comparaisons d'équilibrage sont ceux d'avant ; une unité qui coûte une autre ressource que la ferraille et l'énergie la paie à la construction et la retrouve (moitié, part de la Cale) à la revente et au démantèlement, le temps de construction par défaut et les débris ne comptant que ferraille et énergie | `units.ts` (`hasUnitRole`, `unitsWithRole`, `resolveUnitRoles`, `scaleUnitCost`), `espionage.ts` (`probeUnitIds`, `isProbeUnit`, `counterSpyUnitIds`), `debris.ts` (`recyclerUnitIds`), `leviathan.ts` (`bossWeaknessPool`), `warlords.ts`, `balance/analysis.ts`, `effectTargets.ts` (`unitCostFor`) | `unitRoles.test.ts` (garde des identifiants en dur), `contentMigrations.test.ts`, intégration « 6.14.123 (AA5) » |
| I40 | Recherches et projets d'alliance (6.14.124) : l'effet vient de leurs effets composés (`effects`, grandeur × cible × portée), jamais de leur identifiant ; valeur = `perLevel` × niveau (niveau borné à `maxLevel`), « places de membres » = `membersPerQuarter` × niveau ; les grandeurs lues par un calcul d'alliance (temps de vol, production de toutes les ressources, contre-espionnage, bouclier, durées, abri du pillage, attaque de toutes les unités contre les PNJ) restent dans la couche « alliance », multipliées à part et plafonnées (`effectCaps`, couche alliance) ; toute autre grandeur passe par `empireEffects` (couche empire, I9 et I14) ; une entrée sans `effects` prend ceux de l'entrée livrée du même identifiant ; à recherches par défaut, valeurs identiques à celles d'avant pour chaque niveau | `alliances.ts` (`allianceEffectGrants`, `allianceEffectLayer`, `ALLIANCE_LAYER_READERS`), `modifiers.ts` (`empireEffects`), `effects.ts` (couche « alliance »), `impact.ts` | `allianceEffects.test.ts`, `contentMigrations.test.ts`, intégration « 6.14.124 (AA6) » |

## 5. Règles de conception

1. **Un plafond a toujours une sortie visible.** Hangar plein : améliorer, recycler, envoyer en mission. Entrepôt plein : dépenser, échanger.
   Le plafond s'affiche avec la sortie (`HudCallout` ember + boutons), jamais seul.
2. **Un état bloquant porte un compte à rebours ou une action.** « Atelier : 3 h 12 » ou « Réparer maintenant (40 Ambre) ».
3. **Le joueur choisit ce qu'il perd.** Quand le moteur doit trancher (place manquante, ressource insuffisante), il propose un choix par défaut
   réglable plutôt que de détruire en silence.
4. **Paliers lisibles.** Un bâtiment gagne un effet nouveau aux niveaux 5, 10, 15, 20 (voir `WORKFLOW.md` §4), pas seulement +x %.
5. **Pas de double peine.** Une défaite coûte une fois : pertes OU immobilisation longue, pas les deux à pleine force.
6. **Les migrations sont du game design.** Rendre 10 000 vaisseaux d'un coup change l'équilibre autant qu'un patch. Elles respectent les plafonds.

## 6. Grille d'audit d'un système

À dérouler pour chaque système touché (et en entier une fois par version mineure) :

- [ ] Chaque stat d'effet déclarée est-elle lue ? (`grep` de la stat hors `effects.ts`)
- [ ] Chaque plafond est-il vérifié **partout** où la grandeur augmente (construction, retour, réparation, récompense, migration, admin) ?
- [ ] Client, serveur et page Statistiques affichent-ils le même nombre ?
- [ ] Le rapport ou la notification dit-il au joueur ce qui s'est passé et quoi faire ?
- [ ] Un PNJ (seigneur, pirate) suit-il les mêmes règles, ou l'écart est-il documenté ?
- [ ] Les colonies suivent-elles la règle de la planète mère, ou l'écart est-il documenté ?
- [ ] Un test couvre-t-il l'invariant ?

## 7. Fiches systèmes

Le détail de chaque domaine (14 fiches) est dans `docs/systems/` (index : `docs/systems/README.md`). Les fiches ci-dessous gardent les
systèmes refondus récemment. Une fiche par système : rôle, règles, chiffres, paliers, sorties de plafond. Les chiffres réglables sont dans l'admin (Règles, Contenu).

### 7.1 Hangars (`hangar.ts`)

- Capacité = Σ (niveau × places par niveau) des bâtiments « hangar » × (1 + technologies, dont Extension des hangars) × (1 + effets d'empire `hangarCapacity`).
- Places occupées = à quai + en vol + à l'Atelier hors Cale sèche + file du chantier (`hangarLoad`).
- Surcharge (occupé > capacité) : rien n'est détruit ; la construction de la catégorie est refusée et la page Unités propose trois sorties (améliorer, envoyer une flotte, vendre / démanteler).
- Conservés à l'Ascension (avec la Cale sèche et les bâtiments légendaires). Colonies : hangar de défense propre, mêmes technologies, effets de portée « colonies ».

### 7.2 Atelier de réparation (`workshop.ts`)

- Sauve une part des unités détruites (5 %/niv. jusqu'au 10, puis 2 %/niv. ; 70 % au niv. 20 ; plafond global 85 % avec les bonus, réglable : `combat.repairCap`).
- Répare en PV/s : 30 au niv. 1, +25 %/niv. ; d'abord la file (lots), puis les coques. Accélérations : Nanoréparation, Mécanicien, Clé de soudure, Vaisseaux-ateliers, Ambre, Analgésique.
- Un lot gardé au hangar rentre dès qu'il est réparé (il avait sa place). Un lot en Cale sèche devient « prêt ».

### 7.3 Cale sèche (5.28, `cale_seche`)

| Élément | Valeur |
|:--|:--|
| Déblocage | Atelier niv. 5, puis 20 de chaque ressource rare |
| Postes | 1 000 × niveau (places de hangar), + effet `dockCapacity` |
| Coût / temps | courbe de l'Atelier (nano + données), 1 200 s par niveau, palier 2 au niv. 11 |
| Remplissage | les prêts d'abord, puis les lots par ordre d'arrivée ; le surplus garde sa place au hangar |
| Prêts | rentrent au hangar s'il y a de la place : bouton « Remettre en service », automatique au palier 10. Existent aussi sans Cale sèche (épave d'expédition) |

| Palier | Effet |
|:--|:--|
| 1 | les sauvés occupent des postes, pas le hangar |
| 5 · Triage | démanteler (60 % du prix, réglable) ; réglage après combat : tout réparer, démanteler ce qui ne tient pas, tout démanteler |
| 10 · Remise automatique | prêts rentrés dès qu'une place se libère (à la prochaine action du joueur et au retour de chaque flotte) ; Atelier +10 % |
| 15 · Priorités | ordre de réparation : arrivée, ou une classe d'abord |
| 20 · Cale orbitale | +5 points de vaisseaux sauvés |

Succès : Cale pleine, Ferrailleur (100), Démolisseur (1 000). Sans Cale sèche (niv. 0), l'Atelier se comporte comme en 5.20.

### 7.4 Lunes : phalange, porte de saut, pitié (6.14.44, `moon.ts`, `phalanx.ts`, `jumpGate.ts`)

Moteur livré en 6.14.44 (lot É30-1a), serveur en 6.14.48 (É30-1b : routes `moon/phalanx`, `moon/scan`, `fleet/jump`, radar au lancement, `profiles.moonLevel`), interface en 6.14.49 (É30-1c), admin et chaîne de contenu en 6.14.69 (É30-1d), essai réel sur la pré-prod en 6.14.70 (É30-1e : radar, perce-brouillard, balayage, saut et refus vérifiés par l'API joueur, `scripts/preprod-essai-lune.mjs`), suite en 6.14.77 (É30-1f : une seule notification par saut, niveau de lune du défenseur dans le rapport de combat, victoires de l'attaquant avec ou sans lune dans la santé de l'équilibre) (`proposals/phalange-porte-de-saut.md`).

| Niveau de lune | Phalange (`PHALANX_RULES`) | Porte de saut (`JUMP_GATE_RULES`) |
|:--|:--|:--|
| 1 | radar d'alliance, portée 15 ; balayage de l'agresseur, recharge 30 min | — |
| 2 | portée 30 ; perce-brouillard (vraie composition) ; recharge 25 min | — |
| 3 | portée 45 ; recharge 20 min | rapatriement instantané, recharge 24 h |
| 4 | portée 60 ; capsules révélées (stimulant) ; recharge 15 min | recharge 22 h |
| 5 | portée 75 ; recharge 10 min | recharge 20 h ; saut d'allié (J3) désactivé |

- Portée = 15 × niveau × (1 + `phalanxRange`, plafond empire 50 %), en unités de carte, de la planète mère à la planète visée.
- Balayage : agresseur seulement (I22) ; coût 30 min de production d'énergie, 1 000 au moins ; recharge 30 − 5 × (niveau − 1) min, 5 au moins.
- Porte : patrouille, garnison, base avancée ; recharge 24 − 2 × (niveau − 3) h × (1 − `jumpGateCooldown`, plafond empire 30 %), 6 h au moins ; gratuite.
- Pitié : +5 % par combat subi sur la planète mère sans lune (attaquant joueur), lune garantie au 20e ; champ `players.moonPity`.
- Serveur (6.14.48) : le radar part au lancement d'une attaque de joueur (`launchFleetRequest`), notification « Phalange : allié menacé » ;
  le saut rapatrie par `resolveFleetReturn` (I8) et prévient l'hôte d'une garnison (Q39) ; « sauvetage » (`gateSaves`) : attaque de joueur
  repoussée sur la planète mère moins de `jumpGate.saveWindowMinutes` (10) après un saut, compté une fois par saut (`moon.lastJumpAtMs`).
- Niveau de lune public : `profiles.moonLevel` (0 sans lune, Q41).
- Désactiver : `phalanx.enabled`, `jumpGate.enabled` à faux, `moon.pityPerDefense` à 0 (Admin → Règles → Lunes : trois sections dédiées, 6.14.69).
- Chaîne de contenu (6.14.69) : reliques **Lentille de Séléné** (`phalanxRange`, bonus de rareté × 2 : +6 / +12 / +20 / +30 %) et **Clé du
  seuil** (`jumpGateCooldown`, × 1,5 : −4,5 / −9 / −15 / −22,5 %), une seule de chaque équipée, sous les plafonds (50 %, 30 %) ; préréglages
  `phalange_portee`, `porte_recharge` ; succès `phalange_1` (1 balayage), `phalange_50`, `porte_1` (1 saut), `porte_25` (titre « Gardien du
  seuil »), secret `porte_sauvetage` (`gateSaves` ≥ 1) ; Codex `legend:phalange` et `legend:porte_saut` (premier balayage, premier saut) ;
  défi d'alliance « Les vigies » (mesure `vigil` = garnisons + balayages, jouable sans lune ; aucun objectif lunaire dans le passe ni les
  Chroniques, Q40) ; étape « Ta lune veille » du Carnet (lune, réserve de pitié ou une garnison) ; recharges dans « Prochaines fins ».
- Santé de l'équilibre (`moonHealth`) : part des actifs avec lune (mesure du risque R1 à J+30), niveau médian, lunes nées par pitié
  (`moon.byPity`), réserves en cours, cumuls de balayages, sauts et sauvetages.

### 7.5 Passe et Chroniques générés : faisabilité, versions, succès (6.14.56 à 6.14.58, `passGen.ts`, `passSeasons.ts`, `procedural.ts`)

Lots AP-L1 à AP-L3 de la revue AU27 (`docs/audit/2026-10-07-au27-procedural.md`, AP-1 à AP-4).

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Rythme d'une action dans les défis | médiane du serveur par semaine, entre 0,5 et 3 × sa base, **jamais au-dessus de la médiane** | `passGen.challengeMinFactor`, `challengeMaxFactor` |
| Action hors des défis (serveur mesuré) | médiane nulle ou < 0,25 par semaine ; passive (seigneurs, assauts de boss, raids) < 0,5 | `passGen.challengeMinWeekly`, `passiveMinWeekly` |
| Points par palier | arrondi à 5 sans dépasser le jour limite du médian (63 points par jour : 55, pas 60) | `passGen.pointsMin`, `pointsMax`, `latestMedianDay` |
| Garde de faisabilité (génération et publication d'office) | médian simulé après le jour 28 : points par palier baissés (jamais sous le minimum), 5 nouveaux tirages des défis, puis seuils réduits par pas de 10 % jusqu'à 40 % ; toujours infaisable à la publication d'office et jamais retouché : brouillon régénéré | `passGen.challengeRedraws`, `challengeReduceStep`, `challengeReduceMin` |
| Épisode 3 des Chroniques (« rebondissement ») | action peu pratiquée dont la médiane atteint 0,5 par semaine | `chronicleGen.stretchMinWeekly` |
| Version du générateur | chapitre 3, passe 3 (`GENERATOR_VERSION`) ; plus ancienne : brouillon ou chapitre non commencé régénéré (I17) | `procedural.regenerateOutdated` (Admin → Générateur) |
| Succès par défaut | complétés dans la liste enregistrée, sauf retirés exprès (I25) | `achievementList.removedDefaults` |

Effet mesuré (simulation, méthode AU27) : passe de novembre sur l'activité de la pré-prod, joueur médian au dernier palier **jour 35 → 27** ;
200 serveurs bruités, médian après le jour 31 : **77 → 12** (tous limités par le minimum de 25 points par palier, joueur médian sous
27 points par jour). Revers : le plus actif finit plus tôt (avant le jour 15 sur 181 serveurs sur 200 au lieu de 162) ; les paliers de
prestige restent l'outil prévu (AP-11).

### 7.6 Équilibrage : simulateur de progression et défense à domicile (6.14.71 et 6.14.72, `balance/progressionSim.ts`, `combat.ts`, `pvp.ts`, `streak.ts`)

Lots AE-L0 et AE-L1 de la revue AU27 (`docs/audit/2026-10-07-au27-equilibrage.md`, proposition `docs/proposals/equilibrage-au27.md`).

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Vaisseaux à quai engagés en défense (posture standard) | **75 %** (50 % avant 6.14.72) ; Riposte 100 %, Bunker 0 % | `combat.homeFleetDefenseFactor` (Règles → Combat) |
| Bonus de puissance du défenseur chez lui | **+25 %** (+15 % avant) | `combat.homeDefenseBonus` |
| Bouclier après une défaite en défense | **3 h** (1 h avant), plus long que le délai de 2 h entre deux attaques d'un même joueur | `pvp.shieldAfterDefeatMs` (Règles → Protections) |
| Attaque refusée contre un joueur moins expérimenté | au-delà de **×10** d'écart d'XP (×12 avant), dès 500 XP | `pvp.hardXpRatio` |
| Coffre du 7e jour, chaque ressource commune | **2 M à 12 M** (45 M à 280 M avant) ; Ambre et jetons inchangés | `streak.chest.common` (Règles → Série de connexion, et Récompenses) |
| Règles enregistrées avant 6.14.72 | migration `rules-6.14.72` : seul un champ qui vaut encore l'ancien défaut prend le nouveau | `CONTENT_MIGRATIONS` (`cosmic_db.js`) |

Effet mesuré (`node scripts/progression-sim.mjs --base avant-ae-l1`) : seuil de victoire contre un défenseur mixte ×0,75 → **×0,90**,
pertes à dépense égale 23 % / 93 % → **34 % / 85 %** (attaquant / défenseur) ; coffre du joueur quotidien 465 h → **20 h** de production,
production perdue à J14 96 % → 67 % ; 1re Ascension presque inchangée (actif J10,3, moyen J18 → J18,8). La fin de partie trop rapide
(AE-1) est traitée par la bascule du rythme (AE-L2 compris, §7.9).

Lot AE-L3 (6.14.106, `docs/changes/6.14.106-plafonds-equilibre.md`) : plafonds dans le moteur, chacun avec son éditeur et son texte
joueur lu dans la règle (invariant I33).

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Coffre du 7e jour, chaque ressource commune | **6 à 18 h de production** du joueur (extracteurs et technos, tirées à part), dans la place libre de l'entrepôt, au moins **2 M** ; [0, 0] : bornes fixes 2 M à 12 M | `streak.chest.commonHours`, `streak.chest.common` (Règles → Série de connexion) |
| Comptoir : rares reçues contre des communes | **30 M par semaine** au plus, toutes rares réunies, après taxe (lundi 00 h UTC) ; 0 = sans plafond | `exchange.weeklyRareCap` (Règles → Comptoir d'échange) |
| Défaites en défense sur 24 h glissantes | **4** : ensuite plus aucune attaque (joueur ou seigneur), décollage refusé et flotte en vol renvoyée, jusqu'à ce que la plus ancienne ait 24 h | `pvp.maxDefeatsPer24h` (Règles → Protections) |
| Rattrapage des petits empires | **+50 %** sous **20 %** de la médiane (+25 % sous 10 % avant), dégressif jusqu'à 50 % ; hors couche empire (I14 intact), borné à +100 % | `catchup.maxBonus`, `catchup.fullBelow` (Règles → Rattrapage) ; migration `rules-6.14.106` |

Effet mesuré (`node scripts/progression-sim.mjs --base avant-ae-l3 --catchup [--apres-bascule --prestige --ascend --days 365]`) :
coffre de l'actif à J7 28 M (0,5 h) → 709 M (12 h), du moyen 28 M → 270 M (12 h), du quotidien 28 M (20 h) → 8 M (5,7 h, entrepôt
presque plein) ; semaine la plus forte au comptoir de l'actif 58 M → 30 M (avant la bascule) ; 1re Ascension inchangée à ± 1 jour ;
rattrapage moyen de l'occasionnel J1–30 +1,5 % → +4,6 %. Un plafond sous 25 M bloque plus de 15 % des sessions du moyen après la
bascule (le comptoir y reste la source de rares principale) : 30 M, à resserrer après les mesures d'AE-L4.

Simulateur (`progressionSim.ts`) : joueur glouton par profil (actif 8 sessions par jour, moyen 3, occasionnel 1 un jour sur 3 manqué,
quotidien 1 sans manquer), règles en vigueur lues dans le moteur ; hors modèle : unités, combats, événements, reliques, alliance.
Il donne des ordres de grandeur. Garde : I29.

### 7.7 Ouverture progressive du menu (6.14.74 à 6.14.81, `navUnlock.ts`, `NavBar.tsx`, `contracts.ts`)

Lots DP-L1 à DP-L6 de `docs/proposals/deblocage-progressif.md` (option C+D, Q152 à Q158). Fiche du domaine : `docs/systems/qol-outils.md`.

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Ouverture progressive | active | `navUnlock.enabled` (Admin → Règles → **Ouverture du menu**, section dédiée avec aperçu par rang, 6.14.80 ; aussi dans Tous les réglages) |
| Comptes « existants » (menu complet) | créés avant le **2026-10-08, 0 h** (Paris) **et** au moins **Fer II** | `navUnlock.newAccountsFrom` (ms), `navUnlock.veteranRank` |
| Page fermée | **cachée** (une ligne « Prochaine ouverture », grisée dans Ctrl+K) | `navUnlock.style` (`hidden` / `locked`) |
| Colonies | ouvertes **20** niveaux cumulés avant le seuil de la 1re colonie | `navUnlock.colonyLead` |
| Objectifs du jour tirés parmi les systèmes ouverts | oui, pour un nouveau jour et une relance (I31, 6.14.79) | `navUnlock.filterContracts` |
| Par page : rang plafond, signaux, étape, conditions | tableau ci-dessous | `navUnlock.pages` (fusion page par page) |

Toujours visibles (palier 0) : Accueil, Ordres du jour, Ressources, Bâtiments, Unités, Labo, Communications et le pied de barre (Profil,
Nouveautés, Annonces, Signalements, Bible, Devblog) : **13 entrées** à J0 (40 avant). L'Ascension garde sa règle (au menu après la 1re).

| Palier (rang plafond) | Pages | Signaux et étapes qui ouvrent plus tôt |
|:--|:--|:--|
| Fer III | Galaxie, Alliance | danger, étape « spy » ; alliance, étape « alliance » |
| Fer II | Missions, Combats, Menaces, Classement, Succès, Passe, Primes, Classe d'empire, Journal | 1re unité, étape « mission » ; danger, fin des 72 h, rapport ; danger (Primes) ; étape « empireClass » du Carnet |
| Bronze III | Commerce, Codex, Chroniques, Gazette, Statistiques, Portefeuille, Simulateur, Planificateur | 1er échange, fiche du Codex, lune ou pitié (étape « moonWatch »), 1re Ambre, rapport, Planificateur à portée |
| Argent III | État-major, Seigneurs, Boss mondial, Boss de saison, Hall of fame, Casino | relique ou officier (étape « relicEquip »), contact de seigneur, 1re participation à un boss |
| Or III | Colonies, Guerre de territoire | colonie proche ou fondée (étape « colonyFound ») ; alliance obligatoire, alliance engagée |
| sans rang plafond (6.14.85) | Prestige | seulement `prestigeReady` : 4 extracteurs au niveau `prestige.unlockExtractorLevel` (10) |

Signaux (`NAV_SIGNALS`, liste fermée lue par `navSignals`) : `danger`, `protectionOver`, `report`, `firstUnit`, `colonyNear`, `hasColony`,
`inAlliance`, `allianceAtWar`, `hasRelicOrOfficer`, `warlordContact`, `bossJoined`, `rareCurrency`, `marketOffer`, `codexReady`,
`plannerAmber`, `hasMoon`, `ascended`, `prestigeReady` (6.14.85 : 4 extracteurs au niveau des projets de prestige). Visiter une page fermée (lien, Ctrl+K, défi du passe ou des Chroniques) l'ouvre (intention).
Option « Tout afficher » (Réglages → Jeu et aide, Q156) : marques `nav:all` / `nav:progressif`, la dernière posée l'emporte.
Panneau Lune de Statistiques : seulement avec une lune, une réserve de pitié ou l'étape « Ta lune » du Carnet atteinte (`moonPanelVisible`).

Serveur (6.14.79, DP-L4) : après chaque action du joueur (`/api/cosmic/action`, dans la transaction), `navOpeningNotice` compare les
pages ouvertes à `stats.navAnnounced` et envoie **une** notification « Nouveau : Galaxie, Alliance et … » (genre `system`, lien vers la
première page) par ouverture : texte du danger, de la fin de protection, du rang atteint, de l'étape ou du signal. Une page visitée (marque
`nav:`) ou déjà ouverte à la première lecture (compte d'avant le lot) est notée sans message ; « Tout afficher » tient la mémoire en
silence ; un ancien compte, un admin ou le menu désactivé ne reçoivent rien et rien n'est écrit. Une page annoncée reste ouverte (I30).
Le danger lu par le serveur vient de la fiche (combat subi, raid scripté, ultimatum) : une flotte hostile en vol ouvre les pages côté
client (marque `nav:`) avant l'impact.

Objectifs du jour (I31) : à J0, seuls « Lancer une amélioration », « Lancer une recherche », « Construire des unités » et « Dépenser » sont
tirés (4 types toujours ouverts = 4 objectifs par jour) ; les autres arrivent avec leur page. Une relance sans autre type ouvert est
refusée et reste disponible.

Chaîne (6.14.81, DP-L6) : une astuce de page (`PAGE_TIPS`) pour chaque page réglée, montrée à l'arrivée même après la Prise en main ;
l'Ambre de la barre des ressources n'apparaît qu'avec Primes ouvert ou un solde ; un succès dont la page est fermée (`ACHIEVEMENT_PAGES`)
s'affiche « À découvrir » avec la condition, sans progression ; « Que faire maintenant ? » (`nextActions`), le rappel de la classe
d'empire, la vue cockpit (actions rapides, agenda) ne proposent que des pages ouvertes.
Garde : I30, I31.

### 7.8 Rythme long terme : recherche réglable et projets de prestige (6.14.84 et 6.14.85, `technologies.ts`, `prestige.ts`)

Lots RL-1 et RL-2 de `docs/proposals/rythme-long-terme.md` (Q164 à Q171 validées). Fiches du domaine : `docs/systems/recherche.md`,
`docs/systems/progression.md`.

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Croissance du coût d'un niveau de recherche | ×**2,7** par niveau (sauf croissance propre à la techno) | `research.costGrowth` (Règles → Labo : coûts et durées des recherches) |
| Croissance de la durée | ×**1,67** par niveau | `research.timeGrowth` |
| Recherche tardive | **aucune** (dès le niveau 0 = jamais, ×1) ; à la bascule du rythme (§7.9) : dès le niveau 7, ×25 (6.14.89) | `research.lateFromLevel`, `research.lateTimeFactor` |
| Durée maximale d'un niveau (avant réductions) | **sans plafond** (0) ; à la bascule du rythme : 7 jours | `research.maxLevelSeconds` |
| Projets de prestige | ouverts | `prestige.enabled` (Règles → Projets de prestige) |
| Coût d'un projet | **8 h** de production commune du moment, ×**1** par projet achevé | `prestige.hoursPerProject`, `prestige.growth` |
| Durée d'un projet | **8 h**, un à la fois (I32) | `prestige.durationHours` |
| Ouverture | 4 extracteurs au niveau **10** (page Prestige au menu à ce moment) | `prestige.unlockExtractorLevel` |
| Récompense | **8 points** de prestige par projet ; monuments à 1, 10, 25, 50, 100, 250, 500 et 1 000 projets ; aucun bonus (Q168) | `prestige.pointsPerProject`, `prestige.monuments` |

Le prestige se voit : classement « Prestige » (page Prestige, `profiles.prestigePoints`), monument sur la fiche publique, 4 succès
(Première pierre, Obélisque, Grand œuvre avec le titre « Bâtisseur d'éternité », Merveille du secteur en secret), fiche « Les projets de
prestige » du Codex (Légendes). « Que faire maintenant ? » propose un projet quand l'entrepôt est plein. Garde : I32.

### 7.9 Bascule du rythme sur des mois (6.14.88, `rhythm.ts`, lot RL-3 avec AE-L2)

Lot RL-3 de `docs/proposals/rythme-long-terme.md` (Q164 à Q171, Q97, Q98 validées). Fiches du domaine : `docs/systems/progression.md`,
`docs/systems/recherche.md`, `docs/systems/economie.md`.

Mécanisme : fonction pure `applyRhythmSwitch` appliquée à la résolution du contenu (`resolveGameContent(overrides, nowMs)`). Le serveur
résout le contenu à chaque requête avec l'heure du moment (`applyContent`, `cosmic_db.js`), le client à son chargement puis à la date
(`contentService.ts`). Sans heure (tests, validation de l'admin), le contenu enregistré tel quel. À partir de `rhythm.switchAt`, chaque
réglage qui vaut encore son **ancienne valeur par défaut** (`RHYTHM_PREVIOUS`, bâtiments du code pour les coûts) prend la valeur du groupe
`rhythm` ; un réglage modifié par l'admin est gardé. Rien n'est écrit en base : décaler la date ou décocher `rhythm.enabled` rend les
anciennes valeurs aussitôt.

| Règle | Avant la date | À partir de la date | Réglage (admin) |
|:--|:--|:--|:--|
| Date de la bascule | — | **1er novembre 2026, 0 h** (heure de Paris) ; annonce en jeu **7 jours** avant | `rhythm.switchAt`, `rhythm.announceDays`, `rhythm.enabled` (Règles → Rythme sur des mois) |
| Coûts du second palier (niveaux 11 à 20) des 9 bâtiments qui en ont un | ×1 | **×4** (AE-L2, Q97), si les coûts valent encore ceux du code | `rhythm.tier2CostFactor` |
| Durée du second palier des 8 bâtiments exigés par l'Ascension | 3 h, +1 h par niveau (12 h au niveau 20) | **36 h, +27 h** par niveau (279 h, soit 11 j 15 h, au niveau 20 ; 6.14.89, 30 h + 24 h en 6.14.88) ; la Cale sèche garde 3 h + 1 h | `rhythm.tier2BaseSeconds`, `tier2SecondsPerLevel` |
| Recherche tardive | aucune | **dès le niveau 7, durée ×25, 7 jours au plus** par niveau avant réductions (6.14.89 ; dès le 6, ×30 en 6.14.88) | `rhythm.researchLateFromLevel`, `researchLateTimeFactor`, `researchMaxLevelSeconds` |
| Délai entre deux Ascensions | 7 jours | **30 jours** | `rhythm.ascensionCooldownDays` |
| Ascensions au plus | 5 | **10** (jamais moins de 5) | `rhythm.maxAscensions` |
| Comptoir, commune → rare | 0,01 (1 pour 100) | **0,004** (1 pour 250, Q98) | `rhythm.exchangeCommonToRare` |
| Missions, gains indexés | 1,5 × durée × production ; référence des rares 150 000 | **0,75** ; **400 000** | `rhythm.missionProductionMultiplier`, `missionRareProductionRef` |
| Lune (AE-9) | niveau 2 : 500 k + 250 k, ×2 ; 100 000 débris pour 1 % | **20 M + 10 M, ×3 ; 2 M** | `rhythm.moonUpgradeCost`, `moonCostGrowth`, `moonDebrisPerPercent` |

Comptes existants : rien n'est retiré (niveaux, technos, Ascensions faites et leurs bonus) ; un chantier ou une recherche lancé garde
sa fin (durée écrite au lancement) ; seuls les niveaux lancés après la date coûtent ou durent plus ; le délai de 30 jours se compte depuis
la dernière Ascension. Libellés jusqu'à l'Ascension X (`ASCENSION_ROMAN`, Gazette, carte d'empire, `AscensionStars`), succès Ascension II,
V et X, Formules « Ascension et rythme », annonce `v6.14-rythme` (datée, `liveFromMs`, image `annonce-rythme`), billet 54. Garde : I29
(365 jours après la bascule), `rythme.test.ts`, intégration « 6.14.88 (RL-3) ». Réglage fin avant la date (6.14.89, RL-5 avancé) : les
valeurs visées ont été choisies au simulateur pour que l'arbre de l'actif et du moyen se termine avant leur 1re Ascension (sinon
l'entrepôt remis au niveau 1 ne peut plus contenir le prix des derniers niveaux : labo bloqué jusqu'à sa reconstruction).

### 7.10 Objectifs générés : paliers de succès bridés, objectifs du jour pondérés (6.14.108 et 6.14.109, `procedural.ts`, `contracts.ts`)

Lots AP-L4 et AP-L5 de la revue AU27 (`docs/audit/2026-10-07-au27-procedural.md`, AP-5 et AP-9 ; Q82, Q87, Q89 validées). Fiche du
domaine : `docs/systems/progression.md`.

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Détenteurs du dernier palier avant un palier généré plus dur | **3 joueurs actifs et 10 % des actifs** (la plus exigeante) ; actif = vu depuis moins de 14 jours (avant : 1 joueur) | `achievementGen.minHolders`, `minHoldersShare`, `activeDays` (Règles → Succès générés) |
| Rythme | **1 palier par mesure tous les 30 jours** au plus (avant : 1 par jour) ; un palier généré sans date (écrit avant 6.14.108) compte comme créé au premier passage, où il est daté (`createdAtMs`) | `achievementGen.cooldownDays` (0 = sans délai) |
| Plafond par mesure | **3 paliers générés** (`<succès>_autoN`) ; une famille déjà au-delà garde tout et n'en reçoit plus | `achievementGen.maxAutoPerFamily` (0 = sans plafond) |
| Titre | au **dernier palier générable** seulement, s'il est légendaire (avant : chaque palier légendaire) | `achievementGen.titleOnLastOnly` |
| Seuil suivant | ×3 sous 5, ×2, ×1,5 à partir de 100 (inchangé) | `achievementGen.growthSmall`, `smallBelow`, `growth`, `growthLarge`, `largeFrom` |
| Tirage des objectifs du jour | pondéré par type : **« Repousser une attaque » 0,5**, les autres 1 ; poids tous égaux = tirage d'avant (même graine, même résultat) ; poids 0 = jamais tiré ; toujours parmi les pages ouvertes (I31) | `dailyContracts.weights` (Règles → Objectifs du jour) |
| « Repousser une attaque » | compte aussi un **raid de faction repoussé** (Q87) ; libellé « (joueur ou raid de faction) » lu dans la règle | `dailyContracts.defenseCountsFactionRaids` |
| Quantités | 20 unités, 2 missions, 2 sondes, 1 sinon ; « Dépenser » : 1 h de production commune, au moins 5 000 (inchangées, sorties du code) | `dailyContracts.targets`, `spendHours`, `spendMin` |

Effet attendu : sur la pré-prod (15 actifs), 47 paliers en 3 jours avant ; avec 3 détenteurs, 30 jours et 3 par mesure, au plus un
palier par mesure et par mois, 3 au total par famille. Objectifs du jour sur un compte où tout est ouvert : « Repousser » dans
≈ 23 % des journées au lieu de 40 % (poids 0,5 sur 9,5). Rien n'est retiré (Q82) : paliers, récompenses et titres déjà gagnés restent ;
le tirage du jour en cours n'est jamais refait (I31). Garde : `progression6108.test.ts`, `contracts.test.ts` (« 6.14.109 »),
`reglages671.test.ts`, intégration « 6.14.108 (AP-L4) ».

### 7.11 Chaîne de contenu : garde renforcée et colonies (6.14.114 et 6.14.115, `contentChain.ts`, `codex.ts`, `achievements.ts`)

Lots AJ27-4 et AJ27-5 de la revue AU27 (`docs/audit/2026-10-07-au27-jeu-chaine.md`, AJ-1, AJ-3, AJ-10). Fiches du domaine :
`docs/systems/progression.md`, `docs/systems/colonies.md` ; méthode : `docs/WORKFLOW.md` §7.

| Règle | Valeur | Où |
|:--|:--|:--|
| Maillons vérifiés | Codex, succès d'entrée, de maîtrise et **propre** (unités et bâtiments, QJ1), préréglage d'effet (unités), porteur d'effet et **porteur propre** (unités : cible `unit:<id>`), **recherche Ctrl+K** | `contentChainReport`, `contentChain.test.ts` |
| Types couverts | unités, bâtiments, technos, reliques, boss (mondiaux, d'alliance, de chronique), **colonies** (4 biomes, 4 spécialisations), **talents**, **modules**, **classes d'empire** | idem |
| Manques connus | chacun cite son lot (AJ27-6 succès dérivés, AJ27-8 Ctrl+K, AJ27-9 Codex Doctrines et Arsenal, AJ27-10 porteurs « signature ») ; un manque comblé sort de la liste | `KNOWN_GAPS` |
| Bilan dans l'admin | Admin → Équilibrage → « Chaîne de contenu » : par type, contenus incomplets, maillons présents (vert) et manquants (rouge), lien vers l'onglet où le régler ; contenu ajouté dans l'admin compris | `ContentChainSection.tsx` |
| Succès des colonies | « Terres neuves » (1re colonie, argent), « Empire des mondes » (toutes les colonies permises, or, nombre lu à l'usage), « Convoyeur » (100 convois arrivés, argent), « Avant-poste tenu » (base avancée restée jusqu'au bout, or) ; réglables dans Admin → Succès ; rien n'est retiré si la règle change | `derivedAchievements`, mesures `coloniesFounded`, `coloniesMaxed`, `colonyConvoys`, `colonyBaseTours` |
| Codex « Colonies » | 4 biomes, ouverts tous au relevé de la 1re colonie ; 4 spécialisations, ouvertes au 1er choix et gardées après un changement ; récompense de catégorie 5 jetons + 25 Ambre (Admin → Chroniques, comme Unités) | `codexEntries`, `DEFAULT_CODEX_REWARDS.colonies` |
| Formules | section « Colonies » : fondation, production +bonus, gisement, routes (frais, réserve, ravitaillement), base avancée, spécialisations et biomes, tous lus dans les règles | `FormulasGuide.tsx` |

### 7.12 Rythme des succès : seuils en jeu des succès de volume (6.14.117, `achievements.ts`)

Lot É30-6 (PRG-5, AE-12 ; suite d'AP-L4). Proposition : `docs/proposals/rythme-des-succes.md`. Fiche du domaine :
`docs/systems/progression.md`.

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Seuil en jeu | **seuil écrit × facteur de la mesure**, arrondi à 2 chiffres significatifs ; appliqué à la lecture (liste enregistrée et paliers générés inchangés) | `achievementPace.scales` (Règles → « Succès : rythme des succès de volume ») |
| Facteurs | unités possédées ×10, défenses ×10, unités construites ×3, unités réparées ×2, missions ×5, record de missions par jour ×20, pillage ×10, recyclage ×10, échanges au marché ×200, dons au trésor ×200, ultimatums ×2 ; autres mesures ×1 (niveaux, technos, rang, %, oui/non : bornées par le jeu, étirées par la bascule du rythme) | idem (1 à 1 000, mesure connue) |
| Palier bronze | au seuil écrit (prise en main immédiate) | `achievementPace.keepBronze` |
| Succès gagné | **jamais repris** : le facteur ne vise que les succès pas encore obtenus | — |
| Texte | le nombre écrit dans la description est remplacé par le seuil en jeu, dans la même forme (« 50 000 », « 10 millions », « 4 milliards ») | — |
| Générateur de paliers | détenteurs comptés au seuil en jeu ; palier suivant écrit sur le seuil écrit | — |
| Ancien comportement | `achievementPace.enabled` décoché (ou facteurs à 1) | `achievementPace.enabled` |

Effet simulé (`scripts/achievement-pace-sim.mjs`, 10 joueurs de la pré-prod à J7,6) : médiane 76 → 55 succès sur 198 (38 % → 28 %) ;
avec la bascule du rythme (1er novembre 2026), 24 à 26 % attendus (cible AE-12 : 15 à 25 %). Garde : `rythmeSucces6117.test.ts`.

### 7.13 Objectifs générés : registre des actions suivies et épisode « nouveauté » (6.14.121 et 6.14.122, `trackedActions.ts`, `novelty.ts`)

Lots AP-L7 et AP-L8 de la revue AU27 (`docs/audit/2026-10-07-au27-procedural.md`, AP-10). Fiche du domaine :
`docs/systems/progression.md` ; méthode : `docs/WORKFLOW.md` §7 (maillon n° 9).

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Registre | 9 actions d'avant + **lune** (améliorer sa lune, balayer à la phalange, sauter par la porte) et **colonies** (convoi arrivé, base avancée tenue, spécialisation) ; une action par contenu (`unit:<id>` lancée au chantier, `research:<id>` lancée au Labo, `building:<id>` lancée), comptée dès 6.14.121 | `trackedActions` (Règles → « Actions suivies ») |
| Entrée dans un tirage commun (Chroniques, défis du passe, saga) | action d'avant : comme avant ; action « mesurée » : médiane du serveur ≥ **0,5 par semaine** ; poids global 1 (spécialisation 0), familles par contenu 0 | `trackedActions.measuredMinWeekly`, `weights`, `familyWeights` |
| Quantités de base (une semaine) | lune 1, phalange 1, porte 2, convois 10, base 1, spécialisation 1 ; unités 10, recherche 1, amélioration 1 | `chapterBaseCounts`, `trackedActions.familyBase` |
| Objectifs du jour | « Ramener 1 flotte par la porte de saut » (poids 0,5, porte ouverte), « Faire arriver 2 convois de colonie » (poids 0,5, route posée) ; page ouverte (I31) | `dailyContracts.weights`, `targets` |
| Épisode « nouveauté » | contenu daté (`addedOn`, AAAA-MM-JJ, posé d'office à la création dans l'admin) depuis **45 jours** au plus au 1er du mois ; **épisode 2** ; 5 unités, 1 niveau de recherche, 1 amélioration ; **50 %** des joueurs actifs y ont accès ; un contenu une seule fois ; au plus un mois sur 1 | `novelty` (Règles → « Épisode nouveauté ») ; « Ajouté le » dans Unités, Technologies, Bâtiments |
| Textes de la nouveauté | 6 titres, 4 accroches, 2 ordres par famille (`{name}`, `{count}`, `{s}`, `{faction}`, `{villain}`) | `novelty.texts` |

Mois déjà écrits : rien ne change (`GENERATOR_VERSION` 3 inchangée, aucun brouillon ni chapitre régénéré). À l'activité d'aujourd'hui
(nouvelles actions jamais mesurées) et sans contenu daté, les chapitres, passes, sagas et objectifs du jour sont ceux d'avant
(215 tirages comparés avant et après). Garde : `actionsSuivies.test.ts` (I38), `nouveaute.test.ts` (I19), intégration
« 6.14.121 (AP-L7) et 6.14.122 (AP-L8) ».

### 7.14 Contenu évolutif : rôles d'unités et recherches d'alliance par effets (6.14.123 et 6.14.124, `units.ts`, `alliances.ts`)

Lots AA5 et AA6 de la revue AU27 (`docs/audit/2026-10-07-au27-admin-evolutif.md`, AA-15 à AA-18). Fiches du domaine :
`docs/systems/unites-hangars.md`, `docs/systems/alliances-social.md`, `docs/systems/bonus-effets.md`.

| Règle | Valeur par défaut | Réglage (admin) |
|:--|:--|:--|
| Rôles d'unités | sonde : Sonde d'espionnage ; recycleur : Drone récupérateur ; transport : Cargo ; soutien : Sonde, Drone, Traqueur Kesh, Vaisseau-atelier, Récolteur ; faiblesse de boss : Frégate, Chasseur, Intercepteur, Croiseur Nova, Lance gravitationnelle, Étoile Noire (vaisseaux seulement) ; contre-espionnage : Sentinelle | cases « Rôles » de chaque fiche (Contenu → Unités) ; replis `spy.probeUnitId`, `spy.sentinelUnitId`, `debris.recyclerUnitId` |
| Faiblesse par défaut d'un boss sans faiblesse propre | vaisseaux au rôle, du moins cher au plus cher (Frégate, Chasseur, Croiseur Nova, Étoile Noire) | rôle « Faiblesse de boss » ; faiblesses propres dans Boss mondiaux |
| Coût d'une unité | ferraille et énergie, plus toute ressource (unité de fin de partie) ; revente : moitié de chaque ressource ; temps par défaut et débris : ferraille + énergie | « Coût » → « Autres ressources » (Contenu → Unités) |
| Préréglages d'effets d'une unité ajoutée | « Armement » (attaque, si elle tire) et « Blindage » (PV), barème « unit » (« elite » pour une élite) | barèmes `effectPresets.budgets` |
| Effet d'une recherche ou d'un projet d'alliance | effets composés (`effects`) ; valeur = par niveau × niveau ; « places de membres » = `membersPerQuarter` × niveau | Règles → Événements et saisons → « Recherches d'alliance », « Projets d'alliance » |
| Couche alliance (calculs d'alliance, multipliés à part) | temps de vol, production de toutes les ressources, contre-espionnage, bouclier, durées, abri du pillage, attaque de toutes les unités contre les PNJ (boss, primes, repaires) ; plafonds 0,5 (bouclier 0,15, abri 0,25 ; contre-espionnage sans plafond) | `effectCaps.<grandeur>.alliance` |
| Autres grandeurs d'alliance | couche empire, avec officiers et reliques, sous leurs plafonds | — |

À contenu par défaut, rien ne change : rôles, faiblesses de boss, flottes des seigneurs, recyclage, contre-espionnage, coûts, durées et
valeurs d'alliance comparés avant et après sur un jeu d'essai (alliance de la copie de production simulée, niveaux 0 à maximum et hors
bornes) : identiques. Gardes : `unitRoles.test.ts` (I39, identifiants d'unités en dur), `allianceEffects.test.ts` (I40),
`contentMigrations.test.ts`, intégrations « 6.14.123 (AA5) » et « 6.14.124 (AA6) ».

## 8. Journal des audits

| Date | Version | Constat | Suite |
|:--|:--|:--|:--|
| 2026-10-06 | 5.27.1 | Hangars en surcharge : migration 5.22 sans plafond, Ascension qui remet les hangars au niveau 1, stat `hangarCapacity` jamais lue, tech « Extension des hangars » sans effet sur les colonies | `proposals/cale-seche.md` |
| 2026-10-06 | après 5.28.0 | Audit global : 5 constats de cohérence (C1 épave d'expédition hors plafond, C5 stats empire non lues…), 6 d'équilibrage (E1 entrepôt et pillage, E2 attrition, E5 alliances de 6…), 4 de QoL, 3 de performance | `docs/audit/2026-10-06-audit-global.md`, `proposals/feuille-de-route-2026-q4.md` |
| 2026-10-06 | 5.28.0 | Lot 0 et Cale sèche livrés : `hangarLoad` unique, surcharge visible, C2 à C6 corrigés, migration 5.22 repassée par l'Atelier ; invariants I3, I4, I5, I8 testés | `caleSeche.test.ts`, test d'intégration « 5.28 Cale sèche » |
| 2026-10-06 | 5.28.1 | Lot A livré : C1 (épave → prêts), C2 (remise automatique au retour des flottes), C3 (`homeLevels`), C5 (couche empire de `fleetUpkeep` et `buildingDiscount`, invariant I9), D1 (README) | `docs/changes/5.28.1-correctifs.md` |
| 2026-10-06 | 5.29.0 | Lot B livré : P1 (fenêtres rares à la demande, 925 → 880 Ko), P2 (horloge unique), P3 (16 tâches en 3 cadences). Le moteur reste dans le bundle d'entrée | `docs/changes/5.29.0-performance.md` |
| 2026-10-06 | 5.30.0 | Lot C livré (option 1) : Ordres du jour, « Tout réclamer » étendu (série, missions, Chroniques), pastille unique, rendez-vous de la semaine. Fusion contrats/missions et lissage du calendrier à décider | `docs/changes/5.30.0-ordres-du-jour.md`, `proposals/journal-de-bord.md` |
| 2026-10-06 | 5.31.0 | Lot D livré : Portefeuille, glossaire, détail des durées, « Passe » au lieu de « passe de saison ». Données de prod (lecture seule) : E1 confirmé (115 h à l'abri contre 57 h de stock), E2 revu (sauvetage max 80 %), E3 corrigé (chantiers déjà parallèles) | `docs/changes/5.31.0-lisibilite.md`, `proposals/entrepot-pillage.md`, `proposals/constructeurs.md` |
| 2026-10-06 | 5.32.0 | Lots E et F livrés : abri ≤ 8 h de production (activation le 13/10, carte « Ce que tu risques »), 6 chantiers + paliers Fonderie ; invariants I10, I11 | `docs/changes/5.32.0-entrepot-chantiers.md` |
| 2026-10-06 | 5.33.0 | Lots G, H, I livrés : alliances 8 → 20 (Quartiers fédérés), 10 emplacements de flotte + « Relancer », routes logistiques des colonies ; invariants I12, I13 | `docs/changes/5.33.0-alliances-grandes.md`, `5.33.0-emplacements-flotte.md`, `5.33.0-routes-logistiques.md` |
| 2026-10-06 | 6.0.0 | Lot J.1 livré : classes d'empire (Industriel, Seigneur de guerre, Explorateur), source « classe » du circuit d'effets, temps limités à −8 % pour tenir le plafond ; invariant I14. Unités de classe (J.2) à venir | `docs/changes/6.0.0-classes-empire.md` |
| 2026-10-06 | 6.0.1 à 6.2.0 | Lots K, L, M : santé de l'équilibre (admin), production et combat expliqués, butin 30 % du stock exposé + soute de pillage ×2 + sauvetage ≤ 85 % | `docs/changes/6.0.1-sante-equilibre.md`, `6.1.0-lisibilite-suite.md`, `6.2.0-pillage.md` |
| 2026-10-06 | 6.2.1 | Lot N : contrats et missions du jour fusionnés en 4 objectifs (minuit Paris, totaux inchangés), missions prêtes versées à la bascule | `docs/changes/6.2.1-quotidien-fusion.md` |
| 2026-10-06 | 6.3.0 | Lot O : « Relancer » pour toutes les missions (primes, boss, transports, livraisons) ; emplacements à débloquer laissés aux relevés | `docs/changes/6.3.0-relancer.md` |
| 2026-10-06 | 6.3.1 | Lot R (C4) : catégorie = vole ou non, onglets Vaisseaux / Défenses ; Intercepteur tourelle (sans vitesse ni soute, 320 / 80) | `docs/changes/6.3.1-categories-unites.md` |
| 2026-10-06 | 6.3.2 | Lot S (P1) : UI tierce dans un bloc `ui` stable, entrée 897 → 742 Ko ; découpe du moteur à proposer (contenu paresseux) | `docs/changes/6.3.2-bundle-ui.md` |
| 2026-10-06 | 6.4.0 | Lot Q : route de ravitaillement (mère → colonie, réserve 30 % de la mère), file de défense coloniale (5 lots, places réservées) | `docs/changes/6.4.0-colonies-suite.md` |
| 2026-10-06 | 6.4.1 | Lot T : Carnet du commandant à jour (chapitre Ton empire : objectif du jour, classe ; étape route logistique) | `docs/changes/6.4.1-prise-en-main.md` |
| 2026-10-06 | 6.5.0 | Lot P (J.2) : vaisseaux de classe (Récolteur, Croiseur de raid, Éclaireur lointain), verrou de classe, bonus de rôle de flotte | `docs/changes/6.5.0-vaisseaux-classe.md` |
| 2026-10-06 | 6.5.1 | Lot U : santé de l'équilibre, suite (emplacements pleins, sens des routes, files de défense, défenses par type, vaisseaux de classe, courbes) | `docs/changes/6.5.1-sante-suite.md` |
| 2026-10-06 | — | Revue AU1 (menaces PNJ) : attaque non plafonnée (`tech19_2`), Traqueur au-delà de son niveau max, aucun repaire ouvert ; décisions en attente | `docs/audit/2026-10-06-au1-menaces-pnj.md` |
| 2026-10-06 | — | Revue AU2 (boss) : structure gonflée par `tech19_2`, taux de boss tués non mesuré, calendrier chargé (lot V) ; décompte mobile corrigé | `docs/audit/2026-10-06-au2-boss.md` |
| 2026-10-06 | 6.6.0 | AU1 décisions A à D : plafond des technos de combat (I15), effet en doublon de `tech19_2` retiré, Traqueur 20 niveaux (+10), repaires à 3 raids + « Localiser », relance d'une prime remplie | `docs/changes/6.6.0-menaces-pnj.md` |
| 2026-10-06 | 6.7.0 | Lot V : boss de la chronique le mardi 18 h (48 h), tournoi du casino le mercredi 18 h (30 h), jours réglables ; invariant I16 | `docs/changes/6.7.0-calendrier-semaine.md` |
| 2026-10-06 | 6.7.1 | Casino ouvert en permanence (tournoi du mercredi séparé de l'ouverture) ; plafonds des technos de combat, bonus du Traqueur, « Localiser », bonus des vaisseaux de classe et colonies réglables dans l'admin | `docs/changes/6.7.1-casino-reglages.md` |
| 2026-10-06 | 6.7.2 | Règle : tout `GameRules` (fonctionnalités existantes et futures) réglable dans le panel admin ; éditeur « Tous les réglages » et test de garde | `docs/changes/6.7.2-reglages-admin-complets.md` |
| 2026-10-06 | — | Revue AU3 (progression) : passe d'octobre fini en 6 jours par 4 joueurs sur 14 avec des points que le barème du code n'explique pas, rien à gagner après le dernier palier, titres en série ; décisions en attente | `docs/audit/2026-10-06-au3-progression.md` |
| 2026-10-06 | 6.8.0 | AU3 et passe génératif, lot 1 : points du passe tracés par source, santé du passe et des succès, un seul passe par mois (I17), titres groupés par famille ; novembre → mars en bibliothèque, chapitres générés dès novembre | `docs/changes/6.8.0-progression-generative.md` |
| 2026-10-06 | 6.8.1 | Passe généré par budget : récompenses sous budget (140 h, jalons, plafonds), points par palier calculés (médian jour 24, plus actif pas avant le 15), défis pondérés, simulation avant publication ; réglages `passGen` dans l'admin (I18) | `docs/changes/6.8.1-passe-par-budget.md` |
| 2026-10-06 | — | Règle n° 3 : travail en continu, questions notées dans `docs/QUESTIONS.md` | `docs/changes/docs-travail-continu.md` |
| 2026-10-06 | 6.8.2 | Chroniques générées sous réglages : récompenses d'épisode par budget, objectifs pondérés, bornes de difficulté, faction du thème du passe (I19) | `docs/changes/6.8.2-chroniques-generees.md` |
| 2026-10-06 | 6.9.0 | Revue AU4 (commerce) : garde-fous en place ; 9 réglages du commerce passés dans l'admin (COM-1) ; volumes à relever en AU13 | `docs/audit/2026-10-06-au4-commerce.md`, `docs/changes/6.9.0-commerce-reglable.md` |
| 2026-10-06 | 6.9.1 | Registre des réglages : 54 objets de règles du moteur dans l'admin (624 champs), garde de test ; grille des territoires figée | `docs/changes/6.9.1-registre-reglages.md` |
| 2026-10-07 | 6.9.2 | Revue AU5 (alliances) : départ, exclusion, déclaration de guerre et reddition confirmés ; diplomates et podium du défi réglables | `docs/audit/2026-10-07-au5-alliances.md`, `docs/changes/6.9.2-alliances-confirmations.md` |
| 2026-10-07 | 6.9.3 | Revue AU6 (communications) : blocage et suppression de message confirmés, saisie mobile lisible | `docs/audit/2026-10-07-au6-communications.md`, `docs/changes/6.9.3-communications.md` |
| 2026-10-07 | 6.9.4 | Revue AU7 (galaxie et combat) : rappel de flotte confirmé ; distance des repaires et départ différé réglables | `docs/audit/2026-10-07-au7-galaxie-combat.md`, `docs/changes/6.9.4-galaxie-flottes.md` |
| 2026-10-07 | 6.9.5 | Revue AU8 (état-major et bonus) : plafonds des bonus réglables par grandeur ; Gelée, Phéromone et contrat prioritaire à source unique | `docs/audit/2026-10-07-au8-etat-major-bonus.md`, `docs/changes/6.9.5-plafonds-bonus.md` |
| 2026-10-07 | 6.9.6 | Revues AU9 (unités) et AU10 (flottes) : invariants tenus, texte d'annulation calculé | `docs/audit/2026-10-07-au9-au10-unites-flottes.md` |
| 2026-10-07 | 6.9.7 | Revue AU11 (économie) : taux et taxe du comptoir d'échange, recherches en parallèle réglables | `docs/audit/2026-10-07-au11-economie.md`, `docs/changes/6.9.7-economie.md` |
| 2026-10-07 | 6.9.8 | Revue AU12 (colonies) : délai de spécialisation calculé, constante morte retirée | `docs/audit/2026-10-07-au12-colonies.md` |
| 2026-10-07 | 6.9.9 | Fenêtre d'attaque : puissance détaillée par vaisseau (`fleetPowerBreakdown`) | `docs/changes/6.9.9-puissance-flotte.md` |
| 2026-10-07 | 6.9.10 | Performance : bloc de démarrage mesuré (276 Ko gzip, moteur ≈ 60 %) ; chargement à la demande du contenu reporté (Q8) | `docs/changes/6.9.10-mesure-bloc-demarrage.md` |
| 2026-10-07 | 6.10.0 | Lot Y : base avancée sur une colonie (stationnement 14 j, attaque depuis la base et retour à la base, rapatriement) ; invariant I20 | `docs/changes/6.10.0-flotte-basee.md` |
| 2026-10-07 | 6.10.1 | Revue AU13 (transverse) : routes admin gardées par un test, commerce dans la santé de l'équilibre, Nouveautés par tranches ; feuille de route d'hiver close, printemps proposé | `docs/audit/2026-10-07-au13-transverse.md` |
| 2026-10-07 | 6.10.2 | Z2 : Menaces en onglets par faction, fiches Bâtiments et Unités compactes sur mobile | `docs/changes/6.10.2-pages-longues.md` |
| 2026-10-07 | 6.10.3 | Z5 : Ambre du dernier palier, effort du passe, prix d'un indice, XP de mission suggérée réglables ; constantes mortes retirées (Q7 close) | `docs/changes/6.10.3-constantes-regles.md` |
| 2026-10-07 | 6.11.0 | Z3 (PRG-2) : paliers bonus du passe, 1 jeton tous les 120 points après le dernier palier, 10 par mois | `docs/changes/6.11.0-paliers-bonus.md` |
| 2026-10-07 | 6.11.1 | Z4 : la base avancée peut défendre sa colonie comme une garnison (réglage admin, désactivé par défaut, Q9) | `docs/changes/6.11.1-base-defend-colonie.md` |
| 2026-10-07 | 6.11.2 | Revue AU14 : feuille de route de printemps close (Z2 à Z5 livrés, Z0, Z1, Z6 en attente), diagnostic d'un test intermittent, billet de devblog ; été proposé | `docs/audit/2026-10-07-au14-printemps.md` |
| 2026-10-07 | 6.11.3 | E2 : Unités à 375 px de 5 651 à 5 256 px (cartes verrouillées compactées), objectif 5 000 px non atteint (Q14) | `docs/changes/6.11.3-unites-mobile.md` |
| 2026-10-07 | 6.11.4 | E1 : champ de débris sur les colonies (clé `debrisKey` de 15 caractères, `locationId`) ; une attaque de colonie avec pertes ne bloque plus la résolution (Q13 close) | `docs/changes/6.11.4-debris-colonies.md` |
| 2026-10-07 | 6.11.5 | Revue AU15 : été clos (E1, E2 livrés ; Z0, Z1, Z6 en attente), cinq pages au-dessus de 5 000 px à 375 px ; automne proposé | `docs/audit/2026-10-07-au15-ete.md` |
| 2026-10-07 | 6.11.6 | A2 : Formules (8 053 → 1 265 px) une section à la fois, Statistiques (6 665 → 4 215 px) sections secondaires repliées sur téléphone | `docs/changes/6.11.6-formules-statistiques-mobile.md` |
| 2026-10-07 | 6.11.7 | A3 : Seigneurs (6 458 → 3 114 px), Profil (6 050 → 2 929 px), Missions (5 894 → 4 967 px) à 375 px | `docs/changes/6.11.7-seigneurs-profil-missions-mobile.md` |
| 2026-10-07 | 6.11.8 | Revue AU16 : automne clos (A2, A3 livrés), trois pages encore au-dessus de 5 000 px, orientation posée (Q15) ; hiver proposé | `docs/audit/2026-10-07-au16-automne.md` |
| 2026-10-07 | 6.11.9 | H1 : Bâtiments (5 456 → 4 754 px), Unités (5 285 → 4 999 px), État-major (5 092 → 2 945 px) ; bouton de déblocage qui débordait corrigé ; Q14 close | `docs/changes/6.11.9-batiments-unites-etat-major-mobile.md` |
| 2026-10-07 | 6.11.10 | H2 : test d'intégration des seigneurs autonome (`ensureAB`), stable seul 3/3 et en suite 78/78 | `docs/changes/6.11.10-test-seigneurs-autonome.md` |
| 2026-10-07 | 6.11.11 | H3 : billet 46 « le jeu sur téléphone » (neuf pages sous 5 000 px, débris de colonie) | `content/blog/46-jeu-sur-telephone.md` |
| 2026-10-07 | 6.11.12 | Revue AU17 : hiver clos (H1 à H3 livrés), aucune page au-dessus de 5 000 px pour un joueur neuf ; printemps 2028 proposé (P1 : joueur avancé) | `docs/audit/2026-10-07-au17-hiver.md` |
| 2026-10-07 | 6.11.13 | P1 : 42 pages mesurées avec un joueur avancé (aucun débordement ; Bâtiments 6 460 → 6 271 px), raison de bouton grisé en une ligne ; Q16 | `docs/changes/6.11.13-joueur-avance-mobile.md` |
| 2026-10-07 | 6.11.14 | Revue AU18 : printemps 2028 clos ; plus de lot faisable seul, feuilles de route en pause jusqu'à Q12, Q15 ou Q16 (Q17) | `docs/audit/2026-10-07-au18-printemps-2028.md` |
| 2026-10-07 | 6.11.15 | Consigne redonnée : pause annulée (Q17), règle n° 3 « jamais de pause », Q15 et Q16 tranchées ; feuille de route d'été 2028 | `docs/changes/6.11.15-reprise-travail-continu.md` |
| 2026-10-07 | 6.12.0 | R2 (Q16) : vue « liste » de Bâtiments sur téléphone, joueur avancé 6 271 → 1 814 px | `docs/changes/6.12.0-batiments-vue-liste.md` |
| 2026-10-07 | 6.13.0 | R3 à R5 (Q15) : lunes, nées d'un gros combat sur la planète mère, +3 % bouclier et +5 % d'entrepôt à l'abri par la couche empire ; invariant I21 | `docs/changes/6.13.0-lunes.md` |
| 2026-10-07 | 6.13.1 | Revue AU19 : été 2028 clos (vue liste, lunes), SP-2 expliqué ; automne 2028 proposé | `docs/audit/2026-10-07-au19-ete-2028.md` |
| 2026-10-07 | 6.13.2 | A28-1 : billet 47 « Les lunes » | `content/blog/47-lunes.md` |
| 2026-10-07 | 6.13.3 | A28-2 : nom de la lune public (fiche joueur, astre sur la Galaxie), champ `moonName` des profils | `docs/changes/6.13.3-lune-publique.md` |
| 2026-10-07 | 6.13.4 | Revue AU20 : automne 2028 clos (billet, lune publique) ; hiver 2028 proposé (améliorer sa lune, Codex) | `docs/audit/2026-10-07-au20-automne-2028.md` |
| 2026-10-07 | 6.14.0 | H28-1 : améliorer sa lune (niveaux 1 à 5, +2 % de bouclier par niveau, sous le plafond de 15 %), Q18 | `docs/changes/6.14.0-ameliorer-sa-lune.md` |
| 2026-10-07 | 6.14.1 | H28-2 : fiche de Codex « Lunes » (Légendes), débloquée avec sa propre lune, Q19 | `docs/changes/6.14.1-codex-lunes.md` |
| 2026-10-07 | 6.14.2 | Revue AU21 : hiver 2028 clos (niveaux de lune, Codex), SP-2 clos ; printemps 2029 proposé (succès lunaires, billet) | `docs/audit/2026-10-07-au21-hiver-2028.md` |
| 2026-10-07 | 6.14.3 | P29-1 : succès « Clair de lune » (secret) et « Lune pleine » (niveau maximal lu à l'usage), Q20 | `docs/changes/6.14.3-succes-lunaires.md` |
| 2026-10-07 | 6.14.4 | P29-2 : billet de devblog « Ta lune grandit » (niveaux, Codex, succès) | `docs/changes/6.14.4-billet-lunes-2.md` |
| 2026-10-07 | 6.14.5 | Revue AU22 : printemps 2029 clos (succès lunaires, billet), BOSS-4 clos ; été 2029 proposé (mesure BOSS-2) | `docs/audit/2026-10-07-au22-printemps-2029.md` |
| 2026-10-07 | 6.14.6 | E29-1 : mesure BOSS-2, boss abattus par type sur 56 jours dans la santé de l'équilibre (Hall of fame), Q21 | `docs/changes/6.14.6-mesure-boss.md` |
| 2026-10-07 | 6.14.7 | Revue AU23 : été 2029 clos (mesure BOSS-2) ; automne 2029 proposé (inventaire des constats ouverts) | `docs/audit/2026-10-07-au23-ete-2029.md` |
| 2026-10-07 | 6.14.8 | PP-1 : pré-prod (procédure, nettoyage de la copie, e-mails coupés, bandeau) ; règle n° 4 (contenu complet : succès, Codex, prompts Midjourney), Q22 | `docs/changes/6.14.8-preprod.md` |
| 2026-10-07 | 6.14.9 | PP-2 : pré-prod en un conteneur Coolify construit depuis la branche (`Dockerfile.preprod`) ; tout passe par la pré-prod ; chaîne de contenu (WORKFLOW §7, règle n° 4) | `docs/changes/6.14.9-preprod-coolify-chaine-contenu.md` |
| 2026-10-07 | 6.14.10 | Reprise de session sans perte (CLAUDE.md), test d'intégration local dans `scripts/itest-local.sh` | `docs/changes/6.14.10-reprise-session.md` |
| 2026-10-07 | 6.14.11 | C1 : garde de la chaîne de contenu (`contentChain.test.ts`), 4 manques connus ; pré-prod nettoyée, Q23 | `docs/changes/6.14.11-garde-chaine-contenu.md` |
| 2026-10-07 | 6.14.12 | C2 : Codex des 13 bâtiments et 30 technos (deux catégories, 5 jetons + 25 Ambre chacune), Q24 | `docs/changes/6.14.12-codex-batiments-technos.md` |
| 2026-10-07 | 6.14.13 | C3 : préréglages d'effet pour les 10 unités qui n'en avaient pas, Q25 | `docs/changes/6.14.13-prereglages-unites.md` |
| 2026-10-07 | 6.14.14 | C4 : succès des boss d'alliance (trophées par joueur, `stats.allianceBossKilled`), garde de la chaîne de contenu sans manque connu, Q26 | `docs/changes/6.14.14-succes-boss-alliance.md` |
| 2026-10-07 | 6.14.15 | PP-3 : adresses de la prod réécrites sur la pré-prod, script de capture ; feuille de route d'automne révisée (Z1 avant l'inventaire) | `docs/changes/6.14.15-preprod-adresses.md` |
| 2026-10-07 | 6.14.16 | Z1 : mesures sur la copie de la prod (point zéro) ; PRG-1 expliqué (missions à +2 au lancement du passe) ; Codex hors de « Tout réclamer » | `docs/audit/2026-10-07-z1-mesures.md` |
| 2026-10-07 | 6.14.17 | Z1-2 : catégories du Codex dans « Tout réclamer » et la pastille unique, Q27 | `docs/changes/6.14.17-codex-tout-reclamer.md` |
| 2026-10-07 | 6.14.18 | A29-1 : inventaire des constats ouverts ; la prod est en 5.27.0, tout le reste attend Z0 | `docs/audit/constats-ouverts.md` |
| 2026-10-07 | 6.14.19 | A29-2 : santé complétée (raids repoussés, élites, casino, pot commun, rythme des succès) ; COM-3 et PNJ-5 fermés | `docs/changes/6.14.19-sante-completee.md` |
| 2026-10-07 | 6.14.20 | Revue AU24 : automne 2029 clos (chaîne de contenu, Z1, santé complétée) ; hiver 2029 ouvert (dossier de mise en production, tests, Codex serveur, décisions à valider) | `docs/audit/2026-10-07-au24-automne-2029.md` |
| 2026-10-07 | 6.14.22 | Atelier d'illustrations : dépôt mobile des rendus Midjourney, détourage, WebP, copie dans les assets, Q28 | `docs/illustrations.md` |
| 2026-10-07 | 6.14.23 | Page `/img` de la pré-prod : rendus envoyés par lot, reconnus par leur nom de fichier, collection `illustration_uploads` | `docs/changes/6.14.23-img-preprod.md` |
| 2026-10-07 | 6.14.24 | H29-1 : dossier de mise en production 5.27 → 6.14, répétition sur la pré-prod | `docs/release/5.27-a-6.14.md` |
| 2026-10-07 | 6.14.29 | Revue AU25 : hiver 2029 clos (dossier de mise en production, `/img`, décisions à valider) ; printemps 2030 ouvert | `docs/audit/2026-10-07-au25-hiver-2029.md` |
| 2026-10-07 | 6.14.35 | Réponses de l'utilisateur sur `/decisions` : 22 décisions validées, Q11 close, Q12 en attente, prochain système à choisir (Q31) | `docs/proposals/prochain-systeme.md` |
| 2026-10-07 | 6.14.38 | Revue AU26 : printemps 2030 clos (`/decisions`, billets, annonce, intégration fiable) ; été 2030 ouvert (Z6 sur la pré-prod, système Q31) | `docs/audit/2026-10-07-au26-printemps-2030.md` |
| 2026-10-07 | 6.14.39 | Performance mesurée sur la pré-prod (Z6) : Galaxie lente sur mobile, images du Codex lourdes ; décor 3D de l'accueil allégé | `docs/changes/6.14.39-performance-preprod.md`, lot É30-5 |
| 2026-10-07 | 6.14.43 | Proposition phalange et porte de saut lunaires (système Q31), choix Q33 à Q41 | `proposals/phalange-porte-de-saut.md` |
| 2026-10-07 | 6.14.44 | É30-1a : phalange, porte de saut et pitié lunaire dans le moteur (règles, stats `phalanxRange` et `jumpGateCooldown`, champ `moonPity`) ; invariant I21 modifié, I22 et I23 | `docs/changes/6.14.44-phalange-moteur.md` |
| 2026-10-07 | 6.14.48 | É30-1b : routes de la phalange et de la porte de saut, radar d'alliance au lancement, niveau de lune public, compteur `gateSaves` (réglage `jumpGate.saveWindowMinutes`) ; I22 vérifié en intégration | `docs/changes/6.14.48-phalange-serveur.md` |
| 2026-10-07 | 6.14.51 | Revue AU27 : sept audits (jeu et chaîne de contenu, admin et évolutivité, chaîne d'actions, procédural, design UI/UX, équilibrage, illustrations) ; été 2030 clos (phalange et porte de saut livrées en moteur, serveur et interface) ; automne 2030 ouvert (65 lots, Q64 à Q103) | `docs/changes/6.14.51-revue-au27.md` |
| 2026-10-07 | 6.14.52 | Lot AC-A (AU27) : campagne d'e-mails sans réécriture de la fiche (jetons créés avant l'envoi), message privé et désinscription en transaction, notifications des 4 rattrapages muets (nuit, contrat, pseudo, enchérisseur remboursé), départ du raid du tutoriel ; invariant I24 | `docs/changes/6.14.52-ecritures-sures.md`, `proposals/chaine-actions.md` |
| 2026-10-07 | 6.14.56 | Lot AP-L1 (AU27) : succès par défaut complétés dans la liste enregistrée (4 manquaient sur la pré-prod), retraits exprès notés (`removedDefaults`), le générateur de paliers n'écrit plus la liste entière ; invariant I25 | `docs/changes/6.14.56-succes-par-defaut.md` |
| 2026-10-07 | 6.14.57 | Lot AP-L2 (AU27) : version du générateur dans le contenu généré, brouillons et chapitres non commencés d'un ancien générateur régénérés (brouillon de novembre à l'ancien format), ancien état dans l'historique ; I17 étendu | `docs/changes/6.14.57-generateur-versionne.md` |
| 2026-10-07 | 6.14.58 | Lot AP-L3 (AU27) : défis du passe bornés par la médiane du serveur, actions de médiane nulle exclues (Q84), garde de faisabilité avant publication d'office, épisode 3 faisable (Q85) ; médian de novembre jour 35 → 27, serveurs hors du mois 77 → 12 sur 200 ; I18 et I19 étendus | `docs/changes/6.14.58-defis-faisables.md` |
| 2026-10-07 | 6.14.59 | Lot AA1 (AU27) : garde-fous du contenu de l'admin, toutes les sections vérifiées par le serveur (`guardContentConfig`), validation récursive selon la forme du défaut, `null` refusé pour un nombre, écarts ×2 avertis (Q75) ; invariant I26 | `docs/changes/6.14.59-garde-fous-admin.md` |
| 2026-10-07 | 6.14.60 | Lot AJ27-3 (AU27) : reliques de la 5.23 non personnalisées sur la pré-prod (rien ne manque), migration `relics-5.23` par prudence, garde des `appendFromDefaults` ; invariant I27 | `docs/changes/6.14.60-reliques-5-23.md` |
| 2026-10-07 | 6.14.61 | Lot AJ27-2 (AU27) : invariant I6 prouvé par 4 tests (butin, rapatriement, livraisons, stock gardé au-delà de la capacité) | `docs/changes/6.14.61-test-i6.md` |
| 2026-10-07 | 6.14.65 | Lot AC-B (AU27) : édition admin d'un joueur par le serveur (différences sur la fiche rattrapée, plafonds entrepôt, hangars et niveaux, motif et journal), remise à zéro de l'XP en une transaction, plus d'écriture directe de la fiche par l'admin du jeu ; invariant I28 | `docs/changes/6.14.65-edition-admin-serveur.md`, `proposals/chaine-actions.md` |
| 2026-10-07 | 6.14.66 | Lot AC-C (AU27, Q78) : suppression de compte par le serveur (mot de passe revérifié), ménage commun avec l'admin (`purgePlayer` : alliance, flottes, garnisons, offres, enchères, contrats), suppression par l'API des collections fermée ; invariant I28 | `docs/changes/6.14.66-suppression-compte-serveur.md` |
| 2026-10-07 | 6.14.69 | É30-1d : sections Lunes de l'admin (pitié, phalange, porte de saut), santé des lunes, reliques Lentille de Séléné et Clé du seuil, 5 succès, titre « Gardien du seuil », 2 fiches de Codex, défi d'alliance « Les vigies », étape du Carnet, recharges dans « Prochaines fins », changelog, billet 53 et annonce | `docs/changes/6.14.69-phalange-chaine.md` |
| 2026-10-07 | 6.14.70 | É30-1e : essai réel de la phalange et de la porte de saut sur la pré-prod (3 comptes de test, alliance de test, leurre ; 66 vérifications) ; 3 correctifs de l'écran Flottes (vraie composition d'une attaque percée, en-tête à 375 px, bouton « Saut » coupé) ; 3 écarts décrits (pluriel du balayage, double notification du saut, étiquette ALERTE du Journal système) ; proposition livrée | `docs/changes/6.14.70-essai-lune-preprod.md` |
| 2026-10-07 | 6.14.71 | Lot AE-L0 (AU27) : proposition d'équilibrage chiffrée, simulateur de progression (4 profils, 90 jours) et combats à budget égal dans le dépôt, script `progression-sim.mjs` ; invariant I29 | `docs/changes/6.14.71-proposition-equilibrage.md`, `proposals/equilibrage-au27.md` |
| 2026-10-07 | 6.14.72 | Lot AE-L1 (AU27) : réglages sûrs (vaisseaux à quai 75 %, défense à domicile +25 %, bouclier 3 h, écart d'XP ×10, coffre du 7e jour 2 M à 12 M), migration des règles enregistrées ; seuil JcJ ×0,75 → ×0,90, coffre 465 h → 20 h de production | `docs/changes/6.14.72-reglages-surs.md` |
| 2026-10-07 | 6.14.74 | Lot DP-L1 : moteur de l'ouverture progressive du menu (`navUnlock.ts` : règles `navUnlock` au registre, 17 signaux, étapes du tutoriel, rang plafond, comptes existants), 18 tests ; invariant I30 | `docs/changes/6.14.74-deblocage-moteur.md`, `proposals/deblocage-progressif.md` |
| 2026-10-07 | 6.14.75 | Lot DP-L2 : menu progressif dans l'interface (barre latérale, mobile, Ctrl+K grisé, « Prochaine ouverture », pastille « Nouveau », marque `nav:<page>`, « Tout afficher », cartes de l'accueil) ; compte neuf 13 entrées, ancien compte 39 | `docs/changes/6.14.75-deblocage-interface.md` |
| 2026-10-07 | 6.14.76 | Lot DP-L3 : Prise en main et Carnet (« Débloque : … »), panneau Lune conditionnel, liens « Ouvre : … » des défis du passe et des Chroniques ; changelog | `docs/changes/6.14.76-deblocage-prise-en-main.md` |
| 2026-10-07 | 6.14.77 | É30-1f : suite de l'essai de la lune ; après un saut, une seule notification (« Saut réussi », retour habituel tu) ; Journal système et cartes de notification : un retour de flotte ou un saut réussi en information (cyan), l'alerte rouge reste aux menaces (flotte hostile, raid, ultimatum, garnison au combat) ; rapport de combat JcJ : `defenderMoonLevel` (lune du défenseur avant le combat) et santé « victoires de l'attaquant avec ou sans lune » sur 30 jours | `docs/changes/6.14.77-suite-essai-lune.md` |
| 2026-10-07 | 6.14.79 | Lot DP-L4 : objectifs du jour d'un nouveau jour tirés parmi les pages ouvertes (relance comprise), notification « Nouveau : … » envoyée par le serveur à chaque ouverture (mémoire `stats.navAnnounced`, qui garde aussi la page ouverte) ; invariant I31 ; intégration « 6.14.79 (DP-L4) » | `docs/changes/6.14.79-deblocage-serveur.md` |
| 2026-10-07 | 6.14.80 | Lot DP-L5 : Admin → Règles → Ouverture du menu (réglages généraux, une fiche par page, aperçu d'un compte neuf par rang avec le brouillon) | `docs/changes/6.14.80-deblocage-admin.md` |
| 2026-10-07 | 6.14.81 | Lot DP-L6 : 18 astuces de page, Ambre de la barre des ressources, succès « À découvrir », « Que faire maintenant ? », rappel de classe et vue cockpit sans page fermée ; changelog, ligne au billet 49 | `docs/changes/6.14.81-deblocage-chaine.md` |
| 2026-10-07 | 6.14.84 | Lot RL-1 : recherche réglable (`research.costGrowth`, `timeGrowth`, `lateFromLevel`, `lateTimeFactor`, `maxLevelSeconds`), défauts neutres (mêmes coûts et durées, test) ; éditeur Admin → Règles → Labo, section Recherche des Formules | `docs/changes/6.14.84-recherche-reglable.md`, `proposals/rythme-long-terme.md` |
| 2026-10-07 | 6.14.85 | Lot RL-2 : projets de prestige (8 h de production, 8 h, un à la fois, ouverts aux extracteurs niveau 10, récompense visible seulement) ; invariant I32 ; simulateur `--prestige` (valeurs actuelles, 365 j : production perdue de l'actif 91 % → 74 %) | `docs/changes/6.14.85-projets-de-prestige.md`, `proposals/rythme-long-terme.md` |
| 2026-10-07 | 6.14.88 | Lot RL-3 (avec AE-L2) : bascule datée du rythme (`rhythm.ts`, groupe `rhythm`, 1er novembre 2026) ; second palier ×4 et 30 h + 24 h par niveau, recherche tardive ×30 (7 j au plus), Ascension tous les 30 jours et jusqu'à 10, comptoir 1 pour 250, missions 0,75, lune AE-9 ; I29 étendu à 365 jours (1re Ascension J87 / J91 / J115 / J126) ; annonce, billet 54, changelog | `docs/changes/6.14.88-bascule-rythme.md`, `proposals/rythme-long-terme.md` |
| 2026-10-07 | 6.14.89 | Lot RL-5 avancé : réglage fin de la bascule du rythme avant la date (second palier 36 h + 27 h, recherche tardive dès le niveau 7, ×25) ; I29 à 365 jours resserré : sessions bloquées ≤ 15 % chaque mois, mois qui suit la 1re Ascension compris (6.14.88 : 25,8 % actif, 50 % moyen → 0 et 0), 1re Ascension J91 / J103 / J122 / J133 dans les bandes du §4.1 | `docs/changes/6.14.89-reglage-fin-rythme.md`, `proposals/rythme-long-terme.md` |
| 2026-10-07 | 6.14.105 | Lot AA4 (AU27, AA-21, AA-22) : textes joueurs qui citent un chiffre de règle construits depuis la règle en vigueur (parrainage, primes, boss d'alliance et sa notification serveur, Comptoir, mutateurs, Carnet, Formules, capsules, reliques, casino, Gazette) ; `keshFeats` lit `BOUNTY_RULES.ranks` ; forces des mutateurs réglables (`mutators.values`), textes identiques à règles par défaut (sauf « 3 points de talent », texte faux corrigé) | `docs/changes/6.14.105-textes-de-regle-vivants.md`, `textesVivants.test.ts` |
| 2026-10-07 | 6.14.106 | Lot AE-L3 (AU27, AE-2, AE-3, AE-7, AE-15) : coffre du 7e jour indexé (6 à 18 h, plancher 2 M, place libre de l'entrepôt), plafond de rares au comptoir (30 M par semaine, compteur `exchangeWeek`), 4 défaites en défense par 24 h (décollage et arrivée), rattrapage +50 % sous 20 % ; invariant I33 ; I29 : un mois par profil ≤ 20 % de sessions bloquées | `docs/changes/6.14.106-plafonds-equilibre.md`, `proposals/equilibrage-au27.md` |
| 2026-10-08 | 6.14.107 | Lot AE-L4 (AU27, AE-5, AE-10, AE-11, AE-15) : santé de l'équilibre complétée (Admin → Équilibrage) : Ambre gagnée par source et par semaine, heures avant la mort des boss, jour de la 1re Ascension, production perdue à entrepôt plein, quartiles de production, suivi de Q267 à Q269 ; traces de taille fixe dans `stats` (`healthTrace.ts`) ; seuils d'alerte réglables (groupe `balanceHealth`) | `docs/changes/6.14.107-sante-equilibre-completee.md`, `proposals/equilibrage-au27.md` |
| 2026-10-08 | 6.14.108 | Lot AP-L4 (AU27, AP-5, Q82, Q89) : paliers de succès générés bridés : 3 détenteurs actifs et 10 % des actifs, 1 palier par mesure tous les 30 jours, 3 par mesure, titre au dernier seulement ; ancien palier sans date daté au premier passage, rien retiré (I25) ; groupe `achievementGen` et section d'admin | `docs/changes/6.14.108-succes-generes-brides.md`, `progression6108.test.ts`, intégration « 6.14.108 (AP-L4) » |
| 2026-10-08 | 6.14.109 | Lot AP-L5 (AU27, AP-9, Q87) : objectifs du jour pondérés (`dailyContracts.weights`, « Repousser une attaque » 0,5, poids égaux = tirage d'avant), raid de faction repoussé compté, quantités sorties du code (`targets`, `spendHours`, `spendMin`) ; I31 inchangé | `docs/changes/6.14.109-objectifs-du-jour-ponderes.md`, `contracts.test.ts` |
| 2026-10-08 | 6.14.110 | Lot AC-D (AU27, AC-5, AC-6, AC-12, AC-20, AC-21, Q76) : un seul chemin de dépense (`spendResources`, `spendAmber`, garde de balayage), 7 dépenses de ressources et 10 d'Ambre ramenées ; réclamations au Journal (ligne lue, une seule pour « Tout réclamer ») ; rappel de flotte tracé et hôte de garnison prévenu ; succès vérifiés après l'action ; revente comptée ; invariant I34 | `docs/changes/6.14.110-depenses-et-traces.md` |
| 2026-10-08 | 6.14.111 | Lot AC-E (AU27, AC-7, AC-8, AC-10, Q77) : verrou par cadence (passages sautés comptés), campagnes d'e-mails en file et par lots de 50 par minute, factions, flottes (200 par passage), rattrapage de la nuit et rappels du Comptoir allégés (contenu lu une fois, paquets de 100 joueurs), échéances collectives suspendues pendant une maintenance puis décalées ; groupe `serverTasks` ; invariant I35 | `docs/changes/6.14.111-taches-planifiees.md` |
| 2026-10-08 | 6.14.112 | Lot AC-F (AU27, AC-11, AC-16, Q79) : erreurs du serveur traduites côté client (message du jeu gardé, texte clair pour 403, 409, 429, 503, 500 signalée), garde de vacances unique (`vacation.allowed`, `vacationBlock`, `vacationGuard`) sur toutes les routes qui rapportent ou dépensent ; invariant I36 | `docs/changes/6.14.112-erreurs-et-vacances.md` |
| 2026-10-08 | 6.14.113 | Lot AC-G (AU27, AC-14, AC-15, AC-19) : jeton du casino, défi et titre du Codex dans « Tout réclamer » (contexte du serveur), pastille sans faux positif, un seul chemin par l'action pour le Codex, le défi et le jeton, sous-actions isolées ; invariant I37 | `docs/changes/6.14.113-reclamations-groupees.md` |
| 2026-10-08 | 6.14.114 | Lot AJ27-4 (AU27, AJ-1, AJ-10) : garde de la chaîne de contenu renforcée (succès propre, porteur propre, Ctrl+K ; colonies, talents, modules, classes d'empire), `KNOWN_GAPS` justifiés lot par lot, panneau Admin → Équilibrage → « Chaîne de contenu » (contenu de l'admin compris) | `docs/changes/6.14.114-garde-chaine-contenu.md`, `contentChain.test.ts` |
| 2026-10-08 | 6.14.115 | Lot AJ27-5 (AU27, AJ-3) : colonies dans la chaîne : 4 succès (entrée, maîtrise), catégorie « Colonies » du Codex (biomes, spécialisations, récompense réglable), section Colonies des Formules ; 4 lignes d'illustration de biomes | `docs/changes/6.14.115-colonies-chaine.md`, `coloniesChaine.test.ts` |
| 2026-10-08 | 6.14.117 | Lot É30-6 (PRG-5, AE-12, suite d'AP-L4) : rythme des succès : seuil en jeu = seuil écrit × facteur de la mesure (11 mesures de volume, bronze gardé), texte réécrit, générateur au seuil en jeu, rien de repris ; groupe `achievementPace` et section d'admin ; rétro-simulation 38 % → 28 % à J7,6 | `docs/changes/6.14.117-rythme-des-succes.md`, `docs/proposals/rythme-des-succes.md`, `rythmeSucces6117.test.ts` |
| 2026-10-08 | 6.14.121 | Lot AP-L7 (AU27, AP-10) : registre des actions suivies (`trackedActions.ts`) lu par les Chroniques, les défis du passe, la saga et les objectifs du jour ; lune (amélioration, phalange, porte de saut), colonies (convoi, base avancée, spécialisation) et une action par contenu (unité, techno, bâtiment) comptées ; action « mesurée » tirée seulement si la médiane du serveur l'atteint ; objectifs du jour « porte de saut » et « convoi » pour qui peut les faire ; maillon « objectif » de la chaîne ; mois écrits inchangés ; invariant I38, I31 complété | `docs/changes/6.14.121-actions-suivies.md`, `actionsSuivies.test.ts` |
| 2026-10-08 | 6.14.122 | Lot AP-L8 (AU27, AP-10) : épisode « nouveauté » : un contenu daté (`addedOn`) depuis 45 jours au plus prend l'épisode 2 du chapitre suivant (accessible à 50 % des actifs, une fois, graine propre), bibliothèque de textes et réglages `novelty`, « Ajouté le » dans les fiches de l'admin, mention « Nouveauté » sur l'épisode ; I19 complété | `docs/changes/6.14.122-episode-nouveaute.md`, `nouveaute.test.ts` |
| 2026-10-08 | 6.14.123 et 6.14.124 | Lots AA5 et AA6 (AU27, AA-15 à AA-18) : rôles d'unités au lieu des identifiants en dur, coût d'unité en toutes ressources, préréglages générés ; recherches et projets d'alliance par effets composés (couche alliance, couche empire) ; invariants I39 et I40, I9 et I27 complétés | `docs/changes/6.14.123-roles-unites.md`, `docs/changes/6.14.124-alliance-effets.md` |
