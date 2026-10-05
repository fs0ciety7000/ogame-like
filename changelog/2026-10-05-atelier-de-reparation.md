---
version: 5.20.0
iteration: 108
date: 2026-10-05
title: Points de vie conservés et Atelier de réparation
---
Les dégâts ne s'effacent plus à la fin du combat : une flotte abîmée le reste jusqu'à ce que l'Atelier la répare.

## Points de vie conservés
- Après un combat, une part des points de vie perdus (40 %) reste en **dégâts sur les unités survivantes**. Le reste détruit des unités.
- Une flotte abîmée tire et encaisse moins au combat suivant, en proportion de ses dégâts.
- Une unité ne descend jamais sous 10 % de ses points de vie : au-delà, elle est détruite.
- Une unité détruite emporte sa part des dégâts déjà subis : les survivantes ne héritent pas de toute l'usure.
- Concerné : les attaques, les défenses de la planète mère, les primes, les repaires, les raids de faction et les embuscades d'expédition.
- Pas concernés : les colonies et les seigneurs de guerre.

## Atelier de réparation
- Les unités détruites que l'Atelier sauve ne reviennent plus aussitôt. Elles sont **immobilisées** jusqu'à ce que l'Atelier leur ait rendu tous leurs points de vie.
  - Elles gardent leur place de hangar.
  - Elles ne rentrent pas avec la flotte et ne portent pas de butin.
- L'Atelier répare en **PV par seconde** : 30 PV/s au niveau 1, +25 % par niveau. Sans Atelier, les équipages réparent les coques à 20 % de cette cadence.
- Ordre de réparation : la file des unités immobilisées d'abord, puis les coques abîmées, les plus atteintes en premier.
- Une notification prévient quand des unités reviennent au hangar.
- Les défenses détruites se reconstruisent toujours seules à 60 %.

## Interface
- Bâtiments : nouvel onglet **Atelier de réparation**.
  - Cadence, part des unités sauvées, unités immobilisées, fin prévue.
  - File de réparation avec jauges, provenance et heure de retour.
  - Coques abîmées par type d'unité.
  - Animations de soudure pendant les réparations.
- Unités :
  - chaque carte indique l'état de la coque et les unités à l'Atelier ;
  - la capacité du hangar compte les unités en réparation.
- Primes et repaires : l'estimation du combat est jouée par le vrai moteur (tours, retraite, coques abîmées, Traqueurs, formation). Le lancement reste **toujours possible**, même quand la défaite est probable.
- Rapports de combat : les unités sauvées apparaissent « à l'Atelier ».
- XP du jour : total de la journée affiché ; un compte test est prévenu que ses missions ne rapportent pas d'XP.
