# Proposition : récompenses du départ (première heure, premier jour)

Statut : **livrée** (2026-10-09, lot S3 du [plan](../plan.md), fiche `docs/changes/6.14.163-recompenses-du-depart.md` ; suite
livrée en 6.14.165, lot S6 : plafond « compte jeune » de toutes les récompenses en heures (§9) et surplus de nano et de données,
RR-2 (§10), fiche `docs/changes/6.14.165-depart-suite.md`).
Méthode : `docs/WORKFLOW.md` §2. Constats NJ-4 et NJ-5 de [l'audit du parcours](../audit/2026-10-09-parcours-nouveau-joueur.md).
Suite de [`rythme-du-depart.md`](rythme-du-depart.md) (6.14.159 : premiers niveaux en secondes). Questions : Q408 à Q411 (§8),
option la plus prudente appliquée (règle n° 3).

## 1. Constat

Parcours joué sur la pré-prod (6.14.159, compte neuf, 62 min) :

- **NJ-4** : à la 18e minute, le raid d'initiation repoussé verse **216 000 de chaque ressource commune** (864 000 au total) pour une
  production d'environ 15/s. Le joueur « monte tout d'un coup ». Le Carnet du commandant affiche ensuite 300 000, puis 2 000 000.
- **NJ-5** : vers 40 min, 450 000 nanocomposants et 380 000 données dorment, alors que chaque chantier demande 70 000 à 230 000 de
  ferraille. Seule issue : le comptoir (données → rare → ferraille, environ 55 % de pertes), que rien n'indique.

## 2. Diagnostic

### 2.1 Inventaire de ce que reçoit un compte neuf

Production de référence : extracteurs et technos (`getProductionRatesPerSecond`), celle de la série, des succès, des missions et des primes.
Moments : ceux du parcours joué ; production du simulateur (`progression-sim.mjs --depart --recompenses`, compte connecté sans pause).

| Récompense | Quand | Montant (ferraille / énergie / nano / données, sauf mention) | Production du moment, par ressource | Valeur en production |
|:--|:--|:--|--:|:--|
| Ressources de départ | 0 | 100 / 50 / 0 / 0 | — | — |
| Série, jour 1 (« Tout réclamer ») | 1 min | 1 h de production, au moins 2 000 de chaque ; 2 jetons | 2 à 4/s | ≈ 10 à 15 min (plancher) |
| Prise en main 1 (ferraille niv. 3) | 2 min | 1 000 / 500 | 7/s | 2 min |
| Prise en main 2 (réacteur niv. 3) | 3 min | 1 500 / 1 000 | 7/s | 4 min |
| Prise en main 3 (première recherche) | 6 min | nano 2 000, données 2 000, 20 Acier | 2 à 16/s | 2 à 15 min |
| Prise en main 4 (5 drones) | 15 min | 3 000 | 16/s | 3 min |
| Prise en main 7 (10 roquettes) | 16 min | 20 Acier ; **déclenche le raid** | — | — |
| **Raid d'initiation repoussé** | **18 min** | **4 h de chaque : 230 400 de chaque (simulé), 216 000 (joué)** + 25 XP, débris (< 30), butin « menaces » (jetons, capsules) | 16/s | **240 min de chaque** |
| Prise en main 5 et 6 (mission, entrepôt niv. 2) | 20 min | 5 000 / 2 000 ; 5 000 / 5 000 | 16 à 25/s | 3 à 5 min |
| Mission « Patrouille courte » (1 min, en boucle) | dès 19 min | max(800, 1,5 × 1 min de production) | 16 à 25/s | 1,5 min |
| Prise en main 8 et 9 (espion, alliance) | 28 à 31 min | 30 Module ; 10 000 / 10 000 | 25/s | 7 min |
| Objectifs du jour (×4) | 1re heure | 90 rares × échelle, 15 XP, 1 jeton | — | rares seulement |
| Prise en main 10 (Fer II) | 55 min | 50 de chaque rare, titre | — | rares seulement |
| **Carnet, objectif 1 (objectif du jour)** | **55 à 60 min** | **300 000 / 300 000** | 32/s (sans la prime : extracteurs niv. 5) | **156 min de chaque** |
| Carnet, classe d'empire | 57 min | 10 Ambre | — | — |
| Carnet, « Ta lune veille » (garnison chez un allié) | 1er jour possible | 1 000 000 / 1 000 000 | 32 à 80/s | 3 h 30 à 8 h 40 |
| Carnet, « Obtenir une relique » | 1er ou 2e jour (expédition) | 500 000 / 500 000 | 80/s | 1 h 45 |
| Carnet, colonie (120 niveaux) | plusieurs jours | 2 000 000 / 2 000 000 | ≈ 500/s (extracteurs niv. 10) | ≈ 1 h 05 |
| Succès bronze et argent | 1re heure | XP seulement (0 h) | — | — |
| Succès or | jours | 2 h de production | — | 2 h |
| Chroniques (épisodes du mois) | 1er jour | octobre : sans ressources ; mois générés : 1 à 12 h de production par récompense | — | objectifs hors de portée de la 1re heure |
| Passe | 15e min (palier 1, payé à la 24e par « Tout réclamer ») | **2 h de production** (palier 1), puis 3, 4, 4, 5… h | 54 à 58/s | **120 min** : faux ici en 6.14.163, corrigé au §9 (NJ-25) |

Coût des niveaux (après 6.14.159, extracteurs et entrepôt du premier palier) :

| Niveau | Extracteur (ferraille / énergie) | Durée | Production du niveau | Entrepôt (ferraille / énergie) |
|--:|:--|--:|--:|:--|
| 2 | 166 / 71 | 20 s | 4/s | 20 000 / 10 000 |
| 3 | 553 / 252 | 40 s | 7/s | 47 427 / 23 713 |
| 4 | 1 842 / 896 | 1 min 21 | 13/s | 112 468 / 56 234 |
| 5 | 6 129 / 3 183 | 2 min 43 | 23/s | 266 704 / 133 352 |
| 6 | 20 394 / 11 308 | 5 min 29 | 42/s | 632 455 / 316 227 |
| 7 | 67 860 / 40 165 | 11 min | 75/s | 1 499 788 / 749 894 |
| 8 | 225 800 / 142 669 | 22 min | 135/s | 3 556 558 / 1 778 279 |

**Lecture** : à la 18e minute (extracteurs niveau 4), 230 400 de ferraille paient les niveaux 5 et 6 des quatre extracteurs
(4 × 26 523 = 106 092) puis le niveau 7 de deux d'entre eux (2 × 67 860) : **deux à trois niveaux d'un coup**, soit l'heure suivante de
la courbe. Le Carnet (300 000 à la 60e minute) recommence. Le simulateur le confirme : à 60 min, extracteurs 7/7/7/7 et entrepôt 4 avec les
anciennes primes, 5/5/5/5 et entrepôt 2 sans.

### 2.2 Causes, de la plus sûre à la plus douteuse

1. **La prime du raid de Varan est une prime de milieu de partie** (`DEFAULT_FACTIONS`, `bounty.hours: 4`), versée telle quelle au raid
   scripté de la prise en main (`resolvePirateRaid`). Les raids ordinaires n'arrivent qu'après 72 h de compte : à ce moment, 4 h de
   production sont une prime juste. À la 18e minute, c'est 4 h d'une production qui double à chaque niveau. Preuve : 15/s × 4 h = 216 000,
   le chiffre du parcours ; test `recompensesDepart.test.ts`.
2. **Le Carnet verse des montants fixes** pensés pour un joueur avancé (`advancedGuide.ts`), et son premier objectif (« réclamer un
   objectif du jour ») se fait dans la minute qui suit la fin de la prise en main. Ces montants n'étaient pas réglables (règle n° 2).
3. **Ferraille seul goulot (NJ-5)** : les quatre extracteurs produisent autant (même courbe, `productionPerSecond`), mais les coûts du
   départ sont surtout en ferraille : extracteurs 2,3 : 1 (ferraille : énergie), entrepôt 2 : 1, unités 2 à 2,5 : 1, recherches du début
   300 à 800 de ferraille pour 50 à 300 de nano ou de données. Sur la première heure jouée (extracteurs 2 → 5, entrepôt 2, 5 drones,
   10 roquettes, 6 recherches) : ≈ 60 000 de ferraille, 30 000 d'énergie, moins de 1 000 de nano et de données. Le nano et les données
   servent plus tard (Atelier, Cale sèche, recherches de milieu de partie, Synthétiseur). Une prime **égale sur les quatre ressources**
   (216 000 de chaque) ajoute donc presque tout le surplus observé (450 000 de nano à 40 min, pour ≈ 60 000 produits).
4. (Douteux) **Le surplus restant** vient du choix du joueur de monter les quatre extracteurs ensemble ; la prise en main conseille la
   ferraille d'abord (objectif 1), mais rien ne signale un surplus ni l'échange au comptoir.

## 3. Benchmark

| Jeu | Récompense de tutoriel ou de première heure | Ordre de grandeur | Leçon |
|:--|:--|:--|:--|
| OGame (univers vitesse 1) | « Tutoriel » : petits paquets de métal et de cristal, quelques vaisseaux | quelques minutes à une heure de production des premières mines | le cadeau aide à finir l'étape suivante, pas les trois d'après |
| Clash of Clans | tutoriel : gemmes pour finir un chantier, quelques centaines d'or et d'élixir ; succès du début : 100 à 1 000 | 10 min à 1 h de collecte du village de départ | les récompenses grossissent avec l'hôtel de ville, jamais avant |
| 4X mobiles (Rise of Kingdoms, State of Survival) | coffres de quête « à la taille du joueur » (paliers par niveau du bâtiment principal) | 15 à 60 min de production | les montants suivent le niveau ; les accélérations remplacent les grosses sommes |

Constante : une récompense de tutoriel vaut **de quelques minutes à une heure** de production du joueur **au moment où il la reçoit**,
et suit les ressources que le jeu fait dépenser à ce moment.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| **A. Montants fixes réduits** (raid : 3 000 de chaque ; Carnet ÷ 10) | NJ-4 pour un compte qui suit le rythme | 2 réglages | trop pour un compte lent, trop peu pour un compte rapide ; ne règle pas la répartition (NJ-5) ; écartée |
| **B. Récompenses indexées (retenue)** : raid d'initiation = minutes de production par ressource, réparties comme les coûts (30 / 15 / 5 / 5) ; Carnet plafonné à 60 min de production par ressource commune | NJ-4 pour tous les rythmes, et la part de NJ-5 due aux primes | 1 groupe de règles, accesseurs, simulateur | un joueur qui ne produit rien d'une ressource en reçoit le plancher (1 000) |
| **C. Ressources du départ en ferraille seule** | NJ-5 à la source des primes | 1 réglage | plus d'énergie pour les unités ; trop brutal |
| **D. Nano et données dans les coûts des extracteurs** (ex. extracteur de ferraille niv. 5 à 8 : + 20 % de son coût en données) | NJ-5 structurel | change l'équilibre de tous les comptes, le pillage et I29 ; proposition à part | non chiffré dans ce lot (Q410) |
| **E. Échange direct commune ↔ commune au comptoir** (ex. 1 pour 1, taxe 30 %) et conseil « Échange ton surplus » quand une ressource dépasse 5 fois le prochain chantier | le surplus restant de NJ-5 | action serveur, interface, réglages | ouvre une porte au transfert entre ressources ; lot à part (Q410) |

## 5. Recommandation (appliquée)

### 5.1 Règles

Groupe `startRewards` (`START_REWARD_RULES`, `src/game/startRewards.ts`, Admin → Règles → Tous les réglages, « Récompenses du départ ») :

| Réglage | Défaut | Effet |
|:--|--:|:--|
| `enabled` | oui | décoché : prime en heures de la faction et Carnet aux montants fixes (avant la 6.14.163) |
| `tutorialRaidMinutes` | ferraille 30, énergie 15, nano 5, données 5 | prime du raid d'initiation : minutes de production de chaque ressource |
| `tutorialRaidFloor` | 1 000 | au moins, pour chaque ressource dont les minutes sont > 0 |
| `guideCapMinutes` | 60 | Carnet : chaque ressource commune versée vaut au plus N minutes de production (0 : montants fixes) |
| `guideCapFloor` | 5 000 | le plafond du Carnet ne descend jamais sous ce montant |

Raid d'initiation : premier raid de la faction du tutoriel (`tutorialRaid.factionId`) résolu après que la prise en main l'a lancé
(`onboarding.tutorialRaid = "sent"`), sans raid de cette faction résolu avant (`isTutorialRaid`). Les raids suivants gardent la prime
de la faction. Nouveaux groupes `guideRewards` (montants du Carnet) et `guideAmber` (Ambre du Carnet) : mêmes valeurs qu'avant,
désormais réglables. La carte du Carnet affiche le montant plafonné (`guideStepReward`), celui que verse la réclamation.

### 5.2 Chiffres

| Récompense | Avant | Après (parcours joué, 15/s) | Après (simulé) | Valeur après |
|:--|:--|:--|:--|:--|
| Raid d'initiation (18e min) | 216 000 de chaque (864 000) | 27 000 / 13 500 / 4 500 / 4 500 (49 500, −94 %) | 28 800 / 14 400 / 4 800 / 4 800 | 30 / 15 / 5 / 5 min : un niveau de chaque extracteur (4 × 6 129) |
| Carnet, objectif du jour (60e min) | 300 000 / 300 000 | ≈ 83 000 / 83 000 (23/s) | 115 200 / 115 200 (32/s) | 60 min de chaque |
| Carnet, « Ta lune veille » (1er jour) | 1 000 000 / 1 000 000 | 60 min de production | — | 60 min |
| Carnet, colonie (120 niveaux) | 2 000 000 / 2 000 000 | inchangé (plafond ≈ 1,8 M à 500/s : 1 h ; montant complet un peu plus tard) | — | ≤ 60 min |
| Prise en main, série, missions, objectifs du jour, succès | — | inchangés (chacun ≤ 60 min de production, vérifié) | — | — |

Première heure simulée (extracteurs ferraille / énergie / nano / données, entrepôt, chantiers et recherches lancés) :

| Minute | Avant (anciennes primes) | Après |
|--:|:--|:--|
| 18 | 4/4/4/4, entrepôt 2, 44 | 4/4/4/4, entrepôt 2, 44 |
| 20 | 4/4/4/4, entrepôt 3, 55 | 4/4/4/4, entrepôt 2, 50 |
| 30 | 6/5/5/5, entrepôt 4, 71 | 5/5/5/5, entrepôt 2, 58 |
| 45 | 6/6/6/6, entrepôt 4, 102 | 5/5/5/5, entrepôt 2, 66 |
| 60 | 7/7/7/7, entrepôt 4, 114 | 5/5/5/5, entrepôt 2, 70 |

Sans les anciennes primes, la première heure garde sa pente : niveau 5 vers la 25e minute, niveau 6 (20 000 de ferraille, 15 min de
production du niveau 5) dans la deuxième heure. Les 70 lancements de l'heure restent au-dessus de ceux d'avant 6.14.159 (48).

### 5.3 Long terme (I29)

`node scripts/progression-sim.mjs --base anciennes-recompenses --recompenses` (90 jours) et
`… --apres-bascule --prestige --ascend --days 365 --depart` : avant la bascule, 1re Ascension actif J10,9 → **J11**, moyen J18,3 → **J17,8**,
occasionnel J46,3 et quotidien J32,3 inchangés. « Après » est identique au modèle de référence d'I29 (sans primes du départ) : les
anciennes primes avançaient l'actif de 0,1 jour. Après la bascule, aucun chiffre ne bouge (actif J93,3, moyen J104,3, occasionnel J132,8,
quotidien J121,8 ; sans action J1–7 de l'actif 1,8 %). Les bornes d'I29 ne changent pas.

### 5.4 Comptes existants

Rien n'est retiré. Un compte qui a déjà reçu la prime la garde ; un raid d'initiation déjà résolu ne se rejoue pas ; un objectif du
Carnet déjà réclamé reste réclamé. Aucune migration : la prime et le plafond sont calculés à la réclamation. Un serveur au contenu
personnalisé garde ses factions (la prime du raid d'initiation ne lit pas `bounty.hours`).

## 6. Invariants

- **I50 (nouveau)** : récompenses du départ. La prime du raid d'initiation vaut `startRewards.tutorialRaidMinutes` de production de chaque
  ressource commune (au moins `tutorialRaidFloor`), chacune ≤ 60 min, ferraille > énergie > nano ; seul le premier raid de la faction du
  tutoriel, lancé par la prise en main, la verse ; chaque ressource commune d'un objectif du Carnet vaut au plus `guideCapMinutes` (60)
  de production du joueur à la réclamation (au moins `guideCapFloor`), les rares et l'Ambre ne sont pas plafonnés ; chaque récompense
  commune de la prise en main vaut au plus 60 min de production d'un compte aux quatre extracteurs niveau 3 ; `startRewards.enabled` à
  faux rend les anciennes récompenses. Test : `recompensesDepart.test.ts`.
- **I29** : bornes inchangées (§5.3).

## 7. Plan de lots

| Lot | Contenu | Taille | État |
|:--|:--|:--|:--|
| RR-1 | Prime du raid d'initiation indexée, Carnet plafonné et réglable (`startRewards`, `guideRewards`, `guideAmber`), simulateur (`startRewards`, `--recompenses`), docs | S | livré (6.14.163) |
| RR-2 | Surplus de nano et de données (NJ-5, reste) : échange direct au comptoir ou conseil « Échange ton surplus » (option E), selon Q410 | S à M | livré (6.14.165, §10) |
| RR-3 | Plafond « compte jeune » de toute récompense en heures de production, réserve du départ (NJ-25) | S | livré (6.14.165, §9) |

## 8. Questions (option recommandée appliquée, règle n° 3)

| N° | Question | Choix fait | Autre option | Revenir en arrière |
|:--|:--|:--|:--|:--|
| Q408 | Prime du raid d'initiation : 30 / 15 / 5 / 5 min, ou plus (60 / 30 / 10 / 10) ? | **30 / 15 / 5 / 5** : un niveau de chaque extracteur, l'événement reste marquant sans sauter de niveaux | 60 / 30 / 10 / 10 : deux niveaux d'un extracteur | `startRewards.tutorialRaidMinutes` ; `enabled` décoché : 4 h |
| Q409 | Carnet : plafond de 60 min par ressource, ou montants fixes divisés ? | **plafond de 60 min** : juste pour tous les rythmes ; un joueur avancé reçoit le montant réglé | montants fixes ÷ 10 (trop peu plus tard) | `startRewards.guideCapMinutes` (0 : montants fixes) ; montants dans `guideRewards` |
| Q410 | Surplus de nano et de données (NJ-5) : échange direct commune ↔ commune au comptoir (taxe 30 %), conseil « surplus », ou nano et données dans les coûts des extracteurs ? | **reporté (RR-2)** : ce lot retire la part des primes (216 000 de chaque) ; on mesure le surplus restant au parcours S5 avant de toucher au comptoir ou aux coûts | coûts des extracteurs (équilibre de tous les comptes, I29) | — |
| Q411 | Plafonner aussi, pour un compte de moins de 24 h, les autres récompenses en heures (succès or 2 h, Chroniques et passe jusqu'à 12 h) ? | ~~non : aucune n'est à portée de la première heure~~ **faux** : le palier 1 du passe (2 h) se paie à la 24e minute (NJ-25, second parcours). Remplacé par le §9 (6.14.165) : toutes plafonnées | plafond général « compte neuf » (appliqué) | `startRewards.youngAccountHours` à 0 |

## 9. Suite (6.14.165, lot S6, NJ-25) : toute récompense en heures, plafonnée pour un compte jeune

### 9.1 Constat

Second parcours joué (6.14.164, 45 min) : le palier 1 du passe, « 2 h de production », est atteint à la 15e minute et payé à la 24e
par « Tout réclamer » : **388 800 ferraille, 208 800 énergie, 208 800 nanocomposants, 115 200 données** (921 600) pour ≈ 58/s. C'est le
saut que 6.14.163 avait retiré au raid d'initiation, par une autre porte. Q411 affirmait qu'aucune autre récompense en heures n'était
à portée de la première heure : c'est faux (le §2.1 classait le passe « réservé aux détenteurs » ; il est gratuit pour tous).

### 9.2 Inventaire des récompenses exprimées en heures de production

| Source | Heures | Atteignable par un compte de moins de 24 h ? | Traitement 6.14.165 |
|:--|:--|:--|:--|
| Passe, paliers (`grantPassReward`) | 2, 3, 4, 4, 5… 12 | **oui** (palier 1 à la 15e minute) | plafonné, reste en réserve |
| Chroniques, épisodes et chapitres (même fonction) | 1 à 12 (mois générés) | oui (épisodes du mois dès le 1er jour) | plafonné, reste en réserve |
| Succès (`achievementReward`) | or 2, légendaire 6, mythique 12 | peu probable (or) | plafonné, reste en réserve |
| Série, jours 1 à 6 (`streakReward`) | 1 ; 1,5 ; 2… | **oui** : jour 2 à minuit (heure de Paris), 30 min après une inscription à 23 h 30 | plafonné (plancher 2 000 gardé), reste en réserve |
| Série, coffre du 7e jour (`rollStreakChest`) | 6 à 18 | non : 6 jours de série au moins ; `youngAccountHours` est borné à 72 h | hors d'atteinte (garde du test) |
| Défi hebdomadaire (`grantChallengeReward`) | 6 à 10 | possible (défi clos le lendemain de l'inscription) | plafonné, reste en réserve (le serveur passe `now`) |
| Coalition, boss d'alliance, Léviathan | 2 à 4, podium plus | possible (alliance dès la 27e minute) | plafonnés, reste en réserve |
| Repaires, primes des factions (raids ordinaires) | 4 à 24 | non (raids après 72 h) ; plafonnés quand même | plafonnés, reste en réserve |
| Expéditions : gisement, butin de victoire | 1 à 3, 2 | possible (5 vaisseaux suffisent) | plafonnés, reste en réserve ; trésor rare : heures plafonnées, sans réserve |
| Fin de saison (`performSeasonReward`) | selon le rang | possible (inscription la veille de la fin du mois) | part commune plafonnée, reste en réserve |
| Raid d'initiation, Carnet | minutes, plafond de 60 min (6.14.163) | oui | inchangés (§5) |
| Objectifs du jour, missions du jour, prise en main | rares, XP, jetons, montants fixes ≤ 60 min | oui | sans objet (pas en heures) |
| Trésor et guerre d'alliance, coûts (traités, repaires, officiers, capsules, boucliers) | — | — | pas une récompense du joueur |

### 9.3 Options

| Option | Pour | Contre |
|:--|:--|:--|
| A. Âge du compte (retenue) : moins de `youngAccountHours` (24 h), une récompense en heures vaut au plus `youngCapMinutes` (60) de production au versement | une date (`createdAtMs`) que le serveur a déjà, aucune mesure à régler, couvre la première journée entière | un compte rapide reçoit moins le premier jour (rattrapé par la réserve) |
| B. Seuil de production (tant que la production est sous N/s) | suit le joueur, pas l'horloge | seuil à régler et à revoir à chaque changement des extracteurs ; un joueur peut rester sous le seuil des jours |
| C. Paliers du passe réécrits en minutes | simple pour le passe | ne règle ni les Chroniques, ni la série, ni les succès ; change le passe de tous |

**Reste versé plus tard** : la différence (en montants, calculée au versement) va à la **réserve du départ** (`startReserve`, profil
joueur), versée par « Tout réclamer » (action `startReserveClaim`, ligne des Ordres du jour) dès que le compte a `youngAccountHours`.
Rien n'est perdu ; la réserve arrive quand la production l'a rattrapée (palier 1 du passe : 1 h à 58/s, soit ≈ 10 min de la production
du lendemain). Le trésor rare d'expédition (rares) est plafonné sans réserve.

### 9.4 Chiffres (`node scripts/progression-sim.mjs --base anciennes-recompenses --recompenses --depart`)

| Récompense | Avant | Après |
|:--|:--|:--|
| Palier 1 du passe (2 h, 24e min, 32/s simulé) | 230 400 de chaque (120 min) | 115 200 de chaque (60 min) ; 115 200 de chaque en réserve |
| Parcours joué (58/s) | 921 600 au total | ≈ 460 800, autant en réserve |

Première heure simulée (avec les récompenses du départ, palier 1 du passe compris) : 60e minute à 7/7/7/7, entrepôt 4, 113 lancements
(anciennes valeurs : 7/7/7/7, entrepôt 4, 118). Même plafonné, 60 min de production à la 24e minute avancent encore les extracteurs :
6/6/6/6 et entrepôt 3 à la 45e minute, 7/7/7/7 et entrepôt 4 à la 60e, contre 5/5/5/5 et entrepôt 2 sans le passe (mesure de
6.14.163, §5.2) : question Q416 (plafond de 30 min ?).

### 9.5 Règles et invariant

`startRewards.youngAccountHours` (24, de 0 à 72) et `startRewards.youngCapMinutes` (60). I50 étendu : `recompensesDepart.test.ts`
(palier 1 du passe, succès or, série du jour 2, comptes sans date ou règles décochées, garde qui classe chaque appel de
`productionHours(` du moteur : récompense plafonnée, ou coût et mesure).

## 10. RR-2 (6.14.165) : surplus de nanocomposants et de données (NJ-26, Q410)

### 10.1 Constat et diagnostic

Second parcours : à 45 min, 309 k de nanocomposants et 205 k de données dorment (≈ 100 k de chaque sans le palier du passe) pendant
que la ferraille (13 k) et, de la 18e à la 24e minute, l'énergie (495) bloquent. Les quatre extracteurs produisent autant, les
chantiers du début coûtent surtout de la ferraille (§2.2). Le comptoir **acceptait déjà** l'échange commune ↔ commune à 1 pour 1 (taxe
5 %, `getTradeRate` depuis 6.9.7, testé), mais la page disait « aucun échange commune ↔ commune » et rien ne le proposait.

### 10.2 Options

| Option | Effet | Coût | Risque |
|:--|:--|:--|:--|
| A. Échange direct au comptoir, taux affiché (**retenue**, avec D) | le surplus redevient de la ferraille ou de l'énergie en un geste | aucun : l'échange existe ; taux rendu réglable (`exchange.commonToCommon`, `rareToRare`) et dit sur la page | un joueur qui échange tout, toute la partie, avance (voir 10.3) |
| B. Nano et données dans les coûts des premiers niveaux | structurel | change l'équilibre de tous les comptes, le pillage, I29 | proposition à part |
| C. Production de départ différenciée (nano et données plus lents) | moins de surplus et de primes en nano | change toute l'économie (les primes indexées suivent) | idem |
| D. Conseil « Échange ton surplus » (**retenu**, avec A) | « Que faire maintenant ? » propose l'échange quand la ressource la plus fournie en a ≥ 4 fois la plus maigre et ≥ 20 000, avec la quantité qui égalise les deux stocks, lien prérempli | 3 réglages (`surplusAdviceRatio`, `surplusAdviceMin`, `surplusAdviceDays`) | aucun |

### 10.3 Chiffres (`node scripts/progression-sim.mjs --recompenses --depart --surplus`)

Option `surplusExchange` du simulateur : quand seules des communes manquent au chantier ou à la recherche la moins chère, le joueur
échange ses communes en trop (taux et taxe du comptoir).

| Mesure | Sans échange | Avec échange (3 premiers jours) |
|:--|:--|:--|
| Première heure, 60e minute | 7/7/7/7, entrepôt 4, 113 lancements | 7/7/7/7, entrepôt 4, 120 lancements |
| Première heure, 15e à 25e minute | 4/4/4/4 → 5/5/5/5 | 5/4/4/4 → 6/6/5/5 (ferraille et énergie d'abord) |
| Stocks à 60 min (ferraille / énergie / nano / données) | 145 k / 174 k / 179 k / 194 k | 15 k / 11 k / 11 k / 11 k (504 k échangés depuis l'inscription) |
| I29 avant la bascule (1re Ascension actif / moyen / occasionnel / quotidien) | J11 / J17,8 / J46,3 / J32,3 | J10,8 / J17,8 / J46,3 / J32,3 |
| I29 après la bascule (365 j) | actif J93 ; sessions bloquées 2,9 % | actif J90,4 ; 4,2 % ; autres profils inchangés |

Échanger **tout le surplus toute la partie** avance la 1re Ascension du profil moyen de J17,8 à **J14,8**, sous la borne d'I29 (J15) :
le conseil ne s'affiche donc que les `surplusAdviceDays` (3) premiers jours, et le simulateur n'échange que ces jours-là. Le taux reste
1 pour 1 (comptes existants inchangés) ; le baisser est la question Q417.
