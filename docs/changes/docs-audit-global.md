# Audit global et fiches systèmes

Type : docs
Statut : livré (PR fs0ciety7000/ogame-like#144)
Proposition : [`docs/proposals/feuille-de-route-2026-q4.md`](../proposals/feuille-de-route-2026-q4.md) (en attente de décision)

## Demande
> « Il faut que tu audit et analyses tout le projet pour qu'on aie les documents de chaques fonctionnalités etc afin de travailler dessus.
> Analyse, audite, propose changements et équilibrages […] Propose-moi ensuite les Lots que tu penses pertinents pour que je les valide. »

## Diagnostic
- Inventaire : règles (`*_RULES`), contenu par défaut, tâches planifiées, taille des bundles.
- Vérifications ciblées, chacune citée dans le rapport.
- Benchmark OGame, Clash of Clans et Xterium.
- Constats C1 à C5, E1 à E6, Q1 à Q4, P1 à P3, D1 et D2 : voir `docs/audit/2026-10-06-audit-global.md`.

## Ce qui change
- Joueur : rien (documentation seulement).
- Admin : rien.
- Docs :
  - `docs/systems/` : 14 fiches et un index ;
  - `docs/audit/2026-10-06-audit-global.md` ;
  - `docs/proposals/feuille-de-route-2026-q4.md` (lots A à J).

## Décisions et écarts
Aucun changement de code dans ce lot. Les correctifs (lot A) attendent la validation, même s'ils sont sans risque, pour respecter la règle
« une proposition, puis la décision ».

## Invariants et tests
Sans objet. Le constat C1 viole I3 : il sera corrigé au lot A, avec un test.

## Design (DESIGN.md)
Sans objet.

## Docs mises à jour
- `CLAUDE.md` : `docs/systems/` et `docs/audit/` dans la table, report des règles dans la fiche du domaine.
- GDD : §7 renvoie aux fiches, nouvelle ligne au journal d'audit.
- Index des fiches de changement.

## Validation
Relecture. Chiffres tirés du code au commit 0369ea3.

## Suites
Décision sur la feuille de route ; collecte des données de production avant le lot E.
