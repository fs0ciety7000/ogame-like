# Proposition : progression, suites de la revue AU3

Statut : **en attente de décision**. Constats : `docs/audit/2026-10-06-au3-progression.md`.

## 1. Le problème vu par le joueur
« J'ai fini le passe en une semaine, et maintenant il ne sert plus à rien jusqu'au mois prochain. »

## 2. Benchmark
- Clash of Clans (Gold Pass) : dimensionné pour un joueur régulier sur ~4 semaines ; après le dernier palier, des **paliers bonus**
  répétables (ressources) gardent l'intérêt.
- Fortnite / Rocket League : les défis quotidiens et hebdomadaires plafonnent l'avance ; un joueur très actif finit vers les 2/3 de la
  saison, pas en une semaine.
- Jeux de gestion mobiles : la cible courante est **50 % des actifs au dernier palier en fin de saison**, 10 à 20 % une semaine avant.

## A. Rythme du passe (PRG-1, PRG-3)

| Option | Effet |
|:--|:--|
| A1 | **Tracer les points par source** (`pointsBySource` dans l'état du passe) et ajouter à la santé de l'équilibre : jour médian de fin, part des actifs ayant fini, points par source |
| A2 | Régler tout de suite le rythme (points par palier 40 → 120) sans connaître la source des 1 200 points |
| A3 | Ne rien changer |

**Recommandation : A1 d'abord**, puis une vérification en production (configuration du passe d'octobre, journal admin : points ajoutés à la main ?).
Ensuite, cible chiffrée : **un joueur actif finit vers le 24e jour**, le plus actif pas avant le 15e. Le réglage se fait dans l'admin (points
par palier, barème par source), sans code. Le simulateur de durée du passe (5.15.4) sert à vérifier la cible avant de publier.

## B. Après le dernier palier (PRG-2)

| Option | Effet | Pour | Contre |
|:--|:--|:--|:--|
| B1 | **Palier bonus répétable** : tous les 120 points après le dernier palier, 1 jeton de casino (10 par mois au plus) | garde un objectif, sans inflation | une monnaie de plus à suivre |
| B2 | Tout surplus devient de l'Ambre (1 Ambre pour 4 points, 150 par mois au plus) | simple | pousse l'Ambre (monnaie rare) |
| B3 | Ne rien changer | aucun code | 24 jours sans passe |

**Recommandation : B1**, réglable dans l'admin (taille du palier bonus, jetons, plafond). À faire après A.

## C. Titres en série (PRG-4)

| Option | Effet |
|:--|:--|
| C1 | **Liste de titres groupée par famille** : seul le plus haut palier d'une famille est proposé (« Magnat IV »), les autres restent dans la vitrine |
| C2 | Ne plus donner de titre aux paliers intermédiaires (seulement le dernier) | retire des titres déjà gagnés |

**Recommandation : C1**, sans retirer de titre.

## D. Rythme des succès (PRG-5)
Suivi seulement : ajouter à la santé de l'équilibre « succès débloqués par semaine » et la part des succès obtenus par le joueur médian.
Une nouvelle couche d'objectifs longs (succès de saison) se décidera avec ces chiffres.

## Lots proposés
1. **6.8.0** (A1 + C1 + suivi D) : points par source, santé du passe et des succès, titres groupés. Sans effet sur l'équilibre.
2. **6.8.1** (B1 + réglage du rythme) : après relecture de la production et décision sur la cible.
