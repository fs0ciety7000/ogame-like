# Proposition : rythme du premier jour (coûts des niveaux 5 à 10, missions du premier jour)

Statut : **livrée** (2026-10-09, lot S9 du [plan](../plan.md), fiche `docs/changes/6.14.167-rythme-du-premier-jour.md`).
Méthode : `docs/WORKFLOW.md` §2. Suite de [`rythme-du-depart.md`](rythme-du-depart.md) (durées, 6.14.159, Q402 : « baisser les coûts
du début ? ») et de [`recompenses-du-depart.md`](recompenses-du-depart.md) (6.14.163, 6.14.165). Rythme long terme :
[`rythme-long-terme.md`](rythme-long-terme.md) (invariant I29), inchangé. Questions : Q425 à Q430 (§8), option recommandée appliquée
(règle n° 3).

## 1. Constat

> « Je veux quelque chose où les gens ne s'ennuient pas et ont des choses à faire. La production n'augmente pas assez, si ? »
> (l'utilisateur, 2026-10-09)

Pistes validées par l'utilisateur : adoucir la pente des coûts des niveaux 5 à 10 (×2,5 au lieu de ×3,4) sans toucher au second palier
ni au rythme sur des mois ; récompenser le jeu actif par des missions courtes qui rapportent en proportion de la production. Objectif
mesurable : le premier jour, un actif a une action utile au moins toutes les **10 minutes** ; un joueur qui revient 3 à 5 fois par jour
trouve **plusieurs choses à lancer et une récompense visible** à chaque retour ; le long terme (1re Ascension, arbre complet, I29) reste
dans ses bornes.

Trois parcours joués sur la pré-prod ([audit](../audit/2026-10-09-parcours-nouveau-joueur.md)) : « plus rien d'utile à lancer » vers
la **46e**, la **33e** (au rythme d'un script) et la **45e minute** (rythme humain) : Labo plein, chantiers qui attendent la ferraille
(extracteur niveau 8 à 191 900 de ferraille, 22 min de production), il ne reste que la Patrouille courte d'une minute en boucle.

## 2. Diagnostic

### 2.1 Courbes (contenu par défaut, `node scripts/progression-sim.mjs --courbes`)

Extracteur de ferraille (les quatre extracteurs ont la même courbe). **Attente** : ferraille des 4 extracteurs au niveau n ÷ production
de ferraille du niveau n − 1 (sans bonus) ; **rentabilité** : coût (ferraille + énergie) ÷ production gagnée.

| Niveau | Coût (ferraille / énergie) | Pente | Production du niveau d'avant (gain) | Durée | Attente | Rentabilité |
|--:|:--|:--|:--|--:|--:|--:|
| 4 | 1 842 / 896 | ×3,33 | 7/s (+6) | 1 min | 18 min | 8 min |
| 5 | 6 129 / 3 183 | ×3,33 | 13/s (+10) | 3 min | 31 min | 16 min |
| 6 | 20 394 / 11 308 | ×3,33 | 23/s (+19) | 5 min | 59 min | 28 min |
| 7 | 67 860 / 40 165 | ×3,33 | 42/s (+33) | 11 min | 1,8 h | 55 min |
| 8 | 225 800 / 142 669 | ×3,33 | 75/s (+60) | 22 min | 3,3 h | 1,7 h |
| 9 | 751 332 / 506 758 | ×3,33 | 135/s (+124) | 45 min | 6,2 h | 2,8 h |
| 10 | 2,5 M / 1,8 M | ×3,33 | 259/s (+241) | 1 h 30 | 10,7 h | 5,0 h |
| 11 (second palier, après la bascule) | 20 M / 12 M + 80 000 rares | ×8 | 500/s (+125) | 36 h | 44 h | 71 h |

- **Cause sûre** : le coût monte de ×3,33 par niveau (ferraille ; ×3,55 pour l'énergie), la production de ×1,8 (table
  `PRODUCTION_TABLE`). L'attente est donc multipliée par **×1,85 à chaque niveau** : elle double tous les niveaux, de 18 min (niveau 4)
  à 10,7 h (niveau 10). Preuve : `rythmePremierJour.test.ts` (attente du niveau 10 > 10 h avec l'ancienne pente).
- Entrepôt : ×2,37 par niveau (20 000 à 20 M), recherches ×2,7 de coût et ×1,67 de durée, unités à prix fixe : ce ne sont pas eux qui
  freinent ; la ferraille des extracteurs l'est (NJ-5 : nano et données n'entrent pas dans leurs coûts).
- Durées (6.14.159) : 20 s au niveau 2, 11 min au 7, 22 min au 8, 45 min au 9, 1 h 30 au 10 (après la bascule : 2 h 15 et 9 h aux
  niveaux 9 et 10). Six chantiers et quatre recherches en parallèle.

### 2.2 Boucle de session (nouvelle mesure du simulateur, `--rythme`)

Le simulateur joue maintenant aussi un **actif connecté en continu** (J1 de 0 à 16 h après l'inscription, J2 et J7 de 7 à 23 h, pas de
10 s) et relève, jour par jour, le **plus long temps sans action utile** (chantier, déblocage, recherche ; « avec missions » : ou une
mission de 5 min et plus relancée), les attentes de plus de 10 min et leur cause (files pleines ou coût qui freine) ; pour les sessions
des quatre profils, les **actions utiles à chaque retour** et les missions terminées (`ProgressionPaceDay`, option `activeWindows`).

Avant (règles d'avant ce lot, récompenses du départ comprises, `--base avant-s9 --rythme --recompenses`) :

| Mesure (avant la bascule) | J1 | J2 | J7 |
|:--|:--|:--|:--|
| Plus long sans chantier ni recherche (actif continu) | 34 min | 2 h | 3 h 10 |
| Attentes de plus de 10 min | 25 | 22 | 15 |
| Temps d'attente : coût qui freine / files pleines | **735** / 189 min | 0 / 954 min | 500 / 457 min |
| Actions à chaque retour, profil moyen (3 par jour) | 10, 10, 11 | 10, 10, 10 | 10, 3, 7 |

- **J1 : le coût freine** (735 min sur 960) : c'est le creux des parcours joués (Labo plein, chantiers en attente de ferraille).
- **J2 et après : les durées freinent** (files pleines presque tout le temps) ; après la bascule, l'actif de J7 a ses files pleines toute
  la journée (second palier en 36 h et plus, recherche tardive) : c'est le rythme sur des mois voulu par I29.
- Sources actives existantes : missions indexées (`missionRewards` : 1,5 × durée × production, **0,75** après la bascule), expéditions,
  raids PNJ (après 72 h). Le premier jour, seule la **Patrouille courte** (1 min, 2 drones) est à portée : Patrouille du périmètre
  (10 min) demande 30 roquettes, Collecte d'énergie (15 min) des chasseurs et des frégates, Forage profond (30 min) 12 drones et
  3 cargos. Le joueur actif n'a donc qu'une boucle d'une minute, qui rapporte 1,5 min (0,75 après la bascule) de ferraille par minute :
  utile, mais fastidieuse et sans effet visible face à un chantier à 67 860.

### 2.3 Causes, de la plus sûre à la plus douteuse

1. **La pente des coûts** des niveaux 5 à 10 (×3,33) est presque le double de celle de la production (×1,8) : chaque niveau fait
   attendre deux fois plus que le précédent (§2.1).
2. **Pas d'échelle de missions** entre 1 min et 1 h au premier jour : les prérequis des missions de 10 à 30 min sont ceux du milieu de
   partie.
3. (Structurel, hors de ce lot) La **ferraille paie presque tout**, nano et données s'accumulent (NJ-5, RR-2) : à J3,5 l'actif a 50 à
   70 M de nano et de données sans usage pendant qu'il attend 20 M de ferraille pour le second palier (§5.4, Q429).

## 3. Benchmark

| Jeu | Coût par niveau | Production par niveau | Ce qui occupe le premier jour et la première semaine | Leçon |
|:--|:--|:--|:--|:--|
| OGame (vitesse 1) | mine de métal : 60 × **1,5**^(n − 1) | 30 × n × **1,1**^n par heure, soit ×1,2 à ×1,3 aux premiers niveaux | mines, puis la première flotte et les expéditions (1 à 2 h) ; le premier jour se joue en sessions | le rapport coût ÷ production monte d'environ ×1,2 par niveau : l'attente grandit lentement |
| Travian | champs : ×1,6 à ×1,7 environ | ×1,4 à ×1,5 environ | quêtes de tutoriel courtes, aventures du héros (15 min à quelques heures) | même ordre : rapport en ×1,15 à ×1,2 par niveau ; une source active (héros) dès la première heure |
| Ikariam | ×1,4 environ par niveau | ouvriers à répartir (choix actif) | dons à la mine de l'île, missions de transport | l'action du joueur (répartir, donner) remplace l'attente |
| Clash of Clans | durées de quelques secondes (premier jour) à des heures (semaine 1) ; 2 constructeurs au départ | collecteurs lents | **attaques** : le butin d'une attaque vaut plusieurs heures de collecteurs ; une armée se forme en 5 à 20 min | la boucle active (attaquer) rapporte bien plus que la production et fixe la cadence de jeu |
| 4X mobiles (Rise of Kingdoms) | coûts ×1,3 à ×1,6 | ×1,2 à ×1,4 | marches de collecte (1 à 4 h), quêtes courtes qui donnent des accélérations | une échelle de durées : il y a toujours une tâche à la taille de la session |
| Idle moderne (AdVenture Capitalist, Idle Miner) | ×1,07 à ×1,15 par achat | linéaire, ×2 aux jalons (25, 50, 100…) | un achat toutes les quelques secondes à minutes, bonus actifs | la cadence d'achat reste constante ; le jeu actif double les gains |

Constante : **le rapport coût ÷ production grandit de ×1,1 à ×1,4 par niveau**, jamais ×1,85 ; et une **source active** à la taille de
la session (5 à 30 min) existe dès le premier jour, avec un gain proportionnel au niveau du joueur.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| **A. Pente adoucie des coûts (retenue)** : niveaux 5 à 10 des extracteurs à ×2,5 au plus par niveau, jamais plus chers qu'avant, second palier inchangé | l'attente du J1 (cause 1) : rapport coût ÷ production ×1,39 par niveau | 1 groupe de règles (`buildCost`), aperçu admin ; rien en base | arrivée au second palier 6 à 12 h plus tôt : une session sans action de plus pour l'actif en semaine 1 (I29, Q425) |
| **B. Production plus forte** (×2,2 par niveau dès le 5) | même attente | table de production (contenu), toutes les récompenses indexées, le pillage, l'entrepôt | niveau 10 à 1 600/s au-dessus du niveau 11 (625/s) : casse la continuité du second palier ; écartée |
| **C. Échelle des missions du premier jour (retenue)** : Patrouille du périmètre (10 min) à 10 roquettes, Collecte d'énergie (15 min) à 6 drones, Forage profond (30 min) à 8 drones | une action à la taille de la session dès la 30e minute, gain proportionnel à la production (cause 2) | 3 prérequis (contenu) et une migration de contenu | missions déjà indexées : +0,75 × leur durée de production par relance (1,5 avant la bascule) pour qui joue activement, voulu |
| **D. Chantiers en plus** (7 au lieu de 6, ou file d'attente plus longue) | les attentes « files pleines » (J2 et après) | 1 réglage (`economy.buildSlotsBase`) | accélère tout le long terme (I29) ; ne règle pas le coût du J1 ; reportée (Q428) |
| **E. Accélérations gagnées** (minutes de chantier offertes par les missions courtes, comme les 4X mobiles) | les attentes « files pleines » | nouveau système (action, règle, interface) | contraire à la décision du 2026-10-09 (aucun nouveau système avant la mise en production) ; reportée (Q428) |
| **F. Coûts sur les quatre ressources** (nano et données dans les coûts des extracteurs) | la cause 3 (NJ-5 structurel), le mur de ferraille de J3,5 | change le second palier et I29 | proposition à part, après la mise en production (Q429) |

Variantes de la pente (A), mesurées avec l'échelle des missions (C), après la bascule (365 jours, Ascensions, projets de prestige) :

| Variante | Coût niv. 5 / 6 / 7 / 8 / 9 / 10 (milliers de ferraille) | Attente niv. 7 / 8 | 1re Ascension actif / moyen | Sans action J1–7, actif | Pire mois bloqué actif / moyen |
|:--|:--|:--|:--|:--|:--|
| avant (×3,33) | 6 / 20 / 68 / 226 / 751 / 2 500 | 1,8 h / 3,3 h | J93 / J104 | 1,8 % | 2,9 % / 10 % |
| **×2,5 (retenue)** | 5 / 12 / 29 / 72 / 180 / 450 | **46 min / 1,1 h** | J88,4 / J98 | 3,6 % | **0,8 % / 4,4 %** |
| ×2,8 | 5 / 14 / 40 / 113 / 317 / 888 | 1,1 h / 1,7 h | J90,4 / J98 | 3,6 % | 2,5 % / 4,4 % |
| ×3 | 6 / 17 / 50 / 149 / 448 / 1 343 | 1,3 h / 2,2 h | J88,9 / J98 | 0 % | 1,7 % / 4,4 % |
| ×2,5, jonction ×4 (niveau 10 inchangé) | 5 / 12 / 39 / 156 / 625 / 2 500 | 1 h / 2,3 h | J87,4 / J103 | 3,6 % | 10 % / 7,8 % |
| ×2,5 sur tous les bâtiments | (extracteurs identiques) | 46 min / 1,1 h | J91,5 / J103,5 | 7,1 % | 1,7 % / 2,2 % |

« Sans action J1–7 » de l'actif : 1 session sur 56 avant, 2 avec la plupart des variantes (le mur du second palier arrive plus tôt, §5.4).
La mesure est sensible à l'heure exacte où tombe une session (×2,8 et ×3 encadrent ×2,5 dans les deux sens).

## 5. Recommandation (appliquée)

### 5.1 Règles

Groupe `buildCost` (`BUILD_COST_RULES`, `buildings.ts`, registre des règles ; Admin → Règles → « Bâtiments : coût des niveaux 5 à 10 »,
aperçu avant / après du coût et de l'attente ; aussi dans « Tous les réglages (avancé) ») :

| Réglage | Défaut | Effet |
|:--|--:|:--|
| `enabled` | oui | décoché : coûts géométriques d'avant (×3,33 par niveau pour un extracteur) |
| `fromLevel` | 5 | premier niveau adouci ; le niveau d'avant (4) sert d'ancre |
| `maxGrowth` | 2,5 | croissance maximale du coût d'un niveau au suivant |
| `junctionMaxRatio` | 0 | 0 : sans jonction ; sinon un niveau coûte au moins le dernier niveau du premier palier ÷ ce nombre par niveau d'écart |
| `productionOnly` | oui | seulement les bâtiments de production (extracteurs) ; décoché : tous les bâtiments |

Formule (premier palier, niveau n ≥ `fromLevel`, chaque ressource) :
`coût(n) = min( coût d'avant(n) ; coût d'avant(fromLevel − 1) × maxGrowth^(n − fromLevel + 1) )` (avec la jonction :
`max(…, coût d'avant(L) ÷ junctionMaxRatio^(L − n))` avant le `min`). Le second palier (niveau 11 et plus) ne change pas.

Missions (contenu, Admin → Contenu → Missions ; migration `missions-premier-jour-6.14.167`) :

| Mission | Durée | Prérequis avant → après | Gain (inchangé) |
|:--|--:|:--|:--|
| Patrouille courte | 1 min | 2 drones (=) | ferraille : max(800 ; 1,5 × 1 min de production), 0,75 après la bascule |
| Patrouille du périmètre | 10 min | 30 roquettes → **10 roquettes** (celles de la prise en main) | ferraille : max(8 000 ; 1,5 × 10 min) |
| Collecte d'énergie | 15 min | 6 chasseurs, 2 frégates → **6 drones** | énergie : max(4 000 ; 1,5 × 15 min) |
| Forage profond | 30 min | 12 drones, 3 cargos → **8 drones** | ferraille : max(35 000 ; 1,5 × 30 min) |

Textes joueurs : changelog « Ta première journée » (6.14.167) ; Formules → Ascension et rythme : « coût des extracteurs : × 2,5 au
plus par niveau dès le niveau 5 ».

### 5.2 Avant / après (simulateur, `node scripts/progression-sim.mjs --base avant-s9 --rythme --courbes --recompenses --depart`)

Extracteur de ferraille :

| Niveau | Coût avant → après (ferraille) | Attente avant → après | Rentabilité avant → après | Durée (inchangée) |
|--:|:--|:--|:--|--:|
| 5 | 6 129 → **4 605** | 31 → **24 min** | 16 → 11 min | 3 min |
| 6 | 20 394 → **11 512** | 59 → **33 min** | 28 → 15 min | 5 min |
| 7 | 67 860 → **28 781** | 1,8 h → **46 min** | 55 → 22 min | 11 min |
| 8 | 225 800 → **71 953** | 3,3 h → **1,1 h** | 1,7 h → 30 min | 22 min |
| 9 | 751 332 → **179 882** | 6,2 h → **1,5 h** | 2,8 h → 36 min | 45 min |
| 10 | 2 499 999 → **449 707** | 10,7 h → **1,9 h** | 5 h → 46 min | 1 h 30 |
| 11 | 5 M (20 M après la bascule) : **inchangé** | 11 h (44 h) | 17,8 h (71 h) | 3 h (36 h) |

Rythme d'une journée (actif connecté en continu ; avant la bascule / après la bascule) :

| Mesure | Avant | Après |
|:--|:--|:--|
| J1 : plus long sans chantier ni recherche | 34 min / 1 h 56 | **23 min** / 2 h 15 (files pleines : niveaux 9 et 10 en 2 h 15 et 9 h) |
| J1 : plus long sans action utile, missions de 5 min et plus comprises | ≤ 10 min (sim. : prérequis non comptés) | **10 min** (Patrouille du périmètre, accessible dès les 10 roquettes) |
| J1, première heure : attentes de plus de 10 min | 0 / 0 | 0 / 0 |
| J1, de 2 à 4 h de jeu : attentes de plus de 10 min (plus longue) | 5 (18 min) / 5 (37 min) | 3 (18 min) / 6 (24 min) |
| J1 : temps où le coût freine / files pleines | 735 / 189 min | **184** / 739 min (avant la bascule) |
| J2 : plus long sans chantier ni recherche | 2 h / 3 h 30 | 1 h 50 / 5 h (files pleines) |
| J7 : plus long sans chantier ni recherche | 3 h 10 / 14 h 36 | 2 h 32 / 14 h 11 |

Actions utiles à chaque retour (et missions terminées), profil moyen (3 retours par jour), avant / après la bascule :

| Jour | Avant | Après |
|:--|:--|:--|
| J1 | 10, 10, 11 (3 missions) / 10, 9, 11 | 10, 10, 10 (4) / 10, 9, 8 (4) |
| J2 | 10, 10, 10 / 9, 8, 7 | 11, 10, 10 (4 à 9) / 10, 10, 9 (4 à 9) |
| J7 | 10, 3, 7 / **2**, 3, 4 | 10, 4, 6 (11) / **3**, 5, 3 (11) |

Rythme long terme (I29) :

| Profil | 1re Ascension avant la bascule | 1re Ascension après la bascule | Arbre complet (après) | Sans action J1–7 (après) | Pire mois bloqué (après) | Extracteurs J1 / J7 (après) |
|:--|:--|:--|:--|:--|:--|:--|
| actif | J11 → J11 | J93 → **J88,4** | J78,9 → J79,9 | 1,8 → **3,6 %** | 2,9 → 0,8 % | 8/8/8/8 → 9/9/9/9 ; 11 → 12/11/11/11 |
| moyen | J17,8 → J18,3 | J104 → **J98** | J92,1 → J92,9 | 0 → 0 % | 10 → 4,4 % | 4 → 4 ; 11/11/11/10 (=) |
| occasionnel | J46,3 → J46,3 | J132,5 (=) | J190,4 → J187,4 | 0 → 0 % | 5 → 0 % | 2 → 2 ; 6 (=) |
| quotidien | J32,3 → J31,3 | J121,5 (=) | J161,4 (=) | 0 → 0 % | 16,7 % (=) | 2 → 2 ; 8 (=) |

Bandes d'I29 tenues (actif J72–110, moyen J85–125, occasionnel J117–180, quotidien J99–150 ; avant la bascule J8–13, J15–23, J38–56,
J26–40), sauf « sans action la première semaine » de l'actif (2 sessions sur 56 au lieu d'une, §6, Q425). Extracteurs au niveau 10 :
actif 48 → 40 h, moyen 89 → 77 h, occasionnel 341 → 317 h, quotidien 245 → 221 h (après la bascule).

### 5.3 Ce qui change pour un joueur

- **Première heure** : inchangée jusqu'au niveau 4 (secondes) ; les niveaux 5 et 6 coûtent 25 % et 44 % de moins. Dès les 10 roquettes
  de la prise en main (vers la 27e minute), la Patrouille du périmètre (10 min) ; dès 6 et 8 drones, Collecte d'énergie (15 min) et
  Forage profond (30 min). Le « plus rien à lancer » de la 45e minute devient « relance une mission, l'extracteur suivant est à
  29 000 » (au lieu de 68 000).
- **Premier jour** : chaque niveau 7 à 10 d'extracteur s'achète en 45 min à 2 h de production au lieu de 2 à 11 h ; ce sont les durées
  (11 min à 1 h 30) qui rythment la journée, et une mission de 10 à 30 min comble l'attente avec un gain visible (7,5 à 15 min de
  production de ferraille par Patrouille du périmètre).
- **Première semaine** : extracteurs au niveau 10 6 à 24 h plus tôt selon le profil, puis le second palier comme avant (mêmes coûts,
  mêmes durées). Le joueur qui revient 3 fois par jour trouve 3 à 11 actions et 4 à 11 missions terminées à chaque retour.

### 5.4 Ce que ce lot ne règle pas

- Après 2 h de jeu continu (et toute la journée après la bascule), les **files pleines** freinent, pas le coût : un actif connecté
  16 h attend jusqu'à 2 h 15 un chantier (niveaux 9 et 10 après la bascule). Les missions donnent l'action toutes les 10 minutes ;
  des chantiers en plus ou des accélérations sont des options à part (D, E, Q428).
- Le **mur de ferraille du second palier** (J3,5 pour l'actif : 20 M de ferraille, nano et données en surplus) arrive plus tôt ; il
  vient de la répartition des coûts (F, Q429).

### 5.5 Comptes existants

- Rien n'est écrit en base : le coût est lu au lancement et payé ; une construction lancée garde son prix (`paid` de la file, remboursé
  tel quel à l'annulation) et sa fin. Personne ne perd rien ; un joueur qui a payé l'ancien prix n'est pas remboursé (Q430).
- Colonies : même fonction de coût, leurs extracteurs suivent la même pente.
- Missions : la migration `missions-premier-jour-6.14.167` (`cosmic_db.js`) ne remplace que les prérequis restés à la valeur livrée ;
  une mission réglée par l'admin garde les siens.

## 6. Invariants

- **I51 (nouveau)** : rythme du premier jour. Au premier palier des bâtiments de production, à partir de `buildCost.fromLevel`, le coût
  d'un niveau grandit d'au plus `maxGrowth` (×2,5) par niveau et ne dépasse jamais le coût d'avant ; les niveaux d'avant `fromLevel` et le
  second palier sont inchangés ; l'attente d'un niveau d'extracteur (ferraille des 4 extracteurs ÷ production du niveau d'avant) reste
  sous 2 h jusqu'au niveau 10 ; 10 roquettes et 8 drones ouvrent des missions de 10, 15 et 30 min ; au simulateur, avant et après la
  bascule, un actif connecté en continu le premier jour a une action utile (chantier, recherche ou mission de 5 min et plus) au moins
  toutes les 10 min et aucune attente de plus de 10 min la première heure ; un joueur qui revient 3 fois par jour trouve à chaque retour
  (J1, J2, J7) au moins 2 actions utiles et une mission terminée. `buildCost.enabled` à faux rend la pente d'avant. Test :
  `rythmePremierJour.test.ts`.
- **I29** : bornes inchangées, sauf la première semaine de l'actif après la bascule : moins de 4 % de sessions sans action (au plus 2
  sur 56) au lieu de moins de 2 %. Raison : avec la pente adoucie, l'actif atteint les dix niveaux de ses extracteurs 8 h plus tôt et
  attend une session de plus la ferraille du second palier à J3,5 ; ses mois bloqués baissent (pire mois 2,9 → 0,8 %), ceux du moyen
  aussi (10 → 4,4 %), et les trois autres profils restent à 0 % la première semaine. Test : `progressionSim.test.ts`.

## 7. Plan de lots

| Lot | Contenu | Taille | État |
|:--|:--|:--|:--|
| S9 | Pente adoucie (`buildCost`, admin avec aperçu), échelle des missions (contenu, migration), simulateur (`--rythme`, `--courbes`, `activeWindows`, `pace`), Formules, invariant I51, I29 ajusté, docs | M | livré (6.14.167) |
| S10 | Parcours joué (1 h au plus) sur la pré-prod : vérifier le creux de la 45e minute, les missions du premier jour et l'attente du niveau 7 et 8 | S | à faire (avec l'étape 1 du plan) |
| — | Options D, E, F (chantiers en plus, accélérations, coûts sur les quatre ressources) | M à L | après la mise en production (Q428, Q429) |

