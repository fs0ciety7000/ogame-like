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
| Journée | 24 h | contrats du jour, missions, série de connexion, raids pirates ; tout réuni dans **Ordres du jour** (5.30) | ressources, jetons, Ambre (j6), coffre (j7) |
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
