---
version: 5.19.0
iteration: 107
date: 2026-10-05
title: Combat en tours, points de vie et retraite
---
Les combats ne se jouent plus en un seul échange de puissances : ils se déroulent en tours, avec des points de vie, une riposte et une retraite.

## Le combat en tours
- Chaque unité a une **attaque** (dégâts par tour) et une **résistance** (RÉS, l'ancienne « défense »).
- **Points de vie d'une unité = résistance × 30.**
- À chaque tour, les deux camps tirent en même temps. Les dégâts se répartissent entre les types d'unités selon leurs points de vie.
- Les défenses et les vaisseaux à quai ripostent dès le premier tour.
- Le **bouclier** planétaire réduit les dégâts que reçoit la défense (il réduisait l'attaque adverse).
- **8 tours au plus**. L'attaquant gagne quand il reste au défenseur moins de 20 % de ses points de vie, ou s'il garde une nette avance (30 points) au dernier tour.
- **Retraite** : l'attaquant décroche après avoir perdu 50 % de ses points de vie (30 % en formation Prudente). Le combat est alors perdu, mais une partie de la flotte rentre.
- Une flotte sans attaque ne peut rien gagner.

## Vaisseaux à quai et postures
- Les vaisseaux à quai défendent à **50 %** (10 % avant), et la même part s'expose aux tirs.
- **Riposte** : 100 % (25 % avant). **Bunker** : 0 %, toujours à l'abri.
- Après le combat, rien ne change :
  - 60 % des défenses détruites se reconstruisent seules ;
  - les vaisseaux perdus passent par l'**Atelier de réparation**, qui en récupère une part.
  - Aucun dégât ne reste d'un combat à l'autre.

## Formations
- Le bonus d'attaque d'une formation (Assaut +10 %, Prudente −10 %, Raid −15 %) joue sur les dégâts de chaque tour.
- Le malus de pertes (Assaut +15 %, Prudente −25 %) s'applique aux pertes de l'attaquant après la bataille.

## Ennemis PNJ
- Primes, repaires, raids de faction et embuscades d'expédition n'ont pas de vraies unités. Ils combattent comme une flotte de même composition que la tienne, à la puissance annoncée.
- Les seuils restent les mêmes : un ennemi à la puissance de ta flotte reste trop fort sans bonus (Traqueurs Kesh, Assaut, officiers).

## Unités
- **Étoile Noire** :
  - 4 000 ATK / 4 000 RÉS au niveau 1 (500 avant) ;
  - +900 par niveau (+1 700 avant), soit 12 100 au niveau 10 (15 800 avant).
- **Roquette** : 25 ATK / 3 RÉS (60 / 0 avant). Elle restait quatre fois plus rentable que toutes les autres défenses.
- **Traqueur Kesh** : 3 000 ferraille / 1 500 énergie (6 000 / 3 000 avant), 3 places de hangar (25 avant).
- Page Unités :
  - onglets **Attaque** et **Défense** ;
  - chaque unité porte une **classe** calculée d'après ses stats : Faible, Moyen, Fort (ou Soutien pour les sondes) ;
  - filtre par classe ;
  - l'infobulle de la résistance donne les points de vie au combat.
- Les valeurs personnalisées dans l'administration sont conservées : la mise à jour ne change que les valeurs encore par défaut.

## Rapports et outils
- Rapports de combat : nouvelle frise « Déroulé », avec les points de vie de chaque camp tour par tour et la retraite éventuelle.
- Le simulateur et l'estimation de la fenêtre d'attaque indiquent le nombre de tours et la retraite.
- La page Formules explique le nouveau calcul.

## Administration
- Règles → Combat : nouvelle section « Combat en tours » :
  - points de vie par résistance ;
  - nombre de tours ;
  - seuils de retraite et de victoire ;
  - points de vie des ennemis PNJ.
- Équilibrage : nouveau tableau « Unités au combat en tours ». Valeur de combat √(ATK × PV), rapportée au coût et à la place de hangar, comparée à la médiane de la catégorie, avec diagnostic (dans la norme, trop forte, piège).
- Seigneurs de guerre : leur armée suit le nouveau calcul de puissance, et leur croissance ne dépasse plus le rythme prévu sur les petites armées.
