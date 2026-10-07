# Proposition : équilibrage du jeu complet (AU27)

Statut : **en cours**. Lots AE-L0 (6.14.71, `docs/changes/6.14.71-proposition-equilibrage.md`) et AE-L1 (6.14.72,
`docs/changes/6.14.72-reglages-surs.md`) livrés ; AE-L2 à AE-L7 dans la feuille de route d'automne 2030.
Source : audit `docs/audit/2026-10-07-au27-equilibrage.md` (constats AE-1 à AE-17). Décisions : Q97 à Q103 de `docs/QUESTIONS.md`
(questions AE-Q1 à AE-Q7), **validées** par l'utilisateur le 2026-10-07 : les options recommandées s'appliquent.
Méthode : `docs/WORKFLOW.md` §2. Outil : `node scripts/progression-sim.mjs` (simulateur versé dans le dépôt par AE-L0).

## 1. Constat

Le jeu doit être « ni trop facile, ni trop compliqué ». Ce que vivent les joueurs, d'après la copie de la production (Z1, 14 actifs) :

> Un joueur a fait son Ascension **après 9 jours**. La boucle « méta » du GDD (§2) devait durer plusieurs mois.

> L'attaquant gagne **74 %** des combats JcJ (cible : 55 à 65 %), et **86 %** des joueurs sont pillables.

> Le coffre du 7e jour arrive avec **≈ 650 M** de ressources communes, 400 fois l'entrepôt d'un joueur de la première semaine.

## 2. Diagnostic

