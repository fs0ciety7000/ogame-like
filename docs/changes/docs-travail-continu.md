# Docs : travail en continu et journal des questions

Type : docs
Statut : livré (branche `claude/hiver-k-s`)
Proposition : aucune (consigne de l'utilisateur)

## Demande
> « N'attends plus que je te dise de passer à la suite. Travaille automatiquement. Si tu as des questions ou besoin de précisions. Note et
> log les, on ajustera ensemble. Ajoute cette instruction aux fichiers .md »

## Diagnostic
CLAUDE.md (règle n° 1, méthode de game design) et WORKFLOW.md (étape 5) imposaient d'attendre la décision de l'utilisateur après chaque
proposition.

## Ce qui change
- CLAUDE.md : **règle n° 3** (citation de la consigne) ; règle n° 1 et méthode réécrites (la recommandation s'applique, le choix est noté).
- WORKFLOW.md : la règle « s'arrête à l'étape 5 » est remplacée par « recommandation appliquée, choix noté ».
- `docs/QUESTIONS.md` (nouveau) : journal des questions et décisions prises seul, avec statut et moyen de revenir en arrière. Ouvert avec
  Q1 à Q4 (budget du passe, raids dans les défis, PRG-1, PRG-2).

## Décisions et écarts
Restent hors du travail automatique : écrire en production, pousser sur `main`, ouvrir une PR, tout secret.

## Invariants et tests
Sans objet.

## Design (DESIGN.md)
Sans objet.

## Docs mises à jour
CLAUDE.md, WORKFLOW.md, QUESTIONS.md.

## Validation
Relecture.

## Suites
Enchaîner sur 6.8.2 (générateur de Chroniques), puis la feuille de route hiver.
