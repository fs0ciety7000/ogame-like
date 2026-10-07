# Proposition : rythme long terme (1re Ascension, cycles, temps morts, production perdue)

Statut : **proposée** (lot RL-0). Méthode : `docs/WORKFLOW.md` §2. Suite de `docs/proposals/equilibrage-au27.md` (AE-L2, AE-L4, AE-L6).
Outil : simulateur de progression `src/game/balance/progressionSim.ts`, étendu par ce lot (horizon libre, Ascensions successives,
puits de dépense, relevés par fenêtre de 30 jours), garde I29 inchangée. Les variantes de ce document ont tourné dans le scratchpad
(scripts `rythme/run.mjs`, `variants.mjs`) ; le lot RL-0 les verse dans `scripts/progression-sim.mjs` (mode `--long`).

## 1. Constat

> « La première Ascension à J10 pour un joueur actif, ça me semble un peu tôt. Le jeu est sur du long terme (mois/années) : il ne
> faut pas avancer trop vite ni trop lentement pour ne pas perdre les joueurs. » (l'utilisateur, 2026-10-07)

Mesures connues (rapport AU27, proposition AU27 §5.2) :

| Repère | Actif | Moyen | Occasionnel | Quotidien |
|:--|:--|:--|:--|:--|
| 1re Ascension, règles actuelles | J10 | J18 | J46 | J32 |
| 1re Ascension avec AE-L2 (second palier ×4, Q97) | J42 | J59 | > J90 | J81 |
| Sessions sans rien à lancer de J8 à J30, avec AE-L2 | 43,5 % | 0 % | 0 % | 0 % |
| Arbre des technos complet, règles actuelles | J15 | J31 | > J90 | J75 |
| Production perdue à J90 (entrepôt plein) | 70 % | 61 % | 41 % | 57 % |

En production, un joueur a fait son Ascension après environ 9 jours (AU3, Z1).

## 2. Diagnostic

### 2.1 Méthode

Simulateur de progression (moteur pur, déterministe), étendu par ce lot avec des options **éteintes par défaut** (les bornes d'I29
ne bougent pas) :

- horizon libre (`days: 365`) et relevés par fenêtre de 30 jours (`windows`) ;
- **Ascensions successives** (`ascend`) dès qu'elles sont possibles, selon `ASCENSION_RULES` (délai, maximum, +10 % de production et
  −5 % de durée par Ascension, stock de départ) ;
- XP et rang (missions, objectifs du jour, expéditions) ;
- puits de dépense : vaisseaux d'attaque dans la place des hangars (`fleetSink`), projets de prestige (`prestigeProjects`, modèle
  d'AE-L6) ;
- modèles des options étudiées : conditions d'Ascension (`ascensionGate`), coût croissant par Ascension (`costGrowthPerAscension`),
  plafond de niveau par ère (`levelCapByDay`), recherche tardive (`techLate`), durées du second palier ;
- indicateurs par mois : **sessions bloquées** (chantier ou labo libre, rien d'abordable alors qu'il reste à faire), sessions sans
  progression lancée, **jours sans rien lancer** (bâtiment, recherche, projet), **jours « fini, sans suite »** (bâtiments et arbre au
  maximum, aucune Ascension possible), production perdue.

Tests : `progressionSim.test.ts` (3 tests ajoutés). Limites, inchangées depuis AU27 : ni combats, ni pillage, ni événements, ni
reliques, officiers, talents, classes, accélérations à l'Ambre. Le vrai joueur actif va donc plus vite que le simulé. Les jours sont des
ordres de grandeur.

### 2.2 Courbes sur 365 jours (règles actuelles, Ascension dès que possible)

| Profil | J7 | J30 | J90 | J180 | J365 |
|:--|:--|:--|:--|:--|:--|
| Actif | 136/160 niveaux, 189/288 technos, Platine III | 148, **arbre complet**, Maître III, **3 Ascensions** | **5 Ascensions (maximum), Élite (dernier rang)** | rien de neuf | rien de neuf |
| Moyen | 105, 74, Bronze I | 59, 255, Émeraude III, 2 Asc. | 5 Asc., Maître II | Challenger | Élite |
| Quotidien | 47, 25, Fer III | 152, 108, Or II | 119, 278, Émeraude I, 3 Asc. | 5 Asc., Maître III | Challenger |
| Occasionnel | 37, 17, Fer III | 106, 77, Argent III | 65, 219, Émeraude III, 2 Asc. | 5 Asc., Diamant II | Maître I |

