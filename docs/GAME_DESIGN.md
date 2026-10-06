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
| Journée | 24 h | contrats du jour, missions, série de connexion, raids pirates | ressources, jetons, Ambre (j6), coffre (j7) |
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
| I3 | Aucun ajout d'unités hors construction, retour de flotte, fin de réparation ou remise en service (qui vérifie la place) | tout `src/game` + migrations | `caleSeche.test.ts` (I3) |
| I4 | La capacité ne baisse jamais sous la flotte sans état « surcharge » visible ; l'Ascension garde hangars et Cale sèche | `ascension.ts` (`keptOnAscension`) | `ascension.test.ts`, `caleSeche.test.ts` (I4) |
| I5 | Places et capacité des hangars : une seule fonction (`hangarLoad`, `playerUnitCapacity` dans `hangar.ts`) | client, serveur, Statistiques | `caleSeche.test.ts` (I5, garde sur `getUnitCapacity(`) |
| I6 | Le butin et les livraisons arrivent même entrepôt plein (choix assumé) | `fleets.ts` | `fleets.test.ts` |
| I7 | Rien dans `src/game` n'utilise `Intl` / `localeCompare` / `toLocaleString` | tout `src/game` | `serverSafe.test.ts` |
| I8 | Une remise en service automatique ne tourne que si le serveur a lu les flottes en vol (`awayKnown`) | `actions.ts` (`performPlayerAction`) | `caleSeche.test.ts` |

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

Une fiche par système : rôle, règles, chiffres, paliers, sorties de plafond. Les chiffres réglables sont dans l'admin (Règles, Contenu).

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
| Prêts | rentrent au hangar s'il y a de la place : bouton « Remettre en service », automatique au palier 10 |

| Palier | Effet |
|:--|:--|
| 1 | les sauvés occupent des postes, pas le hangar |
| 5 · Triage | démanteler (60 % du prix, réglable) ; réglage après combat : tout réparer, démanteler ce qui ne tient pas, tout démanteler |
| 10 · Remise automatique | prêts rentrés dès qu'une place se libère (à la prochaine action du joueur) ; Atelier +10 % |
| 15 · Priorités | ordre de réparation : arrivée, ou une classe d'abord |
| 20 · Cale orbitale | +5 points de vaisseaux sauvés |

Succès : Cale pleine, Ferrailleur (100), Démolisseur (1 000). Sans Cale sèche (niv. 0), l'Atelier se comporte comme en 5.20.

## 8. Journal des audits

| Date | Version | Constat | Suite |
|:--|:--|:--|:--|
| 2026-10-06 | 5.27.1 | Hangars en surcharge : migration 5.22 sans plafond, Ascension qui remet les hangars au niveau 1, stat `hangarCapacity` jamais lue, tech « Extension des hangars » sans effet sur les colonies | `proposals/cale-seche.md` |
| 2026-10-06 | 5.28.0 | Lot 0 et Cale sèche livrés : `hangarLoad` unique, surcharge visible, C2 à C6 corrigés, migration 5.22 repassée par l'Atelier ; invariants I3, I4, I5, I8 testés | `caleSeche.test.ts`, test d'intégration « 5.28 Cale sèche » |
