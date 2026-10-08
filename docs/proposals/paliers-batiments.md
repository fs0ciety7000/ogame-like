# Proposition : paliers des bâtiments (entrepôt, Atelier, hangars) et règle n° 4 réécrite

Statut : **validée** (2026-10-08, option D et PB-Q1 à PB-Q8 validées sur `/decisions`, Q336 à Q343) ; lots PB-L0 à PB-L5 dans la feuille d'automne 2030 (6.14.134, fiche [`docs/changes/6.14.134-proposition-paliers-batiments.md`](../changes/6.14.134-proposition-paliers-batiments.md)).
Lot AJ27-12 de la feuille de route `feuille-de-route-2030-automne.md` (lot 63), constat AJ-12 de la revue AU27
(`docs/audit/2026-10-07-au27-jeu-chaine.md`). Les questions PB-Q1 à PB-Q8 (§8) sont tranchées : options recommandées retenues.

## 1. Constat

- Règle de conception n° 4 du GDD (§5) : « un bâtiment gagne un effet nouveau aux niveaux 5, 10, 15, 20, pas seulement +x % ».
  Elle s'applique à **2 bâtiments sur 13** : la Cale sèche (`DOCK_TIERS`, `buildings.ts`) et la Fonderie quantique (chantiers en plus aux
  niveaux 5 et 10, `BUILD_SLOT_BONUS_LEVELS`, `buildPlan.ts`). `VISUAL_TIERS` (5, 10, 15, 20) ne change que l'image.
- Vu par le joueur : l'entrepôt, l'Atelier et les deux hangars donnent « un peu plus » à chaque niveau, sur 20 niveaux. Aucun niveau ne
  se vise pour ce qu'il ouvre. Depuis la bascule du rythme (1er novembre 2026, 6.14.88), un niveau du second palier dure de 36 h à 11 jours :
  le joueur attend des semaines entre deux nouveautés de ses bâtiments.
