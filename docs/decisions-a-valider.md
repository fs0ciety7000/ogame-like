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
| Q113 | Seuil d'entrée d'une action dans les défis du passe : 0,25 par semaine (et non « médiane > 0 ») ; réglable | Passe, Chroniques et succès (contenu généré) | Valider (option prudente) |
| Q114 | Garde de faisabilité et minimum de points par palier (`pointsMin`) : La garde respecte `pointsMin`, même si le joueur médian finit après le 28e jour (dit dans « Pourquoi ces chiffres ») | Passe, Chroniques et succès (contenu généré) | Valider (option prudente) |
| Q115 | Garde avant publication d'office d'un brouillon retouché dans l'admin : Elle ne change que les défis et les points par palier | Passe, Chroniques et succès (contenu généré) | Valider (option prudente) |
| Q116 | Brouillons existants dont on ne sait pas s'ils ont été retouchés : Régénérés (cohérent avec Q83) | Passe, Chroniques et succès (contenu généré) | Valider (option prudente) |
| Q117 | Succès par défaut manquants au déploiement : Tous rajoutés (aucune liste de retraits n'existait) ; un retrait volontaire passe désormais par `achievementList.removedDefaults` | Passe, Chroniques et succès (contenu généré) | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
