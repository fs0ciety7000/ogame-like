---
version: 5.9.3
iteration: 74
date: 2026-10-04
title: Bilan des boss, notifications détaillées et chasse aux bugs
---
Quand un colosse tombe, tu sais enfin ce que tu as gagné et comment s'est passé le combat. Les notifications ont été redessinées et montrent les détails : ressources, ambre, XP, relique, joueur. Nous avons aussi passé en revue tous les circuits de récompense du jeu, et corrigé ce qui clochait.

## Bilan des boss
- [Nouveau] **Bilan du combat** à la fin du **Léviathan**, du **boss de saison** et du **boss d'alliance** : victoire ou retraite, durée, dégâts totaux, participants, assauts, part de la structure entamée.
- [Nouveau] Le **top 5 des dégâts** avec la part de chacun, et **ta ligne** : rang, dégâts, part du total, assauts.
- [Nouveau] **Tes récompenses** en pastilles : ressources, points de passe, titre, relique, et relique mythique pour le n° 1.
- [Nouveau] Le bilan **s'ouvre en grand une fois**, à ta première visite après la fin du combat, puis reste affiché sur la page.
- [Amélioration] La notification de fin de boss montre les ressources et la relique gagnées, et ouvre la page du boss.

## Notifications
- [Nouveau] **Nouvelles cartes** dans la cloche et le Journal : une couleur et une icône par type, un liseré pour les nouveautés, et les **détails en pastilles** (ressources avec leurs icônes, ambre, XP, relique, expéditeur ou destinataire).
- [Nouveau] **Cadeaux détaillés** : le destinataire voit qui lui a envoyé quoi, quantité par quantité, avec un lien vers la fiche de l'expéditeur. L'expéditeur garde une trace de son envoi.
- [Amélioration] Les rapports de **combat** (attaque et défense) affichent le butin, l'XP gagnée et l'adversaire. Le **retour d'une flotte** chargée montre son butin.
- [Amélioration] Les **succès débloqués** montrent leur récompense (XP, production) et ouvrent la page Succès.
- [Amélioration] Le **défi de la semaine** réussi montre les ressources versées. « Le Léviathan approche ! » ouvre la page du Léviathan.
- [Fix] Dans la cloche, les cartes ne s'écrasent plus les unes sur les autres quand la liste est longue : elle défile normalement.
- [Fix] Le parrainage, les vendettas et les coalitions ne se présentent plus comme des « succès » (mauvaise icône, mauvais son, lien vers la page Succès).

## Corrections
- [Fix] **Classement** : changer d'onglet ou cliquer sur le podium ne duplique plus les cartes du podium.
- [Fix] **Profil** : la nouvelle bannière s'applique tout de suite après l'enregistrement, sans recharger la page.
- [Fix] Le succès **« Podium »** (remporter un titre de saison) ne se débloque plus avec les titres du passe, des défis ou des boss : seuls les titres de fin de saison comptent.
- [Fix] Le **défi de la semaine** rattrape ta production avant de verser sa récompense : plus de production perdue contre un entrepôt plein.

## Équilibrage
- [Équilibrage] Un **cadeau n'est plus une dépense** pour le contrat du jour « Dépenser des ressources ». Deux joueurs ne peuvent plus se renvoyer les mêmes ressources pour le remplir.

## Journal des nouveautés
- [Nouveau] **Badges** sur chaque ligne : Nouveau, Amélioration, Fix, Équilibrage, Admin. L'en-tête de chaque version résume combien de chaque.
