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
| Q361 | **Rouge « danger » éclairci** dans 7 thèmes (4,12 → 4,55:1 sur les panneaux), même teinte (`docs/changes/6.14.147-revue-au28.md`) | alertes plus lisibles | valider |
| Q362 | **Saga d'alliance sur le chapitre du mois** : même faction, boss et image ; titre non répété sur 3 mois ; réglable dans l'admin (`docs/changes/6.14.147-revue-au28.md`) | saga cohérente avec les Chroniques | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
| Q363 | Trois opacités laissées volontairement (message masqué, simulateur en raid, filtre des technos) (`docs/changes/6.14.147-revue-au28.md`) | valider |
| Q364 | Feuille d'hiver 2031 : les 14 lots repris (R1 à R14) passent avant H31-1 (`docs/proposals/feuille-de-route-2031-hiver.md`) | valider |
