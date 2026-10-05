---
version: 5.17.1
iteration: 104
date: 2026-10-05
title: Audit de l'activité des joueurs et XP des comptes test
---
Un nouvel outil pour l'équipe : voir qui joue, ce qui tourne chez chacun et d'où vient l'XP de chaque joueur, avec des signaux d'alerte chiffrés.

## Correctif
- Un compte test termine ses missions aussitôt. Ses missions ne rapportent donc plus d'XP : avant, il pouvait les relancer en boucle et grimper au classement sans limite. Les ressources des missions restent versées, et l'XP déjà gagnée reste acquise.

## Administration : activité et audit
- Nouvel onglet « Activité & audit » (Joueurs & communauté), actualisé toutes les 30 secondes.
- Vue de tous les joueurs, sur la dernière heure, 24 heures ou 7 jours :
  - XP gagnée et répartition par source (missions, attaques, défenses, expéditions, primes, factions, succès, contrats) ;
  - XP de missions comparée au plafond théorique (toutes les missions relancées sans pause : 960 XP par heure, 23 040 par jour hors bonus d'événement) ;
  - heures actives sur 24 h, combats, ce qui est en cours (missions, chantiers, recherches, flottes) ;
  - signaux d'alerte.
- Audit complet d'un joueur (clic sur une ligne, ou recherche par pseudo) :
  - verdict avec les signaux du plus grave au moins grave ;
  - XP par source sur 1 h, 24 h et 7 jours, comparée aux autres joueurs actifs (médiane, 90e centile) ;
  - activité heure par heure sur 24 h, XP par heure sur 7 jours ;
  - missions, chantiers et flottes en cours ;
  - adversaires et derniers combats, échanges au marché, cadeaux, actions de l'équipe sur le compte ;
  - chronologie des 200 derniers événements et toutes les statistiques du joueur.
- Signaux d'alerte :
  - compte test actif ;
  - XP de missions au-delà du maximum possible sur 24 h, ou à plus de 70 % de ce maximum ;
  - moyenne d'XP par jour depuis l'inscription hors de portée ;
  - activité presque 24 h sur 24, ou plus de 30 heures d'affilée ;
  - XP plus de trois fois au-dessus du 90e centile des joueurs actifs ;
  - combats répétés entre deux mêmes joueurs (comptes liés ou entente) ;
  - actions de l'équipe sur le compte.
- Chaque gain d'XP est désormais inscrit dans un registre horaire par source, gardé 8 jours. Pour la période d'avant, l'XP est reconstituée à partir des notifications des joueurs, qui sont conservées.
