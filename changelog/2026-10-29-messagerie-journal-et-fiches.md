---
version: 3.7.0
iteration: 34
date: 2026-10-01
title: Messagerie privée, journal d'empire et fiches de joueur
---
Trois nouveautés pour suivre ce qui se passe dans la galaxie et parler aux autres commandants.

## Messagerie privée
- Nouvelle page **Messages** (menu Opérations) : écris à n'importe quel commandant, depuis la recherche ou depuis sa fiche (bouton « Écrire »).
- Les messages arrivent en temps réel, avec une pastille de non-lus dans le menu et une notification pour le premier message non lu.
- Accusés de lecture : ✓ envoyé, ✓✓ lu.
- **Bloquer** un joueur coupe ses messages. Il n'en est pas averti, mais son envoi est refusé.
- Anti-spam : 1 000 caractères par message, 8 messages par minute, 300 par jour.

## Journal d'empire
- Nouvelle page **Journal** (menu Compte, ou « Tout l'historique » dans la cloche) : tous tes évènements, jour par jour, depuis le début.
- En tête de page, le résumé **Pendant ton absence** : ce qui est arrivé depuis ta dernière visite du journal, par catégorie.
- Filtres par catégorie, lien direct vers la page concernée, et chargement de l'historique plus ancien à la demande.

## Fiches de joueur
- Dans **Joueurs**, clique sur un pseudo pour ouvrir sa fiche : rang, titre, ancienneté, colonies et faits d'armes (victoires, défaites, succès, missions, expéditions, Léviathans abattus, guerres gagnées, ascensions).
- La fiche montre aussi les titres obtenus, les saisons passées et le classement du joueur dans le Léviathan en cours.

## Carte galactique
- **Toute la galaxie est visible**, quel que soit l'écran. Sur les écrans larges, la carte était rognée en haut et en bas : les empires proches des bords (dont Vince et Gollum) n'apparaissaient pas.
- Une marge autour de la carte garde les empires posés tout au bord entièrement visibles.

## Attaques plus rapides
- Le trajet d'une attaque entre joueurs dure désormais **90 minutes au plus**, le retour aussi. Une flotte lente ne met plus 5 à 7 h pour atteindre un empire éloigné.
- La fenêtre d'attaque indique quel vaisseau **fixe l'allure** de la flotte (le plus lent) et le temps de trajet sans lui.

## Améliorations
- **Bandeaux d'annonce** : l'équipe peut afficher en haut du site une annonce, un évènement, une alerte ou un message urgent, fixe ou défilant, avec liens et emojis. Un bandeau peut être masqué, sauf s'il est urgent.
- **Colonies** : les vraies icônes de ressources remplacent les emojis, et le choix des défenses affiche l'image des unités.
- Le Chœur Silencieux a désormais son emblème.
- Sur téléphone, les onglets (Alliance et autres) défilent au lieu d'élargir la page. La recherche de la galaxie et le choix de la cible de guerre sont lisibles.
- Chargement initial plus léger : les pages de connexion et de maintenance sont chargées à la demande.

## Pour l'équipe
- Statistiques d'administration : nouveau panneau **Fin de partie** (qui recherche les technologies 21 à 25, production des fonderies, usage du Croiseur Nova et de la Lance gravitationnelle).
- Tests automatiques à chaque pull request : tests unitaires, intégration avec un vrai PocketBase, et un parcours de toutes les pages dans un navigateur (bureau et téléphone).