| Profil | Ascensions (jours) | Arbre complet | Jours « fini, sans suite » sur 365 | Production perdue (cumul 365 j) | Hangars pleins |
|:--|:--|:--|:--|:--|:--|
| Actif | J10, 19, 26, 33, **40** | J26 | **323** | **91 %** | J51 |
| Moyen | J19, 29, 40, 49, **57** | J66 | **299** | 90 % | J74 |
| Quotidien | J33, 57, 77, 97, **117** | J131 | 229 | 84 % | J12 |
| Occasionnel | J47, 85, 115, 145, **175** | J142 | 162 | 74 % | J17 |

Avec AE-L2 seul (second palier ×4, comptoir 1 pour 250, missions 0,75) :

| Profil | Ascensions | Arbre | « Fini » | Perdue | Sessions bloquées, mois 1 à 5 |
|:--|:--|:--|:--|:--|:--|
| Actif | J42, 60, 76, 92, **107** | J41 | 244 j | 79 % | 33 / 65 / 57 / 55 / 3 % |
| Moyen | J59, 82, 104, 125, **145** | J56 | 202 j | 72 % | 0 / 39 / 27 / 32 / 23 % |
| Quotidien | J82, 125, 157, 187, **216** | J245 | 120 j | 55 % | 0 % |
| Occasionnel | J107, 157, 199, 241, **278** | J316 | 49 j | 27 % | 0 % |

### 2.3 Causes, de la plus sûre à la plus douteuse

