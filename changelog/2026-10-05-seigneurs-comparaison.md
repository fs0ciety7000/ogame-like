---
version: 5.17.2
iteration: 105
date: 2026-10-05
title: Plus aucune protection pour les PNJ et comparaison de deux joueurs
---
Un correctif pour les joueurs avancés, et un nouvel outil de comparaison pour l'équipe.

## Correctif : les Seigneurs de guerre
- Un joueur très avancé ne pouvait plus attaquer aucun Seigneur : « Ce joueur est trop faible pour toi (moins d'un tiers de ton XP) ». L'XP des Seigneurs suit la médiane des joueurs actifs, pas la tienne. Au-delà de trois fois l'XP du plus fort, tous devenaient intouchables.
- Les PNJ n'ont plus aucune protection de joueur : ni écart d'XP, ni protection de débutant, ni vacances, ni bouclier après défaite, ni Voile, ni bouclier d'ascension. Seul le délai entre deux attaques sur le même Seigneur reste dû.
- Une victoire sur un Seigneur bien plus faible que toi rapporte peu d'XP (4 XP au minimum, selon l'écart de puissance) : pas de farm possible.

## Administration : comparer deux joueurs
- Dans « Activité & audit », coche deux joueurs, ou tape deux pseudos dans « Comparer ».
- Pour chaque joueur, la vue côte à côte montre :
  - les signaux d'alerte ;
  - la répartition de l'XP par source ;
  - l'activité heure par heure.
- Un tableau chiffré met en regard une trentaine d'indicateurs avec leur rapport : XP par jour, XP par source, part du plafond des missions, heures actives, combats, missions, record de missions en un jour, temps de jeu, échanges, actions de l'équipe… Les écarts de plus de trois fois ressortent en or.
- Les combats entre les deux joueurs sont signalés, et la comparaison se copie en JSON.

## Administration : chiffres justes juste après le déploiement
- Le registre d'XP n'existe que depuis la 5.17.1. Jusqu'ici, dès qu'il contenait quelques heures, il remplaçait la reconstitution sur 24 heures et 7 jours : un joueur pouvait n'afficher que quelques centaines d'XP sur la semaine.
- Le registre n'est maintenant utilisé que s'il couvre toute la période demandée. Sinon, l'XP reconstituée depuis les notifications fait foi, et les signaux d'alerte sont calculés sur ces chiffres.
