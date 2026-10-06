# Proposition : routes logistiques des colonies (lot I)

Statut : **livrée (5.33.0)** : option B, convoi abstrait toutes les 6, 12 ou 24 h, réserve au choix, 10 % de frais. Décision du 2026-10-06
(« fais ce qu'il y a de mieux »). Fiche : `docs/changes/5.33.0-routes-logistiques.md`.
Constat : E6 de `docs/audit/2026-10-06-audit-global.md`. Lot I de `docs/proposals/feuille-de-route-2026-q4.md`.

## 1. Constat

> « Mes colonies se remplissent et plafonnent : je n'ai pas le temps d'organiser des transports. » (audit E6)

Production, 2026-10-06, en lecture seule : **17 transports** sur la période relevée, contre 241 recyclages. Les colonies produisent
(+50 % de bonus de terres neuves), mais leur stock reste sur place et plafonne à leur entrepôt.

## 2. Diagnostic

- Rapatrier le stock demande une flotte de fret, un aller et un retour, et une soute assez grande (`performTransportArrival`).
- Rien n'automatise ce geste : la colonie devient une ferme qu'on oublie.

## 3. Benchmark

| Jeu | Règle |
|:--|:--|
| OGame | transports manuels ; outils tiers pour automatiser |
| Mobiles de gestion (Forge of Empires, etc.) | collecte automatique contre une part, ou récolte en un geste |
| Jeux de logistique (Anno, X4) | routes commerciales récurrentes, réglées une fois |

## 4. Options

| Option | Règle | Effet | Risque |
|:--|:--|:--|:--|
| A | Bouton « Tout rapatrier » qui lance une vraie flotte | garde la flotte au centre | toujours un geste par colonie, soute, pillage en vol |
| B | **Route abstraite** : toutes les 6, 12 ou 24 h, un convoi ramène ce qui dépasse la réserve, avec **10 % de frais** | réglé une fois ; le transport par flotte reste utile (gratuit) | ressources qui arrivent sans flotte : à borner par l'entrepôt de la planète mère |
| C | Fusionner les stocks colonie / planète mère | le plus simple | supprime l'intérêt des colonies (stock séparé, raids sur colonie) |

## 5. Recommandation

**Option B.**
- Par colonie : cadence (arrêt, 6 h, 12 h, 24 h) et réserve gardée sur place (0 %, 20 % ou 50 % de l'entrepôt de la colonie).
- Au convoi : chaque ressource commune au-dessus de la réserve part, **dans la limite de la place libre de l'entrepôt de la planète mère**
  (frais compris). La ressource rare du gisement part aussi (réserve = même part de son stock), sans plafond, comme partout.
- 10 % perdus en route. Un seul convoi au rattrapage (il prend tout ce qui dépasse) ; le suivant reste aligné sur la cadence.
- Calcul dans le rattrapage des colonies (`advanceColonies`), donc au serveur, sans nouvelle tâche planifiée.
- Écran : panneau « Route logistique » sur chaque colonie (cadence, réserve, prochain convoi, dernier convoi, aperçu).
- Pas de notification par convoi (4 par jour et par colonie, ce serait du bruit) : le panneau montre le dernier.
- Règles en constantes (`COLONY_ROUTE_RULES`), comme le reste des colonies (pas d'onglet admin dédié aujourd'hui).

## 6. Invariants

- Un convoi ne porte jamais les ressources communes de la planète mère au-delà de son entrepôt, et ne prend jamais sous la réserve. Test :
  `colonyRoutes.test.ts`.

## 7. Plan de lots

1. I.1 (5.33.0) : moteur, action `colonyRoute`, panneau, tests.
2. I.2 (plus tard) : route inverse (planète mère → colonie) pour nourrir les chantiers de colonie ; flotte basée.

## 8. Questions ouvertes

1. 10 % de frais : assez pour que le transport manuel garde un sens ? À relever après deux semaines (part des colonies avec route).
