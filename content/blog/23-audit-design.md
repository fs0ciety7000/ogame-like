---
slug: audit-design
title: "5.15.3 : un coup de chiffon sur tout le HUD"
excerpt: "Infobulles chiffrées, coins coupés partout, libellés et nombres harmonisés, et le réglage « réduire les animations » enfin respecté dans tout le jeu."
category: mises-a-jour
tags: [interface, design, accessibilite]
version: "5.15.3"
---
> [!LORE] Rapport de l'atelier
> « Un cockpit, ce n'est pas joli : c'est lisible. Chaque cadran au même endroit, chaque chiffre dans la même police. »

## Des infobulles qui comptent

Survoler une ressource donnait une phrase un peu longue. On y voit désormais une **petite fiche** :

- le stock et la capacité ;
- la production par seconde ;
- le temps avant que l'entrepôt soit plein ;
- les bonus actifs.

Les chiffres sont alignés à droite, dans la police du HUD. Les barres **ATK, DEF, VIT et CAP** des unités font pareil et montrent le détail : base, niveau, technologie et total.

## Le même cockpit partout

On a repassé tout le jeu à la loupe en suivant le guide de style :

- **Des coins coupés plutôt qu'arrondis.** C'est le cas sur la connexion, la recherche Ctrl+K, l'arbre du Labo et les menus.
- **Plus d'ombres floues** sous les fenêtres.
- **Des compteurs carrés.** Messages non lus et diplomatie n'ont plus de pilules arrondies.
- **Des libellés et des nombres uniformes.** 45 libellés passent en police mono, et les nombres ont le même format partout.

Des tests automatiques vérifient maintenant chacune de ces règles. Une page neuve ne pourra plus s'en écarter sans qu'on le voie.

## Moins d'animations, si tu le demandes

Si ton système est réglé sur « réduire les animations », le jeu le respecte désormais **partout**. Les transitions sont adoucies, et les pulsations et échos sont coupés. Un état reste toujours lisible par sa couleur et son texte.
