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
| Q118 | Garde-fous de l'admin : une erreur déjà en base dans une autre section bloque-t-elle l'enregistrement ? : Non : seules les erreurs nouvelles bloquent | Valider (option prudente) |
| Q119 | Tolérances de la validation : Clé inconnue acceptée ; texte ou oui/non absent non bloquant ; `null` permis si le défaut vaut `null` ; pas de borne haute générique (bornes par champ au lot AA2) | Valider (option prudente) |
| Q120 | Migration `relics-5.23` sans cas confirmé sur la pré-prod : Ajoutée quand même (sans effet sans liste personnalisée, protège un serveur ancien) | Valider (option prudente) |
| Q121 | Écritures internes du serveur (générateur, migrations, retour arrière) et garde-fous : Non vérifiées (la garde ne voit que les requêtes de l'admin) | Valider (option prudente) |
