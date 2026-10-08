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
| Q389 | **Gains au-delà de l'entrepôt** gardés (rien n'est perdu) et désormais dits au Journal et sur la carte « Ce que tu risques » (`docs/changes/6.14.155-au-dela-entrepot.md`) | le joueur sait pourquoi sa production s'arrête | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q382 | Un défi d'alliance enregistré se retire au lieu de se supprimer (historique des semaines gardé) (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q383 | Ajouter ou retirer un défi d'alliance décale la rotation des semaines suivantes (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q384 | Réserve des missions du jour gardée en section éditable alors que `daily.tasks` vaut 0 (sans effet en jeu) (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q385 | Exclusions des statistiques d'équilibre dans les règles (`balanceExclusion`) plutôt qu'une case par membre du staff (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q386 | AA-14 : bornes des effets de techno (`EFFECT_MAX_PER_LEVEL`) laissées au code comme garde-fou d'équilibre (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q387 | Ligne « au-delà de l'entrepôt » au Journal seulement, sans toast (Q76) (`docs/changes/6.14.155-au-dela-entrepot.md`) | valider |
| Q388 | Seuil de la ligne : 1 000 par ressource (`storageOverflow.minAmount`) (`docs/changes/6.14.155-au-dela-entrepot.md`) | valider |
| Q390 | Butin et livraisons non concernés par la ligne « au-delà de l'entrepôt » (`docs/changes/6.14.155-au-dela-entrepot.md`) | valider |
| Q391 | Dates de l'admin (maintenance, boss) à l'heure de l'appareil, comme les champs `datetime-local` qui les saisissent, plutôt qu'à l'heure de Paris (règle DESIGN.md des rendez-vous serveur) (`docs/changes/6.14.156-hygiene-design.md`) | valider |
| Q392 | Couleurs hex de `BossStage` gardées dans l'exception « scène dessinée » (`docs/changes/6.14.156-hygiene-design.md`) | valider |
| Q393 | Plancher de 11 px appliqué aussi aux étiquettes décoratives du cockpit (`index.css`) (`docs/changes/6.14.156-hygiene-design.md`) | valider |
