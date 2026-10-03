---
version: 5.6.3
iteration: 68
date: 2026-10-03
title: Les gros chiffres aussi
---
Le champ de saisie des chiffres tient aussi les montants en dizaines de milliards, et le simulateur en profite enfin.

## Corrections
- **Livrer et rapatrier** : les cases de chargement passent sur deux colonnes. Un montant comme 95 163 812 345 s'affiche en entier, avec MIN et MAX à côté.
- **Longs nombres** : le chiffre passe un cran plus petit plutôt que d'être coupé. Au-delà de mille milliards, la case affiche la forme courte (« 1,2 Bn ») hors saisie. La valeur exacte reste visible au survol et pendant la saisie.
- **Simulateur** : le niveau a lui aussi ses boutons − / + et MAX. Sur un écran étroit, les champs passent sous le nom de l'unité au lieu de l'écraser.
- **Bouton MIN** : présent sur tous les champs (remise à zéro), dès qu'il y a la place.
