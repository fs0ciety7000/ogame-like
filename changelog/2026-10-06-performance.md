---
version: 5.29.0
iteration: 125
date: 2026-10-06
title: Un jeu plus léger
---
## Performance
- **Chargement** : les fenêtres rares (annonces, Ctrl+K, raccourcis, bilan de saison, retour d'absence, montée de rang) arrivent après l'écran de jeu. Le fichier principal perd 45 Ko.
- **Décomptes** : tous les chronomètres de l'écran battent sur une seule horloge, alignée sur la seconde. Moins de calculs, des compteurs qui changent ensemble, et rien ne tourne quand l'onglet est caché.
- **Serveur** : les tâches de fond qui partagent un rythme passent ensemble (3 réveils au lieu de 16). Flottes, enchères et boss arrivent à l'heure, avec moins de charge.
