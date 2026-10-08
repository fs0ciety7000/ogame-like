# Proposition : rythme du départ (durée des premiers niveaux des bâtiments)

Statut : **livrée** (2026-10-08, lot RD-1, fiche `docs/changes/6.14.159-rythme-du-depart.md`). Méthode : `docs/WORKFLOW.md` §2.
Suite de `docs/proposals/rythme-long-terme.md` (bascule du 1er novembre 2026, invariant I29) : le rythme long terme ne bouge pas.
Questions : Q400 à Q403 (§8), option la plus prudente pour les joueurs appliquée (règle n° 3).

## 1. Constat

> « Je trouve que le temps de construction des bâtiments est très élevé dès le départ. 10 min du niveau 1 au 2, etc. On va perdre
> des joueurs, ça doit être progressif sans jamais tomber dans l'excès. » (l'utilisateur, 2026-10-08, compte « Marsupial » recréé sur
> la pré-prod pour tester depuis le début)

Fiche du compte « Marsupial » sur la pré-prod (lecture seule) : extracteurs au niveau 2 ou 3, entrepôt au niveau 1, deux recherches
au niveau 1. Les ressources de la prise en main (25 500 ferraille, 18 500 énergie) paient les niveaux 2 à 4 des quatre extracteurs dès
la première minute : c'est **la durée**, pas le coût, qui arrête le joueur. Il attend 10 min pour le niveau 2, 20 pour le 3, 30 pour le 4.

## 2. Diagnostic

### 2.1 La formule (cause sûre)

`getBuildingUpgradeTime` (`src/game/buildings.ts`) : premier palier **linéaire**, `(niveau − 1) × secondsPerLevel`, sans départ rapide.
Second palier (niveau 11 et plus) : `baseSeconds + (niveau − 11) × secondsPerLevel`.

| Bâtiment | Durée par niveau | Niv. 2 | Niv. 5 | Niv. 10 | Cumul 2 → 5 | Cumul 2 → 10 | Niv. 11 avant la bascule | Niv. 11 après |
|:--|--:|--:|--:|--:|--:|--:|--:|--:|
| 4 extracteurs, Entrepôt | 600 s | 10 min | 40 min | 1 h 30 | 1 h 40 | 7 h 30 | 3 h (×2) | 36 h (**×24**) |
| Hangars | 900 s | 15 min | 1 h | 2 h 15 | 2 h 30 | 11 h 15 | 3 h | 36 h (×16) |
| Atelier, Cale sèche | 1 200 s | 20 min | 1 h 20 | 3 h | 3 h 20 | 15 h | 3 h | 36 h (Atelier) ; 3 h (Cale) |
| Labo de synthèse (10 niv.) | 5 400 s | 1 h 30 | 6 h | 13 h 30 | 15 h | 68 h | — | — |
| Fonderie, Synthétiseur, Bouclier (10 niv.) | 10 800 s | 3 h | 12 h | 27 h | 30 h | 135 h | — | — |

