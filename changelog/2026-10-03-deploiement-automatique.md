---
version: 4.8.1
iteration: 54
date: 2026-10-03
title: Déploiement serveur automatique
---
Plus besoin de déployer le serveur à la main après une mise à jour.

## Administration
- **Déploiement en un clic** (Outils → « Déployer la mise à jour ») : sauvegarde complète, puis schéma, fiches publiques et hooks depuis `main`, avec le rapport de chaque étape.
- Le même déploiement part **automatiquement** après chaque merge sur `main` (GitHub Actions, une fois la CI verte), si les secrets du serveur sont configurés.
