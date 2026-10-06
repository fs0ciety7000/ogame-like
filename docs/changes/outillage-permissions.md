# Outillage : commandes autorisées pour les agents

Type : docs (outillage)
Statut : livré (PR fs0ciety7000/ogame-like#144)
Proposition : aucune (outillage, sans effet sur le jeu)

## Demande
> « Crée le Json et commit »

Les sessions d'agent étaient bloquées par des refus de commandes ordinaires (lecture, recherche, édition, tests).

## Diagnostic
Sans objet.

## Ce qui change
- `.claude/settings.json` : liste `permissions.allow` des commandes de travail courantes. On y trouve :
  - npm, tsc, eslint, vitest, vite, node, python3 ;
  - git en lecture, add, commit, et push sur les branches `claude/*` seulement ;
  - lecture et recherche de fichiers ;
  - curl vers le PocketBase local (127.0.0.1, localhost).
- Rien n'autorise l'accès à la production ni un push sur `main`.

## Décisions et écarts
- Pas de règle vers `base.fs0ciety.org` : un accès à la production reste confirmé à la main, à chaque fois.
- Aucun identifiant dans le dépôt (règle de `CLAUDE.md`).

## Invariants et tests
Sans objet.

## Design (DESIGN.md)
Sans objet.

## Docs mises à jour
CLAUDE.md (section Livrer), index des fiches.

## Validation
Sans objet (aucun code).

## Suites
Ajouter une commande à la liste quand un lot en a besoin. Ne jamais ajouter de règle vers la production.
