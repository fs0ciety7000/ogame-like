# Proposition : colonies, suite (lot Q)

Statut : **livrée** en 6.4.0 (Q.1 et Q.2), voir `docs/changes/6.4.0-colonies-suite.md`. Q.3 (flotte basée) livrée en 6.10.0 (`flotte-basee.md`).
Lot Q de `docs/proposals/feuille-de-route-2026-hiver.md` ; suite de `routes-logistiques.md` (I.2).

## 1. Le problème vu par le joueur
- « Je veux monter les bâtiments d'une colonie neuve, mais je dois envoyer une flotte de transport à la main à chaque fois. »
- « Je lance 200 tourelles sur ma colonie, puis je dois revenir quand c'est fini pour en lancer d'autres. »

## 2. Diagnostic
- La route logistique (5.33) ne va que dans un sens : colonie → planète mère.
- La colonie n'a qu'un lot de défense à la fois (`defenseJob`), sans file, alors que la planète mère a des files d'unités.
- Le contrôle de place du hangar ne comptait pas le lot en cours : sans file, cela ne posait pas de problème ; avec une file, il faut compter
  tout ce qui est commandé.

## 3. Benchmark
- OGame : transports manuels seulement ; les outils tiers automatisent les envois (signe d'un besoin).
- Jeux de gestion mobiles (Rise of Kingdoms, Clash of Clans) : files de production de 5 éléments ou plus, payées à la commande.

## 4. Options
| | Option | Pour | Contre |
|:--|:--|:--|:--|
| A | Transport programmé par flotte (vaisseaux immobilisés) | cohérent avec l'univers | lourd : flottes, emplacements, interception |
| B | **Route abstraite dans les deux sens** (même règle que 5.33 : frais 10 %, cadence 6/12/24 h) | simple, déjà éprouvé | aucune interception possible |
| C | File de défense illimitée | confort maximal | stock immobilisé sans fin, hangar difficile à lire |
| D | **File de 5 lots, payés d'avance, places réservées** | comme les files d'unités de la planète mère | aucun |

## 5. Recommandation : B + D
- **Ravitailler** (mère → colonie) : à chaque convoi, la colonie est remplie jusqu'à 25, 50 ou 80 % de son entrepôt, en ressources communes.
  La planète mère garde toujours 30 % de son entrepôt. 10 % perdus en route, comme dans l'autre sens.
- **File de défense** : 1 lot en construction + 5 en attente ; chaque lot est payé et réserve ses places à la commande ; annuler un lot en
  attente rembourse tout ; annuler le lot en cours rembourse au prorata et démarre le suivant.
- Q.3 (flotte basée sur une colonie) : plus tard, si la santé de l'équilibre montre un usage réel des colonies.

## 6. Invariants
- Une route de ravitaillement ne descend jamais la planète mère sous 30 % de son entrepôt (test).
- Défenses construites + commandées ≤ capacité du hangar de défense de la colonie (test).
