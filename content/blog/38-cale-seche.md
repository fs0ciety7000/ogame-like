---
slug: cale-seche
title: "5.28 : la Cale sèche, et des hangars qui tiennent la route"
excerpt: "Pourquoi des hangars dépassaient leur capacité, ce qu'on a corrigé, et le nouveau bâtiment qui libère le hangar après une défaite."
category: mises-a-jour
tags: [atelier, cale-seche, hangars, ascension, game-design]
version: "5.28.0"
cover: /assets/buildings/cale_seche.webp
---
> [!LORE] Journal du chef d'atelier
> « On ne répare pas une coque au milieu du hangar. On la sort, on la pose sur un berceau, et on laisse la place aux neuves. »

Plusieurs d'entre vous l'ont vu : un hangar affichait plus de vaisseaux que de places, et le chantier refusait toute construction. Voici ce qui s'est passé, ce qu'on a changé, et le nouveau bâtiment qui en sort.

## Ce qui s'est passé

Les combats ne créent pas de vaisseaux : on l'a vérifié par simulation, attaque à quai, en vol, défense avec Atelier. Le dépassement venait d'ailleurs :

| Cause | Effet |
|:--|:--|
| Entre la 5.20 et la 5.22, l'Atelier n'enregistrait pas les vaisseaux sauvés. Vous avez reconstruit dans les places libérées, puis la 5.22 a rendu tous ces vaisseaux d'un coup. | hangar au-delà de sa capacité |
| L'Ascension remettait les hangars au niveau 1 et gardait toute la flotte. | surcharge à chaque Ascension |
| Les bonus « Hangar en extension » et « Casemates » n'étaient pas lus. | bonus affiché, sans effet |

Et un problème de fond : depuis la 5.20, **un vaisseau en réparation garde sa place au hangar**. Après une grosse défaite, 3 000 chasseurs sauvés, c'est 6 000 places bloquées pendant plus de deux heures à l'Atelier niveau 10.

## Ce qui change tout de suite

- **Rien n'est détruit.** Un hangar en surcharge est signalé sur la page Unités avec trois sorties : améliorer le hangar, envoyer une flotte, vendre l'excédent. Seule la construction attend.
- **L'Ascension garde les hangars** : ta flotte est gardée, son logement aussi.
- **Les bonus de hangar s'appliquent**, et la technologie Extension des hangars agrandit aussi les hangars de défense des colonies.
- **Un seul calcul des places**, le même pour la page Unités, les Statistiques et le serveur.

## La Cale sèche

On a regardé ce que font les autres. OGame répare les épaves dans un dock **à part**, et c'est au joueur de remettre les vaisseaux en service. Clash of Clans **met en attente** quand le camp est plein, il ne détruit pas. Les jeux à hôpital font de la capacité de soin **un bâtiment qu'on améliore**. La Cale sèche reprend ces trois idées.

| Élément | Valeur |
|:--|:--|
| Déblocage | Atelier niveau 5, puis 20 de chaque ressource rare |
| Postes | 1 000 par niveau (en places de hangar) |
| Remplissage | vaisseaux prêts d'abord, puis les lots par ordre d'arrivée |
| Le surplus | garde sa place au hangar, comme avant |

Un vaisseau réparé en cale rentre au hangar **s'il y a de la place**. Sinon il attend, « prêt », et tu le remets en service d'un clic.

### Les paliers

| Niveau | Palier | Ce que ça débloque |
|--:|:--|:--|
| 5 | Triage | démanteler en cale à 60 % du prix ; réglage après combat : tout réparer, démanteler ce qui ne tient pas, tout démanteler |
| 10 | Remise automatique | les prêts rentrent seuls dès qu'une place se libère ; Atelier +10 % |
| 15 | Priorités | la classe de ton choix est réparée en premier |
| 20 | Cale orbitale | +5 points de vaisseaux sauvés après chaque combat |

> [!TIP]
> Après une défaite lourde, règle le Triage sur « démanteler ce qui ne tient pas en cale » : ce qui ne trouve pas de poste est recyclé tout de suite, ton hangar reste libre, et tu récupères de quoi reconstruire.

## Comment on travaille désormais

Pour ne plus se mélanger les pinceaux, chaque système suit la même chaîne : le problème vu par le joueur, une preuve dans le moteur, une comparaison avec d'autres jeux, deux options chiffrées, une décision, puis la livraison par lots. Les règles du jeu ont maintenant leur document de référence, avec des **invariants** vérifiés par des tests. Exemple : aucune unité ne peut apparaître hors construction, retour de flotte ou réparation, et une migration ne dépasse jamais un plafond sans le dire.
