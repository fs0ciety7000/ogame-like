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

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
