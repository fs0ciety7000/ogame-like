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

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q380 | Règle proposée pour CLAUDE.md : « un export que rien ne lit hors de son module n'est pas exporté ; `scripts/dead-exports.mjs` les liste, `deadExports.test.ts` échoue sinon » (`docs/changes/6.14.153-menage-exports.md`) | valider |
| Q381 | Recenser aussi les exports de `hooksEntry.ts` jamais appelés par `pocketbase/pb_hooks` (bundle plus léger) (`docs/changes/6.14.153-menage-exports.md`) | valider |
| Q382 | Un défi d'alliance enregistré se retire au lieu de se supprimer (historique des semaines gardé) (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q383 | Ajouter ou retirer un défi d'alliance décale la rotation des semaines suivantes (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q384 | Réserve des missions du jour gardée en section éditable alors que `daily.tasks` vaut 0 (sans effet en jeu) (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q385 | Exclusions des statistiques d'équilibre dans les règles (`balanceExclusion`) plutôt qu'une case par membre du staff (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
| Q386 | AA-14 : bornes des effets de techno (`EFFECT_MAX_PER_LEVEL`) laissées au code comme garde-fou d'équilibre (`docs/changes/6.14.154-admin-evolutif-suite.md`) | valider |
