# Proposition : flotte basée sur une colonie (lot Y, Q.3)

Statut : **livrée** en 6.10.0, voir `docs/changes/6.10.0-flotte-basee.md`. Choix provisoires notés en Q9 et Q10 (`docs/QUESTIONS.md`).
Lot Y de `docs/proposals/feuille-de-route-2026-hiver.md` ; suite de `colonies-suite.md` (Q.3).

## 1. Le problème vu par le joueur
- « Ma colonie est à l'autre bout de la carte, à côté de cibles que je ne peux pas atteindre vite depuis ma planète mère. »
- « Mes colonies ne servent qu'à produire : elles ne changent rien à mes combats. »

## 2. Diagnostic
- Toute flotte part de la planète mère : `launchFleet` calcule le trajet par `distanceBetween(attacker.uid, cible)`.
- Une colonie a pourtant ses propres coordonnées (son identifiant `<uid>-c<n>` sert de position sur la carte).
- Le moteur sait déjà faire stationner une flotte (garnison d'alliance : statut `stationed`, fin programmée, rappel, retour en miroir).

## 3. Benchmark
- OGame : chaque planète et lune a sa flotte ; on « stationne » une flotte sur une autre planète à soi, puis elle part de là.
- Rise of Kingdoms, Clash of Clans : pas d'équivalent direct (une seule base militaire).

## 4. Options
| | Option | Pour | Contre |
|:--|:--|:--|:--|
| A | Point de départ au choix, sans déplacement des vaisseaux | très simple | téléportation : les vaisseaux de la mère partent de la colonie sans avoir voyagé |
| B | **Base avancée** : une flotte voyage jusqu'à sa colonie, y stationne, peut attaquer depuis là et y revient | cohérent (OGame), réutilise la garnison | un état de plus par colonie |
| C | Hangar de flotte par colonie (unités séparées, construction locale) | complet | refonte de `hangarLoad`, des unités et de l'Atelier ; touche les données de chaque joueur |

## 5. Recommandation : B, version prudente
- **Baser** (nouvelle mission `colonybase`) : la flotte (vaisseaux d'attaque) vole de la planète mère à la colonie (trajet ordinaire), puis y
  stationne **14 jours au plus** ; à l'échéance elle rentre seule. Une base par colonie. Elle occupe un emplacement de flotte.
- **Attaquer depuis la base** : la fenêtre d'attaque propose le départ « Base de <colonie> » ; le trajet part des coordonnées de la colonie ;
  les vaisseaux sont pris dans la base. Après le combat, les survivants **reviennent à la base** (trajet retour = trajet aller) et le butin
  arrive à la planète mère, comme aujourd'hui. Si la base n'existe plus à leur retour, ils rentrent à la planète mère.
- **Rapatrier** : rappel de la base, retour à la planète mère (durée du trajet aller).
- Prudence (Q9) : la flotte basée **ne défend pas** la colonie et ne peut pas être attaquée (comme une flotte en vol). Les vaisseaux basés
  restent comptés dans le hangar de la planète mère (`hangarLoad` inchangé, invariant I3 tenu).
- Réglages (règle n° 2) : `COLONY_BASE_RULES` (activé, durée maximale, bases par colonie), groupe « Flotte basée » de l'admin.

## 6. Invariants
- I20 : une attaque depuis une base ne prend jamais plus de vaisseaux que la base n'en contient, et ne touche pas aux vaisseaux à quai de
  la planète mère (test `flotteBasee.test.ts`).
- Les vaisseaux basés comptent comme « hors de la base » (`unitsAwayOf`) : mêmes places de hangar, mêmes emplacements de flotte.
