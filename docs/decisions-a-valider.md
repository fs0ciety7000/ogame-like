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
| Q128 | Édition admin : niveaux et nombres envoyés en écarts ? : Oui, niveaux compris : une montée faite par le joueur pendant l'édition n'est jamais annulée ; un niveau hors limites est refusé, pas tronqué | Valider (option prudente) |
| Q129 | Édition admin : ressource commune au-delà de l'entrepôt : Refusée avec la marge restante (« Rendre des ressources » reste pour dépasser) ; un retrait plus grand que le stock s'arrête à 0 | Valider (option prudente) |
| Q130 | Le joueur est-il prévenu d'une édition admin ? : Oui, notification « Empire ajusté par l'équipe » avec le motif | Valider (option prudente) |
| Q131 | `players.updateRule` : un admin du jeu peut-il encore écrire la fiche d'un autre joueur par l'API ? : Non (resserré ; tout passe par `admin/player-action`) | Valider (option prudente) |
| Q132 | Portée de « Remise à zéro de l'XP » : Inchangée : tous les enregistrements `players`, seigneurs compris | Valider (option prudente) |
| Q133 | Suppression de compte : confirmation : Mot de passe revérifié par le serveur + pseudo ; un compte sans mot de passe connu (Google, Apple, passkey) passe par l'équipe | Valider (option prudente) |
| Q134 | Mises en tête d'un joueur supprimé sur les ventes des autres : Retirées ; la vente repart de son prix de départ et le vendeur est prévenu | Valider (option prudente) |
| Q135 | Bannissement et suppression de compte : Un bannissement est gardé quand le joueur se supprime lui-même ; un admin du jeu ne peut pas supprimer son compte tant qu'il a ses droits | Valider (option prudente) |
| Q136 | Suppression directe d'un compte `users` par l'API : Refusée (403) : le joueur passe par Réglages → Zone dangereuse | Valider (option prudente) |
| Q137 | « Vider les files » (admin) : Reste une écriture directe sur `queues` (aucune réécriture depuis une lecture ancienne) | Valider (option prudente) |
