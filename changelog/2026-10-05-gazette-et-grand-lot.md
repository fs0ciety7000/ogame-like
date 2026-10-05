---
version: 5.16.0
iteration: 101
date: 2026-10-05
title: Gazette repensée et grand lot d'ajouts
---
La Gazette ne répète plus les mêmes nouvelles d'un numéro à l'autre et s'enrichit de nouvelles rubriques.

## Gazette
- Un numéro couvre la période depuis le numéro précédent, et non plus les sept derniers jours d'office. Une publication manuelle suivie de celle du lundi ne raconte donc plus deux fois la même semaine.
- Une rubrique identique mot pour mot au numéro précédent n'est pas reprise, et la manchette change.
- « Le seigneur à surveiller » devient « Le seigneur qui monte » : celui dont la puissance a le plus grandi depuis le numéro précédent.
- Nouvelles rubriques : ascensions, rempart (défenses tenues), place du marché, entraide (dons), nouvelles bannières (alliances fondées), pillard le plus actif et agenda de la semaine qui vient.
- Les chiffres de la semaine (combats, butin, échanges, commandants actifs) sont comparés au numéro précédent.
- Mise en page alignée sur le design system : manchette, tuiles de chiffres et une couleur par rubrique.

## Confort
- Présence : une pastille verte qui pulse montre qui est en ligne (actif depuis moins de 5 minutes). Elle apparaît à côté des pseudos partout dans le jeu, sur les avatars du classement et du podium, et dans la fiche du joueur, qui indique aussi « Vu il y a… ». Les membres de l'alliance utilisent la même pastille, et l'écho se coupe si tu as demandé de réduire les animations.
- Ctrl+K fait aussi des actions : « Tout réclamer », « Réclamer la série du jour », « Améliorer » un bâtiment (avec le niveau visé et l'état des ressources), « Rechercher » une technologie, et « 10 chasseur » pour lancer 10 unités. Le serveur vérifie tout, comme pour un clic.

## Équilibre
- Rattrapage des petits empires : chaque nuit, le serveur compare le développement de chaque joueur actif (niveaux de bâtiments et de technologies cumulés) à la médiane des joueurs actifs. Sous 10 % de la médiane, la production gagne +25 %. Le bonus baisse ensuite en ligne droite et disparaît à 50 %. Il est figé pour la journée et apparaît dans le détail de la production. Tout se règle dans Règles → Rattrapage.
- Plafond hebdomadaire des jetons de butin : les jetons tirés en combat (boss, seigneurs, menaces, joueurs, expéditions) s'arrêtent à 25 par semaine, réglables dans les réglages des reliques. Le jeton du jour, la série, les défis, le passe et les récompenses fixes des boss n'y comptent pas. La jauge est affichée au casino.

## Correctifs
- Couleurs du thème respectées partout : l'habillage du mois (et le boss de saison en cours) n'impose plus sa teinte orange. Il se mêle désormais à la couleur du thème, et l'image du boss en fond n'apporte plus que du relief, sans couleur. Les nébuleuses de chaque page, la frise de l'agenda, les badges du changelog et les quelques couleurs fixes restantes (violet, cyan) suivent le thème choisi. Un test empêche leur retour.
- Recyclage : la capacité affichée et appliquée est désormais la cargaison (CAP) du Drone récupérateur, exactement comme sur sa fiche (CAP × niveau, technologies de cale et officiers compris). L'ancien réglage fixe « 250 par niveau », qui donnait 2 500 par drone au niveau 10 quelle que soit la fiche, est retiré.
