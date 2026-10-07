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
| Q109 | Ember de Constellation : la teinte proposée par l'audit (`#e8a23a`) se confond avec l'or : `#e0802c` (orange de la bande du thème) | Couleurs et accueil (design UI/UX) | Valider (option prudente) |
| Q110 | Accent de Constellation (accent ≠ texte) : Sable `#d6c49a` ; l'onglet actif garde son soulignement | Couleurs et accueil (design UI/UX) | Valider (option prudente) |
| Q111 | Bouton « Créer mon empire » sur l'accueil : `secondary` : « Connexion » reste le seul bouton plein | Couleurs et accueil (design UI/UX) | Valider (option prudente) |
| Q112 | Confusions de couleurs voulues des autres thèmes (Cockpit monochrome, Holo, Netrunner, Matrice…) : Gardées telles quelles, figées dans la garde `themeTokens.test.ts` | Couleurs et accueil (design UI/UX) | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
