# Méthode et documents de conception

Type : docs
Statut : livré (PR fs0ciety7000/ogame-like#144)
Proposition : aucune (outillage de travail)

## Demande
> « Propose et explique ta façon de faire, documente avec Claude.md et autres docs .md […] »
> « Pour chaque proposal et modifications/ajouts/rework/ajustements/refactoring, tu crées un .md […] Tu t'auto-alimentes et donc ces fichiers aussi. »

## Diagnostic
Sans objet.

## Ce qui change
- `CLAUDE.md` : règles de travail, lu en premier par tout agent.
- `docs/GAME_DESIGN.md` : GDD (piliers, boucles, invariants, fiches systèmes, grille et journal d'audit).
- `docs/WORKFLOW.md` : chaîne d'une fonctionnalité et méthode de level design.
- `docs/proposals/` : propositions chiffrées en attente de décision.
- `docs/changes/` : une fiche par lot, avec modèle et index.

## Décisions et écarts
Le GDD est `docs/GAME_DESIGN.md` (pas de second fichier « GDD.md », pour éviter deux sources de vérité).

## Invariants et tests
Sans objet.

## Design (DESIGN.md)
Sans objet.

## Docs mises à jour
Tous les documents ci-dessus ; `CLAUDE.md` et `WORKFLOW.md` imposent désormais la fiche de changement.

## Validation
Relecture ; aucun code touché.

## Suites
Chaque lot met à jour ces documents (règle d'auto-alimentation dans `CLAUDE.md`).
