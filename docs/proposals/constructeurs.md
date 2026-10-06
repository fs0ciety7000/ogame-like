# Proposition : chantiers et files de recherche (lot F)

Statut : **livrée (5.32.0)** : option C, avec 6 chantiers de base, +1 à la Fonderie quantique 5 et 10, et 4 recherches inchangées (décision du 2026-10-06). Fiche : `docs/changes/5.32.0-entrepot-chantiers.md`.
Constat : E3 de `docs/audit/2026-10-06-audit-global.md`, **corrigé** par cette proposition (voir §2).

## 1. Constat

> « Peu d'arbitrage : je lance tout en même temps. » (audit E3)

Production, 2026-10-06, collection `queues` (26 comptes) :

| Constructions en parallèle | Comptes |
|:--|:--|
| 0 | 17 |
| 1 à 3 | 4 |
| 5 à 8 | 3 |
| 12 | 1 |

Recherches en parallèle : 4 comptes à 4 (le maximum), 1 à 3, 2 à 2, 2 à 1.

## 2. Diagnostic

L'audit disait « une seule file de bâtiments ». **C'est faux** : chaque bâtiment a son amélioration propre, en parallèle
(`actions.ts`, `startBuildingUpgrade` : seul un bâtiment déjà en chantier est refusé). Seules les ressources limitent le nombre de chantiers.
La file planifiée (1 à 3 emplacements) sert à enchaîner les niveaux d'un même bâtiment, pas à paralléliser.

Conséquence : aucun choix d'ordre de construction. Le joueur lance tout ce qu'il peut payer. Les recherches sont limitées à 4 en parallèle
(`MAX_CONCURRENT_RESEARCH`).

## 3. Benchmark

| Jeu | Règle |
|:--|:--|
| OGame | 1 bâtiment à la fois par planète, 1 recherche à la fois (hors classe et officiers) : chaque choix compte |
| Clash of Clans | 2 constructeurs de départ, jusqu'à 5 (6 avec le bonus), achetés ou débloqués : le levier central de progression |
| Mobiles de gestion | 1 file, une 2e temporaire ou payante |

## 4. Options

| Option | Règle | Ce que ça règle | Coût, risque |
|:--|:--|:--|:--|
| A | Statu quo, audit corrigé | rien | aucun |
| B | **Chantiers** : 3 de base, +1 à l'Entrepôt 10, +1 à la Fonderie 5, +1 à la Fonderie 10 (6 au plus). Recherches inchangées (4) | choix d'ordre de construction, valeur des bâtiments clés | **retire de la capacité** au joueur à 12 chantiers. Compensation : chantiers en cours gardés jusqu'à leur fin, file planifiée inchangée |
| C | Chantiers 6 de base (rarement atteint), puis +1 par palier | presque rien pour l'instant, prépare la règle | faible |

## 5. Recommandation

Peu de joueurs actifs, et des joueurs de fin de partie qui construisent beaucoup en parallèle : une limite stricte (option B) serait vécue
comme un recul. **Option C**, ou B avec des paliers généreux, si tu veux plus d'arbitrage.
- Règle : `BUILD_RULES.baseSlots`, réglable dans l'admin, et les paliers dans le contenu des bâtiments.
- Écran : « Chantiers 4 / 6 » en tête de la page Bâtiments, avec le prochain déblocage.
- Aucune donnée retirée : un chantier en cours n'est jamais annulé par la nouvelle règle (test).
- Recherches : on garde 4. Le Labo n'a pas montré de problème.

## 6. Invariants

- Nouveau : un chantier ne se lance que si `chantiers en cours < chantiers disponibles`. Un dépassement hérité (migration) reste en cours
  jusqu'à sa fin. Test.

## 7. Plan de lots

1. F.1 : règle et réglage dans l'admin, compteur sur la page Bâtiments, tests, valeurs par défaut choisies par toi.

## 8. Questions ouvertes

1. Option A, B ou C ? Si B ou C : combien de chantiers de base (3, 4, 6) et quels paliers ?
2. Faut-il toucher aux recherches (4 aujourd'hui), ou les laisser telles quelles ?