Trois défauts : un **départ lent** (10 min pour un niveau qui coûte 166 ferraille), une courbe **plate** (chaque niveau ajoute la même
durée, rien ne s'accélère au début ni ne ralentit à la fin), et deux **sauts** : ×2 entre les niveaux 10 et 11 aujourd'hui, ×24 dès la
bascule du rythme (1 h 30 → 36 h).

### 2.2 Recherche et unités (vérifié : sans défaut)

- Recherche : `baseTime × 1,67^(n − 1)`, premiers niveaux en 30 s à 2 min (Analyse de matériaux 30 s, Amélioration énergétique 45 s,
  Infrastructure spatiale 2 min). Le départ est déjà en secondes.
- Unités : `(ferraille + énergie) ÷ 100` s, 3 s au moins : Drone récupérateur 7 s, Sonde 5 s, Frégate quelques dizaines de secondes.

### 2.3 Ce que mesure le simulateur (I29)

`progression-sim.mjs` joue par sessions (8, 3 ou 1 par jour) : entre deux sessions de 2 h, un chantier de 10 min ou de 20 s finit de
toute façon. La durée du départ ne change donc presque rien à ses repères (1re Ascension, sessions bloquées). Elle change tout dans la
**première session** : nouvelle option `opening` (6.14.159) qui simule un nouveau compte connecté sans interruption pendant une heure,
au pas de 10 s (`node scripts/progression-sim.mjs --base lineaire --depart`).

| Première heure (extracteurs ferraille / énergie / nano / données) | Avant (linéaire) | Après (courbe du départ) |
|:--|:--|:--|
| 1 min | 1/1/1/1 | 2/2/2/2 |
| 5 min | 1/1/1/1 | 4/4/4/4 |
| 15 min | 2/2/2/2 | 4/4/4/4 |
| 30 min | 2/2/2/2 | 4/4/4/4 |
| 60 min | 3/3/3/3 | 4/4/4/4 (5/5/4/4 avec 10 min de plus) |
| Lancements (chantiers, déblocages, recherches) en 1 h | 48 | 61 |

Au-delà du niveau 4 ou 5, **le coût** prend le relais (niveau 6 : 20 000 ferraille, 1 h 30 de production du niveau 5), comme dans OGame.

## 3. Benchmark

| Jeu | Premiers niveaux | Milieu | Long terme | Leçon |
|:--|:--|:--|:--|:--|
| OGame (univers vitesse 1) | mines 1 à 5 en dizaines de secondes à quelques minutes | heures vers 15 | jours au-delà de 25 | la durée suit le coût, géométrique ; le coût freine d'abord |
| Clash of Clans | premières améliorations en secondes ou minutes (premier jour) | heures dès le 2e ou 3e jour | jours au-delà de l'hôtel de ville 8 | courbe continue, jamais un saut : chaque palier un peu plus long |
| 4X mobiles (Rise of Kingdoms, State of Survival) | instantané ou < 1 min, accélération gratuite des chantiers courts | heures en semaine 1 | jours ensuite | le premier quart d'heure se joue sans attendre |

Constante : la **première session** enchaîne plusieurs niveaux, puis la durée monte d'un facteur à peu près constant (×1,5 à ×2,5 par
niveau). Aucun de ces jeux ne fait attendre 10 min pour le premier niveau, ni ne fait passer un niveau de 1 h 30 à 36 h.

## 4. Options

| Option | Ce que ça règle | Ce que ça coûte | Risque |
|:--|:--|:--|:--|
| **A. Diviseur global** (toutes les durées du premier palier ÷ k) | le départ | 1 réglage | niveau 10 à 9 min pour k = 10 : le premier palier ne freine plus rien, saut ×20 vers 3 h ; écarté |
| **B. Courbe géométrique par morceaux (retenue)** : niveau 2 = `secondsPerLevel ÷ 30`, dernier niveau du premier palier inchangé, facteur constant entre les deux ; jonction : un niveau dure au moins le suivant ÷ 4 en remontant du second palier | départ en secondes, courbe continue, saut ×2 avant la bascule (au lieu de ×2, rien ne change), ×4 au lieu de ×24 après | 3 réglages (`buildTime`), aucune donnée de contenu changée | après la bascule, niveaux 9 et 10 plus longs qu'aujourd'hui (2 h 15 et 9 h au lieu de 1 h 20 et 1 h 30) |
| **C. Accélération gratuite** des chantiers de moins de 5 min (4X mobiles) | rien seule : le niveau 2 dure 10 min | bouton, règle, serveur | ajoute un geste au lieu de retirer une attente ; écarté |
| **D. Une seule courbe géométrique** de 20 s au niveau 2 jusqu'au premier niveau du second palier | continuité parfaite | 1 réglage | après la bascule (36 h) : niveau 8 en 1 h 55, 9 en 5 h, 10 en 13 h 30, cumul 2 → 10 de 22 h ; trop lent au milieu ; écarté (avant la bascule, D = B) |

Variantes de la jonction de B, mesurées après la bascule (365 jours, Ascensions dès que possible, projets de prestige) :

| Jonction | Niv. 8 / 9 / 10 (extracteur) | Cumul 2 → 10 | Écart 10 → 11 | Sans action J1–7, actif (I29 : < 2 %) | 1re Ascension actif / moyen |
|:--|:--|--:|--:|--:|:--|
| aucune (0) | 22 min / 45 min / 1 h 30 | 2 h 58 | ×24 | 3,6 % (**échoue**) | J89,3 / J101,3 |
| **×4 (retenue)** | 34 min / 2 h 15 / 9 h | 12 h 10 | ×4 | **1,8 %** | J93,3 / J104,3 |
| ×6 | 22 min / 1 h / 6 h | 7 h 44 | ×6 | 5,4 % (**échoue**) | J90,5 / J103,3 |

Sans lissage (ou avec ×6), le niveau 10 se termine trop vite et l'actif retrouve un chantier vide sans rien d'abordable quelques sessions
de la première semaine. Avec ×4, les niveaux 9 et 10 occupent les chantiers pendant que la production monte : c'est la seule variante qui
tient I29.

## 5. Recommandation (appliquée)

### 5.1 Règle

