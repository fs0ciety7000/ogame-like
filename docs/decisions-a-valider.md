# Décisions à valider (synthèse de `docs/QUESTIONS.md`)

Lot H29-4 (6.14.28), constat AU29-5. Le 2026-10-07, 24 questions étaient ouvertes. Pour chacune, le choix fait seul (règle n° 3), son
effet et ma recommandation. Réponse rapide possible : « je valide tout sauf Qx, Qy ». Une décision changée devient un lot. Une décision
validée passe au statut « validée » dans `QUESTIONS.md`.

Page de réponse : **`/decisions`** dans le jeu (`test.fs0ciety.org/decisions`, `empire.fs0ciety.org/decisions` après la mise en
production), réservée aux admins du jeu. Elle lit `QUESTIONS.md` et ce fichier au build. Les réponses sont gardées dans la collection
`decision_answers` ; Claude les relit avec `node scripts/decisions.mjs`. **Chaque nouvelle question ouverte ajoute sa ligne ici**
(groupe, effet, conseil) : un test l'exige. L'artifact « Décisions à valider » de 6.14.28 est remplacé par cette page.

## 1. Bloquante

| Q | Décision | Effet | Recommandation |
|:--|:--|:--|:--|

## 2. Joueurs et équilibre (chiffres réglables dans l'admin)

| Q | Décision appliquée | Effet pour les joueurs | Recommandation |
|:--|:--|:--|:--|
| Q216 | Mécanisme de la bascule du rythme : Fonction pure datée (`applyRhythmSwitch`), sans écriture en base ; une valeur réglée par l'admin est gardée | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q217 | Garde I29 : Bornes à 90 jours gardées (jeu d'avant la bascule), garde à 365 jours ajoutée (après la bascule) | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q218 | Colonies et bascule : Leurs niveaux 11 à 18 suivent aussi la bascule (×4, 30 h + 24 h par niveau) | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q219 | File planifiée : Un niveau planifié avant la date mais lancé après paie et dure aux nouvelles règles | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q220 | Enregistrement des règles par l'admin après la date : Écrit les valeurs basculées en base : décocher la bascule ne les ramène plus | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q221 | Annonce du rythme : Datée (7 jours avant) et en attente de son image `annonce-rythme` : sans image avant le 25 octobre, elle paraît en retard | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q222 | Succès d'Ascension : Seulement II, V et X (Seconde aube, Cinq renaissances, Dixième ciel) | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q223 | Ascension X : +100 % de production et −50 % de durée de construction (bonus par Ascension inchangés), à surveiller | Rythme sur des mois (bascule du 1er novembre) | Valider |
| Q224 | **Sessions bloquées après la 1re Ascension** (cible 15 %) : 25,8 % pour l'actif, 50 % pour le moyen avec `lateFromLevel` 6 ×30 : **Régler avant le 1er novembre (RL-5 avancé)** : simuler des variantes (palier de recherche, production après Ascension, projets) et appliquer la meilleure dans l'admin avant la date | Rythme sur des mois (bascule du 1er novembre) | Valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
