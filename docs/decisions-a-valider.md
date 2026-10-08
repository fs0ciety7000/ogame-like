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
| Q333 | Objectifs paramétrés par contenu : Table des poids par thème vide et nouveaux objectifs du jour à poids 0 (aucun tirage ne change) ; quantité « Construire » fixée à 20 (`docs/changes/6.14.131-objectifs-parametres.md`) | rien de visible tant que l'admin ne règle pas les poids | valider, puis régler les thèmes sur la pré-prod |
| Q334 | Codex Doctrines et Arsenal : Officiers de saison en « fiches en plus » (hors pourcentage) ; récompense des catégories au barème des Unités (5 jetons, 25 Ambre) ; « Une identité » gagnée d'office par qui a déjà une classe (`docs/changes/6.14.132-codex-doctrines-arsenal.md`) | le pourcentage global du Codex baisse (25 fiches de plus) ; un succès offert aux joueurs qui ont une classe | valider |
| Q335 | **Plans signature et sources des reliques** : Plan de module « signature » par unité (×1,25 la famille, 15 % des plans rares ou mieux, unité tirée au hasard) ; reliques avec sources selon le lore, chance ×3 depuis leur source favorite : en expédition, Soute pliée et Cristal mémoriel passent de 4,5 % à 11,5 % (`docs/changes/6.14.133-porteurs-signature.md`) | le butin d'expédition change (voulu par Q67) | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
