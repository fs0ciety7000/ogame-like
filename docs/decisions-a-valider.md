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
| Q357 | **Réacteurs (hangars, palier 15)** : −5 % de temps de vol au lieu des −10 % validés (Q336 à Q343) : à −10 %, le temps de vol de la couche empire dépassait son plafond de 50 % (54 %) (`docs/changes/6.14.145-paliers-hangars.md`) | spécialisation un peu plus faible | valider (écart à la proposition) |
| Q358 | File d'attente des hangars : Commande coupée : la part qui a une place démarre, le reste attend (5 commandes au plus par hangar) ; démarrage hors ligne par une tâche toutes les 5 min ; jamais en vacances (`docs/changes/6.14.145-paliers-hangars.md`) | plus de commande refusée faute de place | valider |
| Q359 | Casemates (hangar de défense, palier 20) : Défenses reconstruites à 70 %, planète mère seulement (pas les colonies) ; mesure JcJ : issue des combats inchangée, défenses perdues de 17,8 % à 13,4 % (`docs/changes/6.14.145-paliers-hangars.md`) | défense un quart moins chère à tenir après une défaite | valider |
| Q360 | Succès « Architecte » et icônes des paliers : Les 4 paliers 20 en même temps (pas un cumul) ; 21 icônes de palier sur `/img` (tous les paliers) (`docs/changes/6.14.146-paliers-chaine.md`) | un succès d'or difficile ; plus d'images à produire | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