| # | Cause | Preuve |
|:--|:--|:--|
| R1 | **Le contenu économique est fini et court.** 8 bâtiments exigés (160 niveaux) et 288 niveaux de technos. Le second palier vaut 23,7 Md (rares comptées 50) et l'arbre 17,4 Md, soit **13 jours** de la production maximale (134 M/h). Les durées sont courtes : 600 h de chantier pour tout le second palier (≈ 4 jours sur 6 chantiers) et 503 h de recherche (≈ 5 jours sur 4 labos) | calcul sur `BUILDINGS`, `TECHNOLOGIES` (`getBuildingUpgradeCost`, `getTechTime`) |
| R2 | **L'Ascension s'épuise** : 5 au plus, 7 jours d'écart. Chaque cycle est **plus court** que le précédent (technos gardées, +10 % de production). Après la 5e, plus rien à lancer : 162 à 323 jours « fini » la première année | `ASCENSION_RULES` (`ascension.ts`) ; §2.2 |
| R3 | **Coûts sans durées = murs.** Un niveau qui coûte plusieurs heures de production mais se construit en 3 à 12 h laisse le chantier vide : AE-L2 donne 33 à 65 % de sessions bloquées à l'actif les quatre premiers mois. Monter les coûts davantage aggrave ce mur (×10 : 71 à 87 %) | variantes A1, AE-L2 (§4) |
| R4 | **Aucun puits durable.** Une fois les bâtiments au maximum, la production ne sert plus à rien : 74 à 91 % perdue sur l'année. La flotte n'en est pas un : hangars pleins entre J12 et J74 pour ≈ 0,1 Md (moins d'une heure de production maximale) | `fleetSink` ; `getUnitCapacity` |
| R5 | **La recherche finit avant la 1re Ascension** (actif J26, moyen J66) : entre deux Ascensions, aucun fil continu. Ses constantes de croissance (`COST_GROWTH` 2,7, `TIME_GROWTH` 1,67) sont dans le code, pas dans les règles (écart à la règle n° 2) | `technologies.ts:287-288` |
| R6 | L'échelle des rangs se termine vite : Élite (420 000 XP) vers J90 pour l'actif, J240 pour le moyen | `DEFAULT_RANKS` (`ranks.ts`) ; XP du simulateur |
| R7 | L'occasionnel perd 33 à 42 % de sa production le 1er mois (entrepôt plus petit que 48 h de production, un jour sur trois manqué) | fenêtres du profil occasionnel |

## 3. Benchmark

| Question | OGame | Clash of Clans | Rise of Kingdoms | Jeux à prestige (idle) | Travian |
|:--|:--|:--|:--|:--|:--|
| Durée d'une partie | univers sur des années ; nouveaux univers ouverts régulièrement | sans fin, mises à jour qui ajoutent un niveau d'hôtel de ville | royaume sur des années, saisons de guerre (KvK) de quelques semaines à deux mois | sans fin, couches de prestige successives | une manche de plusieurs mois (de l'ordre de 4 à 8), puis remise à zéro |
| Ce qui freine | coûts ×1,5 à ×2 par niveau, recherches de plusieurs jours aux hauts niveaux | **durées** des améliorations (jusqu'à une ou deux semaines au plus haut niveau) et nombre d'ouvriers (files parallèles) | durées et accélérateurs ; hôtel de ville maximal en plusieurs mois | coût exponentiel dans chaque manche | durées et ressources, puis calendrier du serveur |
| Puits sans fin | flotte et défenses sans plafond | **remparts** : des centaines de pièces qui absorbent l'or en trop | troupes, recherches, équipement | le prestige lui-même | troupes, merveille du monde |
| Rythme du prestige ou du palier | aucun reset | un hôtel de ville par mois ou deux en milieu de partie, plus long ensuite | saisons du royaume | le premier vite, puis chaque manche **va plus loin** grâce à la monnaie de prestige | artefacts puis plans de la merveille ouverts par la date du serveur |
| Calendrier | événements | passe mensuel | contenu ouvert par l'âge du royaume | — | ères datées |

Ce qu'on retient :

1. **Le temps freine, pas le mur** : sur le long terme, les jeux de référence ralentissent par la durée des chantiers (files pleines,
   on revient plus tard), et le coût suit la production pendant cette durée. Le joueur n'attend pas devant un chantier vide.
2. **Il y a toujours un puits** pour le surplus (remparts de Clash of Clans, flotte d'OGame).
3. Le prestige revient **régulièrement**, et chaque cycle donne plus (bonus cumulés, nouveaux objectifs).
4. Le calendrier du serveur règle les **rendez-vous partagés** (ères de Travian, saisons de Rise of Kingdoms), pas l'économie
   personnelle : un nouveau venu sur un vieux serveur ne doit pas tout trouver ouvert d'un coup ni attendre des mois.

## 4. Options

### 4.1 Cibles proposées (simulateur ; le vrai joueur actif ira un peu plus vite, voir §2.1)

| Repère | Actif (8 sessions/j) | Moyen (3/j) | Quotidien (1/j) | Occasionnel (1/j, 1 j sur 3 manqué) |
|:--|:--|:--|:--|:--|
| 1re Ascension | **J80 à J110** (≈ 3 mois) | **J95 à J125** (3 à 4 mois) | **J110 à J150** (4 à 5 mois) | **J130 à J180** (4,5 à 6 mois) |
| Écart entre deux Ascensions | 45 à 60 j, jamais < 30 j (une par saison au plus) | 50 à 65 j | 60 à 75 j | 70 à 90 j |
| Ascensions la 1re année | 5 à 6 | 4 à 5 | 3 à 4 | 3 à 4 |
| Arbre des technos complet | J80 à J120 | J95 à J140 | J140 à J200 | J170 à J240 |
| Sessions bloquées (mur) | ≤ 15 % chaque mois | ≤ 15 % | ≤ 15 % | ≤ 15 % |
| Jours joués sans rien lancer (bâtiment, recherche, projet) | ≤ 3 par mois | ≤ 3 | ≤ 3 | ≤ 4 |
| Jours « fini, sans suite » la 1re année | 0 | 0 | 0 | 0 |
| Production perdue | ≤ 15 % cumulés sur l'année | ≤ 15 % | ≤ 15 % | ≤ 15 % |
| Première semaine | inchangée : extracteurs niv. 8 à J1 (actif), sessions sans action J1–7 ≈ 0 | idem | idem | idem |

Pourquoi ces chiffres :

- **≈ 3 mois pour l'actif** : la boucle « méta » du GDD (§2) dure « plusieurs mois » ; trois saisons (passe, Chroniques) avant la
  première Ascension, c'est un arc complet. Au-delà, l'actif a fini l'arbre et attend sa remise à neuf.
- **Écart resserré entre profils** (×1,4 entre actif et occasionnel, contre ×4,7 aujourd'hui) : la durée des chantiers freine tout
  le monde pareil, comme dans Clash of Clans. L'activité garde son avantage ailleurs (JcJ, boss, rangs, Ambre, passe). L'occasionnel
  voit l'Ascension dans son premier semestre au lieu d'abandonner avant (AE-15, boule de neige). Le moyen à 5 ou 6 mois et
  l'occasionnel à 8 ou 9, comme évoqué par l'utilisateur, n'est atteignable que par les coûts. Ceux-ci créent un mur pour l'actif :
  71 à 87 % de sessions bloquées (variante A1). Voir la question RL-Q1.
- **Une Ascension par saison au plus** : le délai suit le rythme mensuel du passe et des Chroniques.
- **Jamais de session sans rien d'utile à faire** se mesure en jours : un joueur actif qui revient toutes les 2 h ne peut pas lancer un
  chantier à chaque passage si les chantiers durent des jours, et c'est voulu (« je lance, je reviens »). En revanche, chaque jour joué
  doit offrir au moins une dépense utile, et aucun chantier ne doit rester vide faute de moyens plus d'une session sur sept.

### 4.2 Options comparées (simulation 365 jours, 4 profils, Ascension dès que possible)

Toutes partent d'AE-L2 (second palier ×4, comptoir 1 pour 250, missions 0,75 et 400 000), validé en Q97–Q98, sauf « Actuel ».

| Option | 1re Ascension (actif / moyen / quotidien / occasionnel) | Ascensions la 1re année | Arbre complet | Sessions bloquées (pire mois) | « Fini » (jours) | Perdue (cumul) | Verdict |
|:--|:--|:--|:--|:--|:--|:--|:--|
| Actuel | J10 / 19 / 33 / 47 | 5 / 5 / 5 / 5 | J26 / 66 / 131 / 142 | 14 % | 323 / 299 / 229 / 162 | 91 / 90 / 84 / 74 % | trop vite, puis vide |
| AE-L2 seul | J42 / 59 / 82 / 107 | 5 / 5 / 5 / 5 | J41 / 56 / 245 / 316 | 65 % (actif) | 244 / 202 / 120 / 49 | 79 / 72 / 55 / 27 % | mur, puis vide |
| **A1** coûts ×10 | J83 / 112 / 158 / 193 | 5 / 5 / 4 / 3 | J52 / 74 / 125 / 184 | **87 %** (actif), 78 % (moyen) | 100 / 22 / 0 / 0 | 43 / 9 / 4 / 8 % | dates bonnes, mur permanent |
| **A2** durées du second palier (12 h + 14 h par niveau) | J57 / 67 / 92 / 112 | 5 / 5 / 5 / 5 | J38 / 59 / 140 / 175 | 38 % | 162 / 131 / 53 / 0 | 66 / 57 / 31 / 5 % | moins de mur, encore trop court |
| **A3** durées 30 h + 24 h par niveau, recherche tardive (×20, coût ×3), délai 30 j, maximum 10, sans projets | J93 / 100 / 121 / 130 | 6 / 5 / 4 / 4 | J120 / 151 / 198 / 220 | 58 % (moyen, mois 5) | 0 | 38 / 25 / 25 / 18 % | bonnes dates, mais 13 à 25 jours par mois sans rien lancer et production perdue |
| **B** conditions : délai 30 j, maximum 10, second palier +50 % à chaque Ascension, arbre complet exigé | J42 / 59 / 111 / 160 | 6 / 5 / 4 / 3 | J41 / 56 / 110 / 158 | **95 %** (actif) | 4 / 0 / 0 / 0 | 14 / 15 / 10 / 20 % | cycles qui s'allongent par le mur : rejeté |
| **C** projets de prestige seuls (12 h de production, ×1,1 chacun) | J42 / 59 / 82 / 107 | 5 / 5 / 5 / 5 | comme AE-L2 | 65 % | 244 / 202 / 120 / 49 (projets seuls) | 45 / 29 / 7 / 4 % | puits utile, ne règle pas la cadence |
| **D** ères : niveau maximal 10, +1 tous les 14 jours de serveur | J141 / 141 / 142 / 146 | 5 / 5 / 5 / 5 | J62 / 70 / 92 / 122 | 92 % (actif) | 145 / 119 / 73 / 22 | 72 / 62 / 46 / 16 % | même date pour tous, sans effet pour un nouveau venu sur un serveur mûr : rejeté pour l'économie |
| **Recommandée : A3 + B (délai, maximum) + C (projets de 8 h)** | **J92 / 100 / 118 / 133** | **6 / 5 / 4 / 4** | **J92 / 105 / 163 / 193** | **10 %** | **0** | **2 / 1 / 9 / 11 %** | **toutes les cibles** |

Comparaison qualitative :

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| A coûts seuls | la date | rien (réglages) | mur : jusqu'à 87 % de sessions bloquées ; pas de suite après la 5e Ascension |
| A durées et recherche | date sans mur, profils rapprochés, fil continu de recherche | réglages des bâtiments ; 3 champs de recherche (moteur S) | 13 à 25 jours par mois sans rien lancer si rien d'autre ne s'achète ; montée du palier 2 plus lente à suivre |
| B conditions riches | la fin des Ascensions (délai, maximum) | réglages ; libellés et succès jusqu'à X | coûts croissants : mur (rejeté) ; arbre exigé : attente sans rien à faire (rejeté) |
| C largeur (projets, AE-L6) | production perdue, jours sans dépense, « fini » | nouveau système (moteur, serveur, interface, admin, chaîne de contenu) | puits sans plaisir si la récompense est fade ; à garder hors combat (pilier « payant jamais » et équité) |
| D ères | rendez-vous partagés | calendrier serveur | même date pour tous les profils ; rien pour un nouveau venu sur un vieux serveur |

Le calendrier (D) reste l'outil des **rendez-vous** : passe, Chroniques, et un thème de projet de prestige par saison (§5.2).

## 5. Recommandation

**A3 + B (délai et maximum) + C (projets de prestige)**, sur la base d'AE-L2 (gardé, renforcé). Tous les chiffres sont des réglages
de l'admin ; trois champs de recherche et le système de projets sont à coder.

### 5.1 Réglages

| Réglage (où dans l'admin) | Avant | Après | Rôle |
|:--|:--|:--|:--|
| `upgrade.tier2.baseCost`, `maxCost` des bâtiments à second palier (Contenu → Bâtiments) | ×1 | **×4** (AE-L2, Q97, inchangé) | coût suivant la production |
| `upgrade.tier2.baseSeconds` des **8 bâtiments exigés par l'Ascension** (Contenu → Bâtiments) | 10 800 (3 h) | **108 000 (30 h)** | niveau 11 en un jour et quart |
| `upgrade.tier2.secondsPerLevel` des mêmes | 3 600 (1 h) | **86 400 (24 h)** | niveau 20 en 246 h (≈ 10 j) ; tout le palier ≈ 75 j sur 6 chantiers avant réductions (≈ 55 j avec les technos de durée) |
| `research.lateFromLevel` (Règles → Labo, **nouveau**) | — | **6** | niveaux 1 à 5 inchangés (J1 rapide) |
| `research.lateTimeFactor` (**nouveau**) | — (1) | **30** | arbre ≈ 90 jours de 4 labos avant réductions |
| `research.maxLevelSeconds` (**nouveau**) | — | **604 800 (7 j)**, avant réductions | aucune recherche de plus d'une semaine |
| `research.costGrowth`, `research.timeGrowth` (**nouveaux**, constantes du code reprises) | 2,7 / 1,67 (code) | 2,7 / 1,67 | règle n° 2 : plus de constante hors admin |
| `ascension.cooldownDays` (Règles → Ascension) | 7 | **30** | une Ascension par saison au plus |
| `ascension.maxAscensions` | 5 | **10** | environ 18 mois de cycles pour l'actif |
| `prestige.*` (**nouveau groupe**, §5.2) | — | voir §5.2 | puits durable |
| `exchange.commonToRare`, `economy.missionProductionMultiplier`, `missionRareProductionRef`, `moon.*` | AE-L2 | AE-L2 | inchangés |

La Cale sèche (hors condition d'Ascension) garde ses durées.

### 5.2 Projets de prestige (AE-L6, nouveau système)

- **Un chantier de prestige**, à côté des 6 chantiers : un projet à la fois.
- **Coût** : `prestige.hoursPerProject` = **8** heures de la production commune du moment, réparties comme la production. Le prix suit
  donc le joueur à tout stade, et après une Ascension, il reste abordable.
- **Durée** : `prestige.durationHours` = **8**.
- **Ouverture** : quand les 4 extracteurs atteignent le niveau `prestige.unlockExtractorLevel` = **10** (fin du premier palier, J1 à
  J3 pour l'actif). La première semaine reste celle d'aujourd'hui.
- **Récompense** : `prestige.pointsPerProject` = 8 points de prestige (1 par heure investie). Ils alimentent un classement « Prestige »,
  des paliers de bannières et de titres, un monument visible sur la carte d'empire et des succès. **Aucun bonus de combat ni de
  production** (pilier « le prestige se voit », plafonds I14 intacts) : voir RL-Q5.
- `prestige.growth` = **1** (coût constant en heures) ; `prestige.enabled` (vrai) ; `prestige.maxConcurrent` = 1.
- **Saison** (D, calendrier) : chaque mois, le projet change de thème (nom, illustration, bannière du mois), généré avec le passe ;
  un seul thème actif par mois (invariant I17 inchangé).
- **Alliance** (plus tard) : un projet commun alimenté par les membres, mêmes règles en heures.

Chaîne de contenu (règle n° 4) : succès (1er projet, 10, 100, 1 000 ; un par thème de saison), Codex (« Projets de prestige »),
bannières et titres par palier, défi du passe « Lance 3 projets » (rythme mesuré par la médiane, I18), illustration du chantier et du
monument (prompts dans `scripts/illustrations.json`), entrée Ctrl+K, page Formules, ligne au Journal.

### 5.3 Effet simulé (365 jours, Ascension dès que possible)

| Profil | Ascensions | Écarts | Arbre | Sessions bloquées (pire mois) | Jours sans dépense (pire mois) | Perdue (cumul) | « Fini » |
|:--|:--|:--|:--|:--|:--|:--|:--|
| Actif | J92, 149, 204, 256, 305, 351 | 57 → 46 j | J92 | 1 % | 0 | 2,2 % | 0 |
| Moyen | J100, 160, 219, 274, 326 | 60 → 52 j | J105 | 3 % | 2 | 0,8 % | 0 |
| Quotidien | J118, 190, 257, 321 | 72 → 64 j | J163 | 10 % | 3 | 9 % | 0 |
| Occasionnel | J133, 212, 284, 355 | 79 → 71 j | J193 | 0 % | 4 | 10,8 % | 0 |

Courbes :

| Profil | J7 | J30 | J90 | J180 | J365 |
|:--|:--|:--|:--|:--|:--|
| Actif | 88/160 niveaux, 109/288 technos, Argent I | 121, 185, Diamant III, 46 projets | 159, 286, Challenger | 2 Asc., Élite, 338 projets | 6 Asc., 692 projets |
| Moyen | 78, 66, Bronze III | 115, 166, Platine I | 157, 273, Maître II | 2 Asc., Challenger | 5 Asc., Élite |
| Quotidien | 47, 25, Fer III | 102, 107, Or II | 145, 238, Émeraude I | 1 Asc., Maître III | 4 Asc., Challenger |
| Occasionnel | 37, 17, Fer III | 92, 71, Argent III | 142, 189, Platine I | 1 Asc., Diamant II | 4 Asc., Maître I |

Écarts aux cibles : les quatre premières Ascensions tombent dans leurs bandes, et l'arbre aussi. L'actif a **une session sans action
sur 56** la première semaine (1,8 %, contre 0 aujourd'hui), à régler dans RL-2 (`research.lateFromLevel` à 7 et facteur adapté). Sa
production perdue du premier mois (11 %) et celle de l'occasionnel (37 %) viennent de l'entrepôt de début de partie (R7, RL-Q8).
Chaque cycle raccourcit un peu (−5 % de durée par Ascension) jusqu'au délai de 30 jours, comme dans un jeu à prestige.

### 5.4 Comptes existants (rien n'est retiré)

- Niveaux, technos, Ascensions faites, stocks, flottes : **inchangés**. Un chantier ou une recherche en cours garde sa fin.
- Seuls les **niveaux futurs** du second palier coûtent plus (Q97) et durent plus longtemps, de même que les niveaux de recherche
  à partir du 6e.
- Le joueur qui a fait son Ascension après ≈ 9 jours la garde, avec son bonus. Le délai de 30 jours se compte depuis sa dernière
  Ascension : avec les nouvelles durées, il ne peut pas remonter ses bâtiments avant, donc rien ne le bloque en pratique.
- Un joueur dont tout est déjà au niveau 20 peut faire son Ascension tout de suite, aux nouvelles règles ensuite.
- Le maximum passe de 5 à 10 : personne ne perd d'Ascension possible.
- Migration du contenu : `CONTENT_MIGRATIONS` multiplie les coûts et remplace les durées **seulement** des bâtiments dont le second
  palier est encore égal au défaut (même règle qu'AE-L2), et l'admin voit la différence avant d'appliquer.
- Annonce une semaine avant, application au début d'un mois (Q97), billet de devblog (« Un jeu au long cours ») et annonce en modale.

### 5.5 Production perdue

1. Les projets de prestige absorbent le surplus : production perdue de 74 à 91 % à 1 à 11 % sur l'année.
2. Le message « Entrepôt plein : la production s'arrête » (AE-14) propose « Lancer un projet de prestige » comme sortie (règle de
   conception n° 1).
3. Entrepôt du début de partie (R7) : mesuré d'abord (RL-4) ; si l'occasionnel perd plus de 25 % le premier mois sur le serveur, on
   proposera un plancher en heures de production (RL-Q8).

### 5.6 Mesurer après la mise en production (RL-4, extension d'AE-L4)

Page Admin → Santé de l'équilibre, par cohorte d'inscription et par quartile d'activité (sessions par jour) :

| Mesure | Source | Cible |
|:--|:--|:--|
| Âge du compte à la 1re Ascension, écart entre Ascensions | `ascendedAtMs`, `stats.ascensions` | bandes du §4.1 |
| Part des sessions avec un chantier ou un labo libre et rien d'abordable | relevé à l'ouverture de Bâtiments ou du Labo | ≤ 15 % |
| Jours joués sans aucun lancement (bâtiment, recherche, projet) | journal des actions | ≤ 3 par mois |
| Heures d'entrepôt plein par jour | rattrapage (`flush`) | ≤ 15 % du temps |
| Projets lancés par joueur et par jour | compteur | 1 à 3 |
| Rétention J7, J30, J90 avant et après | analytique | ne baisse pas |

Revue à 8 semaines (comme AE-L7) : les durées et le facteur de recherche se règlent dans l'admin, sans code.

## 6. Invariants

- **I29 (modifié par RL-3)** : en plus des bornes à 90 jours, le simulateur sur 365 jours (règles par défaut, Ascension dès que
  possible, projets) garde la 1re Ascension dans les bandes du §4.1, aucun jour « fini, sans suite », les sessions bloquées sous 15 %
  par mois et la production perdue sous 15 % cumulés. Les bornes d'Ascension à 90 jours de `progressionSim.test.ts` changent dans le
  même commit (l'Ascension sort de l'horizon de 90 jours pour tous les profils).
- **I30 (nouveau, RL-2)** : un projet de prestige coûte exactement `hoursPerProject` heures de la production commune du moment, ne
  donne aucun bonus de combat ni de production, et un seul tourne à la fois. Test : `prestige.test.ts`.
- I4, I14, I17 : inchangés (l'Ascension garde hangars et Cale sèche ; aucun bonus nouveau dans la couche empire ; un thème de projet
  par mois).

## 7. Plan de lots

| Lot | Contenu | Taille | Ordre |
|:--|:--|:--|:--|
| **RL-0** | Cette proposition ; simulateur étendu (options éteintes, tests) : faits. À faire dans le même lot : mode `--long` de `scripts/progression-sim.mjs` (365 jours, Ascensions, puits, fenêtres) avec le préréglage `rythme-lt` ; questions RL-Q1 à RL-Q8 dans `QUESTIONS.md` et `decisions-a-valider.md` | S | maintenant |
| **RL-1** | Recherche : `research.costGrowth`, `timeGrowth`, `lateFromLevel`, `lateTimeFactor`, `maxLevelSeconds` dans `RESEARCH_RULES` (défauts neutres, le jeu ne change pas), éditeur Admin → Règles → Labo, Formules ; tests (`reglages671`, `rulesAdmin`) | S–M | 1 |
| **RL-2** | Projets de prestige (AE-L6) : moteur (`prestige.ts`, I30), serveur (action, classement), interface (chantier, monument), admin (groupe `prestige`), chaîne de contenu complète, sortie « Entrepôt plein ». Utile tout de suite : la production perdue d'aujourd'hui (70 à 90 %) a un débouché | L | 2 |
| **RL-3** | Bascule du rythme, **AE-L2 compris** : second palier ×4 et comptoir, missions, lune (AE-L2 inchangé) ; durées du second palier 30 h + 24 h ; recherche tardive ×30 plafonnée à 7 j ; Ascension 30 j et maximum 10 (libellés jusqu'à X dans `ascension.ts` et `gazette.ts`, `AscensionCard` à 10 emplacements, succès Ascension II à X, Codex) ; migration des contenus non modifiés ; I29 étendu ; annonce une semaine avant, début de mois ; billet et changelog | M | 3 |
| **RL-4** | Mesures (§5.6), dans la page Santé de l'équilibre (AE-L4) | M | avec RL-3 |
| **RL-5** | Après 8 semaines : réglage fin ; suite au-delà de 10 Ascensions ; échelle des rangs (R6) ; entrepôt du début (R7) | S | plus tard |

**AE-L2** : gardé tel que validé (Q97, Q98), **renforcé** par les durées et la recherche. Il part dans RL-3 au lieu d'être livré seul :
seul, il crée le mur (33 à 65 % de sessions bloquées pour l'actif) puis le vide (244 jours « fini » la première année).

## 8. Questions (option recommandée appliquée, règle n° 3)

| # | Question | Option recommandée | Autre option | Revenir en arrière |
|:--|:--|:--|:--|:--|
| RL-Q1 | 1re Ascension : ≈ 3 mois pour l'actif et 4,5 à 6 pour l'occasionnel (écart ×1,4), ou 3–4 mois pour l'actif et 5–6 pour le moyen (écart ×2) ? | ≈ 3 mois, freiné par la **durée** (aucun mur) | écart plus grand par les coûts (×10 : 87 % de sessions bloquées pour l'actif) | `tier2.baseSeconds` et `secondsPerLevel` dans Contenu → Bâtiments |
| RL-Q2 | Durée du dernier niveau du second palier : ≈ 10 jours ? | 30 h + 24 h par niveau (niveau 20 : 246 h) | 20 h + 26 h (même total, départ plus doux) | 10 800 / 3 600 |
| RL-Q3 | Recherche : facteur sur les niveaux tardifs, ou croissance globale plus forte ? | ×30 dès le niveau 6, 7 jours au plus par niveau | `timeGrowth` 1,67 → 2,1 (un niveau de `tech1` passerait à 104 jours) | `research.lateTimeFactor` à 1 |
| RL-Q4 | Ascension : délai de 30 jours et maximum 10 ? | oui (une par saison, ≈ 18 mois de cycles pour l'actif) | pas de maximum, bonus réduit au-delà de 10 (à concevoir) | `ascension.cooldownDays` 7, `maxAscensions` 5 |
| RL-Q5 | Projets de prestige : récompense seulement visible, ou petit bonus ? | visible seulement (classement, bannières, monument, succès) | +1 % de production tous les 50 projets, plafonné à +10 % dans la couche empire | `prestige.enabled` à faux |
| RL-Q6 | Ordre de livraison : projets avant la bascule du rythme ? | oui : RL-2 (projets) puis RL-3 (bascule au début d'un mois, annonce une semaine avant) | tout ensemble au début d'un mois | — |
| RL-Q7 | Coût du second palier croissant à chaque Ascension (option B) ? | non (crée un mur : jusqu'à 95 % de sessions bloquées) ; les cycles raccourcissent un peu, comme dans un jeu à prestige | +25 % par Ascension avec des durées allongées d'autant | — |
| RL-Q8 | Entrepôt du début : l'occasionnel perd 33 à 42 % de sa production le premier mois | mesurer d'abord (RL-4) | plancher de capacité en heures de production (48 h) | — |
