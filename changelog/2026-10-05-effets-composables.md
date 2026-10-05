---
version: 5.23.0
iteration: 114
date: 2026-10-05
title: Effets sur mesure, JcJ dégressif, espionnage en masse et décollage programmé
---
Un gros lot : des effets qu'on compose dans l'administration, un JcJ plus souple, des outils pour enchaîner les combats et des seigneurs qui s'adaptent.

## Effets composables
- **Un effet se compose maintenant** : une grandeur, une cible et une portée.
  - **Grandeurs ciblées** : attaque, points de vie, coût et temps de production d'**une unité**, d'**une classe** (Faible, Moyen, Fort) ou d'**une catégorie** (vaisseaux, défenses). S'y ajoutent l'avantage de classe et le bouclier planétaire.
  - **Portées** : partout, contre les joueurs, contre les PNJ (pirates, primes, expéditions, boss, seigneurs) ou contre les seigneurs seulement.
- **Reliques, technologies et officiers** acceptent ces effets dans l'administration.
- **Catalogue de 55 effets prêts à l'emploi**, inspirés des unités, des bâtiments et des modes de jeu. Exemples :
  - « Veille des Sentinelles » ;
  - « Tueur de seigneurs » ;
  - « Forge des lourds » ;
  - « Soudeurs de nuit » (+ % de PV/s à l'Atelier).
- **Huit nouvelles reliques** : Sceau des Sentinelles, Plaque de rempart, Lame du duelliste, Trophée de seigneur, Balise de traque, Compas du tacticien, Enclume des colosses, Navette-mère.
- **Partout dans le jeu** :
  - les combats, le simulateur et l'estimation de la fenêtre d'attaque tiennent compte de ces effets ;
  - les coûts réduits s'affichent sur la page Unités et dans les colonies.

## Joueur contre joueur
- **Plus de blocage à ×3 d'écart d'XP** : contre une cible plus de 3 fois moins expérimentée, l'attaque passe avec **butin et XP réduits** (25 % au moins). La fenêtre d'attaque affiche le pourcentage gardé.
- L'attaque reste refusée au-delà de 12 fois d'écart.
- **Match nul** : la flotte emporte 30 % du butin d'une victoire.

## Seigneurs de guerre
- **Recalage immédiat** : un seigneur au-delà de 2 fois sa puissance visée revient aussitôt à 1,2 fois. Les 243 M de Zhar'Kesh fondent à la prochaine tâche horaire.
- **Contre-composition** : battu par un joueur, un seigneur renforce pendant 7 jours la classe qui bat celle de son vainqueur, à puissance égale.
- **Estimation de combat contre un seigneur** : son rang, son trait et tes unités d'élite entrent maintenant dans le calcul.

## Confort de jeu
- **Sondes en un clic**, depuis le classement et la carte.
- **Espionnage en masse** : jusqu'à 5 cibles d'un coup, puis un tableau comparatif de leurs derniers rapports (ressources, vaisseaux, défenses, puissance).
- **Décollage programmé** (de +15 min à +12 h) : les unités partent aussitôt du hangar, la flotte reste rappelable.
- **Après un combat** :
  - réattaque avec la même flotte, ou riposte si tu étais en défense ;
  - « Enregistrer cette flotte » l'ajoute à tes raccourcis.
- **Notifications** : chaque catégorie se marque lue en l'ouvrant, ou d'un bouton.

## Animations
- **Le replay 3D suit le curseur des tours** du rapport. Choisis un tour : la scène y saute. Le curseur avance avec la scène.
- **Alerte d'attaque imminente** : une petite scène 3D montre la flotte hostile approcher de ta planète au rythme du compte à rebours.
- **Onglets** : une ligne de balayage aux couleurs du thème révèle le contenu.

## Administration
- **Seigneurs** :
  - historique de leur rang et de leur puissance ;
  - alerte quand l'un d'eux dépasse 1,5 fois le 2e joueur.
- **« Et si ? »** (onglet Équilibrage) : teste un changement sur les empires réels du serveur, avant de l'appliquer. Trois changements possibles :
  - puissance des seigneurs ;
  - stats d'une unité ;
  - avantage de classe.
- **Journal de contenu** (onglet Journal) : chaque enregistrement garde l'état précédent (30 versions par section). Un clic y revient, et ce retour se défait aussi.

## Performance
- Le rapport de combat ne se charge qu'au premier combat affiché : le jeu démarre plus léger.
