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
| Q323 | Retirer au lieu de supprimer : Un talent ou un modèle de module enregistré ne se supprime plus : case « Retiré » (une suppression effaçait les plans détenus) (`docs/changes/6.14.127-talents-modules.md`) | aucun plan ni module perdu | valider |
| Q324 | Talent retiré : Ne s'apprend plus, mais les rangs déjà pris gardent leur effet (pas de points rendus) (`docs/changes/6.14.127-talents-modules.md`) | aucun pour un joueur qui l'avait | valider |
| Q325 | Bornes et branches des talents : Valeur par rang ≤ 0,25 pour une part, ≤ 2 niveaux, ≤ 5 points ; branches de talents fixes (`docs/changes/6.14.127-talents-modules.md`) | aucun | valider |
| Q326 | Rotation des thèmes du passe : L'ordre de la liste fait la rotation ; ajouter ou retirer un thème décale les mois suivants (un passe déjà écrit garde son thème) (`docs/changes/6.14.128-catalogue-passe.md`) | aucun à contenu par défaut | valider |
| Q327 | Succès « Trois ans de campagne » et bannière : Palier fixe de 36 mois ; la bannière d'un passe terminé prend le nom et la couleur du passe publié (`docs/changes/6.14.128-catalogue-passe.md`) | bannière fidèle au passe joué | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
