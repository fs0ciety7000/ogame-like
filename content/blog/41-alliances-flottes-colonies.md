---
slug: alliances-flottes-colonies
title: "5.33 : des alliances qui grandissent, des flottes qui comptent, des colonies qui livrent"
excerpt: "Trois chantiers de la feuille de route d'automne livrés d'un coup : Quartiers fédérés, emplacements de flotte et routes logistiques."
category: mises-a-jour
tags: [alliances, flottes, colonies, confort, game-design]
version: "5.33.0"
---
> [!LORE] Note de l'Amirauté
> « Une flotte partout, c'est une flotte nulle part. »

## Ce qu'on a mesuré

Comme pour la 5.32, on est parti des chiffres réels du serveur, comptes anonymisés :

| Mesure | Valeur |
|:--|:--|
| Alliances | 2, de 6 (pleine) et 4 membres |
| Flottes en vol en même temps, au plus, par joueur | de 1 à 11 |
| Missions sur la période | 241 recyclages, 123 primes, 119 espionnages… et 17 transports |

Trois constats : une alliance bute sur son plafond, rien ne limite les flottes, et presque personne ne rapatrie le stock de ses colonies.

## Des alliances qui grandissent

Le plafond passe de **6 à 8 membres**. Au-delà, c'est un projet commun : la recherche **Quartiers fédérés** ouvre **4 places par niveau**,
jusqu'à **20 membres**. Elle coûte comme les autres recherches d'alliance (50 M de chaque ressource commune au niveau 1, puis ×2).

Le boss d'alliance suivait déjà la taille : ses points de vie dépendent de la puissance des membres actifs, son coût des heures de production
de chacun. Une alliance plus grande n'en fait pas une promenade.

## Des flottes qui comptent

Tu as désormais **10 emplacements de flotte**. Les **sondes** et les **expéditions** n'en prennent pas (les expéditions gardent leur propre
limite). Le panneau Flottes affiche « n / 10 ».

Pourquoi 10 et pas 4 comme dans OGame ? Parce que 9 joueurs sur 12 ont déjà eu plus de 4 flottes en vol en même temps. Une limite stricte serait vécue comme
un recul. Celle-ci ne retire rien aujourd'hui, mais elle existe, se lit, et pourra se débloquer plus tard.

Pour les missions qu'on répète dix fois par jour, le bouton **Relancer** renvoie la dernière : mêmes vaisseaux, même cible, mêmes options.
Le serveur revérifie tout, comme pour un départ normal.

## Des colonies qui livrent

Chaque colonie peut avoir une **route logistique** :

| Réglage | Choix |
|:--|:--|
| Cadence | toutes les 6, 12 ou 24 h |
| Réserve gardée sur place | 0, 20 ou 50 % de l'entrepôt de la colonie |
| Frais | 10 % perdus en route |
| Plafond | jamais au-delà de l'entrepôt de ta planète mère |

Le convoi ne mobilise aucun vaisseau et ne se fait pas piller en route. En échange, il coûte 10 %. Le transport par flotte reste gratuit :
à toi de choisir entre confort et rendement. Le gisement rare de la colonie suit la même route.

## Et ensuite

- Relever dans deux semaines la taille des alliances et la part des colonies qui ont une route.
- Si une alliance dépasse 12 membres : revoir territoires et garnisons.
- Plus tard : route inverse (planète mère → colonie) et flotte basée sur les colonies.
