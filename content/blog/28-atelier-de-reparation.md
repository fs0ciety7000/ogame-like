---
slug: atelier-de-reparation
title: "5.20 : tes vaisseaux gardent leurs cicatrices, l'Atelier les répare"
excerpt: "Les dégâts restent d'un combat à l'autre, les unités sauvées passent par l'Atelier de réparation avant de reprendre du service, et l'estimation des primes et des repaires est jouée par le vrai moteur."
category: mises-a-jour
tags: [combat, atelier, réparation, unités, primes]
version: "5.20.0"
cover: /assets/buildings/atelier_reparation.webp
---
> [!LORE] Note du chef d'atelier
> « Ils reviennent tous en me disant que c'est juste une éraflure. Puis je vois la coque. Pose-les là, commandant, et laisse-moi travailler. »

> [!NOTE] Valeurs par défaut
> Les chiffres de ce billet sont les réglages par défaut du moteur. L'administration peut les ajuster.

## Ce qui change

Avec la 5.19, chaque unité a des points de vie (résistance × 30) qui fondent tour par tour. Jusqu'ici, ils revenaient au maximum dès la fin du combat. Désormais **les dégâts restent**.

| | Avant | Maintenant |
|:--|:--|:--|
| Unités survivantes | intactes | abîmées : 40 % des PV perdus restent en dégâts |
| Flotte abîmée | — | tire et encaisse moins, en proportion |
| Unités sauvées par l'Atelier | de retour aussitôt | **immobilisées** le temps de la réparation |
| Réparation | instantanée | en **PV par seconde**, selon le niveau de l'Atelier |

## L'Atelier de réparation

| Niveau de l'Atelier | Cadence | Exemple : 20 chasseurs (6 000 PV) |
|:--|--:|--:|
| aucun | 6 PV/s (coques seulement) | — |
| 1 | 30 PV/s | 3 min 20 s |
| 5 | 60 PV/s | 1 min 40 s |
| 10 | 98 PV/s | ≈ 1 min |
| 20 | 173 PV/s | ≈ 35 s |

- L'Atelier traite d'abord la **file** : les unités détruites qu'il a sauvées, dans l'ordre d'arrivée. Elles gardent leur place de hangar mais ne peuvent pas partir.
- Il répare ensuite les **coques abîmées**, les plus atteintes en premier.
- Une unité ne descend jamais sous 10 % de ses PV : au-delà, elle est détruite. Et une unité détruite emporte sa part de l'usure, les survivantes ne la récupèrent pas.

Tout se suit dans **Bâtiments → Atelier de réparation** : jauges, provenance des unités (attaque, défense, prime, repaire…), heures de retour. Sur la page **Unités**, chaque carte affiche l'état de sa coque.

> [!TIP] Avant une grosse opération
> Une flotte à 70 % de coque se bat comme une flotte 30 % plus petite. Laisse l'Atelier finir avant de lancer une prime de haut niveau ou un repaire.

## Primes et repaires : on lance quand on veut

La fenêtre de traque comparait deux nombres (« capture assurée » ou « le fugitif s'échappera »). Ce n'était plus vrai avec le combat en tours. Désormais :
- l'estimation est **jouée par le vrai moteur**, avec ta formation, tes Traqueurs Kesh, tes bonus et l'état de tes coques ;
- elle annonce une victoire ou une défaite probable, le nombre de tours et les pertes attendues ;
- **le bouton reste toujours actif**. Si l'affaire tourne mal, ta flotte décroche d'elle-même après 50 % de PV perdus (30 % en Prudente).

## Qui est concerné

- Attaques entre joueurs et contre les seigneurs de guerre (côté joueur), défense de la planète mère, primes, repaires, raids de faction, embuscades d'expédition.
- Les colonies et les seigneurs de guerre gardent l'ancien fonctionnement.

Bonnes réparations, commandant.
