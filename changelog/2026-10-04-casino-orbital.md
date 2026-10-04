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
- [Nouveau] **Des jetons à gagner partout** : paliers 7, 17 et 27 du **passe de saison**, **défi de la semaine** réussi (1 à 2 jetons selon le palier), **boss abattus** (Léviathan, boss de saison, boss d'alliance : 1 jeton chacun, 3 pour le premier en dégâts).
- [Nouveau] **Tournoi du casino** : chaque tirage rapporte des points (7-7-7 : 100, trois étoiles : 30…). Classement en direct sur la page ; à la fermeture, le podium gagne 5, 3 et 2 jetons, et le premier porte le titre **« As du casino »** jusqu'au tournoi suivant.
- [Nouveau] **Titre « Main d'or »** pour qui aligne trois 7, à vie.
- [Nouveau] **Bandeau d'accueil** quand le casino est ouvert : heure de fermeture, jetons en réserve, place au tournoi, rappel du jeton du jour.
- [Nouveau] **Ma semaine au casino** : jetons joués, gains, points et ressources gagnées depuis lundi.
- [Amélioration] **Suspense** : quand les deux premiers rouleaux montrent un 7, le dernier ralentit et s'éclaire en or.
- [Nouveau] **Annonce du gagnant** : écran de gros lot avec pluie de pièces, notification à tous les joueurs, palmarès des **gros lots** et fil des **derniers gains** sur la page.
- [Nouveau] **Ouvert à certaines heures** : le casino n'apparaît dans le menu que lorsqu'il est ouvert (chaque week-end par défaut, ou selon les créneaux choisis par l'équipe). Tous les joueurs sont prévenus à chaque ouverture.
- [Amélioration] Le tirage est fait par le serveur, avec des probabilités fixées et publiées dans la table des gains.

## Interface
- [Amélioration] **« Que faire maintenant ? »** et la file des chantiers : une même situation garde la même couleur partout. Un chantier, un labo ou des missions à l'arrêt sont une action à mener (couleur d'accent), un entrepôt plein une alerte, une récompense en doré.
- [Amélioration] Dernières pastilles harmonisées (série de contrats, rang du Hall of fame, seigneurs, biome des colonies, rangs d'alliance…).
- [Amélioration] **Nouveaux toasts** : panneau du cockpit, liseré et icône de la couleur du type (vert pour un succès, rouge pour une attaque, doré pour un cadeau…) et bouton « Voir » en pastille. Les notifications de la cloche suivent aussi les couleurs du thème.
- [Amélioration] **Toutes les couleurs suivent votre thème** : médailles, raretés, commandants, capsules, Hall of fame, podium, rangs… plus aucune couleur figée. Les statistiques de l'empire passent aux jauges droites du cockpit.
- [Amélioration] **Illustrations d'en-tête** : Casino, État-major, Palmarès et Hall of fame des boss ont leur décor.
- [Amélioration] Notifications illustrées (gros lot, ouverture du casino) et pastille de jetons gagnés.
- [Fix] Le compte à rebours de fin de saison du passe s'affiche en jours (« 27 j 13 h ») au lieu de « 661 h ». Même chose partout ailleurs : au-delà de deux jours, les durées s'affichent en jours (Palmarès, boss…).

## Administration
- [Admin] **Casino** (onglet Pot commun) : ouverture (ouvert, fermé ou programmé : week-ends et créneaux précis), jetons quotidiens et réserve maximale, part du pot, probabilités et gains de chaque combinaison avec l'espérance calculée, et **jetons offerts** à tous, aux actifs ou à un joueur. Fermé, le casino reste visible pour les administrateurs, qui peuvent tester la machine.
- [Admin] **Jetons gagnés en jeu** (onglet Pot commun → Casino) : jetons par palier du défi hebdo, par boss abattu ou retiré, bonus du premier, jetons du podium du tournoi, libellés des titres « As du casino » et « Main d'or ». Le passe de saison accepte un nouveau type de récompense « Jetons du casino ».
