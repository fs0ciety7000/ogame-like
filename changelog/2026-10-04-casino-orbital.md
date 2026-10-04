---
version: 5.12.0
iteration: 79
date: 2026-10-04
title: Le Casino orbital ouvre ses portes
---
Le pot commun du serveur devient un gros lot : une machine à sous « 777 » où chaque jeton peut rapporter la moitié du pot.

## Casino orbital
- [Nouveau] **Machine à sous 777** (Social → Casino) : trois rouleaux qui s'arrêtent l'un après l'autre, levier, rampe lumineuse, sons. La machine prend les couleurs de votre thème, et sa ligne de paiement passe au vert sur un gain. **Trois 7** remportent une part du **pot commun** (50 % par défaut) ; les autres combinaisons rapportent de 1 à 6 heures de production, et une cerise rend le jeton.
- [Nouveau] **Jetons** : un jeton offert chaque jour d'ouverture, et des jetons distribués par l'équipe lors des évènements. Touche **Espace** pour tirer.
- [Nouveau] **Annonce du gagnant** : écran de gros lot avec pluie de pièces, notification à tous les joueurs, palmarès des **gros lots** et fil des **derniers gains** sur la page.
- [Nouveau] **Ouvert à certaines heures** : le casino n'apparaît dans le menu que lorsqu'il est ouvert (chaque week-end par défaut, ou selon les créneaux choisis par l'équipe). Tous les joueurs sont prévenus à chaque ouverture.
- [Amélioration] Le tirage est fait par le serveur, avec des probabilités fixées et publiées dans la table des gains.

## Interface
- [Amélioration] **« Que faire maintenant ? »** et la file des chantiers : une même situation garde la même couleur partout. Un chantier, un labo ou des missions à l'arrêt sont une action à mener (couleur d'accent), un entrepôt plein une alerte, une récompense en doré.
- [Amélioration] Dernières pastilles harmonisées (série de contrats, rang du Hall of fame, seigneurs, biome des colonies, rangs d'alliance…).
- [Amélioration] **Nouveaux toasts** : panneau du cockpit, liseré et icône de la couleur du type (vert pour un succès, rouge pour une attaque, doré pour un cadeau…) et bouton « Voir » en pastille. Les notifications de la cloche suivent aussi les couleurs du thème.
- [Fix] Le compte à rebours de fin de saison du passe s'affiche en jours (« 27 j 13 h ») au lieu de « 661 h ».

## Administration
- [Admin] **Casino** (onglet Pot commun) : ouverture (ouvert, fermé ou programmé : week-ends et créneaux précis), jetons quotidiens et réserve maximale, part du pot, probabilités et gains de chaque combinaison avec l'espérance calculée, et **jetons offerts** à tous, aux actifs ou à un joueur. Fermé, le casino reste visible pour les administrateurs, qui peuvent tester la machine.
