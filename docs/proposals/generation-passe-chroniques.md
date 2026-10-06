# Proposition : passe de saison et Chroniques entièrement génératifs

Statut : **acceptée (option B)** ; lot 1 **livré** en 6.8.0 avec la bibliothèque du lot 3 (`docs/changes/6.8.0-progression-generative.md`) ; lots 6.8.1 et 6.8.2 à faire. Demande de l'utilisateur (2026-10-06) : « le Season pass et les chroniques doivent être génératifs.
Le système doit les générer procéduralement (paliers, prérequis, récompenses etc.) ». Liée à la revue AU3 (`progression.md`, PRG-1 à PRG-3).

## 1. Le problème vu par le joueur et par l'équipe
- Joueur : « Le passe d'octobre s'est fini en une semaine ; les épisodes se ressemblent d'un mois à l'autre. »
- Équipe : chaque mois écrit à la main coûte du temps, et un passe mal dosé (AU3, PRG-1) n'est corrigé qu'au mois suivant.

## 2. État actuel (diagnostic dans le code)

| Élément | Aujourd'hui | Génératif ? |
|:--|:--|:--|
| **Chroniques** (épisodes, objectifs, nombres, récompenses, boss, textes, codex) | écrites à la main pour **octobre 2026 → mars 2027** (`chronicles.ts`) ; le générateur (`procedural.ts`, `generateChapter`) n'écrit que les mois **sans** chronique, donc pas avant avril 2027 | partiel |
| **Thème, nom, scénario, commandant du passe** | catalogue fixe de 36 saisons (`seasonCatalog.ts`, à partir de novembre 2026) | tirage dans un catalogue |
| **Points par palier** | ajustés de ±15 % selon la part de joueurs qui a fini le mois précédent (`generatePass`) | oui, mais grossier |
| **Récompenses des paliers** | gabarit fixe (relique aux paliers 20 et 30, Ambre au 10, rotation production / Ambre / capsule, jetons aux 7, 17, 27) | non (gabarit) |
| **Prérequis des paliers** (défis cumulés) | générés depuis l'activité réelle (médianes par semaine), dernier palier visé au **jour 26** (`generateCumulativeChallenges`) ; 6 types d'objectifs | oui |
| **Publication** | brouillon le jour J (20), publié d'office au 1er s'il n'est pas relu, annoncé aux joueurs | oui |
| Deux passes en parallèle | passe du chapitre (`month.pass`, octobre) et passe de saison (`passSeasons`, dès novembre) | à unifier |

## 3. Benchmark
- Clash of Clans, Brawl Stars : passe mensuel à **budget de valeur fixe** réparti sur une courbe ; jalons tous les 5 paliers ; les quêtes
  (prérequis) sont tirées dans une table pondérée et changent chaque semaine.
- Diablo IV, Destiny 2 : saisons au thème écrit, mais objectifs et paliers générés depuis des tables et le rythme mesuré des joueurs.
- Point commun : **un budget et une cible de durée**, les tirages se font sous contraintes, l'équipe règle les tables, pas les paliers un par un.

## 4. Options

| | Option | Effet | Pour | Contre |
|:--|:--|:--|:--|:--|
| A | Statu quo | Chroniques écrites jusqu'en mars, récompenses en gabarit | aucun code | ne répond pas à la demande |
| B | **Générer tout, chaque mois**, dès novembre 2026 : Chroniques et passe (paliers, prérequis, récompenses, textes) depuis des tables réglables dans l'admin ; les mois écrits à la main deviennent une bibliothèque facultative | demande couverte, rythme corrigé chaque mois | travail moyen (3 lots) ; novembre change à 3 semaines de son ouverture |
| C | Générer seulement le passe, garder les Chroniques écrites jusqu'en mars | moins de travail | Chroniques figées 5 mois de plus |

## 5. Recommandation : **B**, en 3 lots

### 5.1 Un seul passe par mois
Le passe de saison (`passSeasons`) devient le seul passe dès novembre ; le passe du chapitre (`month.pass`) n'est plus lu pour les mois
couverts. Octobre reste tel quel (en cours).

