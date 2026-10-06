# Proposition : catégories d'unités (lot R, constat C4)

Statut : **livrée** en 6.3.1, voir `docs/changes/6.3.1-categories-unites.md`.
Lot R de `docs/proposals/feuille-de-route-2026-hiver.md`.

## 1. Constat
- Le Bastion (attaque 150, défense 1400) est rangé dans l'onglet « Attaque » : on le croit offensif.
- L'Intercepteur est une défense, mais il affiche une vitesse 12 et une soute 5 que le jeu n'utilise jamais (une défense ne part pas en flotte).

## 2. Diagnostic
- La catégorie décide d'une seule chose : l'unité **vole** (hangar d'attaque, flottes) ou **reste** (hangar de défense). Le libellé « Attaque » trompe.
- Le test d'équilibre « aucune unité dominée » ne laissait passer l'Intercepteur que grâce à sa vitesse fictive : sans elle, la Batterie AA
  (moins chère) fait mieux par place (492 contre 416).

## 3. Options
| | Option | Effet | Risque |
|:--|:--|:--|:--|
| A | Changer de catégorie (Bastion en défense, Intercepteur en vaisseau) | les hangars et bonus ciblés des joueurs bougent | **élevé** : migration des unités, hangars pleins, I3 à I5 |
| B | **Garder les catégories, corriger ce qui trompe** : onglets « Vaisseaux / Défenses », Intercepteur sans vitesse ni soute, recalé pour ne plus être dominé | aucune donnée de joueur ne bouge | faible |

## 4. Recommandation : B
- Onglets et étiquettes : « Vaisseaux » et « Défenses » (Unités, fiche d'unité).
- Intercepteur : vitesse 0, soute 0 ; attaque 255 → 320, défense 60 → 80 (503 par place, au-dessus de la Batterie AA à 492) ; coût inchangé.
- Descriptions : Bastion « vaisseau-forteresse », Intercepteur « tourelle d'interception ».
- Contenu personnalisé : migration `categories-6.4` seulement si les valeurs sont encore celles par défaut (c'est le cas en production).

## 5. Invariants
- `balance.test.ts` « aucune unité dominée » passe sans exception.
