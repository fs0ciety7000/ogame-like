# Proposition : récompenses du départ (première heure, premier jour)

Statut : **livrée** (2026-10-09, lot S3 du [plan](../plan.md), fiche `docs/changes/6.14.163-recompenses-du-depart.md`).
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
| Passe | — | réservé aux détenteurs du passe | — | — |

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
| RR-2 | Surplus de nano et de données (NJ-5, reste) : échange direct au comptoir ou conseil « Échange ton surplus » (option E), selon Q410 | S à M | avec S4 ou après S5 (nouveau parcours joué) |

## 8. Questions (option recommandée appliquée, règle n° 3)

| N° | Question | Choix fait | Autre option | Revenir en arrière |
|:--|:--|:--|:--|:--|
| Q408 | Prime du raid d'initiation : 30 / 15 / 5 / 5 min, ou plus (60 / 30 / 10 / 10) ? | **30 / 15 / 5 / 5** : un niveau de chaque extracteur, l'événement reste marquant sans sauter de niveaux | 60 / 30 / 10 / 10 : deux niveaux d'un extracteur | `startRewards.tutorialRaidMinutes` ; `enabled` décoché : 4 h |
| Q409 | Carnet : plafond de 60 min par ressource, ou montants fixes divisés ? | **plafond de 60 min** : juste pour tous les rythmes ; un joueur avancé reçoit le montant réglé | montants fixes ÷ 10 (trop peu plus tard) | `startRewards.guideCapMinutes` (0 : montants fixes) ; montants dans `guideRewards` |
| Q410 | Surplus de nano et de données (NJ-5) : échange direct commune ↔ commune au comptoir (taxe 30 %), conseil « surplus », ou nano et données dans les coûts des extracteurs ? | **reporté (RR-2)** : ce lot retire la part des primes (216 000 de chaque) ; on mesure le surplus restant au parcours S5 avant de toucher au comptoir ou aux coûts | coûts des extracteurs (équilibre de tous les comptes, I29) | — |
| Q411 | Plafonner aussi, pour un compte de moins de 24 h, les autres récompenses en heures (succès or 2 h, Chroniques et passe jusqu'à 12 h) ? | **non** : aucune n'est à portée de la première heure (vérifié §2.1) | plafond général « compte neuf » | — |
