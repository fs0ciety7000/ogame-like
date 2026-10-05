---
version: 5.22.0
iteration: 112
date: 2026-10-05
title: Seigneurs à cinq rangs, unités d'élite et serveur réparé
---
Les seigneurs de guerre montent en grade, et trois unités d'élite apprennent à les chasser. Cette version répare aussi l'Atelier, les rapports de combat et l'espionnage en production.

## Rangs des seigneurs (I à V)
- Chaque seigneur accumule de la **menace**.
  - Elle monte chaque jour, et davantage quand il gagne un combat ou survit à une vendetta.
  - Elle baisse quand on le pille ou qu'il est repoussé.
  - Une vendetta gagnée contre lui le fait **chuter de deux rangs**.
- Chaque rang au-delà du premier lui donne **+8 % de puissance** et renforce son trait :
  - **Insaisissable** (opportuniste) : une partie de sa flotte à quai esquive tes attaques. Quand il attaque, il décroche plus tôt et emporte plus de butin.
  - **Rempart** (bâtisseur) : bouclier et défenses renforcés.
  - **Fureur** (agressif) : avantage de classe accru.
- **Rang V, Seigneur Ascendant** : tout le secteur est prévenu.
  - Il ne se défie qu'en vendetta d'alliance, avec un objectif ×1,5.
  - Les vainqueurs reçoivent une **relique mythique** et le titre « Fléau de l'Ascendant … ».
- La page Seigneurs affiche le rang, la jauge de menace et le trait en vigueur. Le rapport de combat indique le rang et l'effet du trait.

## Unités d'élite
- **Chasse-Fantôme** contre les opportunistes : leur flotte n'esquive plus, et ils ne peuvent plus décrocher quand ils t'attaquent.
- **Brise-Rempart** contre les bâtisseurs : bouclier planétaire ignoré, défenses sans bonus.
- **Lame Écarlate** contre les agressifs : leurs unités perdent leur avantage de classe.
- **Déblocage** : toutes les technologies du Labo au maximum, plus une vendetta gagnée contre un seigneur de cette personnalité. Les vendettas gagnées avant cette version comptent.
  - Si de nouvelles technologies arrivent au Labo, l'unité reste débloquée, mais sa construction est suspendue jusqu'à ce qu'elles soient finies.
- **Contre les seigneurs seulement** : la fenêtre d'attaque ne les propose pas contre un joueur, le lancement les refuse, et elles restent hors du combat quand un joueur t'attaque.

## Serveur réparé
- **Le schéma de la base se met à jour tout seul** au démarrage : les champs ajoutés par les dernières versions sont créés s'ils manquent. Ils étaient ignorés sans aucun message, ce qui causait les trois problèmes suivants.
- **Atelier vide après les combats** : les unités sauvées quittaient la flotte, mais leur réparation n'était pas enregistrée. Celles des combats depuis la 5.20 (attaques, défenses, raids, primes, repaires) sont **rendues** une fois, avec une notification.
- **Rapport de combat sans déroulé** : le détail tour par tour est de nouveau enregistré. Les rapports déjà perdus restent sans détail.
- **Espionnage** :
  - la notification mène désormais au rapport ;
  - un rapport enregistré sans contenu le signale au lieu de s'afficher vide.

## Administration
- **Rangs et traits réglables** : seuils de menace, gains et pertes, valeurs par rang, règles de l'Ascendant, nombre d'unités d'élite pour contrer un trait.
- **Imposer un rang** à un seigneur (tests).
- **Équilibrage** : taux de victoire des joueurs contre les seigneurs, par rang.