Groupe de règles `buildTime` (`BUILD_TIME_RULES`, registre, Admin → Règles → « Bâtiments : durée des premiers niveaux », aperçu
avant / après sur l'Extracteur de ferraille, avant et après la bascule) :

| Réglage | Défaut | Effet |
|:--|--:|:--|
| `enabled` | oui | décoché : ancienne formule linéaire |
| `startDivisor` | 30 | niveau 2 = durée par niveau ÷ 30 (20 s pour un extracteur) |
| `junctionMaxRatio` | 4 | un niveau dure au moins le suivant ÷ 4, en remontant du premier niveau du second palier (0 = sans lissage) |

Formule (premier palier, niveau n de 2 au dernier niveau L du premier palier) :
`durée(n) = max( d₂ × (d_L ÷ d₂)^((n − 2) ÷ (L − 2)) ; base du second palier ÷ 4^(11 − n) )`, avec `d₂ = secondsPerLevel ÷ 30` et
`d_L = (L − 1) × secondsPerLevel` (la durée d'avant). Le champ `secondsPerLevel` des bâtiments garde son sens d'échelle : il fixe la
durée du dernier niveau du premier palier. Le second palier ne change pas.

### 5.2 Chiffres (avant les réductions)

| Bâtiment | Niv. 2 | Niv. 5 | Niv. 8 | Niv. 10 | Cumul 2 → 5 | Cumul 2 → 10 | Niv. 11 |
|:--|--:|--:|--:|--:|--:|--:|--:|
| Extracteurs, Entrepôt, avant la bascule | 10 min → **20 s** | 40 → **3 min** | 1 h 10 → **22 min** | 1 h 30 (=) | 1 h 40 → **5 min** | 7 h 30 → **2 h 58** | 3 h (=) |
| Extracteurs, Entrepôt, après la bascule | 10 min → **20 s** | 40 → **3 min** | 1 h 10 → **34 min** | 1 h 30 → **9 h** | 1 h 40 → **5 min** | 7 h 30 → **12 h 10** | 36 h (=) |
| Hangars, avant la bascule | 15 min → **30 s** | 1 h → **4 min** | 1 h 45 → **33 min** | 2 h 15 (=) | 2 h 30 → **8 min** | 11 h 15 → **4 h 28** | 3 h (=) |
| Atelier, Cale sèche | 20 min → **40 s** | 1 h 20 → **5 min** | 2 h 20 → **44 min** | 3 h (=) ; Atelier après la bascule 9 h | 3 h 20 → **10 min** | 15 h → **5 h 57** | 3 h ; Atelier 36 h après |
| Labo de synthèse | 1 h 30 → **3 min** | 6 h → **24 min** | 10 h 30 → **3 h 20** | 13 h 30 (=) | 15 h → **46 min** | 68 h → **27 h** | — |
| Fonderie, Synthétiseur, Bouclier | 3 h → **6 min** | 12 h → **49 min** | 21 h → **6 h 40** | 27 h (=) | 30 h → **1 h 31** | 135 h → **54 h** | — |

Avant la bascule, **aucun niveau ne dure plus qu'avant** et la courbe est continue jusqu'au second palier (×2 par niveau, puis 3 h au
niveau 11). Après la bascule, le saut ×24 devient une montée ×4 par niveau (niveaux 8 à 11) ; les niveaux 9 et 10 des 8 bâtiments de
l'Ascension durent plus qu'aujourd'hui (Q401).

### 5.3 Effet simulé

Avant la bascule (90 jours, `node scripts/progression-sim.mjs --base lineaire --depart`) : 1re Ascension actif J10 → J11, moyen J17,8,
occasionnel J46,3, quotidien J32,3 (inchangés) ; production perdue inchangée à 0,1 point près ; aucune session sans action la première
semaine (4 profils) ; extracteurs de l'actif au niveau 8 à J1 (I29 : 6 au moins).

Après la bascule (365 jours, `node scripts/progression-sim.mjs --base lineaire --apres-bascule --prestige --ascend --days 365 --depart`) :

| Profil | 1re Ascension | Ascensions la 1re année | Sessions bloquées (pire mois) | Production perdue | Sans action J1–7 | Extracteurs à J7 |
|:--|:--|:--|:--|:--|:--|:--|
| actif | J91,5 → J93,3 | 5 → 5 | 1,7 → 2,9 % | 7 → 5,8 % | 0 → 1,8 % | 12/11/11/11 → 11/11/11/11 |
| moyen | J103,3 → J104,3 | 5 → 5 | 13,3 → 10 % | 2,5 → 1,9 % | 0 → 0 % | 11/11/11/10 (=) |
| occasionnel | J132,8 (=) | 3 → 3 | 10 → 5 % | 12,6 → 13,4 % | 0 → 0 % | 6/6/6/6 (=) |
| quotidien | J121,8 (=) | 4 → 4 | 16,7 % (=) | 13,9 → 13,8 % | 0 → 0 % | 8/8/8/8 (=) |

Écart sur le rythme long terme : au plus 2 jours sur la 1re Ascension, aucune borne d'I29 ne bouge (`progressionSim.test.ts`).

### 5.4 Comptes existants

- Rien n'est écrit en base : la durée est calculée au lancement et écrite dans la file (`endTime`). Un chantier en cours garde sa fin.
- Contenu personnalisé : **aucune migration**. La courbe est une règle globale ; un bâtiment dont l'admin a réglé `secondsPerLevel` garde
  sa valeur, qui fixe la durée de son dernier niveau du premier palier. Un serveur qui veut l'ancienne formule décoche la courbe (Q403).
- Serveur et client utilisent le même moteur (`actions.ts`, `buildPlan.ts`, `colonies.ts`, `cancel.ts`) : rien à changer côté serveur
  hormis le bundle des hooks.

## 6. Invariants

- **I49 (nouveau)** : courbe du départ. Au premier palier, le niveau 2 dure `secondsPerLevel ÷ startDivisor`, le dernier niveau garde
  `(L − 1) × secondsPerLevel`, la durée croît à chaque niveau ; avant la bascule, aucun niveau ne dure plus que la formule linéaire et
  l'écart entre deux niveaux reste ≤ ×2,1 jusqu'au second palier ; après la bascule, l'écart reste ≤ `junctionMaxRatio` jusqu'au niveau 11 ;
  le second palier est inchangé ; un nouveau compte connecté en continu a ses 4 extracteurs au niveau 4 en 5 minutes. Test :
  `rythmeDepart.test.ts`.
- **I29** : bornes inchangées. Seul le test d'option « ascend » (hors bornes d'I29) passe de < 1 jour à < 1,5 jour entre « tout au maximum »
  et l'Ascension : un bâtiment de fin de partie, monté plus tôt, peut avoir un dernier niveau en cours (l'Ascension attend la fin des
  chantiers, `canAscend`).

