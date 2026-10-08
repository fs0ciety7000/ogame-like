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
| Q315 | Classes d'empire dans les règles : `rules.classes.defs`, effets composés ; une classe livrée ne peut pas être retirée (des joueurs l'ont choisie) (`docs/changes/6.14.125-listes-systeme.md`) | aucun à contenu par défaut | valider |
| Q316 | Mutateurs en liste libre : Le tirage des mois non imposés suit la liste éditée (`docs/changes/6.14.125-listes-systeme.md`) | aucun à contenu par défaut | valider |
| Q317 | Fugitifs : Rangés dans la fiche de faction, repérés par leur indice ; les fugitifs d'élite restent dans le code (`docs/changes/6.14.125-listes-systeme.md`) | aucun | valider |
| Q318 | Faction ajoutée sans archétype : Reçoit un archétype construit depuis sa fiche, tiré comme les autres (chapitres, sagas, thèmes du passe) (`docs/changes/6.14.125-listes-systeme.md`) | une faction ajoutée apparaît dans les Chroniques | valider |
| Q319 | Historique de l'équipe : Historique seulement, sans retour arrière (droits d'admin) (`docs/changes/6.14.126-historique-admin.md`) | aucun (admin) | valider |
| Q320 | Calcul de la différence : Dans le navigateur (200 lignes au plus) (`docs/changes/6.14.126-historique-admin.md`) | aucun (admin) | valider |
| Q321 | Réglages suivis par l'historique : Casino, générateurs, annonces, bandeaux, émojis, équipe (`docs/changes/6.14.126-historique-admin.md`) | aucun (admin) | valider, ajouter `weekly_stock` et `patrons` plus tard si utile |
| Q322 | Retour vers une version devenue invalide : Refusé (400, rien n'est écrit) (`docs/changes/6.14.126-historique-admin.md`) | aucun (protège le jeu) | valider |
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
