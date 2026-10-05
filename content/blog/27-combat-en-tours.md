---
slug: combat-en-tours
title: "5.19 : le combat passe en tours, avec points de vie, riposte et retraite"
excerpt: "Fini le duel de deux nombres. Les flottes s'affrontent désormais tour par tour : la résistance devient des points de vie, les défenses ripostent, l'attaquant peut battre en retraite. Pourquoi, comment, et ce que ça change pour toi."
category: mises-a-jour
tags: [combat, équilibrage, unités, formations, PNJ]
version: "5.19.0"
cover: /assets/units/etoile_noire.webp
---
> [!LORE] Note de l'amirauté
> « Un assaut ne se gagne pas sur le papier. Il se gagne au troisième tir, quand l'ennemi tient encore debout et que tes pilotes regardent la jauge de coque. »

> [!NOTE] Valeurs par défaut
> Les chiffres de ce billet sont les réglages par défaut du moteur. L'administration peut les ajuster. La page **Formules** du jeu affiche toujours les tiens.

## Pourquoi changer

Jusqu'ici, un combat se résumait à comparer deux nombres : l'attaque de la flotte contre la défense de la base. Le plus fort gagnait. L'écart décidait des pertes. L'audit des combats réels a montré trois problèmes :

- **L'attaquant gagnait trop souvent** : 69 % des attaques entre joueurs.
- **Les vaisseaux à quai ne servaient presque à rien** en défense : 10 % de leur puissance.
- **La stat de « défense » des unités comptait à peine.** Une Roquette (60 d'attaque, 0 de défense) valait mieux que toutes les autres défenses pour le prix.

## Le nouveau combat en un coup d'œil

| | Avant | Maintenant |
|:--|:--|:--|
| Déroulé | un seul échange | jusqu'à **8 tours** |
| Stat « défense » | s'ajoutait à la puissance | devient la **résistance** : **PV = RÉS × 30** |
| Défenses | comparées à l'attaque | **ripostent** à chaque tour |
| Vaisseaux à quai | 10 % de leur puissance | **50 %** engagés (Riposte 100 %, Bunker 0 %) |
| Bouclier | réduisait l'attaque adverse | réduit les **dégâts reçus** par la défense |
| Fin du combat | toujours au premier échange | destruction, **retraite** ou dernier tour |

## Un tour, pas à pas

1. Les deux camps tirent **en même temps**. Les dégâts d'un camp = somme des attaques de ses unités encore debout, avec les bonus (formation, officiers, reliques).
2. La défense reçoit ces dégâts moins le **bouclier** (jusqu'à 15 %).
3. Les dégâts se **répartissent entre les types d'unités** selon leurs points de vie : une pile de 1 000 Roquettes encaisse plus qu'une seule Lance gravitationnelle.
4. On fait les comptes, puis on recommence, jusqu'à ce que :
   - **le défenseur tombe sous 20 %** de ses points de vie : victoire de l'attaquant ;
   - **l'attaquant perde 50 %** de ses points de vie (30 % en formation Prudente) : il **décroche**, c'est une défaite ;
   - un camp soit détruit ;
   - ou que les **8 tours** soient joués. L'attaquant gagne s'il garde au moins 30 points d'avance en points de vie restants. Sinon, c'est une défaite s'il est derrière, une égalité sinon.

> [!TIP] La retraite protège ta flotte
> Avant, une attaque ratée pouvait te coûter 70 % de la flotte engagée. Maintenant ta flotte décroche d'elle-même. Une attaque ratée coûte le plus souvent 50 à 65 % de la flotte (davantage face à une défense écrasante), et 25 à 35 % en formation **Prudente**.

## Exemples chiffrés

Profils de test sans technologie : « milieu de partie » (800 chasseurs niv. 5, 300 frégates, 600 défenses) et « fin de partie » (150 Croiseurs Nova niv. 6, 3 000 chasseurs niv. 8, 1 600 défenses lourdes).

| Combat | Issue | Tours | Pertes attaquant | Pertes défenseur |
|:--|:--|--:|--:|--:|
| Fin de partie → milieu de partie | victoire | 2 | 2 % | 100 % |
| Flotte pure → base bunker de même niveau | victoire | 8 | 38 % | 87 % |
| Milieu de partie → flotte pure plus forte | retraite | 2 | 83 % | 11 % |
| Prime « Chasse » (80 % de ta flotte) | victoire | 2 à 8 | 32 à 42 % | 87 à 98 % |
| Embuscade d'expédition à 60 % | victoire | 2 à 5 | 17 à 27 % | 81 à 100 % |

Ce qui ne change pas :
- Un ennemi PNJ à la puissance de ta flotte reste **trop fort sans bonus**. Pour les primes de haut niveau et les repaires, il faut toujours les Traqueurs Kesh, l'Assaut ou tes officiers.
- Un raid de faction à notoriété basse se brise sur une base défendue. À notoriété 5 ou plus, il passe si tu n'as pas renforcé tes défenses.

## Les ennemis PNJ

Primes, repaires, raids de faction et embuscades n'ont pas de vraies unités. Ils combattent comme une **flotte de même composition que la tienne**, à la puissance annoncée :
- même rapport entre attaque et points de vie ;
- un peu moins de points de vie (80 %).

Résultat : la puissance affichée sur la fiche d'une prime ou d'un repaire reste un bon repère. En dessous de ta propre attaque, tu gagnes. Au-dessus, il te faut des bonus.

## Formations et postures

- **Assaut** : +10 % de dégâts à chaque tour, +15 % de pertes après la bataille.
- **Prudente** : −10 % de dégâts, −25 % de pertes, et retraite dès **30 %** de points de vie perdus.
- **Raid** : −15 % de dégâts, +30 % de cale.
- **Riposte** (défense) : tous les vaisseaux à quai se battent, et tous sont exposés.
- **Bunker** (défense) : défenses +8 %, vaisseaux à quai à l'abri.

## Après le combat

Rien ne change ici, et aucun dégât ne reste d'un combat à l'autre :
- 60 % des défenses détruites se reconstruisent seules ;
- l'**Atelier de réparation** récupère une part des vaisseaux perdus, en attaque comme en défense.

## Les unités recalées

Avec les points de vie, la résistance compte vraiment. Trois unités sortaient franchement de la norme :

| Unité | Avant | Maintenant | Pourquoi |
|:--|:--|:--|:--|
| Étoile Noire | 500 / 500, +1 700 par niveau | **4 000 / 4 000, +900 par niveau** | inutile au niveau 1, écrasante au niveau 10 (15 800) ; désormais 12 100 au niveau 10 |
| Roquette | 60 ATK / 0 RÉS | **25 ATK / 3 RÉS** | quatre fois plus rentable que toutes les autres défenses |
| Traqueur Kesh | 9 000 res., 25 places | **4 500 res., 3 places** | 0,3 × la norme par coût, 0,1 × par place |

> [!NOTE] Tes réglages sont conservés
> Si l'administration de ton serveur a déjà modifié l'une de ces unités, ses valeurs ne bougent pas.

## Classes d'unités

La page **Unités** se range maintenant en deux onglets, **Attaque** et **Défense**. Chaque unité porte une classe calculée d'après sa **valeur de combat**, √(attaque × points de vie) :

- **Faible**, **Moyen** et **Fort** : un tiers des unités de la catégorie chacun ;
- **Soutien** : les unités sans attaque (sondes).

Pourquoi la racine du produit ? Au combat en tours, deux armées s'usent l'une l'autre. Doubler l'attaque ou doubler les points de vie revient au même.

## Ce qui arrive ensuite

L'administration dispose d'un nouvel **audit des unités** : valeur par coût et par place de hangar, comparée à la médiane, avec un diagnostic pour chaque unité. Nous le suivrons sur les combats réels des prochaines semaines. De nouvelles unités aux rôles marqués sont à l'étude : une unité très résistante qui encaisse pour la flotte, et une défense légère anti-essaim.

Bons combats, commandant.
