---
version: 4.3.2
iteration: 46
date: 2026-10-02
title: Plus d'écran vide après une mise à jour
---
Correctif.

- Juste après une mise à jour, certains navigateurs (surtout sur mobile) gardaient l'ancienne version du jeu en mémoire et réclamaient des fichiers qui n'existent plus : la page restait **vide**, sur le fond bleu.
- Le jeu le détecte maintenant et **se recharge tout seul une fois** pour récupérer la nouvelle version. Même chose si un onglet est resté ouvert pendant la mise à jour et qu'on change de page.
