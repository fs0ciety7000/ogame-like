---
version: 5.15.13
iteration: 99
date: 2026-10-05
title: Correctif : réclamer une catégorie du Codex
---
Réclamer la récompense d'une catégorie du Codex affichait « Codex complété à 77 % : il faut 100 % ».

## Correctif
- La cause : le site était à jour mais le serveur de jeu utilisait encore ses anciens hooks, qui ne connaissaient que le titre « Archiviste ». Une fois les hooks mis à jour, le bouton « Réclamer » verse bien les jetons et l'Ambre de la catégorie.
- Si cela se reproduit, le message dit maintenant clairement que le serveur n'est pas encore à jour.

## Administration
- Le serveur indique la version de sa logique de jeu. Quand elle est en retard sur le site, un bandeau en haut de l'administration le signale, avec un bouton « Mettre à jour les hooks ».
