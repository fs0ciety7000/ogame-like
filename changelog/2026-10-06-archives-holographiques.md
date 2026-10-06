---
version: 5.24.0
iteration: 115
date: 2026-10-06
title: Archives holographiques, cartes réorganisables, Ambre dans le HUD et thème Constellation éclairci
---
Un lot visuel : un cylindre holographique en 3D pour parcourir le Codex, exposer ta flotte et faire tourner les récompenses.

## Cylindre holographique
- **Archives du Codex** : les fiches tournent sur un anneau 3D. Glisse, fais défiler ou utilise les flèches ; un clic ou Entrée ouvre la fiche de face. Les fiches encore verrouillées sont tramées et sombres. Le bouton **Grille** ramène l'affichage classique (choix mémorisé).
- **Vitrine du hangar** (page Unités) : tes unités de l'onglet tournent en vitrine, avec l'effectif sous chacune.
- **Écran de connexion** : le cylindre tourne lentement, flouté, derrière le formulaire.
- **Coffre de la série et palier du passe** : une roue fait défiler les récompenses possibles avant de s'arrêter sur ton gain. « Passer » montre le gain tout de suite.
- Sans WebGL ou avec les animations réduites, l'affichage classique reste en place.

## Interface
- **Cartes réorganisables** : sur Bâtiments, Unités, Missions, État-major (officiers) et les bâtiments des colonies, le bouton **Réorganiser** permet de déplacer les cartes au glisser-déposer (souris, appui long au doigt, clavier) ou avec les flèches. L'ordre est retenu sur l'appareil, page par page ; **Ordre par défaut** le rétablit.
- **Ambre dans le bandeau du haut** : ton solde d'Ambre s'affiche en permanence, avec son icône et un liseré doré qui la distingue des ressources. Un clic mène aux Primes et au Comptoir.
- **Accueil** : la barre des chantiers ne suit plus le défilement.

## Bande-annonce et vidéos
- **Bande-annonce de 20 secondes** du jeu : sur l'écran de connexion (elle ne se télécharge qu'au clic) et dans un billet du devblog.
- **Vidéos dans les messages** : un lien vers une vidéo (.mp4 ou .webm, du jeu ou en https) se lit directement dans la messagerie, le chat d'alliance et le canal diplomatique. Exemple : `/assets/video/presentation.mp4`.
- **Devblog** : une vidéo s'insère comme une image (`![légende](lien.mp4)`).

## Listes paginées
- **20 par page** sur Combats (combats et espionnage), Joueurs, Marché (offres), Journal, Signalements, Hall of fame des boss, classement des boss mondiaux, journal du trésor d'alliance, Annonces et Succès ; **15 par page** dans la cloche de notifications et la liste des conversations.
- Les boutons « Afficher plus » laissent la place à une pagination « Précédent / Suivant » ; un nouveau filtre ou une recherche ramène en page 1.

## Corrections
- **Fond qui virait au noir** (Constellation surtout, jusqu'à un rechargement) : le halo de saison n'utilise plus de filtres de flou ni de mode de fusion plein écran, qui épuisaient la mémoire graphique du navigateur.
- **Thème Constellation** : le fond n'est plus presque noir. Il passe en graphite, avec un halo couleur os, un liseré orange à l'horizon et une trame discrète.
- **Chargement** : le thème ne force plus de calcul de mise en page avant la fin du chargement (avertissement de Firefox, risque de flash sans style).
