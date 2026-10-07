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
| Q33 | La prémisse « voir l'attaque plus tôt » est caduque (§2.1). Que donne la phalange ? : radar d'alliance, perce-brouillard, balayage de l'agresseur (P3) ; on ne cache rien aux joueurs sans lune | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q34 | Balayage : n'importe quel joueur à portée (OGame) ou l'agresseur seulement ? : l'agresseur seulement (défensif) | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q35 | Porte de saut : rapatriement seul, ou aussi saut de garnison vers un allié à lune ? : rapatriement (patrouille, garnison, base avancée) ; saut d'allié livré mais `allyJump: false` | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q36 | La lune est rare (0 en production) : faut-il un chemin garanti ? : pitié : +5 % par combat subi sur la planète mère, lune garantie au 20e | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q37 | Coûts et recharges : balayage : 30 min de production d'énergie, recharge 30 → 10 min ; porte gratuite, 24 h → 20 h | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q38 | Le brouilleur d'approche est percé par une lune de niveau 2+ : compenser l'attaquant ? : non ; l'écran de lancement prévient avant d'embarquer la capsule | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q39 | Rapatrier une garnison alors que l'hôte va être attaqué : autorisé ? : oui (c'est ta flotte) ; la notification de l'hôte le dit | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q40 | Objectifs lunaires dans le passe ou les Chroniques ? : non (pas de lune pour tous) ; succès, Codex et défi d'alliance seulement | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q41 | Niveau de lune public ? : oui (Galaxie, profil) : le risque se voit avant d'attaquer | Phalange et porte de saut (lot É30-1, en cours de code) | Valider (recommandé, §8 de la proposition) |
| Q32 | Décor 3D de l'accueil réservé aux grands écrans, chargé après la page | Sur mobile, l'accueil répond tout de suite (≈ 155 Ko et ≈ 10 s de processeur en moins) ; le cylindre holographique n'y apparaît plus | Valider : le décor est flouté à 60 %, presque invisible sur un petit écran |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