### 5.2 Récompenses par budget (fin du gabarit)
- **Budget du mois** en « heures de production équivalentes » (réglable, défaut **120 h**) réparti sur 30 paliers selon une courbe croissante
  (premiers paliers petits, derniers gros), plus des **jalons** aux paliers 5, 10, 15, 20, 25, 30 (réglables).
- **Table pondérée** des récompenses (production, Ambre, capsule, dossier, jetons, relique, cosmétique) avec une valeur par unité
  (1 Ambre = x h, 1 jeton = y h, relique rare = z h…), un plafond par mois (ex. 300 Ambre, 10 jetons, 2 reliques) et des contraintes de
  tirage (pas deux fois la même récompense de suite, au moins un jalon par dizaine). Le commandant de saison reste au dernier palier.
- Tout est dans les règles (`GameRules.passGen`), éditable dans l'admin (règle n° 2), avec l'aperçu et « Régénérer » déjà présents.

### 5.3 Rythme mesuré (règle PRG-1)
- Points de passe tracés par source (`pointsBySource`), relevés dans la santé de l'équilibre.
- **Points par palier calculés**, plus seulement ajustés de ±15 % : à partir des points par jour du joueur médian et du joueur le plus actif
  du mois précédent, pour viser **jour 24 (médian)** et **jour 15 au plus tôt (plus actif)**, réglables. Garde-fous : 25 à 200 points par palier.
- Avant publication, le simulateur de durée vérifie la cible ; hors cible, le générateur corrige le nombre de points et le note dans
  « Pourquoi ces chiffres ».

### 5.4 Prérequis
Défis cumulés actuels conservés, étendus à **tous les objectifs suivis** (raids repoussés, assauts de boss, épisodes…) avec un poids par
type dans les règles. Mêmes cibles de jour que 5.3.

### 5.5 Chroniques générées dès novembre
- Le générateur écrit **chaque mois** (épisodes, objectifs et nombres depuis l'activité réelle, récompenses par budget comme 5.2, boss, textes,
  codex, jours d'ouverture).
- Les mois écrits à la main (novembre → mars) passent dans une **bibliothèque** : l'admin peut en choisir un pour un mois donné (« utiliser le
  chapitre écrit ») ; sinon le chapitre est généré. Leurs textes enrichissent les banques de répliques du générateur.
- Le thème du chapitre suit celui du passe du mois (même faction, même boss, mêmes couleurs) pour un mois cohérent.

### 5.6 Réglages (règle n° 2)
Nouveau groupe `passGen` (budget, courbe, jalons, valeurs, poids, plafonds, cibles de jour) et `chronicleGen` (budget des épisodes,
types d'objectifs autorisés, difficulté min/max), visibles dans Admin → Générateur et dans « Tous les réglages ».

## 6. Lots
1. **6.8.0** (livré) : traçage des points par source + santé du passe ; titres groupés (AU3 C) ; un seul passe par mois ; bibliothèque
   des chapitres écrits et chapitres générés dès novembre (avancé du lot 3 à la demande de l'utilisateur).
2. **6.8.1** : récompenses par budget, points par palier calculés, prérequis étendus, contrôle par simulation avant publication (`passGen`).
3. **6.8.2** : tables du générateur de Chroniques (`chronicleGen`), récompenses des épisodes par budget, thème commun passe/chapitre.

## 7. Invariants (tests)
- Un passe généré : 30 paliers, budget total dans ±5 % de la cible, plafonds respectés (Ambre, jetons, reliques), jalons présents.
- Même graine, même mois → même passe (régénération stable).
- Simulation : joueur médian au dernier palier entre les jours 22 et 26, plus actif pas avant le 15.
- Chapitre généré : 4 épisodes, objectifs autorisés, récompenses dans le budget, thème du passe.

## 8. Risques
- Novembre : les joueurs n'ont pas encore vu le chapitre écrit ; le remplacer ne retire rien. Le passe de novembre est déjà généré.
- Le budget en heures dépend de la production : un joueur très productif reçoit plus en ressources, comme aujourd'hui (récompenses en heures).
