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
| Q307 | Rôles d'unités : Rôles cochés dans la fiche d'unité (sonde, recycleur, transport, soutien, faiblesse de boss, contre-espionnage), identifiants des règles gardés en repli (`docs/changes/6.14.123-roles-unites.md`) | aucun (contenu par défaut identique) | valider |
| Q308 | Récolteur : Garde seulement le rôle soutien (recycle par sa règle de classe) ; lui donner « recycleur » le sortirait des flottes des seigneurs (`docs/changes/6.14.123-roles-unites.md`) | aucun | valider |
| Q309 | Faiblesse de boss par défaut : Unités rangées du moins cher au plus cher (ordre de l'ancienne liste) (`docs/changes/6.14.123-roles-unites.md`) | aucun | valider |
| Q310 | Ressources rares dans le coût d'une unité : Payées et rendues, mais hors du temps de construction et des débris (`docs/changes/6.14.123-roles-unites.md`) | aucun (aucune unité par défaut n'en a) | valider |
| Q311 | Préréglages générés pour une unité ajoutée : « Armement » et « Blindage » au barème des préréglages (`docs/changes/6.14.123-roles-unites.md`) | aucun | valider |
| Q312 | Format des effets d'alliance : Liste `effects` (l'Anneau-forge agit sur deux grandeurs) au lieu d'un `effect` unique (`docs/changes/6.14.124-alliance-effets.md`) | aucun | valider |
| Q313 | Couche d'effets « alliance » : Séparée de la couche empire (seule façon de garder les valeurs identiques) ; plafonds 0,5 (bouclier 0,15, abri 0,25), contre-espionnage sans plafond (`docs/changes/6.14.124-alliance-effets.md`) | valeurs identiques ; une ligne « alliance » dans la fiche d'effets | valider |
| Q314 | Places de membres et Batterie de siège : Places lues dans `membersPerQuarter` ; Batterie de siège sur les mêmes cibles qu'avant (ni expéditions ni seigneurs) (`docs/changes/6.14.124-alliance-effets.md`) | aucun | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
