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
| Q394 | Découpage du bloc d'entrée (coque du jeu à part) essayé, mesuré et non gardé : aucun gain sur Galaxie, Commerce et Alliance (le moteur entier est lu avant la page), FCP +0,4 s (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
| Q395 | Règle `manualChunks` de CLAUDE.md : permettre un bloc « moteur » limité à ce qu'atteint `content.ts` (déjà au démarrage) (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
| Q396 | Alerte de raid et passage de palier montés après la page (2 s au plus, rien de perdu) (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
| Q397 | Suite R4c (L à XL) : objets de règles et catalogues par défaut en modules de données seules (casse le cycle de 53 modules), contenu appliqué par section, puis coque à part ; estimé −1 à −1,5 s sur mobile (`docs/changes/6.14.157-decoupage-entree.md`) | valider |
