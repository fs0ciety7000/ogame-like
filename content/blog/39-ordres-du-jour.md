---
slug: ordres-du-jour
title: "5.28.1 à 5.30 : correctifs, un jeu plus léger, et les Ordres du jour"
excerpt: "Trois mises à jour d'un coup : des règles remises d'aplomb, un jeu qui charge et calcule moins, et un seul écran pour tout ce qui se fait chaque jour."
category: mises-a-jour
tags: [qualite-de-vie, performance, correctifs, game-design]
version: "5.30.0"
---
> [!LORE] Note de l'intendance
> « Un commandant qui court d'un pont à l'autre pour signer ses ordres n'a plus le temps de commander. »

Après la Cale sèche, on a audité tout le jeu : chaque système a maintenant sa fiche, ses règles et ses chiffres. Cet audit a donné une feuille de route. Voici ses trois premiers lots.

## 5.28.1 : des règles remises d'aplomb

| Avant | Maintenant |
|:--|:--|
| L'épave d'expédition ajoutait des vaisseaux à la flotte, même hangar plein | Les vaisseaux trouvés attendent à l'Atelier, « prêts », et rentrent quand il y a de la place |
| La remise automatique de la Cale sèche (niveau 10) attendait ta prochaine action | Elle tourne aussi au retour de chaque flotte |
| Intendance de flotte et rabais de bâtiments sans effet sur une relique, un officier ou un module | Appliqués, jusqu'à −50 %, en plus des technologies |
| Le seuil des colonies comptait les bâtiments jamais construits | Seuls les bâtiments construits comptent |

Un test vérifie maintenant que **chaque bonus déclaré est lu** par le moteur. Un bonus « fantôme » ne passera plus.

## 5.29 : un jeu plus léger

- Les fenêtres rares (annonces, Ctrl+K, bilan de saison…) se chargent après l'écran de jeu : 45 Ko de moins au démarrage.
- Tous les chronomètres battent sur une seule horloge, alignée sur la seconde, et s'arrêtent quand l'onglet est caché.
- Côté serveur, 16 tâches de fond passent en 3 réveils groupés : 78 réveils par heure au lieu de 300.

## 5.30 : les Ordres du jour

Le constat : pour ne rien oublier, il fallait passer par six écrans chaque jour (série, missions, contrats, primes, expéditions, alliance, passe, Chroniques).

La nouvelle page **Ordres du jour**, en tête de la barre latérale :

1. une **liste de contrôle** : chaque ligne dit ce qui attend et ouvre l'écran qui agit ;
2. **« Tout réclamer »**, qui prend aussi la série, les missions du jour et les épisodes des Chroniques ;
3. une **seule pastille**, au lieu de quatre ;
4. les **rendez-vous des 7 prochains jours**, avec les week-ends chargés signalés.

Aucune récompense ne change : on a seulement rangé.

## Et ensuite ?

Deux idées attendent vos retours :

- fusionner contrats et missions du jour en 4 objectifs ;
- étaler les boss et les guerres pour n'avoir qu'un temps fort par week-end.

Les deux touchent l'économie : on les décidera avec les chiffres de la communauté.
