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
| Q365 | **Chroniques anciennes allégées** (plus de 12 mois) : la croissance ralentit sans s'arrêter (`docs/changes/6.14.149-hygiene-generateurs.md`) | aucun avec les réglages par défaut | valider |
| Q367 | **Rotation des boss** : un boss désactivé laisse sa semaine au suivant ; calendrier inchangé si tous sont actifs (`docs/changes/6.14.149-hygiene-generateurs.md`) | aucun avec les réglages par défaut | valider |
| Q370 | **Prestige du passe** : 10 paliers cosmétiques après le palier 30 (bannière de saison, succès « Au-delà du passe »), sans ressource (`docs/changes/6.14.150-rythme-du-passe.md`) | le plus actif a encore un objectif jusqu'au jour 23 environ | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q366 | Passes de saison anciens (≈ 7 Ko par mois) laissés tels quels : commandants et bannières en dépendent (I43) (`docs/changes/6.14.149-hygiene-generateurs.md`) | valider |
| Q368 | Chapitre de la bibliothèque placé hors de sa saison : confirmation simple de l'admin plutôt qu'un blocage (`docs/changes/6.14.149-hygiene-generateurs.md`) | valider |
| Q369 | Chapitre écrit à la main sans fin de chapitre : pas de fin générée ajoutée (`docs/changes/6.14.149-hygiene-generateurs.md`) | valider |
| Q371 | Palier de prestige de taille fixe (4 paliers du passe) plutôt que calé sur le rythme du plus actif (`docs/changes/6.14.150-rythme-du-passe.md`) | valider |
| Q372 | Aucune notification au passage d'un palier de prestige (`docs/changes/6.14.150-rythme-du-passe.md`) | valider |
| Q373 | Succès « Au-delà du passe » au palier argent (XP seule) plutôt qu'or (2 h de production) (`docs/changes/6.14.150-rythme-du-passe.md`) | valider |
