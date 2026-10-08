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
| Q344 | Rapports de combat anciens (4 jamais vus, un seul défenseur sur la pré-prod) : Chemin gardé jusqu'à zéro, recompté à chaque copie de la pré-prod (`docs/changes/6.14.135-menage-tour-actions.md`) | aucun | valider |
| Q345 | « Lancer maintenant » des tâches horaires et de nuit : Cadences seulement (ces tâches n'ont pas de verrou) (`docs/changes/6.14.135-menage-tour-actions.md`) | aucun (admin) | valider |
| Q336 | Proposé (pas lancé) : **Option des paliers des bâtiments** — D : règle n° 4 réécrite en deux familles (bâtiments de système avec paliers d'effet aux niveaux 5, 10, 15, 20 ; bâtiments de courbe avec jalons seulement) ; paliers pour l'entrepôt, l'Atelier et les hangars ; I29 intact en simulation (`docs/proposals/paliers-batiments.md`) | attente sans nouveauté avant la 1re Ascension : 30–39 j → 20–29 j | valider (lance les lots PB-L0 à PB-L5) |
| Q337 | Proposé (pas lancé) : Tampon de l'entrepôt (niveau 10) — 2 h de production en trop gardées (`docs/proposals/paliers-batiments.md`) | production perdue −0,2 à −0,3 point | valider |
| Q338 | Proposé (pas lancé) : Signature de l'entrepôt (niveau 20) — Abri de 12 h pour les 4 ressources (`docs/proposals/paliers-batiments.md`) | moins de pillage pour un entrepôt maximal | valider (à mesurer en JcJ au lot) |
| Q339 | Proposé (pas lancé) : Signature de l'Atelier (niveau 20) — Une accélération gratuite de 2 h par jour (`docs/proposals/paliers-batiments.md`) | jusqu'à 12 Ambre de moins dépensés par jour | valider |
| Q340 | Proposé (pas lancé) : Signature du hangar de défense (niveau 20) — Défenses reconstruites à 70 % au lieu de 60 % (`docs/proposals/paliers-batiments.md`) | défense un peu plus solide (à mesurer au lot PB-L4) | valider |
| Q341 | Proposé (pas lancé) : Confort des hangars (niveau 10) — File d'attente façon Clash of Clans (une commande attend une place libre), I2 à réécrire (`docs/proposals/paliers-batiments.md`) | moins de micro-gestion des places | valider |
| Q342 | Proposé (pas lancé) : Choix des paliers (entrepôt 15, Atelier 15, hangars 15) — Changement gratuit une fois par 24 h (`docs/proposals/paliers-batiments.md`) | choix réversible sans coût | valider |
| Q343 | Proposé (pas lancé) : Niveaux des paliers — 5, 10, 15, 20, réglables dans l'admin (`docs/proposals/paliers-batiments.md`) | aucun | valider |
| Q333 | Objectifs paramétrés par contenu : Table des poids par thème vide et nouveaux objectifs du jour à poids 0 (aucun tirage ne change) ; quantité « Construire » fixée à 20 (`docs/changes/6.14.131-objectifs-parametres.md`) | rien de visible tant que l'admin ne règle pas les poids | valider, puis régler les thèmes sur la pré-prod |
| Q334 | Codex Doctrines et Arsenal : Officiers de saison en « fiches en plus » (hors pourcentage) ; récompense des catégories au barème des Unités (5 jetons, 25 Ambre) ; « Une identité » gagnée d'office par qui a déjà une classe (`docs/changes/6.14.132-codex-doctrines-arsenal.md`) | le pourcentage global du Codex baisse (25 fiches de plus) ; un succès offert aux joueurs qui ont une classe | valider |
| Q335 | **Plans signature et sources des reliques** : Plan de module « signature » par unité (×1,25 la famille, 15 % des plans rares ou mieux, unité tirée au hasard) ; reliques avec sources selon le lore, chance ×3 depuis leur source favorite : en expédition, Soute pliée et Cristal mémoriel passent de 4,5 % à 11,5 % (`docs/changes/6.14.133-porteurs-signature.md`) | le butin d'expédition change (voulu par Q67) | valider |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