Preuve : simulateur de progression (`src/game/balance/progressionSim.ts`, profils actif, moyen, occasionnel, quotidien sur 90 jours) et
combats à budget égal (`src/game/balance/pvpBudget.ts`). Mesures sur les règles d'avant AE-L1 (`node scripts/progression-sim.mjs
--base avant-ae-l1`) :

| Repère | Actif | Moyen | Occasionnel | Quotidien | Cible |
|:--|:--|:--|:--|:--|:--|
| 1re Ascension possible | J10,3 | J18 | J46,3 | J32,3 | J35–50 / J60–90 / > J120 |
| Arbre de recherche complet (288 niveaux) | J14,9 | J30,9 | > J90 | J75,4 | > J60 pour l'actif |
| Production perdue (entrepôt plein), cumul à J90 | 70,6 % | 60,9 % | 41 % | 56,7 % | < 20 % |
| Part des missions dans les gains (J14+) | 35,4 % | 16,9 % | 3,6 % | 5,5 % | 15 à 25 % |
| Coffre du 7e jour, en heures de production | 11 h | 28,9 h | jamais | **465 h** | 8 à 16 h |

Causes, de la plus sûre à la plus douteuse :

| # | Cause | Preuve | Constats |
|:--|:--|:--|:--|
| D1 | **Coffre du 7e jour fixe** (45 M à 280 M par ressource commune), sans lien avec la production ni l'entrepôt | `STREAK_RULES.chest.common` (`streak.ts`) ; quotidien : 182 M de stock pour 21 M d'entrepôt après le coffre, 96 % de production perdue à J14 | AE-3, AE-14 |
| D2 | **Le défenseur mixte perd à budget égal** : vaisseaux à quai à 50 %, bonus à domicile +15 % ; l'attaquant gagne dès 0,75 fois la dépense du défenseur et perd 23 % de sa flotte pour 93 % au défenseur | `COMBAT_RULES.homeFleetDefenseFactor`, `homeDefenseBonus` (`combat.ts`) ; `attackerWinThreshold("mixed")` = 0,75 | AE-6 |
| D3 | **Frappes répétées** : bouclier de 1 h après une défaite, plus court que le délai de 2 h entre deux attaques d'un même joueur | `PVP_RULES.shieldAfterDefeatMs` (`pvp.ts`) | AE-7 |
| D4 | **Bas du classement attaquable** : la médiane d'XP (19 539) attaque le premier quartile (1 730, ×11,3), sous le refus fixé à ×12 | `PVP_RULES.hardXpRatio` ; Z1 | AE-8 |
| D5 | **Fin de partie en deux semaines** : le second palier des bâtiments (niveaux 11 à 20) coûte 3 à 10 h de production ; la production commune grimpe de ×1,8 par niveau jusqu'au 10 | `upgrade.tier2` (`buildings.ts`) ; variantes G, H, I du rapport | AE-1, AE-12 |
| D6 | **Le comptoir annule la rareté** (1 rare pour 100 communes, sans plafond) | `EXCHANGE_RULES.commonToRare` ; sans comptoir, Ascension de l'actif J10 → J17 | AE-2 |
| D7 | **Missions trop rentables** (1,5 × durée × production) | `ECONOMY_RULES.missionProductionMultiplier`, `missionRareProductionRef` | AE-4 |
| D8 | Lune triviale, boss faciles, Ambre en inflation, menu chargé à J1, boule de neige du début | rapport AU27 §4 | AE-9, 10, 11, 13, 15 |

## 3. Benchmark

| Question | OGame | Clash of Clans | Jeux de gestion mobiles |
|:--|:--|:--|:--|
| Que perd le défenseur, et quand le sait-il ? | défenses reconstruites à 70 %, flotte à quai engagée en entier ; rapport d'espionnage avant l'attaque | ressources pillées à un plafond par attaque, rien de détruit pour de bon | blessés à l'hôpital, morts au-delà de sa capacité |
| Frappes répétées | règle « bash » : 6 attaques au plus par 24 h sur une même planète | **bouclier de 12 à 16 h** selon les dégâts subis | bouclier payant ou gagné, « paix » après une défaite |
| Protection des petits | protection des débutants par écart de points (×5) | matchmaking par trophées, pas de cible choisie | puissance de la cible visible, écart borné |
| Récompense de connexion | aucune | bonus d'étoiles du jour, indexé sur l'hôtel de ville | calendrier de connexion, quelques heures d'accélérateurs |
| Rythme de la fin de partie | des mois (coûts ×2 par niveau, sans plafond) | des mois par hôtel de ville (plafonds par palier) | des mois (murs de ressources rares, VIP) |

Ce qu'on retient : le bouclier après une défaite dure plus longtemps que le délai entre deux attaques ; une récompense de connexion se
compte en heures de production ; la défense chez soi a l'avantage à dépense égale ; le haut niveau coûte des semaines, pas des heures.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| **A. Réglages sûrs seuls** (AE-L1) : coffre [2 M, 12 M], vaisseaux à quai 75 %, bonus à domicile +25 %, bouclier 3 h, écart d'XP ×10 | D1 à D4 tout de suite, sans moteur | une ligne de code par réglage, une migration des règles enregistrées | moins de JcJ sur un petit serveur (Q100) ; raids de faction un peu plus souvent repoussés |
| **B. A + second palier ×4 et comptoir 1 pour 250** (AE-L2) | D5 et D6 : Ascension J42 / J59 / > J90 (mesure ci-dessous) | annonce une semaine avant, migration du contenu des bâtiments non modifiés | 44 % de sessions sans action pour l'actif de J8 à J30 (il compte sur combats, primes, boss) |
| C. Ralentir les durées du second palier au lieu des coûts | D5 en partie | rien en données | ne corrige ni le trop-plein ni la rareté (variante B du rapport : peu d'effet) |
| D. Plafonner tout de suite le comptoir et les défaites (moteur) | D3 et D6 sans toucher aux taux | M : nouveaux champs, admin | plus lent à livrer ; prévu en AE-L3 après A |

## 5. Recommandation

Option **A tout de suite, puis B** au début d'un mois avec annonce (Q97), puis les lots moteur (AE-L3) et les mesures (AE-L4).

### 5.1 Réglages sûrs (AE-L1, livré en 6.14.72)

| Réglage (Admin → Règles) | Avant | Après | Constat |
|:--|:--|:--|:--|
| `streak.chest.common` (Série de connexion) | [45 000 000, 280 000 000] | **[2 000 000, 12 000 000]** | AE-3, Q99 |
| `combat.homeFleetDefenseFactor` (Combat) | 0,5 | **0,75** | AE-6 |
| `combat.homeDefenseBonus` (Combat) | 0,15 | **0,25** | AE-6 |
| `pvp.shieldAfterDefeatMs` (Protections) | 3 600 000 (1 h) | **10 800 000 (3 h)** | AE-7 |
| `pvp.hardXpRatio` (Protections) | 12 | **10** | AE-8, Q100 |

Effet mesuré (`node scripts/progression-sim.mjs --base avant-ae-l1`) :

| Repère | Avant | Après |
|:--|:--|:--|
| Coffre du 7e jour du joueur quotidien | 650 M = 465 h de production | **28 M = 20 h** |
| Stock commun le plus haut après le coffre (quotidien, entrepôt 21 M) | 182 M | **27 M** |
| Production perdue du quotidien à J14 | 96,1 % | **66,8 %** |
| 1re Ascension (actif / moyen / occasionnel / quotidien) | J10,3 / J18 / J46,3 / J32,3 | J10,3 / J18,8 / J46,3 / J32,3 |
| Seuil de victoire contre un défenseur mixte | ×0,75 | **×0,90** |
| Seuil contre des défenses seules | ×2,15 | ×2,35 |
| À dépense égale (mixte) : pertes attaquant / défenseur | 23 % / 93 % | **34 % / 85 %** |

Textes joueurs : changelog `changelog/2026-10-07-equilibrage-defense.md` (« La défense à domicile compte davantage »).

### 5.2 Progression (AE-L2, à faire)

| Réglage | Avant | Après |
|:--|:--|:--|
| `upgrade.tier2.baseCost` et `maxCost` des 9 bâtiments à second palier (Admin → Contenu → Bâtiments) | ×1 | **×4** |
| `exchange.commonToRare` | 0,01 | **0,004** (1 rare pour 250) |
| `economy.missionProductionMultiplier` | 1,5 | **0,75** |
| `economy.missionRareProductionRef` | 150 000 | **400 000** |
| `moon.upgradeCost`, `moon.costGrowth`, `moon.debrisPerPercent` (AE-9, déplacé d'AE-L1 : un coût futur, il part avec l'annonce) | { 500 000, 250 000 }, 2, 100 000 | **{ 20 000 000, 10 000 000 }, 3, 2 000 000** |

Effet attendu, mesuré sur les règles de 6.14.72 (`node scripts/progression-sim.mjs ae-l2`, lune non simulée) :

| Repère | Actif | Moyen | Occasionnel | Quotidien |
|:--|:--|:--|:--|:--|
| 1re Ascension | J10,3 → **J41,8** | J18,8 → **J58,8** | J46,3 → **> J90** | J32,3 → **J81,3** |
| Arbre complet | J14,9 → J40,9 | J31,9 → J56,1 | > J90 | J76,9 → > J90 |
| Production perdue à J90 | 69,9 % → 43,7 % | 59,6 % → 22,2 % | 41 % → 1,2 % | 54,5 % → 1,4 % |
| Missions dans les gains (J14+) | 35,8 % → 21,2 % | 17,1 % → 9,1 % | 3,6 % → 0,8 % | 5,6 % → 2,2 % |
| Sessions sans action J8–30 | 5,4 % → 43,5 % | 0 % | 0 % | 0 % |

Cela atteint les cibles d'Ascension de l'actif (J35–50) et presque celles du moyen (J60–90). La garde `progressionSim.test.ts`
change ses bornes d'Ascension dans le même lot (I29).

### 5.3 Moteur et mesures (AE-L3 à AE-L7)

- **AE-L3** : `streak.chest.commonHours` [6, 18] (coffre indexé sur la production, Q99), `exchange.weeklyRareCap` (Q98),
  `pvp.maxDefeatsPer24h` = 4 (AE-7), et `catchup.maxBonus` 0,5 / `catchup.fullBelow` 0,2 (AE-15, déplacé d'AE-L1 : il faut d'abord
  vérifier le plafond des bonus, `derived.test.ts`, I14). Chaque champ a son éditeur dans l'admin (règle n° 2).
- **AE-L4** : santé de l'équilibre : Ambre gagnée par source et par semaine, temps avant la mort des boss, jour de la 1re Ascension,
  production perdue, écart de production entre quartiles.
- **AE-L5** : ouverture progressive du menu (`navUnlock`), comptes existants au-delà de Fer II tout ouverts (Q103).
- **AE-L6** : puits de dépense permanent (projets de prestige payés en heures de production), proposition à part.
- **AE-L7** : après 8 semaines de mesures : boss (`hpFactor`, Q101), Ambre des primes réduite d'un tiers (Q102), seuils des succès.

## 6. Invariants

- **I29 (nouveau, 6.14.71)** : avec les règles par défaut, le simulateur de progression (déterministe) garde la 1re Ascension de chaque
  profil dans les bornes de `progressionSim.test.ts`, et le défenseur mixte tient jusqu'à ×0,85 au moins de sa dépense à budget égal
  (`pvpBudget.ts`). Un lot qui sort de ces bornes le dit et change les bornes dans le même commit.
- I10, I14 : inchangés (AE-L1 ne touche ni l'abri ni les bonus de la couche empire).

## 7. Plan de lots

| Lot | Contenu | Version | État |
|:--|:--|:--|:--|
| AE-L0 | Cette proposition ; simulateur de progression et combats à budget égal dans le dépôt ; script `scripts/progression-sim.mjs` ; garde I29 | 6.14.71 | livré |
| AE-L1 | Réglages sûrs (§5.1), défauts du code et migration `rules-6.14.72` des règles enregistrées ; changelog | 6.14.72 | livré (essai sur la pré-prod au prochain push) |
| AE-L2 | Progression (§5.2) : défauts du code, migration du contenu des bâtiments non modifiés, billet de devblog, annonce une semaine avant | — | à faire |
| AE-L3 | Moteur : coffre indexé, plafond de rareté hebdomadaire, défaites par 24 h, rattrapage | — | à faire |
| AE-L4 | Santé de l'équilibre | — | à faire |
| AE-L5 | Menu progressif | — | à faire |
| AE-L6 | Puits de dépense | — | à faire |
| AE-L7 | Après 8 semaines de mesures | — | plus tard |

## 8. Questions

Toutes tranchées par l'utilisateur (Q97 à Q103, validées le 2026-10-07). Revenir en arrière :

| Question | Choix appliqué | Retour arrière |
|:--|:--|:--|
| Q97 (AE-Q1) | second palier ×4 au début d'un mois, annonce une semaine avant, seuls les niveaux futurs coûtent plus | Admin → Contenu → Bâtiments |
| Q98 (AE-Q2) | taux à 1 pour 250, puis plafond hebdomadaire | `exchange.commonToRare` à 0,01 |
| Q99 (AE-Q3) | bornes [2 M, 12 M] tout de suite (6.14.72), indexation [6, 18] h ensuite | `streak.chest.common` à [45 M, 280 M] |
| Q100 (AE-Q4) | `pvp.hardXpRatio` à 10 (6.14.72), nombre de combats par jour mesuré (2,1 avant) | valeur 12 |
| Q101 (AE-Q5) | boss inchangés jusqu'à la mesure du temps avant la mort | `hpFactor` à 4 |
| Q102 (AE-Q6) | Ambre des primes réduite d'un tiers après mesure par source | valeurs 60, 120 et 0,1 |
| Q103 (AE-Q7) | menu progressif pour les nouveaux comptes seulement | `navUnlock.enabled` à faux |

Choix pris seul pendant AE-L0 et AE-L1 (la plus prudente pour les données des joueurs), à noter dans `QUESTIONS.md` par la session :
lune (AE-9) déplacée d'AE-L1 en AE-L2, rattrapage (AE-15) en AE-L3 ; migration `rules-6.14.72` qui ne remplace qu'une valeur égale à
l'ancien défaut. Détail dans `docs/changes/6.14.72-reglages-surs.md`.