- La revue AU27 demande soit des paliers pour l'entrepôt, l'Atelier et les hangars, soit la réécriture de la règle (« corriger plutôt
  qu'empiler »).

## 2. Diagnostic

### 2.1 Ce que donnent les bâtiments à chaque palier aujourd'hui

| Bâtiment | Niv. 5 | Niv. 10 | Niv. 15 | Niv. 20 | Effet nouveau ? |
|:--|:--|:--|:--|:--|:--|
| Entrepôt (capacité par ressource commune, 2 M × 1,6^niv.) | 21 M | 220 M | 2,3 Md | 24,2 Md | non : courbe seule. Abri : 10 % de la capacité, au plus 8 h de production (plancher 500 k) |
| Atelier (sauvetage ; cadence 30 PV/s × (1 + 0,25 × (niv. − 1))) | 25 % ; 60 PV/s | 50 % ; 97,5 PV/s | 60 % ; 135 PV/s | 70 % ; 172,5 PV/s | **de fait au 5** : la Cale sèche se débloque à Atelier 5 (`requires`), sans que la carte de l'Atelier le montre |
| Hangar d'attaque (2 000 places par niveau) | 10 000 | 20 000 | 30 000 | 40 000 | non |
| Hangar de défense (2 000 places ; bouclier 0,75 %/niv., `combat.shieldPerLevel`) | 10 000 ; 3,75 % | 20 000 ; 7,5 % | 30 000 ; 11,25 % | 40 000 ; 15 % | non (le bouclier plafonne à 15 % pile au 20) |
| Cale sèche | Triage | Remise automatique, Atelier +10 % | Priorités | Cale orbitale (+5 points de sauvetage) | **oui** |
| Fonderie quantique (10 niveaux) | +1 chantier | +1 chantier | — | — | **oui** (5 et 10) |
| 4 extracteurs, Fonderie (production), Synthétiseur, Générateur de bouclier, Labo de synthèse | courbe | courbe | courbe | courbe | non |

Écarts à la règle n° 2 relevés au passage : `BUILD_SLOT_BONUS_LEVELS = [5, 10]` est une constante du code, pas un réglage de l'admin
(les niveaux de la file planifiée, eux, sont dans `BUILD_PLAN_RULES.slotLevels`). `DOCK_TIERS` est réglable (6.14.95).

### 2.2 Quand le joueur atteint les paliers (simulateur de progression, règles d'après la bascule, 365 jours)

Mesure faite par une copie instrumentée du simulateur (`progressionSim.ts`, lecture seule, scratchpad), mêmes règles que
`node scripts/progression-sim.mjs --bascule --prestige --ascend --days 365`. Jour où le bâtiment atteint le niveau, premier cycle :

| Profil | Entrepôt 5 / 10 / 15 / 20 | Atelier 5 / 10 / 15 / 20 | Hangars 5 / 10 / 15 / 20 | 1re Ascension |
|:--|:--|:--|:--|:--|
| Actif | J0,9 / J1,9 / J36,5 / J85,4 | J0,6 / J1,8 / J37,5 / J91,4 | J1,8 / J2,6 / J31,5 à 34,3 / J87,1 à 90,9 | J91,5 |
| Moyen | J1,4 / J3,9 / J33,8 / J90 | J1,4 / J3,7 / J41,5 / J103 | J6,4 / J7,9 / J37,3 à 39,8 / J94,5 à 96 | J103,3 |
| Quotidien | J3,9 / J11,9 / J33,8 / J86,5 | J3,9 / J11 / J53,8 / J121,5 | J14,9 / J19,9 / J49,8 à 53,8 / J113,5 à 118,5 | J121,8 |
| Occasionnel | J4,9 / J18,9 / J42,8 / J94,5 | J4,9 / J16 / J57,8 / J129,5 | J21,9 / J28,9 / J63,8 / J132,5 | J132,8 |

Ce qu'on en tire :

1. **Les paliers 5 et 10 tombent dans la première ou les trois premières semaines**, les paliers 15 entre J31 et J64, les paliers 20
   juste avant l'Ascension (8 bâtiments au niveau 20 sont exigés). Le premier palier de coûts (niveaux 1 à 10) dure des heures, le second
   des mois (36 h + 27 h par niveau).
2. **Plus longue période sans effet nouveau d'un bâtiment avant la 1re Ascension** (paliers de la Cale sèche et de la Fonderie) :
   **30 / 33 / 36 / 39 jours** (actif, moyen, quotidien, occasionnel). Avec des paliers à l'entrepôt, l'Atelier et aux hangars :
   **29 / 24 / 20 / 22 jours**.
3. L'entrepôt et l'Atelier repartent au niveau 1 à chaque Ascension (`keptOnAscension`) : leurs paliers se rejouent à chaque cycle
   (16 paliers des 4 bâtiments avant la 1re Ascension, 54 sur l'année pour l'actif). Les hangars sont gardés : leurs paliers sont acquis
   une fois pour toutes.
4. Les extracteurs sont la courbe d'économie calée par I29 (production, production perdue, sessions bloquées) : un effet de palier sur
   la production déplacerait toutes les bornes. Leurs niveaux 20 ont déjà un succès propre (6.14.129, « Maître », niveau 20).

### 2.3 Causes, de la plus sûre à la plus douteuse

1. La règle n° 4 a été écrite pour la Cale sèche (5.28, `WORKFLOW.md` §4.2) et généralisée à tous les bâtiments sans lot pour les autres
   (preuve : tableau 2.1, seuls la Cale et la Fonderie ont des paliers).
2. Elle ne distingue pas les bâtiments **de système** (une capacité ou un service : entrepôt, Atelier, hangars, Cale, Fonderie) des
   bâtiments **de courbe** (production, bouclier, capsules) : pour ces derniers, un palier d'effet heurte l'équilibre (I29, plafonds
   d'effets) sans rendre la page plus lisible.
3. La bascule du rythme a étiré le second palier de coûts : 15 et 20 sont désormais à des semaines d'écart, ce qui rend chaque palier
   plus précieux qu'au moment où la règle a été écrite.

## 3. Benchmark

| Question | OGame | Clash of Clans | Boom Beach | Rise of Kingdoms, Lords Mobile |
|:--|:--|:--|:--|:--|
| Effet par niveau | courbes pures (production, capacité des hangars de stockage) | réservoirs et camps d'armée : capacité linéaire par niveau | réservoirs linéaires ; le **coffre** protège une part des ressources qui monte avec son niveau | entrepôts, hôpital : capacité linéaire |
| Nouveauté qualitative | par **prérequis** : un niveau ouvre un bâtiment ou un vaisseau (usine de robots → usine de nanites, chantier spatial) | par **l'hôtel de ville** : chaque niveau relève les plafonds de tous les bâtiments et ouvre bâtiments et troupes ; l'hôtel de ville haut a son arme propre (signature) | par le **QG** ; spécialisation par les **statues** (le joueur choisit ses bonus) | par le **palais** : files de marche, bâtiments et troupes débloqués à des niveaux fixes |
| Choix du joueur | aucun | aucun dans les bâtiments | statues | talents des commandants |
| Lisibilité | prérequis listés sur la fiche | « disponible à l'HdV n » sur chaque carte | idem | « débloqué au palais n » |

Retenu :

- Aucun jeu de référence ne donne un effet nouveau à **chaque** bâtiment tous les 5 niveaux : stockage et capacité restent linéaires, la
  nouveauté se concentre dans quelques bâtiments de système et dans les prérequis. Notre règle n° 4 est plus ambitieuse que les jeux
  qu'elle cite : la garder telle quelle pour les extracteurs n'a pas de modèle.
- La protection des ressources par paliers (Boom Beach) et la file qui attend quand le camp est plein (Clash of Clans, `WORKFLOW.md` §3)
  sont des effets lisibles, déjà attendus par les joueurs du genre.
- La **spécialisation par choix** (statues de Boom Beach) donne un vrai palier « 15 » au sens du §4.2 de `WORKFLOW.md`.

## 4. Options

### 4.1 Options comparées

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| A. **Paliers d'effet pour tous les bâtiments** (règle n° 4 gardée telle quelle) | la règle devient vraie partout | 13 bâtiments × 4 paliers, dont des effets de production aux extracteurs | les extracteurs portent l'équilibre d'I29 : chaque effet de production déplace la 1re Ascension et la production perdue ; 8 bâtiments à 10 niveaux n'ont pas de palier 15 ni 20 |
| B. **Bonds chiffrés aux paliers** (entrepôt +25 % de capacité par palier, hangars +10 % de places, Atelier +2 points de sauvetage) | des niveaux à viser, code simple | c'est encore du « +x % » (la règle n'est pas remplie) | **I29 cassé** (§4.2) : l'actif a 5 jours sans dépense dans un mois (borne 3), le quotidien 23,3 % de sessions bloquées (borne 20 %) ; sauvetage relevé alors que l'audit E2 le juge déjà haut |
| C. **Règle réécrite seule** : paliers = jalons visuels et succès, aucun effet nouveau | la règle redevient vraie sans code | docs seulement | la boucle « session » garde ses 30 à 39 jours sans nouveauté (§2.2) |
| D. **Deux familles de bâtiments** (recommandée) : règle réécrite (bâtiments de système à paliers, bâtiments de courbe à jalons), et paliers d'effet pour l'entrepôt, l'Atelier et les deux hangars | règle vraie partout ; 16 effets nouveaux là où ils ont un sens ; plus longue attente sans nouveauté ramenée à 20 à 29 jours | 4 lots moteur et interface (§7) | interface plus chargée (§9) ; deux effets touchent le JcJ (abri, défenses reconstruites), à mesurer par `pvpBudget` au lot |

### 4.2 Effet simulé (365 jours, 4 profils, règles d'après la bascule, projets de prestige, Ascension dès que possible)

Seuls les effets de l'entrepôt entrent dans le modèle (production, entrepôt, comptoir). Combat, Atelier, hangars et pillage sont hors
modèle : leurs paliers ne changent rien aux mesures d'I29.

| Mesure (actif / moyen / occasionnel / quotidien) | Aujourd'hui | D, tampon 2 h (recommandée) | D, tampon 4 h | D, tampon 4 h et trop-plein converti en rares au 20 | B (+25 % de capacité par palier) | Borne I29 |
|:--|:--|:--|:--|:--|:--|:--|
| 1re Ascension | J91,5 / J103,3 / J132,8 / J121,8 | identique | identique | identique | J91,5 / J103,3 / **J135,8** / J122,8 | actif J72–110, moyen J85–125, occasionnel J117–180, quotidien J99–150 |
| Production perdue (année) | 7,2 / 2,7 / 13,6 / 14,1 % | 7,0 / 2,5 / 13,4 / 13,8 % | 6,8 / 2,1 / 13,1 / 13,5 % | 6,8 / 2,1 / 10,9 / 11,5 % | 0,5 / 0,1 / 2,1 / 2,0 % | ≤ 15 % |
| Sessions bloquées, pire mois | 1,7 / 13,3 / 5 / 16,7 % | identique | 1,7 / 15,6 / 5 / 20 % | 1,7 / 15,6 / 10 / **26,7 %** | 3,8 / 15,6 / 5 / **23,3 %** | ≤ 15 %, un mois par profil ≤ 20 % |
| Jours sans dépense, pire mois | 0 / 2 / 2 / 1 | identique | identique | identique | **5** / 3 / 3 / 2 | ≤ 3 (4 pour l'occasionnel) |
| Jours « fini, sans suite » ; sans action J1–7 | 0 ; 0 % | identique | identique | identique | identique | 0 ; < 2 % |

Lecture : le tampon de 2 h ne bouge aucune borne et rend 0,2 à 0,3 point de production. À 4 h, le moyen et le quotidien consomment leur
mois toléré (bruit du modèle : ± 3 sessions par mois). La conversion du trop-plein et l'option B sortent d'I29. Le « Négoce » du palier 15
(taxe du comptoir 5 → 3 %) ne change rien de mesurable : le comptoir garde les mêmes volumes (plafond hebdomadaire de 30 M, I33). Garder
25 % des rares à l'Ascension (idée de signature écartée) ne change rien non plus : le joueur modélisé dépense ses rares avant.

## 5. Recommandation (option D, à valider)

### 5.1 Règle n° 4 réécrite (GDD §5, `WORKFLOW.md` §4.1 et §4.2)

> **4. Paliers lisibles.** Un bâtiment **de système** (une capacité ou un service : entrepôt, Atelier, hangars, Cale sèche, Fonderie
> quantique, et tout bâtiment de système ajouté) gagne un effet nouveau à chaque palier : niveaux 5, 10, 15 et 20 par défaut (5 et 10 pour
> un bâtiment à 10 niveaux), réglables dans l'admin. Rôle de chaque palier : choix (5), confort (10), spécialisation (15), signature (20).
> Un bâtiment **de courbe** (production, bouclier, capsules) suit sa courbe : ses paliers sont des **jalons** (image du palier, succès,
> Codex), jamais un bond de production. Un nouveau bâtiment déclare sa famille.

### 5.2 Entrepôt (repart au niveau 1 à l'Ascension : paliers rejoués à chaque cycle)

| Palier | Effet | Réglages (défaut) |
|:--|:--|:--|
| 5 · Choix | **Ressource prioritaire** : tu choisis une ressource commune, son abri passe de 8 h à 12 h de production (toujours sous la règle de capacité). Choix modifiable une fois par 24 h | `buildingTiers.storage.priorityShelterHours` (4), `choiceCooldownHours` (24) |
| 10 · Confort | **Tampon** : quand l'entrepôt est plein, la production en trop est gardée jusqu'à 2 h, puis versée dès que la place se libère. Jauge « Tampon : 1 h 40 en attente » sur la page Ressources | `bufferHours` (2) |
| 15 · Spécialisation | au choix : **Négoce** (taxe du comptoir −2 points, sous le plafond hebdomadaire I33) ou **Convoi** (soute des cargos +10 %) | `tradeTaxCut` (0,02), `convoyCargo` (0,1) |
| 20 · Signature | **Entrepôt orbital** : abri de 12 h de production pour les 4 ressources (ressource prioritaire : 16 h) | `orbitalShelterHours` (4) |

Texte joueur (palier 10) : « Entrepôt plein ? Ton tampon garde 2 h de production et la verse dès que tu fais de la place. »

### 5.3 Atelier de réparation (repart au niveau 1 à l'Ascension)

| Palier | Effet | Réglages (défaut) |
|:--|:--|:--|
| 5 · Choix | **Cale sèche ouverte** (règle actuelle, `requires`), désormais affichée comme palier sur la carte de l'Atelier : réparer ou démanteler (Triage de la Cale) | aucun nouveau |
| 10 · Confort | **Premiers soins** : un lot de 15 min de réparation ou moins rentre aussitôt | `buildingTiers.workshop.instantBelowSeconds` (900) |
| 15 · Spécialisation | **Atelier spécialisé** : tu choisis une classe (Faible, Moyen, Fort, Soutien), réparée 50 % plus vite. Modifiable une fois par 24 h | `classSpeed` (0,5) |
| 20 · Signature | **Réparation d'urgence** : une accélération gratuite par jour, jusqu'à 2 h de réparation (12 Ambre au tarif actuel) | `freeRushPerDay` (1), `freeRushSeconds` (7 200) |

Le sauvetage ne monte pas (audit E2 : déjà 70 % au niveau 20, plafond global 85 %).

### 5.4 Hangars d'attaque et de défense (gardés à l'Ascension : paliers acquis une fois)

| Palier | Hangar d'attaque | Hangar de défense | Réglages (défaut) |
|:--|:--|:--|:--|
| 5 · Choix | **Baies modulaires** : tu prêtes jusqu'à 10 % des places de ce hangar à l'autre. Un prêt ou sa reprise qui mettrait un hangar en surcharge est refusé | idem | `buildingTiers.hangar.lendShare` (0,1) |
| 10 · Confort | **File d'attente** : une commande au-delà de la place libre attend dans la file (payée à la commande) et démarre dès qu'une place se libère, comme les camps de Clash of Clans | idem | `waitingQueueMax` (5 commandes) |
| 15 · Spécialisation | au choix : **Pont d'envol** (temps de construction des vaisseaux −10 %) ou **Réacteurs** (temps de vol −10 %) | au choix : **Tourelles en série** (temps des défenses −10 %) ou **Entretien réduit** (énergie des défenses −20 %) | `specUnitTime` (0,1), `specFleetSpeed` (0,1), `specUpkeep` (0,2) |
| 20 · Signature | **Pont de lancement** : +1 emplacement de flotte (10 → 11) | **Casemates** : défenses reconstruites après un combat 60 → 70 % (référence OGame : 70 %) | `fleetSlots` (1), `defenseRebuildBonus` (0,1) |

### 5.5 Règles communes

- **Tout chiffre est un réglage** : groupe `buildingTiers` du registre (`ruleRegistry.ts`), section dédiée « Bâtiments : paliers » dans
  Admin → Règles, niveaux des paliers compris (`levels: [5, 10, 15, 20]` par bâtiment). `BUILD_SLOT_BONUS_LEVELS` y entre aussi
  (écart à la règle n° 2 relevé au §2.1). `DOCK_TIERS` reste où il est (déjà réglable).
- **Circuit d'effets** : chaque palier chiffré passe par une source « bâtiment » du circuit (`empireEffects`) et reste sous les plafonds
  (`unitTime`, `fleetSpeed`, `fleetUpkeep` et `tradeTax` : 50 % en couche empire) ; `derived.test.ts` et
  `effectsRead.test.ts` le vérifient.
- **Niveau effectif** : un bâtiment verrouillé n'a aucun palier (`effectiveBuildingLevel`). Un palier atteint par un chantier en cours
  compte à la fin du chantier.
- **Choix** : nouveau champ joueur `buildingChoices` (`GAME_FIELDS`, `PlayerState`, `pb_schema.json`), action serveur
  `setBuildingChoice` (exportée par `hooksEntry.ts`), délai de 24 h entre deux changements. Sans choix fait, le palier « choix » ou
  « spécialisation » n'a pas d'effet et la carte affiche « À choisir » (`HudCallout`).
- **Interface** : carte du bâtiment, ligne « Paliers » (4 `HudChip`, atteint / prochain / verrouillé, niveau et nom), « Prochain palier :
  niv. 15 · Spécialisation » sous le bouton d'amélioration ; Codex (fiche du bâtiment) ; Formules ; Ctrl+K (« palier », nom du palier).
  Le menu progressif (I30) n'est pas touché : la carte n'affiche un choix qu'une fois le palier atteint.

### 5.6 Comptes existants (rien n'est retiré)

- Aucune donnée réécrite : les paliers se lisent sur le niveau actuel. Un joueur déjà au-dessus d'un palier le reçoit au déploiement.
- Les choix commencent vides (aucun effet imposé) ; la première sélection est libre, sans délai.
- File d'attente des hangars : les files en cours ne changent pas ; seules les nouvelles commandes peuvent attendre.
- Baies modulaires : rien n'est prêté d'office ; aucune surcharge créée (I4).
- Contenu personnalisé : un serveur dont l'admin a modifié les bâtiments garde ses bâtiments ; le groupe `buildingTiers` vise les
  bâtiments par leur effet (`storage`, `repair`, `hangar`), comme `dockLevel`, pas par leur identifiant.

## 6. Invariants

| # | Changement | Test |
|:--|:--|:--|
| I2 | réécrit au lot des hangars : « file du chantier » = commandes **démarrées** ; une commande en attente (palier 10) ne prend sa place qu'à son démarrage, toujours sous la capacité | `actions.test.ts`, `caleSeche.test.ts` |
| I4, I5 | inchangés : les baies modulaires sont calculées dans `playerUnitCapacity` (seul calcul de capacité) ; un prêt qui créerait une surcharge est refusé | `caleSeche.test.ts` (I5) |
| I9 | inchangé : chaque stat de palier est lue dans la couche empire | `effectsRead.test.ts` |
| I29 | bornes inchangées ; le simulateur gagne le tampon de l'entrepôt (seul palier dans son modèle) | `progressionSim.test.ts` |
| I44 (nouveau, numéro à confirmer au lot) | Paliers des bâtiments : un effet de palier vient du niveau **effectif** et du choix du joueur, passe par le circuit d'effets, reste sous les plafonds ; un changement de choix au plus toutes les `choiceCooldownHours` ; aucun changement de choix ni de réglage ne détruit d'unité ni de ressource ; un bâtiment de courbe n'a que des jalons | `paliersBatiments.test.ts` |

## 7. Plan de lots (après validation)

| Lot | Contenu | Taille |
|:--|:--|:--|
| PB-L0 | Docs : règle n° 4 réécrite (GDD §5, `WORKFLOW.md` §4.1 et §4.2, fiches `batiments.md`, `atelier-cale-seche.md`, `unites-hangars.md`, `economie.md`) ; Atelier 5 → Cale sèche affiché comme palier dans la fiche | S |
| PB-L1 | Moteur commun : groupe `buildingTiers` (registre, section d'admin, `BUILD_SLOT_BONUS_LEVELS` dedans), source « bâtiment » du circuit d'effets, `buildingTier(player, effet, palier)`, champ `buildingChoices` (schéma), action `setBuildingChoice` (serveur, `hooksEntry.ts`), ligne « Paliers » des cartes (Cale et Fonderie comprises) ; I44 et ses tests | M |
| PB-L2 | Entrepôt : ressource prioritaire, tampon (production, rattrapage hors ligne `flushState`, jauge), Négoce ou Convoi, entrepôt orbital ; carte « Ce que tu risques » ; option du tampon dans `progressionSim.ts` (I29 mesuré) | M |
| PB-L3 | Atelier : premiers soins, atelier spécialisé, réparation d'urgence gratuite (Journal, compteur du jour) | M |
| PB-L4 | Hangars : baies modulaires, file d'attente (I2 réécrit, `buildUnits`, tâche de démarrage), spécialisations, +1 emplacement de flotte, Casemates ; seuils JcJ mesurés par `pvpBudget` (défenses seules ≥ ×2) | L |
| PB-L5 | Chaîne de contenu : succès « Architecte » (les 4 paliers 20 de système) et « Bâtisseur avisé » (un choix fait à chaque palier 15), Codex, Formules, Ctrl+K, changelog, billet, prompts d'images des paliers 15 et 20 (`tierImages`, `illustrations.json`) ; essai sur la pré-prod | S |

Chaque lot passe par la pré-prod avant la production. Aucune migration de données joueurs (§5.6).

## 8. Questions à trancher (option recommandée en premier)

| # | Question | Recommandé | Autres options |
|:--|:--|:--|:--|
| PB-Q1 | Quelle option ? | **D** : deux familles, paliers pour l'entrepôt, l'Atelier et les hangars | A (tous les bâtiments), B (bonds chiffrés, sort d'I29), C (règle réécrite seule) |
| PB-Q2 | Tampon de l'entrepôt (palier 10) | **2 h** : aucune borne d'I29 ne bouge | 4 h (moyen 15,6 %, quotidien 20 % de sessions bloquées : mois tolérés consommés) |
| PB-Q3 | Signature de l'entrepôt (palier 20) | **abri 12 h** pour les 4 ressources | trop-plein converti en rares au taux du comptoir (quotidien 26,7 % de sessions bloquées : hors I29) |
| PB-Q4 | Signature de l'Atelier (palier 20) | **une accélération gratuite de 2 h par jour** | +5 points de sauvetage (audit E2, plafond de 85 % atteint plus tôt) |
| PB-Q5 | Signature du hangar de défense (palier 20) | **défenses reconstruites 70 %** (à mesurer par `pvpBudget` au lot PB-L4) | +1 point de bouclier au-delà de 15 % |
| PB-Q6 | Confort des hangars (palier 10) | **file d'attente** (I2 réécrit) | entretien −15 % de la catégorie (simple, mais encore un « +x % ») |
| PB-Q7 | Changer un choix (palier 5 ou 15) | **gratuit, une fois par 24 h** | à volonté ; payant en Ambre |
| PB-Q8 | Niveaux des paliers | **5, 10, 15, 20 réglables** (avec la Cale et la Fonderie, 20 à 29 jours au plus sans nouveauté) | décalés vers le second palier de coûts (5, 10, 13, 16, 20) pour couper l'attente entre 15 et 20 (45 à 48 jours pour ces 4 bâtiments) |

## 9. Risques

- **Interface** : 16 effets et 4 choix de plus. Parade : un choix n'apparaît qu'au palier atteint, une seule ligne « Paliers » par carte,
  rien dans la barre latérale (pas de nouvelle pastille).
- **JcJ** : l'abri à 12 h (16 h pour la ressource prioritaire) réduit le butin contre un joueur proche de l'Ascension ; les défenses à 70 %
  rendent la défense moins chère à tenir. À mesurer au lot (seuils de `pvpBudget`, butin moyen de la santé de l'équilibre).
- **Ambre** : la réparation gratuite retire au plus 12 Ambre de dépense par jour et par joueur à l'Atelier 20.
- **Modèle** : le simulateur ignore combat, Atelier et hangars ; les effets hors modèle se suivent après la mise en production
  (santé de l'équilibre : réparations accélérées, surcharges des hangars, files en attente).
- **Hors ligne** : le tampon doit se remplir et se vider dans le rattrapage (`flushState`), pas seulement en session : test dédié.
- **goja** : pas d'`Intl` ni de `localeCompare` dans les textes de palier (garde `serverSafe.test.ts`).
