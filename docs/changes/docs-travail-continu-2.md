# Docs : travail continu entre deux feuilles de route

Type : docs
Statut : livré (branche `claude/hiver-k-s`)
Proposition : aucune (consigne de l'utilisateur du 2026-10-07)

## Demande
« N'attends plus que je te dise de passer à la suite. Travaille automatiquement. Si tu as des questions ou besoin de précisions. Note et
log les, on ajustera ensemble. Ajoute cette instruction aux fichiers.md »

## Diagnostic
La règle n° 3 existait déjà (`docs-travail-continu.md`), mais deux textes la contredisaient :
- la feuille de route de printemps attendait sa validation ;
- l'index des fiches disait encore qu'une proposition « attend la décision de l'utilisateur ».

Résultat : le travail s'est arrêté à la fin de la feuille de route d'hiver.

## Ce qui change
- CLAUDE.md (règle n° 3) : une feuille de route finie, la suivante est écrite et commencée aussitôt. Un lot qui demande la production, `main` ou une PR est sauté et noté.
- `WORKFLOW.md` et `QUESTIONS.md` reprennent la consigne mot pour mot.
- `docs/changes/README.md` : correction de la ligne « Proposition ».
- La feuille de route de printemps passe « en cours ».
- Q12 : Z0 et Z1 sont sautés.

## Décisions et écarts
Q11 (ordre) et Q12 (Z0, Z1) dans `docs/QUESTIONS.md`.

## Invariants et tests
Sans objet.

## Design (DESIGN.md)
Sans objet.

## Docs mises à jour
CLAUDE.md, `WORKFLOW.md`, `QUESTIONS.md`, `changes/README.md`, `feuille-de-route-2027-printemps.md`.

## Validation
Docs seules.

## Suites
Z2 (pages longues).
