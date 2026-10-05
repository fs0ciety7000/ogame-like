---
version: 5.15.14
iteration: 100
date: 2026-10-05
title: Thème Signal, ascension, planificateur et e-mails
---
L'ascension ne s'affiche plus en double, le planificateur déplace enfin tous les boss et les événements du week-end, et les campagnes e-mail s'écrivent en Markdown.

## Nouveau thème : Signal
- Inspiré de Marathon (Bungie) : graphisme brut et net, vert acide et magenta sur graphite.
- Fond tramé d'une grille fine, panneaux en aplat avec une barre d'accent à gauche, gros titres serrés en capitales, boutons pleins sans lueur.
- Une ambiance sonore propre au thème. À choisir dans Réglages → Apparence.

## Ascension
- Une seule icône, l'insigne d'ascension : il est répété autant de fois que d'ascensions (deux ascensions, deux insignes, jusqu'à cinq).
- Classement, podium, carte du commandant : les insignes se chevauchent légèrement pour rester compacts.
- Profil et fiche du joueur : les cinq emplacements sont visibles, ceux qui restent à gagner apparaissent grisés.

## Planificateur (administration)
- Le glisser-déposer marche pour tous les boss et tous les événements du week-end, plus seulement pour les dates précises. Le rendez-vous garde son heure et sa durée.
- Déplacer ou retirer une apparition régulière l'annule à sa place d'origine. Un bouton « Rétablir le rythme régulier » annule ces retraits.
- La case visée s'éclaire pendant le glissement.
- Le changement d'heure ne fait plus apparaître le 25 octobre deux fois, ce qui décalait la fin du mois d'un jour.
- Les épisodes des Chroniques, la fin de saison et les concours gardent leurs dates fixes.

## E-mails (administration)
- Une campagne peut maintenant s'écrire en Markdown, directement dans la page, ou se déposer en fichier .md (bouton ou glisser-déposer).
- L'aperçu se met à jour à chaque frappe, avec le même habillage que les campagnes maison : logo, bannière, titres, listes, encadrés, boutons, pied de page avec désinscription.
- L'en-tête du fichier donne l'objet, l'expéditeur, le libellé et l'image. `{{PSEUDO}}` devient le pseudo de chaque joueur.
- Le brouillon reste dans le navigateur ; « Télécharger » le récupère en .md, et la version texte de secours est générée toute seule.