## 7. Plan de lots

| Lot | Contenu | Taille | État |
|:--|:--|:--|:--|
| RD-1 | Courbe du départ (moteur, règles `buildTime`, admin avec aperçu), simulateur (`opening`, `reachHours`, `--depart`), Formules, docs | M | livré (6.14.159) |
| RD-2 | Mesure sur la pré-prod et après la bascule (temps jusqu'au niveau 5 et 10 des nouveaux comptes, santé de l'équilibre) ; décider Q402 (coûts du niveau 5 à 8) | S | avec R10 (RL-4), après le 1er novembre 2026 |

## 8. Questions (option recommandée appliquée, règle n° 3)

| N° | Question | Choix fait | Autre option | Revenir en arrière |
|:--|:--|:--|:--|:--|
| Q400 | Durée du niveau 2 : 20 s (÷ 30) ou 10 s (÷ 60) ? | **20 s** : le joueur voit le chantier se terminer, sans que ce soit instantané ; niveau 5 en 3 min | ÷ 60 : 10 s, niveau 5 en 1 min 40 | Règles → « Bâtiments : durée des premiers niveaux » → `startDivisor` |
| Q401 | Jonction avec le second palier après la bascule : ×4 (niveaux 9 et 10 en 2 h 15 et 9 h, plus longs qu'aujourd'hui) ou rien ? | **×4** : seule variante qui tient I29 (sans action J1–7 de l'actif 1,8 % ; 3,6 % sans lissage, 5,4 % à ×6) et retire le saut ×24 | 0 : départ rapide seul, saut ×24 gardé | `junctionMaxRatio` (0 = sans lissage) |
| Q402 | Au-delà du niveau 4 ou 5, le coût freine (1 h 30 à 3 h de production par niveau de 6 à 8) : baisser les coûts du début ? | **non** pour ce lot : on mesure d'abord (RD-2, pré-prod et santé de l'équilibre) ; les coûts touchent le pillage, les missions et l'entrepôt | coûts des niveaux 5 à 8 réduits | — |
| Q403 | Serveur au contenu personnalisé : courbe appliquée partout, ou seulement aux bâtiments restés aux valeurs du code ? | **partout** : `secondsPerLevel` garde son sens d'échelle (dernier niveau du premier palier) ; aucun niveau plus long qu'avant la bascule | seulement les valeurs du code (migration par bâtiment) | case « Courbe du départ activée » |