## 8. Questions (option recommandée appliquée, règle n° 3)

| N° | Question | Choix fait | Autre option | Revenir en arrière |
|:--|:--|:--|:--|:--|
| Q425 | Pente ×2,5 (demande, attente du niveau 8 à 1,1 h) avec la borne d'I29 « première semaine de l'actif » relâchée à 4 % (2 sessions sur 56), ou ×3 (tient l'ancienne borne, niveau 8 à 2,2 h) ? | **×2,5** et borne à 4 % : le gain du premier jour est deux fois plus grand ; la session de plus tombe au mur du second palier (J3,5), pas au premier jour ; les mois bloqués baissent pour l'actif et le moyen | ×3 et borne < 2 % | Règles → « Bâtiments : coût des niveaux 5 à 10 » → `maxGrowth` 3 ; borne dans `progressionSim.test.ts` |
| Q426 | Pente sur les seuls extracteurs, ou sur tous les bâtiments (hangars, Atelier, Cale sèche) ? | **extracteurs seuls** : ce sont eux qui font attendre ; « tous » double les sessions sans action de l'actif en semaine 1 (7,1 %) | tous les bâtiments | case « Seulement les bâtiments de production » |
| Q427 | Missions courtes : abaisser les prérequis de trois missions existantes, ou en créer de nouvelles ? | **existantes** : aucun nouveau système (décision du 2026-10-09), gains déjà indexés sur la production ; 10 roquettes et 6 à 8 drones, ce que la prise en main fait construire | nouvelles missions « du débutant » (contenu, Codex, succès) | Admin → Contenu → Missions (prérequis) |
| Q428 | Attentes « files pleines » après 2 h de jeu continu (et après la bascule) : chantiers en plus ou accélérations gagnées ? | **rien dans ce lot** : on mesure d'abord au parcours joué (S10) ; une option touche I29, l'autre est un nouveau système | 7e chantier (`economy.buildSlotsBase`) ou accélérations offertes par les missions | — |
| Q429 | Nano et données dans les coûts des extracteurs (mur de ferraille de J3,5, NJ-5 structurel) ? | **proposition à part, après la mise en production** : touche le second palier et I29 | maintenant | — |
| Q430 | Rembourser la différence aux comptes qui ont payé les niveaux 5 à 10 à l'ancien prix ? | **non** : la pré-prod est une copie de test et la production partira d'un nouvel univers (étape 2 du plan) ; rien n'est retiré à personne | crédit de la différence au déploiement | — |
