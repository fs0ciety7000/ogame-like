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
| Q50 | Sauvetage par la porte (`gateSaves`) : compté où ? : Par le serveur à l'arrivée de l'attaque (pas dans le moteur de combat, pour éviter un import circulaire) | Phalange et porte de saut (serveur livré, interface à venir) | Valider (option prudente) |
| Q51 | Fenêtre d'un sauvetage par la porte : 10 min après le saut (réglage `jumpGate.saveWindowMinutes`), un seul sauvetage par saut | Phalange et porte de saut (serveur livré, interface à venir) | Valider (option prudente) |
| Q52 | Radar d'alliance : respecte-t-il le réglage « événements d'alliance » coupé par le joueur ? : Non : c'est une alerte de défense, comme « Flotte hostile en approche » | Phalange et porte de saut (serveur livré, interface à venir) | Valider (option prudente) |
| Q53 | Seigneurs PNJ et radar d'alliance : Ils ne déclenchent pas le radar et n'apparaissent pas dans les alliés menacés | Phalange et porte de saut (serveur livré, interface à venir) | Valider (option prudente) |
| Q54 | Balayer un seigneur qui t'attaque : Permis (c'est un agresseur) | Phalange et porte de saut (serveur livré, interface à venir) | Valider (option prudente) |
| Q55 | Vraie puissance d'une flotte leurrée : Recalculée à chaque lecture sur la fiche actuelle de l'attaquant, rien n'est stocké dans la flotte | Phalange et porte de saut (serveur livré, interface à venir) | Valider (option prudente) |
| Q44 | Pitié « farmable » : un allié peut attaquer 20 fois avec un seul vaisseau pour garantir une lune. Exiger un seuil ? : Pas de seuil (la proposition vise aussi les petits pillages) | Phalange, porte de saut ou pitié lunaire (moteur livré, serveur à venir) | Valider (option prudente) |
| Q45 | Notifier la progression de la pitié à chaque combat ? : Non : le texte s'affiche sur l'écran Lune (É30-1c), pas de notification | Phalange, porte de saut ou pitié lunaire (moteur livré, serveur à venir) | Valider (option prudente) |
| Q46 | Missions que la porte peut rapatrier : réglables librement ? : Intersection du réglage et d'une liste sûre (patrouille, garnison, base avancée) ; jamais attaque, transport ou cargaison | Phalange, porte de saut ou pitié lunaire (moteur livré, serveur à venir) | Valider (option prudente) |
| Q47 | Plancher de recharge de la porte (6 h) : avant ou après les réductions d'effets ? : Après : la recharge ne descend jamais sous 6 h | Phalange, porte de saut ou pitié lunaire (moteur livré, serveur à venir) | Valider (option prudente) |
| Q48 | Puissance d'une flotte leurrée une fois percée : qui la calcule ? : Le serveur la fournit ; sinon `threatEstimate` la recalcule avec les niveaux du défenseur (stimulant compris) | Phalange, porte de saut ou pitié lunaire (moteur livré, serveur à venir) | Valider (option prudente) |
| Q49 | Qui est un « agresseur » balayable ? : Un joueur dont une flotte d'attaque vient vers toi ou un allié couvert (départs programmés compris) ; le rapport compte ses vaisseaux d'attaque à quai | Phalange, porte de saut ou pitié lunaire (moteur livré, serveur à venir) | Valider (option prudente) |

## 3. Récit

| Q | Décision appliquée | Recommandation |
|:--|:--|:--|

## 4. Outillage et méthode (peu d'enjeu, valider d'office)

| Q | Décision | Recommandation |
|:--|:--|:--|
