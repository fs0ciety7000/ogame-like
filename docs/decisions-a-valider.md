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
| Q261 | Un total différent de 100 % est refusé à l'enregistrement (pas de normalisation automatique) (`docs/changes/6.14.104-chiffres-reglables.md`) | aucun : les divisions gardent leurs parts | valider |
| Q262 | Larges : talents 0 à 0,25 par rang (réseau 0 à 2), modules 0 à 1 (voile 0 à 20), spécialisations 0,1 à 5, prix 1 à 100 000 Ambre (`docs/changes/6.14.104-chiffres-reglables.md`) | aucun ; une faute de frappe est refusée | valider |
| Q263 | Refus à l'enregistrement ; égalité permise sauf seuils stricts (bouclier < riposte, faible < fort, zone JcJ) (`docs/changes/6.14.104-chiffres-reglables.md`) | aucun, tant qu'un admin ne croise pas deux valeurs | valider |
| Q259 | Bornes larges (souvent de 0 à environ 10 fois le défaut) ; une valeur déjà enregistrée hors bornes doit être corrigée avant d'enregistrer l'onglet Règles (`docs/changes/6.14.95-metadonnees-reglages.md`) | les réglages restent libres dans une plage large ; une faute de frappe (×100) est refusée | valider |
| Q260 | Appliqué en 6.14.104 : 15 paires refusées si croisées (`docs/changes/6.14.95-metadonnees-reglages.md`) | aucun, tant qu'un admin ne croise pas deux valeurs | valider (dans AA3) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
