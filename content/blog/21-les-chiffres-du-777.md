---
slug: les-chiffres-du-777
title: "Les chiffres du 7-7-7 : combien de jetons pour le gros lot ?"
excerpt: "On a fait tourner la machine du Casino orbital 200 000 fois pour répondre à la question qu'on nous pose le plus : combien de jetons faut-il pour aligner trois 7 ? Réponse en tableaux."
category: equilibrage
tags: [casino, statistiques, jetons, équilibrage]
version: "5.15.0"
cover: /assets/casino/banniere-777.webp
---
> [!LORE] Note du croupier Kesh'Vaar
> « La machine ne triche pas, commandant. Elle est simplement très, très patiente. »

Depuis l'ouverture du Casino orbital, une question revient sans cesse : **combien de jetons faut-il pour décrocher le 7-7-7 ?** Plutôt que de répondre au doigt mouillé, on a fait les comptes, puis on les a vérifiés en simulant **200 000 joueurs** qui jouent jusqu'au gros lot.

## La règle du jeu, en une phrase

Chaque jeton lance la machine. Une **cerise rend le jeton** : on rejoue gratuitement. Un jeton n'est donc « perdu » que quand la série de tirages finit sur autre chose qu'une cerise ou le 7-7-7.

Depuis la 5.14.2, le 7-7-7 sort à **0,5 %** par tirage (contre 0,2 % avant) et rapporte **90 % du pot commun** (contre 50 %).

## Le résultat

En tenant compte des cerises, **chaque jeton a environ 0,59 % de chances** de finir sur le gros lot.

| | Réglage actuel (0,5 %) | Ancien réglage (0,2 %) |
|---|---:|---:|
| Chance par jeton | 0,59 % | 0,24 % |
| Jetons en moyenne | **170** | 425 |
| Un joueur sur deux l'a avant | **118 jetons** | 295 jetons |
| Neuf joueurs sur dix l'ont avant | 390 jetons | 976 jetons |

La simulation tombe sur les mêmes chiffres que le calcul, au dixième près. C'est aussi ce calcul qu'affiche la page du casino, dans « Tes chances au 7-7-7 ».

## Mes chances avec N jetons

| Jetons joués | Chance d'avoir eu le 7-7-7 |
|---:|---:|
| 20 | 11 % |
| 50 | 26 % |
| 100 | 45 % |
| 170 | 63 % |
| 200 | 69 % |
| 300 | 83 % |
| 500 | 95 % |

> [!TIP] La moyenne n'est pas une promesse
> 170 jetons, c'est la moyenne : certains l'ont au cinquième jeton, d'autres attendent plus de 400. La machine n'a pas de mémoire : avoir déjà beaucoup joué ne rapproche pas le prochain 7-7-7.

## Et en attendant le gros lot ?

Les autres combinaisons paient en heures de production de ton empire.

| Combinaison | Chance par tirage | Gain |
|---|---:|---|
| 7-7-7 | 0,5 % | 90 % du pot commun |
| Trois étoiles | 0,6 % | 6 h de production |
| Trois planètes | 1,2 % | 4 h |
| Triple BAR | 2,5 % | 3 h |
| Trois cerises | 4 % | 2 h |
| Deux 7 | 6 % | 1 h |
| Une cerise | 15 % | jeton rendu |

En moyenne, un jeton rapporte un peu plus de **20 minutes de production**, sans compter le gros lot.

## D'où viennent les jetons ?

| Source | Jetons |
|---|---|
| Jeton du jour (casino ouvert) | 1 par jour, réserve de 20 au plus |
| Défi de la semaine | 1 à 2 selon le palier atteint |
| Boss abattu (mondial, de saison, d'alliance) | 1 par participant, +2 pour le premier (+1 aux 2e et 3e) |
| Proie d'élite Kesh'Vaar | 2 |
| Seigneur de guerre pillé | 1 |
| Tournoi du casino | 5, 3 et 2 pour le podium |
| Divisions du classement (nouveau, 5.15) | 1 à 4 chaque lundi selon la division |
| Succès (nouveau, 5.15) | 1 en Or, 2 en Légendaire, 5 en Mythique |
| Butin des combats (nouveau, 5.15) | une chance après chaque victoire : boss 30 %, seigneurs 25 %, menaces 12 %, joueurs et expéditions 6 % |

Un joueur assidu ramassait **de l'ordre de 40 à 60 jetons par mois** avant les nouveautés de la 5.15 (butin et succès en plus), selon les boss et sa division : le 7-7-7 arrive alors en **trois à quatre mois** en moyenne, et environ **une chance sur quatre** de l'avoir dans le mois. Le pot commun, lui, grossit pendant ce temps avec les taxes du marché et des cadeaux.

## Plus l'adversaire est coriace…

Depuis la 5.15, chaque victoire a sa petite chance de laisser des jetons dans l'épave, en plus de son butin habituel. Cette chance grimpe face à un adversaire plus fort que toi : jusqu'à deux fois plus contre un ennemi deux fois plus puissant, et moitié moins contre une cible facile. Une longue expédition compte aussi comme plus risquée qu'une courte. La liste complète, avec les chiffres en vigueur, est sur la page du casino, dans « Gagner des jetons ».

> [!NOTE] Méthode
> 200 000 joueurs simulés, chacun jouant jusqu'à son premier 7-7-7, avec les probabilités en vigueur. Le calcul exact : chance par jeton = 1 − (1 − 0,005 − 0,15) / (1 − 0,15).
