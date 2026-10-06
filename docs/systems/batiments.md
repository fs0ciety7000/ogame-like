# Bâtiments

## Rôle
Colonne vertébrale de la progression : production, capacités (entrepôt, hangars, Cale sèche), soutien (Atelier), fin de partie.

## Liste (13)
| Bâtiment | Max | Déblocage | Effet |
|:--|--:|:--|:--|
| Extracteur de ferraille | 20 | départ | production ferraille |
| Réacteur instable | 20 | 500 ferraille | production énergie |
| Extracteur de nanocomposants | 20 | 500 énergie | production nano |
| Archives fracturées | 20 | coût | production données |
| Atelier de réparation | 20 | rares | sauvetage 5 %/niv. (70 % au 20) + cadence de réparation |
| Hangar d'attaque / de défense | 20 | Labo tech6 | 2 000 places/niv. |
| Cale sèche (5.28) | 20 | Atelier niv. 5 + rares | 1 000 postes/niv., paliers 5/10/15/20 |
| Entrepôt | 20 | départ | 2 M × 1,6^niv. |
| Fonderie quantique, Synthétiseur neuronal | 10 | tech21 / tech22 | rares (1 à 10/s) |
| Générateur de bouclier | 10 | tech23 | +0,5 %/niv. de bouclier (max 5 %) |
| Labo de synthèse | 10 | coût | capsules (5 %/niv.) |

Coûts : géométriques de `baseCost` à `maxCost`, palier 2 à partir du niv. 11 (3 h puis +1 h/niv.). File planifiée : 1 à 3 emplacements
(Fonderie niv. 5 et 10). Annulation : 100 % pendant 60 s, puis 80 % du temps restant.

## Code et admin
`buildings.ts`, `buildPlan.ts`, `cancel.ts`. Admin : Contenu → Bâtiments (effets, coûts, prérequis `requires`).

## État (audit 2026-10-06)
- 13 bâtiments seulement et une seule file de construction : peu de décisions d'ordre de construction une fois le rythme pris. Comparaison : OGame et Clash of Clans font des constructeurs parallèles un levier central.
- ~~`homeLevels` compte les bâtiments verrouillés~~ : corrigé en 5.28.1 (C3).
- Rabais de coût : technologies × couche empire (`playerBuildingDiscount`, plafond empire 50 %) depuis la 5.28.1.
