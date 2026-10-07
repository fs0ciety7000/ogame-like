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
| I6 | Le butin et les livraisons arrivent même entrepôt plein (choix assumé) | `fleets.ts` | `fleets.test.ts` |
| I7 | Rien dans `src/game` n'utilise `Intl` / `localeCompare` / `toLocaleString` | tout `src/game` | `serverSafe.test.ts` |
| I8 | Une remise en service automatique ne tourne que si le serveur a lu les flottes en vol (`awayKnown`) | `actions.ts` (`performPlayerAction`), `cosmic_db.js` (`dockAutoOnReturn`) | `caleSeche.test.ts` |
| I9 | Chaque stat d'effet est lue dans la couche empire (champ de `Modifiers` consommé, ou lecteur direct) | `modifiers.ts`, `effectTargets.ts`, `hangar.ts`, `workshop.ts` | `effectsRead.test.ts` |
| I10 | La part à l'abri du pillage ne dépasse jamais la règle de capacité ; une fois la règle en heures active, elle vaut au plus max(plancher, H h de production) | `economy.ts` (`protectedAmount`) | `storageRisk.test.ts` |
| I11 | Un chantier de bâtiment ne se lance que si un chantier est libre (`buildSlots`) ; un chantier déjà en cours n'est jamais annulé par la règle | `buildPlan.ts`, `actions.ts` | `storageRisk.test.ts` |
| I12 | Une flotte ne décolle que si une place est libre : flottes en vol hors sondes et expéditions < emplacements (`FLEET_RULES.slotsBase`) ; une flotte déjà en vol n'est jamais rappelée par la règle | `fleets.ts` (`fleetSlotBlocker`), `cosmic_db.js` (`fleetsActive`) | `fleetSlots.test.ts` |
| I13 | Un convoi de route logistique ne prend jamais sous la réserve de la colonie et ne porte jamais les ressources communes de la planète mère au-delà de son entrepôt | `colonies.ts` (`colonyRouteLoad`, `runColonyRoute`) | `colonyRoutes.test.ts` |
| I14 | Au plus une classe d'empire active ; ses effets passent par la couche empire et ses plafonds ; aucun maximum théorique de la couche empire (rapport d'impact) ne dépasse son plafond | `empireClass.ts`, `modifiers.ts`, `impact.ts` | `empireClass.test.ts`, `derived.test.ts` |
| I15 | Couche techno : attaque et défense des unités ≤ +150 % au total ; une techno ≤ +100 % à son niveau maximal et ne monte pas une unité au-delà de son niveau maximal | `effects.ts` (`TECH_COMBAT_CAP`), `technologies.ts` (`validateTechEffect`) | `menaces66.test.ts` |
| I16 | Avec les réglages par défaut, boss de la chronique (mardi), tournoi du casino (mercredi, casino ouvert en permanence) et événement du week-end (vendredi) ne commencent jamais le même jour ; le boss de la chronique ne chevauche jamais le boss mondial | `events.ts` (`bossWindows`), `casino.ts` (`tournamentWeeklyWindows`) | `calendrier67.test.ts` |
| I17 | Un seul passe par mois : dès novembre 2026, le passe du chapitre n'est plus lu ; un chapitre écrit à la main ne remplace un mois généré que par choix de l'admin (bibliothèque), et un mois déjà commencé n'est jamais déplacé | `seasonPass.ts` (`activePass`), `chronicles.ts` (`moveWrittenToLibrary`, `applyLibraryChapter`) | `progression680.test.ts` |
| I18 | Passe généré : paliers 1 à 29 dans ±5 % du budget (`passGen.budgetHours`), plafonds du mois respectés (Ambre, jetons, dossiers, capsules), dernier palier hors budget ; points par palier entre `pointsMin` et `pointsMax`, même graine → même passe | `passGen.ts`, `passSeasons.ts` (`generatePassSeason`) | `progression681.test.ts` |
| I19 | Chapitre généré : 4 épisodes, objectifs pris parmi les actions autorisées (`chronicleGen.objectiveWeights` > 0), difficulté dans ses bornes ; faction du thème du passe sauf si elle était là le mois précédent ; les récompenses par budget ne changent pas le reste du tirage | `procedural.ts` (`generateChapter`), `chronicleGen.ts` | `progression682.test.ts` |
| I20 | Base avancée : une attaque partie d'une base ne prend jamais plus de vaisseaux que la base n'en contient et ne touche pas aux vaisseaux à quai de la planète mère ; les vaisseaux basés restent comptés dans le hangar de la planète mère (`unitsAwayOf`) | `fleets.ts` (`takeFromBase`, `baseReturnUnits`) | `flotteBasee.test.ts` |
| I21 | Lune : un joueur en a au plus une ; elle ne naît que d'un combat sur sa planète mère (jamais sur une colonie ni pour un PNJ) ; chance = `min(1, moonChance(débris) + moonPity)`, `moonChance` = 1 % par tranche de `debrisPerPercent`, `maxChance` au plus ; 6.14.44 : chaque combat subi sur la planète mère sans lune (attaquant joueur) ajoute `pityPerDefense` à la réserve **avant** le tirage (lune garantie au 20e à 5 %), une naissance la remet à 0, `pityPerDefense = 0` la rend inerte ; ses effets passent par la couche empire et ses plafonds ; son bouclier au niveau maximal reste sous le plafond (15 %) | `moon.ts` (`addMoonPity`, `rollMoon`, `moonEffects`), `attack.ts` | `lunes.test.ts`, `derived.test.ts` |
| I22 | Phalange : rend une flotte cachée (`trueUnits` au niveau `revealDecoyLevel`, `boosts` au niveau `revealBoostLevel`) seulement à sa cible (planète mère ou colonie), jamais à un allié ni à un tiers, sans rien écrire dans la flotte ; le radar ne signale une attaque de joueur qu'aux alliés de la cible (même alliance, lune, portée couvrant la planète visée), ni la cible ni l'attaquant, `radarMaxNotified` au plus ; un balayage ne vise qu'un agresseur (flotte d'attaque en approche vers soi, une de ses colonies ou un allié couvert), respecte sa recharge et son coût, et ne montre que la composition affichée (jamais `trueUnits`) | `phalanx.ts` (`revealIncoming`, `radarRecipients`, `isAggressor`, `scanRefusal`, `buildScanReport`) | `phalange.test.ts` |
| I23 | Porte de saut : ne fait que rapatrier une flotte du joueur vers sa planète mère, pour les missions permises (patrouille, garnison, base avancée : le réglage peut en retirer, jamais en ajouter), hors statut « done » ou « decision », sans cargaison, une fois par recharge ; unités conservées (I1), aucune ressource créée | `jumpGate.ts` (`jumpRefusal`, `jumpedFleet`, `markJump`) | `porteSaut.test.ts`, `attack.test.ts` (I1) |
| I24 | Une fiche joueur n'est réécrite que dans une transaction qui l'a relue (jamais depuis une lecture ancienne : campagne d'e-mails, statistiques, désinscription) ; tout rattrapage sauvé (`loadFlushed`, `flushPlayer`) écrit ses notifications dans la même fonction, hors PNJ ; un raid de faction a toujours sa date de départ | `cosmic_db.js` (`ensureMailTokens`, `bumpPlayerStat`, `unsubscribe`, `createPirateRaid`), `cosmic.pb.js` | `ecrituresSures.test.ts`, intégration « 6.14.52 (AC-1) », « 6.14.52 (AC-13) », « v5.1 » (pseudo) |

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

- Sauve une part des unités détruites (5 %/niv. jusqu'au 10, puis 2 %/niv. ; 70 % au niv. 20 ; plafond global 95 % avec les bonus).
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

Moteur livré en 6.14.44 (lot É30-1a), serveur en 6.14.48 (É30-1b : routes `moon/phalanx`, `moon/scan`, `fleet/jump`, radar au lancement, `profiles.moonLevel`) ; interface au lot É30-1c (`proposals/phalange-porte-de-saut.md`).

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
- Désactiver : `phalanx.enabled`, `jumpGate.enabled` à faux, `moon.pityPerDefense` à 0 (Admin → Règles → Tous les réglages).

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
| 2026-10-07 | 6.14.22 | Atelier d'illustrations : dépôt mobile des rendus Midjourney, détourage, WebP, copie dans les assets, Q28 | `docs/illustrations.md` |
| 2026-10-07 | 6.14.23 | Page `/img` de la pré-prod : rendus envoyés par lot, reconnus par leur nom de fichier, collection `illustration_uploads` | `docs/changes/6.14.23-img-preprod.md` |
| 2026-10-07 | 6.14.24 | H29-1 : dossier de mise en production 5.27 → 6.14, répétition sur la pré-prod | `docs/release/5.27-a-6.14.md` |
| 2026-10-07 | 6.14.29 | Revue AU25 : hiver 2029 clos (dossier de mise en production, `/img`, décisions à valider) ; printemps 2030 ouvert | `docs/audit/2026-10-07-au25-hiver-2029.md` |
| 2026-10-07 | 6.14.35 | Réponses de l'utilisateur sur `/decisions` : 22 décisions validées, Q11 close, Q12 en attente, prochain système à choisir (Q31) | `docs/proposals/prochain-systeme.md` |
| 2026-10-07 | 6.14.44 | É30-1a : phalange, porte de saut et pitié lunaire dans le moteur (règles, stats `phalanxRange` et `jumpGateCooldown`, champ `moonPity`) ; invariant I21 modifié, I22 et I23 | `docs/changes/6.14.44-phalange-moteur.md` |
| 2026-10-07 | 6.14.48 | É30-1b : routes de la phalange et de la porte de saut, radar d'alliance au lancement, niveau de lune public, compteur `gateSaves` (réglage `jumpGate.saveWindowMinutes`) ; I22 vérifié en intégration | `docs/changes/6.14.48-phalange-serveur.md` |
| 2026-10-07 | 6.14.38 | Revue AU26 : printemps 2030 clos (`/decisions`, billets, annonce, intégration fiable) ; été 2030 ouvert (Z6 sur la pré-prod, système Q31) | `docs/audit/2026-10-07-au26-printemps-2030.md` |
| 2026-10-07 | 6.14.51 | Revue AU27 : sept audits (jeu et chaîne de contenu, admin et évolutivité, chaîne d'actions, procédural, design UI/UX, équilibrage, illustrations) ; été 2030 clos (phalange et porte de saut livrées en moteur, serveur et interface) ; automne 2030 ouvert (65 lots, Q64 à Q103) | `docs/changes/6.14.51-revue-au27.md` |
| 2026-10-07 | 6.14.52 | Lot AC-A (AU27) : campagne d'e-mails sans réécriture de la fiche (jetons créés avant l'envoi), message privé et désinscription en transaction, notifications des 4 rattrapages muets (nuit, contrat, pseudo, enchérisseur remboursé), départ du raid du tutoriel ; invariant I24 | `docs/changes/6.14.52-ecritures-sures.md`, `proposals/chaine-actions.md` |
| 2026-10-07 | 6.14.20 | Revue AU24 : automne 2029 clos (chaîne de contenu, Z1, santé complétée) ; hiver 2029 ouvert (dossier de mise en production, tests, Codex serveur, décisions à valider) | `docs/audit/2026-10-07-au24-automne-2029.md` |
