# Fusion du quotidien : proposition chiffrée

Type : docs
Statut : livré (PR fs0ciety7000/ogame-like#144)
Proposition : [`docs/proposals/quotidien-fusion.md`](../proposals/quotidien-fusion.md) (principe validé, chiffres à confirmer)

## Demande
> « Fusionner les contrats et les missions du jour (point 3) ? Oui »

## Diagnostic
Deux systèmes quotidiens (`contracts.ts`, `dailyMissions.ts`) avec deux heures de remise à zéro, deux récompenses et deux listes.

## Ce qui change
- Joueur : rien encore.
- Docs : proposition chiffrée (4 ordres par jour, totaux inchangés : 360 rares × échelle, 60 XP, 5 jetons), décisions reportées dans
  `journal-de-bord.md`, `classes-empire.md`, la feuille de route d'hiver et la fiche 6.0.0.

## Décisions et écarts
Implémentation au lot N, après confirmation des deux questions ouvertes (4 ou 5 ordres, minuit heure de Paris).

## Invariants et tests
Sans objet (les tests viendront avec le lot N).

## Design (DESIGN.md)
Sans objet.

## Docs mises à jour
Voir « Ce qui change ».

## Validation
Sans objet (documentation seulement).

## Suites
Lot N.
